/**
 * BookingCard / BookingActions behaviour: which admin actions show for which
 * booking, the resolve-dispute flow, and the refund hand-off that follows it.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

vi.mock('../services/bookingsApi', () => ({
  forceCompleteBooking: vi.fn(),
  resolveDispute: vi.fn(),
}));

import { resolveDispute } from '../services/bookingsApi';
import BookingCard from '../components/Cards/BookingCard.jsx';

const base = {
  id: 42,
  customer: 'Asha',
  phone: '9999999999',
  vendor: 'Speedy Motors',
  service: 'Oil change',
  slot: '2026-10-20 14:00',
  amount: '24206.70000000000012',
  fee: '120.5',
};

const paid = { id: 312, status: 'success', amount: '24206.7' };

const renderCard = (booking, props = {}) =>
  render(<BookingCard booking={booking} onClose={vi.fn()} onChanged={vi.fn()} {...props} />);

const forceBtn = () => screen.queryByRole('button', { name: /force complete/i });
const refundBtn = () => screen.queryByRole('button', { name: /refund (this booking|payment)/i });

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.setItem('adminToken', 'tok');
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.stubGlobal('fetch', vi.fn());
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('BookingCard', () => {
  it('formats a string Decimal amount instead of leaking float digits', () => {
    renderCard({ ...base, status: 'confirmed' });
    expect(screen.getByText('₹24,206.7')).toBeInTheDocument();
    expect(screen.queryByText(/0000000/)).not.toBeInTheDocument();
  });

  it.each(['cancelled', 'canceled', 'refunded', 'rejected', 'user_confirmed', 'completed'])(
    'hides Force Complete for %s bookings',
    (status) => {
      renderCard({ ...base, status });
      expect(forceBtn()).not.toBeInTheDocument();
    },
  );

  it('hides Force Complete when the payment was already refunded', () => {
    renderCard({ ...base, status: 'confirmed', payment: { ...paid, status: 'refunded' } });
    expect(forceBtn()).not.toBeInTheDocument();
    expect(refundBtn()).not.toBeInTheDocument();
  });

  it('offers Force Complete and Refund on a paid in-progress booking', () => {
    renderCard({ ...base, status: 'in_progress', payment: paid });
    expect(forceBtn()).toBeInTheDocument();
    expect(refundBtn()).toBeInTheDocument();
  });

  it('offers no refund without a successful payment', () => {
    renderCard({ ...base, status: 'confirmed', payment: { ...paid, status: 'pending' } });
    expect(refundBtn()).not.toBeInTheDocument();
  });

  it('shows the vendor reject reason and the dispute details', () => {
    renderCard({
      ...base,
      status: 'disputed',
      dispute_reason: 'Engine light still on',
      disputed_at: '2026-10-19T10:00:00.000Z',
      vendor_reject_reason: 'Fully booked',
    });
    expect(screen.getByText('Engine light still on')).toBeInTheDocument();
    expect(screen.getByText('Fully booked')).toBeInTheDocument();
  });

  it('resolves a dispute with a confirmed reason, then offers a pre-filled refund', async () => {
    // delay: null — this test types ~33 characters; with the default delay
    // each keystroke awaits a setTimeout, which under load pushed it past the
    // 5 s test timeout (flaky). Same events, just no timer hop per key.
    const user = userEvent.setup({ delay: null });
    const onChanged = vi.fn();
    resolveDispute.mockResolvedValue({ booking: { id: 42, status: 'cancelled' } });
    renderCard({ ...base, status: 'disputed', payment: paid }, { onChanged });

    await user.click(screen.getByRole('button', { name: /resolve dispute/i }));
    const dialog = screen.getByRole('dialog');
    const continueBtn = within(dialog).getByRole('button', { name: /continue/i });
    await user.type(within(dialog).getByLabelText(/reason/i), 'too short');
    expect(continueBtn).toBeDisabled();

    await user.type(within(dialog).getByLabelText(/reason/i), ' - vendor never fixed it');
    await user.click(continueBtn);
    // Confirmation step: nothing has been sent yet.
    expect(resolveDispute).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: /cancel booking & resolve/i }));

    expect(resolveDispute).toHaveBeenCalledWith(42, 'too short - vendor never fixed it');
    expect(onChanged).toHaveBeenCalled();
    expect(screen.getByText('Cancelled')).toBeInTheDocument();
    expect(forceBtn()).not.toBeInTheDocument();
    expect(screen.getByText(/has NOT been refunded yet/)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /refund payment/i }));
    const refundDialog = screen.getByRole('dialog', { name: /issue refund/i });
    expect(within(refundDialog).getByDisplayValue('312')).toHaveAttribute('readonly');

    fetch.mockResolvedValue({ ok: true, status: 200, json: async () => ({ success: true, message: 'Refund processed' }) });
    await user.click(within(refundDialog).getByRole('button', { name: /^refund$/i }));

    const [url, init] = fetch.mock.calls[0];
    expect(String(url)).toContain('/admin/finance/payments/312/refund');
    expect(JSON.parse(init.body)).toMatchObject({ idempotencyKey: expect.stringContaining('admin-refund-312') });
    expect(within(refundDialog).getByText('Refund processed')).toBeInTheDocument();
  });
});

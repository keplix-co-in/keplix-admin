/**
 * PayoutQueue — security review 2026-10-28 A-004: a single row's "Pay Now"
 * must not move money on one click. It opens a ConfirmDialog naming the
 * vendor and amount, and only the confirm button sends the settle request.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PayoutQueue from '../components/views/finance/PayoutQueue.jsx';

const json = (body, ok = true, status = 200) => ({ ok, status, json: async () => body });

const queue = [
  {
    id: 'BK-101',
    paymentId: 55,
    vendor: 'Shine Garage',
    booking: 'Car wash',
    city: 'Pune',
    amount: '900.00',
    hoursLeft: 12,
    status: 'normal',
    payoutReady: true,
  },
];

beforeEach(() => {
  localStorage.setItem('adminToken', 'tok');
  // M-3: these actions are only shown to super_admin.
  localStorage.setItem('adminUser', JSON.stringify({ id: 1, role: 'super_admin' }));
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(json({ success: true })));
});

describe('PayoutQueue single Pay Now (A-004)', () => {
  it('opens a confirm dialog with vendor and amount and sends nothing yet', async () => {
    render(<PayoutQueue queue={queue} loading={false} error={null} />);
    await userEvent.click(screen.getByRole('button', { name: 'Pay Now' }));

    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByText(/Shine Garage/)).toBeInTheDocument();
    expect(within(dialog).getByText(/Pay ₹900 to Shine Garage/)).toBeInTheDocument();
    expect(fetch).not.toHaveBeenCalled();
  });

  it('cancel closes the dialog without settling', async () => {
    render(<PayoutQueue queue={queue} loading={false} error={null} />);
    await userEvent.click(screen.getByRole('button', { name: 'Pay Now' }));
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(fetch).not.toHaveBeenCalled();
  });

  it('confirm settles that payout once and refreshes the queue', async () => {
    const onChanged = vi.fn();
    render(<PayoutQueue queue={queue} loading={false} error={null} onChanged={onChanged} />);
    await userEvent.click(screen.getByRole('button', { name: 'Pay Now' }));
    await userEvent.click(
      within(screen.getByRole('dialog')).getByRole('button', { name: /Pay ₹900/ })
    );

    expect(fetch).toHaveBeenCalledTimes(1);
    const [url, options] = fetch.mock.calls[0];
    expect(url).toMatch(/\/admin\/finance\/payouts\/55\/settle$/);
    expect(options.method).toBe('POST');
    expect(onChanged).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('a double confirm while the settle is in flight sends only one request', async () => {
    let resolveFetch;
    fetch.mockImplementationOnce(() => new Promise((r) => { resolveFetch = r; }));
    render(<PayoutQueue queue={queue} loading={false} error={null} />);
    await userEvent.click(screen.getByRole('button', { name: 'Pay Now' }));
    const confirmBtn = within(screen.getByRole('dialog')).getByRole('button', { name: /Pay ₹900/ });

    fireEvent.click(confirmBtn);
    fireEvent.click(confirmBtn);
    expect(fetch).toHaveBeenCalledTimes(1);

    await act(async () => { resolveFetch(json({ success: true })); });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('a failed settle surfaces the error and closes the dialog so it can be retried', async () => {
    fetch.mockResolvedValueOnce(json({ message: 'Vendor has no fund account' }, false, 400));
    const onChanged = vi.fn();
    render(<PayoutQueue queue={queue} loading={false} error={null} onChanged={onChanged} />);
    await userEvent.click(screen.getByRole('button', { name: 'Pay Now' }));
    await userEvent.click(
      within(screen.getByRole('dialog')).getByRole('button', { name: /Pay ₹900/ })
    );

    expect(onChanged).not.toHaveBeenCalled();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    // Pay Now is usable again (in-flight guard released).
    await userEvent.click(screen.getByRole('button', { name: 'Pay Now' }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });
});

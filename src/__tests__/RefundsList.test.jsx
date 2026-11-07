/**
 * RefundsList (2026-11-03): the admin Refunds heading. Rows of every kind,
 * a Refund button only where money is still owed, and filter chips that
 * ask the backend for that group.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import RefundsList from '../components/views/finance/RefundsList.jsx';

const json = (body, ok = true, status = 200) => ({ ok, status, json: async () => body });

const items = [
  { kind: 'needs_refund', group: 'needs_refund', refundId: null, paymentId: 5, amount: 1000, bookingId: 1760, service: 'Car wash', customer: { email: 'c@example.com' }, vendor: { name: 'Shine' } },
  { kind: 'refund', group: 'refunded', refundId: 1, paymentId: 6, amount: 200, bookingId: 1761, fromDashboard: true, customer: { email: 'd@example.com' }, vendor: { name: 'Shine' } },
  { kind: 'refund', group: 'failed', refundId: 2, paymentId: 7, amount: 300, bookingId: 1762, lastError: 'insufficient balance', vendorPayoutStatus: 'paid' },
];

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.setItem('adminToken', 'tok');
  // M-3: these actions are only shown to super_admin.
  localStorage.setItem('adminUser', JSON.stringify({ id: 1, role: 'super_admin' }));
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(json({ group: 'all', items })));
});

describe('RefundsList', () => {
  it('lists every kind, with Refund only on owed or failed rows', async () => {
    render(<RefundsList />);
    expect(await screen.findByText('NEEDS REFUND')).toBeInTheDocument();
    expect(screen.getByText('REFUNDED')).toBeInTheDocument();
    expect(screen.getByText('FAILED')).toBeInTheDocument();
    expect(screen.getByText('Made in Razorpay')).toBeInTheDocument();
    expect(screen.getByText('insufficient balance')).toBeInTheDocument();
    expect(screen.getByText(/Vendor already paid/)).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Refund' })).toHaveLength(2);
  });

  it('a filter chip asks the backend for that group', async () => {
    render(<RefundsList />);
    await screen.findByText('NEEDS REFUND');
    await userEvent.click(screen.getByRole('button', { name: 'Failed' }));
    expect(fetch.mock.calls.at(-1)[0]).toMatch(/\/admin\/finance\/refunds\?status=failed$/);
  });

  it('shows an empty state and an error state', async () => {
    fetch.mockResolvedValueOnce(json({ items: [] }));
    const { unmount } = render(<RefundsList />);
    expect(await screen.findByText('No refunds here')).toBeInTheDocument();
    unmount();

    fetch.mockResolvedValueOnce(json({}, false, 500));
    render(<RefundsList />);
    expect(await screen.findByText(/Server returned 500/)).toBeInTheDocument();
  });

  it('Refund opens the modal with that payment', async () => {
    render(<RefundsList />);
    await screen.findByText('NEEDS REFUND');
    await userEvent.click(screen.getAllByRole('button', { name: 'Refund' })[0]);
    expect(await screen.findByDisplayValue('5')).toBeInTheDocument();
  });
});

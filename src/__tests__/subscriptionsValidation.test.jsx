import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SubscriptionsView from '../components/views/SubscriptionsView.jsx';
import { ToastProvider } from '../components/ui/toast.jsx';
import {
  getSubscriptionPlans, updateSubscriptionPlan, getSubscriptionVendors,
  extendSubscription, getSubscriptionPayments,
} from '../services/subscriptionsApi.js';

vi.mock('../services/supabaseClient.js', () => ({
  supabase: { auth: { onAuthStateChange: vi.fn(), signOut: vi.fn(), refreshSession: vi.fn() } },
}));
vi.mock('../services/subscriptionsApi.js', () => ({
  getSubscriptionPlans: vi.fn(),
  updateSubscriptionPlan: vi.fn(),
  getSubscriptionVendors: vi.fn(),
  extendSubscription: vi.fn(),
  getSubscriptionPayments: vi.fn(),
}));

const plans = [
  { code: 'gold', name: 'Gold', monthly_price: 999, yearly_price: 9990, features: ['A'], is_active: true },
];
// Field names exactly as keplix-backend/controllers/Admin/subscriptionController.js returns them.
const backendVendor = {
  vendor_id: 7, vendor_name: 'Raj Motors', email: 'r@x.in', plan_code: 'gold', period: 'monthly',
  status: 'grace', ends_at: '2026-12-01T00:00:00.000Z',
};
const asRole = (role) => localStorage.setItem('adminUser', JSON.stringify({ id: 1, role }));
const renderView = () => render(<ToastProvider><SubscriptionsView /></ToastProvider>);

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  localStorage.setItem('adminToken', 'tok');
  getSubscriptionPlans.mockResolvedValue(plans);
  getSubscriptionVendors.mockResolvedValue([backendVendor]);
  getSubscriptionPayments.mockResolvedValue([]);
});

const setField = async (el, value) => {
  await userEvent.clear(el);
  if (value !== '') await userEvent.type(el, value);
};
const save = async () => userEvent.click(await screen.findByRole('button', { name: 'Save Gold' }));

describe('Plan price validation', () => {
  it.each([['negative', '-5'], ['empty (non-number)', '']])('rejects %s monthly price', async (_n, v) => {
    asRole('super_admin');
    renderView();
    await setField(await screen.findByLabelText(/Monthly price/), v);
    await save();
    expect(await screen.findByText('Prices must be 0 or more.')).toBeInTheDocument();
    expect(updateSubscriptionPlan).not.toHaveBeenCalled();
  });

  it('rejects a negative yearly price', async () => {
    asRole('super_admin');
    renderView();
    await setField(await screen.findByLabelText(/Yearly price/), '-1');
    await save();
    expect(updateSubscriptionPlan).not.toHaveBeenCalled();
  });

  it('letters in the number box never reach the API', async () => {
    asRole('super_admin');
    renderView();
    await setField(await screen.findByLabelText(/Monthly price/), 'abc');
    await save();
    expect(updateSubscriptionPlan).not.toHaveBeenCalled();
  });

  it('allows zero (contract: prices >= 0)', async () => {
    asRole('super_admin');
    updateSubscriptionPlan.mockResolvedValue({});
    renderView();
    await setField(await screen.findByLabelText(/Monthly price/), '0');
    await save();
    await waitFor(() => expect(updateSubscriptionPlan).toHaveBeenCalledWith('gold', expect.objectContaining({ monthly_price: 0 })));
  });

  it('rejects more than 10 features', async () => {
    asRole('super_admin');
    renderView();
    const box = await screen.findByLabelText(/Features/);
    await userEvent.clear(box);
    await userEvent.type(box, Array.from({ length: 11 }, (_, i) => `f${i}`).join('{Enter}'));
    await save();
    expect(await screen.findByText('At most 10 features.')).toBeInTheDocument();
    expect(updateSubscriptionPlan).not.toHaveBeenCalled();
  });

  it('shows the backend message when save fails', async () => {
    asRole('super_admin');
    updateSubscriptionPlan.mockRejectedValue(new Error('Plan not found'));
    renderView();
    await save();
    expect(await screen.findByText('Plan not found')).toBeInTheDocument();
  });

  it('empty plan list shows the empty state', async () => {
    asRole('super_admin');
    getSubscriptionPlans.mockResolvedValue([]);
    renderView();
    expect(await screen.findByText('No plans yet')).toBeInTheDocument();
  });
});

describe('Extend validation and states', () => {
  const openExtend = async () => {
    asRole('super_admin');
    renderView();
    await userEvent.click(await screen.findByRole('tab', { name: 'Vendors' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Extend' }));
  };
  const submit = () => userEvent.click(screen.getAllByRole('button', { name: 'Extend' }).pop());

  it('reads the backend row shape (vendor_id / vendor_name / plan_code)', async () => {
    await openExtend();
    await userEvent.type(screen.getByLabelText('Reason'), 'goodwill');
    await submit();
    await waitFor(() => expect(extendSubscription).toHaveBeenCalledWith(7, { days: 30, reason: 'goodwill' }));
  });

  it.each(['0', '731', '1.5', '-3'])('rejects days = %s', async (d) => {
    await openExtend();
    await setField(screen.getByLabelText(/Days/), d);
    await userEvent.type(screen.getByLabelText('Reason'), 'goodwill');
    await submit();
    expect(extendSubscription).not.toHaveBeenCalled();
  });

  it('rejects a reason over 300 characters', async () => {
    await openExtend();
    await userEvent.click(screen.getByLabelText('Reason'));
    await userEvent.paste('x'.repeat(301));
    await submit();
    expect(extendSubscription).not.toHaveBeenCalled();
  });

  it('API error keeps the dialog open and shows the message', async () => {
    extendSubscription.mockRejectedValue(new Error('Vendor not found'));
    await openExtend();
    await userEvent.type(screen.getByLabelText('Reason'), 'goodwill');
    await submit();
    expect(await screen.findByText('Vendor not found')).toBeInTheDocument();
    expect(screen.getByLabelText('Reason')).toBeInTheDocument();
  });

  it('double click sends one request', async () => {
    extendSubscription.mockImplementation(() => new Promise(() => {}));
    await openExtend();
    await userEvent.type(screen.getByLabelText('Reason'), 'goodwill');
    await submit();
    await submit();
    expect(extendSubscription).toHaveBeenCalledTimes(1);
  });

  it('empty vendor list shows the empty state', async () => {
    asRole('admin');
    getSubscriptionVendors.mockResolvedValue([]);
    renderView();
    await userEvent.click(await screen.findByRole('tab', { name: 'Vendors' }));
    expect(await screen.findByText(/No garages in this status/)).toBeInTheDocument();
  });

  it('vendor list error shows an alert', async () => {
    asRole('admin');
    getSubscriptionVendors.mockRejectedValue(new Error('Failed to fetch subscriptions: 500'));
    renderView();
    await userEvent.click(await screen.findByRole('tab', { name: 'Vendors' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('500');
  });
});

describe('Payments tab with backend row shape', () => {
  it('renders vendor_name and amount', async () => {
    asRole('admin');
    getSubscriptionPayments.mockResolvedValue([
      { id: 1, vendor_id: 7, vendor_name: 'Raj Motors', plan_code: 'gold', period: 'yearly', amount: 9990, status: 'paid',
        razorpay_order_id: 'o', razorpay_payment_id: 'p', paid_at: '2026-11-01T00:00:00Z', created_at: '2026-11-01T00:00:00Z' },
    ]);
    renderView();
    await userEvent.click(await screen.findByRole('tab', { name: 'Payments' }));
    expect(await screen.findByText('Raj Motors')).toBeInTheDocument();
    expect(screen.getByText('₹9,990')).toBeInTheDocument();
  });

  it('error state', async () => {
    asRole('admin');
    getSubscriptionPayments.mockRejectedValue(new Error('Could not load payments'));
    renderView();
    await userEvent.click(await screen.findByRole('tab', { name: 'Payments' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Could not load payments');
  });
});

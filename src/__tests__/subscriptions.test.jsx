import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SubscriptionsView from '../components/views/SubscriptionsView.jsx';
import { ToastProvider } from '../components/ui/toast.jsx';
import {
  getSubscriptionPlans, updateSubscriptionPlan, getSubscriptionVendors,
  extendSubscription, getSubscriptionPayments,
} from '../services/subscriptionsApi.js';
import { authFetch } from '../services/authApi.js';

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
  { code: 'gold', name: 'Gold', monthly_price: 999, yearly_price: 9990, features: ['A', 'B'], is_active: true },
];
const asRole = (role) => localStorage.setItem('adminUser', JSON.stringify({ id: 1, role }));
const renderView = () => render(<ToastProvider><SubscriptionsView /></ToastProvider>);

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  localStorage.setItem('adminToken', 'tok');
  getSubscriptionPlans.mockResolvedValue(plans);
  getSubscriptionVendors.mockResolvedValue([
    { vendorId: 7, vendor_name: 'Raj Motors', plan_code: 'gold', status: 'grace', ends_at: '2026-12-01T00:00:00Z' },
  ]);
  getSubscriptionPayments.mockResolvedValue([
    { id: 1, vendorId: 7, vendor_name: 'Raj Motors', plan_code: 'gold', period: 'monthly', amount: 999, status: 'paid', paid_at: '2026-11-01T00:00:00Z' },
  ]);
});

describe('Plans tab', () => {
  it('lets super_admin edit and save a plan', async () => {
    asRole('super_admin');
    updateSubscriptionPlan.mockResolvedValue({});
    renderView();
    const monthly = await screen.findByLabelText(/Monthly price/);
    await userEvent.clear(monthly);
    await userEvent.type(monthly, '1099');
    await userEvent.click(screen.getByRole('button', { name: 'Save Gold' }));
    await waitFor(() =>
      expect(updateSubscriptionPlan).toHaveBeenCalledWith('gold', {
        monthly_price: 1099, yearly_price: 9990, features: ['A', 'B'], is_active: true,
      }));
  });

  it('is read-only for a regular admin', async () => {
    asRole('admin');
    renderView();
    expect(await screen.findByLabelText(/Monthly price/)).toBeDisabled();
    expect(screen.queryByRole('button', { name: 'Save Gold' })).not.toBeInTheDocument();
    expect(screen.getByRole('note')).toHaveTextContent(/super admin/i);
  });

  it('shows an error with retry', async () => {
    asRole('admin');
    getSubscriptionPlans.mockRejectedValueOnce(new Error('boom'));
    renderView();
    expect(await screen.findByRole('alert')).toHaveTextContent('boom');
  });
});

describe('Vendors tab', () => {
  it('filters by status and extends (super_admin)', async () => {
    asRole('super_admin');
    extendSubscription.mockResolvedValue({});
    renderView();
    await userEvent.click(await screen.findByRole('tab', { name: 'Vendors' }));
    expect(await screen.findByText('Raj Motors')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Expired' }));
    await waitFor(() => expect(getSubscriptionVendors).toHaveBeenLastCalledWith({ status: 'expired' }));

    await userEvent.click(await screen.findByRole('button', { name: 'Extend' }));
    await userEvent.type(screen.getByLabelText('Reason'), 'goodwill');
    await userEvent.click(screen.getAllByRole('button', { name: 'Extend' }).pop());
    await waitFor(() => expect(extendSubscription).toHaveBeenCalledWith(7, { days: 30, reason: 'goodwill' }));
  });

  it('requires a reason', async () => {
    asRole('super_admin');
    renderView();
    await userEvent.click(await screen.findByRole('tab', { name: 'Vendors' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Extend' }));
    await userEvent.click(screen.getAllByRole('button', { name: 'Extend' }).pop());
    expect(extendSubscription).not.toHaveBeenCalled();
  });

  it('rejects a reason shorter than 3 characters', async () => {
    // Backend requires reason 3-300 chars (SUBSCRIPTIONS_API.md, admin extend).
    asRole('super_admin');
    renderView();
    await userEvent.click(await screen.findByRole('tab', { name: 'Vendors' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Extend' }));
    await userEvent.type(screen.getByLabelText('Reason'), 'ok');
    await userEvent.click(screen.getAllByRole('button', { name: 'Extend' }).pop());
    expect(extendSubscription).not.toHaveBeenCalled();
  });

  it('hides Extend for a regular admin', async () => {
    asRole('admin');
    renderView();
    await userEvent.click(await screen.findByRole('tab', { name: 'Vendors' }));
    await screen.findByText('Raj Motors');
    expect(screen.queryByRole('button', { name: 'Extend' })).not.toBeInTheDocument();
  });
});

describe('Payments tab', () => {
  it('lists subscription payments', async () => {
    asRole('admin');
    renderView();
    await userEvent.click(await screen.findByRole('tab', { name: 'Payments' }));
    expect(await screen.findByText('₹999')).toBeInTheDocument();
  });

  it('shows empty state', async () => {
    asRole('admin');
    getSubscriptionPayments.mockResolvedValue([]);
    renderView();
    await userEvent.click(await screen.findByRole('tab', { name: 'Payments' }));
    expect(await screen.findByText(/No subscription payments/)).toBeInTheDocument();
  });
});

describe('subscriptionsApi service', () => {
  it('hits the admin endpoints with the right verbs', async () => {
    const real = await vi.importActual('../services/subscriptionsApi.js');
    const spy = vi.spyOn(globalThis, 'fetch').mockImplementation(async () =>
      new Response(JSON.stringify({ plans: [] }), { status: 200 }));
    await real.getSubscriptionVendors({ status: 'trial' });
    expect(String(spy.mock.calls[0][0])).toMatch(/\/admin\/subscriptions\/vendors\?status=trial$/);
    await real.extendSubscription(3, { days: 5, reason: 'x' });
    const [url, opts] = spy.mock.calls[1];
    expect(String(url)).toMatch(/\/vendors\/3\/extend$/);
    expect(opts.method).toBe('POST');
    expect(JSON.parse(opts.body)).toEqual({ days: 5, reason: 'x' });
    await real.updateSubscriptionPlan('gold', { is_active: false });
    expect(spy.mock.calls[2][1].method).toBe('PUT');
    spy.mockRestore();
  });

  it('throws the backend error message', async () => {
    const real = await vi.importActual('../services/subscriptionsApi.js');
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ error: { message: 'nope' } }), { status: 403 }));
    await expect(real.getSubscriptionPlans()).rejects.toThrow('nope');
    vi.restoreAllMocks();
    expect(authFetch).toBeDefined();
  });
});

describe('Vendors tab filter race', () => {
  it('ignores a slow earlier response after the filter changes', async () => {
    asRole('super_admin');
    let slow;
    getSubscriptionVendors
      .mockImplementationOnce(() => new Promise((r) => { slow = r; })) // "All", slow
      .mockResolvedValueOnce([{ vendorId: 9, vendor_name: 'Fresh Garage', plan_code: 'gold', status: 'active', ends_at: null }]);
    renderView();
    await userEvent.click(await screen.findByRole('tab', { name: 'Vendors' }));
    await userEvent.click(screen.getByRole('button', { name: 'Active' }));
    await screen.findByText('Fresh Garage');
    slow([{ vendorId: 1, vendor_name: 'Stale Garage', plan_code: 'gold', status: 'trial', ends_at: null }]);
    await new Promise((r) => setTimeout(r, 20));
    expect(screen.queryByText('Stale Garage')).toBeNull();
    expect(screen.getByText('Fresh Garage')).toBeInTheDocument();
  });
});

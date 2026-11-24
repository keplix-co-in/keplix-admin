/**
 * Vendor approval: super_admin sees an Approve button on pending vendors;
 * confirming calls PATCH /admin/vendors/:id/status via setVendorStatus.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

vi.mock('../services/supabaseClient.js', () => ({
  supabase: { auth: { onAuthStateChange: vi.fn(), signOut: vi.fn(), refreshSession: vi.fn() } },
}));
vi.mock('../services/vendorsApi', () => ({
  getVendors: vi.fn(),
  getVendorMetrics: vi.fn(),
  setVendorStatus: vi.fn(),
  getVendorDetail: vi.fn(),
}));

import VendorsView from '../components/views/VendorsView.jsx';
import { ToastProvider } from '../components/ui/toast.jsx';
import { getVendors, setVendorStatus, getVendorDetail } from '../services/vendorsApi';

const pending = [{ id: 7, vendor: 'Raj Motors', status: 'pending', city: 'Pune' }];
const asRole = (role) => localStorage.setItem('adminUser', JSON.stringify({ id: 1, role }));
const view = () => render(<ToastProvider><VendorsView filter="All" setFilter={() => {}} /></ToastProvider>);

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  localStorage.setItem('adminToken', 'tok');
  getVendors.mockResolvedValue(pending);
  setVendorStatus.mockResolvedValue({});
  getVendorDetail.mockResolvedValue(detail());
});

const detail = (over = {}) => ({
  account: { name: 'Raj', email: 'r@x.in', phone: '99', emailVerified: true },
  business: { name: 'Raj Motors', city: 'Pune', hasGst: false },
  bank: { accountNumber: '****7890' },
  documents: [{ id: 1, type: 'pan_card', status: 'pending', url: 'https://img/1.jpg' }],
  servicesCount: 2, status: 'pending', onboarding: { complete: true, missing: [] }, ...over,
});

describe('vendor review + approval', () => {
  it('lets a regular admin view details but not decide', async () => {
    asRole('admin');
    view();
    await userEvent.click(await screen.findByRole('button', { name: 'Review Raj Motors' }));
    await screen.findByText('****7890');
    expect(screen.queryByRole('button', { name: 'Approve' })).not.toBeInTheDocument();
  });

  it('keeps Approve disabled until every checklist item is ticked, then approves', async () => {
    asRole('super_admin');
    view();
    await userEvent.click(await screen.findByRole('button', { name: 'Review Raj Motors' }));
    const approve = await screen.findByRole('button', { name: 'Approve' });
    expect(approve).toBeDisabled();
    expect(screen.getByRole('link', { name: /pan_card/ })).toHaveAttribute('href', 'https://img/1.jpg');
    for (const box of screen.getAllByRole('checkbox')) await userEvent.click(box);
    expect(approve).toBeEnabled();
    await userEvent.click(approve);
    await waitFor(() => expect(setVendorStatus).toHaveBeenCalledWith('7', 'approved', undefined));
  });

  it('disables Approve and lists missing fields when onboarding is incomplete', async () => {
    asRole('super_admin');
    getVendorDetail.mockResolvedValue(detail({ onboarding: { complete: false, missing: ['city'] } }));
    view();
    await userEvent.click(await screen.findByRole('button', { name: 'Review Raj Motors' }));
    await screen.findByText(/Missing: city/);
    for (const box of screen.getAllByRole('checkbox')) await userEvent.click(box);
    expect(screen.getByRole('button', { name: 'Approve' })).toBeDisabled();
  });

  it('reject needs a reason', async () => {
    asRole('super_admin');
    view();
    await userEvent.click(await screen.findByRole('button', { name: 'Review Raj Motors' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Reject' }));
    const confirm = screen.getByRole('button', { name: 'Confirm reject' });
    expect(confirm).toBeDisabled();
    await userEvent.type(screen.getByLabelText(/Rejection reason/), 'Blurry PAN');
    await userEvent.click(confirm);
    await waitFor(() => expect(setVendorStatus).toHaveBeenCalledWith('7', 'rejected', 'Blurry PAN'));
  });
});

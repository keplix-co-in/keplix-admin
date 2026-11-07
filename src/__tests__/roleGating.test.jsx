/**
 * M-3 (2026-11-07): super_admin-only actions are hidden/disabled for other
 * admin roles. UI only — the backend's authorizeSuperAdmin is the real check.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import PayoutQueue from '../components/views/finance/PayoutQueue.jsx';
import SettingsView from '../components/views/SettingsView.jsx';
import userEvent from '@testing-library/user-event';

vi.mock('../services/supabaseClient.js', () => ({
  supabase: { auth: { onAuthStateChange: vi.fn(), signOut: vi.fn(), refreshSession: vi.fn() } },
}));
vi.mock('../services/platformSettingsApi', () => ({
  getPlatformSettings: vi.fn().mockResolvedValue({}),
  updatePlatformSettings: vi.fn(),
}));

const queue = [
  { id: 'BK-1', paymentId: 5, vendor: 'V', booking: 'B', city: 'C', amount: '10', hoursLeft: 12, status: 'normal', payoutReady: true },
];
const asRole = (role) => localStorage.setItem('adminUser', JSON.stringify({ id: 1, role }));

beforeEach(() => {
  localStorage.clear();
  localStorage.setItem('adminToken', 'tok');
  vi.stubGlobal('fetch', vi.fn());
});

describe('PayoutQueue role gating', () => {
  it('disables Pay Now and Initiate All for a regular admin', () => {
    asRole('admin');
    render(<PayoutQueue queue={queue} loading={false} error={null} />);
    expect(screen.getByRole('button', { name: 'Pay Now' })).toBeDisabled();
    expect(screen.getByRole('button', { name: /Initiate All/ })).toBeDisabled();
  });

  it('enables them for super_admin', () => {
    asRole('super_admin');
    render(<PayoutQueue queue={queue} loading={false} error={null} />);
    expect(screen.getByRole('button', { name: 'Pay Now' })).toBeEnabled();
    expect(screen.getByRole('button', { name: /Initiate All/ })).toBeEnabled();
  });
});

describe('Settings role gating', () => {
  it('shows a notice instead of the commission form for a regular admin', async () => {
    asRole('admin');
    render(<SettingsView />);
    await userEvent.click(screen.getByRole('button', { name: /Commission/ }));
    expect(screen.getByRole('note')).toHaveTextContent(/super admin/i);
  });

  it('renders the form for super_admin', async () => {
    asRole('super_admin');
    render(<SettingsView />);
    await userEvent.click(screen.getByRole('button', { name: /Commission/ }));
    expect(screen.queryByRole('note')).not.toBeInTheDocument();
  });
});

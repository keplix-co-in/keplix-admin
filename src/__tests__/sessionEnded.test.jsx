/**
 * SESSION_EXPIRED / SIGNED_OUT must drop the admin to the Login screen
 * (2026-11-07). Heavy views are stubbed; only the auth wiring is under test.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from '../pages/App.jsx';
import { SESSION_ENDED_EVENT } from '../services/authApi.js';

vi.mock('../services/supabaseClient.js', () => ({
  supabase: { auth: { onAuthStateChange: vi.fn(), signOut: vi.fn(), refreshSession: vi.fn().mockResolvedValue({ data: { session: null } }) } },
}));
vi.mock('../components/views/DashboardView', () => ({ default: () => <div>DASHBOARD</div> }));
vi.mock('../components/layout/Topbar', () => ({ Topbar: () => null }));
vi.mock('../pages/Login', () => ({ default: () => <div>LOGIN SCREEN</div> }));

const jwt = (exp) => `x.${btoa(JSON.stringify({ exp }))}.y`;

beforeEach(() => {
  localStorage.clear();
  localStorage.setItem('adminToken', jwt(Math.floor(Date.now() / 1000) + 3600));
  localStorage.setItem('adminUser', JSON.stringify({ id: 1, role: 'admin' }));
});

describe('session ended', () => {
  it('SESSION_EXPIRED event sends the admin to Login', async () => {
    render(<MemoryRouter initialEntries={['/dashboard']}><App /></MemoryRouter>);
    expect(screen.getByText('DASHBOARD')).toBeInTheDocument();
    // authApi clears storage before announcing; mirror that.
    localStorage.clear();
    act(() => { window.dispatchEvent(new Event(SESSION_ENDED_EVENT)); });
    expect(screen.getByText('LOGIN SCREEN')).toBeInTheDocument();
  }, 30000);
});

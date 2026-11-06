/**
 * Security review 2026-10-28 O-003: the login form used to console.log the
 * admin's email (and a success trace); it must not log identities any more.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

vi.mock('../services/authApi', () => ({
  adminLogin: vi.fn(),
}));

import { adminLogin } from '../services/authApi';
import Login from '../pages/Login.jsx';

const EMAIL = 'boss@keplix.example';

let logSpy;
let errorSpy;
beforeEach(() => {
  logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => {
  logSpy.mockRestore();
  errorSpy.mockRestore();
});

async function submit() {
  // delay: null — type without a setTimeout between keystrokes. With the
  // default (delay: 0) every character awaits a macrotask, which under a
  // loaded machine (parallel vitest workers on Windows) stretched this test
  // past the 5 s timeout and made it flaky. Same events, no timer hops.
  const user = userEvent.setup({ delay: null });
  const [emailInput] = screen.getAllByRole('textbox');
  await user.type(emailInput, EMAIL);
  const password = document.querySelector('input[type="password"]');
  await user.type(password, 'pw');
  await user.click(screen.getByRole('button', { name: /sign in|log in|login/i }));
}

const loggedEmail = (spy) =>
  spy.mock.calls.some((args) => args.some((a) => String(a?.message ?? a).includes(EMAIL)));

describe('Login logging (O-003)', () => {
  it('does not log the email on a successful login', async () => {
    adminLogin.mockResolvedValue({ user: { id: 1, email: EMAIL } });
    const onLogin = vi.fn();
    render(<Login onLogin={onLogin} />);
    await submit();

    expect(onLogin).toHaveBeenCalledWith({ id: 1, email: EMAIL });
    expect(logSpy).not.toHaveBeenCalled();
    expect(loggedEmail(errorSpy)).toBe(false);
  });

  it('does not log the email or the error object on a failed login', async () => {
    adminLogin.mockRejectedValue(new Error('Invalid credentials'));
    render(<Login onLogin={vi.fn()} />);
    await submit();

    expect(await screen.findByText('Invalid credentials')).toBeInTheDocument();
    expect(logSpy).not.toHaveBeenCalled();
    expect(loggedEmail(errorSpy)).toBe(false);
    for (const args of errorSpy.mock.calls) {
      for (const a of args) expect(a).not.toBeInstanceOf(Error);
    }
  });
});

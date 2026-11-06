/**
 * Security review 2026-10-28 A-003 (owner decision 2026-11-05): the admin
 * has no MFA, so the dead "Enable 2FA" button was removed rather than left
 * implying a protection that doesn't exist.
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import SecurityTab from '../components/views/settings/SecurityTab.jsx';

describe('SecurityTab (A-003)', () => {
  it('no longer offers a non-functional 2FA option', () => {
    render(<SecurityTab />);
    expect(screen.getByText('Security Settings')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /2FA/i })).not.toBeInTheDocument();
    expect(screen.queryByText(/Two-Factor/i)).not.toBeInTheDocument();
  });
});

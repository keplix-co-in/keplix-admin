/**
 * Health-sheet rollout gating in SettingsView's HealthSheetSettings section.
 * Enforcement sits on the escrow-release path, so the form must refuse to turn
 * enforcement on without a FUTURE effective date. Tested through the rendered
 * component (the validation lives inside it).
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

vi.mock('../services/platformSettingsApi', () => ({
  getPlatformSettings: vi.fn(),
  updatePlatformSettings: vi.fn(),
}));

import { getPlatformSettings, updatePlatformSettings } from '../services/platformSettingsApi';
import SettingsView from '../components/views/SettingsView.jsx';

const iso = (offsetDays) => {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString();
};
const dateInput = (offsetDays) => iso(offsetDays).slice(0, 10);

const openHealthTab = async (user) => {
  await user.click(screen.getByRole('button', { name: /health sheets/i }));
};

const toggle = () => screen.getByRole('checkbox');

beforeEach(() => {
  // M-3: platform settings are only rendered for super_admin.
  localStorage.setItem('adminUser', JSON.stringify({ id: 1, role: 'super_admin' }));
  vi.clearAllMocks();
  getPlatformSettings.mockResolvedValue({
    isHealthSheetRequired: false,
    healthSheetRequiredFrom: null,
  });
  updatePlatformSettings.mockImplementation(async (u) => ({
    isHealthSheetRequired: u.isHealthSheetRequired,
    healthSheetRequiredFrom: u.healthSheetRequiredFrom,
  }));
});

describe('HealthSheetSettings rollout date gating', () => {
  it('refuses to enable enforcement with no effective date set', async () => {
    const user = userEvent.setup();
    render(<SettingsView />);
    await openHealthTab(user);
    await waitFor(() => expect(toggle()).toBeInTheDocument());

    await user.click(toggle());

    expect(await screen.findByText(/set an effective date/i)).toBeInTheDocument();
    expect(updatePlatformSettings).not.toHaveBeenCalled();
  });

  it('refuses a PAST effective date', async () => {
    getPlatformSettings.mockResolvedValue({
      isHealthSheetRequired: false,
      healthSheetRequiredFrom: iso(-10),
    });
    const user = userEvent.setup();
    render(<SettingsView />);
    await openHealthTab(user);
    await waitFor(() => expect(toggle()).toBeInTheDocument());

    await user.click(toggle());

    expect(await screen.findByText(/must be in the future/i)).toBeInTheDocument();
    expect(updatePlatformSettings).not.toHaveBeenCalled();
  });

  it("refuses today's date (boundary: not strictly in the future)", async () => {
    getPlatformSettings.mockResolvedValue({
      isHealthSheetRequired: false,
      healthSheetRequiredFrom: iso(0),
    });
    const user = userEvent.setup();
    render(<SettingsView />);
    await openHealthTab(user);
    await waitFor(() => expect(toggle()).toBeInTheDocument());

    await user.click(toggle());

    expect(await screen.findByText(/must be in the future/i)).toBeInTheDocument();
    expect(updatePlatformSettings).not.toHaveBeenCalled();
  });

  it('accepts a FUTURE effective date and persists it as an ISO string', async () => {
    getPlatformSettings.mockResolvedValue({
      isHealthSheetRequired: false,
      healthSheetRequiredFrom: iso(30),
    });
    const user = userEvent.setup();
    render(<SettingsView />);
    await openHealthTab(user);
    await waitFor(() => expect(toggle()).toBeInTheDocument());

    await user.click(toggle());

    await waitFor(() => expect(updatePlatformSettings).toHaveBeenCalledTimes(1));
    const payload = updatePlatformSettings.mock.calls[0][0];
    expect(payload.isHealthSheetRequired).toBe(true);
    expect(payload.healthSheetRequiredFrom).toBe(
      new Date(dateInput(30)).toISOString()
    );
    expect(await screen.findByText(/^Saved\.$/)).toBeInTheDocument();
  });

  it('accepts a future date entered into the date input after loading with none', async () => {
    const user = userEvent.setup();
    render(<SettingsView />);
    await openHealthTab(user);
    await waitFor(() => expect(toggle()).toBeInTheDocument());

    const input = document.querySelector('input[type="date"]');
    fireEvent.change(input, { target: { value: dateInput(45) } });
    expect(input.value).toBe(dateInput(45));

    await user.click(toggle());

    await waitFor(() => expect(updatePlatformSettings).toHaveBeenCalledTimes(1));
    expect(updatePlatformSettings.mock.calls[0][0].healthSheetRequiredFrom).toBe(
      new Date(dateInput(45)).toISOString()
    );
  });

  it('allows DISABLING enforcement without any date validation', async () => {
    getPlatformSettings.mockResolvedValue({
      isHealthSheetRequired: true,
      healthSheetRequiredFrom: iso(-10),
    });
    const user = userEvent.setup();
    render(<SettingsView />);
    await openHealthTab(user);
    await waitFor(() => expect(toggle()).toBeInTheDocument());

    await user.click(toggle());

    await waitFor(() => expect(updatePlatformSettings).toHaveBeenCalledTimes(1));
    expect(updatePlatformSettings.mock.calls[0][0].isHealthSheetRequired).toBe(false);
    expect(screen.queryByText(/must be in the future/i)).not.toBeInTheDocument();
  });

  it('surfaces the server error message when the save fails', async () => {
    getPlatformSettings.mockResolvedValue({
      isHealthSheetRequired: false,
      healthSheetRequiredFrom: iso(30),
    });
    updatePlatformSettings.mockRejectedValue(new Error('Backend exploded'));
    const user = userEvent.setup();
    render(<SettingsView />);
    await openHealthTab(user);
    await waitFor(() => expect(toggle()).toBeInTheDocument());

    await user.click(toggle());

    expect(await screen.findByText('Backend exploded')).toBeInTheDocument();
  });

  it('shows a load-failure message when getPlatformSettings rejects', async () => {
    getPlatformSettings.mockRejectedValue(new Error('down'));
    const user = userEvent.setup();
    render(<SettingsView />);
    await openHealthTab(user);

    expect(await screen.findByText(/failed to load settings/i)).toBeInTheDocument();
  });
});

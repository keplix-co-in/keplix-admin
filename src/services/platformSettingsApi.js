/**
 * Platform Settings API Service
 * Includes the health-sheet enforcement gate — see the rollout warning
 * surfaced in SettingsView.jsx before flipping isHealthSheetRequired on.
 */

import { API_URL } from './apiConfig.js';

const authHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem('adminToken')}`,
  'Content-Type': 'application/json',
});

export const getPlatformSettings = async () => {
  const response = await fetch(`${API_URL}/admin/platform-settings`, {
    method: 'GET',
    headers: authHeaders(),
  });
  if (!response.ok) throw new Error(`Failed to fetch platform settings: ${response.status}`);
  const json = await response.json();
  return json.settings;
};

export const updatePlatformSettings = async (updates) => {
  const response = await fetch(`${API_URL}/admin/platform-settings`, {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify(updates),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to update platform settings');
  }
  const json = await response.json();
  return json.settings;
};

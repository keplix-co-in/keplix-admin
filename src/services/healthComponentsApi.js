/**
 * Health Components API Service
 * Admin CRUD for the Digital Vehicle Health Sheet's inspection checklist —
 * a template table specifically so adding/renaming/retiring a component is
 * an admin action here, not a backend deploy.
 */

import { API_URL } from './apiConfig.js';
import { authFetch } from './authApi.js';

/** Includes inactive components too, unlike the vendor-facing checklist. */
export const getHealthComponents = async () => {
  try {
    const response = await authFetch(`${API_URL}/admin/health-components`, {
      method: 'GET',
    });
    if (!response.ok) {
      console.error(`Health components API error: ${response.status}`);
      return [];
    }
    const json = await response.json();
    return json.data ?? [];
  } catch (error) {
    if (error.code === 'SESSION_EXPIRED') throw error;
    console.error('Failed to fetch health components:', error);
    return [];
  }
};

export const createHealthComponent = async (component) => {
  const response = await authFetch(`${API_URL}/admin/health-components`, {
    method: 'POST',
    body: JSON.stringify(component),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to create component');
  }
  return response.json();
};

export const updateHealthComponent = async (id, updates) => {
  const response = await authFetch(`${API_URL}/admin/health-components/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to update component');
  }
  return response.json();
};

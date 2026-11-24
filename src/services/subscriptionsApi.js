/**
 * Subscriptions API Service (admin). Contract: keplix-backend/docs/SUBSCRIPTIONS_API.md.
 * Reads: any admin. Writes (plan edit, extend): super_admin only (enforced by the backend).
 * List endpoints may reply with a bare array or { data | plans | vendors | payments }.
 */
import { API_URL } from './apiConfig.js';
import { authFetch } from './authApi.js';

const unwrap = (json, key) => {
  if (Array.isArray(json)) return json;
  return json?.[key] || json?.data || [];
};

const fail = async (response, fallback) => {
  const err = await response.json().catch(() => ({}));
  throw new Error(err.error?.message || err.message || fallback);
};

export const getSubscriptionPlans = async () => {
  const response = await authFetch(`${API_URL}/admin/subscriptions/plans`, { method: 'GET' });
  if (!response.ok) await fail(response, `Failed to fetch plans: ${response.status}`);
  return unwrap(await response.json(), 'plans');
};

export const updateSubscriptionPlan = async (code, updates) => {
  const response = await authFetch(`${API_URL}/admin/subscriptions/plans/${encodeURIComponent(code)}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  });
  if (!response.ok) await fail(response, 'Failed to update plan');
  return response.json();
};

export const getSubscriptionVendors = async ({ status = '' } = {}) => {
  const qs = status ? `?${new URLSearchParams({ status })}` : '';
  const response = await authFetch(`${API_URL}/admin/subscriptions/vendors${qs}`, { method: 'GET' });
  if (!response.ok) await fail(response, `Failed to fetch subscriptions: ${response.status}`);
  return unwrap(await response.json(), 'vendors');
};

export const extendSubscription = async (vendorId, { days, reason }) => {
  const response = await authFetch(`${API_URL}/admin/subscriptions/vendors/${vendorId}/extend`, {
    method: 'POST',
    body: JSON.stringify({ days, reason }),
  });
  if (!response.ok) await fail(response, 'Failed to extend subscription');
  return response.json();
};

export const getSubscriptionPayments = async () => {
  const response = await authFetch(`${API_URL}/admin/subscriptions/payments`, { method: 'GET' });
  if (!response.ok) await fail(response, `Failed to fetch payments: ${response.status}`);
  return unwrap(await response.json(), 'payments');
};

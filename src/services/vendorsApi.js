/**
 * Vendors API Service
 * Handles all vendor-related API calls for Admin
 */

import { API_URL } from './apiConfig.js';
import { authFetch } from './authApi.js';

/**
 * Get vendor metrics (counts by status)
 */
export const getVendorMetrics = async () => {
  try {
    const response = await authFetch(`${API_URL}/admin/vendors/metrics`, {
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch vendor metrics: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching vendor metrics:', error);
    throw error;
  }
};

/**
 * Get vendors with filters and pagination
 * @param {string} type - Filter type: all, active, pending, suspended, uninstalled
 * @param {number} page - Page number (1-indexed)
 * @param {number} limit - Items per page
 */
export const getVendors = async (type = 'all', page = 1, limit = 10) => {
  try {
    const token = localStorage.getItem('adminToken');

    if (!token) {
      console.warn('⚠️ No admin token found in localStorage');
      return [];
    }

    const filterType = type || 'all';
    const queryParams = new URLSearchParams({
      type: filterType,
      page: String(page),
      limit: String(limit)
    });

    const url = `${API_URL}/admin/vendors?${queryParams}`;
    // Security review 2026-10-28 O-003: the full request URL (incl. query
    // string) used to be console.log'd here; removed.

    // authFetch renews an expired token and retries once itself; it only
    // throws SESSION_EXPIRED if that retry also fails, so a plain 401
    // pre-check here is no longer needed.
    const response = await authFetch(url, { method: 'GET' });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ API Error: ${response.status}`, errorText);
      throw new Error(`API Error: ${response.status}`);
    }

    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    if (error.code === 'SESSION_EXPIRED') throw error;
    console.error('❌ Error fetching vendors:', error);
    return [];
  }
};

/**
 * Approve / reject / suspend a vendor: PATCH /admin/vendors/:id/status
 * (super_admin only on the backend). `reason` (3-500 chars) is required for
 * rejected and suspended. Throws Error with the backend's message on failure.
 */
export const setVendorStatus = async (id, status, reason) => {
  const response = await authFetch(`${API_URL}/admin/vendors/${encodeURIComponent(id)}/status`, {
    method: 'PATCH',
    body: JSON.stringify(reason ? { status, reason } : { status }),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    const msg = err.message || err.error?.message || `Failed to update vendor (${response.status})`;
    // WHY: ONBOARDING_INCOMPLETE carries the missing fields; show them to the admin.
    throw new Error(Array.isArray(err.missing) && err.missing.length ? `${msg} Missing: ${err.missing.join(', ')}` : msg);
  }
  return response.json();
};

/**
 * GET /admin/vendors/:id -- full onboarding details for admin verification
 * (bank/UPI masked server-side). Returns the `data` object.
 */
export const getVendorDetail = async (id) => {
  const response = await authFetch(`${API_URL}/admin/vendors/${encodeURIComponent(id)}`, { method: 'GET' });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || `Failed to load vendor (${response.status})`);
  }
  const body = await response.json();
  return body.data || body;
};

export default {
  getVendorDetail,
  getVendorMetrics,
  getVendors,
  setVendorStatus,
};

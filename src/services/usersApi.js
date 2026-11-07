/**
 * Users API Service
 * Handles all user-related API calls for Admin
 */

import { API_URL } from './apiConfig.js';
import { authFetch } from './authApi.js';

/**
 * Get users with filters and pagination
 * @param {string} type - Filter type: all, active, inactive, uninstalled
 * @param {number} page - Page number (1-indexed)
 * @param {number} limit - Items per page
 */
export const getUsers = async (type = 'all', page = 1, limit = 10) => {
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

    const url = `${API_URL}/admin/users?${queryParams}`;
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
    console.error('❌ Error fetching users:', error);
    return [];
  }
};

/**
 * Delete user
 * @param {string|number} id - User ID
 */
export const deleteUser = async (id) => {
  try {
    const response = await authFetch(`${API_URL}/admin/users/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error(`Failed to delete user: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error deleting user:', error);
    throw error;
  }
};

export default {
  getUsers,
  deleteUser
};

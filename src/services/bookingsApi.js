/**
 * Bookings API Service
 * Handles all booking-related API calls
 */

import { API_URL } from './apiConfig.js';
import { authFetch } from './authApi.js';

/**
 * Get booking metrics (counts by status)
 */
export const getBookingMetrics = async () => {
  try {
    const response = await authFetch(`${API_URL}/admin/bookings/counts`, {
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch booking metrics: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching booking metrics:', error);
    throw error;
  }
};

/**
 * Get bookings with filters and pagination
 * @param {string} type - Filter type: all, completed, inprogress, confirmed, cancelled, requested
 * @param {number} page - Page number (1-indexed)
 * @param {number} limit - Items per page
 */
export const getBookings = async (type = 'all', page = 1, limit = 10) => {
  try {
    const token = localStorage.getItem('adminToken');

    if (!token) {
      console.warn('No admin token found in localStorage');
      return [];
    }

    const filterType = type || 'all';
    const queryParams = new URLSearchParams({
      type: filterType,
      page: String(page),
      limit: String(limit)
    });

    const url = `${API_URL}/admin/bookings?${queryParams}`;

    // authFetch handles a 401 itself: it silently retries once after
    // renewing the token, and only throws SESSION_EXPIRED if that also
    // fails -- so a expired-but-renewable token no longer degrades to an
    // empty list here at all, and a truly dead session surfaces below.
    const response = await authFetch(url, { method: 'GET' });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`API Error: ${response.status}`, errorText);
      throw new Error(`API Error: ${response.status}`);
    }

    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    // Standardized with getVendors/getUsers: only a dead session (which
    // requires the operator to re-login) propagates. A plain failure
    // (network, 500, parse error) degrades to an empty list instead of
    // throwing, so the view's normal empty state renders rather than
    // requiring every caller to separately handle a bookings-specific
    // failure contract.
    if (error.code === 'SESSION_EXPIRED') throw error;
    console.error('Error fetching bookings:', error);
    return [];
  }
};

/**
 * Force-complete a booking without a submitted health sheet — the
 * escape hatch if the mandatory-inspection gate misfires. Does NOT release
 * escrow itself (that only happens on the customer's own confirmation); it
 * only unblocks the booking's status. See the backend controller for the
 * full safety-boundary note.
 * @param {string|number} bookingId
 * @param {string} reason - required context for the audit log
 */
export const forceCompleteBooking = async (bookingId, reason) => {
  try {
    const response = await authFetch(`${API_URL}/admin/bookings/${bookingId}/force-complete`, {
      method: 'POST',
      body: JSON.stringify({ reason })
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.message || `Failed to force-complete booking: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error force-completing booking:', error);
    throw error;
  }
};

export default {
  getBookingMetrics,
  getBookings,
  forceCompleteBooking
};

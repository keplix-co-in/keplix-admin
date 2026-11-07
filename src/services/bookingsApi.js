/**
 * Bookings API Service
 * Handles all booking-related API calls
 */

import { API_URL } from './apiConfig.js';
import { authFetch } from './authApi.js';

/**
 * Get bookings with filters and pagination.
 *
 * THROWS on failure (network, non-2xx, no session) rather than resolving to
 * []. It used to swallow every non-session error into an empty list, so a
 * backend outage rendered as "No bookings found" -- indistinguishable from a
 * genuinely empty filter, with no retry. BookingsView (via useApiResource)
 * now shows the error with a Retry button; GlobalSearch already uses
 * Promise.allSettled, so a throw there only blanks the bookings column.
 *
 * @param {string} type - `?type=` filter, see `bookingFilters` in
 *   data/config.js: all, pending, confirmed, inprogress, service_completed,
 *   completed (service_completed + user_confirmed), disputed, cancelled,
 *   rejected, refunded. (`requested` is the backend's older alias for
 *   pending; nothing here sends it any more.)
 * @param {number} page - Page number (1-indexed)
 * @param {number} limit - Items per page
 */
export const getBookings = async (type = 'all', page = 1, limit = 10) => {
  // No token means no session: surface it as an error the view can show,
  // instead of quietly rendering an empty list (see the doc comment above).
  if (!localStorage.getItem('adminToken')) {
    throw new Error('Not signed in. Please log in again.');
  }

  const queryParams = new URLSearchParams({
    type: type || 'all',
    page: String(page),
    limit: String(limit)
  });

  // authFetch handles a 401 itself: it silently retries once after
  // renewing the token, and only throws SESSION_EXPIRED if that also
  // fails -- that error propagates unchanged.
  const response = await authFetch(`${API_URL}/admin/bookings?${queryParams}`, { method: 'GET' });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    console.error(`Bookings API error: ${response.status}`, err);
    throw new Error(err.message || `Failed to load bookings (${response.status})`);
  }

  const data = await response.json();
  // A 200 with a non-array body is a contract break, not "no bookings".
  if (!Array.isArray(data)) {
    throw new Error('Unexpected response from the bookings API.');
  }
  return data;
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

/**
 * Resolve a disputed booking in the CUSTOMER's favour. The backend moves the
 * booking to `cancelled` and notifies both sides, but deliberately does NOT
 * refund -- that is a separate call to /admin/finance/payments/:id/refund
 * (see RefundModal). super_admin only.
 * @param {string|number} bookingId
 * @param {string} reason - min 10 characters (enforced server-side too)
 */
export const resolveDispute = async (bookingId, reason) => {
  const response = await authFetch(`${API_URL}/admin/bookings/${bookingId}/dispute/resolve`, {
    method: 'POST',
    body: JSON.stringify({ reason })
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || `Failed to resolve dispute: ${response.status}`);
  }

  return await response.json();
};

export default {
  getBookings,
  forceCompleteBooking,
  resolveDispute
};

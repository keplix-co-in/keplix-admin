/**
 * Offers API Service
 *
 * Admin CRUD for promotional placement slots — the copy shown on the customer
 * app's home banner and workshop cards. Content lives in the database
 * specifically so changing an offer is an action here, not an app release.
 */

import { API_URL } from './apiConfig.js';
import { authFetch } from './authApi.js';

// Requests go through authFetch, which attaches the bearer token and renews it
// on a 401. The access token expires after 15 minutes, so a plain fetch here
// meant saving an offer failed with 401 after a short idle.

const failWith = async (response, fallback) => {
  const err = await response.json().catch(() => ({}));
  throw new Error(err.message || fallback);
};

/** Every slot, including inactive and scheduled ones — unlike /content/offers. */
export const getOfferSlots = async () => {
  try {
    const response = await authFetch(`${API_URL}/admin/offer-slots`, {
      method: 'GET',
    });
    if (!response.ok) {
      console.error(`Offer slots API error: ${response.status}`);
      return [];
    }
    const json = await response.json();
    return json.data ?? [];
  } catch (error) {
    // An expired session must propagate: degrading it to an empty list would
    // render the Offers page as "nothing configured", which reads as data loss.
    if (error.code === 'SESSION_EXPIRED') throw error;
    console.error('Failed to fetch offer slots:', error);
    return [];
  }
};

/**
 * Save a placement by its key, creating the row if it doesn't exist yet.
 * Used by the Offers page, which lists placements defined in app code rather
 * than rows that happen to be in the database.
 */
export const saveOfferSlotByKey = async (key, updates) => {
  const response = await authFetch(`${API_URL}/admin/offer-slots/by-key/${key}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  });
  if (!response.ok) await failWith(response, 'Failed to save offer');
  return response.json();
};

/**
 * Replaces the whole target set.
 * An empty array is meaningful: it means the slot applies to ALL vendors.
 */
export const setOfferSlotTargets = async (id, vendorIds) => {
  const response = await authFetch(`${API_URL}/admin/offer-slots/${id}/targets`, {
    method: 'PUT',
    body: JSON.stringify({ vendor_ids: vendorIds }),
  });
  if (!response.ok) await failWith(response, 'Failed to update targeting');
  return response.json();
};

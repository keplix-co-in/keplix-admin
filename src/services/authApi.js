/**
 * Authentication API Service
 * Handles admin login and authentication
 */

import { API_URL } from './apiConfig.js';

/**
 * Login admin user
 * @param {string} email - Admin email
 * @param {string} password - Admin password
 */
export const adminLogin = async (email, password) => {
  try {
    const response = await fetch(`${API_URL}/admin/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email,
        password
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData?.message || `Login failed: ${response.status}`;
      throw new Error(errorMessage);
    }

    const data = await response.json();

    // Do not log `data` here — it contains the admin's bearer/refresh tokens
    // in plaintext, which would otherwise land in the browser console.

    // Store tokens and user data.
    //
    // These MUST match the field names the backend actually returns —
    // controllers/Admin/authController.js responds with
    // { user, accessToken, refreshToken }. This previously read data.token /
    // data.refresh, which are never present, so adminToken was never stored:
    // login appeared to succeed (App.jsx sets its state from the callback,
    // not from the token) while every subsequent request went out as
    // "Bearer null" and 401'd, leaving every screen silently empty.
    if (data.accessToken) {
      localStorage.setItem('adminToken', data.accessToken);
    }

    if (data.refreshToken) {
      localStorage.setItem('adminRefreshToken', data.refreshToken);
    }

    if (data.user) {
      localStorage.setItem('adminUser', JSON.stringify(data.user));
    }

    return data;
  } catch (error) {
    console.error('Error during login:', error.message);
    throw error;
  }
};

/**
 * Exchange the stored refresh token for a fresh access token.
 *
 * The access token lives 15 minutes and nothing renewed it, so the admin panel
 * started 401ing on every request after a short idle and the only way back was
 * a manual re-login.
 *
 * The backend ROTATES: it returns a new refresh token and invalidates the old
 * one, treating a second use of a spent token as theft and clearing the
 * session. So the new refresh token must be stored, and concurrent refreshes
 * must be collapsed into one — two parallel 401s each redeeming the same token
 * would trip that reuse detection and log the admin out.
 *
 * @returns {Promise<string|null>} the new access token, or null if re-login is required
 */
let refreshInFlight = null;

export const refreshAdminToken = () => {
  if (refreshInFlight) return refreshInFlight;

  const refreshToken = localStorage.getItem('adminRefreshToken');
  if (!refreshToken) return Promise.resolve(null);

  refreshInFlight = fetch(`${API_URL}/admin/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  })
    .then(async (response) => {
      if (!response.ok) {
        // Expired, revoked, or reuse detected — none are recoverable here.
        adminLogout();
        return null;
      }
      const data = await response.json();
      if (!data.accessToken) return null;

      localStorage.setItem('adminToken', data.accessToken);
      if (data.refreshToken) {
        localStorage.setItem('adminRefreshToken', data.refreshToken);
      }
      return data.accessToken;
    })
    .catch(() => null)
    .finally(() => {
      refreshInFlight = null;
    });

  return refreshInFlight;
};

/**
 * fetch() for admin endpoints: attaches the bearer token, and on a 401 renews
 * it once and retries. One retry only — if the refreshed token is also
 * rejected, the session is genuinely gone and retrying would loop.
 *
 * Throws SESSION_EXPIRED when re-login is required, so callers can surface it
 * rather than showing a misleading "failed to save".
 */
export const authFetch = async (url, options = {}) => {
  const send = () =>
    fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
        Authorization: `Bearer ${localStorage.getItem('adminToken')}`,
      },
    });

  let response = await send();
  if (response.status !== 401) return response;

  const renewed = await refreshAdminToken();
  if (!renewed) {
    const error = new Error('Your session has expired. Please log in again.');
    error.code = 'SESSION_EXPIRED';
    throw error;
  }

  response = await send();
  if (response.status === 401) {
    const error = new Error('Your session has expired. Please log in again.');
    error.code = 'SESSION_EXPIRED';
    throw error;
  }
  return response;
};

/**
 * Logout admin user
 */
export const adminLogout = () => {
  try {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminRefreshToken');
    localStorage.removeItem('adminUser');
    console.log('✅ Admin logged out');
  } catch (error) {
    console.error('Error during logout:', error);
  }
};

/**
 * Get stored admin token
 */
export const getAdminToken = () => {
  return localStorage.getItem('adminToken');
};

/**
 * Get stored admin user data
 */
export const getAdminUser = () => {
  const user = localStorage.getItem('adminUser');
  return user ? JSON.parse(user) : null;
};

/**
 * Check if admin is authenticated. Verifies the stored token is a
 * well-formed JWT and not expired — presence alone is not enough, since a
 * stale or hand-edited localStorage value would otherwise render the app
 * as "logged in" until an API call eventually 401s.
 */
export const isAdminAuthenticated = () => {
  const token = getAdminToken();
  if (!token) return false;

  try {
    const payloadBase64 = token.split('.')[1];
    if (!payloadBase64) return false;
    const payload = JSON.parse(atob(payloadBase64.replace(/-/g, '+').replace(/_/g, '/')));
    if (!payload.exp) return true; // no expiry claim — treat presence as valid
    return payload.exp * 1000 > Date.now();
  } catch {
    return false;
  }
};

export default {
  adminLogin,
  adminLogout,
  getAdminToken,
  getAdminUser,
  isAdminAuthenticated,
  refreshAdminToken,
  authFetch
};

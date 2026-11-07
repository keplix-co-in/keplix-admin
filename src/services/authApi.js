/**
 * Authentication API Service
 *
 * 2026-11 Supabase Auth migration: admins sign in with Supabase
 * (signInWithPassword). The backend's old /admin/auth/login and /refresh now
 * answer 426, and Keplix's database no longer stores passwords.
 *
 * The exported functions and the localStorage keys ('adminToken',
 * 'adminUser') are kept on purpose: every service file and screen reads them,
 * so the UI did not have to change. 'adminToken' is a mirror of the current
 * Supabase access token, kept in sync by onAuthStateChange below.
 *
 * Security review 2026-10-28 O-001 — ACCEPTED RISK (owner decision
 * 2026-11-05): tokens live in localStorage (Supabase's own session too). The
 * mitigation is the strict CSP in vercel.json. Don't move storage without an
 * owner decision.
 */

import { API_URL } from './apiConfig.js';
import { supabase } from './supabaseClient.js';

const TOKEN_KEY = 'adminToken';
const USER_KEY = 'adminUser';
// Left over from the pre-Supabase login; removed on sign-in/out.
const LEGACY_REFRESH_KEY = 'adminRefreshToken';

const clearLocal = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(LEGACY_REFRESH_KEY);
};

// Fired when the session ends without the admin pressing Logout (refresh
// failed, second 401, Supabase SIGNED_OUT from another tab). App.jsx listens
// and drops to the Login screen; before this, the UI stayed "logged in" with
// every request failing.
export const SESSION_ENDED_EVENT = 'keplix-admin:session-ended';
const announceSessionEnded = () => {
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(SESSION_ENDED_EVENT));
};

// True while adminLogin is between Supabase sign-in and the /me admin check,
// so the listener can't publish a token for an account that may be rejected.
let loggingIn = false;

// Keep the mirrored token current when Supabase refreshes it in the
// background (autoRefreshToken), and clear it when the session ends.
supabase.auth.onAuthStateChange((event, session) => {
  if (loggingIn) return;
  if (session?.access_token) {
    localStorage.setItem(TOKEN_KEY, session.access_token);
  } else if (event === 'SIGNED_OUT') {
    clearLocal();
    announceSessionEnded();
  }
});

/**
 * Fetch the signed-in admin's {id, name, email, role} from the backend.
 * Returns null when the backend rejects the account (not an active admin).
 * Throws on network errors / 5xx so callers can tell "denied" from "down".
 */
const fetchAdminMe = async (accessToken) => {
  const response = await fetch(`${API_URL}/admin/auth/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (response.status >= 500) throw new Error(`/me failed: ${response.status}`);
  if (!response.ok) return null;
  const data = await response.json().catch(() => ({}));
  return data.user || null;
};

/**
 * Login admin user
 * @param {string} email - Admin email
 * @param {string} password - Admin password
 * @returns {Promise<{ user: object, accessToken: string }>}
 */
export const adminLogin = async (email, password) => {
  loggingIn = true;
  try {
    return await doAdminLogin(email, password);
  } finally {
    loggingIn = false;
  }
};

const doAdminLogin = async (email, password) => {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data?.session) {
    // Same wording the old backend used, so the login screen reads the same.
    throw new Error(
      error?.message === 'Email not confirmed'
        ? 'Please confirm your email before signing in.'
        : 'Invalid email or password'
    );
  }

  const accessToken = data.session.access_token;
  const user = await fetchAdminMe(accessToken).catch(() => null);
  if (!user) {
    // A valid Supabase login that is not an ACTIVE admin (e.g. a customer
    // account, or a suspended admin). Don't leave a half-signed-in session.
    // scope 'local' on purpose: this only drops the session just created in
    // this browser. It does NOT revoke anything server-side, and 'global'
    // would sign that (non-admin) user out of their other apps/devices.
    await supabase.auth.signOut({ scope: 'local' }).catch(() => {});
    clearLocal();
    throw new Error('This account does not have admin access.');
  }

  localStorage.removeItem(LEGACY_REFRESH_KEY);
  localStorage.setItem(TOKEN_KEY, accessToken);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  return { user, accessToken };
};

/**
 * Get a fresh access token from Supabase (used after a 401 and on page load
 * when the mirrored token is expired). Concurrent calls share one refresh.
 *
 * @returns {Promise<string|null>} the new access token, or null if re-login is required
 */
let refreshInFlight = null;

export const refreshAdminToken = () => {
  if (refreshInFlight) return refreshInFlight;

  refreshInFlight = supabase.auth
    .refreshSession()
    .then(async ({ data, error }) => {
      const token = data?.session?.access_token;
      if (error || !token) {
        await adminLogout();
        return null;
      }
      localStorage.setItem(TOKEN_KEY, token);
      // L-3 (2026-11-07): re-fetch /me on EVERY refresh (not only when the
      // profile is missing) so a role change or suspension reaches the UI
      // within one token lifetime. Refreshes happen ~hourly or after a 401,
      // so this is one extra cheap GET per refresh.
      // null = backend says not an active admin -> sign out. A network
      // error/5xx keeps the cached profile (if any) so a blip on /me doesn't
      // log the admin out; with no cached profile we can't render, so sign out.
      let user;
      try {
        user = await fetchAdminMe(token);
      } catch {
        user = getAdminUser();
      }
      if (!user) {
        await adminLogout();
        return null;
      }
      localStorage.setItem(USER_KEY, JSON.stringify(user));
      return token;
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
 * Throws SESSION_EXPIRED when re-login is required.
 */
export const authFetch = async (url, options = {}) => {
  const send = () =>
    fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
        Authorization: `Bearer ${localStorage.getItem(TOKEN_KEY)}`,
      },
    });

  return sendWithRefresh(send);
};

/**
 * Same as authFetch but does NOT force Content-Type — for multipart/FormData
 * bodies, where the browser must set its own boundary.
 */
export const authFetchRaw = async (url, options = {}) => {
  const send = () =>
    fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${localStorage.getItem(TOKEN_KEY)}`,
      },
    });

  return sendWithRefresh(send);
};

const sessionExpired = () => {
  announceSessionEnded();
  const error = new Error('Your session has expired. Please log in again.');
  error.code = 'SESSION_EXPIRED';
  return error;
};

const sendWithRefresh = async (send) => {
  let response = await send();
  if (response.status !== 401) return response;

  const renewed = await refreshAdminToken();
  if (!renewed) throw sessionExpired();

  response = await send();
  if (response.status === 401) throw sessionExpired();
  return response;
};

/**
 * Logout admin user. M-1 (2026-11-07): scope 'global' asks Supabase to revoke
 * ALL of this admin's refresh tokens server-side — so a copied/stolen refresh
 * token stops working too. 'local' (the old value) only forgot the session in
 * this browser, despite what the comment here used to claim. Trade-off: it
 * also signs this admin out on their other devices; accepted for an admin
 * panel. Local state is cleared in `finally` even if the network call fails.
 */
export const adminLogout = async () => {
  try {
    const { error } = (await supabase.auth.signOut({ scope: 'global' })) || {};
    if (error) throw error;
  } catch (error) {
    console.error('Server-side logout failed; clearing local session anyway:', error?.message);
  } finally {
    clearLocal();
  }
};

/**
 * True when there is anything to try a silent refresh with on boot: the
 * mirrored token, or Supabase's own persisted session.
 */
export const hasStoredSession = () =>
  !!localStorage.getItem(TOKEN_KEY) || !!localStorage.getItem('keplix-admin-auth');

/** Get stored admin token (mirror of the Supabase access token). */
export const getAdminToken = () => localStorage.getItem(TOKEN_KEY);

/**
 * M-3: true when the signed-in admin is super_admin. UI-only gating so
 * regular admins don't see buttons that will just 403 — the backend's
 * authorizeSuperAdmin is still the real check.
 */
export const isSuperAdmin = () => getAdminUser()?.role === 'super_admin';

/** Get stored admin user data. */
export const getAdminUser = () => {
  const user = localStorage.getItem(USER_KEY);
  try {
    return user ? JSON.parse(user) : null;
  } catch {
    return null;
  }
};

/**
 * Check if admin is authenticated: the stored token must be a well-formed JWT
 * with a numeric, unexpired `exp` (security review A-007). Supabase access
 * tokens always carry `exp`.
 */
export const isAdminAuthenticated = () => {
  const token = getAdminToken();
  if (!token) return false;

  try {
    const payloadBase64 = token.split('.')[1];
    if (!payloadBase64) return false;
    const payload = JSON.parse(atob(payloadBase64.replace(/-/g, '+').replace(/_/g, '/')));
    if (typeof payload?.exp !== 'number' || !Number.isFinite(payload.exp)) return false;
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
  isSuperAdmin,
  isAdminAuthenticated,
  refreshAdminToken,
  hasStoredSession,
  authFetch,
  authFetchRaw,
};

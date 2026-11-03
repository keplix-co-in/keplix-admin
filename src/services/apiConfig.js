/**
 * Central API base URL for the admin panel.
 *
 * Previously each service file (authApi.js, bookingsApi.js, usersApi.js,
 * vendorsApi.js) and view (DashboardView.jsx, FinanceView.jsx) read
 * VITE_API_URL independently, with inconsistent fallbacks — some silently
 * defaulted to http://localhost:8000, one to :3000, and three others had no
 * fallback at all (so a request would go to "undefined/admin/..." if the
 * env var was ever unset). Centralizing here means a missing env var fails
 * loudly at import time instead of producing a confusing network error.
 */
if (!import.meta.env.VITE_API_URL) {
  throw new Error(
    'VITE_API_URL is not set. Create a .env.local with VITE_API_URL=<backend URL> before running the admin panel.'
  );
}

export const API_URL = import.meta.env.VITE_API_URL;

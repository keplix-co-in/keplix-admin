/**
 * Supabase Auth client (2026-11 auth migration).
 *
 * Supabase owns admin sign-in and sessions; the backend only verifies the
 * Supabase access token (keplix-backend middleware/authAdminMiddleware.js).
 * Both values are PUBLIC (the publishable key is meant to ship in browsers).
 */
import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!url || !key) {
  throw new Error(
    'VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY are not set. Add them to .env.local before running the admin panel.'
  );
}

export const supabase = createClient(url, key, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    // Admin panel has no OAuth/magic-link redirects.
    detectSessionInUrl: false,
    storageKey: 'keplix-admin-auth',
  },
});

/**
 * Founder dashboard API (2026-11-14). Read-only; every backend route is
 * super_admin only. See keplix-backend/controllers/Admin/founderController.js.
 */

import { API_URL } from './apiConfig.js';
import { authFetch } from './authApi.js';

/**
 * GET one founder source. On failure throws an Error whose `.code` is the
 * backend's code -- NOT_CONFIGURED means the source's keys aren't set yet,
 * which the screens show as "Not connected" rather than as an error.
 */
const getSource = async (path, label, refresh) => {
  const qs = refresh ? '?refresh=1' : '';
  const response = await authFetch(`${API_URL}/admin/founder/${path}${qs}`, { method: 'GET' });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    const err = new Error(body.message || `Could not load ${label} (${response.status})`);
    err.code = body.code;
    throw err;
  }
  return response.json();
};

/** Today / yesterday / same day last week, 14-day chart, failed payments, refunds. */
export const getFounderSales = () => getSource('sales', 'sales');
/** { campaigns } from Meta Ads (cached 5 min server-side; refresh skips it). */
export const getFounderAds = (refresh) => getSource('ads', 'ads', refresh);
/** { reels, comments } from Instagram. */
export const getFounderInstagram = (refresh) => getSource('instagram', 'Instagram', refresh);
/** { messages, calendar } from Gmail + Calendar via the owner's Apps Script. */
export const getFounderGoogle = (refresh) => getSource('google', 'Gmail + Calendar', refresh);
/** Phase 3: { messages } -- inbound WhatsApp from Twilio's read-only list, numbers masked. */
export const getFounderWhatsApp = (refresh) => getSource('whatsapp', 'WhatsApp', refresh);
/** Phase 3: { text, generatedAt, model } -- Gemini brief, cached 1 h server-side. */
export const getFounderBrief = (refresh) => getSource('brief', 'the AI brief', refresh);

/** Phase 3: Ask box. POST { question } -> { answer, generatedAt, model }. */
export const askFounder = async (question) => {
  const response = await authFetch(`${API_URL}/admin/founder/ask`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question }),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const err = new Error(body.message || `Could not get an answer (${response.status})`);
    err.code = body.code;
    throw err;
  }
  return body;
};

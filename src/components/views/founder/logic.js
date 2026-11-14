import { useEffect, useState } from 'react';
import { sampleSales, sampleSources, sampleAdsSource, sampleInstagramSource, sampleGoogleSource, sampleWhatsAppSource, sampleBrief } from '../../../data/founderSample';
import { getFounderSales, getFounderAds, getFounderInstagram, getFounderGoogle, getFounderWhatsApp, getFounderBrief } from '../../../services/founderApi';

/**
 * Founder dashboard hooks and pure helpers (2026-11-14). Kept in a plain .js
 * file so the .jsx files export only components (react-refresh lint rule).
 *
 * Each data source has its own Sample / Live switch. The choice is a per-viewer
 * convenience, so it lives in localStorage (wrapped in try/catch: private
 * windows can throw) and defaults to Sample.
 */

const KEY = (id) => `founderMode:${id}`;

const read = (id) => {
  try {
    return localStorage.getItem(KEY(id)) === 'live' ? 'live' : 'sample';
  } catch {
    return 'sample';
  }
};

export function useSourceMode(id) {
  const [mode, setModeState] = useState(() => read(id));
  const setMode = (m) => {
    setModeState(m);
    try {
      localStorage.setItem(KEY(id), m);
    } catch {
      /* storage blocked: the switch still works for this visit */
    }
  };
  return [mode, setMode];
}

export const sourceInfo = (id) => sampleSources.find((s) => s.id === id);

export const inr = (n) =>
  `₹${Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

export const timeAgo = (iso) => {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const h = Math.round(mins / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.round(h / 24)}d ago`;
};

/* ---------- data hooks ---------- */

// Each live source: its sample data and the call that loads it for real.
// Phase 2 (2026-11-14) added ads, instagram and google; Phase 3 whatsapp + ai_brief.
const SOURCES = {
  sales: { sample: sampleSales, load: () => getFounderSales() },
  meta_ads: { sample: sampleAdsSource, load: getFounderAds },
  instagram: { sample: sampleInstagramSource, load: getFounderInstagram },
  google: { sample: sampleGoogleSource, load: getFounderGoogle },
  whatsapp: { sample: sampleWhatsAppSource, load: getFounderWhatsApp },
  ai_brief: { sample: sampleBrief, load: getFounderBrief },
};

/**
 * One source with its Sample / Live switch. Live loads from the backend.
 * `req` counts requests; a request is still loading until `doneFor` catches
 * up. Deriving loading this way avoids a setState at the top of the effect.
 * `force` marks a request made by Refresh / Sync now, which asks the backend
 * to skip its 5-minute cache.
 */
export function useLiveSource(id) {
  const { sample, load } = SOURCES[id];
  const [mode, setStoredMode] = useSourceMode(id);
  const [req, setReq] = useState({ n: 0, force: false });
  const [live, setLive] = useState({ data: null, error: null, code: null, doneFor: -1 });

  useEffect(() => {
    if (mode !== 'live') return undefined;
    let cancelled = false;
    load(req.force)
      .then((data) => !cancelled && setLive({ data, error: null, code: null, doneFor: req.n }))
      // Keep the last good data on a failed refresh; show the error beside it.
      .catch((e) => !cancelled && setLive((s) => ({ ...s, error: e.message, code: e.code || null, doneFor: req.n })));
    return () => { cancelled = true; };
  }, [mode, req, load]);

  const isLive = mode === 'live';
  const loading = isLive && live.doneFor !== req.n;
  const settled = isLive && !loading;
  const notConfigured = settled && live.code === 'NOT_CONFIGURED';
  const setMode = (m) => {
    if (m === 'live') setReq((r) => ({ n: r.n + 1, force: false }));
    setStoredMode(m);
  };
  return {
    mode,
    setMode,
    // Data from before the keys were removed is not shown as current.
    data: isLive ? (notConfigured ? null : live.data) : sample,
    loading,
    notConfigured,
    error: settled && !notConfigured ? live.error : null,
    refresh: () => setReq((r) => ({ n: r.n + 1, force: true })),
  };
}

/** Sales: Sample data, or Live from GET /admin/founder/sales (our own DB). */
export const useSales = () => useLiveSource('sales');

/* ---------- pure helpers (unit-tested) ---------- */

export const pctChange = (now, before) => {
  if (!before) return null;
  return Math.round(((now - before) / before) * 100);
};

/** Cost per result up 30%+ over the last 3 days, rising each day. */
export const isCampaignFlagged = (trend) => {
  if (!trend || trend.length < 4) return false;
  const last4 = trend.slice(-4);
  if (last4.some((v) => !v)) return false;
  const rising = last4[1] > last4[0] && last4[2] > last4[1] && last4[3] > last4[2];
  return rising && last4[3] >= last4[0] * 1.3;
};

export const campaignRow = (c, days) => {
  const spend = c.spend[days] || 0;
  const results = c.results[days] || 0;
  const value = c.purchaseValue ? c.purchaseValue[days] : null;
  return {
    ...c,
    spendN: spend,
    resultsN: results,
    cpr: results ? spend / results : null,
    roas: value != null && spend ? value / spend : null,
    flagged: isCampaignFlagged(c.cprTrend),
  };
};

/** Top 6 things that need the owner, across every source shown. */
export const buildNeedsYou = ({ sales, ads, messages, comments }) => {
  const items = [];
  (sales?.failed || []).forEach((f) => items.push({ key: `f${f.id}`, text: `Failed payment ${inr(f.amount)} (booking ${f.bookingId ?? '—'})`, source: 'Sales', time: f.createdAt }));
  (ads || []).filter((c) => isCampaignFlagged(c.cprTrend)).forEach((c) => items.push({ key: `a${c.id}`, text: `Ad cost per result rising: ${c.name}`, source: 'Ads', time: null }));
  (messages || []).forEach((m) => items.push({ key: `m${m.id}`, text: `${m.from}: ${m.text}`, source: APP_LABEL[m.app], time: m.time, link: m.link }));
  (comments || []).forEach((c) => items.push({ key: `c${c.id}`, text: `Comment from ${c.from}: ${c.text}`, source: 'Instagram', time: c.time }));
  return items
    .sort((a, b) => (b.time ? new Date(b.time) : Infinity) - (a.time ? new Date(a.time) : Infinity))
    .slice(0, 6);
};

export const APP_LABEL = { gmail: 'Gmail', whatsapp: 'WhatsApp', ig_dm: 'Instagram DM', ig_comment: 'Instagram comment' };


/**
 * Sales chart for the last `days` days, with the `days` before it as a dashed
 * "period before" line (2026-11-14 redesign). The backend sends 60 days, so
 * 30 days + the 30 before both fit; if fewer days came back, hasPrev is false.
 */
export const salesSeries = (chart, days) => {
  const rows = chart || [];
  const cur = rows.slice(-days);
  const before = rows.length >= days * 2 ? rows.slice(-days * 2, -days) : null;
  const total = cur.reduce((a, r) => a + (r.amount || 0), 0);
  const prevTotal = before ? before.reduce((a, r) => a + (r.amount || 0), 0) : null;
  return {
    points: cur.map((r, i) => ({ date: r.date, amount: r.amount || 0, prev: before ? before[i].amount || 0 : null })),
    total,
    change: before ? pctChange(total, prevTotal) : null,
    hasPrev: !!before,
  };
};

/** Google Ads says ENABLED where Meta says ACTIVE; both mean "running". */
export const isRunning = (status) => status === 'ACTIVE' || status === 'ENABLED';

/**
 * Top-bar search (2026-11-14). Client-side only, over data already loaded;
 * returns up to 8 hits, each pointing at the founder screen that shows it.
 */
export const searchFounder = (query, { messages, campaigns, events, reels, videos } = {}) => {
  const q = (query || '').trim().toLowerCase();
  if (q.length < 2) return [];
  const has = (...v) => v.some((x) => x && String(x).toLowerCase().includes(q));
  const out = [];
  (messages || []).forEach((m) => has(m.from, m.text) && out.push({ key: `m${m.id}`, kind: APP_LABEL[m.app] || 'Message', text: `${m.from}: ${m.text}`, screen: 'messages' }));
  (campaigns || []).forEach((c) => has(c.name) && out.push({ key: `a${c.id}`, kind: 'Campaign', text: c.name, screen: 'ads' }));
  (events || []).forEach((e) => has(e.title) && out.push({ key: `e${e.id}_${e.start}`, kind: 'Meeting', text: e.title, screen: 'calendar' }));
  (reels || []).forEach((r) => has(r.caption) && out.push({ key: `r${r.id}`, kind: 'Reel', text: r.caption, screen: 'instagram' }));
  (videos || []).forEach((v) => has(v.title) && out.push({ key: `y${v.id}`, kind: 'Video', text: v.title, screen: 'youtube' }));
  return out.slice(0, 8);
};

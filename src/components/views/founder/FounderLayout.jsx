import { useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FOUNDER_SCREENS } from './registry';
import keplixLogo from '../../../assets/keplix-logo.png';
import { PanelToggle } from '../../layout/Topbar';
import { getAdminUser } from '../../../services/authApi';
import { ICONS } from './icons';
import { searchFounder, timeAgo, useLiveSource } from './logic';

/**
 * Light shell for the Founder side (2026-11-14 redesign). The Admin side keeps
 * its dark Sidebar/Topbar; App.jsx swaps to this one only on /founder/*.
 * Keplix name and mark only. Search is client-side over what is already loaded:
 * nothing new is fetched and nothing is written.
 */
export default function FounderLayout({ subNav, setActiveNav, onLogout, children }) {
  const google = useLiveSource('google');
  const wa = useLiveSource('whatsapp');
  const ads = useLiveSource('meta_ads');
  const ig = useLiveSource('instagram');
  const [q, setQ] = useState('');
  const user = getAdminUser();
  const navigate = useNavigate();
  const appFilter = new URLSearchParams(useLocation().search).get('app');

  const gmail = google.data?.messages?.length || 0;
  const whats = wa.data?.messages?.length || 0;
  const igc = ig.data?.comments?.length || 0;
  const counts = {
    today: (google.data?.calendar || []).filter((e) => new Date(e.start).toDateString() === new Date().toDateString()).length,
    messages: gmail + whats + igc,
  };
  // 2026-11-15: Messages opens into per-app rows, like the reference layout.
  const MESSAGE_ROWS = [
    { key: 'all', label: 'All messages', icon: ICONS.messages, n: gmail + whats + igc, to: '/founder/messages', on: subNav === 'messages' && !appFilter },
    { key: 'gmail', label: 'Email', icon: ICONS.gmail, n: gmail, to: '/founder/messages?app=gmail', on: subNav === 'messages' && appFilter === 'gmail' },
    { key: 'whatsapp', label: 'WhatsApp', icon: ICONS.whatsapp, n: whats, to: '/founder/messages?app=whatsapp', on: subNav === 'messages' && appFilter === 'whatsapp' },
    { key: 'instagram', label: 'Instagram', icon: ICONS.instagram, n: igc, to: '/founder/messages?app=instagram', on: subNav === 'messages' && appFilter === 'instagram' },
  ];
  const row = (on) => `w-full flex items-center gap-3 py-2 px-2.5 rounded-lg text-[15px] ${on ? 'bg-slate-100 text-slate-900 font-semibold' : 'text-slate-700 hover:bg-slate-50'}`;
  const badge = (n, solid) => n > 0 && (
    <span className={`text-[11px] font-bold rounded-full min-w-[22px] h-[22px] px-1.5 flex items-center justify-center ${solid ? 'bg-brand-red text-white' : 'bg-slate-100 text-slate-600'}`}>{n}</span>
  );
  const results = useMemo(() => searchFounder(q, {
    messages: [...(google.data?.messages || []), ...(wa.data?.messages || [])],
    campaigns: [...(ads.data?.campaigns || []), ...(google.data?.googleAds?.campaigns || [])],
    events: google.data?.calendar,
    reels: ig.data?.reels,
    videos: google.data?.youtube?.videos,
  }), [q, google.data, wa.data, ads.data, ig.data]);
  const synced = [google, wa, ads, ig].map((s) => s.data?.fetchedAt).filter(Boolean).sort().pop();

  const groups = [];
  Object.entries(FOUNDER_SCREENS).forEach(([id, s]) => {
    let g = groups.find((x) => x.name === s.group);
    if (!g) groups.push((g = { name: s.group, items: [] }));
    g.items.push([id, s]);
  });

  return (
    <div className="flex h-screen bg-slate-50 font-inter overflow-hidden text-slate-800">
      <aside className="w-60 bg-white border-r border-slate-200 flex flex-col p-5 shrink-0">
        {/* Keplix's own mark (never the reference site's logo). */}
        <div className="flex items-center gap-2.5 px-1 pb-6">
          <img src={keplixLogo} alt="Keplix" className="w-10 h-10 rounded-xl object-contain bg-white" />
          <div className="font-bold text-[17px] text-slate-900 leading-[1.1]">Keplix<br />Founder</div>
        </div>
        <nav className="flex-1 overflow-y-auto" aria-label="Founder">
          {groups.map((g) => (
            <div key={g.name} className="mb-4">
              <div className="text-[13px] text-slate-500 px-2 pb-1.5">{g.name}</div>
              {g.name === 'Messages' ? MESSAGE_ROWS.map((r) => (
                <button key={r.key} type="button" onClick={() => navigate(r.to)} aria-current={r.on ? 'page' : undefined} className={row(r.on)}>
                  <span className="text-slate-600">{r.icon}</span>
                  <span className="flex-1 text-left">{r.label}</span>
                  {badge(r.n)}
                </button>
              )) : g.items.map(([id, s]) => (
                <button key={id} type="button" onClick={() => setActiveNav(`founder/${id}`)} aria-current={subNav === id ? 'page' : undefined} className={row(subNav === id)}>
                  <span className="text-slate-600">{ICONS[id]}</span>
                  <span className="flex-1 text-left">{s.label}</span>
                  {badge(counts[id], id === 'today')}
                </button>
              ))}
            </div>
          ))}
        </nav>
        <div className="border-t border-slate-200 pt-4 px-2 text-sm">
          <div className="font-semibold text-slate-900 truncate">{user?.name || 'Founder'}</div>
          <button type="button" onClick={onLogout} className="text-xs text-slate-500 hover:text-brand-red">Sign out</button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center gap-4 px-6 shrink-0">
          <div className="relative flex-1 max-w-xl">
            <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search messages, campaigns, meetings, videos…"
              aria-label="Search founder dashboard"
              className="w-full bg-slate-100 rounded-xl px-4 py-2 text-sm text-slate-800 placeholder-slate-400 outline-none focus:ring-2 focus:ring-brand-red/30" />
            {q.trim().length >= 2 && (
              <div role="listbox" className="absolute z-20 mt-2 w-full bg-white border border-slate-200 rounded-xl shadow-lg max-h-80 overflow-y-auto">
                {results.length ? results.map((r) => (
                  <Link key={r.key} to={`/founder/${r.screen}`} onClick={() => setQ('')} role="option" aria-selected="false"
                    className="flex gap-3 px-4 py-2.5 text-sm hover:bg-slate-50">
                    <span className="text-[11px] font-semibold text-slate-400 w-20 shrink-0">{r.kind}</span>
                    <span className="text-slate-700 truncate">{r.text}</span>
                  </Link>
                )) : <div className="px-4 py-3 text-sm text-slate-500">No matches.</div>}
              </div>
            )}
          </div>
          <span className="hidden md:inline text-xs text-slate-400">{synced ? `Synced ${timeAgo(synced)}` : 'Not synced yet'}</span>
          <PanelToggle activeNav="founder" setActiveNav={setActiveNav} light />
        </header>
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}

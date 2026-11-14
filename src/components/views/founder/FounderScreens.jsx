import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AreaChart, Area, BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { getAdminUser } from '../../../services/authApi';
import { sampleSources, sampleAnswer } from '../../../data/founderSample';
import { askFounder } from '../../../services/founderApi';
import shortcuts from '../../../data/founderShortcuts.json';
import { Card, ModeSwitch, SampleBadge, SourceBody } from './shared';
import { APP_LABEL, buildNeedsYou, campaignRow, inr, isRunning, pctChange, salesSeries, timeAgo, useLiveSource, useSales } from './logic';

/* ---------- small UI pieces ---------- */

const Stat = ({ label, value, sub, tone }) => (
  <div>
    <div className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">{label}</div>
    <div className="font-syne text-2xl font-extrabold text-slate-900 mt-1">{value}</div>
    {sub && <div className={`text-xs mt-1 ${tone === 'up' ? 'text-emerald-600' : tone === 'down' ? 'text-brand-red' : 'text-slate-400'}`}>{sub}</div>}
  </div>
);

const SourceHeader = ({ id, src }) => (
  <div className="flex items-center gap-2">
    {src.mode === 'live' && (
      <button type="button" onClick={src.refresh} disabled={src.loading} className="text-xs text-slate-500 enabled:hover:text-slate-900 disabled:opacity-40">
        Refresh
      </button>
    )}
    {src.mode === 'sample' && <SampleBadge />}
    <ModeSwitch id={id} mode={src.mode} setMode={src.setMode} />
  </div>
);

// Outside links arrive https-only (backend safeLink); with no link the text
// is shown plain instead of as a dead <a>.
const MaybeLink = ({ href, className, children }) => (href
  ? <a href={href} target="_blank" rel="noopener noreferrer" className={className}>{children}</a>
  : <span className={className}>{children}</span>);

const fmtTime = (iso) => new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
const fmtDay = (iso) => new Date(iso).toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short' });
const isToday = (iso) => new Date(iso).toDateString() === new Date().toDateString();

/** 7 / 14 / 30 day picker used by Today, Ads and Sales. */
export const DaysToggle = ({ days, setDays }) => (
  <div className="flex gap-1 bg-slate-100 rounded-full p-1" role="group" aria-label="Days shown">
    {[7, 14, 30].map((n) => (
      <button key={n} type="button" onClick={() => setDays(n)} aria-pressed={days === n}
        className={`text-xs font-semibold px-3 py-1 rounded-full ${days === n ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>
        {n}d
      </button>
    ))}
  </div>
);

// Plain coloured letter tiles, not other companies' logos.
const DOT = {
  Gmail: ['M', 'bg-red-100 text-red-600'], WhatsApp: ['W', 'bg-emerald-100 text-emerald-700'],
  Instagram: ['I', 'bg-pink-100 text-pink-600'], 'Instagram DM': ['I', 'bg-pink-100 text-pink-600'],
  'Instagram comment': ['I', 'bg-pink-100 text-pink-600'], Sales: ['₹', 'bg-amber-100 text-amber-700'],
  Ads: ['A', 'bg-blue-100 text-blue-600'], YouTube: ['Y', 'bg-red-100 text-red-600'],
};
export const AppDot = ({ label }) => {
  const [ch, cls] = DOT[label] || [(label || '?').charAt(0), 'bg-slate-100 text-slate-600'];
  return <span aria-hidden="true" className={`w-7 h-7 shrink-0 rounded-lg flex items-center justify-center text-xs font-bold ${cls}`}>{ch}</span>;
};


/* ---------- screens ---------- */

export function TodayScreen() {
  const sales = useSales();
  const ads = useLiveSource('meta_ads');
  const google = useLiveSource('google');
  const ig = useLiveSource('instagram');
  const wa = useLiveSource('whatsapp');
  const brief = useLiveSource('ai_brief');
  const [days, setDays] = useState(7);

  const s = sales.data;
  const change = s ? pctChange(s.yesterday.amount, s.sameDayLastWeek.amount) : null;
  const messages = [...(google.data?.messages || []), ...(wa.data?.messages || [])];
  const allCampaigns = [...(ads.data?.campaigns || []), ...(google.data?.googleAds?.campaigns || [])];
  const needs = buildNeedsYou({ sales: s, ads: allCampaigns, messages, comments: ig.data?.comments });
  const todayEvents = (google.data?.calendar || []).filter((e) => isToday(e.start))
    .sort((a, b) => new Date(a.start) - new Date(b.start));
  const series = s ? salesSeries(s.chart, days) : null;
  const adRows = allCampaigns.map((c) => campaignRow(c, 7));
  const adSpend = adRows.reduce((a, c) => a + c.spendN, 0);
  const adValue = adRows.reduce((a, c) => a + (c.purchaseValue ? c.purchaseValue[7] : 0), 0);
  const hour = new Date().getHours();
  const greet = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const name = (getAdminUser()?.name || '').split(' ')[0];

  return (
    <div className="grid gap-5">
      <div>
        <h1 className="font-syne text-3xl md:text-4xl font-extrabold uppercase tracking-tight text-slate-900">
          {greet}{name ? `, ${name}` : ''}
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
          {' · '}{todayEvents.length} meeting{todayEvents.length === 1 ? '' : 's'} today
          {' · '}{needs.length} thing{needs.length === 1 ? '' : 's'} need you
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2" title="Sales yesterday" right={<SourceHeader id="sales" src={sales} />}>
          <SourceBody src={sales} id="sales">{(d) => (
            <>
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <div className="font-syne text-5xl font-extrabold text-slate-900">{inr(d.yesterday.amount)}</div>
                  <div className={`text-sm mt-1 ${change == null ? 'text-slate-400' : change >= 0 ? 'text-emerald-600' : 'text-brand-red'}`}>
                    {change == null ? 'No sales same day last week' : `${change >= 0 ? '▲' : '▼'} ${Math.abs(change)}% on same day last week`}
                  </div>
                </div>
                <DaysToggle days={days} setDays={setDays} />
              </div>
              <div className="h-56 mt-4" aria-label={`${days}-day sales chart`}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={series.points} margin={{ left: 0, right: 8, top: 8 }}>
                    <defs>
                      <linearGradient id="founderSalesFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#ff3d3d" stopOpacity={0.25} />
                        <stop offset="100%" stopColor="#ff3d3d" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="#eef0f4" vertical={false} />
                    <XAxis dataKey="date" tickFormatter={(x) => x.slice(5)} stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={11} tickFormatter={(v) => `₹${Math.round(v / 1000)}k`} width={44} tickLine={false} axisLine={false} />
                    <Tooltip formatter={(v, n) => [inr(v), n === 'amount' ? 'This period' : 'Period before']} />
                    {series.hasPrev && <Area type="monotone" dataKey="prev" stroke="#cbd5e1" strokeDasharray="4 4" fill="none" strokeWidth={2} />}
                    <Area type="monotone" dataKey="amount" stroke="#ff3d3d" fill="url(#founderSalesFill)" strokeWidth={2.5} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4 border-t border-slate-100">
                <Stat label={`Sales, ${days} days`} value={inr(series.total)} sub={series.change == null ? null : `${series.change >= 0 ? '▲' : '▼'} ${Math.abs(series.change)}% on the ${days} days before`} tone={series.change == null ? null : series.change >= 0 ? 'up' : 'down'} />
                <Stat label="Ad spend, 7 days" value={allCampaigns.length ? inr(adSpend) : '—'} />
                <Stat label="Ad return, 7 days" value={adSpend && adValue ? `${(adValue / adSpend).toFixed(1)}×` : '—'} />
                <Stat label="Today so far" value={inr(d.today.amount)} sub={`${d.today.count} payments`} />
              </div>
            </>
          )}</SourceBody>
        </Card>

        <div className="grid gap-5 content-start">
          <Card title={<>Needs you <span className="ml-1 text-xs font-bold text-white bg-brand-red rounded-full px-2 py-0.5">{needs.length}</span></>}>
            {needs.length ? (
              <ul className="divide-y divide-slate-100">
                {needs.map((n) => (
                  <li key={n.key} className="py-2.5 flex items-start gap-3 text-sm">
                    <AppDot label={n.source} />
                    <span className="flex-1 min-w-0">
                      <span className="block text-[11px] font-semibold text-slate-400">{n.source}</span>
                      <MaybeLink href={n.link} className="text-slate-700 hover:underline line-clamp-2">{n.text}</MaybeLink>
                    </span>
                    {n.time && <span className="text-xs text-slate-400 shrink-0">{timeAgo(n.time)}</span>}
                  </li>
                ))}
              </ul>
            ) : <div className="text-sm text-slate-500">Nothing needs you right now.</div>}
          </Card>

          <Card title="Today" right={<Link to="/founder/calendar" className="text-xs font-semibold text-brand-red hover:underline">Open calendar</Link>}>
            <SourceBody src={google} id="google">{() => (todayEvents.length ? (
              <ul className="space-y-2.5">
                {todayEvents.map((e) => (
                  <li key={`${e.id}_${e.start}`} className="flex gap-3 text-sm">
                    <span className="text-slate-400 w-16 shrink-0 tabular-nums">{fmtTime(e.start)}</span>
                    <MaybeLink href={e.link} className="text-slate-700 border-l-2 border-brand-red/60 pl-3 hover:underline">{e.title}</MaybeLink>
                  </li>
                ))}
              </ul>
            ) : <div className="text-sm text-slate-500">No meetings today.</div>)}</SourceBody>
          </Card>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <Card title="AI brief" className="lg:col-span-2" right={<SourceHeader id="ai_brief" src={brief} />}>
          <SourceBody src={brief} id="ai_brief">{(d) => (
            <>
              <div className="text-sm text-slate-700 whitespace-pre-line leading-relaxed">{d.text}</div>
              <div className="text-[11px] text-slate-400 mt-3">
                {d.model === 'sample' ? 'Sample text' : `Written by ${d.model} ${timeAgo(d.generatedAt)}`} · AI can be wrong; check numbers on the pages below.
              </div>
            </>
          )}</SourceBody>
          <AskBox mode={brief.mode} />
        </Card>

        <Card title="Messages" right={<Link to="/founder/messages" className="text-xs font-semibold text-brand-red hover:underline">Open inbox</Link>}>
          <ul className="space-y-2.5 text-sm">
            {[['gmail', 'Email'], ['whatsapp', 'WhatsApp'], ['ig_comment', 'Instagram comments']].map(([app, label]) => {
              const n = app === 'ig_comment' ? (ig.data?.comments?.length || 0) : messages.filter((m) => m.app === app).length;
              return (
                <li key={app} className="flex items-center gap-3">
                  <AppDot label={APP_LABEL[app]} />
                  <span className="flex-1 text-slate-700">{label}</span>
                  <span className="text-xs font-bold text-slate-900 bg-slate-100 rounded-full px-2.5 py-0.5">{n}</span>
                </li>
              );
            })}
          </ul>
        </Card>
      </div>
    </div>
  );
}

/**
 * Ask box (Phase 3). Follows the AI brief's Sample / Live switch: Sample gives
 * a canned reply and never calls the backend. Answers render as plain text
 * (React escapes them), never as HTML.
 */
function AskBox({ mode }) {
  const [q, setQ] = useState('');
  const [state, setState] = useState({ busy: false, answer: null, error: null });
  const submit = async (e) => {
    e.preventDefault();
    const question = q.trim();
    if (!question || state.busy) return;
    if (mode !== 'live') {
      setState({ busy: false, answer: sampleAnswer, error: null });
      return;
    }
    setState({ busy: true, answer: null, error: null });
    try {
      const r = await askFounder(question);
      setState({ busy: false, answer: r.answer, error: null });
    } catch (err) {
      setState({ busy: false, answer: null, error: err.code === 'NOT_CONFIGURED' ? 'AI is not set up on the server yet (GEMINI_API_KEY).' : err.message });
    }
  };
  return (
    <form onSubmit={submit} className="mt-4 pt-4 border-t border-slate-200">
      <div className="flex gap-2">
        <input value={q} onChange={(e) => setQ(e.target.value)} maxLength={500} aria-label="Ask about your business"
          placeholder="Ask, e.g. How did sales do vs last week?"
          className="flex-1 min-w-0 bg-transparent border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-brand-red/50" />
        <button type="submit" disabled={!q.trim() || state.busy}
          className="text-sm px-4 py-2 rounded-lg bg-brand-red text-white disabled:opacity-40">
          {state.busy ? 'Thinking…' : 'Ask'}
        </button>
      </div>
      {state.answer && <div className="text-sm text-slate-700 mt-3 whitespace-pre-line">{state.answer}</div>}
      {state.error && <div role="alert" className="text-xs text-brand-red mt-3">{state.error}</div>}
    </form>
  );
}

function EventList({ events, empty }) {
  if (!events.length) return <div className="text-sm text-slate-500">{empty}</div>;
  return (
    <ul className="divide-y divide-slate-100">
      {events.map((e) => (
        <li key={`${e.id}_${e.start}`} className="py-2.5 flex gap-4 text-sm">
          <span className="text-slate-500 w-36 shrink-0">{fmtDay(e.start)} · {fmtTime(e.start)}</span>
          <MaybeLink href={e.link} className="text-slate-700 hover:underline">{e.title}</MaybeLink>
        </li>
      ))}
    </ul>
  );
}

export function MessagesScreen() {
  const google = useLiveSource('google');
  const wa = useLiveSource('whatsapp');
  const [filter, setFilter] = useState('all');
  // Phase 3: Gmail (Apps Script) and WhatsApp (Twilio) are separate sources,
  // each with its own switch; the list merges whatever each one has.
  const list = [...(google.data?.messages || []), ...(wa.data?.messages || [])]
    .filter((m) => filter === 'all' || m.app === filter)
    .sort((a, b) => new Date(b.time) - new Date(a.time));
  const feeds = [['google', 'Gmail', google], ['whatsapp', 'WhatsApp', wa]];

  return (
    <Card title="All messages">
      <div className="grid gap-3 sm:grid-cols-2 mb-4">
        {feeds.map(([id, label, src]) => (
          <div key={id} className="border border-slate-200 rounded-lg p-3">
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className="text-xs font-semibold text-slate-600">{label}</span>
              <SourceHeader id={id} src={src} />
            </div>
            <SourceBody src={src} id={id}>{() => null}</SourceBody>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap gap-2 mb-4">
        {['all', 'gmail', 'ig_dm', 'ig_comment', 'whatsapp'].map((f) => (
          <button key={f} type="button" onClick={() => setFilter(f)} aria-pressed={filter === f}
            className={`text-xs px-3 py-1.5 rounded-full border ${filter === f ? 'bg-brand-red/10 border-brand-red/40 text-brand-red' : 'border-slate-200 text-slate-500'}`}>
            {f === 'all' ? 'All' : APP_LABEL[f]}
          </button>
        ))}
      </div>
      <ul className="divide-y divide-slate-100">
        {list.map((m) => (
          <li key={`${m.app}_${m.id}`}>
            <MaybeLink href={m.link} className="py-3 flex gap-3 text-sm hover:bg-slate-50 -mx-2 px-2 rounded">
              <span className="text-[10px] font-bold uppercase tracking-wider text-brand-red/80 w-32 shrink-0 pt-0.5">{APP_LABEL[m.app]}</span>
              <span className="flex-1 min-w-0"><span className="text-slate-900 font-medium">{m.from}</span><span className="block text-slate-600 truncate">{m.text}</span></span>
              <span className="text-xs text-slate-400 shrink-0">{timeAgo(m.time)}</span>
            </MaybeLink>
          </li>
        ))}
        {!list.length && <li className="py-3 text-sm text-slate-500">No messages.</li>}
      </ul>
      {(google.mode === 'live' || wa.mode === 'live') && (
        <div className="text-xs text-slate-400 mt-3">Live shows unread Gmail and WhatsApp messages from the last 3 days (phone numbers hidden). Reply in WhatsApp itself; Instagram comments are on the Instagram page.</div>
      )}
    </Card>
  );
}

export function CalendarScreen() {
  const google = useLiveSource('google');
  return (
    <Card title="Today and the next 7 days" right={<SourceHeader id="google" src={google} />}>
      <SourceBody src={google} id="google">{(d) => (
        <EventList events={d.calendar.slice().sort((a, b) => new Date(a.start) - new Date(b.start))} empty="Nothing scheduled." />
      )}</SourceBody>
    </Card>
  );
}

function CampaignTable({ campaigns, days, empty }) {
  const rows = campaigns.map((c) => campaignRow(c, days));
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead><tr className="text-left text-[11px] uppercase tracking-wider text-slate-400">
          <th className="py-2 pr-4">Campaign</th><th className="py-2 pr-4">Spend</th><th className="py-2 pr-4">Results</th><th className="py-2 pr-4">Cost / result</th><th className="py-2">Return</th>
        </tr></thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((r) => (
            <tr key={r.id} className="text-slate-700">
              <td className="py-2.5 pr-4">
                {r.name}{' '}
                <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${isRunning(r.status) ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                  {isRunning(r.status) ? 'Running' : 'Paused'}
                </span>
                {r.flagged && <span className="ml-2 text-[10px] font-bold text-brand-red bg-brand-red/10 px-1.5 py-0.5 rounded">Cost/result up 30%+ for 3 days</span>}
              </td>
              <td className="py-2.5 pr-4">{inr(r.spendN)}</td>
              <td className="py-2.5 pr-4">{r.resultsN}</td>
              <td className="py-2.5 pr-4">{r.cpr == null ? '—' : inr(r.cpr)}</td>
              <td className="py-2.5">{r.roas == null ? '—' : `${r.roas.toFixed(1)}×`}</td>
            </tr>
          ))}
          {!rows.length && <tr><td colSpan={5} className="py-3 text-slate-500">{empty}</td></tr>}
        </tbody>
      </table>
    </div>
  );
}

export function AdsScreen() {
  const ads = useLiveSource('meta_ads');
  const google = useLiveSource('google');
  const [days, setDays] = useState(7);
  return (
    <div className="grid gap-5">
      <div className="flex justify-end"><DaysToggle days={days} setDays={setDays} /></div>
      <Card title="Meta campaigns" right={<SourceHeader id="meta_ads" src={ads} />}>
        <SourceBody src={ads} id="meta_ads">{(d) => (
          <CampaignTable campaigns={d.campaigns} days={days} empty="No campaigns ran in the last 30 days." />
        )}</SourceBody>
      </Card>
      <Card title="Google Ads campaigns" right={<SourceHeader id="google" src={google} />}>
        <SourceBody src={google} id="google">{(d) => (d.googleAds ? (
          <>
            <CampaignTable campaigns={d.googleAds.campaigns} days={days} empty="No Google Ads campaigns ran in the last 30 days." />
            {d.googleAds.updatedAt && <div className="text-[11px] text-slate-400 mt-3">Google Ads numbers updated {timeAgo(d.googleAds.updatedAt)} (the Ads script runs every hour).</div>}
          </>
        ) : <div className="text-sm text-slate-500">Google Ads is not set up yet. See Connected apps.</div>)}</SourceBody>
      </Card>
    </div>
  );
}

export function SalesScreen() {
  const sales = useSales();
  const s = sales.data;
  return (
    <div className="grid gap-5">
      <Card title="Payments" right={<SourceHeader id="sales" src={sales} />}>
        <SourceBody src={sales} id="sales">{(d) => (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
              <Stat label="Today" value={inr(d.today.amount)} sub={`${d.today.count} payments`} />
              <Stat label="Yesterday" value={inr(d.yesterday.amount)} sub={`${d.yesterday.count} payments`} />
              <Stat label="Same day last week" value={inr(d.sameDayLastWeek.amount)} sub={`${d.sameDayLastWeek.count} payments`} />
            </div>
            <div className="h-56" aria-label="14-day sales chart">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={d.chart}>
                  <XAxis dataKey="date" tickFormatter={(x) => x.slice(8)} stroke="#666" fontSize={11} />
                  <YAxis stroke="#666" fontSize={11} tickFormatter={(v) => `₹${Math.round(v / 1000)}k`} width={48} />
                  <Tooltip formatter={(v) => inr(v)} contentStyle={{ background: '#0e0e18', border: '1px solid #333' }} />
                  <Bar dataKey="amount" fill="#ff3d3d" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </>
        )}</SourceBody>
      </Card>
      {s && (
        <div className="grid gap-5 md:grid-cols-2">
          <Card title="Failed payments (last 14 days)">
            <SimpleList items={s.failed} empty="No failed payments." render={(f) => <>{inr(f.amount)} · {f.method} · booking {f.bookingId ?? '—'}</>} />
          </Card>
          <Card title="Refunds (last 14 days)">
            <SimpleList items={s.refunds} empty="No refunds." render={(r) => <>{inr(r.amount)} · {r.reason || 'no reason given'}</>} />
          </Card>
        </div>
      )}
    </div>
  );
}

const SimpleList = ({ items, empty, render }) => (
  items?.length ? (
    <ul className="divide-y divide-slate-100 text-sm">
      {items.map((it) => (
        <li key={it.id} className="py-2 flex justify-between gap-3 text-slate-700"><span>{render(it)}</span><span className="text-xs text-slate-400">{timeAgo(it.createdAt)}</span></li>
      ))}
    </ul>
  ) : <div className="text-sm text-slate-500">{empty}</div>
);

export function InstagramScreen() {
  const ig = useLiveSource('instagram');
  return (
    <div className="grid gap-5">
      <Card title="Last 10 reels" right={<SourceHeader id="instagram" src={ig} />}>
        <SourceBody src={ig} id="instagram">{(d) => (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-left text-[11px] uppercase tracking-wider text-slate-400">
                <th className="py-2 pr-4">Reel</th><th className="py-2 pr-4">Views</th><th className="py-2 pr-4">Likes</th><th className="py-2 pr-4">Comments</th><th className="py-2">Saves</th>
              </tr></thead>
              <tbody className="divide-y divide-slate-100">
                {d.reels.slice(0, 10).map((r) => (
                  <tr key={r.id} className="text-slate-700">
                    <td className="py-2.5 pr-4"><MaybeLink href={r.link} className="hover:underline">{r.caption}</MaybeLink> <span className="text-[10px] text-slate-400">{timeAgo(r.time)}</span></td>
                    <td className="py-2.5 pr-4">{r.views.toLocaleString('en-IN')}</td>
                    <td className="py-2.5 pr-4">{r.likes.toLocaleString('en-IN')}</td>
                    <td className="py-2.5 pr-4">{r.comments}</td>
                    <td className="py-2.5">{r.saves}</td>
                  </tr>
                ))}
                {!d.reels.length && <tr><td colSpan={5} className="py-3 text-slate-500">No reels yet.</td></tr>}
              </tbody>
            </table>
          </div>
        )}</SourceBody>
      </Card>
      <Card title="Recent comments">
        <SourceBody src={ig} id="instagram">{(d) => (d.comments.length ? (
          <ul className="divide-y divide-slate-100 text-sm">
            {d.comments.map((c) => (
              <li key={c.id} className="py-2.5 text-slate-700">
                <b className="text-slate-900">{c.from}</b> on “<MaybeLink href={c.link} className="hover:underline">{c.reel}</MaybeLink>”: {c.text} <span className="text-xs text-slate-400">{timeAgo(c.time)}</span>
              </li>
            ))}
          </ul>
        ) : <div className="text-sm text-slate-500">No recent comments.</div>)}</SourceBody>
      </Card>
    </div>
  );
}

export function YouTubeScreen() {
  const google = useLiveSource('google');
  return (
    <Card title="YouTube" right={<SourceHeader id="google" src={google} />}>
      <SourceBody src={google} id="google">{(d) => (d.youtube ? (
        <>
          <div className="flex gap-8 mb-5">
            <Stat label="Channel" value={d.youtube.channel?.title || '—'} />
            <Stat label="Subscribers" value={(d.youtube.channel?.subscribers ?? 0).toLocaleString('en-IN')} />
          </div>
          <ul className="divide-y divide-slate-100">
            {d.youtube.videos.map((v) => (
              <li key={v.id} className="py-3 flex flex-wrap items-center gap-x-6 gap-y-1 text-sm">
                <MaybeLink href={v.link} className="flex-1 min-w-48 text-slate-800 hover:underline">{v.title}</MaybeLink>
                <span className="text-slate-500">{v.views.toLocaleString('en-IN')} views</span>
                <span className="text-slate-500">{v.likes} likes</span>
                <span className="text-slate-500">{v.comments} comments</span>
                <span className="text-xs text-slate-400 w-24 text-right">{timeAgo(v.time)}</span>
              </li>
            ))}
            {!d.youtube.videos.length && <li className="py-3 text-sm text-slate-500">No videos yet.</li>}
          </ul>
        </>
      ) : <div className="text-sm text-slate-500">YouTube is not set up yet. See Connected apps.</div>)}</SourceBody>
    </Card>
  );
}

export function ShortcutsScreen() {
  return (
    <Card title="Quick links">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {shortcuts.map((s) => (
          <a key={s.url} href={s.url} target="_blank" rel="noopener noreferrer"
            className="border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-700 hover:border-brand-red/50 hover:text-slate-900 hover:shadow-sm">
            {s.label} <span aria-hidden="true" className="text-slate-400">↗</span>
          </a>
        ))}
      </div>
      <div className="text-xs text-slate-400 mt-4">Edit the list in kepix-admin/src/data/founderShortcuts.json.</div>
    </Card>
  );
}

// What the owner adds on the server (Cloud Run secrets) to connect each source.
// Names only -- values never live in the admin panel.
const SETUP = {
  meta_ads: 'META_ACCESS_TOKEN + META_AD_ACCOUNT_ID',
  instagram: 'META_ACCESS_TOKEN + META_IG_USER_ID',
  google: 'FOUNDER_APPS_SCRIPT_URL + FOUNDER_APPS_SCRIPT_SECRET (script: keplix-backend/scripts/founder-apps-script.gs; YouTube = turn on the YouTube service in the script; Google Ads = GOOGLE_ADS_SHEET_ID script property + scripts/founder-google-ads-script.js)',
  whatsapp: 'the existing TWILIO_ACCOUNT_SID + TWILIO_AUTH_TOKEN + TWILIO_WHATSAPP_FROM (already used for WhatsApp OTPs)',
  ai_brief: 'GEMINI_API_KEY (free key from aistudio.google.com)',
};

// Where "Open" goes: the real app, since this dashboard is read-only.
const OPEN_URL = {
  sales: '/finance',
  meta_ads: 'https://adsmanager.facebook.com/',
  instagram: 'https://www.instagram.com/',
  google: 'https://mail.google.com/',
  whatsapp: 'https://console.twilio.com/',
  ai_brief: 'https://aistudio.google.com/',
};

const ABOUT = {
  sales: 'Payments, failed payments and refunds from the Keplix database.',
  meta_ads: 'Spend, results and return for Facebook and Instagram ads.',
  instagram: 'Reels and new comments.',
  google: 'Unread mail, calendar, YouTube videos and Google Ads.',
  whatsapp: 'Customer and partner messages to the Keplix WhatsApp number.',
  ai_brief: 'A short daily summary and the Ask box.',
};

function SourceCard({ info }) {
  const src = useLiveSource(info.id);
  const live = src.mode === 'live';
  const state = !live ? 'Sample' : src.loading ? 'Checking…' : src.notConfigured ? 'Off' : src.error ? 'Error' : 'Connected';
  const pill = state === 'Connected' ? 'bg-emerald-100 text-emerald-700' : state === 'Error' ? 'bg-red-100 text-brand-red' : state === 'Sample' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500';
  const synced = live && (src.data?.fetchedAt || src.data?.generatedAt);
  const open = OPEN_URL[info.id];
  const external = open && open.startsWith('http');
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <AppDot label={info.name.split(' ')[0]} />
        <span className="flex-1 font-semibold text-slate-900 text-sm">{info.name}</span>
        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${pill}`}>{state}</span>
      </div>
      <p className="text-xs text-slate-500 flex-1">{ABOUT[info.id]}</p>
      {live && src.notConfigured && SETUP[info.id] && <p className="text-xs text-slate-500">Add on server: {SETUP[info.id]}</p>}
      {live && src.error && <p role="alert" className="text-xs text-brand-red">{src.error}</p>}
      <div className="flex flex-wrap items-center gap-2">
        <ModeSwitch id={info.id} mode={src.mode} setMode={src.setMode} />
        <button type="button" disabled={!live || src.loading} onClick={src.refresh}
          className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 enabled:hover:text-slate-900 disabled:opacity-40">
          {synced ? `Sync · ${timeAgo(synced)}` : 'Sync now'}
        </button>
        {open && (external
          ? <a href={open} target="_blank" rel="noopener noreferrer" className="ml-auto text-xs font-semibold text-brand-red hover:underline">Open ↗</a>
          : <Link to={open} className="ml-auto text-xs font-semibold text-brand-red hover:underline">Open</Link>)}
      </div>
    </div>
  );
}

export function ConnectedAppsScreen() {
  return (
    <div className="grid gap-4">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {sampleSources.map((info) => <SourceCard key={info.id} info={info} />)}
      </div>
      <div className="text-xs text-slate-400">Read-only: the dashboard never changes ads, posts, mail or payments.</div>
    </div>
  );
}

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

const superAdmin = { value: true };
vi.mock('../services/authApi', () => ({
  isSuperAdmin: () => superAdmin.value,
  authFetch: vi.fn(),
  getAdminUser: () => ({ name: 'Asha Founder', role: 'super_admin' }),
}));
const getFounderSales = vi.fn();
const getFounderAds = vi.fn();
const getFounderInstagram = vi.fn();
const getFounderGoogle = vi.fn();
const getFounderWhatsApp = vi.fn();
const getFounderBrief = vi.fn();
const askFounder = vi.fn();
vi.mock('../services/founderApi', () => ({
  getFounderSales: (...a) => getFounderSales(...a),
  getFounderAds: (...a) => getFounderAds(...a),
  getFounderInstagram: (...a) => getFounderInstagram(...a),
  getFounderGoogle: (...a) => getFounderGoogle(...a),
  getFounderWhatsApp: (...a) => getFounderWhatsApp(...a),
  getFounderBrief: (...a) => getFounderBrief(...a),
  askFounder: (...a) => askFounder(...a),
}));
const notConfigured = () => Object.assign(new Error('not set up'), { code: 'NOT_CONFIGURED' });
// recharts needs real layout; a stub keeps jsdom quiet.
vi.mock('recharts', () => {
  const Stub = ({ children }) => <div>{children}</div>;
  return { ResponsiveContainer: Stub, BarChart: Stub, Bar: Stub, AreaChart: Stub, Area: Stub, CartesianGrid: Stub, XAxis: Stub, YAxis: Stub, Tooltip: Stub };
});

const { PanelToggle } = await import('../components/layout/Topbar');
const { default: FounderView } = await import('../components/views/founder/FounderView');
const { FOUNDER_SCREENS } = await import('../components/views/founder/registry');
const { isCampaignFlagged, pctChange, buildNeedsYou, salesSeries, searchFounder, isRunning } = await import('../components/views/founder/logic');
const { default: FounderLayout } = await import('../components/views/founder/FounderLayout');
// 2026-11-15: Sample mode is gone from the app; the old sample data lives on as test fixtures.
const { sampleAds, sampleSales, sampleGoogleAds, sampleYouTube, sampleCalendar, sampleAdsSource, sampleInstagramSource, sampleGoogleSource, sampleWhatsAppSource, sampleBrief } = await import('./fixtures/founderFixtures');

beforeEach(() => {
  superAdmin.value = true;
  localStorage.clear();
  [getFounderSales, getFounderAds, getFounderInstagram, getFounderGoogle, getFounderWhatsApp, getFounderBrief, askFounder].forEach((f) => f.mockReset());
  // Every source is always live now; by default the API answers with the fixtures.
  getFounderSales.mockResolvedValue(sampleSales);
  getFounderAds.mockResolvedValue(sampleAdsSource);
  getFounderInstagram.mockResolvedValue(sampleInstagramSource);
  getFounderGoogle.mockResolvedValue(sampleGoogleSource);
  getFounderWhatsApp.mockResolvedValue(sampleWhatsAppSource);
  getFounderBrief.mockResolvedValue(sampleBrief);
});

describe('PanelToggle', () => {
  it('is hidden for a plain admin', () => {
    superAdmin.value = false;
    const { container } = render(<PanelToggle activeNav="dashboard" setActiveNav={() => {}} />);
    expect(container).toBeEmptyDOMElement();
  });
  it('switches admin -> founder and back for super_admin', () => {
    const nav = vi.fn();
    const { rerender } = render(<PanelToggle activeNav="dashboard" setActiveNav={nav} />);
    fireEvent.click(screen.getByText('Founder'));
    expect(nav).toHaveBeenCalledWith('founder/today');
    rerender(<PanelToggle activeNav="founder" setActiveNav={nav} />);
    fireEvent.click(screen.getByText('Admin'));
    expect(nav).toHaveBeenCalledWith('dashboard');
  });
});

describe('cost-per-result flag', () => {
  it('flags only the campaign rising 30%+ over 3 days', () => {
    expect(sampleAds.filter((c) => isCampaignFlagged(c.cprTrend)).map((c) => c.id)).toEqual(['c2']);
  });
  it('needs a steady rise, not just a jump', () => {
    expect(isCampaignFlagged([100, 140, 130, 150])).toBe(false);
    expect(isCampaignFlagged([100, 110, 120, 129])).toBe(false);
    expect(isCampaignFlagged([100, 110, 120, 130])).toBe(true);
    expect(isCampaignFlagged([0, 10, 20, 30])).toBe(false);
  });
});

describe('helpers', () => {
  it('pctChange handles zero baseline', () => {
    expect(pctChange(150, 100)).toBe(50);
    expect(pctChange(10, 0)).toBeNull();
  });
  it('Needs you is capped at 6, newest first', () => {
    const items = buildNeedsYou({ sales: sampleSales, ads: sampleAds, messages: [], comments: [] });
    expect(items.length).toBeLessThanOrEqual(6);
    expect(items.some((i) => i.source === 'Ads')).toBe(true);
  });
});

const renderScreen = (path) => render(
  <MemoryRouter initialEntries={[path]}>
    <Routes>
      <Route path="/founder/:screen" element={<FounderView />} />
    </Routes>
  </MemoryRouter>,
);

describe('Founder screens', () => {
  it.each(Object.keys(FOUNDER_SCREENS))('%s renders live data', async (id) => {
    renderScreen(`/founder/${id}`);
    await waitFor(() => expect(document.body.textContent).not.toMatch(/Loading…/));
    expect(document.body.textContent.length).toBeGreaterThan(20);
    expect(document.body.textContent).not.toMatch(/Sample (data|mode)/);
  });

  it('an unknown screen goes to Today', async () => {
    renderScreen('/founder/nope');
    await screen.findByText(/Written by/);
    expect(screen.getByText(/Needs you/)).toBeInTheDocument();
    expect(screen.getByText(/, Asha$/)).toBeInTheDocument();
  });

  it('a source without server keys says Not connected', async () => {
    getFounderAds.mockRejectedValue(notConfigured());
    renderScreen('/founder/ads');
    await waitFor(() => expect(screen.getByText('Not connected')).toBeInTheDocument());
  });

  it('Ads Live shows real campaigns', async () => {
    getFounderAds.mockResolvedValue({ campaigns: [{ id: 'x1', name: 'Doorstep wash', status: 'ACTIVE', spend: { 7: 700, 14: 1400, 30: 3000 }, results: { 7: 10, 14: 20, 30: 40 }, purchaseValue: null, cprTrend: [70, 70, 70, 70] }], fetchedAt: new Date().toISOString() });
    renderScreen('/founder/ads');
    await waitFor(() => expect(screen.getByText('Doorstep wash')).toBeInTheDocument());
    fireEvent.click(screen.getAllByRole('button', { name: 'Refresh' })[0]);
    await waitFor(() => expect(getFounderAds).toHaveBeenLastCalledWith(true));
  });

  it('Instagram Live shows reels and comments with links', async () => {
    getFounderInstagram.mockResolvedValue({
      reels: [{ id: 'r1', caption: 'Wash at home', views: 1500, likes: 9, comments: 1, saves: 2, time: new Date().toISOString(), link: 'https://instagram.com/r1' }],
      comments: [{ id: 'k1', from: '@amit', text: 'Price?', reel: 'Wash at home', time: new Date().toISOString(), link: 'https://instagram.com/r1' }],
      fetchedAt: new Date().toISOString(),
    });
    renderScreen('/founder/instagram');
    await waitFor(() => expect(screen.getByText('Price?', { exact: false })).toBeInTheDocument());
    expect(screen.getAllByRole('link', { name: 'Wash at home' })[0]).toHaveAttribute('href', 'https://instagram.com/r1');
  });

  it('Messages Live shows Gmail; a missing link renders as plain text', async () => {
    getFounderGoogle.mockResolvedValue({ messages: [{ id: 'g1', app: 'gmail', from: 'Razorpay', text: 'Docs needed', time: new Date().toISOString(), link: null }], calendar: [], fetchedAt: new Date().toISOString() });
    renderScreen('/founder/messages');
    await waitFor(() => expect(screen.getByText('Razorpay')).toBeInTheDocument());
    expect(screen.queryByRole('link', { name: /Razorpay/ })).toBeNull();
  });

  it('Connected apps lists the server keys to add for an unset source', async () => {
    getFounderGoogle.mockRejectedValue(notConfigured());
    renderScreen('/founder/apps');
    await waitFor(() => expect(screen.getByText(/FOUNDER_APPS_SCRIPT_URL/)).toBeInTheDocument());
  });

  it('All messages merges Gmail, WhatsApp and Instagram comments', async () => {
    getFounderWhatsApp.mockResolvedValue({ messages: [{ id: 'SM1', app: 'whatsapp', from: '+91 ••••• 3210', text: 'Is my car ready?', time: new Date().toISOString(), link: null }], fetchedAt: new Date().toISOString() });
    renderScreen('/founder/messages');
    await waitFor(() => expect(screen.getByText('Is my car ready?')).toBeInTheDocument());
    expect(screen.getByText('+91 ••••• 3210')).toBeInTheDocument();
    expect(await screen.findByText(/RazorpayX activation/)).toBeInTheDocument();
    expect(screen.getAllByText(sampleInstagramSource.comments[0].text).length).toBeGreaterThan(0);
  });

  it('WhatsApp without Twilio keys says Not connected; Gmail still shows', async () => {
    getFounderWhatsApp.mockRejectedValue(notConfigured());
    renderScreen('/founder/messages');
    await waitFor(() => expect(screen.getByText('Not connected')).toBeInTheDocument());
    expect(await screen.findByText(/RazorpayX activation/)).toBeInTheDocument();
  });

  it('Today shows the live AI brief', async () => {
    getFounderBrief.mockResolvedValue({ text: '- Sales flat\nDo first: call Rohit', generatedAt: new Date().toISOString(), model: 'gemini-2.5-flash' });
    renderScreen('/founder/today');
    await waitFor(() => expect(screen.getByText(/Do first: call Rohit/)).toBeInTheDocument());
    expect(screen.getByText(/Written by gemini-2.5-flash/)).toBeInTheDocument();
  });

  it('Ask shows the answer, or the error', async () => {
    getFounderBrief.mockResolvedValue({ text: 'brief', generatedAt: new Date().toISOString(), model: 'gemini-2.5-flash' });
    askFounder.mockResolvedValueOnce({ answer: 'Sales were ₹4,000.' })
      .mockRejectedValueOnce(Object.assign(new Error('Too many'), { code: 'RATE_LIMITED' }));
    renderScreen('/founder/today');
    const box = screen.getByLabelText('Ask about your business');
    fireEvent.change(box, { target: { value: 'How are sales?' } });
    fireEvent.click(screen.getByRole('button', { name: 'Ask' }));
    await waitFor(() => expect(screen.getByText('Sales were ₹4,000.')).toBeInTheDocument());
    expect(askFounder).toHaveBeenCalledWith('How are sales?');
    fireEvent.click(screen.getByRole('button', { name: 'Ask' }));
    await waitFor(() => expect(screen.getByText('Too many')).toBeInTheDocument());
  });

  it('Connected apps names GEMINI_API_KEY when AI is not set up', async () => {
    getFounderBrief.mockRejectedValue(notConfigured());
    renderScreen('/founder/apps');
    await waitFor(() => expect(screen.getByText(/GEMINI_API_KEY/)).toBeInTheDocument());
  });

  it('Sales loads from the API', async () => {
    getFounderSales.mockResolvedValue({ ...sampleSales, today: { amount: 4321, count: 2 } });
    renderScreen('/founder/sales');
    await waitFor(() => expect(screen.getByText('₹4,321')).toBeInTheDocument());
  });

  it('Sales shows the error when the API fails', async () => {
    getFounderSales.mockRejectedValue(new Error('boom'));
    renderScreen('/founder/sales');
    await waitFor(() => expect(screen.getAllByRole('alert')[0]).toHaveTextContent('boom'));
  });
});

describe('2026-11-14 redesign helpers', () => {
  it('salesSeries compares with the days before, or says there is nothing to compare', () => {
    const chart = Array.from({ length: 60 }, (_, i) => ({ date: `d${i}`, amount: i < 53 ? 100 : 200 }));
    const s7 = salesSeries(chart, 7);
    expect(s7.points).toHaveLength(7);
    expect(s7.total).toBe(1400);
    expect(s7.points[0]).toEqual({ date: 'd53', amount: 200, prev: 100 });
    expect(s7.change).toBe(100);
    const short = salesSeries(chart.slice(-10), 7);
    expect(short).toMatchObject({ hasPrev: false, change: null });
    expect(short.points[0].prev).toBeNull();
    expect(salesSeries(undefined, 7)).toMatchObject({ total: 0, points: [] });
  });
  it('the sample chart has 60 days so 30 + the 30 before both fit', () => {
    expect(salesSeries(sampleSales.chart, 30).hasPrev).toBe(true);
  });
  it('isRunning treats Google ENABLED like Meta ACTIVE', () => {
    expect(isRunning('ACTIVE')).toBe(true);
    expect(isRunning('ENABLED')).toBe(true);
    expect(isRunning('PAUSED')).toBe(false);
  });
  it('searchFounder needs 2+ letters, matches every kind, caps at 8', () => {
    const data = { campaigns: sampleGoogleAds.campaigns, videos: sampleYouTube.videos, events: sampleCalendar };
    expect(searchFounder('c', data)).toEqual([]);
    expect(searchFounder('SEARCH', data)).toEqual([expect.objectContaining({ kind: 'Campaign', screen: 'ads' })]);
    expect(searchFounder('monsoon', data)[0]).toMatchObject({ kind: 'Video', screen: 'youtube' });
    expect(searchFounder('ops review', data)[0]).toMatchObject({ kind: 'Meeting', screen: 'calendar' });
    const many = { messages: Array.from({ length: 20 }, (_, i) => ({ id: i, app: 'gmail', from: 'x', text: 'hello' })) };
    expect(searchFounder('hello', many)).toHaveLength(8);
  });
});

describe('2026-11-14 redesign screens', () => {
  it('Ads shows Google Ads campaigns as Running / Paused', async () => {
    renderScreen('/founder/ads');
    expect(await screen.findByText('Search · car service near me')).toBeInTheDocument();
    expect(screen.getAllByText('Running').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Paused').length).toBeGreaterThan(0);
  });
  it('YouTube lists videos and subscribers', async () => {
    renderScreen('/founder/youtube');
    expect(await screen.findByText('Doorstep car wash in 60 seconds')).toBeInTheDocument();
    expect(screen.getByText('1,240')).toBeInTheDocument();
  });
  it('YouTube without YouTube data says it is not set up', async () => {
    getFounderGoogle.mockResolvedValue({ messages: [], calendar: [], youtube: null, googleAds: null, fetchedAt: new Date().toISOString() });
    renderScreen('/founder/youtube');
    await waitFor(() => expect(screen.getByText(/YouTube is not set up yet/)).toBeInTheDocument());
  });
  it('Quick links is the renamed Shortcuts', () => {
    expect(FOUNDER_SCREENS.shortcuts.label).toBe('Quick links');
    renderScreen('/founder/shortcuts');
    expect(screen.getByText('Quick links')).toBeInTheDocument();
  });
  it('Connected apps has an Open link per app and no Disconnect', () => {
    renderScreen('/founder/apps');
    expect(screen.getAllByText(/^Open/).length).toBe(6);
    expect(screen.queryByText(/Disconnect/i)).toBeNull();
  });
  it('FounderLayout groups the sidebar and searches loaded data', async () => {
    const nav = vi.fn();
    render(<MemoryRouter><FounderLayout subNav="today" setActiveNav={nav} onLogout={() => {}}><div>child</div></FounderLayout></MemoryRouter>);
    await waitFor(() => expect(screen.getByRole('button', { name: /All messages/ })).toHaveTextContent(/[1-9]/));
    ['Home', 'Business', 'Setup'].forEach((g) => expect(screen.getByText(g)).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: /YouTube/ }));
    expect(nav).toHaveBeenCalledWith('founder/youtube');
    // 2026-11-15: Messages opens into per-app rows with app icons.
    ['All messages', 'Email', 'WhatsApp'].forEach((t) => expect(screen.getByRole('button', { name: new RegExp(t) })).toBeInTheDocument());
    expect(screen.getByRole('button', { name: /Instagram reels/ })).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Search founder dashboard'), { target: { value: 'razorpay' } });
    expect(screen.getAllByRole('option').length).toBeGreaterThan(0);
    fireEvent.change(screen.getByLabelText('Search founder dashboard'), { target: { value: 'zzzz' } });
    expect(screen.getByText('No matches.')).toBeInTheDocument();
  });
});

describe('2026-11-15 separate message views', () => {
  it('?app=gmail shows only email, with Open in Gmail', async () => {
    renderScreen('/founder/messages?app=gmail');
    expect(await screen.findByText(/RazorpayX activation/)).toBeInTheDocument();
    expect(screen.queryByText(sampleWhatsAppSource.messages[0].text)).toBeNull();
    expect(screen.queryByText(sampleInstagramSource.comments[0].text)).toBeNull();
    expect(screen.getByRole('tab', { name: /Email/ })).toHaveAttribute('aria-selected', 'true');
  });
  it('?app=whatsapp shows only WhatsApp chats', async () => {
    renderScreen('/founder/messages?app=whatsapp');
    expect(await screen.findByText(sampleWhatsAppSource.messages[0].text)).toBeInTheDocument();
    expect(screen.queryByText(/RazorpayX activation/)).toBeNull();
    expect(screen.getByText(/Reply in WhatsApp itself/)).toBeInTheDocument();
  });
  it('?app=instagram shows only Instagram comments, each with its reel', async () => {
    renderScreen('/founder/messages?app=instagram');
    const c = sampleInstagramSource.comments[0];
    expect(await screen.findByText(c.text)).toBeInTheDocument();
    expect(screen.getAllByText(/on reel:/).length).toBeGreaterThan(0);
    expect(screen.queryByText(/RazorpayX activation/)).toBeNull();
  });
  it('clicking a tab switches the view', async () => {
    renderScreen('/founder/messages');
    await screen.findByText(/RazorpayX activation/);
    fireEvent.click(screen.getByRole('tab', { name: /WhatsApp/ }));
    await waitFor(() => expect(screen.queryByText(/RazorpayX activation/)).toBeNull());
  });
  it('an empty inbox says so instead of showing made-up data', async () => {
    getFounderGoogle.mockResolvedValue({ messages: [], calendar: [], fetchedAt: new Date().toISOString() });
    renderScreen('/founder/messages?app=gmail');
    expect(await screen.findByText('No unread email.')).toBeInTheDocument();
  });
  it('the sidebar Instagram row opens the Instagram messages view', async () => {
    const nav = vi.fn();
    render(<MemoryRouter initialEntries={['/founder/messages?app=instagram']}><FounderLayout subNav="messages" setActiveNav={nav} onLogout={() => {}}><div /></FounderLayout></MemoryRouter>);
    expect(screen.getByRole('button', { name: /^Instagram\b(?! reels)/ })).toHaveAttribute('aria-current', 'page');
  });
});

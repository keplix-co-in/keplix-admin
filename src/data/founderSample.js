/**
 * Founder dashboard SAMPLE data (2026-11-14). Every number and name below is
 * made up, so the owner can click every Founder screen before any account is
 * connected. A source flips to real data with its Sample / Live switch; see
 * useSourceMode in components/views/founder/shared.jsx.
 *
 * Dates are generated relative to "now" so the sample never looks stale.
 */

const now = Date.now();
const H = 60 * 60 * 1000;
const D = 24 * H;
const iso = (offsetMs) => new Date(now + offsetMs).toISOString();

const dayKey = (offsetDays) => new Date(now + offsetDays * D).toISOString().slice(0, 10);
// 60 days (redesign 2026-11-14) so the chart can compare 7/14/30 days with
// the period before. The last 14 values are the original sample.
const last14 = [8200, 9100, 7600, 10400, 11800, 9900, 12600, 8800, 9700, 11200, 13400, 12100, 14300, 6200];
const chartAmounts = [
  ...Array.from({ length: 46 }, (_, i) => Math.round(7000 + 2500 * Math.sin(i / 3) + i * 40)),
  ...last14,
];

export const sampleSales = {
  today: { amount: 6200, count: 7 },
  yesterday: { amount: 14300, count: 15 },
  sameDayLastWeek: { amount: 12600, count: 13 },
  chart: chartAmounts.map((amount, i) => ({ date: dayKey(i - 59), amount, count: Math.round(amount / 900) })),
  failed: [
    { id: 9001, amount: 1199, method: 'upi', bookingId: 4411, createdAt: iso(-3 * H) },
    { id: 9002, amount: 649, method: 'card', bookingId: 4407, createdAt: iso(-20 * H) },
  ],
  refunds: [
    { id: 701, paymentId: 8890, amount: 899, status: 'processed', reason: 'Customer cancelled', createdAt: iso(-26 * H) },
  ],
};

export const sampleAds = [
  { id: 'c1', name: 'Car wash – Delhi NCR', status: 'ACTIVE', spend: { 7: 4200, 14: 8100, 30: 16900 }, results: { 7: 61, 14: 120, 30: 251 }, purchaseValue: { 7: 21400, 14: 40100, 30: 83000 }, cprTrend: [62, 66, 70, 71] },
  { id: 'c2', name: 'Bike service – Gurgaon', status: 'ACTIVE', spend: { 7: 2600, 14: 5000, 30: 9800 }, results: { 7: 22, 14: 51, 30: 112 }, purchaseValue: { 7: 6100, 14: 14200, 30: 30900 }, cprTrend: [88, 104, 118, 126] },
  { id: 'c3', name: 'Vendor sign-ups', status: 'PAUSED', spend: { 7: 0, 14: 1200, 30: 3900 }, results: { 7: 0, 14: 9, 30: 31 }, purchaseValue: null, cprTrend: [130, 128, 133, 0] },
];

export const sampleMessages = [
  { id: 'm1', app: 'whatsapp', from: 'Rohit (Shine Auto)', text: 'Payout for last week not received yet?', time: iso(-25 * 60 * 1000), link: 'https://web.whatsapp.com/' },
  { id: 'm2', app: 'gmail', from: 'Razorpay Support', text: 'Re: RazorpayX activation – documents needed', time: iso(-2 * H), link: 'https://mail.google.com/' },
  { id: 'm3', app: 'ig_comment', from: '@delhi_drives', text: 'Do you cover Noida sector 62?', time: iso(-3 * H), link: 'https://www.instagram.com/' },
  { id: 'm4', app: 'ig_dm', from: '@carcare_pro', text: 'Want to list my workshop, how?', time: iso(-5 * H), link: 'https://www.instagram.com/direct/inbox/' },
  { id: 'm5', app: 'gmail', from: 'Google Play Console', text: 'Your app update is live', time: iso(-9 * H), link: 'https://mail.google.com/' },
  { id: 'm6', app: 'whatsapp', from: 'Priya', text: 'Booking 4411 customer wants to reschedule', time: iso(-11 * H), link: 'https://web.whatsapp.com/' },
];

export const sampleCalendar = [
  { id: 'e1', title: 'Vendor onboarding call – Speed Motors', start: iso(2 * H), end: iso(2.5 * H), link: 'https://calendar.google.com/' },
  { id: 'e2', title: 'Weekly ops review', start: iso(5 * H), end: iso(6 * H), link: 'https://calendar.google.com/' },
  { id: 'e3', title: 'Investor intro (Zoom)', start: iso(D + 3 * H), end: iso(D + 4 * H), link: 'https://calendar.google.com/' },
  { id: 'e4', title: 'Razorpay account manager', start: iso(3 * D + H), end: iso(3 * D + 1.5 * H), link: 'https://calendar.google.com/' },
];

export const sampleReels = [
  { id: 'r1', caption: '60-second car wash at your door', views: 18400, likes: 920, comments: 41, saves: 133, time: iso(-1 * D) },
  { id: 'r2', caption: 'Monsoon bike check – 5 things', views: 9200, likes: 410, comments: 18, saves: 77, time: iso(-3 * D) },
  { id: 'r3', caption: 'Meet a Keplix partner workshop', views: 5100, likes: 260, comments: 9, saves: 21, time: iso(-5 * D) },
  { id: 'r4', caption: 'How booking works (30s)', views: 12700, likes: 640, comments: 27, saves: 102, time: iso(-8 * D) },
];

export const sampleIgComments = [
  { id: 'ic1', from: '@delhi_drives', text: 'Do you cover Noida sector 62?', reel: '60-second car wash at your door', time: iso(-3 * H) },
  { id: 'ic2', from: '@auto_nerd', text: 'Price for SUV?', reel: '60-second car wash at your door', time: iso(-7 * H) },
];

export const sampleSources = [
  { id: 'sales', name: 'Sales (Keplix database)', phase: 1, liveAvailable: true, lastSync: iso(-4 * 60 * 1000), error: null },
  { id: 'meta_ads', name: 'Meta Ads', phase: 2, liveAvailable: true, lastSync: null, error: null },
  { id: 'instagram', name: 'Instagram', phase: 2, liveAvailable: true, lastSync: null, error: null },
  { id: 'google', name: 'Google (Gmail, Calendar, YouTube, Google Ads)', phase: 2, liveAvailable: true, lastSync: null, error: null },
  { id: 'whatsapp', name: 'WhatsApp (Twilio)', phase: 3, liveAvailable: true, lastSync: null, error: null },
  { id: 'ai_brief', name: 'AI brief + Ask (Gemini)', phase: 3, liveAvailable: true, lastSync: null, error: null },
];

/* Grouped the way each live endpoint answers, so Sample and Live share a shape. */
export const sampleAdsSource = { campaigns: sampleAds };
export const sampleInstagramSource = { reels: sampleReels, comments: sampleIgComments };
// Phase 3: WhatsApp is its own live source (Twilio), so it leaves the Gmail sample.
// Redesign 2026-11-14: YouTube + Google Ads come through the same Apps Script.
export const sampleYouTube = {
  channel: { title: 'Keplix', subscribers: 1240 },
  videos: [
    { id: 'yt1', title: 'Doorstep car wash in 60 seconds', views: 8420, likes: 312, comments: 41, time: iso(-2 * D), link: null },
    { id: 'yt2', title: 'How to book a bike service on Keplix', views: 3110, likes: 98, comments: 12, time: iso(-6 * D), link: null },
    { id: 'yt3', title: 'Monsoon car care: 5 checks', views: 1975, likes: 64, comments: 9, time: iso(-11 * D), link: null },
  ],
};
export const sampleGoogleAds = {
  updatedAt: iso(-40 * 60 * 1000),
  campaigns: [
    { id: 'g1', name: 'Search · car service near me', status: 'ENABLED', spend: { 7: 4200, 14: 8100, 30: 16900 }, results: { 7: 21, 14: 44, 30: 97 }, purchaseValue: { 7: 14800, 14: 29900, 30: 63100 }, cprTrend: [190, 198, 201, 205] },
    { id: 'g2', name: 'YouTube · brand video', status: 'PAUSED', spend: { 7: 0, 14: 900, 30: 3100 }, results: { 7: 0, 14: 2, 30: 7 }, purchaseValue: null, cprTrend: [] },
  ],
};
export const sampleGoogleSource = { messages: sampleMessages.filter((m) => m.app !== 'whatsapp'), calendar: sampleCalendar, youtube: sampleYouTube, googleAds: sampleGoogleAds };
export const sampleWhatsAppSource = { messages: sampleMessages.filter((m) => m.app === 'whatsapp') };
export const sampleBrief = {
  text: [
    "- Yesterday's sales were up on the same day last week.",
    "- Rohit (Shine Auto) is asking about last week's payout on WhatsApp.",
    '- Razorpay support needs documents for RazorpayX.',
    "- One ad's cost per result has risen 3 days in a row.",
    '- 2 meetings today, starting with the vendor onboarding call.',
    'Do first: send Razorpay the documents.',
  ].join('\n'),
  generatedAt: new Date().toISOString(),
  model: 'sample',
};
export const sampleAnswer = 'This is sample mode, so no AI was asked. Switch the AI brief to Live to ask Gemini about your real numbers.';

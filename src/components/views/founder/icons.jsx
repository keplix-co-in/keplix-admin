/**
 * Sidebar icons for the Founder side (2026-11-15). Inline SVG, no icon library.
 * Gmail / WhatsApp / Instagram / YouTube use their app marks only to label
 * which app the row opens; the Keplix logo stays our own.
 */
const line = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round' };
// Data-only module (an icon map), not a hot-reloaded screen, so this rule does not apply.
// eslint-disable-next-line react-refresh/only-export-components
const S = ({ children, ...p }) => <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" {...p}>{children}</svg>;

export const ICONS = {
  today: <S {...line}><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></S>,
  messages: <S {...line}><path d="M22 12h-6l-2 3h-4l-2-3H2" /><path d="M5.5 5h13l3.5 7v6a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-6z" /></S>,
  gmail: (
    <S>
      <path fill="#4285F4" d="M2 6.5V18a1.5 1.5 0 0 0 1.5 1.5H6V10l-4-3.5z" />
      <path fill="#34A853" d="M18 19.5h2.5A1.5 1.5 0 0 0 22 18V6.5L18 10z" />
      <path fill="#FBBC04" d="M18 5.2V10l4-3.5V5.6c0-1.6-1.8-2.5-3.1-1.6z" />
      <path fill="#EA4335" d="M6 10V5.2L12 9.7l6-4.5V10l-6 4.5z" />
      <path fill="#C5221F" d="M2 5.6v.9L6 10V5.2L5.1 4C3.8 3.1 2 4 2 5.6z" />
    </S>
  ),
  whatsapp: (
    <S>
      <path fill="#25D366" d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2z" />
      <path fill="#fff" d="M17.2 14.4c-.3-.1-1.7-.8-1.9-.9-.3-.1-.5-.1-.7.1l-.9 1.1c-.2.2-.3.2-.6.1a7.6 7.6 0 0 1-3.8-3.3c-.3-.5.3-.5.8-1.6.1-.2 0-.4 0-.5l-.9-2.1c-.2-.5-.5-.5-.7-.5h-.6a1.1 1.1 0 0 0-.8.4 3.3 3.3 0 0 0-1 2.5 5.8 5.8 0 0 0 1.2 3.1 13.3 13.3 0 0 0 5.1 4.5c1.9.8 2.6.9 3.6.7a3 3 0 0 0 2-1.4 2.4 2.4 0 0 0 .2-1.4c-.1-.1-.3-.2-.6-.3z" />
    </S>
  ),
  instagram: (
    <S>
      <defs>
        <linearGradient id="kfIg" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0" stopColor="#FEDA75" /><stop offset=".35" stopColor="#FA7E1E" />
          <stop offset=".6" stopColor="#D62976" /><stop offset="1" stopColor="#4F5BD5" />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="20" height="20" rx="6" fill="url(#kfIg)" />
      <circle cx="12" cy="12" r="4.3" fill="none" stroke="#fff" strokeWidth="1.8" />
      <circle cx="17.3" cy="6.7" r="1.2" fill="#fff" />
    </S>
  ),
  calendar: (
    <S>
      <rect x="3" y="4" width="18" height="17" rx="2.5" fill="#fff" stroke="#4285F4" strokeWidth="1.8" />
      <path d="M3 9h18" stroke="#4285F4" strokeWidth="1.8" />
      <path d="M8 2.5v3M16 2.5v3" stroke="#4285F4" strokeWidth="1.8" strokeLinecap="round" />
      <rect x="7" y="12" width="4" height="4" rx=".8" fill="#4285F4" />
    </S>
  ),
  sales: <S {...line}><path d="M3 3v18h18" /><path d="m7 15 4-4 3 3 6-6" /></S>,
  ads: <S {...line}><path d="M3 11v3a1 1 0 0 0 1 1h2l5 4V6L6 10H4a1 1 0 0 0-1 1z" /><path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13" /></S>,
  youtube: (
    <S>
      <rect x="1.5" y="5" width="21" height="14" rx="4" fill="#FF0000" />
      <path d="m10 9 5 3-5 3z" fill="#fff" />
    </S>
  ),
  shortcuts: <S {...line}><path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7" /><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7" /></S>,
  apps: <S {...line}><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></S>,
};

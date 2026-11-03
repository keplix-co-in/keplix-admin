/**
 * ToastItem — one notification, rendered by the ToastProvider's stack. You
 * normally reach this through `useToast()` rather than directly.
 *
 * Named ToastItem rather than Toast because Windows/macOS filesystems are
 * case-insensitive: `Toast.jsx` and `toast.jsx` would be the same file.
 */
const VARIANTS = {
  success: { color: '#4CAF50', bg: 'rgba(76,175,80,0.12)', border: 'rgba(76,175,80,0.3)', icon: '✓' },
  error: { color: '#ff6b6b', bg: 'rgba(255,61,61,0.12)', border: 'rgba(255,61,61,0.3)', icon: '!' },
  info: { color: '#2196F3', bg: 'rgba(33,150,243,0.12)', border: 'rgba(33,150,243,0.3)', icon: 'i' },
};

export default function ToastItem({ variant = 'info', message, onDismiss }) {
  const v = VARIANTS[variant] || VARIANTS.info;
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex items-start gap-3 rounded-xl border px-4 py-3 text-sm text-white shadow-lg backdrop-blur-sm w-[320px] max-w-[calc(100vw-2rem)]"
      style={{ background: v.bg, borderColor: v.border }}
    >
      <span
        aria-hidden="true"
        className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] font-bold"
        style={{ background: v.color, color: '#0c0c12' }}
      >
        {v.icon}
      </span>
      <span className="flex-1 leading-snug">{message}</span>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss notification"
          className="text-white/40 hover:text-white transition-colors leading-none"
        >
          ×
        </button>
      )}
    </div>
  );
}

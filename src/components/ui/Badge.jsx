/**
 * Badge — a status pill driven by the status-config objects in
 * `src/data/config.js` ({ label, color, bg, border }), so an existing config
 * drops straight in without restating colours at the call site.
 *
 * Pass `config` for the config-object form, or `label`/`color`/`bg`/`border`
 * directly for the handful of statuses that have no config yet.
 */
export default function Badge({ config, label, color, bg, border, size = 'md', className = '' }) {
  const cfg = config || {};
  const text = label ?? cfg.label ?? '—';
  const fg = color ?? cfg.color ?? 'rgba(255,255,255,0.5)';
  const background = bg ?? cfg.bg ?? 'rgba(255,255,255,0.1)';
  const borderColor = border ?? cfg.border ?? 'transparent';

  return (
    <span
      className={`inline-flex items-center rounded-lg font-semibold border ${
        size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs'
      } ${className}`}
      style={{ color: fg, background, borderColor }}
    >
      {text}
    </span>
  );
}

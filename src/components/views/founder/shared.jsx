import { sourceInfo } from './logic';

/** Shared UI bits for the Founder dashboard (2026-11-14, super_admin only). */

export const Card = ({ title, right, children, className = '' }) => (
  <div className={`bg-white border border-slate-200 rounded-2xl p-5 shadow-sm ${className}`}>
    {(title || right) && (
      <div className="flex items-center justify-between gap-3 mb-4">
        {title && <div className="font-syne font-bold text-sm text-slate-900">{title}</div>}
        {right}
      </div>
    )}
    {children}
  </div>
);

/** Shown when a source's keys aren't set on the backend yet. */
export function NotConnected({ id }) {
  const s = sourceInfo(id);
  return (
    <div className="text-sm text-slate-600 border border-dashed border-slate-200 rounded-lg p-4">
      <div className="font-semibold text-slate-900 mb-1">Not connected</div>
      {s?.name || id} keys aren&apos;t set up on the server yet. See <b>Connected apps</b> for the steps.
    </div>
  );
}

/**
 * Body of a card fed by one live source: the children render the data; while
 * there is none it shows Loading, Not connected, or the error instead.
 */
export function SourceBody({ src, id, children }) {
  if (src.notConfigured) return <NotConnected id={id} />;
  return (
    <>
      {src.loading && <div className="text-xs text-slate-400 mb-2">Loading…</div>}
      {src.error && (
        <div role="alert" className="text-xs text-brand-red mb-2">
          Couldn&apos;t refresh: {src.error}.{src.data ? ' Showing the last good data.' : ''}
        </div>
      )}
      {src.data && children(src.data)}
    </>
  );
}

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

export function ModeSwitch({ id, mode, setMode }) {
  return (
    <div className="flex text-[11px] font-semibold rounded-lg overflow-hidden border border-slate-200" role="group" aria-label={`${id} data mode`}>
      {['sample', 'live'].map((m) => (
        <button
          key={m}
          type="button"
          onClick={() => setMode(m)}
          aria-pressed={mode === m}
          className={`px-2.5 py-1 capitalize ${mode === m ? 'bg-brand-red text-white' : 'text-slate-500 hover:text-slate-900'}`}
        >
          {m}
        </button>
      ))}
    </div>
  );
}

/**
 * Shown in Live mode when a source can't show real data yet: either its keys
 * aren't set on the backend (Phase 2 sources answer NOT_CONFIGURED), or it is
 * built in a later phase.
 */
export function NotConnected({ id }) {
  const s = sourceInfo(id);
  return (
    <div className="text-sm text-slate-600 border border-dashed border-slate-200 rounded-lg p-4">
      <div className="font-semibold text-slate-900 mb-1">Not connected</div>
      {s?.liveAvailable
        ? <>{s.name} keys aren&apos;t set up on the server yet. See <b>Connected apps</b> for what to add.</>
        : <>{s?.name || id} is added in Phase {s?.phase ?? '?'} of the Founder dashboard build.</>}
      {' '}Switch back to <b>Sample</b> to see how this screen will look.
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

export const SampleBadge = () => (
  <span className="text-[10px] font-bold tracking-wider uppercase text-amber-700 bg-amber-100 px-2 py-0.5 rounded">
    Sample data
  </span>
);

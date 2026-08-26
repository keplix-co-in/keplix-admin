/* ---------------------------------------------------------------------------
 * TO MOUNT THE TOASTS — one line, in `src/pages/App.jsx`:
 *
 *   import { ToastProvider } from '../components/ui/toast.jsx';
 *
 * and wrap the top-level returned element, i.e. change
 *   <div className="flex h-screen bg-brand-black ...">  ...  </div>
 * to
 *   <ToastProvider><div className="flex h-screen bg-brand-black ...">…</div></ToastProvider>
 *
 * The useToast() hook lives in ./toastContext.js (a non-component export here
 * would break Vite fast refresh and trips the lint rule); the barrel
 * ./index.js re-exports both.
 *
 * (App.jsx is owned by another agent, so it has deliberately not been edited
 * here. Until the provider is mounted, useToast() is a safe no-op and nothing
 * breaks — the toasts simply don't appear.)
 * ------------------------------------------------------------------------- */
import { useCallback, useMemo, useRef, useState, useEffect } from 'react';
import ToastItem from './ToastItem.jsx';
import { ToastContext } from './toastContext.js';

const DEFAULT_DURATION = 4000;

/**
 * ToastProvider — top-right stacked, auto-dismissing notifications.
 *
 * Timers are tracked so an unmount (or a manual dismiss) clears them instead
 * of firing setState on a dead component.
 */
export function ToastProvider({ children, duration = DEFAULT_DURATION }) {
  const [toasts, setToasts] = useState([]);
  const timers = useRef(new Map());
  const nextId = useRef(0);

  const dismiss = useCallback((id) => {
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
    setToasts((current) => current.filter((t) => t.id !== id));
  }, []);

  const show = useCallback(
    (message, variant = 'info', options = {}) => {
      if (!message) return null;
      const id = ++nextId.current;
      setToasts((current) => [...current, { id, message: String(message), variant }]);
      const ms = options.duration ?? duration;
      if (ms > 0) {
        timers.current.set(
          id,
          setTimeout(() => dismiss(id), ms)
        );
      }
      return id;
    },
    [dismiss, duration]
  );

  useEffect(() => {
    const pending = timers.current;
    return () => {
      pending.forEach((t) => clearTimeout(t));
      pending.clear();
    };
  }, []);

  const api = useMemo(
    () => ({
      show,
      dismiss,
      success: (message, options) => show(message, 'success', options),
      error: (message, options) => show(message, 'error', options),
      info: (message, options) => show(message, 'info', options),
    }),
    [show, dismiss]
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
        {toasts.map((t) => (
          <div key={t.id} className="pointer-events-auto animate-[fadeInUp_0.2s_ease_forwards]">
            <ToastItem variant={t.variant} message={t.message} onDismiss={() => dismiss(t.id)} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export default ToastProvider;

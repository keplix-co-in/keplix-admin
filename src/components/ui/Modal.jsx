import { useCallback, useEffect, useRef } from 'react';
import { Icon } from './Icon.jsx';

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Modal — backdrop + centred panel.
 *
 * Escape closes it and Tab is trapped inside the panel, so keyboard users
 * can't tab into the page behind the overlay. `closeOnBackdrop` is turned off
 * by callers that are mid-request (a stray backdrop click shouldn't abandon a
 * refund that is already in flight).
 */
export default function Modal({
  open = true,
  onClose,
  title,
  children,
  footer,
  width = 'w-[520px]',
  closeOnBackdrop = true,
  className = '',
}) {
  const panelRef = useRef(null);

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose?.();
        return;
      }
      if (e.key !== 'Tab' || !panelRef.current) return;
      const nodes = Array.from(panelRef.current.querySelectorAll(FOCUSABLE));
      if (nodes.length === 0) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    },
    [onClose]
  );

  useEffect(() => {
    if (!open) return undefined;
    const previous = document.activeElement;
    const node = panelRef.current?.querySelector(FOCUSABLE) || panelRef.current;
    node?.focus?.();
    return () => {
      if (previous && typeof previous.focus === 'function') previous.focus();
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
      onMouseDown={(e) => {
        if (closeOnBackdrop && e.target === e.currentTarget) onClose?.();
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={typeof title === 'string' ? title : undefined}
        tabIndex={-1}
        onKeyDown={handleKeyDown}
        className={`bg-brand-gray-100 rounded-2xl border border-white/10 shadow-2xl max-w-[92vw] max-h-[90vh] overflow-y-auto ${width} ${className}`}
      >
        {(title || onClose) && (
          <div className="flex items-start justify-between gap-4 px-6 pt-5 pb-4 border-b border-white/10">
            <div className="font-syne text-base font-bold text-white">{title}</div>
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="text-white/40 hover:text-white transition-colors rounded-lg p-1 -m-1"
              >
                <Icon name="close" size={18} />
              </button>
            )}
          </div>
        )}
        <div className="px-6 py-5">{children}</div>
        {footer && <div className="px-6 pb-5 flex justify-end gap-2">{footer}</div>}
      </div>
    </div>
  );
}

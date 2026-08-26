import Button from './Button.jsx';

/**
 * EmptyState — "there is nothing here" with an optional way out.
 * `icon` is any node (the app uses emoji and the Icon component).
 */
export default function EmptyState({ icon, title, message, actionLabel, onAction, className = '' }) {
  return (
    <div className={`px-5 py-12 flex flex-col items-center text-center gap-2 ${className}`}>
      {icon && <div className="text-2xl opacity-60">{icon}</div>}
      {title && <div className="text-sm font-semibold text-white/70">{title}</div>}
      {message && <div className="text-sm text-white/40 max-w-md">{message}</div>}
      {actionLabel && onAction && (
        <Button size="sm" onClick={onAction} className="mt-2">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}

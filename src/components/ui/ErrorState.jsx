import Button from './Button.jsx';

/**
 * ErrorState — a failure message that always offers the retry, so a transient
 * network error doesn't require a full page reload.
 */
export default function ErrorState({ message = 'Something went wrong.', onRetry, retryLabel = 'Retry', className = '' }) {
  return (
    <div
      role="alert"
      className={`rounded-xl bg-red-500/10 border border-red-500/30 px-4 py-3 text-sm text-red-300 flex items-center justify-between gap-4 ${className}`}
    >
      <span>{message}</span>
      {onRetry && (
        <Button variant="secondary" size="sm" onClick={onRetry}>
          {retryLabel}
        </Button>
      )}
    </div>
  );
}

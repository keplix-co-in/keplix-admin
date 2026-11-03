import Button from './Button.jsx';
import Modal from './Modal.jsx';

/**
 * ConfirmDialog — the styled replacement for window.confirm().
 *
 * window.confirm blocks the JS thread, can't be styled, and on some browsers
 * is suppressed entirely — a destructive admin action silently going through
 * (or silently not) is the worst possible failure mode. This keeps the same
 * "nothing happens until you say yes" contract in-app.
 *
 * `loading` keeps the dialog open and the confirm button busy while the
 * caller's async action runs, which prevents a double-confirm.
 */
export default function ConfirmDialog({
  open = true,
  title = 'Are you sure?',
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  danger = false,
  loading = false,
  onConfirm,
  onCancel,
}) {
  if (!open) return null;
  return (
    <Modal
      open={open}
      title={title}
      width="w-[440px]"
      closeOnBackdrop={!loading}
      onClose={loading ? undefined : onCancel}
      footer={
        <>
          <Button variant="ghost" size="sm" disabled={loading} onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button
            variant={danger ? 'primary' : 'secondary'}
            size="sm"
            loading={loading}
            onClick={onConfirm}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="text-sm text-white/70 whitespace-pre-line">{message}</div>
    </Modal>
  );
}

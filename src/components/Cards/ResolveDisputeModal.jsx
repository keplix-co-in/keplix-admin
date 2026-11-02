import { useState } from 'react';
import Button from '../ui/Button.jsx';
import Modal from '../ui/Modal.jsx';
import { resolveDispute } from '../../services/bookingsApi';

// Mirrors the backend's own check in resolveDisputeForCustomer, so the
// operator finds out before the request rather than from a 400.
const MIN_REASON = 10;

/**
 * Resolve a dispute in the customer's favour: POST
 * /admin/bookings/:id/dispute/resolve. That CANCELS the booking and notifies
 * both sides; it does not refund. Two steps (reason, then an explicit
 * confirmation) because the cancel cannot be undone from the admin panel --
 * and the confirmation spells out that the refund is a separate step, so no
 * one assumes the customer already has their money back.
 *
 * @param {object} props
 * @param {{ id: number|string }} props.booking
 * @param {() => void} props.onClose
 * @param {(updated: object|undefined) => void} props.onResolved - receives
 *   the backend's updated booking row when it sends one.
 */
export default function ResolveDisputeModal({ booking, onClose, onResolved }) {
  const [reason, setReason] = useState('');
  const [step, setStep] = useState('reason'); // 'reason' | 'confirm'
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const trimmed = reason.trim();
  const reasonOk = trimmed.length >= MIN_REASON;

  const handleContinue = (e) => {
    e.preventDefault();
    if (!reasonOk) {
      setError(`Please give a reason of at least ${MIN_REASON} characters.`);
      return;
    }
    setError('');
    setStep('confirm');
  };

  const handleConfirm = async () => {
    setBusy(true);
    setError('');
    try {
      const data = await resolveDispute(booking.id, trimmed);
      onResolved?.(data?.booking);
    } catch (err) {
      setError(err.message || 'Failed to resolve this dispute.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      title={`Resolve dispute — booking ${booking.id}`}
      width="w-[440px]"
      closeOnBackdrop={!busy}
      onClose={busy ? undefined : onClose}
    >
      {step === 'reason' ? (
        <form onSubmit={handleContinue}>
          <p className="text-xs text-brand-gray-700 mb-3">
            Resolves the dispute in the <strong className="text-white">customer&apos;s</strong> favour. To side with
            the vendor instead, use Force Complete.
          </p>
          <label
            htmlFor="resolve-dispute-reason"
            className="block text-[10px] font-bold text-brand-gray-600 uppercase tracking-wider mb-1"
          >
            Reason (for the audit log)
          </label>
          <textarea
            id="resolve-dispute-reason"
            required
            rows={4}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full mb-1 bg-[#1c1c28] border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
            placeholder="What was found, and why the customer is right"
          />
          <div className={`text-[10px] mb-3 ${reasonOk ? 'text-brand-gray-700' : 'text-[#ff9944]'}`}>
            {trimmed.length}/{MIN_REASON} characters minimum
          </div>

          {error && <p className="text-xs text-red-300 mb-3">{error}</p>}

          <div className="flex gap-2 justify-end">
            <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
            <Button type="submit" size="sm" disabled={!reasonOk}>Continue</Button>
          </div>
        </form>
      ) : (
        <div>
          <div className="text-sm text-white/70 mb-3">
            This will <strong className="text-white">cancel booking {booking.id}</strong> and notify the customer and
            the vendor.
          </div>
          <div className="text-xs rounded-lg px-3 py-2 mb-3 bg-[rgba(255,153,68,0.1)] text-[#ff9944]">
            It does NOT refund the customer. That is a separate step, offered straight after this if the booking
            has a refundable payment.
          </div>
          <div className="text-xs text-brand-gray-700 mb-4 whitespace-pre-line">Reason: {trimmed}</div>

          {error && <p className="text-xs text-red-300 mb-3">{error}</p>}

          <div className="flex gap-2 justify-end">
            <Button variant="ghost" size="sm" disabled={busy} onClick={() => setStep('reason')}>Back</Button>
            <Button size="sm" loading={busy} onClick={handleConfirm}>
              {busy ? 'Resolving…' : 'Cancel booking & resolve'}
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}

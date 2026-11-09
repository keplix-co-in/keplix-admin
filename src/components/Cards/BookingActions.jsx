import { useState } from 'react';
import Button from '../ui/Button.jsx';
import { useToast } from '../ui/toastContext.js';
import { forceCompleteBooking, cancelNoShowBooking } from '../../services/bookingsApi';
import { formatINR } from '../../utils/format.js';
import { isSuperAdmin } from '../../services/authApi.js';
import RefundModal from '../views/finance/RefundModal.jsx';
import ResolveDisputeModal from './ResolveDisputeModal.jsx';

// Force-complete used to show on every booking that wasn't literally
// 'completed', including cancelled and refunded ones. Pushing those to
// service_completed would make them confirmable, and confirming queues a
// vendor payout for a booking that was cancelled or refunded. The backend
// rejects cancelled/user_confirmed/completed. rejected and refunded are
// hidden here as well because they are terminal too. 'canceled' is the
// legacy spelling some older rows still carry.
const FORCE_COMPLETE_HIDDEN = new Set([
  'cancelled', 'canceled', 'refunded', 'rejected', 'user_confirmed', 'completed',
]);

/**
 * The admin actions for one booking: Force Complete, Resolve dispute, and
 * Refund. Split out of BookingCard so the card stays a read-only view.
 *
 * @param {object} props
 * @param {object} props.booking - the row from GET /admin/bookings
 * @param {string} props.status - the booking's effective status (the card
 *   overrides it locally after a resolve, before the list refetches)
 * @param {(status: string) => void} props.onStatusChange
 * @param {() => void} [props.onChanged] - refetch the bookings list
 * @param {() => void} props.onClose - close the card
 */
export default function BookingActions({ booking, status, onStatusChange, onChanged, onClose }) {
  const toast = useToast();
  const [dialog, setDialog] = useState(null); // null | 'resolve' | 'refund'
  const [forcing, setForcing] = useState(false);
  const [forceError, setForceError] = useState('');
  const [justResolved, setJustResolved] = useState(false);
  // The `booking` prop is a snapshot of the list row and does not change
  // after a refund. Track the refund locally so the button can't be pressed
  // twice in one session. A further partial refund means reopening the
  // booking after the list refreshes.
  const [refundedHere, setRefundedHere] = useState(false);

  // M-3: force-complete, dispute resolve and refund are all
  // authorizeSuperAdmin on the backend. Hidden for other roles (UI only —
  // the backend still enforces).
  const superAdmin = isSuperAdmin();
  const payment = booking.payment;
  const paymentRefunded = refundedHere || payment?.status === 'refunded';
  // The refund endpoint only accepts payments in 'success' (see
  // keplix-backend services/refundService.js). Older API responses have no
  // `payment` object, and then the action stays hidden rather than guessing.
  const canRefund =
    superAdmin && payment?.id != null && payment.status === 'success' && status !== 'refunded' && !refundedHere;
  // A booking whose money went back to the customer must not be pushed
  // towards a payout either.
  const canForce = superAdmin && !FORCE_COMPLETE_HIDDEN.has(status) && !paymentRefunded;
  const canResolve = superAdmin && status === 'disputed';
  // DEV-26: a booking stuck in in_progress (vendor started, never finished /
  // never showed) had no admin exit. Backend only accepts in_progress.
  const canNoShow = superAdmin && status === 'in_progress';
  const [noShowing, setNoShowing] = useState(false);
  const [noShowError, setNoShowError] = useState('');

  const handleNoShow = async () => {
    // Same window.prompt convention as force-complete above.
    const reason = window.prompt(
      'Cancel this booking as a vendor no-show? The customer gets a FULL refund and a pending vendor payout is voided. Enter a reason for the audit log:',
    );
    if (reason === null) return;
    if (!reason.trim()) {
      setNoShowError('A reason is required.');
      return;
    }
    setNoShowing(true);
    setNoShowError('');
    try {
      const result = await cancelNoShowBooking(booking.id, reason.trim());
      const refundCode = result?.refund?.code;
      if (refundCode === 'REFUND_FAILED') {
        toast.error(`Booking ${booking.id} cancelled, but the refund FAILED. Retry it from Finance.`);
      } else {
        toast.success(`Booking ${booking.id} cancelled as no-show.${refundCode === 'REFUND_ISSUED' ? ' Full refund issued.' : ''}`);
      }
      onChanged?.();
      onClose();
    } catch (err) {
      setNoShowError(err.message || 'Failed to cancel this booking as no-show.');
    } finally {
      setNoShowing(false);
    }
  };

  const handleForceComplete = async () => {
    // window.prompt/confirm match this app's existing convention (see
    // BlogsView.jsx's delete confirmation) rather than a full dialog
    // component. This is a rare admin escape hatch, not everyday UI.
    const reason = window.prompt(
      'Force-completing bypasses the mandatory health-sheet check. This does NOT release escrow by itself. Enter a reason for the audit log:',
    );
    if (reason === null) return; // cancelled
    if (!reason.trim()) {
      setForceError('A reason is required.');
      return;
    }

    setForcing(true);
    setForceError('');
    try {
      await forceCompleteBooking(booking.id, reason.trim());
      onChanged?.();
      onClose();
    } catch (err) {
      setForceError(err.message || 'Failed to force-complete this booking.');
    } finally {
      setForcing(false);
    }
  };

  const handleResolved = (updated) => {
    setDialog(null);
    setJustResolved(true);
    // The backend moves the booking to 'cancelled'. Reflect that right away,
    // so Force Complete disappears and the refund offer below shows, without
    // waiting on a list refetch that may drop this row (Disputed filter).
    onStatusChange(updated?.status || 'cancelled');
    onChanged?.();
    toast.success(`Dispute on booking ${booking.id} resolved. The booking is cancelled.`);
  };

  const handleRefunded = () => {
    setRefundedHere(true);
    onChanged?.();
    toast.success(`Refund issued for booking ${booking.id}.`);
  };

  if (!canForce && !canResolve && !canNoShow && !canRefund && !justResolved && dialog === null) return null;

  return (
    <div className="mt-6 pt-4 border-t border-white/10 space-y-2">
      {justResolved && (
        <div className="rounded-lg px-3 py-2 text-xs bg-[rgba(255,153,68,0.1)] text-[#ff9944]">
          {refundedHere
            ? 'Dispute resolved and refund issued.'
            : canRefund
              ? 'Dispute resolved: the booking is cancelled, but the customer has NOT been refunded yet.'
              : 'Dispute resolved: the booking is cancelled. There is no refundable payment on this booking.'}
        </div>
      )}

      {canResolve && (
        <Button variant="secondary" size="sm" className="w-full" onClick={() => setDialog('resolve')}>
          Resolve dispute (customer&apos;s favour)
        </Button>
      )}

      {canRefund && (
        <Button variant="danger" size="sm" className="w-full" onClick={() => setDialog('refund')}>
          {justResolved ? 'Refund payment' : 'Refund this booking'}
        </Button>
      )}

      {canNoShow && (
        <>
          {noShowError && <p className="text-xs text-red-300">{noShowError}</p>}
          <Button variant="danger" size="sm" className="w-full" onClick={handleNoShow} disabled={noShowing}>
            {noShowing ? 'Cancelling…' : 'Cancel (no-show)'}
          </Button>
        </>
      )}

      {canForce && (
        <>
          {forceError && <p className="text-xs text-red-300">{forceError}</p>}
          <button
            onClick={handleForceComplete}
            disabled={forcing}
            className="w-full py-2.5 rounded-lg text-xs font-bold text-amber-300 bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/20 disabled:opacity-50 transition-colors"
          >
            {forcing ? 'Force-completing…' : 'Force Complete (bypass health-sheet check)'}
          </button>
        </>
      )}

      {dialog === 'resolve' && (
        <ResolveDisputeModal booking={booking} onClose={() => setDialog(null)} onResolved={handleResolved} />
      )}

      {dialog === 'refund' && payment?.id != null && (
        <RefundModal
          initialPaymentId={payment.id}
          lockPaymentId
          initialReason={justResolved ? `Dispute resolved in customer's favour (booking ${booking.id})` : ''}
          context={`Booking ${booking.id} · payment ${payment.id} · paid ${formatINR(payment.amount ?? booking.amount)}`}
          onClose={() => setDialog(null)}
          onRefundSuccess={handleRefunded}
        />
      )}
    </div>
  );
}

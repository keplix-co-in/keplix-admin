import { useRef, useState } from "react";
import { API_URL } from "../../../services/apiConfig.js";
import { authFetch } from "../../../services/authApi.js";
import Button from "../../ui/Button.jsx";
import Modal from "../../ui/Modal.jsx";

/**
 * The refund form + request, extracted from RefundPanel.jsx so the Finance
 * page's "Issue Refund" card and the booking detail card (BookingCard's
 * "Refund this booking" / post-dispute "Refund payment") share ONE refund
 * code path -- including the idempotency-key handling below -- rather than
 * a second copy that could drift.
 *
 * Mount it only while open: each mount is one refund intent, so the form and
 * the idempotency key start fresh every time it is opened.
 *
 * @param {object} props
 * @param {() => void} props.onClose
 * @param {(data: object) => void} [props.onRefundSuccess]
 * @param {number|string} [props.initialPaymentId] - pre-fills Payment ID.
 * @param {boolean} [props.lockPaymentId] - makes Payment ID read-only; used
 *   when the refund is started from a specific booking, so the operator
 *   can't accidentally refund some other payment from that screen.
 * @param {string} [props.initialReason]
 * @param {import('react').ReactNode} [props.context] - optional summary shown
 *   above the form (e.g. which booking and how much was paid).
 */
export default function RefundModal({
  onClose,
  onRefundSuccess,
  initialPaymentId = '',
  lockPaymentId = false,
  initialReason = '',
  context = null,
}) {
  const [refundForm, setRefundForm] = useState({
    paymentId: initialPaymentId == null ? '' : String(initialPaymentId),
    amount: '',
    reason: initialReason,
  });
  const [refundBusy, setRefundBusy] = useState(false);
  const [refundResult, setRefundResult] = useState(null);
  // Bug (fixed): handleRefund used to build `idempotencyKey` inline with
  // Date.now(), so every call generated a DIFFERENT key -- including a
  // resubmission of the exact same form after a network error. That defeated
  // the dedup this key exists for (see the "Repeat submissions... are
  // de-duplicated automatically" copy on RefundPanel) and could double-refund
  // a customer on a retry. The key is generated once per refund attempt-cycle
  // here and persisted across retries of the SAME submission; a new mount
  // (the modal reopened for a new refund) starts with a fresh key.
  const refundIdempotencyKeyRef = useRef(null);

  // Changing WHAT is being refunded (payment or amount) is a new refund
  // intent, so it must get a new key. Otherwise a failed refund of payment X
  // followed by "edit the ID to Y, submit" replays X's key: the backend finds
  // X's gateway_failed row under that key, retries it and books Y's money
  // against X. The reason is free text and doesn't change the intent.
  const setRefundTarget = (field, value) => {
    refundIdempotencyKeyRef.current = null;
    setRefundForm((f) => ({ ...f, [field]: value }));
  };

  /**
   * Issues a refund.
   *
   * The idempotencyKey is generated here rather than asked of the operator:
   * it is what stops a double-click or a retry from refunding twice, and it
   * has to stay stable for one refund intent. It is derived from the payment,
   * amount and the moment the modal was submitted, and is held in a ref for
   * the lifetime of this modal so a retry of the SAME submission reuses it.
   */
  const handleRefund = async (e) => {
    e.preventDefault();
    const paymentId = Number(refundForm.paymentId);
    if (!paymentId) {
      setRefundResult({ ok: false, message: 'Enter a valid Payment ID.' });
      return;
    }

    setRefundBusy(true);
    setRefundResult(null);
    try {
      if (!refundIdempotencyKeyRef.current) {
        refundIdempotencyKeyRef.current = `admin-refund-${paymentId}-${refundForm.amount || 'full'}-${Date.now()}`;
      }
      const idempotencyKey = refundIdempotencyKeyRef.current;

      const res = await authFetch(`${API_URL}/admin/finance/payments/${paymentId}/refund`, {
        method: 'POST',
        body: JSON.stringify({
          // Omitting amount means "refund whatever is left", which the
          // backend resolves — don't send an empty string.
          ...(refundForm.amount ? { amount: Number(refundForm.amount) } : {}),
          ...(refundForm.reason ? { reason: refundForm.reason } : {}),
          idempotencyKey,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setRefundResult({ ok: false, message: data?.message || `Refund failed (${res.status})` });
        return;
      }

      setRefundResult({
        ok: true,
        message: data?.message || 'Refund processed',
        // The backend flags this when the vendor's share was already paid out,
        // which means Keplix is out of pocket until it's recovered manually.
        payoutAlreadySettled: data?.payoutAlreadySettled === true,
      });
      onRefundSuccess?.(data);
    } catch (err) {
      setRefundResult({ ok: false, message: err.message || 'Refund request failed' });
    } finally {
      setRefundBusy(false);
    }
  };

  // After a successful refund the form is spent. Re-submitting would replay
  // the same idempotency key and just get the original refund back (deduped
  // server-side) while looking like a second refund to the operator, so only
  // Close is offered. A further partial refund = close and reopen.
  const done = refundResult?.ok === true;

  return (
    <Modal
      title="Issue Refund"
      width="w-[420px]"
      closeOnBackdrop={!refundBusy}
      onClose={refundBusy ? undefined : onClose}
    >
      <form onSubmit={handleRefund}>
        {context && <div className="mb-4 text-xs text-brand-gray-700">{context}</div>}

        <label className="block text-[10px] font-bold text-brand-gray-600 uppercase tracking-wider mb-1">Payment ID</label>
        <input
          type="number"
          required
          readOnly={lockPaymentId}
          value={refundForm.paymentId}
          onChange={(e) => setRefundTarget('paymentId', e.target.value)}
          className={`w-full mb-3 bg-[#1c1c28] border border-white/10 rounded-lg px-3 py-2 text-sm text-white${lockPaymentId ? ' opacity-70 cursor-not-allowed' : ''}`}
          placeholder="e.g. 312"
        />

        <label className="block text-[10px] font-bold text-brand-gray-600 uppercase tracking-wider mb-1">Amount (₹)</label>
        <input
          type="number"
          step="0.01"
          value={refundForm.amount}
          onChange={(e) => setRefundTarget('amount', e.target.value)}
          className="w-full mb-1 bg-[#1c1c28] border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
          placeholder="Leave blank for a full refund"
        />
        <div className="text-[10px] text-brand-gray-700 mb-3">Blank refunds the entire remaining balance.</div>

        <label className="block text-[10px] font-bold text-brand-gray-600 uppercase tracking-wider mb-1">Reason</label>
        <input
          type="text"
          value={refundForm.reason}
          onChange={(e) => setRefundForm({ ...refundForm, reason: e.target.value })}
          className="w-full mb-4 bg-[#1c1c28] border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
          placeholder="Optional"
        />

        {refundResult && (
          <div className={`mb-4 rounded-lg px-3 py-2 text-xs ${refundResult.ok ? 'bg-[rgba(76,175,80,0.1)] text-[#4CAF50]' : 'bg-[rgba(255,61,61,0.1)] text-[#ff6b6b]'}`}>
            <div>{refundResult.message}</div>
            {refundResult.payoutAlreadySettled && (
              <div className="mt-1 text-[#ff9944]">
                ⚠️ The vendor had already been paid out for this booking. That money must be recovered from the vendor manually — it is not clawed back automatically.
              </div>
            )}
          </div>
        )}

        <div className="flex gap-2 justify-end">
          <Button variant="ghost" size="sm" disabled={refundBusy} onClick={onClose}>
            Close
          </Button>
          {!done && (
            <Button type="submit" size="sm" loading={refundBusy}>
              {refundBusy ? 'Processing…' : 'Refund'}
            </Button>
          )}
        </div>
      </form>
    </Modal>
  );
}

import { useRef, useState } from "react";
import { API_URL } from "../../../services/apiConfig.js";
import { authFetch } from "../../../services/authApi.js";
import Button from "../../ui/Button.jsx";
import Modal from "../../ui/Modal.jsx";

/**
 * Refund button + modal. Split out of FinanceView.jsx -- see that file's own
 * comment on why. Owns its form state and the refund request itself; tells
 * the parent to refresh KPIs/the payout queue via `onRefundSuccess` rather
 * than reaching back into FinanceView's fetch functions directly.
 */
export default function RefundPanel({ onRefundSuccess }) {
  const [refundOpen, setRefundOpen] = useState(false);
  const [refundForm, setRefundForm] = useState({ paymentId: '', amount: '', reason: '' });
  const [refundBusy, setRefundBusy] = useState(false);
  const [refundResult, setRefundResult] = useState(null);
  // Bug (fixed): handleRefund used to build `idempotencyKey` inline with
  // Date.now(), so every call generated a DIFFERENT key -- including a
  // resubmission of the exact same form after a network error. That defeated
  // the dedup this key exists for (see the "Repeat submissions... are
  // de-duplicated automatically" copy below) and could double-refund a
  // customer on a retry. The key is now generated once per refund
  // attempt-cycle here, persisted across retries of the SAME submission, and
  // only cleared when the modal is (re)opened for a new refund.
  const refundIdempotencyKeyRef = useRef(null);

  /**
   * Issues a refund.
   *
   * The idempotencyKey is generated here rather than asked of the operator:
   * it is what stops a double-click or a retry from refunding twice, and it
   * has to stay stable for one refund intent. It is derived from the payment,
   * amount and the moment the modal was submitted, and is held in component
   * state for the duration of the request so a retry of the SAME submission
   * reuses it.
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
      onRefundSuccess?.();
    } catch (err) {
      setRefundResult({ ok: false, message: err.message || 'Refund request failed' });
    } finally {
      setRefundBusy(false);
    }
  };

  return (
    <>
      <div className="bg-brand-gray-100 rounded-[20px] border border-white/5 overflow-hidden mb-5 p-6 flex items-center justify-between">
        <div>
          <div className="font-syne text-base font-bold mb-1">↩️ Issue a Refund</div>
          <div className="text-xs text-brand-gray-700">
            Full or partial, by Payment ID. Repeat submissions of the same refund are de-duplicated automatically.
          </div>
        </div>
        <Button
          size="sm"
          onClick={() => {
            setRefundResult(null);
            // New refund intent -- a fresh key, not the previous refund's.
            refundIdempotencyKeyRef.current = null;
            setRefundOpen(true);
          }}
        >
          Issue Refund
        </Button>
      </div>

      {refundOpen && (
        <Modal
          title="Issue Refund"
          width="w-[420px]"
          closeOnBackdrop={!refundBusy}
          onClose={refundBusy ? undefined : () => setRefundOpen(false)}
        >
          <form onSubmit={handleRefund}>
            <label className="block text-[10px] font-bold text-brand-gray-600 uppercase tracking-wider mb-1">Payment ID</label>
            <input
              type="number"
              required
              value={refundForm.paymentId}
              onChange={(e) => setRefundForm({ ...refundForm, paymentId: e.target.value })}
              className="w-full mb-3 bg-[#1c1c28] border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
              placeholder="e.g. 312"
            />

            <label className="block text-[10px] font-bold text-brand-gray-600 uppercase tracking-wider mb-1">Amount (₹)</label>
            <input
              type="number"
              step="0.01"
              value={refundForm.amount}
              onChange={(e) => setRefundForm({ ...refundForm, amount: e.target.value })}
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
              <Button variant="ghost" size="sm" disabled={refundBusy} onClick={() => setRefundOpen(false)}>
                Close
              </Button>
              <Button type="submit" size="sm" loading={refundBusy}>
                {refundBusy ? 'Processing…' : 'Refund'}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}

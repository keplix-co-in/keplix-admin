import { useState } from "react";
import Button from "../../ui/Button.jsx";
import RefundModal from "./RefundModal.jsx";
import { isSuperAdmin } from "../../../services/authApi.js";

/**
 * Refund button + modal. Split out of FinanceView.jsx -- see that file's own
 * comment on why. Tells the parent to refresh KPIs/the payout queue via
 * `onRefundSuccess` rather than reaching back into FinanceView's fetch
 * functions directly.
 *
 * The form and the refund request itself (including the idempotency-key
 * handling) now live in RefundModal.jsx, so the booking detail card can
 * start a refund through exactly the same code path. Because the modal is
 * remounted on every open, the form now starts blank each time rather than
 * keeping the previous refund's Payment ID -- which also removes the chance
 * of re-submitting the last refund's payment by mistake.
 */
export default function RefundPanel({ onRefundSuccess }) {
  const [refundOpen, setRefundOpen] = useState(false);

  return (
    <>
      <div className="bg-brand-gray-100 rounded-[20px] border border-white/5 overflow-hidden mb-5 p-6 flex items-center justify-between">
        <div>
          <div className="font-syne text-base font-bold mb-1">↩️ Issue a Refund</div>
          <div className="text-xs text-brand-gray-700">
            Full or partial, by Payment ID. Repeat submissions of the same refund are de-duplicated automatically.
          </div>
        </div>
        {/* M-3: refunds are super_admin-only on the backend. */}
        <Button size="sm" onClick={() => setRefundOpen(true)} disabled={!isSuperAdmin()} title={!isSuperAdmin() ? "Super admin only" : undefined}>
          Issue Refund
        </Button>
      </div>

      {refundOpen && (
        <RefundModal
          onClose={() => setRefundOpen(false)}
          onRefundSuccess={() => onRefundSuccess?.()}
        />
      )}
    </>
  );
}

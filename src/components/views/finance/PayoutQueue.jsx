import { useRef, useState } from "react";
import { API_URL } from "../../../services/apiConfig.js";
import { authFetch } from "../../../services/authApi.js";
import Badge from "../../ui/Badge.jsx";
import Button from "../../ui/Button.jsx";
import ConfirmDialog from "../../ui/ConfirmDialog.jsx";
import EmptyState from "../../ui/EmptyState.jsx";
import ErrorState from "../../ui/ErrorState.jsx";
import Spinner from "../../ui/Spinner.jsx";
import { useToast } from "../../ui/toastContext.js";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../ui/table";
import { formatINR } from "../../../utils/format.js";

const urgencyConfig = {
  critical: { color: "#ff3d3d", bg: "rgba(255,61,61,0.08)",  label: "CRITICAL" },
  urgent:   { color: "#ff6b00", bg: "rgba(255,107,0,0.08)", label: "URGENT" },
  due_soon: { color: "#ff9944", bg: "rgba(255,153,68,0.08)", label: "DUE SOON" },
  normal:   { color: "#4CAF50", bg: "rgba(76,175,80,0.06)",  label: "NORMAL" },
};

/**
 * Payout queue table + per-row "Pay Now" + bulk "Initiate All Payouts".
 * Split out of FinanceView.jsx -- see that file's own comment on why. Owns
 * the pay/initiate actions and their own confirm/loading state; tells the
 * parent to refetch via `onChanged` rather than calling FinanceView's fetch
 * functions directly.
 */
export default function PayoutQueue({ queue, loading, error, onRetry, onChanged }) {
  const toast = useToast();
  const [loadingPayout, setLoadingPayout] = useState(null);

  // Confirmation for the bulk payout run. Replaces window.confirm(), which
  // blocks the thread and can be suppressed by the browser outright — a
  // suppressed prompt on a bulk money movement is not an acceptable failure.
  const [initiateConfirm, setInitiateConfirm] = useState(null);
  const [initiateBusy, setInitiateBusy] = useState(false);

  // Security review 2026-10-28 A-004: a single row's "Pay Now" used to POST
  // the settle on one click, with no confirm step (only the bulk path had
  // one), so a stray/double click or a clickjacking assist moved money
  // immediately. It now opens the same ConfirmDialog as "Initiate All",
  // naming the vendor and amount; nothing is sent until the admin confirms.
  // The backend settle is also idempotent and super_admin-only.
  const [payConfirm, setPayConfirm] = useState(null);
  // Synchronous in-flight flag for the guard below. Checking the
  // `loadingPayout` state alone reads the value from the render the click
  // handler was created in, so two confirms dispatched before React re-renders
  // could both see null and both POST. A ref is updated immediately.
  const payInFlight = useRef(false);

  const handlePayNow = async (payout) => {
    // Ignore a second confirm while this payout is already being sent (A-004).
    if (payInFlight.current) return;
    payInFlight.current = true;
    setLoadingPayout(payout.id);
    try {
      const response = await authFetch(`${API_URL}/admin/finance/payouts/${payout.paymentId}/settle`, {
        method: "POST",
      });

      const data = await response.json();

      if (response.ok || data.success) {
        toast.success("Payout queued. The vendor is paid once RazorpayX confirms.");
        onChanged?.();
      } else {
        toast.error("Failed to settle payout: " + (data.message || "Unknown error"));
      }
    } catch (error) {
      console.error("Payout error:", error);
      // authFetch throws a friendly "session expired" message on
      // SESSION_EXPIRED; surface it instead of a generic network message.
      toast.error(error.message || "Failed due to a network or server error.");
    } finally {
      payInFlight.current = false;
      setLoadingPayout(null);
      setPayConfirm(null);
    }
  };

  const handleInitiateAll = () => {
    if (queue.length === 0) return;

    // Vendors with no payout account are skipped rather than attempted — each
    // one would be a guaranteed failure that leaves the payment in "failed"
    // and needs manual recovery.
    const readyQueue = queue.filter((p) => p.payoutReady);
    const blocked = queue.length - readyQueue.length;

    if (readyQueue.length === 0) {
      toast.error(
        `No payouts can be initiated: all ${blocked} pending payout(s) are blocked because the vendor has no payout account.`
      );
      return;
    }

    const blockedNote = blocked > 0
      ? `\n\n${blocked} payout(s) will be SKIPPED — those vendors have no payout account.`
      : '';
    setInitiateConfirm({
      queue: readyQueue,
      message: `Initiate ${readyQueue.length} payout(s)? This will sequentially call the payout API for each.${blockedNote}`,
    });
  };

  const runInitiateAll = async () => {
    const readyQueue = initiateConfirm?.queue || [];
    setInitiateBusy(true);
    let succeeded = 0;
    let failed = 0;

    for (const payout of readyQueue) {
      try {
        const response = await authFetch(`${API_URL}/admin/finance/payouts/${payout.paymentId}/settle`, {
          method: "POST",
        });
        const data = await response.json();
        if (response.ok || data.success) {
          succeeded += 1;
        } else {
          failed += 1;
        }
      } catch (err) {
        console.error("Payout error for", payout.id, err);
        failed += 1;
      }
    }

    setInitiateBusy(false);
    setInitiateConfirm(null);
    const summary = `Initiated all payouts: ${succeeded} succeeded, ${failed} failed.`;
    if (failed > 0) toast.error(summary); else toast.success(summary);
    onChanged?.(); // refresh queue + KPIs to reflect actual server state
  };

  return (
    <>
      {initiateConfirm && (
        <ConfirmDialog
          title="Initiate all payouts"
          message={initiateConfirm.message}
          confirmLabel="Initiate payouts"
          danger
          loading={initiateBusy}
          onConfirm={runInitiateAll}
          onCancel={() => setInitiateConfirm(null)}
        />
      )}

      {payConfirm && (
        <ConfirmDialog
          title={payConfirm.payoutStatus === 'failed' ? "Retry payout" : "Confirm payout"}
          message={`Pay ${formatINR(payConfirm.amount)} to ${payConfirm.vendor || 'this vendor'} for booking ${payConfirm.id}?\n\nThis sends real money through RazorpayX and cannot be undone from here.`}
          confirmLabel={`Pay ${formatINR(payConfirm.amount)}`}
          danger
          loading={loadingPayout === payConfirm.id}
          onConfirm={() => handlePayNow(payConfirm)}
          onCancel={() => setPayConfirm(null)}
        />
      )}

      <div className="bg-brand-gray-100 rounded-[20px] border border-white/5 overflow-hidden">
        <div className="p-5 px-6 border-b border-white/5 flex items-center justify-between">
          <span className="font-syne text-base font-bold">⏳ Payout Queue</span>
          <Button size="sm" loading={initiateBusy} onClick={handleInitiateAll}>
            Initiate All Payouts
          </Button>
        </div>
        {/* Header. Real <table> markup (was a div-grid) -- see UsersView.jsx
            for the reference pattern. Header and body are two adjacent
            tables rather than one, same as VendorsView: this view keeps the
            header visible through the loading/error/empty states too. */}
        <Table>
          <TableHeader>
            <TableRow className="border-white/5 hover:bg-transparent">
              {["Booking ID", "Vendor", "Service", "City", "Owed to vendor", "Time Left", "Action"].map(h => (
                <TableHead key={h} className="text-[10px] font-bold text-brand-gray-600 uppercase tracking-wider">{h}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
        </Table>
        {loading ? (
          <div className="py-6 flex items-center justify-center gap-3 text-sm text-brand-gray-700">
            <Spinner /> Loading payout queue...
          </div>
        ) : error ? (
          <ErrorState
            message={error}
            onRetry={onRetry}
            className="m-5"
          />
        ) : queue.length === 0 ? (
          <EmptyState icon="🎉" message="No pending payouts" />
        ) : (
          <Table>
            <TableBody>
              {queue.map((p) => {
                const cfg = urgencyConfig[p.status] || urgencyConfig.normal;
                return (
                  <TableRow key={p.id} className="border-white/5 hover:bg-white/5">
                    <TableCell className="text-xs text-brand-gray-700 font-mono">{p.id}</TableCell>
                    <TableCell className="text-sm font-semibold text-white">
                      {p.vendor}
                      {!p.payoutReady && (
                        <span
                          className="ml-2 text-[10px] font-bold text-[#ff9944]"
                          title={p.payoutBlockedReason || 'Vendor cannot be paid out'}
                        >
                          ⚠ NO PAYOUT ACCOUNT
                        </span>
                      )}
                      {/* Failed payouts are listed since 2026-11-03 so they can be
                          retried; before, they were only a number in the KPIs. */}
                      {p.payoutStatus === 'failed' && (
                        <span className="ml-2 text-[10px] font-bold text-[#ff3d3d]">LAST PAYOUT FAILED</span>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-brand-gray-800">{p.booking}</TableCell>
                    <TableCell className="text-xs text-brand-gray-800">{p.city}</TableCell>
                    {/* Same class of bug as the dashboard's "Platform Revenue" tile
                        -- p.amount arrives as a string, and .toLocaleString() on a
                        string is a no-op that lets a raw float straight through. */}
                    <TableCell className="font-syne text-base font-extrabold text-white">{formatINR(p.amount)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <Badge
                          size="sm"
                          label={`${p.hoursLeft}h`}
                          color={cfg.color}
                          bg={cfg.bg}
                          border={`${cfg.color}30`}
                          className="!rounded-full"
                        />
                      </div>
                    </TableCell>
                    <TableCell>
                      {/* Disabled rather than hidden when the vendor has no payout
                          account: the operator still needs to see the payable amount
                          and understand why it can't be settled yet. */}
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setPayConfirm(p)}
                        loading={loadingPayout === p.id}
                        disabled={!p.payoutReady}
                        title={!p.payoutReady ? (p.payoutBlockedReason || 'Vendor cannot be paid out') : undefined}
                        style={{
                          background: cfg.bg,
                          color: cfg.color,
                          border: `1px solid ${cfg.color}30`,
                        }}
                      >
                        {loadingPayout === p.id ? "Processing..." : (!p.payoutReady ? "Blocked" : p.payoutStatus === 'failed' ? "Retry" : "Pay Now")}
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>
    </>
  );
}

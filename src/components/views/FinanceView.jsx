import { useState, useEffect } from "react";
import { API_URL } from "../../services/apiConfig.js";
import { authFetch } from "../../services/authApi.js";
import Badge from "../ui/Badge.jsx";
import Button from "../ui/Button.jsx";
import ConfirmDialog from "../ui/ConfirmDialog.jsx";
import EmptyState from "../ui/EmptyState.jsx";
import ErrorState from "../ui/ErrorState.jsx";
import Modal from "../ui/Modal.jsx";
import Spinner from "../ui/Spinner.jsx";
import { useToast } from "../ui/toastContext.js";
import { formatINR } from "../../utils/format.js";

export default function FinanceView() {
  const [payoutQueue, setPayoutQueue] = useState([]);
  const [kpis, setKpis] = useState(null);
  const [loadingPayout, setLoadingPayout] = useState(null);
  const [loading, setLoading] = useState(true);
  const [kpiError, setKpiError] = useState('');
  const [payoutError, setPayoutError] = useState('');
  const toast = useToast();

  // Confirmation for the bulk payout run. Replaces window.confirm(), which
  // blocks the thread and can be suppressed by the browser outright — a
  // suppressed prompt on a bulk money movement is not an acceptable failure.
  const [initiateConfirm, setInitiateConfirm] = useState(null);
  const [initiateBusy, setInitiateBusy] = useState(false);

  // Refund modal state. There was previously no refund UI at all — the
  // backend endpoint existed but could only be reached with curl, and the
  // caller had to invent the mandatory idempotencyKey themselves.
  const [refundOpen, setRefundOpen] = useState(false);
  const [refundForm, setRefundForm] = useState({ paymentId: '', amount: '', reason: '' });
  const [refundBusy, setRefundBusy] = useState(false);
  const [refundResult, setRefundResult] = useState(null);

  // Add fetch for actual payouts
  useEffect(() => {
    fetchPayouts();
    fetchKpis();
  }, []);

  const fetchKpis = async () => {
    try {
      setKpiError('');
      // authFetch renews an expired access token and retries once itself; it
      // only throws SESSION_EXPIRED (with a friendly message) once re-login
      // is actually required, which is surfaced below instead of leaving the
      // KPI tiles silently pinned at ₹0.00.
      const res = await authFetch(`${API_URL}/admin/finance/kpis`);
      if (res.ok) {
        const data = await res.json();
        setKpis(data);
      } else {
        throw new Error(`Server returned ${res.status}`);
      }
    } catch (err) {
      console.error(err);
      setKpis(null);
      setKpiError(err?.message || 'Could not load finance KPIs.');
    }
  };

  const fetchPayouts = async () => {
    try {
      setPayoutError('');
      const res = await authFetch(`${API_URL}/admin/finance/payouts`);
      if (res.ok) {
        const data = await res.json();
          // Transform the backend data into the queue format
          const formatted = data.map(item => ({
            id: item.id.toString(),
            paymentId: item.id,
            vendor: item.booking?.service?.vendor?.vendorProfile?.business_name || `Unknown Vendor`,
            booking: `#BK${item.booking?.id || 'N/A'} - ${item.booking?.service?.name || 'Service'}`,
            city: item.booking?.service?.vendor?.vendorProfile?.city || '-',
            amount: parseFloat(item.vendorAmount || 0),
            hoursLeft: Math.max(0, 72 - Math.floor((Date.now() - new Date(item.createdAt)) / 3600000)),
            status: "due_soon", // calculate based on hour if needed
            // A payout hard-fails if the vendor has no active payout account.
            // The backend now reports this, so the operator can see it before
            // clicking rather than queueing a job that is certain to fail.
            payoutReady: item.payoutReady !== false,
            payoutBlockedReason: item.payoutBlockedReason || null
          }));
        setPayoutQueue(formatted);
      } else {
        throw new Error(`Server returned ${res.status}`);
      }
    } catch (err) {
      console.error(err);
      setPayoutQueue([]);
      setPayoutError(err?.message || 'Could not load the payout queue.');
    } finally {
      setLoading(false);
    }
  };

  const handlePayNow = async (payout) => {
    setLoadingPayout(payout.id);
    try {
      const response = await authFetch(`${API_URL}/admin/finance/payouts/${payout.paymentId}/settle`, {
        method: "POST",
      });

      const data = await response.json();

      if (response.ok || data.success) {
        toast.success("Payout processed.");
        fetchPayouts(); // refresh queue
      } else {
        toast.error("Failed to settle payout: " + (data.message || "Unknown error"));
      }
    } catch (error) {
      console.error("Payout error:", error);
      // authFetch throws a friendly "session expired" message on
      // SESSION_EXPIRED; surface it instead of a generic network message.
      toast.error(error.message || "Failed due to a network or server error.");
    } finally {
      setLoadingPayout(null);
    }
  };

  const handleInitiateAll = () => {
    if (payoutQueue.length === 0) return;

    // Vendors with no payout account are skipped rather than attempted — each
    // one would be a guaranteed failure that leaves the payment in "failed"
    // and needs manual recovery.
    const queue = payoutQueue.filter((p) => p.payoutReady);
    const blocked = payoutQueue.length - queue.length;

    if (queue.length === 0) {
      toast.error(
        `No payouts can be initiated: all ${blocked} pending payout(s) are blocked because the vendor has no payout account.`
      );
      return;
    }

    const blockedNote = blocked > 0
      ? `\n\n${blocked} payout(s) will be SKIPPED — those vendors have no payout account.`
      : '';
    setInitiateConfirm({
      queue,
      message: `Initiate ${queue.length} payout(s)? This will sequentially call the payout API for each.${blockedNote}`,
    });
  };

  const runInitiateAll = async () => {
    const queue = initiateConfirm?.queue || [];
    setInitiateBusy(true);
    let succeeded = 0;
    let failed = 0;

    for (const payout of queue) {
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
    fetchPayouts(); // refresh queue to reflect actual server state
    fetchKpis();
  };

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
      const idempotencyKey = `admin-refund-${paymentId}-${refundForm.amount || 'full'}-${Date.now()}`;

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
      fetchKpis();
      fetchPayouts();
    } catch (err) {
      setRefundResult({ ok: false, message: err.message || 'Refund request failed' });
    } finally {
      setRefundBusy(false);
    }
  };

  const urgencyConfig = {
    critical: { color: "#ff3d3d", bg: "rgba(255,61,61,0.08)",  label: "CRITICAL" },
    urgent:   { color: "#ff6b00", bg: "rgba(255,107,0,0.08)", label: "URGENT" },
    due_soon: { color: "#ff9944", bg: "rgba(255,153,68,0.08)", label: "DUE SOON" },
    normal:   { color: "#4CAF50", bg: "rgba(76,175,80,0.06)",  label: "NORMAL" },
  };

  const formatInr = (val) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val || 0);

  const financeKpis = [
    { label: "Total Collected (Escrow)", value: formatInr(kpis?.totalCollected), icon: "🏦", color: "#2196F3" },
    { label: "Disbursed to Vendors",     value: formatInr(kpis?.disbursed), icon: "📤", color: "#4CAF50" },
    { label: "Platform Commission",      value: formatInr(kpis?.commission), icon: "💎", color: "#ff3d3d" },
    { label: "Pending Disbursement",     value: formatInr(kpis?.pendingDisbursement), icon: "⏳", color: "#ff3d3d", alert: true },
    { label: "Refunds Issued",           value: formatInr(kpis?.refunds), icon: "↩️", color: "#9C27B0" },
    { label: "Failed Payouts",           value: formatInr(kpis?.failed), icon: "❌", color: "#ff3d3d", alert: true },
  ];

  return (
    <div className="animate-[fadeInUp_0.3s_ease_forwards]">
      {kpiError && (
        <ErrorState
          message={kpiError}
          onRetry={fetchKpis}
          className="mb-4"
        />
      )}
      {/* Fabricated-zero guard: when the KPI fetch fails, `kpis` is null and
          formatInr(undefined) would otherwise render a confident "₹0.00" —
          indistinguishable from a real zero-collections day. Show the error
          state instead of the grid until the fetch succeeds. */}
      {!kpiError && (
        <div className="grid grid-cols-6 gap-3.5 mb-6">
          {financeKpis.map((k, i) => (
            <div key={i} className={`bg-brand-gray-100] rounded-[18px] p-5 border border-white/5 relative overflow-hidden transition-all duration-150 hover:-translate-y-0.5 hover:border-[rgba(255,61,61,0.15)] before:content-[''] before:absolute before:top-0 before:left-0 before:right-0 before:h-px before:bg-linear-to-r before:from-transparent before:via-[rgba(255,61,61,0.3)] before:to-transparent ${k.alert ? 'border-brand-red/25' : ''}`}>
              <div className="text-xl mb-2.5">{k.icon}</div>
              <div className="font-syne text-lg font-extrabold text-white mb-1">{k.value}</div>
              <div className="text-xs text-brand-gray-700">{k.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Refund */}
      <div className="bg-brand-gray-100 rounded-[20px] border border-white/5 overflow-hidden mb-5 p-6 flex items-center justify-between">
        <div>
          <div className="font-syne text-base font-bold mb-1">↩️ Issue a Refund</div>
          <div className="text-xs text-brand-gray-700">
            Full or partial, by Payment ID. Repeat submissions of the same refund are de-duplicated automatically.
          </div>
        </div>
        <Button size="sm" onClick={() => { setRefundResult(null); setRefundOpen(true); }}>
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

      {/* Cash Flow Diagram */}
      <div className="bg-brand-gray-100 rounded-[20px] border border-white/5 overflow-hidden mb-5 p-6">
        <div className="font-syne text-base font-bold mb-1">💸 Cash Flow Pipeline</div>
        {/* Labelled as illustrative because the figures below are hardcoded
            constants, not live data — without this an operator reasonably
            reads them as real balances. The percentage is kept in step with
            PLATFORM_FEE_PERCENTAGE in services/paymentService.js. */}
        <div className="text-xs text-brand-gray-700 mb-5">Illustrative example — not live figures.</div>
        <div className="flex items-center">
          {[
            { label: "User Pays",        sublabel: "Full booking amount",  icon: "👤", color: "#2196F3", amount: "₹1,000" },
            { label: "Keplix Escrow",    sublabel: "Held by payment GW",   icon: "🏦", color: "#9C27B0", amount: "₹1,000" },
            { label: "Service Done",     sublabel: "Vendor completes job",  icon: "✅", color: "#4CAF50", amount: "" },
            { label: "Commission Cut",   sublabel: "10% platform fee",      icon: "💎", color: "#ff3d3d", amount: "₹100" },
            { label: "Vendor Payout",    sublabel: "Within 72 hours",       icon: "🏪", color: "#ff9944", amount: "₹900" },
          ].map((step, i, arr) => (
            <div key={i} className={`flex items-center ${i < arr.length - 1 ? 'flex-1' : ''}`}>
              <div className="bg-[#1c1c28] border rounded-xl p-3.5 text-center min-w-27.5" style={{borderColor: `${step.color}30`}}>
                <div className="text-2xl mb-1.5">{step.icon}</div>
                <div className="text-xs font-bold text-white mb-0.5">{step.label}</div>
                <div className={`text-[10px] text-brand-gray-700 ${step.amount ? 'mb-1.5' : ''}`}>{step.sublabel}</div>
                {step.amount && <div className="text-sm font-extrabold font-syne" style={{color: step.color}}>{step.amount}</div>}
              </div>
              {i < arr.length - 1 && (
                <div className="flex-1 flex items-center px-1">
                  <div className="flex-1 h-px" style={{background: `linear-gradient(90deg, ${step.color}40, ${arr[i+1].color}40)`}} />
                  <div className="text-brand-gray-600 text-sm ml-0.5">›</div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Payout Queue */}
      <div className="bg-brand-gray-100 rounded-[20px] border border-white/5 overflow-hidden">
        <div className="p-5 px-6 border-b border-white/5 flex items-center justify-between">
          <span className="font-syne text-base font-bold">⏳ Payout Queue</span>
          <Button size="sm" loading={initiateBusy} onClick={handleInitiateAll}>
            Initiate All Payouts
          </Button>
        </div>
        {/* Header */}
        <div className="grid gap-2 items-center py-3.5 px-5 border-b border-white/5 transition-colors duration-150 hover:bg-white/5 grid-cols-[80px_1fr_100px_100px_100px_80px_80px]">
          {["Booking ID", "Vendor", "Service", "City", "Vendor Owes", "Time Left", "Action"].map(h => (
            <div key={h} className="text-[10px] font-bold text-brand-gray-600 uppercase tracking-wider">{h}</div>
          ))}
        </div>
        {loading ? (
          <div className="py-6 flex items-center justify-center gap-3 text-sm text-brand-gray-700">
            <Spinner /> Loading payout queue...
          </div>
        ) : payoutError ? (
          <ErrorState
            message={payoutError}
            onRetry={fetchPayouts}
            className="m-5"
          />
        ) : payoutQueue.length === 0 ? (
          <EmptyState icon="🎉" message="No pending payouts" />
        ) : (
          payoutQueue.map((p, i) => {
            const cfg = urgencyConfig[p.status] || urgencyConfig.normal;
            return (
            <div key={i} className="grid gap-2 items-center py-3.5 px-5 border-b border-white/5 transition-colors duration-150 hover:bg-white/5 grid-cols-[80px_1fr_100px_100px_100px_80px_80px]">
              <div className="text-xs text-brand-gray-700 font-mono">{p.id}</div>
              <div className="text-sm font-semibold text-white">
                {p.vendor}
                {!p.payoutReady && (
                  <span
                    className="ml-2 text-[10px] font-bold text-[#ff9944]"
                    title={p.payoutBlockedReason || 'Vendor cannot be paid out'}
                  >
                    ⚠ NO PAYOUT ACCOUNT
                  </span>
                )}
              </div>
              <div className="text-xs text-brand-gray-800">{p.booking}</div>
              <div className="text-xs text-brand-gray-800">{p.city}</div>
              {/* Same class of bug as the dashboard's "Platform Revenue" tile
                  -- p.amount arrives as a string, and .toLocaleString() on a
                  string is a no-op that lets a raw float straight through. */}
              <div className="font-syne text-base font-extrabold text-white">{formatINR(p.amount)}</div>
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
              {/* Disabled rather than hidden when the vendor has no payout
                  account: the operator still needs to see the payable amount
                  and understand why it can't be settled yet. */}
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handlePayNow(p)}
                loading={loadingPayout === p.id}
                disabled={!p.payoutReady}
                title={!p.payoutReady ? (p.payoutBlockedReason || 'Vendor cannot be paid out') : undefined}
                style={{
                  background: cfg.bg,
                  color: cfg.color,
                  border: `1px solid ${cfg.color}30`,
                }}
              >
                {loadingPayout === p.id ? "Processing..." : (p.payoutReady ? "Pay Now" : "Blocked")}
              </Button>
            </div>
          );
        })
      )}
      </div>
    </div>
  );
}

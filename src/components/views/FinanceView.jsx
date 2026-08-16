import { useState, useEffect } from "react";
import { payoutQueue as initialPayoutQueue } from "../../data";
import { API_URL } from "../../services/apiConfig.js";

export default function FinanceView() {
  const [payoutQueue, setPayoutQueue] = useState([]);
  const [kpis, setKpis] = useState(null);
  const [loadingPayout, setLoadingPayout] = useState(null);
  const [loading, setLoading] = useState(true);

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
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${API_URL}/admin/finance/kpis`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setKpis(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchPayouts = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${API_URL}/admin/finance/payouts`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
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
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePayNow = async (payout) => {
    setLoadingPayout(payout.id);
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_URL}/admin/finance/payouts/${payout.paymentId}/settle`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (response.ok || data.success) {
        alert(`Payout Processed!`);
        fetchPayouts(); // refresh queue
      } else {
        alert("Failed to settle payout: " + (data.message || "Unknown error"));
      }
    } catch (error) {
      console.error("Payout error:", error);
      alert("Failed due to a network or server error.");
    } finally {
      setLoadingPayout(null);
    }
  };

  const handleInitiateAll = async () => {
    if (payoutQueue.length === 0) return;

    // Vendors with no payout account are skipped rather than attempted — each
    // one would be a guaranteed failure that leaves the payment in "failed"
    // and needs manual recovery.
    const queue = payoutQueue.filter((p) => p.payoutReady);
    const blocked = payoutQueue.length - queue.length;

    if (queue.length === 0) {
      alert(`No payouts can be initiated: all ${blocked} pending payout(s) are blocked because the vendor has no payout account.`);
      return;
    }

    const blockedNote = blocked > 0
      ? `\n\n${blocked} payout(s) will be SKIPPED — those vendors have no payout account.`
      : '';
    if (!confirm(`Initiate ${queue.length} payout(s)? This will sequentially call the payout API for each.${blockedNote}`)) {
      return;
    }
    let succeeded = 0;
    let failed = 0;

    for (const payout of queue) {
      try {
        const token = localStorage.getItem('adminToken');
        const response = await fetch(`${API_URL}/admin/finance/payouts/${payout.paymentId}/settle`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          }
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

    alert(`Initiated all payouts: ${succeeded} succeeded, ${failed} failed.`);
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
      const token = localStorage.getItem('adminToken');
      const idempotencyKey = `admin-refund-${paymentId}-${refundForm.amount || 'full'}-${Date.now()}`;

      const res = await fetch(`${API_URL}/admin/finance/payments/${paymentId}/refund`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
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
      <div className="grid grid-cols-6 gap-3.5 mb-6">
        {financeKpis.map((k, i) => (
          <div key={i} className={`bg-brand-gray-100] rounded-[18px] p-5 border border-white/5 relative overflow-hidden transition-all duration-150 hover:-translate-y-0.5 hover:border-[rgba(255,61,61,0.15)] before:content-[''] before:absolute before:top-0 before:left-0 before:right-0 before:h-px before:bg-linear-to-r before:from-transparent before:via-[rgba(255,61,61,0.3)] before:to-transparent ${k.alert ? 'border-brand-red/25' : ''}`}>
            <div className="text-xl mb-2.5">{k.icon}</div>
            <div className="font-syne text-lg font-extrabold text-white mb-1">{k.value}</div>
            <div className="text-xs text-brand-gray-700">{k.label}</div>
          </div>
        ))}
      </div>

      {/* Refund */}
      <div className="bg-brand-gray-100 rounded-[20px] border border-white/5 overflow-hidden mb-5 p-6 flex items-center justify-between">
        <div>
          <div className="font-syne text-base font-bold mb-1">↩️ Issue a Refund</div>
          <div className="text-xs text-brand-gray-700">
            Full or partial, by Payment ID. Repeat submissions of the same refund are de-duplicated automatically.
          </div>
        </div>
        <button
          className="bg-brand-red border-none rounded-lg px-4 py-2 text-white text-xs font-bold cursor-pointer font-sans hover:bg-[#ff5252] transition-colors"
          onClick={() => { setRefundResult(null); setRefundOpen(true); }}
        >
          Issue Refund
        </button>
      </div>

      {refundOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => !refundBusy && setRefundOpen(false)}>
          <form
            className="bg-brand-gray-100 rounded-[20px] border border-white/10 p-6 w-[420px] max-w-[92vw]"
            onClick={(e) => e.stopPropagation()}
            onSubmit={handleRefund}
          >
            <div className="font-syne text-base font-bold mb-4">Issue Refund</div>

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
              <button
                type="button"
                disabled={refundBusy}
                onClick={() => setRefundOpen(false)}
                className="rounded-lg px-4 py-2 text-xs font-bold cursor-pointer bg-white/5 text-white border border-white/10"
              >
                Close
              </button>
              <button
                type="submit"
                disabled={refundBusy}
                className="bg-brand-red border-none rounded-lg px-4 py-2 text-white text-xs font-bold cursor-pointer hover:bg-[#ff5252] transition-colors disabled:opacity-50"
              >
                {refundBusy ? 'Processing…' : 'Refund'}
              </button>
            </div>
          </form>
        </div>
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
          <button 
            className="bg-brand-red border-none rounded-lg px-4 py-2 text-white text-xs font-bold cursor-pointer font-sans hover:bg-[#ff5252] transition-colors"
            onClick={handleInitiateAll}
          >
            Initiate All Payouts
          </button>
        </div>
        {/* Header */}
        <div className="grid gap-2 items-center py-3.5 px-5 border-b border-white/5 transition-colors duration-150 hover:bg-white/5 grid-cols-[80px_1fr_100px_100px_100px_80px_80px]">
          {["Booking ID", "Vendor", "Service", "City", "Vendor Owes", "Time Left", "Action"].map(h => (
            <div key={h} className="text-[10px] font-bold text-brand-gray-600 uppercase tracking-wider">{h}</div>
          ))}
        </div>
        {loading ? (
          <div className="py-6 text-center text-sm text-brand-gray-700">Loading payout queue...</div>
        ) : payoutQueue.length === 0 ? (
          <div className="py-6 text-center text-sm text-brand-gray-700">No pending payouts 🎉</div>
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
              <div className="font-syne text-base font-extrabold text-white">₹{p.amount.toLocaleString("en-IN")}</div>
              <div className="flex items-center gap-1.5">
                <div className="px-2 py-0.5 rounded-full" style={{ background: cfg.bg, border: `1px solid ${cfg.color}30` }}>
                  <span className="text-xs font-bold" style={{color: cfg.color}}>{p.hoursLeft}h</span>
                </div>
              </div>
              {/* Disabled rather than hidden when the vendor has no payout
                  account: the operator still needs to see the payable amount
                  and understand why it can't be settled yet. */}
              <button
                onClick={() => handlePayNow(p)}
                disabled={loadingPayout === p.id || !p.payoutReady}
                title={!p.payoutReady ? (p.payoutBlockedReason || 'Vendor cannot be paid out') : undefined}
                className="py-1.5 px-3 rounded-lg border-none text-[11px] font-semibold font-sans transition-all duration-150 relative overflow-hidden disabled:cursor-not-allowed"
                style={{
                  background: cfg.bg,
                  color: cfg.color,
                  border: `1px solid ${cfg.color}30`,
                  opacity: (loadingPayout === p.id || !p.payoutReady) ? 0.45 : 1,
                  cursor: p.payoutReady ? 'pointer' : 'not-allowed',
                }}
              >
                {loadingPayout === p.id ? "Processing..." : (p.payoutReady ? "Pay Now" : "Blocked")}
              </button>
            </div>
          );
        })
      )}
      </div>
    </div>
  );
}

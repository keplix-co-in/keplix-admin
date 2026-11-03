import { useEffect, useState } from "react";
import { API_URL } from "../../services/apiConfig.js";
import { authFetch } from "../../services/authApi.js";
import FinanceKpis from "./finance/FinanceKpis.jsx";
import RefundPanel from "./finance/RefundPanel.jsx";
import CashFlowPipeline from "./finance/CashFlowPipeline.jsx";
import PayoutQueue from "./finance/PayoutQueue.jsx";

/**
 * Was 500+ lines covering KPIs, the refund flow, the illustrative cash-flow
 * diagram and the payout queue all in one component. Split into
 * ./finance/*.jsx, each owning its own local UI state; this component only
 * owns the two data fetches both KPIs and the payout queue actually need,
 * and passes them down.
 */
export default function FinanceView() {
  const [payoutQueue, setPayoutQueue] = useState([]);
  const [kpis, setKpis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [kpiError, setKpiError] = useState('');
  const [payoutError, setPayoutError] = useState('');

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

  return (
    <div className="animate-[fadeInUp_0.3s_ease_forwards]">
      <FinanceKpis kpis={kpis} error={kpiError} onRetry={fetchKpis} />

      <RefundPanel
        onRefundSuccess={() => {
          fetchKpis();
          fetchPayouts();
        }}
      />

      <CashFlowPipeline />

      <PayoutQueue
        queue={payoutQueue}
        loading={loading}
        error={payoutError}
        onRetry={fetchPayouts}
        onChanged={() => {
          fetchPayouts();
          fetchKpis();
        }}
      />
    </div>
  );
}

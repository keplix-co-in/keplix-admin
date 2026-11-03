import ErrorState from "../../ui/ErrorState.jsx";

const formatInr = (val) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val || 0);

/**
 * Top KPI strip. Split out of FinanceView.jsx (which had grown to 500+ lines
 * covering KPIs, the refund flow, the cash-flow diagram and the payout
 * queue in one component) -- this piece owns nothing but rendering `kpis`.
 */
export default function FinanceKpis({ kpis, error, onRetry }) {
  const financeKpis = [
    { label: "Total Collected (Escrow)", value: formatInr(kpis?.totalCollected), icon: "🏦", color: "#2196F3" },
    { label: "Disbursed to Vendors",     value: formatInr(kpis?.disbursed), icon: "📤", color: "#4CAF50" },
    { label: "Platform Commission",      value: formatInr(kpis?.commission), icon: "💎", color: "#ff3d3d" },
    { label: "Pending Disbursement",     value: formatInr(kpis?.pendingDisbursement), icon: "⏳", color: "#ff3d3d", alert: true },
    { label: "Refunds Issued",           value: formatInr(kpis?.refunds), icon: "↩️", color: "#9C27B0" },
    { label: "Failed Payouts",           value: formatInr(kpis?.failed), icon: "❌", color: "#ff3d3d", alert: true },
  ];

  if (error) {
    return <ErrorState message={error} onRetry={onRetry} className="mb-4" />;
  }

  // Fabricated-zero guard: when the KPI fetch fails, `kpis` is null and
  // formatInr(undefined) would otherwise render a confident "₹0.00" --
  // indistinguishable from a real zero-collections day. The error branch
  // above renders instead of this grid until the fetch succeeds.
  return (
    <div className="grid grid-cols-6 gap-3.5 mb-6">
      {financeKpis.map((k, i) => (
        <div key={i} className={`bg-brand-gray-100] rounded-[18px] p-5 border border-white/5 relative overflow-hidden transition-all duration-150 hover:-translate-y-0.5 hover:border-[rgba(255,61,61,0.15)] before:content-[''] before:absolute before:top-0 before:left-0 before:right-0 before:h-px before:bg-linear-to-r before:from-transparent before:via-[rgba(255,61,61,0.3)] before:to-transparent ${k.alert ? 'border-brand-red/25' : ''}`}>
          <div className="text-xl mb-2.5">{k.icon}</div>
          <div className="font-syne text-lg font-extrabold text-white mb-1">{k.value}</div>
          <div className="text-xs text-brand-gray-700">{k.label}</div>
        </div>
      ))}
    </div>
  );
}

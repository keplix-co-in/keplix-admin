import { payoutQueue } from "../../data";

export default function FinanceView() {
  const urgencyConfig = {
    critical: { color: "#ff3d3d", bg: "rgba(255,61,61,0.08)",  label: "CRITICAL" },
    urgent:   { color: "#ff6b00", bg: "rgba(255,107,0,0.08)", label: "URGENT" },
    due_soon: { color: "#ff9944", bg: "rgba(255,153,68,0.08)", label: "DUE SOON" },
    normal:   { color: "#4CAF50", bg: "rgba(76,175,80,0.06)",  label: "NORMAL" },
  };

  const financeKpis = [
    { label: "Total Collected (Escrow)", value: "₹4,52,800", icon: "🏦", color: "#2196F3" },
    { label: "Disbursed to Vendors",     value: "₹3,87,200", icon: "📤", color: "#4CAF50" },
    { label: "Platform Commission",      value: "₹65,600",   icon: "💎", color: "#ff3d3d" },
    { label: "Pending Disbursement",     value: "₹9,333",    icon: "⏳", color: "#ff3d3d", alert: true },
    { label: "Refunds Issued",           value: "₹6,200",    icon: "↩️", color: "#9C27B0" },
    { label: "Failed Payouts",           value: "₹1,100",    icon: "❌", color: "#ff3d3d", alert: true },
  ];

  return (
    <div className="animate-[fadeInUp_0.3s_ease_forwards]">
      <div className="grid grid-cols-6 gap-3.5 mb-6">
        {financeKpis.map((k, i) => (
          <div key={i} className={`bg-[#141420] rounded-[18px] p-5 border border-white/5 relative overflow-hidden transition-all duration-150 hover:-translate-y-0.5 hover:border-[rgba(255,61,61,0.15)] before:content-[''] before:absolute before:top-0 before:left-0 before:right-0 before:h-px before:bg-linear-to-r before:from-transparent before:via-[rgba(255,61,61,0.3)] before:to-transparent ${k.alert ? 'border-brand-red/25' : ''}`}>
            <div className="text-xl mb-2.5">{k.icon}</div>
            <div className="font-syne text-lg font-extrabold text-white mb-1">{k.value}</div>
            <div className="text-xs text-brand-gray-700">{k.label}</div>
          </div>
        ))}
      </div>

      {/* Cash Flow Diagram */}
      <div className="bg-[#141420] rounded-[20px] border border-white/5 overflow-hidden mb-5 p-6">
        <div className="font-syne text-base font-bold mb-5">💸 Cash Flow Pipeline</div>
        <div className="flex items-center">
          {[
            { label: "User Pays",        sublabel: "Full booking amount",  icon: "👤", color: "#2196F3", amount: "₹1,000" },
            { label: "Keplix Escrow",    sublabel: "Held by payment GW",   icon: "🏦", color: "#9C27B0", amount: "₹1,000" },
            { label: "Service Done",     sublabel: "Vendor completes job",  icon: "✅", color: "#4CAF50", amount: "" },
            { label: "Commission Cut",   sublabel: "15% platform fee",      icon: "💎", color: "#ff3d3d", amount: "₹150" },
            { label: "Vendor Payout",    sublabel: "Within 72 hours",       icon: "🏪", color: "#ff9944", amount: "₹850" },
          ].map((step, i, arr) => (
            <div key={i} className={`flex items-center ${i < arr.length - 1 ? 'flex-1' : ''}`}>
              <div className="bg-[#1c1c28] border rounded-xl p-3.5 text-center min-w-[110px]" style={{borderColor: `${step.color}30`}}>
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
      <div className="bg-[#141420] rounded-[20px] border border-white/5 overflow-hidden">
        <div className="p-5 px-6 border-b border-white/5 flex items-center justify-between">
          <span className="font-syne text-base font-bold">⏳ Payout Queue</span>
          <button className="bg-brand-red border-none rounded-lg px-4 py-2 text-white text-xs font-bold cursor-pointer font-sans">
            Initiate All Payouts
          </button>
        </div>
        {/* Header */}
        <div className="grid gap-2 items-center py-3.5 px-5 border-b border-white/5 transition-colors duration-150 hover:bg-white/5 grid-cols-[80px_1fr_100px_100px_100px_80px_80px] border-b border-brand-gray-400/60">
          {["Booking ID", "Vendor", "Service", "City", "Vendor Owes", "Time Left", "Action"].map(h => (
            <div key={h} className="text-[10px] font-bold text-brand-gray-600 uppercase tracking-wider">{h}</div>
          ))}
        </div>
        {payoutQueue.map((p, i) => {
          const cfg = urgencyConfig[p.status];
          return (
            <div key={i} className="grid gap-2 items-center py-3.5 px-5 border-b border-white/5 transition-colors duration-150 hover:bg-white/5 grid-cols-[80px_1fr_100px_100px_100px_80px_80px]">
              <div className="text-xs text-brand-gray-700 font-mono">{p.id}</div>
              <div className="text-sm font-semibold text-white">{p.vendor}</div>
              <div className="text-xs text-brand-gray-800">{p.booking}</div>
              <div className="text-xs text-brand-gray-800">{p.city}</div>
              <div className="font-syne text-base font-extrabold text-white">₹{p.amount.toLocaleString("en-IN")}</div>
              <div className="flex items-center gap-1.5">
                <div className="px-2 py-0.5 rounded-full" style={{ background: cfg.bg, border: `1px solid ${cfg.color}30` }}>
                  <span className="text-xs font-bold" style={{color: cfg.color}}>{p.hoursLeft}h</span>
                </div>
              </div>
              <button className="py-1.5 px-3 rounded-lg border-none text-[11px] font-semibold cursor-pointer font-sans transition-all duration-150" style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.color}30` }}>
                Pay Now
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

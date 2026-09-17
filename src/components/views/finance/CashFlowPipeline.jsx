const STEPS = [
  { label: "User Pays",      sublabel: "Full booking amount", icon: "👤", color: "#2196F3", amount: "₹1,000" },
  { label: "Keplix Escrow",  sublabel: "Held by payment GW",  icon: "🏦", color: "#9C27B0", amount: "₹1,000" },
  { label: "Service Done",   sublabel: "Vendor completes job", icon: "✅", color: "#4CAF50", amount: "" },
  { label: "Commission Cut", sublabel: "10% platform fee",     icon: "💎", color: "#ff3d3d", amount: "₹100" },
  { label: "Vendor Payout",  sublabel: "Within 72 hours",      icon: "🏪", color: "#ff9944", amount: "₹900" },
];

/**
 * Static illustrative diagram, no props/state -- split out of FinanceView.jsx.
 * Labelled as illustrative because the figures are hardcoded constants, not
 * live data — without this an operator reasonably reads them as real
 * balances. The 10% is kept in step with PLATFORM_FEE_PERCENTAGE in
 * services/paymentService.js.
 */
export default function CashFlowPipeline() {
  return (
    <div className="bg-brand-gray-100 rounded-[20px] border border-white/5 overflow-hidden mb-5 p-6">
      <div className="font-syne text-base font-bold mb-1">💸 Cash Flow Pipeline</div>
      <div className="text-xs text-brand-gray-700 mb-5">Illustrative example — not live figures.</div>
      <div className="flex items-center">
        {STEPS.map((step, i, arr) => (
          <div key={i} className={`flex items-center ${i < arr.length - 1 ? 'flex-1' : ''}`}>
            <div className="bg-[#1c1c28] border rounded-xl p-3.5 text-center min-w-27.5" style={{ borderColor: `${step.color}30` }}>
              <div className="text-2xl mb-1.5">{step.icon}</div>
              <div className="text-xs font-bold text-white mb-0.5">{step.label}</div>
              <div className={`text-[10px] text-brand-gray-700 ${step.amount ? 'mb-1.5' : ''}`}>{step.sublabel}</div>
              {step.amount && <div className="text-sm font-extrabold font-syne" style={{ color: step.color }}>{step.amount}</div>}
            </div>
            {i < arr.length - 1 && (
              <div className="flex-1 flex items-center px-1">
                <div className="flex-1 h-px" style={{ background: `linear-gradient(90deg, ${step.color}40, ${arr[i + 1].color}40)` }} />
                <div className="text-brand-gray-600 text-sm ml-0.5">›</div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

const STEPS = [
  { label: "Customer Pays Garage", sublabel: "Cash or the garage UPI", icon: "👤", color: "#2196F3", amount: "" },
  { label: "Garage Marks Paid",    sublabel: "Cash / UPI / card",      icon: "✅", color: "#4CAF50", amount: "" },
  { label: "Garage Subscription",  sublabel: "Paid online to Keplix",  icon: "💎", color: "#d9040d", amount: "" },
];

/**
 * Static diagram, no props/state. Since 2026-11-23 customers pay the garage
 * directly; the payment gateway is used only for garage subscriptions, and the
 * old 10% fee / escrow / payout flow no longer applies to new bookings.
 */
export default function CashFlowPipeline() {
  return (
    <div className="bg-brand-gray-100 rounded-[20px] border border-white/5 overflow-hidden mb-5 p-6">
      <div className="font-syne text-base font-bold mb-1">💸 How money flows now</div>
      <div className="text-xs text-brand-gray-700 mb-5">Customers pay the garage directly. Online payments are only for garage subscriptions.</div>
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

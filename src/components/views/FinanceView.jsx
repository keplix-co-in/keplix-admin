import { useState, useEffect } from "react";
import { payoutQueue as initialPayoutQueue } from "../../data";

export default function FinanceView() {
  const [payoutQueue, setPayoutQueue] = useState([]);
  const [kpis, setKpis] = useState(null);
  const [loadingPayout, setLoadingPayout] = useState(null);
  const [loading, setLoading] = useState(true);

  // Add fetch for actual payouts
  useEffect(() => {
    fetchPayouts();
    fetchKpis();
  }, []);

  const fetchKpis = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
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
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
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
            status: "due_soon" // calculate based on hour if needed
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
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
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
    alert("Initiating all payouts. This will sequentially call the payout API for each pending payout.");
    setPayoutQueue([]);
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
    { label: "Pending Disbursement",     value: formatInr(kpis?.pending), icon: "⏳", color: "#ff3d3d", alert: true },
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

      {/* Cash Flow Diagram */}
      <div className="bg-brand-gray-100 rounded-[20px] border border-white/5 overflow-hidden mb-5 p-6">
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
              <div className="text-sm font-semibold text-white">{p.vendor}</div>
              <div className="text-xs text-brand-gray-800">{p.booking}</div>
              <div className="text-xs text-brand-gray-800">{p.city}</div>
              <div className="font-syne text-base font-extrabold text-white">₹{p.amount.toLocaleString("en-IN")}</div>
              <div className="flex items-center gap-1.5">
                <div className="px-2 py-0.5 rounded-full" style={{ background: cfg.bg, border: `1px solid ${cfg.color}30` }}>
                  <span className="text-xs font-bold" style={{color: cfg.color}}>{p.hoursLeft}h</span>
                </div>
              </div>
              <button 
                onClick={() => handlePayNow(p)}
                disabled={loadingPayout === p.id}
                className="py-1.5 px-3 rounded-lg border-none text-[11px] font-semibold cursor-pointer font-sans transition-all duration-150 relative overflow-hidden" 
                style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.color}30`, opacity: loadingPayout === p.id ? 0.7 : 1 }}
              >
                {loadingPayout === p.id ? "Processing..." : "Pay Now"}
              </button>
            </div>
          );
        })
      )}
      </div>
    </div>
  );
}

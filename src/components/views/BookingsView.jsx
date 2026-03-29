import { bookings } from "../../data";
import { bookingStatusConfig } from "../../data/config";

export default function BookingsView({ filter, setFilter }) {
  const filters = ["All", "Completed", "In Progress", "Confirmed", "Disputed", "Cancelled"];
  const keyMap = { "All": "All", "Completed": "completed", "In Progress": "in_progress", "Confirmed": "confirmed", "Disputed": "disputed", "Cancelled": "cancelled" };
  const filtered = bookings.filter(b => filter === "All" || b.status === keyMap[filter]);

  return (
    <div className="animate-[fadeInUp_0.3s_ease_forwards]">
      <div className="flex gap-2 mb-5 flex-wrap">
        {filters.map(f => (
          <button key={f} className={`py-1.5 px-3.5 rounded-full text-xs font-semibold cursor-pointer border border-white/10 bg-transparent text-[rgba(255,255,255,0.35)] transition-all duration-150 font-sans${filter === f ? " text-white bg-[rgba(255,61,61,0.12)] border-[rgba(255,61,61,0.2)] shadow-[inset_2px_0_0_#ff3d3d]" : ""}`} onClick={() => setFilter(f)}>{f}</button>
        ))}
      </div>
      <div className="bg-[#141420] rounded-[20px] border border-white/5 overflow-hidden">
        <div className="grid grid-cols-[90px_140px_130px_160px_140px_120px_90px_80px_90px] gap-2 px-5 py-3 border-b border-brand-gray-400/60">
          {["Booking ID", "Customer", "Phone", "Vendor", "Service", "Slot", "Amount", "Fee", "Status"].map(h => (
            <div key={h} className="text-[10px] font-bold text-brand-gray-600 uppercase tracking-wider">{h}</div>
          ))}
        </div>
        {filtered.map((b, i) => {
          const sc = bookingStatusConfig[b.status];
          return (
            <div key={i} className="grid items-center py-3 px-4 rounded-lg transition-colors duration-150 border-b border-white/5 hover:bg-white/5 grid-cols-[90px_140px_130px_160px_140px_120px_90px_80px_90px] gap-2">
              <div className="text-xs text-brand-red/70 font-mono font-bold">{b.id}</div>
              <div className="text-sm font-semibold text-white">{b.user}</div>
              <div className="text-xs text-brand-gray-700 font-mono">{b.phone}</div>
              <div className="text-xs text-brand-gray-800">{b.vendor}</div>
              <div className="text-xs text-brand-gray-800">{b.service}</div>
              <div className="text-[10px] text-brand-gray-700">{b.slot}</div>
              <div className="font-syne text-sm font-extrabold text-white">₹{b.amount.toLocaleString("en-IN")}</div>
              <div className="text-sm font-semibold text-brand-red">₹{b.commission}</div>
              <div><span className="inline-flex items-center py-[3px] px-2.5 rounded-full text-[10px] font-bold tracking-[0.3px] border" style={{ color: sc.color, background: sc.bg, borderColor: sc.border }}>{sc.label}</span></div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { funnelData, cityData } from "../../data";
import { retentionData } from "../../data/AnalyticsViewMock";

export default function AnalyticsView() {
  return (
    <div className="animate-[fadeInUp_0.3s_ease_forwards]">
      <div className="grid grid-cols-2 gap-4 mb-4">
        {/* Booking Funnel */}
        <div className="bg-[#141420] rounded-[20px] border border-white/5 overflow-hidden">
          <div className="p-5 px-6 border-b border-white/5 flex items-center justify-between"><span className="font-syne text-base font-bold">📊 Booking Funnel</span></div>
          <div className="p-6">
            {funnelData.map((f, i) => (
              <div key={i} className="mb-3.5">
                <div className="flex justify-between mb-1.5">
                  <span className="text-sm text-brand-gray-800">{f.stage}</span>
                  <span className="text-sm font-bold text-white">{f.users.toLocaleString()}</span>
                </div>
                <div className="h-2 bg-brand-gray-500/70 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-linear-to-r from-brand-red to-[#ff6b00]"
                    style={{
                      width: `${(f.users / funnelData[0].users) * 100}%`,
                      opacity: 1 - i * 0.15,
                    }}
                  />
                </div>
                {i < funnelData.length - 1 && (
                  <div className="text-xs text-brand-red/70 mt-1">
                    ↓ {Math.round((1 - funnelData[i+1].users / f.users) * 100)}% drop-off
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Retention */}
        <div className="bg-brand-gray-100 rounded-[20px] border border-white/5 overflow-hidden">
          <div className="p-5 px-6 border-b border-white/5 flex items-center justify-between">
            <span className="font-syne text-base font-bold">🔁 Repeat Booking Rate</span>
            <span className="text-xs font-bold text-green-500">↑ Trending Up</span>
          </div>
          <div className="p-5 pr-2">
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={retentionData}>
                <XAxis dataKey="week" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }} axisLine={false} tickLine={false} domain={[20, 60]} tickFormatter={v => `${v}%`} />
                <Tooltip content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null;
                  return <div className="bg-brand-gray-200 border border-green-500/20 rounded-lg p-2">
                    <p className="text-green-500 text-sm font-bold">{label}: {payload[0].value}%</p>
                  </div>;
                }} />
                <Line type="monotone" dataKey="rate" stroke="#4CAF50" strokeWidth={2.5} dot={{ fill: "#4CAF50", r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* City Breakdown */}
      <div className="bg-[#141420] rounded-[20px] border border-white/5 overflow-hidden">
        <div className="p-5 px-6 border-b border-white/5 flex items-center justify-between"><span className="font-syne text-base font-bold">📍 City-wise Performance</span></div>
        <div className="pb-2">
          <div className="grid grid-cols-[1fr_120px_140px_100px_80px] gap-3 px-6 py-3 border-b border-brand-gray-400/60">
            {["City", "Bookings", "GMV", "Avg Order", "Growth"].map(h => (
              <div key={h} className="text-[10px] font-bold text-brand-gray-600 uppercase">{h}</div>
            ))}
          </div>
          {cityData.map((c, i) => (
            <div key={i} className="grid grid-cols-[1fr_120px_140px_100px_80px] gap-3 px-6 py-3.5 border-b border-brand-gray-400/30 items-center">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center text-base" style={{background: `rgba(255,61,61,${0.15 - i * 0.02})`}}>
                  {["🏙️","🌆","🌇","🏘️","🌃","🌉"][i]}
                </div>
                <span className="text-sm font-semibold text-white">{c.city}</span>
              </div>
              <span className="text-sm font-bold text-white">{c.bookings}</span>
              <span className="font-syne text-sm font-extrabold text-brand-red">₹{(c.gmv/1000).toFixed(0)}k</span>
              <span className="text-sm text-brand-gray-800">₹{Math.round(c.gmv / c.bookings).toLocaleString("en-IN")}</span>
              <span className="text-xs font-bold text-green-500">+12%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

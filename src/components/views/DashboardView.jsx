import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from "recharts";
import { revenueData, cityData, serviceData } from "../../data";

const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-brand-gray-200 border border-brand-red/20 rounded-lg p-2.5">
      <p className="text-brand-gray-800 text-xs mb-1.5">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="text-brand-red text-sm font-bold">
          ₹{Number(p.value).toLocaleString("en-IN")}
        </p>
      ))}
    </div>
  );
};

export default function DashboardView() {
  const kpis = [
    { label: "Today's GMV",       value: "₹94,000",   delta: "+18.2%", icon: "💰", color: "#ff3d3d" },
    { label: "Platform Revenue",  value: "₹14,100",   delta: "+18.2%", icon: "📈", color: "#4CAF50" },
    { label: "Bookings Today",    value: "52",         delta: "+8",     icon: "📋", color: "#2196F3" },
    { label: "Active Vendors",    value: "284",        delta: "+12",    icon: "🏪", color: "#9C27B0" },
    { label: "New Users Today",   value: "137",        delta: "+23",    icon: "👥", color: "#ff9944" },
    { label: "Pending Payouts",   value: "₹9,333",    delta: "6 items", icon: "⏳", color: "#ff3d3d", alert: true },
  ];

  const pendingActions = [
    { icon: "🏪", text: "2 new vendors awaiting verification", time: "Just now", type: "vendor", color: "#ff9944" },
    { icon: "🔴", text: "Payout KPX-2828 expires in 2 hours!", time: "2h left", type: "urgent", color: "#ff3d3d" },
    { icon: "⚖️", text: "Booking KPX-2835 has an open dispute", time: "4h ago", type: "dispute", color: "#ff3d3d" },
    { icon: "💸", text: "Payout KPX-2837 due in 6 hours", time: "6h left", type: "payout", color: "#ff9944" },
    { icon: "⭐", text: "Vendor 'Auto King Works' rated 2.1 — review needed", time: "1d ago", type: "quality", color: "#666677" },
  ];

  return (
    <div className="animate-[fadeInUp_0.3s_ease_forwards]">
      {/* KPIs */}
      <div className="grid grid-cols-6 gap-3.5 mb-6">
        {kpis.map((k, i) => (
          <div key={i} className={`bg-[#141420] rounded-[18px] p-5 border border-white/5 relative overflow-hidden transition-all duration-150 hover:-translate-y-0.5 hover:border-[rgba(255,61,61,0.15)] before:content-[''] before:absolute before:top-0 before:left-0 before:right-0 before:h-px before:bg-linear-to-r before:from-transparent before:via-[rgba(255,61,61,0.3)] before:to-transparent ${k.alert ? 'border-brand-red/25 bg-linear-to-br from-[#1a0e0e] to-brand-gray-100' : ''}`}>
            {k.alert && <div className="absolute top-0 left-0 right-0 h-0.5 bg-linear-to-r from-brand-red to-[#ff6b00]" />}
            <div className="flex items-center justify-between mb-3">
              <span className="text-lg">{k.icon}</span>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{color: k.color, background: `${k.color}18`, border: `1px solid ${k.color}30`}}>{k.delta}</span>
            </div>
            <div className="font-syne text-2xl font-extrabold text-white leading-none mb-1">{k.value}</div>
            <div className="text-xs text-brand-gray-700 font-medium">{k.label}</div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-[1fr_340px] gap-4 mb-5">
        {/* Revenue Chart */}
        <div className="bg-[#141420] rounded-[20px] border border-white/5 overflow-hidden">
          <div className="p-5 px-6 border-b border-white/5 flex items-center justify-between">
            <span className="font-syne text-base font-bold">Revenue vs GMV — Last 7 Days</span>
            <div className="flex gap-4">
              <div className="flex items-center gap-1.5 text-xs text-brand-gray-800">
                <div className="w-2 h-2 rounded-sm bg-brand-red/40" /> GMV
              </div>
              <div className="flex items-center gap-1.5 text-xs text-brand-gray-800">
                <div className="w-2 h-2 rounded-sm bg-brand-red" /> Commission
              </div>
            </div>
          </div>
          <div className="p-5 pr-2">
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="gmvGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#ff3d3d" stopOpacity={0.12}/>
                    <stop offset="95%" stopColor="#ff3d3d" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#ff3d3d" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#ff3d3d" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
                <Tooltip content={<ChartTooltip />} />
                <Area type="monotone" dataKey="gmv" stroke="rgba(255,61,61,0.35)" strokeWidth={2} fill="url(#gmvGrad)" />
                <Area type="monotone" dataKey="rev" stroke="#ff3d3d" strokeWidth={2.5} fill="url(#revGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pending Actions */}
        <div className="bg-[#141420] rounded-[20px] border border-white/5 overflow-hidden">
          <div className="p-5 px-6 border-b border-white/5 flex items-center justify-between">
            <span className="font-syne text-base font-bold">⚡ Pending Actions</span>
            <span className="text-xs font-bold text-yellow-400 bg-yellow-500/10 px-2 py-0.5 rounded-full border border-yellow-500/20">5 items</span>
          </div>
          <div className="px-5 py-1">
            {pendingActions.map((item, i) => (
              <div key={i} className="flex items-center gap-3 py-3 border-b border-white/5 last:border-none">
                <div className="w-9 h-9 rounded-lg bg-brand-gray-500/50 flex items-center justify-center text-lg shrink-0" style={{border: `1px solid ${item.color}22`}}>{item.icon}</div>
                <div className="flex-1">
                  <div className="text-xs text-brand-gray-900 leading-snug mb-0.5">{item.text}</div>
                  <div className="text-[10px]" style={{color: item.color}}>{item.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-2 gap-4">
        {/* City Performance */}
        <div className="bg-[#141420] rounded-[20px] border border-white/5 overflow-hidden">
          <div className="p-5 px-6 border-b border-white/5 flex items-center justify-between">
            <span className="font-syne text-base font-bold">Top Cities</span>
          </div>
          <div className="px-2 py-3">
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={cityData} barSize={28}>
                <XAxis dataKey="city" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null;
                  return <div className="bg-brand-gray-200 border border-brand-red/20 rounded-lg p-2">
                    <p className="text-brand-red text-sm font-bold">{label}</p>
                    <p className="text-brand-gray-800 text-xs">{payload[0].value} bookings</p>
                  </div>;
                }} />
                <Bar dataKey="bookings" fill="#ff3d3d" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Service Mix */}
        <div className="bg-[#141420] rounded-[20px] border border-white/5 overflow-hidden">
          <div className="p-5 px-6 border-b border-white/5 flex items-center justify-between">
            <span className="font-syne text-base font-bold">Service Mix</span>
          </div>
          <div className="p-3 pl-5 flex items-center gap-6">
            <ResponsiveContainer width={160} height={160}>
              <PieChart>
                <Pie data={serviceData} cx="50%" cy="50%" innerRadius={48} outerRadius={72} paddingAngle={3} dataKey="value">
                  {serviceData.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1">
              {serviceData.map((s, i) => (
                <div key={i} className="flex items-center gap-2 mb-2.5">
                  <div className="w-2 h-2 rounded-sm shrink-0" style={{background: s.color}} />
                  <span className="text-xs text-brand-gray-800 flex-1">{s.name}</span>
                  <span className="text-xs font-bold text-white">{s.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

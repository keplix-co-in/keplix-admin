import { useState, useEffect } from "react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line
} from "recharts";

// ─── DATA ────────────────────────────────────────────────────────────────────
const revenueData = [
  { day: "Feb 7",  gmv: 42000, rev: 6300 },
  { day: "Feb 8",  gmv: 58000, rev: 8700 },
  { day: "Feb 9",  gmv: 35000, rev: 5250 },
  { day: "Feb 10", gmv: 71000, rev: 10650 },
  { day: "Feb 11", gmv: 63000, rev: 9450 },
  { day: "Feb 12", gmv: 89000, rev: 13350 },
  { day: "Feb 13", gmv: 94000, rev: 14100 },
];

const cityData = [
  { city: "Delhi",   bookings: 312, gmv: 187000 },
  { city: "Mumbai",  bookings: 278, gmv: 163000 },
  { city: "Pune",    bookings: 196, gmv: 108000 },
  { city: "Noida",   bookings: 143, gmv: 84000 },
  { city: "Bengaluru", bookings: 121, gmv: 71000 },
  { city: "Hyderabad", bookings: 98,  gmv: 56000 },
];

const funnelData = [
  { stage: "Searched",   users: 4200 },
  { stage: "Viewed",     users: 2800 },
  { stage: "Initiated",  users: 1100 },
  { stage: "Completed",  users: 780  },
];

const serviceData = [
  { name: "Full Service", value: 34, color: "#ff6b00" },
  { name: "Car Wash",     value: 28, color: "#ff9944" },
  { name: "Repairs",      value: 22, color: "#ffcc77" },
  { name: "SOS",          value: 10, color: "#ff3d3d" },
  { name: "Others",       value: 6,  color: "#444455" },
];

const payoutQueue = [
  { id: "KPX-2840", vendor: "Raj Auto Garage",     city: "Delhi",   amount: 553,  hoursLeft: 18, booking: "Car Wash + Polish",   status: "due_soon" },
  { id: "KPX-2837", vendor: "Speedy Motors",        city: "Mumbai",  amount: 2975, hoursLeft: 6,  booking: "Dent & Paint",         status: "urgent" },
  { id: "KPX-2834", vendor: "Sharma Car Care",      city: "Pune",    amount: 1190, hoursLeft: 42, booking: "Full Service",         status: "normal" },
  { id: "KPX-2831", vendor: "K&K Auto Works",       city: "Noida",   amount: 765,  hoursLeft: 55, booking: "AC Gas Refill",        status: "normal" },
  { id: "KPX-2828", vendor: "FastFix Garage",       city: "Delhi",   amount: 3400, hoursLeft: 2,  booking: "Engine Overhaul",      status: "critical" },
  { id: "KPX-2825", vendor: "Quick Wheels Wash",    city: "Mumbai",  amount: 450,  hoursLeft: 60, booking: "Basic Car Wash",       status: "normal" },
];

const vendors = [
  { id: "V-1041", name: "Raj Auto Garage",    owner: "Rajesh Kumar",   city: "Delhi NCR",  category: "Full Service", status: "active",  bookings: 142, rating: 4.8, joined: "Jan 5, 2025",  earnings: 218400, verified: "field" },
  { id: "V-1038", name: "Speedy Motors",       owner: "Arjun Mehta",    city: "Mumbai",     category: "Repairs",      status: "active",  bookings: 98,  rating: 4.5, joined: "Jan 12, 2025", earnings: 163200, verified: "premium" },
  { id: "V-1036", name: "Quick Wheels Wash",   owner: "Suresh Patel",   city: "Pune",       category: "Car Wash",     status: "active",  bookings: 214, rating: 4.7, joined: "Dec 20, 2024", earnings: 96800,  verified: "basic" },
  { id: "V-1032", name: "SOS Road Rescue",     owner: "Vikram Singh",   city: "Delhi NCR",  category: "SOS",          status: "active",  bookings: 67,  rating: 4.9, joined: "Feb 1, 2025",  earnings: 54600,  verified: "premium" },
  { id: "V-1028", name: "Sharma Car Care",     owner: "Deepak Sharma",  city: "Noida",      category: "Full Service", status: "pending", bookings: 0,   rating: 0,   joined: "Feb 10, 2025", earnings: 0,      verified: "none" },
  { id: "V-1024", name: "Auto King Works",     owner: "Manish Yadav",   city: "Bengaluru",  category: "Full Service", status: "suspended", bookings: 23, rating: 2.1, joined: "Nov 14, 2024", earnings: 31200, verified: "basic" },
  { id: "V-1019", name: "FastFix Garage",      owner: "Praveen Nair",   city: "Hyderabad",  category: "Repairs",      status: "active",  bookings: 56,  rating: 4.3, joined: "Dec 5, 2024",  earnings: 78400,  verified: "field" },
];

const bookings = [
  { id: "KPX-2841", user: "Rahul Sharma",  phone: "98100-12345", vendor: "Raj Auto Garage",    service: "Full Car Service",   slot: "13 Feb, 2:30 PM", amount: 1800, commission: 270, status: "completed" },
  { id: "KPX-2840", user: "Priya Mehta",   phone: "70100-54321", vendor: "Quick Wheels Wash",  service: "Car Wash + Polish",  slot: "13 Feb, 11:00 AM", amount: 650, commission: 97,  status: "in_progress" },
  { id: "KPX-2839", user: "Ajay Verma",    phone: "88200-11111", vendor: "FastFix Garage",     service: "Tyre Rotation",      slot: "12 Feb, 4:15 PM", amount: 400, commission: 60,  status: "completed" },
  { id: "KPX-2838", user: "Sneha Kapoor",  phone: "99100-88888", vendor: "Speedy Motors",      service: "AC Gas Refill",      slot: "12 Feb, 1:00 PM", amount: 1200, commission: 180, status: "completed" },
  { id: "KPX-2837", user: "Mohd. Faraz",   phone: "77300-22222", vendor: "Speedy Motors",      service: "Dent & Paint",       slot: "11 Feb, 10:30 AM", amount: 3500, commission: 525, status: "completed" },
  { id: "KPX-2836", user: "Divya Singh",   phone: "88100-33333", vendor: "Raj Auto Garage",    service: "Oil Change",         slot: "11 Feb, 9:00 AM", amount: 550, commission: 82,  status: "completed" },
  { id: "KPX-2835", user: "Kiran Nair",    phone: "91234-44444", vendor: "FastFix Garage",     service: "Battery Replace",    slot: "10 Feb, 3:45 PM", amount: 2200, commission: 330, status: "disputed" },
  { id: "KPX-2834", user: "Amit Joshi",    phone: "80100-55555", vendor: "Sharma Car Care",    service: "Full Car Service",   slot: "10 Feb, 1:00 PM", amount: 1800, commission: 270, status: "confirmed" },
  { id: "KPX-2833", user: "Pooja Rao",     phone: "95200-66666", vendor: "SOS Road Rescue",    service: "Emergency Towing",   slot: "10 Feb, 8:00 AM", amount: 1500, commission: 225, status: "cancelled" },
];

// ─── ICONS (inline SVG) ──────────────────────────────────────────────────────
const Icon = ({ name, size = 16, color = "currentColor" }) => {
  const icons = {
    dashboard: <><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></>,
    finance: <><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></>,
    vendors: <><path d="M20 7H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></>,
    bookings: <><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></>,
    analytics: <><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></>,
    users: <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></>,
    settings: <><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/></>,
    bell: <><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></>,
    arrow_up: <><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></>,
    check: <><polyline points="20 6 9 17 4 12"/></>,
    alert: <><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></>,
    logout: <><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></>,
    search: <><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></>,
    clock: <><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></>,
    eye: <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>,
    download: <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></>,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {icons[name]}
    </svg>
  );
};

// ─── CUSTOM TOOLTIP ──────────────────────────────────────────────────────────
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

// ─── STATUS HELPERS ──────────────────────────────────────────────────────────
const bookingStatusConfig = {
  completed:    { label: "Completed",    color: "#4CAF50", bg: "rgba(76,175,80,0.1)",    border: "rgba(76,175,80,0.2)" },
  in_progress:  { label: "In Progress",  color: "#2196F3", bg: "rgba(33,150,243,0.1)",   border: "rgba(33,150,243,0.2)" },
  confirmed:    { label: "Confirmed",    color: "#9C27B0", bg: "rgba(156,39,176,0.1)",   border: "rgba(156,39,176,0.2)" },
  disputed:     { label: "Disputed",     color: "#ff3d3d", bg: "rgba(255,61,61,0.1)",    border: "rgba(255,61,61,0.2)" },
  cancelled:    { label: "Cancelled",    color: "#666677", bg: "rgba(100,100,120,0.1)",  border: "rgba(100,100,120,0.2)" },
};
const vendorStatusConfig = {
  active:    { label: "Active",    color: "#4CAF50", bg: "rgba(76,175,80,0.1)",   border: "rgba(76,175,80,0.2)" },
  pending:   { label: "Pending",   color: "#ff9944", bg: "rgba(255,153,68,0.1)",  border: "rgba(255,153,68,0.2)" },
  suspended: { label: "Suspended", color: "#ff3d3d", bg: "rgba(255,61,61,0.1)",   border: "rgba(255,61,61,0.2)" },
};

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────
export default function KeplixAdmin() {
  const [activeNav, setActiveNav] = useState("dashboard");
  const [bookingFilter, setBookingFilter] = useState("All");
  const [vendorFilter, setVendorFilter] = useState("All");
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const navItems = [
    { id: "dashboard", label: "Dashboard",  icon: "dashboard" },
    { id: "finance",   label: "Finance",    icon: "finance"   },
    { id: "vendors",   label: "Vendors",    icon: "vendors"   },
    { id: "bookings",  label: "Bookings",   icon: "bookings"  },
    { id: "analytics", label: "Analytics",  icon: "analytics" },
    { id: "users",     label: "Users",      icon: "users"     },
  ];

  return (
    <div className="flex h-screen bg-brand-black font-sans overflow-hidden text-white">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=Syne:wght@700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,61,61,0.2); border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(255,61,61,0.4); }

        .nav-item {
          display: flex; align-items: center; gap: 10px;
          padding: 10px 16px; border-radius: 12px;
          cursor: pointer; transition: all 0.18s;
          font-size: 13px; font-weight: 500;
          color: rgba(255,255,255,0.35);
          border: 1px solid transparent;
          margin-bottom: 2px;
        }
        .nav-item:hover { color: rgba(255,255,255,0.7); background: rgba(255,255,255,0.04); }
        .nav-item.active {
          color: #fff; background: rgba(255,61,61,0.12);
          border-color: rgba(255,61,61,0.2);
          box-shadow: inset 2px 0 0 #ff3d3d;
        }

        .kpi-card {
          background: #141420;
          border-radius: 18px;
          padding: 20px;
          border: 1px solid rgba(255,255,255,0.05);
          position: relative; overflow: hidden;
          transition: transform 0.15s, border-color 0.15s;
        }
        .kpi-card:hover { transform: translateY(-2px); border-color: rgba(255,61,61,0.15); }
        .kpi-card::before {
          content: ''; position: absolute; top: 0; left: 0; right: 0; height: 1px;
          background: linear-gradient(90deg, transparent, rgba(255,61,61,0.3), transparent);
        }

        .table-row {
          display: grid; align-items: center;
          padding: 12px 16px; border-radius: 10px;
          transition: background 0.15s;
          border-bottom: 1px solid rgba(255,255,255,0.03);
        }
        .table-row:hover { background: rgba(255,255,255,0.03); }

        .badge {
          display: inline-flex; align-items: center;
          padding: 3px 10px; border-radius: 50px;
          font-size: 10px; font-weight: 700; letter-spacing: 0.3px;
          border: 1px solid;
        }

        .action-btn {
          padding: 6px 12px; border-radius: 8px; border: none;
          font-size: 11px; font-weight: 600; cursor: pointer;
          font-family: 'DM Sans', sans-serif;
          transition: all 0.15s;
        }

        .section-card {
          background: #141420;
          border-radius: 20px;
          border: 1px solid rgba(255,255,255,0.05);
          overflow: hidden;
        }
        .section-head {
          padding: 20px 24px;
          border-bottom: 1px solid rgba(255,255,255,0.05);
          display: flex; align-items: center; justify-content: space-between;
        }
        .section-title {
          font-family: 'Syne', sans-serif; font-size: 16px; font-weight: 700;
        }

        .payout-row {
          display: grid;
          grid-template-columns: 80px 1fr 100px 100px 100px 80px 80px;
          align-items: center;
          padding: 14px 20px;
          border-bottom: 1px solid rgba(255,255,255,0.03);
          transition: background 0.15s;
          gap: 8px;
        }
        .payout-row:hover { background: rgba(255,255,255,0.02); }

        .tab-pill {
          padding: 6px 14px; border-radius: 50px;
          font-size: 12px; font-weight: 600; cursor: pointer;
          border: 1px solid rgba(255,255,255,0.08);
          background: transparent; color: rgba(255,255,255,0.35);
          transition: all 0.15s; font-family: 'DM Sans', sans-serif;
        }
        .tab-pill.active {
          background: #ff3d3d; border-color: #ff3d3d; color: #fff;
          box-shadow: 0 4px 12px rgba(255,61,61,0.3);
        }

        .pending-action-item {
          display: flex; align-items: center; gap: 12px;
          padding: 12px 0;
          border-bottom: 1px solid rgba(255,255,255,0.04);
        }
        .pending-action-item:last-child { border-bottom: none; }

        @keyframes pulse-dot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.8); }
        }
        .live-dot {
          width: 7px; height: 7px; border-radius: 50%;
          background: #4CAF50;
          animation: pulse-dot 2s infinite;
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .fade-in { animation: fadeInUp 0.3s ease forwards; }
      `}</style>

      {/* ── SIDEBAR ── */}
      <div className="w-[220px] bg-[#0e0e18] border-r border-brand-gray-400 flex flex-col p-6 shrink-0">
        {/* Logo */}
        <div className="px-2 pb-7 border-b border-brand-gray-400 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-linear-to-br from-brand-red to-[#ff4400] flex items-center justify-center text-lg shadow-[0_4px_16px_rgba(255,61,61,0.4)]">🔧</div>
            <div>
              <div className="font-syne font-extrabold text-base text-white leading-none">KEPLIX</div>
              <div className="text-xs text-brand-red/70 tracking-[1.5px] font-semibold">ADMIN PANEL</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <div className="flex-1">
          <div className="text-[9px] text-brand-gray-600 tracking-[1.5px] font-bold px-2 pb-2 uppercase">Main Menu</div>
          {navItems.map(item => (
            <div key={item.id} className={`nav-item${activeNav === item.id ? " active" : ""}`} onClick={() => setActiveNav(item.id)}>
              <Icon name={item.icon} size={15} color={activeNav === item.id ? "#ff3d3d" : "currentColor"} />
              {item.label}
              {item.id === "vendors" && <span className="ml-auto bg-yellow-500/20 text-yellow-400 text-[9px] font-bold py-0.5 px-1.5 rounded-full">2</span>}
              {item.id === "finance" && <span className="ml-auto bg-red-500/20 text-red-400 text-[9px] font-bold py-0.5 px-1.5 rounded-full">!</span>}
            </div>
          ))}
        </div>

        {/* Bottom */}
        <div className="border-t border-brand-gray-400 pt-4">
          <div className="nav-item mb-0">
            <Icon name="settings" size={15} />Settings
          </div>
          <div className="flex items-center gap-2.5 pt-3 mt-2 border-t border-brand-gray-400">
            <div className="w-8 h-8 rounded-lg bg-linear-to-br from-brand-red to-[#ff4400] flex items-center justify-center text-sm">👤</div>
            <div className="flex-1 overflow-hidden">
              <div className="text-xs font-semibold text-white">Super Admin</div>
              <div className="text-[10px] text-brand-gray-700 overflow-hidden text-ellipsis whitespace-nowrap">admin@keplix.in</div>
            </div>
            <Icon name="logout" size={14} color="rgba(255,255,255,0.3)" />
          </div>
        </div>
      </div>

      {/* ── MAIN ── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <div className="h-[60px] bg-[#0e0e18] border-b border-brand-gray-400 flex items-center px-7 gap-4 shrink-0">
          <div className="flex-1">
            <div className="font-syne text-lg font-extrabold text-white">
              {navItems.find(n => n.id === activeNav)?.label || "Dashboard"}
            </div>
            <div className="text-xs text-brand-gray-600">
              {time.toLocaleDateString("en-IN", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })} · {time.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
            </div>
          </div>
          <div className="flex items-center gap-2 bg-brand-gray-500/50 rounded-lg px-3.5 py-2 border border-brand-gray-400/70">
            <Icon name="search" size={13} color="rgba(255,255,255,0.3)" />
            <span className="text-xs text-brand-gray-600">Search anything…</span>
          </div>
          <div className="relative">
            <div className="w-9 h-9 bg-brand-gray-500/60 rounded-lg flex items-center justify-center cursor-pointer border border-brand-gray-400/80">
              <Icon name="bell" size={15} color="rgba(255,255,255,0.5)" />
            </div>
            <div className="absolute top-1.5 right-2 w-2 h-2 bg-brand-red rounded-full border-2 border-[#0e0e18]" />
          </div>
          <div className="flex items-center gap-1.5">
            <div className="live-dot" />
            <span className="text-xs text-green-500 font-semibold">LIVE</span>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeNav === "dashboard" && <DashboardView />}
          {activeNav === "finance" && <FinanceView />}
          {activeNav === "vendors" && <VendorsView filter={vendorFilter} setFilter={setVendorFilter} />}
          {activeNav === "bookings" && <BookingsView filter={bookingFilter} setFilter={setBookingFilter} />}
          {activeNav === "analytics" && <AnalyticsView />}
          {activeNav === "users" && <UsersView />}
        </div>
      </div>
    </div>
  );
}

// ─── DASHBOARD ───────────────────────────────────────────────────────────────
function DashboardView() {
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
    <div className="fade-in">
      {/* KPIs */}
      <div className="grid grid-cols-6 gap-3.5 mb-6">
        {kpis.map((k, i) => (
          <div key={i} className={`kpi-card ${k.alert ? 'border-brand-red/25 bg-linear-to-br from-[#1a0e0e] to-brand-gray-100' : ''}`}>
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
        <div className="section-card">
          <div className="section-head">
            <span className="section-title">Revenue vs GMV — Last 7 Days</span>
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
        <div className="section-card">
          <div className="section-head">
            <span className="section-title">⚡ Pending Actions</span>
            <span className="text-xs font-bold text-yellow-400 bg-yellow-500/10 px-2 py-0.5 rounded-full border border-yellow-500/20">5 items</span>
          </div>
          <div className="px-5 py-1">
            {pendingActions.map((item, i) => (
              <div key={i} className="pending-action-item">
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
        <div className="section-card">
          <div className="section-head">
            <span className="section-title">Top Cities</span>
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
        <div className="section-card">
          <div className="section-head">
            <span className="section-title">Service Mix</span>
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

// ─── FINANCE ─────────────────────────────────────────────────────────────────
function FinanceView() {
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
    <div className="fade-in">
      <div className="grid grid-cols-6 gap-3.5 mb-6">
        {financeKpis.map((k, i) => (
          <div key={i} className={`kpi-card ${k.alert ? 'border-brand-red/25' : ''}`}>
            <div className="text-xl mb-2.5">{k.icon}</div>
            <div className="font-syne text-lg font-extrabold text-white mb-1">{k.value}</div>
            <div className="text-xs text-brand-gray-700">{k.label}</div>
          </div>
        ))}
      </div>

      {/* Cash Flow Diagram */}
      <div className="section-card mb-5 p-6">
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
      <div className="section-card">
        <div className="section-head">
          <span className="section-title">⏳ Payout Queue</span>
          <button className="bg-brand-red border-none rounded-lg px-4 py-2 text-white text-xs font-bold cursor-pointer font-sans">
            Initiate All Payouts
          </button>
        </div>
        {/* Header */}
        <div className="payout-row border-b border-brand-gray-400/60">
          {["Booking ID", "Vendor", "Service", "City", "Vendor Owes", "Time Left", "Action"].map(h => (
            <div key={h} className="text-[10px] font-bold text-brand-gray-600 uppercase tracking-wider">{h}</div>
          ))}
        </div>
        {payoutQueue.map((p, i) => {
          const cfg = urgencyConfig[p.status];
          return (
            <div key={i} className="payout-row">
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
              <button className="action-btn" style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.color}30` }}>
                Pay Now
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── VENDORS ─────────────────────────────────────────────────────────────────
function VendorsView({ filter, setFilter }) {
  const filters = ["All", "Active", "Pending", "Suspended"];
  const filtered = vendors.filter(v => filter === "All" || v.status.charAt(0).toUpperCase() + v.status.slice(1) === filter);
  const verifiedLabel = { field: "Field ✓", premium: "Premium ⭐", basic: "Basic", none: "Unverified" };
  const verifiedColor = { field: "#2196F3", premium: "#ff9944", basic: "#4CAF50", none: "rgba(255,255,255,0.2)" };

  return (
    <div className="fade-in">
      <div className="flex gap-2 mb-5">
        {filters.map(f => (
          <button key={f} className={`tab-pill${filter === f ? " active" : ""}`} onClick={() => setFilter(f)}>{f}</button>
        ))}
        <div className="ml-auto">
          <button className="bg-brand-red border-none rounded-lg px-4 py-2 text-white text-xs font-bold cursor-pointer font-sans">+ Add Vendor</button>
        </div>
      </div>
      <div className="section-card">
        <div className="grid grid-cols-[60px_1.5fr_110px_100px_80px_80px_80px_100px_80px] gap-2 px-5 py-3 border-b border-brand-gray-400/60">
          {["ID", "Vendor", "Category", "City", "Bookings", "Rating", "Status", "Earnings", "Actions"].map(h => (
            <div key={h} className="text-[10px] font-bold text-brand-gray-600 uppercase tracking-wider">{h}</div>
          ))}
        </div>
        {filtered.map((v, i) => {
          const sc = vendorStatusConfig[v.status];
          return (
            <div key={i} className="table-row grid-cols-[60px_1.5fr_110px_100px_80px_80px_80px_100px_80px] gap-2">
              <div className="text-xs text-brand-gray-600 font-mono">{v.id}</div>
              <div>
                <div className="text-sm font-semibold text-white mb-0.5">{v.name}</div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-brand-gray-700">{v.owner}</span>
                  <span className="text-[9px] font-bold px-1.5 py-px rounded-full" style={{color: verifiedColor[v.verified], background: `${verifiedColor[v.verified]}18`}}>{verifiedLabel[v.verified]}</span>
                </div>
              </div>
              <div className="text-xs text-brand-gray-800">{v.category}</div>
              <div className="text-xs text-brand-gray-800">{v.city}</div>
              <div className="text-sm font-bold text-white">{v.bookings}</div>
              <div className={`text-sm font-bold ${v.rating >= 4.5 ? "text-green-500" : v.rating >= 3 ? "text-yellow-400" : "text-brand-red"}`}>
                {v.rating > 0 ? `${v.rating} ★` : "—"}
              </div>
              <div><span className="badge" style={{ color: sc.color, background: sc.bg, borderColor: sc.border }}>{sc.label}</span></div>
              <div className="font-syne text-sm font-extrabold text-white">
                {v.earnings > 0 ? `₹${(v.earnings/1000).toFixed(0)}k` : "—"}
              </div>
              <div className="flex gap-1">
                <button className="action-btn bg-blue-500/10 text-blue-400 border border-blue-500/20 p-1.5">
                  <Icon name="eye" size={11} color="#2196F3" />
                </button>
                {v.status === "pending" && (
                  <button className="action-btn bg-green-500/10 text-green-400 border border-green-500/20 text-xs">✓</button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── BOOKINGS ────────────────────────────────────────────────────────────────
function BookingsView({ filter, setFilter }) {
  const filters = ["All", "Completed", "In Progress", "Confirmed", "Disputed", "Cancelled"];
  const keyMap = { "All": "All", "Completed": "completed", "In Progress": "in_progress", "Confirmed": "confirmed", "Disputed": "disputed", "Cancelled": "cancelled" };
  const filtered = bookings.filter(b => filter === "All" || b.status === keyMap[filter]);

  return (
    <div className="fade-in">
      <div className="flex gap-2 mb-5 flex-wrap">
        {filters.map(f => (
          <button key={f} className={`tab-pill${filter === f ? " active" : ""}`} onClick={() => setFilter(f)}>{f}</button>
        ))}
      </div>
      <div className="section-card">
        <div className="grid grid-cols-[90px_140px_130px_160px_140px_120px_90px_80px_90px] gap-2 px-5 py-3 border-b border-brand-gray-400/60">
          {["Booking ID", "Customer", "Phone", "Vendor", "Service", "Slot", "Amount", "Fee", "Status"].map(h => (
            <div key={h} className="text-[10px] font-bold text-brand-gray-600 uppercase tracking-wider">{h}</div>
          ))}
        </div>
        {filtered.map((b, i) => {
          const sc = bookingStatusConfig[b.status];
          return (
            <div key={i} className="table-row grid-cols-[90px_140px_130px_160px_140px_120px_90px_80px_90px] gap-2">
              <div className="text-xs text-brand-red/70 font-mono font-bold">{b.id}</div>
              <div className="text-sm font-semibold text-white">{b.user}</div>
              <div className="text-xs text-brand-gray-700 font-mono">{b.phone}</div>
              <div className="text-xs text-brand-gray-800">{b.vendor}</div>
              <div className="text-xs text-brand-gray-800">{b.service}</div>
              <div className="text-[10px] text-brand-gray-700">{b.slot}</div>
              <div className="font-syne text-sm font-extrabold text-white">₹{b.amount.toLocaleString("en-IN")}</div>
              <div className="text-sm font-semibold text-brand-red">₹{b.commission}</div>
              <div><span className="badge" style={{ color: sc.color, background: sc.bg, borderColor: sc.border }}>{sc.label}</span></div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── ANALYTICS ───────────────────────────────────────────────────────────────
function AnalyticsView() {
  const retentionData = [
    { week: "W1", rate: 28 }, { week: "W2", rate: 34 }, { week: "W3", rate: 41 },
    { week: "W4", rate: 38 }, { week: "W5", rate: 47 }, { week: "W6", rate: 52 },
    { week: "W7", rate: 49 },
  ];
  return (
    <div className="fade-in">
      <div className="grid grid-cols-2 gap-4 mb-4">
        {/* Booking Funnel */}
        <div className="section-card">
          <div className="section-head"><span className="section-title">📊 Booking Funnel</span></div>
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
        <div className="section-card">
          <div className="section-head">
            <span className="section-title">🔁 Repeat Booking Rate</span>
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
      <div className="section-card">
        <div className="section-head"><span className="section-title">📍 City-wise Performance</span></div>
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

function UsersView() {
    return <div className="text-white">Users View</div>
}

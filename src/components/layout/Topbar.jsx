import { Icon } from "../ui/Icon";

export function Topbar({ time, activeNav }) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'finance',   label: 'Finance'   },
    { id: 'vendors',   label: 'Vendors'   },
    { id: 'bookings',  label: 'Bookings'  },
    { id: 'analytics', label: 'Analytics' },
    { id: 'users',     label: 'Users'     },
  ];

  return (
    <div className="h-15 bg-[#0e0e18] border-b border-brand-gray-400 flex items-center px-7 gap-4 shrink-0">
      <div className="flex-1">
        <div className="font-syne text-lg font-extrabold text-white">
          {navItems.find(n => n.id === activeNav)?.label || "Dashboard"}
        </div>
        <div className="text-xs text-brand-gray-600">
          {(time || new Date()).toLocaleDateString("en-IN", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })} · {(time || new Date()).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
        </div>
      </div>
      <div className="flex items-center gap-2 bg-brand-gray-500/50 rounded-lg px-3.5 py-2 border border-brand-gray-400/70">
        <Icon name="search" size={13} color="rgba(255,255,255,0.3)" />
        <span className="text-xs text-brand-gray-600">Search anything……</span>
      </div>
      <div className="relative">
        <div className="w-9 h-9 bg-brand-gray-500/60 rounded-lg flex items-center justify-center cursor-pointer border border-brand-gray-400/80">
          <Icon name="bell" size={15} color="rgba(255,255,255,0.5)" />
        </div>
        <div className="absolute top-1.5 right-2 w-2 h-2 bg-brand-red rounded-full border-2 border-[#0e0e18]" />
      </div>
      <div className="flex items-center gap-1.5">
        <div className="w-[7px] h-[7px] rounded-full bg-[#4CAF50] animate-[pulse-dot_2s_infinite]" />
        <span className="text-xs text-green-500 font-semibold">LIVE</span>
      </div>
    </div>
  );
}
import { Icon } from "../ui/Icon";
import { GlobalSearch } from "../util/GlobalSearch";
import { NotificationBell } from "../util/NotificationBell";

export function Topbar({ time, activeNav }) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'finance',   label: 'Finance'   },
    { id: 'vendors',   label: 'Vendors'   },
    { id: 'bookings',  label: 'Bookings'  },
    { id: 'analytics', label: 'Analytics' },
    { id: 'users',     label: 'Users'     },
    { id: 'settings',  label: 'Settings'  },
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
      
      <GlobalSearch />

      <NotificationBell />
      
      <div className="flex items-center gap-1.5 ml-2">
        <div className="w-[7px] h-[7px] rounded-full bg-[#4CAF50] animate-[pulse-dot_2s_infinite]" />
        <span className="text-xs text-green-500 font-semibold">LIVE</span>
      </div>
    </div>
  );
}
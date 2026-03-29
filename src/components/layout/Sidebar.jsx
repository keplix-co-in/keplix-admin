import { Icon } from "../ui/Icon";

export function Sidebar({ activeNav, setActiveNav }) {
  const navItems = [
    { id: "dashboard", label: "Dashboard",  icon: "dashboard" },
    { id: "finance",   label: "Finance",    icon: "finance"   },
    { id: "vendors",   label: "Vendors",    icon: "vendors"   },
    { id: "bookings",  label: "Bookings",   icon: "bookings"  },
    { id: "analytics", label: "Analytics",  icon: "analytics" },
    { id: "users",     label: "Users",      icon: "users"     },
  ];

  return (
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
          <div key={item.id} className={`flex items-center gap-2.5 py-2.5 px-4 rounded-xl cursor-pointer transition-all duration-200 text-[13px] font-medium text-white/35 border border-transparent mb-0.5 hover:text-white/70 hover:bg-white/5${activeNav === item.id ? " text-white bg-[rgba(255,61,61,0.12)] border-[rgba(255,61,61,0.2)] shadow-[inset_2px_0_0_#ff3d3d]" : ""}`} onClick={() => setActiveNav(item.id)}>
            <Icon name={item.icon} size={15} color={activeNav === item.id ? "#ff3d3d" : "currentColor"} />
            {item.label}
            {item.id === "vendors" && <span className="ml-auto bg-yellow-500/20 text-yellow-400 text-[9px] font-bold py-0.5 px-1.5 rounded-full">2</span>}
            {item.id === "finance" && <span className="ml-auto bg-red-500/20 text-red-400 text-[9px] font-bold py-0.5 px-1.5 rounded-full">!</span>}
          </div>
        ))}
      </div>

      {/* Bottom */}
      <div className="border-t border-brand-gray-400 pt-4">
        <div className="flex items-center gap-2.5 py-2.5 px-4 rounded-xl cursor-pointer transition-all duration-200 text-[13px] font-medium text-white/35 border border-transparent mb-0.5 hover:text-white/70 hover:bg-white/5 mb-0">
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
  );
}
import { Icon } from "../ui/Icon";
import navItems from "../../data/SidebarMock";

export function Sidebar({ activeNav, setActiveNav, onLogout }) {
  
  return (
    <div className="w-55 bg-[#0e0e18] border-r border-brand-gray-400 flex flex-col p-6 shrink-0">
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
          <div key={item.id} className={`flex items-center gap-3 py-3 px-2 rounded-lg cursor-pointer transition-all duration-200 text-sm font-medium ${activeNav === item.id ? "bg-brand-red/10 text-white" : "text-white/35 hover:text-white/70 hover:bg-white/5"}`}onClick={() => setActiveNav(item.id)}>
            <Icon name={item.icon} size={15} color={activeNav === item.id ? "#ff3d3d" : "currentColor"} />
            {item.label}
            {item.id === "vendors" && <span className="ml-auto bg-brand-red text-white text-[10px] font-bold px-2 py-1 rounded-full">54</span>}
            {item.id === "finance" && <span className="ml-auto bg-green-500 text-white text-[10px] font-bold px-2 py-1 rounded-full">₹1.2M</span>}
          </div>
        ))}
      </div>

      {/* Bottom */}
      <div className="border-t border-brand-gray-400 pt-4">
        <div 
          onClick={() => setActiveNav('settings')}
          className={`flex items-center gap-2.5 py-2.5 px-4 rounded-xl cursor-pointer transition-all duration-200 text-[13px] font-medium border mb-0 ${
            activeNav === 'settings' 
              ? 'bg-[rgba(255,61,61,0.12)] text-white border-[rgba(255,61,61,0.2)] shadow-[inset_2px_0_0_#ff3d3d]' 
              : 'text-white/35 border-transparent hover:text-white/70 hover:bg-white/5'
          }`}
        >
          <Icon name="settings" size={15} color={activeNav === 'settings' ? '#ff3d3d' : 'currentColor'} />Settings
        </div>
        <div className="flex items-center gap-2.5 pt-3 mt-2 border-t border-brand-gray-400">
          <div className="w-8 h-8 rounded-lg bg-linear-to-br from-brand-red to-[#ff4400] flex items-center justify-center text-sm">👤</div>
          <div className="flex-1 overflow-hidden">
            <div className="text-xs font-semibold text-white">Super Admin</div>
            <div className="text-[10px] text-brand-gray-700 overflow-hidden text-ellipsis whitespace-nowrap">admin@keplix.in</div>
          </div>
          <button onClick={onLogout} className="bg-transparent border-none cursor-pointer flex items-center justify-center p-2 rounded-full hover:bg-white/10 transition-colors" title="Logout">
            <Icon name="logout" size={14} color="rgba(255,255,255,0.8)" />
          </button>
        </div>
      </div>
    </div>
  );
}
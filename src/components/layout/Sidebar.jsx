import { useEffect, useState } from "react";
import { Icon } from "../ui/Icon";
import navItems from "../../data/SidebarMock";
import { getVendorMetrics } from "../../services/vendorsApi";
import { getAdminUser } from "../../services/authApi";
import { FOUNDER_SCREENS } from "../views/founder/registry";

// Role slugs the API returns -> what an operator should actually read.
const ROLE_LABELS = {
  super_admin: "Super Admin",
  admin: "Admin",
};

export function Sidebar({ activeNav, subNav, setActiveNav, onLogout }) {
  // Founder dashboard (2026-11-14): same sidebar, different list.
  const founder = activeNav === "founder";
  // The Vendors badge was hardcoded to "54" and the Finance badge to "₹1.2M" --
  // invented numbers sitting in permanent view of whoever runs this panel.
  //
  // The vendor badge now shows PENDING vendors, not the total: a count that
  // means "these need your decision" is worth a badge, a total headcount isn't.
  // getVendorMetrics()/GET /admin/vendors/metrics already existed and had never
  // been called from anywhere.
  //
  // The Finance badge is gone entirely rather than replaced -- there is no
  // single number that honestly summarises finance here, and the KPIs it would
  // have approximated already live on the Finance screen itself.
  const [pendingVendors, setPendingVendors] = useState(null);
  const adminUser = getAdminUser();

  useEffect(() => {
    let cancelled = false;
    getVendorMetrics()
      .then(m => {
        if (!cancelled) setPendingVendors(m?.pendingVendors ?? null);
      })
      .catch(() => {
        // A failed count must not break the nav -- the badge just stays hidden.
        if (!cancelled) setPendingVendors(null);
      });
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="w-55 bg-[#0e0e18] border-r border-brand-gray-400 flex flex-col p-6 shrink-0">
      {/* Logo */}
      <div className="px-2 pb-7 border-b border-brand-gray-400 mb-5">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-linear-to-br from-brand-red to-[#ff4400] flex items-center justify-center text-lg shadow-[0_4px_16px_rgba(255,61,61,0.4)]">🔧</div>
          <div>
            <div className="font-syne font-extrabold text-base text-white leading-none">KEPLIX</div>
            <div className="text-xs text-brand-red/70 tracking-[1.5px] font-semibold">{founder ? "FOUNDER" : "ADMIN PANEL"}</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <div className="flex-1">
        <div className="text-[9px] text-brand-gray-600 tracking-[1.5px] font-bold px-2 pb-2 uppercase">{founder ? "Founder" : "Main Menu"}</div>
        {founder && Object.entries(FOUNDER_SCREENS).map(([id, s]) => (
          <div key={id} onClick={() => setActiveNav(`founder/${id}`)}
            className={`flex items-center gap-3 py-3 px-2 rounded-lg cursor-pointer transition-all duration-200 text-sm font-medium ${subNav === id ? "bg-brand-red/10 text-white" : "text-white/35 hover:text-white/70 hover:bg-white/5"}`}>
            {s.label}
          </div>
        ))}
        {!founder && navItems.map(item => ( 
          <div key={item.id} className={`flex items-center gap-3 py-3 px-2 rounded-lg cursor-pointer transition-all duration-200 text-sm font-medium ${activeNav === item.id ? "bg-brand-red/10 text-white" : "text-white/35 hover:text-white/70 hover:bg-white/5"}`}onClick={() => setActiveNav(item.id)}>
            <Icon name={item.icon} size={15} color={activeNav === item.id ? "#ff3d3d" : "currentColor"} />
            {item.label}
            {item.id === "vendors" && pendingVendors > 0 && (
              <span
                title={`${pendingVendors} vendor${pendingVendors === 1 ? "" : "s"} awaiting review`}
                className="ml-auto bg-brand-red text-white text-[10px] font-bold px-2 py-1 rounded-full"
              >
                {pendingVendors}
              </span>
            )}
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
          {/* Both of these were hardcoded ("Super Admin" / "admin@keplix.in"),
              so every operator saw the same fake identity regardless of who was
              signed in. getAdminUser() reads the account the login response
              actually stored and had never been called here. */}
          <div className="flex-1 overflow-hidden">
            <div className="text-xs font-semibold text-white">
              {ROLE_LABELS[adminUser?.role] || adminUser?.name || "Admin"}
            </div>
            <div className="text-[10px] text-brand-gray-700 overflow-hidden text-ellipsis whitespace-nowrap">
              {adminUser?.email || "—"}
            </div>
          </div>
          <button onClick={onLogout} className="bg-transparent border-none cursor-pointer flex items-center justify-center p-2 rounded-full hover:bg-white/10 transition-colors" title="Logout">
            <Icon name="logout" size={14} color="rgba(255,255,255,0.8)" />
          </button>
        </div>
      </div>
    </div>
  );
}
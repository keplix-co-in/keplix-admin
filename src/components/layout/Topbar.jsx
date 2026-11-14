import { GlobalSearch } from "../util/GlobalSearch";
import { NotificationBell } from "../util/NotificationBell";
import navItems from "../../data/SidebarMock";
import { isSuperAdmin } from "../../services/authApi";
import { FOUNDER_SCREENS } from "../views/founder/registry";

// Settings lives in the sidebar's bottom section rather than the main nav list,
// so it needs its own title entry here.
const TITLES = Object.fromEntries([
  ...navItems.map(n => [n.id, n.label]),
  ["settings", "Settings"],
]);

/**
 * Admin <-> Founder switch (2026-11-14). Shown to super_admin only; the
 * /founder route is also gated in App.jsx, so hiding this is not the only guard.
 */
export function PanelToggle({ activeNav, setActiveNav }) {
  if (!isSuperAdmin()) return null;
  const founder = activeNav === "founder";
  return (
    <div className="flex text-xs font-semibold rounded-lg overflow-hidden border border-brand-gray-400" role="group" aria-label="Switch panel">
      <button type="button" aria-pressed={!founder} onClick={() => founder && setActiveNav("dashboard")}
        className={`px-3 py-1.5 ${!founder ? "bg-brand-red text-white" : "text-white/50 hover:text-white"}`}>Admin</button>
      <button type="button" aria-pressed={founder} onClick={() => !founder && setActiveNav("founder/today")}
        className={`px-3 py-1.5 ${founder ? "bg-brand-red text-white" : "text-white/50 hover:text-white"}`}>Founder</button>
    </div>
  );
}

export function Topbar({ time, activeNav, subNav, setActiveNav }) {
  // This used to hand-maintain a SECOND copy of the nav list, and that copy had
  // drifted: it was missing walkins, health-components and offers, so those
  // three screens all displayed the title "Dashboard". Deriving the titles from
  // the same source the sidebar renders means it cannot drift again.
  const title = activeNav === "founder"
    ? FOUNDER_SCREENS[subNav]?.label || "Founder"
    : TITLES[activeNav] || "Dashboard";

  return (
    <div className="h-15 bg-[#0e0e18] border-b border-brand-gray-400 flex items-center px-7 gap-4 shrink-0">
      <div className="flex-1">
        <div className="font-syne text-lg font-extrabold text-white">
          {title}
        </div>
        <div className="text-xs text-brand-gray-600">
          {(time || new Date()).toLocaleDateString("en-IN", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })} · {(time || new Date()).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
        </div>
      </div>
      
      <PanelToggle activeNav={activeNav} setActiveNav={setActiveNav} />

      {activeNav !== "founder" && <GlobalSearch />}

      <NotificationBell />
      
      {/* This was a pulsing green "LIVE" badge, which reads as a connection or
          realtime-feed status. It was tied to nothing but the clock's
          setInterval -- it would have kept saying LIVE with the backend down.
          Removed rather than left as a false signal; there is no websocket or
          poll here to report the health of. */}
    </div>
  );
}
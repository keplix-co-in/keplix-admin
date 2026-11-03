const NOTIFICATION_ITEMS = [
  { title: "New Vendor Registration", desc: "Notify when a new vendor signs up.", default: true },
  { title: "High Value Bookings", desc: "Notify for bookings over ₹10,000.", default: true },
  { title: "Withdrawal Requests", desc: "Alert when a vendor requests payout.", default: true },
  { title: "System Alerts", desc: "Downtime and critical system notifications.", default: true },
  { title: "Weekly Report", desc: "Receive automated weekly summaries via email.", default: false },
];

/**
 * Not wired up to any backend endpoint yet. Split out of SettingsView.jsx --
 * see GeneralTab.jsx's comment for why.
 */
export default function NotificationsTab() {
  return (
    <div className="flex flex-col gap-8 animate-[fadeInUp_0.3s_ease_forwards]">
      <div className="rounded-lg border border-amber-400/20 bg-amber-400/5 px-4 py-2.5 text-xs text-amber-400/90">
        Not wired up yet — changes on this tab are not saved anywhere.
      </div>
      <div>
        <h3 className="text-lg font-syne font-bold text-white mb-1">Notification Preferences</h3>
        <p className="text-xs text-white/40 mb-5">Choose what you get notified about.</p>

        <div className="flex flex-col gap-4">
          {NOTIFICATION_ITEMS.map((item, idx) => (
            <div key={idx} className="flex items-center justify-between p-4 rounded-xl border border-white/5 bg-[#1a1a25]">
              <div>
                <h4 className="text-sm font-semibold text-white mb-1">{item.title}</h4>
                <p className="text-xs text-white/40">{item.desc}</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked={item.default} />
                <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-red"></div>
              </label>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

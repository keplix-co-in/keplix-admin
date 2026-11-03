/**
 * Not wired up to any backend endpoint yet -- only /admin/platform-settings
 * (Commission/Health Sheets tabs) exists. Split out of SettingsView.jsx,
 * which had grown to 500+ lines across five unrelated tabs.
 */
export default function GeneralTab() {
  return (
    <div className="flex flex-col gap-8 animate-[fadeInUp_0.3s_ease_forwards]">
      <div className="rounded-lg border border-amber-400/20 bg-amber-400/5 px-4 py-2.5 text-xs text-amber-400/90">
        Not wired up yet — changes on this tab are not saved anywhere.
      </div>
      <div>
        <h3 className="text-lg font-syne font-bold text-white mb-1">Company Information</h3>
        <p className="text-xs text-white/40 mb-5">Update your business details and contact information.</p>

        <div className="grid grid-cols-2 gap-6">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-white/60 tracking-wider">COMPANY NAME</label>
            <input type="text" defaultValue="Keplix Admin" className="bg-[#1a1a25] border border-white/10 rounded-lg py-2.5 px-4 text-sm text-white focus:outline-none focus:border-brand-red/50 focus:bg-white/5 transition-all w-full" />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-white/60 tracking-wider">SUPPORT EMAIL</label>
            <input type="email" defaultValue="support@keplix.in" className="bg-[#1a1a25] border border-white/10 rounded-lg py-2.5 px-4 text-sm text-white focus:outline-none focus:border-brand-red/50 focus:bg-white/5 transition-all w-full" />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-white/60 tracking-wider">CONTACT NUMBER</label>
            <input type="text" defaultValue="+91 98765 43210" className="bg-[#1a1a25] border border-white/10 rounded-lg py-2.5 px-4 text-sm text-white focus:outline-none focus:border-brand-red/50 focus:bg-white/5 transition-all w-full" />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-white/60 tracking-wider">TIMEZONE</label>
            <select className="bg-[#1a1a25] border border-white/10 rounded-lg py-2.5 px-4 text-sm text-white focus:outline-none focus:border-brand-red/50 focus:bg-white/5 transition-all w-full appearance-none">
              <option value="ist">IST (Indian Standard Time)</option>
              <option value="utc">UTC (Coordinated Universal Time)</option>
              <option value="est">EST (Eastern Standard Time)</option>
            </select>
          </div>
        </div>
      </div>

      <div className="h-px w-full bg-white/5 my-2"></div>

      <div>
        <h3 className="text-lg font-syne font-bold text-white mb-1">Platform Preferences</h3>
        <p className="text-xs text-white/40 mb-5">Customize your admin panel experience.</p>

        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between p-4 rounded-xl border border-white/5 bg-[#1a1a25]">
            <div>
              <h4 className="text-sm font-semibold text-white mb-1">Maintenance Mode</h4>
              <p className="text-xs text-white/40">Disable access for standard users.</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" />
              <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-red"></div>
            </label>
          </div>

          <div className="flex items-center justify-between p-4 rounded-xl border border-[rgba(255,61,61,0.2)] bg-[rgba(255,61,61,0.05)]">
            <div>
              <h4 className="text-sm font-semibold text-white mb-1">Beta Features</h4>
              <p className="text-xs text-brand-red/70 font-medium">Early access to upcoming updates.</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" defaultChecked />
              <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-red shadow-[0_0_10px_rgba(255,61,61,0.4)]"></div>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}

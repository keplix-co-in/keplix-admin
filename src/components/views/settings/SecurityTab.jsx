/**
 * Not wired up to any backend endpoint yet. Split out of SettingsView.jsx --
 * see GeneralTab.jsx's comment for why.
 */
export default function SecurityTab() {
  return (
    <div className="flex flex-col gap-8 animate-[fadeInUp_0.3s_ease_forwards]">
      <div className="rounded-lg border border-amber-400/20 bg-amber-400/5 px-4 py-2.5 text-xs text-amber-400/90">
        Not wired up yet — changes on this tab are not saved anywhere.
      </div>
      <div>
        <h3 className="text-lg font-syne font-bold text-white mb-1">Security Settings</h3>
        <p className="text-xs text-white/40 mb-5">Manage passwords and access security.</p>

        <div className="grid grid-cols-1 gap-6 max-w-lg">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-white/60 tracking-wider">CURRENT PASSWORD</label>
            <input type="password" placeholder="••••••••" className="bg-[#1a1a25] border border-white/10 rounded-lg py-2.5 px-4 text-sm text-white focus:outline-none focus:border-brand-red/50 focus:bg-white/5 transition-all w-full" />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-white/60 tracking-wider">NEW PASSWORD</label>
            <input type="password" placeholder="Enter new password" className="bg-[#1a1a25] border border-white/10 rounded-lg py-2.5 px-4 text-sm text-white focus:outline-none focus:border-brand-red/50 focus:bg-white/5 transition-all w-full" />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-white/60 tracking-wider">CONFIRM NEW PASSWORD</label>
            <input type="password" placeholder="Confirm new password" className="bg-[#1a1a25] border border-white/10 rounded-lg py-2.5 px-4 text-sm text-white focus:outline-none focus:border-brand-red/50 focus:bg-white/5 transition-all w-full" />
          </div>
        </div>
      </div>

      {/*
        Security review 2026-10-28 A-003 (owner decision 2026-11-05): the
        "Two-Factor Authentication (2FA)" section and its "Enable 2FA" button
        were removed. The button had no handler and the backend's
        /admin/auth/login has no admin TOTP/MFA, so it falsely suggested 2FA
        was available. Re-add it only together with real backend MFA.
      */}
    </div>
  );
}

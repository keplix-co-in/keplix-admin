import React, { useEffect, useState } from 'react';
import { Icon } from '../ui/Icon';
import { getPlatformSettings, updatePlatformSettings } from '../../services/platformSettingsApi';

export default function SettingsView() {
  const [activeTab, setActiveTab] = useState('general');

  const tabs = [
    { id: 'general', label: 'General', icon: 'settings' },
    { id: 'security', label: 'Security', icon: 'users' },
    { id: 'notifications', label: 'Notifications', icon: 'bell' },
    { id: 'health', label: 'Health Sheets', icon: 'check' },
  ];

  return (
    <div className="flex flex-col gap-6 animate-[fadeInUp_0.3s_ease_forwards]">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-syne font-bold text-white mb-2">Settings</h2>
          <p className="text-sm text-brand-gray-300">Manage your application preferences and configurations.</p>
        </div>
        <div className="flex gap-3">
          <button className="py-2 px-4 rounded-lg bg-transparent border border-white/10 text-white/70 hover:bg-white/5 hover:text-white transition-all text-sm font-semibold">
            Cancel
          </button>
          <button className="py-2 px-5 rounded-lg bg-linear-to-r from-brand-red to-[#ff4400] text-white border-none cursor-pointer shadow-[0_4px_14px_rgba(255,61,61,0.3)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(255,61,61,0.4)] text-sm font-semibold">
            Save Changes
          </button>
        </div>
      </div>

      <div className="flex gap-6 h-full">
        {/* Settings Sidebar */}
        <div className="w-64 shrink-0 flex flex-col gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-3 w-full py-3 px-4 rounded-xl text-sm font-medium transition-all duration-200 ${
                activeTab === tab.id
                  ? 'bg-[rgba(255,61,61,0.12)] text-white border border-[rgba(255,61,61,0.2)] shadow-[inset_2px_0_0_#ff3d3d]'
                  : 'bg-transparent text-white/40 border border-transparent hover:bg-white/5 hover:text-white/70'
              }`}
            >
              <Icon name={tab.icon} size={16} color={activeTab === tab.id ? '#ff3d3d' : 'currentColor'} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Settings Content */}
        <div className="flex-1 bg-[#141420] rounded-[20px] border border-white/5 p-8 relative overflow-hidden">
          {activeTab === 'general' && (
            <div className="flex flex-col gap-8 animate-[fadeInUp_0.3s_ease_forwards]">
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
          )}

          {activeTab === 'security' && (
            <div className="flex flex-col gap-8 animate-[fadeInUp_0.3s_ease_forwards]">
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
              
              <div className="h-px w-full bg-white/5 my-2"></div>

              <div>
                <h3 className="text-lg font-syne font-bold text-white mb-1">Two-Factor Authentication (2FA)</h3>
                <p className="text-xs text-white/40 mb-5">Add an extra layer of security to your account.</p>
                
                <button className="py-2.5 px-5 rounded-lg bg-transparent border border-brand-red text-brand-red hover:bg-brand-red/10 transition-all font-semibold text-sm">
                  Enable 2FA
                </button>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="flex flex-col gap-8 animate-[fadeInUp_0.3s_ease_forwards]">
              <div>
                <h3 className="text-lg font-syne font-bold text-white mb-1">Notification Preferences</h3>
                <p className="text-xs text-white/40 mb-5">Choose what you get notified about.</p>

                <div className="flex flex-col gap-4">
                  {[
                    { title: "New Vendor Registration", desc: "Notify when a new vendor signs up.", default: true },
                    { title: "High Value Bookings", desc: "Notify for bookings over ₹10,000.", default: true },
                    { title: "Withdrawal Requests", desc: "Alert when a vendor requests payout.", default: true },
                    { title: "System Alerts", desc: "Downtime and critical system notifications.", default: true },
                    { title: "Weekly Report", desc: "Receive automated weekly summaries via email.", default: false },
                  ].map((item, idx) => (
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
          )}

          {activeTab === 'health' && <HealthSheetSettings />}
        </div>
      </div>
    </div>
  );
}

/**
 * The mandatory-inspection rollout gate. Unlike every other tab on this
 * screen, this one is wired to the real backend — PlatformSettings already
 * has isHealthSheetRequired/healthSheetRequiredFrom (see prisma/schema.prisma
 * and util/platformSettings.js). Enforcement sits on the booking-completion
 * path, which is what releases escrow, so this form is deliberately blunter
 * than a plain toggle: it insists on a future date before it will let you
 * turn enforcement on, mirroring the rollout rule the backend gate itself
 * enforces (jobs are only gated from that date forward).
 */
function HealthSheetSettings() {
  const [settings, setSettings] = useState(null);
  const [requiredFrom, setRequiredFrom] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    getPlatformSettings()
      .then((s) => {
        setSettings(s);
        setRequiredFrom(s.healthSheetRequiredFrom ? s.healthSheetRequiredFrom.slice(0, 10) : '');
      })
      .catch(() => setError('Failed to load settings.'))
      .finally(() => setLoading(false));
  }, []);

  const handleToggle = async (next) => {
    setError('');
    setSaved(false);

    if (next && !requiredFrom) {
      setError('Set an effective date before turning enforcement on — see the warning below.');
      return;
    }
    if (next && new Date(requiredFrom) <= new Date()) {
      setError('The effective date must be in the future, so bookings already in progress are not blocked.');
      return;
    }

    setSaving(true);
    try {
      const updated = await updatePlatformSettings({
        isHealthSheetRequired: next,
        healthSheetRequiredFrom: requiredFrom ? new Date(requiredFrom).toISOString() : null,
      });
      setSettings(updated);
      setSaved(true);
    } catch (err) {
      setError(err.message || 'Failed to update settings.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="text-sm text-white/40">Loading…</p>;

  return (
    <div className="flex flex-col gap-6 animate-[fadeInUp_0.3s_ease_forwards] max-w-xl">
      <div>
        <h3 className="text-lg font-syne font-bold text-white mb-1">
          Mandatory Vehicle Health Sheet
        </h3>
        <p className="text-xs text-white/40 mb-5">
          When enabled, a garage cannot mark a job complete without submitting the
          Digital Vehicle Health Sheet.
        </p>
      </div>

      <div className="rounded-xl border border-[rgba(255,61,61,0.25)] bg-[rgba(255,61,61,0.06)] p-4">
        <p className="text-xs text-brand-red font-semibold mb-1">Before you enable this</p>
        <p className="text-xs text-white/70 leading-relaxed">
          Completion sits on the escrow-release path. Turning this on with no
          effective date, or a past one, would instantly block every booking
          already in progress from being completed. Set a future date — only jobs
          created on or after it will be gated; everything already in flight
          completes exactly as it does today.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-xs font-semibold text-white/60 tracking-wider">
          EFFECTIVE FROM (jobs created on/after this date are gated)
        </label>
        <input
          type="date"
          value={requiredFrom}
          onChange={(e) => setRequiredFrom(e.target.value)}
          className="bg-[#1a1a25] border border-white/10 rounded-lg py-2.5 px-4 text-sm text-white focus:outline-none focus:border-brand-red/50 focus:bg-white/5 transition-all w-full"
        />
      </div>

      <div className="flex items-center justify-between p-4 rounded-xl border border-white/5 bg-[#1a1a25]">
        <div>
          <h4 className="text-sm font-semibold text-white mb-1">Enforce health sheet on completion</h4>
          <p className="text-xs text-white/40">
            Currently: {settings?.isHealthSheetRequired ? 'ENABLED' : 'disabled'}
            {settings?.healthSheetRequiredFrom
              ? ` from ${new Date(settings.healthSheetRequiredFrom).toLocaleDateString('en-IN')}`
              : ''}
          </p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            className="sr-only peer"
            checked={!!settings?.isHealthSheetRequired}
            disabled={saving}
            onChange={(e) => handleToggle(e.target.checked)}
          />
          <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-red"></div>
        </label>
      </div>

      {error && (
        <div className="rounded-xl bg-red-500/10 border border-red-500/30 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}
      {saved && !error && (
        <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/30 px-4 py-3 text-sm text-emerald-300">
          Saved.
        </div>
      )}
    </div>
  );
}

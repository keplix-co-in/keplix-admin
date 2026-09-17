import { useState } from 'react';
import { Icon } from '../ui/Icon';
import GeneralTab from './settings/GeneralTab.jsx';
import SecurityTab from './settings/SecurityTab.jsx';
import NotificationsTab from './settings/NotificationsTab.jsx';
import CommissionSettings from './settings/CommissionSettings.jsx';
import HealthSheetSettings from './settings/HealthSheetSettings.jsx';

/**
 * Was 500+ lines covering five unrelated tabs (three unwired mockups plus two
 * real, backend-backed settings forms) in one component. Split into
 * ./settings/*.jsx, each owning its own state where it has any; this
 * component only owns which tab is selected.
 */
export default function SettingsView() {
  const [activeTab, setActiveTab] = useState('general');

  const tabs = [
    { id: 'general', label: 'General', icon: 'settings' },
    { id: 'security', label: 'Security', icon: 'users' },
    { id: 'notifications', label: 'Notifications', icon: 'bell' },
    { id: 'commission', label: 'Commission', icon: 'finance' },
    { id: 'health', label: 'Health Sheets', icon: 'check' },
  ];

  // Tabs backed by a real endpoint (/admin/platform-settings). Both save
  // inline on change rather than through the header buttons.
  const SELF_SAVING_TABS = ['health', 'commission'];

  const TAB_CONTENT = {
    general: <GeneralTab />,
    security: <SecurityTab />,
    notifications: <NotificationsTab />,
    commission: <CommissionSettings />,
    health: <HealthSheetSettings />,
  };

  return (
    <div className="flex flex-col gap-6 animate-[fadeInUp_0.3s_ease_forwards]">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-syne font-bold text-white mb-2">Settings</h2>
          <p className="text-sm text-brand-gray-300">Manage your application preferences and configurations.</p>
        </div>
        <div className="flex gap-3">
          {SELF_SAVING_TABS.includes(activeTab) ? (
            <>
              <button className="py-2 px-4 rounded-lg bg-transparent border border-white/10 text-white/70 hover:bg-white/5 hover:text-white transition-all text-sm font-semibold">
                Cancel
              </button>
              <button className="py-2 px-5 rounded-lg bg-linear-to-r from-brand-red to-[#ff4400] text-white border-none cursor-pointer shadow-[0_4px_14px_rgba(255,61,61,0.3)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(255,61,61,0.4)] text-sm font-semibold">
                Save Changes
              </button>
            </>
          ) : (
            <>
              {/* General/Security/Notifications have no backing endpoint —
                  only /admin/platform-settings (Health Sheets/Commission tabs)
                  exists. Disabled rather than removed so the layout doesn't
                  jump between tabs; the tooltip explains why. */}
              <button
                disabled
                title="Not wired up yet — this tab has no backend endpoint to save to."
                className="py-2 px-4 rounded-lg bg-transparent border border-white/5 text-white/25 cursor-not-allowed transition-all text-sm font-semibold"
              >
                Cancel
              </button>
              <button
                disabled
                title="Not wired up yet — this tab has no backend endpoint to save to."
                className="py-2 px-5 rounded-lg bg-white/5 text-white/25 border-none cursor-not-allowed text-sm font-semibold"
              >
                Save Changes
              </button>
            </>
          )}
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
          {TAB_CONTENT[activeTab]}
        </div>
      </div>
    </div>
  );
}

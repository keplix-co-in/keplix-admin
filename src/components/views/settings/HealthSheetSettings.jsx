import { useEffect, useState } from 'react';
import { getPlatformSettings, updatePlatformSettings } from '../../../services/platformSettingsApi';

/**
 * The mandatory-inspection rollout gate. Unlike General/Security/Notifications,
 * this one is wired to the real backend — PlatformSettings already has
 * isHealthSheetRequired/healthSheetRequiredFrom (see prisma/schema.prisma and
 * util/platformSettings.js). Enforcement sits on the booking-completion path,
 * which is what releases escrow, so this form is deliberately blunter than a
 * plain toggle: it insists on a future date before it will let you turn
 * enforcement on, mirroring the rollout rule the backend gate itself enforces
 * (jobs are only gated from that date forward).
 *
 * Split out of SettingsView.jsx (which had grown to 500+ lines across five
 * unrelated tabs) -- see GeneralTab.jsx's comment for the rest of the split.
 */
export default function HealthSheetSettings() {
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

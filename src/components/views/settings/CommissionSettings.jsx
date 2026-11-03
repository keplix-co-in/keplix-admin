import { useEffect, useState } from 'react';
import { getPlatformSettings, updatePlatformSettings } from '../../../services/platformSettingsApi';

/**
 * Platform commission (the cut Keplix takes from each booking).
 *
 * Backed by PlatformSettings.isPlatformFeeEnabled / platformFeePercentage via
 * the same /admin/platform-settings endpoint the Health Sheets tab uses.
 *
 * Worth being precise about what OFF means, because it is NOT a discount to
 * the customer: the customer is always charged the vendor's service price, and
 * the commission is carved OUT of that (vendorAmount = amount - platformFee).
 * So switching it off pays the vendor 100% and leaves the customer's total
 * unchanged. The copy below says exactly that, so nobody flips it expecting
 * customer-facing prices to move.
 *
 * The rate is stored 0-1 (the backend validator enforces that range) but shown
 * as a percentage, since "0.1" in an admin field invites someone to type "10"
 * and set a 1000% fee.
 *
 * Split out of SettingsView.jsx (which had grown to 500+ lines across five
 * unrelated tabs) -- see GeneralTab.jsx's comment for the rest of the split.
 */
export default function CommissionSettings() {
  const [settings, setSettings] = useState(null);
  const [percentInput, setPercentInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    getPlatformSettings()
      .then((s) => {
        setSettings(s);
        setPercentInput(
          s.platformFeePercentage != null ? String(Number(s.platformFeePercentage) * 100) : '',
        );
      })
      .catch(() => setError('Failed to load settings.'))
      .finally(() => setLoading(false));
  }, []);

  const persist = async (updates) => {
    setError('');
    setSaved(false);
    setSaving(true);
    try {
      const updated = await updatePlatformSettings(updates);
      setSettings(updated);
      setSaved(true);
    } catch (err) {
      setError(err.message || 'Failed to update settings.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = (next) => persist({ isPlatformFeeEnabled: next });

  const handleRateSave = () => {
    const percent = Number(percentInput);
    if (!Number.isFinite(percent) || percent < 0 || percent > 100) {
      setError('Enter a commission between 0 and 100 percent.');
      return;
    }
    // Stored 0-1; the backend validator rejects anything outside that.
    persist({ platformFeePercentage: percent / 100 });
  };

  if (loading) return <p className="text-sm text-white/40">Loading…</p>;

  const enabled = !!settings?.isPlatformFeeEnabled;
  const currentPercent =
    settings?.platformFeePercentage != null
      ? (Number(settings.platformFeePercentage) * 100).toFixed(2).replace(/\.00$/, '')
      : '—';

  return (
    <div className="flex flex-col gap-6 animate-[fadeInUp_0.3s_ease_forwards] max-w-xl">
      <div>
        <h3 className="text-lg font-syne font-bold text-white mb-1">Platform Commission</h3>
        <p className="text-xs text-white/40 mb-5">
          The share Keplix keeps from each completed booking. The rest is paid out to
          the vendor.
        </p>
      </div>

      <div className="rounded-xl border border-[rgba(255,153,68,0.25)] bg-[rgba(255,153,68,0.06)] p-4">
        <p className="text-xs text-[#ff9944] font-semibold mb-1">What switching this off does</p>
        <p className="text-xs text-white/70 leading-relaxed">
          The customer is always charged the vendor&apos;s listed service price; the
          commission is taken out of that, not added on top. So turning this OFF does
          not make anything cheaper for customers — it means the vendor receives 100%
          of what the customer paid, and Keplix earns nothing on those bookings.
          <br />
          <br />
          Changes apply to <strong className="text-white/90">new payments only</strong>.
          Bookings already paid for keep the split they were recorded with, so money
          already promised to a vendor cannot change.
        </p>
      </div>

      <div className="flex items-center justify-between p-4 rounded-xl border border-white/5 bg-[#1a1a25]">
        <div>
          <h4 className="text-sm font-semibold text-white mb-1">Charge platform commission</h4>
          <p className="text-xs text-white/40">
            Currently: {enabled ? `ENABLED at ${currentPercent}%` : 'disabled — vendors keep 100%'}
          </p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            className="sr-only peer"
            checked={enabled}
            disabled={saving}
            onChange={(e) => handleToggle(e.target.checked)}
          />
          <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-red"></div>
        </label>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-xs font-semibold text-white/60 tracking-wider" htmlFor="commission-rate">
          COMMISSION RATE (%)
        </label>
        <div className="flex gap-3">
          <input
            id="commission-rate"
            type="number"
            min="0"
            max="100"
            step="0.5"
            value={percentInput}
            disabled={saving}
            onChange={(e) => setPercentInput(e.target.value)}
            className="bg-[#1a1a25] border border-white/10 rounded-lg py-2.5 px-4 text-sm text-white focus:outline-none focus:border-brand-red/50 focus:bg-white/5 transition-all flex-1"
          />
          <button
            type="button"
            onClick={handleRateSave}
            disabled={saving}
            className="py-2 px-5 rounded-lg bg-linear-to-r from-brand-red to-[#ff4400] text-white border-none cursor-pointer shadow-[0_4px_14px_rgba(255,61,61,0.3)] transition-all duration-200 hover:-translate-y-0.5 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0 text-sm font-semibold"
          >
            {saving ? 'Saving…' : 'Save rate'}
          </button>
        </div>
        {!enabled && (
          <p className="text-xs text-white/40">
            The rate is saved but not applied while the commission is switched off.
          </p>
        )}
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

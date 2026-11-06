import React, { useEffect, useState } from 'react';
import { saveOfferSlotByKey, setOfferSlotTargets } from '../../services/offersApi';
import { getVendors } from '../../services/vendorsApi';

const inputClass =
  'w-full bg-[rgba(255,255,255,0.03)] border border-white/10 rounded-xl py-3 px-4 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[rgba(255,61,61,0.5)] transition-all';
const labelClass = 'block text-xs font-semibold text-white/60 mb-2 ml-1';
const hintClass = 'text-xs text-white/30 mt-1.5 ml-1';
const sectionClass = 'mb-2 text-xs font-semibold uppercase tracking-wide text-white/30';

/** A Date or ISO string → the yyyy-MM-dd a date input expects. */
const toDateInput = (v) => (v ? new Date(v).toISOString().slice(0, 10) : '');

/**
 * Editor for one placement.
 *
 * `placement` (from data/offerPlacements) decides which fields appear, so a
 * banner isn't asked for badge text and a badge isn't asked for a background
 * image. `slot` is the stored row, or null when nothing has been set yet.
 */
export default function OfferSlotFormModal({ placement, slot, onClose, onSaved }) {
  const [form, setForm] = useState({
    headline: '', body: '', badge_text: '', image_url: '',
    starts_at: '', ends_at: '', is_active: false,
  });
  const [vendors, setVendors] = useState([]);
  const [targets, setTargets] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const has = (field) => placement.fields.includes(field);

  useEffect(() => {
    setForm({
      headline: slot?.headline || '',
      body: slot?.body || '',
      badge_text: slot?.badge_text || '',
      image_url: slot?.image_url || '',
      starts_at: toDateInput(slot?.starts_at),
      ends_at: toDateInput(slot?.ends_at),
      is_active: !!slot?.is_active,
    });
    setTargets(slot?.vendor_ids || []);
  }, [slot]);

  // Targeting is optional, so failing to load vendors must not block editing the
  // copy — the picker just falls back to "all vendors".
  // getVendors defaults to a page size of 10, which would silently hide most
  // garages from the picker.
  useEffect(() => {
    getVendors('all', 1, 500)
      .then((list) => setVendors(Array.isArray(list) ? list : list?.data || []))
      .catch(() => setVendors([]));
  }, []);

  const toggleVendor = (id) =>
    setTargets((prev) => (prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.starts_at && form.ends_at && new Date(form.ends_at) <= new Date(form.starts_at)) {
      return setError('The end date must be after the start date.');
    }
    if (form.image_url && !/^https?:\/\//i.test(form.image_url.trim())) {
      return setError('The background image must be a full URL starting with http.');
    }

    setSaving(true);
    setError('');

    // Empty strings become null so clearing a field actually clears it rather
    // than storing "".
    const orNull = (v) => (v && String(v).trim() ? String(v).trim() : null);

    // Only fields this placement uses are sent, so editing a badge can't leave
    // stale banner copy behind on the row.
    const payload = {
      label: placement.label,
      description: placement.description,
      starts_at: form.starts_at || null,
      ends_at: form.ends_at || null,
      is_active: form.is_active,
      ...(has('headline') ? { headline: orNull(form.headline) } : {}),
      ...(has('body') ? { body: orNull(form.body) } : {}),
      ...(has('badge_text') ? { badge_text: orNull(form.badge_text) } : {}),
      ...(has('image_url') ? { image_url: orNull(form.image_url) } : {}),
    };

    try {
      const saved = await saveOfferSlotByKey(placement.key, payload);
      const id = slot?.id || saved?.slot?.id;
      if (id) await setOfferSlotTargets(id, targets);
      onSaved();
    } catch (err) {
      setError(err.message || 'Failed to save offer');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-[fadeIn_0.2s_ease_forwards]">
      <form
        onSubmit={handleSubmit}
        className="bg-[#121212] border border-white/10 rounded-2xl w-full max-w-lg p-6 relative shadow-2xl max-h-[90vh] overflow-y-auto"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-white/50 hover:text-white bg-white/5 hover:bg-white/10 rounded-full w-8 h-8 flex items-center justify-center transition-colors"
        >
          ✕
        </button>

        <h2 className="text-xl font-bold text-white mb-1 pr-10">{placement.label}</h2>
        <p className="text-sm text-white/40 mb-6">{placement.description}</p>

        {error && (
          <div className="mb-4 rounded-xl bg-red-500/10 border border-red-500/30 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        <div className={sectionClass}>Content</div>

        {has('headline') && (
          <div className="mb-4">
            <label className={labelClass}>Headline</label>
            <input
              type="text"
              value={form.headline}
              onChange={(e) => setForm({ ...form, headline: e.target.value })}
              placeholder="15%"
              className={inputClass}
            />
            <p className={hintClass}>The large figure on the left of the banner.</p>
          </div>
        )}

        {has('body') && (
          <div className="mb-4">
            <label className={labelClass}>Description</label>
            <input
              type="text"
              value={form.body}
              onChange={(e) => setForm({ ...form, body: e.target.value })}
              placeholder="Discount on your first service booking"
              className={inputClass}
            />
          </div>
        )}

        {has('badge_text') && (
          <div className="mb-4">
            <label className={labelClass}>Badge text</label>
            <input
              type="text"
              value={form.badge_text}
              onChange={(e) => setForm({ ...form, badge_text: e.target.value })}
              placeholder="e.g. 20% off first service"
              className={inputClass}
            />
            <p className={hintClass}>Keep it short — it sits on a small red tag.</p>
          </div>
        )}

        {has('image_url') && (
          <div className="mb-6">
            <label className={labelClass}>Background image</label>
            <input
              type="text"
              value={form.image_url}
              onChange={(e) => setForm({ ...form, image_url: e.target.value })}
              placeholder="https://…/banner.jpg"
              className={inputClass}
            />
            <p className={hintClass}>
              Paste an image URL. Leave blank for the plain dark background. The text sits on
              top, so choose something darker — it&apos;s dimmed automatically to keep the copy
              readable.
              {/* Security review 2026-10-28 O-002: the admin CSP (vercel.json)
                  only allows images from Cloudinary, so a preview of a
                  banner hosted elsewhere is blocked here (the URL still saves). */}
              {' '}The preview only shows Cloudinary-hosted images.
            </p>
            {form.image_url ? (
              <div className="mt-3 rounded-xl overflow-hidden border border-white/10 bg-black/40">
                <img
                  src={form.image_url}
                  alt=""
                  className="w-full h-28 object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>
            ) : null}
          </div>
        )}

        <div className={sectionClass}>Schedule</div>
        <div className="grid grid-cols-2 gap-3 mb-2">
          <div>
            <label className={labelClass}>Starts</label>
            <input
              type="date"
              value={form.starts_at}
              onChange={(e) => setForm({ ...form, starts_at: e.target.value })}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Ends</label>
            <input
              type="date"
              value={form.ends_at}
              onChange={(e) => setForm({ ...form, ends_at: e.target.value })}
              className={inputClass}
            />
          </div>
        </div>
        <p className={`${hintClass} mb-6`}>Leave both blank to run indefinitely while switched on.</p>

        <div className={sectionClass}>Who sees it</div>
        <div className="mb-6 rounded-xl border border-white/10 bg-white/[0.02] p-3 max-h-44 overflow-y-auto">
          {/* No selection = every vendor. Stated explicitly because an empty
              list meaning "everyone" is easy to misread as "nobody". */}
          <p className="text-xs text-white/40 mb-3">
            {targets.length === 0
              ? 'All vendors — select below to restrict.'
              : `${targets.length} vendor${targets.length > 1 ? 's' : ''} selected.`}
          </p>
          {vendors.length === 0 && (
            <p className="text-xs text-white/30">No vendors available to target.</p>
          )}
          {vendors.map((v) => {
            const id = v.id ?? v.userId;
            const name = v.business_name || v.vendorProfile?.business_name || v.name || `Vendor ${id}`;
            return (
              <label key={id} className="flex items-center gap-2 py-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={targets.includes(id)}
                  onChange={() => toggleVendor(id)}
                  className="accent-[#ff3d3d]"
                />
                <span className="text-sm text-white/70 truncate">{name}</span>
              </label>
            );
          })}
        </div>

        <label className="flex items-center gap-2 mb-6 cursor-pointer">
          <input
            type="checkbox"
            checked={form.is_active}
            onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
            className="accent-[#ff3d3d]"
          />
          <span className="text-sm text-white/70">Switched on</span>
        </label>

        <button
          type="submit"
          disabled={saving}
          className="w-full px-4 py-3 rounded-xl text-sm font-semibold text-white bg-brand-red hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          {saving ? 'Saving…' : 'Save changes'}
        </button>
      </form>
    </div>
  );
}

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { getOfferSlots, saveOfferSlotByKey } from '../../services/offersApi';
import offerPlacements from '../../data/offerPlacements';
import OfferSlotFormModal from '../Cards/OfferSlotFormModal';

const GRID = 'grid-cols-[1.5fr_1.5fr_110px_130px_150px]';

/** What the customer actually sees, so the admin needn't open the editor. */
function preview(placement, slot) {
  if (!slot) return '—';
  if (placement.preview === 'badge_text') return slot.badge_text || '—';
  const parts = [slot.headline, slot.body].filter(Boolean);
  return parts.length ? parts.join(' — ') : '—';
}

function scheduleLabel(slot) {
  if (!slot) return 'Always';
  const fmt = (d) => new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  if (slot.starts_at && slot.ends_at) return `${fmt(slot.starts_at)} → ${fmt(slot.ends_at)}`;
  if (slot.starts_at) return `from ${fmt(slot.starts_at)}`;
  if (slot.ends_at) return `until ${fmt(slot.ends_at)}`;
  return 'Always';
}

export default function OffersView() {
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(null);

  const fetchSlots = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setSlots(await getOfferSlots());
    } catch (err) {
      // Distinguished so an expired session doesn't read as a broken page —
      // the fix is a re-login, not a retry.
      setError(
        err.code === 'SESSION_EXPIRED'
          ? 'Your session has expired. Please log in again.'
          : 'Failed to load offers.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSlots();
  }, [fetchSlots]);

  /**
   * The list is driven by the placements the apps actually read, not by whatever
   * rows exist. A placement with no row yet still appears — shown as "Not set"
   * and created on first save — so a newly shipped placement is never invisible
   * here.
   */
  const rows = useMemo(
    () =>
      offerPlacements.map((placement) => ({
        placement,
        slot: slots.find((s) => s.key === placement.key) || null,
      })),
    [slots]
  );

  const toggleActive = async (placement, slot) => {
    try {
      await saveOfferSlotByKey(placement.key, {
        label: placement.label,
        description: placement.description,
        is_active: !slot?.is_active,
      });
      fetchSlots();
    } catch (err) {
      alert(err.message || 'Failed to update offer');
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-lg font-bold text-white">Offers</h2>
        <p className="text-sm text-white/40 mt-1">
          Promotional content shown in the customer app. Changes appear without an app update.
        </p>
      </div>

      {error && (
        <div className="mb-4 rounded-xl bg-red-500/10 border border-red-500/30 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      <div className="rounded-2xl border border-white/10 overflow-hidden">
        <div className={`grid ${GRID} gap-4 px-5 py-3 bg-white/[0.03] text-xs font-semibold uppercase tracking-wide text-white/40`}>
          <div>Placement</div>
          <div>Shows</div>
          <div>Schedule</div>
          <div>Status</div>
          <div className="text-right">Actions</div>
        </div>

        {loading && <div className="px-5 py-10 text-center text-sm text-white/40">Loading…</div>}

        {!loading &&
          rows.map(({ placement, slot }) => (
            <div
              key={placement.key}
              className={`grid ${GRID} gap-4 items-center px-5 py-4 border-t border-white/5 hover:bg-white/[0.02] transition-colors`}
            >
              {/* Name and location, not the key — the point of a placement is
                  knowing WHERE it shows. */}
              <div className="min-w-0">
                <div className="text-sm font-semibold text-white truncate">{placement.label}</div>
                <div className="text-xs text-white/40 mt-0.5 truncate">{placement.description}</div>
              </div>

              <div className="min-w-0">
                <div className="text-sm text-white/80 truncate">{preview(placement, slot)}</div>
                <div className="text-xs text-white/30 mt-0.5 truncate">
                  {slot?.vendor_ids?.length
                    ? `${slot.vendor_ids.length} vendor${slot.vendor_ids.length > 1 ? 's' : ''}`
                    : 'All vendors'}
                  {placement.fields.includes('image_url') && slot?.image_url ? ' · has background' : ''}
                </div>
              </div>

              <div className="text-sm text-white/60">{scheduleLabel(slot)}</div>

              {/* is_live, not is_active: a slot can be on but outside its date
                  window, and "Active" alone would wrongly imply it's showing. */}
              <div>
                <span
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${
                    slot?.is_live
                      ? 'bg-emerald-500/15 text-emerald-300'
                      : slot?.is_active
                        ? 'bg-amber-500/15 text-amber-300'
                        : 'bg-white/10 text-white/50'
                  }`}
                >
                  {slot?.is_live ? 'Live' : slot?.is_active ? 'Scheduled' : slot ? 'Off' : 'Not set'}
                </span>
              </div>

              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setEditing({ placement, slot })}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white/70 bg-white/5 hover:bg-white/10 hover:text-white transition-colors"
                >
                  Edit
                </button>
                <button
                  onClick={() => toggleActive(placement, slot)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 transition-colors"
                >
                  {slot?.is_active ? 'Turn off' : 'Turn on'}
                </button>
              </div>
            </div>
          ))}
      </div>

      <p className="text-xs text-white/30 mt-4">
        These are the placements the apps read. A new one requires an app release that reads its
        key, so they can&apos;t be created here.
      </p>

      {editing && (
        <OfferSlotFormModal
          placement={editing.placement}
          slot={editing.slot}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            fetchSlots();
          }}
        />
      )}
    </div>
  );
}

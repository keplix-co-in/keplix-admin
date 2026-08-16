import React, { useEffect, useState } from 'react';
import { createHealthComponent, updateHealthComponent } from '../../services/healthComponentsApi';

const inputClass =
  'w-full bg-[rgba(255,255,255,0.03)] border border-white/10 rounded-xl py-3 px-4 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[rgba(255,61,61,0.5)] transition-all';
const labelClass = 'block text-xs font-semibold text-white/60 mb-2 ml-1';

const EMPTY = { key: '', label: '', display_order: 0 };

/** Create/edit dialog for a HealthComponent. `component` null means "new". */
export default function HealthComponentFormModal({ component, onClose, onSaved }) {
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (component) {
      setForm({
        label: component.label || '',
        display_order: component.display_order ?? 0,
        is_active: component.is_active,
      });
    } else {
      setForm(EMPTY);
    }
  }, [component]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!component && !form.key.trim()) {
      setError('Key is required.');
      return;
    }
    if (!form.label.trim()) {
      setError('Label is required.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      if (component) {
        await updateHealthComponent(component.id, {
          label: form.label.trim(),
          display_order: Number(form.display_order),
        });
      } else {
        await createHealthComponent({
          key: form.key.trim(),
          label: form.label.trim(),
          display_order: Number(form.display_order),
        });
      }
      onSaved();
    } catch (err) {
      setError(err.message || 'Failed to save component');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-[fadeIn_0.2s_ease_forwards]">
      <form
        onSubmit={handleSubmit}
        className="bg-[#121212] border border-white/10 rounded-2xl w-full max-w-md p-6 relative shadow-2xl"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-white/50 hover:text-white bg-white/5 hover:bg-white/10 rounded-full w-8 h-8 flex items-center justify-center transition-colors"
        >
          ✕
        </button>

        <h2 className="text-xl font-bold text-white mb-6">
          {component ? 'Edit Component' : 'New Inspection Component'}
        </h2>

        {error && (
          <div className="mb-4 rounded-xl bg-red-500/10 border border-red-500/30 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        {!component && (
          <div className="mb-4">
            <label className={labelClass}>Key (stable, machine-readable)</label>
            <input
              type="text"
              value={form.key}
              onChange={(e) => setForm({ ...form, key: e.target.value.toLowerCase().replace(/\s+/g, '_') })}
              placeholder="e.g. wipers"
              className={inputClass}
            />
          </div>
        )}

        <div className="mb-4">
          <label className={labelClass}>Label (shown to the mechanic and customer)</label>
          <input
            type="text"
            value={form.label}
            onChange={(e) => setForm({ ...form, label: e.target.value })}
            placeholder="e.g. Wiper Blades"
            className={inputClass}
          />
        </div>

        <div className="mb-6">
          <label className={labelClass}>Display order</label>
          <input
            type="number"
            value={form.display_order}
            onChange={(e) => setForm({ ...form, display_order: e.target.value })}
            className={inputClass}
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full px-4 py-3 rounded-xl text-sm font-semibold text-white bg-brand-red hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          {saving ? 'Saving…' : component ? 'Save changes' : 'Create component'}
        </button>
      </form>
    </div>
  );
}

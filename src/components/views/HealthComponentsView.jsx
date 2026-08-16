import React, { useCallback, useEffect, useState } from 'react';
import { getHealthComponents, updateHealthComponent } from '../../services/healthComponentsApi';
import HealthComponentFormModal from '../Cards/HealthComponentFormModal';

const GRID = 'grid-cols-[1fr_1fr_100px_100px_140px]';

export default function HealthComponentsView() {
  const [components, setComponents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const fetchComponents = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setComponents(await getHealthComponents());
    } catch {
      setError('Failed to load components.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchComponents();
  }, [fetchComponents]);

  const toggleActive = async (component) => {
    try {
      await updateHealthComponent(component.id, { is_active: !component.is_active });
      fetchComponents();
    } catch (err) {
      alert(err.message || 'Failed to update component');
    }
  };

  const openNew = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const openEdit = (component) => {
    setEditing(component);
    setModalOpen(true);
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-bold text-white">Health Sheet Components</h2>
          <p className="text-sm text-white/40 mt-1">
            The checklist every garage fills in for a Digital Vehicle Health Sheet.
          </p>
        </div>
        <button
          onClick={openNew}
          className="px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-brand-red hover:opacity-90 transition-opacity whitespace-nowrap"
        >
          + Add component
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-xl bg-red-500/10 border border-red-500/30 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      <div className="rounded-2xl border border-white/10 overflow-hidden">
        <div className={`grid ${GRID} gap-4 px-5 py-3 bg-white/[0.03] text-xs font-semibold uppercase tracking-wide text-white/40`}>
          <div>Label</div>
          <div>Key</div>
          <div>Order</div>
          <div>Active</div>
          <div className="text-right">Actions</div>
        </div>

        {loading && <div className="px-5 py-10 text-center text-sm text-white/40">Loading…</div>}

        {!loading &&
          components.map((c) => (
            <div
              key={c.id}
              className={`grid ${GRID} gap-4 items-center px-5 py-4 border-t border-white/5 hover:bg-white/[0.02] transition-colors`}
            >
              <div className="text-sm font-semibold text-white truncate">{c.label}</div>
              <div className="text-sm text-white/40 font-mono truncate">{c.key}</div>
              <div className="text-sm text-white/60">{c.display_order}</div>
              <div>
                <span
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${
                    c.is_active ? 'bg-emerald-500/15 text-emerald-300' : 'bg-white/10 text-white/50'
                  }`}
                >
                  {c.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => openEdit(c)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white/70 bg-white/5 hover:bg-white/10 hover:text-white transition-colors"
                >
                  Edit
                </button>
                <button
                  onClick={() => toggleActive(c)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 transition-colors"
                >
                  {c.is_active ? 'Deactivate' : 'Activate'}
                </button>
              </div>
            </div>
          ))}
      </div>

      {modalOpen && (
        <HealthComponentFormModal
          component={editing}
          onClose={() => setModalOpen(false)}
          onSaved={() => {
            setModalOpen(false);
            fetchComponents();
          }}
        />
      )}
    </div>
  );
}

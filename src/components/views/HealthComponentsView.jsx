import React, { useCallback, useEffect, useState } from 'react';
import { getHealthComponents, updateHealthComponent } from '../../services/healthComponentsApi';
import HealthComponentFormModal from '../Cards/HealthComponentFormModal';
import Badge from '../ui/Badge.jsx';
import Button from '../ui/Button.jsx';
import EmptyState from '../ui/EmptyState.jsx';
import ErrorState from '../ui/ErrorState.jsx';
import Spinner from '../ui/Spinner.jsx';
import { useToast } from '../ui/toastContext.js';

/** Same shape as the status configs in `src/data/config.js`. */
const activeStatusConfig = {
  active:   { label: 'Active',   color: '#4CAF50', bg: 'rgba(76,175,80,0.1)',   border: 'rgba(76,175,80,0.2)' },
  inactive: { label: 'Inactive', color: '#666677', bg: 'rgba(100,100,120,0.1)', border: 'rgba(100,100,120,0.2)' },
};

const GRID = 'grid-cols-[1fr_1fr_100px_100px_140px]';

export default function HealthComponentsView() {
  const [components, setComponents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [togglingId, setTogglingId] = useState(null);
  const toast = useToast();

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
    const activating = !component.is_active;
    setTogglingId(component.id);
    try {
      await updateHealthComponent(component.id, { is_active: activating });
      toast.success(`${component.label} ${activating ? 'activated' : 'deactivated'}.`);
      fetchComponents();
    } catch (err) {
      toast.error(err.message || 'Failed to update component');
    } finally {
      setTogglingId(null);
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
        <Button onClick={openNew}>+ Add component</Button>
      </div>

      {error && <ErrorState message={error} onRetry={fetchComponents} className="mb-4" />}

      <div className="rounded-2xl border border-white/10 overflow-hidden">
        <div className={`grid ${GRID} gap-4 px-5 py-3 bg-white/[0.03] text-xs font-semibold uppercase tracking-wide text-white/40`}>
          <div>Label</div>
          <div>Key</div>
          <div>Order</div>
          <div>Active</div>
          <div className="text-right">Actions</div>
        </div>

        {loading && (
          <div className="px-5 py-10 flex items-center justify-center gap-3 text-sm text-white/40">
            <Spinner /> Loading…
          </div>
        )}

        {!loading && components.length === 0 && (
          <EmptyState
            icon="🩺"
            message="No components yet — add the first checklist item."
            actionLabel="+ Add component"
            onAction={openNew}
          />
        )}

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
                <Badge config={activeStatusConfig[c.is_active ? 'active' : 'inactive']} />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="ghost" size="sm" onClick={() => openEdit(c)}>
                  Edit
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  loading={togglingId === c.id}
                  onClick={() => toggleActive(c)}
                >
                  {c.is_active ? 'Deactivate' : 'Activate'}
                </Button>
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
            toast.success('Component saved.');
            fetchComponents();
          }}
        />
      )}
    </div>
  );
}

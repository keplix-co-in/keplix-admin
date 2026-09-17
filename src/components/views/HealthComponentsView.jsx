import React, { useCallback, useEffect, useState } from 'react';
import { getHealthComponents, updateHealthComponent } from '../../services/healthComponentsApi';
import HealthComponentFormModal from '../Cards/HealthComponentFormModal';
import Badge from '../ui/Badge.jsx';
import Button from '../ui/Button.jsx';
import EmptyState from '../ui/EmptyState.jsx';
import ErrorState from '../ui/ErrorState.jsx';
import Spinner from '../ui/Spinner.jsx';
import { useToast } from '../ui/toastContext.js';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { activeStatusConfig } from '../../data/config.js';

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

        {!loading && components.length > 0 && (
          <Table>
            <TableHeader>
              <TableRow className="bg-white/[0.03] border-white/10 hover:bg-white/[0.03]">
                <TableHead className="text-xs font-semibold uppercase tracking-wide text-white/40">Label</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wide text-white/40">Key</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wide text-white/40">Order</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wide text-white/40">Active</TableHead>
                <TableHead className="text-right text-xs font-semibold uppercase tracking-wide text-white/40">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {components.map((c) => (
                <TableRow key={c.id} className="border-white/5 hover:bg-white/[0.02]">
                  <TableCell className="text-sm font-semibold text-white truncate">{c.label}</TableCell>
                  <TableCell className="text-sm text-white/40 font-mono truncate">{c.key}</TableCell>
                  <TableCell className="text-sm text-white/60">{c.display_order}</TableCell>
                  <TableCell>
                    <Badge config={activeStatusConfig[c.is_active ? 'active' : 'inactive']} />
                  </TableCell>
                  <TableCell>
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
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
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

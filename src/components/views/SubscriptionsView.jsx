import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  getSubscriptionPlans, updateSubscriptionPlan, getSubscriptionVendors,
  extendSubscription, getSubscriptionPayments,
} from '../../services/subscriptionsApi';
import { isSuperAdmin } from '../../services/authApi';
import Badge from '../ui/Badge.jsx';
import Button from '../ui/Button.jsx';
import ErrorState from '../ui/ErrorState.jsx';
import EmptyState from '../ui/EmptyState.jsx';
import Spinner from '../ui/Spinner.jsx';
import Modal from '../ui/Modal.jsx';
import { useToast } from '../ui/toastContext.js';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';

const TABS = [
  { id: 'plans', label: 'Plans' },
  { id: 'vendors', label: 'Vendors' },
  { id: 'payments', label: 'Payments' },
];
const STATUS_FILTERS = ['', 'trial', 'active', 'grace', 'expired'];
const STATUS_BADGE = {
  trial: { label: 'Trial', color: '#2196F3', bg: 'rgba(33,150,243,0.12)', border: 'rgba(33,150,243,0.3)' },
  active: { label: 'Active', color: '#4CAF50', bg: 'rgba(76,175,80,0.12)', border: 'rgba(76,175,80,0.3)' },
  grace: { label: 'Grace', color: '#ff9944', bg: 'rgba(255,153,68,0.12)', border: 'rgba(255,153,68,0.3)' },
  expired: { label: 'Expired', color: '#ff6b6b', bg: 'rgba(255,107,107,0.12)', border: 'rgba(255,107,107,0.3)' },
};
const inputClass =
  'w-full bg-[rgba(255,255,255,0.03)] border border-white/10 rounded-xl py-2.5 px-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[rgba(217,4,13,0.5)]';

const formatDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
const formatInr = (v) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Number(v) || 0);
const errMessage = (err, fallback) =>
  err?.code === 'SESSION_EXPIRED' ? 'Your session has expired. Please log in again.' : fallback;

/** Loads one list; shared by the three tabs. */
function useList(fetcher, deps) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  // Only the latest request may write state: switching the status filter fast
  // otherwise lets a slow earlier response overwrite the newer list.
  const seq = useRef(0);
  const load = useCallback(async () => {
    const mine = ++seq.current;
    setLoading(true);
    setError('');
    try {
      const data = await fetcher();
      if (mine === seq.current) setRows(data);
    } catch (err) {
      if (mine === seq.current) setError(errMessage(err, err?.message || 'Failed to load.'));
    } finally {
      if (mine === seq.current) setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  useEffect(() => { load(); }, [load]);
  return { rows, loading, error, load };
}

function PlanCard({ plan, canEdit, onSaved }) {
  const toast = useToast();
  const name = plan.name || plan.code;
  const [monthly, setMonthly] = useState(String(plan.monthly_price ?? ''));
  const [yearly, setYearly] = useState(String(plan.yearly_price ?? ''));
  const [features, setFeatures] = useState((plan.features || []).join('\n'));
  const [active, setActive] = useState(!!plan.is_active);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    const m = Number(monthly);
    const y = Number(yearly);
    const list = features.split('\n').map((f) => f.trim()).filter(Boolean);
    if (monthly === '' || yearly === '' || !(m >= 0) || !(y >= 0)) return toast.error('Prices must be 0 or more.');
    if (list.length > 10) return toast.error('At most 10 features.');
    setSaving(true);
    try {
      await updateSubscriptionPlan(plan.code, { monthly_price: m, yearly_price: y, features: list, is_active: active });
      toast.success(`${name} saved.`);
      onSaved();
    } catch (err) {
      toast.error(err.message || 'Failed to save plan.');
    } finally {
      setSaving(false);
    }
  };

  const id = plan.code;
  return (
    <div className="bg-brand-gray-100 rounded-[20px] border border-white/5 p-5 flex flex-col gap-3">
      <div className="font-syne text-base font-bold">{name}</div>
      <label className="text-xs font-semibold text-white/60" htmlFor={`${id}-monthly`}>Monthly price ({name})</label>
      <input id={`${id}-monthly`} className={inputClass} type="number" min="0" disabled={!canEdit} value={monthly} onChange={(e) => setMonthly(e.target.value)} />
      <label className="text-xs font-semibold text-white/60" htmlFor={`${id}-yearly`}>Yearly price ({name})</label>
      <input id={`${id}-yearly`} className={inputClass} type="number" min="0" disabled={!canEdit} value={yearly} onChange={(e) => setYearly(e.target.value)} />
      <label className="text-xs font-semibold text-white/60" htmlFor={`${id}-features`}>Features, one per line, max 10 ({name})</label>
      <textarea id={`${id}-features`} rows={5} className={inputClass} disabled={!canEdit} value={features} onChange={(e) => setFeatures(e.target.value)} />
      <label className="flex items-center gap-2 text-sm text-white/80">
        <input type="checkbox" disabled={!canEdit} checked={active} onChange={(e) => setActive(e.target.checked)} aria-label={`Active ${name}`} />
        Active (shown to garages)
      </label>
      {canEdit && <Button loading={saving} onClick={save} aria-label={`Save ${name}`}>Save</Button>}
    </div>
  );
}

function PlansTab() {
  const { rows, loading, error, load } = useList(getSubscriptionPlans, []);
  const canEdit = isSuperAdmin();
  if (loading) return <Spinner />;
  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!rows.length) return <EmptyState title="No plans yet" />;
  return (
    <>
      {!canEdit && (
        <div role="note" className="mb-4 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-xs text-white/60">
          Only a super admin can edit plans. You can view them here.
        </div>
      )}
      <div className="grid grid-cols-3 gap-4">
        {rows.map((p) => <PlanCard key={p.code} plan={p} canEdit={canEdit} onSaved={load} />)}
      </div>
    </>
  );
}

function ExtendModal({ vendor, onClose, onDone }) {
  const toast = useToast();
  const [days, setDays] = useState('30');
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    const d = Number(days);
    if (!Number.isInteger(d) || d < 1 || d > 730) return toast.error('Days must be between 1 and 730.');
    // Backend requires a reason of 3-300 characters (SUBSCRIPTIONS_API.md, admin extend).
    const r = reason.trim();
    if (r.length < 3 || r.length > 300) return toast.error('Reason must be 3 to 300 characters.');
    setBusy(true);
    try {
      await extendSubscription(vendor.vendorId, { days: d, reason: reason.trim() });
      toast.success('Subscription extended.');
      onDone();
    } catch (err) {
      toast.error(err.message || 'Failed to extend.');
      setBusy(false);
    }
  };

  return (
    <Modal title="Extend subscription" width="w-[420px]" closeOnBackdrop={!busy} onClose={busy ? undefined : onClose}>
      <form onSubmit={submit} className="flex flex-col gap-3">
        <div className="text-xs text-white/60">{vendor.vendorName}</div>
        <label className="text-xs font-semibold text-white/60" htmlFor="extend-days">Days (1 to 730)</label>
        <input id="extend-days" className={inputClass} type="number" min="1" max="730" value={days} onChange={(e) => setDays(e.target.value)} />
        <label className="text-xs font-semibold text-white/60" htmlFor="extend-reason">Reason</label>
        <textarea id="extend-reason" rows={3} className={inputClass} value={reason} onChange={(e) => setReason(e.target.value)} />
        <div className="flex justify-end gap-2 mt-2">
          <Button variant="secondary" onClick={onClose} disabled={busy}>Cancel</Button>
          <Button type="submit" loading={busy}>Extend</Button>
        </div>
      </form>
    </Modal>
  );
}

// Backend row shape is tolerated: vendor may be nested or flat. The real API
// sends snake_case vendor_id; the fallback label must read it too, or a garage
// with no business name shows as a bare "Vendor ".
const normVendor = (r) => ({
  vendorId: r.vendorId ?? r.vendor_id ?? r.vendor?.id,
  vendorName: r.vendor_name ?? r.vendorName ?? r.vendor?.name ?? r.name ?? `Vendor ${r.vendor_id ?? r.vendorId ?? r.vendor?.id ?? ''}`,
  plan: r.plan_name ?? r.plan_code ?? r.plan ?? '—',
  status: r.status,
  ends_at: r.ends_at,
});

function VendorsTab() {
  const [status, setStatus] = useState('');
  const [extending, setExtending] = useState(null);
  const { rows, loading, error, load } = useList(() => getSubscriptionVendors({ status }), [status]);
  const canEdit = isSuperAdmin();
  return (
    <>
      <div className="flex gap-2 mb-4" role="group" aria-label="Filter by status">
        {STATUS_FILTERS.map((s) => (
          <button key={s || 'all'} type="button" aria-pressed={status === s} onClick={() => setStatus(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${status === s ? 'bg-brand-red text-white border-brand-red' : 'text-white/60 border-white/10 hover:text-white'}`}>
            {s ? STATUS_BADGE[s].label : 'All'}
          </button>
        ))}
      </div>
      {loading ? <Spinner /> : error ? <ErrorState message={error} onRetry={load} /> : !rows.length ? (
        <EmptyState title="No garages in this status" />
      ) : (
        <div className="bg-brand-gray-100 rounded-[20px] border border-white/5 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Garage</TableHead><TableHead>Plan</TableHead><TableHead>Status</TableHead><TableHead>Ends</TableHead>
                {canEdit && <TableHead>Action</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map(normVendor).map((v) => (
                <TableRow key={v.vendorId}>
                  <TableCell>{v.vendorName}</TableCell>
                  <TableCell>{v.plan}</TableCell>
                  <TableCell><Badge config={STATUS_BADGE[v.status]} label={STATUS_BADGE[v.status] ? undefined : v.status} size="sm" /></TableCell>
                  <TableCell>{formatDate(v.ends_at)}</TableCell>
                  {canEdit && <TableCell><Button size="sm" variant="secondary" onClick={() => setExtending(v)}>Extend</Button></TableCell>}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      {extending && <ExtendModal vendor={extending} onClose={() => setExtending(null)} onDone={() => { setExtending(null); load(); }} />}
    </>
  );
}

function PaymentsTab() {
  const { rows, loading, error, load } = useList(getSubscriptionPayments, []);
  if (loading) return <Spinner />;
  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!rows.length) return <EmptyState title="No subscription payments yet" />;
  return (
    <div className="bg-brand-gray-100 rounded-[20px] border border-white/5 overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Garage</TableHead><TableHead>Plan</TableHead><TableHead>Period</TableHead>
            <TableHead>Amount</TableHead><TableHead>Status</TableHead><TableHead>Paid</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((p) => (
            <TableRow key={p.id ?? p.razorpay_order_id}>
              <TableCell>{p.vendor_name ?? p.vendorName ?? p.vendor?.name ?? `Vendor ${p.vendor_id ?? p.vendorId ?? ''}`}</TableCell>
              <TableCell>{p.plan_code}</TableCell>
              <TableCell>{p.period}</TableCell>
              <TableCell>{formatInr(p.amount)}</TableCell>
              <TableCell>{p.status}</TableCell>
              <TableCell>{formatDate(p.paid_at)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export default function SubscriptionsView() {
  const [tab, setTab] = useState('plans');
  return (
    <div className="animate-[fadeInUp_0.3s_ease_forwards]">
      <div className="flex gap-2 mb-5" role="tablist">
        {TABS.map((t) => (
          <button key={t.id} type="button" role="tab" aria-selected={tab === t.id} onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold ${tab === t.id ? 'bg-brand-red text-white' : 'bg-white/5 text-white/60 hover:text-white'}`}>
            {t.label}
          </button>
        ))}
      </div>
      {tab === 'plans' && <PlansTab />}
      {tab === 'vendors' && <VendorsTab />}
      {tab === 'payments' && <PaymentsTab />}
    </div>
  );
}

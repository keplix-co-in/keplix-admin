import React, { useCallback, useEffect, useState } from 'react';
import { getWalkInJobs, getWalkInAdoption } from '../../services/walkInJobsApi';
import { walkInJobStatusConfig } from '../../data/config';
import WalkInJobCard from '../Cards/WalkInJobCard';

const FILTERS = [
  { id: '', label: 'All' },
  { id: 'open', label: 'Checked in' },
  { id: 'in_progress', label: 'In progress' },
  { id: 'completed', label: 'Completed' },
  { id: 'cancelled', label: 'Cancelled' },
];

const GRID = 'grid-cols-[1.4fr_1.2fr_1fr_110px_100px]';

const formatDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

export default function WalkInJobsView() {
  const [jobs, setJobs] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [adoption, setAdoption] = useState([]);

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await getWalkInJobs({ status: filter, page, limit: 20 });
      setJobs(res.data || []);
      setTotal(res.total || 0);
    } catch {
      setError('Failed to load walk-in jobs.');
    } finally {
      setLoading(false);
    }
  }, [filter, page]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  useEffect(() => {
    getWalkInAdoption().then((res) => setAdoption(res.data || []));
  }, []);

  return (
    <div className="p-6">
      {adoption.length > 0 && (
        <div className="mb-6 rounded-2xl border border-white/10 bg-white/[0.02] p-5">
          <h3 className="text-sm font-bold text-white/70 uppercase tracking-wide mb-3">
            Adoption by garage
          </h3>
          <div className="flex flex-wrap gap-3">
            {adoption.slice(0, 8).map((row) => (
              <div key={row.vendorId} className="bg-white/5 rounded-xl px-4 py-2.5 border border-white/5">
                <p className="text-xs text-white/50 truncate max-w-[160px]">{row.business_name}</p>
                <p className="text-sm font-bold text-white">
                  {row.jobs_with_health_sheet}/{row.total_jobs} with health sheet
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2 mb-6">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            onClick={() => {
              setFilter(f.id);
              setPage(1);
            }}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
              filter === f.id
                ? 'bg-brand-red text-white'
                : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="mb-4 rounded-xl bg-red-500/10 border border-red-500/30 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      <div className="rounded-2xl border border-white/10 overflow-hidden">
        <div className={`grid ${GRID} gap-4 px-5 py-3 bg-white/[0.03] text-xs font-semibold uppercase tracking-wide text-white/40`}>
          <div>Customer / Vehicle</div>
          <div>Garage</div>
          <div>Status</div>
          <div>Health sheet</div>
          <div>Date</div>
        </div>

        {loading && <div className="px-5 py-10 text-center text-sm text-white/40">Loading…</div>}

        {!loading && jobs.length === 0 && (
          <div className="px-5 py-10 text-center text-sm text-white/40">No walk-in jobs match this filter.</div>
        )}

        {!loading &&
          jobs.map((job) => {
            const sc = walkInJobStatusConfig[job.status] || { label: job.status, color: '#fff', bg: '#222' };
            return (
              <button
                key={job.id}
                onClick={() => setSelectedId(job.id)}
                className={`w-full text-left grid ${GRID} gap-4 items-center px-5 py-4 border-t border-white/5 hover:bg-white/[0.02] transition-colors`}
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-white">{job.customer_name}</p>
                  <p className="truncate text-xs text-white/40">
                    {job.vehicle ? job.vehicle.registration : 'No vehicle recorded'}
                  </p>
                </div>
                <div className="text-sm text-white/60 truncate">
                  {job.vendor?.vendorProfile?.business_name || '—'}
                </div>
                <div>
                  <span
                    className="px-2.5 py-1 rounded-lg text-xs font-semibold"
                    style={{ color: sc.color, background: sc.bg }}
                  >
                    {sc.label}
                  </span>
                </div>
                <div className="text-sm text-white/50">{job.healthSheet ? 'Submitted' : '—'}</div>
                <div className="text-sm text-white/50">{formatDate(job.createdAt)}</div>
              </button>
            );
          })}
      </div>

      <div className="flex items-center justify-between mt-4">
        <button
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page === 1}
          className="px-4 py-2 rounded-xl text-sm font-semibold text-white/60 bg-white/5 hover:bg-white/10 disabled:opacity-30 transition-colors"
        >
          ← Previous
        </button>
        <span className="text-sm text-white/40">Page {page}</span>
        <button
          onClick={() => setPage((p) => p + 1)}
          disabled={page * 20 >= total}
          className="px-4 py-2 rounded-xl text-sm font-semibold text-white/60 bg-white/5 hover:bg-white/10 disabled:opacity-30 transition-colors"
        >
          Next →
        </button>
      </div>

      {selectedId && <WalkInJobCard jobId={selectedId} onClose={() => setSelectedId(null)} />}
    </div>
  );
}

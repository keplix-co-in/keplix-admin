import React, { useCallback, useEffect, useState } from 'react';
import { getWalkInJobs, getWalkInAdoption } from '../../services/walkInJobsApi';
import { walkInJobStatusConfig } from '../../data/config';
import WalkInJobCard from '../Cards/WalkInJobCard';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import Badge from '../ui/Badge.jsx';

const FILTERS = [
  { id: '', label: 'All' },
  { id: 'open', label: 'Checked in' },
  { id: 'in_progress', label: 'In progress' },
  { id: 'completed', label: 'Completed' },
  { id: 'cancelled', label: 'Cancelled' },
];

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
    let cancelled = false;
    getWalkInAdoption()
      .then((res) => { if (!cancelled) setAdoption(res.data || []); })
      // No .catch() here previously -- an unhandled promise rejection. It is
      // latent only because walkInJobsApi swallows its own errors today; the
      // moment that service is changed to throw, this becomes an unhandled
      // rejection. The sibling fetchJobs call above already catches, so this
      // was an oversight rather than a decision. The adoption panel is
      // supplementary, so a failure just leaves it hidden.
      .catch(() => { if (!cancelled) setAdoption([]); });
    return () => { cancelled = true; };
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
        {loading && <div className="px-5 py-10 text-center text-sm text-white/40">Loading…</div>}

        {!loading && jobs.length === 0 && (
          <div className="px-5 py-10 text-center text-sm text-white/40">No walk-in jobs match this filter.</div>
        )}

        {!loading && jobs.length > 0 && (
          <Table>
            <TableHeader>
              <TableRow className="bg-white/[0.03] border-white/10 hover:bg-white/[0.03]">
                <TableHead className="text-xs font-semibold uppercase tracking-wide text-white/40">Customer / Vehicle</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wide text-white/40">Garage</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wide text-white/40">Status</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wide text-white/40">Health sheet</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wide text-white/40">Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {jobs.map((job) => {
                const sc = walkInJobStatusConfig[job.status] || { label: job.status, color: '#fff', bg: '#222' };
                return (
                  // The whole row opens the detail card (was a <button> wrapping
                  // a div-grid -- a <button> isn't valid <tr> content). role +
                  // tabIndex + onKeyDown keep it keyboard-operable as a real row.
                  <TableRow
                    key={job.id}
                    role="button"
                    tabIndex={0}
                    aria-label={`View walk-in job for ${job.customer_name}`}
                    onClick={() => setSelectedId(job.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setSelectedId(job.id);
                      }
                    }}
                    className="cursor-pointer border-white/5 hover:bg-white/[0.02]"
                  >
                    <TableCell className="min-w-0">
                      <p className="truncate text-sm font-semibold text-white">{job.customer_name}</p>
                      <p className="truncate text-xs text-white/40">
                        {job.vehicle ? job.vehicle.registration : 'No vehicle recorded'}
                      </p>
                    </TableCell>
                    <TableCell className="text-sm text-white/60 truncate">
                      {job.vendor?.vendorProfile?.business_name || '—'}
                    </TableCell>
                    <TableCell>
                      <Badge config={sc} />
                    </TableCell>
                    <TableCell className="text-sm text-white/50">{job.healthSheet ? 'Submitted' : '—'}</TableCell>
                    <TableCell className="text-sm text-white/50">{formatDate(job.createdAt)}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
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

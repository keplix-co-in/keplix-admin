import React, { useCallback, useEffect, useState } from 'react';
import { walkInJobStatusConfig, healthStatusConfig } from '../../data/config';
import { getWalkInJob } from '../../services/walkInJobsApi';

/** Detail card for a single walk-in job — full, unredacted view (unlike the
 * public /job/:token page, which masks the registration and drops the
 * phone). Includes the submitted health sheet in full if there is one. */
export default function WalkInJobCard({ jobId, onClose }) {
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchJob = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await getWalkInJob(jobId);
      setJob(res.job);
    } catch {
      setError('Failed to load this job.');
    } finally {
      setLoading(false);
    }
  }, [jobId]);

  useEffect(() => {
    fetchJob();
  }, [fetchJob]);

  const sc = job ? walkInJobStatusConfig[job.status] || { label: job.status, color: '#fff', bg: '#222', border: 'rgba(255,255,255,0.1)' } : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-[fadeIn_0.2s_ease_forwards]">
      <div className="bg-[#121212] border border-white/10 rounded-2xl w-full max-w-lg p-6 relative shadow-2xl max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white/50 hover:text-white bg-white/5 hover:bg-white/10 rounded-full w-8 h-8 flex items-center justify-center transition-colors"
        >
          ✕
        </button>

        {loading && <p className="text-sm text-white/40 py-10 text-center">Loading…</p>}
        {error && <p className="text-sm text-red-300 py-10 text-center">{error}</p>}

        {job && (
          <>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center text-2xl font-bold border border-white/10 text-brand-red shadow-inner">
                W
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Walk-In Job</h2>
                <p className="text-sm text-[#888] font-mono">ID: {job.id}</p>
                <span
                  className="inline-flex mt-2 items-center py-1 px-3 rounded-full text-xs font-bold tracking-wide border shadow-sm"
                  style={{ color: sc.color, background: sc.bg, borderColor: sc.border }}
                >
                  {sc.label}
                </span>
              </div>
            </div>

            <div className="space-y-3 pb-4 border-b border-white/10">
              <Row label="Customer" value={job.customer_name} />
              <Row label="Phone" value={job.customer_phone} mono />
              <Row label="Garage" value={job.vendor?.vendorProfile?.business_name || '—'} />
              <Row
                label="Vehicle"
                value={job.vehicle ? `${job.vehicle.registration} ${[job.vehicle.make, job.vehicle.model].filter(Boolean).join(' ')}`.trim() : '—'}
              />
              <Row label="Description" value={job.description || '—'} />
              <Row label="Amount collected" value={job.amount_collected != null ? `₹${job.amount_collected}` : '—'} />
              <Row label="Notification" value={job.notification_status} />
            </div>

            <div className="pt-4">
              <h3 className="text-sm font-bold text-white mb-3">Health Sheet</h3>
              {!job.healthSheet ? (
                <p className="text-sm text-white/40">Not submitted yet.</p>
              ) : (
                <div className="space-y-2">
                  {job.healthSheet.items.map((item) => {
                    const hc = healthStatusConfig[item.status];
                    return (
                      <div key={item.id} className="flex items-center justify-between bg-white/5 rounded-xl px-4 py-2.5 border border-white/5">
                        <span className="text-sm text-white/80">{item.component?.label}</span>
                        <span
                          className="text-xs font-bold px-2 py-0.5 rounded-lg"
                          style={{ color: hc.color, background: hc.bg }}
                        >
                          {hc.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function Row({ label, value, mono }) {
  return (
    <div className="flex justify-between text-sm items-center">
      <span className="text-[#888] font-medium">{label}</span>
      <span className={`text-white font-medium bg-white/5 px-2 py-0.5 rounded text-xs max-w-[60%] truncate text-right ${mono ? 'font-mono' : ''}`}>
        {value}
      </span>
    </div>
  );
}

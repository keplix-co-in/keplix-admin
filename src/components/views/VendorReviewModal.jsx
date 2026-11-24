import { useEffect, useState } from 'react';
import Modal from '../ui/Modal.jsx';
import Button from '../ui/Button.jsx';
import { useToast } from '../ui/toastContext.js';
import { getVendorDetail, setVendorStatus } from '../../services/vendorsApi';

// WHY: owner decision 2026-11-24 -- an admin must verify each of these before
// Approve is enabled. The ticks are a UI guard only; the backend independently
// refuses approval of an incomplete onboarding (ONBOARDING_INCOMPLETE).
const CHECKS = [
  ['identity', 'Identity verified (owner name / ID matches documents)'],
  ['documents', 'Documents verified (KYC images are genuine and legible)'],
  ['address', 'Address and location verified'],
  ['bank', 'Bank / UPI details verified'],
];

const Row = ({ label, value }) => (
  <div className="flex justify-between gap-4 py-1 text-xs">
    <span className="text-brand-gray-600">{label}</span>
    <span className="text-white text-right break-words">{value === null || value === undefined || value === '' ? '—' : String(value)}</span>
  </div>
);

const Section = ({ title, children }) => (
  <section className="mb-4">
    <h3 className="text-[10px] font-bold uppercase tracking-wider text-brand-gray-600 mb-1">{title}</h3>
    {children}
  </section>
);

const Photo = ({ url, label }) => (
  <a href={url} target="_blank" rel="noopener noreferrer" className="block w-32 text-center">
    <img src={url} alt={label} className="w-32 h-24 object-cover rounded-lg border border-white/10 bg-white/5" />
    <span className="text-[10px] text-brand-gray-600">{label}</span>
  </a>
);

export default function VendorReviewModal({ vendor, canDecide, onClose, onChanged }) {
  const toast = useToast();
  const [d, setD] = useState(null);
  const [error, setError] = useState('');
  const [checked, setChecked] = useState({});
  const [busy, setBusy] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState('');

  useEffect(() => {
    let live = true;
    getVendorDetail(vendor.id)
      .then((x) => { if (live) setD(x); })
      .catch((e) => { if (live) setError(e.message || 'Could not load vendor details.'); });
    return () => { live = false; };
  }, [vendor.id]);

  const allChecked = CHECKS.every(([k]) => checked[k]);
  const complete = d?.onboarding?.complete;
  const pending = d?.status === 'pending';

  const decide = async (status, why) => {
    setBusy(true);
    try {
      await setVendorStatus(vendor.id, status, why);
      toast.success(`${vendor.name} ${status}.`);
      onChanged();
    } catch (err) {
      toast.error(err.message || 'Could not update this vendor.');
    } finally {
      setBusy(false);
    }
  };

  const reasonOk = reason.trim().length >= 3;

  return (
    <Modal open title={`Review: ${vendor.name}`} onClose={onClose} width="w-[680px]" closeOnBackdrop={!busy}>
      <div className="max-h-[70vh] overflow-y-auto pr-1">
        {!d && !error && <div className="text-xs text-brand-gray-600 py-6">Loading vendor details…</div>}
        {error && <div className="text-xs text-red-300 py-6">{error}</div>}
        {d && (
          <>
            {!complete && (
              <div role="alert" className="mb-4 text-xs text-red-300 bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                Onboarding incomplete. Missing: {d.onboarding.missing.join(', ')}. This vendor cannot be approved yet.
              </div>
            )}
            <Section title="Account">
              <Row label="Owner" value={d.account.name} />
              <Row label="Email" value={d.account.email} />
              <Row label="Email verified" value={d.account.emailVerified ? 'Yes' : 'No'} />
              <Row label="Phone" value={d.account.phone} />
              <Row label="Alternate phone" value={d.account.alternatePhone} />
              <Row label="Date of birth" value={d.account.dateOfBirth} />
              <Row label="Joined" value={d.account.createdAt && new Date(d.account.createdAt).toLocaleString()} />
            </Section>
            <Section title="Business">
              <Row label="Garage name" value={d.business.name} />
              <Row label="Type" value={d.business.type} />
              <Row label="Description" value={d.business.description} />
              <Row label="Address" value={[d.business.address, d.business.street, d.business.area, d.business.landmark].filter(Boolean).join(', ')} />
              <Row label="City / State / PIN" value={[d.business.city, d.business.state, d.business.pincode].filter(Boolean).join(' / ')} />
              <Row label="Lat / Lng" value={d.business.latitude != null ? `${d.business.latitude}, ${d.business.longitude}` : null} />
              <Row label="Operating hours" value={d.business.operatingHours} />
              <Row label="Breaks" value={d.business.breaks} />
              <Row label="Holidays" value={d.business.holidays} />
              <Row label="GST" value={d.business.hasGst ? d.business.gstNumber || 'Yes (no number)' : 'No'} />
              <Row label="Services listed" value={d.servicesCount} />
            </Section>
            <Section title="Bank / UPI (masked)">
              <Row label="Account holder" value={d.bank.accountHolder} />
              <Row label="Account number" value={d.bank.accountNumber} />
              <Row label="IFSC" value={d.bank.ifsc} />
              <Row label="UPI" value={d.bank.upi} />
            </Section>
            <Section title="Documents and photos">
              {d.documents.length === 0 && !d.business.image && <div className="text-xs text-brand-gray-600">No documents uploaded.</div>}
              <div className="flex flex-wrap gap-3">
                {d.documents.map((doc) => <Photo key={doc.id} url={doc.url} label={`${doc.type} (${doc.status})`} />)}
                {d.business.image && <Photo url={d.business.image} label="Garage photo" />}
                {d.business.coverImage && <Photo url={d.business.coverImage} label="Cover photo" />}
              </div>
            </Section>
            {canDecide && pending && (
              <Section title="Verification checklist">
                {CHECKS.map(([k, label]) => (
                  <label key={k} className="flex items-center gap-2 text-xs text-white py-1 cursor-pointer">
                    <input type="checkbox" checked={!!checked[k]} onChange={(e) => setChecked((c) => ({ ...c, [k]: e.target.checked }))} />
                    {label}
                  </label>
                ))}
                {rejecting && (
                  <div className="mt-3">
                    <label className="text-xs text-white" htmlFor="reject-reason">Rejection reason (required)</label>
                    <textarea id="reject-reason" value={reason} onChange={(e) => setReason(e.target.value)} maxLength={500} rows={3}
                      className="w-full mt-1 bg-white/5 border border-white/10 rounded-lg p-2 text-xs text-white" />
                  </div>
                )}
              </Section>
            )}
            {!canDecide && <div className="text-xs text-brand-gray-600">Only a super admin can approve or reject vendors.</div>}
          </>
        )}
      </div>
      {canDecide && pending && d && (
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="secondary" onClick={onClose} disabled={busy}>Close</Button>
          {!rejecting ? (
            <Button variant="danger" onClick={() => setRejecting(true)} disabled={busy}>Reject</Button>
          ) : (
            <Button variant="danger" onClick={() => decide('rejected', reason.trim())} disabled={busy || !reasonOk}>Confirm reject</Button>
          )}
          <Button onClick={() => decide('approved')} disabled={busy || !allChecked || !complete}>Approve</Button>
        </div>
      )}
    </Modal>
  );
}

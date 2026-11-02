import { useState } from 'react';
import { bookingStatusConfig } from "../../data/config";
import { formatDateTime, formatINR } from "../../utils/format.js";
import BookingActions from "./BookingActions.jsx";

/**
 * Read-only booking detail card. The actions (force-complete, resolve
 * dispute, refund) live in BookingActions.jsx.
 *
 * `onChanged` refetches the bookings list after any action. It was
 * `onForceCompleted` back when force-complete was the only action.
 */
export default function BookingCard({ booking, onClose, onChanged }) {
  // The card shows a snapshot of the list row. After a dispute is resolved
  // the backend has already cancelled the booking, so the card shows that
  // status at once instead of a stale "Disputed" badge.
  const [statusOverride, setStatusOverride] = useState(null);

  if (!booking) return null;
  const status = statusOverride ?? booking.status ?? '';
  const sc = bookingStatusConfig[status] || { label: status.charAt(0).toUpperCase() + status.slice(1), color: '#fff', bg: '#222', border: 'rgba(255,255,255,0.1)' };
  // These fields come from the backend booking list (dispute_reason/
  // disputed_at, vendor_reject_reason, service_completed_at). Older API
  // responses don't have them, and then nothing extra renders.
  const showDispute = status === 'disputed' || booking.dispute_reason || booking.disputed_at;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-[fadeIn_0.2s_ease_forwards]">
      {/* max-h + scroll: the dispute/reject-reason blocks and the extra actions
          can push the card taller than a laptop screen. */}
      <div className="bg-[#121212] border border-white/10 rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto p-6 relative shadow-2xl">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-white/50 hover:text-white bg-white/5 hover:bg-white/10 rounded-full w-8 h-8 flex items-center justify-center transition-colors"
        >
          ✕
        </button>
        
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center text-2xl font-bold border border-white/10 text-brand-red shadow-inner">
            B
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Booking Details</h2>
            <p className="text-sm text-[#888] font-mono">ID: {booking.id}</p>
            <span className="inline-flex mt-2 items-center py-1 px-3 rounded-full text-xs font-bold tracking-wide border shadow-sm" style={{ color: sc.color, background: sc.bg, borderColor: sc.border }}>
              {sc.label}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-white/5 p-4 rounded-xl border border-white/5">
            <div className="text-[10px] text-[#888] uppercase font-bold mb-1 tracking-wider">Total Amount</div>
            {/* Was `₹{(booking.amount || 0).toLocaleString("en-IN")}`. The amount
                comes back as a string (a serialized Prisma Decimal), and
                String#toLocaleString is a no-op, so raw float digits leaked
                through. Same fix as the list view: formatINR. */}
            <div className="text-xl text-white font-bold tracking-tight font-syne">{formatINR(booking.amount)}</div>
          </div>
          <div className="bg-white/5 p-4 rounded-xl border border-white/5 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-brand-red/80"></div>
            <div className="text-[10px] text-[#888] uppercase font-bold mb-1 tracking-wider pl-2">Platform Fee</div>
            <div className="text-xl text-brand-red font-bold tracking-tight pl-2">{formatINR(booking.fee)}</div>
          </div>
        </div>

        <div className="space-y-4 pt-4 border-t border-white/10">
          <div className="flex justify-between text-sm items-center">
            <span className="text-[#888] font-medium">Customer</span>
            <span className="text-white font-medium bg-white/5 px-2 py-0.5 rounded text-xs">{booking.customer}</span>
          </div>
          <div className="flex justify-between text-sm items-center">
            <span className="text-[#888] font-medium">Phone</span>
            <span className="text-white font-medium font-mono bg-white/5 px-2 py-0.5 rounded text-xs">{booking.phone}</span>
          </div>
          <div className="flex justify-between text-sm items-center">
            <span className="text-[#888] font-medium">Vendor</span>
            <span className="text-brand-gray-700 font-medium bg-white/5 px-2 py-0.5 rounded text-xs">{booking.vendor}</span>
          </div>
          <div className="flex justify-between text-sm items-center">
            <span className="text-[#888] font-medium">Service</span>
            <span className="text-brand-gray-700 font-medium bg-white/5 px-2 py-0.5 rounded text-xs max-w-50 truncate text-right">{booking.service}</span>
          </div>
          <div className="flex justify-between text-sm items-center">
            <span className="text-[#888] font-medium">Time Slot</span>
            <span className="text-brand-gray-700 font-medium bg-white/5 px-2 py-0.5 rounded text-[10px]">{booking.slot}</span>
          </div>
        </div>

        {booking.service_completed_at && (
          <div className="flex justify-between text-sm items-center mt-4">
            <span className="text-[#888] font-medium">Vendor completed</span>
            <span className="text-brand-gray-700 font-medium bg-white/5 px-2 py-0.5 rounded text-[10px]">{formatDateTime(booking.service_completed_at)}</span>
          </div>
        )}

        {showDispute && (
          <div className="mt-4 rounded-xl border border-brand-red/30 bg-brand-red/10 p-3">
            <div className="flex justify-between items-center mb-1">
              <span className="text-[10px] text-brand-red uppercase font-bold tracking-wider">Customer dispute</span>
              {booking.disputed_at && <span className="text-[10px] text-[#888]">{formatDateTime(booking.disputed_at)}</span>}
            </div>
            <p className="text-xs text-white/80 whitespace-pre-line">{booking.dispute_reason || 'No reason recorded.'}</p>
          </div>
        )}

        {booking.vendor_reject_reason && (
          <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-3">
            <div className="text-[10px] text-[#888] uppercase font-bold tracking-wider mb-1">Vendor&apos;s reject reason</div>
            <p className="text-xs text-white/80 whitespace-pre-line">{booking.vendor_reject_reason}</p>
          </div>
        )}

        <BookingActions
          booking={booking}
          status={status}
          onStatusChange={setStatusOverride}
          onChanged={onChanged}
          onClose={onClose}
        />
      </div>
    </div>
  );
}

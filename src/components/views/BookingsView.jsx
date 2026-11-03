import { useState } from 'react';
import { bookingFilters, bookingStatusConfig } from "../../data/config";
import { getBookings } from "../../services/bookingsApi";
import BookingCard from "../Cards/BookingCard";
import { formatINR } from "../../utils/format.js";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import Badge from "../ui/Badge.jsx";
import ErrorState from "../ui/ErrorState.jsx";
import { useApiResource } from "../../hooks/useApiResource";

const PAGE_SIZE = 10;

export default function BookingsView({ filter, setFilter }) {
  const [selectedBooking, setSelectedBooking] = useState(null);

  const {
    data: bookings,
    loading,
    error,
    page,
    setPage,
    hasMore,
    refetch: fetchBookings,
  } = useApiResource(
    async (page) => {
      // Filter chips live in data/config.js (bookingFilters) next to the
      // status badges, so a new status gets its filter and badge together.
      const filterType = bookingFilters.find((f) => f.label === filter)?.type || "all";
      // getBookings now throws on failure; useApiResource turns that into
      // `error`, rendered below with a Retry.
      return getBookings(filterType, page, PAGE_SIZE);
    },
    [filter],
    // Was untracked `totalCount = data.length`, which is not a total and
    // never actually let pagination advance correctly -- replaced with the
    // hook's real `hasMore` (full page => there may be another). The 500ms
    // debounce this view already had is preserved via debounceMs.
    { pageSize: PAGE_SIZE, debounceMs: 500 },
  );

  const filtered = bookings;

  return (
    <div className="animate-[fadeInUp_0.3s_ease_forwards]">
      <div className="flex gap-2 mb-5 flex-wrap">
        {bookingFilters.map(({ label }) => (
          <button 
            key={label} 
            className={`py-1.5 px-3.5 rounded-full text-xs font-semibold cursor-pointer border border-white/10 bg-transparent text-[rgba(255,255,255,0.35)] transition-all duration-150 font-sans${filter === label ? " text-white bg-[rgba(255,61,61,0.12)] border-[rgba(255,61,61,0.2)] shadow-[inset_2px_0_0_#ff3d3d]" : ""}`}
            onClick={() => setFilter(label)}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Was a message box with no retry, and it rendered ABOVE the
          "No bookings found" empty state, so a failure still looked like an
          empty list. Now it offers Retry, and the empty state is suppressed
          while there is an error. */}
      {error && !loading && (
        <ErrorState
          className="mb-4"
          message={`Couldn't load bookings: ${error}`}
          onRetry={fetchBookings}
        />
      )}

      <div className="bg-brand-gray-100 rounded-[20px] border border-white/5 overflow-hidden">
        {loading ? (
          <div className="py-8 text-center text-brand-gray-700">
            <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-brand-red"></div>
            <p className="mt-2">Loading bookings...</p>
          </div>
        ) : error ? (
          <div className="py-8 text-center text-brand-gray-700">Bookings are unavailable until the request above succeeds.</div>
        ) : filtered.length === 0 ? (
          <div className="py-8 text-center text-brand-gray-700">No bookings found</div>
        ) : (
          // Real <table> markup (was a div-grid) -- see UsersView.jsx for the
          // reference pattern this and the other views were migrated to.
          <Table>
            <TableHeader>
              <TableRow className="border-brand-gray-400/60 hover:bg-transparent">
                {["Booking ID", "Customer", "Phone", "Vendor", "Service", "Slot", "Amount", "Fee", "Status"].map(h => (
                  <TableHead key={h} className="text-[10px] font-bold text-brand-gray-600 uppercase tracking-wider">{h}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((b) => {
                const sc = bookingStatusConfig[b.status] || { label: b.status, color: '#fff', bg: '#222', border: 'rgba(255,255,255,0.1)' };
                return (
                  <TableRow
                    key={b.id}
                    className="border-white/5 hover:bg-white/5 cursor-pointer"
                    onClick={() => setSelectedBooking(b)}
                  >
                    <TableCell className="text-xs text-brand-red/80 font-mono font-bold hover:text-brand-red hover:underline transition-colors">
                      {b.id}
                    </TableCell>
                    <TableCell className="text-sm font-semibold text-white">{b.customer}</TableCell>
                    <TableCell className="text-xs text-brand-gray-700 font-mono">{b.phone}</TableCell>
                    <TableCell className="text-xs text-brand-gray-800">{b.vendor}</TableCell>
                    <TableCell className="text-xs text-brand-gray-800">{b.service}</TableCell>
                    <TableCell className="text-[10px] text-brand-gray-700">{b.slot}</TableCell>
                    {/* Was `(b.amount || 0).toLocaleString("en-IN")` -- b.amount
                        comes back from the API as a string (a serialized Prisma
                        Decimal), and calling .toLocaleString() on a string is a
                        no-op, so any non-integer amount showed raw float digits
                        (found live: "₹24206.70000000000012" on the dashboard's
                        equivalent field). */}
                    <TableCell className="font-syne text-sm font-extrabold text-white">{formatINR(b.amount)}</TableCell>
                    <TableCell className="text-sm font-semibold text-brand-red">{formatINR(b.fee)}</TableCell>
                    <TableCell>
                      <Badge config={sc} size="sm" />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Pagination */}
      {!loading && filtered.length > 0 && (
        <div className="flex justify-center gap-3 mt-5">
          <button 
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 rounded-lg bg-white/10 text-white text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/20 transition-colors"
          >
            ← Previous
          </button>
          <span className="px-4 py-2 text-white font-medium">Page {page}</span>
          <button
            onClick={() => setPage(p => p + 1)}
            disabled={!hasMore}
            className="px-4 py-2 rounded-lg bg-white/10 text-white text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/20 transition-colors"
          >
            Next →
          </button>
        </div>
      )}

      {selectedBooking && (
        <BookingCard
          booking={selectedBooking}
          onClose={() => setSelectedBooking(null)}
          onChanged={fetchBookings}
        />
      )}
    </div>
  );
}

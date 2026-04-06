import { useState, useEffect } from 'react';
import { bookingStatusConfig } from "../../data/config";
import { getBookings } from "../../services/bookingsApi";
import BookingCard from "../Cards/BookingCard";

export default function BookingsView({ filter, setFilter }) {
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const filters = ["All", "Completed", "In Progress", "Confirmed", "Disputed", "Cancelled"];
  const keyMap = { 
    "All": "all", 
    "Completed": "completed", 
    "In Progress": "inprogress", 
    "Confirmed": "confirmed", 
    "Disputed": "disputed", 
    "Cancelled": "cancelled" 
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchBookings();
    }, 500);
    
    return () => clearTimeout(timer);
  }, [filter, page]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const filterType = keyMap[filter] || "all";
      console.log('Fetching bookings with filter:', filterType);
      
      const data = await getBookings(filterType, page, 10);
      console.log('Bookings data received:', data);
      
      setBookings(Array.isArray(data) ? data : []);
      setTotalCount(Array.isArray(data) ? data.length : 0);
    } catch (err) {
      console.error('Error fetching bookings:', err);
      setError(err.message || 'Failed to load bookings');
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  const filtered = bookings;

  return (
    <div className="animate-[fadeInUp_0.3s_ease_forwards]">
      <div className="flex gap-2 mb-5 flex-wrap">
        {filters.map(f => (
          <button 
            key={f} 
            className={`py-1.5 px-3.5 rounded-full text-xs font-semibold cursor-pointer border border-white/10 bg-transparent text-[rgba(255,255,255,0.35)] transition-all duration-150 font-sans${filter === f ? " text-white bg-[rgba(255,61,61,0.12)] border-[rgba(255,61,61,0.2)] shadow-[inset_2px_0_0_#ff3d3d]" : ""}`} 
            onClick={() => {
              setFilter(f);
              setPage(1);
            }}
          >
            {f}
          </button>
        ))}
      </div>

      {error && (
        <div className="bg-brand-red/10 border border-brand-red/30 rounded-lg p-4 text-brand-red mb-4">
          <p className="font-semibold">Error loading bookings</p>
          <p className="text-sm">{error}</p>
        </div>
      )}

      <div className="bg-brand-gray-100 rounded-[20px] border border-white/5 overflow-hidden">
        <div className="grid grid-cols-[90px_140px_130px_160px_140px_120px_90px_80px_90px] gap-2 px-5 py-3 border-b border-brand-gray-400/60">
          {["Booking ID", "Customer", "Phone", "Vendor", "Service", "Slot", "Amount", "Fee", "Status"].map(h => (
            <div key={h} className="text-[10px] font-bold text-brand-gray-600 uppercase tracking-wider">{h}</div>
          ))}
        </div>
        
        {loading ? (
          <div className="py-8 text-center text-brand-gray-700">
            <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-brand-red"></div>
            <p className="mt-2">Loading bookings...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-8 text-center text-brand-gray-700">No bookings found</div>
        ) : (
          filtered.map((b, i) => {
            const sc = bookingStatusConfig[b.status] || { label: b.status, color: '#fff', bg: '#222', border: 'rgba(255,255,255,0.1)' };
            return (
              <div 
                key={i} 
                className="grid items-center py-3 px-4 rounded-lg transition-colors duration-150 border-b border-white/5 hover:bg-white/5 grid-cols-[90px_140px_130px_160px_140px_120px_90px_80px_90px] gap-2 cursor-pointer"
                onClick={() => setSelectedBooking(b)}
              >
                <div className="text-xs text-brand-red/80 font-mono font-bold hover:text-brand-red hover:underline transition-colors">
                  {b.id}
                </div>
                <div className="text-sm font-semibold text-white">{b.customer}</div>
                <div className="text-xs text-brand-gray-700 font-mono">{b.phone}</div>
                <div className="text-xs text-brand-gray-800">{b.vendor}</div>
                <div className="text-xs text-brand-gray-800">{b.service}</div>
                <div className="text-[10px] text-brand-gray-700">{b.slot}</div>
                <div className="font-syne text-sm font-extrabold text-white">₹{(b.amount || 0).toLocaleString("en-IN")}</div>
                <div className="text-sm font-semibold text-brand-red">₹{b.fee || 0}</div>
                <div><span className="inline-flex items-center py-0.75 px-2.5 rounded-full text-[10px] font-bold tracking-[0.3px] border" style={{ color: sc.color, background: sc.bg, borderColor: sc.border }}>{sc.label}</span></div>
              </div>
            );
          })
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
            disabled={totalCount < 10}
            className="px-4 py-2 rounded-lg bg-white/10 text-white text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/20 transition-colors"
          >
            Next →
          </button>
        </div>
      )}

      {selectedBooking && <BookingCard booking={selectedBooking} onClose={() => setSelectedBooking(null)} />}
    </div>
  );
}

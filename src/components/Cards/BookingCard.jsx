import React from 'react';
import { bookingStatusConfig } from "../../data/config";

export default function BookingCard({ booking, onClose }) {
  if (!booking) return null;
  const sc = bookingStatusConfig[booking.status] || { label: booking.status.charAt(0).toUpperCase() + booking.status.slice(1), color: '#fff', bg: '#222', border: 'rgba(255,255,255,0.1)' };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-[fadeIn_0.2s_ease_forwards]">
      <div className="bg-[#121212] border border-white/10 rounded-2xl w-full max-w-md p-6 relative shadow-2xl">
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
            <div className="text-xl text-white font-bold tracking-tight font-syne">₹{(booking.amount || 0).toLocaleString("en-IN")}</div>
          </div>
          <div className="bg-white/5 p-4 rounded-xl border border-white/5 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-brand-red/80"></div>
            <div className="text-[10px] text-[#888] uppercase font-bold mb-1 tracking-wider pl-2">Platform Fee</div>
            <div className="text-xl text-brand-red font-bold tracking-tight pl-2">₹{booking.fee || 0}</div>
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
      </div>
    </div>
  );
}

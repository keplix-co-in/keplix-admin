import React, { useState } from 'react';
import { vendorStatusConfig } from "../../data/config";

export default function VendorCard({ vendor, onClose }) {
  const [imageFailed, setImageFailed] = useState(false);
  if (!vendor) return null;
  const sc = vendorStatusConfig[vendor.status] || { label: vendor.status.charAt(0).toUpperCase() + vendor.status.slice(1), color: '#fff', bg: '#222', border: 'rgba(255,255,255,0.1)' };
  const showImage = vendor.profileImage && !imageFailed;

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
          {showImage ? (
            <img
              src={vendor.profileImage}
              alt={vendor.name}
              className="w-16 h-16 rounded-full object-cover border border-white/10 shadow-inner"
              onError={() => setImageFailed(true)}
            />
          ) : (
            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center text-2xl font-bold border border-white/10 text-white shadow-inner">
              {vendor.name.charAt(0)}
            </div>
          )}
          <div>
            <h2 className="text-xl font-bold text-white">{vendor.name}</h2>
            <p className="text-sm text-[#888]">ID: {vendor.id} • {vendor.category || 'Service Provider'}</p>
            <span className="inline-flex mt-2 items-center py-1 px-3 rounded-full text-xs font-bold tracking-wide border shadow-sm" style={{ color: sc.color, background: sc.bg, borderColor: sc.border }}>
              {sc.label}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-white/5 p-4 rounded-xl border border-white/5">
            <div className="text-[10px] text-[#888] uppercase font-bold mb-1 tracking-wider">Total Earnings</div>
            <div className="text-xl text-white font-bold tracking-tight">₹{(vendor.earnings || 0).toLocaleString()}</div>
          </div>
          <div className="bg-white/5 p-4 rounded-xl border border-white/5">
            <div className="text-[10px] text-[#888] uppercase font-bold mb-1 tracking-wider">Total Bookings</div>
            <div className="text-xl text-white font-bold tracking-tight">{vendor.bookings || 0}</div>
          </div>
        </div>

        <div className="space-y-4 pt-4 border-t border-white/10">
          <div className="flex justify-between text-sm items-center">
            <span className="text-[#888] font-medium">Owner</span>
            <span className="text-white font-medium bg-white/5 px-2 py-0.5 rounded">{vendor.owner || '—'}</span>
          </div>
          <div className="flex justify-between text-sm items-center">
            <span className="text-[#888] font-medium">Email</span>
            <span className="text-white font-medium bg-white/5 px-2 py-0.5 rounded text-xs">{vendor.email || '—'}</span>
          </div>
          <div className="flex justify-between text-sm items-center">
            <span className="text-[#888] font-medium">Location</span>
            <span className="text-white font-medium bg-white/5 px-2 py-0.5 rounded">{vendor.city || '—'}</span>
          </div>
          <div className="flex justify-between text-sm items-center">
            <span className="text-[#888] font-medium">Rating</span>
            <span className="text-yellow-400 font-medium bg-yellow-400/10 px-2 py-0.5 rounded border border-yellow-400/20">
              {vendor.rating > 0 ? `${vendor.rating} ★` : "No Ratings"}
            </span>
          </div>
          <div className="flex justify-between text-sm items-center">
            <span className="text-[#888] font-medium">Verification</span>
            <span className="text-white font-medium capitalize bg-white/5 px-2 py-0.5 rounded">{vendor.verified || 'Unverified'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

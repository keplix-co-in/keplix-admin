import React, { useState, useRef, useEffect } from 'react';
import { Icon } from '../ui/Icon';

// There is no /admin/notifications backend route yet (see
// routes/Admin/*.js — no such route exists). This previously rendered
// fabricated notifications (mock unread counts, timestamps) as if they were
// live data. Rather than invent a fake endpoint, this shows an honest
// "coming soon" empty state until a real notifications endpoint exists.
export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative ml-2" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-9 h-9 bg-brand-gray-500/60 rounded-lg flex items-center justify-center cursor-pointer border border-brand-gray-400/80 hover:bg-white/10 transition-colors focus:outline-none"
      >
        <Icon name="bell" size={15} color="rgba(255,255,255,0.5)" />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-80 bg-brand-gray-100 border border-white/10 rounded-xl shadow-[0_8px_30px_rgba(0,0,0,0.8)] overflow-hidden z-50 flex flex-col animate-[fadeInUp_0.2s_ease_forwards]">
          <div className="px-4 py-3 border-b border-white/10 flex justify-between items-center bg-brand-gray-200">
            <h3 className="text-sm font-syne font-bold text-white">Notifications</h3>
          </div>

          <div className="max-h-80 overflow-y-auto flex flex-col">
            <div className="p-6 text-center text-xs text-brand-gray-600">
              Notifications are coming soon. There is no live notifications feed yet.
            </div>
          </div>

          <div className="px-4 py-2.5 border-t border-white/10 text-center bg-brand-gray-200/50">
            <button
              disabled
              title="Not available yet — no notifications backend exists."
              className="text-xs font-semibold text-white/25 cursor-not-allowed border-none bg-transparent"
            >
              View all notifications
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

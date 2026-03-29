import React, { useState, useRef, useEffect } from 'react';
import { Icon } from '../ui/Icon';
import initialNotifications from '../../data/NotifiacationMock';

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState(initialNotifications);
  const dropdownRef = useRef(null);

  const unreadCount = notifications.filter(n => n.unread).length;

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, unread: false })));
  };

  return (
    <div className="relative ml-2" ref={dropdownRef}>
      {/* Bell Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-9 h-9 bg-brand-gray-500/60 rounded-lg flex items-center justify-center cursor-pointer border border-brand-gray-400/80 hover:bg-white/10 transition-colors focus:outline-none"
      >
        <Icon name="bell" size={15} color="rgba(255,255,255,0.5)" />
        {unreadCount > 0 && (
          <div className="absolute top-1.5 right-2 w-2 h-2 bg-brand-red rounded-full border-2 border-[#0e0e18]" />
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-80 bg-brand-gray-100 border border-white/10 rounded-xl shadow-[0_8px_30px_rgba(0,0,0,0.8)] overflow-hidden z-50 flex flex-col animate-[fadeInUp_0.2s_ease_forwards]">
          <div className="px-4 py-3 border-b border-white/10 flex justify-between items-center bg-brand-gray-200">
            <h3 className="text-sm font-syne font-bold text-white">Notifications</h3>
            {unreadCount > 0 && (
              <button 
                onClick={markAllAsRead} 
                className="text-[10px] text-brand-red hover:text-brand-red/80 font-bold transition-colors cursor-pointer border-none bg-transparent"
              >
                Mark all as read
              </button>
            )}
          </div>
          
          <div className="max-h-80 overflow-y-auto flex flex-col">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-xs text-brand-gray-600">No recent notifications</div>
            ) : (
              notifications.map((notification) => (
                <div 
                  key={notification.id} 
                  className={`px-4 py-3 flex gap-3 border-b border-white/5 last:border-none transition-colors hover:bg-white/5 cursor-pointer ${notification.unread ? 'bg-brand-red/5' : ''}`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${notification.unread ? 'bg-brand-red/20 text-brand-red' : 'bg-white/10 text-white/50'}`}>
                    <Icon name={notification.icon} size={14} color="currentColor" />
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <div className={`text-xs font-semibold ${notification.unread ? 'text-white' : 'text-white/70'}`}>
                      {notification.title}
                    </div>
                    <div className="text-[10px] text-brand-gray-500 leading-tight">
                      {notification.message}
                    </div>
                    <div className="text-[9px] text-brand-gray-600 font-bold tracking-wider mt-1">
                      {notification.time}
                    </div>
                  </div>
                  {notification.unread && (
                    <div className="w-1.5 h-1.5 rounded-full bg-brand-red shrink-0 ml-auto mt-1 blur-[0.5px]"></div>
                  )}
                </div>
              ))
            )}
          </div>
          
          <div className="px-4 py-2.5 border-t border-white/10 text-center bg-brand-gray-200/50">
            <button className="text-xs font-semibold text-white/50 hover:text-white transition-colors cursor-pointer border-none bg-transparent">
              View all notifications
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
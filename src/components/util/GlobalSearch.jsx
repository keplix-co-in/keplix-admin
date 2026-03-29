import React, { useState, useRef, useEffect } from 'react';
import { Icon } from '../ui/Icon';
import { vendors, bookings, usersData } from '../../data';

export function GlobalSearch() {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const searchRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const q = query.toLowerCase();
  
  const filteredUsers = query ? usersData.filter(u => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.phone.includes(q)).slice(0, 3) : [];
  const filteredVendors = query ? vendors.filter(v => v.name.toLowerCase().includes(q) || v.owner.toLowerCase().includes(q) || v.city.toLowerCase().includes(q)).slice(0, 3) : [];
  const filteredBookings = query ? bookings.filter(b => b.user.toLowerCase().includes(q) || b.vendor.toLowerCase().includes(q) || b.service.toLowerCase().includes(q) || b.id.toLowerCase().includes(q)).slice(0, 3) : [];

  const hasResults = filteredUsers.length > 0 || filteredVendors.length > 0 || filteredBookings.length > 0;

  return (
    <div className="relative w-80 ml-2" ref={searchRef}>
      <div className="flex items-center gap-2 bg-brand-gray-500/50 rounded-lg px-3.5 py-2 border border-brand-gray-400/70 focus-within:border-brand-red/50 focus-within:bg-white/5 transition-all">
        <Icon name="search" size={13} color="rgba(255,255,255,0.5)" />
        <input 
          type="text" 
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="Search users, vendors, bookings..." 
          className="bg-transparent border-none outline-none text-xs text-white placeholder:text-brand-gray-600 w-full"
        />
        {query && (
          <button onClick={() => { setQuery(''); setIsOpen(false); }} className="text-white/40 hover:text-white transition-colors cursor-pointer border-none bg-transparent flex">
            <Icon name="close" size={12} />
          </button>
        )}
      </div>

      {isOpen && query && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-brand-gray-100 border border-white/10 rounded-xl shadow-[0_8px_30px_rgba(0,0,0,0.8)] overflow-hidden z-50 max-h-[400px] overflow-y-auto animate-[fadeInUp_0.2s_ease_forwards]">
          {!hasResults ? (
            <div className="p-4 text-center text-xs text-brand-gray-600 font-medium">No results found for "{query}"</div>
          ) : (
            <div className="p-2 flex flex-col gap-2">
              
              {filteredUsers.length > 0 && (
                <div>
                  <div className="px-2 py-1 text-[10px] font-bold text-brand-gray-600 uppercase tracking-wider mb-1">Users</div>
                  {filteredUsers.map(u => (
                    <div key={u.id} className="flex flex-col py-2 px-3 rounded-lg hover:bg-white/5 cursor-pointer transition-colors group">
                      <div className="text-sm font-semibold text-white group-hover:text-brand-red transition-colors">{u.name}</div>
                      <div className="flex gap-2 text-[10px] text-brand-gray-500 mt-0.5">
                        <span>{u.email}</span><span>•</span><span className="font-mono">{u.id}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {filteredVendors.length > 0 && (
                <div>
                  <div className="px-2 py-1 text-[10px] font-bold text-brand-gray-600 uppercase tracking-wider mb-1">Vendors</div>
                  {filteredVendors.map(v => (
                    <div key={v.id} className="flex flex-col py-2 px-3 rounded-lg hover:bg-white/5 cursor-pointer transition-colors group">
                      <div className="text-sm font-semibold text-white group-hover:text-brand-red transition-colors">{v.name}</div>
                      <div className="flex gap-2 text-[10px] text-brand-gray-500 mt-0.5">
                        <span>{v.category}</span><span>•</span><span>{v.city}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {filteredBookings.length > 0 && (
                <div>
                  <div className="px-2 py-1 text-[10px] font-bold text-brand-gray-600 uppercase tracking-wider mb-1">Bookings</div>
                  {filteredBookings.map(b => (
                    <div key={b.id} className="flex flex-col py-2 px-3 rounded-lg hover:bg-white/5 cursor-pointer transition-colors group">
                      <div className="flex justify-between items-center">
                        <div className="text-sm font-semibold text-white group-hover:text-brand-red transition-colors">{b.service}</div>
                        <div className="text-[10px] font-bold text-green-400">₹{b.amount}</div>
                      </div>
                      <div className="flex gap-2 text-[10px] text-brand-gray-500 mt-0.5 items-center">
                        <span className="font-mono">{b.id}</span><span>•</span><span>{b.user}</span><span>•</span><span>{b.vendor}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

            </div>
          )}
        </div>
      )}
    </div>
  );
}
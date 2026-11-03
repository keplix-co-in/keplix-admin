import React, { useState, useRef, useEffect } from 'react';
import { Icon } from '../ui/Icon';
import { getUsers } from '../../services/usersApi';
import { getVendors } from '../../services/vendorsApi';
import { getBookings } from '../../services/bookingsApi';

/**
 * Global search across users, vendors and bookings.
 *
 * This used to filter three hardcoded mock arrays imported from `src/data`
 * (`vendors`, `bookings`, `usersData`). Every list view had already been moved
 * onto live API data, so searching for a real record returned "No results",
 * while searching for a fictional seed name returned a confident hit. It looked
 * completely functional and was answering from a dataset that no longer existed
 * anywhere else in the product.
 *
 * The admin API has no server-side search parameter on any of the three list
 * endpoints -- they only accept `type`, `page` and `limit`. So this fetches a
 * recent window of each and filters it in the browser. That is a real
 * limitation, not a hidden one: the footer states the scope, so an operator who
 * doesn't find an older record knows to use the filters on the relevant screen
 * rather than concluding it doesn't exist.
 *
 * Wiring proper search means adding a `search` query param to
 * GET /admin/{users,vendors,bookings} on the backend; this component would then
 * pass the query straight through and the client-side filter would come out.
 */

// How many recent records to pull per entity. Large enough to be useful,
// small enough to stay a single quick request per keystroke-burst.
const SEARCH_WINDOW = 100;
const DEBOUNCE_MS = 300;

export function GlobalSearch() {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState({ users: [], vendors: [], bookings: [] });
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

  // Fetch once per settled query rather than per keystroke.
  useEffect(() => {
    // No setState here on the empty-query path: setting state synchronously in
    // an effect body trips react-hooks/set-state-in-effect, and it isn't needed
    // -- the filters below already yield [] whenever the query is blank, so a
    // stale fetch result can never be rendered.
    if (!query.trim()) return;

    let cancelled = false;
    const timer = setTimeout(async () => {
      setLoading(true);
      // allSettled, not all: one failing endpoint must not blank the other two.
      const [users, vendors, bookings] = await Promise.allSettled([
        getUsers('all', 1, SEARCH_WINDOW),
        getVendors('all', 1, SEARCH_WINDOW),
        getBookings('all', 1, SEARCH_WINDOW),
      ]);
      if (cancelled) return;

      const val = (r) => (r.status === 'fulfilled' && Array.isArray(r.value) ? r.value : []);
      setData({ users: val(users), vendors: val(vendors), bookings: val(bookings) });
      setLoading(false);
    }, DEBOUNCE_MS);

    return () => { cancelled = true; clearTimeout(timer); };
  }, [query]);

  const q = query.toLowerCase().trim();
  const has = (...vals) => vals.some(v => String(v ?? '').toLowerCase().includes(q));

  const filteredUsers = q
    ? data.users.filter(u => has(u.name, u.contact, u.id)).slice(0, 3)
    : [];
  const filteredVendors = q
    ? data.vendors.filter(v => has(v.vendor, v.city, v.category, v.id)).slice(0, 3)
    : [];
  const filteredBookings = q
    ? data.bookings.filter(b => has(b.id, b.user, b.vendor, b.service)).slice(0, 3)
    : [];

  const hasResults =
    filteredUsers.length > 0 || filteredVendors.length > 0 || filteredBookings.length > 0;

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
          aria-label="Search users, vendors and bookings"
          placeholder="Search users, vendors, bookings..."
          className="bg-transparent border-none outline-none text-xs text-white placeholder:text-brand-gray-600 w-full"
        />
        {query && (
          <button
            onClick={() => { setQuery(''); setIsOpen(false); }}
            aria-label="Clear search"
            className="text-white/40 hover:text-white transition-colors cursor-pointer border-none bg-transparent flex"
          >
            <Icon name="close" size={12} />
          </button>
        )}
      </div>

      {isOpen && query && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-brand-gray-100 border border-white/10 rounded-xl shadow-[0_8px_30px_rgba(0,0,0,0.8)] overflow-hidden z-50 max-h-[400px] overflow-y-auto animate-[fadeInUp_0.2s_ease_forwards]">
          {loading ? (
            <div className="p-4 flex items-center justify-center gap-2 text-xs text-brand-gray-600">
              <div className="w-3 h-3 border-2 border-white/20 border-t-brand-red rounded-full animate-spin" />
              Searching…
            </div>
          ) : !hasResults ? (
            <div className="p-4 text-center text-xs text-brand-gray-600 font-medium">
              No results found for &quot;{query}&quot;
            </div>
          ) : (
            <div className="p-2 flex flex-col gap-2">

              {filteredUsers.length > 0 && (
                <div>
                  <div className="px-2 py-1 text-[10px] font-bold text-brand-gray-600 uppercase tracking-wider mb-1">Users</div>
                  {filteredUsers.map(u => (
                    <div key={u.id} className="flex flex-col py-2 px-3 rounded-lg hover:bg-white/5 cursor-pointer transition-colors group">
                      <div className="text-sm font-semibold text-white group-hover:text-brand-red transition-colors">{u.name || 'Unnamed'}</div>
                      <div className="flex gap-2 text-[10px] text-brand-gray-500 mt-0.5">
                        <span>{u.contact || '—'}</span><span>•</span><span className="font-mono">{u.id}</span>
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
                      <div className="text-sm font-semibold text-white group-hover:text-brand-red transition-colors">{v.vendor || 'Unnamed'}</div>
                      <div className="flex gap-2 text-[10px] text-brand-gray-500 mt-0.5">
                        <span>{v.category || '—'}</span><span>•</span><span>{v.city || '—'}</span>
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
                        <div className="text-sm font-semibold text-white group-hover:text-brand-red transition-colors">{b.service || 'Service'}</div>
                        {b.amount != null && (
                          <div className="text-[10px] font-bold text-green-400">
                            ₹{Number(b.amount).toLocaleString('en-IN')}
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2 text-[10px] text-brand-gray-500 mt-0.5 items-center">
                        <span className="font-mono">{b.id}</span><span>•</span><span>{b.user || '—'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="px-3 pt-1 pb-0.5 text-[10px] text-brand-gray-700 border-t border-white/5 mt-1">
                Searches the {SEARCH_WINDOW} most recent of each. For older records, use the filters on that screen.
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

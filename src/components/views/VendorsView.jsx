import { useState } from 'react';
import { vendorStatusConfig } from "../../data/config";
import { getVendors } from "../../services/vendorsApi";
import { Icon } from "../ui/Icon";
import VendorCard from "../Cards/VendorCard";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import Badge from "../ui/Badge.jsx";
import { useApiResource } from "../../hooks/useApiResource";

const PAGE_SIZE = 10;

const keyMap = {
  "All": "all",
  "Active": "active",
  "Pending": "pending",
  "Suspended": "suspended",
  "Uninstalled": "uninstalled"
};

export default function VendorsView({ filter, setFilter }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVendor, setSelectedVendor] = useState(null);

  const filters = ["All", "Active", "Pending", "Suspended", "Uninstalled"];

  const {
    data: vendors,
    loading,
    error,
    page,
    setPage,
    hasMore,
    refetch: fetchVendors,
  } = useApiResource(
    async (page) => {
      const filterType = keyMap[filter] || "all";
      const data = await getVendors(filterType, page, PAGE_SIZE);
      return Array.isArray(data) ? data.map(v => ({
        id: String(v.id || ""),
        name: v.vendor || "N/A",
        owner: v.owner || "",
        email: v.email || "",
        profileImage: v.profileImage || null,
        verified: v.verified || "basic",
        category: v.category || "N/A",
        city: v.city || "N/A",
        bookings: v.bookings || 0,
        rating: v.rating || 0,
        status: v.status || "pending",
        earnings: v.totalEarnings || 0
      })) : [];
    },
    [filter],
    { pageSize: PAGE_SIZE },
  );

  const filtered = vendors.filter(v => {
    const search = (searchQuery || "").toLowerCase();
    const matchesSearch = 
      (v.name || "").toLowerCase().includes(search) || 
      String(v.id || "").toLowerCase().includes(search) ||
      (v.city || "").toLowerCase().includes(search);
    return matchesSearch;
  });

  const verifiedLabel = { field: "Field \u2713", premium: "Premium \u2605", basic: "Basic", none: "Unverified" };
  const verifiedColor = { field: "#2196F3", premium: "#ff9944", basic: "#4CAF50", none: "rgba(255,255,255,0.2)" };

  return (
    <div className="animate-[fadeInUp_0.3s_ease_forwards]">
      <div className="flex gap-2 mb-5 flex-wrap items-center">
        {filters.map(f => (
          <button key={f} className={`py-1.5 px-3.5 rounded-full text-xs font-semibold cursor-pointer border border-white/10 bg-transparent text-[rgba(255,255,255,0.35)] transition-all duration-150 font-sans${filter === f ? " text-white bg-[rgba(255,61,61,0.12)] border-[rgba(255,61,61,0.2)] shadow-[inset_2px_0_0_#ff3d3d]" : ""}`} onClick={() => setFilter(f)}>{f}</button>
        ))}
        <div className="ml-auto relative w-full sm:w-auto mt-3 sm:mt-0">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none text-brand-gray-600">
            <Icon name="search" size={14} color="#888" />
          </div>
          <input 
            type="text" 
            placeholder="Search vendors..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full sm:w-64 bg-white/5 border border-white/10 rounded-full py-1.5 pl-9 pr-4 text-xs text-white placeholder-brand-gray-600 focus:outline-none focus:border-[rgba(255,61,61,0.5)] focus:bg-white/10 transition-all font-sans"
          />
        </div>
      </div>
      {/* Real <table> markup (was a div-grid) -- see UsersView.jsx for the
          reference pattern this and the other views were migrated to. Header
          and body are two adjacent tables (rather than one) because this
          view, unlike Users/Bookings, keeps the header visible through the
          loading/error/empty states too -- splitting them preserves that
          without a table-less header row. */}
      <div className="bg-brand-gray-100 rounded-[20px] border border-white/5 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-brand-gray-400/60 hover:bg-transparent">
              {["ID", "Vendor", "Category", "City", "Bookings", "Rating", "Status", "Earnings", "Actions"].map(h => (
                <TableHead key={h} className="text-[10px] font-bold text-brand-gray-600 uppercase tracking-wider">{h}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
        </Table>
        {/* loading / error / empty were all declared as state but never
            rendered, so a slow or failed fetch showed a bare header row with
            no explanation. ESLint had been flagging them as unused the whole
            time. */}
        {loading && (
          <div className="py-12 flex items-center justify-center gap-3 text-brand-gray-600">
            <div className="w-4 h-4 border-2 border-white/20 border-t-brand-red rounded-full animate-spin" />
            <span className="text-xs">Loading vendors…</span>
          </div>
        )}

        {!loading && error && (
          <div className="py-10 px-5 text-center">
            <div className="text-xs text-red-300 mb-3">{error}</div>
            <button
              onClick={fetchVendors}
              className="py-1.5 px-4 rounded-full text-xs font-semibold bg-white/10 text-white hover:bg-white/15 transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <div className="py-12 text-center text-xs text-brand-gray-600">
            {searchQuery
              ? `No vendors match “${searchQuery}”.`
              : "No vendors found for this filter."}
          </div>
        )}

        {!loading && !error && filtered.length > 0 && (
          <Table>
            <TableBody>
              {filtered.map((v) => {
                const sc = vendorStatusConfig[v.status] || { label: v.status || "Unknown", color: '#fff', bg: '#222', border: 'rgba(255,255,255,0.1)' };
                return (
                  <TableRow key={v.id} className="border-white/5 hover:bg-white/5">
                    <TableCell className="text-xs text-brand-gray-600 font-mono">{v.id}</TableCell>
                    <TableCell>
                      <button
                        type="button"
                        className="cursor-pointer group text-left"
                        onClick={() => setSelectedVendor(v)}
                      >
                        <div className="text-sm font-semibold text-white mb-0.5 group-hover:text-brand-red transition-colors hover:underline">{v.name}</div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs text-brand-gray-700">{v.owner}</span>
                          <span className="text-[9px] font-bold px-1.5 py-px rounded-full" style={{color: verifiedColor[v.verified], background: `${verifiedColor[v.verified]}18`}}>{verifiedLabel[v.verified]}</span>
                        </div>
                      </button>
                    </TableCell>
                    <TableCell className="text-xs text-brand-gray-800">{v.category}</TableCell>
                    <TableCell className="text-xs text-brand-gray-800">{v.city}</TableCell>
                    <TableCell className="text-sm font-bold text-white">{v.bookings}</TableCell>
                    <TableCell className={`text-sm font-bold ${v.rating >= 4.5 ? "text-green-500" : v.rating >= 3 ? "text-yellow-400" : "text-brand-red"}`}>
                      {v.rating > 0 ? `${v.rating} ★` : "—"}
                    </TableCell>
                    <TableCell>
                      <Badge config={sc} size="sm" />
                    </TableCell>
                    <TableCell className="font-syne text-sm font-extrabold text-white">
                      {v.earnings > 0 ? `₹${(v.earnings/1000).toFixed(0)}k` : "—"}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {/* This was a green "✓" with NO onClick -- it looked like an
                            approve action and did nothing. There is no vendor-approval
                            endpoint on the backend at all (routes/Admin/vendor.js
                            defines only /vendors and /vendors/metrics), so there is
                            nothing to wire it to. Shown disabled with an explanation
                            rather than removed, so the operator can still see which
                            vendors are awaiting a decision. */}
                        {v.status === "pending" && (
                          <button
                            disabled
                            title="Vendor approval isn't available yet — the backend has no approve endpoint."
                            aria-label="Approve vendor (not available yet)"
                            className="py-1.5 px-3 rounded-lg text-[11px] font-semibold font-sans bg-white/5 text-brand-gray-600 border border-white/10 cursor-not-allowed"
                          >
                            ✓
                          </button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Pagination controls were missing entirely -- `page` was in the fetch
          dependency array but nothing could ever change it, so only page 1 was
          reachable. Matches the Prev/Next pattern already used in BookingsView. */}
      {!loading && !error && (page > 1 || hasMore) && (
        <div className="flex items-center justify-end gap-2 mt-4">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="py-1.5 px-4 rounded-lg text-xs font-semibold bg-white/10 text-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white/15 transition-colors"
          >
            Prev
          </button>
          <span className="text-xs text-brand-gray-600 px-2">Page {page}</span>
          <button
            onClick={() => setPage(p => p + 1)}
            disabled={!hasMore}
            className="py-1.5 px-4 rounded-lg text-xs font-semibold bg-white/10 text-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white/15 transition-colors"
          >
            Next
          </button>
        </div>
      )}

      {selectedVendor && <VendorCard vendor={selectedVendor} onClose={() => setSelectedVendor(null)} />}
    </div>
  );
}

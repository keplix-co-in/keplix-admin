import { useState } from 'react';
import { userStatusConfig } from "../../data/config";
import { getUsers, deleteUser } from "../../services/usersApi";
import { isSuperAdmin } from "../../services/authApi";
import { Icon } from "../ui/Icon";
import UserCard from "../Cards/UserCard";
import ConfirmDialog from "../ui/ConfirmDialog";
import Badge from "../ui/Badge.jsx";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { useApiResource } from "../../hooks/useApiResource";

const PAGE_SIZE = 10;

const keyMap = {
  "All": "all",
  "Active": "active",
  "Inactive": "inactive",
  "Uninstalled": "uninstalled"
};

export default function UsersView() {
  const [filter, setFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  // Which user is pending a delete confirmation, and whether that delete is
  // currently in flight (keeps ConfirmDialog's confirm button in its loading
  // state and blocks a double-confirm, same contract window.confirm had by
  // blocking the thread -- this just does it without freezing the UI).
  const [pendingDeleteUser, setPendingDeleteUser] = useState(null);
  const [deleting, setDeleting] = useState(false);
  // Separate from the list-load error below: useApiResource owns that one
  // internally, and a failed delete is a different, transient event that
  // shouldn't replace "why did the list fail to load" if both ever happen.
  const [deleteError, setDeleteError] = useState(null);

  const filters = ["All", "Active", "Inactive", "Uninstalled"];

  const {
    data: users,
    loading,
    error,
    page,
    setPage,
    hasMore,
    refetch: fetchUsers,
  } = useApiResource(
    async (page) => {
      const filterType = keyMap[filter] || "all";
      const data = await getUsers(filterType, page, PAGE_SIZE);
      return Array.isArray(data) ? data.map(u => ({
        id: String(u.id || ""),
        name: u.name || "N/A",
        email: u.email || "",
        profileImage: u.profileImage || null,
        phone: String(u.contact || "N/A"),
        role: "User", // Default role
        bookings: u.bookings || 0,
        status: u.status || "inactive",
        joined: new Date(u.joined).toLocaleDateString(),
        // No session/activity-tracking column exists on User yet, so this
        // stays honestly blank (UserCard falls back to "—") rather than
        // faking a value.
        lastActive: ""
      })) : [];
    },
    [filter],
    { pageSize: PAGE_SIZE },
  );

  const filtered = users.filter(u => {
    const search = (searchQuery || "").toLowerCase();
    const matchesSearch = 
      (u.name || "").toLowerCase().includes(search) || 
      (u.email || "").toLowerCase().includes(search) ||
      String(u.id || "").toLowerCase().includes(search) ||
      String(u.phone || "").toLowerCase().includes(search);
    return matchesSearch;
  });

  const confirmDelete = async () => {
    if (!pendingDeleteUser) return;
    setDeleting(true);
    try {
      await deleteUser(pendingDeleteUser.id);
      setPendingDeleteUser(null);
      setDeleteError(null);
      fetchUsers(); // Refresh after deletion
    } catch (err) {
      // The reason was being discarded, so a permissions failure and a
      // network failure both surfaced as the same dead-end message.
      setDeleteError(err?.message ? `Failed to delete user: ${err.message}` : 'Failed to delete user.');
      setPendingDeleteUser(null);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="animate-[fadeInUp_0.3s_ease_forwards]">
      <div className="flex gap-2 mb-5 flex-wrap items-center">
        {filters.map(f => (
          <button 
            key={f} 
            className={`py-1.5 px-3.5 rounded-full text-xs font-semibold cursor-pointer border border-white/10 bg-transparent text-[rgba(255,255,255,0.35)] transition-all duration-150 font-sans ${filter === f ? "text-white bg-[rgba(255,61,61,0.12)] border-[rgba(255,61,61,0.2)] shadow-[inset_2px_0_0_#ff3d3d]" : ""}`} 
            onClick={() => setFilter(f)}
          >
            {f}
          </button>
        ))}
        <div className="ml-auto relative w-full sm:w-auto mt-3 sm:mt-0">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none text-brand-gray-600">
            <Icon name="search" size={14} color="#888" />
          </div>
          <input 
            type="text" 
            placeholder="Search users..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full sm:w-64 bg-white/5 border border-white/10 rounded-full py-1.5 pl-9 pr-4 text-xs text-white placeholder-brand-gray-600 focus:outline-none focus:border-[rgba(255,61,61,0.5)] focus:bg-white/10 transition-all font-sans"
          />
        </div>
      </div>
      
      {error && (
        <div className="bg-brand-red/10 border border-brand-red/30 rounded-lg p-4 text-brand-red mb-4">
          <p className="font-semibold">Error loading users</p>
          <p className="text-sm">{error}</p>
        </div>
      )}

      {deleteError && (
        <div className="bg-brand-red/10 border border-brand-red/30 rounded-lg p-4 text-brand-red mb-4">
          <p className="text-sm">{deleteError}</p>
        </div>
      )}

      <div className="bg-brand-gray-100 rounded-[20px] border border-white/5 overflow-hidden">
        {loading ? (
          <div className="py-8 text-center text-brand-gray-700">
            <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-brand-red"></div>
            <p className="mt-2">Loading users...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-8 text-center text-brand-gray-700">No users found</div>
        ) : (
          // Real <table> markup (was a div-grid): screen readers previously
          // saw an undifferentiated wall of divs instead of rows/cells for
          // every list view in this app -- this is the first one migrated.
          <Table>
            <TableHeader>
              <TableRow className="border-brand-gray-400/60 hover:bg-transparent">
                {["ID", "User Details", "Contact", "Role", "Bookings", "Status", "Joined", "Actions"].map(h => (
                  <TableHead key={h} className="text-[10px] font-bold text-brand-gray-600 uppercase tracking-wider">{h}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((u) => {
                const sc = userStatusConfig[u.status] || { label: u.status, color: '#fff', bg: '#222', border: 'rgba(255,255,255,0.1)' };
                return (
                  <TableRow key={u.id} className="border-white/5 hover:bg-white/5">
                    <TableCell className="text-xs text-brand-gray-600 font-mono">{u.id}</TableCell>

                    <TableCell>
                      <button
                        type="button"
                        className="cursor-pointer group text-left"
                        onClick={() => setSelectedUser(u)}
                      >
                        <div className="text-sm font-semibold text-white mb-0.5 group-hover:text-brand-red transition-colors hover:underline">{u.name}</div>
                        <div className="text-xs text-brand-gray-600">{u.email}</div>
                      </button>
                    </TableCell>

                    <TableCell className="text-xs text-brand-gray-500 font-mono">{u.phone}</TableCell>

                    <TableCell>
                      <span className={`text-[10px] font-bold px-2 py-1 rounded-md ${u.role === 'Pro User' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' : 'bg-white/5 text-brand-gray-500 border border-white/10'}`}>
                        {u.role}
                      </span>
                    </TableCell>

                    <TableCell className="text-sm font-bold text-white">{u.bookings}</TableCell>

                    <TableCell>
                      <Badge config={sc} size="sm" />
                    </TableCell>

                    <TableCell>
                      <div className="text-xs text-white/80">{u.joined}</div>
                      <div className="text-[10px] text-brand-gray-600 mt-0.5">{u.lastActive}</div>
                    </TableCell>

                    <TableCell>
                      {/* M-3: DELETE /admin/users/:id is super_admin-only. */}
                      {isSuperAdmin() && (
                      <button
                        type="button"
                        onClick={() => setPendingDeleteUser(u)}
                        aria-label={`Delete ${u.name}`}
                        className="py-1.5 px-2 rounded-lg border-none cursor-pointer transition-all duration-150 bg-brand-red/10 text-brand-red border border-brand-red/20 hover:bg-brand-red/20"
                      >
                        <Icon name="delete" size={13} color="#ff3d3d" />
                      </button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Prev/Next were never rendered, so `page` could never change and only
          the first 10 users were ever reachable. */}
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

      {selectedUser && <UserCard user={selectedUser} onClose={() => setSelectedUser(null)} />}

      {pendingDeleteUser && (
        <ConfirmDialog
          title="Delete user"
          message={`Are you sure you want to delete ${pendingDeleteUser.name || 'this user'}? This can't be undone.`}
          confirmLabel="Delete"
          danger
          loading={deleting}
          onConfirm={confirmDelete}
          onCancel={() => setPendingDeleteUser(null)}
        />
      )}
    </div>
  );
}

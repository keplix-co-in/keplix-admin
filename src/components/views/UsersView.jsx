import { useState, useEffect } from 'react';
import { userStatusConfig } from "../../data/config";
import { getUsers, deleteUser } from "../../services/usersApi";
import { Icon } from "../ui/Icon";
import UserCard from "../Cards/UserCard";

export default function UsersView() {
  const [filter, setFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);

  const filters = ["All", "Active", "Inactive", "Uninstalled"];

  const keyMap = {
    "All": "all",
    "Active": "active",
    "Inactive": "inactive",
    "Uninstalled": "uninstalled"
  };

  useEffect(() => {
    fetchUsers();
  }, [filter, page]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);

      const filterType = keyMap[filter] || "all";
      const data = await getUsers(filterType, page, 10);

      const formattedUsers = Array.isArray(data) ? data.map(u => ({
        id: String(u.id || ""),
        name: u.name || "N/A",
        email: "", // Not returned by API
        phone: String(u.contact || "N/A"),
        role: "User", // Default role
        bookings: u.bookings || 0,
        status: u.status || "inactive",
        joined: new Date(u.joined).toLocaleDateString(),
        lastActive: ""
      })) : [];

      setUsers(formattedUsers);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError(err.message || 'Failed to load users');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const filtered = users.filter(u => {
    const search = (searchQuery || "").toLowerCase();
    const matchesSearch = 
      (u.name || "").toLowerCase().includes(search) || 
      (u.email || "").toLowerCase().includes(search) ||
      String(u.id || "").toLowerCase().includes(search) ||
      String(u.phone || "").toLowerCase().includes(search);
    return matchesSearch;
  });

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      try {
        await deleteUser(id);
        fetchUsers(); // Refresh after deletion
      } catch (err) {
        alert("Failed to delete user");
      }
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

      <div className="bg-brand-gray-100 rounded-[20px] border border-white/5 overflow-hidden">
        <div className="grid grid-cols-[80px_1.5fr_1.5fr_100px_90px_100px_100px_80px] gap-3 px-5 py-3 border-b border-brand-gray-400/60">
          {["ID", "User Details", "Contact", "Role", "Bookings", "Status", "Joined", "Actions"].map(h => (
            <div key={h} className="text-[10px] font-bold text-brand-gray-600 uppercase tracking-wider">{h}</div>
          ))}
        </div>
        
        {loading ? (
          <div className="py-8 text-center text-brand-gray-700">
            <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-brand-red"></div>
            <p className="mt-2">Loading users...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-8 text-center text-brand-gray-700">No users found</div>
        ) : (
          filtered.map((u, i) => {
            const sc = userStatusConfig[u.status] || { label: u.status, color: '#fff', bg: '#222', border: 'rgba(255,255,255,0.1)' };
            return (
              <div key={i} className="grid items-center py-3.5 px-5 transition-colors duration-150 border-b border-white/5 hover:bg-white/5 grid-cols-[80px_1.5fr_1.5fr_100px_90px_100px_100px_80px] gap-3 last:border-none">
                <div className="text-xs text-brand-gray-600 font-mono">{u.id}</div>
                
                <div 
                  className="cursor-pointer group"
                  onClick={() => setSelectedUser(u)}
                >
                  <div className="text-sm font-semibold text-white mb-0.5 group-hover:text-brand-red transition-colors hover:underline">{u.name}</div>
                  <div className="text-xs text-brand-gray-600">{u.email}</div>
                </div>
                
                <div className="text-xs text-brand-gray-500 font-mono">{u.phone}</div>
                
                <div>
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-md ${u.role === 'Pro User' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' : 'bg-white/5 text-brand-gray-500 border border-white/10'}`}>
                    {u.role}
                  </span>
                </div>
                
                <div className="text-sm font-bold text-white">{u.bookings}</div>
                
                <div>
                  <span className="inline-flex items-center py-1 px-3 rounded-full text-[10px] font-bold tracking-[0.3px] border" style={{ color: sc.color, background: sc.bg, borderColor: sc.border }}>
                    {sc.label}
                  </span>
                </div>
                
                <div>
                  <div className="text-xs text-white/80">{u.joined}</div>
                  <div className="text-[10px] text-brand-gray-600 mt-0.5">{u.lastActive}</div>
                </div>
                
                <div className="flex gap-2">
                  <button onClick={() => handleDelete(u.id)} className="py-1.5 px-2 rounded-lg border-none cursor-pointer transition-all duration-150 bg-brand-red/10 text-brand-red border border-brand-red/20 hover:bg-brand-red/20">
                    <Icon name="delete" size={13} color="#ff3d3d" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
      {selectedUser && <UserCard user={selectedUser} onClose={() => setSelectedUser(null)} />}
    </div>
  );
}

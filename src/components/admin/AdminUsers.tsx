import React, { useEffect, useState } from "react";

interface UserItem {
  id: string;
  name: string;
  email: string;
  phone: string;
  planId: string | null;
  planName: string;
  status: "active" | "blocked" | "deleted";
  cardsCount: number;
  createdAt: string;
  lastLogin: string | null;
}

interface PlanItem {
  id: string;
  name: string;
}

interface AdminUsersProps {
  onSelectUser: (userId: string) => void;
}

export default function AdminUsers({ onSelectUser }: AdminUsersProps) {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [plans, setPlans] = useState<PlanItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [planFilter, setPlanFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sortBy, setSortBy] = useState("newest");

  // Confirm Modal state
  const [confirmModal, setConfirmModal] = useState<{
    type: "block" | "unblock" | "delete";
    user: UserItem;
  } | null>(null);

  // Add User Modal state
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newUserData, setNewUserData] = useState({ name: "", email: "", phone: "", planId: "" });

  const [toastMessage, setToastMessage] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append("query", searchQuery);
      if (planFilter) params.append("plan", planFilter);
      if (statusFilter) params.append("status", statusFilter);
      if (sortBy) params.append("sort", sortBy);

      const response = await fetch(`/api/admin-users?${params.toString()}`);
      const data = await response.json();
      if (response.ok) setUsers(data.users || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchPlans = async () => {
    try {
      const res = await fetch("/api/admin-plans");
      const data = await res.json();
      if (res.ok) setPlans(data.plans || []);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [searchQuery, planFilter, statusFilter, sortBy]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 3500);
  };

  const handleConfirmAction = async () => {
    if (!confirmModal || actionLoading) return;
    setActionLoading(true);
    const { type, user } = confirmModal;

    try {
      if (type === "delete") {
        const res = await fetch(`/api/admin-user-detail?id=${user.id}`, { method: "DELETE" });
        if (res.ok) {
          showToast("User deleted successfully.");
          fetchUsers();
        } else {
          showToast("Unable to delete user.");
        }
      } else {
        const newStatus = type === "block" ? "blocked" : "active";
        const res = await fetch("/api/admin-user-detail", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: user.id, status: newStatus })
        });
        if (res.ok) {
          showToast(`User ${type === "block" ? "blocked" : "unblocked"} successfully.`);
          fetchUsers();
        } else {
          showToast(`Could not ${type} user.`);
        }
      }
    } catch (e) {
      showToast("Action failed.");
    } finally {
      setActionLoading(false);
      setConfirmModal(null);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserData.name || !newUserData.email) return;

    setActionLoading(true);
    try {
      const res = await fetch("/api/admin-users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newUserData)
      });
      const data = await res.json();
      if (res.ok) {
        showToast("User created & plan assigned successfully.");
        setShowAddUserModal(false);
        setNewUserData({ name: "", email: "", phone: "", planId: "" });
        fetchUsers();
      } else {
        showToast(data.error || "Failed to create user.");
      }
    } catch (e) {
      showToast("Network error creating user.");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Banner */}
      {toastMessage && (
        <div className="bg-amber-500 text-black px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl flex items-center justify-between">
          <span>{toastMessage}</span>
          <button onClick={() => setToastMessage("")}>✕</button>
        </div>
      )}

      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black uppercase tracking-tight">Registered Users</h2>
          <p className="text-xs text-white/40">Manage user accounts, assign plans, and regulate access.</p>
        </div>
        <button
          onClick={() => setShowAddUserModal(true)}
          className="bg-amber-500 text-black px-6 py-3 rounded-2xl font-black uppercase text-xs tracking-wider hover:bg-amber-400 transition-all shadow-lg shadow-amber-500/20"
        >
          + Add New User
        </button>
      </div>

      {/* Search & Filters */}
      <div className="bg-white/5 border border-white/10 p-6 rounded-[2rem] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <label className="text-[10px] font-black text-white/30 uppercase tracking-widest block mb-2">Search</label>
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search Name, Email, Phone..."
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs font-bold outline-none focus:border-amber-500/50"
          />
        </div>

        <div>
          <label className="text-[10px] font-black text-white/30 uppercase tracking-widest block mb-2">Filter by Plan</label>
          <select
            value={planFilter}
            onChange={e => setPlanFilter(e.target.value)}
            className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-2.5 text-xs font-bold outline-none focus:border-amber-500/50 text-white"
          >
            <option value="">All Plans</option>
            {plans.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-[10px] font-black text-white/30 uppercase tracking-widest block mb-2">Filter by Status</label>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-2.5 text-xs font-bold outline-none focus:border-amber-500/50 text-white"
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="blocked">Blocked</option>
          </select>
        </div>

        <div>
          <label className="text-[10px] font-black text-white/30 uppercase tracking-widest block mb-2">Sort By</label>
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
            className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-2.5 text-xs font-bold outline-none focus:border-amber-500/50 text-white"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="name">Name A-Z</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white/5 border border-white/10 rounded-[2rem] overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs font-black uppercase text-white/30 tracking-widest">
            Fetching Users...
          </div>
        ) : users.length === 0 ? (
          <div className="p-12 text-center text-xs font-black uppercase text-white/30 tracking-widest">
            No matching users found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-white/5 border-b border-white/10 text-white/40 uppercase tracking-widest text-[10px] font-black">
                <tr>
                  <th className="p-5">Name & Email</th>
                  <th className="p-5">Phone</th>
                  <th className="p-5">Plan</th>
                  <th className="p-5">Status</th>
                  <th className="p-5">Cards</th>
                  <th className="p-5">Date</th>
                  <th className="p-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-semibold">
                {users.map(u => (
                  <tr key={u.id} className="hover:bg-white/5 transition-colors">
                    <td className="p-5">
                      <p className="font-black text-white">{u.name}</p>
                      <p className="text-white/40 text-[11px] font-normal">{u.email}</p>
                    </td>
                    <td className="p-5 text-white/70">{u.phone || "N/A"}</td>
                    <td className="p-5">
                      <span className="px-3 py-1 bg-amber-500/10 text-amber-400 font-black rounded-lg text-[10px] uppercase">
                        {u.planName}
                      </span>
                    </td>
                    <td className="p-5">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase inline-flex items-center gap-1.5 ${
                        u.status === "active" ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${u.status === "active" ? "bg-emerald-400" : "bg-red-400"}`} />
                        {u.status}
                      </span>
                    </td>
                    <td className="p-5 font-mono">{u.cardsCount}</td>
                    <td className="p-5 text-white/40 text-[11px]">{new Date(u.createdAt).toLocaleDateString()}</td>
                    <td className="p-5 text-right space-x-2">
                      <button
                        onClick={() => onSelectUser(u.id)}
                        className="px-3 py-1.5 bg-white/10 text-white hover:bg-white/20 rounded-lg text-[10px] font-black uppercase transition-all"
                      >
                        View / Edit
                      </button>
                      {u.status === "active" ? (
                        <button
                          onClick={() => setConfirmModal({ type: "block", user: u })}
                          className="px-3 py-1.5 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-lg text-[10px] font-black uppercase transition-all"
                        >
                          Block
                        </button>
                      ) : (
                        <button
                          onClick={() => setConfirmModal({ type: "unblock", user: u })}
                          className="px-3 py-1.5 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 rounded-lg text-[10px] font-black uppercase transition-all"
                        >
                          Unblock
                        </button>
                      )}
                      <button
                        onClick={() => setConfirmModal({ type: "delete", user: u })}
                        className="px-3 py-1.5 bg-red-500 text-black hover:bg-red-400 rounded-lg text-[10px] font-black uppercase transition-all"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {confirmModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-slate-900 border border-white/10 max-w-md w-full rounded-3xl p-8 space-y-6">
            <h3 className="text-xl font-black uppercase tracking-tight text-white">
              {confirmModal.type === "delete" ? "Delete User Confirmation" : `${confirmModal.type.toUpperCase()} User`}
            </h3>
            <p className="text-sm text-white/60">
              Are you sure you want to {confirmModal.type} user <strong className="text-white">{confirmModal.user.name}</strong> ({confirmModal.user.email})?
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setConfirmModal(null)}
                className="px-5 py-2.5 bg-white/10 text-white rounded-xl text-xs font-black uppercase hover:bg-white/20"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmAction}
                disabled={actionLoading}
                className="px-5 py-2.5 bg-red-500 text-black rounded-xl text-xs font-black uppercase hover:bg-red-400 disabled:opacity-50"
              >
                {actionLoading ? "Processing..." : `Yes, ${confirmModal.type}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add User Modal */}
      {showAddUserModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <form onSubmit={handleCreateUser} className="bg-slate-900 border border-white/10 max-w-md w-full rounded-3xl p-8 space-y-5">
            <h3 className="text-xl font-black uppercase tracking-tight text-white">Create User Account</h3>
            
            <div>
              <label className="text-[10px] font-black text-white/30 uppercase tracking-widest block mb-1">Full Name</label>
              <input
                required
                type="text"
                value={newUserData.name}
                onChange={e => setNewUserData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g. Amit Kumar"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs font-bold outline-none focus:border-amber-500/50"
              />
            </div>

            <div>
              <label className="text-[10px] font-black text-white/30 uppercase tracking-widest block mb-1">Email Address</label>
              <input
                required
                type="email"
                value={newUserData.email}
                onChange={e => setNewUserData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="e.g. amit@example.com"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs font-bold outline-none focus:border-amber-500/50"
              />
            </div>

            <div>
              <label className="text-[10px] font-black text-white/30 uppercase tracking-widest block mb-1">Phone Number</label>
              <input
                type="tel"
                value={newUserData.phone}
                onChange={e => setNewUserData(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="e.g. 9876543210"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs font-bold outline-none focus:border-amber-500/50"
              />
            </div>

            <div>
              <label className="text-[10px] font-black text-amber-500 uppercase tracking-widest block mb-1">Select User Plan (Admin Decides)</label>
              <select
                value={newUserData.planId}
                onChange={e => setNewUserData(prev => ({ ...prev, planId: e.target.value }))}
                className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-xs font-bold outline-none focus:border-amber-500/50 text-white"
              >
                <option value="">-- Select Plan --</option>
                {plans.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            <div className="flex gap-3 justify-end pt-4">
              <button
                type="button"
                onClick={() => setShowAddUserModal(false)}
                className="px-5 py-2.5 bg-white/10 text-white rounded-xl text-xs font-black uppercase"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={actionLoading}
                className="px-5 py-2.5 bg-amber-500 text-black rounded-xl text-xs font-black uppercase hover:bg-amber-400 disabled:opacity-50"
              >
                {actionLoading ? "Saving..." : "Create User"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

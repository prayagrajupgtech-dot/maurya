import React, { useEffect, useState } from "react";

interface UserDetails {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: "active" | "blocked" | "deleted";
  role: string;
  planId: string | null;
  planName: string;
  planCardLimit: number;
  createdAt: string;
  lastLogin: string | null;
}

interface PlanItem {
  id: string;
  name: string;
  price: number;
  card_limit: number;
}

interface CardItem {
  id: string;
  card_number: string;
  name: string;
  phone: string;
  status: string;
  created_at: string;
}

interface AdminUserDetailsProps {
  userId: string;
  onBack: () => void;
}

export default function AdminUserDetails({ userId, onBack }: AdminUserDetailsProps) {
  const [user, setUser] = useState<UserDetails | null>(null);
  const [cards, setCards] = useState<CardItem[]>([]);
  const [plans, setPlans] = useState<PlanItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [selectedPlanId, setSelectedPlanId] = useState("");
  const [editStatus, setEditStatus] = useState<"active" | "blocked">("active");

  useEffect(() => {
    async function loadData() {
      try {
        const [userRes, plansRes] = await Promise.all([
          fetch(`/api/admin-user-detail?id=${userId}`),
          fetch("/api/admin-plans")
        ]);

        const userData = await userRes.json();
        const plansData = await plansRes.json();

        if (userRes.ok && userData.user) {
          setUser(userData.user);
          setCards(userData.cards || []);
          setEditName(userData.user.name);
          setEditPhone(userData.user.phone || "");
          setSelectedPlanId(userData.user.planId || "");
          setEditStatus(userData.user.status);
        }

        if (plansRes.ok) {
          setPlans(plansData.plans || []);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [userId]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");

    try {
      const res = await fetch("/api/admin-user-detail", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: userId,
          name: editName,
          phone: editPhone,
          planId: selectedPlanId,
          status: editStatus
        })
      });
      const data = await res.json();
      if (res.ok) {
        setMessage("User details updated successfully.");
        setUser(prev => prev ? { ...prev, name: editName, phone: editPhone, planId: selectedPlanId, status: editStatus } : prev);
      } else {
        setMessage(data.error || "Failed to update user.");
      }
    } catch (e) {
      setMessage("Network error.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-xs font-black uppercase tracking-[3px] text-white/40">Loading User Profile...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-8 text-center">
        <p className="text-sm font-bold text-red-400 mb-4">User not found.</p>
        <button onClick={onBack} className="px-4 py-2 bg-white/10 text-white rounded-xl text-xs font-black uppercase">
          ← Back to Users
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl">
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="px-4 py-2 bg-white/10 text-white hover:bg-white/20 rounded-xl text-xs font-black uppercase tracking-wider">
          ← Back to Users
        </button>
        <span className={`px-3 py-1 rounded-full text-xs font-black uppercase ${
          user.status === "active" ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"
        }`}>
          Status: {user.status}
        </span>
      </div>

      {message && (
        <div className="bg-amber-500 text-black px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest">
          {message}
        </div>
      )}

      {/* Edit Form Card */}
      <form onSubmit={handleSave} className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 space-y-6">
        <div className="border-b border-white/10 pb-4">
          <span className="text-[10px] font-black text-amber-500 uppercase tracking-[4px]">User Account Details</span>
          <h2 className="text-2xl font-black uppercase tracking-tight mt-1">{user.name}</h2>
          <p className="text-xs text-white/40">{user.email}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
          <div>
            <label className="text-[10px] font-black text-white/30 uppercase tracking-widest block mb-2">Full Name</label>
            <input
              type="text"
              value={editName}
              onChange={e => setEditName(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 font-bold outline-none focus:border-amber-500/50"
            />
          </div>

          <div>
            <label className="text-[10px] font-black text-white/30 uppercase tracking-widest block mb-2">Phone Number</label>
            <input
              type="tel"
              value={editPhone}
              onChange={e => setEditPhone(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 font-bold outline-none focus:border-amber-500/50"
            />
          </div>

          <div>
            <label className="text-[10px] font-black text-amber-500 uppercase tracking-widest block mb-2">Assigned Plan (Admin Selects)</label>
            <select
              value={selectedPlanId}
              onChange={e => setSelectedPlanId(e.target.value)}
              className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 font-bold outline-none focus:border-amber-500/50 text-white"
            >
              <option value="">-- Select Plan --</option>
              {plans.map(p => (
                <option key={p.id} value={p.id}>{p.name} (₹{p.price} - {p.card_limit === -1 ? "Unlimited" : `${p.card_limit} Cards`})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] font-black text-white/30 uppercase tracking-widest block mb-2">Account Status</label>
            <select
              value={editStatus}
              onChange={e => setEditStatus(e.target.value as any)}
              className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 font-bold outline-none focus:border-amber-500/50 text-white"
            >
              <option value="active">Active</option>
              <option value="blocked">Blocked</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-black/20 p-4 rounded-2xl text-[11px]">
          <div>
            <p className="text-white/30 uppercase font-black text-[9px]">Cards Generated</p>
            <p className="font-black text-white mt-1">{cards.length}</p>
          </div>
          <div>
            <p className="text-white/30 uppercase font-black text-[9px]">Registered Date</p>
            <p className="font-bold text-white/80 mt-1">{new Date(user.createdAt).toLocaleDateString()}</p>
          </div>
          <div>
            <p className="text-white/30 uppercase font-black text-[9px]">Last Login</p>
            <p className="font-bold text-white/80 mt-1">{user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : "Never"}</p>
          </div>
          <div>
            <p className="text-white/30 uppercase font-black text-[9px]">User ID</p>
            <p className="font-mono text-white/60 mt-1 truncate">{user.id}</p>
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="bg-amber-500 text-black px-6 py-3 rounded-2xl font-black uppercase text-xs tracking-wider hover:bg-amber-400 transition-all disabled:opacity-50"
        >
          {saving ? "Saving Changes..." : "Save User Details"}
        </button>
      </form>

      {/* Card Generation History */}
      <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 space-y-4">
        <h3 className="text-lg font-black uppercase tracking-tight">Card Generation History</h3>
        {cards.length === 0 ? (
          <p className="text-xs text-white/30 italic">No cards generated for this user yet.</p>
        ) : (
          <div className="space-y-3">
            {cards.map(c => (
              <div key={c.id} className="bg-black/20 border border-white/5 p-4 rounded-xl flex items-center justify-between text-xs">
                <div>
                  <p className="font-black text-white">{c.name}</p>
                  <p className="text-white/40 font-mono text-[11px]">{c.card_number} | {c.phone}</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-white/40 block">{new Date(c.created_at).toLocaleDateString()}</span>
                  <span className="text-[10px] font-black uppercase text-emerald-400">{c.status}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

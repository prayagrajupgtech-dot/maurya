import React, { useEffect, useState } from "react";

interface PlanItem {
  id: string;
  name: string;
  price: number;
  duration_days: number;
  card_limit: number;
  status: "active" | "inactive";
  created_at: string;
}

export default function AdminPlans() {
  const [plans, setPlans] = useState<PlanItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState<PlanItem | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    price: 499,
    duration_days: 30,
    card_limit: 100,
    status: "active" as "active" | "inactive"
  });

  const [confirmDelete, setConfirmDelete] = useState<PlanItem | null>(null);

  const fetchPlans = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin-plans");
      const data = await res.json();
      if (res.ok) setPlans(data.plans || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 3500);
  };

  const handleOpenCreate = () => {
    setEditingPlan(null);
    setFormData({ name: "", price: 499, duration_days: 30, card_limit: 100, status: "active" });
    setShowModal(true);
  };

  const handleOpenEdit = (plan: PlanItem) => {
    setEditingPlan(plan);
    setFormData({
      name: plan.name,
      price: plan.price,
      duration_days: plan.duration_days,
      card_limit: plan.card_limit,
      status: plan.status
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);

    try {
      if (editingPlan) {
        const res = await fetch("/api/admin-plans", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editingPlan.id, ...formData })
        });
        if (res.ok) {
          showToast("Plan updated successfully.");
          setShowModal(false);
          fetchPlans();
        } else {
          showToast("Could not update plan.");
        }
      } else {
        const res = await fetch("/api/admin-plans", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData)
        });
        if (res.ok) {
          showToast("Plan created successfully.");
          setShowModal(false);
          fetchPlans();
        } else {
          showToast("Could not create plan.");
        }
      }
    } catch (e) {
      showToast("Action failed.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleStatus = async (plan: PlanItem) => {
    const newStatus = plan.status === "active" ? "inactive" : "active";
    try {
      const res = await fetch("/api/admin-plans", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: plan.id, status: newStatus })
      });
      if (res.ok) {
        showToast(`Plan ${newStatus === "active" ? "activated" : "deactivated"} successfully.`);
        fetchPlans();
      }
    } catch (e) {
      showToast("Failed to toggle status.");
    }
  };

  const handleDeletePlan = async () => {
    if (!confirmDelete || actionLoading) return;
    setActionLoading(true);

    try {
      const res = await fetch(`/api/admin-plans?id=${confirmDelete.id}`, { method: "DELETE" });
      if (res.ok) {
        showToast("Plan deleted successfully.");
        setConfirmDelete(null);
        fetchPlans();
      } else {
        showToast("Could not delete plan.");
      }
    } catch (e) {
      showToast("Delete failed.");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toastMessage && (
        <div className="bg-amber-500 text-black px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl flex items-center justify-between">
          <span>{toastMessage}</span>
          <button onClick={() => setToastMessage("")}>✕</button>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black uppercase tracking-tight">Plan Management</h2>
          <p className="text-xs text-white/40">Only admins can create, edit, activate, or deactivate subscription plans.</p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="bg-amber-500 text-black px-6 py-3 rounded-2xl font-black uppercase text-xs tracking-wider hover:bg-amber-400 transition-all shadow-lg shadow-amber-500/20"
        >
          + Create New Plan
        </button>
      </div>

      {/* Plans List */}
      {loading ? (
        <div className="p-12 text-center text-xs font-black uppercase text-white/30 tracking-widest">
          Loading Plans...
        </div>
      ) : plans.length === 0 ? (
        <div className="p-12 text-center text-xs font-black uppercase text-white/30 tracking-widest">
          No plans available.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map(p => (
            <div key={p.id} className={`bg-white/5 border rounded-[2.5rem] p-8 flex flex-col justify-between relative ${
              p.status === "active" ? "border-amber-500/30" : "border-white/10 opacity-60"
            }`}>
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest">Plan</span>
                    <h3 className="text-2xl font-black uppercase mt-1">{p.name}</h3>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                    p.status === "active" ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"
                  }`}>
                    {p.status}
                  </span>
                </div>

                <div className="bg-black/30 p-4 rounded-2xl space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-white/40">Price:</span>
                    <span className="font-black text-amber-400 text-base">₹{p.price}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/40">Card Limit:</span>
                    <span className="font-bold text-white">{p.card_limit === -1 ? "Unlimited Cards" : `${p.card_limit} Cards`}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/40">Duration:</span>
                    <span className="font-bold text-white">{p.duration_days} Days</span>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-4 border-t border-white/10 flex items-center justify-between gap-2 text-xs">
                <button
                  onClick={() => handleOpenEdit(p)}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl font-black uppercase text-[10px]"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleToggleStatus(p)}
                  className={`px-4 py-2 rounded-xl font-black uppercase text-[10px] ${
                    p.status === "active" ? "bg-amber-500/10 text-amber-400 hover:bg-amber-500/20" : "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
                  }`}
                >
                  {p.status === "active" ? "Deactivate" : "Activate"}
                </button>
                <button
                  onClick={() => setConfirmDelete(p)}
                  className="px-3 py-2 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-xl font-black uppercase text-[10px]"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Create / Edit */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <form onSubmit={handleSubmit} className="bg-slate-900 border border-white/10 max-w-md w-full rounded-3xl p-8 space-y-5">
            <h3 className="text-xl font-black uppercase tracking-tight text-white">
              {editingPlan ? "Edit Plan Details" : "Create New Plan"}
            </h3>

            <div>
              <label className="text-[10px] font-black text-white/30 uppercase tracking-widest block mb-1">Plan Name</label>
              <input
                required
                type="text"
                value={formData.name}
                onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g. Basic / Standard / Premium"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs font-bold outline-none focus:border-amber-500/50"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-black text-white/30 uppercase tracking-widest block mb-1">Price (₹)</label>
                <input
                  required
                  type="number"
                  value={formData.price}
                  onChange={e => setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs font-bold outline-none focus:border-amber-500/50"
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-white/30 uppercase tracking-widest block mb-1">Duration (Days)</label>
                <input
                  required
                  type="number"
                  value={formData.duration_days}
                  onChange={e => setFormData(prev => ({ ...prev, duration_days: parseInt(e.target.value, 10) || 30 }))}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs font-bold outline-none focus:border-amber-500/50"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-black text-white/30 uppercase tracking-widest block mb-1">Card Generation Limit (-1 for Unlimited)</label>
              <input
                required
                type="number"
                value={formData.card_limit}
                onChange={e => setFormData(prev => ({ ...prev, card_limit: parseInt(e.target.value, 10) }))}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs font-bold outline-none focus:border-amber-500/50"
              />
            </div>

            <div>
              <label className="text-[10px] font-black text-white/30 uppercase tracking-widest block mb-1">Status</label>
              <select
                value={formData.status}
                onChange={e => setFormData(prev => ({ ...prev, status: e.target.value as any }))}
                className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-xs font-bold outline-none focus:border-amber-500/50 text-white"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            <div className="flex gap-3 justify-end pt-4">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-5 py-2.5 bg-white/10 text-white rounded-xl text-xs font-black uppercase"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={actionLoading}
                className="px-5 py-2.5 bg-amber-500 text-black rounded-xl text-xs font-black uppercase hover:bg-amber-400 disabled:opacity-50"
              >
                {actionLoading ? "Saving..." : "Save Plan"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-slate-900 border border-white/10 max-w-md w-full rounded-3xl p-8 space-y-6">
            <h3 className="text-xl font-black uppercase tracking-tight text-white">Delete Plan Confirmation</h3>
            <p className="text-sm text-white/60">
              Are you sure you want to delete plan <strong className="text-white">{confirmDelete.name}</strong>?
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setConfirmDelete(null)}
                className="px-5 py-2.5 bg-white/10 text-white rounded-xl text-xs font-black uppercase"
              >
                Cancel
              </button>
              <button
                onClick={handleDeletePlan}
                disabled={actionLoading}
                className="px-5 py-2.5 bg-red-500 text-black rounded-xl text-xs font-black uppercase hover:bg-red-400 disabled:opacity-50"
              >
                {actionLoading ? "Deleting..." : "Yes, Delete Plan"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

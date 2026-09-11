import { useState, useEffect } from "react";
import { useTheme } from "../../App";
import { QRCodeCanvas } from "qrcode.react";

interface ApplicationData {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  country: string;
  country_code: string;
  date_of_birth: string;
  address: string;
  photo_url: string;
  completion_percentage: number;
  status: string;
  created_at: string;
  updated_at: string;
  user_name: string;
  user_email: string;
  user_country: string;
  user_country_code: string;
  user_phone: string;
  plan_name: string;
  plan_price: number;
  payment_status: string;
  payment_amount: number;
  transaction_id: string;
  card_number: string | null;
  card_status: string | null;
  qr_token: string | null;
}

interface AdminApplicationDetailsProps {
  applicationId: string;
  onBack: () => void;
}

const statusStyles: Record<string, { bg: string; text: string; dot: string }> = {
  draft: { bg: "bg-white/10", text: "text-white/50", dot: "bg-white/50" },
  incomplete: { bg: "bg-yellow-500/10", text: "text-yellow-400", dot: "bg-yellow-400" },
  completed: { bg: "bg-blue-500/10", text: "text-blue-400", dot: "bg-blue-400" },
  submitted: { bg: "bg-indigo-500/10", text: "text-indigo-400", dot: "bg-indigo-400" },
  payment_pending: { bg: "bg-amber-500/10", text: "text-amber-400", dot: "bg-amber-400" },
  payment_success: { bg: "bg-green-500/10", text: "text-green-400", dot: "bg-green-400" },
  card_issued: { bg: "bg-emerald-500/10", text: "text-emerald-400", dot: "bg-emerald-400" },
  card_active: { bg: "bg-emerald-500/10", text: "text-emerald-400", dot: "bg-emerald-400" },
  payment_failed: { bg: "bg-red-500/10", text: "text-red-400", dot: "bg-red-400" },
};

const statusLabels: Record<string, string> = {
  draft: "Draft",
  incomplete: "Incomplete",
  completed: "Completed",
  submitted: "Submitted",
  payment_pending: "Payment Pending",
  payment_success: "Payment Success",
  card_issued: "Card Issued",
  card_active: "Card Active",
  payment_failed: "Payment Failed",
};

const paymentStatusStyles: Record<string, { bg: string; text: string }> = {
  success: { bg: "bg-green-500/10", text: "text-green-400" },
  pending: { bg: "bg-amber-500/10", text: "text-amber-400" },
  failed: { bg: "bg-red-500/10", text: "text-red-400" },
};

export default function AdminApplicationDetails({ applicationId, onBack }: AdminApplicationDetailsProps) {
  const { theme } = useTheme();
  const [application, setApplication] = useState<ApplicationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [message, setMessage] = useState("");
  const [newStatus, setNewStatus] = useState("");

  const isDark = theme === "dark";

  useEffect(() => {
    async function fetchApplication() {
      try {
        const res = await fetch(`/api/admin-applications?id=${applicationId}`);
        const data = await res.json();
        if (res.ok && data.application) {
          setApplication(data.application);
          setNewStatus(data.application.status);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    fetchApplication();
  }, [applicationId]);

  const handleUpdateStatus = async () => {
    if (!application || newStatus === application.status) return;
    setUpdating(true);
    setMessage("");
    try {
      const res = await fetch("/api/admin-applications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: application.id, status: newStatus })
      });
      const data = await res.json();
      if (res.ok) {
        setMessage("Application status updated successfully.");
        setApplication(prev => prev ? { ...prev, status: newStatus } : prev);
      } else {
        setMessage(data.error || "Failed to update status.");
      }
    } catch {
      setMessage("Network error.");
    } finally {
      setUpdating(false);
    }
  };

  const getProgressColor = (pct: number) => {
    if (pct === 100) return "bg-emerald-500";
    if (pct >= 50) return "bg-amber-500";
    return "bg-red-500";
  };

  const getStatusStyle = (status: string) =>
    statusStyles[status] || { bg: "bg-white/10", text: "text-white/50", dot: "bg-white/50" };

  const getPaymentStatusStyle = (status: string) =>
    paymentStatusStyles[status] || { bg: "bg-white/10", text: "text-white/50" };

  const getPublicBaseUrl = () => window.location.origin + window.location.pathname;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className={`text-xs font-black uppercase tracking-[3px] ${isDark ? "text-white/40" : "text-gray-400"}`}>
          Loading Application Details...
        </p>
      </div>
    );
  }

  if (!application) {
    return (
      <div className="p-8 text-center">
        <p className="text-sm font-bold text-red-400 mb-4">Application not found.</p>
        <button onClick={onBack} className="px-4 py-2 bg-white/10 text-white rounded-xl text-xs font-black uppercase">
          ← Back to Applications
        </button>
      </div>
    );
  }

  const st = getStatusStyle(application.status);
  const pSt = getPaymentStatusStyle(application.payment_status);

  return (
    <div className="space-y-8 max-w-4xl">
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
            isDark ? "bg-white/10 text-white hover:bg-white/20" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          ← Back to Applications
        </button>
        <div className="flex items-center gap-3">
          <span className={`px-3 py-1 rounded-full text-xs font-black uppercase inline-flex items-center gap-1.5 ${st.bg} ${st.text}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
            {statusLabels[application.status] || application.status}
          </span>
          <span className={`text-xs font-black ${isDark ? "text-white/40" : "text-gray-500"}`}>
            {application.completion_percentage}% Complete
          </span>
        </div>
      </div>

      {message && (
        <div className={`px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest ${
          message.includes("success") ? "bg-green-500 text-black" : "bg-red-500 text-white"
        }`}>
          {message}
        </div>
      )}

      <div className={`bg-white/5 border border-white/10 rounded-[2.5rem] p-8 space-y-6`}>
        <div className="border-b border-white/10 pb-4">
          <span className="text-[10px] font-black text-amber-500 uppercase tracking-[4px]">Application Details</span>
          <h2 className={`text-2xl font-black uppercase tracking-tight mt-1 ${isDark ? "text-white" : "text-gray-900"}`}>
            {application.full_name}
          </h2>
          <p className={`text-xs ${isDark ? "text-white/40" : "text-gray-500"}`}>{application.email}</p>
        </div>
      </div>

      <div className={`rounded-[2.5rem] p-8 space-y-6 ${isDark ? "bg-white/5 border border-white/10" : "bg-white border border-gray-200"}`}>
        <h3 className={`text-lg font-black uppercase tracking-tight ${isDark ? "text-white" : "text-gray-900"}`}>
          User Information
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 text-xs">
          <div>
            <label className={`text-[10px] font-black uppercase tracking-widest block mb-2 ${isDark ? "text-white/30" : "text-gray-500"}`}>
              Name
            </label>
            <p className={`text-sm font-bold ${isDark ? "text-white" : "text-gray-900"}`}>{application.user_name || "—"}</p>
          </div>
          <div>
            <label className={`text-[10px] font-black uppercase tracking-widest block mb-2 ${isDark ? "text-white/30" : "text-gray-500"}`}>
              Email
            </label>
            <p className={`text-sm font-bold ${isDark ? "text-white" : "text-gray-900"}`}>{application.user_email || "—"}</p>
          </div>
          <div>
            <label className={`text-[10px] font-black uppercase tracking-widest block mb-2 ${isDark ? "text-white/30" : "text-gray-500"}`}>
              Country
            </label>
            <p className={`text-sm font-bold ${isDark ? "text-white" : "text-gray-900"}`}>{application.user_country || "—"}</p>
          </div>
          <div>
            <label className={`text-[10px] font-black uppercase tracking-widest block mb-2 ${isDark ? "text-white/30" : "text-gray-500"}`}>
              Country Code
            </label>
            <p className={`text-sm font-bold ${isDark ? "text-white" : "text-gray-900"}`}>{application.user_country_code || "—"}</p>
          </div>
          <div>
            <label className={`text-[10px] font-black uppercase tracking-widest block mb-2 ${isDark ? "text-white/30" : "text-gray-500"}`}>
              Phone
            </label>
            <p className={`text-sm font-bold ${isDark ? "text-white" : "text-gray-900"}`}>{application.user_phone || "—"}</p>
          </div>
        </div>
      </div>

      <div className={`rounded-[2.5rem] p-8 space-y-6 ${isDark ? "bg-white/5 border border-white/10" : "bg-white border border-gray-200"}`}>
        <h3 className={`text-lg font-black uppercase tracking-tight ${isDark ? "text-white" : "text-gray-900"}`}>
          Application Information
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 text-xs">
          <div className="sm:col-span-2 lg:col-span-1">
            <label className={`text-[10px] font-black uppercase tracking-widest block mb-2 ${isDark ? "text-white/30" : "text-gray-500"}`}>
              Form Completion
            </label>
            <div className="flex items-center gap-3">
              <div className={`h-2 rounded-full flex-1 max-w-[120px] ${isDark ? "bg-white/10" : "bg-gray-200"}`}>
                <div
                  className={`h-full rounded-full ${getProgressColor(application.completion_percentage)}`}
                  style={{ width: `${application.completion_percentage}%` }}
                />
              </div>
              <span className={`text-sm font-black ${isDark ? "text-white" : "text-gray-900"}`}>
                {application.completion_percentage}%
              </span>
            </div>
          </div>
          <div>
            <label className={`text-[10px] font-black uppercase tracking-widest block mb-2 ${isDark ? "text-white/30" : "text-gray-500"}`}>
              Status
            </label>
            <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase inline-flex items-center gap-1.5 ${st.bg} ${st.text}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
              {statusLabels[application.status] || application.status}
            </span>
          </div>
          <div>
            <label className={`text-[10px] font-black uppercase tracking-widest block mb-2 ${isDark ? "text-white/30" : "text-gray-500"}`}>
              Created Date
            </label>
            <p className={`text-sm font-bold ${isDark ? "text-white" : "text-gray-900"}`}>
              {new Date(application.created_at).toLocaleDateString()}
            </p>
          </div>
          <div>
            <label className={`text-[10px] font-black uppercase tracking-widest block mb-2 ${isDark ? "text-white/30" : "text-gray-500"}`}>
              Updated Date
            </label>
            <p className={`text-sm font-bold ${isDark ? "text-white" : "text-gray-900"}`}>
              {new Date(application.updated_at).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>

      <div className={`rounded-[2.5rem] p-8 space-y-6 ${isDark ? "bg-white/5 border border-white/10" : "bg-white border border-gray-200"}`}>
        <h3 className={`text-lg font-black uppercase tracking-tight ${isDark ? "text-white" : "text-gray-900"}`}>
          Payment Information
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-xs">
          <div>
            <label className={`text-[10px] font-black uppercase tracking-widest block mb-2 ${isDark ? "text-white/30" : "text-gray-500"}`}>
              Payment Status
            </label>
            <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${pSt.bg} ${pSt.text}`}>
              {application.payment_status || "—"}
            </span>
          </div>
          <div>
            <label className={`text-[10px] font-black uppercase tracking-widest block mb-2 ${isDark ? "text-white/30" : "text-gray-500"}`}>
              Amount
            </label>
            <p className={`text-sm font-bold ${isDark ? "text-white" : "text-gray-900"}`}>
              ₹{application.payment_amount || 0}
            </p>
          </div>
          <div>
            <label className={`text-[10px] font-black uppercase tracking-widest block mb-2 ${isDark ? "text-white/30" : "text-gray-500"}`}>
              Transaction ID
            </label>
            <p className={`text-sm font-mono font-bold truncate ${isDark ? "text-white/70" : "text-gray-700"}`}>
              {application.transaction_id || "—"}
            </p>
          </div>
          <div>
            <label className={`text-[10px] font-black uppercase tracking-widest block mb-2 ${isDark ? "text-white/30" : "text-gray-500"}`}>
              Plan
            </label>
            <p className={`text-sm font-bold ${isDark ? "text-white" : "text-gray-900"}`}>
              {application.plan_name || "—"}
            </p>
          </div>
        </div>
      </div>

      <div className={`rounded-[2.5rem] p-8 space-y-6 ${isDark ? "bg-white/5 border border-white/10" : "bg-white border border-gray-200"}`}>
        <h3 className={`text-lg font-black uppercase tracking-tight ${isDark ? "text-white" : "text-gray-900"}`}>
          Card Information
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-xs">
          <div>
            <label className={`text-[10px] font-black uppercase tracking-widest block mb-2 ${isDark ? "text-white/30" : "text-gray-500"}`}>
              Card Number
            </label>
            <p className={`text-sm font-mono font-bold ${isDark ? "text-white" : "text-gray-900"}`}>
              {application.card_number || "—"}
            </p>
          </div>
          <div>
            <label className={`text-[10px] font-black uppercase tracking-widest block mb-2 ${isDark ? "text-white/30" : "text-gray-500"}`}>
              QR Token
            </label>
            <p className={`text-sm font-mono font-bold truncate ${isDark ? "text-white/70" : "text-gray-700"}`}>
              {application.qr_token || "—"}
            </p>
          </div>
          <div>
            <label className={`text-[10px] font-black uppercase tracking-widest block mb-2 ${isDark ? "text-white/30" : "text-gray-500"}`}>
              Card Status
            </label>
            <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
              application.card_status === "active" ? "bg-emerald-500/10 text-emerald-400" :
              application.card_status === "inactive" ? "bg-white/10 text-white/50" :
              "bg-white/10 text-white/50"
            }`}>
              {application.card_status || "—"}
            </span>
          </div>
          <div>
            <label className={`text-[10px] font-black uppercase tracking-widest block mb-2 ${isDark ? "text-white/30" : "text-gray-500"}`}>
              Issued Date
            </label>
            <p className={`text-sm font-bold ${isDark ? "text-white" : "text-gray-900"}`}>
              {application.created_at ? new Date(application.created_at).toLocaleDateString() : "—"}
            </p>
          </div>
        </div>

        {application.card_number && application.qr_token && (
          <div className="mt-4 pt-4 border-t border-white/10">
            <label className={`text-[10px] font-black uppercase tracking-widest block mb-3 ${isDark ? "text-white/30" : "text-gray-500"}`}>
              QR Code Preview
            </label>
            <div className="bg-white p-4 rounded-xl inline-block">
              <QRCodeCanvas
                value={`${getPublicBaseUrl()}#/verify/${application.qr_token}`}
                size={140}
                level="M"
                marginSize={1}
              />
            </div>
          </div>
        )}
      </div>

      <div className={`rounded-[2.5rem] p-8 space-y-6 ${isDark ? "bg-white/5 border border-white/10" : "bg-white border border-gray-200"}`}>
        <h3 className={`text-lg font-black uppercase tracking-tight ${isDark ? "text-white" : "text-gray-900"}`}>
          Admin Actions
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
          <div>
            <label className={`text-[10px] font-black uppercase tracking-widest block mb-2 ${isDark ? "text-white/30" : "text-gray-500"}`}>
              Update Status
            </label>
            <select
              value={newStatus}
              onChange={e => setNewStatus(e.target.value)}
              className={`w-full rounded-xl px-4 py-3 font-bold outline-none ${
                isDark
                  ? "bg-slate-900 border border-white/10 text-white focus:border-amber-500/50"
                  : "bg-gray-50 border border-gray-200 text-gray-900 focus:border-amber-500/50"
              }`}
            >
              {Object.keys(statusLabels).map(key => (
                <option key={key} value={key}>{statusLabels[key]}</option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={handleUpdateStatus}
              disabled={updating || newStatus === application.status}
              className="bg-amber-500 text-black px-6 py-3 rounded-2xl font-black uppercase text-xs tracking-wider hover:bg-amber-400 transition-all disabled:opacity-50"
            >
              {updating ? "Updating..." : "Update Status"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

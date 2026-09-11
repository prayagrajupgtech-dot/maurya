import { useState, useEffect } from "react";
import { useTheme } from "../../App";

interface ApplicationItem {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  country: string;
  country_code: string;
  date_of_birth: string;
  address: string;
  completion_percentage: number;
  status: string;
  created_at: string;
  updated_at: string;
  user_name: string;
  user_email: string;
  user_country: string;
  user_country_code: string;
  plan_name: string;
  plan_price: number;
  payment_status: string;
  payment_amount: number;
  card_number: string | null;
  card_status: string | null;
}

interface AdminApplicationsProps {
  onSelectApplication: (id: string) => void;
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

export default function AdminApplications({ onSelectApplication }: AdminApplicationsProps) {
  const { theme } = useTheme();
  const [applications, setApplications] = useState<ApplicationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter && statusFilter !== "all") params.append("status", statusFilter);
      if (searchQuery) params.append("search", searchQuery);

      const response = await fetch(`/api/admin-applications?${params.toString()}`);
      const data = await response.json();
      if (response.ok) setApplications(data.applications || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, [statusFilter, searchQuery]);

  const isDark = theme === "dark";

  const getProgressColor = (pct: number) => {
    if (pct === 100) return "bg-emerald-500";
    if (pct >= 50) return "bg-amber-500";
    return "bg-red-500";
  };

  const getStatusStyle = (status: string) =>
    statusStyles[status] || { bg: "bg-white/10", text: "text-white/50", dot: "bg-white/50" };

  return (
    <div className="space-y-6">
      <div>
        <h2 className={`text-2xl font-black uppercase tracking-tight ${isDark ? "text-white" : "text-gray-900"}`}>
          Applications
        </h2>
        <p className={`text-xs ${isDark ? "text-white/40" : "text-gray-500"}`}>
          Monitor, review, and manage all user applications.
        </p>
      </div>

      <div
        className={`p-6 rounded-[2rem] grid grid-cols-1 sm:grid-cols-2 gap-4 ${
          isDark ? "bg-white/5 border border-white/10" : "bg-white border border-gray-200"
        }`}
      >
        <div>
          <label
            className={`text-[10px] font-black uppercase tracking-widest block mb-2 ${
              isDark ? "text-white/30" : "text-gray-500"
            }`}
          >
            Search
          </label>
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search Name, Email, Phone..."
            className={`w-full rounded-xl px-4 py-2.5 text-xs font-bold outline-none ${
              isDark
                ? "bg-white/5 border border-white/10 text-white focus:border-amber-500/50"
                : "bg-gray-50 border border-gray-200 text-gray-900 focus:border-amber-500/50"
            }`}
          />
        </div>
        <div>
          <label
            className={`text-[10px] font-black uppercase tracking-widest block mb-2 ${
              isDark ? "text-white/30" : "text-gray-500"
            }`}
          >
            Filter by Status
          </label>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className={`w-full rounded-xl px-4 py-2.5 text-xs font-bold outline-none ${
              isDark
                ? "bg-slate-900 border border-white/10 text-white focus:border-amber-500/50"
                : "bg-gray-50 border border-gray-200 text-gray-900 focus:border-amber-500/50"
            }`}
          >
            <option value="all">All Statuses</option>
            <option value="draft">Draft</option>
            <option value="incomplete">Incomplete</option>
            <option value="completed">Completed</option>
            <option value="submitted">Submitted</option>
            <option value="payment_pending">Payment Pending</option>
            <option value="payment_success">Payment Success</option>
            <option value="card_issued">Card Issued</option>
            <option value="card_active">Card Active</option>
            <option value="payment_failed">Payment Failed</option>
          </select>
        </div>
      </div>

      <div
        className={`rounded-[2rem] overflow-hidden ${
          isDark ? "bg-white/5 border border-white/10" : "bg-white border border-gray-200"
        }`}
      >
        {loading ? (
          <div
            className={`p-12 text-center text-xs font-black uppercase tracking-widest ${
              isDark ? "text-white/30" : "text-gray-400"
            }`}
          >
            <div className="inline-block w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
            Fetching Applications...
          </div>
        ) : applications.length === 0 ? (
          <div
            className={`p-12 text-center text-xs font-black uppercase tracking-widest ${
              isDark ? "text-white/30" : "text-gray-400"
            }`}
          >
            No applications found
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead
                className={`border-b text-[10px] font-black uppercase tracking-widest ${
                  isDark
                    ? "bg-white/5 border-white/10 text-white/40"
                    : "bg-gray-50 border-gray-200 text-gray-500"
                }`}
              >
                <tr>
                  <th className="p-5">User</th>
                  <th className="p-5">Country</th>
                  <th className="p-5">Plan</th>
                  <th className="p-5">Progress</th>
                  <th className="p-5">Application</th>
                  <th className="p-5">Payment</th>
                  <th className="p-5">Card</th>
                  <th className="p-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className={`divide-y font-semibold ${isDark ? "divide-white/5" : "divide-gray-100"}`}>
                {applications.map(a => {
                  const st = getStatusStyle(a.status);
                  return (
                    <tr key={a.id} className={`transition-colors ${isDark ? "hover:bg-white/5" : "hover:bg-gray-50"}`}>
                      <td className="p-5">
                        <p className={`font-black ${isDark ? "text-white" : "text-gray-900"}`}>{a.full_name}</p>
                        <p className={`text-[11px] font-normal ${isDark ? "text-white/40" : "text-gray-500"}`}>{a.email}</p>
                      </td>
                      <td className={`${isDark ? "text-white/70" : "text-gray-600"}`}>
                        {a.country || "N/A"}
                      </td>
                      <td className="p-5">
                        <span className="px-3 py-1 bg-amber-500/10 text-amber-400 font-black rounded-lg text-[10px] uppercase">
                          {a.plan_name || "—"}
                        </span>
                      </td>
                      <td className="p-5">
                        <div className="flex items-center gap-2">
                          <div
                            className={`h-1.5 rounded-full flex-1 max-w-[80px] ${
                              isDark ? "bg-white/10" : "bg-gray-200"
                            }`}
                          >
                            <div
                              className={`h-full rounded-full ${getProgressColor(a.completion_percentage)}`}
                              style={{ width: `${a.completion_percentage}%` }}
                            />
                          </div>
                          <span className={`text-[10px] font-black ${isDark ? "text-white/50" : "text-gray-500"}`}>
                            {a.completion_percentage}%
                          </span>
                        </div>
                      </td>
                      <td className="p-5">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase inline-flex items-center gap-1.5 ${st.bg} ${st.text}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                          {statusLabels[a.status] || a.status}
                        </span>
                      </td>
                      <td className="p-5">
                        {a.payment_amount > 0 ? (
                          <span className={`font-mono text-[11px] ${isDark ? "text-white/70" : "text-gray-600"}`}>
                            {a.payment_status === "success" ? "✓" : "—"} ₹{a.payment_amount}
                          </span>
                        ) : (
                          <span className={`${isDark ? "text-white/30" : "text-gray-400"}`}>—</span>
                        )}
                      </td>
                      <td className="p-5">
                        {a.card_number ? (
                          <span className={`font-mono text-[11px] ${isDark ? "text-white/70" : "text-gray-600"}`}>
                            •••• {a.card_number.slice(-4)}
                          </span>
                        ) : (
                          <span className={`${isDark ? "text-white/30" : "text-gray-400"}`}>—</span>
                        )}
                      </td>
                      <td className="p-5 text-right">
                        <button
                          onClick={() => onSelectApplication(a.id)}
                          className="px-3 py-1.5 bg-white/10 text-white hover:bg-white/20 rounded-lg text-[10px] font-black uppercase transition-all"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

import { useEffect, useState } from "react";

interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  blockedUsers: number;
  totalCards: number;
  usersByPlan: Record<string, number>;
  recentUsers: Array<{
    id: string;
    name: string;
    email: string;
    plan: string;
    status: string;
    created_at: string;
  }>;
  recentLogs: Array<{
    id: string;
    action: string;
    details: string;
    created_at: string;
  }>;
}

interface AdminDashboardProps {
  onNavigate: (tab: string) => void;
}

export default function AdminDashboard({ onNavigate }: AdminDashboardProps) {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchStats() {
      try {
        const response = await fetch("/api/admin-stats");
        const data = await response.json();
        if (response.ok) {
          setStats(data);
        } else {
          setError(data.error || "Failed to load admin statistics.");
        }
      } catch (err) {
        setError("Network error fetching statistics.");
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-xs font-black uppercase tracking-[3px] text-white/40">Loading Dashboard Metrics...</p>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 p-6 rounded-2xl text-center">
        <p className="text-sm font-bold text-red-300">{error || "Could not load stats."}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Dynamic Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white/5 border border-white/10 p-6 rounded-3xl relative overflow-hidden">
          <p className="text-[10px] font-black text-white/40 uppercase tracking-[3px]">Total Users</p>
          <p className="text-4xl font-black mt-3 text-white">{stats.totalUsers}</p>
          <div className="absolute right-4 bottom-4 text-3xl opacity-20">👥</div>
        </div>

        <div className="bg-emerald-500/10 border border-emerald-500/20 p-6 rounded-3xl relative overflow-hidden">
          <p className="text-[10px] font-black text-emerald-400 uppercase tracking-[3px]">Active Users</p>
          <p className="text-4xl font-black mt-3 text-emerald-400">{stats.activeUsers}</p>
          <div className="absolute right-4 bottom-4 text-3xl opacity-20">✅</div>
        </div>

        <div className="bg-red-500/10 border border-red-500/20 p-6 rounded-3xl relative overflow-hidden">
          <p className="text-[10px] font-black text-red-400 uppercase tracking-[3px]">Blocked Users</p>
          <p className="text-4xl font-black mt-3 text-red-400">{stats.blockedUsers}</p>
          <div className="absolute right-4 bottom-4 text-3xl opacity-20">🚫</div>
        </div>

        <div className="bg-amber-500/10 border border-amber-500/20 p-6 rounded-3xl relative overflow-hidden">
          <p className="text-[10px] font-black text-amber-500 uppercase tracking-[3px]">Total Cards</p>
          <p className="text-4xl font-black mt-3 text-amber-500">{stats.totalCards}</p>
          <div className="absolute right-4 bottom-4 text-3xl opacity-20">🪪</div>
        </div>
      </div>

      {/* Plan-wise Breakdown */}
      <div className="bg-white/5 border border-white/10 rounded-[2rem] p-6 sm:p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-black uppercase tracking-tight">Users by Plan Summary</h2>
          <button
            onClick={() => onNavigate("plans")}
            className="text-xs font-black uppercase text-amber-500 tracking-wider hover:underline"
          >
            Manage Plans →
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {Object.entries(stats.usersByPlan).map(([planName, count]) => (
            <div key={planName} className="bg-black/30 border border-white/10 p-5 rounded-2xl flex items-center justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-wider text-white/50">{planName} Plan</p>
                <p className="text-2xl font-black mt-1 text-white">{count} Users</p>
              </div>
              <span className="text-xl">💎</span>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Users & Recent Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Users */}
        <div className="bg-white/5 border border-white/10 rounded-[2rem] p-6 sm:p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-base font-black uppercase tracking-tight">Recent Registered Users</h2>
            <button
              onClick={() => onNavigate("users")}
              className="text-xs font-black uppercase text-amber-500 tracking-wider hover:underline"
            >
              View All →
            </button>
          </div>

          <div className="space-y-3">
            {stats.recentUsers.length > 0 ? (
              stats.recentUsers.map(user => (
                <div key={user.id} className="bg-black/20 border border-white/5 p-4 rounded-xl flex items-center justify-between text-xs">
                  <div>
                    <p className="font-black text-white">{user.name}</p>
                    <p className="text-white/40">{user.email}</p>
                  </div>
                  <div className="text-right">
                    <span className="px-2.5 py-1 bg-amber-500/10 text-amber-400 font-black rounded-lg text-[10px] uppercase">
                      {user.plan}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-white/40">No recent users.</p>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white/5 border border-white/10 rounded-[2rem] p-6 sm:p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-base font-black uppercase tracking-tight">Recent Activity Logs</h2>
            <button
              onClick={() => onNavigate("activity")}
              className="text-xs font-black uppercase text-amber-500 tracking-wider hover:underline"
            >
              Full Logs →
            </button>
          </div>

          <div className="space-y-3">
            {stats.recentLogs.length > 0 ? (
              stats.recentLogs.map(log => (
                <div key={log.id} className="bg-black/20 border border-white/5 p-4 rounded-xl text-xs space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="font-black text-amber-400 uppercase tracking-wider">{log.action}</span>
                    <span className="text-[10px] text-white/30">{new Date(log.created_at).toLocaleDateString()}</span>
                  </div>
                  <p className="text-white/60 text-[11px]">{log.details}</p>
                </div>
              ))
            ) : (
              <p className="text-xs text-white/40">No recent activity.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

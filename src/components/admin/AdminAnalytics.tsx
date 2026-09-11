import { useState, useEffect } from "react";
import { useTheme } from "../../App";

const TIME_RANGES = [
  { value: "today", label: "Today" },
  { value: "week", label: "This Week" },
  { value: "month", label: "This Month" },
  { value: "last_month", label: "Last Month" },
  { value: "year", label: "This Year" },
  { value: "last_year", label: "Last Year" },
  { value: "all", label: "All Time" },
];

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const currentYear = new Date().getFullYear();
const YEARS = [currentYear - 2, currentYear - 1, currentYear, currentYear + 1];

interface BarChartItem {
  label: string;
  value: number;
  color?: string;
}

function BarChart({ items, maxValue: maxOverride, color = "bg-amber-500", isDark }: {
  items: BarChartItem[];
  maxValue?: number;
  color?: string;
  isDark: boolean;
}) {
  const maxValue = maxOverride || Math.max(...items.map(i => i.value), 1);
  const textMain = isDark ? "text-white" : "text-gray-900";
  const textSub = isDark ? "text-white/40" : "text-gray-500";

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item.label} className="flex items-center gap-3">
          <span className={`text-xs w-16 text-right ${textSub}`}>{item.label}</span>
          <div className={`flex-1 h-6 ${isDark ? "bg-white/5" : "bg-gray-100"} rounded-lg overflow-hidden`}>
            <div
              className={`h-full ${item.color || color} rounded-lg transition-all`}
              style={{ width: `${(item.value / maxValue) * 100}%` }}
            />
          </div>
          <span className={`text-xs font-bold w-12 ${textMain}`}>{item.value}</span>
        </div>
      ))}
    </div>
  );
}

function ProgressBar({ label, value, total, color = "bg-amber-500", isDark }: {
  label: string;
  value: number;
  total: number;
  color?: string;
  isDark: boolean;
}) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  const textMain = isDark ? "text-white" : "text-gray-900";
  const textSub = isDark ? "text-white/40" : "text-gray-500";

  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center">
        <span className={`text-xs font-bold ${textMain}`}>{label}</span>
        <span className={`text-xs ${textSub}`}>{value} ({pct}%)</span>
      </div>
      <div className={`h-3 ${isDark ? "bg-white/5" : "bg-gray-100"} rounded-full overflow-hidden`}>
        <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="bg-white/5 border border-white/10 rounded-[2rem] p-5 animate-pulse">
      <div className="h-3 w-20 bg-white/10 rounded mb-3" />
      <div className="h-8 w-16 bg-white/10 rounded mb-2" />
      <div className="h-2 w-24 bg-white/10 rounded" />
    </div>
  );
}

function SkeletonChart() {
  return (
    <div className="bg-white/5 border border-white/10 rounded-[2rem] p-6 animate-pulse">
      <div className="h-4 w-32 bg-white/10 rounded mb-6" />
      <div className="space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="h-3 w-16 bg-white/10 rounded" />
            <div className="flex-1 h-6 bg-white/10 rounded-lg" />
            <div className="h-3 w-10 bg-white/10 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AdminAnalytics() {
  const { theme } = useTheme();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [filtering, setFiltering] = useState(false);
  const [error, setError] = useState("");
  const [timeRange, setTimeRange] = useState<"today" | "week" | "month" | "last_month" | "year" | "last_year" | "all">("month");
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());

  const isDark = theme === "dark";
  const card = isDark ? "bg-white/5 border-white/10" : "bg-white border-gray-200";
  const textMain = isDark ? "text-white" : "text-gray-900";
  const textSub = isDark ? "text-white/40" : "text-gray-500";
  const innerCard = isDark ? "bg-black/30 border-white/5" : "bg-gray-50 border-gray-200";

  useEffect(() => {
    let cancelled = false;
    async function fetchStats() {
      if (stats !== null) setFiltering(true);
      setError("");
      try {
        const params = new URLSearchParams({
          range: timeRange,
          year: String(selectedYear),
          month: String(selectedMonth),
        });
        const response = await fetch(`/api/admin-analytics?${params}`);
        const data = await response.json();
        if (!cancelled) {
          if (response.ok) setStats(data);
          else setError(data.error || "Failed to load analytics.");
        }
      } catch {
        if (!cancelled) setError("Network error fetching analytics.");
      } finally {
        if (!cancelled) {
          setLoading(false);
          setFiltering(false);
        }
      }
    }
    fetchStats();
    return () => { cancelled = true; };
  }, [timeRange, selectedYear, selectedMonth]);

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="flex flex-wrap items-center gap-4">
          <div className="h-10 w-40 bg-white/5 rounded-xl animate-pulse" />
          <div className="h-10 w-32 bg-white/5 rounded-xl animate-pulse" />
          <div className="h-10 w-36 bg-white/5 rounded-xl animate-pulse" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => <SkeletonCard key={i} />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => <SkeletonChart key={i} />)}
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 p-6 rounded-[2rem] text-center">
        <p className="text-sm font-bold text-red-300">{error || "Could not load analytics data."}</p>
      </div>
    );
  }

  const totalUsers = stats.totalUsers ?? 0;
  const activeUsers = stats.activeUsers ?? 0;
  const blockedUsers = stats.blockedUsers ?? 0;
  const inactiveUsers = totalUsers - activeUsers;
  const totalCards = stats.totalCards ?? 0;
  const activeCards = stats.activeCards ?? 0;
  const expiredCards = stats.expiredCards ?? 0;
  const totalApplications = stats.totalApplications ?? 0;
  const completedApplications = stats.completedApplications ?? 0;
  const pendingApplications = stats.pendingApplications ?? 0;
  const draftApplications = totalApplications - completedApplications - pendingApplications;
  const totalPayments = stats.totalPayments ?? 0;
  const successfulPayments = stats.successfulPayments ?? 0;
  const failedPayments = stats.failedPayments ?? 0;
  const pendingPayments = stats.pendingPayments ?? 0;
  const totalRevenue = stats.totalRevenue ?? 0;
  const thisMonthRevenue = stats.thisMonthRevenue ?? 0;

  const usersByCountry: Record<string, number> = stats.usersByCountry ?? {};
  const usersByPlan: Record<string, number> = stats.usersByPlan ?? {};
  const monthlyUsers: Array<{ month: string; count: number }> = stats.monthlyUsers ?? [];
  const monthlyRevenue: Array<{ month: string; amount: number }> = stats.monthlyRevenue ?? [];
  const monthlyApplications: Array<{ month: string; count: number }> = stats.monthlyApplications ?? [];

  const summaryCards = [
    { icon: "👥", label: "Total Users", value: totalUsers, color: "text-blue-400" },
    { icon: "✅", label: "Active Users", value: activeUsers, color: "text-green-400" },
    { icon: "📝", label: "Applications", value: totalApplications, color: "text-purple-400" },
    { icon: "🪪", label: "Total Cards", value: totalCards, color: "text-cyan-400" },
    { icon: "💰", label: "Revenue", value: `₹${totalRevenue.toLocaleString("en-IN")}`, color: "text-amber-400" },
    { icon: "⏳", label: "Pending Payments", value: pendingPayments, color: "text-orange-400" },
  ];

  const usersByPlanItems = Object.entries(usersByPlan)
    .filter(([, v]) => v > 0)
    .map(([label, value]) => ({ label, value }));

  const usersByCountryItems = Object.entries(usersByCountry)
    .filter(([, v]) => v > 0)
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value);

  const monthlyUsersItems = monthlyUsers.map((m) => ({ label: m.month, value: m.count }));
  const monthlyRevenueItems = monthlyRevenue.map((m) => ({ label: m.month, value: m.amount }));
  const monthlyApplicationsItems = monthlyApplications.map((m) => ({ label: m.month, value: m.count }));

  const planColors: Record<string, string> = {
    Basic: "bg-blue-500",
    Standard: "bg-purple-500",
    Premium: "bg-amber-500",
    Unassigned: "bg-gray-500",
  };

  const isMonthMode = timeRange === "month" || timeRange === "last_month";

  return (
    <div className="space-y-8">
      {/* Header with Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <div>
          <h2 className={`text-xl font-black uppercase tracking-widest ${textMain}`}>Analysis</h2>
          {stats.reportLabel && (
            <p className={`text-xs font-bold ${textSub} mt-1`}>{stats.reportLabel}</p>
          )}
        </div>
        {filtering && (
          <span className={`text-xs font-bold ${textSub} animate-pulse`}>Updating...</span>
        )}
        <div className="flex flex-wrap gap-3 ml-auto">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as any)}
            className={`${card} border px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider ${textMain} focus:outline-none focus:ring-2 focus:ring-amber-500/50`}
          >
            {TIME_RANGES.map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            disabled={timeRange === "today" || timeRange === "week" || timeRange === "all"}
            className={`${card} border px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider ${textMain} focus:outline-none focus:ring-2 focus:ring-amber-500/50 disabled:opacity-40 disabled:cursor-not-allowed`}
          >
            {YEARS.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
            disabled={!isMonthMode}
            className={`${card} border px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider ${textMain} focus:outline-none focus:ring-2 focus:ring-amber-500/50 disabled:opacity-40 disabled:cursor-not-allowed`}
          >
            {MONTHS.map((m, i) => (
              <option key={i} value={i}>{m}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {summaryCards.map((c) => (
          <div key={c.label} className={`${card} border p-5 rounded-[2rem] relative overflow-hidden`}>
            <p className={`text-[10px] font-black ${textSub} uppercase tracking-[3px]`}>{c.label}</p>
            <p className={`text-3xl font-black mt-2 ${c.color}`}>{c.value}</p>
            <div className="absolute right-4 bottom-4 text-2xl opacity-20">{c.icon}</div>
          </div>
        ))}
      </div>

      {/* User Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* New Users by Month */}
        {monthlyUsersItems.length > 0 && (
          <div className={`${card} border rounded-[2rem] p-6`}>
            <h3 className={`text-[10px] font-black ${textSub} uppercase tracking-[3px] mb-6`}>New Users by Month</h3>
            <BarChart items={monthlyUsersItems} isDark={isDark} color="bg-blue-500" />
          </div>
        )}

        {/* Active vs Inactive Users */}
        <div className={`${card} border rounded-[2rem] p-6`}>
          <h3 className={`text-[10px] font-black ${textSub} uppercase tracking-[3px] mb-6`}>Active vs Inactive Users</h3>
          <div className="space-y-4">
            <ProgressBar label="Active Users" value={activeUsers} total={totalUsers} color="bg-green-500" isDark={isDark} />
            <ProgressBar label="Inactive Users" value={inactiveUsers} total={totalUsers} color="bg-gray-500" isDark={isDark} />
            <ProgressBar label="Blocked Users" value={blockedUsers} total={totalUsers} color="bg-red-500" isDark={isDark} />
          </div>
        </div>

        {/* Users by Country */}
        {usersByCountryItems.length > 0 && (
          <div className={`${card} border rounded-[2rem] p-6`}>
            <h3 className={`text-[10px] font-black ${textSub} uppercase tracking-[3px] mb-6`}>Users by Country</h3>
            <BarChart items={usersByCountryItems} isDark={isDark} color="bg-cyan-500" />
          </div>
        )}

        {/* Plan Distribution */}
        {usersByPlanItems.length > 0 && (
          <div className={`${card} border rounded-[2rem] p-6`}>
            <h3 className={`text-[10px] font-black ${textSub} uppercase tracking-[3px] mb-6`}>Plan Distribution</h3>
            <div className="space-y-4">
              {usersByPlanItems.map((item) => (
                <ProgressBar
                  key={item.label}
                  label={item.label}
                  value={item.value}
                  total={totalUsers}
                  color={planColors[item.label] || "bg-amber-500"}
                  isDark={isDark}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Application Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Applications by Status */}
        <div className={`${card} border rounded-[2rem] p-6`}>
          <h3 className={`text-[10px] font-black ${textSub} uppercase tracking-[3px] mb-6`}>Applications by Status</h3>
          <div className="space-y-4">
            <ProgressBar label="Completed" value={completedApplications} total={totalApplications} color="bg-green-500" isDark={isDark} />
            <ProgressBar label="Pending" value={pendingApplications} total={totalApplications} color="bg-amber-500" isDark={isDark} />
            {draftApplications > 0 && (
              <ProgressBar label="Draft" value={draftApplications} total={totalApplications} color="bg-gray-500" isDark={isDark} />
            )}
          </div>
        </div>

        {/* Monthly Applications */}
        {monthlyApplicationsItems.length > 0 && (
          <div className={`${card} border rounded-[2rem] p-6`}>
            <h3 className={`text-[10px] font-black ${textSub} uppercase tracking-[3px] mb-6`}>Monthly Applications</h3>
            <BarChart items={monthlyApplicationsItems} isDark={isDark} color="bg-purple-500" />
          </div>
        )}
      </div>

      {/* Revenue Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Revenue */}
        {monthlyRevenueItems.length > 0 && (
          <div className={`${card} border rounded-[2rem] p-6`}>
            <h3 className={`text-[10px] font-black ${textSub} uppercase tracking-[3px] mb-6`}>Monthly Revenue</h3>
            <BarChart items={monthlyRevenueItems} isDark={isDark} color="bg-amber-500" />
          </div>
        )}

        {/* Payment Success vs Failed */}
        <div className={`${card} border rounded-[2rem] p-6`}>
          <h3 className={`text-[10px] font-black ${textSub} uppercase tracking-[3px] mb-6`}>Payment Status</h3>
          <div className="space-y-4">
            <ProgressBar label="Successful" value={successfulPayments} total={totalPayments} color="bg-green-500" isDark={isDark} />
            <ProgressBar label="Failed" value={failedPayments} total={totalPayments} color="bg-red-500" isDark={isDark} />
            <ProgressBar label="Pending" value={pendingPayments} total={totalPayments} color="bg-amber-500" isDark={isDark} />
          </div>
          {thisMonthRevenue > 0 && (
            <div className={`mt-6 ${innerCard} border rounded-xl p-4 text-center`}>
              <p className={`text-[10px] font-black ${textSub} uppercase tracking-[3px]`}>This Month</p>
              <p className="text-2xl font-black text-amber-400 mt-1">₹{thisMonthRevenue.toLocaleString("en-IN")}</p>
            </div>
          )}
        </div>
      </div>

      {/* Card Analytics */}
      <div className={`${card} border rounded-[2rem] p-6`}>
        <h3 className={`text-[10px] font-black ${textSub} uppercase tracking-[3px] mb-6`}>Cards by Status</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className={`${innerCard} border rounded-xl p-5 text-center`}>
            <p className="text-3xl font-black text-green-400">{activeCards}</p>
            <p className={`text-xs font-bold ${textSub} mt-1`}>Active</p>
          </div>
          <div className={`${innerCard} border rounded-xl p-5 text-center`}>
            <p className="text-3xl font-black text-amber-400">{expiredCards}</p>
            <p className={`text-xs font-bold ${textSub} mt-1`}>Expired</p>
          </div>
          <div className={`${innerCard} border rounded-xl p-5 text-center`}>
            <p className="text-3xl font-black text-red-400">{totalCards - activeCards - expiredCards}</p>
            <p className={`text-xs font-bold ${textSub} mt-1`}>Blocked</p>
          </div>
        </div>
      </div>
    </div>
  );
}

import { jsonResponse } from "./_shared/http.js";
import { verifyAdminSession } from "./admin-session.js";
import {
  getAllUsers, getAllCards, getAllApplications, getAllPayments, getAllPlans
} from "./_shared/store.js";

function computeUsersByCountry(users: { country?: string }[]): Record<string, number> {
  const map: Record<string, number> = {};
  for (const u of users) {
    const key = u.country || "Unknown";
    map[key] = (map[key] || 0) + 1;
  }
  return map;
}

function computeUsersByPlan(users: { plan_id: string | null }[], plans: { id: string; name: string }[]): Record<string, number> {
  const planMap = new Map(plans.map(p => [p.id, p.name]));
  const map: Record<string, number> = {};
  for (const u of users) {
    const name = u.plan_id ? (planMap.get(u.plan_id) || "Unknown") : "Free";
    map[name] = (map[name] || 0) + 1;
  }
  return map;
}

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function computeMonthly(records: { created_at: string }[], year: number) {
  const counts = Array(12).fill(0);
  for (const r of records) {
    const d = new Date(r.created_at);
    if (d.getFullYear() === year) counts[d.getMonth()]++;
  }
  return MONTH_NAMES.map((name, i) => ({ month: name, count: counts[i] }));
}

function computeMonthlyRevenue(payments: { status: string; amount: number; created_at: string }[], year: number) {
  const totals = Array(12).fill(0);
  for (const p of payments) {
    if (p.status === "success") {
      const d = new Date(p.created_at);
      if (d.getFullYear() === year) totals[d.getMonth()] += p.amount / 100;
    }
  }
  return MONTH_NAMES.map((name, i) => ({ month: name, amount: totals[i] }));
}

export default async (request: Request) => {
  if (request.method !== "GET") return jsonResponse({ error: "Method not allowed." }, 405);

  const admin = await verifyAdminSession(request);
  if (!admin) return jsonResponse({ error: "Admin authentication required." }, 401);

  const url = new URL(request.url);
  const range = url.searchParams.get("range") || "month";
  const year = parseInt(url.searchParams.get("year") || String(new Date().getFullYear()));
  const month = parseInt(url.searchParams.get("month") || String(new Date().getMonth()));

  const now = new Date();

  let startDate: Date;
  switch (range) {
    case "today":
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      break;
    case "week":
      startDate = new Date(now.getTime() - 7 * 86400000);
      break;
    case "month":
      startDate = new Date(year, month, 1);
      break;
    case "last_month":
      startDate = new Date(year, month - 1, 1);
      break;
    case "year":
      startDate = new Date(year, 0, 1);
      break;
    default:
      startDate = new Date(0);
  }
  const endDate = range === "last_month" ? new Date(year, month, 1) : now;

  const [users, cards, applications, payments, plans] = await Promise.all([
    getAllUsers(),
    getAllCards(),
    getAllApplications(),
    getAllPayments(),
    getAllPlans(),
  ]);

  const filteredUsers = users.filter(u => {
    const d = new Date(u.created_at);
    return d >= startDate && d <= endDate;
  });

  return jsonResponse({
    totalUsers: users.length,
    activeUsers: users.filter(u => u.status === "active").length,
    blockedUsers: users.filter(u => u.status === "blocked").length,
    newUsersThisMonth: filteredUsers.length,
    totalCards: cards.length,
    activeCards: cards.filter(c => c.status === "active").length,
    expiredCards: cards.filter(c => c.status === "expired").length,
    totalApplications: applications.length,
    completedApplications: applications.filter(a => a.completion_percentage === 100).length,
    pendingApplications: applications.filter(a => a.status === "draft" || a.status === "incomplete").length,
    totalPayments: payments.length,
    successfulPayments: payments.filter(p => p.status === "success").length,
    failedPayments: payments.filter(p => p.status === "failed").length,
    pendingPayments: payments.filter(p => p.status === "pending" || p.status === "created").length,
    totalRevenue: payments.filter(p => p.status === "success").reduce((sum, p) => sum + (p.amount / 100), 0),
    thisMonthRevenue: payments.filter(p => p.status === "success" && new Date(p.created_at) >= startDate && new Date(p.created_at) <= endDate).reduce((sum, p) => sum + (p.amount / 100), 0),
    usersByCountry: computeUsersByCountry(users),
    usersByPlan: computeUsersByPlan(users, plans),
    monthlyUsers: computeMonthly(users, year),
    monthlyRevenue: computeMonthlyRevenue(payments, year),
    monthlyApplications: computeMonthly(applications, year),
  });
};

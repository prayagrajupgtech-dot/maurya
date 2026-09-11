import { jsonResponse } from "./_shared/http.js";
import { requireAdmin } from "./_shared/admin-auth.js";
import { getAllUsers, getAllCards, getAllPlans, getLogs, getAllApplications, getAllPayments, getUnreadNotificationCount } from "./_shared/store.js";

export default async (request: Request) => {
  if (request.method !== "GET") {
    return jsonResponse({ error: "Method not allowed." }, 405);
  }

  const unauthorized = await requireAdmin(request);
  if (unauthorized) return unauthorized;

  try {
    const users = await getAllUsers();
    const cards = await getAllCards();
    const plans = await getAllPlans();
    const logs = await getLogs();
    const applications = await getAllApplications();
    const payments = await getAllPayments();
    const unreadNotifications = await getUnreadNotificationCount();

    const totalUsers = users.length;
    const activeUsers = users.filter(u => u.status === "active").length;
    const blockedUsers = users.filter(u => u.status === "blocked").length;
    const totalCards = cards.length;
    const totalApplications = applications.length;
    const pendingApplications = applications.filter(a => ["draft", "incomplete", "submitted"].includes(a.status)).length;
    const completedApplications = applications.filter(a => ["completed", "submitted"].includes(a.status)).length;
    const totalPayments = payments.length;
    const successfulPayments = payments.filter(p => p.status === "success").length;
    const pendingPayments = payments.filter(p => ["created", "pending"].includes(p.status)).length;
    const activeCards = cards.filter(c => c.status === "active").length;

    const planMap: Record<string, string> = {};
    plans.forEach(p => { planMap[p.id] = p.name; });

    const usersByPlan: Record<string, number> = {};
    plans.forEach(p => { usersByPlan[p.name] = 0; });
    usersByPlan["Unassigned"] = 0;

    users.forEach(u => {
      const planName = u.plan_id ? planMap[u.plan_id] || "Unknown Plan" : "Unassigned";
      usersByPlan[planName] = (usersByPlan[planName] || 0) + 1;
    });

    const recentUsers = users.slice(0, 5).map(u => ({
      id: u.id,
      name: u.display_name,
      email: u.email,
      plan: u.plan_id ? planMap[u.plan_id] || "Unassigned" : "Unassigned",
      status: u.status,
      created_at: u.created_at
    }));

    const recentApplications = applications.slice(0, 5).map(a => ({
      id: a.id,
      full_name: a.full_name,
      status: a.status,
      completion_percentage: a.completion_percentage,
      created_at: a.created_at
    }));

    const recentPayments = payments.slice(0, 5).map(p => ({
      id: p.id,
      amount: p.amount,
      status: p.status,
      created_at: p.created_at
    }));

    const recentLogs = logs.slice(0, 5);

    return jsonResponse({
      totalUsers,
      activeUsers,
      blockedUsers,
      totalCards,
      activeCards,
      totalApplications,
      pendingApplications,
      completedApplications,
      totalPayments,
      successfulPayments,
      pendingPayments,
      unreadNotifications,
      usersByPlan,
      recentUsers,
      recentApplications,
      recentPayments,
      recentLogs
    }, 200);
  } catch (error) {
    console.error("admin-stats error", error);
    return jsonResponse({ error: "Could not fetch admin stats." }, 500);
  }
};

import { jsonResponse } from "./_shared/http.js";
import { requireAdmin } from "./_shared/admin-auth.js";
import { getAllUsers, getAllCards, getAllPlans, getLogs } from "./_shared/store.js";

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

    const totalUsers = users.length;
    const activeUsers = users.filter(u => u.status === "active").length;
    const blockedUsers = users.filter(u => u.status === "blocked").length;
    const totalCards = cards.length;

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

    const recentLogs = logs.slice(0, 5);

    return jsonResponse({
      totalUsers,
      activeUsers,
      blockedUsers,
      totalCards,
      usersByPlan,
      recentUsers,
      recentLogs
    }, 200);
  } catch (error) {
    console.error("admin-stats error", error);
    return jsonResponse({ error: "Could not fetch admin stats." }, 500);
  }
};

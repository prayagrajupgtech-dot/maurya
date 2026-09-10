import { jsonResponse, readJsonBody } from "./_shared/http.js";
import { requireAdmin } from "./_shared/admin-auth.js";
import { getAllUsers, saveUser, logAdminAction, getAllPlans, getCardsByUserId } from "./_shared/store.js";

export default async (request: Request) => {
  const unauthorized = await requireAdmin(request);
  if (unauthorized) return unauthorized;

  const url = new URL(request.url);

  if (request.method === "GET") {
    try {
      let users = await getAllUsers();
      const plans = await getAllPlans();
      const planMap: Record<string, string> = {};
      plans.forEach(p => { planMap[p.id] = p.name; });

      const query = url.searchParams.get("query")?.toLowerCase().trim() || "";
      const planFilter = url.searchParams.get("plan") || "";
      const statusFilter = url.searchParams.get("status") || "";
      const sortBy = url.searchParams.get("sort") || "newest";

      if (query) {
        users = users.filter(u =>
          u.display_name.toLowerCase().includes(query) ||
          u.email.toLowerCase().includes(query) ||
          u.phone.includes(query)
        );
      }

      if (planFilter) {
        users = users.filter(u => u.plan_id === planFilter);
      }

      if (statusFilter) {
        users = users.filter(u => u.status === statusFilter);
      }

      if (sortBy === "oldest") {
        users.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      } else if (sortBy === "name") {
        users.sort((a, b) => a.display_name.localeCompare(b.display_name));
      } else {
        users.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      }

      const usersWithDetails = await Promise.all(users.map(async u => {
        const userCards = await getCardsByUserId(u.id);
        return {
          id: u.id,
          name: u.display_name,
          email: u.email,
          phone: u.phone,
          planId: u.plan_id,
          planName: u.plan_id ? planMap[u.plan_id] || "Unassigned" : "Unassigned",
          status: u.status,
          cardsCount: userCards.length,
          createdAt: u.created_at,
          lastLogin: u.last_login_at
        };
      }));

      return jsonResponse({ users: usersWithDetails }, 200);
    } catch (error) {
      console.error("admin-users GET error", error);
      return jsonResponse({ error: "Could not fetch users." }, 500);
    }
  }

  if (request.method === "POST") {
    try {
      const body = await readJsonBody(request);
      const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
      const name = typeof body.name === "string" ? body.name.trim() : "";
      const phone = typeof body.phone === "string" ? body.phone.trim() : "";
      const planId = typeof body.planId === "string" ? body.planId : null;

      if (!email || !name) {
        return jsonResponse({ error: "Email and Name are required." }, 400);
      }

      const newUser = await saveUser({
        email,
        display_name: name,
        phone,
        plan_id: planId,
        role: "user",
        status: "active"
      });

      await logAdminAction("User Created", "admin", newUser.id, `Created user ${name} (${email}) with plan ${planId || "default"}`);

      return jsonResponse({ user: newUser }, 201);
    } catch (error) {
      console.error("admin-users POST error", error);
      return jsonResponse({ error: "Could not create user." }, 500);
    }
  }

  return jsonResponse({ error: "Method not allowed." }, 405);
};

import { jsonResponse, readJsonBody } from "./_shared/http.js";
import { requireAdmin } from "./_shared/admin-auth.js";
import { getUserById, saveUser, getCardsByUserId, getPlanById, logAdminAction } from "./_shared/store.js";

export default async (request: Request) => {
  const unauthorized = await requireAdmin(request);
  if (unauthorized) return unauthorized;

  const url = new URL(request.url);
  const userId = url.searchParams.get("id");

  if (request.method === "GET") {
    if (!userId) return jsonResponse({ error: "User ID is required." }, 400);

    try {
      const user = await getUserById(userId);
      if (!user) return jsonResponse({ error: "User not found." }, 404);

      const cards = await getCardsByUserId(userId);
      const plan = user.plan_id ? await getPlanById(user.plan_id) : null;

      return jsonResponse({
        user: {
          id: user.id,
          name: user.display_name,
          email: user.email,
          phone: user.phone,
          status: user.status,
          role: user.role,
          planId: user.plan_id,
          planName: plan?.name || "Unassigned",
          planCardLimit: plan?.card_limit ?? 0,
          createdAt: user.created_at,
          lastLogin: user.last_login_at
        },
        cards,
        plan
      }, 200);
    } catch (error) {
      console.error("admin-user-detail GET error", error);
      return jsonResponse({ error: "Could not fetch user details." }, 500);
    }
  }

  if (request.method === "PATCH") {
    try {
      const body = await readJsonBody(request);
      const targetId = body.id || userId;
      if (!targetId) return jsonResponse({ error: "User ID is required." }, 400);

      const user = await getUserById(targetId);
      if (!user) return jsonResponse({ error: "User not found." }, 404);

      const updates: Record<string, any> = { id: targetId };
      if (typeof body.name === "string") updates.display_name = body.name.trim();
      if (typeof body.phone === "string") updates.phone = body.phone.trim();
      if (typeof body.planId === "string") updates.plan_id = body.planId;
      if (typeof body.status === "string" && ["active", "blocked"].includes(body.status)) {
        updates.status = body.status;
      }

      const updatedUser = await saveUser(updates);

      if (body.status && body.status !== user.status) {
        const actionText = body.status === "blocked" ? "User Blocked" : "User Unblocked";
        await logAdminAction(actionText, "admin", targetId, `${actionText} ${user.display_name} (${user.email})`);
      }

      if (body.planId && body.planId !== user.plan_id) {
        await logAdminAction("Plan Assigned", "admin", targetId, `Assigned plan ${body.planId} to ${user.display_name}`);
      }

      return jsonResponse({ user: updatedUser }, 200);
    } catch (error) {
      console.error("admin-user-detail PATCH error", error);
      return jsonResponse({ error: "Could not update user." }, 500);
    }
  }

  if (request.method === "DELETE") {
    if (!userId) return jsonResponse({ error: "User ID is required." }, 400);

    try {
      const user = await getUserById(userId);
      if (!user) return jsonResponse({ error: "User not found." }, 404);

      await saveUser({ id: userId, status: "deleted" });
      await logAdminAction("User Deleted", "admin", userId, `Deleted user ${user.display_name} (${user.email})`);

      return jsonResponse({ message: "User deleted successfully." }, 200);
    } catch (error) {
      console.error("admin-user-detail DELETE error", error);
      return jsonResponse({ error: "Could not delete user." }, 500);
    }
  }

  return jsonResponse({ error: "Method not allowed." }, 405);
};

import { jsonResponse, readJsonBody } from "./_shared/http.js";
import { requireAdmin } from "./_shared/admin-auth.js";
import { getAllPlans, savePlan, deletePlanStore, logAdminAction } from "./_shared/store.js";

export default async (request: Request) => {
  const unauthorized = await requireAdmin(request);
  if (unauthorized) return unauthorized;

  if (request.method === "GET") {
    try {
      const plans = await getAllPlans();
      return jsonResponse({ plans }, 200);
    } catch (error) {
      console.error("admin-plans GET error", error);
      return jsonResponse({ error: "Could not fetch plans." }, 500);
    }
  }

  if (request.method === "POST") {
    try {
      const body = await readJsonBody(request);
      const name = typeof body.name === "string" ? body.name.trim() : "";
      const price = typeof body.price === "number" ? body.price : parseFloat(body.price || 0);
      const duration_days = typeof body.duration_days === "number" ? body.duration_days : parseInt(body.duration_days || 30, 10);
      const card_limit = typeof body.card_limit === "number" ? body.card_limit : parseInt(body.card_limit || 100, 10);
      const status = body.status === "inactive" ? "inactive" : "active";

      if (!name) return jsonResponse({ error: "Plan name is required." }, 400);

      const plan = await savePlan({ name, price, duration_days, card_limit, status });
      await logAdminAction("Plan Created", "admin", null, `Created plan ${name} (₹${price}, ${card_limit} cards)`);

      return jsonResponse({ plan }, 201);
    } catch (error) {
      console.error("admin-plans POST error", error);
      return jsonResponse({ error: "Could not create plan." }, 500);
    }
  }

  if (request.method === "PATCH") {
    try {
      const body = await readJsonBody(request);
      if (!body.id) return jsonResponse({ error: "Plan ID is required." }, 400);

      const updates: Record<string, any> = { id: body.id };
      if (typeof body.name === "string") updates.name = body.name.trim();
      if (typeof body.price !== "undefined") updates.price = Number(body.price);
      if (typeof body.duration_days !== "undefined") updates.duration_days = Number(body.duration_days);
      if (typeof body.card_limit !== "undefined") updates.card_limit = Number(body.card_limit);
      if (typeof body.status === "string") updates.status = body.status;

      const plan = await savePlan(updates);
      await logAdminAction("Plan Updated", "admin", null, `Updated plan ${plan.name}`);

      return jsonResponse({ plan }, 200);
    } catch (error) {
      console.error("admin-plans PATCH error", error);
      return jsonResponse({ error: "Could not update plan." }, 500);
    }
  }

  if (request.method === "DELETE") {
    const url = new URL(request.url);
    const planId = url.searchParams.get("id");
    if (!planId) return jsonResponse({ error: "Plan ID is required." }, 400);

    try {
      const deleted = await deletePlanStore(planId);
      if (!deleted) return jsonResponse({ error: "Plan not found." }, 404);

      await logAdminAction("Plan Deleted", "admin", null, `Deleted plan ID ${planId}`);
      return jsonResponse({ message: "Plan deleted successfully." }, 200);
    } catch (error) {
      console.error("admin-plans DELETE error", error);
      return jsonResponse({ error: "Could not delete plan." }, 500);
    }
  }

  return jsonResponse({ error: "Method not allowed." }, 405);
};

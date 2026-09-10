import { jsonResponse } from "./_shared/http.js";
import { requireAdmin } from "./_shared/admin-auth.js";
import { getLogs } from "./_shared/store.js";

export default async (request: Request) => {
  if (request.method !== "GET") {
    return jsonResponse({ error: "Method not allowed." }, 405);
  }

  const unauthorized = await requireAdmin(request);
  if (unauthorized) return unauthorized;

  try {
    const logs = await getLogs();
    return jsonResponse({ logs }, 200);
  } catch (error) {
    console.error("admin-activity error", error);
    return jsonResponse({ error: "Could not fetch activity logs." }, 500);
  }
};

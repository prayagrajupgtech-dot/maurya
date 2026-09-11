import { jsonResponse } from "./_shared/http.js";
import { getAllPlans } from "./_shared/store.js";

export default async (request: Request) => {
  if (request.method !== "GET") return jsonResponse({ error: "Method not allowed." }, 405);

  try {
    const allPlans = await getAllPlans();
    const activePlans = allPlans.filter(p => p.status === "active");
    return jsonResponse({ plans: activePlans });
  } catch (error) {
    console.error("plans GET error:", error);
    return jsonResponse({ error: "Could not load plans." }, 500);
  }
};

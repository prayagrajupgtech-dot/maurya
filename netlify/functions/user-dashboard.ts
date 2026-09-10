import { jsonResponse } from "./_shared/http.js";
import { getSupabaseAdmin, isSupabaseConfigured } from "./_shared/supabase.js";
import { verifyUserSession } from "./user-session.js";
import { getUserById, getUserByEmail, getPlanById, getCardsByUserId } from "./_shared/store.js";

export default async (request: Request) => {
  if (request.method !== "GET") return jsonResponse({ error: "Method not allowed." }, 405);

  const authUser = await verifyUserSession(request);
  if (!authUser) {
    return jsonResponse({ error: "Authentication required." }, 401);
  }

  try {
    let userRecord = await getUserById(authUser.userId);
    if (!userRecord && authUser.email) {
      userRecord = await getUserByEmail(authUser.email);
    }

    if (userRecord?.status === "blocked") {
      return jsonResponse({ error: "Your account has been blocked by the administrator." }, 403);
    }

    let planRecord = userRecord?.plan_id ? await getPlanById(userRecord.plan_id) : null;
    if (!planRecord) {
      // Default basic plan fallback
      const defaultPlans = await import("./_shared/store.js").then(m => m.getAllPlans());
      planRecord = defaultPlans[0] || null;
    }

    if (isSupabaseConfigured()) {
      const supabase = getSupabaseAdmin();
      const { data: profile } = await supabase
        .from("user_profiles")
        .select("id, email, display_name, phone, status, plan_id")
        .eq("id", authUser.userId)
        .single();

      if (profile?.status === "blocked") {
        return jsonResponse({ error: "Your account has been blocked by the administrator." }, 403);
      }

      const { data: cards } = await supabase
        .from("id_cards")
        .select("id, card_number, name, phone, status, created_at")
        .eq("user_id", authUser.userId)
        .order("created_at", { ascending: false });

      return jsonResponse({
        profile: {
          id: profile?.id || authUser.userId,
          email: profile?.email || authUser.email || "",
          display_name: profile?.display_name || authUser.email?.split("@")[0] || "User",
          status: profile?.status || userRecord?.status || "active",
          role: "user"
        },
        plan: planRecord,
        cards: cards || []
      });
    }

    const cards = await getCardsByUserId(userRecord?.id || authUser.userId);

    return jsonResponse({
      profile: {
        id: userRecord?.id || authUser.userId,
        email: userRecord?.email || authUser.email || "user@example.com",
        display_name: userRecord?.display_name || "User",
        status: userRecord?.status || "active",
        role: "user"
      },
      plan: planRecord,
      cards
    });
  } catch (error) {
    console.error("user-dashboard error:", error);
    return jsonResponse({ error: "Failed to load dashboard." }, 500);
  }
};

import { jsonResponse } from "./_shared/http.js";
import { getSupabaseAdmin, isSupabaseConfigured } from "./_shared/supabase.js";
import { verifyUserSession } from "./user-session.js";

export default async (request: Request) => {
  if (request.method !== "GET") return jsonResponse({ error: "Method not allowed." }, 405);

  const authUser = await verifyUserSession(request);
  if (!authUser) {
    return jsonResponse({ error: "Authentication required." }, 401);
  }

  if (!isSupabaseConfigured()) {
    return jsonResponse({ error: "Service not configured." }, 500);
  }

  try {
    const supabase = getSupabaseAdmin();

    // Fetch user profile - match by auth user ID
    const { data: profile, error: profileError } = await supabase
      .from("user_profiles")
      .select("id, email, display_name")
      .eq("id", authUser.userId)
      .single();

    if (profileError || !profile) {
      return jsonResponse({ error: "No registered account found. Please use the registration/subscription process first." }, 404);
    }

    // Fetch cards belonging to this user - server determines ownership via auth user ID
    const { data: cards } = await supabase
      .from("id_cards")
      .select("id, card_number, name, phone, status, created_at")
      .eq("user_id", authUser.userId)
      .order("created_at", { ascending: false });

    // Fetch subscription belonging to this user
    const { data: subscription } = await supabase
      .from("subscriptions")
      .select("razorpay_subscription_id, customer_name, customer_email, customer_phone, status, trial_ends_at, current_start_at, current_end_at, paid_count, remaining_count, created_at")
      .eq("user_id", authUser.userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    return jsonResponse({
      profile,
      cards: cards || [],
      subscription: subscription || null
    });
  } catch (error) {
    console.error("user-dashboard error:", error);
    return jsonResponse({ error: "Failed to load dashboard." }, 500);
  }
};

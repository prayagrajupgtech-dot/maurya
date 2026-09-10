import { randomUUID } from "node:crypto";
import { jsonResponse, readJsonBody } from "./_shared/http.js";
import { createRazorpaySubscription, getRazorpayConfig } from "./_shared/razorpay.js";
import { getSupabaseAdmin, isSupabaseConfigured } from "./_shared/supabase.js";
import { isEmailVerified } from "./_shared/otp.js";

function validateCustomer(body: Record<string, unknown>) {
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const phone = typeof body.phone === "string" ? body.phone.replace(/\D/g, "") : "";

  if (name.length < 3 || name.length > 100) return { error: "Enter a valid name." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 200) {
    return { error: "Enter a valid email address." };
  }
  if (!/^[6-9]\d{9}$/.test(phone)) return { error: "Enter a valid Indian mobile number." };
  return { name, email, phone };
}

async function findOrCreateAuthUser(supabase: ReturnType<typeof getSupabaseAdmin>, email: string, name: string): Promise<string | null> {
  // Check if a user_profile already exists for this email
  const { data: existingProfile } = await supabase
    .from("user_profiles")
    .select("id")
    .eq("email", email)
    .single();

  if (existingProfile) return existingProfile.id;

  // Check if a subscription already exists for this email (pre-existing customer)
  const { data: existingSub } = await supabase
    .from("subscriptions")
    .select("user_id")
    .eq("customer_email", email)
    .not("user_id", "is", null)
    .limit(1)
    .single();

  if (existingSub?.user_id) return existingSub.user_id;

  // No existing user found - return null (don't auto-create auth users)
  return null;
}

export default async (request: Request) => {
  if (request.method !== "POST") return jsonResponse({ error: "Method not allowed." }, 405);

  try {
    const customer = validateCustomer(await readJsonBody(request));
    if ("error" in customer) return jsonResponse({ error: customer.error }, 400);

    // Verify email has been OTP-verified before creating subscription
    if (isSupabaseConfigured()) {
      const emailVerified = await isEmailVerified(customer.email);
      if (!emailVerified) {
        return jsonResponse({ error: "Please verify your email address before subscribing." }, 403);
      }
    }

    const now = Math.floor(Date.now() / 1000);
    const trialEndsAt = now + 30 * 24 * 60 * 60;
    const { keyId, planId } = getRazorpayConfig();
    const reference = randomUUID();
    const razorpaySubscription = await createRazorpaySubscription({
      customer_notify: true,
      expire_by: now + 24 * 60 * 60,
      notes: {
        customer_email: customer.email,
        customer_phone: customer.phone,
        reference
      },
      plan_id: planId,
      quantity: 1,
      start_at: trialEndsAt,
      total_count: 60
    });

    if (isSupabaseConfigured()) {
      try {
        const supabase = getSupabaseAdmin();

        // Try to find an existing user_id for this email
        const userId = await findOrCreateAuthUser(supabase, customer.email, customer.name);

        const { error } = await supabase.from("subscriptions").insert({
          customer_email: customer.email,
          customer_name: customer.name,
          customer_phone: customer.phone,
          razorpay_subscription_id: razorpaySubscription.id,
          status: razorpaySubscription.status,
          trial_ends_at: new Date(trialEndsAt * 1000).toISOString(),
          user_id: userId || null
        });
        if (error) {
          console.error("Supabase create-subscription error", error);
        }
      } catch (dbErr) {
        console.warn("Supabase record failed:", dbErr);
      }
    }

    return jsonResponse({
      keyId,
      subscriptionId: razorpaySubscription.id,
      trialEndsAt: new Date(trialEndsAt * 1000).toISOString()
    }, 201);
  } catch (error) {
    console.error("create-subscription failed", error);
    const errorMessage = error instanceof Error ? error.message : "Could not start the subscription checkout.";
    return jsonResponse({ error: errorMessage }, 500);
  }
};

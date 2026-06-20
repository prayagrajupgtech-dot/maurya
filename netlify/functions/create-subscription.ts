import { randomUUID } from "node:crypto";
import { jsonResponse, readJsonBody } from "./_shared/http.js";
import { createRazorpaySubscription, getRazorpayConfig } from "./_shared/razorpay.js";
import { getSupabaseAdmin } from "./_shared/supabase.js";

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

export default async (request: Request) => {
  if (request.method !== "POST") return jsonResponse({ error: "Method not allowed." }, 405);

  try {
    const customer = validateCustomer(await readJsonBody(request));
    if ("error" in customer) return jsonResponse({ error: customer.error }, 400);

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

    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from("subscriptions").insert({
      customer_email: customer.email,
      customer_name: customer.name,
      customer_phone: customer.phone,
      razorpay_subscription_id: razorpaySubscription.id,
      status: razorpaySubscription.status,
      trial_ends_at: new Date(trialEndsAt * 1000).toISOString()
    });
    if (error) {
      console.error("Supabase create-subscription error", error);
      return jsonResponse({ error: "Subscription was created but could not be recorded. Contact support." }, 500);
    }

    return jsonResponse({
      keyId,
      subscriptionId: razorpaySubscription.id,
      trialEndsAt: new Date(trialEndsAt * 1000).toISOString()
    }, 201);
  } catch (error) {
    console.error("create-subscription failed", error);
    return jsonResponse({ error: "Could not start the subscription checkout." }, 500);
  }
};

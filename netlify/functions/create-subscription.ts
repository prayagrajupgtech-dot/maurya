import { randomUUID, hash } from "node:crypto";
import { jsonResponse, readJsonBody } from "./_shared/http.js";
import { createRazorpaySubscription, getRazorpayConfig } from "./_shared/razorpay.js";
import { getSupabaseAdmin, isSupabaseConfigured } from "./_shared/supabase.js";

function validateCustomer(body: Record<string, unknown>) {
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const phone = typeof body.phone === "string" ? body.phone.replace(/\D/g, "") : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (name.length < 3 || name.length > 100) return { error: "Enter a valid name." };
  if (!/^[6-9]\d{9}$/.test(phone)) return { error: "Enter a valid Indian mobile number." };
  if (password.length < 6) return { error: "Password must be at least 6 characters." };
  if (password.length > 128) return { error: "Password is too long." };
  return { name, phone, password };
}

function hashPassword(password: string): string {
  const salt = randomUUID();
  const hashed = hash("sha256", `${salt}:${password}`);
  return `${salt}:${hashed}`;
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
    const passwordHash = hashPassword(customer.password);

    const razorpaySubscription = await createRazorpaySubscription({
      customer_notify: true,
      expire_by: now + 24 * 60 * 60,
      notes: {
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
        const { error } = await supabase.from("subscriptions").insert({
          customer_name: customer.name,
          customer_email: "",
          customer_phone: customer.phone,
          razorpay_subscription_id: razorpaySubscription.id,
          status: razorpaySubscription.status,
          trial_ends_at: new Date(trialEndsAt * 1000).toISOString(),
          password_hash: passwordHash
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

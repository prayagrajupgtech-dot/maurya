import { jsonResponse, readJsonBody } from "./_shared/http.js";
import { getRazorpayConfig, verifyHmac } from "./_shared/razorpay.js";
import { getSupabaseAdmin, isSupabaseConfigured } from "./_shared/supabase.js";

async function fetchRazorpaySubscription(subscriptionId: string): Promise<{ customer_email?: string; customer_notes?: Record<string, string> } | null> {
  const { keyId, keySecret } = getRazorpayConfig();
  try {
    const response = await fetch(`https://api.razorpay.com/v1/subscriptions/${subscriptionId}`, {
      headers: {
        Authorization: `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}`
      }
    });
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}

export default async (request: Request) => {
  if (request.method !== "POST") return jsonResponse({ error: "Method not allowed." }, 405);

  try {
    const body = await readJsonBody(request);
    const paymentId = typeof body.razorpay_payment_id === "string" ? body.razorpay_payment_id : "";
    const subscriptionId = typeof body.razorpay_subscription_id === "string" ? body.razorpay_subscription_id : "";
    const signature = typeof body.razorpay_signature === "string" ? body.razorpay_signature : "";
    if (!paymentId || !subscriptionId || !signature) {
      return jsonResponse({ error: "Incomplete payment verification data." }, 400);
    }

    const { keySecret } = getRazorpayConfig();
    if (!verifyHmac(`${paymentId}|${subscriptionId}`, signature, keySecret)) {
      return jsonResponse({ error: "Payment signature verification failed." }, 400);
    }

    if (!isSupabaseConfigured()) {
      return jsonResponse({ success: true });
    }

    const supabase = getSupabaseAdmin();

    // Fetch subscription record with password hash
    const { data: subRecord, error: fetchError } = await supabase
      .from("subscriptions")
      .select("id, password_hash, customer_name, customer_phone")
      .eq("razorpay_subscription_id", subscriptionId)
      .single();

    if (fetchError || !subRecord) {
      console.error("Subscription record not found:", fetchError);
      return jsonResponse({ error: "Subscription record not found." }, 500);
    }

    // Fetch customer email from Razorpay
    const razorpaySub = await fetchRazorpaySubscription(subscriptionId);
    const customerEmail = razorpaySub?.customer_email || "";

    if (!customerEmail) {
      console.error("Could not retrieve customer email from Razorpay for subscription:", subscriptionId);
      // Still mark as authenticated, but skip account creation
      await supabase
        .from("subscriptions")
        .update({
          last_payment_id: paymentId,
          status: "authenticated",
          updated_at: new Date().toISOString()
        })
        .eq("razorpay_subscription_id", subscriptionId);

      return jsonResponse({ success: true, accountCreated: false });
    }

    let userId: string | null = null;
    let accountCreated = false;

    // Create Supabase Auth user if password hash exists and no user linked yet
    if (subRecord.password_hash) {
      const [salt, hashedPassword] = subRecord.password_hash.split(":");

      // Check if a user_profile already exists for this email
      const { data: existingProfile } = await supabase
        .from("user_profiles")
        .select("id")
        .eq("email", customerEmail)
        .single();

      if (existingProfile) {
        userId = existingProfile.id;
      } else {
        // Create Supabase Auth user
        const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
          email: customerEmail,
          password: `${salt}:${hashedPassword}`,
          email_confirm: true,
          user_metadata: {
            name: subRecord.customer_name
          }
        });

        if (!authError && authUser?.id) {
          userId = authUser.id;
          accountCreated = true;

          // Create user profile
          await supabase.from("user_profiles").insert({
            id: userId,
            email: customerEmail,
            display_name: subRecord.customer_name
          });
        } else {
          console.error("Failed to create auth user:", authError);
        }
      }
    }

    // Update subscription record
    await supabase
      .from("subscriptions")
      .update({
        customer_email: customerEmail,
        last_payment_id: paymentId,
        status: "authenticated",
        user_id: userId,
        password_hash: null,
        updated_at: new Date().toISOString()
      })
      .eq("razorpay_subscription_id", subscriptionId);

    return jsonResponse({ success: true, accountCreated });
  } catch (error) {
    console.error("verify-subscription failed", error);
    return jsonResponse({ error: "Could not verify the subscription." }, 500);
  }
};

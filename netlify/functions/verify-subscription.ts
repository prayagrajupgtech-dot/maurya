import { jsonResponse, readJsonBody } from "./_shared/http.js";
import { getRazorpayConfig, verifyHmac } from "./_shared/razorpay.js";
import { getSupabaseAdmin } from "./_shared/supabase.js";

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

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("subscriptions")
      .update({
        last_payment_id: paymentId,
        status: "authenticated",
        updated_at: new Date().toISOString()
      })
      .eq("razorpay_subscription_id", subscriptionId)
      .select("id")
      .maybeSingle();
    if (error || !data) {
      console.error("Supabase verify-subscription error", error);
      return jsonResponse({ error: "Payment verified but the subscription record was not updated." }, 500);
    }

    return jsonResponse({ success: true });
  } catch (error) {
    console.error("verify-subscription failed", error);
    return jsonResponse({ error: "Could not verify the subscription." }, 500);
  }
};

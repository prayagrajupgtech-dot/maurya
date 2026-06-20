import { jsonResponse } from "./_shared/http.js";
import { getRazorpayConfig, verifyHmac } from "./_shared/razorpay.js";
import { getSupabaseAdmin } from "./_shared/supabase.js";

export default async (request: Request) => {
  if (request.method !== "POST") return jsonResponse({ error: "Method not allowed." }, 405);

  const rawBody = await request.text();
  const signature = request.headers.get("x-razorpay-signature") || "";

  try {
    const { webhookSecret } = getRazorpayConfig();
    if (!verifyHmac(rawBody, signature, webhookSecret)) {
      return jsonResponse({ error: "Invalid webhook signature." }, 401);
    }

    const event = JSON.parse(rawBody) as {
      event?: string;
      payload?: {
        payment?: { entity?: { id?: string } };
        subscription?: {
          entity?: {
            current_end?: number;
            current_start?: number;
            id?: string;
            paid_count?: number;
            remaining_count?: number;
            status?: string;
          };
        };
      };
    };
    const subscription = event.payload?.subscription?.entity;
    if (!subscription?.id) return jsonResponse({ received: true });

    const supabase = getSupabaseAdmin();
    const eventId = request.headers.get("x-razorpay-event-id");
    const update: Record<string, unknown> = {
      status: subscription.status || "unknown",
      updated_at: new Date().toISOString()
    };
    if (subscription.current_end) update.current_end_at = new Date(subscription.current_end * 1000).toISOString();
    if (subscription.current_start) update.current_start_at = new Date(subscription.current_start * 1000).toISOString();
    if (typeof subscription.paid_count === "number") update.paid_count = subscription.paid_count;
    if (typeof subscription.remaining_count === "number") update.remaining_count = subscription.remaining_count;
    const paymentId = event.payload?.payment?.entity?.id;
    if (paymentId) update.last_payment_id = paymentId;

    const { error } = await supabase
      .from("subscriptions")
      .update(update)
      .eq("razorpay_subscription_id", subscription.id);
    if (error) throw error;

    if (eventId) {
      const { error: eventError } = await supabase.from("razorpay_events").insert({
        event_id: eventId,
        event_type: event.event || "unknown",
        razorpay_subscription_id: subscription.id
      });
      if (eventError && eventError.code !== "23505") throw eventError;
    }

    return jsonResponse({ received: true });
  } catch (error) {
    console.error("razorpay-webhook failed", error);
    return jsonResponse({ error: "Webhook processing failed." }, 500);
  }
};

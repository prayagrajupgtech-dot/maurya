import { createHmac, timingSafeEqual } from "node:crypto";

function getRequiredEnv(name: string) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is not configured.`);
  return value;
}

export function getRazorpayConfig() {
  return {
    keyId: getRequiredEnv("RAZORPAY_KEY_ID"),
    keySecret: getRequiredEnv("RAZORPAY_KEY_SECRET"),
    planId: getRequiredEnv("RAZORPAY_PLAN_ID"),
    webhookSecret: getRequiredEnv("RAZORPAY_WEBHOOK_SECRET")
  };
}

export async function createRazorpaySubscription(body: Record<string, unknown>) {
  const { keyId, keySecret } = getRazorpayConfig();
  const response = await fetch("https://api.razorpay.com/v1/subscriptions", {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });
  const result = await response.json();
  if (!response.ok) {
    console.error("Razorpay subscription API error", result);
    throw new Error("Could not create the Razorpay subscription.");
  }
  return result as {
    id: string;
    short_url?: string;
    status: string;
  };
}

export function verifyHmac(payload: string, signature: string, secret: string) {
  const expected = createHmac("sha256", secret).update(payload).digest("hex");
  const expectedBuffer = Buffer.from(expected);
  const signatureBuffer = Buffer.from(signature);
  return expectedBuffer.length === signatureBuffer.length && timingSafeEqual(expectedBuffer, signatureBuffer);
}

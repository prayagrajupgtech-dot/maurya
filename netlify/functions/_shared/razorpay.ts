import { createHmac, timingSafeEqual } from "node:crypto";

function getRequiredEnv(name: string) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is not configured in .env.`);
  return value;
}

// For one-time payment orders (card issuance) — only KEY_ID and KEY_SECRET required
export function getRazorpayOrderConfig() {
  const keyId = getRequiredEnv("RAZORPAY_KEY_ID");
  const keySecret = getRequiredEnv("RAZORPAY_KEY_SECRET");

  if (keyId.includes("your_key_id")) {
    throw new Error("RAZORPAY_KEY_ID in .env is using a placeholder. Replace it with your actual Razorpay Key ID (e.g. rzp_test_...).");
  }
  if (keySecret.includes("your-server-only-key-secret")) {
    throw new Error("RAZORPAY_KEY_SECRET in .env is using a placeholder. Replace it with your actual Razorpay Key Secret.");
  }

  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET?.trim() || "";
  return { keyId, keySecret, webhookSecret };
}

// For subscriptions — requires PLAN_ID in addition
export function getRazorpayConfig() {
  const { keyId, keySecret, webhookSecret } = getRazorpayOrderConfig();
  const planId = getRequiredEnv("RAZORPAY_PLAN_ID");

  if (planId.includes("your_plan_id") || planId.includes("REPLACE_WITH")) {
    throw new Error("RAZORPAY_PLAN_ID in .env is using a placeholder. Create a Subscription Plan in Razorpay Dashboard and set its ID in .env.");
  }
  if (planId.startsWith("rzp_test_") || planId.startsWith("rzp_live_")) {
    throw new Error(`RAZORPAY_PLAN_ID is set to "${planId}" which is a Razorpay Key ID, not a Plan ID. Plan IDs in Razorpay start with "plan_". Please create a Plan in Razorpay Dashboard (Subscriptions -> Plans) and set its ID in .env.`);
  }

  return { keyId, keySecret, planId, webhookSecret };
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
    const errorDetails = result?.error?.description || result?.error?.reason || result?.error?.code || response.statusText;
    if (response.status === 401) {
      throw new Error("Razorpay authentication failed (401). Please check RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in .env.");
    }
    if (response.status === 400 && errorDetails?.toLowerCase().includes("plan")) {
      throw new Error(`Invalid Razorpay Plan ID: ${errorDetails}`);
    }
    throw new Error(`Razorpay API Error (${response.status}): ${errorDetails || "Could not create subscription"}`);
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

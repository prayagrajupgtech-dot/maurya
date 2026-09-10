import { jsonResponse, readJsonBody } from "./_shared/http.js";
import { verifyOtp } from "./_shared/otp.js";
import { checkRateLimit, getClientIp } from "./_shared/rate-limit.js";

export default async (request: Request) => {
  if (request.method !== "POST") return jsonResponse({ error: "Method not allowed." }, 405);

  try {
    const body = await readJsonBody(request);
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const otp = typeof body.otp === "string" ? body.otp.trim() : "";

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 200) {
      return jsonResponse({ error: "Enter a valid email address." }, 400);
    }
    if (!/^\d{6}$/.test(otp)) {
      return jsonResponse({ error: "Enter the 6-digit verification code." }, 400);
    }

    // Rate limit: 10 verify attempts per IP per 10 minutes
    const ipKey = `otp-verify-ip:${getClientIp(request)}`;
    const ipLimit = checkRateLimit(ipKey, 10, 600);
    if (!ipLimit.allowed) {
      return jsonResponse(
        { error: `Too many attempts. Please try again in ${ipLimit.retryAfterSeconds} seconds.` },
        429
      );
    }

    // Rate limit: 8 verify attempts per email per 10 minutes
    const emailKey = `otp-verify:${email}`;
    const emailLimit = checkRateLimit(emailKey, 8, 600);
    if (!emailLimit.allowed) {
      return jsonResponse(
        { error: `Too many attempts. Please try again in ${emailLimit.retryAfterSeconds} seconds.` },
        429
      );
    }

    const result = await verifyOtp(email, otp);

    if (!result.success) {
      return jsonResponse({ error: result.error || "Verification failed." }, 400);
    }

    return jsonResponse({ message: "Email verified successfully.", verified: true });
  } catch (error) {
    console.error("verify-otp error:", error);
    return jsonResponse({ error: "Verification failed." }, 500);
  }
};

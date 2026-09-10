import { jsonResponse, readJsonBody } from "./_shared/http.js";
import { generateOtp, storeOtp, canResendOtp } from "./_shared/otp.js";
import { sendOtpEmail } from "./_shared/email.js";
import { checkRateLimit, getClientIp } from "./_shared/rate-limit.js";

export default async (request: Request) => {
  if (request.method !== "POST") return jsonResponse({ error: "Method not allowed." }, 405);

  try {
    const body = await readJsonBody(request);
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 200) {
      return jsonResponse({ error: "Enter a valid email address." }, 400);
    }

    // Rate limit: 3 OTP requests per email per 10 minutes
    const emailKey = `otp-send:${email}`;
    const emailLimit = checkRateLimit(emailKey, 3, 600);
    if (!emailLimit.allowed) {
      return jsonResponse(
        { error: `Too many requests. Please try again in ${emailLimit.retryAfterSeconds} seconds.` },
        429
      );
    }

    // Rate limit: 10 OTP requests per IP per 10 minutes
    const ipKey = `otp-send-ip:${getClientIp(request)}`;
    const ipLimit = checkRateLimit(ipKey, 10, 600);
    if (!ipLimit.allowed) {
      return jsonResponse(
        { error: `Too many requests. Please try again in ${ipLimit.retryAfterSeconds} seconds.` },
        429
      );
    }

    // Check resend cooldown
    const cooldown = await canResendOtp(email);
    if (!cooldown.allowed) {
      return jsonResponse(
        { error: `Please wait ${cooldown.waitSeconds} seconds before requesting a new code.` },
        429
      );
    }

    // Generate and store OTP
    const otp = generateOtp();
    await storeOtp(email, otp);

    // Send email
    const result = await sendOtpEmail(email, otp);
    if (!result.success) {
      return jsonResponse({ error: result.error || "Failed to send verification code." }, 500);
    }

    return jsonResponse({ message: "Verification code sent." });
  } catch (error) {
    console.error("send-otp error:", error);
    return jsonResponse({ error: "Failed to send verification code." }, 500);
  }
};

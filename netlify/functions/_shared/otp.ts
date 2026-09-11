import { randomInt } from "node:crypto";
import { sha256 } from "./http.js";
import { getSupabaseAdmin, isSupabaseConfigured } from "./supabase.js";

const OTP_EXPIRY_SECONDS = 5 * 60; // 5 minutes
const MAX_ATTEMPTS = 5;
const RESEND_COOLDOWN_SECONDS = 60;

export function generateOtp(): string {
  return randomInt(100_000, 999_999).toString();
}

export async function hashOtp(otp: string): Promise<string> {
  return sha256(otp);
}

export async function storeOtp(email: string, otp: string): Promise<{ id: string }> {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase not configured");
  }
  const supabase = getSupabaseAdmin();
  const otpHash = await hashOtp(otp);
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_SECONDS * 1000).toISOString();

  // Invalidate any previous unverified OTPs for this email
  await supabase
    .from("email_verifications")
    .update({ verified: true })
    .eq("email", email)
    .eq("verified", false);

  const { data, error } = await supabase
    .from("email_verifications")
    .insert({
      email,
      otp_hash: otpHash,
      expires_at: expiresAt,
      verified: false,
      attempts: 0,
      max_attempts: MAX_ATTEMPTS
    })
    .select("id")
    .single();

  if (error) {
    console.error("storeOtp error:", error);
    throw new Error("Failed to store OTP");
  }
  return { id: data.id };
}

export async function verifyOtp(
  email: string,
  otp: string
): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured()) {
    return { success: false, error: "Service not configured." };
  }
  const supabase = getSupabaseAdmin();
  const otpHash = await hashOtp(otp);

  // Find the latest unverified OTP for this email
  const { data: record, error: fetchError } = await supabase
    .from("email_verifications")
    .select("id, otp_hash, expires_at, verified, attempts, max_attempts")
    .eq("email", email)
    .eq("verified", false)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (fetchError || !record) {
    return { success: false, error: "No verification code found. Please request a new one." };
  }

  // Check if already verified
  if (record.verified) {
    return { success: false, error: "This code has already been used. Please request a new one." };
  }

  // Check expiry
  if (new Date(record.expires_at) < new Date()) {
    return { success: false, error: "This code has expired. Please request a new one." };
  }

  // Check max attempts
  if (record.attempts >= record.max_attempts) {
    // Mark as verified to prevent further attempts
    await supabase
      .from("email_verifications")
      .update({ verified: true })
      .eq("id", record.id);
    return { success: false, error: "Too many failed attempts. Please request a new code." };
  }

  // Increment attempts
  await supabase
    .from("email_verifications")
    .update({ attempts: record.attempts + 1 })
    .eq("id", record.id);

  // Verify OTP
  if (record.otp_hash !== otpHash) {
    const remaining = record.max_attempts - record.attempts - 1;
    return {
      success: false,
      error: remaining > 0
        ? `Invalid code. ${remaining} attempt${remaining === 1 ? "" : "s"} remaining.`
        : "Invalid code. No attempts remaining. Please request a new code."
    };
  }

  // Mark as verified
  await supabase
    .from("email_verifications")
    .update({ verified: true })
    .eq("id", record.id);

  return { success: true };
}

export async function isEmailVerified(email: string): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  const supabase = getSupabaseAdmin();

  const { data } = await supabase
    .from("email_verifications")
    .select("id")
    .eq("email", email)
    .eq("verified", true)
    .gte("expires_at", new Date(Date.now() - OTP_EXPIRY_SECONDS * 1000).toISOString())
    .limit(1)
    .single();

  return !!data;
}

export async function canResendOtp(email: string): Promise<{ allowed: boolean; waitSeconds?: number }> {
  if (!isSupabaseConfigured()) return { allowed: true };
  const supabase = getSupabaseAdmin();

  const { data: latest } = await supabase
    .from("email_verifications")
    .select("created_at")
    .eq("email", email)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (!latest) return { allowed: true };

  const elapsed = (Date.now() - new Date(latest.created_at).getTime()) / 1000;
  if (elapsed >= RESEND_COOLDOWN_SECONDS) return { allowed: true };

  return { allowed: false, waitSeconds: Math.ceil(RESEND_COOLDOWN_SECONDS - elapsed) };
}

export { OTP_EXPIRY_SECONDS, MAX_ATTEMPTS, RESEND_COOLDOWN_SECONDS };

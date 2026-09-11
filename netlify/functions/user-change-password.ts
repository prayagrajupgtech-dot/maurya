import { jsonResponse, readJsonBody, sha256 } from "./_shared/http.js";
import { verifyUserSession } from "./user-session.js";
import { getSupabaseAdmin, isSupabaseConfigured } from "./_shared/supabase.js";
import { getUserById, saveUser } from "./_shared/store.js";

function validateStrongPassword(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (password.length < 8) errors.push("At least 8 characters");
  if (!/[A-Z]/.test(password)) errors.push("At least 1 uppercase letter");
  if (!/[a-z]/.test(password)) errors.push("At least 1 lowercase letter");
  if (!/[0-9]/.test(password)) errors.push("At least 1 number");
  if (!/[!@#$%^&*()_+\-=\[\]{}|;':",./<>?]/.test(password)) errors.push("At least 1 special character");
  return { valid: errors.length === 0, errors };
}

export default async (request: Request) => {
  if (request.method !== "POST") {
    return jsonResponse({ error: "Method not allowed." }, 405);
  }

  const authUser = await verifyUserSession(request);
  if (!authUser) {
    return jsonResponse({ error: "Authentication required." }, 401);
  }

  try {
    const body = await readJsonBody(request);

    const current_password = typeof body.current_password === "string" ? body.current_password : "";
    const new_password = typeof body.new_password === "string" ? body.new_password : "";

    if (!current_password || !new_password) {
      return jsonResponse({ error: "Current password and new password are required." }, 400);
    }

    const validation = validateStrongPassword(new_password);
    if (!validation.valid) {
      return jsonResponse({ error: "Weak password.", details: validation.errors }, 400);
    }

    if (isSupabaseConfigured()) {
      const supabase = getSupabaseAdmin();

      const { data: profile } = await supabase
        .from("user_profiles")
        .select("id, email")
        .eq("id", authUser.userId)
        .maybeSingle();

      if (!profile?.email) {
        return jsonResponse({ error: "User not found." }, 404);
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: profile.email,
        password: current_password
      });

      if (signInError) {
        return jsonResponse({ error: "Current password is incorrect." }, 401);
      }

      const { error: updateError } = await supabase.auth.admin.updateUserById(
        authUser.userId,
        { password: new_password }
      );

      if (updateError) {
        console.error("user-change-password update error:", updateError);
        return jsonResponse({ error: "Failed to update password." }, 500);
      }

      return jsonResponse({ success: true, message: "Password updated successfully." });
    }

    const user = await getUserById(authUser.userId);
    if (!user) {
      return jsonResponse({ error: "User not found." }, 404);
    }

    if (!user.password_hash) {
      return jsonResponse({ error: "No password set for this account." }, 400);
    }

    const currentHash = await sha256(current_password);
    if (currentHash !== user.password_hash) {
      return jsonResponse({ error: "Current password is incorrect." }, 401);
    }

    const newHash = await sha256(new_password);
    await saveUser({ ...user, password_hash: newHash });

    return jsonResponse({ success: true, message: "Password updated successfully." });
  } catch (error) {
    console.error("user-change-password error:", error);
    return jsonResponse({ error: "Failed to process request." }, 500);
  }
};

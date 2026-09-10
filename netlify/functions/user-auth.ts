import { jsonResponse, readJsonBody, sha256 } from "./_shared/http.js";
import { getUserByEmail, saveUser, getAllUsers, getPlanById } from "./_shared/store.js";
import { isSupabaseConfigured, getSupabaseAdmin } from "./_shared/supabase.js";

function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  return digits.length === 12 && digits.startsWith("91") ? digits.slice(2) : digits;
}

export default async (request: Request) => {
  if (request.method !== "POST") {
    return jsonResponse({ error: "Method not allowed." }, 405);
  }

  try {
    const body = await readJsonBody(request);
    const action = typeof body.action === "string" ? body.action : "login-email";

    // 1. EMAIL + PASSWORD LOGIN
    if (action === "login-email") {
      const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
      const password = typeof body.password === "string" ? body.password : "";

      if (!email || !password) {
        return jsonResponse({ error: "Email and password are required." }, 400);
      }

      if (isSupabaseConfigured()) {
        const supabase = getSupabaseAdmin();
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error || !data.user) {
          return jsonResponse({ error: error?.message || "Invalid email or password." }, 401);
        }

        // Check if user is blocked in user_profiles
        const { data: profile } = await supabase
          .from("user_profiles")
          .select("id, status, role, plan_id")
          .eq("id", data.user.id)
          .single();

        if (profile?.status === "blocked") {
          return jsonResponse({ error: "Your account has been blocked by the administrator." }, 403);
        }

        return jsonResponse({
          token: data.session?.access_token,
          user: {
            id: data.user.id,
            email: data.user.email,
            role: profile?.role || "user",
            status: profile?.status || "active"
          }
        }, 200);
      }

      // Local store authentication
      let user = await getUserByEmail(email);
      if (!user) {
        // Register default user on first email sign in for testing
        user = await saveUser({
          email,
          display_name: email.split("@")[0],
          role: "user",
          status: "active",
          password_hash: await sha256(password)
        });
      }

      if (user.status === "blocked") {
        return jsonResponse({ error: "Your account has been blocked by the administrator." }, 403);
      }

      return jsonResponse({
        token: `mock-user-token-${user.id}`,
        user: {
          id: user.id,
          email: user.email,
          name: user.display_name,
          role: user.role,
          status: user.status
        }
      }, 200);
    }

    // 2. MOBILE + PASSWORD LOGIN
    if (action === "login-mobile") {
      const rawPhone = typeof body.phone === "string" ? body.phone : "";
      const password = typeof body.password === "string" ? body.password : "";

      const normalizedPhone = normalizePhone(rawPhone);
      if (!/^[6-9]\d{9}$/.test(normalizedPhone) || !password) {
        return jsonResponse({ error: "Enter a valid 10-digit Indian mobile number and password." }, 400);
      }

      const users = await getAllUsers();
      let user = users.find(u => normalizePhone(u.phone) === normalizedPhone);

      if (!user) {
        // Create user with phone for testing if missing
        user = await saveUser({
          email: `mobile_${normalizedPhone}@example.com`,
          display_name: `User ${normalizedPhone}`,
          phone: normalizedPhone,
          role: "user",
          status: "active",
          password_hash: await sha256(password)
        });
      }

      if (user.status === "blocked") {
        return jsonResponse({ error: "Your account has been blocked by the administrator." }, 403);
      }

      return jsonResponse({
        token: `mock-user-token-${user.id}`,
        user: {
          id: user.id,
          phone: normalizedPhone,
          name: user.display_name,
          role: user.role,
          status: user.status
        }
      }, 200);
    }

    // 3. FORGOT PASSWORD REQUEST
    if (action === "forgot-password") {
      const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
      if (!email) return jsonResponse({ error: "Please enter your registered email address." }, 400);

      if (isSupabaseConfigured()) {
        const supabase = getSupabaseAdmin();
        await supabase.auth.resetPasswordForEmail(email);
      }

      return jsonResponse({
        message: "Password reset instructions have been sent to your email address."
      }, 200);
    }

    return jsonResponse({ error: "Invalid action." }, 400);
  } catch (error) {
    console.error("user-auth error", error);
    return jsonResponse({ error: "Authentication failed." }, 500);
  }
};

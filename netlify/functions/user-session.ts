import { jsonResponse } from "./_shared/http.js";
import { getSupabaseAdmin, isSupabaseConfigured } from "./_shared/supabase.js";
import { getUserById } from "./_shared/store.js";

export async function verifyUserSession(request: Request): Promise<{ userId: string; email: string } | null> {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;

  const token = authHeader.slice(7);

  // Supabase auth
  if (isSupabaseConfigured()) {
    try {
      const supabase = getSupabaseAdmin();
      const { data: { user }, error } = await supabase.auth.getUser(token);
      if (!error && user && user.email) {
        return { userId: user.id, email: user.email };
      }
    } catch {
      // fall through to local store check
    }
  }

  // Local store auth - token format: mock-user-token-{userId}
  if (token.startsWith("mock-user-token-")) {
    const userId = token.replace("mock-user-token-", "");
    const user = await getUserById(userId);
    if (user && user.email) {
      return { userId: user.id, email: user.email };
    }
  }

  return null;
}

export default async (request: Request) => {
  if (request.method !== "GET") return jsonResponse({ error: "Method not allowed." }, 405);

  const authUser = await verifyUserSession(request);
  if (!authUser) {
    return jsonResponse({ error: "Authentication required." }, 401);
  }

  return jsonResponse({ authenticated: true, userId: authUser.userId, email: authUser.email });
};

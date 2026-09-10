import { jsonResponse } from "./_shared/http.js";
import { getSupabaseAdmin, isSupabaseConfigured } from "./_shared/supabase.js";

export async function verifyUserSession(request: Request): Promise<{ userId: string; email: string } | null> {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;

  const token = authHeader.slice(7);
  if (!isSupabaseConfigured()) return null;

  try {
    const supabase = getSupabaseAdmin();
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user || !user.email) return null;
    return { userId: user.id, email: user.email };
  } catch {
    return null;
  }
}

export default async (request: Request) => {
  if (request.method !== "GET") return jsonResponse({ error: "Method not allowed." }, 405);

  const authUser = await verifyUserSession(request);
  if (!authUser) {
    return jsonResponse({ error: "Authentication required." }, 401);
  }

  return jsonResponse({ authenticated: true, userId: authUser.userId, email: authUser.email });
};

import { createClient } from "@supabase/supabase-js";

export function isSupabaseConfigured() {
  const url = process.env.SUPABASE_URL?.trim();
  const secretKey = process.env.SUPABASE_SECRET_KEY?.trim();
  if (!url || !secretKey) return false;
  if (url.includes("your-project.supabase.co") || secretKey.includes("your-server-only")) return false;
  return true;
}

export function getSupabaseAdmin() {
  const url = process.env.SUPABASE_URL?.trim();
  const secretKey = process.env.SUPABASE_SECRET_KEY?.trim();

  if (!url || !secretKey || !isSupabaseConfigured()) {
    throw new Error("Supabase environment variables are not configured in .env.");
  }

  return createClient(url, secretKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

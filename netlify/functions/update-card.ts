import { isUuid, jsonResponse, readJsonBody, sha256 } from "./_shared/http";
import { getSupabaseAdmin } from "./_shared/supabase";

export default async (request: Request) => {
  if (request.method !== "PATCH") {
    return jsonResponse({ error: "Method not allowed." }, 405);
  }

  try {
    const body = await readJsonBody(request);
    const id = typeof body.id === "string" ? body.id : "";
    const editToken = typeof body.editToken === "string" ? body.editToken : "";
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const phone = typeof body.phone === "string" ? body.phone.replace(/\D/g, "") : "";

    if (!isUuid(id)) return jsonResponse({ error: "Invalid verification ID." }, 400);
    if (!/^[0-9a-f]{64}$/i.test(editToken)) return jsonResponse({ error: "Invalid edit authorization." }, 403);
    if (name.length < 3 || name.length > 100) return jsonResponse({ error: "Invalid name." }, 400);
    if (!/^[6-9]\d{9}$/.test(phone)) return jsonResponse({ error: "Invalid phone number." }, 400);

    const supabase = getSupabaseAdmin();
    const editTokenHash = await sha256(editToken);
    const { data, error } = await supabase
      .from("id_cards")
      .update({ name, phone })
      .eq("id", id)
      .eq("edit_token_hash", editTokenHash)
      .eq("status", "active")
      .select("id")
      .maybeSingle();

    if (error) {
      console.error("Supabase update-card error", error);
      return jsonResponse({ error: "Could not update this card." }, 500);
    }
    if (!data) {
      return jsonResponse({ error: "Active verification record not found." }, 404);
    }

    return jsonResponse({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === "PAYLOAD_TOO_LARGE") {
      return jsonResponse({ error: "Request is too large." }, 413);
    }
    if (error instanceof Error && error.message === "INVALID_JSON") {
      return jsonResponse({ error: "Invalid request." }, 400);
    }
    console.error("update-card failed", error);
    return jsonResponse({ error: "Server configuration error." }, 500);
  }
};

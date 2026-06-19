import { isUuid, jsonResponse } from "./_shared/http";
import { getSupabaseAdmin } from "./_shared/supabase";

export default async (request: Request) => {
  if (request.method !== "GET") {
    return jsonResponse({ error: "Method not allowed." }, 405);
  }

  const id = new URL(request.url).searchParams.get("id") || "";
  if (!isUuid(id)) {
    return jsonResponse({ error: "Invalid verification ID." }, 400);
  }

  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("id_cards")
      .select("id, card_number, name, phone, status, created_at")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      console.error("Supabase verify-card error", error);
      return jsonResponse({ error: "Could not verify this card." }, 500);
    }
    if (!data) {
      return jsonResponse({ error: "Verification record not found." }, 404);
    }

    return jsonResponse({
      cardNumber: data.card_number,
      createdAt: data.created_at,
      name: data.name,
      phone: data.phone,
      status: data.status
    });
  } catch (error) {
    console.error("verify-card failed", error);
    return jsonResponse({ error: "Server configuration error." }, 500);
  }
};

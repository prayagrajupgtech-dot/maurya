import { jsonResponse, readJsonBody, sha256 } from "./_shared/http";
import { getSupabaseAdmin } from "./_shared/supabase";

function validateCard(body: Record<string, unknown>) {
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const phone = typeof body.phone === "string" ? body.phone.replace(/\D/g, "") : "";
  const dateOfBirth = typeof body.dateOfBirth === "string" ? body.dateOfBirth : "";
  const address = typeof body.address === "string" ? body.address.trim() : "";

  if (name.length < 3 || name.length > 100) return { error: "Invalid name." };
  if (!/^[6-9]\d{9}$/.test(phone)) return { error: "Invalid phone number." };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateOfBirth)) return { error: "Invalid date of birth." };
  if (address.length < 10 || address.length > 500) return { error: "Invalid address." };

  const dob = new Date(`${dateOfBirth}T00:00:00Z`);
  const today = new Date();
  const oldestAllowed = new Date();
  oldestAllowed.setUTCFullYear(today.getUTCFullYear() - 120);
  if (Number.isNaN(dob.getTime()) || dob > today || dob < oldestAllowed) {
    return { error: "Invalid date of birth." };
  }

  return { name, phone, dateOfBirth, address };
}

export default async (request: Request) => {
  if (request.method !== "POST") {
    return jsonResponse({ error: "Method not allowed." }, 405);
  }

  try {
    const body = await readJsonBody(request);
    const validated = validateCard(body);
    if ("error" in validated) {
      return jsonResponse({ error: validated.error }, 400);
    }

    const cardNumber = `ID-${crypto.randomUUID().replace(/-/g, "").slice(0, 8).toUpperCase()}`;
    const editToken = `${crypto.randomUUID()}${crypto.randomUUID()}`.replace(/-/g, "");
    const editTokenHash = await sha256(editToken);
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("id_cards")
      .insert({
        address: validated.address,
        card_number: cardNumber,
        date_of_birth: validated.dateOfBirth,
        edit_token_hash: editTokenHash,
        name: validated.name,
        phone: validated.phone,
        status: "active"
      })
      .select("id, card_number")
      .single();

    if (error) {
      console.error("Supabase create-card error", error);
      return jsonResponse({ error: "Could not create the verification record." }, 500);
    }

    return jsonResponse({ id: data.id, cardNumber: data.card_number, editToken }, 201);
  } catch (error) {
    if (error instanceof Error && error.message === "PAYLOAD_TOO_LARGE") {
      return jsonResponse({ error: "Request is too large." }, 413);
    }
    if (error instanceof Error && error.message === "INVALID_JSON") {
      return jsonResponse({ error: "Invalid request." }, 400);
    }
    console.error("create-card failed", error);
    return jsonResponse({ error: "Server configuration error." }, 500);
  }
};

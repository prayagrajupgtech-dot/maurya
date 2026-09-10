import { jsonResponse, readJsonBody } from "./_shared/http.js";
import { requireAdmin } from "./_shared/admin-auth.js";
import { getAllCards, addCard, getUserById, getPlanById, logAdminAction } from "./_shared/store.js";
import { getSupabaseAdmin, isSupabaseConfigured } from "./_shared/supabase.js";

export default async (request: Request) => {
  const unauthorized = await requireAdmin(request);
  if (unauthorized) return unauthorized;

  // GET - List all cards
  if (request.method === "GET") {
    try {
      const cards = await getAllCards();
      return jsonResponse({ cards }, 200);
    } catch (error) {
      console.error("admin-cards GET error", error);
      return jsonResponse({ error: "Could not fetch cards." }, 500);
    }
  }

  // POST - Create a card (admin only)
  if (request.method === "POST") {
    try {
      const body = await readJsonBody(request);
      const userId = typeof body.userId === "string" ? body.userId : null;
      const name = typeof body.name === "string" ? body.name.trim() : "";
      const phone = typeof body.phone === "string" ? body.phone.replace(/\D/g, "") : "";
      const dateOfBirth = typeof body.dateOfBirth === "string" ? body.dateOfBirth : "";
      const address = typeof body.address === "string" ? body.address.trim() : "";
      const planId = typeof body.planId === "string" ? body.planId : null;

      if (!name || !phone || !dateOfBirth || !address) {
        return jsonResponse({ error: "Name, phone, date of birth, and address are required." }, 400);
      }

      let targetUser = userId ? await getUserById(userId) : null;
      let effectivePlanId = planId || targetUser?.plan_id || null;

      const cardNumber = `ID-${crypto.randomUUID().replace(/-/g, "").slice(0, 8).toUpperCase()}`;
      const editToken = `${crypto.randomUUID()}${crypto.randomUUID()}`.replace(/-/g, "");

      const newCard = await addCard({
        id: crypto.randomUUID(),
        card_number: cardNumber,
        name,
        phone,
        date_of_birth: dateOfBirth,
        address,
        user_id: targetUser?.id || null,
        plan_id: effectivePlanId,
        status: "active",
        created_at: new Date().toISOString()
      });

      await logAdminAction(
        "Card Generated",
        "admin",
        targetUser?.id || null,
        `Generated card ${cardNumber} for ${name} (${targetUser?.email || "Direct Admin Creation"})`
      );

      return jsonResponse({ id: newCard.id, cardNumber, editToken }, 201);
    } catch (error) {
      console.error("admin-cards POST error", error);
      return jsonResponse({ error: "Could not create card." }, 500);
    }
  }

  // PATCH - Update card (activate/deactivate)
  if (request.method === "PATCH") {
    try {
      const body = await readJsonBody(request);
      const cardId = typeof body.cardId === "string" ? body.cardId : "";
      const action = typeof body.action === "string" ? body.action : "";

      if (!cardId || !action) {
        return jsonResponse({ error: "Card ID and action are required." }, 400);
      }

      if (isSupabaseConfigured()) {
        const supabase = getSupabaseAdmin();

        if (action === "activate") {
          const { data, error } = await supabase
            .from("id_cards")
            .update({ status: "active" })
            .eq("id", cardId)
            .select("id, card_number, name")
            .maybeSingle();

          if (error) {
            console.error("admin-cards PATCH activate error", error);
            return jsonResponse({ error: "Could not activate card." }, 500);
          }
          if (!data) return jsonResponse({ error: "Card not found." }, 404);

          await logAdminAction("Card Activated", "admin", null, `Activated card ${data.card_number} (${data.name})`);
          return jsonResponse({ success: true, card: data });
        }

        if (action === "deactivate") {
          const { data, error } = await supabase
            .from("id_cards")
            .update({ status: "blocked" })
            .eq("id", cardId)
            .select("id, card_number, name")
            .maybeSingle();

          if (error) {
            console.error("admin-cards PATCH deactivate error", error);
            return jsonResponse({ error: "Could not deactivate card." }, 500);
          }
          if (!data) return jsonResponse({ error: "Card not found." }, 404);

          await logAdminAction("Card Deactivated", "admin", null, `Deactivated card ${data.card_number} (${data.name})`);
          return jsonResponse({ success: true, card: data });
        }

        return jsonResponse({ error: "Invalid action. Use 'activate' or 'deactivate'." }, 400);
      }

      // Local store fallback
      const cards = await getAllCards();
      const card = cards.find(c => c.id === cardId);
      if (!card) return jsonResponse({ error: "Card not found." }, 404);

      if (action === "activate") {
        card.status = "active";
      } else if (action === "deactivate") {
        card.status = "blocked";
      } else {
        return jsonResponse({ error: "Invalid action." }, 400);
      }

      await logAdminAction(
        action === "activate" ? "Card Activated" : "Card Deactivated",
        "admin",
        null,
        `${action === "activate" ? "Activated" : "Deactivated"} card ${card.card_number} (${card.name})`
      );

      return jsonResponse({ success: true, card: { id: card.id, card_number: card.card_number, name: card.name, status: card.status } });
    } catch (error) {
      console.error("admin-cards PATCH error", error);
      return jsonResponse({ error: "Could not update card." }, 500);
    }
  }

  // DELETE - Delete a card
  if (request.method === "DELETE") {
    try {
      const url = new URL(request.url);
      const cardId = url.searchParams.get("cardId") || "";

      if (!cardId) {
        return jsonResponse({ error: "Card ID is required." }, 400);
      }

      if (isSupabaseConfigured()) {
        const supabase = getSupabaseAdmin();
        const { data: card, error: fetchError } = await supabase
          .from("id_cards")
          .select("id, card_number, name")
          .eq("id", cardId)
          .maybeSingle();

        if (fetchError || !card) {
          return jsonResponse({ error: "Card not found." }, 404);
        }

        const { error: deleteError } = await supabase
          .from("id_cards")
          .delete()
          .eq("id", cardId);

        if (deleteError) {
          console.error("admin-cards DELETE error", deleteError);
          return jsonResponse({ error: "Could not delete card." }, 500);
        }

        await logAdminAction("Card Deleted", "admin", null, `Deleted card ${card.card_number} (${card.name})`);
        return jsonResponse({ success: true });
      }

      // Local store fallback
      const cards = await getAllCards();
      const idx = cards.findIndex(c => c.id === cardId);
      if (idx === -1) return jsonResponse({ error: "Card not found." }, 404);

      const deletedCard = cards[idx];
      cards.splice(idx, 1);

      await logAdminAction("Card Deleted", "admin", null, `Deleted card ${deletedCard.card_number} (${deletedCard.name})`);
      return jsonResponse({ success: true });
    } catch (error) {
      console.error("admin-cards DELETE error", error);
      return jsonResponse({ error: "Could not delete card." }, 500);
    }
  }

  return jsonResponse({ error: "Method not allowed." }, 405);
};

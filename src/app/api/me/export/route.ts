import { check, requireUser, route } from "@/server/http";

/** GET /api/me/export — everything we hold about the signed-in user, as JSON (data portability). */
export const GET = route(async () => {
  const { supabase, user } = await requireUser();
  const [profile, cards, media, subs, purchases, ai, received] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
    supabase.from("cards").select("id, slug, title, status, recipient_name, sender_name, recipient_email, experience_type, card_data, scheduled_at, published_at, view_count, created_at, updated_at").eq("owner_id", user.id),
    supabase.from("card_media").select("id, card_id, media_type, original_filename, mime_type, file_size, created_at").eq("owner_id", user.id),
    supabase.from("subscriptions").select("provider, plan, status, current_period_start, current_period_end, created_at").eq("user_id", user.id),
    supabase.from("purchases").select("provider, product_type, amount, currency, status, created_at").eq("user_id", user.id),
    supabase.from("ai_generations").select("generation_type, status, created_at").eq("user_id", user.id),
    supabase.from("received_cards").select("card_id, saved, first_opened_at, last_opened_at").eq("user_id", user.id),
  ]);
  check(profile.error ?? cards.error ?? media.error);
  const body = JSON.stringify(
    { exportedAt: new Date().toISOString(), account: { id: user.id, email: user.email }, profile: profile.data, cards: cards.data, media: media.data, subscriptions: subs.data, purchases: purchases.data, aiGenerations: ai.data, receivedCards: received.data },
    null,
    2,
  );
  return new Response(body, { headers: { "Content-Type": "application/json", "Content-Disposition": `attachment; filename="dearly-export.json"`, "Cache-Control": "no-store" } });
});

import { z } from "zod";
import { check, json, requireUser, route } from "@/server/http";

/** GET /api/cards/:id/responses — opens, completions and reactions for the owner. */
export const GET = route(async (_req, ctx: RouteContext<"/api/cards/[id]/responses">) => {
  const { supabase } = await requireUser();
  const id = z.string().uuid().parse((await ctx.params).id);
  const [card, views, reactions] = await Promise.all([
    supabase.from("cards").select("view_count, last_opened_at").eq("id", id).maybeSingle(),
    supabase.from("card_views").select("opened_at, completed_at").eq("card_id", id).order("opened_at", { ascending: false }).limit(50),
    supabase.from("card_reactions").select("id, reaction_type, message, photo_path, created_at, seen_at").eq("card_id", id).order("created_at", { ascending: false }).limit(100),
  ]);
  check(card.error ?? views.error ?? reactions.error);
  if (!card.data) return json({ error: "Card not found." }, { status: 404 });
  const unseen = (reactions.data ?? []).filter((r) => !r.seen_at).map((r) => r.id);
  if (unseen.length) await supabase.from("card_reactions").update({ seen_at: new Date().toISOString() }).in("id", unseen);
  const photoPaths = (reactions.data ?? []).map((r) => r.photo_path).filter(Boolean) as string[];
  const signed = photoPaths.length ? (await supabase.storage.from("card-media").createSignedUrls(photoPaths, 3600)).data ?? [] : [];
  const urlFor = new Map(signed.map((s) => [s.path, s.signedUrl]));
  return json({
    viewCount: card.data.view_count,
    lastOpenedAt: card.data.last_opened_at,
    completions: (views.data ?? []).filter((v) => v.completed_at).length,
    recentOpens: (views.data ?? []).map((v) => ({ openedAt: v.opened_at, completedAt: v.completed_at })),
    reactions: (reactions.data ?? []).map((r) => ({ id: r.id, type: r.reaction_type, message: r.message, photoUrl: r.photo_path ? urlFor.get(r.photo_path) ?? null : null, createdAt: r.created_at, isNew: !r.seen_at })),
  });
});

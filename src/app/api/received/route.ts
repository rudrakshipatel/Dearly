import { check, json, requireUser, route } from "@/server/http";

/** GET /api/received — cards the signed-in user has opened, most recent first. */
export const GET = route(async (req) => {
  const { supabase } = await requireUser();
  const offset = Math.max(0, Number(new URL(req.url).searchParams.get("offset") ?? 0) || 0);
  const { data, error } = await supabase.rpc("my_received_cards", { p_offset: offset, p_limit: 24 });
  check(error);
  return json({
    items: (data ?? []).map((r) => ({ slug: r.slug, title: r.title, from: r.sender_name, occasion: r.occasion, palette: r.palette, motif: r.motif, saved: r.saved, openedAt: r.opened_at, receivedAt: r.received_at })),
  });
});

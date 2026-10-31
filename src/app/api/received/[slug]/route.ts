import { z } from "zod";
import { check, json, parseBody, requireUser, route } from "@/server/http";

/** POST /api/received/:slug — record that you opened a card, optionally saving it to your collection. */
export const POST = route(async (req, ctx: RouteContext<"/api/received/[slug]">) => {
  const { supabase } = await requireUser();
  const { saved } = await parseBody(req, z.object({ saved: z.boolean().nullable().default(null) }));
  const { error } = await supabase.rpc("mark_card_received", { p_slug: z.string().max(64).parse((await ctx.params).slug), p_saved: saved as boolean });
  check(error);
  return json({ ok: true });
});

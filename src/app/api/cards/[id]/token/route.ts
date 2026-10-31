import { z } from "zod";
import { check, json, requireUser, route } from "@/server/http";

/** POST /api/cards/:id/token — issue a new contributor link (the old one stops working). */
export const POST = route(async (_req, ctx: RouteContext<"/api/cards/[id]/token">) => {
  const { supabase } = await requireUser();
  const { data, error } = await supabase.rpc("regenerate_contribution_token", { p_card_id: z.string().uuid().parse((await ctx.params).id) });
  check(error);
  return json({ token: data });
});

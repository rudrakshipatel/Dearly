import { z } from "zod";
import { check, json, parseBody, requireUser, route } from "@/server/http";

/** PUT /api/cards/:id/password — set (or clear with null) a password recipients must enter. Stored as a bcrypt hash. */
export const PUT = route(async (req, ctx: RouteContext<"/api/cards/[id]/password">) => {
  const { supabase } = await requireUser();
  const { password } = await parseBody(req, z.object({ password: z.string().min(4).max(72).nullable() }));
  const { error } = await supabase.rpc("set_card_password", { p_card_id: z.string().uuid().parse((await ctx.params).id), p_password: password as string });
  check(error);
  return json({ ok: true, hasPassword: password !== null });
});

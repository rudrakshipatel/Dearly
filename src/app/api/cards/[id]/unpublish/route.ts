import { z } from "zod";
import { cardService } from "@/server/cards";
import { json, parseBody, requireUser, route } from "@/server/http";

/** POST /api/cards/:id/unpublish — back to draft (or archive), cancelling any scheduled delivery. */
export const POST = route(async (req, ctx: RouteContext<"/api/cards/[id]/unpublish">) => {
  const { supabase } = await requireUser();
  const { archive } = await parseBody(req, z.object({ archive: z.boolean().default(false) }));
  const card = await cardService.setStatus(supabase, z.string().uuid().parse((await ctx.params).id), archive ? "archived" : "draft");
  return json({ card });
});

import { z } from "zod";
import { cardService } from "@/server/cards";
import { json, rateLimit, requireUser, route } from "@/server/http";

export const POST = route(async (_req, ctx: RouteContext<"/api/cards/[id]/duplicate">) => {
  const { supabase, user } = await requireUser();
  await rateLimit(supabase, "card-create", 60, 3600);
  const card = await cardService.duplicate(supabase, user.id, z.string().uuid().parse((await ctx.params).id));
  return json({ card }, { status: 201 });
});

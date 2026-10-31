import { z } from "zod";
import { cardService } from "@/server/cards";
import { json, parseBody, rateLimit, requireUser, route } from "@/server/http";
import { asCreation, creationInput } from "@/server/schemas";

const id = z.string().uuid();

export const GET = route(async (_req, ctx: RouteContext<"/api/cards/[id]">) => {
  const { supabase } = await requireUser();
  const card = await cardService.get(supabase, id.parse((await ctx.params).id));
  return json({ card });
});

/** PATCH /api/cards/:id — autosave. Rejected with 409 if `expectedVersion` is stale. */
export const PATCH = route(async (req, ctx: RouteContext<"/api/cards/[id]">) => {
  const { supabase } = await requireUser();
  await rateLimit(supabase, "card-save", 240, 600);
  const body = await parseBody(req, z.object({ creation: creationInput, expectedVersion: z.number().int().min(1) }));
  const card = await cardService.update(supabase, id.parse((await ctx.params).id), asCreation(body.creation), body.expectedVersion);
  return json({ card });
});

export const DELETE = route(async (_req, ctx: RouteContext<"/api/cards/[id]">) => {
  const { supabase } = await requireUser();
  await cardService.remove(supabase, id.parse((await ctx.params).id));
  return json({ ok: true });
});

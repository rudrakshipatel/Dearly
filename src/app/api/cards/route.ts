import { z } from "zod";
import { cardService, listQuery } from "@/server/cards";
import { json, parseBody, rateLimit, requireUser, route } from "@/server/http";
import { asCreation, creationInput } from "@/server/schemas";

/** GET /api/cards — the signed-in user's cards, paginated and filterable. */
export const GET = route(async (req) => {
  const { supabase, user } = await requireUser();
  const params = Object.fromEntries(new URL(req.url).searchParams);
  const query = listQuery.parse(params);
  const [page, counts] = await Promise.all([cardService.list(supabase, user.id, query), cardService.counts(supabase, user.id)]);
  return json({ ...page, counts });
});

/** POST /api/cards — create a draft from the creation wizard or a template. */
export const POST = route(async (req) => {
  const { supabase, user } = await requireUser();
  await rateLimit(supabase, "card-create", 60, 3600);
  const body = await parseBody(req, z.object({ creation: creationInput }));
  const card = await cardService.create(supabase, user.id, asCreation(body.creation));
  return json({ card }, { status: 201 });
});

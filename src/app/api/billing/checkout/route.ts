import { z } from "zod";
import { ApiError, json, parseBody, rateLimit, requireUser, route } from "@/server/http";
import { providerFor } from "@/server/payments";

const body = z.object({
  item: z.discriminatedUnion("kind", [
    z.object({ kind: z.literal("subscription"), plan: z.enum(["premium", "pro"]), cycle: z.enum(["monthly", "yearly"]) }),
    z.object({ kind: z.literal("one_time"), product: z.enum(["premium_card", "group_card", "special_experience"]), cardId: z.string().uuid().nullable().optional() }),
  ]),
  region: z.enum(["US", "GB", "CA", "AU", "NZ", "IN", "INTL"]),
  returnPath: z.string().regex(/^\/[A-Za-z0-9/_\-?=&]*$/).max(200).default("/dashboard"),
});

/**
 * POST /api/billing/checkout — starts checkout with the right provider for the region.
 * Access is granted only later, by the verified webhook, never by the success redirect.
 */
export const POST = route(async (req) => {
  const { supabase, user } = await requireUser();
  await rateLimit(supabase, "checkout", 20, 3600);
  const b = await parseBody(req, body);
  if (!user.email) throw new ApiError(400, "Add an email address to your account first.");
  if (b.item.kind === "one_time" && b.item.cardId) {
    const { data: ok } = await supabase.rpc("can_edit_card", { p_card_id: b.item.cardId });
    if (!ok) throw new ApiError(404, "Card not found.", "not_found");
  }
  const result = await providerFor(b.region).createCheckout({ item: b.item, region: b.region, user: { id: user.id, email: user.email }, returnPath: b.returnPath });
  return json(result);
});

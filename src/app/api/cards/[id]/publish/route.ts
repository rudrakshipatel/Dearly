import { z } from "zod";
import { cardService } from "@/server/cards";
import { scheduleDeliveryJob } from "@/server/jobs/events";
import { capture } from "@/server/analytics";
import { json, parseBody, rateLimit, requireUser, route } from "@/server/http";

const body = z.object({
  scheduledAt: z.string().datetime().nullable().optional(),
  timezone: z.string().max(64).nullable().optional(),
  deliveryEmail: z.string().email().max(254).nullable().optional(),
});

/**
 * POST /api/cards/:id/publish — validates ownership, plan entitlements and media in the database
 * (publish_card), then queues delivery if a time or recipient email was given.
 */
export const POST = route(async (req, ctx: RouteContext<"/api/cards/[id]/publish">) => {
  const { supabase, user } = await requireUser();
  await rateLimit(supabase, "card-publish", 30, 3600);
  const id = z.string().uuid().parse((await ctx.params).id);
  const opts = await parseBody(req, body);
  const result = await cardService.publish(supabase, id, opts);
  const scheduled = result.status === "scheduled" || !!opts.deliveryEmail;
  const delivery = scheduled ? await scheduleDeliveryJob(id, result.scheduledAt) : null;
  await capture(user.id, "card_published", { scheduled: result.status === "scheduled", with_email: !!opts.deliveryEmail });
  const card = await cardService.get(supabase, id);
  return json({ card, delivery });
});

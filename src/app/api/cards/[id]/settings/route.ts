import { z } from "zod";
import { cardService } from "@/server/cards";
import { json, parseBody, requireUser, route } from "@/server/http";

const settings = z
  .object({
    allowReactions: z.boolean(),
    allowResponsePhoto: z.boolean(),
    showBranding: z.boolean(),
    isDisabled: z.boolean(),
    recipientEmail: z.string().email().max(254).nullable(),
    contributionDeadline: z.string().datetime().nullable(),
    contributionLimit: z.number().int().min(1).max(1000).nullable(),
    contributionsRequireApproval: z.boolean(),
    expiresAt: z.string().datetime().nullable(),
  })
  .partial();

/** PUT /api/cards/:id/settings — privacy, responses, branding and group settings. Plan rules are enforced by the database. */
export const PUT = route(async (req, ctx: RouteContext<"/api/cards/[id]/settings">) => {
  const { supabase } = await requireUser();
  const s = await parseBody(req, settings);
  const card = await cardService.updateSettings(supabase, z.string().uuid().parse((await ctx.params).id), s);
  return json({ card });
});

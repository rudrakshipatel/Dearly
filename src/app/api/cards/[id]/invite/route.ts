import { z } from "zod";
import { contributorInviteEmail, sendEmail } from "@/server/email";
import { ApiError, check, json, parseBody, rateLimit, requireUser, route } from "@/server/http";

/** POST /api/cards/:id/invite — emails the contributor link to up to 20 people. */
export const POST = route(async (req, ctx: RouteContext<"/api/cards/[id]/invite">) => {
  const { supabase } = await requireUser();
  const id = z.string().uuid().parse((await ctx.params).id);
  const { emails } = await parseBody(req, z.object({ emails: z.array(z.string().email().max(254)).min(1).max(20) }));
  await rateLimit(supabase, "invite-emails", 100, 86400);
  const { data: card, error } = await supabase.from("cards").select("recipient_name, sender_name, contribution_token, experience_type").eq("id", id).maybeSingle();
  check(error);
  if (!card) throw new ApiError(404, "Card not found.", "not_found");
  if (card.experience_type !== "together" || !card.contribution_token) throw new ApiError(400, "Create the contributor link first.", "invalid");
  const mail = contributorInviteEmail({ recipientName: card.recipient_name, organiser: card.sender_name || "A friend", token: card.contribution_token });
  const results = await Promise.allSettled(emails.map((to) => sendEmail(to, mail.subject, mail.html)));
  const failed = results.filter((r) => r.status === "rejected");
  if (failed.length === emails.length) throw (failed[0] as PromiseRejectedResult).reason;
  return json({ sent: emails.length - failed.length, failed: failed.length });
});

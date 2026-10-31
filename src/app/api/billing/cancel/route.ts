import { ApiError, check, json, requireUser, route } from "@/server/http";
import { providerById } from "@/server/payments";

/** POST /api/billing/cancel — cancels at the end of the paid period. The webhook updates our records. */
export const POST = route(async () => {
  const { supabase, user } = await requireUser();
  const { data, error } = await supabase
    .from("subscriptions")
    .select("provider, provider_subscription_id")
    .eq("user_id", user.id)
    .in("status", ["active", "trialing", "past_due"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  check(error);
  if (!data) throw new ApiError(404, "You don't have an active subscription.", "not_found");
  await providerById(data.provider).cancelSubscription(data.provider_subscription_id);
  return json({ ok: true, message: "Your plan will end at the close of the current billing period." });
});

import { publicEnv } from "@/lib/env";
import { ApiError, check, json, requireUser, route } from "@/server/http";
import { stripe } from "@/server/payments/stripe";

/** POST /api/billing/portal — Stripe customer portal for invoices and payment methods. */
export const POST = route(async () => {
  const { supabase, user } = await requireUser();
  const { data, error } = await supabase.from("subscriptions").select("provider_customer_id").eq("user_id", user.id).eq("provider", "stripe").not("provider_customer_id", "is", null).limit(1).maybeSingle();
  check(error);
  if (!data?.provider_customer_id) throw new ApiError(404, "No Stripe billing account yet.", "not_found");
  const session = await stripe().billingPortal.sessions.create({ customer: data.provider_customer_id, return_url: `${publicEnv.siteUrl}/account` });
  return json({ url: session.url });
});

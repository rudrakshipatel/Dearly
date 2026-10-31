import type Stripe from "stripe";
import { supabaseService } from "@/lib/supabase/server";
import { serverEnv } from "@/server/config";
import { firstTimeSeeing, recordPurchase, setPurchaseStatus, upsertSubscription } from "@/server/payments/fulfil";
import { stripe } from "@/server/payments/stripe";

const STATUS: Record<string, "trialing" | "active" | "past_due" | "canceled" | "incomplete" | "expired"> = {
  trialing: "trialing",
  active: "active",
  past_due: "past_due",
  unpaid: "past_due",
  canceled: "canceled",
  incomplete: "incomplete",
  incomplete_expired: "expired",
  paused: "past_due",
};

function periods(sub: Stripe.Subscription) {
  const item = sub.items?.data?.[0] as (Stripe.SubscriptionItem & { current_period_start?: number; current_period_end?: number }) | undefined;
  const legacy = sub as unknown as { current_period_start?: number; current_period_end?: number };
  const start = item?.current_period_start ?? legacy.current_period_start;
  const end = item?.current_period_end ?? legacy.current_period_end;
  return { periodStart: start ? new Date(start * 1000) : null, periodEnd: end ? new Date(end * 1000) : null };
}

async function syncSubscription(sub: Stripe.Subscription) {
  const userId = sub.metadata?.userId;
  const plan = sub.metadata?.plan as "premium" | "pro" | undefined;
  if (!userId || !plan) return;
  await upsertSubscription(supabaseService(), {
    provider: "stripe",
    userId,
    customerId: typeof sub.customer === "string" ? sub.customer : sub.customer?.id,
    subscriptionId: sub.id,
    plan,
    status: STATUS[sub.status] ?? "incomplete",
    cancelAtPeriodEnd: sub.cancel_at_period_end,
    ...periods(sub),
  });
}

/** POST /api/webhooks/stripe — the only place Stripe payments change entitlements. Signature-verified and idempotent. */
export async function POST(req: Request) {
  if (!serverEnv.stripeWebhookSecret || !serverEnv.stripeSecretKey) return Response.json({ error: "Stripe webhooks aren't configured." }, { status: 503 });
  const raw = await req.text();
  let event: Stripe.Event;
  try {
    event = stripe().webhooks.constructEvent(raw, req.headers.get("stripe-signature") ?? "", serverEnv.stripeWebhookSecret);
  } catch {
    return Response.json({ error: "Invalid signature." }, { status: 400 });
  }
  const db = supabaseService();
  if (!(await firstTimeSeeing(db, "stripe", event.id, event.type))) return Response.json({ received: true, duplicate: true });

  try {
    switch (event.type) {
      case "checkout.session.completed":
      case "checkout.session.async_payment_succeeded": {
        const s = event.data.object;
        if (s.mode === "payment" && s.metadata?.userId && s.metadata.product) {
          await recordPurchase(db, {
            provider: "stripe",
            userId: s.metadata.userId,
            paymentId: (typeof s.payment_intent === "string" ? s.payment_intent : s.payment_intent?.id) ?? s.id,
            product: s.metadata.product as "premium_card",
            amount: s.amount_total ?? 0,
            currency: s.currency ?? "usd",
            status: s.payment_status === "paid" ? "paid" : "pending",
            cardId: s.metadata.cardId ?? null,
          });
        } else if (s.mode === "subscription" && s.subscription) {
          const sub = await stripe().subscriptions.retrieve(typeof s.subscription === "string" ? s.subscription : s.subscription.id);
          await syncSubscription(sub);
        }
        break;
      }
      case "checkout.session.async_payment_failed": {
        const s = event.data.object;
        const pi = typeof s.payment_intent === "string" ? s.payment_intent : s.payment_intent?.id;
        if (pi) await setPurchaseStatus(db, "stripe", pi, "failed");
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted":
        await syncSubscription(event.data.object);
        break;
      case "invoice.payment_failed": {
        const inv = event.data.object as Stripe.Invoice & { subscription?: string | Stripe.Subscription | null };
        const subId = typeof inv.subscription === "string" ? inv.subscription : inv.subscription?.id ?? inv.parent?.subscription_details?.subscription;
        if (subId) await syncSubscription(await stripe().subscriptions.retrieve(typeof subId === "string" ? subId : subId.id));
        break;
      }
      case "charge.refunded": {
        const ch = event.data.object;
        const pi = typeof ch.payment_intent === "string" ? ch.payment_intent : ch.payment_intent?.id;
        if (pi) await setPurchaseStatus(db, "stripe", pi, ch.amount_refunded >= ch.amount ? "refunded" : "partially_refunded");
        break;
      }
    }
  } catch (e) {
    // Let Stripe retry: forget the event so the retry is processed.
    await db.from("payment_events").delete().eq("provider", "stripe").eq("event_id", event.id);
    console.error("[stripe webhook]", e);
    return Response.json({ error: "Processing failed." }, { status: 500 });
  }
  return Response.json({ received: true });
}

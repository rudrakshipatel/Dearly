import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import { capture } from "../analytics";

type DB = SupabaseClient<Database>;
type Provider = "stripe" | "razorpay";
type SubStatus = Database["public"]["Enums"]["subscription_status"];

/**
 * Records a webhook event id; returns false if it was already processed (idempotency).
 * Providers retry webhooks, so every handler must be safe to run twice.
 */
export async function firstTimeSeeing(db: DB, provider: Provider, eventId: string, type: string) {
  const { error } = await db.from("payment_events").insert({ provider, event_id: eventId, event_type: type });
  if (error?.code === "23505") return false;
  if (error) throw error;
  return true;
}

export async function upsertSubscription(
  db: DB,
  s: {
    provider: Provider;
    userId: string;
    customerId?: string | null;
    subscriptionId: string;
    plan: "premium" | "pro";
    status: SubStatus;
    cancelAtPeriodEnd?: boolean;
    periodStart?: Date | null;
    periodEnd?: Date | null;
  },
) {
  const { data: before } = await db.from("subscriptions").select("status").eq("provider", s.provider).eq("provider_subscription_id", s.subscriptionId).maybeSingle();
  const { error } = await db.from("subscriptions").upsert(
    {
      provider: s.provider,
      user_id: s.userId,
      provider_customer_id: s.customerId ?? null,
      provider_subscription_id: s.subscriptionId,
      plan: s.plan,
      status: s.status,
      cancel_at_period_end: s.cancelAtPeriodEnd ?? false,
      current_period_start: s.periodStart?.toISOString() ?? null,
      current_period_end: s.periodEnd?.toISOString() ?? null,
    },
    { onConflict: "provider,provider_subscription_id" },
  );
  if (error) throw error;
  if (!before && (s.status === "active" || s.status === "trialing")) await capture(s.userId, "subscription_started", { plan: s.plan, provider: s.provider });
}

export async function recordPurchase(
  db: DB,
  p: { provider: Provider; userId: string; paymentId: string; product: Database["public"]["Enums"]["purchase_product"]; amount: number; currency: string; status: Database["public"]["Enums"]["purchase_status"]; cardId?: string | null },
) {
  const { error } = await db.from("purchases").upsert(
    { provider: p.provider, user_id: p.userId, provider_payment_id: p.paymentId, product_type: p.product, amount: p.amount, currency: p.currency.toUpperCase(), status: p.status, card_id: p.cardId ?? null },
    { onConflict: "provider,provider_payment_id" },
  );
  if (error) throw error;
  if (p.status === "paid") await capture(p.userId, "purchase_completed", { product: p.product, provider: p.provider });
}

export async function setPurchaseStatus(db: DB, provider: Provider, paymentId: string, status: Database["public"]["Enums"]["purchase_status"]) {
  const { error } = await db.from("purchases").update({ status }).eq("provider", provider).eq("provider_payment_id", paymentId);
  if (error) throw error;
}

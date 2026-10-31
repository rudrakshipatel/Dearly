import "server-only";
import Stripe from "stripe";
import { pricing } from "@/lib/data/pricing";
import { ONE_TIME_PRODUCTS } from "@/lib/entitlements";
import { publicEnv } from "@/lib/env";
import { NotConfiguredError, serverEnv } from "../config";
import type { CheckoutInput, PaymentProvider } from "./types";

let client: Stripe | null = null;
export function stripe() {
  if (!serverEnv.stripeSecretKey) throw new NotConfiguredError("Stripe", "STRIPE_SECRET_KEY");
  client ??= new Stripe(serverEnv.stripeSecretKey);
  return client;
}

/** Converts a major-unit price to the provider's minor units (zero-decimal currencies stay whole). */
export function toMinor(amount: number, currency: string) {
  const zeroDecimal = ["JPY", "KRW", "VND"];
  return zeroDecimal.includes(currency.toUpperCase()) ? Math.round(amount) : Math.round(amount * 100);
}

export const stripeProvider: PaymentProvider = {
  id: "stripe",
  async createCheckout({ item, region, user, returnPath }: CheckoutInput) {
    const r = pricing.regions.find((x) => x.code === region) ?? pricing.regions[0];
    const currency = r.currency.toLowerCase();
    const metadata: Record<string, string> = { userId: user.id, kind: item.kind };
    let line: Stripe.Checkout.SessionCreateParams.LineItem;
    if (item.kind === "subscription") {
      metadata.plan = item.plan;
      metadata.cycle = item.cycle;
      line = {
        quantity: 1,
        price_data: {
          currency,
          unit_amount: toMinor(r.prices[item.plan][item.cycle], r.currency),
          recurring: { interval: item.cycle === "yearly" ? "year" : "month" },
          product_data: { name: `Dearly ${item.plan === "pro" ? "Pro" : "Premium"} (${item.cycle})` },
        },
      };
    } else {
      metadata.product = item.product;
      if (item.cardId) metadata.cardId = item.cardId;
      line = {
        quantity: 1,
        price_data: { currency, unit_amount: toMinor(r.oneTime[item.product], r.currency), product_data: { name: `Dearly ${ONE_TIME_PRODUCTS[item.product].label}` } },
      };
    }
    const base = publicEnv.siteUrl;
    const session = await stripe().checkout.sessions.create({
      mode: item.kind === "subscription" ? "subscription" : "payment",
      line_items: [line],
      customer_email: user.email,
      client_reference_id: user.id,
      metadata,
      ...(item.kind === "subscription" ? { subscription_data: { metadata } } : { payment_intent_data: { metadata } }),
      allow_promotion_codes: true,
      success_url: `${base}${returnPath}${returnPath.includes("?") ? "&" : "?"}checkout=success`,
      cancel_url: `${base}${returnPath}${returnPath.includes("?") ? "&" : "?"}checkout=cancelled`,
    });
    if (!session.url) throw new Error("Stripe didn't return a checkout URL.");
    return { provider: "stripe", url: session.url };
  },
  async cancelSubscription(id) {
    await stripe().subscriptions.update(id, { cancel_at_period_end: true });
  },
};

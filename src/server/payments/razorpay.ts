import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { pricing } from "@/lib/data/pricing";
import { ONE_TIME_PRODUCTS } from "@/lib/entitlements";
import { NotConfiguredError, serverEnv } from "../config";
import type { CheckoutInput, PaymentProvider } from "./types";

const API = "https://api.razorpay.com/v1";

async function rzp<T>(path: string, body?: unknown, method = "POST"): Promise<T> {
  if (!serverEnv.razorpayKeyId || !serverEnv.razorpayKeySecret) throw new NotConfiguredError("Razorpay", "NEXT_PUBLIC_RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET");
  const res = await fetch(`${API}${path}`, {
    method,
    headers: {
      Authorization: `Basic ${Buffer.from(`${serverEnv.razorpayKeyId}:${serverEnv.razorpayKeySecret}`).toString("base64")}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(15000),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`Razorpay: ${data?.error?.description ?? res.status}`);
  return data as T;
}

/** Razorpay subscription plans are created once in the dashboard; their ids come from the environment. */
function planId(plan: "premium" | "pro", cycle: "monthly" | "yearly") {
  const key = `RAZORPAY_PLAN_${plan.toUpperCase()}_${cycle.toUpperCase()}`;
  const id = process.env[key];
  if (!id) throw new NotConfiguredError("Razorpay subscription plans", key);
  return id;
}

/** Verifies X-Razorpay-Signature: HMAC-SHA256 of the raw body with the webhook secret. */
export function verifyRazorpaySignature(rawBody: string, signature: string | null, secret: string) {
  if (!signature || !secret) return false;
  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  return a.length === b.length && timingSafeEqual(a, b);
}

export const razorpayProvider: PaymentProvider = {
  id: "razorpay",
  async createCheckout({ item, user }: CheckoutInput) {
    const r = pricing.regions.find((x) => x.code === "IN")!;
    const notes = { userId: user.id, kind: item.kind } as Record<string, string>;
    if (item.kind === "subscription") {
      notes.plan = item.plan;
      notes.cycle = item.cycle;
      const sub = await rzp<{ id: string }>("/subscriptions", { plan_id: planId(item.plan, item.cycle), total_count: item.cycle === "yearly" ? 10 : 120, customer_notify: 1, notes });
      return { provider: "razorpay", keyId: serverEnv.razorpayKeyId, subscriptionId: sub.id, currency: "INR", name: "Dearly", description: `Dearly ${item.plan === "pro" ? "Pro" : "Premium"} (${item.cycle})` };
    }
    notes.product = item.product;
    if (item.cardId) notes.cardId = item.cardId;
    const amount = Math.round(r.oneTime[item.product] * 100);
    const order = await rzp<{ id: string }>("/orders", { amount, currency: "INR", receipt: `${item.product}-${Date.now()}`, notes });
    return { provider: "razorpay", keyId: serverEnv.razorpayKeyId, orderId: order.id, amount, currency: "INR", name: "Dearly", description: ONE_TIME_PRODUCTS[item.product].label };
  },
  async cancelSubscription(id) {
    await rzp(`/subscriptions/${id}/cancel`, { cancel_at_cycle_end: 1 });
  },
};

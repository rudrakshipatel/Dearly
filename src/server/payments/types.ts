import type { OneTimeProduct } from "@/lib/entitlements";
import type { PlanId, RegionCode } from "@/lib/types";

export type CheckoutItem =
  | { kind: "subscription"; plan: Exclude<PlanId, "free">; cycle: "monthly" | "yearly" }
  | { kind: "one_time"; product: OneTimeProduct; cardId?: string | null };

export interface CheckoutInput {
  item: CheckoutItem;
  region: RegionCode;
  user: { id: string; email: string };
  returnPath: string;
}

/** What the browser needs to continue: a hosted page to redirect to, or an embedded Razorpay checkout. */
export type CheckoutResult =
  | { provider: "stripe"; url: string }
  | { provider: "razorpay"; keyId: string; orderId?: string; subscriptionId?: string; amount?: number; currency: string; name: string; description: string };

export interface PaymentProvider {
  id: "stripe" | "razorpay";
  createCheckout(input: CheckoutInput): Promise<CheckoutResult>;
  cancelSubscription(providerSubscriptionId: string): Promise<void>;
}

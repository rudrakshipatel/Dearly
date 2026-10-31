import "server-only";
import type { RegionCode } from "@/lib/types";
import { razorpayProvider } from "./razorpay";
import { stripeProvider } from "./stripe";
import type { PaymentProvider } from "./types";

/** India uses Razorpay (UPI, cards, netbanking); everywhere else uses Stripe. */
export function providerFor(region: RegionCode): PaymentProvider {
  return region === "IN" ? razorpayProvider : stripeProvider;
}

export function providerById(id: "stripe" | "razorpay"): PaymentProvider {
  return id === "razorpay" ? razorpayProvider : stripeProvider;
}

export type { CheckoutItem, CheckoutResult } from "./types";

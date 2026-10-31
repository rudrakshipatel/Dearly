import { createHmac } from "node:crypto";
import Stripe from "stripe";
import { describe, expect, it } from "vitest";
import { verifyRazorpaySignature } from "@/server/payments/razorpay";
import { toMinor } from "@/server/payments/stripe";

describe("webhook signature verification", () => {
  it("accepts a valid Razorpay signature and rejects tampering", () => {
    const secret = "whsec_test_razorpay";
    const body = JSON.stringify({ event: "payment.captured", payload: { payment: { entity: { id: "pay_1", amount: 9900 } } } });
    const sig = createHmac("sha256", secret).update(body).digest("hex");
    expect(verifyRazorpaySignature(body, sig, secret)).toBe(true);
    expect(verifyRazorpaySignature(body.replace("9900", "1"), sig, secret)).toBe(false);
    expect(verifyRazorpaySignature(body, "deadbeef", secret)).toBe(false);
    expect(verifyRazorpaySignature(body, null, secret)).toBe(false);
  });

  it("verifies Stripe signatures the same way the webhook route does", () => {
    const stripe = new Stripe("sk_test_dummy");
    const secret = "whsec_test_stripe";
    const payload = JSON.stringify({ id: "evt_1", object: "event", type: "checkout.session.completed", data: { object: {} } });
    const header = stripe.webhooks.generateTestHeaderString({ payload, secret });
    expect(stripe.webhooks.constructEvent(payload, header, secret).id).toBe("evt_1");
    expect(() => stripe.webhooks.constructEvent(payload.replace("evt_1", "evt_2"), header, secret)).toThrow();
    expect(() => stripe.webhooks.constructEvent(payload, header, "whsec_wrong")).toThrow();
  });

  it("converts prices to minor units", () => {
    expect(toMinor(5.99, "USD")).toBe(599);
    expect(toMinor(199, "INR")).toBe(19900);
    expect(toMinor(500, "JPY")).toBe(500);
  });
});

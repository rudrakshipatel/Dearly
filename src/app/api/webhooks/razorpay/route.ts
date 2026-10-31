import { createHash } from "node:crypto";
import { supabaseService } from "@/lib/supabase/server";
import { serverEnv } from "@/server/config";
import { firstTimeSeeing, recordPurchase, setPurchaseStatus, upsertSubscription } from "@/server/payments/fulfil";
import { verifyRazorpaySignature } from "@/server/payments/razorpay";

type Notes = { userId?: string; plan?: "premium" | "pro"; product?: "premium_card" | "group_card" | "special_experience"; cardId?: string };

const SUB_STATUS: Record<string, "active" | "past_due" | "canceled" | "incomplete" | "expired"> = {
  authenticated: "incomplete",
  active: "active",
  charged: "active",
  pending: "past_due",
  halted: "past_due",
  cancelled: "canceled",
  completed: "expired",
  expired: "expired",
};

/** POST /api/webhooks/razorpay — signature-verified (HMAC-SHA256) and idempotent. */
export async function POST(req: Request) {
  if (!serverEnv.razorpayWebhookSecret) return Response.json({ error: "Razorpay webhooks aren't configured." }, { status: 503 });
  const raw = await req.text();
  if (!verifyRazorpaySignature(raw, req.headers.get("x-razorpay-signature"), serverEnv.razorpayWebhookSecret)) {
    return Response.json({ error: "Invalid signature." }, { status: 400 });
  }
  const event = JSON.parse(raw) as { event: string; payload: Record<string, { entity: Record<string, unknown> }> };
  const eventId = req.headers.get("x-razorpay-event-id") ?? createHash("sha256").update(raw).digest("hex");
  const db = supabaseService();
  if (!(await firstTimeSeeing(db, "razorpay", eventId, event.event))) return Response.json({ received: true, duplicate: true });

  try {
    const payment = event.payload.payment?.entity as { id: string; amount: number; currency: string; notes?: Notes; order_id?: string } | undefined;
    const sub = event.payload.subscription?.entity as { id: string; status: string; notes?: Notes; customer_id?: string; current_start?: number; current_end?: number } | undefined;
    const refund = event.payload.refund?.entity as { payment_id: string; amount: number } | undefined;

    if (sub && event.event.startsWith("subscription.") && sub.notes?.userId && sub.notes.plan) {
      await upsertSubscription(db, {
        provider: "razorpay",
        userId: sub.notes.userId,
        customerId: sub.customer_id ?? null,
        subscriptionId: sub.id,
        plan: sub.notes.plan,
        status: SUB_STATUS[sub.status] ?? "incomplete",
        cancelAtPeriodEnd: sub.status === "cancelled",
        periodStart: sub.current_start ? new Date(sub.current_start * 1000) : null,
        periodEnd: sub.current_end ? new Date(sub.current_end * 1000) : null,
      });
    } else if (payment && (event.event === "payment.captured" || event.event === "order.paid") && payment.notes?.userId && payment.notes.product) {
      await recordPurchase(db, {
        provider: "razorpay",
        userId: payment.notes.userId,
        paymentId: payment.id,
        product: payment.notes.product,
        amount: payment.amount,
        currency: payment.currency,
        status: "paid",
        cardId: payment.notes.cardId ?? null,
      });
    } else if (payment && event.event === "payment.failed" && payment.notes?.userId && payment.notes.product) {
      await recordPurchase(db, { provider: "razorpay", userId: payment.notes.userId, paymentId: payment.id, product: payment.notes.product, amount: payment.amount, currency: payment.currency, status: "failed" });
    } else if (refund && event.event.startsWith("refund.")) {
      await setPurchaseStatus(db, "razorpay", refund.payment_id, "refunded");
    }
  } catch (e) {
    await db.from("payment_events").delete().eq("provider", "razorpay").eq("event_id", eventId);
    console.error("[razorpay webhook]", e);
    return Response.json({ error: "Processing failed." }, { status: 500 });
  }
  return Response.json({ received: true });
}

import "server-only";
import { serverEnv } from "../config";
import { DELIVERY_EVENT, inngest } from "./client";

export type DeliveryQueueResult = { queued: true; via: "inngest" } | { queued: false; reason: string };

/** Tells the job runner about a newly scheduled delivery. The database row is the source of truth. */
export async function scheduleDeliveryJob(cardId: string, scheduledAt: string | null): Promise<DeliveryQueueResult> {
  if (!serverEnv.inngestEventKey && process.env.NODE_ENV === "production") {
    return { queued: false, reason: "Background jobs aren't configured (INNGEST_EVENT_KEY). The delivery is saved and will be sent once jobs are connected." };
  }
  try {
    await inngest.send({ name: DELIVERY_EVENT, id: `delivery-${cardId}-${scheduledAt ?? "now"}`, data: { cardId, scheduledAt } });
    return { queued: true, via: "inngest" };
  } catch (e) {
    return { queued: false, reason: `Couldn't reach the job runner (${e instanceof Error ? e.message : "unknown error"}). The delivery is saved; the 5-minute sweep will send it.` };
  }
}

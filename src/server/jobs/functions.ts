import { cleanupMedia, dispatchDueDeliveries } from "./deliveries";
import { DELIVERY_EVENT, inngest } from "./client";

/** Sleeps until the delivery time, then dispatches. Cancelled/rescheduled jobs are skipped by the claim. */
export const deliverScheduledCard = inngest.createFunction(
  { id: "deliver-scheduled-card", triggers: [{ event: DELIVERY_EVENT }], retries: 5 },
  async ({ event, step }) => {
    const at = (event.data as { scheduledAt?: string | null }).scheduledAt;
    if (at && new Date(at).getTime() > Date.now()) await step.sleepUntil("wait-for-delivery-time", at);
    return step.run("dispatch-due-deliveries", () => dispatchDueDeliveries());
  },
);

/** Safety net: picks up anything due (including retries with backoff) every five minutes. */
export const deliveriesSweep = inngest.createFunction(
  { id: "deliveries-sweep", triggers: [{ cron: "*/5 * * * *" }] },
  async ({ step }) => step.run("dispatch-due-deliveries", () => dispatchDueDeliveries(50)),
);

export const mediaCleanup = inngest.createFunction(
  { id: "media-cleanup", triggers: [{ cron: "30 3 * * *" }] },
  async ({ step }) => step.run("cleanup-media", () => cleanupMedia()),
);

export const functions = [deliverScheduledCard, deliveriesSweep, mediaCleanup];

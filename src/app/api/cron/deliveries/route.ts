import { assertCron } from "@/server/cron";
import { json, route } from "@/server/http";
import { dispatchDueDeliveries } from "@/server/jobs/deliveries";

/** Fallback scheduler for hosts without Inngest (e.g. Vercel Cron every 5 minutes). */
export const GET = route(async (req) => {
  assertCron(req);
  return json({ results: await dispatchDueDeliveries(50) });
});

import { assertCron } from "@/server/cron";
import { json, route } from "@/server/http";
import { cleanupMedia } from "@/server/jobs/deliveries";

export const GET = route(async (req) => {
  assertCron(req);
  return json(await cleanupMedia());
});

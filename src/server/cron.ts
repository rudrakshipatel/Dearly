import "server-only";
import { timingSafeEqual } from "node:crypto";
import { serverEnv } from "./config";
import { ApiError } from "./http";

/** Vercel Cron sends `Authorization: Bearer $CRON_SECRET`. */
export function assertCron(req: Request) {
  const expected = serverEnv.cronSecret;
  const got = req.headers.get("authorization")?.replace(/^Bearer /, "") ?? "";
  if (!expected) throw new ApiError(503, "CRON_SECRET isn't configured.", "not_configured");
  const a = Buffer.from(got);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) throw new ApiError(401, "Unauthorised.", "unauthenticated");
}

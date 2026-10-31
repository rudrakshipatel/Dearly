import "server-only";
import type { PostgrestError } from "@supabase/supabase-js";
import { unstable_rethrow } from "next/navigation";
import { connection, NextResponse } from "next/server";
import type { z } from "zod";
import { publicEnv } from "@/lib/env";
import { supabaseServer } from "@/lib/supabase/server";
import { NotConfiguredError } from "./config";

export class ApiError extends Error {
  constructor(public status: number, message: string, public code?: string) {
    super(message);
  }
}

export function json<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(data, init);
}

/** Converts database / validation / integration errors into consistent JSON responses. */
export function errorResponse(e: unknown) {
  if (e instanceof ApiError) return json({ error: e.message, code: e.code }, { status: e.status });
  if (e instanceof NotConfiguredError) return json({ error: e.message, code: "not_configured" }, { status: 503 });
  const pg = e as Partial<PostgrestError>;
  if (pg && typeof pg === "object" && "code" in pg && typeof pg.message === "string") {
    if (pg.hint === "entitlement") return json({ error: pg.message, code: "entitlement" }, { status: 402 });
    if (pg.hint === "rate_limited") return json({ error: pg.message, code: "rate_limited" }, { status: 429 });
    switch (pg.code) {
      case "42501":
        return json({ error: pg.message || "Not allowed.", code: "forbidden" }, { status: 403 });
      case "P0002":
      case "PGRST116":
        return json({ error: pg.message || "Not found.", code: "not_found" }, { status: 404 });
      case "22023":
      case "23514":
      case "22P02":
        return json({ error: pg.message, code: "invalid" }, { status: 400 });
      case "P0001":
        return json({ error: pg.message, code: "rejected" }, { status: 400 });
      case "23505":
        return json({ error: "That already exists.", code: "conflict" }, { status: 409 });
    }
  }
  console.error("[api]", e);
  return json({ error: "Something went wrong. Please try again." }, { status: 500 });
}

/** Wraps a route handler with error handling and a same-origin check for mutations (CSRF). */
export function route<A extends unknown[]>(handler: (req: Request, ...args: A) => Promise<Response>, opts: { csrf?: boolean } = {}) {
  return async (req: Request, ...args: A) => {
    // API routes always run per request (never prerendered at build time).
    await connection();
    try {
      if (opts.csrf !== false && !["GET", "HEAD", "OPTIONS"].includes(req.method)) assertSameOrigin(req);
      return await handler(req, ...args);
    } catch (e) {
      unstable_rethrow(e);
      return errorResponse(e);
    }
  };
}

export function assertSameOrigin(req: Request) {
  const origin = req.headers.get("origin");
  if (!origin) return; // non-browser clients (no ambient cookies) are covered by auth checks
  const allowed = new Set([new URL(publicEnv.siteUrl).origin, new URL(req.url).origin]);
  if (!allowed.has(origin)) throw new ApiError(403, "Cross-site request blocked.", "csrf");
}

export async function parseBody<S extends z.ZodType>(req: Request, schema: S): Promise<z.infer<S>> {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    throw new ApiError(400, "Invalid JSON body.", "invalid");
  }
  const r = schema.safeParse(raw);
  if (!r.success) {
    const issue = r.error.issues[0];
    throw new ApiError(400, `${issue?.path.join(".") || "body"}: ${issue?.message ?? "invalid"}`, "invalid");
  }
  return r.data;
}

/** The verified signed-in user, plus an RLS-scoped client acting as them. Never trusts a browser-supplied id. */
export async function requireUser() {
  const supabase = await supabaseServer();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw new ApiError(401, "Please sign in to continue.", "unauthenticated");
  return { supabase, user: data.user };
}

export async function requireAdmin() {
  const ctx = await requireUser();
  const { data } = await ctx.supabase.rpc("is_admin");
  if (!data) throw new ApiError(403, "Admins only.", "forbidden");
  return ctx;
}

export async function rateLimit(supabase: Awaited<ReturnType<typeof supabaseServer>>, bucket: string, max: number, windowSeconds: number) {
  const { data, error } = await supabase.rpc("rate_limit_self", { p_bucket: bucket, p_max: max, p_window_seconds: windowSeconds });
  if (error) throw error;
  if (!data) throw new ApiError(429, "You're going a little fast — please try again shortly.", "rate_limited");
}

export function check(error: PostgrestError | null) {
  if (error) throw error;
}

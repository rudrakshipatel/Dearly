import { z } from "zod";
import { PLAN_LIMITS } from "@/lib/entitlements";
import type { PlanId } from "@/lib/types";
import { supabaseService } from "@/lib/supabase/server";
import { integrations } from "@/server/config";
import { ApiError, check, json, parseBody, requireUser, route } from "@/server/http";

/** GET /api/me — profile, effective plan, limits and current usage. */
export const GET = route(async () => {
  const { supabase, user } = await requireUser();
  const monthStart = new Date();
  monthStart.setUTCDate(1);
  monthStart.setUTCHours(0, 0, 0, 0);
  const [profile, plan, live, storage, ai, sub] = await Promise.all([
    supabase.from("profiles").select("display_name, avatar_url, preferred_language, preferred_currency, timezone, role, suspended_at").eq("id", user.id).maybeSingle(),
    supabase.rpc("my_plan"),
    supabase.from("cards").select("id", { count: "exact", head: true }).eq("owner_id", user.id).in("status", ["published", "scheduled"]),
    supabase.from("card_media").select("file_size").eq("owner_id", user.id).limit(10000),
    supabase.from("ai_generations").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("status", "succeeded").gte("created_at", monthStart.toISOString()),
    supabase.from("subscriptions").select("provider, plan, status, cancel_at_period_end, current_period_end").eq("user_id", user.id).order("created_at", { ascending: false }).limit(1).maybeSingle(),
  ]);
  check(profile.error ?? plan.error);
  const p = (plan.data ?? "free") as PlanId;
  return json({
    user: { id: user.id, email: user.email, verified: !!user.email_confirmed_at, provider: user.app_metadata?.provider ?? "email" },
    profile: profile.data,
    plan: p,
    limits: PLAN_LIMITS[p],
    usage: {
      liveCards: live.count ?? 0,
      storageBytes: (storage.data ?? []).reduce((n, m) => n + Number(m.file_size), 0),
      aiThisMonth: ai.count ?? 0,
    },
    subscription: sub.data ?? null,
    isAdmin: profile.data?.role === "admin",
  });
});

const profilePatch = z.object({
  display_name: z.string().trim().min(1).max(80),
  preferred_language: z.string().max(10),
  preferred_currency: z.string().regex(/^[A-Z]{3}$/).nullable(),
  timezone: z.string().max(64).nullable(),
}).partial();

export const PATCH = route(async (req) => {
  const { supabase, user } = await requireUser();
  const patch = await parseBody(req, profilePatch);
  const { data, error } = await supabase.from("profiles").update(patch).eq("id", user.id).select("display_name, preferred_language, preferred_currency, timezone").single();
  check(error);
  return json({ profile: data });
});

/**
 * DELETE /api/me — permanently deletes the account. Cards, media rows, reactions and contributions
 * cascade from the profile; stored files are removed first.
 */
export const DELETE = route(async (req) => {
  const { supabase, user } = await requireUser();
  const { confirm } = await parseBody(req, z.object({ confirm: z.literal("DELETE") }));
  if (confirm !== "DELETE") throw new ApiError(400, "Type DELETE to confirm.");
  if (!integrations.serviceRole) throw new ApiError(503, "Account deletion needs SUPABASE_SERVICE_ROLE_KEY on the server. Contact support meanwhile.", "not_configured");
  const admin = supabaseService();
  const { data: media } = await admin.from("card_media").select("storage_path, thumbnail_path").eq("owner_id", user.id).limit(10000);
  const paths = (media ?? []).flatMap((m) => [m.storage_path, m.thumbnail_path].filter(Boolean) as string[]);
  for (let i = 0; i < paths.length; i += 500) await admin.storage.from("card-media").remove(paths.slice(i, i + 500));
  const { error } = await admin.auth.admin.deleteUser(user.id);
  check(error as never);
  await supabase.auth.signOut();
  return json({ ok: true });
});

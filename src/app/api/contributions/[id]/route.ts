import { z } from "zod";
import { check, json, parseBody, requireUser, route } from "@/server/http";

/** PATCH /api/contributions/:id — owner approves or rejects a submission (RLS limits this to card editors). */
export const PATCH = route(async (req, ctx: RouteContext<"/api/contributions/[id]">) => {
  const { supabase } = await requireUser();
  const { status } = await parseBody(req, z.object({ status: z.enum(["approved", "rejected", "pending"]) }));
  const { data, error } = await supabase
    .from("group_contributions")
    .update({ status, approved_at: status === "approved" ? new Date().toISOString() : null })
    .eq("id", z.string().uuid().parse((await ctx.params).id))
    .select("id, status")
    .maybeSingle();
  check(error);
  if (!data) return json({ error: "Contribution not found." }, { status: 404 });
  return json({ contribution: data });
});

export const DELETE = route(async (_req, ctx: RouteContext<"/api/contributions/[id]">) => {
  const { supabase } = await requireUser();
  const { error, count } = await supabase.from("group_contributions").delete({ count: "exact" }).eq("id", z.string().uuid().parse((await ctx.params).id));
  check(error);
  if (!count) return json({ error: "Contribution not found." }, { status: 404 });
  return json({ ok: true });
});

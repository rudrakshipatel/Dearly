import { z } from "zod";
import { check, json, requireUser, route } from "@/server/http";

/** GET /api/cards/:id/contributions — every submission (pending, approved, rejected) for the owner to review. */
export const GET = route(async (_req, ctx: RouteContext<"/api/cards/[id]/contributions">) => {
  const { supabase } = await requireUser();
  const id = z.string().uuid().parse((await ctx.params).id);
  const { data, error } = await supabase
    .from("group_contributions")
    .select("id, contributor_name, message, color, media_references, status, submitted_at, approved_at")
    .eq("card_id", id)
    .order("submitted_at", { ascending: false })
    .limit(500);
  check(error);
  const paths = (data ?? []).flatMap((c) => ((c.media_references as { path?: string }[]) ?? []).map((m) => m.path).filter(Boolean) as string[]);
  const signed = paths.length ? (await supabase.storage.from("card-media").createSignedUrls(paths, 3600)).data ?? [] : [];
  const urlFor = new Map(signed.map((s) => [s.path, s.signedUrl]));
  return json({
    contributions: (data ?? []).map((c) => ({
      id: c.id,
      name: c.contributor_name,
      message: c.message,
      color: c.color,
      status: c.status,
      submittedAt: c.submitted_at,
      media: ((c.media_references as { path?: string; src?: string; type: string }[]) ?? []).map((m) => ({ type: m.type, url: m.path ? urlFor.get(m.path) ?? null : m.src ?? null })),
    })),
  });
});

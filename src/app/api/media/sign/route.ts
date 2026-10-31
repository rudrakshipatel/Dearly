import { z } from "zod";
import { supabaseAnon, supabaseServer } from "@/lib/supabase/server";
import { check, json, parseBody, route } from "@/server/http";
import { BUCKET, SIGNED_URL_TTL } from "@/server/media";

const body = z.object({
  ids: z.array(z.string().uuid()).max(200).default([]),
  /** Group-card contribution files of a public card (signing is still gated by storage policies). */
  paths: z.array(z.string().regex(/^contributions\/[0-9a-f-]{36}\/[0-9a-f-]{36}\.(jpg|png|webp|mp4|webm)$/)).max(100).default([]),
  slug: z.string().regex(/^[a-z0-9-]{8,64}$/).optional(),
});

/**
 * POST /api/media/sign — short-lived URLs for many media items in one call.
 * With `slug`: only media referenced by that public card (anyone). Without: only the caller's own media (RLS).
 */
export const POST = route(async (req) => {
  const { ids, paths: rawPaths, slug } = await parseBody(req, body);
  let rows: { id: string; storage_path: string; thumbnail_path: string | null; media_type: string }[] = [];
  let db;
  if (slug) {
    db = supabaseAnon();
    if (ids.length) {
      const { data, error } = await db.rpc("get_public_media_paths", { p_slug: slug, p_ids: ids });
      check(error);
      rows = data ?? [];
    }
  } else {
    db = await supabaseServer();
    const { data, error } = await db.from("card_media").select("id, storage_path, thumbnail_path, media_type").in("id", ids).eq("status", "ready");
    check(error);
    rows = data ?? [];
  }
  const paths = rows.flatMap((r) => [r.storage_path, r.thumbnail_path].filter(Boolean) as string[]);
  const urls: Record<string, { url: string; thumbUrl: string | null; type: string }> = {};
  // Contribution files are signed anonymously; storage policies only allow approved files or public cards.
  if (rawPaths.length) {
    const { data } = await supabaseAnon().storage.from(BUCKET).createSignedUrls(rawPaths, SIGNED_URL_TTL);
    for (const s of data ?? []) if (!s.error && s.path && s.signedUrl) urls[`path:${s.path}`] = { url: s.signedUrl, thumbUrl: null, type: /\.(mp4|webm)$/.test(s.path) ? "video" : "image" };
  }
  if (!paths.length) return json({ urls, expiresIn: SIGNED_URL_TTL });
  const { data: signed, error } = await db.storage.from(BUCKET).createSignedUrls(paths, SIGNED_URL_TTL);
  check(error as never);
  const byPath = new Map((signed ?? []).filter((s) => !s.error).map((s) => [s.path, s.signedUrl]));
  for (const r of rows) {
    const url = byPath.get(r.storage_path);
    if (url) urls[r.id] = { url, thumbUrl: r.thumbnail_path ? byPath.get(r.thumbnail_path) ?? null : null, type: r.media_type };
  }
  return json({ urls, expiresIn: SIGNED_URL_TTL }, { headers: { "Cache-Control": "private, max-age=600" } });
});

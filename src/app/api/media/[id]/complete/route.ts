import { z } from "zod";
import { check, json, parseBody, requireUser, route } from "@/server/http";
import { verifyStoredObject } from "@/server/media";

const body = z.object({
  width: z.number().int().min(1).max(20000).nullable().optional(),
  height: z.number().int().min(1).max(20000).nullable().optional(),
  duration: z.number().min(0).max(36000).nullable().optional(),
  thumbnailUploaded: z.boolean().default(false),
});

/** POST /api/media/:id/complete — verifies the stored object and marks the media ready to use. */
export const POST = route(async (req, ctx: RouteContext<"/api/media/[id]/complete">) => {
  const { supabase } = await requireUser();
  const id = z.string().uuid().parse((await ctx.params).id);
  const b = await parseBody(req, body);
  const { data: media, error } = await supabase.from("card_media").select("*").eq("id", id).maybeSingle();
  check(error);
  if (!media) return json({ error: "Upload not found." }, { status: 404 });
  await verifyStoredObject(supabase, media.storage_path, { size: media.file_size, mime: media.mime_type });
  const { data, error: upErr } = await supabase
    .from("card_media")
    .update({
      status: "ready",
      width: b.width ?? null,
      height: b.height ?? null,
      duration: b.duration ?? null,
      thumbnail_path: b.thumbnailUploaded ? media.thumbnail_path : null,
    })
    .eq("id", id)
    .select("id, media_type, width, height, duration")
    .single();
  check(upErr);
  return json({ media: data, src: `media:${id}` });
});

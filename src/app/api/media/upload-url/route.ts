import { randomUUID } from "node:crypto";
import { z } from "zod";
import { check, json, parseBody, rateLimit, requireUser, route } from "@/server/http";
import { BUCKET, classifyUpload } from "@/server/media";

const body = z.object({
  cardId: z.string().uuid().nullable().optional(),
  fileName: z.string().max(255),
  mime: z.string().max(60),
  size: z.number().int().positive(),
  withThumbnail: z.boolean().default(false),
});

/**
 * POST /api/media/upload-url — registers a pending media row (the database enforces type, size,
 * plan and storage quota) and returns a one-time signed upload URL for the browser to PUT to.
 */
export const POST = route(async (req) => {
  const { supabase, user } = await requireUser();
  await rateLimit(supabase, "media-upload", 120, 3600);
  const b = await parseBody(req, body);
  const { kind, ext } = classifyUpload(b.mime, b.size);
  if (b.cardId) {
    const { data: ok } = await supabase.rpc("can_edit_card", { p_card_id: b.cardId });
    if (!ok) return json({ error: "Card not found." }, { status: 404 });
  }
  const id = randomUUID();
  const folder = `users/${user.id}/${b.cardId ?? "library"}`;
  const path = `${folder}/${id}.${ext}`;
  const thumbPath = b.withThumbnail && kind !== "audio" ? `${folder}/${id}-thumb.jpg` : null;

  const { error } = await supabase.from("card_media").insert({
    id,
    card_id: b.cardId ?? null,
    owner_id: user.id,
    media_type: kind,
    storage_path: path,
    thumbnail_path: thumbPath,
    original_filename: b.fileName.replace(/[^\w.\- ]+/g, "_").slice(0, 255),
    mime_type: b.mime,
    file_size: b.size,
  });
  check(error);

  const main = await supabase.storage.from(BUCKET).createSignedUploadUrl(path);
  check(main.error as never);
  const thumb = thumbPath ? await supabase.storage.from(BUCKET).createSignedUploadUrl(thumbPath) : null;
  return json({
    mediaId: id,
    kind,
    upload: { url: main.data!.signedUrl, path, token: main.data!.token },
    thumbnailUpload: thumb?.data ? { url: thumb.data.signedUrl, path: thumbPath, token: thumb.data.token } : null,
  });
});

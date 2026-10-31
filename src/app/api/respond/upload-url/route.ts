import { randomUUID } from "node:crypto";
import { z } from "zod";
import { supabaseAnon } from "@/lib/supabase/server";
import { ApiError, check, json, parseBody, route } from "@/server/http";
import { BUCKET, classifyUpload } from "@/server/media";

/** POST /api/respond/upload-url — a recipient attaches a photo to their response, when the owner allows it. */
export const POST = route(async (req) => {
  const b = await parseBody(req, z.object({ slug: z.string().regex(/^[a-z0-9-]{8,64}$/), mime: z.string().max(60), size: z.number().int().positive() }));
  const { ext } = classifyUpload(b.mime, b.size, ["image"]);
  if (b.size > 10 * 1024 * 1024) throw new ApiError(413, "Photos can be up to 10 MB.", "too_large");
  const db = supabaseAnon();
  const { data, error } = await db.rpc("get_public_card", { p_slug: b.slug });
  check(error);
  const card = (data as { state: string; card?: { id: string; allowResponsePhoto: boolean } } | null)?.card;
  if (!card?.allowResponsePhoto) throw new ApiError(403, "Photo responses aren't enabled for this card.", "forbidden");
  const path = `responses/${card.id}/${randomUUID()}.${ext}`;
  const { data: signed, error: upErr } = await db.storage.from(BUCKET).createSignedUploadUrl(path);
  check(upErr as never);
  return json({ upload: { url: signed!.signedUrl, path, token: signed!.token } });
});

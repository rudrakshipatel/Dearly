import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { MEDIA_RULES, mediaKindFor, type MediaKind } from "@/lib/entitlements";
import type { Database } from "@/lib/supabase/database.types";
import { ApiError } from "./http";

export const BUCKET = "card-media";
export const SIGNED_URL_TTL = 60 * 60;

const EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "video/mp4": "mp4",
  "video/webm": "webm",
  "audio/mpeg": "mp3",
  "audio/mp4": "m4a",
  "audio/x-m4a": "m4a",
  "audio/webm": "webm",
  "audio/ogg": "ogg",
  "audio/wav": "wav",
};

/** Validates a declared upload and returns its kind and safe file extension. Executables and unknown types are rejected. */
export function classifyUpload(mime: string, size: number, allowed: MediaKind[] = ["image", "video", "audio"]) {
  const kind = mediaKindFor(mime);
  if (!kind || !allowed.includes(kind)) {
    const list = allowed.flatMap((k) => MEDIA_RULES[k].ext).join(", ").toUpperCase();
    throw new ApiError(415, `That file type isn't supported. Use ${list}.`, "unsupported_type");
  }
  if (!Number.isFinite(size) || size <= 0) throw new ApiError(400, "Empty file.", "invalid");
  return { kind, ext: EXT[mime] };
}

/**
 * Confirms the object really exists in storage and that its stored size/type match what was declared,
 * so nothing is served before it has been validated.
 */
export async function verifyStoredObject(db: SupabaseClient<Database>, path: string, expect: { size: number; mime: string }) {
  const folder = path.slice(0, path.lastIndexOf("/"));
  const name = path.slice(path.lastIndexOf("/") + 1);
  const { data, error } = await db.storage.from(BUCKET).list(folder, { search: name, limit: 5 });
  if (error) throw error;
  const obj = data?.find((o) => o.name === name);
  if (!obj) throw new ApiError(409, "The upload hasn't finished yet.", "upload_incomplete");
  const meta = (obj.metadata ?? {}) as { size?: number; mimetype?: string };
  if ((meta.size !== undefined && meta.size !== expect.size) || (meta.mimetype && meta.mimetype !== expect.mime)) {
    await db.storage.from(BUCKET).remove([path]);
    throw new ApiError(422, "The uploaded file didn't match what was expected and was removed.", "upload_mismatch");
  }
  return obj;
}

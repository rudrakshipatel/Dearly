import { randomUUID } from "node:crypto";
import { z } from "zod";
import { supabaseAnon } from "@/lib/supabase/server";
import { ApiError, check, json, parseBody, route } from "@/server/http";
import { BUCKET, classifyUpload } from "@/server/media";

const LIMITS = { image: 10 * 1024 * 1024, video: 50 * 1024 * 1024 } as const;

/** POST /api/contribute/upload-url — contributors (no account) upload a photo or video to an open group card. */
export const POST = route(async (req) => {
  const b = await parseBody(req, z.object({ token: z.string().regex(/^[A-Za-z0-9]{24,64}$/), mime: z.string().max(60), size: z.number().int().positive() }));
  const { kind, ext } = classifyUpload(b.mime, b.size, ["image", "video"]);
  if (b.size > LIMITS[kind as "image" | "video"]) throw new ApiError(413, kind === "image" ? "Photos can be up to 10 MB." : "Videos can be up to 50 MB.", "too_large");
  const db = supabaseAnon();
  const { data: invite, error } = await db.rpc("get_contribution_invite", { p_token: b.token });
  check(error);
  const inv = invite as { cardId: string; isOpen: boolean } | null;
  if (!inv?.isOpen) throw new ApiError(410, "This group card isn't accepting contributions.", "closed");
  const path = `contributions/${inv.cardId}/${randomUUID()}.${ext}`;
  const { data, error: upErr } = await db.storage.from(BUCKET).createSignedUploadUrl(path);
  check(upErr as never);
  return json({ upload: { url: data!.signedUrl, path, token: data!.token }, kind });
});

import { z } from "zod";
import { check, json, requireUser, route } from "@/server/http";
import { BUCKET } from "@/server/media";

/** DELETE /api/media/:id — removes media the owner no longer uses. Media still on a card is kept. */
export const DELETE = route(async (_req, ctx: RouteContext<"/api/media/[id]">) => {
  const { supabase } = await requireUser();
  const id = z.string().uuid().parse((await ctx.params).id);
  const { data: free } = await supabase.rpc("my_unreferenced_media", { p_ids: [id] });
  if (!(free as string[] | null)?.includes(id)) {
    return json({ error: "This file is still used on a card. Remove it from the card first.", code: "in_use" }, { status: 409 });
  }
  const { data: media, error } = await supabase.from("card_media").select("storage_path, thumbnail_path").eq("id", id).maybeSingle();
  check(error);
  if (!media) return json({ error: "Not found." }, { status: 404 });
  await supabase.storage.from(BUCKET).remove([media.storage_path, media.thumbnail_path].filter(Boolean) as string[]);
  await supabase.from("card_media").delete().eq("id", id);
  return json({ ok: true });
});

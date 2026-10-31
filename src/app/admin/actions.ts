"use server";

import { updateTag } from "next/cache";
import { z } from "zod";
import { CATALOG_TAG } from "@/server/catalog";
import { requireAdmin } from "@/server/http";

/** Every action re-checks admin rights server-side; RLS enforces the same rule in the database. */
type Result = { ok: true } | { ok: false; error: string };
const fail = (e: unknown): Result => ({ ok: false, error: e instanceof Error ? e.message : (e as { message?: string })?.message ?? "Something went wrong." });

const slug = z.string().regex(/^[a-z0-9-]{1,80}$/, "Use lowercase letters, numbers and dashes.");

const templateInput = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(1).max(80),
  slug,
  description: z.string().max(1000).default(""),
  occasionId: z.string().uuid(),
  experience: z.enum(["letter", "surprise", "memories", "reveal", "together", "classic", "video"]),
  style: z.enum(["minimal", "romantic", "elegant", "playful", "vintage", "modern", "floral", "scrapbook", "editorial", "festive"]),
  isPremium: z.boolean(),
  isPublished: z.boolean(),
  preview: z.object({
    palette: z.string().max(40),
    motif: z.string().max(40),
    headline: z.string().max(60),
    font: z.enum(["display", "sans", "hand", "script"]),
    pages: z.number().int().min(1).max(30),
    photoSlots: z.number().int().min(0).max(12),
    category: z.enum(["classic-cards", "interactive-surprises", "love-letters", "memory-books", "video-greetings", "group-cards", "time-capsules"]),
    popularity: z.number().int().min(0).max(100).default(50),
  }),
  interactions: z.array(z.enum(["envelope", "gift", "scratch", "tap", "flip", "balloon", "photo-reveal", "quiz", "story", "scrapbook", "video", "group"])).min(1),
});

export async function saveTemplate(input: z.input<typeof templateInput>): Promise<Result> {
  try {
    const { supabase } = await requireAdmin();
    const t = templateInput.parse(input);
    const row = {
      name: t.name,
      slug: t.slug,
      description: t.description,
      occasion_id: t.occasionId,
      experience_type: t.experience,
      style_category: t.style,
      is_premium: t.isPremium,
      is_published: t.isPublished,
      preview_data: { ...t.preview, addedAt: new Date().toISOString().slice(0, 10) },
      supported_interactions: t.interactions,
    };
    const { error } = t.id ? await supabase.from("templates").update(row).eq("id", t.id) : await supabase.from("templates").insert(row);
    if (error) throw error;
    updateTag(CATALOG_TAG);
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function setTemplateFlags(id: string, flags: { isPremium?: boolean; isPublished?: boolean }): Promise<Result> {
  try {
    const { supabase } = await requireAdmin();
    const patch: { is_premium?: boolean; is_published?: boolean } = {};
    if (flags.isPremium !== undefined) patch.is_premium = flags.isPremium;
    if (flags.isPublished !== undefined) patch.is_published = flags.isPublished;
    const { error } = await supabase.from("templates").update(patch).eq("id", z.string().uuid().parse(id));
    if (error) throw error;
    updateTag(CATALOG_TAG);
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

/** Uploads a thumbnail to the public `catalog` bucket and stores its URL on the template or occasion. */
export async function uploadThumbnail(kind: "templates" | "occasions", id: string, form: FormData): Promise<Result> {
  try {
    const { supabase } = await requireAdmin();
    const file = form.get("file");
    if (!(file instanceof File)) throw new Error("Choose an image.");
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) throw new Error("Use a JPG, PNG or WebP image.");
    if (file.size > 5 * 1024 * 1024) throw new Error("Thumbnails can be up to 5 MB.");
    const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
    const path = `${kind}/${z.string().uuid().parse(id)}-${Date.now()}.${ext}`;
    const up = await supabase.storage.from("catalog").upload(path, file, { contentType: file.type, upsert: false });
    if (up.error) throw up.error;
    const url = supabase.storage.from("catalog").getPublicUrl(path).data.publicUrl;
    const { error } = await supabase.from(kind).update({ thumbnail_url: url }).eq("id", id);
    if (error) throw error;
    updateTag(CATALOG_TAG);
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

const occasionInput = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(1).max(80),
  slug: z.string().regex(/^[a-z0-9-]{1,60}$/),
  description: z.string().max(1000).default(""),
  isActive: z.boolean(),
  sortOrder: z.number().int().min(0).max(1000).default(0),
  theme: z.object({
    palette: z.string().max(40),
    motif: z.string().max(40),
    short: z.string().max(80),
    headline: z.string().max(120),
    prompts: z.array(z.string().max(200)).max(6).default([]),
  }),
});

export async function saveOccasion(input: z.input<typeof occasionInput>): Promise<Result> {
  try {
    const { supabase } = await requireAdmin();
    const o = occasionInput.parse(input);
    const existing = o.id ? (await supabase.from("occasions").select("theme_config").eq("id", o.id).maybeSingle()).data : null;
    const row = {
      name: o.name,
      slug: o.slug,
      description: o.description,
      is_active: o.isActive,
      sort_order: o.sortOrder,
      theme_config: { ...((existing?.theme_config as object) ?? {}), ...o.theme },
    };
    const { error } = o.id ? await supabase.from("occasions").update(row).eq("id", o.id) : await supabase.from("occasions").insert(row);
    if (error) throw error;
    updateTag(CATALOG_TAG);
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function setSuspension(userId: string, suspend: boolean, reason?: string): Promise<Result> {
  try {
    const { supabase } = await requireAdmin();
    const { error } = await supabase.rpc("admin_set_suspension", { p_user: z.string().uuid().parse(userId), p_suspend: suspend, p_reason: reason?.slice(0, 500) });
    if (error) throw error;
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function moderateCard(cardId: string, disable: boolean, reason?: string, reportId?: string): Promise<Result> {
  try {
    const { supabase } = await requireAdmin();
    const { error } = await supabase.rpc("admin_moderate_card", { p_card_id: z.string().uuid().parse(cardId), p_disable: disable, p_reason: reason?.slice(0, 500), p_report_id: reportId });
    if (error) throw error;
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

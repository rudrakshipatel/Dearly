import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { occasions as staticOccasions } from "@/lib/data/occasions";
import { templates as staticTemplates } from "@/lib/data/templates";
import { publicEnv } from "@/lib/env";
import { supabaseAnon } from "@/lib/supabase/server";
import type { Occasion, Template, TemplateCategory } from "@/lib/types";

export const CATALOG_TAG = "catalog";

export interface Catalog {
  templates: Template[];
  occasions: Occasion[];
  source: "database" | "static";
}

/**
 * Published templates and active occasions, cached across requests and invalidated
 * (revalidateTag("catalog")) when admins edit the catalogue.
 */
export async function getCatalog(): Promise<Catalog> {
  "use cache";
  cacheTag(CATALOG_TAG);
  cacheLife("hours");

  if (!publicEnv.supabaseUrl) return { templates: staticTemplates, occasions: staticOccasions, source: "static" };
  const db = supabaseAnon();
  const [o, t] = await Promise.all([
    db.from("occasions").select("id, slug, name, description, theme_config, sort_order").eq("is_active", true).order("sort_order"),
    db.from("templates").select("slug, name, description, experience_type, preview_data, supported_interactions, style_category, is_premium, occasions(slug)").eq("is_published", true),
  ]);
  if (o.error || t.error || !o.data || !t.data) {
    console.error("[catalog] falling back to static catalogue", o.error ?? t.error);
    return { templates: staticTemplates, occasions: staticOccasions, source: "static" };
  }

  const occasions: Occasion[] = o.data.map((row) => {
    const th = (row.theme_config ?? {}) as Record<string, unknown>;
    const fallback = staticOccasions.find((s) => s.slug === row.slug);
    return {
      slug: row.slug as Occasion["slug"],
      name: row.name,
      description: row.description ?? "",
      short: (th.short as string) ?? fallback?.short ?? "",
      headline: (th.headline as string) ?? fallback?.headline ?? row.name,
      palette: (th.palette as Occasion["palette"]) ?? fallback?.palette ?? "rose-cream",
      motif: (th.motif as Occasion["motif"]) ?? fallback?.motif ?? "envelope",
      suggested: (th.suggested as Occasion["suggested"]) ?? fallback?.suggested ?? ["letter"],
      related: (th.related as Occasion["related"]) ?? fallback?.related ?? [],
      prompts: (th.prompts as string[]) ?? fallback?.prompts ?? [],
    };
  });

  const templates: Template[] = t.data.map((row) => {
    const p = (row.preview_data ?? {}) as Record<string, unknown>;
    const interactions = (row.supported_interactions as Template["interactions"]) ?? ["envelope"];
    const occ = (row.occasions as unknown as { slug: string } | null)?.slug ?? "just-because";
    return {
      id: `tpl-${row.slug}`,
      name: row.name,
      description: row.description ?? "",
      occasion: occ as Template["occasion"],
      category: (p.category as TemplateCategory) ?? "classic-cards",
      experience: row.experience_type,
      style: row.style_category as Template["style"],
      palette: (p.palette as Template["palette"]) ?? "rose-cream",
      motif: (p.motif as Template["motif"]) ?? "envelope",
      headline: (p.headline as string) ?? row.name,
      font: (p.font as Template["font"]) ?? "display",
      pages: Number(p.pages ?? 2),
      photoSlots: Number(p.photoSlots ?? 0),
      interactions,
      interactive: !(interactions.length === 1 && interactions[0] === "story"),
      premium: row.is_premium,
      popularity: Number(p.popularity ?? 50),
      addedAt: (p.addedAt as string) ?? "2026-01-01",
    };
  });
  return { templates, occasions, source: "database" };
}

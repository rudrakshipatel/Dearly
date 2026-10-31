"use client";

import { Plus, Upload } from "lucide-react";
import { useState } from "react";
import { paletteList } from "@/lib/data/palettes";
import { saveTemplate, setTemplateFlags, uploadThumbnail } from "@/app/admin/actions";
import type { Motif } from "@/lib/types";
import { TemplateThumb } from "../art/template-thumb";
import { Button } from "../ui/button";
import { Dialog, DialogContent } from "../ui/dialog";
import { Field, Input, Select, Switch, Textarea } from "../ui/form";
import { Badge } from "../ui/misc";
import { useAdminAction } from "./use-action";

export interface AdminTemplate {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  occasion_id: string;
  experience_type: string;
  style_category: string;
  is_premium: boolean;
  is_published: boolean;
  thumbnail_url: string | null;
  preview_data: { palette?: string; motif?: string; headline?: string; font?: string; pages?: number; photoSlots?: number; category?: string; popularity?: number };
  supported_interactions: string[];
}

const MOTIFS = ["envelope", "gift", "polaroids", "balloons", "scratch", "floral", "stars", "cake", "hearts", "tree", "champagne", "rings", "cap", "sun", "botanical", "capsule", "film", "confetti"];
const STYLES = ["minimal", "romantic", "elegant", "playful", "vintage", "modern", "floral", "scrapbook", "editorial", "festive"];
const EXPERIENCES = ["letter", "surprise", "memories", "reveal", "together", "classic", "video"];
const CATEGORIES = ["classic-cards", "interactive-surprises", "love-letters", "memory-books", "video-greetings", "group-cards", "time-capsules"];
const MODES = ["envelope", "gift", "scratch", "tap", "flip", "balloon", "photo-reveal", "quiz", "story", "scrapbook", "video", "group"];

export function TemplatesAdmin({ templates, occasions }: { templates: AdminTemplate[]; occasions: { id: string; name: string; slug: string }[] }) {
  const [editing, setEditing] = useState<AdminTemplate | "new" | null>(null);
  const { run, pending } = useAdminAction();
  const occName = (id: string) => occasions.find((o) => o.id === id)?.name ?? "—";
  return (
    <>
      <div className="flex items-end justify-between">
        <h1 className="font-display text-5xl">Templates</h1>
        <Button onClick={() => setEditing("new")}>
          <Plus /> New template
        </Button>
      </div>
      <p className="mt-2 text-[14px] text-muted">{templates.filter((t) => t.is_published).length} published of {templates.length}. Changes refresh the public catalogue immediately.</p>
      <div className="mt-6 overflow-x-auto rounded-2xl border border-line bg-paper">
        <table className="w-full min-w-[760px] text-left text-[14px]">
          <thead className="border-b border-line text-[12px] uppercase tracking-wider text-muted">
            <tr>
              <th className="px-4 py-3 font-medium">Template</th>
              <th className="px-4 py-3 font-medium">Occasion</th>
              <th className="px-4 py-3 font-medium">Experience</th>
              <th className="px-4 py-3 font-medium">Premium</th>
              <th className="px-4 py-3 font-medium">Published</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {templates.map((t) => (
              <tr key={t.id} className="border-t border-line">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 overflow-hidden rounded">
                      {t.thumbnail_url ? (
                        // eslint-disable-next-line @next/next/no-img-element -- public catalog asset
                        <img src={t.thumbnail_url} alt="" className="aspect-[3/4] w-full object-cover" />
                      ) : (
                        <TemplateThumb palette={(t.preview_data.palette ?? "rose-cream") as never} motif={(t.preview_data.motif ?? "envelope") as Motif} headline="" size="sm" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium">{t.name}</p>
                      <p className="text-[12px] text-muted">{t.slug}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">{occName(t.occasion_id)}</td>
                <td className="px-4 py-3 capitalize">{t.experience_type}</td>
                <td className="px-4 py-3">
                  <Switch checked={t.is_premium} label={`Premium: ${t.name}`} onChange={(v) => run(() => setTemplateFlags(t.id, { isPremium: v }))} />
                </td>
                <td className="px-4 py-3">
                  <Switch checked={t.is_published} label={`Published: ${t.name}`} onChange={(v) => run(() => setTemplateFlags(t.id, { isPublished: v }), v ? "Published." : "Unpublished.")} />
                </td>
                <td className="px-4 py-3 text-right">
                  <Button size="sm" variant="outline" onClick={() => setEditing(t)} disabled={pending}>
                    Edit
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {editing && <TemplateForm template={editing === "new" ? null : editing} occasions={occasions} onClose={() => setEditing(null)} />}
    </>
  );
}

function TemplateForm({ template, occasions, onClose }: { template: AdminTemplate | null; occasions: { id: string; name: string }[]; onClose: () => void }) {
  const p = template?.preview_data ?? {};
  const [f, setF] = useState({
    name: template?.name ?? "",
    slug: template?.slug ?? "",
    description: template?.description ?? "",
    occasionId: template?.occasion_id ?? occasions[0]?.id ?? "",
    experience: template?.experience_type ?? "letter",
    style: template?.style_category ?? "romantic",
    isPremium: template?.is_premium ?? false,
    isPublished: template?.is_published ?? false,
    palette: p.palette ?? "rose-cream",
    motif: p.motif ?? "envelope",
    headline: p.headline ?? "",
    font: p.font ?? "display",
    pages: p.pages ?? 2,
    photoSlots: p.photoSlots ?? 1,
    category: p.category ?? "love-letters",
    popularity: p.popularity ?? 50,
    interactions: template?.supported_interactions ?? ["envelope"],
  });
  const { run, pending } = useAdminAction();
  const set = (patch: Partial<typeof f>) => setF((x) => ({ ...x, ...patch }));
  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent title={template ? `Edit ${template.name}` : "New template"} size="lg">
        <div className="grid gap-6 md:grid-cols-[1fr_200px]">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Name" htmlFor="t-name">
              <Input id="t-name" value={f.name} onChange={(e) => set({ name: e.target.value })} />
            </Field>
            <Field label="Slug" htmlFor="t-slug" hint="Used in links; lowercase and dashes.">
              <Input id="t-slug" value={f.slug} onChange={(e) => set({ slug: e.target.value.toLowerCase() })} />
            </Field>
            <Field label="Description" htmlFor="t-desc" className="sm:col-span-2">
              <Textarea id="t-desc" value={f.description} onChange={(e) => set({ description: e.target.value })} className="min-h-16" />
            </Field>
            <Field label="Occasion" htmlFor="t-occ">
              <Select id="t-occ" value={f.occasionId} onChange={(e) => set({ occasionId: e.target.value })}>
                {occasions.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Experience" htmlFor="t-exp">
              <Select id="t-exp" value={f.experience} onChange={(e) => set({ experience: e.target.value })}>
                {EXPERIENCES.map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </Select>
            </Field>
            <Field label="Category" htmlFor="t-cat">
              <Select id="t-cat" value={f.category} onChange={(e) => set({ category: e.target.value })}>
                {CATEGORIES.map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </Select>
            </Field>
            <Field label="Style" htmlFor="t-style">
              <Select id="t-style" value={f.style} onChange={(e) => set({ style: e.target.value })}>
                {STYLES.map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </Select>
            </Field>
            <Field label="Palette" htmlFor="t-pal">
              <Select id="t-pal" value={f.palette} onChange={(e) => set({ palette: e.target.value })}>
                {paletteList.map((x) => (
                  <option key={x.id} value={x.id}>
                    {x.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Illustration" htmlFor="t-motif">
              <Select id="t-motif" value={f.motif} onChange={(e) => set({ motif: e.target.value })}>
                {MOTIFS.map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </Select>
            </Field>
            <Field label="Headline" htmlFor="t-head">
              <Input id="t-head" value={f.headline} onChange={(e) => set({ headline: e.target.value })} maxLength={60} />
            </Field>
            <Field label="Headline font" htmlFor="t-font">
              <Select id="t-font" value={f.font} onChange={(e) => set({ font: e.target.value })}>
                {["display", "sans", "hand", "script"].map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </Select>
            </Field>
            <Field label="Pages" htmlFor="t-pages">
              <Input id="t-pages" type="number" min={1} max={30} value={f.pages} onChange={(e) => set({ pages: Number(e.target.value) })} />
            </Field>
            <Field label="Photo slots" htmlFor="t-photos">
              <Input id="t-photos" type="number" min={0} max={12} value={f.photoSlots} onChange={(e) => set({ photoSlots: Number(e.target.value) })} />
            </Field>
            <div className="sm:col-span-2">
              <p className="mb-1.5 text-[13px] font-medium text-ink/80">Interactions</p>
              <div className="flex flex-wrap gap-1.5">
                {MODES.map((m) => {
                  const on = f.interactions.includes(m);
                  return (
                    <button
                      key={m}
                      type="button"
                      aria-pressed={on}
                      onClick={() => set({ interactions: on ? f.interactions.filter((x) => x !== m) : [...f.interactions, m] })}
                      className={on ? "rounded-full bg-ink px-3 py-1 text-[12px] text-ivory" : "rounded-full border border-line px-3 py-1 text-[12px]"}
                    >
                      {m}
                    </button>
                  );
                })}
              </div>
            </div>
            <label className="flex items-center justify-between gap-3 text-[14px]">
              Premium <Switch checked={f.isPremium} onChange={(v) => set({ isPremium: v })} label="Premium" />
            </label>
            <label className="flex items-center justify-between gap-3 text-[14px]">
              Published <Switch checked={f.isPublished} onChange={(v) => set({ isPublished: v })} label="Published" />
            </label>
          </div>
          <div>
            <div className="overflow-hidden rounded-xl shadow-soft">
              <TemplateThumb palette={f.palette as never} motif={f.motif as Motif} headline={f.headline || f.name} font={f.font as never} />
            </div>
            {template && (
              <form
                className="mt-3"
                action={(fd) => {
                  void run(() => uploadThumbnail("templates", template.id, fd), "Thumbnail uploaded.");
                }}
              >
                <label className="block text-[12px] text-muted">
                  Custom thumbnail
                  <input name="file" type="file" accept="image/jpeg,image/png,image/webp" className="mt-1 block w-full text-[12px]" required />
                </label>
                <Button size="sm" variant="outline" className="mt-2" type="submit">
                  <Upload /> Upload
                </Button>
                {template.thumbnail_url && <Badge className="mt-2">Has thumbnail</Badge>}
              </form>
            )}
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            loading={pending}
            onClick={async () => {
              const ok = await run(() =>
                saveTemplate({
                  id: template?.id,
                  name: f.name,
                  slug: f.slug,
                  description: f.description,
                  occasionId: f.occasionId,
                  experience: f.experience as never,
                  style: f.style as never,
                  isPremium: f.isPremium,
                  isPublished: f.isPublished,
                  preview: { palette: f.palette, motif: f.motif, headline: f.headline, font: f.font as never, pages: f.pages, photoSlots: f.photoSlots, category: f.category as never, popularity: f.popularity },
                  interactions: f.interactions as never,
                }),
              );
              if (ok) onClose();
            }}
          >
            Save template
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import { Plus } from "lucide-react";
import { useState } from "react";
import { saveOccasion } from "@/app/admin/actions";
import { paletteList } from "@/lib/data/palettes";
import type { Motif } from "@/lib/types";
import { MotifArt } from "../art/motif";
import { Button } from "../ui/button";
import { Dialog, DialogContent } from "../ui/dialog";
import { Field, Input, Select, Switch, Textarea } from "../ui/form";
import { useAdminAction } from "./use-action";

export interface AdminOccasion {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  is_active: boolean;
  sort_order: number;
  thumbnail_url: string | null;
  theme_config: { palette?: string; motif?: string; short?: string; headline?: string; prompts?: string[] };
}

const MOTIFS = ["envelope", "gift", "polaroids", "balloons", "scratch", "floral", "stars", "cake", "hearts", "tree", "champagne", "rings", "cap", "sun", "botanical", "capsule", "film", "confetti"];

export function OccasionsAdmin({ occasions }: { occasions: AdminOccasion[] }) {
  const [editing, setEditing] = useState<AdminOccasion | "new" | null>(null);
  const { run } = useAdminAction();
  return (
    <>
      <div className="flex items-end justify-between">
        <h1 className="font-display text-5xl">Occasions</h1>
        <Button onClick={() => setEditing("new")}>
          <Plus /> New occasion
        </Button>
      </div>
      <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {occasions.map((o) => (
          <li key={o.id} className="flex items-center gap-4 rounded-2xl border border-line bg-paper p-4">
            <MotifArt motif={(o.theme_config.motif ?? "envelope") as Motif} palette={(o.theme_config.palette ?? "rose-cream") as never} className="size-14 shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="font-medium">{o.name}</p>
              <p className="truncate text-[12px] text-muted">/{o.slug}</p>
            </div>
            <Switch
              checked={o.is_active}
              label={`Visible: ${o.name}`}
              onChange={(v) =>
                run(() => saveOccasion({ id: o.id, name: o.name, slug: o.slug, description: o.description ?? "", isActive: v, sortOrder: o.sort_order, theme: { palette: o.theme_config.palette ?? "rose-cream", motif: o.theme_config.motif ?? "envelope", short: o.theme_config.short ?? "", headline: o.theme_config.headline ?? o.name, prompts: o.theme_config.prompts ?? [] } }), v ? "Visible." : "Hidden.")
              }
            />
            <Button size="sm" variant="outline" onClick={() => setEditing(o)}>
              Edit
            </Button>
          </li>
        ))}
      </ul>
      {editing && <OccasionForm occasion={editing === "new" ? null : editing} onClose={() => setEditing(null)} />}
    </>
  );
}

function OccasionForm({ occasion, onClose }: { occasion: AdminOccasion | null; onClose: () => void }) {
  const t = occasion?.theme_config ?? {};
  const [f, setF] = useState({
    name: occasion?.name ?? "",
    slug: occasion?.slug ?? "",
    description: occasion?.description ?? "",
    isActive: occasion?.is_active ?? true,
    sortOrder: occasion?.sort_order ?? 99,
    palette: t.palette ?? "rose-cream",
    motif: t.motif ?? "envelope",
    short: t.short ?? "",
    headline: t.headline ?? "",
    prompts: (t.prompts ?? []).join("\n"),
  });
  const { run, pending } = useAdminAction();
  const set = (p: Partial<typeof f>) => setF((x) => ({ ...x, ...p }));
  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent title={occasion ? `Edit ${occasion.name}` : "New occasion"} size="lg">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Name" htmlFor="o-name">
            <Input id="o-name" value={f.name} onChange={(e) => set({ name: e.target.value })} />
          </Field>
          <Field label="Slug" htmlFor="o-slug">
            <Input id="o-slug" value={f.slug} onChange={(e) => set({ slug: e.target.value.toLowerCase() })} />
          </Field>
          <Field label="Short line" htmlFor="o-short">
            <Input id="o-short" value={f.short} onChange={(e) => set({ short: e.target.value })} />
          </Field>
          <Field label="Page headline" htmlFor="o-head">
            <Input id="o-head" value={f.headline} onChange={(e) => set({ headline: e.target.value })} />
          </Field>
          <Field label="Description" htmlFor="o-desc" className="sm:col-span-2">
            <Textarea id="o-desc" value={f.description} onChange={(e) => set({ description: e.target.value })} className="min-h-16" />
          </Field>
          <Field label="Palette" htmlFor="o-pal">
            <Select id="o-pal" value={f.palette} onChange={(e) => set({ palette: e.target.value })}>
              {paletteList.map((x) => (
                <option key={x.id} value={x.id}>
                  {x.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Illustration" htmlFor="o-motif">
            <Select id="o-motif" value={f.motif} onChange={(e) => set({ motif: e.target.value })}>
              {MOTIFS.map((x) => (
                <option key={x}>{x}</option>
              ))}
            </Select>
          </Field>
          <Field label="Message ideas (one per line)" htmlFor="o-prompts" className="sm:col-span-2">
            <Textarea id="o-prompts" value={f.prompts} onChange={(e) => set({ prompts: e.target.value })} className="min-h-20" />
          </Field>
          <Field label="Sort order" htmlFor="o-sort">
            <Input id="o-sort" type="number" value={f.sortOrder} onChange={(e) => set({ sortOrder: Number(e.target.value) })} />
          </Field>
          <label className="flex items-center justify-between gap-3 self-end text-[14px]">
            Visible on the site <Switch checked={f.isActive} onChange={(v) => set({ isActive: v })} label="Visible" />
          </label>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            loading={pending}
            onClick={async () => {
              const ok = await run(() =>
                saveOccasion({
                  id: occasion?.id,
                  name: f.name,
                  slug: f.slug,
                  description: f.description,
                  isActive: f.isActive,
                  sortOrder: f.sortOrder,
                  theme: { palette: f.palette, motif: f.motif, short: f.short, headline: f.headline, prompts: f.prompts.split("\n").map((p) => p.trim()).filter(Boolean).slice(0, 6) },
                }),
              );
              if (ok) onClose();
            }}
          >
            Save occasion
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

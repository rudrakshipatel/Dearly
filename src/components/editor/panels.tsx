"use client";

import {
  ArrowDown,
  ArrowUp,
  Copy,
  ImagePlus,
  Loader2,
  Music,
  Play,
  Plus,
  Trash2,
  Upload,
} from "lucide-react";
import { useRef, useState } from "react";
import { buildPages } from "@/lib/creation";
import { paletteList, palettes } from "@/lib/data/palettes";
import { templates } from "@/lib/data/templates";
import { uploadService } from "@/lib/services";
import type { CardPage, Creation, ElementAnimation, Motif, ShapeElement } from "@/lib/types";
import { cn } from "@/lib/utils";
import { MotifArt } from "../art/motif";
import { PhotoView, sceneNames } from "../art/scene";
import { StickerArt, stickers } from "../art/stickers";
import { TemplateThumb } from "../art/template-thumb";
import { CardPageView } from "../card/page-view";
import { ColorRow } from "../create/interaction-controls";
import { Button } from "../ui/button";
import { ConfirmDialog } from "../ui/dialog";
import { useToast } from "../ui/toast";
import { newImage, newMotif, newShape, newSticker, newText, textPresets, type EditorActions } from "./store";

export type PanelId = "templates" | "text" | "uploads" | "photos" | "backgrounds" | "stickers" | "elements" | "animations" | "audio" | "pages";

interface PanelProps {
  doc: Creation;
  page: CardPage;
  pageIndex: number;
  selectedId: string | null;
  actions: EditorActions;
  onDone?: () => void;
}

function PanelTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="mb-3 text-[12px] font-medium uppercase tracking-[0.14em] text-muted">{children}</h2>;
}

export function TemplatesPanel({ doc, actions, onDone }: PanelProps) {
  const [pending, setPending] = useState<string | null>(null);
  const t = templates.find((x) => x.id === pending);
  return (
    <div>
      <PanelTitle>Switch template</PanelTitle>
      <p className="mb-4 text-[13px] text-muted">Your words and photos come with you. The design is replaced.</p>
      <div className="grid grid-cols-2 gap-2.5">
        {templates.map((x) => (
          <button key={x.id} onClick={() => setPending(x.id)} className={cn("overflow-hidden rounded-xl border-2 text-left", doc.templateId === x.id ? "border-burgundy" : "border-transparent hover:border-ink/15")} aria-label={`Apply ${x.name}`}>
            <TemplateThumb palette={x.palette} motif={x.motif} headline={x.headline} font={x.font} size="sm" />
          </button>
        ))}
      </div>
      <ConfirmDialog
        open={!!pending}
        onOpenChange={(v) => !v && setPending(null)}
        title={`Apply “${t?.name}”?`}
        description="This replaces the current pages with the new design. You can undo it."
        confirmLabel="Apply template"
        onConfirm={() => {
          if (!t) return;
          actions.update((d) => ({
            ...d,
            templateId: t.id,
            palette: t.palette,
            pages: buildPages({ template: t, recipientName: d.recipientName, senderName: d.senderName, message: d.message, photos: d.photos }),
          }));
          actions.goTo(0);
          onDone?.();
        }}
      />
    </div>
  );
}

export function TextPanel({ doc, actions, onDone }: PanelProps) {
  const color = palettes[doc.palette].ink;
  return (
    <div>
      <PanelTitle>Add text</PanelTitle>
      <div className="space-y-2">
        {textPresets.map((p) => (
          <button
            key={p.label}
            onClick={() => {
              actions.addElement(newText(p, color));
              onDone?.();
            }}
            className="block w-full rounded-xl border border-line bg-ivory px-4 py-3 text-left hover:border-ink/30"
          >
            <span
              className={cn(
                "block truncate text-ink",
                p.patch.font === "display" && "font-display",
                p.patch.font === "hand" && "font-hand",
                p.patch.font === "script" && "font-script",
                p.patch.font === "sans" && "font-sans",
                p.label === "Heading" ? "text-3xl" : p.label === "Label" ? "text-xs tracking-[0.3em]" : "text-xl",
                p.patch.italic && "italic",
              )}
            >
              {p.sample}
            </span>
            <span className="text-[12px] text-muted">{p.label}</span>
          </button>
        ))}
      </div>
      <p className="mt-4 text-[12.5px] text-muted">Tip: double-click any text on the card to edit it in place.</p>
    </div>
  );
}

export function UploadsPanel({ doc, actions, onDone }: PanelProps) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const toast = useToast();
  const uploads = doc.photos.filter((p) => !p.src.startsWith("scene:"));
  return (
    <div>
      <PanelTitle>Your uploads</PanelTitle>
      <Button className="w-full" variant="outline" onClick={() => input.current?.click()} loading={busy}>
        {!busy && <Upload />} Upload photos
      </Button>
      <input
        ref={input}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={async (e) => {
          const files = Array.from(e.target.files ?? []);
          if (!files.length) return;
          setBusy(true);
          for (const f of files) {
            try {
              const src = await uploadService.uploadImage(f, 1200);
              actions.update((d) => ({ ...d, photos: [...d.photos, { id: crypto.randomUUID().slice(0, 8), src, caption: "" }] }), false);
            } catch (err) {
              toast.error({ title: "Upload failed", description: err instanceof Error ? err.message : undefined });
            }
          }
          setBusy(false);
          e.target.value = "";
        }}
      />
      {uploads.length ? (
        <div className="mt-4 grid grid-cols-2 gap-2">
          {uploads.map((p) => (
            <button
              key={p.id}
              onClick={() => {
                actions.addElement(newImage(p.src));
                onDone?.();
              }}
              className="aspect-square overflow-hidden rounded-xl border border-line hover:ring-2 hover:ring-burgundy"
              aria-label="Add this photo to the page"
            >
              <PhotoView src={p.src} alt="" />
            </button>
          ))}
        </div>
      ) : (
        <div className="mt-4 rounded-xl border border-dashed border-line px-4 py-8 text-center text-[13px] text-muted">
          <ImagePlus className="mx-auto mb-2 size-5" />
          Photos you upload appear here. Click one to place it on the card.
        </div>
      )}
    </div>
  );
}

export function PhotosPanel({ doc, actions, onDone }: PanelProps) {
  const all = [...doc.photos.filter((p) => p.src.startsWith("scene:")).map((p) => p.src), ...sceneNames.map((s) => `scene:${s}`)];
  const unique = Array.from(new Set(all));
  return (
    <div>
      <PanelTitle>Photo library</PanelTitle>
      <p className="mb-3 text-[13px] text-muted">Illustrated placeholders — perfect while you gather your real photos.</p>
      <div className="grid grid-cols-2 gap-2">
        {unique.map((src) => (
          <button
            key={src}
            onClick={() => {
              actions.addElement(newImage(src));
              onDone?.();
            }}
            className="aspect-square overflow-hidden rounded-xl border border-line hover:ring-2 hover:ring-burgundy"
            aria-label={`Add ${src.slice(6)} photo`}
          >
            <PhotoView src={src} alt="" />
          </button>
        ))}
      </div>
    </div>
  );
}

export function BackgroundsPanel({ page, actions }: PanelProps) {
  const colors = Array.from(new Set(paletteList.flatMap((p) => [p.bg, p.paper, p.accent2]).concat(["#FFFFFF", "#29252A"])));
  return (
    <div className="space-y-6">
      <div>
        <PanelTitle>Background colour</PanelTitle>
        <div className="grid grid-cols-6 gap-1.5">
          {colors.map((c) => (
            <button
              key={c}
              aria-label={`Background ${c}`}
              aria-pressed={page.background === c}
              onClick={() => actions.updatePage((p) => ({ ...p, background: c }))}
              className={cn("aspect-square rounded-lg border border-ink/10", page.background === c && "ring-2 ring-burgundy ring-offset-2")}
              style={{ background: c }}
            />
          ))}
        </div>
        <label className="mt-3 flex items-center gap-2 text-[13px] text-muted">
          Custom
          <input type="color" value={page.background.startsWith("#") ? page.background : "#ffffff"} onChange={(e) => actions.updatePage((p) => ({ ...p, background: e.target.value }))} className="h-8 w-12 cursor-pointer rounded border border-line" />
        </label>
      </div>
      <div>
        <PanelTitle>Texture</PanelTitle>
        <div className="grid grid-cols-3 gap-2">
          {(["none", "grain", "dots", "lines", "grid"] as const).map((pt) => (
            <button
              key={pt}
              aria-pressed={page.pattern === pt}
              onClick={() => actions.updatePage((p) => ({ ...p, pattern: pt }))}
              className={cn("rounded-xl border px-2 py-2 text-[13px] capitalize", page.pattern === pt ? "border-ink bg-ink text-ivory" : "border-line bg-ivory")}
            >
              {pt}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export function StickersPanel({ doc, actions, onDone }: PanelProps) {
  const p = palettes[doc.palette];
  return (
    <div>
      <PanelTitle>Stickers</PanelTitle>
      <div className="grid grid-cols-4 gap-2">
        {Object.entries(stickers).map(([key, s], i) => {
          const color = [p.accent, p.deep, p.accent2, "#F2B544"][i % 4];
          return (
            <button
              key={key}
              aria-label={`Add ${s.label} sticker`}
              onClick={() => {
                actions.addElement(newSticker(key, color));
                onDone?.();
              }}
              className="grid aspect-square place-items-center rounded-xl border border-line bg-ivory hover:border-ink/30"
            >
              <StickerArt sticker={key} color={color} className="size-7" />
            </button>
          );
        })}
      </div>
    </div>
  );
}

const motifs: Motif[] = ["envelope", "gift", "polaroids", "balloons", "scratch", "floral", "stars", "cake", "hearts", "tree", "champagne", "rings", "cap", "sun", "botanical", "capsule", "film", "confetti"];

export function ElementsPanel({ doc, actions, onDone }: PanelProps) {
  const p = palettes[doc.palette];
  return (
    <div className="space-y-6">
      <div>
        <PanelTitle>Shapes</PanelTitle>
        <div className="grid grid-cols-5 gap-2">
          {(["rect", "circle", "line", "arch", "tape"] as ShapeElement["shape"][]).map((s) => (
            <button
              key={s}
              aria-label={`Add ${s}`}
              onClick={() => {
                actions.addElement(newShape(s, s === "tape" ? p.accent2 : p.accent));
                onDone?.();
              }}
              className="grid aspect-square place-items-center rounded-xl border border-line bg-ivory hover:border-ink/30"
            >
              <span
                className={cn(
                  "block",
                  s === "rect" && "h-5 w-7 rounded-sm",
                  s === "circle" && "size-6 rounded-full",
                  s === "line" && "h-0.5 w-7",
                  s === "arch" && "h-7 w-5 rounded-t-full",
                  s === "tape" && "h-3 w-8 opacity-80",
                )}
                style={{ background: s === "tape" ? p.accent2 : p.accent }}
              />
            </button>
          ))}
        </div>
      </div>
      <div>
        <PanelTitle>Illustrations</PanelTitle>
        <div className="grid grid-cols-3 gap-2">
          {motifs.map((m) => (
            <button
              key={m}
              aria-label={`Add ${m} illustration`}
              onClick={() => {
                actions.addElement(newMotif(m, doc.palette));
                onDone?.();
              }}
              className="grid aspect-square place-items-center rounded-xl border border-line bg-ivory p-1.5 hover:border-ink/30"
            >
              <MotifArt motif={m} palette={doc.palette} />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

const animations: ElementAnimation[] = ["none", "fade", "rise", "pop", "drift", "float"];

export function AnimationsPanel({ page, selectedId, actions }: PanelProps) {
  const [replay, setReplay] = useState(0);
  const el = page.elements.find((e) => e.id === selectedId);
  return (
    <div className="space-y-5">
      <div>
        <PanelTitle>{el ? "Selected element" : "Select an element"}</PanelTitle>
        <div className="grid grid-cols-3 gap-2">
          {animations.map((a) => (
            <button
              key={a}
              disabled={!el}
              aria-pressed={el?.animation === a}
              onClick={() => el && actions.updateElement(el.id, { animation: a })}
              className={cn("rounded-xl border px-2 py-2 text-[13px] capitalize disabled:opacity-40", el?.animation === a ? "border-ink bg-ink text-ivory" : "border-line bg-ivory")}
            >
              {a}
            </button>
          ))}
        </div>
      </div>
      <div>
        <PanelTitle>Whole page</PanelTitle>
        <div className="grid grid-cols-3 gap-2">
          {animations.map((a) => (
            <button
              key={a}
              onClick={() => actions.updatePage((p) => ({ ...p, elements: p.elements.map((e) => ({ ...e, animation: a })) }))}
              className="rounded-xl border border-line bg-ivory px-2 py-2 text-[13px] capitalize hover:border-ink/30"
            >
              {a}
            </button>
          ))}
        </div>
      </div>
      <div>
        <div className="mb-2 flex items-center justify-between">
          <PanelTitle>Preview</PanelTitle>
          <Button size="sm" variant="outline" onClick={() => setReplay((r) => r + 1)}>
            <Play /> Play
          </Button>
        </div>
        <div className="overflow-hidden rounded-xl border border-line">
          <CardPageView key={replay} page={page} animate />
        </div>
      </div>
    </div>
  );
}

export function AudioPanel({ doc, actions }: PanelProps) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const toast = useToast();
  const set = (patch: Partial<Creation["interaction"]>) => actions.update((d) => ({ ...d, interaction: { ...d.interaction, ...patch } }));
  return (
    <div>
      <PanelTitle>Background sound</PanelTitle>
      <p className="mb-4 text-[13px] text-muted">Sound never plays automatically. Your recipient sees a sound button they can turn on.</p>
      <div className="space-y-2">
        {(
          [
            ["none", "No sound"],
            ["music-box", "Music box"],
            ["soft-piano", "Soft piano"],
          ] as const
        ).map(([v, l]) => (
          <button key={v} aria-pressed={doc.interaction.sound === v} onClick={() => set({ sound: v })} className={cn("flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left text-[14px]", doc.interaction.sound === v ? "border-ink bg-ink text-ivory" : "border-line bg-ivory")}>
            <Music className="size-4" /> {l}
          </button>
        ))}
        <button onClick={() => input.current?.click()} className={cn("flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left text-[14px]", doc.interaction.sound === "custom" ? "border-ink bg-ink text-ivory" : "border-line bg-ivory")}>
          {busy ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
          {doc.interaction.sound === "custom" ? "Your audio (replace)" : "Upload your own audio"}
        </button>
        <input
          ref={input}
          type="file"
          accept="audio/*"
          hidden
          onChange={async (e) => {
            const f = e.target.files?.[0];
            if (!f) return;
            setBusy(true);
            try {
              const ref = await uploadService.uploadMedia(f);
              set({ sound: "custom", audioSrc: ref });
              toast.success("Audio added.");
            } catch (err) {
              toast.error({ title: "Upload failed", description: err instanceof Error ? err.message : undefined });
            } finally {
              setBusy(false);
            }
          }}
        />
      </div>
    </div>
  );
}

export function PagesPanel({ doc, pageIndex, actions, onDone }: PanelProps) {
  const [confirm, setConfirm] = useState<number | null>(null);
  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <PanelTitle>Pages</PanelTitle>
        <Button size="sm" variant="outline" onClick={() => actions.addPage(pageIndex)}>
          <Plus /> Add
        </Button>
      </div>
      <ol className="space-y-3">
        {doc.pages.map((pg, i) => (
          <li key={pg.id} className={cn("flex gap-3 rounded-xl border p-2", i === pageIndex ? "border-burgundy bg-blush/40" : "border-line bg-ivory")}>
            <button
              onClick={() => {
                actions.goTo(i);
                onDone?.();
              }}
              className="w-16 shrink-0 overflow-hidden rounded-md border border-line"
              aria-label={`Go to page ${i + 1}`}
            >
              <CardPageView page={pg} />
            </button>
            <div className="flex flex-1 flex-col justify-between">
              <span className="text-[13px] font-medium">Page {i + 1}</span>
              <div className="flex gap-0.5">
                <Button variant="ghost" size="icon-sm" aria-label={`Move page ${i + 1} up`} disabled={i === 0} onClick={() => actions.movePage(i, -1)}>
                  <ArrowUp />
                </Button>
                <Button variant="ghost" size="icon-sm" aria-label={`Move page ${i + 1} down`} disabled={i === doc.pages.length - 1} onClick={() => actions.movePage(i, 1)}>
                  <ArrowDown />
                </Button>
                <Button variant="ghost" size="icon-sm" aria-label={`Duplicate page ${i + 1}`} onClick={() => actions.duplicatePage(i)}>
                  <Copy />
                </Button>
                <Button variant="ghost" size="icon-sm" aria-label={`Delete page ${i + 1}`} disabled={doc.pages.length <= 1} onClick={() => setConfirm(i)}>
                  <Trash2 />
                </Button>
              </div>
            </div>
          </li>
        ))}
      </ol>
      <ConfirmDialog
        open={confirm !== null}
        onOpenChange={(v) => !v && setConfirm(null)}
        title="Delete this page?"
        description="Everything on it will be removed. You can undo this."
        confirmLabel="Delete page"
        destructive
        onConfirm={() => {
          if (confirm !== null) actions.deletePage(confirm);
        }}
      />
    </div>
  );
}

export const panelComponents: Record<PanelId, (p: PanelProps) => React.ReactNode> = {
  templates: TemplatesPanel,
  text: TextPanel,
  uploads: UploadsPanel,
  photos: PhotosPanel,
  backgrounds: BackgroundsPanel,
  stickers: StickersPanel,
  elements: ElementsPanel,
  animations: AnimationsPanel,
  audio: AudioPanel,
  pages: PagesPanel,
};

export { ColorRow };

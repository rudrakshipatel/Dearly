"use client";

import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  ArrowDownToLine,
  ArrowUpToLine,
  ChevronDown,
  ChevronUp,
  Copy,
  Italic,
  Lock,
  Trash2,
  Unlock,
  Upload,
} from "lucide-react";
import { useRef, useState } from "react";
import { paletteList } from "@/lib/data/palettes";
import { uploadService } from "@/lib/services";
import type { CardElement, CardPage, FontKey, ImageElement, Motif, ShapeElement } from "@/lib/types";
import { cn, fontClass, fontLabel } from "@/lib/utils";
import { stickers } from "../art/stickers";
import { Button } from "../ui/button";
import { Select, Slider, Textarea } from "../ui/form";
import { useToast } from "../ui/toast";
import { BackgroundsPanel, ColorRow } from "./panels";
import type { EditorActions } from "./store";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-b border-line px-4 py-4 last:border-0">
      <h3 className="mb-3 text-[12px] font-medium uppercase tracking-[0.14em] text-muted">{title}</h3>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function NumberField({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <label className="flex items-center gap-2 rounded-lg border border-line bg-ivory px-2.5">
      <span className="text-[11px] font-medium text-muted">{label}</span>
      <input
        type="number"
        value={Math.round(value)}
        onChange={(e) => onChange(Number(e.target.value) || 0)}
        className="h-8 w-full min-w-0 bg-transparent text-[13px] tabular-nums focus:outline-none"
      />
    </label>
  );
}

const motifs: Motif[] = ["envelope", "gift", "polaroids", "balloons", "scratch", "floral", "stars", "cake", "hearts", "tree", "champagne", "rings", "cap", "sun", "botanical", "capsule", "film", "confetti"];

export function PropertiesPanel({
  el,
  page,
  doc,
  pageIndex,
  actions,
}: {
  el: CardElement | null;
  page: CardPage;
  doc: Parameters<typeof BackgroundsPanel>[0]["doc"];
  pageIndex: number;
  actions: EditorActions;
}) {
  if (!el) {
    return (
      <div>
        <Section title={`Page ${pageIndex + 1}`}>
          <BackgroundsPanel doc={doc} page={page} pageIndex={pageIndex} selectedId={null} actions={actions} />
        </Section>
        <p className="px-4 pb-4 text-[12.5px] leading-relaxed text-muted">Select something on the card to change its text, colour, size, position or animation.</p>
      </div>
    );
  }
  const set = (patch: Partial<CardElement>) => actions.updateElement(el.id, patch);
  // Sliders fire continuously — keep a single undo step per gesture.
  const live = (patch: Partial<CardElement>) => actions.updateElement(el.id, patch, false);

  return (
    <div>
      {el.type === "text" && (
        <Section title="Text">
          <Textarea aria-label="Text content" value={el.text} onFocus={() => actions.snapshot()} onChange={(e) => live({ text: e.target.value })} className="min-h-20 text-[14px]" />
          <Select aria-label="Font" value={el.font} onChange={(e) => set({ font: e.target.value as FontKey })} className={cn("h-10", fontClass[el.font])}>
            {(Object.keys(fontLabel) as FontKey[]).map((f) => (
              <option key={f} value={f}>
                {fontLabel[f]}
              </option>
            ))}
          </Select>
          <div onPointerDown={() => actions.snapshot()}>
            <Slider label="Size" value={el.size} min={10} max={120} onChange={(size) => live({ size })} />
          </div>
          <div className="flex items-center gap-1">
            {(
              [
                ["left", AlignLeft],
                ["center", AlignCenter],
                ["right", AlignRight],
              ] as const
            ).map(([a, Icon]) => (
              <Button key={a} variant={el.align === a ? "primary" : "ghost"} size="icon-sm" aria-label={`Align ${a}`} aria-pressed={el.align === a} onClick={() => set({ align: a })}>
                <Icon />
              </Button>
            ))}
            <span className="mx-1 h-5 w-px bg-line" />
            <Button variant={el.italic ? "primary" : "ghost"} size="icon-sm" aria-label="Italic" aria-pressed={el.italic} onClick={() => set({ italic: !el.italic })}>
              <Italic />
            </Button>
            <Select aria-label="Weight" value={el.weight} onChange={(e) => set({ weight: Number(e.target.value) as 400 | 500 | 700 })} className="ml-auto h-8 w-24 text-[13px]">
              <option value={400}>Regular</option>
              <option value={500}>Medium</option>
              <option value={700}>Bold</option>
            </Select>
          </div>
          <div onPointerDown={() => actions.snapshot()} className="space-y-3">
            <Slider label="Letter spacing" value={el.letterSpacing} min={-2} max={12} step={0.5} onChange={(letterSpacing) => live({ letterSpacing })} />
            <Slider label="Line height" value={el.lineHeight} min={0.8} max={2.2} step={0.05} onChange={(lineHeight) => live({ lineHeight })} />
          </div>
          <ColorRow label="Colour" value={el.color} onChange={(color) => set({ color })} />
        </Section>
      )}

      {el.type === "image" && <ImageProps el={el} actions={actions} />}

      {el.type === "sticker" && (
        <Section title="Sticker">
          <Select aria-label="Sticker" value={el.sticker} onChange={(e) => set({ sticker: e.target.value })} className="h-10">
            {Object.entries(stickers).map(([k, s]) => (
              <option key={k} value={k}>
                {s.label}
              </option>
            ))}
          </Select>
          <ColorRow label="Colour" value={el.color} onChange={(color) => set({ color })} />
        </Section>
      )}

      {el.type === "shape" && (
        <Section title="Shape">
          <Select aria-label="Shape" value={el.shape} onChange={(e) => set({ shape: e.target.value as ShapeElement["shape"] })} className="h-10 capitalize">
            {["rect", "circle", "line", "arch", "tape"].map((s) => (
              <option key={s} value={s}>
                {s === "rect" ? "Rectangle" : s[0].toUpperCase() + s.slice(1)}
              </option>
            ))}
          </Select>
          <ColorRow label="Colour" value={el.color} onChange={(color) => set({ color })} />
        </Section>
      )}

      {el.type === "motif" && (
        <Section title="Illustration">
          <Select aria-label="Illustration" value={el.motif} onChange={(e) => set({ motif: e.target.value as Motif })} className="h-10 capitalize">
            {motifs.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </Select>
          <Select aria-label="Colours" value={el.palette} onChange={(e) => set({ palette: e.target.value as typeof el.palette })} className="h-10">
            {paletteList.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </Select>
        </Section>
      )}

      <Section title="Position & size">
        <div className="grid grid-cols-2 gap-2">
          <NumberField label="X" value={el.x} onChange={(x) => set({ x })} />
          <NumberField label="Y" value={el.y} onChange={(y) => set({ y })} />
          <NumberField label="W" value={el.w} onChange={(w) => set({ w: Math.max(10, w) })} />
          <NumberField label="H" value={el.h} onChange={(h) => set({ h: Math.max(10, h) })} />
        </div>
        <div onPointerDown={() => actions.snapshot()} className="space-y-3">
          <Slider label="Rotation" value={el.rotation} min={-180} max={180} onChange={(rotation) => live({ rotation })} suffix="°" />
          <Slider label="Opacity" value={Math.round(el.opacity * 100)} min={5} max={100} onChange={(o) => live({ opacity: o / 100 })} suffix="%" />
        </div>
        <Button variant="outline" size="sm" className="w-full" onClick={() => set({ x: Math.round((600 - el.w) / 2) })}>
          Centre horizontally
        </Button>
      </Section>

      <Section title="Animation">
        <Select aria-label="Animation" value={el.animation} onChange={(e) => set({ animation: e.target.value as CardElement["animation"] })} className="h-10 capitalize">
          {["none", "fade", "rise", "pop", "drift", "float"].map((a) => (
            <option key={a} value={a}>
              {a[0].toUpperCase() + a.slice(1)}
            </option>
          ))}
        </Select>
      </Section>

      <Section title="Arrange">
        <div className="grid grid-cols-4 gap-1">
          <Button variant="ghost" size="icon-sm" aria-label="Bring to front" onClick={() => actions.reorder(el.id, "front")}>
            <ArrowUpToLine />
          </Button>
          <Button variant="ghost" size="icon-sm" aria-label="Bring forward" onClick={() => actions.reorder(el.id, "forward")}>
            <ChevronUp />
          </Button>
          <Button variant="ghost" size="icon-sm" aria-label="Send backward" onClick={() => actions.reorder(el.id, "backward")}>
            <ChevronDown />
          </Button>
          <Button variant="ghost" size="icon-sm" aria-label="Send to back" onClick={() => actions.reorder(el.id, "back")}>
            <ArrowDownToLine />
          </Button>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <Button variant="outline" size="sm" onClick={() => actions.duplicateElement(el.id)}>
            <Copy /> Copy
          </Button>
          <Button variant="outline" size="sm" onClick={() => set({ locked: !el.locked })} aria-pressed={!!el.locked}>
            {el.locked ? <Unlock /> : <Lock />} {el.locked ? "Unlock" : "Lock"}
          </Button>
          <Button variant="outline" size="sm" className="text-rose-deep" onClick={() => actions.removeElement(el.id)}>
            <Trash2 /> Delete
          </Button>
        </div>
      </Section>
    </div>
  );
}

function ImageProps({ el, actions }: { el: ImageElement; actions: EditorActions }) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const toast = useToast();
  const set = (patch: Partial<ImageElement>) => actions.updateElement(el.id, patch);
  const live = (patch: Partial<ImageElement>) => actions.updateElement(el.id, patch, false);
  return (
    <Section title="Photo">
      <Button variant="outline" size="sm" className="w-full" loading={busy} onClick={() => input.current?.click()}>
        {!busy && <Upload />} Replace photo
      </Button>
      <input
        ref={input}
        type="file"
        accept="image/*"
        hidden
        onChange={async (e) => {
          const f = e.target.files?.[0];
          if (!f) return;
          setBusy(true);
          try {
            set({ src: await uploadService.uploadImage(f, 1200) });
          } catch (err) {
            toast.error({ title: "Upload failed", description: err instanceof Error ? err.message : undefined });
          } finally {
            setBusy(false);
            e.target.value = "";
          }
        }}
      />
      <div className="grid grid-cols-2 gap-2">
        <label>
          <span className="mb-1 block text-[12px] text-muted">Frame</span>
          <Select value={el.frame} onChange={(e) => set({ frame: e.target.value as ImageElement["frame"] })} className="h-9 text-[13px]">
            {["none", "polaroid", "rounded", "circle", "border", "arch"].map((f) => (
              <option key={f} value={f}>
                {f[0].toUpperCase() + f.slice(1)}
              </option>
            ))}
          </Select>
        </label>
        <label>
          <span className="mb-1 block text-[12px] text-muted">Effect</span>
          <Select value={el.effect} onChange={(e) => set({ effect: e.target.value as ImageElement["effect"] })} className="h-9 text-[13px]">
            {["none", "warm", "mono", "fade", "vivid"].map((f) => (
              <option key={f} value={f}>
                {f[0].toUpperCase() + f.slice(1)}
              </option>
            ))}
          </Select>
        </label>
      </div>
      {el.frame === "polaroid" && (
        <input
          aria-label="Caption"
          value={el.caption ?? ""}
          placeholder="Caption"
          onFocus={() => actions.snapshot()}
          onChange={(e) => live({ caption: e.target.value })}
          className="h-9 w-full rounded-lg border border-line bg-ivory px-2.5 font-hand text-lg focus:outline-none"
        />
      )}
      <div onPointerDown={() => actions.snapshot()} className="space-y-3">
        <p className="text-[12px] font-medium text-ink/70">Crop</p>
        <Slider label="Zoom" value={el.zoom} min={1} max={3} step={0.05} onChange={(zoom) => live({ zoom })} suffix="×" />
        <Slider label="Horizontal focus" value={el.focusX} min={0} max={100} onChange={(focusX) => live({ focusX })} suffix="%" />
        <Slider label="Vertical focus" value={el.focusY} min={0} max={100} onChange={(focusY) => live({ focusY })} suffix="%" />
      </div>
    </Section>
  );
}

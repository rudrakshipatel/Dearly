"use client";

import { Lock, RotateCw } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { CANVAS_H, CANVAS_W } from "@/lib/creation";
import type { CardElement, CardPage, TextElement } from "@/lib/types";
import { clamp, cn, fontClass } from "@/lib/utils";
import { cq, ElementContent, elementBox, patternStyle } from "../card/page-view";
import type { EditorActions } from "./store";

type Handle = "nw" | "ne" | "sw" | "se";

interface DragState {
  kind: "move" | "resize" | "rotate";
  id: string;
  handle?: Handle;
  startX: number;
  startY: number;
  el: CardElement;
  scale: number;
  rect: DOMRect;
}

const SNAP = 6;

export function EditorCanvas({
  page,
  selectedId,
  editingId,
  actions,
  maxWidth,
}: {
  page: CardPage;
  selectedId: string | null;
  editingId: string | null;
  actions: EditorActions;
  maxWidth?: number;
}) {
  const wrap = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLDivElement>(null);
  const drag = useRef<DragState | null>(null);
  const [width, setWidth] = useState(0);
  const [guides, setGuides] = useState<{ v: boolean; h: boolean }>({ v: false, h: false });

  // Fit a 3:4 canvas into the available space.
  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const { width: w, height: h } = entry.contentRect;
      setWidth(Math.max(200, Math.min(w, (h * CANVAS_W) / CANVAS_H, maxWidth ?? Infinity)));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [maxWidth]);

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const d = drag.current;
      if (!d) return;
      const dx = (e.clientX - d.startX) / d.scale;
      const dy = (e.clientY - d.startY) / d.scale;
      const el = d.el;
      if (d.kind === "move") {
        let x = Math.round(el.x + dx);
        let y = Math.round(el.y + dy);
        const cx = x + el.w / 2;
        const cy = y + el.h / 2;
        const v = Math.abs(cx - CANVAS_W / 2) < SNAP;
        const h = Math.abs(cy - CANVAS_H / 2) < SNAP;
        if (v) x = Math.round(CANVAS_W / 2 - el.w / 2);
        if (h) y = Math.round(CANVAS_H / 2 - el.h / 2);
        setGuides({ v, h });
        actions.updateElement(d.id, { x: clamp(x, -el.w + 20, CANVAS_W - 20), y: clamp(y, -el.h + 20, CANVAS_H - 20) }, false);
      } else if (d.kind === "resize") {
        const rad = (-el.rotation * Math.PI) / 180;
        const lx = dx * Math.cos(rad) - dy * Math.sin(rad);
        const ly = dx * Math.sin(rad) + dy * Math.cos(rad);
        const keepRatio = el.type === "sticker" || el.type === "motif" || e.shiftKey;
        let w = el.w + (d.handle!.includes("e") ? lx : -lx);
        let hgt = el.h + (d.handle!.includes("s") ? ly : -ly);
        if (keepRatio) {
          const r = el.w / el.h;
          if (Math.abs(w - el.w) > Math.abs(hgt - el.h) * r) hgt = w / r;
          else w = hgt * r;
        }
        w = Math.max(24, Math.round(w));
        hgt = Math.max(16, Math.round(hgt));
        const x = d.handle!.includes("w") ? el.x + (el.w - w) : el.x;
        const y = d.handle!.includes("n") ? el.y + (el.h - hgt) : el.y;
        actions.updateElement(d.id, { w, h: hgt, x: Math.round(x), y: Math.round(y) }, false);
      } else {
        const cx = d.rect.left + ((el.x + el.w / 2) / CANVAS_W) * d.rect.width;
        const cy = d.rect.top + ((el.y + el.h / 2) / CANVAS_H) * d.rect.height;
        let angle = (Math.atan2(e.clientY - cy, e.clientX - cx) * 180) / Math.PI + 90;
        if (angle > 180) angle -= 360;
        angle = e.shiftKey ? Math.round(angle / 15) * 15 : Math.round(angle);
        for (const snap of [0, 90, -90, 180]) if (Math.abs(angle - snap) < 4) angle = snap;
        actions.updateElement(d.id, { rotation: angle }, false);
      }
    };
    const onUp = () => {
      drag.current = null;
      setGuides({ v: false, h: false });
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [actions]);

  const start = (e: React.PointerEvent, el: CardElement, kind: DragState["kind"], handle?: Handle) => {
    e.stopPropagation();
    if (e.button !== 0) return;
    actions.select(el.id);
    if (el.locked || editingId === el.id) return;
    const rect = canvas.current!.getBoundingClientRect();
    actions.snapshot();
    drag.current = { kind, id: el.id, handle, startX: e.clientX, startY: e.clientY, el, scale: rect.width / CANVAS_W, rect };
  };

  const selected = page.elements.find((e) => e.id === selectedId);

  return (
    <div ref={wrap} className="flex size-full items-center justify-center" onPointerDown={(e) => e.target === e.currentTarget && actions.select(null)}>
      <div
        ref={canvas}
        className="relative shrink-0 overflow-hidden shadow-[0_30px_60px_-30px_rgba(41,37,42,.45)] ring-1 ring-ink/5"
        style={{ width, height: (width * CANVAS_H) / CANVAS_W, background: page.background, containerType: "inline-size" }}
        onPointerDown={() => actions.select(null)}
        role="application"
        aria-label="Card canvas. Click an element to select it, double-click text to edit."
      >
        <div className="pointer-events-none absolute inset-0" style={patternStyle(page.pattern)} />
        {page.elements.map((el) => (
          <div
            key={el.id}
            style={elementBox(el)}
            className={cn("touch-none select-none", el.locked ? "cursor-default" : "cursor-move")}
            onPointerDown={(e) => start(e, el, "move")}
            onDoubleClick={() => el.type === "text" && actions.edit(el.id)}
          >
            {editingId === el.id && el.type === "text" ? (
              <InlineText el={el} actions={actions} />
            ) : (
              <ElementContent el={el} />
            )}
          </div>
        ))}

        {guides.v && <div className="pointer-events-none absolute inset-y-0 left-1/2 w-px bg-rose" />}
        {guides.h && <div className="pointer-events-none absolute inset-x-0 top-1/2 h-px bg-rose" />}

        {selected && editingId !== selected.id && (
          <div className="pointer-events-none absolute" style={{ ...elementBox(selected), opacity: 1 }}>
            <div className="absolute -inset-px border-[1.5px] border-burgundy" />
            {selected.locked ? (
              <span className="absolute -right-2.5 -top-2.5 grid size-5 place-items-center rounded-full bg-burgundy text-white">
                <Lock className="size-3" />
              </span>
            ) : (
              <>
                {(["nw", "ne", "sw", "se"] as Handle[]).map((h) => (
                  <span
                    key={h}
                    onPointerDown={(e) => start(e, selected, "resize", h)}
                    className={cn(
                      "pointer-events-auto absolute size-3.5 touch-none rounded-full border-2 border-burgundy bg-white",
                      h === "nw" && "-left-[7px] -top-[7px] cursor-nwse-resize",
                      h === "ne" && "-right-[7px] -top-[7px] cursor-nesw-resize",
                      h === "sw" && "-bottom-[7px] -left-[7px] cursor-nesw-resize",
                      h === "se" && "-bottom-[7px] -right-[7px] cursor-nwse-resize",
                    )}
                    aria-hidden
                  />
                ))}
                <span
                  onPointerDown={(e) => start(e, selected, "rotate")}
                  className="pointer-events-auto absolute -top-9 left-1/2 grid size-6 -translate-x-1/2 cursor-grab touch-none place-items-center rounded-full border border-line bg-white text-burgundy shadow"
                  aria-hidden
                >
                  <RotateCw className="size-3.5" />
                </span>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function InlineText({ el, actions }: { el: TextElement; actions: EditorActions }) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    actions.snapshot();
    ref.current?.focus();
    ref.current?.select();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <textarea
      ref={ref}
      aria-label="Edit text"
      value={el.text}
      onPointerDown={(e) => e.stopPropagation()}
      onChange={(e) => actions.updateElement(el.id, { text: e.target.value }, false)}
      onBlur={() => actions.edit(null)}
      onKeyDown={(e) => {
        if (e.key === "Escape") (e.target as HTMLTextAreaElement).blur();
        e.stopPropagation();
      }}
      className={cn("size-full resize-none overflow-hidden bg-white/60 outline-2 outline-rose", fontClass[el.font])}
      style={{
        fontSize: cq(el.size),
        color: el.color,
        textAlign: el.align,
        fontWeight: el.weight,
        fontStyle: el.italic ? "italic" : "normal",
        letterSpacing: cq(el.letterSpacing),
        lineHeight: el.lineHeight,
      }}
    />
  );
}

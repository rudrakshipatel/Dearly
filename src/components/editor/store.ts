"use client";

import { useCallback, useMemo, useReducer } from "react";
import { CANVAS_H, CANVAS_W } from "@/lib/creation";
import type { CardElement, CardPage, Creation, FontKey, Motif, PaletteId, ShapeElement, TextElement } from "@/lib/types";
import { uid } from "@/lib/utils";

interface State {
  doc: Creation;
  past: Creation[];
  future: Creation[];
  page: number;
  selected: string | null;
  editing: string | null;
}

type Action =
  | { type: "update"; fn: (d: Creation) => Creation; history?: boolean }
  | { type: "snapshot" }
  | { type: "undo" }
  | { type: "redo" }
  | { type: "page"; index: number }
  | { type: "select"; id: string | null }
  | { type: "edit"; id: string | null };

const LIMIT = 60;

function reducer(s: State, a: Action): State {
  switch (a.type) {
    case "update": {
      const doc = a.fn(s.doc);
      if (doc === s.doc) return s;
      const page = Math.min(s.page, doc.pages.length - 1);
      return a.history === false ? { ...s, doc, page } : { ...s, doc, page, past: [...s.past, s.doc].slice(-LIMIT), future: [] };
    }
    case "snapshot":
      return { ...s, past: [...s.past, s.doc].slice(-LIMIT), future: [] };
    case "undo": {
      if (!s.past.length) return s;
      const doc = s.past[s.past.length - 1];
      return { ...s, doc, past: s.past.slice(0, -1), future: [s.doc, ...s.future], page: Math.min(s.page, doc.pages.length - 1), editing: null };
    }
    case "redo": {
      if (!s.future.length) return s;
      const doc = s.future[0];
      return { ...s, doc, past: [...s.past, s.doc], future: s.future.slice(1), page: Math.min(s.page, doc.pages.length - 1), editing: null };
    }
    case "page":
      return { ...s, page: Math.max(0, Math.min(a.index, s.doc.pages.length - 1)), selected: null, editing: null };
    case "select":
      return { ...s, selected: a.id, editing: a.id === s.editing ? s.editing : null };
    case "edit":
      return { ...s, editing: a.id, selected: a.id ?? s.selected };
  }
}

export function useEditorStore(initial: Creation) {
  const [state, dispatch] = useReducer(reducer, { doc: initial, past: [], future: [], page: 0, selected: null, editing: null });
  const { doc, page } = state;
  const current = doc.pages[page];
  const selectedEl = current?.elements.find((e) => e.id === state.selected) ?? null;

  const update = useCallback((fn: (d: Creation) => Creation, history = true) => dispatch({ type: "update", fn, history }), []);

  const updatePage = useCallback(
    (fn: (p: CardPage) => CardPage, history = true) =>
      dispatch({
        type: "update",
        history,
        fn: (d) => ({ ...d, pages: d.pages.map((p, i) => (i === state.page ? fn(p) : p)) }),
      }),
    [state.page],
  );

  const updateElement = useCallback(
    (id: string, patch: Partial<CardElement>, history = true) =>
      updatePage((p) => ({ ...p, elements: p.elements.map((e) => (e.id === id ? ({ ...e, ...patch } as CardElement) : e)) }), history),
    [updatePage],
  );

  const actions = useMemo(
    () => ({
      update,
      updatePage,
      updateElement,
      snapshot: () => dispatch({ type: "snapshot" }),
      undo: () => dispatch({ type: "undo" }),
      redo: () => dispatch({ type: "redo" }),
      goTo: (index: number) => dispatch({ type: "page", index }),
      select: (id: string | null) => dispatch({ type: "select", id }),
      edit: (id: string | null) => dispatch({ type: "edit", id }),
      addElement: (el: CardElement) => {
        updatePage((p) => ({ ...p, elements: [...p.elements, el] }));
        dispatch({ type: "select", id: el.id });
      },
      removeElement: (id: string) => {
        updatePage((p) => ({ ...p, elements: p.elements.filter((e) => e.id !== id) }));
        dispatch({ type: "select", id: null });
      },
      duplicateElement: (id: string) => {
        const el = current?.elements.find((e) => e.id === id);
        if (!el) return;
        const copy = { ...el, id: uid("el-"), x: el.x + 24, y: el.y + 24, locked: false } as CardElement;
        updatePage((p) => ({ ...p, elements: [...p.elements, copy] }));
        dispatch({ type: "select", id: copy.id });
      },
      reorder: (id: string, to: "forward" | "backward" | "front" | "back") =>
        updatePage((p) => {
          const els = [...p.elements];
          const i = els.findIndex((e) => e.id === id);
          if (i < 0) return p;
          const [el] = els.splice(i, 1);
          const target = to === "front" ? els.length : to === "back" ? 0 : to === "forward" ? Math.min(els.length, i + 1) : Math.max(0, i - 1);
          els.splice(target, 0, el);
          return { ...p, elements: els };
        }),
      addPage: (afterIndex: number, pageToInsert?: CardPage) => {
        const pg: CardPage = pageToInsert ?? { id: uid("pg-"), background: doc.pages[afterIndex]?.background ?? "#FFFDF8", pattern: "grain", elements: [] };
        update((d) => {
          const pages = [...d.pages];
          pages.splice(afterIndex + 1, 0, pg);
          return { ...d, pages };
        });
        setTimeout(() => dispatch({ type: "page", index: afterIndex + 1 }), 0);
      },
      duplicatePage: (index: number) => {
        const src = doc.pages[index];
        const copy: CardPage = { ...src, id: uid("pg-"), elements: src.elements.map((e) => ({ ...e, id: uid("el-") })) };
        update((d) => {
          const pages = [...d.pages];
          pages.splice(index + 1, 0, copy);
          return { ...d, pages };
        });
        setTimeout(() => dispatch({ type: "page", index: index + 1 }), 0);
      },
      deletePage: (index: number) => {
        if (doc.pages.length <= 1) return;
        update((d) => ({ ...d, pages: d.pages.filter((_, i) => i !== index) }));
        dispatch({ type: "page", index: Math.max(0, index - 1) });
      },
      movePage: (index: number, dir: -1 | 1) => {
        const to = index + dir;
        if (to < 0 || to >= doc.pages.length) return;
        update((d) => {
          const pages = [...d.pages];
          [pages[index], pages[to]] = [pages[to], pages[index]];
          return { ...d, pages };
        });
        setTimeout(() => dispatch({ type: "page", index: to }), 0);
      },
    }),
    [update, updatePage, updateElement, current, doc.pages],
  );

  return { state, doc, current, selectedEl, actions, canUndo: state.past.length > 0, canRedo: state.future.length > 0 };
}

export type EditorActions = ReturnType<typeof useEditorStore>["actions"];

/* ------------------------------------------------------------ Element factories */

const base = (w: number, h: number) => ({
  id: uid("el-"),
  x: Math.round((CANVAS_W - w) / 2),
  y: Math.round((CANVAS_H - h) / 2),
  w,
  h,
  rotation: 0,
  opacity: 1,
  animation: "fade" as const,
});

export const textPresets: { label: string; sample: string; patch: Partial<TextElement> & { w: number; h: number } }[] = [
  { label: "Heading", sample: "A big hello", patch: { font: "display", size: 56, w: 480, h: 80 } },
  { label: "Subheading", sample: "with love, always", patch: { font: "display", size: 30, italic: true, w: 420, h: 50 } },
  { label: "Body text", sample: "Write a few words here.", patch: { font: "sans", size: 20, w: 420, h: 90, align: "left", lineHeight: 1.5 } },
  { label: "Handwritten note", sample: "you're my favourite", patch: { font: "hand", size: 36, w: 420, h: 60 } },
  { label: "Script", sample: "Forever yours", patch: { font: "script", size: 44, w: 420, h: 70 } },
  { label: "Label", sample: "EST. 2026", patch: { font: "sans", size: 16, weight: 500, letterSpacing: 4, w: 260, h: 30 } },
];

export function newText(preset: (typeof textPresets)[number], color: string): TextElement {
  const { w, h, ...rest } = preset.patch;
  return {
    ...base(w, h),
    type: "text",
    text: preset.sample,
    font: "display" as FontKey,
    size: 32,
    color,
    align: "center",
    weight: 400,
    italic: false,
    letterSpacing: 0,
    lineHeight: 1.2,
    animation: "rise",
    ...rest,
  };
}

export function newImage(src: string): CardElement {
  return { ...base(300, 360), type: "image", src, frame: "polaroid", effect: "none", zoom: 1, focusX: 50, focusY: 50, caption: "", rotation: -3, animation: "drift" };
}

export function newSticker(sticker: string, color: string): CardElement {
  return { ...base(90, 90), type: "sticker", sticker, color, animation: "pop" };
}

export function newShape(shape: ShapeElement["shape"], color: string): CardElement {
  const dims: Record<ShapeElement["shape"], [number, number]> = { rect: [240, 160], circle: [180, 180], line: [300, 12], arch: [240, 300], tape: [150, 40] };
  const [w, h] = dims[shape];
  return { ...base(w, h), type: "shape", shape, color, opacity: shape === "tape" ? 0.85 : 1, animation: "none" };
}

export function newMotif(motif: Motif, palette: PaletteId): CardElement {
  return { ...base(300, 300), type: "motif", motif, palette, animation: "pop" };
}

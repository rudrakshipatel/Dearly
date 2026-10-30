import { palettes, isDarkBg } from "./data/palettes";
import { occasionMap } from "./data/occasions";
import { modeToKind } from "./data/experiences";
import type {
  CardElement,
  CardPage,
  Creation,
  ExperienceKind,
  InteractionMode,
  InteractionSettings,
  OccasionSlug,
  PaletteId,
  Photo,
  Template,
  TextElement,
} from "./types";
import { slugify, uid } from "./utils";

export const CANVAS_W = 600;
export const CANVAS_H = 800;

type IdFn = (prefix?: string) => string;

export function defaultInteraction(palette: PaletteId, mode: InteractionMode, occasion: OccasionSlug): InteractionSettings {
  const p = palettes[palette];
  return {
    mode,
    envelopeColor: p.accent2,
    envelopeDesign: "classic",
    seal: "heart",
    letterBackground: "cream",
    letterFont: "hand",
    giftWrap: "stripes",
    giftColor: p.accent,
    ribbonColor: p.deep,
    hiddenMessage: occasionMap[occasion]?.prompts[0] ?? "A little something, made with love.",
    quizQuestion: "Where did we first meet?",
    quizOptions: ["At a coffee shop", "On a rainy train platform", "At a friend's birthday"],
    quizAnswer: 1,
    confetti: true,
    sound: "none",
  };
}

function text(id: IdFn, partial: Partial<TextElement> & Pick<TextElement, "text" | "x" | "y" | "w" | "h">): TextElement {
  return {
    id: id("el-"),
    type: "text",
    rotation: 0,
    opacity: 1,
    animation: "rise",
    font: "display",
    size: 32,
    color: "#29252A",
    align: "center",
    weight: 400,
    italic: false,
    letterSpacing: 0,
    lineHeight: 1.25,
    ...partial,
  };
}

export function buildPages(opts: {
  template: Pick<Template, "palette" | "motif" | "headline" | "font" | "pages" | "photoSlots">;
  recipientName: string;
  senderName: string;
  message: string;
  photos: Photo[];
  id?: IdFn;
}): CardPage[] {
  const id = opts.id ?? uid;
  const { template } = opts;
  const p = palettes[template.palette];
  const dark = isDarkBg(template.palette);
  const coverInk = dark ? p.paper : p.ink;
  const pages: CardPage[] = [];

  const cover: CardElement[] = [
    { id: id("el-"), type: "shape", shape: "rect", x: 36, y: 36, w: 528, h: 728, rotation: 0, opacity: dark ? 0.35 : 0.6, animation: "none", color: dark ? p.accent : p.accent2, locked: true },
    { id: id("el-"), type: "motif", motif: template.motif, palette: template.palette, x: 110, y: 110, w: 380, h: 380, rotation: 0, opacity: 1, animation: "pop" },
    text(id, { text: template.headline, x: 60, y: 520, w: 480, h: 110, font: template.font, size: template.font === "sans" ? 44 : 58, color: coverInk, weight: template.font === "sans" ? 700 : 400, lineHeight: 1.05 }),
    text(id, { text: `for ${opts.recipientName || "someone special"}`, x: 120, y: 650, w: 360, h: 50, font: "hand", size: 30, color: dark ? p.accent : p.deep, animation: "fade" }),
  ];
  pages.push({ id: id("pg-"), background: p.bg, pattern: "grain", elements: cover });

  const messageEls: CardElement[] = [
    text(id, { text: `Dear ${opts.recipientName || "you"},`, x: 70, y: 90, w: 460, h: 60, font: "hand", size: 40, color: p.deep, align: "left", animation: "fade" }),
    text(id, { text: opts.message || "A little something, made with love.", x: 70, y: 170, w: 460, h: 420, font: "hand", size: 32, color: p.ink, align: "left", lineHeight: 1.45 }),
    text(id, { text: `With love,\n${opts.senderName || "me"}`, x: 300, y: 610, w: 230, h: 110, font: "hand", size: 34, color: p.deep, align: "right", animation: "fade" }),
    { id: id("el-"), type: "sticker", sticker: "heart", color: p.accent, x: 76, y: 650, w: 56, h: 56, rotation: -12, opacity: 1, animation: "float" },
  ];
  pages.push({ id: id("pg-"), background: p.paper, pattern: "lines", elements: messageEls });

  const photos = opts.photos.length ? opts.photos : [];
  const slots = Math.min(template.photoSlots, 3);
  if (slots > 0 || photos.length > 0) {
    const count = Math.max(1, Math.min(3, photos.length || slots));
    const layouts = [
      [{ x: 120, y: 120, w: 360, h: 420, r: -3 }],
      [
        { x: 60, y: 90, w: 280, h: 330, r: -6 },
        { x: 260, y: 380, w: 280, h: 330, r: 5 },
      ],
      [
        { x: 50, y: 70, w: 250, h: 290, r: -7 },
        { x: 300, y: 140, w: 250, h: 290, r: 6 },
        { x: 150, y: 420, w: 260, h: 300, r: -2 },
      ],
    ][count - 1];
    const els: CardElement[] = layouts.map((l, i) => ({
      id: id("el-"),
      type: "image",
      src: photos[i]?.src ?? ["scene:sunset", "scene:meadow", "scene:beach"][i],
      caption: photos[i]?.caption ?? "",
      frame: "polaroid",
      effect: "none",
      zoom: 1,
      focusX: 50,
      focusY: 50,
      x: l.x,
      y: l.y,
      w: l.w,
      h: l.h,
      rotation: l.r,
      opacity: 1,
      animation: "drift",
    }));
    if (count === 1) {
      els.push(text(id, { text: photos[0]?.caption || "my favourite day", x: 100, y: 590, w: 400, h: 60, font: "hand", size: 36, color: p.deep }));
    }
    els.push({ id: id("el-"), type: "shape", shape: "tape", color: p.accent2, x: 230, y: 60, w: 140, h: 36, rotation: -4, opacity: 0.85, animation: "none" });
    pages.push({ id: id("pg-"), background: p.bg, pattern: "dots", elements: els });
  }

  for (let i = pages.length; i < template.pages; i++) {
    pages.push({
      id: id("pg-"),
      background: p.paper,
      pattern: "grain",
      elements: [
        { id: id("el-"), type: "sticker", sticker: i % 2 ? "sparkles" : "flower", color: p.accent, x: 250, y: 220, w: 100, h: 100, rotation: 0, opacity: 1, animation: "pop" },
        text(id, { text: i === template.pages - 1 ? "The end — for now." : "And then…", x: 80, y: 360, w: 440, h: 90, font: "display", size: 48, color: p.ink, italic: true }),
        text(id, { text: "Add your next chapter here.", x: 120, y: 460, w: 360, h: 50, font: "sans", size: 18, color: p.deep, letterSpacing: 1 }),
      ],
    });
  }
  return pages;
}

export interface BuildCreationInput {
  template: Template;
  recipientName?: string;
  senderName?: string;
  message?: string;
  occasionDate?: string;
  relationship?: string;
  photos?: Photo[];
  experience?: ExperienceKind;
  interaction?: Partial<InteractionSettings>;
  status?: Creation["status"];
  title?: string;
  now?: string;
  id?: IdFn;
  slug?: string;
}

export function buildCreation(input: BuildCreationInput): Creation {
  const id = input.id ?? uid;
  const t = input.template;
  const recipientName = input.recipientName ?? "";
  const senderName = input.senderName ?? "";
  const message = input.message ?? occasionMap[t.occasion].prompts[0];
  const photos = input.photos ?? [];
  const mode = input.interaction?.mode ?? t.interactions[0];
  const experience = input.experience ?? (t.experience === "surprise" ? modeToKind(mode) : t.experience);
  const now = input.now ?? new Date().toISOString();
  const title = input.title ?? (recipientName ? `${t.name} for ${recipientName}` : t.name);
  const creationId = id("c-");
  return {
    id: creationId,
    slug: input.slug ?? `${slugify(recipientName || t.name)}-${creationId.slice(2, 8)}`,
    title,
    occasion: t.occasion,
    experience,
    templateId: t.id,
    palette: t.palette,
    status: input.status ?? "draft",
    recipientName,
    senderName,
    message,
    occasionDate: input.occasionDate,
    relationship: input.relationship,
    photos,
    interaction: { ...defaultInteraction(t.palette, mode, t.occasion), ...input.interaction },
    pages: buildPages({ template: t, recipientName, senderName, message, photos, id }),
    contributions: [],
    showBranding: true,
    createdAt: now,
    updatedAt: now,
  };
}

/** Deterministic id generator for sample data rendered on the server. */
export function seededIds(seed: string): IdFn {
  let n = 0;
  return (prefix = "") => `${prefix}${seed}${(n++).toString(36).padStart(3, "0")}`;
}

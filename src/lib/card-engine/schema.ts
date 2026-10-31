/**
 * The Universal Card Engine schema.
 * Every card — letter, surprise, scrapbook, reveal, group, classic or video — is stored as this
 * versioned JSON document in `cards.card_data` and rendered by the same ExperiencePlayer.
 */
import { z } from "zod";

export const CARD_SCHEMA_VERSION = 2;

const hex = z.string().regex(/^#[0-9a-fA-F]{3,8}$/, "Colours must be hex values.");
const shortText = (max: number) => z.string().max(max);
/** Allowed media sources: built-in scenes, uploaded media references, or https URLs we control. */
export const mediaSrc = z
  .string()
  .max(300)
  .regex(/^(scene:[a-z-]{1,30}|media:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/, "Unsupported media source.");

export const fontKey = z.enum(["display", "sans", "hand", "script"]);
export const paletteId = z.enum([
  "rose-cream", "burgundy-champagne", "pastel-party", "forest-gold", "midnight-gold", "lavender-coral", "ivory-sage",
  "sky-sunshine", "terracotta", "blush-gold", "navy-ivory", "mint-peach", "plum-ink", "lemon-sorbet",
]);
export const motif = z.enum([
  "envelope", "gift", "polaroids", "balloons", "scratch", "floral", "stars", "cake", "hearts", "tree",
  "champagne", "rings", "cap", "sun", "botanical", "capsule", "film", "confetti",
]);
export const experienceType = z.enum(["letter", "surprise", "memories", "reveal", "together", "classic", "video"]);
export const interactionMode = z.enum(["envelope", "gift", "scratch", "tap", "flip", "balloon", "photo-reveal", "quiz", "story", "scrapbook", "video", "group"]);
export const occasionSlug = z.enum([
  "birthday", "valentines", "anniversary", "friendship", "christmas", "new-year", "wedding", "graduation",
  "mothers-day", "fathers-day", "congratulations", "thank-you", "get-well-soon", "just-because",
]);

const coord = z.number().min(-2000).max(2000);
const size = z.number().min(1).max(3000);
const base = {
  id: z.string().min(1).max(40),
  x: coord,
  y: coord,
  w: size,
  h: size,
  rotation: z.number().min(-360).max(360),
  opacity: z.number().min(0).max(1),
  animation: z.enum(["none", "fade", "rise", "pop", "drift", "float"]),
  locked: z.boolean().optional(),
};

export const textElement = z.object({
  ...base,
  type: z.literal("text"),
  text: shortText(2000),
  font: fontKey,
  size: z.number().min(4).max(300),
  color: hex,
  align: z.enum(["left", "center", "right"]),
  weight: z.union([z.literal(400), z.literal(500), z.literal(700)]),
  italic: z.boolean(),
  letterSpacing: z.number().min(-10).max(50),
  lineHeight: z.number().min(0.5).max(4),
});

export const imageElement = z.object({
  ...base,
  type: z.literal("image"),
  src: mediaSrc,
  frame: z.enum(["none", "polaroid", "rounded", "circle", "border", "arch"]),
  effect: z.enum(["none", "warm", "mono", "fade", "vivid"]),
  zoom: z.number().min(1).max(5),
  focusX: z.number().min(0).max(100),
  focusY: z.number().min(0).max(100),
  caption: shortText(80).optional(),
});

export const stickerElement = z.object({ ...base, type: z.literal("sticker"), sticker: z.string().regex(/^[a-z-]{1,30}$/), color: hex });
export const shapeElement = z.object({ ...base, type: z.literal("shape"), shape: z.enum(["rect", "circle", "line", "arch", "tape"]), color: hex });
export const motifElement = z.object({ ...base, type: z.literal("motif"), motif, palette: paletteId });

export const cardElement = z.discriminatedUnion("type", [textElement, imageElement, stickerElement, shapeElement, motifElement]);

export const cardPage = z.object({
  id: z.string().min(1).max(40),
  background: hex,
  pattern: z.enum(["none", "grain", "dots", "lines", "grid"]),
  elements: z.array(cardElement).max(80),
});

export const photo = z.object({
  id: z.string().min(1).max(40),
  src: mediaSrc,
  caption: shortText(80).optional(),
  date: z.string().max(30).optional(),
});

export const interaction = z.object({
  mode: interactionMode,
  envelopeColor: hex,
  envelopeDesign: z.enum(["classic", "airmail", "linen", "botanical"]),
  seal: z.enum(["heart", "initial", "star", "flower"]),
  letterBackground: z.enum(["cream", "lined", "blush", "kraft"]),
  letterFont: fontKey,
  giftWrap: z.enum(["stripes", "dots", "solid", "kraft"]),
  giftColor: hex,
  ribbonColor: hex,
  hiddenMessage: shortText(600),
  quizQuestion: shortText(200).optional(),
  quizOptions: z.array(shortText(100)).max(5).optional(),
  quizAnswer: z.number().int().min(0).max(4).optional(),
  confetti: z.boolean(),
  unlockAt: z.string().datetime().optional(),
  sound: z.enum(["none", "music-box", "soft-piano", "custom"]),
  audioSrc: mediaSrc.optional(),
  videoSrc: mediaSrc.optional(),
  /** Extra surprises revealed after the first (Surprise engine). */
  extraSurprises: z.array(shortText(300)).max(5).optional(),
  /** Additional letter pages after the main message (Letter engine). */
  letterPages: z.array(shortText(2000)).max(10).optional(),
});

export const cardDataSchema = z.object({
  version: z.literal(CARD_SCHEMA_VERSION),
  experienceType,
  templateId: z.string().max(80),
  occasion: occasionSlug,
  palette: paletteId,
  theme: z.object({ background: hex, primaryColor: hex, fontFamily: fontKey }),
  recipient: z.object({ name: shortText(60), relationship: shortText(40).optional() }),
  sender: z.object({ name: shortText(60) }),
  message: shortText(4000),
  occasionDate: z.string().max(30).optional(),
  photos: z.array(photo).max(100),
  interaction,
  pages: z.array(cardPage).min(1).max(30),
  settings: z.object({ allowReactions: z.boolean(), showBranding: z.boolean() }),
});

export type CardData = z.infer<typeof cardDataSchema>;

/** Validates card_data and returns a friendly first error. */
export function validateCardData(input: unknown): { ok: true; data: CardData } | { ok: false; error: string; path: string } {
  const r = cardDataSchema.safeParse(input);
  if (r.success) return { ok: true, data: r.data };
  const issue = r.error.issues[0];
  return { ok: false, error: issue?.message ?? "Invalid card.", path: issue?.path.join(".") ?? "" };
}

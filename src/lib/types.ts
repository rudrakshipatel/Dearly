export type OccasionSlug =
  | "birthday"
  | "valentines"
  | "anniversary"
  | "friendship"
  | "christmas"
  | "new-year"
  | "wedding"
  | "graduation"
  | "mothers-day"
  | "fathers-day"
  | "congratulations"
  | "thank-you"
  | "get-well-soon"
  | "just-because";

export type PaletteId =
  | "rose-cream"
  | "burgundy-champagne"
  | "pastel-party"
  | "forest-gold"
  | "midnight-gold"
  | "lavender-coral"
  | "ivory-sage"
  | "sky-sunshine"
  | "terracotta"
  | "blush-gold"
  | "navy-ivory"
  | "mint-peach"
  | "plum-ink"
  | "lemon-sorbet";

export interface Palette {
  id: PaletteId;
  name: string;
  bg: string;
  paper: string;
  accent: string;
  accent2: string;
  ink: string;
  deep: string;
}

/** The five core experiences plus classic cards and video greetings. */
export type ExperienceKind = "letter" | "surprise" | "memories" | "reveal" | "together" | "classic" | "video";

/** Browse-by-experience categories used on Explore. */
export type TemplateCategory =
  | "classic-cards"
  | "interactive-surprises"
  | "love-letters"
  | "memory-books"
  | "video-greetings"
  | "group-cards"
  | "time-capsules";

export type TemplateStyle =
  | "minimal"
  | "romantic"
  | "elegant"
  | "playful"
  | "vintage"
  | "modern"
  | "floral"
  | "scrapbook"
  | "editorial"
  | "festive";

export type Motif =
  | "envelope"
  | "gift"
  | "polaroids"
  | "balloons"
  | "scratch"
  | "floral"
  | "stars"
  | "cake"
  | "hearts"
  | "tree"
  | "champagne"
  | "rings"
  | "cap"
  | "sun"
  | "botanical"
  | "capsule"
  | "film"
  | "confetti";

/** How the recipient first interacts with the card. */
export type InteractionMode =
  | "envelope"
  | "gift"
  | "scratch"
  | "tap"
  | "flip"
  | "balloon"
  | "photo-reveal"
  | "quiz"
  | "story"
  | "scrapbook"
  | "video"
  | "group";

export interface Occasion {
  slug: OccasionSlug;
  name: string;
  short: string;
  headline: string;
  description: string;
  palette: PaletteId;
  motif: Motif;
  suggested: ExperienceKind[];
  related: OccasionSlug[];
  prompts: string[];
}

export interface ExperienceInfo {
  kind: ExperienceKind;
  name: string;
  tagline: string;
  description: string;
  steps: string[];
  motif: Motif;
  palette: PaletteId;
  defaultMode: InteractionMode;
}

export interface Template {
  id: string;
  name: string;
  description: string;
  occasion: OccasionSlug;
  category: TemplateCategory;
  experience: ExperienceKind;
  style: TemplateStyle;
  palette: PaletteId;
  motif: Motif;
  headline: string;
  font: FontKey;
  pages: number;
  photoSlots: number;
  interactions: InteractionMode[];
  interactive: boolean;
  premium: boolean;
  popularity: number;
  addedAt: string;
}

export type FontKey = "display" | "sans" | "hand" | "script";

export interface Photo {
  id: string;
  /** Either an uploaded image URL / data URL, or `scene:<name>` for built-in illustrated scenes. */
  src: string;
  caption?: string;
  date?: string;
}

export interface InteractionSettings {
  mode: InteractionMode;
  envelopeColor: string;
  envelopeDesign: "classic" | "airmail" | "linen" | "botanical";
  seal: "heart" | "initial" | "star" | "flower";
  letterBackground: "cream" | "lined" | "blush" | "kraft";
  letterFont: FontKey;
  giftWrap: "stripes" | "dots" | "solid" | "kraft";
  giftColor: string;
  ribbonColor: string;
  hiddenMessage: string;
  quizQuestion?: string;
  quizOptions?: string[];
  quizAnswer?: number;
  confetti: boolean;
  unlockAt?: string;
  sound: "none" | "music-box" | "soft-piano" | "custom";
  audioSrc?: string;
  videoSrc?: string;
  /** Extra surprises revealed one after another (Surprise engine). */
  extraSurprises?: string[];
  /** Further letter pages after the main message (Letter engine). */
  letterPages?: string[];
}

export type ElementAnimation = "none" | "fade" | "rise" | "pop" | "drift" | "float";
export type ImageFrame = "none" | "polaroid" | "rounded" | "circle" | "border" | "arch";
export type ImageEffect = "none" | "warm" | "mono" | "fade" | "vivid";

interface BaseElement {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  rotation: number;
  opacity: number;
  animation: ElementAnimation;
  locked?: boolean;
}

export interface TextElement extends BaseElement {
  type: "text";
  text: string;
  font: FontKey;
  size: number;
  color: string;
  align: "left" | "center" | "right";
  weight: 400 | 500 | 700;
  italic: boolean;
  letterSpacing: number;
  lineHeight: number;
}

export interface ImageElement extends BaseElement {
  type: "image";
  src: string;
  frame: ImageFrame;
  effect: ImageEffect;
  zoom: number;
  focusX: number;
  focusY: number;
  caption?: string;
}

export interface StickerElement extends BaseElement {
  type: "sticker";
  sticker: string;
  color: string;
}

export interface ShapeElement extends BaseElement {
  type: "shape";
  shape: "rect" | "circle" | "line" | "arch" | "tape";
  color: string;
}

export interface MotifElement extends BaseElement {
  type: "motif";
  motif: Motif;
  palette: PaletteId;
}

export type CardElement = TextElement | ImageElement | StickerElement | ShapeElement | MotifElement;

export interface CardPage {
  id: string;
  background: string;
  pattern: "none" | "grain" | "dots" | "lines" | "grid";
  elements: CardElement[];
}

export type CreationStatus = "draft" | "published" | "scheduled" | "archived";

export interface Contribution {
  id: string;
  name: string;
  message: string;
  photo?: string;
  color: string;
  createdAt: string;
}

export interface Creation {
  id: string;
  slug: string;
  title: string;
  occasion: OccasionSlug;
  experience: ExperienceKind;
  templateId: string;
  palette: PaletteId;
  status: CreationStatus;
  recipientName: string;
  senderName: string;
  message: string;
  occasionDate?: string;
  relationship?: string;
  photos: Photo[];
  interaction: InteractionSettings;
  pages: CardPage[];
  contributions?: Contribution[];
  scheduledFor?: string;
  showBranding: boolean;
  createdAt: string;
  updatedAt: string;
  /** Server-side fields (present once the card is stored in the database). */
  version?: number;
  allowReactions?: boolean;
  allowResponsePhoto?: boolean;
  recipientEmail?: string;
  timezone?: string;
  publishedAt?: string;
  viewCount?: number;
  lastOpenedAt?: string;
  hasPassword?: boolean;
  isDisabled?: boolean;
  disabledReason?: string;
  contributionToken?: string;
  contributionDeadline?: string;
  contributionLimit?: number;
  contributionsRequireApproval?: boolean;
  isSample?: boolean;
  reactionCount?: number;
}

export interface ReceivedCard {
  slug: string;
  title: string;
  from: string;
  occasion: OccasionSlug;
  palette: PaletteId;
  motif: Motif;
  receivedAt: string;
  openedAt?: string;
  saved: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  plan: PlanId;
  verified: boolean;
  isAdmin?: boolean;
}

export type PlanId = "free" | "premium" | "pro";
export type RegionCode = "US" | "GB" | "CA" | "AU" | "NZ" | "IN" | "INTL";

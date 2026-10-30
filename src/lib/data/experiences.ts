import type { ExperienceInfo, ExperienceKind, InteractionMode, TemplateCategory } from "../types";

/** The five core Dearly experiences. */
export const coreExperiences: ExperienceInfo[] = [
  {
    kind: "letter",
    name: "The Letter",
    tagline: "A sealed envelope, waiting to be opened.",
    description: "A wax-sealed envelope that opens on tap, sliding out a handwritten letter and the photos tucked inside.",
    steps: ["Seal your envelope", "Write your letter", "Tuck in photos"],
    motif: "envelope",
    palette: "rose-cream",
    defaultMode: "envelope",
  },
  {
    kind: "surprise",
    name: "The Surprise",
    tagline: "Unwrap it. Let the confetti fly.",
    description: "A wrapped gift box. Pull the ribbon, lift the lid and reveal a hidden message or photograph inside.",
    steps: ["Pick the wrapping", "Hide your surprise", "Add the confetti"],
    motif: "gift",
    palette: "pastel-party",
    defaultMode: "gift",
  },
  {
    kind: "memories",
    name: "The Memories",
    tagline: "Your story, one polaroid at a time.",
    description: "A digital scrapbook of polaroids, captions, dates and handwritten notes that turns into a timeline of you.",
    steps: ["Gather your photos", "Caption the moments", "Arrange the story"],
    motif: "polaroids",
    palette: "lavender-coral",
    defaultMode: "scrapbook",
  },
  {
    kind: "reveal",
    name: "The Reveal",
    tagline: "Scratch, flip, pop — find what's hidden.",
    description: "Scratch-off cards, flip cards, balloons to pop and photographs that appear only when they're found.",
    steps: ["Choose a reveal", "Hide the message", "Watch them discover it"],
    motif: "scratch",
    palette: "lemon-sorbet",
    defaultMode: "scratch",
  },
  {
    kind: "together",
    name: "The Together",
    tagline: "One card, signed by everyone.",
    description: "Invite friends, family or colleagues to add messages, photos and videos to one beautiful group card.",
    steps: ["Start the card", "Invite everyone", "Deliver it together"],
    motif: "confetti",
    palette: "mint-peach",
    defaultMode: "group",
  },
];

export const experienceNames: Record<ExperienceKind, string> = {
  letter: "The Letter",
  surprise: "The Surprise",
  memories: "The Memories",
  reveal: "The Reveal",
  together: "The Together",
  classic: "Classic Card",
  video: "Video Greeting",
};

/** Experience types offered in the creation workflow (Step 2). */
export const createExperienceOptions: {
  kind: ExperienceKind;
  label: string;
  description: string;
  modes: InteractionMode[];
}[] = [
  { kind: "classic", label: "Classic Card", description: "A beautiful folded card with one or more pages.", modes: ["story", "envelope"] },
  {
    kind: "surprise",
    label: "Interactive Surprise",
    description: "Envelopes, gifts, scratch cards, balloons and quizzes.",
    modes: ["gift", "envelope", "scratch", "tap", "flip", "balloon", "photo-reveal", "quiz"],
  },
  { kind: "memories", label: "Memory Book", description: "A scrapbook of photos, captions and dates.", modes: ["scrapbook", "story"] },
  { kind: "video", label: "Video Greeting", description: "A recorded message wrapped in an envelope.", modes: ["video"] },
  { kind: "together", label: "Group Card", description: "Collect messages from everyone who cares.", modes: ["group"] },
];

export const interactionLabels: Record<InteractionMode, { label: string; hint: string }> = {
  envelope: { label: "Envelope opening", hint: "Tap the wax seal to open" },
  gift: { label: "Gift unwrapping", hint: "Pull the ribbon, lift the lid" },
  scratch: { label: "Scratch reveal", hint: "Scratch the foil to reveal" },
  tap: { label: "Tap to reveal", hint: "Tap the tiles one by one" },
  flip: { label: "Flip a card", hint: "Turn the card over" },
  balloon: { label: "Balloon popping", hint: "Pop balloons to find the message" },
  "photo-reveal": { label: "Photo reveal", hint: "A photograph develops slowly" },
  quiz: { label: "Quiz", hint: "Answer to unlock the surprise" },
  story: { label: "Multi-page story", hint: "Turn the pages of the card" },
  scrapbook: { label: "Scrapbook", hint: "Flip through polaroids" },
  video: { label: "Video message", hint: "Press play on your greeting" },
  group: { label: "Group board", hint: "Open everyone's messages" },
};

export const categories: { id: TemplateCategory; name: string; description: string }[] = [
  { id: "classic-cards", name: "Classic Cards", description: "Folded cards with pages to turn." },
  { id: "interactive-surprises", name: "Interactive Surprises", description: "Gifts, balloons and scratch-offs." },
  { id: "love-letters", name: "Love Letters", description: "Sealed envelopes and handwritten notes." },
  { id: "memory-books", name: "Memory Books", description: "Polaroids, captions and timelines." },
  { id: "video-greetings", name: "Video Greetings", description: "Your face, your voice, their day." },
  { id: "group-cards", name: "Group Cards", description: "One card, signed by everyone." },
  { id: "time-capsules", name: "Time Capsules", description: "Sealed today, opened on the day." },
];

export function modeToKind(mode: InteractionMode): ExperienceKind {
  switch (mode) {
    case "envelope":
      return "letter";
    case "gift":
      return "surprise";
    case "scrapbook":
      return "memories";
    case "group":
      return "together";
    case "video":
      return "video";
    case "story":
      return "classic";
    default:
      return "reveal";
  }
}

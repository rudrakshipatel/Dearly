import type { ExperienceKind, InteractionMode, Template, TemplateCategory } from "../types";

type Seed = Omit<Template, "interactive" | "experience"> & { experience?: ExperienceKind };

const categoryExperience: Record<TemplateCategory, ExperienceKind> = {
  "classic-cards": "classic",
  "interactive-surprises": "surprise",
  "love-letters": "letter",
  "memory-books": "memories",
  "video-greetings": "video",
  "group-cards": "together",
  "time-capsules": "letter",
};

const STATIC: InteractionMode[] = ["story"];

const seeds: Seed[] = [
  // Birthday
  { id: "tpl-confetti-cake", name: "Confetti Cake", description: "A pastel gift box that bursts into confetti and reveals a birthday cake.", occasion: "birthday", category: "interactive-surprises", style: "playful", palette: "pastel-party", motif: "cake", headline: "Happy Birthday!", font: "display", pages: 3, photoSlots: 2, interactions: ["gift"], premium: false, popularity: 98, addedAt: "2026-09-02" },
  { id: "tpl-pop-the-balloons", name: "Pop the Balloons", description: "Five balloons, one hidden message. Pop them all to find it.", occasion: "birthday", category: "interactive-surprises", style: "playful", palette: "sky-sunshine", motif: "balloons", headline: "Pop pop hooray", font: "sans", pages: 2, photoSlots: 1, interactions: ["balloon"], premium: false, popularity: 91, addedAt: "2026-10-12", experience: "reveal" },
  { id: "tpl-year-in-polaroids", name: "A Year in Polaroids", description: "Twelve months, twelve polaroids and a caption for each.", occasion: "birthday", category: "memory-books", style: "scrapbook", palette: "lavender-coral", motif: "polaroids", headline: "Your year, in pictures", font: "hand", pages: 4, photoSlots: 6, interactions: ["scrapbook"], premium: true, popularity: 87, addedAt: "2026-08-20" },
  { id: "tpl-golden-thirty", name: "Golden Thirty", description: "An elegant milestone card in champagne and gold.", occasion: "birthday", category: "classic-cards", style: "elegant", palette: "blush-gold", motif: "champagne", headline: "Here's to thirty", font: "display", pages: 2, photoSlots: 1, interactions: STATIC, premium: true, popularity: 72, addedAt: "2026-07-14" },
  { id: "tpl-everyone-sings", name: "Everyone Sings", description: "A group birthday board where friends sign with messages and photos.", occasion: "birthday", category: "group-cards", style: "modern", palette: "mint-peach", motif: "confetti", headline: "From all of us", font: "sans", pages: 1, photoSlots: 8, interactions: ["group"], premium: false, popularity: 84, addedAt: "2026-06-30" },
  // Valentine's
  { id: "tpl-sealed-with-love", name: "Sealed With Love", description: "A blush envelope with a heart wax seal and a handwritten letter.", occasion: "valentines", category: "love-letters", style: "romantic", palette: "rose-cream", motif: "envelope", headline: "To my Valentine", font: "script", pages: 2, photoSlots: 2, interactions: ["envelope"], premium: false, popularity: 99, addedAt: "2026-09-28" },
  { id: "tpl-scratch-my-heart", name: "Scratch My Heart", description: "Scratch the rose-gold foil to reveal a secret only they will see.", occasion: "valentines", category: "interactive-surprises", style: "romantic", palette: "plum-ink", motif: "scratch", headline: "Scratch to see", font: "display", pages: 1, photoSlots: 1, interactions: ["scratch"], premium: false, popularity: 90, addedAt: "2026-10-05", experience: "reveal" },
  { id: "tpl-twenty-reasons", name: "Twenty Reasons", description: "Tap tiles to reveal every reason you love them.", occasion: "valentines", category: "interactive-surprises", style: "editorial", palette: "rose-cream", motif: "hearts", headline: "Reasons I love you", font: "display", pages: 2, photoSlots: 0, interactions: ["tap"], premium: true, popularity: 82, addedAt: "2026-08-11", experience: "reveal" },
  // Anniversary
  { id: "tpl-our-timeline", name: "Our Timeline", description: "A memory book that walks through your story, year by year.", occasion: "anniversary", category: "memory-books", style: "editorial", palette: "burgundy-champagne", motif: "film", headline: "Our story so far", font: "display", pages: 5, photoSlots: 6, interactions: ["scrapbook"], premium: true, popularity: 93, addedAt: "2026-09-18" },
  { id: "tpl-vintage-airmail", name: "Vintage Airmail", description: "A striped airmail envelope carrying a letter across the years.", occasion: "anniversary", category: "love-letters", style: "vintage", palette: "terracotta", motif: "envelope", headline: "Still yours", font: "hand", pages: 2, photoSlots: 2, interactions: ["envelope"], premium: false, popularity: 77, addedAt: "2026-05-22" },
  { id: "tpl-flip-the-photo", name: "Then & Now", description: "Flip a card to compare your first photo with your newest.", occasion: "anniversary", category: "interactive-surprises", style: "minimal", palette: "navy-ivory", motif: "rings", headline: "Then & now", font: "display", pages: 1, photoSlots: 2, interactions: ["flip"], premium: false, popularity: 69, addedAt: "2026-10-20", experience: "reveal" },
  // Friendship
  { id: "tpl-bestie-scrapbook", name: "Bestie Scrapbook", description: "Washi tape, doodles and polaroids of your best adventures.", occasion: "friendship", category: "memory-books", style: "scrapbook", palette: "lavender-coral", motif: "polaroids", headline: "You & me", font: "hand", pages: 3, photoSlots: 5, interactions: ["scrapbook"], premium: false, popularity: 88, addedAt: "2026-09-09" },
  { id: "tpl-how-well-quiz", name: "How Well Do You Know Me?", description: "A playful quiz that unlocks a hidden message when they get it right.", occasion: "friendship", category: "interactive-surprises", style: "playful", palette: "lemon-sorbet", motif: "stars", headline: "Pop quiz!", font: "sans", pages: 2, photoSlots: 1, interactions: ["quiz"], premium: true, popularity: 80, addedAt: "2026-10-24", experience: "reveal" },
  // Christmas
  { id: "tpl-under-the-tree", name: "Under the Tree", description: "A wrapped present under a twinkling tree, with gold confetti inside.", occasion: "christmas", category: "interactive-surprises", style: "festive", palette: "forest-gold", motif: "gift", headline: "Merry Christmas", font: "display", pages: 2, photoSlots: 2, interactions: ["gift"], premium: false, popularity: 95, addedAt: "2026-10-28" },
  { id: "tpl-snowy-letter", name: "Snowy Letter", description: "A cream envelope sealed with a gold star, dusted in snow.", occasion: "christmas", category: "love-letters", style: "elegant", palette: "forest-gold", motif: "tree", headline: "Season's greetings", font: "script", pages: 2, photoSlots: 1, interactions: ["envelope"], premium: true, popularity: 78, addedAt: "2026-10-26" },
  { id: "tpl-family-christmas", name: "Family Christmas", description: "A group card for the whole family, near and far.", occasion: "christmas", category: "group-cards", style: "festive", palette: "forest-gold", motif: "stars", headline: "Love from all of us", font: "display", pages: 1, photoSlots: 8, interactions: ["group"], premium: false, popularity: 74, addedAt: "2026-10-27" },
  // New Year
  { id: "tpl-midnight-toast", name: "Midnight Toast", description: "Champagne glasses clink as the clock strikes twelve.", occasion: "new-year", category: "interactive-surprises", style: "elegant", palette: "midnight-gold", motif: "champagne", headline: "Cheers to you", font: "display", pages: 2, photoSlots: 1, interactions: ["photo-reveal"], premium: true, popularity: 76, addedAt: "2026-10-18", experience: "reveal" },
  { id: "tpl-open-next-year", name: "Open Next Year", description: "A time capsule letter that stays sealed until the date you choose.", occasion: "new-year", category: "time-capsules", style: "minimal", palette: "midnight-gold", motif: "capsule", headline: "Do not open until…", font: "sans", pages: 2, photoSlots: 2, interactions: ["envelope"], premium: true, popularity: 71, addedAt: "2026-10-30" },
  // Wedding
  { id: "tpl-garden-vows", name: "Garden Vows", description: "Sage botanicals and an elegant letter for the happy couple.", occasion: "wedding", category: "love-letters", style: "floral", palette: "ivory-sage", motif: "botanical", headline: "To the newlyweds", font: "script", pages: 2, photoSlots: 1, interactions: ["envelope"], premium: false, popularity: 83, addedAt: "2026-06-12" },
  { id: "tpl-guestbook", name: "The Guestbook", description: "A digital guestbook where every guest leaves a note and a photo.", occasion: "wedding", category: "group-cards", style: "editorial", palette: "ivory-sage", motif: "rings", headline: "With love, your guests", font: "display", pages: 1, photoSlots: 12, interactions: ["group"], premium: true, popularity: 79, addedAt: "2026-07-03" },
  // Graduation
  { id: "tpl-cap-toss", name: "Cap Toss", description: "Toss the cap and watch the confetti fall on their big day.", occasion: "graduation", category: "interactive-surprises", style: "modern", palette: "navy-ivory", motif: "cap", headline: "Class of 2026", font: "sans", pages: 2, photoSlots: 2, interactions: ["gift"], premium: false, popularity: 75, addedAt: "2026-05-30" },
  { id: "tpl-proud-of-you", name: "So Proud of You", description: "A video greeting from the people who watched them grow.", occasion: "graduation", category: "video-greetings", style: "editorial", palette: "sky-sunshine", motif: "film", headline: "So proud of you", font: "display", pages: 1, photoSlots: 1, interactions: ["video"], premium: true, popularity: 68, addedAt: "2026-06-01" },
  // Mother's Day
  { id: "tpl-peony-letter", name: "Peony Letter", description: "A blush peony envelope with a gold-leaf seal for Mum.", occasion: "mothers-day", category: "love-letters", style: "floral", palette: "blush-gold", motif: "floral", headline: "For Mum, with love", font: "script", pages: 2, photoSlots: 2, interactions: ["envelope"], premium: false, popularity: 86, addedAt: "2026-04-28" },
  { id: "tpl-family-album", name: "Family Album", description: "Old photos and new, arranged like a treasured family album.", occasion: "mothers-day", category: "memory-books", style: "vintage", palette: "terracotta", motif: "film", headline: "All the years", font: "hand", pages: 4, photoSlots: 6, interactions: ["scrapbook"], premium: true, popularity: 73, addedAt: "2026-04-20" },
  // Father's Day
  { id: "tpl-dads-sunday", name: "Dad's Sunday", description: "A minimal, warm classic card with space for one great photo.", occasion: "fathers-day", category: "classic-cards", style: "minimal", palette: "navy-ivory", motif: "sun", headline: "Happy Father's Day", font: "display", pages: 2, photoSlots: 1, interactions: STATIC, premium: false, popularity: 70, addedAt: "2026-06-05" },
  { id: "tpl-hello-dad", name: "Hello, Dad", description: "A short video greeting with a vintage film-frame border.", occasion: "fathers-day", category: "video-greetings", style: "vintage", palette: "terracotta", motif: "film", headline: "Hello, Dad", font: "hand", pages: 1, photoSlots: 0, interactions: ["video"], premium: false, popularity: 62, addedAt: "2026-06-08" },
  // Congratulations
  { id: "tpl-big-news", name: "Big News", description: "Scratch off the lemon foil to reveal a big congratulations.", occasion: "congratulations", category: "interactive-surprises", style: "playful", palette: "lemon-sorbet", motif: "confetti", headline: "You did it!", font: "display", pages: 1, photoSlots: 1, interactions: ["scratch"], premium: false, popularity: 81, addedAt: "2026-09-25", experience: "reveal" },
  { id: "tpl-new-chapter", name: "New Chapter", description: "An editorial classic card for promotions, new homes and new starts.", occasion: "congratulations", category: "classic-cards", style: "editorial", palette: "plum-ink", motif: "stars", headline: "A new chapter", font: "display", pages: 2, photoSlots: 1, interactions: STATIC, premium: false, popularity: 66, addedAt: "2026-08-02" },
  // Thank you
  { id: "tpl-pressed-flowers", name: "Pressed Flowers", description: "A botanical thank-you note, simple and heartfelt.", occasion: "thank-you", category: "classic-cards", style: "floral", palette: "ivory-sage", motif: "botanical", headline: "Thank you", font: "script", pages: 1, photoSlots: 0, interactions: STATIC, premium: false, popularity: 77, addedAt: "2026-07-21" },
  { id: "tpl-team-thanks", name: "Team Thanks", description: "Gather the whole team's thanks into one group card.", occasion: "thank-you", category: "group-cards", style: "modern", palette: "sky-sunshine", motif: "stars", headline: "Thank you from the team", font: "sans", pages: 1, photoSlots: 10, interactions: ["group"], premium: false, popularity: 72, addedAt: "2026-08-15" },
  // Get well soon
  { id: "tpl-little-sunshine", name: "Little Sunshine", description: "A cheerful letter that opens to a sunny hidden note.", occasion: "get-well-soon", category: "love-letters", style: "minimal", palette: "mint-peach", motif: "sun", headline: "Get well soon", font: "hand", pages: 1, photoSlots: 1, interactions: ["envelope"], premium: false, popularity: 64, addedAt: "2026-09-14" },
  // Just because
  { id: "tpl-thinking-of-you", name: "Thinking of You", description: "A terracotta envelope for ordinary days that deserve a note.", occasion: "just-because", category: "love-letters", style: "vintage", palette: "terracotta", motif: "envelope", headline: "Thinking of you", font: "hand", pages: 1, photoSlots: 1, interactions: ["envelope"], premium: false, popularity: 85, addedAt: "2026-10-01" },
  { id: "tpl-hidden-polaroid", name: "Hidden Polaroid", description: "A photograph that slowly develops in front of their eyes.", occasion: "just-because", category: "interactive-surprises", style: "modern", palette: "lavender-coral", motif: "polaroids", headline: "Something for you", font: "display", pages: 1, photoSlots: 1, interactions: ["photo-reveal"], premium: false, popularity: 79, addedAt: "2026-10-15", experience: "reveal" },
  { id: "tpl-starry-note", name: "Starry Note", description: "A midnight-blue card that turns over to reveal a message among the stars.", occasion: "just-because", category: "interactive-surprises", style: "elegant", palette: "midnight-gold", motif: "stars", headline: "You light things up", font: "script", pages: 1, photoSlots: 0, interactions: ["flip"], premium: true, popularity: 74, addedAt: "2026-10-22", experience: "reveal" },
];

export const templates: Template[] = seeds.map((s) => ({
  ...s,
  experience: s.experience ?? categoryExperience[s.category],
  interactive: !(s.interactions.length === 1 && s.interactions[0] === "story"),
}));

export const templateMap: Record<string, Template> = Object.fromEntries(templates.map((t) => [t.id, t]));

/**
 * Replaces the built-in catalogue with the published catalogue from the database.
 * Called once per render tree by <CatalogHydrator/>; mutates in place so existing imports stay valid.
 */
export function hydrateTemplates(list: Template[]) {
  if (!list.length) return;
  templates.splice(0, templates.length, ...list);
  for (const k of Object.keys(templateMap)) delete templateMap[k];
  for (const t of list) templateMap[t.id] = t;
}

export function getTemplate(id: string | undefined | null): Template | undefined {
  return id ? templateMap[id] : undefined;
}

export const featuredTemplateIds = [
  "tpl-sealed-with-love",
  "tpl-confetti-cake",
  "tpl-our-timeline",
  "tpl-scratch-my-heart",
  "tpl-under-the-tree",
  "tpl-bestie-scrapbook",
  "tpl-midnight-toast",
  "tpl-garden-vows",
];

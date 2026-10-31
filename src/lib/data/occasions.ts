import type { Occasion, OccasionSlug } from "../types";

export const occasions: Occasion[] = [
  {
    slug: "birthday",
    name: "Birthday",
    short: "Another trip around the sun",
    headline: "Make their birthday unforgettable.",
    description: "Gift boxes that burst with confetti, balloons to pop and scrapbooks of every year worth remembering.",
    palette: "pastel-party",
    motif: "cake",
    suggested: ["surprise", "reveal", "memories", "together"],
    related: ["congratulations", "friendship", "just-because"],
    prompts: ["Happy birthday to my favourite human.", "Here's to another year of you being wonderful.", "Make a wish — I already got mine."],
  },
  {
    slug: "valentines",
    name: "Valentine's Day",
    short: "For the one who has your heart",
    headline: "Say it like you mean it.",
    description: "Sealed love letters, hidden messages and little reveals for the person who makes every day softer.",
    palette: "rose-cream",
    motif: "hearts",
    suggested: ["letter", "reveal", "memories"],
    related: ["anniversary", "just-because", "wedding"],
    prompts: ["You are my favourite place to be.", "Still choosing you, every single day.", "Be mine — again and always."],
  },
  {
    slug: "anniversary",
    name: "Anniversary",
    short: "Every year, a little more",
    headline: "Celebrate the story you are still writing.",
    description: "Timelines of your favourite moments, letters to reread and memory books worth keeping forever.",
    palette: "burgundy-champagne",
    motif: "rings",
    suggested: ["memories", "letter", "reveal"],
    related: ["valentines", "wedding", "just-because"],
    prompts: ["Happy anniversary, my love.", "To many more chapters together.", "Every year with you is my favourite one."],
  },
  {
    slug: "friendship",
    name: "Friendship",
    short: "For your people",
    headline: "For the friends who feel like home.",
    description: "Playful reveals, inside jokes and scrapbooks for the people who have seen you at your best and worst.",
    palette: "lavender-coral",
    motif: "polaroids",
    suggested: ["memories", "reveal", "together"],
    related: ["birthday", "thank-you", "just-because"],
    prompts: ["Thank you for being my person.", "Life is better with you in it.", "Friends forever (no refunds)."],
  },
  {
    slug: "christmas",
    name: "Christmas",
    short: "Warmth for the holidays",
    headline: "Wrap up a little holiday magic.",
    description: "Gifts to unwrap, snowy letters and festive group cards for family near and far.",
    palette: "forest-gold",
    motif: "tree",
    suggested: ["surprise", "letter", "together"],
    related: ["new-year", "thank-you", "friendship"],
    prompts: ["Merry Christmas from our home to yours.", "Wishing you a season full of light.", "Cosy days and warm hearts."],
  },
  {
    slug: "new-year",
    name: "New Year",
    short: "Here's to what's next",
    headline: "Toast to the year ahead.",
    description: "Midnight-blue reveals, champagne toasts and time capsules to open next December.",
    palette: "midnight-gold",
    motif: "champagne",
    suggested: ["reveal", "letter", "memories"],
    related: ["christmas", "congratulations", "friendship"],
    prompts: ["Happy New Year! Here's to us.", "May this year be your brightest yet.", "Cheers to new beginnings."],
  },
  {
    slug: "wedding",
    name: "Wedding",
    short: "To the happy couple",
    headline: "Celebrate two people becoming one story.",
    description: "Elegant letters, guest group cards and memory books for the big day and every day after.",
    palette: "ivory-sage",
    motif: "rings",
    suggested: ["together", "letter", "memories"],
    related: ["anniversary", "congratulations", "valentines"],
    prompts: ["Wishing you a lifetime of love.", "Congratulations on your forever.", "May your love grow with every year."],
  },
  {
    slug: "graduation",
    name: "Graduation",
    short: "You did it",
    headline: "Celebrate the moment they've worked for.",
    description: "Confetti reveals, proud-parent letters and group cards from everyone cheering them on.",
    palette: "navy-ivory",
    motif: "cap",
    suggested: ["surprise", "together", "letter"],
    related: ["congratulations", "birthday", "thank-you"],
    prompts: ["So proud of you, graduate!", "The world is lucky to have you.", "Onwards and upwards."],
  },
  {
    slug: "mothers-day",
    name: "Mother's Day",
    short: "For the one who started it all",
    headline: "For the woman who taught you love.",
    description: "Floral letters, family scrapbooks and group cards from every grandchild.",
    palette: "blush-gold",
    motif: "floral",
    suggested: ["letter", "memories", "together"],
    related: ["fathers-day", "thank-you", "birthday"],
    prompts: ["Happy Mother's Day, Mum.", "Thank you for everything, always.", "Everything good in me started with you."],
  },
  {
    slug: "fathers-day",
    name: "Father's Day",
    short: "For the one who always shows up",
    headline: "For the man who always showed up.",
    description: "Classic cards, memory timelines and little surprises for dads, grandads and father figures.",
    palette: "navy-ivory",
    motif: "sun",
    suggested: ["memories", "surprise", "letter"],
    related: ["mothers-day", "thank-you", "birthday"],
    prompts: ["Happy Father's Day, Dad.", "Thanks for all the bad jokes and good advice.", "My first hero."],
  },
  {
    slug: "congratulations",
    name: "Congratulations",
    short: "Big news deserves big cheers",
    headline: "Big news deserves a big moment.",
    description: "New jobs, new homes, new babies — celebrate the milestones with confetti and cheers.",
    palette: "lemon-sorbet",
    motif: "confetti",
    suggested: ["surprise", "reveal", "together"],
    related: ["graduation", "wedding", "thank-you"],
    prompts: ["Congratulations — you deserve this!", "Look at you go!", "So happy for you."],
  },
  {
    slug: "thank-you",
    name: "Thank You",
    short: "Gratitude, beautifully said",
    headline: "Gratitude, beautifully said.",
    description: "Heartfelt notes for teachers, colleagues, hosts and the friends who showed up when it mattered.",
    palette: "ivory-sage",
    motif: "botanical",
    suggested: ["letter", "together", "classic"],
    related: ["friendship", "congratulations", "get-well-soon"],
    prompts: ["Thank you, from the bottom of my heart.", "I couldn't have done it without you.", "You made a real difference."],
  },
  {
    slug: "get-well-soon",
    name: "Get Well Soon",
    short: "Sending warmth your way",
    headline: "Send a little sunshine their way.",
    description: "Gentle, cheerful notes and group cards to remind them they are thought of.",
    palette: "mint-peach",
    motif: "sun",
    suggested: ["letter", "together", "classic"],
    related: ["thank-you", "friendship", "just-because"],
    prompts: ["Thinking of you and sending love.", "Rest up — we miss you.", "Get well soon, sunshine."],
  },
  {
    slug: "just-because",
    name: "Just Because",
    short: "No reason needed",
    headline: "No occasion needed.",
    description: "The best surprises arrive on ordinary days. A little note, a hidden photo, a reason to smile.",
    palette: "terracotta",
    motif: "envelope",
    suggested: ["letter", "reveal", "memories"],
    related: ["friendship", "valentines", "thank-you"],
    prompts: ["Thinking of you today.", "No reason. Just you.", "A little something, made with love."],
  },
];

export const occasionMap = Object.fromEntries(occasions.map((o) => [o.slug, o])) as Record<OccasionSlug, Occasion>;

/** Replaces the built-in occasions with the active ones from the database (see hydrateTemplates). */
export function hydrateOccasions(list: Occasion[]) {
  if (!list.length) return;
  occasions.splice(0, occasions.length, ...list);
  for (const o of list) occasionMap[o.slug] = o;
}

export function getOccasion(slug: string): Occasion | undefined {
  return occasionMap[slug as OccasionSlug];
}

const properNouns: OccasionSlug[] = ["valentines", "christmas", "new-year", "mothers-day", "fathers-day"];

/** The occasion name as it reads mid-sentence ("a birthday surprise", "a Christmas surprise"). */
export function occasionInSentence(o: Occasion) {
  return properNouns.includes(o.slug) ? o.name : o.name.toLowerCase();
}

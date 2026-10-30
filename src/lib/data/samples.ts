import { buildCreation, seededIds } from "../creation";
import type { Contribution, Creation, InteractionSettings, Photo, ReceivedCard } from "../types";
import { getTemplate } from "./templates";

const NOW = "2026-10-29T18:00:00.000Z";

interface SampleSeed {
  slug: string;
  templateId: string;
  recipientName: string;
  senderName: string;
  message: string;
  photos?: Photo[];
  interaction?: Partial<InteractionSettings>;
  contributions?: Contribution[];
  occasionDate?: string;
}

const ph = (id: string, src: string, caption?: string, date?: string): Photo => ({ id, src, caption, date });

const sampleSeeds: SampleSeed[] = [
  {
    slug: "for-maya",
    templateId: "tpl-confetti-cake",
    recipientName: "Maya",
    senderName: "Jonah",
    message: "Happy birthday to the person who makes every room brighter. I hope this year brings you long lunches, good books and everything you've been quietly wishing for.",
    photos: [ph("p1", "scene:picnic", "Our picnic in June"), ph("p2", "scene:beach", "Saltwater hair")],
    interaction: { hiddenMessage: "Dinner at Lucia's on Friday. 8pm. Wear the yellow dress.", giftWrap: "stripes" },
  },
  {
    slug: "dear-sam",
    templateId: "tpl-sealed-with-love",
    recipientName: "Sam",
    senderName: "Riya",
    message: "Five Valentine's Days and you still make my heart do that silly little skip. Thank you for the coffee you bring me without asking, for the playlists, for the way you laugh at your own jokes. I love you more than I know how to write.",
    photos: [ph("p1", "scene:city", "Lisbon, at dusk"), ph("p2", "scene:lake", "The lake house")],
    interaction: { seal: "heart", envelopeDesign: "classic", letterBackground: "cream" },
  },
  {
    slug: "our-story",
    templateId: "tpl-our-timeline",
    recipientName: "Daniel",
    senderName: "Amara",
    message: "Ten years of us. Here are a few of my favourite pages so far.",
    photos: [
      ph("p1", "scene:city", "The night we met", "2016-03-12"),
      ph("p2", "scene:mountains", "Our first trip", "2017-08-04"),
      ph("p3", "scene:meadow", "Moving day", "2019-05-21"),
      ph("p4", "scene:beach", "The proposal", "2021-09-30"),
      ph("p5", "scene:sunset", "Our wedding", "2022-06-18"),
      ph("p6", "scene:picnic", "Sundays, always", "2026-10-01"),
    ],
  },
  {
    slug: "scratch-for-ava",
    templateId: "tpl-scratch-my-heart",
    recipientName: "Ava",
    senderName: "Theo",
    message: "I have a little secret for you. Scratch gently.",
    interaction: { mode: "scratch", hiddenMessage: "Pack a bag — we're going to Paris in March." },
  },
  {
    slug: "happy-birthday-leo",
    templateId: "tpl-everyone-sings",
    recipientName: "Leo",
    senderName: "The studio team",
    message: "Happy birthday from everyone at the studio. We made you a little something.",
    contributions: [
      { id: "k1", name: "Priya", message: "Happy birthday Leo! Thank you for always having the best snacks and the best ideas.", color: "#F9D9D3", createdAt: NOW },
      { id: "k2", name: "Marcus", message: "Another year of you saving our deadlines. Have the best day.", photo: "scene:mountains", color: "#D9E8F5", createdAt: NOW },
      { id: "k3", name: "Hana", message: "Wishing you a year as kind as you are. 🎂", color: "#E6DDF5", createdAt: NOW },
      { id: "k4", name: "Olivia", message: "To more Friday lunches and terrible puns!", photo: "scene:picnic", color: "#FBEFC8", createdAt: NOW },
      { id: "k5", name: "Tom", message: "Happy birthday mate. Drinks are on me tonight.", color: "#DCEFE4", createdAt: NOW },
      { id: "k6", name: "Aisha", message: "You make Mondays bearable. That's a superpower. Happy birthday!", color: "#F9D9D3", createdAt: NOW },
    ],
  },
  {
    slug: "pop-for-priya",
    templateId: "tpl-pop-the-balloons",
    recipientName: "Priya",
    senderName: "Nina",
    message: "Happy birthday! Five balloons. One surprise. Go!",
    interaction: { mode: "balloon", hiddenMessage: "Brunch is booked. Sunday, 11am. Bring your appetite." },
  },
  {
    slug: "starry-note",
    templateId: "tpl-starry-note",
    recipientName: "Jo",
    senderName: "Kit",
    message: "Turn me over.",
    interaction: { mode: "flip", hiddenMessage: "On the hard days, remember: you light things up, even when you can't see it." },
  },
  {
    slug: "quiz-for-noah",
    templateId: "tpl-how-well-quiz",
    recipientName: "Noah",
    senderName: "Ella",
    message: "Prove you're my best friend.",
    interaction: {
      mode: "quiz",
      quizQuestion: "What did we eat at 3am after the concert?",
      quizOptions: ["Pancakes", "Cold pizza", "Instant noodles"],
      quizAnswer: 2,
      hiddenMessage: "Correct! Tickets for the next tour are in your inbox.",
    },
  },
  {
    slug: "hello-dad",
    templateId: "tpl-hello-dad",
    recipientName: "Dad",
    senderName: "Ruby & Finn",
    message: "We recorded something for you. Turn the sound up.",
    photos: [ph("p1", "scene:lake", "Fishing, 2009"), ph("p2", "scene:mountains", "That hike"), ph("p3", "scene:sunset", "Every summer")],
    interaction: { mode: "video" },
  },
  {
    slug: "dads-sunday",
    templateId: "tpl-dads-sunday",
    recipientName: "Dad",
    senderName: "Alex",
    message: "Thank you for every early-morning drive, every terrible joke and every time you said \"I'm proud of you.\" Happy Father's Day.",
    photos: [ph("p1", "scene:meadow", "Sunday walks")],
  },
  {
    slug: "photo-for-kai",
    templateId: "tpl-hidden-polaroid",
    recipientName: "Kai",
    senderName: "Mina",
    message: "Found this the other day and thought of you.",
    photos: [ph("p1", "scene:beach", "Summer '19")],
    interaction: { mode: "photo-reveal", hiddenMessage: "Same beach next summer?" },
  },
  {
    slug: "open-next-year",
    templateId: "tpl-open-next-year",
    recipientName: "Future us",
    senderName: "Present us",
    message: "If you're reading this, we made it through another year. I hope we kept our promises.",
    interaction: { mode: "envelope", unlockAt: "2027-01-01T00:00:00.000Z", seal: "star" },
  },
  {
    slug: "reasons-for-lou",
    templateId: "tpl-twenty-reasons",
    recipientName: "Lou",
    senderName: "Max",
    message: "Just a few of the reasons. There are many more.",
    interaction: { mode: "tap", hiddenMessage: "Your laugh|The way you hum while cooking|How you remember everyone's birthdays|Your terrible dancing|Your kindness to strangers|That you chose me" },
  },
];

export const sampleCreations: Creation[] = sampleSeeds.map((s) => {
  const template = getTemplate(s.templateId)!;
  const c = buildCreation({
    template,
    recipientName: s.recipientName,
    senderName: s.senderName,
    message: s.message,
    photos: s.photos,
    interaction: s.interaction,
    status: "published",
    now: NOW,
    id: seededIds(s.slug.replace(/-/g, "").slice(0, 6)),
    slug: s.slug,
  });
  return { ...c, contributions: s.contributions ?? [] };
});

export const sampleSlugs = sampleSeeds.map((s) => s.slug);

export function getSampleCreation(slug: string) {
  return sampleCreations.find((c) => c.slug === slug);
}

export const sampleReceived: ReceivedCard[] = [
  { slug: "dear-sam", title: "To my Valentine", from: "Riya", occasion: "valentines", palette: "rose-cream", motif: "envelope", receivedAt: "2026-10-28T09:12:00.000Z", openedAt: "2026-10-28T09:20:00.000Z", saved: true },
  { slug: "happy-birthday-leo", title: "From all of us", from: "The studio team", occasion: "birthday", palette: "mint-peach", motif: "confetti", receivedAt: "2026-10-21T15:00:00.000Z", openedAt: "2026-10-21T16:02:00.000Z", saved: false },
  { slug: "starry-note", title: "You light things up", from: "Kit", occasion: "just-because", palette: "midnight-gold", motif: "stars", receivedAt: "2026-10-30T07:45:00.000Z", saved: false },
  { slug: "quiz-for-noah", title: "Pop quiz!", from: "Ella", occasion: "friendship", palette: "lemon-sorbet", motif: "stars", receivedAt: "2026-09-02T12:00:00.000Z", openedAt: "2026-09-02T12:30:00.000Z", saved: true },
];

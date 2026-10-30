"use client";

import { Search } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Faq } from "../ui/faq";
import { EmptyState } from "../ui/misc";

const sections: { title: string; items: { q: string; a: string }[] }[] = [
  {
    title: "Getting started",
    items: [
      { q: "How do I create my first card?", a: "Click “Create something special”, pick an occasion and an experience, choose a template and add your words and photos. You can preview it exactly as they'll see it before you publish." },
      { q: "Do I need an account?", a: "You can create as a guest — drafts are kept in this browser. Create a free account to keep your creations safe across devices." },
      { q: "Which experience should I choose?", a: "The Letter is perfect for heartfelt words. The Surprise and The Reveal add playful moments. The Memories is for photo stories, and The Together collects messages from a group." },
    ],
  },
  {
    title: "Sharing & receiving",
    items: [
      { q: "How do I send my card?", a: "After publishing, copy your private link and send it by text, email, WhatsApp or any messaging app. You can also schedule it to unlock at a specific time on Pro." },
      { q: "Does the recipient need to download anything?", a: "No. Cards open in any modern browser on phones, tablets and computers — no app or account required." },
      { q: "Will sound play automatically?", a: "Never. If you add music, the recipient sees a sound button and chooses whether to turn it on." },
    ],
  },
  {
    title: "Editing & designing",
    items: [
      { q: "How do I change text or move things around?", a: "Open the designer. Click to select, drag to move, use the corner handles to resize and the round handle to rotate. Double-click text to edit it in place." },
      { q: "Can I undo a change?", a: "Yes — use the undo and redo buttons in the toolbar, or Ctrl/⌘ + Z and Shift + Ctrl/⌘ + Z." },
      { q: "Is my work saved?", a: "The designer saves automatically as you go. You'll see “All changes saved” in the toolbar." },
    ],
  },
  {
    title: "Plans & billing",
    items: [
      { q: "What's included for free?", a: "Basic templates, text customisation, up to three photos per card, the core interactive experiences and shareable links." },
      { q: "Can I cancel anytime?", a: "Yes. Cards you've already sent stay live forever, even if you cancel." },
    ],
  },
];

export function HelpCenter() {
  const [q, setQ] = useState("");
  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return sections;
    return sections.map((sec) => ({ ...sec, items: sec.items.filter((i) => `${i.q} ${i.a}`.toLowerCase().includes(s)) })).filter((sec) => sec.items.length);
  }, [q]);
  return (
    <div>
      <label className="relative mx-auto block max-w-xl">
        <span className="sr-only">Search help articles</span>
        <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted" />
        <input value={q} onChange={(e) => setQ(e.target.value)} type="search" placeholder="Search for answers…" className="h-12 w-full rounded-full border border-line bg-paper pl-11 pr-4 text-[15px] focus:border-burgundy/40 focus:outline-none focus:ring-4 focus:ring-blush" />
      </label>
      <div className="mx-auto mt-12 max-w-3xl space-y-12">
        {filtered.length ? (
          filtered.map((sec) => (
            <section key={sec.title}>
              <h2 className="mb-3 font-display text-3xl">{sec.title}</h2>
              <Faq items={sec.items} />
            </section>
          ))
        ) : (
          <EmptyState title="No answers match that yet" description="Try different words, or send us a message — we're happy to help." action={<Link href="/contact" className="text-burgundy underline underline-offset-4">Contact us</Link>} />
        )}
      </div>
    </div>
  );
}

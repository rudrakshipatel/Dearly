import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { MotifArt } from "@/components/art/motif";
import { TemplateLibrary } from "@/components/explore/template-library";
import { OccasionCard } from "@/components/occasions/occasion-card";
import { Container, Skeleton } from "@/components/ui/misc";
import { categories } from "@/lib/data/experiences";
import { occasions } from "@/lib/data/occasions";
import type { Motif, PaletteId } from "@/lib/types";

export const metadata: Metadata = {
  title: "Explore",
  description: "A curated library of interactive letters, gift reveals, memory books, video greetings and group cards.",
};

const categoryArt: Record<string, { motif: Motif; palette: PaletteId }> = {
  "classic-cards": { motif: "botanical", palette: "ivory-sage" },
  "interactive-surprises": { motif: "gift", palette: "pastel-party" },
  "love-letters": { motif: "envelope", palette: "rose-cream" },
  "memory-books": { motif: "polaroids", palette: "lavender-coral" },
  "video-greetings": { motif: "film", palette: "terracotta" },
  "group-cards": { motif: "confetti", palette: "mint-peach" },
  "time-capsules": { motif: "capsule", palette: "midnight-gold" },
};

export default function ExplorePage() {
  return (
    <>
      <Container className="pb-10 pt-10 sm:pt-16">
        <p className="eyebrow mb-4">The Dearly library</p>
        <h1 className="max-w-3xl font-display text-[3rem] leading-[0.98] tracking-[-0.02em] sm:text-7xl">
          Find the right way to say <em className="text-burgundy">it.</em>
        </h1>
        <p className="mt-5 max-w-xl text-[16px] leading-relaxed text-muted">
          Browse by the moment you&apos;re celebrating, or by how you want it to feel when they open it.
        </p>
      </Container>

      <Container>
        <h2 className="eyebrow mb-4">Browse by experience</h2>
        <div className="scrollbar-none -mx-5 flex gap-3 overflow-x-auto px-5 pb-2 sm:mx-0 sm:grid sm:grid-cols-4 sm:px-0 lg:grid-cols-7">
          {categories.map((c) => (
            <Link key={c.id} href={`/explore?category=${c.id}`} scroll={false} className="group w-40 shrink-0 rounded-2xl border border-line bg-paper p-3 transition-shadow hover:shadow-soft sm:w-auto">
              <div className="mb-3 grid aspect-[4/3] place-items-center rounded-xl bg-blush/50">
                <MotifArt {...categoryArt[c.id]} className="h-20 transition-transform group-hover:scale-105" />
              </div>
              <p className="text-[14px] font-medium text-ink">{c.name}</p>
              <p className="text-[12.5px] leading-snug text-muted">{c.description}</p>
            </Link>
          ))}
        </div>

        <h2 className="eyebrow mb-4 mt-12">Browse by occasion</h2>
        <div className="scrollbar-none -mx-5 flex gap-3 overflow-x-auto px-5 pb-2 sm:mx-0 sm:grid sm:grid-cols-5 sm:px-0 lg:grid-cols-7">
          {occasions.map((o) => (
            <OccasionCard key={o.slug} occasion={o} size="sm" className="w-36 shrink-0 sm:w-auto" />
          ))}
        </div>
      </Container>

      <Container className="mt-14 pb-24">
        <h2 className="mb-2 font-display text-4xl">All templates</h2>
        <Suspense fallback={<LibrarySkeleton />}>
          <TemplateLibrary />
        </Suspense>
      </Container>
    </>
  );
}

function LibrarySkeleton() {
  return (
    <div className="mt-6">
      <Skeleton className="h-11 w-full rounded-full" />
      <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="aspect-[3/4] rounded-[18px]" />
        ))}
      </div>
    </div>
  );
}

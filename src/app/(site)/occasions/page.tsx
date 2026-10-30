import type { Metadata } from "next";
import { OccasionCard } from "@/components/occasions/occasion-card";
import { Container } from "@/components/ui/misc";
import { occasions } from "@/lib/data/occasions";

export const metadata: Metadata = {
  title: "Occasions",
  description: "Birthdays, anniversaries, Valentine's Day, Christmas, graduations and every just-because day in between.",
};

export default function OccasionsPage() {
  return (
    <Container className="pb-24 pt-10 sm:pt-16">
      <p className="eyebrow mb-4">Occasions</p>
      <h1 className="max-w-3xl font-display text-[3rem] leading-[0.98] tracking-[-0.02em] sm:text-7xl">
        What are we <em className="text-burgundy">celebrating?</em>
      </h1>
      <p className="mt-5 max-w-xl text-[16px] leading-relaxed text-muted">Every collection has its own palette, its own templates and its own little surprises.</p>
      <div className="mt-12 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
        {occasions.map((o) => (
          <OccasionCard key={o.slug} occasion={o} />
        ))}
      </div>
    </Container>
  );
}

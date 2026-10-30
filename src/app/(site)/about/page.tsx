import { ArrowRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { MotifArt } from "@/components/art/motif";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/misc";

export const metadata: Metadata = {
  title: "About",
  description: "Dearly turns feelings into little experiences — letters that open, gifts that unwrap and memories that come alive.",
};

const values = [
  { title: "Personal over perfect", body: "A wobbly handwritten note beats a polished template every time. Everything we build makes it easier to sound like you.", motif: "envelope" as const, palette: "rose-cream" as const },
  { title: "For everyone, everywhere", body: "Birthdays in Brisbane, Diwali in Delhi, Thanksgiving in Toronto. Dearly is made for every relationship and every culture.", motif: "stars" as const, palette: "midnight-gold" as const },
  { title: "Free to receive, always", body: "The person you're celebrating never needs an account, an app or a credit card. They just open it.", motif: "gift" as const, palette: "pastel-party" as const },
];

export default function AboutPage() {
  return (
    <>
      <Container className="pb-16 pt-10 sm:pt-16">
        <p className="eyebrow mb-4">About Dearly</p>
        <h1 className="max-w-4xl font-display text-[3rem] leading-[0.98] tracking-[-0.02em] sm:text-7xl">
          We believe the best gifts are <em className="text-burgundy">feelings,</em> beautifully wrapped.
        </h1>
        <div className="mt-10 grid gap-8 text-[17px] leading-relaxed text-ink/80 md:grid-cols-2">
          <p>
            Dearly began with a simple frustration: the messages that matter most usually arrive as a text bubble or a forgettable e-card. We wanted something in between a handwritten letter and a little piece of theatre — something people would open slowly, smile at, and keep.
          </p>
          <p>
            So we built a home for interactive letters, gift reveals, scrapbooks and group cards. Each one is designed like premium stationery, works beautifully on any phone and takes minutes to make. More than a card. A memory.
          </p>
        </div>
      </Container>
      <section className="bg-paper py-16 sm:py-24">
        <Container className="grid gap-6 md:grid-cols-3">
          {values.map((v) => (
            <div key={v.title} className="rounded-[22px] border border-line bg-ivory p-7">
              <MotifArt motif={v.motif} palette={v.palette} className="mb-6 h-24" />
              <h2 className="font-display text-3xl leading-tight">{v.title}</h2>
              <p className="mt-3 text-[15px] leading-relaxed text-muted">{v.body}</p>
            </div>
          ))}
        </Container>
      </section>
      <Container className="py-20 text-center">
        <h2 className="font-display text-5xl">Someone out there deserves a little Dearly.</h2>
        <Button asChild size="lg" className="mt-8">
          <Link href="/create">
            Create your first experience <ArrowRight />
          </Link>
        </Button>
      </Container>
    </>
  );
}

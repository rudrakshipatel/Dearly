import { ArrowRight, Check, Heart, PenLine, Send, Sparkles } from "lucide-react";
import Link from "next/link";
import { TemplateThumb } from "@/components/art/template-thumb";
import { MotifArt } from "@/components/art/motif";
import { HeroVisual } from "@/components/home/hero-visual";
import { OccasionCard } from "@/components/occasions/occasion-card";
import { RegionalPrice } from "@/components/pricing/regional-price";
import { TemplateCard } from "@/components/templates/template-card";
import { Button } from "@/components/ui/button";
import { Container, SectionHeading } from "@/components/ui/misc";
import { coreExperiences } from "@/lib/data/experiences";
import { occasions } from "@/lib/data/occasions";
import { palettes } from "@/lib/data/palettes";
import { pricing } from "@/lib/data/pricing";
import { featuredTemplateIds, getTemplate } from "@/lib/data/templates";

const inspirations = [
  { slug: "dear-sam", quote: "Five Valentine's Days and you still make my heart skip.", from: "Riya to Sam", palette: "rose-cream", motif: "envelope", headline: "To my Valentine", kind: "The Letter" },
  { slug: "for-maya", quote: "Dinner at Lucia's on Friday. Wear the yellow dress.", from: "Jonah to Maya", palette: "pastel-party", motif: "cake", headline: "Happy Birthday!", kind: "The Surprise" },
  { slug: "our-story", quote: "Ten years of us. A few of my favourite pages so far.", from: "Amara to Daniel", palette: "burgundy-champagne", motif: "film", headline: "Our story so far", kind: "The Memories" },
  { slug: "happy-birthday-leo", quote: "You make Mondays bearable. That's a superpower.", from: "The studio, to Leo", palette: "mint-peach", motif: "confetti", headline: "From all of us", kind: "The Together" },
  { slug: "scratch-for-ava", quote: "Pack a bag — we're going to Paris in March.", from: "Theo to Ava", palette: "plum-ink", motif: "scratch", headline: "Scratch to see", kind: "The Reveal" },
] as const;

export default function HomePage() {
  const featured = featuredTemplateIds.map((id) => getTemplate(id)!);
  return (
    <>
      {/* A — Hero */}
      <section className="relative overflow-hidden">
        <Container className="grid items-center gap-10 pb-16 pt-8 sm:pt-14 lg:grid-cols-[1.05fr_1fr] lg:gap-6 lg:pb-24">
          <div className="max-w-xl">
            <p className="eyebrow mb-5 flex items-center gap-2">
              <span className="h-px w-8 bg-rose" /> More than a card. A memory.
            </p>
            <h1 className="font-display text-[3.4rem] leading-[0.95] tracking-[-0.02em] text-ink sm:text-[5.2rem]">
              Make someone
              <br />
              feel <em className="text-burgundy">special.</em>
            </h1>
            <p className="mt-6 max-w-md text-[17px] leading-relaxed text-muted">
              Create beautiful, personalized surprises for the people who matter most — letters that open, gifts that unwrap and memories that come alive.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg">
                <Link href="/create">
                  Create something special <ArrowRight />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/experiences">Explore experiences</Link>
              </Button>
            </div>
            <div className="mt-10 flex items-center gap-4 text-[13px] text-muted">
              <div className="flex -space-x-2">
                {["#D98286", "#C9B9E8", "#A9B9A0", "#ECDCC2"].map((c) => (
                  <span key={c} className="size-7 rounded-full border-2 border-ivory" style={{ background: c }} />
                ))}
              </div>
              <p>Free to start · Your recipient never needs an account</p>
            </div>
          </div>
          <HeroVisual />
        </Container>
      </section>

      {/* B — Occasions */}
      <section className="py-16 sm:py-24">
        <Container>
          <SectionHeading
            eyebrow="Browse by occasion"
            title={
              <>
                Every occasion deserves <em>something special.</em>
              </>
            }
            action={
              <Button asChild variant="link">
                <Link href="/occasions">
                  All occasions <ArrowRight />
                </Link>
              </Button>
            }
          />
          <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-5 xl:grid-cols-7">
            {occasions.map((o) => (
              <OccasionCard key={o.slug} occasion={o} />
            ))}
          </div>
        </Container>
      </section>

      {/* C — Experiences */}
      <section className="bg-paper py-16 sm:py-24">
        <Container>
          <SectionHeading
            eyebrow="Not just cards"
            title={
              <>
                Little <em>experiences.</em>
              </>
            }
            description="Five ways to turn how you feel into something they can open, unwrap, scratch, flip through and keep."
          />
          <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-6">
            {coreExperiences.map((e, i) => {
              const p = palettes[e.palette];
              return (
                <Link
                  key={e.kind}
                  href={`/experiences#${e.kind}`}
                  className={`group relative flex flex-col overflow-hidden rounded-[22px] border border-line bg-ivory transition-shadow hover:shadow-lift ${i < 2 ? "lg:col-span-3" : "lg:col-span-2"}`}
                >
                  <div className="relative flex h-56 items-center justify-center overflow-hidden" style={{ background: p.bg }}>
                    <div className="paper-grain absolute inset-0" />
                    <MotifArt motif={e.motif} palette={e.palette} className="relative h-44 transition-transform duration-500 group-hover:-rotate-3 group-hover:scale-105" />
                    <span className="absolute left-4 top-4 font-display text-sm text-ink/50">0{i + 1}</span>
                  </div>
                  <div className="flex flex-1 flex-col p-6">
                    <h3 className="font-display text-[28px] leading-none text-ink">{e.name}</h3>
                    <p className="mt-2 text-[15px] leading-relaxed text-muted">{e.description}</p>
                    <span className="mt-5 inline-flex items-center gap-1.5 text-[14px] font-medium text-burgundy">
                      Explore {e.name.replace("The ", "").toLowerCase()} <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </Container>
      </section>

      {/* D — Featured templates */}
      <section className="py-16 sm:py-24">
        <Container>
          <SectionHeading
            eyebrow="Featured templates"
            title={
              <>
                Made to be <em>made yours.</em>
              </>
            }
            description="Tap Preview to try any template exactly as your recipient will see it."
            action={
              <Button asChild variant="outline">
                <Link href="/explore">Browse all templates</Link>
              </Button>
            }
          />
          <div className="mt-10 grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 lg:grid-cols-4">
            {featured.map((t) => (
              <TemplateCard key={t.id} template={t} />
            ))}
          </div>
        </Container>
      </section>

      {/* E — How it works */}
      <section className="border-y border-line bg-blush/40 py-16 sm:py-24">
        <Container>
          <SectionHeading align="center" eyebrow="How Dearly works" title="Three steps to a little magic." />
          <ol className="mt-14 grid gap-10 md:grid-cols-3 md:gap-6">
            {[
              { icon: Sparkles, title: "Choose an experience", body: "Pick an occasion and a way to open it — a sealed letter, a gift, a scratch card or a scrapbook." },
              { icon: PenLine, title: "Make it personal", body: "Add their name, your words, your photos and a little hidden surprise. Change anything in the editor." },
              { icon: Send, title: "Share something unforgettable", body: "Send a private link by text, email or chat. They open it on any device — no app, no account." },
            ].map((s, i) => (
              <li key={s.title} className="relative text-center md:px-6">
                <div className="mx-auto mb-5 grid size-14 place-items-center rounded-full border border-line bg-paper text-burgundy shadow-soft">
                  <s.icon className="size-5" />
                </div>
                <p className="font-display text-sm text-muted">Step {i + 1}</p>
                <h3 className="mt-1 font-display text-[28px] leading-tight text-ink">{s.title}</h3>
                <p className="mx-auto mt-3 max-w-xs text-[15px] leading-relaxed text-muted">{s.body}</p>
              </li>
            ))}
          </ol>
        </Container>
      </section>

      {/* F — Inspiration */}
      <section className="overflow-hidden py-16 sm:py-24">
        <Container>
          <SectionHeading
            eyebrow="Made with Dearly"
            title={
              <>
                Little things people <em>actually sent.</em>
              </>
            }
            description="Open any of these to experience it as the recipient did."
          />
        </Container>
        <div className="scrollbar-none mt-10 flex snap-x snap-mandatory gap-5 overflow-x-auto px-5 pb-4 sm:px-8 lg:px-[max(2rem,calc((100vw-1240px)/2+2rem))]">
          {inspirations.map((x, i) => (
            <Link
              key={x.slug}
              href={`/card/${x.slug}`}
              className="group w-[260px] shrink-0 snap-start sm:w-[300px]"
              style={{ transform: `rotate(${i % 2 ? 1.2 : -1.2}deg)` }}
            >
              <div className="overflow-hidden rounded-[18px] border border-line shadow-soft transition-shadow group-hover:shadow-lift">
                <TemplateThumb palette={x.palette} motif={x.motif} headline={x.headline} />
              </div>
              <p className="mt-4 font-hand text-[22px] leading-snug text-ink">&ldquo;{x.quote}&rdquo;</p>
              <p className="mt-1 text-[13px] text-muted">
                {x.from} · {x.kind}
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* G — Pricing preview */}
      <section className="bg-paper py-16 sm:py-24">
        <Container className="grid gap-12 lg:grid-cols-[1fr_1.4fr] lg:items-center">
          <SectionHeading
            eyebrow="Pricing"
            title={
              <>
                Free to start. <em>Premium</em> when it matters.
              </>
            }
            description="Every recipient opens their card free, forever. Upgrade only for the moments that deserve a little more."
          />
          <div className="grid gap-4 sm:grid-cols-2">
            {pricing.plans.slice(0, 2).map((plan) => (
              <div key={plan.id} className={`rounded-[22px] border p-7 ${plan.featured ? "border-burgundy bg-burgundy text-ivory" : "border-line bg-ivory"}`}>
                <p className={`eyebrow ${plan.featured ? "!text-ivory/70" : ""}`}>{plan.name}</p>
                <p className="mt-3 font-display text-5xl">
                  {plan.id === "free" ? "Free" : <RegionalPrice plan="premium" />}
                  {plan.id !== "free" && <span className="font-sans text-base opacity-70"> /month</span>}
                </p>
                <ul className="mt-6 space-y-2.5 text-[14px]">
                  {plan.highlights.slice(0, 4).map((h) => (
                    <li key={h} className="flex items-center gap-2">
                      <Check className={`size-4 ${plan.featured ? "text-champagne" : "text-burgundy"}`} /> {h}
                    </li>
                  ))}
                </ul>
                <Button asChild className="mt-7 w-full" variant={plan.featured ? "outline" : "primary"}>
                  <Link href={plan.id === "free" ? "/create" : "/pricing"} className={plan.featured ? "!border-ivory/30 !bg-ivory !text-burgundy" : ""}>
                    {plan.cta}
                  </Link>
                </Button>
              </div>
            ))}
            <Link href="/pricing" className="text-[14px] text-burgundy underline-offset-4 hover:underline sm:col-span-2">
              Compare all plans, including Pro →
            </Link>
          </div>
        </Container>
      </section>

      {/* H — Final CTA */}
      <section className="relative overflow-hidden py-24 sm:py-32">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,var(--color-blush),transparent_70%)]" />
        <MotifArt motif="hearts" palette="rose-cream" className="absolute -left-10 top-10 w-40 rotate-[-16deg] opacity-60 sm:w-56" />
        <MotifArt motif="balloons" palette="lavender-coral" className="absolute -right-6 bottom-6 w-40 rotate-[10deg] opacity-60 sm:w-56" />
        <Container className="relative text-center">
          <Heart className="mx-auto mb-6 size-6 text-rose" fill="currentColor" />
          <h2 className="mx-auto max-w-3xl font-display text-[2.8rem] leading-[1] tracking-[-0.01em] text-ink sm:text-7xl">
            Someone out there deserves a little <em className="text-burgundy">Dearly.</em>
          </h2>
          <Button asChild size="lg" className="mt-10">
            <Link href="/create">
              Create your first experience <ArrowRight />
            </Link>
          </Button>
        </Container>
      </section>
    </>
  );
}

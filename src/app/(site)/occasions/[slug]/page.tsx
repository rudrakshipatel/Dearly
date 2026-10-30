import { ArrowRight, Quote } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { MotifArt } from "@/components/art/motif";
import { TemplateLibrary } from "@/components/explore/template-library";
import { OccasionCard } from "@/components/occasions/occasion-card";
import { CopyPrompt } from "@/components/occasions/copy-prompt";
import { TemplateCard } from "@/components/templates/template-card";
import { Button } from "@/components/ui/button";
import { Container, SectionHeading, Skeleton } from "@/components/ui/misc";
import { coreExperiences } from "@/lib/data/experiences";
import { getOccasion, occasionInSentence, occasionMap, occasions } from "@/lib/data/occasions";
import { isDarkBg, palettes } from "@/lib/data/palettes";
import { templates } from "@/lib/data/templates";

export function generateStaticParams() {
  return occasions.map((o) => ({ slug: o.slug }));
}

export async function generateMetadata({ params }: PageProps<"/occasions/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const o = getOccasion(slug);
  if (!o) return {};
  return { title: `${o.name} cards & experiences`, description: o.description };
}

export default async function OccasionPage({ params }: PageProps<"/occasions/[slug]">) {
  const { slug } = await params;
  const o = getOccasion(slug);
  if (!o) notFound();
  const p = palettes[o.palette];
  const dark = isDarkBg(o.palette);
  const own = templates.filter((t) => t.occasion === o.slug);
  const popular = [...own].sort((a, b) => b.popularity - a.popularity).slice(0, 4);
  const suggested = coreExperiences.filter((e) => o.suggested.includes(e.kind));

  return (
    <>
      {/* Themed hero */}
      <section className="relative overflow-hidden" style={{ background: p.bg, color: dark ? p.paper : p.ink }}>
        <div className="paper-grain absolute inset-0 opacity-70" />
        <div className="absolute -right-24 top-10 size-[420px] rounded-full opacity-40 blur-3xl" style={{ background: p.accent2 }} />
        <Container className="relative grid items-center gap-8 py-14 sm:py-20 md:grid-cols-[1.2fr_1fr]">
          <div>
            <nav aria-label="Breadcrumb" className="mb-6 text-[13px] opacity-70">
              <Link href="/occasions" className="hover:underline">
                Occasions
              </Link>{" "}
              / {o.name}
            </nav>
            <p className="eyebrow mb-4" style={{ color: dark ? p.accent : p.deep }}>
              {o.short}
            </p>
            <h1 className="font-display text-[3rem] leading-[0.98] tracking-[-0.02em] sm:text-7xl">{o.headline}</h1>
            <p className="mt-5 max-w-lg text-[16px] leading-relaxed opacity-80">{o.description}</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" style={{ background: dark ? p.accent : p.deep, color: dark ? p.ink : p.paper }}>
                <Link href={`/create?occasion=${o.slug}`}>
                  Create a {occasionInSentence(o)} surprise <ArrowRight />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="!bg-transparent" style={{ borderColor: dark ? `${p.paper}44` : `${p.ink}22`, color: "inherit" }}>
                <Link href="#templates">See all {own.length} templates</Link>
              </Button>
            </div>
          </div>
          <MotifArt motif={o.motif} palette={o.palette} className="mx-auto w-[min(80%,380px)] drop-shadow-xl" />
        </Container>
      </section>

      {/* Popular designs */}
      <section className="py-16 sm:py-20">
        <Container>
          <SectionHeading eyebrow="Popular designs" title={<>Loved for {occasionInSentence(o)}.</>} />
          <div className="mt-10 grid grid-cols-2 gap-x-4 gap-y-8 lg:grid-cols-4">
            {popular.map((t) => (
              <TemplateCard key={t.id} template={t} priority />
            ))}
          </div>
        </Container>
      </section>

      {/* Interactive experiences */}
      <section className="border-y border-line bg-paper py-16 sm:py-20">
        <Container>
          <SectionHeading eyebrow="Interactive experiences" title={<>More than a card.</>} description={`The experiences people choose most for ${occasionInSentence(o)}.`} />
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {suggested.map((e) => (
              <Link
                key={e.kind}
                href={`/create?occasion=${o.slug}&experience=${e.kind}`}
                className="group rounded-[20px] border border-line bg-ivory p-5 transition-shadow hover:shadow-lift"
              >
                <div className="mb-4 grid h-36 place-items-center rounded-2xl" style={{ background: p.bg }}>
                  <MotifArt motif={e.motif} palette={o.palette} className="h-28 transition-transform group-hover:scale-105" />
                </div>
                <h3 className="font-display text-2xl">{e.name}</h3>
                <p className="mt-1 text-[14px] leading-relaxed text-muted">{e.tagline}</p>
                <span className="mt-4 inline-flex items-center gap-1 text-[14px] font-medium text-burgundy">
                  Start with this <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                </span>
              </Link>
            ))}
          </div>
        </Container>
      </section>

      {/* Words */}
      <section className="py-16 sm:py-20">
        <Container className="grid gap-10 lg:grid-cols-[1fr_1.5fr]">
          <SectionHeading eyebrow="Not sure what to write?" title={<>A few words to start with.</>} description="Copy one, then make it entirely yours." />
          <ul className="grid gap-3">
            {o.prompts.map((pr) => (
              <li key={pr} className="flex items-center justify-between gap-4 rounded-2xl border border-line bg-paper px-5 py-4">
                <span className="flex items-start gap-3">
                  <Quote className="mt-1 size-4 shrink-0 text-rose" />
                  <span className="font-hand text-2xl leading-snug">{pr}</span>
                </span>
                <CopyPrompt text={pr} />
              </li>
            ))}
          </ul>
        </Container>
      </section>

      {/* Gallery */}
      <section id="templates" className="scroll-mt-20 pb-16">
        <Container>
          <h2 className="mb-2 font-display text-4xl">All {occasionInSentence(o)} templates</h2>
          <Suspense fallback={<Skeleton className="mt-6 h-96 w-full" />}>
            <TemplateLibrary lockedOccasion={o.slug} title={`Search ${occasionInSentence(o)} templates…`} />
          </Suspense>
        </Container>
      </section>

      {/* Related */}
      <section className="border-t border-line bg-paper py-16">
        <Container>
          <h2 className="eyebrow mb-6">Related occasions</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:w-3/4">
            {o.related.map((r) => (
              <OccasionCard key={r} occasion={occasionMap[r]} size="sm" />
            ))}
          </div>
        </Container>
      </section>
    </>
  );
}

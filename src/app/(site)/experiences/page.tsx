import { ArrowRight, Film, LayoutTemplate } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { ExperienceDemo } from "@/components/experiences/experience-demo";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/misc";
import { coreExperiences } from "@/lib/data/experiences";
import { palettes } from "@/lib/data/palettes";
import type { ExperienceKind, TemplateCategory } from "@/lib/types";

export const metadata: Metadata = {
  title: "Experiences",
  description: "The Letter, The Surprise, The Memories, The Reveal and The Together — five ways to make someone feel special.",
};

const demo: Record<string, { slug: string; category: TemplateCategory; extra?: { href: string; label: string } }> = {
  letter: { slug: "dear-sam", category: "love-letters" },
  surprise: { slug: "for-maya", category: "interactive-surprises" },
  memories: { slug: "our-story", category: "memory-books" },
  reveal: { slug: "scratch-for-ava", category: "interactive-surprises" },
  together: { slug: "happy-birthday-leo", category: "group-cards", extra: { href: "/together/DemoGroupCardHappyBirthdayLeo2026", label: "Try signing a group card" } },
};

const createKind: Partial<Record<ExperienceKind, string>> = { letter: "surprise", reveal: "surprise", together: "together", memories: "memories", surprise: "surprise" };

export default function ExperiencesPage() {
  return (
    <>
      <Container className="pb-6 pt-10 sm:pt-16">
        <p className="eyebrow mb-4">Experiences</p>
        <h1 className="max-w-4xl font-display text-[3rem] leading-[0.98] tracking-[-0.02em] sm:text-7xl">
          Turn your feelings into <em className="text-burgundy">experiences.</em>
        </h1>
        <p className="mt-5 max-w-xl text-[16px] leading-relaxed text-muted">
          Each one is playable below — exactly as your recipient will see it on their phone.
        </p>
        <nav aria-label="Experiences" className="scrollbar-none mt-8 flex gap-2 overflow-x-auto">
          {coreExperiences.map((e) => (
            <a key={e.kind} href={`#${e.kind}`} className="shrink-0 rounded-full border border-line bg-paper px-4 py-2 text-[14px] hover:border-ink/30">
              {e.name}
            </a>
          ))}
        </nav>
      </Container>

      {coreExperiences.map((e, i) => {
        const d = demo[e.kind];
        const p = palettes[e.palette];
        return (
          <section key={e.kind} id={e.kind} className="scroll-mt-16 py-14 sm:py-20" style={{ background: i % 2 ? "var(--color-paper)" : undefined }}>
            <Container className={`grid items-center gap-12 lg:grid-cols-2 ${i % 2 ? "lg:[&>*:first-child]:order-2" : ""}`}>
              <div>
                <p className="font-display text-lg" style={{ color: p.deep }}>
                  0{i + 1}
                </p>
                <h2 className="mt-1 font-display text-5xl leading-none sm:text-6xl">{e.name}</h2>
                <p className="mt-4 font-display text-2xl italic text-ink/80">{e.tagline}</p>
                <p className="mt-4 max-w-md text-[16px] leading-relaxed text-muted">{e.description}</p>
                <ol className="mt-8 space-y-3">
                  {e.steps.map((s, k) => (
                    <li key={s} className="flex items-center gap-3 text-[15px]">
                      <span className="grid size-7 place-items-center rounded-full text-[12px] font-medium" style={{ background: p.bg, color: p.deep }}>
                        {k + 1}
                      </span>
                      {s}
                    </li>
                  ))}
                </ol>
                <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                  <Button asChild size="lg">
                    <Link href={`/create?experience=${createKind[e.kind] ?? "surprise"}${e.kind === "letter" ? "&mode=envelope" : e.kind === "reveal" ? "&mode=scratch" : ""}`}>
                      Create {e.name} <ArrowRight />
                    </Link>
                  </Button>
                  <Button asChild size="lg" variant="outline">
                    <Link href={`/explore?category=${d.category}`}>
                      <LayoutTemplate /> Templates
                    </Link>
                  </Button>
                  {d.extra && (
                    <Button asChild size="lg" variant="ghost">
                      <Link href={d.extra.href}>{d.extra.label}</Link>
                    </Button>
                  )}
                </div>
              </div>
              <ExperienceDemo slug={d.slug} variants={e.kind === "reveal"} />
            </Container>
          </section>
        );
      })}

      <section className="py-16 sm:py-24">
        <Container className="grid gap-4 md:grid-cols-2">
          {[
            { title: "Classic cards", body: "A beautifully designed card with pages to turn — simple, timeless, entirely yours.", href: "/card/dads-sunday", cta: "Open an example", icon: LayoutTemplate },
            { title: "Video greetings", body: "Record or upload a message and wrap it in an envelope they'll want to open.", href: "/card/hello-dad", cta: "Watch an example", icon: Film },
          ].map((x) => (
            <Link key={x.title} href={x.href} className="group flex items-start gap-5 rounded-[22px] border border-line bg-paper p-7 transition-shadow hover:shadow-lift">
              <span className="grid size-12 shrink-0 place-items-center rounded-full bg-blush text-burgundy">
                <x.icon className="size-5" />
              </span>
              <span>
                <span className="block font-display text-3xl">{x.title}</span>
                <span className="mt-1 block text-[15px] leading-relaxed text-muted">{x.body}</span>
                <span className="mt-3 inline-flex items-center gap-1 text-[14px] font-medium text-burgundy">
                  {x.cta} <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                </span>
              </span>
            </Link>
          ))}
        </Container>
      </section>
    </>
  );
}

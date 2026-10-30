import { Container } from "../ui/misc";

export function LegalPage({ title, updated, sections }: { title: string; updated: string; sections: { h: string; p: string[] }[] }) {
  return (
    <Container className="max-w-3xl pb-24 pt-10 sm:pt-16">
      <p className="eyebrow mb-4">Legal</p>
      <h1 className="font-display text-5xl leading-none sm:text-6xl">{title}</h1>
      <p className="mt-4 text-[14px] text-muted">Last updated {updated}</p>
      <p className="mt-6 rounded-2xl bg-blush/60 px-5 py-4 text-[14px] text-burgundy">This is a plain-language draft for the preview of Dearly. The final policy will be reviewed by counsel before launch.</p>
      <div className="mt-10 space-y-10">
        {sections.map((s, i) => (
          <section key={s.h}>
            <h2 className="font-display text-3xl">
              {i + 1}. {s.h}
            </h2>
            {s.p.map((p) => (
              <p key={p} className="mt-3 text-[16px] leading-relaxed text-ink/80">
                {p}
              </p>
            ))}
          </section>
        ))}
      </div>
    </Container>
  );
}

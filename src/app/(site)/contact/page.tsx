import type { Metadata } from "next";
import { ContactForm } from "@/components/info/contact-form";
import { Container } from "@/components/ui/misc";

export const metadata: Metadata = { title: "Contact", description: "Questions, ideas or a card that didn't arrive? We'd love to hear from you." };

export default function ContactPage() {
  return (
    <Container className="grid gap-12 pb-24 pt-10 sm:pt-16 lg:grid-cols-[1fr_1.2fr]">
      <div>
        <p className="eyebrow mb-4">Contact</p>
        <h1 className="font-display text-[3rem] leading-[0.98] tracking-[-0.02em] sm:text-6xl">
          We&apos;d love to <em className="text-burgundy">hear from you.</em>
        </h1>
        <p className="mt-5 max-w-md text-[16px] leading-relaxed text-muted">Questions, ideas, partnerships or a card that didn&apos;t arrive — a real person reads every message, usually within one working day.</p>
        <dl className="mt-10 space-y-5 text-[15px]">
          <div>
            <dt className="eyebrow">Support</dt>
            <dd className="mt-1">Visit the Help Center for instant answers.</dd>
          </div>
          <div>
            <dt className="eyebrow">Press & partnerships</dt>
            <dd className="mt-1">Choose &ldquo;Partnerships&rdquo; in the form.</dd>
          </div>
        </dl>
      </div>
      <ContactForm />
    </Container>
  );
}

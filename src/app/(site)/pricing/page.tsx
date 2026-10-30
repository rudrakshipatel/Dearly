import type { Metadata } from "next";
import { PricingTable } from "@/components/pricing/pricing-table";
import { Faq } from "@/components/ui/faq";
import { Container } from "@/components/ui/misc";

export const metadata: Metadata = {
  title: "Pricing",
  description: "Free to start. Premium and Pro for the moments that deserve a little more. Recipients always open for free.",
};

const faqs = [
  { q: "Does the person I send it to need to pay or sign up?", a: "Never. Recipients open every Dearly card for free, on any phone, tablet or computer, without an account or an app." },
  { q: "Can I try Premium templates before I upgrade?", a: "Yes. You can preview and design with any template. You'll only be asked to upgrade when you publish a creation that uses Premium features." },
  { q: "Why is pricing different in my country?", a: "We set fair local prices for each region rather than converting from US dollars, so Dearly feels affordable wherever you are." },
  { q: "What happens to my cards if I cancel?", a: "Everything you've already sent stays live forever. You'll simply go back to Free features for new creations." },
  { q: "Do you offer plans for teams and schools?", a: "Pro works well for small teams. For larger organisations, get in touch via our contact page and we'll set something up." },
];

export default function PricingPage() {
  return (
    <Container className="pb-24 pt-10 sm:pt-16">
      <div className="mx-auto mb-12 max-w-2xl text-center">
        <p className="eyebrow mb-4">Pricing</p>
        <h1 className="font-display text-[3rem] leading-[0.98] tracking-[-0.02em] sm:text-7xl">
          Simple, <em className="text-burgundy">heartfelt</em> pricing.
        </h1>
        <p className="mt-5 text-[16px] leading-relaxed text-muted">Start free. Upgrade for the moments that deserve a little more.</p>
      </div>
      <PricingTable />
      <div className="mx-auto mt-24 max-w-3xl">
        <h2 className="mb-6 font-display text-4xl">Questions, answered</h2>
        <Faq items={faqs} />
      </div>
    </Container>
  );
}

import type { Metadata } from "next";
import { HelpCenter } from "@/components/info/help-center";
import { Container } from "@/components/ui/misc";

export const metadata: Metadata = { title: "Help Center", description: "Answers about creating, sharing, editing and plans." };

export default function HelpPage() {
  return (
    <Container className="pb-24 pt-10 sm:pt-16">
      <div className="mb-10 text-center">
        <p className="eyebrow mb-4">Help Center</p>
        <h1 className="font-display text-[3rem] leading-[0.98] tracking-[-0.02em] sm:text-6xl">
          How can we <em className="text-burgundy">help?</em>
        </h1>
      </div>
      <HelpCenter />
    </Container>
  );
}

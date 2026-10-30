import type { Metadata } from "next";
import { Suspense } from "react";
import { CardLoading, RecipientView } from "@/components/card/recipient-view";

export const metadata: Metadata = {
  title: "A little something for you",
  description: "Someone made you something special with Dearly.",
  robots: { index: false, follow: false },
  openGraph: { title: "A little something for you 💌", description: "Someone made you something special. Tap to open." },
};

export default function CardPage({ params }: PageProps<"/card/[slug]">) {
  return (
    <Suspense fallback={<CardLoading />}>
      {params.then(({ slug }) => (
        <RecipientView slug={slug} />
      ))}
    </Suspense>
  );
}

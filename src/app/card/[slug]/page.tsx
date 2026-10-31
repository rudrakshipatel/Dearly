import type { Metadata } from "next";
import { Suspense } from "react";
import { CardLoading, RecipientView } from "@/components/card/recipient-view";
import { supabaseAnon } from "@/lib/supabase/server";

/** Link previews (WhatsApp, iMessage, social): first names only, never the message. */
export async function generateMetadata({ params }: PageProps<"/card/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const { data } = await supabaseAnon().rpc("get_card_share_meta", { p_slug: slug });
  const meta = (data ?? {}) as { recipientName?: string; senderName?: string };
  const title = meta.recipientName ? `A little something for ${meta.recipientName} 💌` : "A little something for you 💌";
  const description = meta.senderName ? `${meta.senderName} made you something special on Dearly. Tap to open.` : "Someone made you something special on Dearly. Tap to open.";
  return {
    title: { absolute: title },
    description,
    robots: { index: false, follow: false },
    openGraph: { title, description, siteName: "Dearly", type: "website" },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default function CardPage({ params }: PageProps<"/card/[slug]">) {
  return (
    <Suspense fallback={<CardLoading />}>
      {params.then(({ slug }) => (
        <RecipientView slug={slug} />
      ))}
    </Suspense>
  );
}

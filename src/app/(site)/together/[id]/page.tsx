import type { Metadata } from "next";
import { Suspense } from "react";
import { TogetherPage } from "@/components/together/together-page";
import { Container, Skeleton } from "@/components/ui/misc";

export const metadata: Metadata = {
  title: "Sign the group card",
  robots: { index: false, follow: false },
};

/** /together/<invitation token> — contributors add messages without an account. */
export default function TogetherRoute({ params }: PageProps<"/together/[id]">) {
  return (
    <Suspense
      fallback={
        <Container className="py-12">
          <Skeleton className="h-64 w-full rounded-[28px]" />
        </Container>
      }
    >
      {params.then(({ id }) => (
        <TogetherPage token={id} />
      ))}
    </Suspense>
  );
}

import type { Metadata } from "next";
import { Suspense } from "react";
import { TogetherPage } from "@/components/together/together-page";
import { Container, Skeleton } from "@/components/ui/misc";

export const metadata: Metadata = {
  title: "Sign the group card",
  robots: { index: false },
};

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
        <TogetherPage id={id} />
      ))}
    </Suspense>
  );
}

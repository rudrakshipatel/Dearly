import type { Metadata } from "next";
import { Suspense } from "react";
import { Dashboard } from "@/components/dashboard/dashboard";
import { Container, Skeleton } from "@/components/ui/misc";

export const metadata: Metadata = {
  title: "My Creations",
  robots: { index: false },
};

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <Container className="pt-12">
          <Skeleton className="h-14 w-80" />
          <Skeleton className="mt-10 h-8 w-64" />
        </Container>
      }
    >
      <Dashboard />
    </Suspense>
  );
}

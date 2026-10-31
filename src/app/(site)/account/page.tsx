import type { Metadata } from "next";
import { Suspense } from "react";
import { AccountPage } from "@/components/account/account-page";
import { Container, Skeleton } from "@/components/ui/misc";

export const metadata: Metadata = { title: "Account", robots: { index: false } };

export default function Account() {
  return (
    <Suspense
      fallback={
        <Container className="pt-12">
          <Skeleton className="h-14 w-72" />
        </Container>
      }
    >
      <AccountPage />
    </Suspense>
  );
}

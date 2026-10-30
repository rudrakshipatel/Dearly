import { Suspense } from "react";
import { Footer } from "@/components/layout/footer";
import { Navbar, NavbarFallback } from "@/components/layout/navbar";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-ink focus:px-4 focus:py-2 focus:text-ivory">
        Skip to content
      </a>
      <Suspense fallback={<NavbarFallback />}>
        <Navbar />
      </Suspense>
      <main id="main" className="flex-1">
        {children}
      </main>
      <Footer />
    </div>
  );
}

"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="grid min-h-dvh place-items-center bg-ivory px-6">
      <div className="max-w-md text-center">
        <h1 className="font-display text-5xl leading-none">Something went a little wrong.</h1>
        <p className="mt-4 text-[15.5px] leading-relaxed text-muted">Don&apos;t worry — your drafts are safe. Try again, or head back home.</p>
        {error.digest && <p className="mt-2 text-[12px] text-muted">Reference: {error.digest}</p>}
        <div className="mt-8 flex flex-col justify-center gap-2 sm:flex-row">
          <Button onClick={reset}>Try again</Button>
          <Button asChild variant="outline">
            <Link href="/">Back to Dearly</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}

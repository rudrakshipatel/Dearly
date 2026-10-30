import Link from "next/link";
import { MotifArt } from "@/components/art/motif";
import { Wordmark } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="grid min-h-dvh place-items-center bg-ivory px-6">
      <div className="max-w-md text-center">
        <MotifArt motif="envelope" palette="rose-cream" className="mx-auto w-44 rotate-[-6deg]" />
        <h1 className="mt-6 font-display text-5xl leading-none">Lost in the post.</h1>
        <p className="mt-4 text-[15.5px] leading-relaxed text-muted">We couldn&apos;t find the page you were looking for. It may have moved, or the link might be incomplete.</p>
        <div className="mt-8 flex flex-col justify-center gap-2 sm:flex-row">
          <Button asChild>
            <Link href="/">Back to Dearly</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/explore">Explore templates</Link>
          </Button>
        </div>
        <Wordmark className="mt-14 block text-2xl opacity-50" />
      </div>
    </main>
  );
}

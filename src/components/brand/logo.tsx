import Link from "next/link";
import { cn } from "@/lib/utils";

export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cn("font-display text-[28px] leading-none tracking-[-0.02em] text-ink", className)}>
      dearly<span className="text-rose">.</span>
    </span>
  );
}

export function Logo({ className, href = "/" }: { className?: string; href?: string }) {
  return (
    <Link href={href} aria-label="Dearly home" className={cn("inline-flex items-center", className)}>
      <Wordmark />
    </Link>
  );
}

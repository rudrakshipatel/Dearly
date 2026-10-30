import Link from "next/link";
import { palettes, isDarkBg } from "@/lib/data/palettes";
import type { Occasion } from "@/lib/types";
import { cn } from "@/lib/utils";
import { MotifArt } from "../art/motif";

export function OccasionCard({ occasion, className, size = "md" }: { occasion: Occasion; className?: string; size?: "sm" | "md" }) {
  const p = palettes[occasion.palette];
  const dark = isDarkBg(occasion.palette);
  return (
    <Link
      href={`/occasions/${occasion.slug}`}
      className={cn(
        "group relative flex flex-col justify-between overflow-hidden rounded-[20px] p-4 transition-transform duration-300 hover:-translate-y-1",
        size === "md" ? "aspect-[4/5]" : "aspect-square",
        className,
      )}
      style={{ background: p.bg, color: dark ? p.paper : p.ink }}
    >
      <div className="paper-grain absolute inset-0 opacity-60" />
      <MotifArt
        motif={occasion.motif}
        palette={occasion.palette}
        className="absolute -right-[8%] top-[8%] w-[78%] transition-transform duration-500 group-hover:rotate-[-4deg] group-hover:scale-105"
      />
      <span className="relative text-[11px] uppercase tracking-[0.18em]" style={{ color: dark ? p.accent : p.deep }}>
        {occasion.short}
      </span>
      <span className={cn("relative font-display leading-none", size === "md" ? "text-[26px] sm:text-[30px]" : "text-[22px]")}>{occasion.name}</span>
    </Link>
  );
}

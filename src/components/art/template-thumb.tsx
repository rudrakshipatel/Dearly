import { palettes, isDarkBg } from "@/lib/data/palettes";
import type { FontKey, Motif, PaletteId } from "@/lib/types";
import { cn, fontClass } from "@/lib/utils";
import { MotifArt } from "./motif";

/** A miniature card face used for template previews and creation thumbnails. */
export function TemplateThumb({
  palette,
  motif,
  headline,
  font = "display",
  className,
  subline,
  size = "md",
}: {
  palette: PaletteId;
  motif: Motif;
  headline: string;
  font?: FontKey;
  className?: string;
  subline?: string;
  size?: "sm" | "md" | "lg";
}) {
  const p = palettes[palette];
  const dark = isDarkBg(palette);
  return (
    <div
      className={cn("relative flex aspect-[3/4] flex-col items-center overflow-hidden", className)}
      style={{ background: p.bg, color: dark ? p.paper : p.ink }}
    >
      <div className="paper-grain absolute inset-0 opacity-70" />
      <div
        className="absolute inset-[6%] rounded-[2px] border"
        style={{ borderColor: dark ? `${p.accent}66` : `${p.deep}22` }}
      />
      <MotifArt motif={motif} palette={palette} className="relative mt-[12%] w-[66%]" />
      <p
        className={cn(
          "relative mt-[2%] px-[10%] text-center leading-[1.02]",
          fontClass[font],
          font === "sans" && "font-bold tracking-tight",
          size === "sm" && "text-[15px]",
          size === "md" && "text-[clamp(18px,2.1vw,26px)]",
          size === "lg" && "text-[clamp(26px,4vw,40px)]",
        )}
      >
        {headline}
      </p>
      {subline && (
        <p className="relative mt-1 font-hand text-[clamp(14px,1.4vw,18px)]" style={{ color: dark ? p.accent : p.deep }}>
          {subline}
        </p>
      )}
    </div>
  );
}

"use client";

import { useResolvedSrc } from "@/lib/media/resolver";
import { cn } from "@/lib/utils";
import { Scene } from "./scene";

/**
 * Renders an illustrated scene (`scene:name`), uploaded media (`media:id` → signed URL),
 * or a plain URL. Shows a soft placeholder while a signed URL is on its way.
 */
export function PhotoView({
  src,
  alt = "",
  className,
  style,
  variant = "full",
}: {
  src: string;
  alt?: string;
  className?: string;
  style?: React.CSSProperties;
  variant?: "full" | "thumb";
}) {
  const resolved = useResolvedSrc(src, variant);
  if (src.startsWith("scene:")) {
    return (
      <div className={cn("size-full overflow-hidden", className)} style={style}>
        <Scene name={src.slice(6)} />
      </div>
    );
  }
  if (!resolved) return <div className={cn("skeleton size-full", className)} style={style} aria-label={alt || "Loading photo"} />;
  // eslint-disable-next-line @next/next/no-img-element -- signed storage URLs and blob previews
  return <img src={resolved} alt={alt} className={cn("size-full object-cover", className)} style={style} loading="lazy" decoding="async" draggable={false} />;
}

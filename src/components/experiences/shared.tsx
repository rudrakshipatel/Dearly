"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useMemo } from "react";
import { palettes } from "@/lib/data/palettes";
import type { Creation, Photo } from "@/lib/types";
import { cn } from "@/lib/utils";
import { PhotoView } from "../art/scene";
import { useMediaSrc } from "@/lib/hooks";

export interface ExperienceProps {
  creation: Creation;
  /** Called when the opening interaction is complete and the recipient wants to continue. */
  onContinue: () => void;
  compact?: boolean;
  preview?: boolean;
}

export function usePalette(c: Creation) {
  return palettes[c.palette];
}

/** Lightweight DOM confetti — no canvas, respects reduced motion. */
export function Confetti({ colors, count = 70, className }: { colors: string[]; count?: number; className?: string }) {
  const reduce = useReducedMotion();
  const pieces = useMemo(
    () =>
      Array.from({ length: count }).map((_, i) => {
        const seed = (i * 9301 + 49297) % 233280;
        const r = seed / 233280;
        return {
          id: i,
          x: (r * 2 - 1) * 46,
          drift: ((i * 37) % 30) - 15,
          delay: (i % 12) * 0.03,
          rotate: (i * 47) % 360,
          color: colors[i % colors.length],
          w: 6 + (i % 3) * 3,
          h: i % 4 === 0 ? 6 + (i % 3) * 3 : 4,
          round: i % 4 === 0,
          dur: 2.2 + (i % 5) * 0.35,
        };
      }),
    [colors, count],
  );
  if (reduce) return null;
  return (
    <div className={cn("pointer-events-none absolute inset-0 z-30 overflow-hidden", className)} aria-hidden>
      {pieces.map((p) => (
        <motion.span
          key={p.id}
          className="absolute left-1/2 top-[38%]"
          style={{ width: p.w, height: p.h, background: p.color, borderRadius: p.round ? 999 : 2 }}
          initial={{ x: 0, y: 0, opacity: 1, rotate: 0 }}
          animate={{
            x: [`0vw`, `${p.x}vw`, `${p.x + p.drift / 4}vw`],
            y: [0, -180 - (p.id % 7) * 30, 520],
            rotate: p.rotate + 540,
            opacity: [1, 1, 0],
          }}
          transition={{ duration: p.dur, delay: p.delay, ease: [0.15, 0.6, 0.4, 1], times: [0, 0.3, 1] }}
        />
      ))}
    </div>
  );
}

export function StageBackground({ creation, children, className }: { creation: Creation; children: React.ReactNode; className?: string }) {
  const p = usePalette(creation);
  return (
    // overflow-clip (not hidden) so focus changes can't scroll the decorative blobs into view.
    <div className={cn("relative flex size-full flex-col items-center justify-center overflow-clip", className)} style={{ background: p.bg }}>
      <div className="paper-grain pointer-events-none absolute inset-0 opacity-80" />
      <div
        className="pointer-events-none absolute -left-1/4 -top-1/4 size-[70%] rounded-full opacity-50 blur-3xl"
        style={{ background: p.accent2 }}
      />
      <div
        className="pointer-events-none absolute -bottom-1/4 -right-1/4 size-[60%] rounded-full opacity-30 blur-3xl"
        style={{ background: p.accent }}
      />
      <div className="relative z-10 flex size-full flex-col items-center justify-center-safe overflow-y-auto py-6">{children}</div>
    </div>
  );
}

export function ExperienceButton({
  children,
  onClick,
  creation,
  className,
  variant = "solid",
  autoFocus,
}: {
  children: React.ReactNode;
  onClick: () => void;
  creation: Creation;
  className?: string;
  variant?: "solid" | "ghost";
  autoFocus?: boolean;
}) {
  const p = usePalette(creation);
  const dark = creation.palette === "forest-gold" || creation.palette === "midnight-gold";
  return (
    <button
      onClick={onClick}
      autoFocus={autoFocus}
      className={cn(
        "inline-flex h-11 items-center justify-center gap-2 rounded-full px-6 text-sm font-medium transition-transform active:scale-[0.97]",
        className,
      )}
      style={
        variant === "solid"
          ? { background: dark ? p.accent : p.deep, color: dark ? p.ink : p.paper, boxShadow: `0 10px 24px -12px ${p.deep}` }
          : { color: dark ? p.paper : p.deep, border: `1px solid ${dark ? p.paper : p.deep}33` }
      }
    >
      {children}
    </button>
  );
}

export function Kicker({ creation, children, className }: { creation: Creation; children: React.ReactNode; className?: string }) {
  const p = usePalette(creation);
  const dark = creation.palette === "forest-gold" || creation.palette === "midnight-gold";
  return (
    <p className={cn("font-display text-[clamp(24px,5vw,34px)] italic leading-tight", className)} style={{ color: dark ? p.paper : p.ink }}>
      {children}
    </p>
  );
}

export function Polaroid({
  photo,
  className,
  rotate = 0,
  captionClassName,
}: {
  photo: Photo;
  className?: string;
  rotate?: number;
  captionClassName?: string;
}) {
  const src = useMediaSrc(photo.src);
  return (
    <figure
      className={cn("bg-white p-2.5 pb-0 shadow-[0_6px_20px_-8px_rgba(41,37,42,0.35)]", className)}
      style={{ transform: `rotate(${rotate}deg)` }}
    >
      <div className="aspect-square overflow-hidden bg-blush">{src && <PhotoView src={src} alt={photo.caption || "Photo"} />}</div>
      <figcaption className={cn("flex h-10 items-center justify-center px-1 text-center font-hand text-lg leading-none text-ink/80", captionClassName)}>
        {photo.caption}
      </figcaption>
    </figure>
  );
}

export function isDark(c: Creation) {
  return c.palette === "forest-gold" || c.palette === "midnight-gold";
}

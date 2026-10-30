"use client";

import { motion, type Variants } from "framer-motion";
import { CANVAS_H, CANVAS_W } from "@/lib/creation";
import { useMediaSrc } from "@/lib/hooks";
import type { CardElement, CardPage, ElementAnimation, ImageElement } from "@/lib/types";
import { cn, fontClass } from "@/lib/utils";
import { MotifArt } from "../art/motif";
import { PhotoView } from "../art/scene";
import { StickerArt } from "../art/stickers";

const pct = (n: number, of: number) => `${(n / of) * 100}%`;
/** Converts canvas pixels to container-relative units so the card scales with its box. */
export const cq = (px: number) => `${(px / CANVAS_W) * 100}cqw`;

export const patternStyle = (pattern: CardPage["pattern"], color = "rgba(41,37,42,0.07)"): React.CSSProperties => {
  switch (pattern) {
    case "dots":
      return { backgroundImage: `radial-gradient(${color} 1.4px, transparent 1.5px)`, backgroundSize: "4.5cqw 4.5cqw" };
    case "lines":
      return { backgroundImage: `repeating-linear-gradient(to bottom, transparent 0, transparent 6.4cqw, ${color} 6.4cqw, ${color} calc(6.4cqw + 1px))` };
    case "grid":
      return {
        backgroundImage: `linear-gradient(${color} 1px, transparent 1px), linear-gradient(90deg, ${color} 1px, transparent 1px)`,
        backgroundSize: "5cqw 5cqw",
      };
    case "grain":
      return { backgroundImage: `radial-gradient(rgba(113,61,80,0.05) 1px, transparent 1px)`, backgroundSize: "2.4cqw 2.4cqw" };
    default:
      return {};
  }
};

const effects: Record<ImageElement["effect"], string> = {
  none: "none",
  warm: "sepia(0.25) saturate(1.2) hue-rotate(-8deg)",
  mono: "grayscale(1) contrast(1.05)",
  fade: "contrast(0.85) brightness(1.08) saturate(0.8)",
  vivid: "saturate(1.45) contrast(1.08)",
};

const variants: Record<ElementAnimation, Variants> = {
  none: { hidden: {}, show: {} },
  fade: { hidden: { opacity: 0 }, show: { opacity: 1 } },
  rise: { hidden: { opacity: 0, y: 24 }, show: { opacity: 1, y: 0 } },
  pop: { hidden: { opacity: 0, scale: 0.6 }, show: { opacity: 1, scale: 1, transition: { type: "spring", stiffness: 260, damping: 16 } } },
  drift: { hidden: { opacity: 0, x: -30, rotate: -8 }, show: { opacity: 1, x: 0, rotate: 0 } },
  float: { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: [0, -8, 0], transition: { y: { repeat: Infinity, duration: 4, ease: "easeInOut" } } } },
};

export function ImageContent({ el }: { el: ImageElement }) {
  const src = useMediaSrc(el.src) ?? "";
  const inner = (
    <div className="size-full overflow-hidden" style={{ filter: effects[el.effect] }}>
      <div
        className="size-full"
        style={{ transform: `scale(${el.zoom})`, transformOrigin: `${el.focusX}% ${el.focusY}%` }}
      >
        {src && <PhotoView src={src} alt={el.caption || "Photo"} style={{ objectPosition: `${el.focusX}% ${el.focusY}%` }} />}
      </div>
    </div>
  );
  switch (el.frame) {
    case "polaroid":
      return (
        <div className="flex size-full flex-col bg-white shadow-[0_2px_10px_rgba(41,37,42,0.18)]" style={{ padding: `${cq(12)} ${cq(12)} 0` }}>
          <div className="min-h-0 flex-1">{inner}</div>
          <div className="flex items-center justify-center font-hand text-ink/80" style={{ height: cq(52), fontSize: cq(22) }}>
            {el.caption}
          </div>
        </div>
      );
    case "rounded":
      return <div className="size-full overflow-hidden" style={{ borderRadius: cq(22) }}>{inner}</div>;
    case "circle":
      return <div className="size-full overflow-hidden rounded-full">{inner}</div>;
    case "border":
      return <div className="size-full bg-white shadow-sm" style={{ padding: cq(8) }}>{inner}</div>;
    case "arch":
      return <div className="size-full overflow-hidden" style={{ borderRadius: "999px 999px 0 0 / 50% 50% 0 0" }}>{inner}</div>;
    default:
      return inner;
  }
}

export function ElementContent({ el }: { el: CardElement }) {
  switch (el.type) {
    case "text":
      return (
        <div
          className={cn("size-full whitespace-pre-wrap break-words", fontClass[el.font])}
          style={{
            fontSize: cq(el.size),
            color: el.color,
            textAlign: el.align,
            fontWeight: el.weight,
            fontStyle: el.italic ? "italic" : "normal",
            letterSpacing: cq(el.letterSpacing),
            lineHeight: el.lineHeight,
          }}
        >
          {el.text}
        </div>
      );
    case "image":
      return <ImageContent el={el} />;
    case "sticker":
      return <StickerArt sticker={el.sticker} color={el.color} className="size-full" />;
    case "motif":
      return <MotifArt motif={el.motif} palette={el.palette} className="size-full" />;
    case "shape": {
      const base = { background: el.color } as React.CSSProperties;
      if (el.shape === "circle") return <div className="size-full rounded-full" style={base} />;
      if (el.shape === "arch") return <div className="size-full" style={{ ...base, borderRadius: "999px 999px 0 0 / 50% 50% 0 0" }} />;
      if (el.shape === "line") return <div className="absolute inset-x-0 top-1/2 -translate-y-1/2" style={{ ...base, height: Math.max(1, 2) }} />;
      if (el.shape === "tape")
        return (
          <div
            className="size-full"
            style={{
              ...base,
              clipPath: "polygon(2% 0, 98% 4%, 100% 50%, 97% 100%, 3% 96%, 0 50%)",
              backgroundImage: "repeating-linear-gradient(45deg, rgba(255,255,255,.25) 0 6px, transparent 6px 12px)",
            }}
          />
        );
      if (el.w > 500 && el.h > 700) {
        // Full-card frame: draw an outline rather than filling.
        return <div className="size-full rounded-[2px] border-[1.5px]" style={{ borderColor: el.color }} />;
      }
      return <div className="size-full" style={{ ...base, borderRadius: cq(6) }} />;
    }
  }
}

export function elementBox(el: CardElement): React.CSSProperties {
  return {
    position: "absolute",
    left: pct(el.x, CANVAS_W),
    top: pct(el.y, CANVAS_H),
    width: pct(el.w, CANVAS_W),
    height: pct(el.h, CANVAS_H),
    transform: `rotate(${el.rotation}deg)`,
    opacity: el.opacity,
  };
}

/** Read-only rendering of a card page; scales fluidly with its container width. */
export function CardPageView({
  page,
  animate = false,
  className,
  children,
}: {
  page: CardPage;
  animate?: boolean;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className={cn("@container relative aspect-[3/4] w-full overflow-hidden", className)} style={{ background: page.background, containerType: "inline-size" }}>
      <div className="pointer-events-none absolute inset-0" style={patternStyle(page.pattern)} />
      {animate ? (
        <motion.div className="absolute inset-0" initial="hidden" animate="show" transition={{ staggerChildren: 0.12, delayChildren: 0.1 }}>
          {page.elements.map((el) => (
            <div key={el.id} style={elementBox(el)}>
              <motion.div className="size-full" variants={variants[el.animation]} transition={{ duration: 0.6, ease: [0.2, 0.8, 0.2, 1] }}>
                <ElementContent el={el} />
              </motion.div>
            </div>
          ))}
        </motion.div>
      ) : (
        page.elements.map((el) => (
          <div key={el.id} style={elementBox(el)}>
            <ElementContent el={el} />
          </div>
        ))
      )}
      {children}
    </div>
  );
}

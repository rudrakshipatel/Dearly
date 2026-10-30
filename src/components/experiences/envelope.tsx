"use client";

import { motion } from "framer-motion";
import { Flower2, Heart, Star } from "lucide-react";
import type { InteractionSettings } from "@/lib/types";
import { cn } from "@/lib/utils";

/** A reusable illustrated envelope. `open` animates the flap and lifts the letter out. */
export function Envelope({
  color,
  design = "classic",
  seal = "heart",
  sealColor = "#713D50",
  initial = "D",
  open = false,
  letterColor = "#FFFDF9",
  className,
  children,
}: {
  color: string;
  design?: InteractionSettings["envelopeDesign"];
  seal?: InteractionSettings["seal"];
  sealColor?: string;
  initial?: string;
  open?: boolean;
  letterColor?: string;
  className?: string;
  children?: React.ReactNode;
}) {
  const texture =
    design === "linen"
      ? "repeating-linear-gradient(0deg, rgba(255,255,255,.12) 0 1px, transparent 1px 3px), repeating-linear-gradient(90deg, rgba(0,0,0,.035) 0 1px, transparent 1px 3px)"
      : design === "botanical"
        ? "radial-gradient(ellipse 6px 12px at 20% 30%, rgba(255,255,255,.28) 98%, transparent), radial-gradient(ellipse 6px 12px at 70% 70%, rgba(255,255,255,.22) 98%, transparent)"
        : "none";
  const SealIcon = seal === "star" ? Star : seal === "flower" ? Flower2 : Heart;

  return (
    <div className={cn("relative isolate aspect-[3/2] w-full [perspective:1200px]", className)}>
      {/* Back of the envelope */}
      <div className="absolute inset-0 rounded-[6px] shadow-[0_24px_50px_-24px_rgba(41,37,42,0.45)]" style={{ background: color }} />
      {/* Letter */}
      <motion.div
        className="absolute inset-x-[7%] top-[6%] h-[88%] rounded-[3px] shadow-sm"
        style={{ background: letterColor }}
        initial={false}
        animate={open ? { y: "-62%" } : { y: "0%" }}
        transition={{ delay: open ? 0.55 : 0, duration: 0.8, ease: [0.3, 0.7, 0.2, 1] }}
      >
        <div className="flex h-full flex-col gap-[7%] p-[7%]">
          {children ?? (
            <>
              <div className="h-[6%] w-1/2 rounded-full bg-ink/10" />
              <div className="h-[6%] w-5/6 rounded-full bg-ink/10" />
              <div className="h-[6%] w-2/3 rounded-full bg-ink/10" />
            </>
          )}
        </div>
      </motion.div>
      {/* Front pocket: two side folds and a bottom fold */}
      <div
        className="pointer-events-none absolute inset-0 rounded-[6px]"
        style={{ clipPath: "polygon(0 0, 53% 56%, 0 100%)", background: color, filter: "brightness(0.97)", backgroundImage: texture }}
      />
      <div
        className="pointer-events-none absolute inset-0 rounded-[6px]"
        style={{ clipPath: "polygon(100% 0, 47% 56%, 100% 100%)", background: color, filter: "brightness(0.97)", backgroundImage: texture }}
      />
      <div
        className="pointer-events-none absolute inset-0 rounded-[6px]"
        style={{ clipPath: "polygon(0 100%, 50% 46%, 100% 100%)", background: color, filter: "brightness(0.93)", backgroundImage: texture }}
      />
      {design === "airmail" && (
        <div
          className="pointer-events-none absolute inset-0 rounded-[6px] border-[6px] border-transparent"
          style={{ borderImage: "repeating-linear-gradient(135deg, #C8524A 0 10px, #fff 10px 20px, #2F5C8A 20px 30px, #fff 30px 40px) 6" }}
        />
      )}
      {/* Flap */}
      <motion.div
        className="absolute inset-x-0 top-0 h-[58%] origin-top"
        style={{ transformStyle: "preserve-3d" }}
        initial={false}
        animate={{ rotateX: open ? 180 : 0, zIndex: open ? -1 : 20 }}
        transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1], zIndex: { delay: open ? 0.3 : 0 } }}
      >
        <div
          className="absolute inset-0"
          style={{
            clipPath: "polygon(0 0, 100% 0, 50% 100%)",
            background: color,
            filter: "brightness(1.03)",
            backgroundImage: texture,
            backfaceVisibility: "hidden",
          }}
        />
        <div
          className="absolute inset-0"
          style={{ clipPath: "polygon(0 0, 100% 0, 50% 100%)", background: color, filter: "brightness(0.88)", transform: "rotateX(180deg)", backfaceVisibility: "hidden" }}
        />
      </motion.div>
      {/* Wax seal */}
      <motion.div
        className="absolute left-1/2 top-[58%] z-30 grid aspect-square w-[15%] -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full"
        style={{
          background: `radial-gradient(circle at 35% 30%, ${sealColor}cc, ${sealColor} 60%)`,
          boxShadow: `0 3px 0 ${sealColor}88, 0 6px 14px -4px rgba(0,0,0,.45), inset 0 0 0 3px rgba(255,255,255,.12)`,
        }}
        initial={false}
        animate={open ? { scale: 0.4, opacity: 0, y: -10 } : { scale: 1, opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        {seal === "initial" ? (
          <span className="font-script text-[clamp(14px,3.2vw,26px)] text-white/85">{initial.slice(0, 1).toUpperCase()}</span>
        ) : (
          <SealIcon className="size-[45%] text-white/80" fill="currentColor" strokeWidth={1} />
        )}
      </motion.div>
    </div>
  );
}

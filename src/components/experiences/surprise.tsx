"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useState } from "react";
import type { InteractionSettings } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Confetti, ExperienceButton, Kicker, Polaroid, StageBackground, isDark, usePalette, type ExperienceProps } from "./shared";

export function wrapStyle(wrap: InteractionSettings["giftWrap"], color: string): React.CSSProperties {
  switch (wrap) {
    case "stripes":
      return { background: `repeating-linear-gradient(45deg, ${color} 0 14px, color-mix(in srgb, ${color} 78%, white) 14px 28px)` };
    case "dots":
      return { background: color, backgroundImage: "radial-gradient(rgba(255,255,255,.55) 3px, transparent 3.5px)", backgroundSize: "22px 22px" };
    case "kraft":
      return { background: "#C9A27A", backgroundImage: "repeating-linear-gradient(90deg, rgba(0,0,0,.03) 0 2px, transparent 2px 5px)" };
    default:
      return { background: color };
  }
}

export function GiftBox({
  wrap,
  color,
  ribbon,
  opened,
  className,
}: {
  wrap: InteractionSettings["giftWrap"];
  color: string;
  ribbon: string;
  opened: boolean;
  className?: string;
}) {
  return (
    <div className={cn("relative aspect-square w-full", className)}>
      {/* Box */}
      <motion.div
        className="absolute inset-x-[10%] bottom-0 top-[34%] rounded-[6px] shadow-[0_24px_40px_-22px_rgba(41,37,42,0.55)]"
        style={wrapStyle(wrap, color)}
        animate={opened ? { y: 30, opacity: 0.0, scale: 0.9 } : { y: 0, opacity: 1 }}
        transition={{ delay: opened ? 0.9 : 0, duration: 0.6 }}
      >
        <div className="absolute inset-y-0 left-1/2 w-[13%] -translate-x-1/2" style={{ background: ribbon }} />
        <div className="absolute inset-x-0 top-0 h-[10%] bg-black/10" />
      </motion.div>
      {/* Lid */}
      <motion.div
        className="absolute inset-x-[5%] top-[22%] h-[15%] rounded-[6px] shadow-md"
        style={wrapStyle(wrap, color)}
        animate={opened ? { y: -260, x: 80, rotate: 28, opacity: 0 } : { y: 0, x: 0, rotate: 0, opacity: 1 }}
        transition={{ delay: opened ? 0.35 : 0, duration: 0.8, ease: [0.3, 0.6, 0.3, 1] }}
      >
        <div className="absolute inset-y-0 left-1/2 w-[12%] -translate-x-1/2" style={{ background: ribbon }} />
        {/* Bow */}
        <motion.div
          className="absolute -top-[95%] left-1/2 h-[100%] w-[56%] -translate-x-1/2"
          animate={opened ? { scale: 0, opacity: 0 } : { scale: 1, opacity: 1 }}
          transition={{ duration: 0.35 }}
        >
          <div className="absolute bottom-0 left-0 h-full w-1/2 origin-bottom-right -rotate-12 rounded-[60%_10%_10%_60%]" style={{ background: ribbon }} />
          <div className="absolute bottom-0 right-0 h-full w-1/2 origin-bottom-left rotate-12 rounded-[10%_60%_60%_10%]" style={{ background: ribbon }} />
          <div className="absolute bottom-[-8%] left-1/2 size-[26%] -translate-x-1/2 rounded-full" style={{ background: ribbon, filter: "brightness(.85)" }} />
        </motion.div>
      </motion.div>
    </div>
  );
}

export function SurpriseExperience({ creation, onContinue, compact }: ExperienceProps) {
  const p = usePalette(creation);
  const s = creation.interaction;
  const [opened, setOpened] = useState(false);
  const [revealed, setRevealed] = useState(false);

  const open = () => {
    if (opened) return;
    setOpened(true);
    setTimeout(() => setRevealed(true), 1100);
  };

  return (
    <StageBackground creation={creation}>
      {revealed && s.confetti && <Confetti colors={[p.accent, p.accent2, p.deep, "#F2B544", "#FFFFFF"]} />}
      <AnimatePresence mode="wait">
        {!revealed ? (
          <motion.div key="box" className="flex w-full flex-col items-center px-6" exit={{ opacity: 0 }}>
            <p className="eyebrow mb-3" style={{ color: isDark(creation) ? p.accent2 : p.deep }}>
              From {creation.senderName || "someone who cares"}
            </p>
            <Kicker creation={creation} className="mb-6 text-center">
              {creation.recipientName ? `${creation.recipientName}, this is for you.` : "Something is waiting for you."}
            </Kicker>
            <motion.button
              onClick={open}
              aria-label="Unwrap your gift"
              className={cn("w-full", compact ? "max-w-[200px]" : "max-w-[300px]")}
              animate={opened ? {} : { rotate: [0, -3, 3, -2, 0] }}
              transition={opened ? {} : { repeat: Infinity, repeatDelay: 2.2, duration: 0.6 }}
              whileHover={{ scale: 1.03 }}
            >
              <GiftBox wrap={s.giftWrap} color={s.giftColor} ribbon={s.ribbonColor} opened={opened} />
            </motion.button>
            <div className="mt-10 h-11">
              {!opened && (
                <ExperienceButton creation={creation} onClick={open} autoFocus={!compact}>
                  Unwrap your gift
                </ExperienceButton>
              )}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="reveal"
            className="flex w-full flex-col items-center overflow-y-auto px-6 py-8"
            initial={{ opacity: 0, scale: 0.85, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 120, damping: 14 }}
          >
            <div className={cn("w-full rounded-[22px] bg-white/85 text-center shadow-lift backdrop-blur", compact ? "max-w-[280px] p-5" : "max-w-[440px] p-8")}>
              <p className="eyebrow" style={{ color: p.deep }}>
                Surprise!
              </p>
              {creation.photos[0] && (
                <div className={cn("mx-auto mt-4", compact ? "w-32" : "w-48")}>
                  <Polaroid photo={creation.photos[0]} rotate={-3} />
                </div>
              )}
              <p className={cn("mt-5 font-hand leading-snug text-ink", compact ? "text-2xl" : "text-[32px]")}>{s.hiddenMessage}</p>
              <p className="mt-4 text-sm text-muted">— {creation.senderName || "with love"}</p>
            </div>
            <div className="mt-8">
              <ExperienceButton creation={creation} onClick={onContinue}>
                Open your card <ArrowRight className="size-4" />
              </ExperienceButton>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </StageBackground>
  );
}

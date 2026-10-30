"use client";

import { motion } from "framer-motion";
import { Hand } from "lucide-react";
import { useState } from "react";
import { MotifArt } from "../art/motif";
import { Scene } from "../art/scene";
import { Envelope } from "../experiences/envelope";

export function HeroVisual() {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative mx-auto aspect-[1/1] w-full max-w-[560px] select-none">
      {/* Soft backdrop */}
      <div className="absolute inset-[6%] rounded-full bg-blush" />
      <div className="absolute right-[2%] top-[4%] size-[38%] rounded-full bg-lavender/40 blur-2xl" />

      {/* Polaroid left */}
      <motion.figure
        className="absolute left-[2%] top-[10%] w-[32%] bg-white p-[2.2%] pb-0 shadow-paper"
        initial={{ opacity: 0, rotate: -14, y: 30 }}
        animate={{ opacity: 1, rotate: -10, y: 0 }}
        transition={{ delay: 0.2, type: "spring", stiffness: 80, damping: 14 }}
      >
        <div className="aspect-square overflow-hidden">
          <Scene name="picnic" />
        </div>
        <figcaption className="py-[8%] text-center font-hand text-[clamp(14px,2vw,20px)] text-ink/75">June, always</figcaption>
      </motion.figure>

      {/* Polaroid right */}
      <motion.figure
        className="absolute right-[3%] top-[2%] w-[28%] bg-white p-[2.2%] pb-0 shadow-paper"
        initial={{ opacity: 0, rotate: 16, y: 30 }}
        animate={{ opacity: 1, rotate: 9, y: 0 }}
        transition={{ delay: 0.35, type: "spring", stiffness: 80, damping: 14 }}
      >
        <div className="aspect-square overflow-hidden">
          <Scene name="beach" />
        </div>
        <figcaption className="py-[8%] text-center font-hand text-[clamp(13px,1.8vw,18px)] text-ink/75">us, 2024</figcaption>
      </motion.figure>

      {/* Flowers */}
      <motion.div className="absolute bottom-[6%] left-[-2%] w-[30%]" initial={{ opacity: 0, rotate: -30 }} animate={{ opacity: 1, rotate: -18 }} transition={{ delay: 0.5 }}>
        <MotifArt motif="floral" palette="rose-cream" />
      </motion.div>
      <motion.div className="absolute bottom-[2%] right-[0%] w-[24%]" initial={{ opacity: 0, rotate: 20 }} animate={{ opacity: 1, rotate: 12 }} transition={{ delay: 0.6 }}>
        <MotifArt motif="botanical" palette="ivory-sage" />
      </motion.div>

      {/* Envelope */}
      <motion.button
        aria-label={open ? "Close the sample letter" : "Open the sample letter"}
        onClick={() => setOpen((o) => !o)}
        className="absolute left-1/2 top-[52%] w-[64%] -translate-x-1/2 -translate-y-1/2"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0, rotate: open ? 0 : -3 }}
        whileHover={{ rotate: 0, scale: 1.02 }}
        transition={{ type: "spring", stiffness: 100, damping: 16 }}
      >
        <Envelope color="#F3C1BE" sealColor="#713D50" open={open} initial="J">
          <p className="text-left font-hand text-[clamp(13px,2.3vw,22px)] leading-tight text-burgundy">Dear Maya,</p>
          <p className="text-left font-hand text-[clamp(11px,1.9vw,18px)] leading-snug text-ink/80">
            Happy birthday to the person who makes every room brighter…
          </p>
        </Envelope>
      </motion.button>

      {/* Gift tag */}
      <motion.div
        className="absolute bottom-[14%] right-[12%] flex items-center gap-2 rounded-full border border-line bg-paper px-3 py-1.5 shadow-soft"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: [0, -6, 0] }}
        transition={{ opacity: { delay: 0.9 }, y: { repeat: Infinity, duration: 4, ease: "easeInOut" } }}
      >
        <span className="relative flex size-2">
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-rose opacity-60" />
          <span className="relative inline-flex size-2 rounded-full bg-rose" />
        </span>
        <span className="text-[12px] font-medium text-ink">{open ? "Opened just now" : "1 surprise waiting"}</span>
      </motion.div>

      {/* Tap hint */}
      {!open && (
        <motion.div
          className="pointer-events-none absolute left-[22%] top-[70%] flex items-center gap-1.5 rounded-full bg-ink px-3 py-1.5 text-[12px] text-ivory shadow-lg"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1.2 }}
        >
          <Hand className="size-3.5" /> Tap to open
        </motion.div>
      )}
    </div>
  );
}

"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { CardPageView } from "../card/page-view";
import { ExperienceButton, StageBackground, isDark, usePalette, type ExperienceProps } from "./shared";

/** Turns through the designed card pages. Used after every opening interaction and for classic cards. */
export function CardStory({ creation, onContinue, compact, classic }: ExperienceProps & { classic?: boolean }) {
  const p = usePalette(creation);
  const pages = creation.pages;
  const [i, setI] = useState(0);
  const [dir, setDir] = useState(1);
  const [opened, setOpened] = useState(!classic);
  const dark = isDark(creation);

  const go = (d: number) => {
    setDir(d);
    setI((x) => Math.min(pages.length - 1, Math.max(0, x + d)));
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pages.length]);

  if (!pages.length) return null;

  if (!opened) {
    return (
      <StageBackground creation={creation}>
        <motion.button
          aria-label="Open the card"
          onClick={() => setOpened(true)}
          className={cn("w-[68%] [perspective:1600px]", compact ? "max-w-[230px]" : "max-w-[380px]")}
          initial={{ opacity: 0, y: 30, rotate: -2 }}
          animate={{ opacity: 1, y: 0, rotate: -2 }}
          whileHover={{ rotate: 0, scale: 1.02 }}
        >
          <div className="shadow-lift">
            <CardPageView page={pages[0]} />
          </div>
        </motion.button>
        <div className="mt-8">
          <ExperienceButton creation={creation} onClick={() => setOpened(true)} autoFocus={!compact}>
            Open your card
          </ExperienceButton>
        </div>
      </StageBackground>
    );
  }

  const last = i === pages.length - 1;
  return (
    <StageBackground creation={creation}>
      <div className="flex size-full flex-col items-center justify-center py-6">
        <div className={cn("relative w-[78%] [perspective:1600px]", compact ? "max-w-[250px]" : "max-w-[min(440px,58vh)]")}>
          <AnimatePresence initial={false} custom={dir} mode="popLayout">
            <motion.div
              key={pages[i].id}
              className="shadow-lift"
              style={{ transformOrigin: dir > 0 ? "left center" : "right center" }}
              initial={{ rotateY: dir * 70, opacity: 0 }}
              animate={{ rotateY: 0, opacity: 1 }}
              exit={{ rotateY: -dir * 70, opacity: 0 }}
              transition={{ duration: 0.55, ease: [0.4, 0, 0.2, 1] }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.2}
              onDragEnd={(_, info) => {
                if (info.offset.x < -60) go(1);
                else if (info.offset.x > 60) go(-1);
              }}
            >
              <CardPageView page={pages[i]} animate />
            </motion.div>
          </AnimatePresence>
        </div>
        <div className="mt-6 flex items-center gap-4">
          <button aria-label="Previous page" disabled={i === 0} onClick={() => go(-1)} className="grid size-10 place-items-center rounded-full bg-white/80 text-ink shadow-sm disabled:opacity-30">
            <ChevronLeft className="size-5" />
          </button>
          <div className="flex gap-1.5" role="tablist" aria-label="Card pages">
            {pages.map((pg, k) => (
              <button
                key={pg.id}
                role="tab"
                aria-selected={k === i}
                aria-label={`Page ${k + 1}`}
                onClick={() => {
                  setDir(k > i ? 1 : -1);
                  setI(k);
                }}
                className="h-1.5 rounded-full transition-all"
                style={{ width: k === i ? 20 : 6, background: dark ? p.paper : p.deep, opacity: k === i ? 1 : 0.3 }}
              />
            ))}
          </div>
          <button aria-label="Next page" disabled={last} onClick={() => go(1)} className="grid size-10 place-items-center rounded-full bg-white/80 text-ink shadow-sm disabled:opacity-30">
            <ChevronRight className="size-5" />
          </button>
        </div>
        <div className="mt-5 h-11">
          {last && (
            <ExperienceButton creation={creation} onClick={onContinue}>
              {compact ? "Replay" : "Finish"} <ArrowRight className="size-4" />
            </ExperienceButton>
          )}
        </div>
      </div>
    </StageBackground>
  );
}

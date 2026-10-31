"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Users } from "lucide-react";
import { useState } from "react";
import type { Contribution } from "@/lib/types";
import { cn } from "@/lib/utils";
import { PhotoView } from "../art/scene";
import { Confetti, ExperienceButton, Kicker, StageBackground, isDark, usePalette, type ExperienceProps } from "./shared";
import { useMediaSrc } from "@/lib/hooks";

export function ContributionCard({ c, compact, onClick }: { c: Contribution; compact?: boolean; onClick?: () => void }) {
  const photo = useMediaSrc(c.photo);
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn("mb-3 block w-full break-inside-avoid rounded-2xl text-left shadow-[0_4px_14px_-8px_rgba(41,37,42,.35)] transition-transform hover:-translate-y-0.5", compact ? "p-3" : "p-4")}
      style={{ background: c.color }}
    >
      {photo && (
        <div className="mb-3 aspect-[4/3] overflow-hidden rounded-xl">
          {/\.(mp4|webm)$/.test(c.photo ?? "") ? (
            <video src={photo} controls playsInline preload="metadata" className="size-full object-cover" onClick={(e) => e.stopPropagation()} />
          ) : (
            <PhotoView src={photo} alt={`Photo from ${c.name}`} />
          )}
        </div>
      )}
      <p className={cn("font-hand leading-snug text-ink", compact ? "text-base" : "text-[22px]")}>{c.message}</p>
      <p className="mt-2 text-[12px] font-medium uppercase tracking-widest text-ink/60">— {c.name}</p>
    </button>
  );
}

export function TogetherExperience({ creation, onContinue, compact }: ExperienceProps) {
  const p = usePalette(creation);
  // Approved contributions arrive with the card (owner moderation happens before they're public).
  const items: Contribution[] = creation.contributions ?? [];
  const [opened, setOpened] = useState(false);
  const [focus, setFocus] = useState<Contribution | null>(null);
  const dark = isDark(creation);

  const count = items.length + 1;

  return (
    <StageBackground creation={creation}>
      {opened && creation.interaction.confetti && <Confetti colors={[p.accent, p.accent2, p.deep, "#F2B544"]} count={50} />}
      <AnimatePresence mode="wait">
        {!opened ? (
          <motion.div key="stack" className="flex flex-col items-center px-6 text-center" exit={{ opacity: 0, scale: 0.95 }}>
            <div className={cn("relative mb-8", compact ? "h-40 w-48" : "h-56 w-72")}>
              {items.slice(0, 5).map((c, k) => (
                <motion.div
                  key={c.id}
                  className="absolute inset-0 rounded-2xl p-4 shadow-md"
                  style={{ background: c.color }}
                  initial={{ rotate: 0, y: 20, opacity: 0 }}
                  animate={{ rotate: (k - 2) * 6, y: 0, opacity: 1, x: (k - 2) * 8 }}
                  transition={{ delay: k * 0.08 }}
                >
                  <p className="text-left font-hand text-lg leading-tight text-ink/70">{c.message.slice(0, 60)}…</p>
                </motion.div>
              ))}
            </div>
            <p className="eyebrow mb-2 flex items-center gap-1.5" style={{ color: dark ? p.accent2 : p.deep }}>
              <Users className="size-3.5" /> From {count} people who care about you
            </p>
            <Kicker creation={creation}>{creation.message}</Kicker>
            <div className="mt-8">
              <ExperienceButton creation={creation} onClick={() => setOpened(true)} autoFocus={!compact}>
                Open everyone&apos;s messages
              </ExperienceButton>
            </div>
          </motion.div>
        ) : (
          <motion.div key="board" className="size-full overflow-y-auto px-4 py-6 sm:px-8" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="mx-auto max-w-4xl">
              <div className="mb-6 text-center">
                <p className="eyebrow mb-1" style={{ color: dark ? p.accent2 : p.deep }}>
                  For {creation.recipientName}
                </p>
                <Kicker creation={creation}>{creation.message}</Kicker>
              </div>
              <div className={cn("gap-3", compact ? "columns-2" : "columns-2 md:columns-3")}>
                {items.map((c, k) => (
                  <motion.div key={c.id} initial={{ opacity: 0, y: 20, rotate: k % 2 ? 1.5 : -1.5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + k * 0.07 }}>
                    <ContributionCard c={c} compact={compact} onClick={() => setFocus(c)} />
                  </motion.div>
                ))}
              </div>
              <div className="mt-6 flex justify-center pb-4">
                <ExperienceButton creation={creation} onClick={onContinue}>
                  Continue <ArrowRight className="size-4" />
                </ExperienceButton>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {focus && (
          <motion.div
            className="absolute inset-0 z-40 grid place-items-center bg-ink/40 p-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setFocus(null)}
            role="dialog"
            aria-label={`Message from ${focus.name}`}
          >
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="w-full max-w-md" onClick={(e) => e.stopPropagation()}>
              <ContributionCard c={focus} onClick={() => setFocus(null)} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </StageBackground>
  );
}

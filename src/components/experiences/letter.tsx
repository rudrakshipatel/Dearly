"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Bell, Lock } from "lucide-react";
import { useEffect, useState } from "react";
import { useNow } from "@/lib/hooks";
import { cn, fontClass, formatDate } from "@/lib/utils";
import { useToast } from "../ui/toast";
import { Envelope } from "./envelope";
import { ExperienceButton, Kicker, Polaroid, StageBackground, isDark, usePalette, type ExperienceProps } from "./shared";

const letterBg = {
  cream: { background: "#FFFBF4" },
  blush: { background: "#FDF0EE" },
  kraft: { background: "#E9D6BC" },
  lined: {
    background: "#FFFDF8",
    backgroundImage: "repeating-linear-gradient(to bottom, transparent 0 31px, rgba(47,92,138,.16) 31px 32px)",
    backgroundPositionY: "14px",
  },
};

export function LetterExperience({ creation, onContinue, compact, preview }: ExperienceProps) {
  const p = usePalette(creation);
  const s = creation.interaction;
  const [stage, setStage] = useState<"sealed" | "opening" | "letter">("sealed");
  const now = useNow(1000);
  const [peek, setPeek] = useState(false);
  const locked = !!s.unlockAt && now !== null && new Date(s.unlockAt).getTime() > now && !peek;

  useEffect(() => {
    if (stage !== "opening") return;
    const t = setTimeout(() => setStage("letter"), 1500);
    return () => clearTimeout(t);
  }, [stage]);

  if (locked) return <CapsuleLocked creation={creation} now={now!} onPeek={preview ? () => setPeek(true) : undefined} compact={compact} />;

  return (
    <StageBackground creation={creation}>
      <AnimatePresence mode="wait">
        {stage !== "letter" ? (
          <motion.div
            key="env"
            className="flex w-full flex-col items-center px-6"
            exit={{ opacity: 0, y: 40, transition: { duration: 0.4 } }}
          >
            <motion.p
              className="eyebrow mb-3"
              style={{ color: isDark(creation) ? p.accent2 : p.deep }}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
            >
              For {creation.recipientName || "you"}
            </motion.p>
            <Kicker creation={creation} className="mb-8 text-center">
              A little surprise awaits…
            </Kicker>
            <motion.button
              aria-label="Open your letter"
              onClick={() => setStage("opening")}
              className={cn("w-full", compact ? "max-w-[260px]" : "max-w-[380px]")}
              initial={{ opacity: 0, y: 30, rotate: -2 }}
              animate={{ opacity: 1, y: 0, rotate: stage === "opening" ? 0 : -2 }}
              whileHover={{ rotate: 0, scale: 1.02 }}
              transition={{ type: "spring", stiffness: 140, damping: 18 }}
              disabled={stage === "opening"}
            >
              <Envelope
                color={s.envelopeColor}
                design={s.envelopeDesign}
                seal={s.seal}
                sealColor={p.deep}
                initial={creation.senderName || "D"}
                open={stage === "opening"}
                letterColor={letterBg[s.letterBackground].background}
              />
            </motion.button>
            <div className="mt-10 h-11">
              {stage === "sealed" && (
                <ExperienceButton creation={creation} onClick={() => setStage("opening")} autoFocus={!compact}>
                  Open your letter
                </ExperienceButton>
              )}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="letter"
            className="flex size-full flex-col items-center overflow-y-auto px-4 py-8 sm:py-12"
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.2, 0.8, 0.2, 1] }}
          >
            <article
              className={cn("relative w-full max-w-[560px] rounded-[3px] shadow-paper", compact ? "px-5 py-6" : "px-7 py-9 sm:px-12 sm:py-12")}
              style={letterBg[s.letterBackground]}
            >
              <p className={cn(fontClass[s.letterFont], compact ? "text-xl" : "text-3xl")} style={{ color: p.deep }}>
                Dear {creation.recipientName || "you"},
              </p>
              <motion.p
                className={cn("mt-4 whitespace-pre-wrap leading-[1.55] text-ink/90", fontClass[s.letterFont], s.letterFont === "hand" || s.letterFont === "script" ? (compact ? "text-lg" : "text-[26px]") : compact ? "text-sm" : "text-lg")}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4, duration: 1.2 }}
              >
                {creation.message}
              </motion.p>
              <p className={cn("mt-6 text-right", fontClass[s.letterFont], compact ? "text-lg" : "text-[26px]")} style={{ color: p.deep }}>
                With love,
                <br />
                {creation.senderName || "me"}
              </p>
              {creation.photos.length > 0 && (
                <div className={cn("mt-8 flex flex-wrap justify-center gap-4", compact && "gap-2")}>
                  {creation.photos.slice(0, 4).map((ph, i) => (
                    <motion.div
                      key={ph.id}
                      initial={{ opacity: 0, y: 30, rotate: 0 }}
                      animate={{ opacity: 1, y: 0, rotate: i % 2 ? 4 : -4 }}
                      transition={{ delay: 1 + i * 0.25, type: "spring", stiffness: 120, damping: 14 }}
                      className={compact ? "w-[44%]" : "w-[46%] sm:w-[44%]"}
                    >
                      <Polaroid photo={ph} captionClassName={compact ? "text-sm h-7" : undefined} />
                    </motion.div>
                  ))}
                </div>
              )}
            </article>
            <motion.div className="mt-8 pb-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.4 }}>
              <ExperienceButton creation={creation} onClick={onContinue}>
                Continue <ArrowRight className="size-4" />
              </ExperienceButton>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </StageBackground>
  );
}

function CapsuleLocked({ creation, now, onPeek, compact }: { creation: ExperienceProps["creation"]; now: number; onPeek?: () => void; compact?: boolean }) {
  const p = usePalette(creation);
  const toast = useToast();
  const unlock = new Date(creation.interaction.unlockAt!).getTime();
  const diff = Math.max(0, unlock - now);
  const parts = [
    { label: "days", value: Math.floor(diff / 86400000) },
    { label: "hours", value: Math.floor((diff / 3600000) % 24) },
    { label: "minutes", value: Math.floor((diff / 60000) % 60) },
    { label: "seconds", value: Math.floor((diff / 1000) % 60) },
  ];
  const dark = isDark(creation);
  return (
    <StageBackground creation={creation}>
      <div className="flex flex-col items-center px-6 text-center">
        <div className="mb-6 grid size-16 place-items-center rounded-full" style={{ background: p.accent, color: p.ink }}>
          <Lock className="size-7" />
        </div>
        <p className="eyebrow" style={{ color: dark ? p.accent2 : p.deep }}>
          Time capsule from {creation.senderName}
        </p>
        <Kicker creation={creation} className="mt-3 max-w-md">
          Sealed until {formatDate(creation.interaction.unlockAt, { day: "numeric", month: "long", year: "numeric" })}
        </Kicker>
        <div className={cn("mt-8 grid grid-cols-4 gap-2 sm:gap-4", compact && "gap-1.5")}>
          {parts.map((x) => (
            <div key={x.label} className="rounded-2xl px-3 py-3 sm:px-5" style={{ background: dark ? "rgba(255,255,255,.07)" : "rgba(255,255,255,.6)" }}>
              <div className={cn("font-display tabular-nums", compact ? "text-2xl" : "text-4xl")} style={{ color: dark ? p.paper : p.ink }}>
                {String(x.value).padStart(2, "0")}
              </div>
              <div className="text-[11px] uppercase tracking-widest" style={{ color: dark ? p.accent2 : p.deep }}>
                {x.label}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-8 flex flex-wrap justify-center gap-2">
          <ExperienceButton
            creation={creation}
            onClick={() => toast.success({ title: "We'll remind you", description: "You'll get a note the moment this capsule unlocks." })}
          >
            <Bell className="size-4" /> Remind me
          </ExperienceButton>
          {onPeek && (
            <ExperienceButton creation={creation} variant="ghost" onClick={onPeek}>
              Peek (creator preview)
            </ExperienceButton>
          )}
        </div>
      </div>
    </StageBackground>
  );
}

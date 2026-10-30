"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, ChevronLeft, ChevronRight, LayoutList, Images } from "lucide-react";
import { useState } from "react";
import { cn, formatDate } from "@/lib/utils";
import { ExperienceButton, Kicker, Polaroid, StageBackground, isDark, usePalette, type ExperienceProps } from "./shared";

export function MemoriesExperience({ creation, onContinue, compact }: ExperienceProps) {
  const p = usePalette(creation);
  const photos = creation.photos.length
    ? creation.photos
    : [
        { id: "a", src: "scene:sunset", caption: "Add your first memory" },
        { id: "b", src: "scene:meadow", caption: "…and another" },
      ];
  const [opened, setOpened] = useState(false);
  const [i, setI] = useState(0);
  const [dir, setDir] = useState(1);
  const [view, setView] = useState<"book" | "timeline">("book");
  const dark = isDark(creation);
  const go = (d: number) => {
    setDir(d);
    setI((x) => Math.min(photos.length - 1, Math.max(0, x + d)));
  };
  const last = i === photos.length - 1;

  if (!opened) {
    return (
      <StageBackground creation={creation}>
        <motion.button
          onClick={() => setOpened(true)}
          aria-label="Open the scrapbook"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          whileHover={{ rotate: -1, scale: 1.02 }}
          className={cn("relative flex aspect-[4/5] w-[72%] flex-col items-center justify-center rounded-r-[14px] rounded-l-[4px] text-center shadow-lift", compact ? "max-w-[220px]" : "max-w-[340px]")}
          style={{ background: p.deep }}
        >
          <span className="absolute inset-y-0 left-3 w-px bg-white/20" />
          <span className="absolute inset-4 rounded-[6px] border border-white/25" />
          <div className="relative -mt-6 w-[52%]">
            <Polaroid photo={photos[0]} rotate={-5} captionClassName="h-6 text-sm" />
          </div>
          <p className={cn("relative mt-6 px-6 font-display italic leading-tight text-white", compact ? "text-xl" : "text-3xl")}>
            {creation.recipientName ? `${creation.recipientName} & ${creation.senderName || "me"}` : "Our story"}
          </p>
          <p className="relative mt-1 font-hand text-lg text-white/75">a scrapbook</p>
        </motion.button>
        <div className="mt-8">
          <ExperienceButton creation={creation} onClick={() => setOpened(true)} autoFocus={!compact}>
            Open the scrapbook
          </ExperienceButton>
        </div>
      </StageBackground>
    );
  }

  return (
    <StageBackground creation={creation}>
      <div className="flex size-full flex-col items-center overflow-y-auto py-6">
        <div className="mb-4 flex items-center gap-1 rounded-full p-1" style={{ background: dark ? "rgba(255,255,255,.08)" : "rgba(255,255,255,.6)" }}>
          {(
            [
              ["book", Images, "Scrapbook"],
              ["timeline", LayoutList, "Timeline"],
            ] as const
          ).map(([v, Icon, label]) => (
            <button
              key={v}
              onClick={() => setView(v)}
              aria-pressed={view === v}
              className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px]"
              style={view === v ? { background: p.deep, color: p.paper } : { color: dark ? p.paper : p.ink }}
            >
              <Icon className="size-3.5" /> {label}
            </button>
          ))}
        </div>

        {view === "book" ? (
          <>
            <Kicker creation={creation} className="mb-2 px-6 text-center">
              {i === 0 ? creation.message : photos[i].caption}
            </Kicker>
            {photos[i].date && (
              <p className="mb-2 font-hand text-xl" style={{ color: dark ? p.accent : p.deep }}>
                {formatDate(photos[i].date, { month: "long", year: "numeric" })}
              </p>
            )}
            <div className={cn("relative flex w-full items-center justify-center", compact ? "h-[300px]" : "h-[min(60vh,480px)]")}>
              <AnimatePresence custom={dir} initial={false} mode="popLayout">
                <motion.div
                  key={photos[i].id}
                  custom={dir}
                  className={cn("absolute", compact ? "w-[200px]" : "w-[min(74vw,340px)]")}
                  initial={{ opacity: 0, x: dir * 120, rotate: dir * 10 }}
                  animate={{ opacity: 1, x: 0, rotate: i % 2 ? 2.5 : -2.5 }}
                  exit={{ opacity: 0, x: -dir * 160, rotate: -dir * 14 }}
                  transition={{ type: "spring", stiffness: 140, damping: 20 }}
                  drag="x"
                  dragConstraints={{ left: 0, right: 0 }}
                  onDragEnd={(_, info) => {
                    if (info.offset.x < -60) go(1);
                    else if (info.offset.x > 60) go(-1);
                  }}
                >
                  <Polaroid photo={photos[i]} captionClassName={compact ? "h-8 text-base" : "h-12 text-2xl"} />
                  <span className="absolute -top-3 left-1/2 h-6 w-24 -translate-x-1/2 rotate-[-3deg] opacity-80" style={{ background: p.accent2 }} />
                </motion.div>
              </AnimatePresence>
            </div>
            <div className="mt-4 flex items-center gap-4">
              <button aria-label="Previous memory" disabled={i === 0} onClick={() => go(-1)} className="grid size-10 place-items-center rounded-full bg-white/80 text-ink shadow-sm disabled:opacity-30">
                <ChevronLeft className="size-5" />
              </button>
              <span className="text-sm tabular-nums" style={{ color: dark ? p.paper : p.ink }}>
                {i + 1} / {photos.length}
              </span>
              <button aria-label="Next memory" disabled={last} onClick={() => go(1)} className="grid size-10 place-items-center rounded-full bg-white/80 text-ink shadow-sm disabled:opacity-30">
                <ChevronRight className="size-5" />
              </button>
            </div>
          </>
        ) : (
          <ol className={cn("relative w-full px-6", compact ? "max-w-[320px]" : "max-w-[520px]")}>
            <span className="absolute bottom-4 left-[38px] top-4 w-px" style={{ background: dark ? `${p.accent}66` : `${p.deep}33` }} />
            {photos.map((ph, k) => (
              <motion.li key={ph.id} className="relative mb-6 flex gap-4 pl-10" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: k * 0.1 }}>
                <span className="absolute left-[9px] top-3 size-3 rounded-full ring-4" style={{ background: p.deep, ["--tw-ring-color" as string]: p.bg }} />
                <div className="w-24 shrink-0">
                  <Polaroid photo={{ ...ph, caption: "" }} rotate={k % 2 ? 3 : -3} captionClassName="h-3" />
                </div>
                <div className="pt-1">
                  {ph.date && (
                    <p className="text-[12px] uppercase tracking-widest" style={{ color: dark ? p.accent : p.deep }}>
                      {formatDate(ph.date, { month: "short", year: "numeric" })}
                    </p>
                  )}
                  <p className="font-hand text-2xl leading-tight" style={{ color: dark ? p.paper : p.ink }}>
                    {ph.caption}
                  </p>
                </div>
              </motion.li>
            ))}
          </ol>
        )}

        {(last || view === "timeline") && (
          <motion.div className="mt-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <ExperienceButton creation={creation} onClick={onContinue}>
              Continue <ArrowRight className="size-4" />
            </ExperienceButton>
          </motion.div>
        )}
      </div>
    </StageBackground>
  );
}

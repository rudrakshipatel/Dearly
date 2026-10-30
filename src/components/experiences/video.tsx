"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Play } from "lucide-react";
import { useEffect, useState } from "react";
import { useMediaSrc } from "@/lib/hooks";
import { cn } from "@/lib/utils";
import { PhotoView } from "../art/scene";
import { ExperienceButton, Kicker, StageBackground, isDark, usePalette, type ExperienceProps } from "./shared";

export function VideoExperience({ creation, onContinue, compact }: ExperienceProps) {
  const p = usePalette(creation);
  const [playing, setPlaying] = useState(false);
  const video = useMediaSrc(creation.interaction.videoSrc);
  const dark = isDark(creation);
  const frames = creation.photos.length ? creation.photos : [{ id: "f", src: "scene:sunset", caption: creation.message }];
  const [k, setK] = useState(0);
  const [ended, setEnded] = useState(false);

  // Photo-story fallback when no video has been uploaded yet.
  useEffect(() => {
    if (!playing || video) return;
    if (k >= frames.length - 1) {
      const t = setTimeout(() => setEnded(true), 3500);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setK((x) => x + 1), 3500);
    return () => clearTimeout(t);
  }, [playing, video, k, frames.length]);

  return (
    <StageBackground creation={creation}>
      <div className="flex w-full flex-col items-center px-5">
        <p className="eyebrow mb-2" style={{ color: dark ? p.accent2 : p.deep }}>
          A video message from {creation.senderName || "someone"}
        </p>
        <Kicker creation={creation} className="mb-6 text-center">
          {creation.message}
        </Kicker>
        <div className={cn("relative aspect-[4/5] w-full overflow-hidden rounded-[22px] bg-ink shadow-lift sm:aspect-video", compact ? "max-w-[300px] sm:aspect-[4/5]" : "max-w-[720px]")}>
          {video && playing ? (
            <video src={video} className="size-full object-cover" controls autoPlay playsInline onEnded={() => setEnded(true)} />
          ) : playing ? (
            <>
              <AnimatePresence>
                <motion.div key={frames[k].id} className="absolute inset-0" initial={{ opacity: 0, scale: 1.12 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 3.6, ease: "linear" }}>
                  <PhotoView src={frames[k].src} alt={frames[k].caption ?? ""} />
                </motion.div>
              </AnimatePresence>
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-5 pt-16">
                <motion.p key={k} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="text-center font-hand text-2xl text-white">
                  {frames[k].caption}
                </motion.p>
              </div>
              <div className="absolute inset-x-4 top-3 flex gap-1">
                {frames.map((f, i) => (
                  <span key={f.id} className="h-0.5 flex-1 overflow-hidden rounded-full bg-white/30">
                    <motion.span className="block h-full bg-white" initial={{ width: i < k ? "100%" : "0%" }} animate={{ width: i <= k ? "100%" : "0%" }} transition={{ duration: i === k ? 3.5 : 0, ease: "linear" }} />
                  </span>
                ))}
              </div>
            </>
          ) : (
            <button onClick={() => setPlaying(true)} className="group absolute inset-0" aria-label="Play video message">
              <PhotoView src={frames[0].src} alt="" className="opacity-80 transition-opacity group-hover:opacity-95" />
              <span className="absolute left-1/2 top-1/2 grid size-20 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-ink shadow-xl transition-transform group-hover:scale-105">
                <Play className="ml-1 size-8" fill="currentColor" />
              </span>
              {!video && <span className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-black/40 px-3 py-1 text-xs text-white">Photo story · sound off</span>}
            </button>
          )}
        </div>
        <div className="mt-8 h-11">
          {(ended || (playing && !!video)) && (
            <ExperienceButton creation={creation} onClick={onContinue}>
              Continue <ArrowRight className="size-4" />
            </ExperienceButton>
          )}
          {!playing && (
            <ExperienceButton creation={creation} onClick={() => setPlaying(true)} autoFocus={!compact}>
              <Play className="size-4" /> Play message
            </ExperienceButton>
          )}
        </div>
      </div>
    </StageBackground>
  );
}

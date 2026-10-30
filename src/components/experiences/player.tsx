"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import type { Creation } from "@/lib/types";
import { CardStory } from "./card-story";
import { LetterExperience } from "./letter";
import { MemoriesExperience } from "./memories";
import { RevealExperience } from "./reveal";
import { SurpriseExperience } from "./surprise";
import { TogetherExperience } from "./together";
import { VideoExperience } from "./video";
import type { ExperienceProps } from "./shared";

export function OpeningExperience(props: ExperienceProps) {
  switch (props.creation.interaction.mode) {
    case "envelope":
      return <LetterExperience {...props} />;
    case "gift":
      return <SurpriseExperience {...props} />;
    case "scrapbook":
      return <MemoriesExperience {...props} />;
    case "group":
      return <TogetherExperience {...props} />;
    case "video":
      return <VideoExperience {...props} />;
    case "story":
      return <CardStory {...props} classic />;
    default:
      return <RevealExperience {...props} />;
  }
}

/**
 * Plays a creation end to end: the opening interaction, then the designed card pages,
 * then an optional finale (reactions) supplied by the host page.
 */
export function ExperiencePlayer({
  creation,
  compact,
  preview,
  finale,
}: {
  creation: Creation;
  compact?: boolean;
  preview?: boolean;
  finale?: (replay: () => void) => React.ReactNode;
}) {
  const isStory = creation.interaction.mode === "story";
  const [stage, setStage] = useState<"opening" | "card" | "finale">("opening");
  const [run, setRun] = useState(0);
  const replay = () => {
    setStage("opening");
    setRun((r) => r + 1);
  };
  const afterCard = () => (finale ? setStage("finale") : replay());
  const afterOpening = () => (isStory || creation.pages.length === 0 ? afterCard() : setStage("card"));

  return (
    <div className="relative size-full overflow-clip">
      <AnimatePresence mode="wait">
        <motion.div
          key={`${stage}-${run}`}
          className="absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.45 }}
        >
          {stage === "opening" && <OpeningExperience creation={creation} onContinue={afterOpening} compact={compact} preview={preview} />}
          {stage === "card" && <CardStory creation={creation} onContinue={afterCard} compact={compact} preview={preview} />}
          {stage === "finale" && finale?.(replay)}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

"use client";

import { RotateCcw } from "lucide-react";
import { useState } from "react";
import { getSampleCreation } from "@/lib/data/samples";
import { interactionLabels } from "@/lib/data/experiences";
import type { InteractionMode } from "@/lib/types";
import { PhoneFrame } from "../templates/phone-frame";
import { Chip } from "../ui/misc";
import { ExperiencePlayer } from "./player";

const revealSamples: { mode: InteractionMode; slug: string }[] = [
  { mode: "scratch", slug: "scratch-for-ava" },
  { mode: "tap", slug: "reasons-for-lou" },
  { mode: "flip", slug: "starry-note" },
  { mode: "balloon", slug: "pop-for-priya" },
  { mode: "photo-reveal", slug: "photo-for-kai" },
  { mode: "quiz", slug: "quiz-for-noah" },
];

/** A live, playable phone preview of a sample creation. */
export function ExperienceDemo({ slug, variants }: { slug: string; variants?: boolean }) {
  const [active, setActive] = useState(slug);
  const [run, setRun] = useState(0);
  const creation = getSampleCreation(active)!;
  return (
    <div className="flex flex-col items-center">
      {variants && (
        <div className="mb-5 flex max-w-sm flex-wrap justify-center gap-1.5">
          {revealSamples.map((r) => (
            <Chip key={r.slug} active={active === r.slug} onClick={() => setActive(r.slug)}>
              {interactionLabels[r.mode].label}
            </Chip>
          ))}
        </div>
      )}
      <PhoneFrame className="max-w-[300px]">
        <ExperiencePlayer key={`${active}-${run}`} creation={creation} compact preview />
      </PhoneFrame>
      <button onClick={() => setRun((r) => r + 1)} className="mt-4 inline-flex items-center gap-1.5 text-[13px] text-muted hover:text-ink">
        <RotateCcw className="size-3.5" /> Restart preview
      </button>
    </div>
  );
}

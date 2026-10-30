"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Bookmark, BookmarkCheck, Droplets, HandHeart, Heart, RotateCcw, Send, Sparkles } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { getTemplate } from "@/lib/data/templates";
import { reactionService, receivedService } from "@/lib/services";
import type { Creation } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Wordmark } from "../brand/logo";
import { Confetti, ExperienceButton, StageBackground, isDark, usePalette } from "../experiences/shared";
import { useToast } from "../ui/toast";

const reactions = [
  { id: "love", label: "Love it", Icon: Heart },
  { id: "tears", label: "Happy tears", Icon: Droplets },
  { id: "hug", label: "A big hug", Icon: HandHeart },
  { id: "wow", label: "Wow", Icon: Sparkles },
];

export function ReactionPanel({ creation, replay, preview }: { creation: Creation; replay: () => void; preview?: boolean }) {
  const p = usePalette(creation);
  const dark = isDark(creation);
  const toast = useToast();
  const [picked, setPicked] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const t = getTemplate(creation.templateId);

  const send = async () => {
    if (!picked) return;
    setBusy(true);
    try {
      await reactionService.send(creation.slug, picked, note.trim() || undefined);
      setSent(true);
    } catch {
      toast.error("Couldn't send your reaction. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <StageBackground creation={creation}>
      {sent && <Confetti colors={[p.accent, p.accent2, p.deep]} count={40} />}
      <div className="flex w-full max-w-md flex-col items-center px-6 text-center" style={{ color: dark ? p.paper : p.ink }}>
        <AnimatePresence mode="wait">
          {!sent ? (
            <motion.div key="ask" className="w-full" exit={{ opacity: 0, y: -10 }}>
              <Heart className="mx-auto mb-4 size-6" style={{ color: p.accent }} fill="currentColor" />
              <h2 className="font-display text-[clamp(30px,7vw,44px)] leading-[1.05]">Send a little love back to {creation.senderName || "them"}</h2>
              <div className="mt-7 grid grid-cols-4 gap-2" role="radiogroup" aria-label="Choose a reaction">
                {reactions.map((r) => (
                  <button
                    key={r.id}
                    role="radio"
                    aria-checked={picked === r.id}
                    onClick={() => setPicked(r.id)}
                    className={cn("flex flex-col items-center gap-1.5 rounded-2xl border px-1 py-3 text-[12px] transition-all", picked === r.id ? "scale-105 shadow-md" : "opacity-80 hover:opacity-100")}
                    style={{
                      background: picked === r.id ? p.paper : dark ? "rgba(255,255,255,.06)" : "rgba(255,255,255,.55)",
                      borderColor: picked === r.id ? p.deep : "transparent",
                      color: p.ink,
                    }}
                  >
                    <r.Icon className="size-6" style={{ color: p.deep }} aria-hidden />
                    {r.label}
                  </button>
                ))}
              </div>
              <label className="sr-only" htmlFor="reply">
                Add a note
              </label>
              <textarea
                id="reply"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                maxLength={280}
                placeholder="Add a little note (optional)"
                className="mt-4 h-24 w-full resize-none rounded-2xl border-0 bg-white/80 p-4 font-hand text-xl text-ink placeholder:text-ink/40 focus:outline-none focus:ring-2"
                style={{ ["--tw-ring-color" as string]: p.deep }}
              />
              <div className="mt-5 flex flex-col items-center gap-3">
                <ExperienceButton creation={creation} onClick={send} className={cn(!picked && "pointer-events-none opacity-40")}>
                  {busy ? "Sending…" : <><Send className="size-4" /> Send reaction</>}
                </ExperienceButton>
              </div>
            </motion.div>
          ) : (
            <motion.div key="thanks" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
              <h2 className="font-display text-[clamp(32px,8vw,48px)] leading-none">Sent with love.</h2>
              <p className="mt-3 text-[15px] opacity-75">{creation.senderName || "They"} will see your reaction{preview ? " (preview — nothing was really sent)" : ""}.</p>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-8 flex flex-wrap justify-center gap-2">
          <button onClick={replay} className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-[13px]" style={{ background: dark ? "rgba(255,255,255,.08)" : "rgba(255,255,255,.6)" }}>
            <RotateCcw className="size-3.5" /> Replay
          </button>
          {!preview && (
            <button
              onClick={async () => {
                await receivedService.markOpened({ slug: creation.slug, title: t?.headline ?? creation.title, from: creation.senderName, occasion: creation.occasion, palette: creation.palette, motif: t?.motif ?? "envelope" });
                if (!saved) await receivedService.toggleSave(creation.slug);
                setSaved(true);
                toast.success({ title: "Saved to your cards", description: "Find it under Received in My Creations." });
              }}
              className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-[13px]"
              style={{ background: dark ? "rgba(255,255,255,.08)" : "rgba(255,255,255,.6)" }}
            >
              {saved ? <BookmarkCheck className="size-3.5" /> : <Bookmark className="size-3.5" />} {saved ? "Saved" : "Keep this card"}
            </button>
          )}
        </div>

        {creation.showBranding && (
          <Link href="/create" className="mt-12 flex flex-col items-center gap-1 opacity-80 transition-opacity hover:opacity-100">
            <span className="text-[12px]">Made with</span>
            <Wordmark className={cn("text-[26px]", dark && "!text-ivory")} />
            <span className="mt-1 text-[12px] underline underline-offset-4">Make one back →</span>
          </Link>
        )}
      </div>
    </StageBackground>
  );
}

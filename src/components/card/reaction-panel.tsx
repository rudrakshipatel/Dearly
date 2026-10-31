"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Bookmark, BookmarkCheck, Droplets, Flag, HandHeart, Heart, ImagePlus, Loader2, RotateCcw, Send, Sparkles, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useUser } from "@/lib/hooks";
import { publicCardService, receivedService } from "@/lib/services";
import type { Creation } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Wordmark } from "../brand/logo";
import { Confetti, ExperienceButton, StageBackground, isDark, usePalette } from "../experiences/shared";
import { Dialog, DialogContent } from "../ui/dialog";
import { useToast } from "../ui/toast";

const reactions = [
  { id: "love", label: "Love it", Icon: Heart },
  { id: "tears", label: "Happy tears", Icon: Droplets },
  { id: "hug", label: "A big hug", Icon: HandHeart },
  { id: "wow", label: "Wow", Icon: Sparkles },
];

export function ReactionPanel({ creation, replay, preview, onShown }: { creation: Creation; replay: () => void; preview?: boolean; onShown?: () => void }) {
  const p = usePalette(creation);
  const dark = isDark(creation);
  const toast = useToast();
  const [picked, setPicked] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [photo, setPhoto] = useState<{ file: File; preview: string } | null>(null);
  const [reporting, setReporting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const user = useUser();
  const router = useRouter();
  const responsesOn = creation.allowReactions !== false;

  useEffect(() => {
    onShown?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const send = async () => {
    if (!picked) return;
    if (preview) {
      setSent(true);
      return;
    }
    setBusy(true);
    try {
      const photoPath = photo ? await publicCardService.uploadResponsePhoto(creation.slug, photo.file) : undefined;
      await publicCardService.react(creation.slug, picked, note.trim() || undefined, photoPath);
      setSent(true);
    } catch (e) {
      toast.error({ title: "Couldn't send your reaction", description: e instanceof Error ? e.message : undefined });
    } finally {
      setBusy(false);
    }
  };

  return (
    <StageBackground creation={creation}>
      {sent && <Confetti colors={[p.accent, p.accent2, p.deep]} count={40} />}
      <div className="flex w-full max-w-md flex-col items-center px-6 text-center" style={{ color: dark ? p.paper : p.ink }}>
        <AnimatePresence mode="wait">
          {!responsesOn ? (
            <motion.div key="off" className="w-full">
              <Heart className="mx-auto mb-4 size-6" style={{ color: p.accent }} fill="currentColor" />
              <h2 className="font-display text-[clamp(30px,7vw,44px)] leading-[1.05]">Made with love, by {creation.senderName || "someone special"}</h2>
            </motion.div>
          ) : !sent ? (
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
              {creation.allowResponsePhoto && (
                <div className="mt-3 flex items-center justify-center gap-3">
                  {photo ? (
                    <span className="relative">
                      {/* eslint-disable-next-line @next/next/no-img-element -- local preview */}
                      <img src={photo.preview} alt="Your photo" className="size-16 rounded-xl object-cover" />
                      <button aria-label="Remove photo" onClick={() => setPhoto(null)} className="absolute -right-2 -top-2 grid size-6 place-items-center rounded-full bg-ink text-white">
                        <X className="size-3" />
                      </button>
                    </span>
                  ) : (
                    <button onClick={() => fileRef.current?.click()} className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-[13px]" style={{ background: dark ? "rgba(255,255,255,.08)" : "rgba(255,255,255,.6)" }}>
                      <ImagePlus className="size-4" /> Add a photo back
                    </button>
                  )}
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    hidden
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) setPhoto({ file: f, preview: URL.createObjectURL(f) });
                    }}
                  />
                </div>
              )}
              <div className="mt-5 flex flex-col items-center gap-3">
                <ExperienceButton creation={creation} onClick={send} className={cn(!picked && "pointer-events-none opacity-40")}>
                  {busy ? <><Loader2 className="size-4 animate-spin" /> Sending…</> : <><Send className="size-4" /> Send reaction</>}
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
                if (!user) {
                  toast.info({ title: "Sign in to keep this card", description: "It'll wait for you under Received.", action: { label: "Sign in", onClick: () => router.push(`/sign-in?next=${encodeURIComponent(`/card/${creation.slug}`)}`) } });
                  return;
                }
                try {
                  await receivedService.setSaved(creation.slug, !saved);
                  setSaved(!saved);
                  if (!saved) toast.success({ title: "Saved to your cards", description: "Find it under Received in My Creations." });
                } catch (e) {
                  toast.error(e instanceof Error ? e.message : "Couldn't save the card.");
                }
              }}
              className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-[13px]"
              style={{ background: dark ? "rgba(255,255,255,.08)" : "rgba(255,255,255,.6)" }}
            >
              {saved ? <BookmarkCheck className="size-3.5" /> : <Bookmark className="size-3.5" />} {saved ? "Saved" : "Keep this card"}
            </button>
          )}
        </div>

        {!preview && (
          <button onClick={() => setReporting(true)} className="mt-6 inline-flex items-center gap-1 text-[12px] opacity-60 hover:opacity-100">
            <Flag className="size-3" /> Report this card
          </button>
        )}
        <ReportDialog slug={creation.slug} open={reporting} onOpenChange={setReporting} />

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

const reasons = [
  ["harassment", "Harassment or bullying"],
  ["hate", "Hate speech"],
  ["sexual", "Sexual content"],
  ["violence", "Violence or threats"],
  ["spam", "Spam or scam"],
  ["impersonation", "Impersonation"],
  ["other", "Something else"],
] as const;

function ReportDialog({ slug, open, onOpenChange }: { slug: string; open: boolean; onOpenChange: (v: boolean) => void }) {
  const [reason, setReason] = useState<string>("harassment");
  const [details, setDetails] = useState("");
  const [busy, setBusy] = useState(false);
  const toast = useToast();
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent title="Report this card" description="Our team reviews every report. The sender isn't told who reported it." size="sm">
        <fieldset className="space-y-2">
          <legend className="sr-only">Reason</legend>
          {reasons.map(([v, l]) => (
            <label key={v} className="flex items-center gap-2.5 text-[14px]">
              <input type="radio" name="reason" value={v} checked={reason === v} onChange={() => setReason(v)} className="accent-burgundy" /> {l}
            </label>
          ))}
        </fieldset>
        <textarea value={details} onChange={(e) => setDetails(e.target.value)} maxLength={1000} placeholder="Anything else we should know? (optional)" className="mt-4 h-24 w-full rounded-xl border border-line p-3 text-[14px]" />
        <button
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            try {
              await publicCardService.report(slug, reason, details.trim() || undefined);
              toast.success("Thanks — we'll take a look.");
              onOpenChange(false);
            } catch (e) {
              toast.error(e instanceof Error ? e.message : "Couldn't send the report.");
            } finally {
              setBusy(false);
            }
          }}
          className="mt-4 h-11 w-full rounded-full bg-ink text-[14px] text-ivory disabled:opacity-50"
        >
          {busy ? "Sending…" : "Send report"}
        </button>
      </DialogContent>
    </Dialog>
  );
}

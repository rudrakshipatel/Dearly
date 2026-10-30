"use client";

import { motion } from "framer-motion";
import { ArrowLeft, Clock, MailQuestion, Volume2, VolumeX } from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { sampleSlugs } from "@/lib/data/samples";
import { getTemplate } from "@/lib/data/templates";
import { useNow } from "@/lib/hooks";
import { useAmbientSound } from "@/lib/hooks/use-ambient-sound";
import { creationService, receivedService } from "@/lib/services";
import type { Creation } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { Wordmark } from "../brand/logo";
import { Envelope } from "../experiences/envelope";
import { ExperiencePlayer } from "../experiences/player";
import { StageBackground, isDark, usePalette } from "../experiences/shared";
import { Button } from "../ui/button";

export function RecipientView({ slug }: { slug: string }) {
  const params = useSearchParams();
  const preview = params.get("preview") === "1";
  const [state, setState] = useState<{ status: "loading" } | { status: "missing" } | { status: "ready"; creation: Creation }>({ status: "loading" });

  useEffect(() => {
    let alive = true;
    creationService.getBySlug(slug).then((c) => {
      if (!alive) return;
      setState(c ? { status: "ready", creation: c } : { status: "missing" });
    });
    return () => {
      alive = false;
    };
  }, [slug]);

  useEffect(() => {
    if (state.status !== "ready" || preview) return;
    const c = state.creation;
    const t = getTemplate(c.templateId);
    receivedService.markOpened({ slug: c.slug, title: t?.headline ?? c.title, from: c.senderName, occasion: c.occasion, palette: c.palette, motif: t?.motif ?? "envelope" }).catch(() => {});
  }, [state, preview]);

  if (state.status === "loading") return <CardLoading label="Opening your surprise…" />;
  if (state.status === "missing") return <CardMissing />;
  return <Ready creation={state.creation} preview={preview} />;
}

function Ready({ creation, preview }: { creation: Creation; preview: boolean }) {
  const sound = useAmbientSound(creation.interaction.sound, creation.interaction.audioSrc);
  const now = useNow(30_000);
  const p = usePalette(creation);
  const dark = isDark(creation);
  const scheduledLock = !preview && creation.status === "scheduled" && creation.scheduledFor && now !== null && new Date(creation.scheduledFor).getTime() > now;

  return (
    <div className="fixed inset-0 overflow-hidden" style={{ background: p.bg }}>
      {preview && (
        <div className="absolute inset-x-0 top-0 z-50 flex items-center justify-center gap-3 bg-ink/85 px-4 py-2 text-[12.5px] text-ivory backdrop-blur">
          <span>Preview — this is exactly what they&apos;ll see.</span>
          {!sampleSlugs.includes(creation.slug) && (
            <Link href={`/editor/${creation.id}`} className="inline-flex items-center gap-1 underline underline-offset-4">
              <ArrowLeft className="size-3" /> Back to editing
            </Link>
          )}
        </div>
      )}
      {sound.available && (
        <button
          onClick={sound.toggle}
          aria-pressed={sound.playing}
          aria-label={sound.playing ? "Turn sound off" : "Turn sound on"}
          className="absolute right-4 z-40 flex items-center gap-1.5 rounded-full px-3 py-2 text-[12px] shadow-sm backdrop-blur"
          style={{ top: preview ? 48 : 16, background: dark ? "rgba(255,255,255,.12)" : "rgba(255,255,255,.7)", color: dark ? p.paper : p.ink }}
        >
          {sound.playing ? <Volume2 className="size-4" /> : <VolumeX className="size-4" />}
          {sound.playing ? "Sound on" : "Play sound"}
        </button>
      )}
      <div className="absolute inset-0" style={{ top: preview ? 36 : 0 }}>
        {scheduledLock ? (
          <StageBackground creation={creation}>
            <div className="px-6 text-center" style={{ color: dark ? p.paper : p.ink }}>
              <Clock className="mx-auto mb-4 size-7" style={{ color: p.accent }} />
              <p className="eyebrow mb-2" style={{ color: dark ? p.accent2 : p.deep }}>
                Something is on its way
              </p>
              <h1 className="font-display text-[clamp(32px,7vw,52px)] leading-none">
                Arrives {formatDate(creation.scheduledFor, { weekday: "long", day: "numeric", month: "long" })}
              </h1>
              <p className="mt-3 opacity-75">From {creation.senderName}. Come back then — it&apos;ll be worth it.</p>
            </div>
          </StageBackground>
        ) : (
          <ExperiencePlayer creation={creation} preview={preview} finale={(replay) => <ReactionPanelLazy creation={creation} replay={replay} preview={preview} />} />
        )}
      </div>
    </div>
  );
}

// Keeps the reaction panel out of the first paint.
const ReactionPanelLazy = dynamic(() => import("./reaction-panel").then((m) => m.ReactionPanel), { ssr: false });

export function CardLoading({ label = "Preparing your surprise…" }: { label?: string }) {
  return (
    <div className="fixed inset-0 grid place-items-center bg-blush" aria-busy="true">
      <div className="flex flex-col items-center">
        <motion.div className="w-48" animate={{ y: [0, -8, 0], rotate: [-2, 1, -2] }} transition={{ repeat: Infinity, duration: 2.4, ease: "easeInOut" }}>
          <Envelope color="#F3C1BE" sealColor="#713D50" />
        </motion.div>
        <p className="mt-8 font-display text-2xl italic text-ink/80">{label}</p>
      </div>
    </div>
  );
}

function CardMissing() {
  return (
    <div className="fixed inset-0 grid place-items-center bg-ivory px-6">
      <div className="max-w-md text-center">
        <MailQuestion className="mx-auto mb-5 size-8 text-muted" />
        <h1 className="font-display text-4xl leading-tight">This card couldn&apos;t be found</h1>
        <p className="mt-3 text-[15px] leading-relaxed text-muted">
          The link may be incomplete, or the sender may have removed it. If someone sent this to you, ask them to share the link again.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-2 sm:flex-row">
          <Button asChild>
            <Link href="/">Visit Dearly</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/create">Make your own</Link>
          </Button>
        </div>
        <Wordmark className="mt-12 block text-2xl opacity-60" />
      </div>
    </div>
  );
}

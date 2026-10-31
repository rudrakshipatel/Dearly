"use client";

import { motion } from "framer-motion";
import { ArrowLeft, Clock, Lock, MailQuestion, Volume2, VolumeX } from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { track } from "@/lib/analytics";
import { palettes } from "@/lib/data/palettes";
import { useNow, useUser } from "@/lib/hooks";
import { useAmbientSound } from "@/lib/hooks/use-ambient-sound";
import { MediaScopeProvider } from "@/lib/media/resolver";
import { ApiClientError, creationService, publicCardService, receivedService } from "@/lib/services";
import type { Creation } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { Wordmark } from "../brand/logo";
import { Envelope } from "../experiences/envelope";
import { ExperiencePlayer } from "../experiences/player";
import { isDark, usePalette } from "../experiences/shared";
import { Button } from "../ui/button";

type LoadState =
  | { status: "loading" }
  | { status: "missing" }
  | { status: "error"; message: string }
  | { status: "scheduled"; scheduledAt: string; senderName: string; palette: Creation["palette"] }
  | { status: "locked"; senderName: string; palette: Creation["palette"]; wrongPassword: boolean }
  | { status: "ready"; creation: Creation; ownerPreview: boolean };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

export function RecipientView({ slug }: { slug: string }) {
  const params = useSearchParams();
  const previewParam = params.get("preview");
  // `?preview=<card id>` lets the owner preview drafts; `?preview=1` previews a live card without counting a view.
  const ownerPreviewId = previewParam && UUID.test(previewParam) ? previewParam : null;
  const preview = !!previewParam;
  const [state, setState] = useState<LoadState>({ status: "loading" });
  const [password, setPassword] = useState<string | undefined>();

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        if (ownerPreviewId) {
          const c = await creationService.get(ownerPreviewId);
          if (alive) setState({ status: "ready", creation: c, ownerPreview: true });
          return;
        }
        const r = await publicCardService.get(slug, password);
        if (!alive) return;
        if (r.state === "open") setState({ status: "ready", creation: r.card, ownerPreview: false });
        else if (r.state === "missing") setState({ status: "missing" });
        else setState(r.state === "scheduled" ? { status: "scheduled", scheduledAt: r.scheduledAt, senderName: r.senderName, palette: r.palette } : { status: "locked", senderName: r.senderName, palette: r.palette, wrongPassword: r.wrongPassword });
      } catch (e) {
        if (alive) setState(e instanceof ApiClientError && (e.status === 404 || e.status === 401) ? { status: "missing" } : { status: "error", message: e instanceof Error ? e.message : "Couldn't load this card." });
      }
    })();
    return () => {
      alive = false;
    };
  }, [slug, password, ownerPreviewId]);

  if (state.status === "loading") return <CardLoading label="Opening your surprise…" />;
  if (state.status === "missing") return <CardMissing />;
  if (state.status === "error") return <CardMissing title="We couldn't open this card" body={state.message} />;
  if (state.status === "scheduled") return <Waiting {...state} />;
  if (state.status === "locked") return <Locked {...state} onSubmit={setPassword} />;
  return (
    <MediaScopeProvider slug={state.ownerPreview ? undefined : slug}>
      <Ready creation={state.creation} preview={preview} ownerPreview={state.ownerPreview} />
    </MediaScopeProvider>
  );
}

function Ready({ creation, preview, ownerPreview }: { creation: Creation; preview: boolean; ownerPreview: boolean }) {
  const sound = useAmbientSound(creation.interaction.sound, creation.interaction.audioSrc);
  const p = usePalette(creation);
  const dark = isDark(creation);
  const viewId = useRef<string | null>(null);
  const user = useUser();
  const signedIn = !!user;

  useEffect(() => {
    if (!preview && signedIn) receivedService.markOpened(creation.slug).catch(() => {});
  }, [creation.slug, preview, signedIn]);

  // Count the open (not for previews).
  useEffect(() => {
    if (preview) return;
    publicCardService.recordView(creation.slug).then((id) => (viewId.current = id)).catch(() => {});
    track("recipient_opened", { experience: creation.experience, mode: creation.interaction.mode });
  }, [creation.slug, creation.experience, creation.interaction.mode, preview]);

  const onCompleted = () => {
    if (preview) return;
    track("interaction_completed", { experience: creation.experience, mode: creation.interaction.mode });
    if (viewId.current) publicCardService.completeView(viewId.current, { mode: creation.interaction.mode, completed: true }).catch(() => {});
  };

  return (
    <div className="fixed inset-0 overflow-hidden" style={{ background: p.bg }}>
      {preview && (
        <div className="absolute inset-x-0 top-0 z-50 flex items-center justify-center gap-3 bg-ink/85 px-4 py-2 text-[12.5px] text-ivory backdrop-blur">
          <span>Preview — this is exactly what they&apos;ll see.{ownerPreview && creation.status !== "published" ? " (Not published yet.)" : ""}</span>
          {ownerPreview && (
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
        <ExperiencePlayer
          creation={creation}
          preview={preview}
          finale={(replay) => <ReactionPanelLazy creation={creation} replay={replay} preview={preview} onShown={onCompleted} />}
        />
      </div>
    </div>
  );
}

function Waiting({ scheduledAt, senderName, palette }: { scheduledAt: string; senderName: string; palette: Creation["palette"] }) {
  const p = palettes[palette] ?? palettes["rose-cream"];
  const now = useNow(1000);
  const ms = now === null ? 0 : Math.max(0, new Date(scheduledAt).getTime() - now);
  useEffect(() => {
    if (now !== null && ms === 0) window.location.reload();
  }, [ms, now]);
  return (
    <div className="fixed inset-0 grid place-items-center px-6 text-center" style={{ background: p.bg, color: p.ink }}>
      <div>
        <Clock className="mx-auto mb-4 size-7" style={{ color: p.accent }} />
        <p className="eyebrow mb-2" style={{ color: p.deep }}>
          Something is on its way from {senderName || "someone special"}
        </p>
        <h1 className="font-display text-[clamp(32px,7vw,52px)] leading-none">
          Arrives {formatDate(scheduledAt, { weekday: "long", day: "numeric", month: "long", hour: "numeric", minute: "2-digit" })}
        </h1>
        {now !== null && ms > 0 && ms < 86400000 && (
          <p className="mt-4 font-display text-3xl tabular-nums">
            {String(Math.floor(ms / 3600000)).padStart(2, "0")}:{String(Math.floor((ms / 60000) % 60)).padStart(2, "0")}:{String(Math.floor((ms / 1000) % 60)).padStart(2, "0")}
          </p>
        )}
        <p className="mt-3 opacity-75">Come back then — it&apos;ll be worth it.</p>
      </div>
    </div>
  );
}

function Locked({ senderName, palette, wrongPassword, onSubmit }: { senderName: string; palette: Creation["palette"]; wrongPassword: boolean; onSubmit: (pw: string) => void }) {
  const p = palettes[palette] ?? palettes["rose-cream"];
  const [value, setValue] = useState("");
  return (
    <div className="fixed inset-0 grid place-items-center px-6" style={{ background: p.bg, color: p.ink }}>
      <form
        className="w-full max-w-sm text-center"
        onSubmit={(e) => {
          e.preventDefault();
          if (value.trim()) onSubmit(value);
        }}
      >
        <Lock className="mx-auto mb-4 size-7" style={{ color: p.deep }} />
        <h1 className="font-display text-4xl leading-tight">A private card from {senderName || "someone special"}</h1>
        <p className="mt-2 text-[15px] opacity-75">Enter the password they shared with you.</p>
        <label htmlFor="card-password" className="sr-only">
          Password
        </label>
        <input
          id="card-password"
          type="password"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          autoFocus
          className="mt-6 h-12 w-full rounded-full border border-ink/15 bg-white/80 px-5 text-center text-[16px] focus:outline-none focus:ring-2"
          aria-invalid={wrongPassword}
        />
        {wrongPassword && (
          <p role="alert" className="mt-2 text-[14px] text-rose-deep">
            That password isn&apos;t right.
          </p>
        )}
        <Button type="submit" className="mt-4 w-full" size="lg">
          Open
        </Button>
      </form>
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

function CardMissing({ title = "This card couldn't be found", body }: { title?: string; body?: string }) {
  return (
    <div className="fixed inset-0 grid place-items-center bg-ivory px-6">
      <div className="max-w-md text-center">
        <MailQuestion className="mx-auto mb-5 size-8 text-muted" />
        <h1 className="font-display text-4xl leading-tight">{title}</h1>
        <p className="mt-3 text-[15px] leading-relaxed text-muted">
          {body ?? "The link may be incomplete, or the sender may have removed it. If someone sent this to you, ask them to share the link again."}
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

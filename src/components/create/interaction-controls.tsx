"use client";

import { Film, Loader2, Music, Plus, Trash2, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { createExperienceOptions, interactionLabels } from "@/lib/data/experiences";
import { swatches } from "@/lib/data/palettes";
import { uploadService } from "@/lib/services";
import type { ExperienceKind, FontKey, InteractionMode, InteractionSettings } from "@/lib/types";
import { cn, fontClass, fontLabel } from "@/lib/utils";
import { Button } from "../ui/button";
import { Input, Label, Switch, Textarea } from "../ui/form";
import { useToast } from "../ui/toast";

type S = InteractionSettings;

export function ColorRow({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <Label>{label}</Label>
      <div className="flex flex-wrap items-center gap-1.5">
        {swatches.map((c) => (
          <button
            key={c}
            type="button"
            aria-label={`${label}: ${c}`}
            aria-pressed={value.toLowerCase() === c.toLowerCase()}
            onClick={() => onChange(c)}
            className={cn("size-7 rounded-full border border-ink/10 transition-transform hover:scale-110", value.toLowerCase() === c.toLowerCase() && "ring-2 ring-burgundy ring-offset-2 ring-offset-paper")}
            style={{ background: c }}
          />
        ))}
        <label className="relative grid size-7 cursor-pointer place-items-center overflow-hidden rounded-full border border-dashed border-ink/30 text-muted" title="Custom colour">
          <Plus className="size-3.5" />
          <input type="color" value={value} onChange={(e) => onChange(e.target.value)} className="absolute inset-0 cursor-pointer opacity-0" aria-label={`${label}: custom`} />
        </label>
      </div>
    </div>
  );
}

function Segmented<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: { value: T; label: string }[]; onChange: (v: T) => void }) {
  return (
    <div>
      <Label>{label}</Label>
      <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label={label}>
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={value === o.value}
            onClick={() => onChange(o.value)}
            className={cn("rounded-full border px-3.5 py-1.5 text-[13px] transition-colors", value === o.value ? "border-ink bg-ink text-ivory" : "border-line bg-paper hover:border-ink/30")}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function InteractionControls({
  experience,
  settings,
  onChange,
  cardId,
}: {
  experience: ExperienceKind;
  settings: S;
  onChange: (patch: Partial<S>) => void;
  cardId?: string | null;
}) {
  const toast = useToast();
  const videoInput = useRef<HTMLInputElement>(null);
  const audioInput = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState<"video" | "audio" | null>(null);
  const modes = createExperienceOptions.find((o) => o.kind === experience)?.modes ?? ["gift"];
  const m = settings.mode;
  const hasHidden = ["gift", "scratch", "tap", "flip", "balloon", "photo-reveal", "quiz"].includes(m);

  const uploadMedia = async (file: File, kind: "video" | "audio") => {
    setUploading(kind);
    try {
      const { src } = await uploadService.upload(file, { cardId });
      onChange(kind === "video" ? { videoSrc: src } : { audioSrc: src, sound: "custom" });
      toast.success(kind === "video" ? "Video added." : "Audio added.");
    } catch (e) {
      toast.error({ title: "Upload failed", description: e instanceof Error ? e.message : undefined });
    } finally {
      setUploading(null);
    }
  };

  return (
    <div className="space-y-7">
      {modes.length > 1 && (
        <div>
          <Label>How should it open?</Label>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {modes.map((mode: InteractionMode) => (
              <button
                key={mode}
                type="button"
                aria-pressed={m === mode}
                onClick={() => onChange({ mode })}
                className={cn("rounded-2xl border p-3 text-left transition-colors", m === mode ? "border-burgundy bg-blush/60" : "border-line bg-paper hover:border-ink/30")}
              >
                <span className="block text-[14px] font-medium text-ink">{interactionLabels[mode].label}</span>
                <span className="block text-[12px] leading-snug text-muted">{interactionLabels[mode].hint}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {m === "envelope" && (
        <fieldset className="grid gap-5 rounded-2xl border border-line bg-paper p-5 sm:grid-cols-2">
          <legend className="px-1 text-[13px] font-medium text-ink">Envelope & letter</legend>
          <ColorRow label="Envelope colour" value={settings.envelopeColor} onChange={(envelopeColor) => onChange({ envelopeColor })} />
          <Segmented
            label="Envelope design"
            value={settings.envelopeDesign}
            onChange={(envelopeDesign) => onChange({ envelopeDesign })}
            options={[
              { value: "classic", label: "Classic" },
              { value: "airmail", label: "Airmail" },
              { value: "linen", label: "Linen" },
              { value: "botanical", label: "Botanical" },
            ]}
          />
          <Segmented
            label="Wax seal"
            value={settings.seal}
            onChange={(seal) => onChange({ seal })}
            options={[
              { value: "heart", label: "Heart" },
              { value: "initial", label: "Initial" },
              { value: "star", label: "Star" },
              { value: "flower", label: "Flower" },
            ]}
          />
          <Segmented
            label="Letter paper"
            value={settings.letterBackground}
            onChange={(letterBackground) => onChange({ letterBackground })}
            options={[
              { value: "cream", label: "Cream" },
              { value: "lined", label: "Lined" },
              { value: "blush", label: "Blush" },
              { value: "kraft", label: "Kraft" },
            ]}
          />
          <div className="sm:col-span-2">
            <Label>Handwriting</Label>
            <div className="flex flex-wrap gap-1.5">
              {(["hand", "script", "display", "sans"] as FontKey[]).map((f) => (
                <button
                  key={f}
                  type="button"
                  aria-pressed={settings.letterFont === f}
                  onClick={() => onChange({ letterFont: f })}
                  className={cn("rounded-xl border px-3.5 py-2 text-lg", fontClass[f], settings.letterFont === f ? "border-ink bg-ink text-ivory" : "border-line bg-paper")}
                >
                  {fontLabel[f]}
                </button>
              ))}
            </div>
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="unlock">Time capsule (optional)</Label>
            <Input id="unlock" type="datetime-local" value={settings.unlockAt?.slice(0, 16) ?? ""} onChange={(e) => onChange({ unlockAt: e.target.value ? new Date(e.target.value).toISOString() : undefined })} className="sm:w-72" />
            <p className="mt-1.5 text-[12.5px] text-muted">Keep the letter sealed until this date. They&apos;ll see a countdown until then.</p>
          </div>
        </fieldset>
      )}

      {m === "gift" && (
        <fieldset className="grid gap-5 rounded-2xl border border-line bg-paper p-5 sm:grid-cols-2">
          <legend className="px-1 text-[13px] font-medium text-ink">Gift wrapping</legend>
          <Segmented
            label="Wrapping paper"
            value={settings.giftWrap}
            onChange={(giftWrap) => onChange({ giftWrap })}
            options={[
              { value: "stripes", label: "Stripes" },
              { value: "dots", label: "Polka dots" },
              { value: "solid", label: "Solid" },
              { value: "kraft", label: "Kraft" },
            ]}
          />
          <ColorRow label="Box colour" value={settings.giftColor} onChange={(giftColor) => onChange({ giftColor })} />
          <ColorRow label="Ribbon colour" value={settings.ribbonColor} onChange={(ribbonColor) => onChange({ ribbonColor })} />
        </fieldset>
      )}

      {hasHidden && (
        <div>
          <Label htmlFor="hidden">{m === "tap" ? "Hidden reasons (separate with |)" : "The hidden surprise"}</Label>
          <Textarea
            id="hidden"
            value={settings.hiddenMessage}
            onChange={(e) => onChange({ hiddenMessage: e.target.value })}
            maxLength={400}
            className="min-h-20 font-hand text-xl"
            placeholder="Dinner is booked. Friday, 8pm."
          />
          <p className="mt-1.5 text-[12.5px] text-muted">
            {m === "tap" ? "Each reason becomes a tile. One line on its own reveals under six tiles." : "Revealed only after they open, scratch, pop or answer."}
          </p>
        </div>
      )}

      {m === "quiz" && (
        <fieldset className="space-y-4 rounded-2xl border border-line bg-paper p-5">
          <legend className="px-1 text-[13px] font-medium text-ink">Quiz</legend>
          <div>
            <Label htmlFor="quiz-q">Question</Label>
            <Input id="quiz-q" value={settings.quizQuestion ?? ""} onChange={(e) => onChange({ quizQuestion: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Answers — tick the right one</Label>
            {(settings.quizOptions ?? []).map((o, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  type="radio"
                  name="quiz-answer"
                  aria-label={`Answer ${i + 1} is correct`}
                  checked={settings.quizAnswer === i}
                  onChange={() => onChange({ quizAnswer: i })}
                  className="size-4 accent-burgundy"
                />
                <Input
                  aria-label={`Answer ${i + 1}`}
                  value={o}
                  onChange={(e) => onChange({ quizOptions: settings.quizOptions!.map((x, k) => (k === i ? e.target.value : x)) })}
                  className="h-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Remove answer ${i + 1}`}
                  disabled={(settings.quizOptions?.length ?? 0) <= 2}
                  onClick={() =>
                    onChange({
                      quizOptions: settings.quizOptions!.filter((_, k) => k !== i),
                      quizAnswer: settings.quizAnswer === i ? 0 : (settings.quizAnswer ?? 0) > i ? (settings.quizAnswer ?? 0) - 1 : settings.quizAnswer,
                    })
                  }
                >
                  <Trash2 />
                </Button>
              </div>
            ))}
            {(settings.quizOptions?.length ?? 0) < 5 && (
              <Button type="button" variant="outline" size="sm" onClick={() => onChange({ quizOptions: [...(settings.quizOptions ?? []), ""] })}>
                <Plus /> Add answer
              </Button>
            )}
          </div>
        </fieldset>
      )}

      {experience === "video" && (
        <fieldset className="rounded-2xl border border-line bg-paper p-5">
          <legend className="px-1 text-[13px] font-medium text-ink">Your video</legend>
          <p className="text-[14px] text-muted">
            {settings.videoSrc ? "Video added. It plays when they press play." : "Record on your phone or upload a clip (up to 80 MB). Without a video, your photos play as a story."}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={() => videoInput.current?.click()} loading={uploading === "video"}>
              {uploading !== "video" && <Film />} {settings.videoSrc ? "Replace video" : "Record or upload"}
            </Button>
            {settings.videoSrc && (
              <Button type="button" variant="ghost" onClick={() => onChange({ videoSrc: undefined })}>
                Remove
              </Button>
            )}
          </div>
          <input ref={videoInput} type="file" accept="video/mp4,video/webm" capture="user" hidden onChange={(e) => e.target.files?.[0] && uploadMedia(e.target.files[0], "video")} />
        </fieldset>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <Label>Background sound</Label>
          <div className="flex flex-wrap gap-1.5">
            {(
              [
                ["none", "None"],
                ["music-box", "Music box"],
                ["soft-piano", "Soft piano"],
              ] as const
            ).map(([v, l]) => (
              <button
                key={v}
                type="button"
                aria-pressed={settings.sound === v}
                onClick={() => onChange({ sound: v })}
                className={cn("rounded-full border px-3.5 py-1.5 text-[13px]", settings.sound === v ? "border-ink bg-ink text-ivory" : "border-line bg-paper")}
              >
                {l}
              </button>
            ))}
            <button
              type="button"
              aria-pressed={settings.sound === "custom"}
              onClick={() => audioInput.current?.click()}
              className={cn("inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-[13px]", settings.sound === "custom" ? "border-ink bg-ink text-ivory" : "border-line bg-paper")}
            >
              {uploading === "audio" ? <Loader2 className="size-3.5 animate-spin" /> : settings.sound === "custom" ? <Music className="size-3.5" /> : <Upload className="size-3.5" />}
              {settings.sound === "custom" ? "Your audio" : "Upload audio"}
            </button>
            <input ref={audioInput} type="file" accept="audio/mpeg,audio/mp4,audio/x-m4a,audio/webm,audio/ogg,audio/wav" hidden onChange={(e) => e.target.files?.[0] && uploadMedia(e.target.files[0], "audio")} />
          </div>
          <p className="mt-1.5 text-[12.5px] text-muted">Never auto-plays — they choose to turn it on.</p>
        </div>
        <div className="flex items-start justify-between gap-4 rounded-2xl border border-line bg-paper p-4">
          <div>
            <p className="text-[14px] font-medium">Confetti</p>
            <p className="text-[12.5px] text-muted">A little celebration on reveal. Hidden for reduced-motion users.</p>
          </div>
          <Switch checked={settings.confetti} onChange={(confetti) => onChange({ confetti })} label="Confetti" />
        </div>
      </div>
    </div>
  );
}

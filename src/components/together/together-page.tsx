"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarClock, Check, Eye, ImagePlus, Loader2, Users, Video, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { track } from "@/lib/analytics";
import { MediaScopeProvider } from "@/lib/media/resolver";
import { getTemplate } from "@/lib/data/templates";
import { togetherService, type ContributionInvite } from "@/lib/services";
import type { Contribution } from "@/lib/types";
import { cn, formatDate } from "@/lib/utils";
import { TemplateThumb } from "../art/template-thumb";
import { ContributionCard } from "../experiences/together";
import { Button } from "../ui/button";
import { Field, Input, Textarea } from "../ui/form";
import { Container, EmptyState, Skeleton } from "../ui/misc";
import { useToast } from "../ui/toast";

const cardColors = ["#F9D9D3", "#D9E8F5", "#E6DDF5", "#FBEFC8", "#DCEFE4", "#F3E1D3"];

const schema = z.object({
  name: z.string().trim().min(1, "Add your name so they know who it's from.").max(60),
  message: z.string().trim().min(2, "Write a few words.").max(1000, "Keep it under 1,000 characters."),
});

interface Attachment {
  path: string;
  type: "image" | "video";
  previewUrl: string;
}

/** Contributor flow for a group card. The token in the URL is the only credential — no account needed. */
export function TogetherPage({ token }: { token: string }) {
  const [invite, setInvite] = useState<ContributionInvite | null | undefined>(undefined);
  const [color, setColor] = useState(cardColors[0]);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [uploading, setUploading] = useState<{ progress: number; abort: AbortController } | null>(null);
  const [step, setStep] = useState<"write" | "preview" | "done">("write");
  const [submitted, setSubmitted] = useState<"pending" | "approved" | null>(null);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const toast = useToast();
  const {
    register,
    handleSubmit,
    getValues,
    reset,
    formState: { errors },
  } = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema) });

  useEffect(() => {
    togetherService
      .invite(token)
      .then(setInvite)
      .catch(() => setInvite(null));
  }, [token]);

  if (invite === undefined)
    return (
      <Container className="py-12">
        <Skeleton className="h-64 w-full rounded-[28px]" />
      </Container>
    );
  if (invite === null)
    return (
      <Container className="py-16">
        <EmptyState
          title="This invitation isn't active"
          description="The link may be incomplete, or the organiser closed the card. Ask them to share the contributor link again."
          action={
            <Button asChild>
              <Link href="/create?experience=together">Start your own group card</Link>
            </Button>
          }
        />
      </Container>
    );

  const t = invite.templateSlug ? getTemplate(`tpl-${invite.templateSlug}`) : undefined;
  const published: Contribution[] = invite.contributions.map((k) => ({
    id: k.id,
    name: k.name,
    message: k.message,
    color: k.color,
    createdAt: k.createdAt,
    photo: k.media?.[0]?.src ?? (k.media?.[0]?.path ? `path:${k.media[0].path}` : undefined),
  }));
  const values = getValues();

  const addFile = async (file: File) => {
    if (attachments.length >= 3) return toast.info("Up to 3 attachments.");
    const abort = new AbortController();
    setUploading({ progress: 0, abort });
    try {
      const up = await togetherService.uploadMedia(token, file, { signal: abort.signal, onProgress: (progress) => setUploading({ progress, abort }) });
      setAttachments((a) => [...a, up]);
    } catch (e) {
      if ((e as Error).name !== "AbortError") toast.error({ title: "Upload failed", description: e instanceof Error ? e.message : undefined });
    } finally {
      setUploading(null);
    }
  };

  const submit = async () => {
    setBusy(true);
    try {
      const v = getValues();
      const res = await togetherService.contribute(token, { name: v.name, message: v.message, color, media: attachments.map(({ path, type }) => ({ path, type })) });
      track("contribution_submitted", { with_media: attachments.length > 0 });
      setSubmitted(res.status);
      setStep("done");
      reset();
      setAttachments([]);
    } catch (e) {
      toast.error({ title: "Couldn't add your message", description: e instanceof Error ? e.message : undefined });
    } finally {
      setBusy(false);
    }
  };

  return (
    <MediaScopeProvider slug={undefined}>
      <Container className="pb-24 pt-8 sm:pt-12">
        <div className="grid items-center gap-8 rounded-[28px] border border-line bg-paper p-6 sm:p-10 lg:grid-cols-[1.4fr_1fr]">
          <div>
            <p className="eyebrow mb-3 flex flex-wrap items-center gap-x-4 gap-y-1">
              <span className="flex items-center gap-1.5">
                <Users className="size-3.5" /> {invite.count} of {invite.limit} signed
              </span>
              {invite.deadline && (
                <span className="flex items-center gap-1.5">
                  <CalendarClock className="size-3.5" /> Closes {formatDate(invite.deadline, { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}
                </span>
              )}
            </p>
            <h1 className="font-display text-[2.4rem] leading-[1] sm:text-5xl">
              {invite.senderName || "Someone"} invited you to sign <em className="text-burgundy">{invite.recipientName}&apos;s</em> card.
            </h1>
            <p className="mt-4 max-w-lg text-[15.5px] leading-relaxed text-muted">
              Add a message, a photo or a short video. {invite.recipientName} won&apos;t see anything until it&apos;s delivered
              {invite.requiresApproval ? ", and the organiser reviews every message first" : ""}.
            </p>
          </div>
          <div className="mx-auto w-48 overflow-hidden rounded-[16px] shadow-lift sm:w-56">
            {t && <TemplateThumb palette={t.palette} motif={t.motif} headline={t.headline} font={t.font} subline={`for ${invite.recipientName}`} />}
          </div>
        </div>

        <div className="mt-12 grid gap-12 lg:grid-cols-[1fr_1.3fr]">
          <section aria-labelledby="sign-heading">
            {!invite.isOpen && step !== "done" ? (
              <EmptyState title="This card is closed" description={invite.deadline && new Date(invite.deadline) < new Date() ? "The deadline has passed." : "It has reached its contributor limit."} />
            ) : step === "done" ? (
              <div className="rounded-2xl border border-line bg-paper p-6">
                <span className="mb-4 grid size-11 place-items-center rounded-full bg-burgundy text-ivory">
                  <Check className="size-5" />
                </span>
                <h2 id="sign-heading" className="font-display text-3xl">Thank you for signing</h2>
                <p className="mt-2 text-[15px] text-muted">
                  {submitted === "pending" ? "Your message is with the organiser for a quick review before it goes on the card." : `Your message is on the card. ${invite.recipientName} is going to love it.`}
                </p>
                <Button className="mt-5" variant="outline" onClick={() => setStep("write")}>
                  Add another
                </Button>
              </div>
            ) : step === "preview" ? (
              <div>
                <h2 id="sign-heading" className="mb-4 font-display text-3xl">How it will look</h2>
                <div className="max-w-sm">
                  <ContributionCard c={{ id: "preview", name: values.name, message: values.message, color, createdAt: "", photo: attachments[0]?.previewUrl }} />
                </div>
                <div className="mt-5 flex gap-2">
                  <Button variant="outline" onClick={() => setStep("write")}>
                    Edit
                  </Button>
                  <Button onClick={submit} loading={busy}>
                    Sign the card
                  </Button>
                </div>
              </div>
            ) : (
              <form className="space-y-5" noValidate onSubmit={handleSubmit(() => setStep("preview"))}>
                <h2 id="sign-heading" className="font-display text-3xl">Add your message</h2>
                <Field label="Your name" htmlFor="c-name" error={errors.name?.message}>
                  <Input id="c-name" autoComplete="name" aria-invalid={!!errors.name} {...register("name")} />
                </Field>
                <Field label="Your message" htmlFor="c-msg" error={errors.message?.message}>
                  <Textarea id="c-msg" rows={5} className="font-hand text-[22px] leading-snug" placeholder={`Dear ${invite.recipientName}…`} aria-invalid={!!errors.message} {...register("message")} />
                </Field>
                <div>
                  <p className="mb-1.5 text-[13px] font-medium text-ink/80">Card colour</p>
                  <div className="flex gap-2">
                    {cardColors.map((c) => (
                      <button key={c} type="button" aria-label={`Card colour ${c}`} aria-pressed={color === c} onClick={() => setColor(c)} className={cn("size-8 rounded-full border border-ink/10", color === c && "ring-2 ring-burgundy ring-offset-2")} style={{ background: c }} />
                    ))}
                  </div>
                </div>
                <div>
                  <p className="mb-1.5 text-[13px] font-medium text-ink/80">Photo or video (optional)</p>
                  <div className="flex flex-wrap items-center gap-2">
                    {attachments.map((a, i) => (
                      <span key={a.path} className="relative size-20 overflow-hidden rounded-xl bg-blush">
                        {a.type === "video" ? (
                          <video src={a.previewUrl} className="size-full object-cover" muted />
                        ) : (
                          // eslint-disable-next-line @next/next/no-img-element -- local preview
                          <img src={a.previewUrl} alt="" className="size-full object-cover" />
                        )}
                        <button type="button" aria-label={`Remove attachment ${i + 1}`} onClick={() => setAttachments((xs) => xs.filter((x) => x !== a))} className="absolute right-1 top-1 grid size-5 place-items-center rounded-full bg-ink/70 text-white">
                          <X className="size-3" />
                        </button>
                      </span>
                    ))}
                    {uploading ? (
                      <span className="flex items-center gap-2 rounded-xl border border-line bg-paper px-3 py-2 text-[13px]">
                        <Loader2 className="size-4 animate-spin" /> {Math.round(uploading.progress * 100)}%
                        <button type="button" className="text-rose-deep underline" onClick={() => uploading.abort.abort()}>
                          Cancel
                        </button>
                      </span>
                    ) : (
                      attachments.length < 3 && (
                        <Button type="button" variant="outline" onClick={() => fileRef.current?.click()}>
                          <ImagePlus /> <Video /> Add
                        </Button>
                      )
                    )}
                  </div>
                  <p className="mt-1.5 text-[12px] text-muted">JPG, PNG or WebP up to 10 MB · MP4 or WebM up to 50 MB.</p>
                  <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,video/mp4,video/webm" hidden onChange={(e) => e.target.files?.[0] && addFile(e.target.files[0])} />
                </div>
                <Button type="submit" size="lg" disabled={!!uploading}>
                  <Eye /> Preview my message
                </Button>
              </form>
            )}
          </section>

          <section aria-labelledby="board-heading">
            <div className="mb-4 flex items-center justify-between">
              <h2 id="board-heading" className="font-display text-3xl">On the card so far</h2>
              <span className="text-[13px] text-muted">{published.length} shown</span>
            </div>
            {published.length ? (
              <MediaScopeProvider slug={undefined}>
                <div className="columns-1 gap-3 sm:columns-2">
                  {published.map((c) => (
                    <ContributionCard key={c.id} c={c} />
                  ))}
                </div>
              </MediaScopeProvider>
            ) : (
              <p className="rounded-2xl border border-dashed border-line px-5 py-8 text-center text-[14px] text-muted">Be the first to sign — messages appear here once they&apos;re on the card.</p>
            )}
          </section>
        </div>
      </Container>
    </MediaScopeProvider>
  );
}

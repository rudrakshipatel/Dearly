"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, ImagePlus, Loader2, Mail, Users, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { creationService, togetherService, uploadService } from "@/lib/services";
import type { Contribution, Creation } from "@/lib/types";
import { cn } from "@/lib/utils";
import { PhotoView } from "../art/scene";
import { TemplateThumb } from "../art/template-thumb";
import { SharePanel } from "../create/share-panel";
import { ExperiencePlayer } from "../experiences/player";
import { ContributionCard } from "../experiences/together";
import { PhoneFrame } from "../templates/phone-frame";
import { Button } from "../ui/button";
import { Dialog, DialogContent } from "../ui/dialog";
import { Field, Input, Textarea } from "../ui/form";
import { Container, EmptyState, Skeleton } from "../ui/misc";
import { useToast } from "../ui/toast";
import { getTemplate } from "@/lib/data/templates";

const cardColors = ["#F9D9D3", "#D9E8F5", "#E6DDF5", "#FBEFC8", "#DCEFE4", "#F3E1D3"];

const schema = z.object({
  name: z.string().trim().min(1, "Add your name so they know who it's from.").max(40),
  message: z.string().trim().min(2, "Write a few words.").max(500, "Keep it under 500 characters."),
});

export function TogetherPage({ id }: { id: string }) {
  const [card, setCard] = useState<Creation | null | undefined>(undefined);
  const [items, setItems] = useState<Contribution[]>([]);
  const [color, setColor] = useState(cardColors[0]);
  const [photo, setPhoto] = useState<string | undefined>();
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(false);
  const [invite, setInvite] = useState(false);
  const [done, setDone] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const toast = useToast();
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema) });

  useEffect(() => {
    creationService.getBySlug(id).then((c) => setCard(c ?? null));
    togetherService.list(id).then(setItems);
  }, [id]);

  if (card === undefined)
    return (
      <Container className="py-12">
        <Skeleton className="h-12 w-96" />
        <Skeleton className="mt-8 h-80 w-full" />
      </Container>
    );
  if (card === null)
    return (
      <Container className="py-16">
        <EmptyState
          title="This group card couldn't be found"
          description="Ask the organiser to share the contributor link again."
          action={
            <Button asChild>
              <Link href="/create">Start a group card</Link>
            </Button>
          }
        />
      </Container>
    );

  const t = getTemplate(card.templateId);
  const fullCard: Creation = { ...card, contributions: items, interaction: { ...card.interaction, mode: "group" } };
  const draft = watch();

  return (
    <Container className="pb-24 pt-8 sm:pt-12">
      {/* Invitation */}
      <div className="grid items-center gap-8 rounded-[28px] border border-line bg-paper p-6 sm:p-10 lg:grid-cols-[1.4fr_1fr]">
        <div>
          <p className="eyebrow mb-3 flex items-center gap-2">
            <Users className="size-3.5" /> Group card · {items.length} {items.length === 1 ? "person has" : "people have"} signed
          </p>
          <h1 className="font-display text-[2.4rem] leading-[1] sm:text-5xl">
            {card.senderName} invited you to sign <em className="text-burgundy">{card.recipientName}&apos;s</em> card.
          </h1>
          <p className="mt-4 max-w-lg text-[15.5px] leading-relaxed text-muted">Add a message, a photo, or both. {card.recipientName} won&apos;t see anything until it&apos;s delivered.</p>
          <div className="mt-6 flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => setPreview(true)}>
              <Eye /> Preview the final card
            </Button>
            <Button variant="ghost" onClick={() => setInvite(true)}>
              <Mail /> Invite others
            </Button>
          </div>
        </div>
        <div className="mx-auto w-48 overflow-hidden rounded-[16px] shadow-lift sm:w-56">
          {t && <TemplateThumb palette={t.palette} motif={t.motif} headline={t.headline} font={t.font} subline={`for ${card.recipientName}`} />}
        </div>
      </div>

      <div className="mt-12 grid gap-12 lg:grid-cols-[1fr_1.3fr]">
        {/* Contribution form */}
        <section aria-labelledby="sign-heading">
          <h2 id="sign-heading" className="font-display text-3xl">
            {done ? "Thank you for signing" : "Add your message"}
          </h2>
          {done ? (
            <div className="mt-6 rounded-2xl border border-line bg-paper p-6">
              <p className="text-[15px] text-muted">Your message is on the card. Want to add another, or invite someone else?</p>
              <div className="mt-4 flex gap-2">
                <Button onClick={() => setDone(false)}>Add another</Button>
                <Button variant="outline" onClick={() => setInvite(true)}>
                  Invite others
                </Button>
              </div>
            </div>
          ) : (
            <form
              className="mt-6 space-y-5"
              noValidate
              onSubmit={handleSubmit(async (v) => {
                const c = await togetherService.contribute(id, { ...v, color, photo });
                setItems((xs) => [...xs, c]);
                reset();
                setPhoto(undefined);
                setDone(true);
                toast.success(`Signed! ${card.recipientName} is going to love it.`);
              })}
            >
              <Field label="Your name" htmlFor="c-name" error={errors.name?.message}>
                <Input id="c-name" autoComplete="name" aria-invalid={!!errors.name} {...register("name")} />
              </Field>
              <Field label="Your message" htmlFor="c-msg" error={errors.message?.message}>
                <Textarea id="c-msg" rows={5} className="font-hand text-[22px] leading-snug" placeholder={`Happy birthday ${card.recipientName}!`} aria-invalid={!!errors.message} {...register("message")} />
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
                <p className="mb-1.5 text-[13px] font-medium text-ink/80">Photo (optional)</p>
                {photo ? (
                  <div className="relative w-32 overflow-hidden rounded-xl">
                    <div className="aspect-[4/3]">
                      <PhotoView src={photo} alt="Your photo" />
                    </div>
                    <button type="button" aria-label="Remove photo" onClick={() => setPhoto(undefined)} className="absolute right-1.5 top-1.5 grid size-6 place-items-center rounded-full bg-ink/70 text-white">
                      <X className="size-3.5" />
                    </button>
                  </div>
                ) : (
                  <Button type="button" variant="outline" onClick={() => fileRef.current?.click()} disabled={uploading}>
                    {uploading ? <Loader2 className="animate-spin" /> : <ImagePlus />} Add a photo
                  </Button>
                )}
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={async (e) => {
                    const f = e.target.files?.[0];
                    if (!f) return;
                    setUploading(true);
                    try {
                      setPhoto(await uploadService.uploadImage(f, 900));
                    } catch (err) {
                      toast.error({ title: "Upload failed", description: err instanceof Error ? err.message : undefined });
                    } finally {
                      setUploading(false);
                    }
                  }}
                />
                <p className="mt-2 text-[12.5px] text-muted">Video messages arrive with accounts in the next release.</p>
              </div>
              <Button type="submit" size="lg" loading={isSubmitting}>
                Sign the card
              </Button>
            </form>
          )}
        </section>

        {/* Board */}
        <section aria-labelledby="board-heading">
          <div className="mb-4 flex items-center justify-between">
            <h2 id="board-heading" className="font-display text-3xl">
              On the card so far
            </h2>
            <span className="text-[13px] text-muted">{items.length} messages</span>
          </div>
          <div className="mb-5 flex flex-wrap gap-1.5">
            {items.map((c) => (
              <span key={c.id} className="rounded-full px-2.5 py-1 text-[12px] text-ink/80" style={{ background: c.color }}>
                {c.name}
              </span>
            ))}
          </div>
          <div className="columns-1 gap-3 sm:columns-2">
            {!done && (draft.message || draft.name) && (
              <div className="opacity-70">
                <ContributionCard c={{ id: "draft", name: draft.name || "You", message: draft.message || "…", photo, color, createdAt: "" }} />
              </div>
            )}
            {[...items].reverse().map((c) => (
              <ContributionCard key={c.id} c={c} />
            ))}
          </div>
        </section>
      </div>

      <Dialog open={preview} onOpenChange={setPreview}>
        <DialogContent title="The final card" description={`What ${card.recipientName} will see on the day.`}>
          {preview && (
            <PhoneFrame className="max-w-[290px]">
              <ExperiencePlayer creation={fullCard} compact preview />
            </PhoneFrame>
          )}
        </DialogContent>
      </Dialog>
      <InviteDialog open={invite} onOpenChange={setInvite} id={id} />
    </Container>
  );
}

function InviteDialog({ open, onOpenChange, id }: { open: boolean; onOpenChange: (v: boolean) => void; id: string }) {
  const [emails, setEmails] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent title="Invite more people" description="The more the merrier. Share the link or send invitations.">
        <SharePanel path={`/together/${id}`} label="Contributor link" />
        <div className="mt-6 border-t border-line pt-5">
          <Field label="Or invite by email" htmlFor="inv" error={error ?? undefined} hint="Separate addresses with commas.">
            <Textarea id="inv" value={emails} onChange={(e) => setEmails(e.target.value)} className="min-h-20" placeholder="aunt.june@example.com, sam@example.com" />
          </Field>
          <Button
            className="mt-3 w-full"
            loading={busy}
            onClick={async () => {
              const list = emails.split(/[\s,;]+/).filter(Boolean);
              const bad = list.find((e) => !z.string().email().safeParse(e).success);
              if (!list.length) return setError("Add at least one email address.");
              if (bad) return setError(`"${bad}" doesn't look like an email address.`);
              setError(null);
              setBusy(true);
              await togetherService.invite(id, list);
              setBusy(false);
              setEmails("");
              onOpenChange(false);
              toast.success(`Invitations queued for ${list.length} ${list.length === 1 ? "person" : "people"}.`, );
            }}
          >
            Send invitations
          </Button>
          <p className="mt-2 text-center text-[12px] text-muted">Demo: invitations are recorded locally; email delivery connects with the backend.</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

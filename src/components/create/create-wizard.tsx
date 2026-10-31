"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Check, Crown, Eye, Maximize2, PartyPopper, PenTool, Sparkles, Users, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { defaultInteraction } from "@/lib/creation";
import { createExperienceOptions } from "@/lib/data/experiences";
import { occasionInSentence, occasionMap, occasions } from "@/lib/data/occasions";
import { palettes } from "@/lib/data/palettes";
import { getTemplate } from "@/lib/data/templates";
import { track } from "@/lib/analytics";
import { useSession } from "@/lib/hooks";
import { ApiClientError, creationService } from "@/lib/services";
import { formatInZone, timezones, userTimezone, zonedLocalToUtc } from "@/lib/time";
import type { Creation, ExperienceKind, InteractionSettings, Motif, PaletteId, Template } from "@/lib/types";
import { cn } from "@/lib/utils";
import { MotifArt } from "../art/motif";
import { TemplateThumb } from "../art/template-thumb";
import { Logo } from "../brand/logo";
import { ExperiencePlayer } from "../experiences/player";
import { PhoneFrame } from "../templates/phone-frame";
import { TemplatePreviewDialog } from "../templates/template-card";
import { Button } from "../ui/button";
import { Field, Input, Select, Switch, Textarea } from "../ui/form";
import { Badge, Skeleton } from "../ui/misc";
import { useToast } from "../ui/toast";
import { AiAssistDialog } from "../ai/ai-assist";
import { InteractionControls } from "./interaction-controls";
import { PhotoUploader } from "./photo-uploader";
import { SharePanel } from "./share-panel";
import { draftToCreation, templatesFor, useCreateDraft, type CreateDraft } from "./use-create-draft";

const STEPS = ["Occasion", "Experience", "Template", "Personalize", "Interaction", "Preview", "Publish"];

const expArt: Record<string, { motif: Motif; palette: PaletteId }> = {
  classic: { motif: "botanical", palette: "ivory-sage" },
  surprise: { motif: "gift", palette: "pastel-party" },
  memories: { motif: "polaroids", palette: "lavender-coral" },
  video: { motif: "film", palette: "terracotta" },
  together: { motif: "confetti", palette: "mint-peach" },
};

export function CreateWizard() {
  const { draft, update, reset, ready } = useCreateDraft();
  const toast = useToast();
  const router = useRouter();
  const [published, setPublished] = useState<Creation | null>(null);
  const step = draft.step;

  const template = getTemplate(draft.templateId);
  const settings: InteractionSettings = useMemo(() => {
    const t = template;
    const base = t ? defaultInteraction(t.palette, t.interactions[0], draft.occasion ?? t.occasion) : defaultInteraction("rose-cream", "gift", "birthday");
    return { ...base, ...draft.interaction } as InteractionSettings;
  }, [template, draft.interaction, draft.occasion]);

  const canEnter = (i: number) => {
    if (i <= 0) return true;
    if (i === 1) return !!draft.occasion;
    if (i === 2) return !!draft.occasion && !!draft.experience;
    if (i === 3) return !!draft.templateId;
    return !!draft.templateId && !!draft.recipientName && !!draft.senderName;
  };
  const go = (i: number) => {
    if (!canEnter(i)) return;
    update({ step: i });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const session = useSession();

  /**
   * Saves the draft to the user's account so it can be edited, previewed or published.
   * Guests are sent to sign in first; the draft stays in this tab and is restored afterwards.
   */
  const persist = async (extra: Partial<Creation> = {}): Promise<Creation | null> => {
    const c = draftToCreation(draft);
    if (!c) return null;
    if (!session.user) {
      toast.info({ title: "Sign in to save your card", description: "Your draft is kept — you'll come straight back here." });
      router.push("/sign-in?next=/create");
      return null;
    }
    try {
      const body = { ...c, ...extra };
      let saved: Creation;
      if (draft.creationId) {
        // The wizard is the source of truth for its own draft: save on top of the latest version.
        const current = await creationService.get(draft.creationId).catch(() => null);
        saved = current ? await creationService.save({ ...body, id: draft.creationId }, current.version ?? 1) : await creationService.create(body);
      } else {
        saved = await creationService.create(body);
      }
      update({ creationId: saved.id, slug: saved.slug });
      track("card_saved", { source: "wizard", experience: saved.experience });
      return saved;
    } catch (e) {
      toast.error({ title: "Couldn't save your card", description: e instanceof Error ? e.message : "Please try again." });
      return null;
    }
  };

  if (!ready) {
    return (
      <div className="mx-auto max-w-5xl px-5 py-16">
        <Skeleton className="h-10 w-72" />
        <div className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="aspect-[4/5]" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-line bg-ivory/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-5">
          <Logo />
          <p className="hidden text-[13px] text-muted sm:block">
            Step {step + 1} of {STEPS.length} · {STEPS[step]}
          </p>
          <Button
            variant="ghost"
            size="sm"
            onClick={async () => {
              if (draft.templateId && draft.recipientName && session.user) {
                if (!(await persist())) return;
                toast.success({ title: "Draft saved", description: "Find it any time in My Creations." });
              }
              router.push(session.user ? "/dashboard" : "/");
            }}
          >
            <X /> Save & exit
          </Button>
        </div>
        <nav aria-label="Progress" className="mx-auto max-w-6xl px-5 pb-3">
          <ol className="flex gap-1.5">
            {STEPS.map((s, i) => (
              <li key={s} className="flex-1">
                <button
                  onClick={() => go(i)}
                  disabled={!canEnter(i) || !!published}
                  aria-current={i === step ? "step" : undefined}
                  className="group block w-full text-left disabled:cursor-not-allowed"
                >
                  <span className={cn("block h-1 rounded-full transition-colors", i < step ? "bg-burgundy" : i === step ? "bg-rose" : "bg-line")} />
                  <span className={cn("mt-1.5 hidden text-[12px] md:block", i === step ? "text-ink" : "text-muted group-enabled:group-hover:text-ink")}>{s}</span>
                </button>
              </li>
            ))}
          </ol>
        </nav>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-5 pb-32 pt-8 sm:pt-12">
        <AnimatePresence mode="wait">
          <motion.div key={published ? "done" : step} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}>
            {published ? (
              <Published creation={published} onNew={() => { reset(); setPublished(null); }} />
            ) : step === 0 ? (
              <StepOccasion draft={draft} onPick={(occasion) => update({ occasion, templateId: undefined, step: 1 })} />
            ) : step === 1 ? (
              <StepExperience
                draft={draft}
                onPick={(experience) => {
                  track("card_creation_started", { experience });
                  if (experience === "together") track("group_card_created");
                  update({ experience, templateId: undefined, interaction: {}, step: 2 });
                }}
              />
            ) : step === 2 ? (
              <StepTemplate
                draft={draft}
                onPick={(t) => {
                  track("template_selected", { template: t.id, premium: t.premium });
                  update({ templateId: t.id, interaction: { mode: t.interactions[0] }, step: 3 });
                }}
              />
            ) : step === 3 ? (
              <StepPersonalize
                draft={draft}
                template={template!}
                onSubmit={(v) => update({ ...v, step: 4 })}
                onBack={(v) => update({ ...v, step: 2 })}
                onPhotos={(photos) => update({ photos })}
              />
            ) : step === 4 ? (
              <StepInteraction draft={draft} settings={settings} cardId={draft.creationId} onChange={(patch) => update({ interaction: { ...draft.interaction, ...patch } })} />
            ) : step === 5 ? (
              <StepPreview
                draft={draft}
                onEditor={async () => {
                  const c = await persist();
                  if (c) router.push(`/editor/${c.id}`);
                }}
                onFullscreen={async () => {
                  const c = await persist();
                  if (c) window.open(`/card/${c.slug}?preview=${c.id}`, "_blank", "noopener");
                }}
              />
            ) : (
              <StepPublish
                draft={draft}
                onBack={() => go(5)}
                signedIn={!!session.user}
                onCollect={async (opts) => {
                  const c = await persist({ title: opts.title || undefined });
                  if (!c) return null;
                  try {
                    await creationService.updateSettings(c.id, { contributionDeadline: opts.deadline, contributionLimit: opts.limit, contributionsRequireApproval: opts.requireApproval });
                    const token = c.contributionToken ?? (await creationService.regenerateToken(c.id));
                    if (opts.invites.length) {
                      const r = await creationService.invite(c.id, opts.invites).catch((e) => {
                        toast.error({ title: "Invitations weren't emailed", description: e instanceof Error ? e.message : undefined });
                        return null;
                      });
                      if (r) toast.success(`Invitations sent to ${r.sent} ${r.sent === 1 ? "person" : "people"}.`);
                    }
                    return token;
                  } catch (e) {
                    toast.error({ title: "Couldn't create the contributor link", description: e instanceof Error ? e.message : undefined });
                    return null;
                  }
                }}
                onPublish={async (opts) => {
                  const c = await persist({ title: opts.title || undefined });
                  if (!c) return;
                  try {
                    const settings: Parameters<typeof creationService.updateSettings>[1] = { showBranding: opts.branding, allowReactions: opts.allowReactions };
                    if (draft.experience === "together") Object.assign(settings, { contributionDeadline: opts.deadline, contributionLimit: opts.limit, contributionsRequireApproval: opts.requireApproval });
                    await creationService.updateSettings(c.id, settings);
                    const res = await creationService.publish(c.id, { scheduledAt: opts.scheduledAt ?? null, timezone: opts.timezone, deliveryEmail: opts.deliveryEmail || null });
                    if (res.delivery && !res.delivery.queued) toast.info({ title: "Delivery saved", description: res.delivery.reason });
                    setPublished(res.card);
                    try {
                      sessionStorage.removeItem("dearly:create-draft");
                    } catch {}
                  } catch (e) {
                    const upgrade = e instanceof ApiClientError && e.isEntitlement;
                    toast.error({
                      title: upgrade ? "That needs an upgrade" : "Publishing failed",
                      description: e instanceof Error ? e.message : "Please try again.",
                      action: upgrade ? { label: "See plans", onClick: () => router.push("/pricing") } : undefined,
                    });
                  }
                }}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Footer navigation */}
      {!published && step !== 3 && step !== 6 && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-ivory/95 backdrop-blur-md">
          <div className="mx-auto flex h-[72px] max-w-6xl items-center justify-between px-5">
            <Button variant="ghost" onClick={() => go(step - 1)} disabled={step === 0}>
              <ArrowLeft /> Back
            </Button>
            <Button onClick={() => go(step + 1)} disabled={!canEnter(step + 1)}>
              {step === 5 ? "Looks lovely — continue" : "Continue"} <ArrowRight />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function StepTitle({ eyebrow, title, description }: { eyebrow: string; title: React.ReactNode; description?: string }) {
  return (
    <div className="mb-8 max-w-2xl">
      <p className="eyebrow mb-3">{eyebrow}</p>
      <h1 className="font-display text-[2.4rem] leading-[1] tracking-[-0.01em] sm:text-5xl">{title}</h1>
      {description && <p className="mt-3 text-[15.5px] leading-relaxed text-muted">{description}</p>}
    </div>
  );
}

/* ------------------------------------------------------------ Step 1 */

function StepOccasion({ draft, onPick }: { draft: CreateDraft; onPick: (o: CreateDraft["occasion"]) => void }) {
  return (
    <>
      <StepTitle eyebrow="Step 1" title={<>What&apos;s the <em>occasion?</em></>} description="We'll suggest templates and experiences that suit the moment." />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {occasions.map((o) => {
          const active = draft.occasion === o.slug;
          return (
            <button
              key={o.slug}
              onClick={() => onPick(o.slug)}
              aria-pressed={active}
              className={cn("group relative overflow-hidden rounded-[20px] border-2 text-left transition-all", active ? "border-burgundy" : "border-transparent hover:-translate-y-0.5")}
            >
              <div className="relative aspect-[4/3]">
                <TemplateBg palette={o.palette} motif={o.motif} />
              </div>
              <div className="bg-paper px-3.5 py-3">
                <p className="text-[15px] font-medium">{o.name}</p>
                <p className="truncate text-[12.5px] text-muted">{o.short}</p>
              </div>
              {active && (
                <span className="absolute right-2 top-2 grid size-6 place-items-center rounded-full bg-burgundy text-white">
                  <Check className="size-3.5" />
                </span>
              )}
            </button>
          );
        })}
      </div>
    </>
  );
}

function TemplateBg({ palette, motif }: { palette: PaletteId; motif: Motif }) {
  return (
    <div className="absolute inset-0 grid place-items-center">
      <PaletteFill palette={palette} />
      <MotifArt motif={motif} palette={palette} className="relative h-[80%] transition-transform duration-500 group-hover:scale-105" />
    </div>
  );
}

function PaletteFill({ palette }: { palette: PaletteId }) {
  return <div className="paper-grain absolute inset-0" style={{ backgroundColor: palettes[palette].bg }} />;
}

/* ------------------------------------------------------------ Step 2 */

function StepExperience({ draft, onPick }: { draft: CreateDraft; onPick: (e: ExperienceKind) => void }) {
  const o = draft.occasion ? occasionMap[draft.occasion] : undefined;
  return (
    <>
      <StepTitle eyebrow="Step 2" title={<>How should it <em>feel</em> to open?</>} description={o ? `For ${occasionInSentence(o)}, people love ${o.suggested.slice(0, 2).join(" and ")} experiences.` : undefined} />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {createExperienceOptions.map((x) => {
          const active = draft.experience === x.kind;
          const art = expArt[x.kind];
          return (
            <button
              key={x.kind}
              onClick={() => onPick(x.kind)}
              aria-pressed={active}
              className={cn("group flex flex-col overflow-hidden rounded-[20px] border-2 bg-paper text-left transition-all", active ? "border-burgundy" : "border-line hover:border-ink/20")}
            >
              <div className="relative grid h-36 place-items-center">
                <PaletteFill palette={art.palette} />
                <MotifArt {...art} className="relative h-28 transition-transform duration-500 group-hover:scale-105" />
              </div>
              <div className="p-4">
                <p className="font-display text-2xl leading-tight">{x.label}</p>
                <p className="mt-1 text-[13.5px] leading-snug text-muted">{x.description}</p>
              </div>
            </button>
          );
        })}
      </div>
    </>
  );
}

/* ------------------------------------------------------------ Step 3 */

function StepTemplate({ draft, onPick }: { draft: CreateDraft; onPick: (t: Template) => void }) {
  const { exact, others } = templatesFor(draft);
  const [preview, setPreview] = useState<Template | null>(null);
  const [ideas, setIdeas] = useState(false);
  const grid = (list: Template[]) => (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {list.map((t) => {
        const active = draft.templateId === t.id;
        return (
          <div key={t.id} className="group">
            <button onClick={() => onPick(t)} aria-pressed={active} aria-label={`Use ${t.name}`} className={cn("relative block w-full overflow-hidden rounded-[18px] border-2 transition-all", active ? "border-burgundy" : "border-transparent shadow-soft hover:shadow-lift")}>
              <TemplateThumb palette={t.palette} motif={t.motif} headline={t.headline} font={t.font} />
              <span className="absolute left-2.5 top-2.5">{t.premium ? <Badge tone="premium"><Crown className="size-3" /> Premium</Badge> : <Badge tone="free">Free</Badge>}</span>
            </button>
            <div className="mt-2 flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate text-[14px] font-medium">{t.name}</p>
                <p className="text-[12.5px] capitalize text-muted">{t.style}</p>
              </div>
              <Button variant="ghost" size="icon-sm" aria-label={`Preview ${t.name}`} onClick={() => setPreview(t)}>
                <Eye />
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
  return (
    <>
      <StepTitle eyebrow="Step 3" title={<>Pick a <em>starting point.</em></>} description="Everything — words, photos, colours, the way it opens — can be changed after." />
      <Button variant="soft" size="sm" className="-mt-4 mb-6" onClick={() => setIdeas(true)}>
        <Sparkles /> Describe your idea instead
      </Button>
      <AiAssistDialog
        open={ideas}
        onOpenChange={setIdeas}
        mode="design"
        context={{ occasion: draft.occasion }}
        onUseDesign={(d) => {
          const t = getTemplate(d.templateId);
          if (t) onPick(t);
        }}
      />
      {exact.length > 0 ? grid(exact) : <p className="mb-6 rounded-2xl bg-blush/60 px-4 py-3 text-[14px] text-burgundy">No exact match for this occasion yet — these work beautifully too.</p>}
      {others.length > 0 && (
        <>
          <h2 className="mb-4 mt-12 font-display text-2xl">{exact.length ? "More you might like" : "Templates"}</h2>
          {grid(others)}
        </>
      )}
      {preview && <TemplatePreviewDialog template={preview} open={!!preview} onOpenChange={(v) => !v && setPreview(null)} />}
    </>
  );
}

/* ------------------------------------------------------------ Step 4 */

const personalizeSchema = z.object({
  recipientName: z.string().trim().min(1, "Who is this for?").max(40, "Keep it under 40 characters."),
  senderName: z.string().trim().min(1, "Let them know who it's from.").max(40, "Keep it under 40 characters."),
  message: z.string().trim().min(2, "Write a few words from the heart.").max(1200, "That's a lovely long note — please keep it under 1,200 characters."),
  occasionDate: z.string().optional(),
  relationship: z.string().optional(),
});
type PersonalizeValues = z.infer<typeof personalizeSchema>;

function StepPersonalize({
  draft,
  template,
  onSubmit,
  onBack,
  onPhotos,
}: {
  draft: CreateDraft;
  template: Template;
  onSubmit: (v: PersonalizeValues) => void;
  onBack: (v: Partial<PersonalizeValues>) => void;
  onPhotos: (p: CreateDraft["photos"]) => void;
}) {
  const occasion = occasionMap[draft.occasion ?? template.occasion];
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<PersonalizeValues>({
    resolver: zodResolver(personalizeSchema),
    defaultValues: {
      recipientName: draft.recipientName,
      senderName: draft.senderName,
      message: draft.message,
      occasionDate: draft.occasionDate,
      relationship: draft.relationship,
    },
  });
  const message = watch("message") ?? "";
  const recipient = watch("recipientName");
  const memories = draft.experience === "memories";
  const [assist, setAssist] = useState<"write" | "story" | null>(null);

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <StepTitle eyebrow="Step 4" title={<>Make it <em>personal.</em></>} />
      <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-6">
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Their name" htmlFor="recipientName" error={errors.recipientName?.message}>
              <Input id="recipientName" autoComplete="off" placeholder="Maya" aria-invalid={!!errors.recipientName} aria-describedby="recipientName-error" {...register("recipientName")} />
            </Field>
            <Field label="From" htmlFor="senderName" error={errors.senderName?.message}>
              <Input id="senderName" autoComplete="name" placeholder="Jonah" aria-invalid={!!errors.senderName} aria-describedby="senderName-error" {...register("senderName")} />
            </Field>
          </div>
          <Field label="Your message" htmlFor="message" error={errors.message?.message}>
            <Textarea id="message" rows={6} className="font-hand text-[22px] leading-snug" placeholder={occasion.prompts[0]} aria-invalid={!!errors.message} aria-describedby="message-error" {...register("message")} />
            <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap gap-1.5">
                {occasion.prompts.map((p) => (
                  <button key={p} type="button" onClick={() => setValue("message", p, { shouldValidate: true })} className="inline-flex items-center gap-1 rounded-full border border-line bg-paper px-2.5 py-1 text-[12px] text-ink/70 hover:border-ink/30">
                    <Sparkles className="size-3 text-rose" /> {p.length > 32 ? p.slice(0, 32) + "…" : p}
                  </button>
                ))}
              </div>
              <span className={cn("text-[12px] tabular-nums", message.length > 1200 ? "text-rose-deep" : "text-muted")}>{message.length}/1200</span>
            </div>
            <div className="mt-2 flex gap-2">
              <Button type="button" variant="soft" size="sm" onClick={() => setAssist("write")}>
                <Sparkles /> Help me write
              </Button>
              {memories && (
                <Button type="button" variant="ghost" size="sm" onClick={() => setAssist("story")}>
                  Turn memories into a story
                </Button>
              )}
            </div>
            <AiAssistDialog
              open={!!assist}
              onOpenChange={(v) => !v && setAssist(null)}
              mode={assist ?? "write"}
              context={{ occasion: occasion.name, recipient: recipient || draft.recipientName, relationship: watch("relationship"), draft: message || undefined }}
              onUseText={(text) => setValue("message", text.slice(0, 1200), { shouldValidate: true })}
            />
          </Field>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Occasion date (optional)" htmlFor="occasionDate">
              <Input id="occasionDate" type="date" {...register("occasionDate")} />
            </Field>
            <Field label="Relationship (optional)" htmlFor="relationship" hint="Helps us suggest the right words.">
              <Select id="relationship" {...register("relationship")}>
                <option value="">Choose…</option>
                {["Partner", "Friend", "Parent", "Child", "Sibling", "Grandparent", "Colleague", "Teacher", "Someone special"].map((r) => (
                  <option key={r}>{r}</option>
                ))}
              </Select>
            </Field>
          </div>
          <div>
            <p className="mb-1.5 text-[13px] font-medium text-ink/80">Photos {template.photoSlots ? `(this template has ${template.photoSlots} spots)` : "(optional)"}</p>
            <PhotoUploader photos={draft.photos} onChange={onPhotos} withDetails={memories} max={memories ? 12 : 6} cardId={draft.creationId ?? null} />
          </div>
        </div>
        <aside className="hidden lg:block">
          <div className="sticky top-36">
            <div className="overflow-hidden rounded-[18px] shadow-lift">
              <TemplateThumb palette={template.palette} motif={template.motif} headline={template.headline} font={template.font} subline={`for ${recipient || "someone special"}`} size="lg" />
            </div>
            <p className="mt-3 text-center text-[13px] text-muted">{template.name}</p>
          </div>
        </aside>
      </div>
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-ivory/95 backdrop-blur-md">
        <div className="mx-auto flex h-[72px] max-w-6xl items-center justify-between px-5">
          <Button type="button" variant="ghost" onClick={() => onBack(watch())}>
            <ArrowLeft /> Back
          </Button>
          <Button type="submit">
            Continue <ArrowRight />
          </Button>
        </div>
      </div>
    </form>
  );
}

/* ------------------------------------------------------------ Step 5 */

function StepInteraction({ draft, settings, onChange, cardId }: { draft: CreateDraft; settings: InteractionSettings; onChange: (p: Partial<InteractionSettings>) => void; cardId?: string }) {
  const exp = draft.experience ?? "surprise";
  return (
    <>
      <StepTitle eyebrow="Step 5" title={<>Choose the <em>moment</em> they open it.</>} description="Every choice here shows up in the preview next." />
      <InteractionControls experience={exp} settings={settings} onChange={onChange} cardId={cardId ?? null} />
      {exp === "together" && (
        <p className="mt-6 rounded-2xl border border-line bg-paper p-5 text-[14px] leading-relaxed text-muted">
          On the last step you&apos;ll get a contributor link to share. Everyone you invite can add a message, photo or video — you review them before the card is delivered.
        </p>
      )}
    </>
  );
}

/* ------------------------------------------------------------ Step 6 */

function StepPreview({ draft, onEditor, onFullscreen }: { draft: CreateDraft; onEditor: () => void; onFullscreen: () => void }) {
  const creation = useMemo(() => draftToCreation(draft), [draft]);
  const [run, setRun] = useState(0);
  if (!creation) return null;
  return (
    <>
      <StepTitle eyebrow="Step 6" title={<>Here&apos;s what they&apos;ll <em>see.</em></>} description="Tap through it exactly as they will. Want to move things around? Open the designer." />
      <div className="grid items-start gap-10 lg:grid-cols-[1fr_340px]">
        <div className="order-2 space-y-3 lg:order-1">
          {[
            { icon: PenTool, title: "Fine-tune in the designer", body: "Move text, swap photos, add stickers and pages.", action: onEditor, label: "Open designer" },
            { icon: Maximize2, title: "Full-screen preview", body: "Open it in a new tab, just as it will appear on their phone or laptop.", action: onFullscreen, label: "Open preview" },
            { icon: Eye, title: "Replay from the start", body: "See the opening moment again.", action: () => setRun((r) => r + 1), label: "Replay" },
          ].map((x) => (
            <div key={x.title} className="flex items-center gap-4 rounded-2xl border border-line bg-paper p-5">
              <span className="grid size-11 shrink-0 place-items-center rounded-full bg-blush text-burgundy">
                <x.icon className="size-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-medium">{x.title}</p>
                <p className="text-[13.5px] text-muted">{x.body}</p>
              </div>
              <Button variant="outline" size="sm" onClick={x.action}>
                {x.label}
              </Button>
            </div>
          ))}
        </div>
        <div className="order-1 lg:order-2">
          <PhoneFrame>
            <ExperiencePlayer key={run} creation={creation} compact preview />
          </PhoneFrame>
        </div>
      </div>
    </>
  );
}

/* ------------------------------------------------------------ Step 7 */

interface PublishOpts {
  title: string;
  scheduledAt?: string;
  timezone: string;
  deliveryEmail: string;
  branding: boolean;
  allowReactions: boolean;
  deadline: string | null;
  limit: number | null;
  requireApproval: boolean;
}

function StepPublish({
  draft,
  onBack,
  onPublish,
  onCollect,
  signedIn,
}: {
  draft: CreateDraft;
  onBack: () => void;
  onPublish: (o: PublishOpts) => Promise<void>;
  onCollect: (o: PublishOpts & { invites: string[] }) => Promise<string | null>;
  signedIn: boolean;
}) {
  const t = getTemplate(draft.templateId)!;
  const [title, setTitle] = useState(`${t.name} for ${draft.recipientName}`);
  const [when, setWhen] = useState<"now" | "later">("now");
  const [date, setDate] = useState("");
  const [tz, setTz] = useState(userTimezone);
  const [email, setEmail] = useState("");
  const [branding, setBranding] = useState(true);
  const [allowReactions, setAllowReactions] = useState(true);
  const [deadline, setDeadline] = useState("");
  const [limit, setLimit] = useState("");
  const [requireApproval, setRequireApproval] = useState(true);
  const [invites, setInvites] = useState("");
  const [busy, setBusy] = useState<"publish" | "collect" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const together = draft.experience === "together";
  const zones = useMemo(() => timezones(), []);

  const collect = (): PublishOpts | null => {
    setError(null);
    let scheduledAt: string | undefined;
    if (when === "later") {
      if (!date) return setError("Choose when it should be delivered."), null;
      scheduledAt = zonedLocalToUtc(date, tz);
      if (new Date(scheduledAt).getTime() < Date.now() + 60_000) return setError("Choose a time at least a minute from now."), null;
    }
    if (email && !z.string().email().safeParse(email).success) return setError("That recipient email doesn't look right."), null;
    const lim = limit ? Number(limit) : null;
    if (lim !== null && (!Number.isInteger(lim) || lim < 1 || lim > 1000)) return setError("Contributor limit must be between 1 and 1000."), null;
    return {
      title,
      scheduledAt,
      timezone: tz,
      deliveryEmail: email.trim(),
      branding,
      allowReactions,
      deadline: deadline ? zonedLocalToUtc(deadline, tz) : null,
      limit: lim,
      requireApproval,
    };
  };

  const publish = async () => {
    const o = collect();
    if (!o) return;
    setBusy("publish");
    await onPublish(o);
    setBusy(null);
  };

  const getLink = async () => {
    const o = collect();
    if (!o) return;
    const emails = invites.split(/[\s,;]+/).filter(Boolean);
    const bad = emails.find((e) => !z.string().email().safeParse(e).success);
    if (bad) return setError(`"${bad}" doesn't look like an email address.`);
    setBusy("collect");
    setToken(await onCollect({ ...o, invites: emails }));
    setBusy(null);
  };

  return (
    <>
      <StepTitle eyebrow="Step 7" title={<>Ready to make someone&apos;s <em>day?</em></>} />
      <div className="grid gap-10 lg:grid-cols-[1.3fr_1fr]">
        <div className="space-y-6">
          {!signedIn && (
            <p className="rounded-2xl border border-line bg-blush/50 px-4 py-3 text-[14px] text-burgundy">
              You&apos;ll be asked to sign in or create a free account to save and share — your card is kept while you do.
            </p>
          )}
          <Field label="Title (only you see this)" htmlFor="title">
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={80} />
          </Field>

          {together && (
            <fieldset className="space-y-4 rounded-2xl border border-line bg-paper p-5">
              <legend className="px-1 text-[13px] font-medium">1 · Collect messages</legend>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Deadline (optional)" htmlFor="deadline">
                  <Input id="deadline" type="datetime-local" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
                </Field>
                <Field label="Contributor limit (optional)" htmlFor="limit">
                  <Input id="limit" type="number" min={1} max={1000} value={limit} onChange={(e) => setLimit(e.target.value)} placeholder="Your plan's limit" />
                </Field>
              </div>
              <label className="flex items-center justify-between gap-4 text-[14px]">
                <span>
                  Review messages before they appear
                  <span className="block text-[12.5px] text-muted">Recommended — you approve or reject each one.</span>
                </span>
                <Switch checked={requireApproval} onChange={setRequireApproval} label="Review messages before they appear" />
              </label>
              <Field label="Email the invitation to (optional)" htmlFor="invites" hint="Separate emails with commas. You can also share the link anywhere.">
                <Textarea id="invites" value={invites} onChange={(e) => setInvites(e.target.value)} className="min-h-16" placeholder="sam@example.com, priya@example.com" />
              </Field>
              {token ? (
                <SharePanel path={`/together/${token}`} label="Contributor link — share it with everyone" />
              ) : (
                <Button variant="outline" onClick={getLink} loading={busy === "collect"}>
                  <Users /> Get contributor link
                </Button>
              )}
            </fieldset>
          )}

          <div>
            <p className="mb-1.5 text-[13px] font-medium text-ink/80">{together ? "2 · Deliver to the recipient" : "Delivery"}</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {(
                [
                  ["now", "Get the link now", "Share it however you like, whenever you like."],
                  ["later", "Schedule it", "We'll unlock it — and email it if you like — at the exact moment you choose."],
                ] as const
              ).map(([v, l, d]) => (
                <button key={v} type="button" aria-pressed={when === v} onClick={() => setWhen(v)} className={cn("rounded-2xl border p-4 text-left", when === v ? "border-burgundy bg-blush/60" : "border-line bg-paper")}>
                  <span className="flex items-center gap-2 text-[15px] font-medium">
                    {l} {v === "later" && <Badge tone="premium">Pro</Badge>}
                  </span>
                  <span className="mt-0.5 block text-[13px] text-muted">{d}</span>
                </button>
              ))}
            </div>
            {when === "later" && (
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <Input type="datetime-local" aria-label="Delivery date and time" value={date} onChange={(e) => setDate(e.target.value)} />
                <Select aria-label="Timezone" value={tz} onChange={(e) => setTz(e.target.value)}>
                  {zones.map((z) => (
                    <option key={z} value={z}>
                      {z.replace(/_/g, " ")}
                    </option>
                  ))}
                </Select>
                {date && <p className="text-[12.5px] text-muted sm:col-span-2">Arrives {formatInZone(zonedLocalToUtc(date, tz), tz)}.</p>}
              </div>
            )}
          </div>
          <Field label="Recipient's email (optional)" htmlFor="remail" hint={when === "later" ? "We'll email them the link at delivery time." : "We'll email them the link right away."}>
            <Input id="remail" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="maya@example.com" autoComplete="off" />
          </Field>

          <div className="space-y-3 rounded-2xl border border-line bg-paper p-4">
            <label className="flex items-start justify-between gap-4">
              <span>
                <span className="flex items-center gap-2 text-[14px] font-medium">
                  Show &ldquo;Made with Dearly&rdquo; <Badge tone="premium">Premium to remove</Badge>
                </span>
                <span className="text-[12.5px] text-muted">A small signature at the end of the experience.</span>
              </span>
              <Switch checked={branding} onChange={setBranding} label="Show Dearly branding" />
            </label>
            <label className="flex items-start justify-between gap-4">
              <span>
                <span className="text-[14px] font-medium">Let them reply</span>
                <span className="block text-[12.5px] text-muted">Reactions and a short thank-you note at the end.</span>
              </span>
              <Switch checked={allowReactions} onChange={setAllowReactions} label="Allow reactions" />
            </label>
          </div>
          {error && (
            <p role="alert" className="rounded-xl bg-blush px-4 py-3 text-[14px] text-rose-deep">
              {error}
            </p>
          )}
          <div className="flex flex-col-reverse gap-2 sm:flex-row">
            <Button variant="ghost" size="lg" onClick={onBack}>
              <ArrowLeft /> Back to preview
            </Button>
            <Button size="lg" onClick={publish} loading={busy === "publish"} className="sm:ml-auto">
              {when === "later" ? "Schedule delivery" : together ? "Deliver now" : "Publish & get link"} {busy !== "publish" && <PartyPopper />}
            </Button>
          </div>
        </div>
        <div className="hidden lg:block">
          <div className="overflow-hidden rounded-[18px] shadow-lift">
            <TemplateThumb palette={t.palette} motif={t.motif} headline={t.headline} font={t.font} subline={`for ${draft.recipientName}`} size="lg" />
          </div>
        </div>
      </div>
    </>
  );
}

function Published({ creation, onNew }: { creation: Creation; onNew: () => void }) {
  const together = creation.interaction.mode === "group";
  return (
    <div className="mx-auto max-w-2xl text-center">
      <motion.div initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 200, damping: 14 }} className="mx-auto mb-6 grid size-16 place-items-center rounded-full bg-burgundy text-ivory">
        <Check className="size-7" />
      </motion.div>
      <h1 className="font-display text-5xl leading-none sm:text-6xl">{creation.status === "scheduled" ? "It's scheduled." : "It's ready."}</h1>
      <p className="mx-auto mt-4 max-w-md text-[16px] text-muted">
        {creation.status === "scheduled"
          ? "We'll unlock it at the moment you chose. You can share the link now — it stays sealed until then."
          : `Send it to ${creation.recipientName} however you like. They won't need an account to open it.`}
      </p>
      <div className="mt-10 space-y-6 rounded-[22px] border border-line bg-paper p-6 text-left">
        <SharePanel path={`/card/${creation.slug}`} recipient={creation.recipientName} />
        {together && creation.contributionToken && <SharePanel path={`/together/${creation.contributionToken}`} label="Contributor link — ask everyone to sign" />}
      </div>
      <div className="mt-8 flex flex-col justify-center gap-2 sm:flex-row">
        <Button asChild variant="outline">
          <Link href={`/card/${creation.slug}?preview=${creation.id}`} target="_blank">
            <Eye /> Open it
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link href={`/editor/${creation.id}`}>
            <PenTool /> Keep editing
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/dashboard">My creations</Link>
        </Button>
        <Button onClick={onNew}>Make another</Button>
      </div>
    </div>
  );
}


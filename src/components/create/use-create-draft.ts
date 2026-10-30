"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { buildCreation } from "@/lib/creation";
import { getTemplate, templates } from "@/lib/data/templates";
import type { Creation, ExperienceKind, InteractionMode, InteractionSettings, OccasionSlug, Photo, Template, TemplateCategory } from "@/lib/types";

/** Experience types offered in the wizard and the template categories they draw from. */
export const experienceCategories: Record<string, TemplateCategory[]> = {
  classic: ["classic-cards"],
  surprise: ["interactive-surprises", "love-letters", "time-capsules"],
  memories: ["memory-books"],
  video: ["video-greetings"],
  together: ["group-cards"],
};

export function createKindForTemplate(t: Template): ExperienceKind {
  const entry = Object.entries(experienceCategories).find(([, cats]) => cats.includes(t.category));
  return (entry?.[0] as ExperienceKind) ?? "surprise";
}

export interface CreateDraft {
  step: number;
  occasion?: OccasionSlug;
  experience?: ExperienceKind;
  templateId?: string;
  recipientName: string;
  senderName: string;
  message: string;
  occasionDate: string;
  relationship: string;
  photos: Photo[];
  interaction: Partial<InteractionSettings>;
  creationId?: string;
  slug?: string;
}

const KEY = "dearly:create-draft";

export const emptyDraft: CreateDraft = {
  step: 0,
  recipientName: "",
  senderName: "",
  message: "",
  occasionDate: "",
  relationship: "",
  photos: [],
  interaction: {},
};

export function templatesFor(draft: Pick<CreateDraft, "occasion" | "experience">) {
  const cats = draft.experience ? experienceCategories[draft.experience] ?? [] : [];
  const byExp = templates.filter((t) => !cats.length || cats.includes(t.category));
  const exact = byExp.filter((t) => !draft.occasion || t.occasion === draft.occasion);
  return { exact, others: byExp.filter((t) => !exact.includes(t)) };
}

/** Builds the full creation that the preview and publish steps use. */
export function draftToCreation(d: CreateDraft): Creation | null {
  const t = getTemplate(d.templateId);
  if (!t) return null;
  const mode = (d.interaction.mode ?? t.interactions[0]) as InteractionMode;
  const c = buildCreation({
    template: { ...t, occasion: d.occasion ?? t.occasion },
    recipientName: d.recipientName,
    senderName: d.senderName,
    message: d.message || undefined,
    occasionDate: d.occasionDate || undefined,
    relationship: d.relationship || undefined,
    photos: d.photos,
    interaction: { ...d.interaction, mode },
    slug: d.slug,
  });
  if (d.creationId) c.id = d.creationId;
  if (d.experience === "together") c.interaction.mode = "group";
  if (d.experience === "video") c.interaction.mode = "video";
  return c;
}

export function useCreateDraft() {
  const [draft, setDraft] = useState<CreateDraft>(emptyDraft);
  const [ready, setReady] = useState(false);
  const initialised = useRef(false);

  useEffect(() => {
    // Runs once (guards against StrictMode's double effect, which would re-read the stripped URL).
    if (initialised.current) return;
    initialised.current = true;
    let initial = emptyDraft;
    try {
      const raw = sessionStorage.getItem(KEY);
      if (raw) initial = { ...emptyDraft, ...JSON.parse(raw) };
    } catch {}
    const sp = new URLSearchParams(window.location.search);
    const t = getTemplate(sp.get("template"));
    const occ = sp.get("occasion") as OccasionSlug | null;
    const exp = sp.get("experience") as ExperienceKind | null;
    const mode = sp.get("mode") as InteractionMode | null;
    if (t) {
      initial = { ...initial, templateId: t.id, occasion: t.occasion, experience: createKindForTemplate(t), interaction: { mode: t.interactions[0] }, step: 3, creationId: undefined, slug: undefined };
    } else if (occ || exp) {
      initial = {
        ...initial,
        occasion: occ ?? initial.occasion,
        experience: exp ?? initial.experience,
        interaction: mode ? { ...initial.interaction, mode } : initial.interaction,
        templateId: undefined,
        step: occ && exp ? 2 : occ ? 1 : 0,
        creationId: undefined,
        slug: undefined,
      };
    }
    setDraft(initial);
    setReady(true);
    if (sp.size) window.history.replaceState(null, "", window.location.pathname);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      sessionStorage.setItem(KEY, JSON.stringify(draft));
    } catch {
      // Photos may exceed session storage; the in-memory draft still works.
    }
  }, [draft, ready]);

  const update = useCallback((patch: Partial<CreateDraft>) => setDraft((d) => ({ ...d, ...patch })), []);
  const reset = useCallback(() => {
    sessionStorage.removeItem(KEY);
    setDraft(emptyDraft);
  }, []);

  return { draft, update, reset, ready };
}

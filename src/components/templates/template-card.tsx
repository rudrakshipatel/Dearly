"use client";

import { motion } from "framer-motion";
import { Crown, Eye, Sparkles } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { buildCreation, seededIds } from "@/lib/creation";
import { occasionMap } from "@/lib/data/occasions";
import { interactionLabels } from "@/lib/data/experiences";
import type { Template } from "@/lib/types";
import { cn } from "@/lib/utils";
import { TemplateThumb } from "../art/template-thumb";
import { ExperiencePlayer } from "../experiences/player";
import { Button } from "../ui/button";
import { Dialog, DialogContent } from "../ui/dialog";
import { Badge } from "../ui/misc";
import { PhoneFrame } from "./phone-frame";

export function TemplateCard({ template, className, priority }: { template: Template; className?: string; priority?: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <motion.article
      layout
      initial={priority ? false : { opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.45 }}
      className={cn("group flex flex-col", className)}
    >
      <div className="relative overflow-hidden rounded-[18px] border border-line bg-paper shadow-soft transition-shadow duration-300 group-hover:shadow-lift">
        <div className="transition-transform duration-500 group-hover:scale-[1.025]">
          <TemplateThumb palette={template.palette} motif={template.motif} headline={template.headline} font={template.font} />
        </div>
        <div className="absolute left-3 top-3 flex gap-1.5">
          {template.premium ? (
            <Badge tone="premium">
              <Crown className="size-3" /> Premium
            </Badge>
          ) : (
            <Badge tone="free">Free</Badge>
          )}
        </div>
        {template.interactive && (
          <Badge tone="dark" className="absolute right-3 top-3">
            <Sparkles className="size-3" /> {interactionLabels[template.interactions[0]].label}
          </Badge>
        )}
        <div className="absolute inset-x-3 bottom-3 flex translate-y-0 gap-2 opacity-100 transition-all duration-300 sm:translate-y-2 sm:opacity-0 sm:group-focus-within:translate-y-0 sm:group-focus-within:opacity-100 sm:group-hover:translate-y-0 sm:group-hover:opacity-100">
          <Button variant="outline" size="sm" className="flex-1 bg-paper/95 backdrop-blur" onClick={() => setOpen(true)}>
            <Eye /> Preview
          </Button>
          <Button asChild size="sm" className="flex-1">
            <Link href={`/create?template=${template.id}`}>Use template</Link>
          </Button>
        </div>
      </div>
      <div className="mt-3 flex items-start justify-between gap-3 px-0.5">
        <div className="min-w-0">
          <h3 className="truncate text-[15px] font-medium text-ink">{template.name}</h3>
          <p className="text-[13px] text-muted">
            {occasionMap[template.occasion].name} · <span className="capitalize">{template.style}</span>
          </p>
        </div>
        <span className="shrink-0 pt-0.5 text-[12px] text-muted">{template.pages} pg</span>
      </div>
      <TemplatePreviewDialog template={template} open={open} onOpenChange={setOpen} />
    </motion.article>
  );
}

export function TemplatePreviewDialog({ template, open, onOpenChange }: { template: Template; open: boolean; onOpenChange: (v: boolean) => void }) {
  const creation = useMemo(
    () =>
      buildCreation({
        template,
        recipientName: "Maya",
        senderName: "Jonah",
        message: occasionMap[template.occasion].prompts[0] + " I hope today feels as lovely as you make every day feel for everyone around you.",
        photos: template.photoSlots
          ? [
              { id: "a", src: "scene:sunset", caption: "golden hour" },
              { id: "b", src: "scene:picnic", caption: "that picnic" },
              { id: "c", src: "scene:beach", caption: "saltwater" },
            ].slice(0, Math.max(1, Math.min(3, template.photoSlots)))
          : [],
        now: "2026-01-01T00:00:00.000Z",
        id: seededIds(template.id),
        interaction: template.category === "time-capsules" ? { unlockAt: "2027-01-01T00:00:00.000Z" } : undefined,
      }),
    [template],
  );
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent title={template.name} description={template.description} size="lg">
        <div className="grid items-center gap-8 md:grid-cols-[1fr_300px]">
          <div className="order-2 md:order-1">
            <dl className="grid grid-cols-2 gap-x-6 gap-y-4 text-sm">
              {[
                ["Occasion", occasionMap[template.occasion].name],
                ["Style", template.style],
                ["Interaction", interactionLabels[template.interactions[0]].label],
                ["Pages", String(template.pages)],
                ["Photo slots", String(template.photoSlots)],
                ["Plan", template.premium ? "Premium" : "Free"],
              ].map(([k, v]) => (
                <div key={k}>
                  <dt className="eyebrow">{k}</dt>
                  <dd className="mt-1 capitalize text-ink">{v}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-6 text-sm leading-relaxed text-muted">
              This is a live preview with sample names and photos. Tap through it exactly as your recipient will — then make it yours.
            </p>
            <div className="mt-6 flex flex-col gap-2 sm:flex-row">
              <Button asChild size="lg">
                <Link href={`/create?template=${template.id}`}>Use this template</Link>
              </Button>
              <Button variant="outline" size="lg" onClick={() => onOpenChange(false)}>
                Keep browsing
              </Button>
            </div>
          </div>
          <div className="order-1 md:order-2">{open && <PhoneFrame className="max-w-[280px]"><ExperiencePlayer creation={creation} compact preview /></PhoneFrame>}</div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

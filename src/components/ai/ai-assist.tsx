"use client";

import { Crown, Loader2, Sparkles, Wand2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { getTemplate } from "@/lib/data/templates";
import { palettes } from "@/lib/data/palettes";
import { useUser } from "@/lib/hooks";
import { aiService, ApiClientError } from "@/lib/services";
import { cn } from "@/lib/utils";
import { Button } from "../ui/button";
import { Dialog, DialogContent } from "../ui/dialog";
import { Field, Input, Select, Textarea } from "../ui/form";
import { Chip } from "../ui/misc";

const TONES = ["heartfelt", "emotional", "romantic", "funny", "playful", "poetic", "formal"] as const;
type Tone = (typeof TONES)[number];

export type AiAssistMode = "write" | "story" | "caption" | "design";

interface DesignSuggestion {
  palette: string;
  templateId: string;
  font: string;
  layout: string;
  decorations: string[];
  rationale: string;
}

/**
 * Optional writing & design help. Everything runs through /api/ai (keys stay on the server,
 * usage is counted against the plan) and nothing is applied until the user picks a suggestion.
 */
export function AiAssistDialog({
  open,
  onOpenChange,
  mode = "write",
  context,
  onUseText,
  onUseDesign,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  mode?: AiAssistMode;
  context: { occasion?: string; recipient?: string; relationship?: string; draft?: string; photoCaption?: string };
  onUseText?: (text: string) => void;
  onUseDesign?: (s: DesignSuggestion) => void;
}) {
  const user = useUser();
  const [kind, setKind] = useState<"message" | "poem">("message");
  const [tone, setTone] = useState<Tone>("heartfelt");
  const [length, setLength] = useState<"short" | "medium" | "long">("medium");
  const [details, setDetails] = useState("");
  const [memories, setMemories] = useState("");
  const [description, setDescription] = useState(context.photoCaption ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<{ message: string; upgrade?: boolean } | null>(null);
  const [results, setResults] = useState<string[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [design, setDesign] = useState<DesignSuggestion | null>(null);
  const [remaining, setRemaining] = useState<number | null>(null);

  const run = async () => {
    setBusy(true);
    setError(null);
    setResults([]);
    setDesign(null);
    try {
      const occasion = context.occasion ?? "just because";
      const recipient = context.recipient || "someone special";
      let req: Record<string, unknown>;
      if (mode === "design") req = { kind: "design", description: details };
      else if (mode === "caption") req = { kind: "caption", occasion, description, tone };
      else if (mode === "story") req = { kind: "story", recipient, tone, memories: memories.split("\n").map((m) => m.trim()).filter(Boolean).slice(0, 10) };
      else if (kind === "poem") req = { kind: "poem", occasion, recipient, tone, context: details || undefined };
      else req = { kind: "message", occasion, recipient, relationship: context.relationship || undefined, tone, length, context: details || undefined, draft: context.draft || undefined };

      const res = await aiService.generate<Record<string, unknown>>(req as { kind: "message" });
      setRemaining(res.remaining);
      const o = res.output;
      if (res.kind === "message") {
        setResults(o.versions as string[]);
        setSuggestions((o.suggestions as string[]) ?? []);
      } else if (res.kind === "poem") setResults([`${o.title}\n\n${o.poem}`]);
      else if (res.kind === "story") setResults([o.story as string]);
      else if (res.kind === "caption") setResults(o.captions as string[]);
      else setDesign(o as unknown as DesignSuggestion);
    } catch (e) {
      if (e instanceof ApiClientError) setError({ message: e.message, upgrade: e.isEntitlement });
      else setError({ message: "Something went wrong. Please try again." });
    } finally {
      setBusy(false);
    }
  };

  const title = mode === "design" ? "Design ideas" : mode === "caption" ? "Caption ideas" : mode === "story" ? "Turn memories into a story" : "Help me write";
  const t = design ? getTemplate(design.templateId) : undefined;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent title={title} description="Suggestions only — edit anything before you use it." size="lg">
        {!user ? (
          <p className="text-[14px] text-muted">
            <Link href="/sign-in" className="text-burgundy underline">
              Sign in
            </Link>{" "}
            to use the writing assistant.
          </p>
        ) : (
          <div className="space-y-5">
            {mode === "write" && (
              <div className="flex gap-2">
                <Chip active={kind === "message"} onClick={() => setKind("message")}>
                  Message
                </Chip>
                <Chip active={kind === "poem"} onClick={() => setKind("poem")}>
                  Short poem
                </Chip>
              </div>
            )}
            {mode !== "design" && (
              <div>
                <p className="mb-1.5 text-[13px] font-medium text-ink/80">Tone</p>
                <div className="flex flex-wrap gap-1.5">
                  {TONES.map((x) => (
                    <Chip key={x} active={tone === x} onClick={() => setTone(x)}>
                      <span className="capitalize">{x}</span>
                    </Chip>
                  ))}
                </div>
              </div>
            )}
            {mode === "write" && kind === "message" && (
              <Field label="Length" htmlFor="ai-len">
                <Select id="ai-len" value={length} onChange={(e) => setLength(e.target.value as typeof length)} className="sm:w-48">
                  <option value="short">Short</option>
                  <option value="medium">Medium</option>
                  <option value="long">Long</option>
                </Select>
              </Field>
            )}
            {(mode === "write" || mode === "design") && (
              <Field label={mode === "design" ? "Describe the card you imagine" : "Anything to include? (optional)"} htmlFor="ai-ctx">
                <Textarea id="ai-ctx" value={details} onChange={(e) => setDetails(e.target.value)} maxLength={600} className="min-h-20" placeholder={mode === "design" ? "A cosy autumn birthday card for my grandma who loves gardening" : "Inside jokes, shared memories, what they mean to you…"} />
              </Field>
            )}
            {mode === "story" && (
              <Field label="A few memories, one per line" htmlFor="ai-mem">
                <Textarea id="ai-mem" value={memories} onChange={(e) => setMemories(e.target.value)} className="min-h-28" placeholder={"Our first road trip to the coast\nThe night we got lost in Lisbon\nSunday pancakes"} />
              </Field>
            )}
            {mode === "caption" && (
              <Field label="What's in the photo?" htmlFor="ai-desc">
                <Input id="ai-desc" value={description} onChange={(e) => setDescription(e.target.value)} maxLength={300} placeholder="Us laughing on the beach at sunset" />
              </Field>
            )}
            <Button onClick={run} loading={busy} disabled={(mode === "design" && details.trim().length < 4) || (mode === "story" && !memories.trim()) || (mode === "caption" && description.trim().length < 2)}>
              {!busy && <Wand2 />} {results.length || design ? "Try again" : "Suggest"}
            </Button>

            {error && (
              <div role="alert" className="rounded-2xl bg-blush px-4 py-3 text-[14px] text-burgundy">
                {error.message}
                {error.upgrade && (
                  <Link href="/pricing" className="ml-2 inline-flex items-center gap-1 font-medium underline">
                    <Crown className="size-3.5" /> See Pro
                  </Link>
                )}
              </div>
            )}

            {busy && (
              <p className="flex items-center gap-2 text-[14px] text-muted">
                <Loader2 className="size-4 animate-spin" /> Writing…
              </p>
            )}

            {results.length > 0 && (
              <ul className="space-y-3">
                {results.map((r, i) => (
                  <li key={i} className="rounded-2xl border border-line bg-ivory p-4">
                    <p className="whitespace-pre-wrap font-hand text-xl leading-snug">{r}</p>
                    {onUseText && (
                      <Button
                        size="sm"
                        className="mt-3"
                        onClick={() => {
                          onUseText(r);
                          onOpenChange(false);
                        }}
                      >
                        <Sparkles /> Use this
                      </Button>
                    )}
                  </li>
                ))}
              </ul>
            )}
            {suggestions.length > 0 && (
              <div>
                <p className="eyebrow mb-2">Editing ideas</p>
                <ul className="list-disc space-y-1 pl-5 text-[14px] text-muted">
                  {suggestions.map((s) => (
                    <li key={s}>{s}</li>
                  ))}
                </ul>
              </div>
            )}

            {design && (
              <div className="rounded-2xl border border-line bg-ivory p-4">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="flex gap-1">
                    {["bg", "accent", "accent2", "deep"].map((k) => (
                      <span key={k} className="size-6 rounded-full border border-ink/10" style={{ background: (palettes[design.palette as keyof typeof palettes] as unknown as Record<string, string>)?.[k] }} />
                    ))}
                  </span>
                  <span className="text-[14px] font-medium">{t?.name ?? design.templateId}</span>
                  <span className={cn("text-[13px] text-muted capitalize")}>
                    {design.font} type · {design.layout.replace("-", " ")}
                  </span>
                </div>
                <p className="mt-3 text-[14px] leading-relaxed">{design.rationale}</p>
                {design.decorations.length > 0 && <p className="mt-2 text-[13px] text-muted">Decorations: {design.decorations.join(", ")}</p>}
                {onUseDesign && (
                  <Button
                    size="sm"
                    className="mt-3"
                    onClick={() => {
                      onUseDesign(design);
                      onOpenChange(false);
                    }}
                  >
                    Use this template
                  </Button>
                )}
              </div>
            )}
            {remaining !== null && <p className="text-[12px] text-muted">{remaining} AI generations left this month.</p>}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

import "server-only";
import { z } from "zod";
import { paletteList } from "@/lib/data/palettes";
import { templates } from "@/lib/data/templates";
import { NotConfiguredError, serverEnv } from "./config";
import { ApiError } from "./http";

export const AI_TONES = ["emotional", "romantic", "funny", "heartfelt", "formal", "playful", "poetic"] as const;

const person = z.string().trim().max(60);
export const aiRequest = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("message"),
    occasion: z.string().max(40),
    recipient: person,
    relationship: z.string().max(40).optional(),
    tone: z.enum(AI_TONES),
    context: z.string().max(600).optional(),
    length: z.enum(["short", "medium", "long"]).default("medium"),
    draft: z.string().max(1200).optional(),
  }),
  z.object({ kind: z.literal("poem"), occasion: z.string().max(40), recipient: person, tone: z.enum(AI_TONES), context: z.string().max(600).optional() }),
  z.object({ kind: z.literal("story"), recipient: person, memories: z.array(z.string().max(300)).min(1).max(10), tone: z.enum(AI_TONES).default("heartfelt") }),
  z.object({ kind: z.literal("caption"), occasion: z.string().max(40).optional(), description: z.string().min(2).max(300), tone: z.enum(AI_TONES).default("playful") }),
  z.object({ kind: z.literal("design"), description: z.string().min(4).max(600) }),
]);
export type AiRequest = z.infer<typeof aiRequest>;

const outputs = {
  message: z.object({ versions: z.array(z.string().max(1500)).min(1).max(3), suggestions: z.array(z.string().max(200)).max(4).default([]) }),
  poem: z.object({ title: z.string().max(80), poem: z.string().max(1200) }),
  story: z.object({ story: z.string().max(2500) }),
  caption: z.object({ captions: z.array(z.string().max(80)).min(1).max(5) }),
  design: z.object({
    palette: z.string(),
    templateId: z.string(),
    font: z.enum(["display", "sans", "hand", "script"]),
    layout: z.enum(["single-photo", "photo-grid", "polaroid-stack", "timeline", "text-only"]),
    decorations: z.array(z.string().max(30)).max(6).default([]),
    rationale: z.string().max(400),
  }),
};
export type AiOutput = { [K in AiRequest["kind"]]: z.infer<(typeof outputs)[K]> };

function prompt(r: AiRequest): { system: string; user: string } {
  const base =
    "You write for Dearly, a warm digital greeting-card app. Write in natural, inclusive English, never mention being an AI, avoid clichés and emojis, and never invent private facts. Respond only with JSON matching the requested shape.";
  switch (r.kind) {
    case "message":
      return {
        system: base,
        user: `Write 3 alternative ${r.length} card messages (short ≈ 25 words, medium ≈ 60, long ≈ 120) for a ${r.occasion} card to ${r.recipient}${r.relationship ? ` (my ${r.relationship})` : ""}. Tone: ${r.tone}.${r.context ? ` Context: ${r.context}.` : ""}${r.draft ? ` Improve on this draft while keeping its meaning: "${r.draft}".` : ""} Also give up to 3 short editing suggestions. JSON: {"versions": string[], "suggestions": string[]}`,
      };
    case "poem":
      return { system: base, user: `Write a short (8–12 line) ${r.tone} poem for a ${r.occasion} card to ${r.recipient}.${r.context ? ` Details: ${r.context}.` : ""} JSON: {"title": string, "poem": string} (use \\n for line breaks)` };
    case "story":
      return { system: base, user: `Turn these memories with ${r.recipient} into a short ${r.tone} narrative (120–200 words) for a memory book, in the second person ("you"): ${r.memories.map((m, i) => `${i + 1}. ${m}`).join(" ")} JSON: {"story": string}` };
    case "caption":
      return { system: base, user: `Suggest 5 short ${r.tone} photo captions (max 8 words each)${r.occasion ? ` for a ${r.occasion} card` : ""}. The photo shows: ${r.description}. JSON: {"captions": string[]}` };
    case "design":
      return {
        system: base,
        user: `Suggest a design for this card request: "${r.description}". Choose ONLY from these palettes: ${paletteList.map((p) => `${p.id} (${p.name})`).join(", ")}. Choose ONLY from these template ids: ${templates.map((t) => `${t.id} (${t.name}, ${t.occasion}, ${t.style})`).join("; ")}. Fonts: display|sans|hand|script. Layout: single-photo|photo-grid|polaroid-stack|timeline|text-only. Decorations from: heart, star, sparkles, flower, cake, gift, moon, sun, leaf, crown, party, music, camera, coffee, plane, tree, snowflake, gem, feather, smile. JSON: {"palette": string, "templateId": string, "font": string, "layout": string, "decorations": string[], "rationale": string}`,
      };
  }
}

/** Approximate USD per 1M tokens, for cost tracking only. */
const PRICES: Record<string, [number, number]> = { "gpt-4.1-mini": [0.4, 1.6], "gpt-4o-mini": [0.15, 0.6], "gemini-2.5-flash": [0.3, 2.5] };

export interface AiResult<K extends AiRequest["kind"] = AiRequest["kind"]> {
  output: AiOutput[K];
  provider: "openai" | "gemini";
  model: string;
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
}

async function moderate(text: string) {
  if (!serverEnv.openaiApiKey) return false;
  const res = await fetch("https://api.openai.com/v1/moderations", {
    method: "POST",
    headers: { Authorization: `Bearer ${serverEnv.openaiApiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: "omni-moderation-latest", input: text }),
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) return false;
  const data = (await res.json()) as { results?: { flagged: boolean }[] };
  return !!data.results?.[0]?.flagged;
}

export class AiBlockedError extends ApiError {
  constructor() {
    super(422, "We can't help with that request. Try rephrasing it.", "ai_blocked");
  }
}

export async function generate(r: AiRequest): Promise<AiResult> {
  if (!serverEnv.openaiApiKey && !serverEnv.geminiApiKey) throw new NotConfiguredError("AI writing", "OPENAI_API_KEY or GEMINI_API_KEY");
  const { system, user } = prompt(r);
  if (await moderate(JSON.stringify(r))) throw new AiBlockedError();

  let text = "";
  let provider: AiResult["provider"];
  let model: string;
  let inputTokens = 0;
  let outputTokens = 0;
  try {
    if (serverEnv.openaiApiKey) {
      provider = "openai";
      model = serverEnv.openaiModel;
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${serverEnv.openaiApiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model, temperature: r.kind === "design" ? 0.4 : 0.9, response_format: { type: "json_object" }, max_tokens: 900, messages: [{ role: "system", content: system }, { role: "user", content: user }] }),
        signal: AbortSignal.timeout(25000),
      });
      if (!res.ok) throw new Error(`OpenAI ${res.status}`);
      const data = (await res.json()) as { choices: { message: { content: string }; finish_reason: string }[]; usage?: { prompt_tokens: number; completion_tokens: number } };
      if (data.choices[0]?.finish_reason === "content_filter") throw new AiBlockedError();
      text = data.choices[0]?.message.content ?? "";
      inputTokens = data.usage?.prompt_tokens ?? 0;
      outputTokens = data.usage?.completion_tokens ?? 0;
    } else {
      provider = "gemini";
      model = serverEnv.geminiModel;
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
        method: "POST",
        headers: { "x-goog-api-key": serverEnv.geminiApiKey, "Content-Type": "application/json" },
        body: JSON.stringify({ systemInstruction: { parts: [{ text: system }] }, contents: [{ role: "user", parts: [{ text: user }] }], generationConfig: { responseMimeType: "application/json", maxOutputTokens: 900, temperature: 0.9 } }),
        signal: AbortSignal.timeout(25000),
      });
      if (!res.ok) throw new Error(`Gemini ${res.status}`);
      const data = (await res.json()) as { candidates?: { content?: { parts?: { text: string }[] }; finishReason?: string }[]; usageMetadata?: { promptTokenCount: number; candidatesTokenCount: number }; promptFeedback?: { blockReason?: string } };
      if (data.promptFeedback?.blockReason || data.candidates?.[0]?.finishReason === "SAFETY") throw new AiBlockedError();
      text = data.candidates?.[0]?.content?.parts?.map((p) => p.text).join("") ?? "";
      inputTokens = data.usageMetadata?.promptTokenCount ?? 0;
      outputTokens = data.usageMetadata?.candidatesTokenCount ?? 0;
    }
  } catch (e) {
    if (e instanceof ApiError) throw e;
    if (e instanceof Error && e.name === "TimeoutError") throw new ApiError(504, "The writing assistant took too long. Please try again.", "ai_timeout");
    throw new ApiError(502, "The writing assistant is unavailable right now. Please try again shortly.", "ai_unavailable");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new ApiError(502, "The assistant returned something unexpected. Please try again.", "ai_bad_output");
  }
  const out = outputs[r.kind].safeParse(parsed);
  if (!out.success) throw new ApiError(502, "The assistant returned something unexpected. Please try again.", "ai_bad_output");
  let output = out.data as AiOutput[typeof r.kind];
  if (r.kind === "design") {
    const d = output as AiOutput["design"];
    // Only return suggestions that exist in the product.
    output = {
      ...d,
      palette: paletteList.some((p) => p.id === d.palette) ? d.palette : "rose-cream",
      templateId: templates.some((t) => t.id === d.templateId) ? d.templateId : templates[0].id,
    } as AiOutput[typeof r.kind];
  }
  const [pin, pout] = PRICES[model] ?? [0, 0];
  return { output, provider, model, inputTokens, outputTokens, costUsd: (inputTokens * pin + outputTokens * pout) / 1_000_000 };
}

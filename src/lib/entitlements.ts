/**
 * The single source of truth for what each plan can do.
 * The same numbers are written to the `plan_limits` table by the seed (scripts/generate-seed.ts),
 * where database triggers and publish_card() enforce them for every write path.
 * The app reads them here for UX (upgrade prompts, counters) and server-side pre-checks.
 */
import type { PlanId } from "./types";

const MB = 1024 * 1024;
const GB = 1024 * MB;

export interface PlanLimits {
  maxLiveCards: number;
  maxPhotosPerCard: number;
  maxPages: number;
  maxVideoSeconds: number;
  allowVideoAudio: boolean;
  allowPremiumTemplates: boolean;
  allowRemoveBranding: boolean;
  allowScheduling: boolean;
  maxGroupContributors: number;
  aiGenerationsPerMonth: number;
  storageBytes: number;
  maxImageBytes: number;
  maxVideoBytes: number;
  maxAudioBytes: number;
}

export const PLAN_LIMITS: Record<PlanId, PlanLimits> = {
  free: {
    maxLiveCards: 10,
    maxPhotosPerCard: 3,
    maxPages: 3,
    maxVideoSeconds: 0,
    allowVideoAudio: false,
    allowPremiumTemplates: false,
    allowRemoveBranding: false,
    allowScheduling: false,
    maxGroupContributors: 5,
    aiGenerationsPerMonth: 0,
    storageBytes: 500 * MB,
    maxImageBytes: 10 * MB,
    maxVideoBytes: 50 * MB,
    maxAudioBytes: 20 * MB,
  },
  premium: {
    maxLiveCards: 50,
    maxPhotosPerCard: 30,
    maxPages: 12,
    maxVideoSeconds: 120,
    allowVideoAudio: true,
    allowPremiumTemplates: true,
    allowRemoveBranding: true,
    allowScheduling: false,
    maxGroupContributors: 50,
    aiGenerationsPerMonth: 0,
    storageBytes: 10 * GB,
    maxImageBytes: 10 * MB,
    maxVideoBytes: 50 * MB,
    maxAudioBytes: 20 * MB,
  },
  pro: {
    maxLiveCards: 1000,
    maxPhotosPerCard: 100,
    maxPages: 30,
    maxVideoSeconds: 300,
    allowVideoAudio: true,
    allowPremiumTemplates: true,
    allowRemoveBranding: true,
    allowScheduling: true,
    maxGroupContributors: 1000,
    aiGenerationsPerMonth: 300,
    storageBytes: 50 * GB,
    maxImageBytes: 10 * MB,
    maxVideoBytes: 50 * MB,
    maxAudioBytes: 20 * MB,
  },
};

/** One-time purchases and what they unlock. */
export const ONE_TIME_PRODUCTS = {
  premium_card: { label: "Premium card", description: "Unlock Premium features for one card.", unlocks: "premium" as const },
  group_card: { label: "Group card", description: "Up to 200 contributors on one group card.", unlocks: "group" as const },
  special_experience: { label: "Special experience", description: "Premium experiences and media for one card.", unlocks: "premium" as const },
};
export type OneTimeProduct = keyof typeof ONE_TIME_PRODUCTS;

export type Feature =
  | "premium_templates"
  | "remove_branding"
  | "video_audio"
  | "scheduling"
  | "ai";

/** The lowest plan that includes a feature — used for upgrade prompts. */
export const FEATURE_PLAN: Record<Feature, PlanId> = {
  premium_templates: "premium",
  remove_branding: "premium",
  video_audio: "premium",
  scheduling: "pro",
  ai: "pro",
};

export function can(plan: PlanId, feature: Feature): boolean {
  const l = PLAN_LIMITS[plan];
  switch (feature) {
    case "premium_templates":
      return l.allowPremiumTemplates;
    case "remove_branding":
      return l.allowRemoveBranding;
    case "video_audio":
      return l.allowVideoAudio;
    case "scheduling":
      return l.allowScheduling;
    case "ai":
      return l.aiGenerationsPerMonth > 0;
  }
}

export const MEDIA_RULES = {
  image: { mimes: ["image/jpeg", "image/png", "image/webp"], ext: ["jpg", "jpeg", "png", "webp"] },
  video: { mimes: ["video/mp4", "video/webm"], ext: ["mp4", "webm"] },
  audio: { mimes: ["audio/mpeg", "audio/mp4", "audio/x-m4a", "audio/webm", "audio/ogg", "audio/wav"], ext: ["mp3", "m4a", "webm", "ogg", "wav"] },
} as const;
export type MediaKind = keyof typeof MEDIA_RULES;

export function mediaKindFor(mime: string): MediaKind | null {
  for (const k of Object.keys(MEDIA_RULES) as MediaKind[]) {
    if ((MEDIA_RULES[k].mimes as readonly string[]).includes(mime)) return k;
  }
  return null;
}

export function maxBytesFor(plan: PlanId, kind: MediaKind) {
  const l = PLAN_LIMITS[plan];
  return kind === "image" ? l.maxImageBytes : kind === "video" ? l.maxVideoBytes : l.maxAudioBytes;
}

export function formatBytes(n: number) {
  if (n >= GB) return `${Math.round((n / GB) * 10) / 10} GB`;
  return `${Math.round(n / MB)} MB`;
}

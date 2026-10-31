"use client";

/**
 * Browser-side service layer. Every function talks to the real backend: Supabase Auth directly,
 * public card functions through RLS-safe RPCs, and everything else through Dearly's API routes.
 */
import { api, ApiClientError } from "../api-client";
import type { CardSummary } from "@/server/cards";
import { pricing } from "../data/pricing";
import type { PlanLimits, OneTimeProduct } from "../entitlements";
import { publicEnv } from "../env";
import { prepareAudio, prepareImage, prepareVideo, putWithProgress } from "../media/process";
import { primeMedia } from "../media/resolver";
import { supabaseBrowser } from "../supabase/client";
import type { Contribution, Creation, PlanId, RegionCode, User } from "../types";

export type { CardSummary };

/* ------------------------------------------------------------------ session id */

/** Anonymous, random per-browser id used only for view de-duplication and rate limiting. */
export function viewerSession() {
  try {
    let id = localStorage.getItem("dearly:viewer");
    if (!id) {
      id = crypto.randomUUID().replace(/-/g, "");
      localStorage.setItem("dearly:viewer", id);
    }
    return id;
  } catch {
    return crypto.randomUUID().replace(/-/g, "");
  }
}

/* ------------------------------------------------------------------ auth */

export interface Me {
  user: { id: string; email: string; verified: boolean; provider: string };
  profile: { display_name: string | null; preferred_language: string; preferred_currency: string | null; timezone: string | null; role: string; suspended_at: string | null } | null;
  plan: PlanId;
  limits: PlanLimits;
  usage: { liveCards: number; storageBytes: number; aiThisMonth: number };
  subscription: { provider: string; plan: PlanId; status: string; cancel_at_period_end: boolean; current_period_end: string | null } | null;
  isAdmin: boolean;
}

const site = () => (typeof window !== "undefined" ? window.location.origin : publicEnv.siteUrl);

export const authService = {
  async signIn(email: string, password: string) {
    const { error } = await supabaseBrowser().auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message === "Invalid login credentials" ? "That email and password don't match." : error.message);
  },
  async signUp(name: string, email: string, password: string) {
    const { data, error } = await supabaseBrowser().auth.signUp({
      email,
      password,
      options: { data: { display_name: name }, emailRedirectTo: `${site()}/auth/callback?next=/dashboard` },
    });
    if (error) throw new Error(error.message);
    return { needsVerification: !data.session };
  },
  async signInWithGoogle(next = "/dashboard") {
    const { error } = await supabaseBrowser().auth.signInWithOAuth({ provider: "google", options: { redirectTo: `${site()}/auth/callback?next=${encodeURIComponent(next)}` } });
    if (error) throw new Error(error.message);
  },
  async signOut() {
    await supabaseBrowser().auth.signOut();
  },
  async requestPasswordReset(email: string) {
    const { error } = await supabaseBrowser().auth.resetPasswordForEmail(email, { redirectTo: `${site()}/auth/callback?next=/reset-password` });
    if (error && !/rate limit/i.test(error.message)) throw new Error(error.message);
  },
  async updatePassword(password: string) {
    const { error } = await supabaseBrowser().auth.updateUser({ password });
    if (error) throw new Error(error.message);
  },
  async verifyEmail(email: string, code: string) {
    const { error } = await supabaseBrowser().auth.verifyOtp({ email, token: code, type: "email" });
    if (error) throw new Error(error.message.includes("expired") ? "That code has expired. Send a new one." : "That code didn't work. Check it and try again.");
  },
  async resendVerification(email: string) {
    const { error } = await supabaseBrowser().auth.resend({ type: "signup", email, options: { emailRedirectTo: `${site()}/auth/callback?next=/dashboard` } });
    if (error) throw new Error(error.message);
  },
  me: () => api<Me>("/api/me"),
  updateProfile: (patch: Partial<Pick<NonNullable<Me["profile"]>, "display_name" | "timezone" | "preferred_currency">>) => api("/api/me", { method: "PATCH", json: patch }),
  deleteAccount: () => api("/api/me", { method: "DELETE", json: { confirm: "DELETE" } }),
};

/* ------------------------------------------------------------------ cards (owner) */

export interface ListParams {
  status?: "all" | "draft" | "published" | "scheduled" | "archived" | "group";
  q?: string;
  sort?: "updated" | "created" | "title";
  limit?: number;
  offset?: number;
}

export interface CardCounts {
  all: number;
  draft: number;
  published: number;
  scheduled: number;
  archived: number;
  group: number;
}

export interface PublishOptions {
  scheduledAt?: string | null;
  timezone?: string | null;
  deliveryEmail?: string | null;
}

export interface CardSettings {
  allowReactions?: boolean;
  allowResponsePhoto?: boolean;
  showBranding?: boolean;
  isDisabled?: boolean;
  recipientEmail?: string | null;
  contributionDeadline?: string | null;
  contributionLimit?: number | null;
  contributionsRequireApproval?: boolean;
  expiresAt?: string | null;
}

export interface CardResponses {
  viewCount: number;
  lastOpenedAt: string | null;
  completions: number;
  recentOpens: { openedAt: string; completedAt: string | null }[];
  reactions: { id: string; type: string; message: string | null; photoUrl: string | null; createdAt: string; isNew: boolean }[];
}

export interface OwnerContribution {
  id: string;
  name: string;
  message: string;
  color: string;
  status: "pending" | "approved" | "rejected";
  submittedAt: string;
  media: { type: string; url: string | null }[];
}

export const creationService = {
  list(params: ListParams = {}) {
    const q = new URLSearchParams(Object.entries(params).filter(([, v]) => v !== undefined && v !== "").map(([k, v]) => [k, String(v)]));
    return api<{ items: CardSummary[]; total: number; counts: CardCounts }>(`/api/cards?${q}`);
  },
  async get(id: string) {
    return (await api<{ card: Creation }>(`/api/cards/${id}`)).card;
  },
  async create(creation: Creation) {
    return (await api<{ card: Creation }>("/api/cards", { method: "POST", json: { creation } })).card;
  },
  /** Saves content; rejects with code `version_conflict` if someone saved a newer version first. */
  async save(creation: Creation, expectedVersion: number, signal?: AbortSignal) {
    return (await api<{ card: Creation }>(`/api/cards/${creation.id}`, { method: "PATCH", json: { creation, expectedVersion }, signal })).card;
  },
  async publish(id: string, opts: PublishOptions = {}) {
    return api<{ card: Creation; delivery: { queued: boolean; reason?: string } | null }>(`/api/cards/${id}/publish`, { method: "POST", json: opts });
  },
  async unpublish(id: string, archive = false) {
    return (await api<{ card: Creation }>(`/api/cards/${id}/unpublish`, { method: "POST", json: { archive } })).card;
  },
  async duplicate(id: string) {
    return (await api<{ card: Creation }>(`/api/cards/${id}/duplicate`, { method: "POST" })).card;
  },
  remove: (id: string) => api(`/api/cards/${id}`, { method: "DELETE" }),
  async updateSettings(id: string, s: CardSettings) {
    return (await api<{ card: Creation }>(`/api/cards/${id}/settings`, { method: "PUT", json: s })).card;
  },
  setPassword: (id: string, password: string | null) => api<{ hasPassword: boolean }>(`/api/cards/${id}/password`, { method: "PUT", json: { password } }),
  responses: (id: string) => api<CardResponses>(`/api/cards/${id}/responses`),
  async contributions(id: string) {
    return (await api<{ contributions: OwnerContribution[] }>(`/api/cards/${id}/contributions`)).contributions;
  },
  moderateContribution: (id: string, status: "approved" | "rejected" | "pending") => api(`/api/contributions/${id}`, { method: "PATCH", json: { status } }),
  deleteContribution: (id: string) => api(`/api/contributions/${id}`, { method: "DELETE" }),
  invite: (id: string, emails: string[]) => api<{ sent: number; failed: number }>(`/api/cards/${id}/invite`, { method: "POST", json: { emails } }),
  async regenerateToken(id: string) {
    return (await api<{ token: string }>(`/api/cards/${id}/token`, { method: "POST" })).token;
  },
};

/* ------------------------------------------------------------------ public cards (recipients) */

export type PublicCardState =
  | { state: "open"; card: Creation; isSample: boolean; allowResponsePhoto: boolean }
  | { state: "scheduled"; scheduledAt: string; senderName: string; palette: Creation["palette"] }
  | { state: "locked"; senderName: string; palette: Creation["palette"]; wrongPassword: boolean }
  | { state: "missing" };

type RpcCard = {
  id: string;
  slug: string;
  title: string;
  status: Creation["status"];
  recipientName: string;
  senderName: string;
  experienceType: Creation["experience"];
  cardData: unknown;
  showBranding: boolean;
  allowReactions: boolean;
  allowResponsePhoto: boolean;
  isSample: boolean;
  publishedAt: string;
  updatedAt: string;
  contributions: { id: string; name: string; message: string; color: string; media: { type: string; path?: string; src?: string }[]; createdAt: string }[];
};

export const publicCardService = {
  async get(slug: string, password?: string): Promise<PublicCardState> {
    const { rowToCreation } = await import("../card-engine/convert");
    const { data, error } = await supabaseBrowser().rpc("get_public_card", { p_slug: slug, p_password: password });
    if (error) throw new Error("We couldn't load this card. Please refresh.");
    const r = data as { state: string; card?: RpcCard; scheduledAt?: string; senderName?: string; palette?: Creation["palette"]; wrongPassword?: boolean } | null;
    if (!r) return { state: "missing" };
    if (r.state === "scheduled") return { state: "scheduled", scheduledAt: r.scheduledAt!, senderName: r.senderName ?? "", palette: r.palette ?? "rose-cream" };
    if (r.state === "locked") return { state: "locked", senderName: r.senderName ?? "", palette: r.palette ?? "rose-cream", wrongPassword: !!r.wrongPassword };
    const c = r.card!;
    const contributions: Contribution[] = (c.contributions ?? []).map((k) => ({
      id: k.id,
      name: k.name,
      message: k.message,
      color: k.color,
      createdAt: k.createdAt,
      photo: k.media?.[0]?.src ?? (k.media?.[0]?.path ? `path:${k.media[0].path}` : undefined),
    }));
    const creation = rowToCreation(
      {
        id: c.id,
        slug: c.slug,
        title: c.title,
        status: c.status,
        recipient_name: c.recipientName,
        sender_name: c.senderName,
        experience_type: c.experienceType,
        card_data: c.cardData,
        show_branding: c.showBranding,
        allow_reactions: c.allowReactions,
        allow_response_photo: c.allowResponsePhoto,
        is_sample: c.isSample,
        published_at: c.publishedAt,
        created_at: c.publishedAt,
        updated_at: c.updatedAt,
      },
      contributions,
    );
    return { state: "open", card: creation, isSample: c.isSample, allowResponsePhoto: c.allowResponsePhoto };
  },
  async recordView(slug: string) {
    const { data } = await supabaseBrowser().rpc("record_card_view", { p_slug: slug, p_session: viewerSession() });
    return (data as string | null) ?? null;
  },
  async completeView(viewId: string, summary: Record<string, string | number | boolean>) {
    await supabaseBrowser().rpc("complete_card_view", { p_view_id: viewId, p_session: viewerSession(), p_summary: summary });
  },
  async react(slug: string, type: string, message?: string, photoPath?: string) {
    const { error } = await supabaseBrowser().rpc("submit_reaction", { p_slug: slug, p_session: viewerSession(), p_type: type, p_message: message, p_photo_path: photoPath });
    if (error) throw new Error(error.message);
  },
  async uploadResponsePhoto(slug: string, file: File, onProgress?: (p: number) => void) {
    const prepared = await prepareImage(file);
    const { upload } = await api<{ upload: { url: string; path: string } }>("/api/respond/upload-url", { method: "POST", json: { slug, mime: prepared.mime, size: prepared.file.size } });
    await putWithProgress(upload.url, prepared.file, prepared.mime, { onProgress });
    return upload.path;
  },
  async report(slug: string, reason: string, details?: string) {
    const { error } = await supabaseBrowser().rpc("report_card", { p_slug: slug, p_reason: reason, p_details: details });
    if (error) throw new Error(error.message);
  },
};

/* ------------------------------------------------------------------ group cards */

export interface ContributionInvite {
  cardId: string;
  recipientName: string;
  senderName: string;
  title: string;
  templateSlug: string | null;
  palette: Creation["palette"];
  message: string;
  deadline: string | null;
  limit: number;
  count: number;
  requiresApproval: boolean;
  isOpen: boolean;
  contributions: RpcCard["contributions"];
}

export const togetherService = {
  async invite(token: string) {
    const { data, error } = await supabaseBrowser().rpc("get_contribution_invite", { p_token: token });
    if (error) throw new Error("We couldn't load this invitation.");
    return data as ContributionInvite | null;
  },
  async uploadMedia(token: string, file: File, opts: { onProgress?: (p: number) => void; signal?: AbortSignal } = {}) {
    const isVideo = file.type.startsWith("video/");
    const prepared = isVideo ? await prepareVideo(file) : await prepareImage(file);
    const { upload, kind } = await api<{ upload: { url: string; path: string }; kind: "image" | "video" }>("/api/contribute/upload-url", {
      method: "POST",
      json: { token, mime: prepared.mime, size: prepared.file.size },
    });
    await putWithProgress(upload.url, prepared.file, prepared.mime, opts);
    return { path: upload.path, type: kind, previewUrl: URL.createObjectURL(prepared.file) };
  },
  async contribute(token: string, c: { name: string; message: string; color: string; media: { path: string; type: "image" | "video" }[] }) {
    const { data, error } = await supabaseBrowser().rpc("submit_contribution", { p_token: token, p_session: viewerSession(), p_name: c.name, p_message: c.message, p_color: c.color, p_media: c.media });
    if (error) throw new Error(error.message);
    return data as { id: string; status: "pending" | "approved" };
  },
};

/* ------------------------------------------------------------------ received */

export interface ReceivedItem {
  slug: string;
  title: string;
  from: string;
  occasion: Creation["occasion"];
  palette: Creation["palette"];
  motif: import("../types").Motif;
  saved: boolean;
  openedAt: string;
  receivedAt: string;
}

export const receivedService = {
  async list(offset = 0) {
    return (await api<{ items: ReceivedItem[] }>(`/api/received?offset=${offset}`)).items;
  },
  /** Records that the signed-in user opened a card (no-op when signed out). */
  async markOpened(slug: string, saved: boolean | null = null) {
    try {
      await api(`/api/received/${slug}`, { method: "POST", json: { saved } });
    } catch (e) {
      if (!(e instanceof ApiClientError && e.isAuth)) throw e;
    }
  },
  setSaved: (slug: string, saved: boolean) => api(`/api/received/${slug}`, { method: "POST", json: { saved } }),
};

/* ------------------------------------------------------------------ uploads */

export interface UploadedMedia {
  mediaId: string;
  src: string;
  kind: "image" | "video" | "audio";
  previewUrl: string;
}

export const uploadService = {
  /** Compresses (images), uploads with progress/cancel/retry, verifies, and returns a `media:` reference. */
  async upload(file: File, opts: { cardId?: string | null; onProgress?: (p: number) => void; signal?: AbortSignal } = {}): Promise<UploadedMedia> {
    const kind = file.type.startsWith("image/") ? "image" : file.type.startsWith("video/") ? "video" : file.type.startsWith("audio/") ? "audio" : null;
    if (!kind) throw new Error("Please choose a photo (JPG, PNG, WebP), video (MP4, WebM) or audio file (MP3, M4A).");
    const prepared = kind === "image" ? await prepareImage(file) : kind === "video" ? await prepareVideo(file) : await prepareAudio(file);
    const reg = await api<{ mediaId: string; upload: { url: string }; thumbnailUpload: { url: string } | null }>("/api/media/upload-url", {
      method: "POST",
      json: { cardId: opts.cardId ?? null, fileName: file.name, mime: prepared.mime, size: prepared.file.size, withThumbnail: !!prepared.thumbnail },
      signal: opts.signal,
    });
    await putWithProgress(reg.upload.url, prepared.file, prepared.mime, { onProgress: (p) => opts.onProgress?.(p * 0.95), signal: opts.signal });
    let thumbnailUploaded = false;
    if (reg.thumbnailUpload && prepared.thumbnail) {
      try {
        await putWithProgress(reg.thumbnailUpload.url, prepared.thumbnail, "image/jpeg", { signal: opts.signal });
        thumbnailUploaded = true;
      } catch {
        thumbnailUploaded = false;
      }
    }
    await api(`/api/media/${reg.mediaId}/complete`, {
      method: "POST",
      json: { width: prepared.width ?? null, height: prepared.height ?? null, duration: prepared.duration ?? null, thumbnailUploaded },
      signal: opts.signal,
    });
    opts.onProgress?.(1);
    const previewUrl = URL.createObjectURL(prepared.file);
    primeMedia("owner", reg.mediaId, previewUrl);
    return { mediaId: reg.mediaId, src: `media:${reg.mediaId}`, kind, previewUrl };
  },
  remove: (mediaId: string) => api(`/api/media/${mediaId}`, { method: "DELETE" }),
};

/* ------------------------------------------------------------------ billing */

declare global {
  interface Window {
    Razorpay?: new (opts: Record<string, unknown>) => { open(): void; on(event: string, cb: (e: unknown) => void): void };
  }
}

function loadRazorpay() {
  return new Promise<void>((resolve, reject) => {
    if (window.Razorpay) return resolve();
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Couldn't load Razorpay checkout."));
    document.body.appendChild(s);
  });
}

export type CheckoutItem =
  | { kind: "subscription"; plan: "premium" | "pro"; cycle: "monthly" | "yearly" }
  | { kind: "one_time"; product: OneTimeProduct; cardId?: string | null };

export const billingService = {
  detectRegion(): RegionCode {
    if (typeof navigator === "undefined") return "US";
    const region = (navigator.language || "en-US").split("-")[1]?.toUpperCase();
    return (pricing.regions.map((r) => r.code).find((k) => k === region) as RegionCode) ?? "INTL";
  },
  /** Opens the provider's checkout. Access changes only after the provider's verified webhook. */
  async checkout(item: CheckoutItem, region: RegionCode, returnPath = "/account") {
    const r = await api<{ provider: "stripe"; url: string } | { provider: "razorpay"; keyId: string; orderId?: string; subscriptionId?: string; amount?: number; currency: string; name: string; description: string }>(
      "/api/billing/checkout",
      { method: "POST", json: { item, region, returnPath } },
    );
    if (r.provider === "stripe") {
      window.location.assign(r.url);
      return "redirected" as const;
    }
    await loadRazorpay();
    return new Promise<"completed" | "dismissed">((resolve) => {
      const rz = new window.Razorpay!({
        key: r.keyId,
        order_id: r.orderId,
        subscription_id: r.subscriptionId,
        amount: r.amount,
        currency: r.currency,
        name: r.name,
        description: r.description,
        theme: { color: "#713D50" },
        handler: () => resolve("completed"),
        modal: { ondismiss: () => resolve("dismissed") },
      });
      rz.open();
    });
  },
  cancel: () => api<{ message: string }>("/api/billing/cancel", { method: "POST" }),
  async portal() {
    const { url } = await api<{ url: string }>("/api/billing/portal", { method: "POST" });
    window.location.assign(url);
  },
};

/* ------------------------------------------------------------------ AI */

export type AiKind = "message" | "poem" | "story" | "caption" | "design";
export const aiService = {
  generate: <T,>(req: { kind: AiKind } & Record<string, unknown>) => api<{ kind: AiKind; output: T; remaining: number }>("/api/ai", { method: "POST", json: req }),
};

/* ------------------------------------------------------------------ contact */

export const contactService = {
  async send(m: { name: string; email: string; topic: string; message: string }) {
    const { error } = await supabaseBrowser().rpc("submit_contact", { p_name: m.name, p_email: m.email, p_topic: m.topic, p_message: m.message });
    if (error) throw new Error(error.message);
  },
};

export const newsletterService = {
  async subscribe(email: string) {
    const { error } = await supabaseBrowser().rpc("subscribe_newsletter", { p_email: email });
    if (error) throw new Error(error.message);
  },
};

export { ApiClientError };
export type { User };

/**
 * Service interfaces for everything that needs a backend.
 * Each export is a mock implementation (localStorage / IndexedDB) behind an interface,
 * so Prompt 2 can swap in real implementations without touching the UI.
 */
import { sampleCreations, sampleReceived } from "../data/samples";
import { getSampleCreation } from "../data/samples";
import { pricing } from "../data/pricing";
import type { Contribution, Creation, PlanId, ReceivedCard, RegionCode, User } from "../types";
import { uid } from "../utils";
import { latency, read, subscribe, write } from "./storage";
import { mediaStore } from "./media";

/* ------------------------------------------------------------------ Auth */

export interface AuthService {
  getUser(): User | null;
  signIn(email: string, password: string): Promise<User>;
  signUp(name: string, email: string, password: string): Promise<User>;
  signInWithGoogle(): Promise<User>;
  signOut(): Promise<void>;
  requestPasswordReset(email: string): Promise<void>;
  verifyEmail(code: string): Promise<User>;
  resendVerification(): Promise<void>;
  setPlan(plan: PlanId): Promise<User>;
  subscribe(listener: () => void): () => void;
}

const USER_KEY = "session";

export const authService: AuthService = {
  getUser: () => read<User | null>(USER_KEY, null),
  async signIn(email) {
    await latency(600);
    const existing = read<User | null>("account", null);
    const user: User =
      existing && existing.email === email
        ? existing
        : { id: uid("u-"), name: email.split("@")[0].replace(/[._]/g, " "), email, plan: "free", verified: true };
    write(USER_KEY, user);
    return user;
  },
  async signUp(name, email) {
    await latency(700);
    const user: User = { id: uid("u-"), name, email, plan: "free", verified: false };
    write("account", user);
    write(USER_KEY, user);
    return user;
  },
  async signInWithGoogle() {
    await latency(500);
    const user: User = { id: uid("u-"), name: "Google user", email: "you@gmail.com", plan: "free", verified: true };
    write(USER_KEY, user);
    return user;
  },
  async signOut() {
    await latency(150);
    write(USER_KEY, null);
  },
  async requestPasswordReset() {
    await latency(600);
  },
  async verifyEmail(code) {
    await latency(500);
    if (!/^\d{6}$/.test(code)) throw new Error("That code doesn't look right. It should be 6 digits.");
    const user = read<User | null>(USER_KEY, null);
    if (!user) throw new Error("Please sign in again to verify your email.");
    const verified = { ...user, verified: true };
    write(USER_KEY, verified);
    write("account", verified);
    return verified;
  },
  async resendVerification() {
    await latency(400);
  },
  async setPlan(plan) {
    await latency(500);
    const user = read<User | null>(USER_KEY, null) ?? { id: uid("u-"), name: "Guest", email: "guest@dearly.app", plan, verified: true };
    const next = { ...user, plan };
    write(USER_KEY, next);
    return next;
  },
  subscribe: (l) => subscribe(USER_KEY, l),
};

/* ------------------------------------------------------------- Creations */

export interface CreationService {
  list(): Promise<Creation[]>;
  get(id: string): Promise<Creation | undefined>;
  getBySlug(slug: string): Promise<Creation | undefined>;
  save(creation: Creation): Promise<Creation>;
  publish(id: string, scheduledFor?: string): Promise<Creation>;
  duplicate(id: string): Promise<Creation>;
  setStatus(id: string, status: Creation["status"]): Promise<Creation>;
  remove(id: string): Promise<void>;
  ensureSeeded(): void;
  subscribe(listener: () => void): () => void;
}

const CREATIONS_KEY = "creations";
const all = () => read<Creation[]>(CREATIONS_KEY, []);

export const creationService: CreationService = {
  async list() {
    await latency(350);
    return all().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  },
  async get(id) {
    await latency(150);
    return all().find((c) => c.id === id);
  },
  async getBySlug(slug) {
    await latency(250);
    return all().find((c) => c.slug === slug) ?? getSampleCreation(slug);
  },
  async save(creation) {
    const list = all();
    const next = { ...creation, updatedAt: new Date().toISOString() };
    const i = list.findIndex((c) => c.id === creation.id);
    if (i >= 0) list[i] = next;
    else list.unshift(next);
    write(CREATIONS_KEY, list);
    return next;
  },
  async publish(id, scheduledFor) {
    await latency(700);
    const list = all();
    const c = list.find((x) => x.id === id);
    if (!c) throw new Error("We couldn't find that creation.");
    c.status = scheduledFor ? "scheduled" : "published";
    c.scheduledFor = scheduledFor;
    c.updatedAt = new Date().toISOString();
    write(CREATIONS_KEY, list);
    return c;
  },
  async duplicate(id) {
    await latency(300);
    const list = all();
    const c = list.find((x) => x.id === id);
    if (!c) throw new Error("We couldn't find that creation.");
    const newId = uid("c-");
    const copy: Creation = {
      ...structuredClone(c),
      id: newId,
      slug: `${c.slug.split("-").slice(0, -1).join("-") || "copy"}-${newId.slice(2, 8)}`,
      title: `${c.title} (copy)`,
      status: "draft",
      scheduledFor: undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    write(CREATIONS_KEY, [copy, ...list]);
    return copy;
  },
  async setStatus(id, status) {
    await latency(250);
    const list = all();
    const c = list.find((x) => x.id === id);
    if (!c) throw new Error("We couldn't find that creation.");
    c.status = status;
    c.updatedAt = new Date().toISOString();
    write(CREATIONS_KEY, list);
    return c;
  },
  async remove(id) {
    await latency(250);
    write(
      CREATIONS_KEY,
      all().filter((c) => c.id !== id),
    );
  },
  ensureSeeded() {
    if (read("seeded", false)) return;
    const now = Date.now();
    const pick = (slug: string, status: Creation["status"], hoursAgo: number, extra: Partial<Creation> = {}): Creation => {
      const base = structuredClone(sampleCreations.find((c) => c.slug === slug)!);
      const id = uid("c-");
      const at = new Date(now - hoursAgo * 3600_000).toISOString();
      return { ...base, id, slug: `${slug}-${id.slice(2, 6)}`, status, createdAt: at, updatedAt: at, ...extra };
    };
    // Keep anything the visitor already made; examples go after it.
    write(CREATIONS_KEY, [
      ...all(),
      pick("for-maya", "draft", 2),
      pick("dear-sam", "published", 30),
      pick("our-story", "draft", 52),
      pick("happy-birthday-leo", "scheduled", 70, { scheduledFor: new Date(now + 5 * 86400_000).toISOString() }),
      pick("dads-sunday", "archived", 600),
    ]);
    write("received", [...read<ReceivedCard[]>("received", []), ...sampleReceived.filter((r) => !read<ReceivedCard[]>("received", []).some((x) => x.slug === r.slug))]);
    write("seeded", true);
  },
  subscribe: (l) => subscribe(CREATIONS_KEY, l),
};

/* -------------------------------------------------------------- Received */

export interface ReceivedService {
  list(): Promise<ReceivedCard[]>;
  toggleSave(slug: string): Promise<void>;
  markOpened(card: Omit<ReceivedCard, "receivedAt" | "saved" | "openedAt">): Promise<void>;
}

export const receivedService: ReceivedService = {
  async list() {
    await latency(300);
    return read<ReceivedCard[]>("received", []);
  },
  async toggleSave(slug) {
    const list = read<ReceivedCard[]>("received", []);
    write(
      "received",
      list.map((r) => (r.slug === slug ? { ...r, saved: !r.saved } : r)),
    );
  },
  async markOpened(card) {
    const list = read<ReceivedCard[]>("received", []);
    const at = new Date().toISOString();
    const existing = list.find((r) => r.slug === card.slug);
    if (existing) existing.openedAt = at;
    else list.unshift({ ...card, receivedAt: at, openedAt: at, saved: false });
    write("received", list);
  },
};

/* ------------------------------------------------------------- Reactions */

export interface ReactionService {
  send(slug: string, reaction: string, note?: string): Promise<void>;
}

export const reactionService: ReactionService = {
  async send(slug, reaction, note) {
    await latency(500);
    const list = read<{ slug: string; reaction: string; note?: string; at: string }[]>("reactions", []);
    list.push({ slug, reaction, note, at: new Date().toISOString() });
    write("reactions", list);
  },
};

/* ------------------------------------------------------- Group (Together) */

export interface TogetherService {
  list(cardId: string): Promise<Contribution[]>;
  contribute(cardId: string, c: Omit<Contribution, "id" | "createdAt">): Promise<Contribution>;
  invite(cardId: string, emails: string[]): Promise<void>;
}

export const togetherService: TogetherService = {
  async list(cardId) {
    await latency(300);
    const seeded = getSampleCreation(cardId)?.contributions ?? [];
    return [...seeded, ...read<Contribution[]>(`together:${cardId}`, [])];
  },
  async contribute(cardId, c) {
    await latency(600);
    const item: Contribution = { ...c, id: uid("k-"), createdAt: new Date().toISOString() };
    write(`together:${cardId}`, [...read<Contribution[]>(`together:${cardId}`, []), item]);
    return item;
  },
  async invite() {
    await latency(500);
  },
};

/* ---------------------------------------------------------------- Uploads */

export interface UploadService {
  /** Downscales and stores an image; returns a URL usable in <img src>. */
  uploadImage(file: File, maxSize?: number): Promise<string>;
  /** Stores large media (video, audio) and returns an `idb:` reference. */
  uploadMedia(file: File): Promise<string>;
}

export const uploadService: UploadService = {
  async uploadImage(file, maxSize = 1400) {
    if (!file.type.startsWith("image/")) throw new Error("Please choose an image file (JPG, PNG, WebP or HEIC).");
    if (file.size > 15 * 1024 * 1024) throw new Error("That image is over 15 MB. Please choose a smaller one.");
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", 0.82);
  },
  async uploadMedia(file) {
    if (file.size > 80 * 1024 * 1024) throw new Error("That file is over 80 MB. Please choose a shorter clip.");
    const key = uid("m-");
    await mediaStore.put(key, file);
    return `idb:${key}`;
  },
};

/* ---------------------------------------------------------------- Billing */

export interface BillingService {
  detectRegion(): RegionCode;
  startCheckout(plan: PlanId, cycle: "monthly" | "yearly"): Promise<{ plan: PlanId }>;
}

export const billingService: BillingService = {
  detectRegion() {
    if (typeof navigator === "undefined") return "US";
    const lang = navigator.language || "en-US";
    const region = lang.split("-")[1]?.toUpperCase();
    const known = pricing.regions.map((r) => r.code);
    return (known.find((k) => k === region) as RegionCode) ?? "INTL";
  },
  async startCheckout(plan) {
    await authService.setPlan(plan);
    return { plan };
  },
};

/* ---------------------------------------------------------------- Contact */

/** Mock outboxes — Prompt 2 posts these to the support inbox / mailing-list provider. */
export const contactService = {
  async send(message: { name: string; email: string; topic: string; message: string }) {
    await latency(700);
    write("outbox:contact", [...read<unknown[]>("outbox:contact", []), { ...message, at: new Date().toISOString() }]);
  },
};

export const newsletterService = {
  async subscribe(email: string) {
    await latency(500);
    write("outbox:newsletter", Array.from(new Set([...read<string[]>("outbox:newsletter", []), email])));
  },
};

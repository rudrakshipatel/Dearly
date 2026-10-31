/**
 * Converts between the stored card document (card_data, versioned) and the `Creation`
 * model the editor and experiences work with. Older documents are migrated forward on read,
 * so cards published under an earlier schema keep rendering.
 */
import { defaultInteraction } from "../creation";
import { palettes } from "../data/palettes";
import type { Contribution, Creation, InteractionSettings, OccasionSlug, PaletteId } from "../types";
import { CARD_SCHEMA_VERSION, type CardData } from "./schema";

/** Row fields that live outside card_data. */
export interface CardRow {
  id: string;
  slug: string;
  title: string;
  status: Creation["status"];
  recipient_name: string;
  sender_name: string;
  recipient_email?: string | null;
  experience_type: Creation["experience"];
  card_data: unknown;
  version?: number;
  scheduled_at?: string | null;
  timezone?: string | null;
  published_at?: string | null;
  view_count?: number;
  last_opened_at?: string | null;
  password_hash?: string | null;
  has_password?: boolean;
  is_disabled?: boolean;
  disabled_reason?: string | null;
  allow_reactions?: boolean;
  allow_response_photo?: boolean;
  show_branding?: boolean;
  contribution_token?: string | null;
  contribution_deadline?: string | null;
  contribution_limit?: number | null;
  contributions_require_approval?: boolean;
  is_sample?: boolean;
  created_at: string;
  updated_at: string;
}

export function creationToCardData(c: Creation): CardData {
  const p = palettes[c.palette];
  return {
    version: CARD_SCHEMA_VERSION,
    experienceType: c.experience,
    templateId: c.templateId,
    occasion: c.occasion,
    palette: c.palette,
    theme: { background: p.bg, primaryColor: p.deep, fontFamily: c.interaction.letterFont },
    recipient: { name: c.recipientName, relationship: c.relationship || undefined },
    sender: { name: c.senderName },
    message: c.message,
    occasionDate: c.occasionDate || undefined,
    photos: c.photos,
    interaction: stripUndefined(c.interaction) as CardData["interaction"],
    pages: c.pages,
    settings: { allowReactions: c.allowReactions ?? true, showBranding: c.showBranding },
  };
}

/** Upgrades any stored card document to the current schema version. */
export function migrateCardData(raw: unknown, fallback: { experience?: Creation["experience"]; recipientName?: string; senderName?: string } = {}): CardData {
  const doc = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  if (doc.version === CARD_SCHEMA_VERSION) return doc as unknown as CardData;

  // v1: the Prompt 1 browser-stored `Creation` shape (no version field).
  const palette = (doc.palette as PaletteId) ?? "rose-cream";
  const occasion = (doc.occasion as OccasionSlug) ?? "just-because";
  const interaction = {
    ...defaultInteraction(palette, ((doc.interaction as InteractionSettings | undefined)?.mode ?? "envelope"), occasion),
    ...((doc.interaction as object) ?? {}),
  } as InteractionSettings;
  const p = palettes[palette] ?? palettes["rose-cream"];
  return {
    version: CARD_SCHEMA_VERSION,
    experienceType: (doc.experience as CardData["experienceType"]) ?? fallback.experience ?? "letter",
    templateId: (doc.templateId as string) ?? "",
    occasion,
    palette,
    theme: { background: p.bg, primaryColor: p.deep, fontFamily: interaction.letterFont },
    recipient: { name: (doc.recipientName as string) ?? fallback.recipientName ?? "" },
    sender: { name: (doc.senderName as string) ?? fallback.senderName ?? "" },
    message: (doc.message as string) ?? "",
    occasionDate: (doc.occasionDate as string) || undefined,
    photos: (doc.photos as CardData["photos"]) ?? [],
    interaction: stripUndefined(interaction) as CardData["interaction"],
    pages: (doc.pages as CardData["pages"]) ?? [],
    settings: { allowReactions: true, showBranding: (doc.showBranding as boolean) ?? true },
  };
}

export function rowToCreation(row: CardRow, contributions: Contribution[] = []): Creation {
  const cd = migrateCardData(row.card_data, { experience: row.experience_type, recipientName: row.recipient_name, senderName: row.sender_name });
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    occasion: cd.occasion,
    experience: row.experience_type,
    templateId: cd.templateId,
    palette: cd.palette,
    status: row.status,
    recipientName: row.recipient_name,
    senderName: row.sender_name,
    message: cd.message,
    occasionDate: cd.occasionDate,
    relationship: cd.recipient.relationship,
    photos: cd.photos,
    interaction: cd.interaction as InteractionSettings,
    pages: cd.pages as Creation["pages"],
    contributions,
    scheduledFor: row.scheduled_at ?? undefined,
    showBranding: row.show_branding ?? cd.settings.showBranding,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    version: row.version,
    allowReactions: row.allow_reactions ?? cd.settings.allowReactions,
    allowResponsePhoto: row.allow_response_photo,
    recipientEmail: row.recipient_email ?? undefined,
    timezone: row.timezone ?? undefined,
    publishedAt: row.published_at ?? undefined,
    viewCount: row.view_count,
    lastOpenedAt: row.last_opened_at ?? undefined,
    hasPassword: row.has_password ?? !!row.password_hash,
    isDisabled: row.is_disabled,
    disabledReason: row.disabled_reason ?? undefined,
    contributionToken: row.contribution_token ?? undefined,
    contributionDeadline: row.contribution_deadline ?? undefined,
    contributionLimit: row.contribution_limit ?? undefined,
    contributionsRequireApproval: row.contributions_require_approval,
    isSample: row.is_sample,
  };
}

function stripUndefined<T extends object>(o: T): T {
  return Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined)) as T;
}

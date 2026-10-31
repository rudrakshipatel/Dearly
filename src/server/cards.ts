import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { creationToCardData, rowToCreation, type CardRow } from "@/lib/card-engine/convert";
import { validateCardData } from "@/lib/card-engine/schema";
import type { Database } from "@/lib/supabase/database.types";
import type { Contribution, Creation } from "@/lib/types";
import { ApiError, check } from "./http";

type DB = SupabaseClient<Database>;

/** Columns the owner-facing API returns (password hash is reduced to a boolean). */
const CARD_COLUMNS =
  "id, slug, title, status, recipient_name, sender_name, recipient_email, experience_type, card_data, version, scheduled_at, timezone, published_at, view_count, last_opened_at, password_hash, is_disabled, disabled_reason, allow_reactions, allow_response_photo, show_branding, contribution_token, contribution_deadline, contribution_limit, contributions_require_approval, is_sample, created_at, updated_at";
const LIST_COLUMNS =
  "id, slug, title, status, recipient_name, sender_name, experience_type, card_data->palette, card_data->templateId, card_data->occasion, first_page:card_data->pages->0, scheduled_at, published_at, view_count, last_opened_at, is_disabled, contribution_token, created_at, updated_at, version";

function toCreation(row: Record<string, unknown>, contributions: Contribution[] = []): Creation {
  const c = rowToCreation({ ...(row as unknown as CardRow), has_password: !!row.password_hash, password_hash: undefined });
  c.contributions = contributions;
  return c;
}

/** Validates the editable content of a creation and turns it into card_data + row columns. */
export function toCardWrite(c: Creation) {
  const data = creationToCardData(c);
  const v = validateCardData(data);
  if (!v.ok) throw new ApiError(400, `Card content is invalid (${v.path}): ${v.error}`, "invalid_card");
  return {
    card_data: v.data,
    title: c.title.slice(0, 120),
    recipient_name: c.recipientName.slice(0, 60),
    sender_name: c.senderName.slice(0, 60),
    experience_type: c.experience,
  };
}

async function lookupIds(db: DB, templateId: string, occasion: string) {
  const slug = templateId.replace(/^tpl-/, "");
  const [t, o] = await Promise.all([
    db.from("templates").select("id").eq("slug", slug).maybeSingle(),
    db.from("occasions").select("id").eq("slug", occasion).maybeSingle(),
  ]);
  return { template_id: t.data?.id ?? null, occasion_id: o.data?.id ?? null };
}

export const listQuery = z.object({
  status: z.enum(["all", "draft", "published", "scheduled", "archived", "group"]).default("all"),
  q: z.string().max(80).optional(),
  sort: z.enum(["updated", "created", "title"]).default("updated"),
  limit: z.coerce.number().int().min(1).max(48).default(12),
  offset: z.coerce.number().int().min(0).max(10000).default(0),
});

export interface CardSummary {
  id: string;
  slug: string;
  title: string;
  status: Creation["status"];
  recipientName: string;
  experience: Creation["experience"];
  palette: Creation["palette"];
  templateId: string;
  occasion: Creation["occasion"];
  firstPage: Creation["pages"][number] | null;
  scheduledFor?: string;
  publishedAt?: string;
  viewCount: number;
  lastOpenedAt?: string;
  isDisabled: boolean;
  isGroup: boolean;
  updatedAt: string;
  createdAt: string;
  version: number;
}

export const cardService = {
  async list(db: DB, userId: string, query: z.infer<typeof listQuery>) {
    let req = db.from("cards").select(LIST_COLUMNS, { count: "exact" }).eq("owner_id", userId);
    if (query.status === "all") req = req.neq("status", "archived");
    else if (query.status === "group") req = req.eq("experience_type", "together").neq("status", "archived");
    else req = req.eq("status", query.status);
    if (query.q) {
      const term = query.q.replace(/[%_,()]/g, " ").trim();
      if (term) req = req.or(`title.ilike.%${term}%,recipient_name.ilike.%${term}%`);
    }
    const order = query.sort === "title" ? "title" : query.sort === "created" ? "created_at" : "updated_at";
    req = req.order(order, { ascending: query.sort === "title" }).range(query.offset, query.offset + query.limit - 1);
    const { data, error, count } = await req;
    check(error);
    const items: CardSummary[] = (data ?? []).map((r) => {
      const row = r as unknown as Record<string, unknown>;
      return {
        id: row.id as string,
        slug: row.slug as string,
        title: row.title as string,
        status: row.status as Creation["status"],
        recipientName: row.recipient_name as string,
        experience: row.experience_type as Creation["experience"],
        palette: (row.palette as Creation["palette"]) ?? "rose-cream",
        templateId: (row.templateId as string) ?? "",
        occasion: (row.occasion as Creation["occasion"]) ?? "just-because",
        firstPage: (row.first_page as Creation["pages"][number]) ?? null,
        scheduledFor: (row.scheduled_at as string) ?? undefined,
        publishedAt: (row.published_at as string) ?? undefined,
        viewCount: (row.view_count as number) ?? 0,
        lastOpenedAt: (row.last_opened_at as string) ?? undefined,
        isDisabled: !!row.is_disabled,
        isGroup: row.experience_type === "together",
        updatedAt: row.updated_at as string,
        createdAt: row.created_at as string,
        version: row.version as number,
      };
    });
    return { items, total: count ?? items.length };
  },

  async counts(db: DB, userId: string) {
    const { data, error } = await db.from("cards").select("status, experience_type").eq("owner_id", userId).limit(5000);
    check(error);
    const out = { all: 0, draft: 0, published: 0, scheduled: 0, archived: 0, group: 0 };
    for (const r of data ?? []) {
      out[r.status]++;
      if (r.status !== "archived") {
        out.all++;
        if (r.experience_type === "together") out.group++;
      }
    }
    return out;
  },

  async get(db: DB, id: string) {
    const { data, error } = await db.from("cards").select(CARD_COLUMNS).eq("id", id).maybeSingle();
    check(error);
    if (!data) throw new ApiError(404, "Card not found.", "not_found");
    return toCreation(data as unknown as Record<string, unknown>);
  },

  async create(db: DB, userId: string, c: Creation) {
    const write = toCardWrite(c);
    const ids = await lookupIds(db, c.templateId, c.occasion);
    const { data, error } = await db
      .from("cards")
      .insert({
        ...write,
        ...ids,
        owner_id: userId,
        // The database replaces this with a random slug; it only needs to satisfy the check constraint.
        slug: "pending-slug",
        allow_reactions: c.allowReactions ?? true,
        contribution_deadline: c.contributionDeadline ?? null,
        contribution_limit: c.contributionLimit ?? null,
        contributions_require_approval: c.contributionsRequireApproval ?? true,
      })
      .select(CARD_COLUMNS)
      .single();
    check(error);
    return toCreation(data as unknown as Record<string, unknown>);
  },

  /**
   * Saves editable content with optimistic concurrency: the update only applies when the
   * stored version still matches `expectedVersion`, so an older autosave can never overwrite newer work.
   */
  async update(db: DB, id: string, c: Creation, expectedVersion: number) {
    const write = toCardWrite(c);
    const ids = await lookupIds(db, c.templateId, c.occasion);
    const { data, error } = await db
      .from("cards")
      .update({ ...write, ...ids })
      .eq("id", id)
      .eq("version", expectedVersion)
      .select(CARD_COLUMNS)
      .maybeSingle();
    check(error);
    if (!data) {
      const { data: exists } = await db.from("cards").select("version").eq("id", id).maybeSingle();
      if (!exists) throw new ApiError(404, "Card not found.", "not_found");
      throw new ApiError(409, "This card was changed somewhere else. Reload to get the latest version.", "version_conflict");
    }
    return toCreation(data as unknown as Record<string, unknown>);
  },

  async updateSettings(
    db: DB,
    id: string,
    s: {
      allowReactions?: boolean;
      allowResponsePhoto?: boolean;
      showBranding?: boolean;
      isDisabled?: boolean;
      recipientEmail?: string | null;
      contributionDeadline?: string | null;
      contributionLimit?: number | null;
      contributionsRequireApproval?: boolean;
      expiresAt?: string | null;
    },
  ) {
    const patch: Database["public"]["Tables"]["cards"]["Update"] = {};
    if (s.allowReactions !== undefined) patch.allow_reactions = s.allowReactions;
    if (s.allowResponsePhoto !== undefined) patch.allow_response_photo = s.allowResponsePhoto;
    if (s.showBranding !== undefined) patch.show_branding = s.showBranding;
    if (s.isDisabled !== undefined) patch.is_disabled = s.isDisabled;
    if (s.recipientEmail !== undefined) patch.recipient_email = s.recipientEmail;
    if (s.contributionDeadline !== undefined) patch.contribution_deadline = s.contributionDeadline;
    if (s.contributionLimit !== undefined) patch.contribution_limit = s.contributionLimit;
    if (s.contributionsRequireApproval !== undefined) patch.contributions_require_approval = s.contributionsRequireApproval;
    if (s.expiresAt !== undefined) patch.expires_at = s.expiresAt;
    const { data, error } = await db.from("cards").update(patch).eq("id", id).select(CARD_COLUMNS).maybeSingle();
    check(error);
    if (!data) throw new ApiError(404, "Card not found.", "not_found");
    return toCreation(data as unknown as Record<string, unknown>);
  },

  async duplicate(db: DB, userId: string, id: string) {
    const src = await cardService.get(db, id);
    return cardService.create(db, userId, { ...src, title: `${src.title} (copy)`.slice(0, 120) });
  },

  async setStatus(db: DB, id: string, status: "draft" | "archived") {
    const { error } = await db.rpc("unpublish_card", { p_card_id: id, p_archive: status === "archived" });
    check(error);
    return cardService.get(db, id);
  },

  async publish(db: DB, id: string, opts: { scheduledAt?: string | null; timezone?: string | null; deliveryEmail?: string | null }) {
    const { data, error } = await db.rpc("publish_card", {
      p_card_id: id,
      p_scheduled_at: opts.scheduledAt ?? undefined,
      p_timezone: opts.timezone ?? undefined,
      p_delivery_email: opts.deliveryEmail ?? undefined,
    });
    check(error);
    return data as { id: string; slug: string; status: string; scheduledAt: string | null; contributionToken: string | null };
  },

  /** Deletes the card, then any of its media that no other card still uses (rows and storage objects). */
  async remove(db: DB, id: string) {
    const card = await cardService.get(db, id);
    const { error, count } = await db.from("cards").delete({ count: "exact" }).eq("id", id);
    check(error);
    if (!count) throw new ApiError(404, "Card not found.", "not_found");
    const ids = mediaIdsIn(card);
    if (!ids.length) return;
    const { data: orphanIds } = await db.rpc("my_unreferenced_media", { p_ids: ids });
    const orphans = (orphanIds ?? []) as string[];
    if (!orphans.length) return;
    const { data: rows } = await db.from("card_media").select("id, storage_path, thumbnail_path").in("id", orphans);
    const paths = (rows ?? []).flatMap((m) => [m.storage_path, m.thumbnail_path].filter(Boolean) as string[]);
    if (paths.length) await db.storage.from("card-media").remove(paths);
    await db.from("card_media").delete().in("id", orphans);
  },
};

const MEDIA_RE = /media:([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/g;

/** Every uploaded-media id a creation references. */
export function mediaIdsIn(value: unknown): string[] {
  return Array.from(new Set(Array.from(JSON.stringify(value).matchAll(MEDIA_RE), (m) => m[1])));
}

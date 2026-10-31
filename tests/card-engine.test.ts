import { describe, expect, it } from "vitest";
import { creationToCardData, migrateCardData, rowToCreation } from "@/lib/card-engine/convert";
import { CARD_SCHEMA_VERSION, validateCardData } from "@/lib/card-engine/schema";
import { buildCreation } from "@/lib/creation";
import { sampleCreations } from "@/lib/data/samples";
import { templates } from "@/lib/data/templates";

describe("card engine schema", () => {
  it("accepts every built-in template's default card", () => {
    for (const t of templates) {
      const c = buildCreation({ template: t, recipientName: "Maya", senderName: "Jonah" });
      const v = validateCardData(creationToCardData(c));
      expect(v.ok, `${t.id}: ${!v.ok ? v.error : ""}`).toBe(true);
    }
  });

  it("accepts every sample card (all five experiences + classic + video)", () => {
    const kinds = new Set<string>();
    for (const c of sampleCreations) {
      const v = validateCardData(creationToCardData(c));
      expect(v.ok, c.slug).toBe(true);
      kinds.add(c.interaction.mode);
    }
    for (const mode of ["envelope", "gift", "scrapbook", "scratch", "tap", "flip", "balloon", "photo-reveal", "quiz", "group", "video", "story"]) expect(kinds.has(mode), mode).toBe(true);
  });

  it("rejects unsafe media sources", () => {
    const base = creationToCardData(buildCreation({ template: templates[0], recipientName: "A", senderName: "B" }));
    for (const src of ["javascript:alert(1)", "data:image/png;base64,AAAA", "https://evil.example/x.png", "media:not-a-uuid", "../../etc/passwd"]) {
      const bad = { ...base, photos: [{ id: "p1", src }] };
      expect(validateCardData(bad).ok, src).toBe(false);
    }
  });

  it("rejects oversized content and invalid colours", () => {
    const base = creationToCardData(buildCreation({ template: templates[0], recipientName: "A", senderName: "B" }));
    expect(validateCardData({ ...base, message: "x".repeat(5000) }).ok).toBe(false);
    expect(validateCardData({ ...base, pages: [{ ...base.pages[0], background: "red; background:url(x)" }] }).ok).toBe(false);
    expect(validateCardData({ ...base, pages: Array.from({ length: 31 }, () => base.pages[0]) }).ok).toBe(false);
  });

  it("migrates v1 (browser-stored) documents to the current version", () => {
    const legacy = { ...sampleCreations[0] } as unknown as Record<string, unknown>;
    delete legacy.version;
    const migrated = migrateCardData(legacy);
    expect(migrated.version).toBe(CARD_SCHEMA_VERSION);
    expect(validateCardData(migrated).ok).toBe(true);
    expect(migrated.recipient.name).toBe(sampleCreations[0].recipientName);
  });

  it("round-trips through the database row shape", () => {
    const c = sampleCreations.find((s) => s.slug === "our-story")!;
    const row = { id: c.id, slug: c.slug, title: c.title, status: "published" as const, recipient_name: c.recipientName, sender_name: c.senderName, experience_type: c.experience, card_data: creationToCardData(c), version: 3, created_at: c.createdAt, updated_at: c.updatedAt };
    const back = rowToCreation(row);
    expect(back.pages).toEqual(c.pages);
    expect(back.photos).toEqual(c.photos);
    expect(back.interaction.mode).toBe(c.interaction.mode);
    expect(back.version).toBe(3);
  });
});

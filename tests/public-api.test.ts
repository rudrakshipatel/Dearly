/**
 * Integration tests against the configured Supabase project using only the public (anon) key —
 * exactly what an anonymous recipient or attacker has. Skipped when env vars are missing.
 */
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import { describe, expect, it } from "vitest";
import { PLAN_LIMITS } from "@/lib/entitlements";

function env() {
  try {
    for (const line of readFileSync(".env.local", "utf8").split("\n")) {
      const m = line.match(/^([A-Z_]+)=(.*)$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
    }
  } catch {}
  return { url: process.env.NEXT_PUBLIC_SUPABASE_URL, key: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY };
}
const { url, key } = env();
const run = url && key ? describe : describe.skip;
const db = () => createClient(url!, key!, { auth: { persistSession: false } });

run("public API boundaries (anon key)", () => {
  it("opens a published sample card without an account", async () => {
    const { data, error } = await db().rpc("get_public_card", { p_slug: "for-maya" });
    expect(error).toBeNull();
    expect((data as { state: string }).state).toBe("open");
  });

  it("returns nothing for unknown or malformed slugs", async () => {
    expect((await db().rpc("get_public_card", { p_slug: "doesnotexist1" })).data).toBeNull();
    expect((await db().rpc("get_public_card", { p_slug: "' or 1=1 --" })).data).toBeNull();
  });

  it("cannot read private tables directly", async () => {
    for (const table of ["cards", "profiles", "card_media", "subscriptions", "purchases", "group_contributions", "card_reactions", "delivery_jobs", "rate_limits", "payment_events"] as const) {
      const { data } = await db().from(table).select("*").limit(1);
      expect(data ?? [], table).toEqual([]);
    }
  });

  it("cannot write cards or call owner/admin/worker functions", async () => {
    const ins = await db().from("cards").insert({ experience_type: "letter", slug: "anonymous-card", card_data: {} });
    expect(ins.error).not.toBeNull();
    for (const [fn, args] of [
      ["admin_stats", {}],
      ["claim_due_deliveries", { p_limit: 1 }],
      ["publish_card", { p_card_id: "00000000-0000-0000-0000-000000000000" }],
      ["admin_set_suspension", { p_user: "00000000-0000-0000-0000-000000000000", p_suspend: true }],
    ] as const) {
      const r = await db().rpc(fn as never, args as never);
      expect(r.error, fn).not.toBeNull();
    }
  });

  it("serves the demo group invitation but refuses foreign attachments", async () => {
    const inv = await db().rpc("get_contribution_invite", { p_token: "DemoGroupCardHappyBirthdayLeo2026" });
    expect((inv.data as { recipientName: string }).recipientName).toBe("Leo");
    const bad = await db().rpc("submit_contribution", {
      p_token: "DemoGroupCardHappyBirthdayLeo2026",
      p_session: `vitest-${Date.now()}`,
      p_name: "Test",
      p_message: "Hi",
      p_color: "#F9D9D3",
      p_media: [{ path: "users/someone/private.jpg", type: "image" }],
    });
    expect(bad.error).not.toBeNull();
  });

  it("keeps plan limits in the database identical to the app's entitlements", async () => {
    const { data, error } = await db().from("plan_limits").select("*");
    expect(error).toBeNull();
    for (const row of data ?? []) {
      const l = PLAN_LIMITS[row.plan as keyof typeof PLAN_LIMITS];
      expect(row.max_live_cards).toBe(l.maxLiveCards);
      expect(row.max_photos_per_card).toBe(l.maxPhotosPerCard);
      expect(row.allow_scheduling).toBe(l.allowScheduling);
      expect(Number(row.storage_bytes)).toBe(l.storageBytes);
      expect(Number(row.max_video_bytes)).toBe(l.maxVideoBytes);
    }
  });

  it("does not let anonymous users sign storage URLs for private media", async () => {
    const r = await db().storage.from("card-media").createSignedUrl("users/00000000-0000-0000-0000-000000000000/x/y.jpg", 60);
    expect(r.data).toBeNull();
  });
});

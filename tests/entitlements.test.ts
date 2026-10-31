import { describe, expect, it } from "vitest";
import { can, maxBytesFor, mediaKindFor, PLAN_LIMITS } from "@/lib/entitlements";

describe("entitlements", () => {
  it("gates features by plan", () => {
    expect(can("free", "premium_templates")).toBe(false);
    expect(can("premium", "premium_templates")).toBe(true);
    expect(can("premium", "scheduling")).toBe(false);
    expect(can("pro", "scheduling")).toBe(true);
    expect(can("free", "ai")).toBe(false);
    expect(can("pro", "ai")).toBe(true);
    expect(can("free", "video_audio")).toBe(false);
  });

  it("applies the requested upload limits", () => {
    expect(maxBytesFor("free", "image")).toBe(10 * 1024 * 1024);
    expect(maxBytesFor("pro", "video")).toBe(50 * 1024 * 1024);
    expect(maxBytesFor("premium", "audio")).toBe(20 * 1024 * 1024);
  });

  it("only recognises safe media types", () => {
    expect(mediaKindFor("image/jpeg")).toBe("image");
    expect(mediaKindFor("video/webm")).toBe("video");
    expect(mediaKindFor("audio/mpeg")).toBe("audio");
    for (const bad of ["image/svg+xml", "text/html", "application/x-msdownload", "application/javascript", "image/gif"]) expect(mediaKindFor(bad), bad).toBeNull();
  });

  it("limits only increase with the plan", () => {
    for (const k of ["maxLiveCards", "maxPhotosPerCard", "maxPages", "storageBytes", "maxGroupContributors"] as const) {
      expect(PLAN_LIMITS.premium[k]).toBeGreaterThanOrEqual(PLAN_LIMITS.free[k]);
      expect(PLAN_LIMITS.pro[k]).toBeGreaterThanOrEqual(PLAN_LIMITS.premium[k]);
    }
  });
});

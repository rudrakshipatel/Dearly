import { describe, expect, it } from "vitest";
import { zonedLocalToUtc } from "@/lib/time";

describe("timezone-aware scheduling", () => {
  it("converts wall-clock times to UTC across DST", () => {
    expect(zonedLocalToUtc("2027-01-15T09:00", "Europe/London")).toBe("2027-01-15T09:00:00.000Z");
    expect(zonedLocalToUtc("2027-07-15T09:00", "Europe/London")).toBe("2027-07-15T08:00:00.000Z");
    expect(zonedLocalToUtc("2027-03-01T00:00", "Asia/Kolkata")).toBe("2027-02-28T18:30:00.000Z");
    expect(zonedLocalToUtc("2027-12-25T07:30", "America/New_York")).toBe("2027-12-25T12:30:00.000Z");
    expect(zonedLocalToUtc("2027-02-14T20:00", "Australia/Sydney")).toBe("2027-02-14T09:00:00.000Z");
  });
});

/** Timezone helpers for scheduling (no extra dependencies). */

export function userTimezone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}

export function timezones(): string[] {
  try {
    return (Intl as unknown as { supportedValuesOf(k: string): string[] }).supportedValuesOf("timeZone");
  } catch {
    return ["UTC", "Europe/London", "America/New_York", "America/Los_Angeles", "Asia/Kolkata", "Australia/Sydney", "Pacific/Auckland"];
  }
}

/** Offset (ms) of `tz` from UTC at the given instant. */
function offsetAt(tz: string, instant: Date) {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: tz, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit" })
    .formatToParts(instant)
    .reduce<Record<string, string>>((acc, p) => ((acc[p.type] = p.value), acc), {});
  const asUtc = Date.UTC(+parts.year, +parts.month - 1, +parts.day, +parts.hour, +parts.minute, +parts.second);
  return asUtc - instant.getTime();
}

/** Converts a wall-clock `YYYY-MM-DDTHH:mm` in `tz` to a UTC ISO string (DST-aware). */
export function zonedLocalToUtc(local: string, tz: string) {
  const [d, t] = local.split("T");
  const [y, m, day] = d.split("-").map(Number);
  const [hh, mm] = (t ?? "00:00").split(":").map(Number);
  const guess = Date.UTC(y, m - 1, day, hh, mm);
  let ts = guess - offsetAt(tz, new Date(guess));
  ts = guess - offsetAt(tz, new Date(ts)); // second pass settles DST transitions
  return new Date(ts).toISOString();
}

export function formatInZone(iso: string, tz: string) {
  return new Intl.DateTimeFormat("en", { timeZone: tz, weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit", timeZoneName: "short" }).format(new Date(iso));
}

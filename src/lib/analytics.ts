"use client";

/**
 * Product analytics (PostHog), loaded only after the visitor accepts analytics cookies.
 * Only event names and coarse, non-content properties are ever sent — never messages, names or photos.
 */
import { publicEnv } from "./env";

type Props = Record<string, string | number | boolean | null | undefined>;
type PH = { capture: (e: string, p?: Props) => void; identify: (id: string) => void; reset: () => void; opt_out_capturing: () => void };

const CONSENT_KEY = "dearly:analytics-consent";
let ph: PH | null = null;
let loading: Promise<PH | null> | null = null;

export function getConsent(): "granted" | "denied" | null {
  try {
    return (localStorage.getItem(CONSENT_KEY) as "granted" | "denied" | null) ?? null;
  } catch {
    return null;
  }
}

const consentListeners = new Set<() => void>();
export function subscribeConsent(cb: () => void) {
  consentListeners.add(cb);
  return () => {
    consentListeners.delete(cb);
  };
}

export function setConsent(v: "granted" | "denied") {
  try {
    localStorage.setItem(CONSENT_KEY, v);
  } catch {}
  consentListeners.forEach((l) => l());
  if (v === "granted") void load();
  else {
    ph?.opt_out_capturing();
    ph = null;
  }
}

async function load() {
  if (!publicEnv.posthogKey || getConsent() !== "granted") return null;
  loading ??= import("posthog-js").then(({ default: posthog }) => {
    posthog.init(publicEnv.posthogKey, {
      api_host: publicEnv.posthogHost,
      person_profiles: "identified_only",
      autocapture: false,
      capture_pageview: true,
      disable_session_recording: true,
      mask_all_text: true,
      mask_all_element_attributes: true,
    });
    ph = posthog as unknown as PH;
    return ph;
  });
  return loading;
}

export function track(event: string, props: Props = {}) {
  if (typeof window === "undefined" || getConsent() !== "granted") return;
  void load().then((p) => p?.capture(event, props));
}

export function identify(userId: string) {
  if (getConsent() !== "granted") return;
  void load().then((p) => p?.identify(userId));
}

export const analyticsAvailable = () => !!publicEnv.posthogKey;

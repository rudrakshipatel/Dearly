import "server-only";
import { serverEnv } from "./config";

/** Events we track. Properties are an allowlist of non-sensitive, non-content values. */
export type AnalyticsEvent =
  | "signup_completed"
  | "card_creation_started"
  | "template_selected"
  | "card_saved"
  | "card_published"
  | "card_shared"
  | "recipient_opened"
  | "interaction_completed"
  | "group_card_created"
  | "contribution_submitted"
  | "purchase_completed"
  | "subscription_started";

type Props = Record<string, string | number | boolean | null | undefined>;

/** Server-side capture (e.g. from verified webhooks). No-op when PostHog isn't configured. */
export async function capture(distinctId: string, event: AnalyticsEvent, props: Props = {}) {
  if (!serverEnv.posthogKey) return;
  try {
    await fetch(`${serverEnv.posthogHost}/i/v0/e/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ api_key: serverEnv.posthogKey, event, distinct_id: distinctId, properties: { ...props, $process_person_profile: false } }),
      signal: AbortSignal.timeout(3000),
    });
  } catch {
    // Analytics must never break a request.
  }
}

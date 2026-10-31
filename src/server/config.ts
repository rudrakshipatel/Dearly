import "server-only";

/**
 * Server-only secrets. Every integration reports whether it's configured so features can
 * fail clearly ("not configured") instead of pretending to work.
 */
const env = (name: string) => process.env[name] || "";

export const serverEnv = {
  supabaseServiceRoleKey: env("SUPABASE_SERVICE_ROLE_KEY"),
  stripeSecretKey: env("STRIPE_SECRET_KEY"),
  stripeWebhookSecret: env("STRIPE_WEBHOOK_SECRET"),
  razorpayKeyId: env("NEXT_PUBLIC_RAZORPAY_KEY_ID"),
  razorpayKeySecret: env("RAZORPAY_KEY_SECRET"),
  razorpayWebhookSecret: env("RAZORPAY_WEBHOOK_SECRET"),
  resendApiKey: env("RESEND_API_KEY"),
  emailFrom: env("EMAIL_FROM") || "Dearly <hello@dearly.app>",
  openaiApiKey: env("OPENAI_API_KEY"),
  openaiModel: env("OPENAI_MODEL") || "gpt-4.1-mini",
  geminiApiKey: env("GEMINI_API_KEY"),
  geminiModel: env("GEMINI_MODEL") || "gemini-2.5-flash",
  posthogKey: env("NEXT_PUBLIC_POSTHOG_KEY"),
  posthogHost: env("NEXT_PUBLIC_POSTHOG_HOST") || "https://eu.i.posthog.com",
  inngestEventKey: env("INNGEST_EVENT_KEY"),
  inngestSigningKey: env("INNGEST_SIGNING_KEY"),
  cronSecret: env("CRON_SECRET"),
};

export const integrations = {
  serviceRole: !!serverEnv.supabaseServiceRoleKey,
  stripe: !!serverEnv.stripeSecretKey,
  stripeWebhooks: !!serverEnv.stripeWebhookSecret,
  razorpay: !!(serverEnv.razorpayKeyId && serverEnv.razorpayKeySecret),
  razorpayWebhooks: !!serverEnv.razorpayWebhookSecret,
  email: !!serverEnv.resendApiKey,
  ai: !!(serverEnv.openaiApiKey || serverEnv.geminiApiKey),
  analytics: !!serverEnv.posthogKey,
  jobs: !!serverEnv.inngestEventKey || process.env.NODE_ENV !== "production",
};

export class NotConfiguredError extends Error {
  constructor(public integration: string, setting: string) {
    super(`${integration} isn't configured yet. Set ${setting} on the server (see docs/DEPLOYMENT.md).`);
  }
}

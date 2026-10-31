# Deploying Dearly

Stack: **Next.js 16 on Vercel** · **Supabase** (Postgres, Auth, Storage) · **Stripe** + **Razorpay** · **Resend** · **Inngest** · **PostHog** · **OpenAI or Gemini**.

Every integration reads its credentials from environment variables (see [`.env.example`](../.env.example)). When one isn't configured, the related feature returns a clear `503 not_configured` error instead of pretending to work.

## 1. Supabase

1. Create a project (or use the existing **Dearly** project, ref `vnripncsjdrjvjlovqko`, region eu-west-1).
2. Apply the schema. With the Supabase CLI:
   ```bash
   supabase link --project-ref <ref>
   supabase db push            # applies supabase/migrations/*.sql in order
   npm run db:seed             # regenerates and loads plan limits, occasions, templates, sample cards
   ```
   > The existing Dearly project already has every migration applied (some via the Supabase MCP, some via `supabase db query`), so its migration history table doesn't list all files. Before using `db push` against it, mark them applied:
   > `supabase migration repair --status applied 20261031000001 20261031000002 … 20261031000015`
3. **Storage**: migrations create two buckets — `card-media` (private; all access through RLS-checked signed URLs) and `catalog` (public; admin-only writes, template/occasion artwork). Nothing else needs to be public.
4. **Auth → URL configuration**: Site URL = your domain. Add redirect URLs: `https://your-domain/auth/callback`, `https://your-domain/auth/confirm`, and `http://localhost:3000/**` for development.
5. **Auth → Email templates**: the app supports both the confirmation *link* (`/auth/callback`) and the 6-digit *code* (the verify page calls `verifyOtp`). To show the code in emails, include `{{ .Token }}` in the "Confirm signup" template. Configure custom SMTP (e.g. Resend SMTP) for production — Supabase's default sender is rate-limited.
6. **Google sign-in**: Auth → Providers → Google. Create an OAuth client in Google Cloud Console (Web), authorised redirect URI `https://<ref>.supabase.co/auth/v1/callback`; paste client id/secret into Supabase.
7. **Admins**: promote a user in SQL (users can't do this themselves — a trigger blocks it):
   ```sql
   update public.profiles set role = 'admin' where id = (select id from auth.users where email = 'you@example.com');
   ```
8. Copy the **service role key** into `SUPABASE_SERVICE_ROLE_KEY` (server only). It's used by payment webhooks, the delivery worker, media cleanup and account deletion — never by request handlers acting for a user.

## 2. Vercel

1. Import the repository, framework preset Next.js.
2. Add every variable from `.env.example` (Production and Preview).
3. Deploy. `vercel.json` registers two daily cron jobs (`/api/cron/deliveries` at 08:00 UTC, `/api/cron/cleanup` at 03:30 UTC) authenticated with `CRON_SECRET` — Vercel Hobby allows at most daily crons. On a paid plan you can run deliveries every 5 minutes (`*/5 * * * *`); either way Inngest (below) delivers on time and the cron is only a safety net.

## 3. Background jobs (Inngest)

Scheduled delivery never depends on the browser:

- Publishing with a delivery time writes a `delivery_jobs` row (the source of truth) and sends the `dearly/card.delivery-scheduled` event.
- `deliver-scheduled-card` sleeps until the delivery time, then calls `claim_due_deliveries()` — an atomic `scheduled → sending` claim (`FOR UPDATE SKIP LOCKED`), so concurrent runs can't double-send. Emails use the job id as Resend's idempotency key. Failures retry with exponential backoff (5 attempts), then `failed`.
- `deliveries-sweep` (every 5 min) and `/api/cron/deliveries` are safety nets. Cancelling or unpublishing marks the job `cancelled`; rescheduling cancels and creates a new job.
- `media-cleanup` (daily) deletes abandoned uploads (pending > 24h) and media no card references for 30 days.

Setup: create an Inngest app, set `INNGEST_EVENT_KEY` and `INNGEST_SIGNING_KEY`, and register `https://your-domain/api/inngest`. Locally: `npx inngest-cli@latest dev` (it discovers `http://localhost:3000/api/inngest`).

## 4. Payments

The browser never decides entitlements — only verified webhooks write `subscriptions` / `purchases`, and the database derives the plan from them.

**Stripe** (all regions except India)
- Prices are created inline from `src/lib/data/pricing.ts` (regional price points, no currency conversion), so no dashboard products are required.
- Webhook endpoint: `https://your-domain/api/webhooks/stripe`, events: `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed`, `customer.subscription.created|updated|deleted`, `invoice.payment_failed`, `charge.refunded`. Put the signing secret in `STRIPE_WEBHOOK_SECRET`.
- Enable the Customer Portal (Settings → Billing → Customer portal) for invoices and payment methods.
- Local testing: `stripe listen --forward-to localhost:3000/api/webhooks/stripe`.

**Razorpay** (India, INR)
- Create four subscription plans (Premium/Pro × monthly/yearly) in the dashboard and set the `RAZORPAY_PLAN_*` ids. One-time products use Orders and need no setup.
- Webhook: `https://your-domain/api/webhooks/razorpay` with events `payment.captured`, `payment.failed`, `order.paid`, `refund.processed`, `subscription.activated|charged|pending|halted|cancelled|completed`. Set the secret in `RAZORPAY_WEBHOOK_SECRET`.

Both webhook handlers verify signatures, record each event id in `payment_events` for idempotency, and return 500 (so the provider retries) if processing fails.

## 5. Email (Resend)

Verify your sending domain, set `RESEND_API_KEY` and `EMAIL_FROM`. Used for scheduled card delivery and group-card invitations. (Auth emails are sent by Supabase — point its SMTP at Resend for one sender.)

## 6. AI (optional)

Set `OPENAI_API_KEY` (preferred; also used for input moderation) or `GEMINI_API_KEY`. AI is a Pro feature (300 generations/month, see `src/lib/entitlements.ts`), rate-limited to 10/minute per user, logged in `ai_generations` with token counts and estimated cost — never with the prompt or output text.

## 7. Analytics (optional)

Set `NEXT_PUBLIC_POSTHOG_KEY`. PostHog loads only after the visitor accepts the consent banner, with autocapture and session recording off. Events: `signup_completed, card_creation_started, template_selected, card_saved, card_published, card_shared, recipient_opened, interaction_completed, group_card_created, contribution_submitted, purchase_completed, subscription_started` — with coarse properties only (experience type, channel, plan), never names, messages or media.

## Production checklist

- [ ] All migrations applied; `npm run db:seed` run; `npm run test:rls` passes (47/47)
- [ ] Supabase Auth: site URL, redirect URLs, custom SMTP, Google provider
- [ ] `SUPABASE_SERVICE_ROLE_KEY` set (server only)
- [ ] Stripe live keys + webhook secret; Customer Portal enabled
- [ ] Razorpay live keys, plan ids, webhook secret
- [ ] Resend domain verified; `EMAIL_FROM` set
- [ ] Inngest keys set and `/api/inngest` registered (or Vercel cron + `CRON_SECRET`)
- [ ] At least one admin promoted
- [ ] Privacy policy and terms reviewed by counsel (current pages are marked as drafts)
- [ ] `npm run build`, `npm test`, `npm run lint` green

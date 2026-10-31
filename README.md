# dearly.

**Make someone feel special.** Interactive digital cards, letters, gift reveals, memory books and group cards — stored as structured content and played back by one card engine.

## Run it

```bash
npm install
cp .env.example .env.local     # fill in at least the Supabase URL + publishable key
npm run dev                    # http://localhost:3000
```

| Script | What it does |
| --- | --- |
| `npm run dev` / `build` / `start` | Next.js 16 (App Router, Cache Components, Turbopack) |
| `npm test` | Vitest: card engine, entitlements, webhook signatures, timezones, live anon-key boundary checks |
| `npm run test:rls` | 47 authorization checks against the linked Supabase database (rolled back) |
| `npm run db:seed` | Regenerates `supabase/seed.sql` from the TypeScript catalogue and loads it |
| `npm run lint` / `typecheck` | ESLint / TypeScript |

Setup for Supabase, payments, email, jobs, AI and analytics: **[docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)**. Security model and audit: **[docs/SECURITY.md](docs/SECURITY.md)**.

## Architecture

```
Browser (React)                         Next.js server                         Supabase
───────────────                         ──────────────                         ────────
src/lib/services  ── fetch ──▶  src/app/api/*  (route handlers)  ──▶  Postgres (RLS on every table)
  authService     ── supabase-js ─────────────────────────────────▶  Auth (email, Google, recovery)
  publicCardService ── RPC (anon) ────────────────────────────────▶  get_public_card, record_card_view, …
  uploadService  ── signed PUT ───────────────────────────────────▶  Storage: card-media (private)
                                       src/server/*   (services, payments, email, AI, jobs)
                                       src/app/api/webhooks/*  ──▶ Stripe / Razorpay → subscriptions
                                       src/app/api/inngest     ──▶ delivery worker, cleanup
```

- **Frontend** — `src/components`, unchanged design system from Prompt 1. Components talk only to `src/lib/services` (browser) — never to providers directly.
- **Backend services** — `src/server/` (`cards.ts`, `media.ts`, `catalog.ts`, `payments/`, `email.ts`, `ai.ts`, `jobs/`, `analytics.ts`, `http.ts` for auth/CSRF/errors/rate limits).
- **Database access** — `src/lib/supabase/{client,server}.ts` with generated types (`database.types.ts`). User requests use RLS-scoped clients; only webhooks/jobs use the service role.
- **Database** — `supabase/migrations/` (schema, entitlements + RLS, RPCs, storage, fixes), `supabase/seed.sql` (generated), `supabase/tests/rls_test.sql`.

### Universal card engine

Every card — letter, surprise, memories, reveal, together, classic, video — is one versioned JSON document in `cards.card_data`:

```
{ version: 2, experienceType, templateId, occasion, palette,
  theme { background, primaryColor, fontFamily },
  recipient { name, relationship? }, sender { name }, message, occasionDate?,
  photos [ { id, src: "media:<uuid>" | "scene:<name>", caption?, date? } ],
  interaction { mode, envelope*/gift*/hiddenMessage/quiz*/unlockAt/sound/audioSrc/videoSrc/extraSurprises/letterPages … },
  pages [ { id, background, pattern, elements [ text | image | sticker | shape | motif ] } ],
  settings { allowReactions, showBranding } }
```

- Schema + runtime validation: `src/lib/card-engine/schema.ts` (Zod; media sources are restricted to `media:`/`scene:`).
- Versioning: `migrateCardData()` upgrades older documents on read (v1 = the Prompt 1 browser format), so published cards keep rendering as the schema evolves.
- Rendering: `ExperiencePlayer` (`src/components/experiences/`) plays the opening interaction, the designed pages and the finale for every experience; media references resolve to short-lived signed URLs in batches (`src/lib/media/resolver.tsx`).
- Services: create, update (optimistic concurrency on `version`), duplicate, publish/schedule (`publish_card()`), retrieve (owner API / public RPC), archive, delete — `src/server/cards.ts` + `src/app/api/cards/**`.

### Key flows

| Flow | Where |
| --- | --- |
| Autosave (debounced, versioned, retry, conflict detection, local backup & restore) | `src/components/editor/use-autosave.ts` |
| Uploads (compress, thumbnail, progress, cancel, retry, verify) | `src/lib/media/process.ts`, `src/app/api/media/**` |
| Publishing & sharing (link, WhatsApp, email, native share, QR, OG image) | `src/components/card/manage-dialog.tsx`, `src/app/card/[slug]/opengraph-image.tsx` |
| Scheduled delivery | `publish_card()` → `delivery_jobs` → `src/server/jobs/*` |
| Group cards (token invitations, uploads, moderation) | `src/components/together/`, `src/components/dashboard/card-dialogs.tsx` |
| Payments & entitlements | `src/server/payments/*`, `src/lib/entitlements.ts`, `plan_limits` table |
| Admin | `src/app/admin/**` |

## Integrations requiring credentials

Supabase service role · Stripe · Razorpay · Resend · Inngest (or `CRON_SECRET`) · OpenAI or Gemini · PostHog · Google OAuth (configured in Supabase). See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).

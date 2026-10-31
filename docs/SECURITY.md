# Security model and checklist

## Principles

1. **The database is the last line of defence.** Row Level Security is on for every table. Ownership, plan limits and publishing rules are enforced by Postgres policies, triggers and functions — so they hold even if someone calls the Supabase API directly with their own session, bypassing the Next.js routes.
2. **Identity comes from the verified session**, never from the request body. API routes call `supabase.auth.getUser()` (validated with the Auth server) and act through an RLS-scoped client; `owner_id` is checked by policies (`owner_id = auth.uid()`).
3. **Anonymous access only through narrow functions.** Recipients and contributors never query tables. `get_public_card`, `record_card_view`, `submit_reaction`, `get_contribution_invite`, `submit_contribution`, `report_card` are `SECURITY DEFINER` functions that validate input, check state, rate-limit, and return only the fields needed.
4. **Secrets stay on the server.** Only `NEXT_PUBLIC_*` values reach the browser (URL, publishable key, Razorpay key id, PostHog key). The service-role key is used only by verified webhooks and background jobs.

## Checklist

| Requirement | How it's met |
| --- | --- |
| Supabase RLS | Enabled on all 20 public tables; policies in `20261031000002`, `…0012` |
| Server-side ownership validation | RLS + `can_edit_card()` / `owns_card()`; API routes never trust a client-supplied user id |
| Published cards don't expose drafts | `get_public_card` returns only `published` / due `scheduled`, not disabled, not expired, owner not suspended. Drafts return `null` (tested) |
| Anonymous users can't reach owner data | No anon policies on private tables; owner pages protected by `src/proxy.ts` and server checks (tested) |
| Contributors can't edit others' contributions | No table access for anon; submissions only via `submit_contribution`; moderation limited to card editors (tested) |
| Only owners publish/delete | `publish_card` / `unpublish_card` check `owner_id = auth.uid()`; direct status changes blocked by trigger; delete policy is owner-only (tested) |
| Premium validated server-side | `plan_limits` + `card_entitlement_violation()` run in the guard trigger on every publish and every edit of a live card; media trigger enforces type/size/quota; webhooks are the only writers of subscriptions/purchases (tested) |
| Unpredictable slugs/tokens | Slugs: 12 chars `[a-z0-9]` (~62 bits) from `gen_random_bytes`; contributor tokens: 32 chars `[A-Za-z0-9]` (~190 bits); the client can't choose either |
| Input validation | Zod on every API route and the full card document (`src/lib/card-engine/schema.ts`); CHECK constraints on every text/number column |
| Output sanitisation / XSS | React escaping everywhere; no `dangerouslySetInnerHTML`; media sources restricted to `scene:`/`media:<uuid>` (no `javascript:`/`data:`/external URLs); colours must be hex; email HTML escapes all user values |
| SQL injection | Parameterised PostgREST/RPC calls; search terms stripped of filter metacharacters; no dynamic SQL |
| File upload validation | Allow-list of MIME types (JPEG, PNG, WebP, MP4, WebM, MP3, M4A, …) at API, DB CHECK and bucket level; per-type size limits; images re-encoded in the browser (strips EXIF/GPS); stored object size/type re-verified before media is marked `ready` (mismatches deleted) |
| Signed media URLs | `card-media` bucket is private; URLs signed per request (1 h) only when storage policies allow (owner, public card, or approved contribution) |
| Rate limiting | `rate_limits` table: per-user buckets for API routes (create/save/publish/upload/AI/checkout/invites) and per-session + per-IP buckets for anonymous RPCs (views, reactions, contributions, reports, contact) |
| CSRF | Mutating API routes reject cross-origin `Origin` headers; Supabase cookies are `SameSite=Lax`; server actions use Next's built-in origin checks |
| Webhook verification | Stripe `constructEvent` with the signing secret; Razorpay HMAC-SHA256 with constant-time compare; idempotency via `payment_events` |
| Secure sessions | `@supabase/ssr` HTTP-only cookies refreshed in `src/proxy.ts`, JWT verified with `getClaims()` |
| Password reset | Supabase recovery links → `/auth/callback` (PKCE) → `/reset-password`; open redirects prevented (`next` must be a same-site path) |
| Card passwords | bcrypt (`crypt(…, gen_salt('bf', 10))`); signed media disabled for password-protected cards |
| Reporting & abuse | `report_card` (rate-limited) → admin moderation queue; moderators can disable cards (owners can't re-enable) and suspend accounts (suspended users' cards go offline, they can't publish or upload) |
| Data deletion | `/account`: download all data (`/api/me/export`), delete account (removes storage objects, then cascades all rows) |
| Privacy | Recipients are anonymous: views store a random per-browser session id (no IP, no user agent); IPs are used transiently for rate limiting only; analytics opt-in and content-free |
| Admin | `/admin` pages and server actions re-check `is_admin()` server-side; non-admins get 404; users can't change their own `role` (trigger) |

## Verified boundaries

`npm run test:rls` runs [`supabase/tests/rls_test.sql`](../supabase/tests/rls_test.sql) against the real database inside a rolled-back transaction (47 checks), and `npm test` includes anon-key integration tests. Covered: cross-user read/update/delete/publish, forged ownership, privilege escalation, direct status tampering, view-count tampering, plan limits (premium template, branding, scheduling, video, file size), un-uploaded media, password lock, disabled cards, anonymous table access, worker/admin RPCs, reaction rate limits, contributor token and attachment checks, moderation rights, scheduled sealing and cancellation.

## Audit findings (this pass)

- **Fixed — infinite recursion in RLS** between `cards` and `card_collaborators` policies (found by the RLS test suite); ownership checks moved to `SECURITY DEFINER` helpers (`…0012_fix_policy_recursion.sql`).
- **Fixed — anon catalogue reads failed** because policies called `is_admin()` without execute rights (`…0005`).
- **Fixed — media deletion with duplicated cards**: deleting a card no longer cascades media other cards still use (`…0006`).
- **Accepted — advisor warnings** "security definer function executable by anon/authenticated": these are the intended public entry points; each validates its inputs and state internally. `payment_events` and `rate_limits` intentionally have RLS with no policies (no client access).
- **Accepted (documented risk)** — anyone holding a group card's id can upload files into its `contributions/` folder while the card accepts contributions (needed for account-free contributors). Uploads are type/size-limited by the bucket and only become visible if the owner approves the contribution that references them; orphaned files are removed by the cleanup job.
- **Recommendation** — add a WAF/bot challenge in front of `/together/*` and `/card/*` reactions if abuse appears; database rate limits are per session/IP and can be evaded with many IPs.

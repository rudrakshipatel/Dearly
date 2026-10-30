# dearly.

**Make someone feel special.** Interactive digital cards, letters, gift reveals, memory books and group cards.

This repository is the complete frontend (Prompt 1). Every backend-dependent feature runs against a mock service layer in `src/lib/services`, which Prompt 2 replaces with real implementations.

## Run it

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # production build
npm run lint
```

Requires Node 20+. Next.js 16.4 (App Router, Cache Components, Turbopack), React 19, Tailwind CSS 4, Framer Motion, React Hook Form + Zod, Radix Dialog, Lucide.

Try these first:

- `/` → tap the envelope in the hero
- `/experiences` → five playable experiences in a phone frame
- `/create?template=tpl-confetti-cake` → the creation wizard, starting at step 4
- `/editor/demo` → the designer with a ready-made draft
- `/card/for-maya`, `/card/dear-sam`, `/card/our-story`, `/card/scratch-for-ava`, `/card/happy-birthday-leo`, `/card/open-next-year` → recipient experiences
- `/together/happy-birthday-leo` → sign a group card

## Structure

```
src/
  app/
    (site)/            pages with the shared nav + footer
      page.tsx           homepage (sections A–H)
      explore/           template library with search & filters
      occasions/[slug]   14 themed occasion collections (statically generated)
      experiences/       live demos of the five core experiences
      pricing/  dashboard/  together/[id]/  about/  contact/  help/  privacy/  terms/
    (auth)/            sign-in, sign-up, forgot-password, verify-email
    create/            7-step creation wizard
    editor/[id]/       the designer (desktop + mobile layouts)
    card/[slug]/       immersive recipient experience (no account needed)
  components/
    art/               illustrated motifs, scenes, stickers, template thumbnails (pure SVG, no image assets)
    experiences/       Letter, Surprise, Memories, Reveal (scratch/tap/flip/balloon/photo/quiz), Together, Video, CardStory, ExperiencePlayer
    editor/            store (undo/redo), canvas (drag/resize/rotate/snap), panels, properties, shell
    create/  card/  dashboard/  auth/  pricing/  explore/  templates/  occasions/  together/  info/  layout/  ui/
  lib/
    types.ts           domain model (Creation, CardPage, CardElement, InteractionSettings…)
    creation.ts        builds a creation + card pages from a template
    data/              occasions, palettes, experiences, 34 templates, 13 sample cards, regional pricing
    services/          mock AuthService, CreationService, ReceivedService, ReactionService, TogetherService, UploadService, BillingService
    hooks/             useUser, useMediaSrc, useNow, useMediaQuery, useAmbientSound
```

## Mock services (replace in Prompt 2)

All live in `src/lib/services/index.ts` behind TypeScript interfaces:

| Service | Mock behaviour |
| --- | --- |
| `authService` | Session in localStorage; any email + 8-char password signs in; Google is simulated; any 6 digits verify |
| `creationService` | Creations in localStorage; seeds example creations on first dashboard visit; `getBySlug` falls back to built-in sample cards |
| `receivedService` | Received/saved cards in localStorage |
| `reactionService` | Stores reactions locally |
| `togetherService` | Group contributions in localStorage; invitations are no-ops |
| `uploadService` | Images are downscaled to JPEG data URLs; video/audio stored in IndexedDB (`idb:` references) |
| `billingService` | Region from browser locale; checkout just sets the plan |
| `contactService` / `newsletterService` | Stored in local "outbox" keys |

Because storage is per-browser, a card published here only opens in the same browser. The built-in sample cards open anywhere.

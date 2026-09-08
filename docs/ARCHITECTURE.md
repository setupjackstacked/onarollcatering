# Architecture

One Next.js 16 (App Router) application, one repository, three surfaces:

| Surface | Route | Status |
|---|---|---|
| Public marketing site | `/` | Phase 1 — built |
| Management dashboard (native CRM/ops) | `/dashboard` | Phase 3+ — auth gate + stub only |
| Staff portal | `/staff` | Phase 12 — auth gate + stub only |

## Stack

Next.js 16 · React 19 · TypeScript (strict) · Tailwind v4 · Supabase (Postgres, Auth, Storage) · Resend · React Hook Form + Zod · Vitest · Vercel.

No external CRM. No CMS. No animation library (CSS transitions + IntersectionObserver).

## Directory layout

```
src/
  app/
    layout.tsx              root: self-hosted fonts, metadata
    globals.css             Tailwind v4 @theme brand tokens + utilities
    (marketing)/            public site (layout = header/footer)
    (auth)/dashboard/login  sign-in (stub until Phase 3)
    dashboard/              protected; Phase 3 shell
    staff/                  protected; Phase 12
    api/enquiry-upload/     multipart upload route handler
    sitemap.ts, robots.ts, not-found.tsx, error.tsx
  proxy.ts                  Next 16 "middleware": Supabase cookie refresh + optimistic auth gate
  content/                  structured marketing content (services, projects, homepage, about, faqs, site)
  components/
    marketing/              MarketingHeader, MobileNavigation, Hero, EditorialSplit, SectionIntro,
                            ServiceShowcase, ProjectFeature, ProjectGallery, StatStrip, ProcessTimeline,
                            QuoteCTA, Footer, LogoStrip, PageHero, Faqs, Breadcrumbs, QuoteForm, ContactForm
    motion/                 Reveal, CountUp, Parallax
    ui/                     Button/LinkButton, Field/Input/Textarea/Select/CheckboxTile
  features/
    enquiries/actions.ts    server actions: submitEnquiry, submitContactMessage
  lib/
    env/                    zod-validated env (public vs server-only)
    supabase/               client / server / admin (service role) / proxy helpers, DB types
    auth/                   session helpers (getCurrentUser, requireUser), permission map
    validation/             zod schemas shared by client + server
    email/                  Resend wrapper + branded templates
    storage/                enquiry upload validation (magic bytes) + private bucket write
    seo/                    JSON-LD components
    analytics/              privacy-conscious event bus (no vendor yet)
    logger.ts, rate-limit.ts, utils/cn.ts
  fonts/                    self-hosted woff2 (Cormorant Garamond, Inter variable)
supabase/
  migrations/               deterministic SQL migrations (tenancy, profiles, members, enquiries, RLS, buckets)
  seed.sql                  dev-only organisation seed
  config.toml               local Supabase CLI config
tests/                      vitest unit tests (validation, permissions)
docs/                       this file, CONTENT-TODO.md
```

## Tenancy & security model

* Every tenant-owned table carries `organisation_id`; `organisations` + `organisation_members` exist from day one.
* RLS is enabled on every table. Policies use `security definer` helper functions
  (`is_org_member`, `org_role`, `has_org_role`) to avoid recursive policy lookups.
* Roles: `owner | administrator | finance | project_manager | staff | read_only` (Postgres enum, mirrored in
  `lib/auth/permissions.ts`). Server code checks `hasPermission()`; RLS enforces independently.
* Three Supabase clients: browser (anon), server (anon + user cookies, RLS applies), admin (service role,
  server-only, used for public enquiry intake and future system jobs).
* `proxy.ts` refreshes the session cookie and redirects unauthenticated `/dashboard` + `/staff` requests.
  It is an optimistic gate only — layouts call `requireUser()` and RLS is the real boundary.
* Public enquiry flow: server action validates with Zod → inserts into `enquiries` via service role →
  Resend emails. Uploads go to the private `enquiry-uploads` bucket through a route handler that sniffs
  magic bytes and enforces size/type limits. In-memory rate limiting on both.
* Financial values will use `numeric(12,2)`; never floats. (No financial tables yet — Phase 5.)

## Content model (Phase 1)

Marketing content lives in `src/content/*.ts` as typed data, not inside components. `placeholder: true`
flags and `PLACEHOLDER` strings mark everything that must be confirmed by the business. Placeholder
projects are excluded from the sitemap and set `noindex`. `StatStrip` renders nothing until real figures
are supplied. Client logos are never rendered until approved (`LogoStrip` shows capability terms instead).

## Commands

```
npm run dev          # local dev
npm run check        # lint + typecheck + test + build
npm run lint / typecheck / test / build
npx supabase start   # local Supabase (needs Docker); applies migrations + seed
npx supabase db push # push migrations to a linked remote project
```

## Environment variables

See `.env.example`. Public: `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
Server-only: `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, `EMAIL_FROM`, `INTERNAL_NOTIFICATION_EMAIL`,
`ENQUIRY_ORGANISATION_ID`. The site builds and runs without any of them; enquiry persistence/email degrade
to logged warnings and the form reports an honest error if nothing could be recorded.

## Phase roadmap

See the master spec §103. Next: **Phase 2** (core CRM schema: leads, clients, client_contacts, sites,
projects, documents, activity_logs, notifications + RLS + seed) then **Phase 3** (auth + dashboard shell).

# Architecture

One Next.js 16 (App Router) application, one repository, three surfaces:

| Surface | Route | Status |
|---|---|---|
| Public marketing site | `/` | Phase 1 — built |
| Management dashboard (native CRM/ops) | `/dashboard` | Phase 3 — auth, shell, overview, search, notifications, settings (read) |
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
    (auth)/dashboard/       login, forgot-password, reset-password, auth/callback (PKCE)
    dashboard/              protected shell: layout (requireOrgContext), overview, notifications, settings, no-access
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
    dashboard/              DashboardShell, Sidebar, MobileNav, CommandPalette, AuthForm(s), primitives
                            (PageHeader, Metric, StatusBadge, EmptyState, Panel), OverviewView
  features/
    enquiries/actions.ts    server actions: submitEnquiry, submitContactMessage
    auth/actions.ts         signIn, signOut, requestPasswordReset, updatePassword
    dashboard/              navigation config, overview loader, ⌘K search action, notification actions
  lib/
    env/                    zod-validated env (public vs server-only)
    supabase/               client / server / admin (service role) / proxy helpers, DB types
    auth/                   session helpers, requireOrgContext() (user + org + role + RLS client), permission map
    domain/                 status vocabularies, address schema
    money/, dates/          integer-pence money helpers; DD/MM/YYYY formatting
    validation/             zod schemas shared by client + server
    email/                  Resend wrapper + branded templates
    storage/                enquiry upload validation (magic bytes) + private bucket write
    seo/                    JSON-LD components
    analytics/              privacy-conscious event bus (no vendor yet)
    logger.ts, rate-limit.ts, utils/cn.ts
  fonts/                    self-hosted woff2 (Cormorant Garamond, Inter variable)
supabase/
  migrations/               deterministic SQL migrations
                              0001 tenancy, profiles, members, enquiries, RLS helpers, buckets
                              0002 core CRM: lookups, clients, contacts, sites, leads, projects, documents,
                                   activity_logs, notifications, numbering, audit triggers, RLS
  seed.sql                  dev-only seed (org, 4 role users, SAMPLE client/contact/site/lead/project)
  tests/                    00_supabase_shim.sql (auth/storage emulation) + *.test.sql RLS tests
  config.toml               local Supabase CLI config
scripts/
  db-test.sh                throwaway Postgres 16 → shim → migrations → seed → RLS tests
  db-types.sh + gen-types.py  regenerate src/lib/supabase/types.ts from the migrated schema
tests/                      vitest unit tests (validation, permissions, money)
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
* Money is `numeric(12,2)` in Postgres (arrives as a string via PostgREST) and integer pence in TS
  (`lib/money`). Derived values (gross profit, margin) are views (`project_financials`), never columns.
* Per-org, per-year document numbering (`OAR-P-2026-0001`, later `OAR-Q-…`, `OAR-INV-…`) via
  `next_document_number()` backed by a `number_sequences` counter table — numbers are never reused.
* `activity_logs` is append-only; written by `log_activity()` (security definer, member-checked) and by
  audit triggers on lead/project status changes. Authenticated users have no insert policy on it.
* Project managers can only see/update projects where `project_manager_id = auth.uid()`; documents attached
  to projects inherit that rule via `can_read_project()` / `can_write_project()`.
* Lookups that may need to be configurable (lead sources, service types, document categories) are
  org-scoped tables seeded for every organisation by trigger, not enums.

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

## Database testing

`npm run db:test` needs PostgreSQL 16 binaries locally (no Docker, no Supabase project). It initialises a
throwaway cluster, applies `supabase/tests/00_supabase_shim.sql` (emulates `auth.uid()`, `auth.users`,
`storage.buckets`, the `authenticated` role), runs every migration and the seed, then executes
`supabase/tests/*.test.sql`. Tests set `request.jwt.claim.sub` + `role = authenticated` to act as specific
users and assert cross-tenant isolation and role behaviour. Add a test file whenever a migration adds RLS.

## Dashboard request flow

`proxy.ts` (edge) refreshes the Supabase cookie and bounces anonymous requests to `/dashboard/login`.
`app/dashboard/layout.tsx` then calls `requireOrgContext()`, which resolves the user, their first accepted
membership (organisation + role) and an RLS-scoped Supabase client; users with no membership land on
`/dashboard/no-access`. Pages and server actions receive `ctx.can(permission)` for UI gating, while the
database enforces the same matrix through RLS. Navigation items for unbuilt modules are rendered disabled
with their phase number rather than hidden or faked.

## Phase roadmap

See the master spec §103. Done: Phase 0–3. Next: **Phase 4** — native CRM: enquiries inbox →
lead conversion, leads pipeline, clients + contacts + sites, projects + tasks + documents, activity
timeline, notes, assignment, filters, team invitations/roles in Settings.

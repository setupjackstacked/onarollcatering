# Operations platform expansion — codebase review and plan

Written after inspecting the current repository at commit `9593350`. Nothing below is assumed; every claim
about what exists was checked against the code.

**Headline:** roughly 60% of what the brief asks for is already built. The genuinely new work is vouchers,
internal messaging, the invoice approval workflow, the merged payment pack, sick-note uploads and the public
team page. The rest is extending what is there — mostly by making **sites** a first-class operational unit
alongside projects, which they currently are not.

Three decisions need answering before I write schema. They are in §11 at the end.

---

## 1. Current architecture

One Next.js 16 (App Router) application, one repository, deployed on Vercel, backed by Supabase.

| Layer | What it is |
|---|---|
| Public site | `src/app/(marketing)/*`, content as typed data in `src/content/*.ts` |
| Dashboard | `src/app/dashboard/*`, server components by default |
| Staff portal | `src/app/staff/*`, mobile-first, separate shell, bottom tab bar |
| Customer pages | `/q/[token]`, `/i/[token]` — token-addressed, no login |
| Domain logic | `src/features/<domain>/{schema,queries,actions}.ts` — 21 domains |
| Shared | `src/lib/{auth,money,dates,forms,pdf,email,supabase,domain}` |
| Database | 38 tables, 3 views, 12 migrations, RLS on every table |

React 19, TypeScript strict, Tailwind v4 (tokens in `globals.css`), Recharts for reports,
`@react-pdf/renderer` for documents, Resend for email. No CMS, no external CRM, no paid SaaS beyond Supabase,
Vercel and Resend.

Conventions worth keeping: money is `numeric(12,2)` in Postgres and integer pence in TypeScript; totals are
always recalculated server-side; permissions are enforced in RLS *and* in server code, never by hiding UI.

## 2. Current routes

Public: `/`, `/services`, `/services/[slug]`, `/projects`, `/projects/[slug]`, `/about`, `/contact`,
`/quote`, `/privacy`, `/terms`.

Dashboard (34 pages): overview, enquiries, leads, clients (+7 tabs), sites, projects (+9 tabs), tasks,
documents, quotes, invoices, payments, expenses, payroll, employees (+5 tabs), rota, timesheets, leave,
suppliers, equipment, reports, notifications, settings, settings/catalogue.

Staff portal (8 pages): home, shifts, timesheets, timesheets/new, leave, leave/new, documents, profile.

API: `/api/documents/upload`, `/api/documents/[id]`, `/api/quotes/[id]/pdf`, `/api/invoices/[id]/pdf`,
`/api/enquiry-upload`, `/api/cron/daily`, `/dashboard/payroll/[id]/export`.

## 3. Supabase tables relevant to this expansion

Already present and reusable:

| Concept in brief | Existing table | Fit |
|---|---|---|
| Sites | `sites` | Partial — see §10 |
| Staff accounts | `employees` + `profiles` + `organisation_members` | Good, missing site link |
| Timesheets | `timesheets` (draft/submitted/approved/rejected/paid) | Good |
| Holiday / sick | `leave_requests` (holiday/sick/unpaid/other) | Good, missing document link |
| Staff documents | `documents` (`entity_type='employee'`, expiry + verification) | Good |
| Notifications | `notifications` (type, user, read_at, dedupe_key, href) | Good |
| Invoices | `invoices`, `invoice_items`, `payments` | Good for money, missing workflow |
| Invoice documents | `documents` (`entity_type='invoice'`) | Good |
| Audit trail | `activity_logs` (append-only, no user insert policy) | Good |
| Clients | `clients`, `client_contacts` | Good |
| Reporting | 9 `report_*` SQL functions | Extend |

Not present at all: vouchers/meal logging, messaging/conversations, invoice workflow stages, generated
payment packs, site↔staff assignment, site managers.

## 4. Current authentication

Supabase Auth with cookie sessions (`@supabase/ssr`). `src/proxy.ts` refreshes the session and bounces
anonymous requests from `/dashboard` and `/staff` — an optimistic gate only. The real check is
`requireOrgContext()` in `src/lib/auth/context.ts`, which resolves the user, their accepted membership
(organisation + role) and an RLS-scoped Supabase client.

Roles today are a Postgres enum with six values: `owner`, `administrator`, `finance`, `project_manager`,
`staff`, `read_only`. They are mapped to eleven permissions in `src/lib/auth/permissions.ts`
(`sales.read`, `finance.write`, `workforce.read`, …). RLS uses security-definer helpers — `is_org_member`,
`role_in(org, variadic roles)`, `can_read_project`, `can_write_project` — so policies don't recurse.

Anyone with the `staff` role is redirected from `/dashboard` to `/staff`.

## 5. Existing invoice functionality

More than the brief assumes. Invoices are raised from an accepted quote (full, deposit %, milestone, final)
or from scratch; issuing assigns `OAR-INV-YYYY-####`, derives the due date from the client's payment terms
and **freezes the line items**. Payments are recorded against the invoice and `amount_paid` is maintained by
trigger, moving status through `part_paid` → `paid`; a nightly sweep marks `overdue`. Corrections are made by
credit note or cancellation, never by editing. Customers get a token-addressed page with a PDF.

What is missing is exactly what the brief describes: the **approval journey** — site sign-off, procurement,
payment certificate, finance submission — and the document pack that goes with it.

**This matters for the design.** The existing `invoice_status` tracks *money* (is it paid?). The brief's
statuses track *paperwork* (where is it in the approval chain?). An invoice can be "awaiting procurement" and
"unpaid" at the same time — they are two independent axes. Collapsing them into one enum would break payment
maths, the overdue sweep, credit notes and five reports. So I propose a second column, `workflow_stage`, with
its own enum and its own events table, sitting alongside the existing status. Both shown on the case page.

## 6. Existing client and site functionality

`clients` (billing address, payment terms, contacts) and `sites` (name, address, postcode, site contact,
access details, lat/long) both exist, with full CRUD and RLS. A site belongs to a client.

**The gap:** `sites` is currently a *place attached to a client*, not an *operating unit*. It has no manager,
no assigned staff, no status. Operational scoping today hangs off `projects` — a project has a
`project_manager_id`, and `can_read_project()` / `can_write_project()` decide who sees timesheets, costs,
documents and shifts. `employees` has no `site_id` at all.

The brief asks for site-centric operations: staff belong to a site, managers manage one or more sites. That
is the single largest schema change and it is addressed in §8 and §11.

## 7. Components that can be reused

Nearly everything. No new design system is needed.

Dashboard: `DataTable` (responsive table → cards on mobile), `FilterBar`, `PageHeader`, `Metric`, `Panel`,
`StatusBadge`, `EmptyState`, `EntityHeader`, `Tabs`, `DescriptionList`, `ActionLink`, `ConfirmAction`
(confirmation dialog for destructive actions), `ActivityTimeline`, `NotesPanel`, `DocumentsPanel` (upload +
list + archive), `RelativeTime`, `CommandPalette`, `RotaWeek`, `LineBuilder`, charts in `charts.tsx`.

Forms: `Form` (server actions + `useActionState` + inline field errors, works without JS), `TextField`,
`SelectField`, `MoneyField`, `DateField`, `CheckboxField`, `TextArea`, `SubmitButton`, `FormRow`,
`FormSection`.

Staff portal: `StaffTabs`, `ShiftCard`, `LogHoursForm`, `RequestLeaveForm`, `ContactDetailsForm`.

Infrastructure: `parseForm(schema, formData)`, `requireOrgContext()`, `listActivity()`, the document upload
route (RLS-checked insert first, then service-role storage write), `renderDocumentPdf()`, `sendMail()`,
`next_document_number()`, `notify_roles()`, `formatGBP` / `toPence`, `formatDateUK`.

Public site: `PageHero`, `SectionIntro`, `EditorialSplit`, `Reveal`, `MarketingHeader` nav config in
`src/content/site.ts`. `about.leadership` is already an empty typed array waiting for real people — the Meet
the Team page can use it directly.

## 8. Schema changes required

Additive only. No table is dropped, no column is removed, nothing existing is rewritten.

**Migration 0013 — sites as operating units**
- `sites`: add `site_type` (`kitchen` | `project_site`), `status`, `oar_manager_id`, `site_manager_name`,
  `site_manager_email`, `site_manager_phone` (the client's person on the ground, not an OAR user).
- `site_assignments` — `site_id`, `user_id`, `role` (`manager` | `staff`), `is_primary`, dates. This is how
  one manager covers several sites and how staff belong to a primary site.
- `employees`: add `primary_site_id`.
- New helpers `can_read_site(site)` / `can_write_site(site)` mirroring the project ones, plus
  `my_site_ids()`. Every operational policy gains a site branch **in addition to** its project branch, so
  existing project-scoped access keeps working untouched.

**Migration 0014 — vouchers**
- `voucher_categories` — org-scoped lookup, admin-editable, seeded (vouchers used, free meals, complimentary
  meals, staff meals), `sort_order`, `active`. Same pattern as `lead_sources`.
- `voucher_entries` — `site_id`, `entry_date`, `recorded_by`, `notes`; `voucher_entry_lines` —
  `category_id`, `quantity`. One submission per site per day, editable same-day, then locked to managers.
- `report_vouchers(org, from, to, site, category)` SQL function for day/week/month/site/category reporting.

**Migration 0015 — sick documentation**
- `leave_requests`: add `document_id` (→ `documents`), `document_required` (set when `leave_type='sick'` and
  the absence exceeds a threshold — see §11), `document_received_at`.
- New employee document category `sick-note`.

**Migration 0016 — messaging**
- `conversations` (`kind`: direct | site | broadcast, `site_id`, `subject`, `last_message_at`),
  `conversation_participants` (`user_id`, `last_read_at`, `muted`), `messages` (`body`, `sender_id`,
  `document_id` for attachments). Unread = messages after `last_read_at`. No realtime subscription in V1 —
  polling on navigation plus a notification row; realtime can be added later without schema change.

**Migration 0017 — invoice workflow**
- `invoices`: add `workflow_stage` (new enum), `site_id`, `assigned_to`, `stage_changed_at`,
  `client_reference`, `on_hold_reason`.
- `invoice_events` — `invoice_id`, `action`, `user_id`, `from_stage`, `to_stage`, `note`, `document_id`,
  `created_at`. Append-only, no user delete policy, mirroring `activity_logs`.
- New invoice document categories: original invoice, original estimate, signed estimate, site approval,
  payment certificate, procurement documentation, supporting, backup, receipt, correspondence, payment proof,
  final pack.
- `payments`: add the bank reconciliation columns now so a future feed needs no redesign —
  `bank_transaction_id`, `bank_account_id`, `transaction_date`, `transaction_reference`,
  `reconciliation_status`, `reconciled_by`, `reconciled_at`. Unused in V1.

**Migration 0018 — payment packs**
- `generated_payment_packs` — `invoice_id`, `version`, `document_id`, `generated_by`, `generated_at`,
  `source_document_ids` (jsonb array, so you can see exactly what went into each version). Versions are
  retained; nothing is overwritten.

**Migration 0019 — reporting and roles**
- New `report_*` functions for hours by employee/site, holiday, sickness, vouchers, invoices by client/site,
  average payment time and workflow bottlenecks.
- Role handling per the decision in §11.

One new dependency: **`pdf-lib`** (MIT, no service, no subscription) to merge PDFs and convert JPG/PNG pages.
It runs inside the existing Node route handlers.

One new storage bucket: `site-documents` (private, same signed-URL pattern as the others).

## 9. New routes required

Dashboard: `/dashboard/sites/[id]` gains tabs (overview, staff, timesheets, vouchers, leave, documents,
invoices); `/dashboard/sites/[id]/edit`, `/dashboard/sites/new`; `/dashboard/vouchers`,
`/dashboard/vouchers/[date]`; `/dashboard/messages`, `/dashboard/messages/[id]`, `/dashboard/messages/new`;
`/dashboard/invoices/[id]` extended into a case page with `/documents` and `/timeline`;
`/api/invoices/[id]/pack` (generate), `/api/invoices/[id]/pack/[version]` (download);
`/dashboard/leave` gains an org-wide calendar view; `/dashboard/reports` gains workforce and voucher reports
with CSV export at `/dashboard/reports/[report]/export`.

Staff portal: `/staff/vouchers`, `/staff/vouchers/new`, `/staff/messages`, `/staff/messages/[id]`,
`/staff/leave/sick` (with document upload), `/staff/timesheets` gains a week/calendar view.

Public: `/meet-the-team`, plus a nav entry in `src/content/site.ts` and a `src/content/team.ts` of clearly
marked placeholders.

## 10. Potential conflicts with existing functionality

1. **Sites vs projects.** Covered above. Resolution: sites become operating units *in addition to* projects,
   not instead of them. A kitchen is a site; a fit-out contract stays a project. Both can scope a timesheet.
2. **Six roles vs three.** Removing enum values is destructive and would break every policy. Resolution in §11.
3. **Two invoice status axes.** Resolution: `workflow_stage` alongside `status`, never merged.
4. **Invoice immutability.** The brief's workflow implies documents get added to an invoice after it is
   issued. That is fine — the existing freeze applies to *line items and amounts*, not to documents or
   workflow stage. No guard is loosened.
5. **Six staff tabs on a phone.** The brief lists Home, Timesheets, Leave, Vouchers, Messages, Profile. Five
   is the comfortable maximum at 360px. Resolution: five tabs (Home, Hours, Leave, Vouchers, Messages) with
   Profile in the header, where it already is.
6. **"Shifts" isn't in the brief's staff nav** but the rota drives "today's shift" on the staff home page.
   Resolution: keep the rota, surface shifts inside Home rather than as its own tab.
7. **`workforce.read` excludes `finance`.** Managers of sites will need to see their staff's hours. The
   permission map needs a small revision, not a rewrite.
8. **Timesheet approval is project-scoped** (`can_write_project`). It gains a site branch so a site manager
   can approve without being a project manager.
9. **Currency.** Flagged in §11 — this one blocks work.

Nothing in the plan requires deleting or rewriting a working feature.

## 11. Three decisions needed, and the proposed sequence

> **Answered 16 September 2026.** Euro (Irish business). Three roles presented over
> the existing six. A doctor's note is required for **every** sick absence, with no
> self-certification window. Sites and staff operations built first.
>
> Delivered: phases A–E and most of F. See the commit log from `573aff3` onward.

### Decision 1 — currency (blocking)

The brief's audit example reads **€18,420** and asks about **Bank of Ireland**. The platform is built
entirely in **GBP**: `formatGBP()`, `currency char(3) default 'GBP'`, UK date format, UK VAT rates, a
reference to the Late Payment of Commercial Debts (Interest) Act 1998 in the invoice terms.

Which is right? Options: (a) it is a GBP business and the € was illustrative — nothing changes; (b) it is a
EUR business — I change the money formatter, the default currency and the VAT defaults, a contained change;
(c) both, invoicing in either — that needs a currency per client and per invoice, which is a bigger job and
affects every report that sums money.

**Answer: euro.** The money layer now formats `en-IE` euro, documents default to
`EUR`, addresses default to `IE`, and the seeded VAT rates are Irish: 23% standard,
13.5% reduced, **9% for catering and hot food** (the rate that took effect on
1 July 2026), zero and exempt. A per-document `currency` override is kept, so
sterling invoicing remains possible if it is ever needed. Existing VAT rates that
had been edited by hand were left alone; only untouched UK defaults were re-pointed.

The public site still describes UK coverage in `src/content/about.ts` and carries a
+44 placeholder phone number — that is copy, not code, and is listed in
`docs/CONTENT-TODO.md` for the client to confirm.

### Decision 2 — roles

The brief wants three roles. Six exist. I propose **keeping the enum** and presenting three labels:

| Brief | Maps to | Meaning |
|---|---|---|
| ADMIN | `owner`, `administrator` | Everything. Amy is an `administrator` — not hard-coded |
| MANAGER | `project_manager` | Scoped to assigned sites *and* assigned projects |
| STAFF | `staff` | Own record only |

`finance` and `read_only` stay available but are not offered by default in the invite form. This keeps every
existing policy working. The alternative — collapsing to three enum values — means rewriting all 60-odd RLS
policies and risks losing the finance/read-only distinction the invoice module relies on. **Answer: keep six, present three.** `src/lib/auth/roles.ts` is the single place the
two vocabularies meet — Admin, Manager and Staff are what the interface offers, and
Finance and Read only remain available for the people who need them.

### Decision 3 — sick note threshold

"A doctor's note must be uploaded when required by the workflow." Required when? Common UK/IE practice is
after seven consecutive calendar days (self-certification below that). **Answer: every sick absence.** Set by trigger on `leave_requests`, so it holds
however the row is created. Staff report the absence immediately and upload the note
when they have it; until then the absence is flagged outstanding on the staff home
screen, the manager's leave list, the absence report and the nightly alert sweep.

### Bank of Ireland — answered

Direct integration is **not available** to On A Roll without a regulated intermediary. Bank of Ireland's
developer portal requires enrolment on the Open Banking Directory as a regulated **AISP, PISP or CBPII**,
plus a valid **eIDAS QWAC certificate** meeting the PSD2 ETSI profile, and onboarding through their Dynamic
Client Registration API. There is no provision for an ordinary business to read its own account data.
Becoming an AISP means Central Bank of Ireland (or FCA) authorisation — months of work, capital
requirements, ongoing compliance. Not proportionate here.

So: manual reconciliation in V1, as the brief instructs, with the `payments` table already carrying the
bank-feed columns. If you later want automatic matching, the realistic route is a licensed aggregator
(TrueLayer, Yapily, Plaid and similar are the usual names) — all paid, none introduced without your approval.

### Proposed sequence

| Phase | Work | Why here |
|---|---|---|
| A | Sites as operating units, site assignments, role mapping, permission revisions, `/staff` shell updates | Everything else scopes to a site; this has to land first |
| B | Vouchers (staff entry + manager review + reporting), sick-note uploads, timesheet calendar view, leave calendar | The daily-use features — fastest visible value for 25 staff |
| C | Messaging, notification extensions, management overview widgets | Needs A's site scoping to address "my site's staff" |
| D | Invoice workflow, case page, document categories, event timeline, payment tracking extensions | Independent of A–C; can be reordered if invoicing is more urgent |
| E | Payment pack generation, reports and CSV export | Needs D's document categories |
| F | Meet the Team page, mobile pass over everything, BOI documentation | Polish |

Each phase ends with `npm run check` (lint, types, unit tests, database RLS tests, production build) and a
migration you paste into Supabase, same as the previous twelve.

If invoicing is the bigger day-to-day pain, say so and I will run D and E first — they share no schema with
A–C.

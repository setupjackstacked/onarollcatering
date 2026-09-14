@AGENTS.md

# On A Roll Catering — working notes for future phases

Read `docs/ARCHITECTURE.md` first. The master spec (`docs/MASTER-SPEC.md`) governs scope. Phases 0–12 are
built; further work is either fixing what exists or a new module agreed with the client.

Hard rules
- The dashboard IS the CRM. Never integrate an external CRM.
- `organisation_id` on every tenant-owned table; RLS on every table; permissions enforced server-side AND in RLS.
- Money = `numeric(12,2)` in Postgres, integer pence or decimal strings in TS. Never float. Recalculate totals server-side.
- Cost price never reaches customer-facing output. Public quote/invoice URLs use random tokens, never sequential IDs.
- Never invent facts, statistics, client names or logos. Placeholders are labelled in `src/content/*` and `docs/CONTENT-TODO.md`.
- Don't fake functionality: hide it, disable it, or label it "Phase N".
- Financial documents are immutable once issued: quotes freeze on send (new revision), invoices freeze on
  issue (credit note or cancel). Never loosen those guards to make an edit easier.
- Timesheet hours feed both project cost and payroll. Approved sheets keep the rate snapshot they were
  approved at; paid sheets are frozen.
- Employee pay, address and notes are owner/administrator only. Schedulers use the `employee_directory`
  view. Staff may change only their phone and emergency contact.
- Schema changes only via `supabase/migrations`. After any migration: `npm run db:types` (regenerates `src/lib/supabase/types.ts`) and `npm run db:test` (RLS tests on a local Postgres; add a `supabase/tests/NN_*.test.sql` for new policies).

Conventions
- Server components by default; `"use client"` only for interactivity.
- Content in `src/content`, domain logic in `src/features/<domain>` and `src/lib`, no business rules inside UI.
- Tailwind v4 tokens live in `src/app/globals.css` (`@theme`). Use `surface-*`, `eyebrow`, `display-*`, `container-x` utilities.
- Motion: `Reveal`, `CountUp`, `Parallax` in `src/components/motion`; respect reduced motion.
- Before finishing a phase: `npm run check`, then screenshot public pages at 390/768/1440 (`node scripts/screenshot-pages.mjs` against `next start -p 3100`; needs `playwright` installed globally or as a dev dep).
- Reports and alerts are SQL functions (`report_*`, `generate_alerts`). Add new figures there, not as
  client-side aggregation, so RLS keeps deciding what each role can see.
- The nightly job is `/api/cron/daily`, scheduled in `vercel.json` and protected by `CRON_SECRET`.

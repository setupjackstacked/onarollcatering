@AGENTS.md

# On A Roll Catering — working notes for future phases

Read `docs/ARCHITECTURE.md` first. The master spec (`docs/MASTER-SPEC.md`) governs scope; implement one phase at a time and stop for review.

Hard rules
- The dashboard IS the CRM. Never integrate an external CRM.
- `organisation_id` on every tenant-owned table; RLS on every table; permissions enforced server-side AND in RLS.
- Money = `numeric(12,2)` in Postgres, integer pence or decimal strings in TS. Never float. Recalculate totals server-side.
- Cost price never reaches customer-facing output. Public quote/invoice URLs use random tokens, never sequential IDs.
- Never invent facts, statistics, client names or logos. Placeholders are labelled in `src/content/*` and `docs/CONTENT-TODO.md`.
- Don't fake functionality: hide it, disable it, or label it "Phase N".
- Schema changes only via `supabase/migrations`. Regenerate `src/lib/supabase/types.ts` with `supabase gen types` once a project exists.

Conventions
- Server components by default; `"use client"` only for interactivity.
- Content in `src/content`, domain logic in `src/features/<domain>` and `src/lib`, no business rules inside UI.
- Tailwind v4 tokens live in `src/app/globals.css` (`@theme`). Use `surface-*`, `eyebrow`, `display-*`, `container-x` utilities.
- Motion: `Reveal`, `CountUp`, `Parallax` in `src/components/motion`; respect reduced motion.
- Before finishing a phase: `npm run check`, then screenshot public pages at 390/768/1440 (`node scripts/screenshot-pages.mjs` against `next start -p 3100`; needs `playwright` installed globally or as a dev dep).

# On A Roll Catering — website + operations platform

Premium B2B marketing site and (in later phases) a native CRM / operations dashboard for
On A Roll Catering. Single Next.js 16 app on Supabase + Vercel.

* Architecture: [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)
* Outstanding real content: [`docs/CONTENT-TODO.md`](docs/CONTENT-TODO.md)

## Quick start

```bash
cp .env.example .env.local   # fill in Supabase + Resend when available (site runs without them)
npm install
npm run dev                  # http://localhost:3000
npm run check                # lint + typecheck + tests + production build
```

## Supabase

```bash
npx supabase start           # local stack (Docker) — applies supabase/migrations + seed.sql
npx supabase link --project-ref <ref>
npx supabase db push         # apply migrations to the remote project
```

Create the first dashboard user in Supabase Auth, then link them as `owner` using the snippet in
`supabase/seed.sql`.

## Deployment (Vercel)

Set the variables from `.env.example` in Vercel (Preview and Production separately, pointing at separate
Supabase projects). Add each deployment URL to Supabase Auth → Redirect URLs.

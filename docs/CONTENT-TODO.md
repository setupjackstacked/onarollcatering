# Content required from On A Roll Catering before launch

Everything below is currently a labelled placeholder. Nothing has been invented.

## Company facts — `src/content/site.ts`
- [ ] Phone number
- [ ] Enquiries email address (and the mailbox to receive internal alerts — `INTERNAL_NOTIFICATION_EMAIL`)
- [ ] Registered / trading address (also decides whether `LocalBusiness` schema is emitted)
- [ ] Legal entity name, company number, VAT number (footer)
- [ ] Geographic coverage statement
- [ ] Social links (LinkedIn etc.)

## Homepage — `src/content/homepage.ts`
- [ ] Hero image or video (currently an Unsplash placeholder — see `src/content/images.ts`)
- [ ] Capability image
- [ ] Statistics (years operating, meals served, kitchens delivered, contracts, locations) — `StatStrip` is hidden until supplied

## Services — `src/content/services.ts`
- [ ] One strong photograph per service (6)
- [ ] Any accreditations, certifications or capacity figures to add (none claimed at present)
- [ ] Confirm staffing page framing (no recruitment-agency implication — currently framed as contract delivery)

## Projects — `src/content/projects.ts`
- [ ] Real case studies (all three are `placeholder: true`, labelled "Sample", noindexed and excluded from the sitemap)
- [ ] Client approval for any named client — **Pfizer is not referenced anywhere and must not be until approved**
- [ ] Photography per project (cover + gallery)

## About — `src/content/about.ts`
- [ ] Founder / company story
- [ ] Experience statement
- [ ] Leadership profiles (optional)
- [ ] Coverage

## Operational settings — set these in the dashboard or Vercel, not in code
- [ ] `INVOICE_PAYMENT_DETAILS` (Vercel env): bank name, sort code, account number printed on every invoice
      and on the customer invoice page. Until it is set, invoices say "Bank details to be supplied".
- [ ] `CRON_SECRET` (Vercel env): any long random string. Without it the nightly alert job refuses to run.
- [ ] `RESEND_API_KEY` + verified sending domain: until this is configured, quote and invoice emails fail
      cleanly and you share the customer link manually instead.
- [ ] VAT rates — Settings → Catalogue & VAT. Standard 20%, reduced 5%, zero and exempt are seeded; confirm.
- [ ] Quote catalogue and equipment prices — Settings → Catalogue, and Equipment.
- [ ] Employee roles — seeded with the nine roles from the spec; add your own if they differ.
- [ ] Default payment terms per client (days) — set on each client record; invoices derive the due date.

## Legal
- [ ] Privacy policy (`/privacy`)
- [ ] Website terms (`/terms`)

## Brand
- [ ] Vector logo (SVG). Current assets are extracted from the supplied JPEG: `public/brand/logo-copper.png`,
      `mark-copper.png`, `logo-horizontal.png` (composed for the header). Replace files in place; no code change needed.
- [ ] Open Graph image (currently the Unsplash hero)

## Placeholder photography
All imagery is currently hotlinked from Unsplash (Unsplash License — free for commercial use, no attribution required) via `src/content/images.ts`. It is review-only. Replace each key with the company's own photography; drop files in `public/images/` and change the path — no component changes needed.

## Photography direction (spec §97)
Industrial kitchens, site compounds, modular units, installation, teams at work, dining facilities.
No cupcakes, coffee cups, restaurant tables or stock chefs.

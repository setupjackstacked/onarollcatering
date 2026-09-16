# On A Roll Catering — operations platform expansion, delivered

Built on top of the existing application. Nothing was rebuilt, no working feature was removed, and every
addition extends the schema and components that were already there.

## Apply it in this order

1. **Supabase → SQL Editor:** run `apply-migrations-0013-0017.sql`, then `apply-migrations-0018-0020.sql`.
   Each is one transaction, so a failure applies nothing.
2. **Pull and push:**
   ```
   cd ~/Downloads/onarollcatering
   git pull ~/Downloads/onarollcatering-ops-complete.bundle main
   git push
   ```
3. Nothing new is required in Vercel. `INVOICE_PAYMENT_DETAILS`, `CRON_SECRET` and `RESEND_API_KEY` are the
   same three variables as before.

## The four decisions, and what they mean in the code

**Euro.** The money layer now formats euro in the Irish locale, documents default to `EUR`, and addresses
default to `IE`. VAT rates are seeded Irish: 23% standard, 13.5% reduced, **9% catering and hot food** — the
rate that took effect on 1 July 2026 — plus zero and exempt. A per-document currency override is kept, so
sterling invoicing is still possible if it is ever needed. Rates you had already edited by hand were left
alone; only untouched UK defaults were re-pointed.

The public website still describes UK coverage and carries a +44 placeholder number. That is copy rather than
code, and it is listed in `docs/CONTENT-TODO.md` for you to confirm.

**Three roles over six.** `src/lib/auth/roles.ts` is the one place the two vocabularies meet. The interface
offers Admin, Manager and Staff; Finance and Read only remain for the people who need them. Amy is an
`administrator` — nothing is hard-coded to her.

**A doctor's note for every sick absence.** Enforced by a database trigger, so it holds however the record is
created. Staff report the absence immediately and upload the note when they have it.

**Sites and staff operations first,** then invoicing.

## What changed

**Sites are now operating units.** Previously a site was just a place attached to a client, and everything
operational hung off *projects*. A site now has a status, an On A Roll manager, the client's site manager,
and a roster of assigned staff and managers. `can_read_site()` / `can_write_site()` mirror the project
helpers, and every operational policy gained a site branch **alongside** its existing project branch — so a
kitchen is a site, a fit-out contract is still a project, and nothing that worked before stopped working.
A site manager can now approve their team's hours and leave without being an administrator.

**Vouchers and meals.** One entry per site per day, with a quantity against each category. The staff screen is
built for a phone one-handed: big plus and minus buttons, a running total, one request to save. Categories are
an admin-editable lookup, so adding "Contractor meals" needs no code change — and free and complimentary
categories are flagged separately, which is what the business actually wants to watch. Managers confirm a day,
which locks it to staff edits. Reporting rolls up by day, week or month, site and category.

**Sick leave.** Reported in one tap, note uploaded later. Until the note arrives the absence is flagged on the
staff home screen, the manager's leave list, the absence report and the nightly alert. A note belonging to
another employee cannot be attached — that is enforced in the database, not just the interface.

**Messaging.** Direct threads (one per pair, reused), site team threads whose roster follows the site
assignments, and announcements. Posting notifies everyone else in the thread. Messages cannot be edited or
deleted, and administrators are not given a blanket read of other people's direct messages — they can be added
to a thread, not silently read one.

**Invoices became cases.** The existing `status` still tracks the money. A new `workflow_stage` tracks the
paperwork: sent to site → site approved → with procurement → procurement approved → payment certificate →
ready for finance → with finance → awaiting payment → paid → closed, plus query, on hold and rejected. They
are independent, because an invoice really can be "with procurement" and unpaid at once. Issuing starts the
chain; settling closes it. Every stage change, document, payment, note and pack generation lands in
`invoice_events`, which is append-only — there is no update or delete policy on it at all.

**The final payment pack.** One button produces one PDF: the invoice (rendered fresh), then the payment
certificate, the signed estimate and the backup documentation, then everything else. Images become A4 pages.
Anything that cannot be merged — a Word file, a corrupt PDF — is **reported back to you by name**, not
silently dropped. Each generation is a numbered version and earlier packs are kept, so what was actually sent
to a client can always be produced again. Filenames look like
`OAR_OAR-INV-2026-0041_NORTHGATE_FINAL.pdf`. Built with pdf-lib — free, MIT, no subscription.

**Reports and exports.** Hours by employee and by site, holiday and sickness, vouchers, the invoice approval
chain, how long clients take to pay, outstanding debt and cost breakdown — each exporting to CSV. The export
runs the same RLS-scoped query as the screen, so a manager exports only their own sites. Values that would be
read as spreadsheet formulas are neutralised.

**Meet the Team** at `/meet-the-team`, in the site navigation. It contains no invented people: until you
supply real names, roles and photographs it shows the four group descriptions and says the team is being
photographed, and it stays out of search and the sitemap.

**The nightly job** also chases sick notes that never arrived, invoice cases that have not moved in three
weeks, and kitchens that logged nothing yesterday.

## Bank of Ireland

Direct integration is not available to On A Roll. Bank of Ireland's developer portal requires enrolment on the
Open Banking Directory as a regulated **AISP, PISP or CBPII**, a valid **eIDAS QWAC certificate** meeting the
PSD2 ETSI profile, and onboarding through their Dynamic Client Registration API. There is no provision for an
ordinary business to read its own account. Becoming an AISP means Central Bank of Ireland authorisation —
months of work, capital requirements, ongoing compliance. Not proportionate here.

So payment reconciliation is manual, as the brief instructs. The `payments` table already carries
`bank_transaction_id`, `bank_account_id`, `transaction_date`, `transaction_reference`, `reconciliation_status`,
`reconciled_by` and `reconciled_at`, so a feed can be added later without redesigning anything. If you ever
want automatic matching, the realistic route is a licensed aggregator — all paid, none introduced without
your approval.

## Testing

`npm run check` passes: lint, TypeScript, 35 unit tests, 12 database suites and a production build. The
database tests run against a real PostgreSQL instance and assert the things that would actually hurt if they
broke: that a site manager can approve their own team's hours but not their own timesheet; that staff cannot
edit a day a manager has confirmed; that someone outside a conversation can neither read it nor post into it;
that a sick note belonging to another employee cannot be attached; that the invoice case history cannot be
rewritten or deleted; and that moving an invoice through procurement does not touch whether it has been paid.

## What still needs you

`docs/CONTENT-TODO.md` has the full list. The ones that matter most: confirm the VAT rate for each service
with your accountant, supply the Irish phone number and address, decide the coverage wording now that it is an
Irish business, and send real names and photographs for Meet the Team.

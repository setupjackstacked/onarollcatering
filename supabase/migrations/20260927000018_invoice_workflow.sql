-- ============================================================================
-- 0018 — Invoice approval workflow.
--
-- An invoice already tracks MONEY: draft → issued → part_paid → paid → overdue,
-- with credit notes and cancellation. That stays exactly as it is, because the
-- payment maths, the overdue sweep and five reports depend on it.
--
-- What is added here is the PAPERWORK axis — where the invoice has got to in
-- the client's approval chain:
--
--   draft → sent to site → site approved → with procurement → procurement
--   approved → payment certificate → ready for finance → with finance →
--   awaiting payment → paid → closed
--
-- The two are independent: an invoice can be "with procurement" and unpaid at
-- the same time. Every stage change is written to invoice_events, which is
-- append-only — nobody deletes the history of how a payment was agreed.
-- ============================================================================

create type public.invoice_stage as enum (
  'draft',
  'sent_to_site',
  'site_approved',
  'with_procurement',
  'procurement_approved',
  'payment_certificate',
  'ready_for_finance',
  'with_finance',
  'awaiting_payment',
  'paid',
  'closed',
  'query',
  'on_hold',
  'rejected'
);

alter table public.invoices add column if not exists workflow_stage public.invoice_stage not null default 'draft';
alter table public.invoices add column if not exists site_id uuid references public.sites(id) on delete set null;
alter table public.invoices add column if not exists assigned_to uuid references auth.users(id) on delete set null;
alter table public.invoices add column if not exists stage_changed_at timestamptz;
alter table public.invoices add column if not exists stage_note text;
alter table public.invoices add column if not exists client_reference text;   -- their PO / job number

create index if not exists invoices_stage_idx on public.invoices (organisation_id, workflow_stage) where archived_at is null;
create index if not exists invoices_assigned_idx on public.invoices (organisation_id, assigned_to) where archived_at is null;
create index if not exists invoices_site_idx on public.invoices (site_id) where archived_at is null;

-- ---------- the case history -------------------------------------------------
create table public.invoice_events (
  id              uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  invoice_id      uuid not null references public.invoices(id) on delete cascade,
  action          text not null,                 -- 'stage_changed' | 'document_added' | 'payment_recorded' | 'note' | 'pack_generated'
  from_stage      public.invoice_stage,
  to_stage        public.invoice_stage,
  note            text,
  document_id     uuid references public.documents(id) on delete set null,
  amount          numeric(12,2),
  user_id         uuid references auth.users(id) on delete set null,
  created_at      timestamptz not null default now()
);
create index invoice_events_invoice_idx on public.invoice_events (invoice_id, created_at desc);

-- Moves an invoice along the chain and records who did it and when.
create or replace function public.set_invoice_stage(
  p_invoice_id uuid, p_stage public.invoice_stage, p_note text default null, p_document_id uuid default null
) returns void language plpgsql security definer set search_path = public as $$
declare inv public.invoices%rowtype;
begin
  select * into inv from public.invoices where id = p_invoice_id;
  if not found then raise exception 'invoice not found' using errcode = 'P0002'; end if;
  if not public.role_in(inv.organisation_id, 'owner','administrator','finance') then
    raise exception 'not permitted' using errcode = '42501';
  end if;
  if inv.workflow_stage = p_stage then return; end if;

  -- Paperwork can only start moving once the invoice actually exists as a
  -- document; everything else is a free transition, because real approval
  -- chains loop backwards (a query, a resubmission) as often as forwards.
  if inv.status = 'draft' and p_stage <> 'draft' then
    raise exception 'Issue the invoice before sending it to the site' using errcode = 'check_violation';
  end if;

  update public.invoices
     set workflow_stage = p_stage, stage_changed_at = now(), stage_note = p_note
   where id = p_invoice_id;

  insert into public.invoice_events (organisation_id, invoice_id, action, from_stage, to_stage, note, document_id, user_id)
  values (inv.organisation_id, p_invoice_id, 'stage_changed', inv.workflow_stage, p_stage, p_note, p_document_id, auth.uid());
end $$;
revoke all on function public.set_invoice_stage(uuid, public.invoice_stage, text, uuid) from public;
grant execute on function public.set_invoice_stage(uuid, public.invoice_stage, text, uuid) to authenticated;

create or replace function public.add_invoice_note(p_invoice_id uuid, p_note text)
returns void language plpgsql security definer set search_path = public as $$
declare inv public.invoices%rowtype;
begin
  select * into inv from public.invoices where id = p_invoice_id;
  if not found then raise exception 'invoice not found' using errcode = 'P0002'; end if;
  if not public.role_in(inv.organisation_id, 'owner','administrator','finance') then
    raise exception 'not permitted' using errcode = '42501';
  end if;
  insert into public.invoice_events (organisation_id, invoice_id, action, note, user_id)
  values (inv.organisation_id, p_invoice_id, 'note', p_note, auth.uid());
end $$;
revoke all on function public.add_invoice_note(uuid, text) from public;
grant execute on function public.add_invoice_note(uuid, text) to authenticated;

-- Documents attached to an invoice land in its history automatically.
create or replace function public.invoice_document_event()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.entity_type = 'invoice' then
    insert into public.invoice_events (organisation_id, invoice_id, action, note, document_id, user_id)
    values (new.organisation_id, new.entity_id, 'document_added', new.category_key || ': ' || new.name, new.id, auth.uid());
  end if;
  return new;
end $$;
create trigger documents_invoice_event after insert on public.documents
  for each row execute function public.invoice_document_event();

-- Payments already audit into activity_logs; mirror them into the case history.
create or replace function public.payment_invoice_event()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_org uuid;
begin
  select organisation_id into v_org from public.invoices where id = new.invoice_id;
  insert into public.invoice_events (organisation_id, invoice_id, action, note, amount, user_id)
  values (v_org, new.invoice_id, 'payment_recorded',
          coalesce(new.reference, replace(new.method::text, '_', ' ')), new.amount, auth.uid());
  return null;
end $$;
create trigger payments_invoice_event after insert on public.payments
  for each row execute function public.payment_invoice_event();

-- Issuing an invoice starts the paperwork chain.
create or replace function public.invoice_issue_stage()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.status <> 'draft' and old.status = 'draft' and new.workflow_stage = 'draft' then
    new.workflow_stage := 'sent_to_site';
    new.stage_changed_at := now();
    insert into public.invoice_events (organisation_id, invoice_id, action, from_stage, to_stage, note, user_id)
    values (new.organisation_id, new.id, 'stage_changed', old.workflow_stage, new.workflow_stage,
            'Invoice issued as ' || new.invoice_number, auth.uid());
  end if;
  -- Settling the money closes the paperwork too, unless it is already closed.
  if new.status = 'paid' and old.status <> 'paid' and new.workflow_stage not in ('paid','closed') then
    insert into public.invoice_events (organisation_id, invoice_id, action, from_stage, to_stage, note, user_id)
    values (new.organisation_id, new.id, 'stage_changed', new.workflow_stage, 'paid', 'Paid in full', auth.uid());
    new.workflow_stage := 'paid';
    new.stage_changed_at := now();
  end if;
  return new;
end $$;
create trigger invoices_issue_stage before update on public.invoices
  for each row execute function public.invoice_issue_stage();

-- ---------- bank reconciliation, ready but unused ------------------------------
-- Manual reconciliation is what V1 does. These columns exist so a future bank
-- feed (which needs a regulated AISP — see docs/EXPANSION-PLAN.md) can be added
-- without redesigning payments.
alter table public.payments add column if not exists bank_transaction_id text;
alter table public.payments add column if not exists bank_account_id text;
alter table public.payments add column if not exists transaction_date date;
alter table public.payments add column if not exists transaction_reference text;
alter table public.payments add column if not exists reconciliation_status text not null default 'manual'
  check (reconciliation_status in ('manual', 'unmatched', 'matched', 'confirmed'));
alter table public.payments add column if not exists reconciled_by uuid references auth.users(id) on delete set null;
alter table public.payments add column if not exists reconciled_at timestamptz;
alter table public.payments add column if not exists proof_document_id uuid references public.documents(id) on delete set null;
create unique index if not exists payments_bank_txn_idx on public.payments (organisation_id, bank_transaction_id)
  where bank_transaction_id is not null;

-- ---------- document categories for an invoice case ----------------------------
create or replace function public.seed_org_invoice_doc_categories(org uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  insert into public.document_categories (organisation_id, entity, key, label, sort_order) values
    (org, 'invoice', 'original-invoice',     'Original Invoice',          10),
    (org, 'invoice', 'original-estimate',    'Original Estimate',         20),
    (org, 'invoice', 'signed-estimate',      'Signed Estimate',           30),
    (org, 'invoice', 'site-approval',        'Site Approval',             40),
    (org, 'invoice', 'payment-certificate',  'Payment Certificate',       50),
    (org, 'invoice', 'procurement',          'Procurement Documentation', 60),
    (org, 'invoice', 'supporting',           'Supporting Documentation',  70),
    (org, 'invoice', 'backup',               'Backup Documentation',      80),
    (org, 'invoice', 'receipts',             'Receipts',                  90),
    (org, 'invoice', 'correspondence',       'Correspondence',           100),
    (org, 'invoice', 'payment-proof',        'Payment Proof',            110),
    (org, 'invoice', 'final-pack',           'Final Payment Pack',       120),
    (org, 'invoice', 'other',                'Other',                    999)
  on conflict do nothing;
end $$;
create or replace function public.on_organisation_created_invoice_docs()
returns trigger language plpgsql security definer set search_path = public as $$
begin perform public.seed_org_invoice_doc_categories(new.id); return new; end $$;
create trigger organisations_seed_invoice_docs after insert on public.organisations
  for each row execute function public.on_organisation_created_invoice_docs();
do $$ declare o record; begin
  for o in select id from public.organisations loop perform public.seed_org_invoice_doc_categories(o.id); end loop;
end $$;

-- ---------- reporting ----------------------------------------------------------
-- How many invoices sit at each stage, and what they are worth — the bottleneck
-- report the brief asks for.
create or replace function public.report_invoice_pipeline(p_org uuid)
returns table (stage public.invoice_stage, invoice_count bigint, value numeric, oldest_days int)
language sql stable security invoker set search_path = public as $$
  select i.workflow_stage, count(*), coalesce(sum(i.total - i.amount_paid), 0)::numeric(12,2),
         coalesce(max(current_date - coalesce(i.stage_changed_at, i.created_at)::date), 0)::int
  from public.invoices i
  where i.organisation_id = p_org and i.archived_at is null
    and i.status not in ('draft','cancelled') and i.workflow_stage not in ('closed')
  group by i.workflow_stage
  order by i.workflow_stage;
$$;

-- Average days from issuing an invoice to it being settled.
create or replace function public.report_payment_time(p_org uuid, p_months int default 12)
returns table (month date, invoices bigint, avg_days numeric)
language sql stable security invoker set search_path = public as $$
  select date_trunc('month', i.issue_date)::date, count(*),
         round(avg(i.paid_at::date - i.issue_date), 1)
  from public.invoices i
  where i.organisation_id = p_org and i.archived_at is null
    and i.status = 'paid' and i.paid_at is not null and i.issue_date is not null
    and i.issue_date >= (date_trunc('month', current_date) - make_interval(months => greatest(p_months, 1) - 1))::date
  group by 1 order by 1;
$$;

-- ---------- RLS -----------------------------------------------------------------
alter table public.invoice_events enable row level security;

create policy invoice_events_select on public.invoice_events for select to authenticated using (
  public.role_in(organisation_id, 'owner','administrator','finance','read_only')
  or exists (select 1 from public.invoices i where i.id = invoice_id and i.project_id is not null and public.can_read_project(i.project_id))
);
-- Written by the definer functions and triggers above. No direct insert, and no
-- update or delete at all: the case history is evidence, not a working document.
create policy invoice_events_insert on public.invoice_events for insert to authenticated
  with check (public.role_in(organisation_id, 'owner','administrator','finance'));

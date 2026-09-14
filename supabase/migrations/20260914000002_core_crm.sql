-- ============================================================================
-- 0002 — Core CRM model
-- leads, clients, client_contacts, sites, projects, documents, activity_logs,
-- notifications + lookup enums, RLS, indexes, soft deletion, storage buckets.
-- ============================================================================
-- Design notes
--   * Every table: uuid pk, organisation_id, created_at/updated_at, RLS.
--   * Commercial records (clients, projects, leads, documents) soft-delete via
--     archived_at. Nothing financial is ever hard-deleted.
--   * Derived money values (gross profit, margin) are NOT stored — see the
--     project_financials view. Stored money is numeric(12,2).
--   * Enums are used for closed, spec-defined status lists. Things likely to
--     become configurable (lead sources, document categories) are text with a
--     check against a lookup table so they can be extended without a migration.
-- ============================================================================

-- ---------- enums ----------------------------------------------------------
create type public.lead_status as enum (
  'new', 'contacted', 'qualified', 'site_survey', 'quote_required',
  'quote_sent', 'negotiation', 'won', 'lost'
);

create type public.project_status as enum (
  'lead', 'quoted', 'approved', 'planning', 'mobilisation', 'procurement',
  'installation', 'operational', 'on_hold', 'completed', 'cancelled'
);

create type public.document_entity as enum (
  'client', 'project', 'employee', 'quote', 'invoice', 'supplier', 'lead', 'site'
);

create type public.notification_type as enum (
  'invoice_overdue', 'quote_expiring', 'timesheet_pending', 'document_expiring',
  'staffing_conflict', 'task_overdue', 'project_deadline', 'enquiry_received', 'system'
);

-- ---------- lookup tables (org-scoped, seeded with defaults) --------------
create table public.lead_sources (
  id              uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  key             text not null,
  label           text not null,
  sort_order      int  not null default 0,
  active          boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (organisation_id, key)
);
create trigger lead_sources_updated_at before update on public.lead_sources
  for each row execute function public.set_updated_at();

create table public.service_types (
  id              uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  key             text not null,
  label           text not null,
  sort_order      int  not null default 0,
  active          boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (organisation_id, key)
);
create trigger service_types_updated_at before update on public.service_types
  for each row execute function public.set_updated_at();

create table public.document_categories (
  id              uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  entity          public.document_entity not null,
  key             text not null,
  label           text not null,
  sort_order      int  not null default 0,
  active          boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (organisation_id, entity, key)
);
create trigger document_categories_updated_at before update on public.document_categories
  for each row execute function public.set_updated_at();

-- Default lookup rows for every organisation (existing and future).
create or replace function public.seed_org_defaults(org uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  insert into public.lead_sources (organisation_id, key, label, sort_order) values
    (org, 'website',      'Website enquiry', 10),
    (org, 'referral',     'Referral',        20),
    (org, 'tender',       'Tender',          30),
    (org, 'phone',        'Phone',           40),
    (org, 'email',        'Email',           50),
    (org, 'linkedin',     'LinkedIn',        60),
    (org, 'existing',     'Existing client', 70),
    (org, 'other',        'Other',           99)
  on conflict do nothing;

  insert into public.service_types (organisation_id, key, label, sort_order) values
    (org, 'commercial-catering',       'Commercial Catering',       10),
    (org, 'commercial-kitchen-design', 'Commercial Kitchen Design', 20),
    (org, 'modular-kitchens',          'Modular Kitchen',           30),
    (org, 'kitchen-fit-out',           'Kitchen Fit-Out',           40),
    (org, 'catering-staffing',         'Staffing',                  50),
    (org, 'equipment',                 'Equipment',                 60),
    (org, 'consultancy',               'Consultancy',               70),
    (org, 'other',                     'Other',                     99)
  on conflict do nothing;

  insert into public.document_categories (organisation_id, entity, key, label, sort_order) values
    (org, 'project', 'contracts',         'Contracts',         10),
    (org, 'project', 'drawings',          'Drawings',          20),
    (org, 'project', 'site-surveys',      'Site Surveys',      30),
    (org, 'project', 'risk-assessments',  'Risk Assessments',  40),
    (org, 'project', 'method-statements', 'Method Statements', 50),
    (org, 'project', 'specifications',    'Specifications',    60),
    (org, 'project', 'certificates',      'Certificates',      70),
    (org, 'project', 'equipment-data',    'Equipment Data',    80),
    (org, 'project', 'photos',            'Photos',            90),
    (org, 'project', 'correspondence',    'Correspondence',    100),
    (org, 'project', 'other',             'Other',             999),
    (org, 'client',  'contracts',         'Contracts',         10),
    (org, 'client',  'correspondence',    'Correspondence',    20),
    (org, 'client',  'other',             'Other',             999),
    (org, 'lead',    'tender-documents',  'Tender Documents',  10),
    (org, 'lead',    'drawings',          'Drawings',          20),
    (org, 'lead',    'other',             'Other',             999),
    (org, 'site',    'site-surveys',      'Site Surveys',      10),
    (org, 'site',    'photos',            'Photos',            20),
    (org, 'site',    'other',             'Other',             999)
  on conflict do nothing;
end $$;

create or replace function public.on_organisation_created()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform public.seed_org_defaults(new.id);
  return new;
end $$;

create trigger organisations_seed_defaults after insert on public.organisations
  for each row execute function public.on_organisation_created();

-- backfill for organisations that already exist
do $$ declare o record; begin
  for o in select id from public.organisations loop perform public.seed_org_defaults(o.id); end loop;
end $$;

-- ---------- clients --------------------------------------------------------
create table public.clients (
  id              uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  name            text not null,
  legal_name      text,
  company_number  text,
  vat_number      text,
  email           text,
  phone           text,
  website         text,
  billing_address jsonb not null default '{}'::jsonb,   -- {line1,line2,city,county,postcode,country}
  trading_address jsonb not null default '{}'::jsonb,
  payment_terms_days int not null default 30 check (payment_terms_days between 0 and 365),
  notes           text,
  owner_user_id   uuid references auth.users(id) on delete set null,   -- account owner internally
  archived_at     timestamptz,
  created_by      uuid references auth.users(id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index clients_org_name_idx on public.clients (organisation_id, lower(name));
create index clients_org_active_idx on public.clients (organisation_id) where archived_at is null;
create trigger clients_updated_at before update on public.clients
  for each row execute function public.set_updated_at();

-- ---------- client_contacts ------------------------------------------------
create table public.client_contacts (
  id              uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  client_id       uuid not null references public.clients(id) on delete cascade,
  first_name      text not null,
  last_name       text not null default '',
  job_title       text,
  email           text,
  mobile          text,
  phone           text,
  is_primary      boolean not null default false,
  is_finance      boolean not null default false,
  is_project      boolean not null default false,
  notes           text,
  archived_at     timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index client_contacts_client_idx on public.client_contacts (client_id);
create index client_contacts_org_email_idx on public.client_contacts (organisation_id, lower(email));
-- at most one primary contact per client
create unique index client_contacts_one_primary on public.client_contacts (client_id)
  where is_primary and archived_at is null;
create trigger client_contacts_updated_at before update on public.client_contacts
  for each row execute function public.set_updated_at();

-- ---------- sites ----------------------------------------------------------
create table public.sites (
  id              uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  client_id       uuid not null references public.clients(id) on delete cascade,
  name            text not null,
  address         jsonb not null default '{}'::jsonb,
  postcode        text,
  site_contact_id uuid references public.client_contacts(id) on delete set null,
  access_details  text,
  notes           text,
  latitude        numeric(9,6),
  longitude       numeric(9,6),
  archived_at     timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index sites_client_idx on public.sites (client_id);
create index sites_org_idx on public.sites (organisation_id);
create trigger sites_updated_at before update on public.sites
  for each row execute function public.set_updated_at();

-- ---------- leads ----------------------------------------------------------
create table public.leads (
  id                  uuid primary key default gen_random_uuid(),
  organisation_id     uuid not null references public.organisations(id) on delete cascade,
  title               text not null,
  status              public.lead_status not null default 'new',
  client_id           uuid references public.clients(id) on delete set null,
  contact_id          uuid references public.client_contacts(id) on delete set null,
  -- captured before a client record exists (from enquiries):
  company_name        text,
  contact_name        text,
  contact_email       text,
  contact_phone       text,
  source_key          text not null default 'other',
  service_keys        text[] not null default '{}',
  estimated_value     numeric(12,2) check (estimated_value is null or estimated_value >= 0),
  currency            char(3) not null default 'GBP',
  project_location    text,
  expected_start_date date,
  assigned_user_id    uuid references auth.users(id) on delete set null,
  notes               text,
  lost_reason         text,
  enquiry_id          uuid references public.enquiries(id) on delete set null,
  converted_project_id uuid,                     -- FK added after projects table
  closed_at           timestamptz,
  archived_at         timestamptz,
  created_by          uuid references auth.users(id) on delete set null,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);
create index leads_org_status_idx on public.leads (organisation_id, status) where archived_at is null;
create index leads_org_assigned_idx on public.leads (organisation_id, assigned_user_id);
create index leads_client_idx on public.leads (client_id);
create trigger leads_updated_at before update on public.leads
  for each row execute function public.set_updated_at();

-- close timestamp maintenance
create or replace function public.leads_set_closed_at()
returns trigger language plpgsql as $$
begin
  if new.status in ('won','lost') and (old.status is distinct from new.status) then
    new.closed_at = now();
  elsif new.status not in ('won','lost') then
    new.closed_at = null;
  end if;
  return new;
end $$;
create trigger leads_closed_at before update on public.leads
  for each row execute function public.leads_set_closed_at();

-- enquiries → leads link (column existed from 0001 without FK)
alter table public.enquiries
  add constraint enquiries_lead_fk foreign key (lead_id) references public.leads(id) on delete set null;

-- ---------- projects -------------------------------------------------------
create sequence public.project_number_seq;

create table public.projects (
  id                  uuid primary key default gen_random_uuid(),
  organisation_id     uuid not null references public.organisations(id) on delete cascade,
  project_number      text not null,                        -- OAR-P-YYYY-#### (assigned by trigger)
  name                text not null,
  description         text,
  status              public.project_status not null default 'lead',
  client_id           uuid not null references public.clients(id) on delete restrict,
  site_id             uuid references public.sites(id) on delete set null,
  lead_id             uuid references public.leads(id) on delete set null,
  project_manager_id  uuid references auth.users(id) on delete set null,
  start_date          date,
  end_date            date,
  contract_value      numeric(12,2) not null default 0 check (contract_value >= 0),
  estimated_cost      numeric(12,2) not null default 0 check (estimated_cost >= 0),
  currency            char(3) not null default 'GBP',
  service_keys        text[] not null default '{}',
  notes               text,
  archived_at         timestamptz,
  created_by          uuid references auth.users(id) on delete set null,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  unique (organisation_id, project_number),
  check (end_date is null or start_date is null or end_date >= start_date)
);
create index projects_org_status_idx on public.projects (organisation_id, status) where archived_at is null;
create index projects_client_idx on public.projects (client_id);
create index projects_pm_idx on public.projects (organisation_id, project_manager_id);
create trigger projects_updated_at before update on public.projects
  for each row execute function public.set_updated_at();

alter table public.leads
  add constraint leads_converted_project_fk foreign key (converted_project_id)
  references public.projects(id) on delete set null;

-- Per-organisation, per-year project numbering: OAR-P-2026-0001.
-- Counters table guarantees no reuse even after deletes.
create table public.number_sequences (
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  kind            text not null,            -- 'project' | 'quote' | 'invoice'
  year            int  not null,
  last_value      int  not null default 0,
  primary key (organisation_id, kind, year)
);

create or replace function public.next_document_number(p_org uuid, p_kind text, p_prefix text)
returns text language plpgsql security definer set search_path = public as $$
declare
  yr int := extract(year from now())::int;
  n  int;
begin
  insert into public.number_sequences as s (organisation_id, kind, year, last_value)
  values (p_org, p_kind, yr, 1)
  on conflict (organisation_id, kind, year)
  do update set last_value = s.last_value + 1
  returning s.last_value into n;
  return format('%s-%s-%s', p_prefix, yr, lpad(n::text, 4, '0'));
end $$;
revoke all on function public.next_document_number(uuid, text, text) from public;

create or replace function public.projects_assign_number()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.project_number is null or new.project_number = '' then
    new.project_number := public.next_document_number(new.organisation_id, 'project', 'OAR-P');
  end if;
  return new;
end $$;
create trigger projects_assign_number before insert on public.projects
  for each row execute function public.projects_assign_number();

-- derived financials — never stored. Actual/committed costs join in Phase 7.
create view public.project_financials with (security_invoker = true) as
select
  p.id as project_id,
  p.organisation_id,
  p.contract_value,
  p.estimated_cost,
  (p.contract_value - p.estimated_cost)::numeric(12,2) as estimated_gross_profit,
  case when p.contract_value > 0
       then round((p.contract_value - p.estimated_cost) / p.contract_value * 100, 2)
       else null end as estimated_margin_pct
from public.projects p;

-- ---------- documents ------------------------------------------------------
create table public.documents (
  id              uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  entity_type     public.document_entity not null,
  entity_id       uuid not null,
  category_key    text not null default 'other',
  name            text not null,
  mime_type       text not null,
  size_bytes      bigint not null check (size_bytes >= 0),
  bucket          text not null,
  storage_path    text not null,
  version         int not null default 1 check (version >= 1),
  supersedes_id   uuid references public.documents(id) on delete set null,
  expiry_date     date,
  uploaded_by     uuid references auth.users(id) on delete set null,
  archived_at     timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (bucket, storage_path)
);
create index documents_entity_idx on public.documents (organisation_id, entity_type, entity_id) where archived_at is null;
create index documents_expiry_idx on public.documents (organisation_id, expiry_date) where expiry_date is not null and archived_at is null;
create trigger documents_updated_at before update on public.documents
  for each row execute function public.set_updated_at();

-- ---------- activity_logs (append-only audit) -----------------------------
create table public.activity_logs (
  id              uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  user_id         uuid references auth.users(id) on delete set null,
  entity_type     text not null,
  entity_id       uuid not null,
  action          text not null,                       -- e.g. 'lead.status_changed'
  metadata        jsonb not null default '{}'::jsonb,  -- never store secrets or full PII
  created_at      timestamptz not null default now()
);
create index activity_logs_entity_idx on public.activity_logs (organisation_id, entity_type, entity_id, created_at desc);
create index activity_logs_org_time_idx on public.activity_logs (organisation_id, created_at desc);

create or replace function public.log_activity(
  org uuid, entity_type text, entity_id uuid, action text, metadata jsonb default '{}'::jsonb
) returns uuid language plpgsql security definer set search_path = public as $$
declare new_id uuid;
begin
  if not public.is_org_member(org) then
    raise exception 'not a member of organisation %', org using errcode = '42501';
  end if;
  insert into public.activity_logs (organisation_id, user_id, entity_type, entity_id, action, metadata)
  values (org, auth.uid(), entity_type, entity_id, action, coalesce(metadata, '{}'::jsonb))
  returning id into new_id;
  return new_id;
end $$;
revoke all on function public.log_activity(uuid, text, uuid, text, jsonb) from public;
grant execute on function public.log_activity(uuid, text, uuid, text, jsonb) to authenticated;

-- automatic audit for status changes on leads and projects
create or replace function public.audit_status_change()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    insert into public.activity_logs (organisation_id, user_id, entity_type, entity_id, action, metadata)
    values (new.organisation_id, auth.uid(), tg_table_name, new.id, tg_table_name || '.created',
            jsonb_build_object('status', new.status));
  elsif new.status is distinct from old.status then
    insert into public.activity_logs (organisation_id, user_id, entity_type, entity_id, action, metadata)
    values (new.organisation_id, auth.uid(), tg_table_name, new.id, tg_table_name || '.status_changed',
            jsonb_build_object('from', old.status, 'to', new.status));
  elsif new.archived_at is not null and old.archived_at is null then
    insert into public.activity_logs (organisation_id, user_id, entity_type, entity_id, action, metadata)
    values (new.organisation_id, auth.uid(), tg_table_name, new.id, tg_table_name || '.archived', '{}'::jsonb);
  end if;
  return new;
end $$;
create trigger leads_audit after insert or update on public.leads
  for each row execute function public.audit_status_change();
create trigger projects_audit after insert or update on public.projects
  for each row execute function public.audit_status_change();

-- ---------- notifications --------------------------------------------------
create table public.notifications (
  id              uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  user_id         uuid not null references auth.users(id) on delete cascade,
  type            public.notification_type not null,
  title           text not null,
  body            text,
  entity_type     text,
  entity_id       uuid,
  href            text,
  read_at         timestamptz,
  emailed_at      timestamptz,
  dedupe_key      text,                                 -- e.g. 'invoice_overdue:<invoice_id>:2026-09-14'
  created_at      timestamptz not null default now()
);
create index notifications_user_unread_idx on public.notifications (user_id, created_at desc) where read_at is null;
create unique index notifications_dedupe_idx on public.notifications (organisation_id, user_id, dedupe_key) where dedupe_key is not null;

-- ============================================================================
-- Row Level Security
-- ============================================================================
-- Role groups (mirror src/lib/auth/permissions.ts):
--   sales_read  = owner, administrator, finance, project_manager, read_only
--   sales_write = owner, administrator, finance
--   proj_read   = owner, administrator, finance, read_only (+ project_manager on assigned projects)
--   proj_write  = owner, administrator (+ project_manager on assigned projects)
--   admin       = owner, administrator
-- ----------------------------------------------------------------------------

create or replace function public.role_in(org uuid, variadic roles text[])
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce(public.org_role(org)::text = any (roles), false);
$$;
revoke all on function public.role_in(uuid, text[]) from public;
grant execute on function public.role_in(uuid, text[]) to authenticated;

-- Project managers only see projects assigned to them.
create or replace function public.can_read_project(project_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.projects p
    where p.id = project_id
      and (
        public.role_in(p.organisation_id, 'owner','administrator','finance','read_only')
        or (public.role_in(p.organisation_id, 'project_manager') and p.project_manager_id = auth.uid())
      )
  );
$$;
create or replace function public.can_write_project(project_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.projects p
    where p.id = project_id
      and (
        public.role_in(p.organisation_id, 'owner','administrator')
        or (public.role_in(p.organisation_id, 'project_manager') and p.project_manager_id = auth.uid())
      )
  );
$$;
revoke all on function public.can_read_project(uuid) from public;
revoke all on function public.can_write_project(uuid) from public;
grant execute on function public.can_read_project(uuid) to authenticated;
grant execute on function public.can_write_project(uuid) to authenticated;

alter table public.lead_sources         enable row level security;
alter table public.service_types        enable row level security;
alter table public.document_categories  enable row level security;
alter table public.clients              enable row level security;
alter table public.client_contacts      enable row level security;
alter table public.sites                enable row level security;
alter table public.leads                enable row level security;
alter table public.projects             enable row level security;
alter table public.number_sequences     enable row level security;
alter table public.documents            enable row level security;
alter table public.activity_logs        enable row level security;
alter table public.notifications        enable row level security;

-- lookups: any member reads; admins manage
create policy lead_sources_select on public.lead_sources for select to authenticated
  using (public.is_org_member(organisation_id));
create policy lead_sources_write on public.lead_sources for all to authenticated
  using (public.role_in(organisation_id, 'owner','administrator'))
  with check (public.role_in(organisation_id, 'owner','administrator'));

create policy service_types_select on public.service_types for select to authenticated
  using (public.is_org_member(organisation_id));
create policy service_types_write on public.service_types for all to authenticated
  using (public.role_in(organisation_id, 'owner','administrator'))
  with check (public.role_in(organisation_id, 'owner','administrator'));

create policy document_categories_select on public.document_categories for select to authenticated
  using (public.is_org_member(organisation_id));
create policy document_categories_write on public.document_categories for all to authenticated
  using (public.role_in(organisation_id, 'owner','administrator'))
  with check (public.role_in(organisation_id, 'owner','administrator'));

-- clients / contacts / sites: sales_read reads, sales_write writes. No delete — archive instead.
create policy clients_select on public.clients for select to authenticated
  using (public.role_in(organisation_id, 'owner','administrator','finance','project_manager','read_only'));
create policy clients_insert on public.clients for insert to authenticated
  with check (public.role_in(organisation_id, 'owner','administrator','finance'));
create policy clients_update on public.clients for update to authenticated
  using (public.role_in(organisation_id, 'owner','administrator','finance'))
  with check (public.role_in(organisation_id, 'owner','administrator','finance'));

create policy client_contacts_select on public.client_contacts for select to authenticated
  using (public.role_in(organisation_id, 'owner','administrator','finance','project_manager','read_only'));
create policy client_contacts_insert on public.client_contacts for insert to authenticated
  with check (public.role_in(organisation_id, 'owner','administrator','finance'));
create policy client_contacts_update on public.client_contacts for update to authenticated
  using (public.role_in(organisation_id, 'owner','administrator','finance'))
  with check (public.role_in(organisation_id, 'owner','administrator','finance'));

create policy sites_select on public.sites for select to authenticated
  using (public.role_in(organisation_id, 'owner','administrator','finance','project_manager','read_only'));
create policy sites_insert on public.sites for insert to authenticated
  with check (public.role_in(organisation_id, 'owner','administrator','finance','project_manager'));
create policy sites_update on public.sites for update to authenticated
  using (public.role_in(organisation_id, 'owner','administrator','finance','project_manager'))
  with check (public.role_in(organisation_id, 'owner','administrator','finance','project_manager'));

-- leads: sales_read reads; sales_write writes; assigned user may update their own lead
create policy leads_select on public.leads for select to authenticated
  using (public.role_in(organisation_id, 'owner','administrator','finance','project_manager','read_only'));
create policy leads_insert on public.leads for insert to authenticated
  with check (public.role_in(organisation_id, 'owner','administrator','finance'));
create policy leads_update on public.leads for update to authenticated
  using (public.role_in(organisation_id, 'owner','administrator','finance')
         or (public.is_org_member(organisation_id) and assigned_user_id = auth.uid()))
  with check (public.role_in(organisation_id, 'owner','administrator','finance')
         or (public.is_org_member(organisation_id) and assigned_user_id = auth.uid()));

-- projects: PMs restricted to assigned projects
create policy projects_select on public.projects for select to authenticated
  using (
    public.role_in(organisation_id, 'owner','administrator','finance','read_only')
    or (public.role_in(organisation_id, 'project_manager') and project_manager_id = auth.uid())
  );
create policy projects_insert on public.projects for insert to authenticated
  with check (public.role_in(organisation_id, 'owner','administrator'));
create policy projects_update on public.projects for update to authenticated
  using (
    public.role_in(organisation_id, 'owner','administrator')
    or (public.role_in(organisation_id, 'project_manager') and project_manager_id = auth.uid())
  )
  with check (
    public.role_in(organisation_id, 'owner','administrator')
    or (public.role_in(organisation_id, 'project_manager') and project_manager_id = auth.uid())
  );

-- number_sequences: internal only (accessed via security-definer function)
-- no policies → no direct access for authenticated.

-- documents: visibility follows the parent entity
create policy documents_select on public.documents for select to authenticated
  using (
    case entity_type
      when 'project' then public.can_read_project(entity_id)
      when 'employee' then public.role_in(organisation_id, 'owner','administrator')   -- tightened in Phase 8
      else public.role_in(organisation_id, 'owner','administrator','finance','project_manager','read_only')
    end
  );
create policy documents_insert on public.documents for insert to authenticated
  with check (
    case entity_type
      when 'project' then public.can_write_project(entity_id)
      when 'employee' then public.role_in(organisation_id, 'owner','administrator')
      else public.role_in(organisation_id, 'owner','administrator','finance','project_manager')
    end
  );
create policy documents_update on public.documents for update to authenticated
  using (
    case entity_type
      when 'project' then public.can_write_project(entity_id)
      when 'employee' then public.role_in(organisation_id, 'owner','administrator')
      else public.role_in(organisation_id, 'owner','administrator','finance','project_manager')
    end
  )
  with check (
    case entity_type
      when 'project' then public.can_write_project(entity_id)
      when 'employee' then public.role_in(organisation_id, 'owner','administrator')
      else public.role_in(organisation_id, 'owner','administrator','finance','project_manager')
    end
  );

-- activity_logs: members read; writes only via log_activity()/triggers (security definer)
create policy activity_logs_select on public.activity_logs for select to authenticated
  using (public.is_org_member(organisation_id));

-- notifications: strictly per-user
create policy notifications_select on public.notifications for select to authenticated
  using (user_id = auth.uid() and public.is_org_member(organisation_id));
create policy notifications_update on public.notifications for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ---------- Storage buckets ------------------------------------------------
insert into storage.buckets (id, name, public)
values
  ('project-documents',  'project-documents',  false),
  ('employee-documents', 'employee-documents', false),
  ('quote-documents',    'quote-documents',    false),
  ('invoice-documents',  'invoice-documents',  false),
  ('client-documents',   'client-documents',   false)
on conflict (id) do nothing;
-- No storage.objects policies for these buckets: all reads/writes go through
-- server code using signed URLs (spec §66/§67). Private buckets are not enumerable.

-- ============================================================================
-- 0008 — Phase 8: workforce — employees, roles, compliance documents, rota,
--        shift conflict detection, leave, timesheets and approvals.
-- ============================================================================

create type public.employment_type  as enum ('full_time', 'part_time', 'casual', 'contractor', 'agency');
create type public.employee_status  as enum ('active', 'inactive', 'on_leave', 'former');
create type public.shift_status     as enum ('draft', 'published', 'completed', 'cancelled');
create type public.timesheet_status as enum ('draft', 'submitted', 'approved', 'rejected', 'paid');
create type public.leave_type       as enum ('holiday', 'sick', 'unpaid', 'other');
create type public.leave_status     as enum ('requested', 'approved', 'rejected', 'cancelled');
create type public.verification_status as enum ('unverified', 'verified', 'rejected', 'expired');

-- ---------- employee roles (org lookup, customisable) ----------------------
create table public.employee_roles (
  id              uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  key             text not null,
  label           text not null,
  sort_order      int not null default 0,
  active          boolean not null default true,
  created_at      timestamptz not null default now(),
  unique (organisation_id, key)
);

-- ---------- employees --------------------------------------------------------
create table public.employees (
  id                uuid primary key default gen_random_uuid(),
  organisation_id   uuid not null references public.organisations(id) on delete cascade,
  employee_number   text not null,                               -- OAR-E-YYYY-#### (trigger)
  user_id           uuid references auth.users(id) on delete set null,  -- links to the staff portal login
  first_name        text not null check (length(first_name) between 1 and 80),
  last_name         text not null check (length(last_name) between 1 and 80),
  email             text,
  phone             text,
  address           jsonb not null default '{}'::jsonb,
  emergency_contact jsonb not null default '{}'::jsonb,           -- {name, relationship, phone}
  role_key          text not null default 'kitchen-assistant',
  employment_type   public.employment_type not null default 'full_time',
  start_date        date,
  end_date          date,
  hourly_rate       numeric(12,2) check (hourly_rate is null or hourly_rate >= 0),
  salary            numeric(12,2) check (salary is null or salary >= 0),
  status            public.employee_status not null default 'active',
  notes             text,
  archived_at       timestamptz,
  created_by        uuid references auth.users(id) on delete set null,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  unique (organisation_id, employee_number),
  unique (organisation_id, user_id),
  check (end_date is null or start_date is null or end_date >= start_date)
);
create index employees_org_status_idx on public.employees (organisation_id, status) where archived_at is null;
create index employees_name_idx on public.employees (organisation_id, last_name, first_name);
create trigger employees_updated_at before update on public.employees for each row execute function public.set_updated_at();

create or replace function public.employees_assign_number()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.employee_number is null or new.employee_number = '' then
    new.employee_number := public.next_document_number(new.organisation_id, 'employee', 'OAR-E');
  end if;
  return new;
end $$;
create trigger employees_number before insert on public.employees for each row execute function public.employees_assign_number();

-- Convenience: full name + "is this me" for the staff portal.
create or replace function public.my_employee_id()
returns uuid language sql stable security definer set search_path = public as $$
  select id from public.employees where user_id = auth.uid() and archived_at is null limit 1;
$$;
revoke all on function public.my_employee_id() from public;
grant execute on function public.my_employee_id() to authenticated;

-- ---------- compliance documents -------------------------------------------
-- Employee documents live in the shared documents table (entity_type 'employee').
-- Verification fields are added here because only compliance documents use them.
alter table public.documents add column if not exists verification public.verification_status not null default 'unverified';
alter table public.documents add column if not exists verified_by uuid references auth.users(id) on delete set null;
alter table public.documents add column if not exists verified_at timestamptz;
alter table public.documents add column if not exists notes text;

-- ---------- shifts (rota) ----------------------------------------------------
create table public.shifts (
  id              uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  employee_id     uuid not null references public.employees(id) on delete cascade,
  project_id      uuid references public.projects(id) on delete set null,
  site_id         uuid references public.sites(id) on delete set null,
  shift_date      date not null,
  start_time      time not null,
  end_time        time not null,
  break_minutes   int not null default 0 check (break_minutes >= 0 and break_minutes < 600),
  role_key        text,
  status          public.shift_status not null default 'draft',
  notes           text,
  hours           numeric(6,2) generated always as (
    round((
      (extract(epoch from end_time) - extract(epoch from start_time)
        + case when end_time <= start_time then 86400 else 0 end) / 3600.0
    )::numeric - (break_minutes / 60.0)::numeric, 2)
  ) stored,
  created_by      uuid references auth.users(id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index shifts_org_date_idx on public.shifts (organisation_id, shift_date);
create index shifts_employee_date_idx on public.shifts (employee_id, shift_date);
create index shifts_project_idx on public.shifts (project_id, shift_date);
create trigger shifts_updated_at before update on public.shifts for each row execute function public.set_updated_at();

-- ---------- leave ------------------------------------------------------------
create table public.leave_requests (
  id              uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  employee_id     uuid not null references public.employees(id) on delete cascade,
  leave_type      public.leave_type not null default 'holiday',
  start_date      date not null,
  end_date        date not null,
  days            numeric(5,2) not null default 1 check (days > 0),
  reason          text,
  status          public.leave_status not null default 'requested',
  decided_by      uuid references auth.users(id) on delete set null,
  decided_at      timestamptz,
  decision_note   text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  check (end_date >= start_date)
);
create index leave_employee_idx on public.leave_requests (employee_id, start_date);
create index leave_org_status_idx on public.leave_requests (organisation_id, status);
create trigger leave_updated_at before update on public.leave_requests for each row execute function public.set_updated_at();

create or replace function public.leave_decision_stamp()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.status is distinct from old.status and new.status in ('approved','rejected') then
    new.decided_by := auth.uid(); new.decided_at := now();
  end if;
  return new;
end $$;
create trigger leave_decision before update on public.leave_requests for each row execute function public.leave_decision_stamp();

-- ---------- timesheets -------------------------------------------------------
create table public.timesheets (
  id              uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  employee_id     uuid not null references public.employees(id) on delete cascade,
  shift_id        uuid references public.shifts(id) on delete set null,
  project_id      uuid references public.projects(id) on delete set null,
  site_id         uuid references public.sites(id) on delete set null,
  work_date       date not null,
  start_time      time not null,
  end_time        time not null,
  break_minutes   int not null default 0 check (break_minutes >= 0 and break_minutes < 600),
  hours           numeric(6,2) generated always as (
    round((
      (extract(epoch from end_time) - extract(epoch from start_time)
        + case when end_time <= start_time then 86400 else 0 end) / 3600.0
    )::numeric - (break_minutes / 60.0)::numeric, 2)
  ) stored,
  overtime_hours  numeric(6,2) not null default 0 check (overtime_hours >= 0),
  hourly_rate     numeric(12,2),                  -- snapshot at approval (payroll + costing)
  notes           text,
  status          public.timesheet_status not null default 'draft',
  submitted_at    timestamptz,
  approved_by     uuid references auth.users(id) on delete set null,
  approved_at     timestamptz,
  rejection_note  text,
  payroll_entry_id uuid,                           -- FK added in Phase 9
  created_by      uuid references auth.users(id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (employee_id, work_date, start_time)
);
create index timesheets_org_status_idx on public.timesheets (organisation_id, status, work_date);
create index timesheets_employee_idx on public.timesheets (employee_id, work_date desc);
create index timesheets_project_idx on public.timesheets (project_id, status);
create trigger timesheets_updated_at before update on public.timesheets for each row execute function public.set_updated_at();

-- Status transitions: stamp times, snapshot the pay rate, and keep an audit trail.
create or replace function public.timesheets_status_guard()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_rate numeric(12,2);
begin
  if tg_op = 'UPDATE' and new.status is distinct from old.status then
    if old.status = 'paid' then raise exception 'Paid timesheets cannot be changed' using errcode = 'check_violation'; end if;
    if new.status = 'submitted' then new.submitted_at := now(); end if;
    if new.status = 'approved' then
      if not (public.role_in(new.organisation_id, 'owner','administrator')
              or (new.project_id is not null and public.can_write_project(new.project_id))) then
        raise exception 'Only a manager can approve timesheets' using errcode = '42501';
      end if;
      select hourly_rate into v_rate from public.employees where id = new.employee_id;
      new.hourly_rate := coalesce(new.hourly_rate, v_rate);
      new.approved_by := auth.uid(); new.approved_at := now();
    end if;
    if new.status = 'rejected' then new.approved_by := auth.uid(); new.approved_at := now(); end if;
    insert into public.activity_logs (organisation_id, user_id, entity_type, entity_id, action, metadata)
    values (new.organisation_id, auth.uid(), 'timesheets', new.id, 'timesheets.status_changed',
            jsonb_build_object('from', old.status, 'to', new.status, 'employee_id', new.employee_id, 'hours', new.hours));
  end if;
  return new;
end $$;
create trigger timesheets_status_guard before update on public.timesheets for each row execute function public.timesheets_status_guard();

-- ---------- shift conflict detection ----------------------------------------
-- Returns warnings, never blocks (spec §48). Used by the rota UI before saving.
create or replace function public.shift_conflicts(
  p_employee_id uuid, p_date date, p_start time, p_end time, p_exclude_shift uuid default null
) returns table (kind text, detail text)
language plpgsql stable security definer set search_path = public as $$
declare v_org uuid; v_emp record;
begin
  select * into v_emp from public.employees where id = p_employee_id;
  if not found then return; end if;
  v_org := v_emp.organisation_id;
  if not public.is_org_member(v_org) then raise exception 'not permitted' using errcode = '42501'; end if;

  if v_emp.status <> 'active' then
    return query select 'employee_unavailable'::text, ('Employee status is ' || replace(v_emp.status::text, '_', ' '))::text;
  end if;

  return query
    select 'overlapping_shift'::text,
           ('Already on a shift ' || to_char(s.start_time, 'HH24:MI') || '–' || to_char(s.end_time, 'HH24:MI')
            || coalesce(' on ' || p.name, ''))::text
    from public.shifts s left join public.projects p on p.id = s.project_id
    where s.employee_id = p_employee_id and s.shift_date = p_date and s.status <> 'cancelled'
      and (p_exclude_shift is null or s.id <> p_exclude_shift)
      and (p_start, p_end) overlaps (s.start_time, s.end_time);

  return query
    select 'on_leave'::text, ('Approved ' || l.leave_type::text || ' leave ' || to_char(l.start_date, 'DD/MM') || '–' || to_char(l.end_date, 'DD/MM'))::text
    from public.leave_requests l
    where l.employee_id = p_employee_id and l.status = 'approved' and p_date between l.start_date and l.end_date;

  return query
    select 'document_expired'::text, (d.name || ' expired ' || to_char(d.expiry_date, 'DD/MM/YYYY'))::text
    from public.documents d
    where d.entity_type = 'employee' and d.entity_id = p_employee_id and d.archived_at is null
      and d.expiry_date is not null and d.expiry_date < p_date;
end $$;
revoke all on function public.shift_conflicts(uuid, date, time, time, uuid) from public;
grant execute on function public.shift_conflicts(uuid, date, time, time, uuid) to authenticated;

-- Create a draft timesheet from a completed shift (staff or manager).
create or replace function public.timesheet_from_shift(p_shift_id uuid)
returns uuid language plpgsql security definer set search_path = public as $$
declare s public.shifts%rowtype; v_id uuid;
begin
  select * into s from public.shifts where id = p_shift_id;
  if not found then raise exception 'shift not found' using errcode = 'P0002'; end if;
  if not (public.is_org_member(s.organisation_id)) then raise exception 'not permitted' using errcode = '42501'; end if;
  select id into v_id from public.timesheets where shift_id = p_shift_id;
  if v_id is not null then return v_id; end if;
  insert into public.timesheets (organisation_id, employee_id, shift_id, project_id, site_id, work_date, start_time, end_time, break_minutes, created_by)
  values (s.organisation_id, s.employee_id, s.id, s.project_id, s.site_id, s.shift_date, s.start_time, s.end_time, s.break_minutes, auth.uid())
  returning id into v_id;
  return v_id;
end $$;
revoke all on function public.timesheet_from_shift(uuid) from public;
grant execute on function public.timesheet_from_shift(uuid) to authenticated;

-- ---------- default roles + compliance document categories -------------------
create or replace function public.seed_org_workforce_defaults(org uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  insert into public.employee_roles (organisation_id, key, label, sort_order) values
    (org, 'head-chef',            'Head Chef',            10),
    (org, 'chef',                 'Chef',                 20),
    (org, 'kitchen-assistant',    'Kitchen Assistant',    30),
    (org, 'kitchen-porter',       'Kitchen Porter',       40),
    (org, 'catering-supervisor',  'Catering Supervisor',  50),
    (org, 'catering-manager',     'Catering Manager',     60),
    (org, 'driver',               'Driver',               70),
    (org, 'administrator',        'Administrator',        80),
    (org, 'project-manager',      'Project Manager',      90)
  on conflict do nothing;

  insert into public.document_categories (organisation_id, entity, key, label, sort_order) values
    (org, 'employee', 'right-to-work',        'Right to Work',        10),
    (org, 'employee', 'passport',             'Passport',             20),
    (org, 'employee', 'food-hygiene',         'Food Hygiene',         30),
    (org, 'employee', 'health-and-safety',    'Health & Safety',      40),
    (org, 'employee', 'driving-licence',      'Driving Licence',      50),
    (org, 'employee', 'training-certificate', 'Training Certificate', 60),
    (org, 'employee', 'dbs',                  'DBS',                  70),
    (org, 'employee', 'contract',             'Contract',             80),
    (org, 'employee', 'other',                'Other',                999),
    (org, 'project',  'receipts',             'Receipts',             95)
  on conflict do nothing;
end $$;
create or replace function public.on_organisation_created_workforce()
returns trigger language plpgsql security definer set search_path = public as $$
begin perform public.seed_org_workforce_defaults(new.id); return new; end $$;
create trigger organisations_seed_workforce after insert on public.organisations for each row execute function public.on_organisation_created_workforce();
do $$ declare o record; begin for o in select id from public.organisations loop perform public.seed_org_workforce_defaults(o.id); end loop; end $$;

-- ---------- labour cost feeds project financials -----------------------------
drop view if exists public.project_financials;
create view public.project_financials with (security_invoker = true) as
select
  p.id as project_id,
  p.organisation_id,
  p.contract_value,
  coalesce(inv.invoiced_net, 0)::numeric(12,2)   as invoiced_net,
  coalesce(inv.received, 0)::numeric(12,2)       as received,
  p.estimated_cost,
  coalesce(ex.committed, 0)::numeric(12,2)       as committed_cost,
  (coalesce(ex.actual, 0) + coalesce(lab.labour_cost, 0))::numeric(12,2) as actual_cost,
  coalesce(lab.labour_cost, 0)::numeric(12,2)    as labour_cost,
  coalesce(lab.labour_hours, 0)::numeric(10,2)   as labour_hours,
  (p.contract_value - p.estimated_cost)::numeric(12,2) as estimated_gross_profit,
  case when p.contract_value > 0 then round((p.contract_value - p.estimated_cost) / p.contract_value * 100, 2) else null end as estimated_margin_pct,
  (p.contract_value - coalesce(ex.actual, 0) - coalesce(lab.labour_cost, 0) - coalesce(ex.committed, 0))::numeric(12,2) as forecast_gross_profit,
  case when p.contract_value > 0
       then round((p.contract_value - coalesce(ex.actual, 0) - coalesce(lab.labour_cost, 0) - coalesce(ex.committed, 0)) / p.contract_value * 100, 2)
       else null end as forecast_margin_pct
from public.projects p
left join lateral (
  select sum(case when e.status = 'committed' then e.net else 0 end) as committed,
         sum(case when e.status in ('actual','paid') then e.net else 0 end) as actual
  from public.expenses e where e.project_id = p.id and e.archived_at is null
) ex on true
left join lateral (
  select sum((t.hours + t.overtime_hours) * coalesce(t.hourly_rate, 0)) as labour_cost,
         sum(t.hours + t.overtime_hours) as labour_hours
  from public.timesheets t where t.project_id = p.id and t.status in ('approved','paid')
) lab on true
left join lateral (
  select sum(case when i.kind = 'credit_note' then -(i.total - i.vat_amount) else (i.total - i.vat_amount) end) as invoiced_net,
         sum(case when i.kind = 'credit_note' then 0 else i.amount_paid end) as received
  from public.invoices i where i.project_id = p.id and i.archived_at is null and i.status not in ('draft','cancelled')
) inv on true;

-- ---------- RLS --------------------------------------------------------------
alter table public.employee_roles  enable row level security;
alter table public.employees       enable row level security;
alter table public.shifts          enable row level security;
alter table public.leave_requests  enable row level security;
alter table public.timesheets      enable row level security;

create policy employee_roles_select on public.employee_roles for select to authenticated using (public.is_org_member(organisation_id));
create policy employee_roles_write on public.employee_roles for all to authenticated
  using (public.role_in(organisation_id, 'owner','administrator')) with check (public.role_in(organisation_id, 'owner','administrator'));

-- Employees: HR-level data is owner/admin only. PMs and read_only see the
-- directory through the view below; staff see only their own record.
create policy employees_select on public.employees for select to authenticated using (
  public.role_in(organisation_id, 'owner','administrator') or user_id = auth.uid()
);
create policy employees_write on public.employees for all to authenticated
  using (public.role_in(organisation_id, 'owner','administrator')) with check (public.role_in(organisation_id, 'owner','administrator'));

-- Directory: no pay, no address, no notes — safe for schedulers.
create or replace function public.can_view_directory(org uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select public.role_in(org, 'owner','administrator','project_manager','finance','read_only');
$$;
revoke all on function public.can_view_directory(uuid) from public;
grant execute on function public.can_view_directory(uuid) to authenticated;

create view public.employee_directory with (security_barrier = true) as
select e.id, e.organisation_id, e.employee_number, e.user_id, e.first_name, e.last_name,
       (e.first_name || ' ' || e.last_name) as full_name, e.role_key, e.employment_type, e.status, e.archived_at
from public.employees e
where public.can_view_directory(e.organisation_id) or e.user_id = auth.uid();
revoke all on public.employee_directory from public, anon;
grant select on public.employee_directory to authenticated;

-- Shifts: schedulers write; PMs write on their projects; staff read their own.
create policy shifts_select on public.shifts for select to authenticated using (
  public.role_in(organisation_id, 'owner','administrator','finance','read_only')
  or (project_id is not null and public.can_read_project(project_id))
  or employee_id = public.my_employee_id()
);
create policy shifts_write on public.shifts for all to authenticated using (
  public.role_in(organisation_id, 'owner','administrator')
  or (project_id is not null and public.can_write_project(project_id))
) with check (
  public.role_in(organisation_id, 'owner','administrator')
  or (project_id is not null and public.can_write_project(project_id))
);

-- Leave: staff raise and cancel their own; managers decide.
create policy leave_select on public.leave_requests for select to authenticated using (
  public.role_in(organisation_id, 'owner','administrator','read_only') or employee_id = public.my_employee_id()
);
create policy leave_insert on public.leave_requests for insert to authenticated with check (
  public.role_in(organisation_id, 'owner','administrator') or employee_id = public.my_employee_id()
);
create policy leave_update on public.leave_requests for update to authenticated using (
  public.role_in(organisation_id, 'owner','administrator')
  or (employee_id = public.my_employee_id() and status = 'requested')
) with check (
  public.role_in(organisation_id, 'owner','administrator')
  or (employee_id = public.my_employee_id() and status in ('requested','cancelled'))
);
create policy leave_delete on public.leave_requests for delete to authenticated using (public.role_in(organisation_id, 'owner','administrator'));

-- Timesheets: staff own their drafts; managers see and approve their projects'.
create policy timesheets_select on public.timesheets for select to authenticated using (
  public.role_in(organisation_id, 'owner','administrator','finance','read_only')
  or (project_id is not null and public.can_read_project(project_id))
  or employee_id = public.my_employee_id()
);
create policy timesheets_insert on public.timesheets for insert to authenticated with check (
  public.role_in(organisation_id, 'owner','administrator')
  or (project_id is not null and public.can_write_project(project_id))
  or employee_id = public.my_employee_id()
);
create policy timesheets_update on public.timesheets for update to authenticated using (
  public.role_in(organisation_id, 'owner','administrator')
  or (project_id is not null and public.can_write_project(project_id))
  or (employee_id = public.my_employee_id() and status in ('draft','rejected'))
) with check (
  public.role_in(organisation_id, 'owner','administrator')
  or (project_id is not null and public.can_write_project(project_id))
  or (employee_id = public.my_employee_id() and status in ('draft','submitted'))
);
create policy timesheets_delete on public.timesheets for delete to authenticated using (
  public.role_in(organisation_id, 'owner','administrator')
  or (employee_id = public.my_employee_id() and status = 'draft')
);

-- Employee documents were owner/admin-only in 0002; staff may now read their own.
drop policy if exists documents_select on public.documents;
create policy documents_select on public.documents for select to authenticated
  using (
    case entity_type
      when 'project' then public.can_read_project(entity_id)
      when 'employee' then public.role_in(organisation_id, 'owner','administrator') or entity_id = public.my_employee_id()
      else public.role_in(organisation_id, 'owner','administrator','finance','project_manager','read_only')
    end
  );

-- ============================================================================
-- 0014 — Sites become operating units.
--
-- Until now a site was a place attached to a client, and everything operational
-- (timesheets, shifts, costs, documents) was scoped through PROJECTS via
-- can_read_project() / can_write_project(). This migration adds the parallel
-- site axis the day-to-day kitchen operation needs:
--
--   * a site has an On A Roll manager and a roster of assigned staff
--   * an employee has a primary site
--   * can_read_site() / can_write_site() mirror the project helpers
--
-- Every existing policy gains a site branch IN ADDITION TO its project branch,
-- so nothing that works today stops working. A kitchen is a site; a fit-out
-- contract is still a project; a timesheet may belong to either or both.
-- ============================================================================

create type public.site_type   as enum ('kitchen', 'project_site', 'office', 'other');
create type public.site_status as enum ('prospective', 'mobilising', 'operating', 'paused', 'closed');
create type public.site_role   as enum ('manager', 'staff');

alter table public.sites add column if not exists site_type   public.site_type   not null default 'kitchen';
alter table public.sites add column if not exists status      public.site_status not null default 'operating';
-- The On A Roll person accountable for the site. Staff and managers are in
-- site_assignments; this is the single "who owns it" field for lists and alerts.
alter table public.sites add column if not exists oar_manager_id uuid references auth.users(id) on delete set null;
-- The client's person on the ground. They are not a system user, so these are
-- plain fields rather than a reference to client_contacts (which they may also be).
alter table public.sites add column if not exists site_manager_name  text;
alter table public.sites add column if not exists site_manager_email text;
alter table public.sites add column if not exists site_manager_phone text;
alter table public.sites add column if not exists opened_on  date;
alter table public.sites add column if not exists closed_on  date;

create index if not exists sites_status_idx on public.sites (organisation_id, status) where archived_at is null;
create index if not exists sites_manager_idx on public.sites (organisation_id, oar_manager_id);

-- ---------- who works where --------------------------------------------------
create table public.site_assignments (
  id              uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  site_id         uuid not null references public.sites(id) on delete cascade,
  user_id         uuid not null references auth.users(id) on delete cascade,
  employee_id     uuid references public.employees(id) on delete cascade,
  role            public.site_role not null default 'staff',
  is_primary      boolean not null default false,
  starts_on       date,
  ends_on         date,
  notes           text,
  created_by      uuid references auth.users(id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (site_id, user_id),
  check (ends_on is null or starts_on is null or ends_on >= starts_on)
);
create index site_assignments_user_idx on public.site_assignments (user_id, role);
create index site_assignments_site_idx on public.site_assignments (site_id, role);
create trigger site_assignments_updated_at before update on public.site_assignments
  for each row execute function public.set_updated_at();

-- One primary site per person.
create unique index site_assignments_one_primary on public.site_assignments (user_id) where is_primary;

alter table public.employees add column if not exists primary_site_id uuid references public.sites(id) on delete set null;
create index if not exists employees_site_idx on public.employees (organisation_id, primary_site_id) where archived_at is null;

-- Keep employees.primary_site_id and the assignment roster in step.
create or replace function public.site_assignment_sync_employee()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op in ('INSERT', 'UPDATE') and new.is_primary and new.employee_id is not null then
    update public.employees set primary_site_id = new.site_id where id = new.employee_id;
  elsif tg_op = 'DELETE' and old.is_primary and old.employee_id is not null then
    update public.employees set primary_site_id = null where id = old.employee_id;
  end if;
  return null;
end $$;
create trigger site_assignments_sync after insert or update or delete on public.site_assignments
  for each row execute function public.site_assignment_sync_employee();

-- ---------- scoping helpers ---------------------------------------------------
-- Mirrors can_read_project / can_write_project. Security definer so policies
-- that call them do not recurse back through site_assignments' own RLS.
create or replace function public.my_site_ids()
returns setof uuid language sql stable security definer set search_path = public as $$
  select site_id from public.site_assignments where user_id = auth.uid();
$$;

create or replace function public.my_managed_site_ids()
returns setof uuid language sql stable security definer set search_path = public as $$
  select site_id from public.site_assignments where user_id = auth.uid() and role = 'manager'
  union
  select id from public.sites where oar_manager_id = auth.uid();
$$;

create or replace function public.can_read_site(p_site_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.sites s
    where s.id = p_site_id
      and (
        public.role_in(s.organisation_id, 'owner','administrator','finance','read_only')
        or s.oar_manager_id = auth.uid()
        or exists (select 1 from public.site_assignments a where a.site_id = s.id and a.user_id = auth.uid())
      )
  );
$$;

create or replace function public.can_write_site(p_site_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.sites s
    where s.id = p_site_id
      and (
        public.role_in(s.organisation_id, 'owner','administrator')
        or s.oar_manager_id = auth.uid()
        or exists (select 1 from public.site_assignments a
                    where a.site_id = s.id and a.user_id = auth.uid() and a.role = 'manager')
      )
  );
$$;

-- True when the caller manages the site the employee is assigned to.
create or replace function public.manages_employee(p_employee_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.employees e
    where e.id = p_employee_id
      and (
        public.role_in(e.organisation_id, 'owner','administrator')
        or (e.primary_site_id is not null and e.primary_site_id in (select public.my_managed_site_ids()))
        or exists (
          select 1 from public.site_assignments a
          where a.employee_id = e.id and a.site_id in (select public.my_managed_site_ids())
        )
      )
  );
$$;

revoke all on function public.my_site_ids() from public;
revoke all on function public.my_managed_site_ids() from public;
revoke all on function public.can_read_site(uuid) from public;
revoke all on function public.can_write_site(uuid) from public;
revoke all on function public.manages_employee(uuid) from public;
grant execute on function public.my_site_ids() to authenticated;
grant execute on function public.my_managed_site_ids() to authenticated;
grant execute on function public.can_read_site(uuid) to authenticated;
grant execute on function public.can_write_site(uuid) to authenticated;
grant execute on function public.manages_employee(uuid) to authenticated;

-- ---------- RLS ---------------------------------------------------------------
alter table public.site_assignments enable row level security;

create policy site_assignments_select on public.site_assignments for select to authenticated using (
  public.role_in(organisation_id, 'owner','administrator','finance','read_only')
  or user_id = auth.uid()
  or public.can_read_site(site_id)
);
create policy site_assignments_write on public.site_assignments for all to authenticated
  using (public.can_write_site(site_id)) with check (public.can_write_site(site_id));

-- Sites: staff assigned to a site may now see it (they need the address and
-- access notes). Managers of a site may edit it.
drop policy if exists sites_select on public.sites;
create policy sites_select on public.sites for select to authenticated using (
  public.role_in(organisation_id, 'owner','administrator','finance','project_manager','read_only')
  or public.can_read_site(id)
);
drop policy if exists sites_update on public.sites;
create policy sites_update on public.sites for update to authenticated
  using (public.role_in(organisation_id, 'owner','administrator','finance') or public.can_write_site(id))
  with check (public.role_in(organisation_id, 'owner','administrator','finance') or public.can_write_site(id));

-- ---------- extend operational policies with a site branch ---------------------
-- Each policy below keeps every condition it had and adds the site case.

drop policy if exists shifts_select on public.shifts;
create policy shifts_select on public.shifts for select to authenticated using (
  public.role_in(organisation_id, 'owner','administrator','finance','read_only')
  or (project_id is not null and public.can_read_project(project_id))
  or (site_id is not null and public.can_read_site(site_id))
  or employee_id = public.my_employee_id()
);
drop policy if exists shifts_write on public.shifts;
create policy shifts_write on public.shifts for all to authenticated using (
  public.role_in(organisation_id, 'owner','administrator')
  or (project_id is not null and public.can_write_project(project_id))
  or (site_id is not null and public.can_write_site(site_id))
) with check (
  public.role_in(organisation_id, 'owner','administrator')
  or (project_id is not null and public.can_write_project(project_id))
  or (site_id is not null and public.can_write_site(site_id))
);

drop policy if exists timesheets_select on public.timesheets;
create policy timesheets_select on public.timesheets for select to authenticated using (
  public.role_in(organisation_id, 'owner','administrator','finance','read_only')
  or (project_id is not null and public.can_read_project(project_id))
  or (site_id is not null and public.can_read_site(site_id))
  or employee_id = public.my_employee_id()
);
drop policy if exists timesheets_insert on public.timesheets;
create policy timesheets_insert on public.timesheets for insert to authenticated with check (
  public.role_in(organisation_id, 'owner','administrator')
  or (project_id is not null and public.can_write_project(project_id))
  or (site_id is not null and public.can_write_site(site_id))
  or employee_id = public.my_employee_id()
);
drop policy if exists timesheets_update on public.timesheets;
create policy timesheets_update on public.timesheets for update to authenticated using (
  public.role_in(organisation_id, 'owner','administrator')
  or (project_id is not null and public.can_write_project(project_id))
  or (site_id is not null and public.can_write_site(site_id))
  or (employee_id = public.my_employee_id() and status in ('draft','rejected'))
) with check (
  public.role_in(organisation_id, 'owner','administrator')
  or (project_id is not null and public.can_write_project(project_id))
  or (site_id is not null and public.can_write_site(site_id))
  or (employee_id = public.my_employee_id() and status in ('draft','submitted'))
);

-- Leave: a site manager decides leave for the staff they manage.
drop policy if exists leave_select on public.leave_requests;
create policy leave_select on public.leave_requests for select to authenticated using (
  public.role_in(organisation_id, 'owner','administrator','read_only')
  or employee_id = public.my_employee_id()
  or public.manages_employee(employee_id)
);
drop policy if exists leave_update on public.leave_requests;
create policy leave_update on public.leave_requests for update to authenticated using (
  public.role_in(organisation_id, 'owner','administrator')
  or public.manages_employee(employee_id)
  or (employee_id = public.my_employee_id() and status = 'requested')
) with check (
  public.role_in(organisation_id, 'owner','administrator')
  or public.manages_employee(employee_id)
  or (employee_id = public.my_employee_id() and status in ('requested','cancelled'))
);

-- Employees: a site manager sees the HR record of the staff they manage.
-- Pay is still hidden from them in the UI and in the directory view; this policy
-- is what lets them open a staff member's page at all.
drop policy if exists employees_select on public.employees;
create policy employees_select on public.employees for select to authenticated using (
  public.role_in(organisation_id, 'owner','administrator')
  or user_id = auth.uid()
  or public.manages_employee(id)
);

-- Timesheet approval: a site manager may approve for their site.
create or replace function public.timesheets_status_guard()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_rate numeric(12,2);
begin
  if tg_op = 'UPDATE' and new.status is distinct from old.status then
    if old.status = 'paid' and new.status <> 'approved' then
      raise exception 'Paid timesheets cannot be changed' using errcode = 'check_violation';
    end if;
    if new.status = 'submitted' then new.submitted_at := now(); end if;
    if new.status = 'approved' and old.status <> 'paid' then
      if not (public.role_in(new.organisation_id, 'owner','administrator')
              or (new.project_id is not null and public.can_write_project(new.project_id))
              or (new.site_id is not null and public.can_write_site(new.site_id))
              or public.manages_employee(new.employee_id)) then
        raise exception 'Only a manager can approve timesheets' using errcode = '42501';
      end if;
      if new.employee_id = public.my_employee_id()
         and not public.role_in(new.organisation_id, 'owner','administrator') then
        raise exception 'You cannot approve your own timesheet' using errcode = '42501';
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

-- An approved timesheet that is edited afterwards must say why, and the change
-- is recorded. Editing one silently is exactly what the brief forbids.
alter table public.timesheets add column if not exists amendment_reason text;
alter table public.timesheets add column if not exists amended_by uuid references auth.users(id) on delete set null;
alter table public.timesheets add column if not exists amended_at timestamptz;

create or replace function public.timesheets_amendment_guard()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  -- Only interested in edits to the hours themselves on a sheet already approved.
  if old.status in ('approved','paid')
     and new.status = old.status
     and (new.start_time is distinct from old.start_time
          or new.end_time is distinct from old.end_time
          or new.break_minutes is distinct from old.break_minutes
          or new.overtime_hours is distinct from old.overtime_hours
          or new.work_date is distinct from old.work_date)
  then
    if auth.uid() is not null and coalesce(new.amendment_reason, '') = coalesce(old.amendment_reason, '') then
      raise exception 'Give a reason when amending an approved timesheet' using errcode = 'check_violation';
    end if;
    new.amended_by := auth.uid(); new.amended_at := now();
    insert into public.activity_logs (organisation_id, user_id, entity_type, entity_id, action, metadata)
    values (new.organisation_id, auth.uid(), 'timesheets', new.id, 'timesheets.amended',
            jsonb_build_object('reason', new.amendment_reason,
                               'was', jsonb_build_object('start', old.start_time, 'end', old.end_time,
                                                         'break', old.break_minutes, 'overtime', old.overtime_hours,
                                                         'hours', old.hours),
                               'now', jsonb_build_object('start', new.start_time, 'end', new.end_time,
                                                         'break', new.break_minutes, 'overtime', new.overtime_hours)));
  end if;
  return new;
end $$;
create trigger timesheets_amendment before update on public.timesheets
  for each row execute function public.timesheets_amendment_guard();

-- ---------- site documents ------------------------------------------------------
insert into storage.buckets (id, name, public) values ('site-documents', 'site-documents', false)
on conflict (id) do nothing;

create or replace function public.seed_org_site_defaults(org uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  insert into public.document_categories (organisation_id, entity, key, label, sort_order) values
    (org, 'site', 'contracts',         'Contracts',          5),
    (org, 'site', 'risk-assessments',  'Risk Assessments',  30),
    (org, 'site', 'method-statements', 'Method Statements', 40),
    (org, 'site', 'certificates',      'Certificates',      50),
    (org, 'site', 'induction',         'Site Induction',    60),
    (org, 'site', 'correspondence',    'Correspondence',    70)
  on conflict do nothing;
end $$;
create or replace function public.on_organisation_created_sites()
returns trigger language plpgsql security definer set search_path = public as $$
begin perform public.seed_org_site_defaults(new.id); return new; end $$;
create trigger organisations_seed_sites after insert on public.organisations
  for each row execute function public.on_organisation_created_sites();
do $$ declare o record; begin
  for o in select id from public.organisations loop perform public.seed_org_site_defaults(o.id); end loop;
end $$;

-- Site documents follow the site's own read/write rules.
drop policy if exists documents_select on public.documents;
create policy documents_select on public.documents for select to authenticated
  using (
    case entity_type
      when 'project'  then public.can_read_project(entity_id)
      when 'site'     then public.can_read_site(entity_id)
      when 'employee' then public.role_in(organisation_id, 'owner','administrator')
                            or entity_id = public.my_employee_id()
                            or public.manages_employee(entity_id)
      else public.role_in(organisation_id, 'owner','administrator','finance','project_manager','read_only')
    end
  );

drop policy if exists documents_insert on public.documents;
create policy documents_insert on public.documents for insert to authenticated
  with check (
    case entity_type
      when 'project'  then public.can_write_project(entity_id)
      when 'site'     then public.can_write_site(entity_id)
      when 'employee' then public.role_in(organisation_id, 'owner','administrator')
                            or entity_id = public.my_employee_id()
                            or public.manages_employee(entity_id)
      else public.role_in(organisation_id, 'owner','administrator','finance','project_manager')
    end
  );

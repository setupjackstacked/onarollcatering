-- ============================================================================
-- 0021 — Employee invitations.
--
-- The employee list arrived without email addresses, so people exist in the
-- system before they can log in. This adds:
--
--   * the real On A Roll job titles to the employee_roles lookup, so the
--     imported records map onto something meaningful rather than everyone
--     being a "Kitchen Assistant";
--   * invitation tracking on the employee record — when it was sent, by whom,
--     and how many times — so an admin can see at a glance who still has no
--     login;
--   * one function that does the whole linking job atomically: employee →
--     auth user, organisation membership, and the site assignment that gives
--     them their site's data. Doing it in three separate client calls would
--     leave half-linked people behind whenever one of them failed.
--
-- Nothing here changes an existing policy. An employee with no user_id behaves
-- exactly as it did before.
-- ============================================================================

-- ---------- job titles -------------------------------------------------------
-- The seeded list stays; these are added. Keys are stable, labels are what the
-- business actually calls the job.
create or replace function public.seed_org_job_titles(org uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  insert into public.employee_roles (organisation_id, key, label, sort_order) values
    (org, 'managing-director',      'Executive Head Chef / Managing Director',  5),
    (org, 'hr-finance-bp',          'HR & Finance Business Partner',            6),
    (org, 'accounts-coordinator',   'Accounts & Administration Coordinator',    7),
    (org, 'lead-chef',              'Lead Chef',                               15),
    (org, 'breakfast-chef',         'Breakfast Chef',                          16),
    (org, 'foh-manager',            'Front of House Manager',                  52),
    (org, 'foh-supervisor',         'Front of House Supervisor',               54),
    (org, 'foh-assistant',          'Front of House Assistant',                56),
    (org, 'counter-assistant',      'Counter Assistant',                       58),
    (org, 'barista',                'Barista',                                 59)
  on conflict do nothing;
end $$;

create or replace function public.on_organisation_created_job_titles()
returns trigger language plpgsql security definer set search_path = public as $$
begin perform public.seed_org_job_titles(new.id); return new; end $$;
create trigger organisations_seed_job_titles after insert on public.organisations
  for each row execute function public.on_organisation_created_job_titles();
do $$ declare o record; begin
  for o in select id from public.organisations loop perform public.seed_org_job_titles(o.id); end loop;
end $$;

-- ---------- invitation tracking ----------------------------------------------
alter table public.employees add column if not exists invited_at   timestamptz;
alter table public.employees add column if not exists invited_by   uuid references auth.users(id) on delete set null;
alter table public.employees add column if not exists invite_count int not null default 0;

comment on column public.employees.invited_at is
  'When a welcome email was last sent. Cleared implicitly once user_id is set and they have signed in.';

-- Who still cannot log in. Drives the "needs an email address" and "invited,
-- not accepted" counts on the employees screen.
create or replace function public.employees_without_access(p_org uuid)
returns table (
  employee_id     uuid,
  employee_number text,
  full_name       text,
  role_key        text,
  site_name       text,
  email           text,
  invited_at      timestamptz,
  invite_count    int,
  state           text
)
language sql stable security invoker set search_path = public as $$
  select e.id, e.employee_number, e.first_name || ' ' || e.last_name, e.role_key, s.name,
         e.email, e.invited_at, e.invite_count,
         case
           when e.user_id is not null then 'active'
           when e.email is null or e.email = '' then 'no_email'
           when e.invited_at is not null then 'invited'
           else 'ready'
         end
  from public.employees e
  left join public.sites s on s.id = e.primary_site_id
  where e.organisation_id = p_org
    and e.archived_at is null
    and e.status <> 'former'
    and e.user_id is null
  order by e.last_name, e.first_name;
$$;

-- ---------- linking an invited account ---------------------------------------
-- Called once the auth user exists. Everything the person needs to be a real
-- user of the system happens here, in one transaction:
--   1. the employee record points at the login,
--   2. they are a member of the organisation with the given role,
--   3. they are on their site's roster, as manager or staff.
--
-- Security definer because it writes organisation_members and site_assignments,
-- but it checks the CALLER is an owner or administrator of that organisation
-- first — a definer function without that check is a privilege escalation.
create or replace function public.link_employee_account(
  p_employee_id uuid,
  p_user_id     uuid,
  p_role        public.organisation_role default 'staff',
  p_site_role   public.site_role default 'staff'
) returns void language plpgsql security definer set search_path = public as $$
declare emp public.employees%rowtype;
begin
  select * into emp from public.employees where id = p_employee_id;
  if not found then raise exception 'employee not found' using errcode = 'P0002'; end if;

  if not public.role_in(emp.organisation_id, 'owner', 'administrator') then
    raise exception 'not permitted' using errcode = '42501';
  end if;
  if p_role = 'owner' and not public.role_in(emp.organisation_id, 'owner') then
    raise exception 'Only an owner can grant owner' using errcode = '42501';
  end if;
  if emp.user_id is not null and emp.user_id <> p_user_id then
    raise exception 'That employee is already linked to a different login' using errcode = 'check_violation';
  end if;

  -- Another employee record must not claim the same login.
  if exists (select 1 from public.employees x
              where x.organisation_id = emp.organisation_id and x.user_id = p_user_id and x.id <> p_employee_id) then
    raise exception 'That login is already linked to another employee' using errcode = 'check_violation';
  end if;

  update public.employees
     set user_id = p_user_id, invited_at = now(), invite_count = invite_count + 1, invited_by = auth.uid()
   where id = p_employee_id;

  insert into public.organisation_members (organisation_id, user_id, role, invited_by, accepted_at)
  values (emp.organisation_id, p_user_id, p_role, auth.uid(), now())
  on conflict (organisation_id, user_id) do update set role = excluded.role;

  -- Their site roster entry. Without this a manager sees nothing, because every
  -- operational policy scopes by site assignment.
  if emp.primary_site_id is not null then
    insert into public.site_assignments (organisation_id, site_id, user_id, employee_id, role, is_primary, created_by)
    values (emp.organisation_id, emp.primary_site_id, p_user_id, p_employee_id, p_site_role, true, auth.uid())
    on conflict (site_id, user_id) do update set role = excluded.role, employee_id = excluded.employee_id;
  end if;
end $$;
revoke all on function public.link_employee_account(uuid, uuid, public.organisation_role, public.site_role) from public;
grant execute on function public.link_employee_account(uuid, uuid, public.organisation_role, public.site_role) to authenticated;

-- Records that a welcome email went out to someone who already has a login, or
-- who is being re-invited. Kept separate so the send path never has to write
-- the employee row directly under RLS.
create or replace function public.record_employee_invite(p_employee_id uuid, p_email text)
returns void language plpgsql security definer set search_path = public as $$
declare emp public.employees%rowtype;
begin
  select * into emp from public.employees where id = p_employee_id;
  if not found then raise exception 'employee not found' using errcode = 'P0002'; end if;
  if not public.role_in(emp.organisation_id, 'owner', 'administrator') then
    raise exception 'not permitted' using errcode = '42501';
  end if;
  update public.employees
     set email = coalesce(nullif(trim(p_email), ''), email),
         invited_at = now(),
         invite_count = invite_count + 1,
         invited_by = auth.uid()
   where id = p_employee_id;
end $$;
revoke all on function public.record_employee_invite(uuid, text) from public;
grant execute on function public.record_employee_invite(uuid, text) to authenticated;

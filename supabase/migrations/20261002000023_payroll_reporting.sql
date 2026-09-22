-- ============================================================================
-- 0023 — Sending the payroll period out.
--
-- build_payroll_period already turns approved timesheets into per-employee
-- entries with hours, overtime, rates, adjustments and gross pay, and
-- pay_periods already carries exported_at. What was missing was any way to
-- produce a document or send one — "mark as exported" was an honesty checkbox.
--
-- This adds the three things that were needed:
--
--   * saved recipients, so a weekly send is a button rather than a retyped
--     address; pay data going to a mistyped stranger cannot be recalled
--   * an append-only record of what went to whom and when, because "did payroll
--     get last week's?" is a question that gets asked
--   * a count of the hours that were left OUT — approved-only figures are
--     right, but nobody should send a week without being told what is missing
-- ============================================================================

-- The generated report is stored against the send rather than in `documents`.
-- It is not an uploaded file someone filed against a record — it is an artefact
-- of the send itself, and tying the two together means a stored report can
-- never outlive, or disagree with, the record of where it went.

-- ---------- who payroll goes to ----------------------------------------------
create table public.payroll_recipients (
  id              uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  name            text not null check (length(name) between 1 and 120),
  email           text not null check (position('@' in email) > 1),
  role_note       text,                                  -- 'Payroll bureau', 'Accountant'
  active          boolean not null default true,
  created_by      uuid references auth.users(id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (organisation_id, email)
);
create index payroll_recipients_org_idx on public.payroll_recipients (organisation_id) where active;
create trigger payroll_recipients_updated_at before update on public.payroll_recipients
  for each row execute function public.set_updated_at();

-- ---------- what was sent, to whom, when --------------------------------------
create table public.payroll_sends (
  id              uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  pay_period_id   uuid not null references public.pay_periods(id) on delete cascade,
  recipients      text[] not null,
  storage_path    text,                        -- the PDF, in the documents bucket
  file_name       text,
  size_bytes      int,
  employee_count  int not null default 0,
  total_hours     numeric(10,2) not null default 0,
  total_gross     numeric(12,2) not null default 0,
  unapproved_count int not null default 0,     -- what was knowingly left out
  note            text,
  sent_by         uuid references auth.users(id) on delete set null,
  created_at      timestamptz not null default now()
);
create index payroll_sends_period_idx on public.payroll_sends (pay_period_id, created_at desc);

comment on table public.payroll_sends is
  'Append-only. A record that pay data left the building is evidence, not a working document.';

-- Hours inside the period that are NOT in the figures, because nobody approved
-- them. Returned per employee so the warning can name who to chase.
create or replace function public.payroll_unapproved(p_period_id uuid)
returns table (
  employee_id   uuid,
  employee_name text,
  site_name     text,
  sheets        bigint,
  hours         numeric,
  statuses      text
)
language sql stable security invoker set search_path = public as $$
  select e.id,
         e.first_name || ' ' || e.last_name,
         s.name,
         count(*),
         coalesce(sum(t.hours + t.overtime_hours), 0)::numeric(10,2),
         string_agg(distinct t.status::text, ', ' order by t.status::text)
    from public.pay_periods p
    join public.timesheets t
      on t.organisation_id = p.organisation_id
     and t.work_date between p.start_date and p.end_date
     and t.status in ('draft', 'submitted', 'rejected')
    join public.employees e on e.id = t.employee_id
    left join public.sites s on s.id = t.site_id
   where p.id = p_period_id
   group by e.id, e.first_name, e.last_name, s.name
   order by 2;
$$;

-- Everything the report needs about a period, in one call, so the PDF and the
-- screen can never disagree about what is in it.
create or replace function public.payroll_report(p_period_id uuid)
returns table (
  employee_id     uuid,
  employee_number text,
  employee_name   text,
  site_name       text,
  standard_hours  numeric,
  overtime_hours  numeric,
  hourly_rate     numeric,
  overtime_rate   numeric,
  base_pay        numeric,
  overtime_pay    numeric,
  adjustments     numeric,
  gross_pay       numeric,
  expenses        numeric,
  timesheet_count int
)
language sql stable security invoker set search_path = public as $$
  select e.id, e.employee_number, e.first_name || ' ' || e.last_name, s.name,
         pe.standard_hours, pe.overtime_hours, pe.hourly_rate, pe.overtime_rate,
         pe.base_pay, pe.overtime_pay, pe.adjustments, pe.gross_pay, pe.expenses,
         pe.timesheet_count
    from public.payroll_entries pe
    join public.employees e on e.id = pe.employee_id
    left join public.sites s on s.id = e.primary_site_id
   where pe.pay_period_id = p_period_id
   order by s.name nulls last, e.last_name, e.first_name;
$$;

-- Records a send. Definer because it writes the append-only log, but it checks
-- the caller is finance-level first.
create or replace function public.record_payroll_send(
  p_period_id uuid,
  p_recipients text[],
  p_storage_path text,
  p_file_name text,
  p_size_bytes int,
  p_employee_count int,
  p_total_hours numeric,
  p_total_gross numeric,
  p_unapproved int default 0,
  p_note text default null
) returns uuid language plpgsql security definer set search_path = public as $$
declare p public.pay_periods%rowtype; v_id uuid;
begin
  select * into p from public.pay_periods where id = p_period_id;
  if not found then raise exception 'pay period not found' using errcode = 'P0002'; end if;
  if not public.role_in(p.organisation_id, 'owner', 'administrator', 'finance') then
    raise exception 'not permitted' using errcode = '42501';
  end if;
  if coalesce(array_length(p_recipients, 1), 0) = 0 then
    raise exception 'No recipients' using errcode = 'check_violation';
  end if;

  insert into public.payroll_sends (organisation_id, pay_period_id, recipients, storage_path, file_name, size_bytes,
                                    employee_count, total_hours, total_gross, unapproved_count, note, sent_by)
  values (p.organisation_id, p_period_id, p_recipients, p_storage_path, p_file_name, p_size_bytes,
          p_employee_count, p_total_hours, p_total_gross, coalesce(p_unapproved, 0), p_note, auth.uid())
  returning id into v_id;

  -- Sending is what "exported" was always meant to mean.
  update public.pay_periods
     set exported_at = now(),
         status = case when status = 'finalised' then 'exported'::public.pay_period_status else status end
   where id = p_period_id;

  return v_id;
end $$;
revoke all on function public.record_payroll_send(uuid, text[], text, text, int, int, numeric, numeric, int, text) from public;
grant execute on function public.record_payroll_send(uuid, text[], text, text, int, int, numeric, numeric, int, text) to authenticated;

-- ---------- RLS ----------------------------------------------------------------
alter table public.payroll_recipients enable row level security;
alter table public.payroll_sends      enable row level security;

-- Pay data recipients are finance's business. A manager has no reason to know
-- which bureau the company uses, let alone change the address it goes to.
create policy payroll_recipients_select on public.payroll_recipients for select to authenticated
  using (public.role_in(organisation_id, 'owner', 'administrator', 'finance'));
create policy payroll_recipients_write on public.payroll_recipients for all to authenticated
  using (public.role_in(organisation_id, 'owner', 'administrator', 'finance'))
  with check (public.role_in(organisation_id, 'owner', 'administrator', 'finance'));

create policy payroll_sends_select on public.payroll_sends for select to authenticated
  using (public.role_in(organisation_id, 'owner', 'administrator', 'finance', 'read_only'));
-- Written by record_payroll_send only. No update and no delete policy at all:
-- a record that pay data was sent is not something anyone edits afterwards.
create policy payroll_sends_insert on public.payroll_sends for insert to authenticated
  with check (public.role_in(organisation_id, 'owner', 'administrator', 'finance'));

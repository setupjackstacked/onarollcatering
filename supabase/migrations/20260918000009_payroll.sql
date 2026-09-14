-- ============================================================================
-- 0009 — Phase 9: payroll preparation. Aggregates APPROVED timesheets into
--        per-employee entries with adjustments, ready for export to a payroll
--        provider. This is NOT a statutory payroll engine: no PAYE, NI,
--        pension or student loan calculation happens here (spec §50).
-- ============================================================================

create type public.pay_period_status as enum ('draft', 'review', 'finalised', 'exported');
create type public.pay_adjustment_kind as enum ('bonus', 'expense_reimbursement', 'deduction', 'holiday_pay', 'other');

create table public.pay_periods (
  id              uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  name            text not null,
  start_date      date not null,
  end_date        date not null,
  pay_date        date,
  status          public.pay_period_status not null default 'draft',
  notes           text,
  finalised_at    timestamptz,
  finalised_by    uuid references auth.users(id) on delete set null,
  exported_at     timestamptz,
  created_by      uuid references auth.users(id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  check (end_date >= start_date)
);
create index pay_periods_org_idx on public.pay_periods (organisation_id, start_date desc);
create trigger pay_periods_updated_at before update on public.pay_periods for each row execute function public.set_updated_at();

create table public.payroll_entries (
  id              uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  pay_period_id   uuid not null references public.pay_periods(id) on delete cascade,
  employee_id     uuid not null references public.employees(id) on delete restrict,
  standard_hours  numeric(8,2) not null default 0 check (standard_hours >= 0),
  overtime_hours  numeric(8,2) not null default 0 check (overtime_hours >= 0),
  hourly_rate     numeric(12,2) not null default 0 check (hourly_rate >= 0),
  overtime_rate   numeric(12,2) not null default 0 check (overtime_rate >= 0),
  base_pay        numeric(12,2) generated always as (round(standard_hours * hourly_rate, 2)) stored,
  overtime_pay    numeric(12,2) generated always as (round(overtime_hours * overtime_rate, 2)) stored,
  adjustments     numeric(12,2) not null default 0,   -- maintained from payroll_adjustments
  expenses        numeric(12,2) not null default 0,   -- reimbursements (not taxable pay)
  gross_pay       numeric(12,2) not null default 0,   -- base + overtime + adjustments (maintained)
  timesheet_count int not null default 0,
  notes           text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (pay_period_id, employee_id)
);
create index payroll_entries_period_idx on public.payroll_entries (pay_period_id);
create trigger payroll_entries_updated_at before update on public.payroll_entries for each row execute function public.set_updated_at();

create table public.payroll_adjustments (
  id                uuid primary key default gen_random_uuid(),
  organisation_id   uuid not null references public.organisations(id) on delete cascade,
  payroll_entry_id  uuid not null references public.payroll_entries(id) on delete cascade,
  kind              public.pay_adjustment_kind not null default 'other',
  label             text not null check (length(label) between 1 and 160),
  amount            numeric(12,2) not null,           -- negative for deductions
  expense_id        uuid references public.expenses(id) on delete set null,
  created_by        uuid references auth.users(id) on delete set null,
  created_at        timestamptz not null default now()
);
create index payroll_adjustments_entry_idx on public.payroll_adjustments (payroll_entry_id);

alter table public.timesheets add constraint timesheets_payroll_entry_fk
  foreign key (payroll_entry_id) references public.payroll_entries(id) on delete set null;

-- ---------- maintained totals ------------------------------------------------
create or replace function public.recalculate_payroll_entry(p_entry_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare v_adj numeric(12,2); v_exp numeric(12,2);
begin
  select coalesce(sum(case when kind = 'expense_reimbursement' then 0 else amount end), 0),
         coalesce(sum(case when kind = 'expense_reimbursement' then amount else 0 end), 0)
    into v_adj, v_exp
  from public.payroll_adjustments where payroll_entry_id = p_entry_id;

  update public.payroll_entries
     set adjustments = v_adj,
         expenses = v_exp,
         gross_pay = round(standard_hours * hourly_rate, 2) + round(overtime_hours * overtime_rate, 2) + v_adj
   where id = p_entry_id;
end $$;

create or replace function public.payroll_adjustments_recalc()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform public.recalculate_payroll_entry(coalesce(new.payroll_entry_id, old.payroll_entry_id));
  return null;
end $$;
create trigger payroll_adjustments_recalc after insert or update or delete on public.payroll_adjustments
  for each row execute function public.payroll_adjustments_recalc();

create or replace function public.payroll_entries_recalc()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  new.gross_pay := round(new.standard_hours * new.hourly_rate, 2) + round(new.overtime_hours * new.overtime_rate, 2) + new.adjustments;
  return new;
end $$;
create trigger payroll_entries_totals before insert or update of standard_hours, overtime_hours, hourly_rate, overtime_rate, adjustments
  on public.payroll_entries for each row execute function public.payroll_entries_recalc();

-- ---------- build a period from approved timesheets --------------------------
-- Idempotent: recalculating replaces hours from timesheets but keeps manual
-- adjustments. Overtime is paid at 1.5× unless the org overrides the rate.
create or replace function public.build_payroll_period(p_period_id uuid, p_overtime_multiplier numeric default 1.5)
returns int language plpgsql security definer set search_path = public as $$
declare p public.pay_periods%rowtype; r record; v_entry uuid; n int := 0;
begin
  select * into p from public.pay_periods where id = p_period_id;
  if not found then raise exception 'pay period not found' using errcode = 'P0002'; end if;
  if not public.role_in(p.organisation_id, 'owner','administrator','finance') then
    raise exception 'not permitted' using errcode = '42501';
  end if;
  if p.status in ('finalised','exported') then
    raise exception 'This pay period is finalised — reopen it to rebuild' using errcode = 'check_violation';
  end if;

  for r in
    select t.employee_id,
           sum(t.hours) as std_hours,
           sum(t.overtime_hours) as ot_hours,
           max(coalesce(t.hourly_rate, e.hourly_rate, 0)) as rate,
           count(*) as ts_count
    from public.timesheets t
    join public.employees e on e.id = t.employee_id
    where t.organisation_id = p.organisation_id
      and t.status = 'approved'
      and t.work_date between p.start_date and p.end_date
    group by t.employee_id
  loop
    insert into public.payroll_entries (organisation_id, pay_period_id, employee_id, standard_hours, overtime_hours, hourly_rate, overtime_rate, timesheet_count)
    values (p.organisation_id, p_period_id, r.employee_id, r.std_hours, r.ot_hours, r.rate, round(r.rate * p_overtime_multiplier, 2), r.ts_count)
    on conflict (pay_period_id, employee_id) do update
      set standard_hours = excluded.standard_hours,
          overtime_hours = excluded.overtime_hours,
          hourly_rate = excluded.hourly_rate,
          overtime_rate = excluded.overtime_rate,
          timesheet_count = excluded.timesheet_count
    returning id into v_entry;

    update public.timesheets set payroll_entry_id = v_entry
     where employee_id = r.employee_id and status = 'approved'
       and work_date between p.start_date and p.end_date and organisation_id = p.organisation_id;

    perform public.recalculate_payroll_entry(v_entry);
    n := n + 1;
  end loop;

  -- entries whose timesheets have since been unapproved and have no adjustments
  delete from public.payroll_entries pe
   where pe.pay_period_id = p_period_id
     and pe.timesheet_count > 0
     and not exists (select 1 from public.timesheets t where t.payroll_entry_id = pe.id)
     and not exists (select 1 from public.payroll_adjustments a where a.payroll_entry_id = pe.id);

  update public.pay_periods set status = 'review' where id = p_period_id and status = 'draft';
  return n;
end $$;
revoke all on function public.build_payroll_period(uuid, numeric) from public;
grant execute on function public.build_payroll_period(uuid, numeric) to authenticated;

-- Finalising marks the included timesheets paid so they can't be edited or double-counted.
create or replace function public.finalise_payroll_period(p_period_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare p public.pay_periods%rowtype;
begin
  select * into p from public.pay_periods where id = p_period_id;
  if not found then raise exception 'pay period not found' using errcode = 'P0002'; end if;
  if not public.role_in(p.organisation_id, 'owner','administrator','finance') then raise exception 'not permitted' using errcode = '42501'; end if;
  if p.status = 'finalised' or p.status = 'exported' then return; end if;
  if not exists (select 1 from public.payroll_entries where pay_period_id = p_period_id) then
    raise exception 'Nothing to finalise — build the period first' using errcode = 'check_violation';
  end if;

  update public.timesheets set status = 'paid'
   where payroll_entry_id in (select id from public.payroll_entries where pay_period_id = p_period_id)
     and status = 'approved';

  update public.pay_periods set status = 'finalised', finalised_at = now(), finalised_by = auth.uid() where id = p_period_id;

  insert into public.activity_logs (organisation_id, user_id, entity_type, entity_id, action, metadata)
  values (p.organisation_id, auth.uid(), 'pay_periods', p_period_id, 'payroll.finalised',
          jsonb_build_object('entries', (select count(*) from public.payroll_entries where pay_period_id = p_period_id),
                             'gross', (select coalesce(sum(gross_pay), 0) from public.payroll_entries where pay_period_id = p_period_id)));
end $$;
revoke all on function public.finalise_payroll_period(uuid) from public;
grant execute on function public.finalise_payroll_period(uuid) to authenticated;

create or replace function public.reopen_payroll_period(p_period_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare p public.pay_periods%rowtype;
begin
  select * into p from public.pay_periods where id = p_period_id;
  if not found then raise exception 'pay period not found' using errcode = 'P0002'; end if;
  if not public.role_in(p.organisation_id, 'owner','administrator') then raise exception 'not permitted' using errcode = '42501'; end if;
  update public.timesheets set status = 'approved'
   where payroll_entry_id in (select id from public.payroll_entries where pay_period_id = p_period_id) and status = 'paid';
  update public.pay_periods set status = 'review', finalised_at = null, finalised_by = null, exported_at = null where id = p_period_id;
end $$;
revoke all on function public.reopen_payroll_period(uuid) from public;
grant execute on function public.reopen_payroll_period(uuid) to authenticated;

-- Paid timesheets are frozen by the Phase 8 guard; the payroll functions above
-- run as definer so they can move them between approved and paid legitimately.
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

-- ---------- RLS --------------------------------------------------------------
alter table public.pay_periods          enable row level security;
alter table public.payroll_entries      enable row level security;
alter table public.payroll_adjustments  enable row level security;

create policy pay_periods_select on public.pay_periods for select to authenticated
  using (public.role_in(organisation_id, 'owner','administrator','finance'));
create policy pay_periods_write on public.pay_periods for all to authenticated
  using (public.role_in(organisation_id, 'owner','administrator','finance'))
  with check (public.role_in(organisation_id, 'owner','administrator','finance'));

-- An employee may see their own payroll entry (their pay, nobody else's).
create policy payroll_entries_select on public.payroll_entries for select to authenticated using (
  public.role_in(organisation_id, 'owner','administrator','finance') or employee_id = public.my_employee_id()
);
create policy payroll_entries_write on public.payroll_entries for all to authenticated
  using (public.role_in(organisation_id, 'owner','administrator','finance'))
  with check (public.role_in(organisation_id, 'owner','administrator','finance'));

create policy payroll_adjustments_select on public.payroll_adjustments for select to authenticated using (
  public.role_in(organisation_id, 'owner','administrator','finance')
  or exists (select 1 from public.payroll_entries e where e.id = payroll_entry_id and e.employee_id = public.my_employee_id())
);
create policy payroll_adjustments_write on public.payroll_adjustments for all to authenticated
  using (public.role_in(organisation_id, 'owner','administrator','finance'))
  with check (public.role_in(organisation_id, 'owner','administrator','finance'));

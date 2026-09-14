-- Phase 9: payroll period build, adjustments, finalise/reopen, RLS.
create or replace function test_as(user_id uuid) returns void language plpgsql as $$
begin perform set_config('request.jwt.claim.sub', user_id::text, true); perform set_config('request.jwt.claim.role', 'authenticated', true); perform set_config('role', 'authenticated', true); end $$;
create or replace function test_reset() returns void language plpgsql as $$
begin perform set_config('role', 'postgres', true); perform set_config('request.jwt.claim.sub', '', true); end $$;

do $$
declare
  v_org uuid := '00000000-0000-4000-8000-000000000001';
  v_proj uuid := '00000000-0000-4000-8000-000000000101';
  v_emp uuid := '00000000-0000-4000-8000-000000000201';
  v_owner uuid := '00000000-0000-4000-8000-0000000000a1';
  v_fin uuid := '00000000-0000-4000-8000-0000000000a2';
  v_staff uuid := '00000000-0000-4000-8000-0000000000a5';
  v_period uuid; v_entry uuid; n int; r record;
begin
  -- two approved timesheets in the period (8h + 6h, 2h overtime) at 18.50
  perform test_as(v_owner);
  insert into public.timesheets (organisation_id, employee_id, project_id, work_date, start_time, end_time, break_minutes, overtime_hours, status, hourly_rate, created_by)
  values (v_org, v_emp, v_proj, date_trunc('month', current_date)::date + 1, '09:00', '17:30', 30, 0, 'approved', 18.50, v_owner),
         (v_org, v_emp, v_proj, date_trunc('month', current_date)::date + 2, '09:00', '15:30', 30, 2, 'approved', 18.50, v_owner);

  perform test_as(v_fin);
  insert into public.pay_periods (organisation_id, name, start_date, end_date, pay_date, created_by)
  values (v_org, 'TEST period', date_trunc('month', current_date)::date, (date_trunc('month', current_date) + interval '1 month - 1 day')::date, current_date, v_fin)
  returning id into v_period;

  n := public.build_payroll_period(v_period);
  if n <> 1 then raise exception 'expected 1 entry, got %', n; end if;
  if (select status from public.pay_periods where id = v_period) <> 'review' then raise exception 'status not review'; end if;

  select * into r from public.payroll_entries where pay_period_id = v_period;
  v_entry := r.id;
  -- 8.0 + 6.0 = 14.00 standard hours, 2 overtime at 27.75
  if r.standard_hours <> 14.00 then raise exception 'standard hours % <> 14', r.standard_hours; end if;
  if r.overtime_hours <> 2.00 then raise exception 'overtime hours wrong'; end if;
  if r.overtime_rate <> 27.75 then raise exception 'overtime rate % <> 27.75', r.overtime_rate; end if;
  if r.base_pay <> 259.00 then raise exception 'base pay % <> 259.00', r.base_pay; end if;
  if r.gross_pay <> 314.50 then raise exception 'gross % <> 314.50', r.gross_pay; end if;
  if r.timesheet_count <> 2 then raise exception 'timesheet count wrong'; end if;

  -- adjustments: a bonus adds to gross; a reimbursement is tracked separately
  insert into public.payroll_adjustments (organisation_id, payroll_entry_id, kind, label, amount, created_by)
  values (v_org, v_entry, 'bonus', 'TEST weekend cover', 50.00, v_fin),
         (v_org, v_entry, 'expense_reimbursement', 'TEST mileage', 22.40, v_fin),
         (v_org, v_entry, 'deduction', 'TEST uniform', -15.00, v_fin);
  select * into r from public.payroll_entries where id = v_entry;
  if r.adjustments <> 35.00 then raise exception 'adjustments % <> 35', r.adjustments; end if;
  if r.expenses <> 22.40 then raise exception 'expenses % <> 22.40', r.expenses; end if;
  if r.gross_pay <> 349.50 then raise exception 'gross with adj % <> 349.50', r.gross_pay; end if;

  -- rebuilding keeps adjustments
  n := public.build_payroll_period(v_period);
  select * into r from public.payroll_entries where id = v_entry;
  if r.gross_pay <> 349.50 then raise exception 'rebuild lost adjustments'; end if;

  -- staff can see their own entry but not write it
  perform test_as(v_staff);
  select count(*) into n from public.payroll_entries where id = v_entry; if n <> 1 then raise exception 'staff cannot see own pay'; end if;
  select count(*) into n from public.pay_periods; if n <> 0 then raise exception 'staff sees pay periods'; end if;

  -- finalise: timesheets become paid and frozen
  perform test_as(v_fin);
  perform public.finalise_payroll_period(v_period);
  select count(*) into n from public.timesheets where payroll_entry_id = v_entry and status = 'paid';
  if n <> 2 then raise exception 'timesheets not marked paid (%)', n; end if;
  begin
    perform public.build_payroll_period(v_period);
    raise exception 'rebuilt a finalised period';
  exception when check_violation then null; end;

  -- reopening returns them to approved
  perform test_as(v_owner);
  perform public.reopen_payroll_period(v_period);
  select count(*) into n from public.timesheets where payroll_entry_id = v_entry and status = 'approved';
  if n <> 2 then raise exception 'reopen did not restore timesheets (%)', n; end if;

  perform test_reset();
  delete from public.pay_periods where id = v_period;
  delete from public.timesheets where employee_id = v_emp;
  raise notice 'PASS payroll';
end $$;
drop function test_as(uuid); drop function test_reset();

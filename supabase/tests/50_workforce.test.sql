-- Phase 8: employees, rota, conflicts, leave, timesheets, labour cost.
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
  v_pm uuid := '00000000-0000-4000-8000-0000000000a3';
  v_staff uuid := '00000000-0000-4000-8000-0000000000a5';
  v_shift uuid; v_ts uuid; v_leave uuid; n int; r record; v_num text;
begin
  -- employee number assigned, default roles seeded
  select employee_number into v_num from public.employees where id = v_emp;
  if v_num !~ '^OAR-E-\d{4}-\d{4}$' then raise exception 'employee number % not assigned', v_num; end if;
  select count(*) into n from public.employee_roles where organisation_id = v_org; if n < 9 then raise exception 'roles not seeded'; end if;

  -- staff sees only their own employee row; PM sees none directly but sees the directory
  perform test_as(v_staff);
  select count(*) into n from public.employees; if n <> 1 then raise exception 'staff sees % employee rows', n; end if;
  if public.my_employee_id() <> v_emp then raise exception 'my_employee_id wrong'; end if;
  perform test_as(v_pm);
  select count(*) into n from public.employees; if n <> 0 then raise exception 'PM sees HR rows'; end if;
  select count(*) into n from public.employee_directory where organisation_id = v_org; if n <> 1 then raise exception 'PM cannot see directory'; end if;

  -- PM schedules a shift on their project; hours computed net of break
  insert into public.shifts (organisation_id, employee_id, project_id, shift_date, start_time, end_time, break_minutes, status, created_by)
  values (v_org, v_emp, v_proj, current_date + 7, '08:00', '17:00', 30, 'published', v_pm) returning id into v_shift;
  if (select hours from public.shifts where id = v_shift) <> 8.50 then raise exception 'shift hours wrong: %', (select hours from public.shifts where id = v_shift); end if;

  -- overnight shift spans midnight
  insert into public.shifts (organisation_id, employee_id, project_id, shift_date, start_time, end_time, break_minutes, created_by)
  values (v_org, v_emp, v_proj, current_date + 20, '22:00', '06:00', 60, v_pm);
  if (select hours from public.shifts where employee_id = v_emp and shift_date = current_date + 20) <> 7.00 then raise exception 'overnight hours wrong'; end if;

  -- conflict detection: overlapping shift is warned about, not blocked
  select count(*) into n from public.shift_conflicts(v_emp, current_date + 7, '12:00', '18:00') where kind = 'overlapping_shift';
  if n <> 1 then raise exception 'overlap not detected (%)', n; end if;
  select count(*) into n from public.shift_conflicts(v_emp, current_date + 7, '18:30', '22:00');
  if n <> 0 then raise exception 'false conflict'; end if;

  -- staff requests leave; cannot approve their own
  perform test_as(v_staff);
  insert into public.leave_requests (organisation_id, employee_id, leave_type, start_date, end_date, days, reason)
  values (v_org, v_emp, 'holiday', current_date + 30, current_date + 34, 5, 'TEST holiday') returning id into v_leave;
  begin
    update public.leave_requests set status = 'approved' where id = v_leave;
    if (select status from public.leave_requests where id = v_leave) = 'approved' then raise exception 'staff approved own leave'; end if;
  exception when insufficient_privilege then null; end;

  perform test_as(v_owner);
  update public.leave_requests set status = 'approved' where id = v_leave;
  if (select decided_by from public.leave_requests where id = v_leave) <> v_owner then raise exception 'decided_by not stamped'; end if;

  -- approved leave shows as a conflict when scheduling inside it
  select count(*) into n from public.shift_conflicts(v_emp, current_date + 31, '09:00', '17:00') where kind = 'on_leave';
  if n <> 1 then raise exception 'leave conflict not detected'; end if;

  -- staff logs a timesheet from the shift and submits it; cannot approve it
  perform test_as(v_staff);
  v_ts := public.timesheet_from_shift(v_shift);
  if public.timesheet_from_shift(v_shift) <> v_ts then raise exception 'timesheet_from_shift not idempotent'; end if;
  if (select hours from public.timesheets where id = v_ts) <> 8.50 then raise exception 'timesheet hours wrong'; end if;
  update public.timesheets set status = 'submitted' where id = v_ts;
  if (select submitted_at from public.timesheets where id = v_ts) is null then raise exception 'submitted_at not stamped'; end if;
  begin
    update public.timesheets set status = 'approved' where id = v_ts;
    if (select status from public.timesheets where id = v_ts) = 'approved' then raise exception 'staff approved own timesheet'; end if;
  exception when insufficient_privilege then null; end;

  -- PM (project manager for this project) approves; rate snapshotted from the employee
  perform test_as(v_pm);
  update public.timesheets set status = 'approved' where id = v_ts;
  select * into r from public.timesheets where id = v_ts;
  if r.approved_by <> v_pm then raise exception 'approver not stamped'; end if;
  if r.hourly_rate <> 18.50 then raise exception 'rate not snapshotted (%)', r.hourly_rate; end if;

  -- labour cost flows into project financials: 8.5h * 18.50 = 157.25
  select * into r from public.project_financials where project_id = v_proj;
  if r.labour_cost <> 157.25 then raise exception 'labour cost % <> 157.25', r.labour_cost; end if;
  if r.actual_cost <> 157.25 then raise exception 'actual cost excludes labour'; end if;

  -- paid timesheets are frozen
  perform test_as(v_owner);
  update public.timesheets set status = 'paid' where id = v_ts;
  begin
    update public.timesheets set status = 'draft' where id = v_ts;
    raise exception 'paid timesheet reopened';
  exception when check_violation then null; end;

  -- cleanup
  perform test_reset();
  delete from public.timesheets where employee_id = v_emp;
  delete from public.shifts where employee_id = v_emp;
  delete from public.leave_requests where employee_id = v_emp;
  raise notice 'PASS workforce';
end $$;
drop function test_as(uuid); drop function test_reset();

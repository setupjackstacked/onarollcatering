-- 0023: payroll reporting — who may send pay data out, and what gets excluded.
create or replace function test_as(user_id uuid) returns void language plpgsql as $$
begin perform set_config('request.jwt.claim.sub', user_id::text, true); perform set_config('request.jwt.claim.role', 'authenticated', true); perform set_config('role', 'authenticated', true); end $$;
create or replace function test_reset() returns void language plpgsql as $$
begin perform set_config('role', 'postgres', true); perform set_config('request.jwt.claim.sub', '', true); end $$;

do $$
declare
  v_org    uuid := '00000000-0000-4000-8000-000000000001';
  v_proj   uuid := '00000000-0000-4000-8000-000000000101';
  v_emp    uuid := '00000000-0000-4000-8000-000000000201';
  v_owner  uuid := '00000000-0000-4000-8000-0000000000a1';
  v_fin    uuid := '00000000-0000-4000-8000-0000000000a2';
  v_pm     uuid := '00000000-0000-4000-8000-0000000000a3';
  v_staff  uuid := '00000000-0000-4000-8000-0000000000a5';
  v_period uuid;
  v_rec    uuid;
  v_send   uuid;
  n int; ok boolean; v_hours numeric; v_gross numeric;
begin
  -- A week with one approved timesheet and one that nobody approved.
  insert into public.pay_periods (organisation_id, name, start_date, end_date, pay_date, created_by)
  values (v_org, 'TEST week', current_date - 7, current_date - 1, current_date + 4, v_owner)
  returning id into v_period;

  insert into public.timesheets (organisation_id, employee_id, project_id, work_date, start_time, end_time,
                                 break_minutes, status, created_by)
  values (v_org, v_emp, v_proj, current_date - 5, '08:00', '16:00', 30, 'approved', v_owner),
         (v_org, v_emp, v_proj, current_date - 4, '08:00', '12:00', 0,  'submitted', v_owner);

  -- ---------- what is excluded is reported, not silently dropped ------------
  select coalesce(sum(sheets), 0), coalesce(sum(hours), 0)
    into n, v_hours
    from public.payroll_unapproved(v_period);
  if n <> 1 then raise exception 'expected 1 unapproved sheet, got %', n; end if;
  if v_hours <> 4.00 then raise exception 'unapproved hours wrong: %', v_hours; end if;

  -- ---------- building pulls in the approved one only -----------------------
  perform test_as(v_fin);
  perform public.build_payroll_period(v_period);
  perform test_reset();

  select count(*), coalesce(sum(standard_hours + overtime_hours), 0)
    into n, v_hours from public.payroll_report(v_period);
  if n <> 1 then raise exception 'expected 1 employee in the report, got %', n; end if;
  if v_hours <> 7.50 then raise exception 'reported hours wrong: % (approved sheet only)', v_hours; end if;

  -- ---------- recipients are finance's business -----------------------------
  perform test_as(v_pm);
  select count(*) into n from public.payroll_recipients;
  if n <> 0 then raise exception 'a manager can see payroll recipients'; end if;
  ok := false;
  begin
    insert into public.payroll_recipients (organisation_id, name, email)
    values (v_org, 'Rogue', 'rogue@example.com');
    ok := true;
  exception when insufficient_privilege then null;
  end;
  if ok then raise exception 'a manager added a payroll recipient'; end if;
  perform test_reset();

  perform test_as(v_staff);
  select count(*) into n from public.payroll_recipients;
  if n <> 0 then raise exception 'staff can see payroll recipients'; end if;
  perform test_reset();

  perform test_as(v_fin);
  insert into public.payroll_recipients (organisation_id, name, email, role_note, created_by)
  values (v_org, 'TEST Bureau', 'bureau@example.com', 'Payroll bureau', v_fin)
  returning id into v_rec;
  perform test_reset();

  -- ---------- only finance may record a send --------------------------------
  perform test_as(v_pm);
  ok := false;
  begin
    perform public.record_payroll_send(v_period, array['bureau@example.com'], null, 'x.pdf', 100, 1, 7.50, 100.00, 1, null);
    ok := true;
  exception when insufficient_privilege then null;
  end;
  if ok then raise exception 'a manager sent payroll out'; end if;
  perform test_reset();

  perform test_as(v_staff);
  ok := false;
  begin
    perform public.record_payroll_send(v_period, array['bureau@example.com'], null, 'x.pdf', 100, 1, 7.50, 100.00, 1, null);
    ok := true;
  exception when insufficient_privilege then null;
  end;
  if ok then raise exception 'staff sent payroll out'; end if;
  perform test_reset();

  -- A send with nobody to send to is refused rather than silently recorded.
  perform test_as(v_fin);
  ok := false;
  begin
    perform public.record_payroll_send(v_period, array[]::text[], null, 'x.pdf', 100, 1, 7.50, 100.00, 0, null);
    ok := true;
  exception when check_violation then null;
  end;
  if ok then raise exception 'a send with no recipients was recorded'; end if;

  v_send := public.record_payroll_send(v_period, array['bureau@example.com'],
              'org/payroll/x.pdf', 'OAR_PAYROLL.pdf', 2048, 1, 7.50, 123.45, 1, 'First run');
  perform test_reset();

  if (select unapproved_count from public.payroll_sends where id = v_send) <> 1 then
    raise exception 'the send did not record what was left out';
  end if;
  if (select exported_at from public.pay_periods where id = v_period) is null then
    raise exception 'sending did not mark the period exported';
  end if;

  -- ---------- the send history is evidence ----------------------------------
  -- No update or delete policy exists at all, so both fail under RLS.
  perform test_as(v_fin);
  begin
    update public.payroll_sends set total_gross = 1 where id = v_send;
  exception when insufficient_privilege then null;
  end;
  if (select total_gross from public.payroll_sends where id = v_send) <> 123.45 then
    raise exception 'the send record was rewritten';
  end if;

  begin
    delete from public.payroll_sends where id = v_send;
  exception when insufficient_privilege then null;
  end;
  perform test_reset();
  select count(*) into n from public.payroll_sends where id = v_send;
  if n <> 1 then raise exception 'the send record was deleted'; end if;

  -- A manager cannot read who payroll went to either.
  perform test_as(v_pm);
  select count(*) into n from public.payroll_sends;
  if n <> 0 then raise exception 'a manager can read the payroll send history'; end if;
  perform test_reset();

  -- Clean up so later suites see the fixtures they expect.
  delete from public.payroll_sends where pay_period_id = v_period;
  delete from public.payroll_recipients where id = v_rec;
  update public.timesheets set payroll_entry_id = null where organisation_id = v_org;
  delete from public.payroll_entries where pay_period_id = v_period;
  delete from public.pay_periods where id = v_period;
  delete from public.timesheets where organisation_id = v_org and work_date in (current_date - 5, current_date - 4);

  raise notice 'payroll reporting: ok';
end $$;

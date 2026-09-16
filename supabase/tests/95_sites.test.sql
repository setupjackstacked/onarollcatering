-- Sites as operating units: assignment, manager scoping, approval by site,
-- and the amendment guard on approved timesheets.
create or replace function test_as(user_id uuid) returns void language plpgsql as $$
begin perform set_config('request.jwt.claim.sub', user_id::text, true); perform set_config('request.jwt.claim.role', 'authenticated', true); perform set_config('role', 'authenticated', true); end $$;
create or replace function test_reset() returns void language plpgsql as $$
begin perform set_config('role', 'postgres', true); perform set_config('request.jwt.claim.sub', '', true); end $$;

do $$
declare
  v_org uuid := '00000000-0000-4000-8000-000000000001';
  v_client uuid := '00000000-0000-4000-8000-0000000000c1';
  v_emp uuid := '00000000-0000-4000-8000-000000000201';
  v_owner uuid := '00000000-0000-4000-8000-0000000000a1';
  v_mgr uuid := '00000000-0000-4000-8000-0000000000a3';   -- project_manager role = site MANAGER
  v_ro  uuid := '00000000-0000-4000-8000-0000000000a4';
  v_staff uuid := '00000000-0000-4000-8000-0000000000a5';
  v_site uuid; v_ts uuid; n int; r record;
begin
  -- owner opens a kitchen and puts the manager on it
  perform test_as(v_owner);
  insert into public.sites (organisation_id, client_id, name, site_type, status, oar_manager_id, site_manager_name)
  values (v_org, v_client, 'TEST Kitchen One', 'kitchen', 'operating', v_mgr, 'TEST Client Contact')
  returning id into v_site;

  insert into public.site_assignments (organisation_id, site_id, user_id, employee_id, role, is_primary, created_by)
  values (v_org, v_site, v_staff, v_emp, 'staff', true, v_owner);

  -- the primary assignment writes through to the employee record
  if (select primary_site_id from public.employees where id = v_emp) <> v_site then
    raise exception 'primary_site_id not synced';
  end if;

  -- manager: can read and write the site without being its project manager
  perform test_as(v_mgr);
  if not public.can_read_site(v_site) then raise exception 'manager cannot read site'; end if;
  if not public.can_write_site(v_site) then raise exception 'manager cannot write site'; end if;
  if not public.manages_employee(v_emp) then raise exception 'manager does not manage assigned staff'; end if;
  update public.sites set notes = 'TEST manager edit' where id = v_site;
  if (select notes from public.sites where id = v_site) is distinct from 'TEST manager edit' then
    raise exception 'manager edit did not apply';
  end if;

  -- manager can now open the HR record of staff at their site
  select count(*) into n from public.employees where id = v_emp;
  if n <> 1 then raise exception 'manager cannot see their own staff (%)', n; end if;

  -- staff: can read the site they work at (address, access notes) but not change it
  perform test_as(v_staff);
  select count(*) into n from public.sites where id = v_site;
  if n <> 1 then raise exception 'assigned staff cannot see their site'; end if;
  update public.sites set notes = 'nope' where id = v_site;
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'staff edited a site'; end if;

  -- staff logs hours at the site, with no project involved at all
  insert into public.timesheets (organisation_id, employee_id, site_id, work_date, start_time, end_time, break_minutes, created_by)
  values (v_org, v_emp, v_site, current_date - 1, '09:00', '17:00', 30, v_staff) returning id into v_ts;
  update public.timesheets set status = 'submitted' where id = v_ts;

  -- staff cannot approve their own
  update public.timesheets set status = 'approved' where id = v_ts;
  if (select status from public.timesheets where id = v_ts) = 'approved' then
    raise exception 'staff approved their own site timesheet';
  end if;

  -- the site manager can, through the site branch rather than a project
  perform test_as(v_mgr);
  update public.timesheets set status = 'approved' where id = v_ts;
  if (select status from public.timesheets where id = v_ts) <> 'approved' then
    raise exception 'site manager could not approve';
  end if;
  if (select hourly_rate from public.timesheets where id = v_ts) <> 18.50 then
    raise exception 'rate not snapshotted on site approval';
  end if;

  -- amending an approved sheet without a reason is refused
  begin
    update public.timesheets set end_time = '19:00' where id = v_ts;
    raise exception 'amended an approved timesheet with no reason';
  exception when check_violation then null; end;

  -- with a reason it is allowed, stamped and logged
  update public.timesheets set end_time = '19:00', amendment_reason = 'TEST agreed overtime added' where id = v_ts;
  select * into r from public.timesheets where id = v_ts;
  if r.amended_by <> v_mgr or r.amended_at is null then raise exception 'amendment not stamped'; end if;
  if r.hours <> 9.50 then raise exception 'amended hours % <> 9.50', r.hours; end if;
  select count(*) into n from public.activity_logs
   where entity_type = 'timesheets' and entity_id = v_ts and action = 'timesheets.amended';
  if n <> 1 then raise exception 'amendment not logged (%)', n; end if;

  -- read_only sees the site but cannot touch anything
  perform test_as(v_ro);
  select count(*) into n from public.sites where id = v_site;
  if n <> 1 then raise exception 'read_only cannot see sites'; end if;
  begin
    insert into public.site_assignments (organisation_id, site_id, user_id, role)
    values (v_org, v_site, v_ro, 'manager');
    raise exception 'read_only assigned themselves to a site';
  exception when insufficient_privilege then null; end;

  -- a manager of a DIFFERENT site sees nothing of this one
  perform test_reset();
  delete from public.site_assignments where site_id = v_site;
  update public.sites set oar_manager_id = null where id = v_site;
  perform test_as(v_mgr);
  if public.can_write_site(v_site) then raise exception 'unassigned manager still has write access'; end if;

  perform test_reset();
  delete from public.timesheets where id = v_ts;
  delete from public.sites where id = v_site;
  raise notice 'PASS sites as operating units';
end $$;
drop function test_as(uuid); drop function test_reset();

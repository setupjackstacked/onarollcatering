-- 0021: employee invitations — job titles, access reporting, and the one
-- function that turns an employee record into someone who can actually log in.
create or replace function test_as(user_id uuid) returns void language plpgsql as $$
begin perform set_config('request.jwt.claim.sub', user_id::text, true); perform set_config('request.jwt.claim.role', 'authenticated', true); perform set_config('role', 'authenticated', true); end $$;
create or replace function test_reset() returns void language plpgsql as $$
begin perform set_config('role', 'postgres', true); perform set_config('request.jwt.claim.sub', '', true); end $$;

do $$
declare
  v_org   uuid := '00000000-0000-4000-8000-000000000001';
  v_site  uuid := '00000000-0000-4000-8000-0000000000e1';
  v_owner uuid := '00000000-0000-4000-8000-0000000000a1';
  v_pm    uuid := '00000000-0000-4000-8000-0000000000a3';
  v_staff uuid := '00000000-0000-4000-8000-0000000000a5';
  v_new_user uuid := '00000000-0000-4000-8000-0000000000b7';
  v_other_user uuid := '00000000-0000-4000-8000-0000000000b8';
  v_emp   uuid;
  v_emp2  uuid;
  n int; r record; ok boolean;
begin
  -- ---------- the real job titles are available -----------------------------
  select count(*) into n from public.employee_roles
   where organisation_id = v_org and key in ('lead-chef','foh-manager','barista','managing-director');
  if n <> 4 then raise exception 'job titles not seeded (% of 4)', n; end if;

  -- Two auth users to invite, created the way Supabase would.
  insert into auth.users (id, email, raw_user_meta_data)
  values (v_new_user, 'invitee@example.com', '{"full_name":"SAMPLE Invitee"}'),
         (v_other_user, 'other@example.com', '{"full_name":"SAMPLE Other"}')
  on conflict (id) do nothing;

  -- An employee with no login yet, based at the sample site.
  insert into public.employees (organisation_id, employee_number, first_name, last_name, role_key,
                                employment_type, primary_site_id, status)
  values (v_org, '', 'SAMPLE', 'Unlinked', 'foh-manager', 'full_time', v_site, 'active')
  returning id into v_emp;

  -- ---------- employees_without_access reports the right state --------------
  select state into r from (select state from public.employees_without_access(v_org) where employee_id = v_emp) s;
  if r.state <> 'no_email' then raise exception 'expected no_email, got %', r.state; end if;

  update public.employees set email = 'invitee@example.com' where id = v_emp;
  select state into r from (select state from public.employees_without_access(v_org) where employee_id = v_emp) s;
  if r.state <> 'ready' then raise exception 'expected ready, got %', r.state; end if;

  -- ---------- a manager cannot hand out logins ------------------------------
  perform test_as(v_pm);
  ok := false;
  begin
    perform public.link_employee_account(v_emp, v_new_user, 'project_manager', 'manager');
    ok := true;
  exception when insufficient_privilege then null;
  end;
  if ok then raise exception 'a project manager was allowed to link an account'; end if;

  -- ---------- staff certainly cannot ----------------------------------------
  perform test_as(v_staff);
  ok := false;
  begin
    perform public.link_employee_account(v_emp, v_new_user, 'administrator', 'manager');
    ok := true;
  exception when insufficient_privilege then null;
  end;
  if ok then raise exception 'staff were allowed to link an account'; end if;

  -- ---------- the owner links it, and everything lands at once --------------
  perform test_as(v_owner);
  perform public.link_employee_account(v_emp, v_new_user, 'project_manager', 'manager');
  perform test_reset();

  if (select user_id from public.employees where id = v_emp) <> v_new_user then
    raise exception 'employee not linked to the login';
  end if;
  if (select invite_count from public.employees where id = v_emp) <> 1 then
    raise exception 'invite not counted';
  end if;
  if (select invited_at from public.employees where id = v_emp) is null then
    raise exception 'invited_at not stamped';
  end if;
  select count(*) into n from public.organisation_members
   where organisation_id = v_org and user_id = v_new_user and role = 'project_manager';
  if n <> 1 then raise exception 'membership not created'; end if;
  select count(*) into n from public.site_assignments
   where site_id = v_site and user_id = v_new_user and role = 'manager' and is_primary;
  if n <> 1 then raise exception 'site assignment not created'; end if;

  -- They now manage that site, which is the whole point of the roster entry.
  perform test_as(v_new_user);
  if not public.can_write_site(v_site) then raise exception 'linked manager cannot manage their site'; end if;
  perform test_reset();

  -- ---------- one login, one employee ---------------------------------------
  insert into public.employees (organisation_id, employee_number, first_name, last_name, role_key, employment_type, status)
  values (v_org, '', 'SAMPLE', 'Second', 'barista', 'part_time', 'active')
  returning id into v_emp2;

  perform test_as(v_owner);
  ok := false;
  begin
    perform public.link_employee_account(v_emp2, v_new_user, 'staff', 'staff');
    ok := true;
  exception when check_violation then null;
  end;
  if ok then raise exception 'the same login was attached to two employees'; end if;

  -- Re-linking the SAME login to the same employee is fine (a repeat invite).
  perform public.link_employee_account(v_emp, v_new_user, 'project_manager', 'manager');
  perform test_reset();
  if (select invite_count from public.employees where id = v_emp) <> 2 then
    raise exception 'repeat invite not counted';
  end if;

  -- Swapping an employee onto a different login is refused, not silently done.
  perform test_as(v_owner);
  ok := false;
  begin
    perform public.link_employee_account(v_emp, v_other_user, 'staff', 'staff');
    ok := true;
  exception when check_violation then null;
  end;
  if ok then raise exception 'employee was re-pointed at a different login'; end if;

  -- ---------- record_employee_invite is admin-only too ----------------------
  perform test_as(v_staff);
  ok := false;
  begin
    perform public.record_employee_invite(v_emp2, 'someone@example.com');
    ok := true;
  exception when insufficient_privilege then null;
  end;
  if ok then raise exception 'staff recorded an invite'; end if;

  perform test_as(v_owner);
  perform public.record_employee_invite(v_emp2, 'second@example.com');
  perform test_reset();
  if (select email from public.employees where id = v_emp2) <> 'second@example.com' then
    raise exception 'invite did not store the email';
  end if;

  -- A linked employee drops out of the "no access" list entirely.
  select count(*) into n from public.employees_without_access(v_org) where employee_id = v_emp;
  if n <> 0 then raise exception 'linked employee still listed as without access'; end if;

  -- Clean up so later suites see the fixtures they expect.
  delete from public.site_assignments where user_id = v_new_user;
  delete from public.organisation_members where user_id in (v_new_user, v_other_user);
  delete from public.employees where id in (v_emp, v_emp2);
  delete from auth.users where id in (v_new_user, v_other_user);

  raise notice 'employee invitations: ok';
end $$;

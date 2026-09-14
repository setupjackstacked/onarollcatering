-- Phase 12: staff can maintain their own contact details and nothing else.
create or replace function test_as(user_id uuid) returns void language plpgsql as $$
begin perform set_config('request.jwt.claim.sub', user_id::text, true); perform set_config('request.jwt.claim.role', 'authenticated', true); perform set_config('role', 'authenticated', true); end $$;
create or replace function test_reset() returns void language plpgsql as $$
begin perform set_config('role', 'postgres', true); perform set_config('request.jwt.claim.sub', '', true); end $$;

do $$
declare
  v_emp uuid := '00000000-0000-4000-8000-000000000201';
  v_staff uuid := '00000000-0000-4000-8000-0000000000a5';
  v_owner uuid := '00000000-0000-4000-8000-0000000000a1';
  v_other uuid; n int;
begin
  perform test_as(v_staff);
  update public.employees set phone = '07700 900000', emergency_contact = '{"name":"TEST Next of Kin","phone":"07700 900111"}'::jsonb where id = v_emp;
  if (select phone from public.employees where id = v_emp) <> '07700 900000' then raise exception 'staff could not update own phone'; end if;

  -- pay and role are off limits
  begin
    update public.employees set hourly_rate = 99 where id = v_emp;
    raise exception 'staff changed their own pay rate';
  exception when insufficient_privilege then null; end;
  begin
    update public.employees set role_key = 'catering-manager' where id = v_emp;
    raise exception 'staff changed their own role';
  exception when insufficient_privilege then null; end;

  -- and they cannot touch anyone else's record
  perform test_reset();
  insert into public.employees (organisation_id, employee_number, first_name, last_name, role_key)
  values ('00000000-0000-4000-8000-000000000001', '', 'TEST', 'Other', 'chef') returning id into v_other;
  perform test_as(v_staff);
  update public.employees set phone = 'nope' where id = v_other;
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'staff updated another employee'; end if;

  -- owners still have full control
  perform test_as(v_owner);
  update public.employees set hourly_rate = 19.00 where id = v_emp;
  if (select hourly_rate from public.employees where id = v_emp) <> 19.00 then raise exception 'owner blocked from updating pay'; end if;

  perform test_reset();
  delete from public.employees where id = v_other;
  update public.employees set hourly_rate = 18.50 where id = v_emp;
  raise notice 'PASS staff portal';
end $$;
drop function test_as(uuid); drop function test_reset();

-- 0022: daily sales, site budgets and the site P&L.
--
-- The point of these assertions is the money boundary. Takings are On A Roll's
-- own trading position: staff must not see them at all, and a manager must see
-- only the kitchens they actually run.
create or replace function test_as(user_id uuid) returns void language plpgsql as $$
begin perform set_config('request.jwt.claim.sub', user_id::text, true); perform set_config('request.jwt.claim.role', 'authenticated', true); perform set_config('role', 'authenticated', true); end $$;
create or replace function test_reset() returns void language plpgsql as $$
begin perform set_config('role', 'postgres', true); perform set_config('request.jwt.claim.sub', '', true); end $$;

do $$
declare
  v_org    uuid := '00000000-0000-4000-8000-000000000001';
  v_client uuid := '00000000-0000-4000-8000-0000000000c1';
  v_owner  uuid := '00000000-0000-4000-8000-0000000000a1';
  v_fin    uuid := '00000000-0000-4000-8000-0000000000a2';
  v_staff  uuid := '00000000-0000-4000-8000-0000000000a5';
  v_mgr_a  uuid := '00000000-0000-4000-8000-0000000000c7';
  v_mgr_b  uuid := '00000000-0000-4000-8000-0000000000c8';
  v_kitchen_a uuid;
  v_kitchen_b uuid;
  n int; r record; ok boolean; v_total numeric;
begin
  -- Two kitchens, a manager each.
  insert into public.sites (organisation_id, client_id, name, site_type, status)
  values (v_org, v_client, 'TEST Kitchen A', 'kitchen', 'operating') returning id into v_kitchen_a;
  insert into public.sites (organisation_id, client_id, name, site_type, status)
  values (v_org, v_client, 'TEST Kitchen B', 'kitchen', 'operating') returning id into v_kitchen_b;

  insert into auth.users (id, email) values (v_mgr_a, 'mgr-a@example.com'), (v_mgr_b, 'mgr-b@example.com')
  on conflict (id) do nothing;
  insert into public.organisation_members (organisation_id, user_id, role, accepted_at)
  values (v_org, v_mgr_a, 'project_manager', now()), (v_org, v_mgr_b, 'project_manager', now())
  on conflict do nothing;
  insert into public.site_assignments (organisation_id, site_id, user_id, role)
  values (v_org, v_kitchen_a, v_mgr_a, 'manager'), (v_org, v_kitchen_b, v_mgr_b, 'manager');

  -- ---------- a manager records their own day -------------------------------
  perform test_as(v_mgr_a);
  perform public.record_daily_sales(v_kitchen_a, current_date - 1, 412.50, 980.00, 120.00, 214, 'Busy Friday');
  perform test_reset();

  select total into v_total from public.daily_sales where site_id = v_kitchen_a and sale_date = current_date - 1;
  if v_total <> 1512.50 then raise exception 'total wrong: %', v_total; end if;

  -- Saving again replaces the day rather than adding a second row.
  perform test_as(v_mgr_a);
  perform public.record_daily_sales(v_kitchen_a, current_date - 1, 400.00, 980.00, 120.00, 214, null);
  perform test_reset();
  select count(*) into n from public.daily_sales where site_id = v_kitchen_a and sale_date = current_date - 1;
  if n <> 1 then raise exception 'duplicate day created (%)', n; end if;

  -- ---------- and cannot record, or even see, another kitchen's -------------
  perform test_as(v_mgr_b);
  ok := false;
  begin
    perform public.record_daily_sales(v_kitchen_a, current_date - 1, 1.00, 0, 0, null, null);
    ok := true;
  exception when insufficient_privilege then null;
  end;
  if ok then raise exception 'a manager recorded takings for a kitchen they do not run'; end if;

  select count(*) into n from public.daily_sales where site_id = v_kitchen_a;
  if n <> 0 then raise exception 'a manager can read another kitchen''s takings (% rows)', n; end if;
  perform test_reset();

  -- ---------- staff see no money whatsoever ---------------------------------
  perform test_as(v_staff);
  select count(*) into n from public.daily_sales;
  if n <> 0 then raise exception 'staff can see takings (% rows)', n; end if;
  ok := false;
  begin
    perform public.record_daily_sales(v_kitchen_a, current_date - 1, 5.00, 0, 0, null, null);
    ok := true;
  exception when insufficient_privilege then null;
  end;
  if ok then raise exception 'staff recorded takings'; end if;
  perform test_reset();

  -- ---------- a day that has not happened -----------------------------------
  perform test_as(v_mgr_a);
  ok := false;
  begin
    perform public.record_daily_sales(v_kitchen_a, current_date + 1, 100.00, 0, 0, null, null);
    ok := true;
  exception when check_violation then null;
  end;
  if ok then raise exception 'tomorrow''s takings were accepted'; end if;
  perform test_reset();

  -- ---------- finance signs off, and the figure stops moving ----------------
  perform test_as(v_mgr_a);
  ok := false;
  begin
    perform public.confirm_daily_sales(v_kitchen_a, current_date - 1);
    ok := true;
  exception when insufficient_privilege then null;
  end;
  if ok then raise exception 'a manager signed off their own takings'; end if;
  perform test_reset();

  perform test_as(v_fin);
  perform public.confirm_daily_sales(v_kitchen_a, current_date - 1);
  perform test_reset();
  if (select confirmed_at from public.daily_sales where site_id = v_kitchen_a and sale_date = current_date - 1) is null then
    raise exception 'sign-off not recorded';
  end if;

  perform test_as(v_mgr_a);
  ok := false;
  begin
    perform public.record_daily_sales(v_kitchen_a, current_date - 1, 9999.00, 0, 0, null, null);
    ok := true;
  exception when check_violation then null;
  end;
  if ok then raise exception 'a signed-off day was edited by a manager'; end if;
  perform test_reset();

  -- Finance can still correct it.
  perform test_as(v_fin);
  perform public.record_daily_sales(v_kitchen_a, current_date - 1, 401.00, 980.00, 120.00, 214, 'Corrected');
  perform test_reset();
  if (select cash from public.daily_sales where site_id = v_kitchen_a and sale_date = current_date - 1) <> 401.00 then
    raise exception 'finance could not correct a signed-off day';
  end if;

  -- ---------- budgets: managers read, only finance writes -------------------
  perform test_as(v_fin);
  insert into public.site_budgets (organisation_id, site_id, month, food_budget, labour_budget, other_budget, approved_by_client)
  values (v_org, v_kitchen_a, date_trunc('month', current_date)::date, 4000, 6000, 500, true);
  perform test_reset();

  perform test_as(v_mgr_a);
  select count(*) into n from public.site_budgets where site_id = v_kitchen_a;
  if n <> 1 then raise exception 'a manager cannot see their own budget'; end if;
  ok := false;
  begin
    insert into public.site_budgets (organisation_id, site_id, month, food_budget)
    values (v_org, v_kitchen_a, (date_trunc('month', current_date) + interval '1 month')::date, 1);
    ok := true;
  exception when insufficient_privilege then null;
  end;
  if ok then raise exception 'a manager set their own budget'; end if;
  perform test_reset();

  -- ---------- the P&L answers differently per caller ------------------------
  -- Same function, different rows, because it runs as the caller.
  perform test_as(v_mgr_a);
  select count(*) into n from public.report_site_pl(v_org, current_date - 30, current_date);
  if n < 1 then raise exception 'manager sees no P&L at all'; end if;
  select count(*) into n from public.report_site_pl(v_org, current_date - 30, current_date) where revenue > 0;
  if n <> 1 then raise exception 'manager sees % kitchens with revenue, expected 1', n; end if;
  perform test_reset();

  perform test_as(v_owner);
  select revenue into v_total from public.report_site_pl(v_org, current_date - 30, current_date) where site_id = v_kitchen_a;
  if v_total <> 1501.00 then raise exception 'owner P&L revenue wrong: %', v_total; end if;
  perform test_reset();

  -- A kitchen with no entry is reported as missing, not as a zero day.
  select count(*) into n from public.sites_missing_sales(v_org, current_date - 1) where site_id = v_kitchen_b;
  if n <> 1 then raise exception 'kitchen B not flagged as missing'; end if;

  -- ---------- profile email follows the login -------------------------------
  update auth.users set email = 'changed@example.com' where id = v_mgr_b;
  if (select email from public.profiles where id = v_mgr_b) <> 'changed@example.com' then
    raise exception 'profile email did not follow the login';
  end if;

  -- Clean up.
  delete from public.site_budgets where site_id in (v_kitchen_a, v_kitchen_b);
  delete from public.daily_sales where site_id in (v_kitchen_a, v_kitchen_b);
  delete from public.site_assignments where user_id in (v_mgr_a, v_mgr_b);
  delete from public.organisation_members where user_id in (v_mgr_a, v_mgr_b);
  delete from public.sites where id in (v_kitchen_a, v_kitchen_b);
  delete from auth.users where id in (v_mgr_a, v_mgr_b);

  raise notice 'trading: ok';
end $$;

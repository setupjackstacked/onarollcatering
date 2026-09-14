-- Phase 7: estimates rollup, expense status guard, financial view, PM scoping.
create or replace function test_as(user_id uuid) returns void language plpgsql as $$
begin perform set_config('request.jwt.claim.sub', user_id::text, true); perform set_config('request.jwt.claim.role', 'authenticated', true); perform set_config('role', 'authenticated', true); end $$;
create or replace function test_reset() returns void language plpgsql as $$
begin perform set_config('role', 'postgres', true); perform set_config('request.jwt.claim.sub', '', true); end $$;

do $$
declare v_e uuid; r record; n int; v_proj uuid := '00000000-0000-4000-8000-000000000101'; v_org uuid := '00000000-0000-4000-8000-000000000001';
begin
  -- PM (owns the sample project) sets category estimates → projects.estimated_cost follows
  perform test_as('00000000-0000-4000-8000-0000000000a3');
  insert into public.project_cost_estimates (organisation_id, project_id, category, amount) values (v_org, v_proj, 'labour', 50000), (v_org, v_proj, 'food', 30000);
  if (select estimated_cost from public.projects where id = v_proj) <> 80000 then raise exception 'estimate rollup failed'; end if;

  -- PM raises a pending expense; cannot mark it actual
  insert into public.expenses (organisation_id, project_id, category, description, net, vat, created_by)
  values (v_org, v_proj, 'food', 'TEST food delivery', 1000, 200, '00000000-0000-4000-8000-0000000000a3') returning id into v_e;
  if (select gross from public.expenses where id = v_e) <> 1200 then raise exception 'gross not computed'; end if;
  begin
    update public.expenses set status = 'actual' where id = v_e;
    raise exception 'PM approved an expense';
  exception when insufficient_privilege then null; end;

  -- finance approves as actual; committed PO recorded
  perform test_as('00000000-0000-4000-8000-0000000000a2');
  update public.expenses set status = 'actual' where id = v_e;
  if (select approved_by from public.expenses where id = v_e) <> '00000000-0000-4000-8000-0000000000a2' then raise exception 'approved_by not set'; end if;
  insert into public.expenses (organisation_id, project_id, category, description, net, vat, status, created_by)
  values (v_org, v_proj, 'equipment', 'TEST PO fridge', 2500, 500, 'committed', '00000000-0000-4000-8000-0000000000a2');

  select * into r from public.project_financials where project_id = v_proj;
  if r.actual_cost <> 1000 then raise exception 'actual % <> 1000', r.actual_cost; end if;
  if r.committed_cost <> 2500 then raise exception 'committed % <> 2500', r.committed_cost; end if;
  if r.forecast_gross_profit <> 185000 - 3500 then raise exception 'forecast gp % wrong', r.forecast_gross_profit; end if;

  -- breakdown function
  select count(*) into n from public.project_cost_breakdown(v_proj) where (category = 'food' and actual = 1000) or (category = 'labour' and estimated = 50000);
  if n <> 2 then raise exception 'breakdown wrong (%)', n; end if;

  -- read_only cannot insert
  perform test_as('00000000-0000-4000-8000-0000000000a4');
  begin
    insert into public.expenses (organisation_id, project_id, category, description, net, created_by) values (v_org, v_proj, 'other', 'x', 1, '00000000-0000-4000-8000-0000000000a4');
    raise exception 'read_only inserted expense';
  exception when insufficient_privilege then null; end;
  select count(*) into n from public.expenses where project_id = v_proj; if n < 2 then raise exception 'read_only cannot see expenses'; end if;

  perform test_reset();
  delete from public.expenses where description like 'TEST %';
  delete from public.project_cost_estimates where project_id = v_proj;
  if (select estimated_cost from public.projects where id = v_proj) <> 0 then raise exception 'rollup after delete failed'; end if;
  update public.projects set estimated_cost = 142000 where id = v_proj;
  raise notice 'PASS costing';
end $$;
drop function test_as(uuid); drop function test_reset();

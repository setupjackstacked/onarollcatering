-- Phase 10: suppliers, equipment catalogue publishing, spend, RLS.
create or replace function test_as(user_id uuid) returns void language plpgsql as $$
begin perform set_config('request.jwt.claim.sub', user_id::text, true); perform set_config('request.jwt.claim.role', 'authenticated', true); perform set_config('role', 'authenticated', true); end $$;
create or replace function test_reset() returns void language plpgsql as $$
begin perform set_config('role', 'postgres', true); perform set_config('request.jwt.claim.sub', '', true); end $$;

do $$
declare
  v_org uuid := '00000000-0000-4000-8000-000000000001';
  v_proj uuid := '00000000-0000-4000-8000-000000000101';
  v_fin uuid := '00000000-0000-4000-8000-0000000000a2';
  v_pm uuid := '00000000-0000-4000-8000-0000000000a3';
  v_sup uuid; v_eq uuid; v_cat uuid; n int; r record;
begin
  perform test_as(v_fin);
  insert into public.suppliers (organisation_id, name, category, email, payment_terms_days, created_by)
  values (v_org, 'TEST Fabrication Ltd', 'fabrication', 'sales@example.com', 45, v_fin) returning id into v_sup;
  insert into public.supplier_contacts (organisation_id, supplier_id, first_name, last_name, email, is_primary)
  values (v_org, v_sup, 'Test', 'Contact', 'contact@example.com', true);

  insert into public.equipment (organisation_id, name, supplier_id, supplier_sku, specification, cost_price, sell_price, vat_rate_key, created_by)
  values (v_org, 'TEST 6-burner range', v_sup, 'SKU-123', '900mm, natural gas', 2400.00, 3600.00, 'standard', v_fin) returning id into v_eq;

  -- publishing creates a catalogue item usable from quotations
  v_cat := public.publish_equipment_to_catalogue(v_eq);
  select * into r from public.catalogue_items where id = v_cat;
  if r.equipment_id <> v_eq then raise exception 'catalogue item not linked'; end if;
  if r.sell_price <> 3600.00 or r.category <> 'equipment' then raise exception 'catalogue prices wrong'; end if;

  -- republishing updates rather than duplicating
  update public.equipment set sell_price = 3750.00 where id = v_eq;
  if public.publish_equipment_to_catalogue(v_eq) <> v_cat then raise exception 'republish duplicated'; end if;
  select count(*) into n from public.catalogue_items where equipment_id = v_eq; if n <> 1 then raise exception 'duplicate catalogue items'; end if;
  if (select sell_price from public.catalogue_items where id = v_cat) <> 3750.00 then raise exception 'price not refreshed'; end if;

  -- deactivating equipment removes it from the quote picker
  update public.equipment set active = false where id = v_eq;
  if (select active from public.catalogue_items where id = v_cat) then raise exception 'catalogue item still active'; end if;
  update public.equipment set active = true where id = v_eq;

  -- supplier spend from expenses
  insert into public.expenses (organisation_id, project_id, supplier_id, category, description, net, vat, status, created_by)
  values (v_org, v_proj, v_sup, 'equipment', 'TEST range purchase', 2400.00, 480.00, 'actual', v_fin),
         (v_org, v_proj, v_sup, 'equipment', 'TEST extraction PO', 5000.00, 1000.00, 'committed', v_fin);
  select * into r from public.supplier_spend(v_sup);
  if r.actual <> 2400.00 or r.committed <> 5000.00 or r.expense_count <> 2 then raise exception 'supplier spend wrong'; end if;

  -- PMs can read suppliers and equipment but not change them
  perform test_as(v_pm);
  select count(*) into n from public.suppliers where id = v_sup; if n <> 1 then raise exception 'PM cannot read suppliers'; end if;
  begin
    update public.equipment set sell_price = 1 where id = v_eq;
    if (select sell_price from public.equipment where id = v_eq) = 1 then raise exception 'PM edited equipment'; end if;
  exception when insufficient_privilege then null; end;

  perform test_reset();
  delete from public.expenses where description like 'TEST %';
  delete from public.catalogue_items where equipment_id = v_eq;
  delete from public.equipment where id = v_eq;
  delete from public.suppliers where id = v_sup;
  raise notice 'PASS suppliers + equipment';
end $$;
drop function test_as(uuid); drop function test_reset();

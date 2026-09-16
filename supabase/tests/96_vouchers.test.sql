-- Vouchers: one entry per site per day, staff can log, managers confirm and lock.
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
  v_mgr uuid := '00000000-0000-4000-8000-0000000000a3';
  v_staff uuid := '00000000-0000-4000-8000-0000000000a5';
  v_site uuid; v_entry uuid; v_vouchers uuid; v_free uuid; n int; r record; total bigint;
begin
  perform test_reset();
  insert into public.sites (organisation_id, client_id, name, site_type, status, oar_manager_id)
  values (v_org, v_client, 'TEST Voucher Kitchen', 'kitchen', 'operating', v_mgr) returning id into v_site;
  insert into public.site_assignments (organisation_id, site_id, user_id, employee_id, role, is_primary)
  values (v_org, v_site, v_staff, v_emp, 'staff', true);

  select id into v_vouchers from public.voucher_categories where organisation_id = v_org and key = 'vouchers';
  select id into v_free     from public.voucher_categories where organisation_id = v_org and key = 'free-meals';
  if v_vouchers is null or v_free is null then raise exception 'voucher categories not seeded'; end if;

  -- staff at the site log the day
  perform test_as(v_staff);
  v_entry := public.record_vouchers(v_site, current_date,
    jsonb_build_array(jsonb_build_object('category_id', v_vouchers, 'quantity', 120),
                      jsonb_build_object('category_id', v_free, 'quantity', 8)), 'TEST busy lunch');
  if (select total_quantity from public.voucher_entries where id = v_entry) <> 128 then
    raise exception 'header total not rolled up (%)', (select total_quantity from public.voucher_entries where id = v_entry);
  end if;

  -- logging again the same day updates rather than duplicating
  if public.record_vouchers(v_site, current_date,
       jsonb_build_array(jsonb_build_object('category_id', v_vouchers, 'quantity', 135))) <> v_entry then
    raise exception 'second submission created a new entry';
  end if;
  select count(*) into n from public.voucher_entries where site_id = v_site and entry_date = current_date;
  if n <> 1 then raise exception 'duplicate entry for the day (%)', n; end if;
  -- the omitted category is cleared, not left stale
  select count(*) into n from public.voucher_entry_lines where entry_id = v_entry;
  if n <> 1 then raise exception 'omitted category not cleared (% lines)', n; end if;
  if (select total_quantity from public.voucher_entries where id = v_entry) <> 135 then raise exception 'total not updated'; end if;

  -- future dates refused
  begin
    perform public.record_vouchers(v_site, current_date + 1, jsonb_build_array(jsonb_build_object('category_id', v_vouchers, 'quantity', 1)));
    raise exception 'logged vouchers for tomorrow';
  exception when check_violation then null; end;

  -- someone with no connection to the site cannot log against it
  perform test_as('00000000-0000-4000-8000-0000000000a4');   -- read_only
  begin
    perform public.record_vouchers(v_site, current_date, jsonb_build_array(jsonb_build_object('category_id', v_vouchers, 'quantity', 999)));
    raise exception 'read_only logged vouchers';
  exception when insufficient_privilege then null; end;

  -- the manager confirms the day, which locks it against further staff edits
  perform test_as(v_mgr);
  perform public.confirm_vouchers(v_entry);
  if (select confirmed_by from public.voucher_entries where id = v_entry) <> v_mgr then raise exception 'confirmation not stamped'; end if;

  perform test_as(v_staff);
  begin
    perform public.record_vouchers(v_site, current_date, jsonb_build_array(jsonb_build_object('category_id', v_vouchers, 'quantity', 5)));
    raise exception 'staff edited a confirmed day';
  exception when insufficient_privilege then null; end;

  -- the manager can still correct it
  perform test_as(v_mgr);
  perform public.record_vouchers(v_site, current_date, jsonb_build_array(jsonb_build_object('category_id', v_vouchers, 'quantity', 140)));
  if (select total_quantity from public.voucher_entries where id = v_entry) <> 140 then raise exception 'manager correction did not apply'; end if;

  -- reporting rolls up, and flags what is chargeable
  perform test_as(v_owner);
  select sum(quantity) into total from public.report_vouchers(v_org, current_date - 7, current_date, 'day', v_site);
  if total <> 140 then raise exception 'report total % <> 140', total; end if;
  select count(*) into n from public.report_vouchers(v_org, current_date - 7, current_date, 'month');
  if n < 1 then raise exception 'monthly grain returned nothing'; end if;

  -- and the site no longer counts as missing today
  select count(*) into n from public.sites_missing_vouchers(v_org, current_date) where site_id = v_site;
  if n <> 0 then raise exception 'site still listed as missing its submission'; end if;
  select count(*) into n from public.sites_missing_vouchers(v_org, current_date - 1) where site_id = v_site;
  if n <> 1 then raise exception 'yesterday should be missing'; end if;

  perform test_reset();
  delete from public.sites where id = v_site;
  raise notice 'PASS vouchers';
end $$;
drop function test_as(uuid); drop function test_reset();

-- Sick documentation: required on every sick absence, flagged until received.
create or replace function test_as(user_id uuid) returns void language plpgsql as $$
begin perform set_config('request.jwt.claim.sub', user_id::text, true); perform set_config('request.jwt.claim.role', 'authenticated', true); perform set_config('role', 'authenticated', true); end $$;
create or replace function test_reset() returns void language plpgsql as $$
begin perform set_config('role', 'postgres', true); perform set_config('request.jwt.claim.sub', '', true); end $$;

do $$
declare
  v_org uuid := '00000000-0000-4000-8000-000000000001';
  v_emp uuid := '00000000-0000-4000-8000-000000000201';
  v_staff uuid := '00000000-0000-4000-8000-0000000000a5';
  v_owner uuid := '00000000-0000-4000-8000-0000000000a1';
  v_sick uuid; v_holiday uuid; v_doc uuid; v_other_doc uuid; n int;
begin
  perform test_as(v_staff);
  insert into public.leave_requests (organisation_id, employee_id, leave_type, start_date, end_date, days, reason)
  values (v_org, v_emp, 'sick', current_date, current_date + 1, 2, 'TEST flu') returning id into v_sick;
  if not (select document_required from public.leave_requests where id = v_sick) then
    raise exception 'sick absence not flagged as needing a note';
  end if;

  insert into public.leave_requests (organisation_id, employee_id, leave_type, start_date, end_date, days)
  values (v_org, v_emp, 'holiday', current_date + 40, current_date + 41, 2) returning id into v_holiday;
  if (select document_required from public.leave_requests where id = v_holiday) then
    raise exception 'holiday should not need a note';
  end if;

  -- it shows as outstanding until the note lands
  perform test_as(v_owner);
  select count(*) into n from public.leave_missing_documents(v_org) where leave_id = v_sick;
  if n <> 1 then raise exception 'missing-note report did not list the absence'; end if;

  -- attach a note filed against the right employee
  perform test_reset();
  insert into public.documents (organisation_id, entity_type, entity_id, category_key, name, mime_type, size_bytes, bucket, storage_path)
  values (v_org, 'employee', v_emp, 'sick-note', 'TEST note.pdf', 'application/pdf', 1000, 'employee-documents', 'test/sick-note.pdf')
  returning id into v_doc;
  -- and one belonging to somebody else
  insert into public.employees (id, organisation_id, employee_number, first_name, last_name, role_key)
  values (gen_random_uuid(), v_org, '', 'TEST', 'Other', 'chef');
  insert into public.documents (organisation_id, entity_type, entity_id, category_key, name, mime_type, size_bytes, bucket, storage_path)
  values (v_org, 'employee', (select id from public.employees where last_name = 'Other' limit 1), 'sick-note', 'TEST other.pdf', 'application/pdf', 1000, 'employee-documents', 'test/other-note.pdf')
  returning id into v_other_doc;

  perform test_as(v_staff);
  begin
    perform public.attach_leave_document(v_sick, v_other_doc);
    raise exception 'attached someone else''s note';
  exception when insufficient_privilege then null; end;

  perform public.attach_leave_document(v_sick, v_doc);
  if (select document_id from public.leave_requests where id = v_sick) <> v_doc then raise exception 'note not attached'; end if;
  if (select document_received_at from public.leave_requests where id = v_sick) is null then raise exception 'receipt time not stamped'; end if;

  perform test_as(v_owner);
  select count(*) into n from public.leave_missing_documents(v_org) where leave_id = v_sick;
  if n <> 0 then raise exception 'absence still listed as missing its note'; end if;

  perform test_reset();
  delete from public.leave_requests where id in (v_sick, v_holiday);
  delete from public.documents where id in (v_doc, v_other_doc);
  delete from public.employees where last_name = 'Other';
  raise notice 'PASS sick documentation';
end $$;
drop function test_as(uuid); drop function test_reset();

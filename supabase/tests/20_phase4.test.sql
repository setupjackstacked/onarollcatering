-- Phase 4: conversion functions, tasks and notes RLS.
create or replace function test_as(user_id uuid) returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claim.sub', user_id::text, true);
  perform set_config('request.jwt.claim.role', 'authenticated', true);
  perform set_config('role', 'authenticated', true);
end $$;
create or replace function test_reset() returns void language plpgsql as $$
begin perform set_config('role', 'postgres', true); perform set_config('request.jwt.claim.sub', '', true); end $$;

do $$
declare v_enq uuid; v_lead uuid; v_client uuid; v_proj uuid; n int;
begin
  perform test_reset();
  insert into public.enquiries (organisation_id, company_name, contact_name, job_title, email, phone, project_name, location, description, services, attachments)
  values ('00000000-0000-4000-8000-000000000001', 'TEST Convert Ltd', 'Sam Tester', 'Ops', 'sam@convert.test', '0123', 'TEST Canteen', 'Hull', 'desc', '{commercial-catering}',
          '[{"name":"plan.pdf","path":"sess/plan.pdf","size":10,"mime":"application/pdf"}]'::jsonb)
  returning id into v_enq;

  -- read_only cannot convert
  perform test_as('00000000-0000-4000-8000-0000000000a4');
  begin
    perform public.convert_enquiry_to_lead(v_enq);
    raise exception 'read_only converted an enquiry';
  exception when insufficient_privilege then null; end;

  -- finance converts
  perform test_as('00000000-0000-4000-8000-0000000000a2');
  v_lead := public.convert_enquiry_to_lead(v_enq, '00000000-0000-4000-8000-0000000000a2');
  select client_id into v_client from public.leads where id = v_lead;
  if v_client is null then raise exception 'lead has no client'; end if;
  if (select count(*) from public.client_contacts where client_id = v_client and email = 'sam@convert.test') <> 1 then raise exception 'contact not created'; end if;
  if (select status from public.enquiries where id = v_enq) <> 'converted' then raise exception 'enquiry not marked converted'; end if;
  if (select count(*) from public.documents where entity_type = 'lead' and entity_id = v_lead) <> 1 then raise exception 'attachment not carried'; end if;
  -- idempotent
  if public.convert_enquiry_to_lead(v_enq) <> v_lead then raise exception 'second conversion created a new lead'; end if;
  -- dedupe: second enquiry from same company links same client
  perform test_reset();
  insert into public.enquiries (organisation_id, company_name, contact_name, email, phone, project_name, location, description, services)
  values ('00000000-0000-4000-8000-000000000001', 'test convert ltd', 'Other Person', 'other@convert.test', '0123', 'TEST Second', 'Hull', 'desc', '{}') returning id into v_enq;
  perform test_as('00000000-0000-4000-8000-0000000000a2');
  perform public.convert_enquiry_to_lead(v_enq);
  if (select count(*) from public.clients where lower(name) = 'test convert ltd') <> 1 then raise exception 'client duplicated'; end if;

  -- finance cannot convert lead → project (owner/admin only); owner can
  begin
    perform public.convert_lead_to_project(v_lead);
    raise exception 'finance converted lead to project';
  exception when insufficient_privilege then null; end;
  perform test_as('00000000-0000-4000-8000-0000000000a1');
  v_proj := public.convert_lead_to_project(v_lead, 'TEST Canteen project', null, '00000000-0000-4000-8000-0000000000a3', 50000.00, current_date);
  if (select status from public.leads where id = v_lead) <> 'won' then raise exception 'lead not won'; end if;
  if (select count(*) from public.documents where entity_type = 'project' and entity_id = v_proj) <> 1 then raise exception 'documents not moved'; end if;
  if (select project_number from public.projects where id = v_proj) !~ '^OAR-P-' then raise exception 'no project number'; end if;

  -- tasks: PM sees tasks on assigned project, not others; assignee sees own
  perform test_reset();
  insert into public.tasks (organisation_id, project_id, title, assignee_user_id) values
    ('00000000-0000-4000-8000-000000000001', v_proj, 'TEST pm task', null),
    ('00000000-0000-4000-8000-000000000001', null, 'TEST org task for readonly', '00000000-0000-4000-8000-0000000000a4'),
    ('00000000-0000-4000-8000-000000000001', null, 'TEST org task unassigned', null);
  perform test_as('00000000-0000-4000-8000-0000000000a3');
  select count(*) into n from public.tasks where title = 'TEST pm task'; if n <> 1 then raise exception 'PM cannot see project task'; end if;
  perform test_as('00000000-0000-4000-8000-0000000000a4');
  select count(*) into n from public.tasks where title like 'TEST%'; if n <> 3 then raise exception 'read_only should see org tasks (%)', n; end if;
  update public.tasks set status = 'complete' where title = 'TEST org task for readonly';
  get diagnostics n = row_count; if n <> 1 then raise exception 'assignee cannot complete own task'; end if;
  update public.tasks set status = 'complete' where title = 'TEST org task unassigned';
  get diagnostics n = row_count; if n <> 0 then raise exception 'read_only updated a task not theirs'; end if;

  -- notes: author edits own, read_only cannot create
  perform test_as('00000000-0000-4000-8000-0000000000a2');
  insert into public.notes (organisation_id, entity_type, entity_id, body, created_by)
  values ('00000000-0000-4000-8000-000000000001', 'client', v_client, 'TEST note', '00000000-0000-4000-8000-0000000000a2');
  perform test_as('00000000-0000-4000-8000-0000000000a4');
  begin
    insert into public.notes (organisation_id, entity_type, entity_id, body, created_by)
    values ('00000000-0000-4000-8000-000000000001', 'client', v_client, 'x', '00000000-0000-4000-8000-0000000000a4');
    raise exception 'read_only created a note';
  exception when insufficient_privilege then null; end;
  select count(*) into n from public.notes where body = 'TEST note'; if n <> 1 then raise exception 'read_only cannot read note'; end if;

  -- org B still isolated
  perform test_as('00000000-0000-4000-8000-0000000000b1');
  select count(*) into n from public.tasks; if n <> 0 then raise exception 'org B sees tasks'; end if;
  select count(*) into n from public.notes; if n <> 0 then raise exception 'org B sees notes'; end if;
  select count(*) into n from public.organisation_member_profiles; if n <> 1 then raise exception 'org B sees other members (%)', n; end if;

  perform test_reset();
  raise notice 'PASS phase 4';
end $$;
drop function test_as(uuid); drop function test_reset();

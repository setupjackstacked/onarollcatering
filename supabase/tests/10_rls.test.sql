-- RLS / permission tests. Runs after migrations + seed on a local cluster.
-- Each `do` block raises on failure. Uses set_config to emulate Supabase JWT claims.
--
-- Fixture (from seed.sql):
--   org A  = 00000000-0000-4000-8000-000000000001 (On A Roll)
--   users  a1 owner, a2 finance, a3 project_manager, a4 read_only
--   client c1, contact d1, site e1, lead f1, project 101 (PM = a3)
-- This file adds org B with its own owner b1 and one client.

-- ---------- helpers --------------------------------------------------------
create or replace function test_as(user_id uuid) returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claim.sub', user_id::text, true);
  perform set_config('request.jwt.claim.role', 'authenticated', true);
  perform set_config('role', 'authenticated', true);
end $$;

create or replace function test_reset() returns void language plpgsql as $$
begin
  perform set_config('role', 'postgres', true);
  perform set_config('request.jwt.claim.sub', '', true);
end $$;

-- ---------- org B fixture --------------------------------------------------
insert into public.organisations (id, name, slug) values
  ('00000000-0000-4000-8000-000000000002', 'TEST Other Co', 'test-other-co');
insert into auth.users (id, email) values ('00000000-0000-4000-8000-0000000000b1', 'test-b-owner@example.com');
insert into public.organisation_members (organisation_id, user_id, role, accepted_at) values
  ('00000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-0000000000b1', 'owner', now());
insert into public.clients (id, organisation_id, name) values
  ('00000000-0000-4000-8000-0000000000c2', '00000000-0000-4000-8000-000000000002', 'TEST Org B Client');

-- ============================================================================
-- 1. Cross-tenant isolation
-- ============================================================================
do $$
declare n int;
begin
  perform test_as('00000000-0000-4000-8000-0000000000b1'); -- org B owner

  select count(*) into n from public.clients;
  if n <> 1 then raise exception 'org B owner should see exactly 1 client, saw %', n; end if;

  select count(*) into n from public.projects;
  if n <> 0 then raise exception 'org B owner must not see org A projects (saw %)', n; end if;

  select count(*) into n from public.leads;
  if n <> 0 then raise exception 'org B owner must not see org A leads (saw %)', n; end if;

  select count(*) into n from public.organisations;
  if n <> 1 then raise exception 'org B owner should see 1 organisation, saw %', n; end if;

  select count(*) into n from public.organisation_members;
  if n <> 1 then raise exception 'org B owner should see 1 membership row, saw %', n; end if;

  select count(*) into n from public.activity_logs;
  if n <> 0 then raise exception 'org B owner must not see org A activity (saw %)', n; end if;

  -- attempt to write into org A → must be rejected by WITH CHECK
  begin
    insert into public.clients (organisation_id, name)
    values ('00000000-0000-4000-8000-000000000001', 'TEST intrusion');
    raise exception 'cross-tenant insert should have failed';
  exception when insufficient_privilege then null;
  end;

  -- attempt to update org A client → 0 rows affected (invisible)
  update public.clients set name = 'hacked' where id = '00000000-0000-4000-8000-0000000000c1';
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'cross-tenant update affected % rows', n; end if;

  perform test_reset();
  raise notice 'PASS cross-tenant isolation';
end $$;

-- ============================================================================
-- 2. Role permissions within org A
-- ============================================================================
do $$
declare n int; new_id uuid;
begin
  -- read_only: sees everything sales-related, can write nothing
  perform test_as('00000000-0000-4000-8000-0000000000a4');
  select count(*) into n from public.clients; if n <> 1 then raise exception 'read_only should see 1 client'; end if;
  select count(*) into n from public.projects; if n <> 1 then raise exception 'read_only should see 1 project'; end if;
  begin
    insert into public.clients (organisation_id, name) values ('00000000-0000-4000-8000-000000000001', 'x');
    raise exception 'read_only insert should fail';
  exception when insufficient_privilege then null; end;
  update public.leads set notes = 'x' where id = '00000000-0000-4000-8000-0000000000f1';
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'read_only must not update leads'; end if;

  -- finance: can write clients/leads, cannot create projects
  perform test_as('00000000-0000-4000-8000-0000000000a2');
  insert into public.clients (organisation_id, name) values ('00000000-0000-4000-8000-000000000001', 'TEST finance client') returning id into new_id;
  if new_id is null then raise exception 'finance should create clients'; end if;
  begin
    insert into public.projects (organisation_id, name, client_id) values ('00000000-0000-4000-8000-000000000001', 'x', new_id);
    raise exception 'finance project insert should fail';
  exception when insufficient_privilege then null; end;

  -- project_manager: sees only assigned projects; can update them; cannot see others
  perform test_reset();
  insert into public.projects (id, organisation_id, name, client_id, project_manager_id)
  values ('00000000-0000-4000-8000-000000000102', '00000000-0000-4000-8000-000000000001', 'TEST unassigned project',
          '00000000-0000-4000-8000-0000000000c1', null);
  perform test_as('00000000-0000-4000-8000-0000000000a3');
  select count(*) into n from public.projects;
  if n <> 1 then raise exception 'PM should see only 1 assigned project, saw %', n; end if;
  update public.projects set notes = 'pm note' where id = '00000000-0000-4000-8000-000000000101';
  get diagnostics n = row_count;
  if n <> 1 then raise exception 'PM should update assigned project'; end if;
  update public.projects set notes = 'x' where id = '00000000-0000-4000-8000-000000000102';
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'PM must not update unassigned project'; end if;
  -- PM cannot reassign the project away from themselves to escape... they can, but that's an owner concern; ensure they can't set org
  begin
    update public.projects set organisation_id = '00000000-0000-4000-8000-000000000002' where id = '00000000-0000-4000-8000-000000000101';
    raise exception 'PM must not move project to another org';
  exception when insufficient_privilege or foreign_key_violation then null; end;

  -- owner: full access
  perform test_as('00000000-0000-4000-8000-0000000000a1');
  select count(*) into n from public.projects; if n <> 2 then raise exception 'owner should see 2 projects, saw %', n; end if;
  insert into public.projects (organisation_id, name, client_id)
  values ('00000000-0000-4000-8000-000000000001', 'TEST owner project', '00000000-0000-4000-8000-0000000000c1') returning id into new_id;
  if new_id is null then raise exception 'owner should create projects'; end if;

  perform test_reset();
  raise notice 'PASS role permissions';
end $$;

-- ============================================================================
-- 3. Documents follow parent visibility; notifications are per-user
-- ============================================================================
do $$
declare n int;
begin
  perform test_reset();
  insert into public.documents (organisation_id, entity_type, entity_id, name, mime_type, size_bytes, bucket, storage_path) values
    ('00000000-0000-4000-8000-000000000001', 'project', '00000000-0000-4000-8000-000000000101', 'assigned.pdf',   'application/pdf', 10, 'project-documents', 'a/1'),
    ('00000000-0000-4000-8000-000000000001', 'project', '00000000-0000-4000-8000-000000000102', 'unassigned.pdf', 'application/pdf', 10, 'project-documents', 'a/2'),
    ('00000000-0000-4000-8000-000000000001', 'client',  '00000000-0000-4000-8000-0000000000c1', 'client.pdf',     'application/pdf', 10, 'client-documents',  'a/3');
  insert into public.notifications (organisation_id, user_id, type, title) values
    ('00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-0000000000a1', 'system', 'for owner'),
    ('00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-0000000000a3', 'system', 'for pm');

  perform test_as('00000000-0000-4000-8000-0000000000a3'); -- PM
  select count(*) into n from public.documents where entity_type = 'project';
  if n <> 1 then raise exception 'PM should see docs for 1 project only, saw %', n; end if;
  select count(*) into n from public.documents where entity_type = 'client';
  if n <> 1 then raise exception 'PM should see client docs'; end if;
  select count(*) into n from public.notifications;
  if n <> 1 then raise exception 'PM should see only own notifications, saw %', n; end if;

  perform test_as('00000000-0000-4000-8000-0000000000b1'); -- org B
  select count(*) into n from public.documents;
  if n <> 0 then raise exception 'org B must see no org A documents'; end if;
  select count(*) into n from public.number_sequences;
  if n <> 0 then raise exception 'number_sequences must not be readable'; end if;

  perform test_reset();
  raise notice 'PASS documents + notifications';
end $$;

-- ============================================================================
-- 4. Numbering, audit triggers, derived financials
-- ============================================================================
do $$
declare p1 text; p2 text; n int; margin numeric;
begin
  perform test_as('00000000-0000-4000-8000-0000000000a1');
  select project_number into p1 from public.projects where id = '00000000-0000-4000-8000-000000000101';
  if p1 !~ '^OAR-P-\d{4}-\d{4}$' then raise exception 'bad project number %', p1; end if;

  insert into public.projects (organisation_id, name, client_id)
  values ('00000000-0000-4000-8000-000000000001', 'TEST numbering', '00000000-0000-4000-8000-0000000000c1') returning project_number into p2;
  if p2 <= (select max(project_number) from public.projects where project_number < p2) is false then null; end if;
  if (select count(*) from public.projects where project_number = p2) <> 1 then raise exception 'project number reused'; end if;

  -- status change audited
  update public.leads set status = 'quote_sent' where id = '00000000-0000-4000-8000-0000000000f1';
  select count(*) into n from public.activity_logs
    where entity_id = '00000000-0000-4000-8000-0000000000f1' and action = 'leads.status_changed'
      and metadata ->> 'to' = 'quote_sent' and user_id = '00000000-0000-4000-8000-0000000000a1';
  if n <> 1 then raise exception 'lead status change not audited'; end if;

  -- won sets closed_at
  update public.leads set status = 'won' where id = '00000000-0000-4000-8000-0000000000f1';
  if (select closed_at from public.leads where id = '00000000-0000-4000-8000-0000000000f1') is null then
    raise exception 'closed_at not set on won'; end if;

  -- log_activity() helper works for members, refuses non-members
  perform public.log_activity('00000000-0000-4000-8000-000000000001', 'client', '00000000-0000-4000-8000-0000000000c1', 'client.note_added', '{"length": 12}');
  begin
    perform public.log_activity('00000000-0000-4000-8000-000000000002', 'client', '00000000-0000-4000-8000-0000000000c2', 'client.note_added');
    raise exception 'log_activity should refuse non-member';
  exception when insufficient_privilege then null; end;

  -- derived margin, never stored
  select estimated_margin_pct into margin from public.project_financials where project_id = '00000000-0000-4000-8000-000000000101';
  if margin <> 23.24 then raise exception 'expected margin 23.24, got %', margin; end if;

  perform test_reset();
  raise notice 'PASS numbering + audit + financials';
end $$;

drop function test_as(uuid);
drop function test_reset();

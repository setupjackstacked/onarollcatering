-- Messaging: direct threads are reused, site threads follow the roster,
-- unread counts work, and nobody reads a thread they are not in.
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
  v_fin uuid := '00000000-0000-4000-8000-0000000000a2';
  v_site uuid; v_direct uuid; v_site_conv uuid; v_bc uuid; n int; v_unread bigint;
begin
  perform test_reset();
  insert into public.sites (organisation_id, client_id, name, site_type, oar_manager_id)
  values (v_org, v_client, 'TEST Message Kitchen', 'kitchen', v_mgr) returning id into v_site;
  insert into public.site_assignments (organisation_id, site_id, user_id, employee_id, role, is_primary)
  values (v_org, v_site, v_staff, v_emp, 'staff', true);

  -- staff starts a direct thread with their manager
  perform test_as(v_staff);
  v_direct := public.start_direct_conversation(v_mgr);
  if public.start_direct_conversation(v_mgr) <> v_direct then raise exception 'direct conversation duplicated'; end if;
  insert into public.messages (organisation_id, conversation_id, sender_id, body)
  values (v_org, v_direct, v_staff, 'TEST can I swap Thursday?');

  -- you cannot message yourself
  begin
    perform public.start_direct_conversation(v_staff);
    raise exception 'started a conversation with self';
  exception when check_violation then null; end;

  -- the sender has no unread; the recipient has one
  select c.unread into v_unread from public.my_conversations() c where id = v_direct;
  if v_unread <> 0 then raise exception 'sender shows % unread', v_unread; end if;
  perform test_as(v_mgr);
  select c.unread into v_unread from public.my_conversations() c where id = v_direct;
  if v_unread <> 1 then raise exception 'recipient shows % unread (expected 1)', v_unread; end if;
  if public.my_unread_messages() < 1 then raise exception 'unread total wrong'; end if;

  -- reading clears it
  perform public.mark_conversation_read(v_direct);
  select c.unread into v_unread from public.my_conversations() c where id = v_direct;
  if v_unread <> 0 then raise exception 'still unread after reading'; end if;

  -- somebody outside the thread sees nothing of it
  perform test_as(v_fin);
  select count(*) into n from public.conversations where id = v_direct;
  if n <> 0 then raise exception 'finance read a private thread'; end if;
  select count(*) into n from public.messages where conversation_id = v_direct;
  if n <> 0 then raise exception 'finance read private messages'; end if;
  begin
    insert into public.messages (organisation_id, conversation_id, sender_id, body)
    values (v_org, v_direct, v_fin, 'TEST intrusion');
    raise exception 'outsider posted into a thread';
  exception when insufficient_privilege then null; end;

  -- the site thread picks up everyone assigned to the site
  perform test_as(v_mgr);
  v_site_conv := public.site_conversation(v_site);
  select count(*) into n from public.conversation_participants where conversation_id = v_site_conv;
  if n <> 2 then raise exception 'site thread has % participants (expected manager + staff)', n; end if;
  if public.site_conversation(v_site) <> v_site_conv then raise exception 'site thread duplicated'; end if;

  -- a broadcast reaches every accepted member
  perform test_as(v_owner);
  v_bc := public.start_broadcast('TEST All-hands', 'TEST kitchens closed Monday');
  select count(*) into n from public.conversation_participants where conversation_id = v_bc;
  if n < 5 then raise exception 'broadcast reached only % people', n; end if;
  select count(*) into n from public.messages where conversation_id = v_bc;
  if n <> 1 then raise exception 'broadcast body not posted'; end if;

  -- staff cannot broadcast
  perform test_as(v_staff);
  begin
    perform public.start_broadcast('TEST nope', 'TEST nope');
    raise exception 'staff sent a broadcast';
  exception when insufficient_privilege then null; end;

  -- but they do receive it, and it is unread for them
  select c.unread into v_unread from public.my_conversations() c where id = v_bc;
  if v_unread <> 1 then raise exception 'broadcast not unread for staff (%)', v_unread; end if;

  -- and a notification was raised for it
  perform test_reset();
  select count(*) into n from public.notifications where entity_id = v_bc and user_id = v_staff;
  if n <> 1 then raise exception 'no notification for the broadcast (%)', n; end if;

  delete from public.notifications where entity_type = 'conversations';
  delete from public.conversations where id in (v_direct, v_site_conv, v_bc);
  delete from public.sites where id = v_site;
  raise notice 'PASS messaging';
end $$;
drop function test_as(uuid); drop function test_reset();

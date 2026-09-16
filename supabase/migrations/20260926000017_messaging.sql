-- ============================================================================
-- 0017 — Internal messaging.
--
-- The point is to replace WhatsApp for work conversations, not to rebuild it.
-- Three shapes of conversation:
--   direct     — two people
--   site       — everyone assigned to a site
--   broadcast  — an announcement to a chosen audience (usually everyone)
--
-- Unread is derived from participants.last_read_at rather than a per-message
-- read table, which keeps writes cheap at 25 staff and still works at 250.
-- ============================================================================

create type public.conversation_kind as enum ('direct', 'site', 'broadcast');

create table public.conversations (
  id              uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  kind            public.conversation_kind not null default 'direct',
  subject         text,
  site_id         uuid references public.sites(id) on delete cascade,
  created_by      uuid references auth.users(id) on delete set null,
  last_message_at timestamptz not null default now(),
  last_message_preview text,
  closed_at       timestamptz,
  created_at      timestamptz not null default now(),
  check (kind <> 'site' or site_id is not null)
);
create index conversations_org_idx on public.conversations (organisation_id, last_message_at desc);
create index conversations_site_idx on public.conversations (site_id) where site_id is not null;

create table public.conversation_participants (
  id              uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  user_id         uuid not null references auth.users(id) on delete cascade,
  last_read_at    timestamptz,
  muted           boolean not null default false,
  added_at        timestamptz not null default now(),
  unique (conversation_id, user_id)
);
create index participants_user_idx on public.conversation_participants (user_id);

create table public.messages (
  id              uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id       uuid references auth.users(id) on delete set null,
  body            text not null check (length(body) between 1 and 5000),
  document_id     uuid references public.documents(id) on delete set null,
  created_at      timestamptz not null default now()
);
create index messages_conversation_idx on public.messages (conversation_id, created_at desc);

-- Am I in this conversation? Security definer so the participants policy can
-- use it without recursing into itself.
create or replace function public.in_conversation(p_conversation_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.conversation_participants p
    where p.conversation_id = p_conversation_id and p.user_id = auth.uid()
  );
$$;
revoke all on function public.in_conversation(uuid) from public;
grant execute on function public.in_conversation(uuid) to authenticated;

-- Posting a message updates the conversation's preview in one place.
create or replace function public.messages_touch_conversation()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update public.conversations
     set last_message_at = new.created_at,
         last_message_preview = left(new.body, 140)
   where id = new.conversation_id;

  -- The sender has obviously read their own message.
  update public.conversation_participants
     set last_read_at = new.created_at
   where conversation_id = new.conversation_id and user_id = new.sender_id;

  -- Everyone else gets a notification they can act on.
  insert into public.notifications (organisation_id, user_id, type, title, body, entity_type, entity_id, href)
  select new.organisation_id, p.user_id, 'system',
         coalesce(c.subject, case c.kind when 'site' then s.name || ' — site messages' else 'New message' end),
         left(new.body, 140), 'conversations', new.conversation_id, '/dashboard/messages/' || new.conversation_id
  from public.conversation_participants p
  join public.conversations c on c.id = new.conversation_id
  left join public.sites s on s.id = c.site_id
  where p.conversation_id = new.conversation_id and p.user_id <> new.sender_id and not p.muted;

  return null;
end $$;
create trigger messages_touch after insert on public.messages
  for each row execute function public.messages_touch_conversation();

-- ---------- starting conversations --------------------------------------------
-- One direct conversation per pair, reused rather than duplicated.
create or replace function public.start_direct_conversation(p_other_user uuid)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_org uuid; v_id uuid;
begin
  select organisation_id into v_org from public.organisation_members
   where user_id = auth.uid() and accepted_at is not null limit 1;
  if v_org is null then raise exception 'not a member' using errcode = '42501'; end if;
  if not exists (select 1 from public.organisation_members where user_id = p_other_user and organisation_id = v_org) then
    raise exception 'they are not in your organisation' using errcode = '42501';
  end if;
  if p_other_user = auth.uid() then raise exception 'you cannot message yourself' using errcode = 'check_violation'; end if;

  select c.id into v_id
  from public.conversations c
  where c.organisation_id = v_org and c.kind = 'direct'
    and (select count(*) from public.conversation_participants p where p.conversation_id = c.id) = 2
    and exists (select 1 from public.conversation_participants p where p.conversation_id = c.id and p.user_id = auth.uid())
    and exists (select 1 from public.conversation_participants p where p.conversation_id = c.id and p.user_id = p_other_user)
  limit 1;
  if v_id is not null then return v_id; end if;

  insert into public.conversations (organisation_id, kind, created_by) values (v_org, 'direct', auth.uid()) returning id into v_id;
  insert into public.conversation_participants (organisation_id, conversation_id, user_id)
  values (v_org, v_id, auth.uid()), (v_org, v_id, p_other_user);
  return v_id;
end $$;
revoke all on function public.start_direct_conversation(uuid) from public;
grant execute on function public.start_direct_conversation(uuid) to authenticated;

-- One conversation per site, with everyone assigned to it.
create or replace function public.site_conversation(p_site_id uuid)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_org uuid; v_id uuid;
begin
  select organisation_id into v_org from public.sites where id = p_site_id;
  if v_org is null then raise exception 'site not found' using errcode = 'P0002'; end if;
  if not public.can_read_site(p_site_id) then raise exception 'not permitted' using errcode = '42501'; end if;

  select id into v_id from public.conversations where site_id = p_site_id and kind = 'site' limit 1;
  if v_id is null then
    insert into public.conversations (organisation_id, kind, site_id, subject, created_by)
    values (v_org, 'site', p_site_id, (select name from public.sites where id = p_site_id), auth.uid())
    returning id into v_id;
  end if;

  -- Keep the roster in step with who is actually assigned to the site.
  insert into public.conversation_participants (organisation_id, conversation_id, user_id)
  select v_org, v_id, a.user_id from public.site_assignments a where a.site_id = p_site_id
  on conflict (conversation_id, user_id) do nothing;
  insert into public.conversation_participants (organisation_id, conversation_id, user_id)
  select v_org, v_id, s.oar_manager_id from public.sites s where s.id = p_site_id and s.oar_manager_id is not null
  on conflict (conversation_id, user_id) do nothing;

  return v_id;
end $$;
revoke all on function public.site_conversation(uuid) from public;
grant execute on function public.site_conversation(uuid) to authenticated;

-- An announcement: everyone, one site's team, or a named list.
create or replace function public.start_broadcast(p_subject text, p_body text, p_site_id uuid default null)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_org uuid; v_id uuid;
begin
  select organisation_id into v_org from public.organisation_members
   where user_id = auth.uid() and accepted_at is not null limit 1;
  if v_org is null then raise exception 'not a member' using errcode = '42501'; end if;
  if not (public.role_in(v_org, 'owner','administrator')
          or (p_site_id is not null and public.can_write_site(p_site_id))) then
    raise exception 'Only an administrator or a site manager can send an announcement' using errcode = '42501';
  end if;

  insert into public.conversations (organisation_id, kind, subject, site_id, created_by)
  values (v_org, 'broadcast', p_subject, p_site_id, auth.uid()) returning id into v_id;

  if p_site_id is not null then
    insert into public.conversation_participants (organisation_id, conversation_id, user_id)
    select v_org, v_id, a.user_id from public.site_assignments a where a.site_id = p_site_id
    on conflict do nothing;
  else
    insert into public.conversation_participants (organisation_id, conversation_id, user_id)
    select v_org, v_id, m.user_id from public.organisation_members m
    where m.organisation_id = v_org and m.accepted_at is not null
    on conflict do nothing;
  end if;
  insert into public.conversation_participants (organisation_id, conversation_id, user_id)
  values (v_org, v_id, auth.uid()) on conflict do nothing;

  insert into public.messages (organisation_id, conversation_id, sender_id, body)
  values (v_org, v_id, auth.uid(), p_body);

  return v_id;
end $$;
revoke all on function public.start_broadcast(text, text, uuid) from public;
grant execute on function public.start_broadcast(text, text, uuid) to authenticated;

create or replace function public.mark_conversation_read(p_conversation_id uuid)
returns void language sql security definer set search_path = public as $$
  update public.conversation_participants set last_read_at = now()
   where conversation_id = p_conversation_id and user_id = auth.uid();
$$;
revoke all on function public.mark_conversation_read(uuid) from public;
grant execute on function public.mark_conversation_read(uuid) to authenticated;

-- My conversations, newest first, with the unread count already worked out.
create or replace function public.my_conversations()
returns table (
  id uuid, kind public.conversation_kind, subject text, site_id uuid, site_name text,
  last_message_at timestamptz, last_message_preview text, unread bigint, other_user_id uuid
)
language sql stable security definer set search_path = public as $$
  select c.id, c.kind, c.subject, c.site_id, s.name,
         c.last_message_at, c.last_message_preview,
         (select count(*) from public.messages m
           where m.conversation_id = c.id
             and m.sender_id is distinct from auth.uid()
             and (p.last_read_at is null or m.created_at > p.last_read_at)),
         case when c.kind = 'direct'
              then (select p2.user_id from public.conversation_participants p2
                     where p2.conversation_id = c.id and p2.user_id <> auth.uid() limit 1)
              else null end
  from public.conversation_participants p
  join public.conversations c on c.id = p.conversation_id
  left join public.sites s on s.id = c.site_id
  where p.user_id = auth.uid() and c.closed_at is null
  order by c.last_message_at desc;
$$;
revoke all on function public.my_conversations() from public;
grant execute on function public.my_conversations() to authenticated;

create or replace function public.my_unread_messages()
returns bigint language sql stable security definer set search_path = public as $$
  select coalesce(sum(unread), 0)::bigint from public.my_conversations();
$$;
revoke all on function public.my_unread_messages() from public;
grant execute on function public.my_unread_messages() to authenticated;

-- ---------- RLS ------------------------------------------------------------------
alter table public.conversations              enable row level security;
alter table public.conversation_participants  enable row level security;
alter table public.messages                   enable row level security;

-- You see a conversation only if you are in it. Administrators are not given a
-- blanket read of everyone's direct messages: they can be added to a thread,
-- but they cannot silently read one they are not part of.
create policy conversations_select on public.conversations for select to authenticated
  using (public.in_conversation(id));
create policy conversations_update on public.conversations for update to authenticated
  using (created_by = auth.uid() or public.role_in(organisation_id, 'owner','administrator'))
  with check (created_by = auth.uid() or public.role_in(organisation_id, 'owner','administrator'));

create policy participants_select on public.conversation_participants for select to authenticated
  using (user_id = auth.uid() or public.in_conversation(conversation_id));
-- You may only change your own row (read marker, mute).
create policy participants_update on public.conversation_participants for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy participants_insert on public.conversation_participants for insert to authenticated
  with check (public.in_conversation(conversation_id) or public.role_in(organisation_id, 'owner','administrator'));

create policy messages_select on public.messages for select to authenticated
  using (public.in_conversation(conversation_id));
create policy messages_insert on public.messages for insert to authenticated
  with check (sender_id = auth.uid() and public.in_conversation(conversation_id));
-- Messages are not editable or deletable: a work record should not be rewritable.

-- Development seed. DO NOT run against production.
-- Creates the On A Roll Catering organisation. Users are created via Supabase Auth
-- (dashboard or `supabase auth` CLI); then link them with the block at the bottom.

insert into public.organisations (id, name, slug)
values ('00000000-0000-4000-8000-000000000001', 'On A Roll Catering', 'on-a-roll-catering')
on conflict (slug) do nothing;

-- Link an existing auth user as owner (replace the email):
-- insert into public.organisation_members (organisation_id, user_id, role, accepted_at)
-- select '00000000-0000-4000-8000-000000000001', id, 'owner', now()
-- from auth.users where email = 'owner@onarollcatering.com'
-- on conflict (organisation_id, user_id) do nothing;

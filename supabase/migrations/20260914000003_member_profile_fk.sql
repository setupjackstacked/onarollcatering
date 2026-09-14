-- 0003 — Let PostgREST join organisation_members → profiles.
-- profiles.id mirrors auth.users.id (created by trigger), so this FK is safe and
-- gives the dashboard a typed relationship without exposing auth.users.
alter table public.organisation_members
  add constraint organisation_members_profile_fk
  foreign key (user_id) references public.profiles(id) on delete cascade;

-- ============================================================================
-- 0001 — Foundation: tenancy, profiles, membership, enquiry intake, RLS helpers
-- ============================================================================
-- Conventions (see docs/ARCHITECTURE.md):
--   * UUID PKs, created_at/updated_at on every table, organisation_id on every
--     tenant-owned table, RLS enabled on everything.
--   * Money is NUMERIC(12,2). Never float.
--   * Soft-delete via archived_at where records must not disappear.
-- ============================================================================

create extension if not exists "pgcrypto";

-- ---------- enums ----------------------------------------------------------
create type public.organisation_role as enum (
  'owner', 'administrator', 'finance', 'project_manager', 'staff', 'read_only'
);

create type public.enquiry_status as enum (
  'new', 'reviewed', 'converted', 'spam', 'archived'
);

-- ---------- updated_at trigger --------------------------------------------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- ---------- organisations --------------------------------------------------
create table public.organisations (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        text not null unique check (slug ~ '^[a-z0-9-]{2,64}$'),
  archived_at timestamptz,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create trigger organisations_updated_at before update on public.organisations
  for each row execute function public.set_updated_at();

-- ---------- profiles (1:1 with auth.users) ---------------------------------
create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text,
  email       text,
  avatar_path text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

-- Auto-create a profile row when an auth user is created.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data ->> 'full_name', null))
  on conflict (id) do nothing;
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- organisation_members ------------------------------------------
create table public.organisation_members (
  id              uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  user_id         uuid not null references auth.users(id) on delete cascade,
  role            public.organisation_role not null default 'read_only',
  invited_by      uuid references auth.users(id) on delete set null,
  accepted_at     timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (organisation_id, user_id)
);
create index organisation_members_user_idx on public.organisation_members (user_id);
create index organisation_members_org_idx  on public.organisation_members (organisation_id);
create trigger organisation_members_updated_at before update on public.organisation_members
  for each row execute function public.set_updated_at();

-- ---------- RLS helper functions ------------------------------------------
-- security definer + stable so they can be used inside policies without recursion.
create or replace function public.is_org_member(org_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.organisation_members m
    where m.organisation_id = org_id
      and m.user_id = auth.uid()
      and m.accepted_at is not null
  );
$$;

create or replace function public.org_role(org_id uuid)
returns public.organisation_role language sql stable security definer set search_path = public as $$
  select m.role from public.organisation_members m
  where m.organisation_id = org_id
    and m.user_id = auth.uid()
    and m.accepted_at is not null
  limit 1;
$$;

create or replace function public.has_org_role(org_id uuid, roles public.organisation_role[])
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce(public.org_role(org_id) = any (roles), false);
$$;

revoke all on function public.is_org_member(uuid) from public;
revoke all on function public.org_role(uuid) from public;
revoke all on function public.has_org_role(uuid, public.organisation_role[]) from public;
grant execute on function public.is_org_member(uuid) to authenticated;
grant execute on function public.org_role(uuid) to authenticated;
grant execute on function public.has_org_role(uuid, public.organisation_role[]) to authenticated;

-- ---------- enquiries (public website intake) -----------------------------
-- Raw capture of /quote submissions. Written by the service-role only.
-- Phase 4 converts enquiries into leads / clients / contacts / opportunities.
create table public.enquiries (
  id                  uuid primary key default gen_random_uuid(),
  organisation_id     uuid not null references public.organisations(id) on delete cascade,
  status              public.enquiry_status not null default 'new',
  source              text not null default 'website_quote',
  company_name        text not null,
  contact_name        text not null,
  job_title           text,
  email               text not null,
  phone               text not null,
  project_name        text not null,
  location            text not null,
  required_start_date date,
  expected_duration   text,
  description         text not null,
  services            text[] not null default '{}',
  catering_details    jsonb,
  kitchen_details     jsonb,
  attachments         jsonb not null default '[]'::jsonb,   -- [{name,path,size,mime}]
  metadata            jsonb not null default '{}'::jsonb,   -- user agent, referrer, utm
  lead_id             uuid,                                 -- FK added in Phase 2 when leads exist
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);
create index enquiries_org_created_idx on public.enquiries (organisation_id, created_at desc);
create index enquiries_email_idx on public.enquiries (lower(email));
create trigger enquiries_updated_at before update on public.enquiries
  for each row execute function public.set_updated_at();

-- ---------- Row Level Security --------------------------------------------
alter table public.organisations        enable row level security;
alter table public.profiles             enable row level security;
alter table public.organisation_members enable row level security;
alter table public.enquiries            enable row level security;

-- organisations: members can read; owners/admins can update.
create policy organisations_select on public.organisations
  for select to authenticated using (public.is_org_member(id));
create policy organisations_update on public.organisations
  for update to authenticated
  using (public.has_org_role(id, array['owner','administrator']::public.organisation_role[]))
  with check (public.has_org_role(id, array['owner','administrator']::public.organisation_role[]));

-- profiles: a user sees their own profile and profiles of people in their orgs.
create policy profiles_select on public.profiles
  for select to authenticated using (
    id = auth.uid() or exists (
      select 1 from public.organisation_members a
      join public.organisation_members b on a.organisation_id = b.organisation_id
      where a.user_id = auth.uid() and b.user_id = profiles.id
    )
  );
create policy profiles_update_self on public.profiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

-- organisation_members: members can see the roster; owners/admins manage it.
create policy members_select on public.organisation_members
  for select to authenticated using (public.is_org_member(organisation_id));
create policy members_insert on public.organisation_members
  for insert to authenticated
  with check (public.has_org_role(organisation_id, array['owner','administrator']::public.organisation_role[]));
create policy members_update on public.organisation_members
  for update to authenticated
  using (public.has_org_role(organisation_id, array['owner','administrator']::public.organisation_role[]))
  with check (public.has_org_role(organisation_id, array['owner','administrator']::public.organisation_role[]));
create policy members_delete on public.organisation_members
  for delete to authenticated
  using (public.has_org_role(organisation_id, array['owner']::public.organisation_role[]));

-- enquiries: sales-facing roles can read/update; no client-side insert (service role only).
create policy enquiries_select on public.enquiries
  for select to authenticated
  using (public.has_org_role(organisation_id,
    array['owner','administrator','finance','project_manager','read_only']::public.organisation_role[]));
create policy enquiries_update on public.enquiries
  for update to authenticated
  using (public.has_org_role(organisation_id, array['owner','administrator','finance']::public.organisation_role[]))
  with check (public.has_org_role(organisation_id, array['owner','administrator','finance']::public.organisation_role[]));

-- ---------- Storage buckets ------------------------------------------------
insert into storage.buckets (id, name, public)
values
  ('public-assets', 'public-assets', true),
  ('enquiry-uploads', 'enquiry-uploads', false)
on conflict (id) do nothing;

-- Private bucket: no anon/authenticated policies → only service role can read/write.
-- Public bucket: anyone can read; only owners/admins upload (enforced later with org scoping).
create policy "public assets are readable" on storage.objects
  for select using (bucket_id = 'public-assets');

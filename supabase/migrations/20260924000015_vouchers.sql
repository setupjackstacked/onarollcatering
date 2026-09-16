-- ============================================================================
-- 0015 — Daily voucher and meal logging, per site.
--
-- One entry per site per day, with a quantity against each category. Categories
-- are an org-scoped lookup so an administrator can add "Contractor meals" or
-- rename "Complimentary" without a code change, exactly like lead sources.
--
-- Staff record the day's numbers on their phone; managers review and correct;
-- finance and admins report across every site.
-- ============================================================================

create table public.voucher_categories (
  id              uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  key             text not null,
  label           text not null,
  description     text,
  -- Charged categories bill the client; complimentary ones are given away and
  -- are what the business actually wants to watch.
  is_chargeable   boolean not null default true,
  sort_order      int not null default 0,
  active          boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (organisation_id, key)
);
create trigger voucher_categories_updated_at before update on public.voucher_categories
  for each row execute function public.set_updated_at();

create table public.voucher_entries (
  id              uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  site_id         uuid not null references public.sites(id) on delete cascade,
  entry_date      date not null,
  notes           text,
  recorded_by     uuid references auth.users(id) on delete set null,
  confirmed_by    uuid references auth.users(id) on delete set null,
  confirmed_at    timestamptz,
  total_quantity  int not null default 0,   -- maintained from the lines
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (site_id, entry_date)
);
create index voucher_entries_org_date_idx on public.voucher_entries (organisation_id, entry_date desc);
create trigger voucher_entries_updated_at before update on public.voucher_entries
  for each row execute function public.set_updated_at();

create table public.voucher_entry_lines (
  id              uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  entry_id        uuid not null references public.voucher_entries(id) on delete cascade,
  category_id     uuid not null references public.voucher_categories(id) on delete restrict,
  quantity        int not null default 0 check (quantity >= 0 and quantity <= 100000),
  notes           text,
  unique (entry_id, category_id)
);
create index voucher_lines_entry_idx on public.voucher_entry_lines (entry_id);

-- Keep the header total in step with its lines.
create or replace function public.voucher_entry_rollup()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_entry uuid := coalesce(new.entry_id, old.entry_id);
begin
  update public.voucher_entries
     set total_quantity = coalesce((select sum(quantity) from public.voucher_entry_lines where entry_id = v_entry), 0)
   where id = v_entry;
  return null;
end $$;
create trigger voucher_lines_rollup after insert or update or delete on public.voucher_entry_lines
  for each row execute function public.voucher_entry_rollup();

-- Records the day's numbers in one call so the phone only makes one request.
-- p_lines: [{"category_id": "...", "quantity": 12}, …]
create or replace function public.record_vouchers(
  p_site_id uuid, p_date date, p_lines jsonb, p_notes text default null
) returns uuid language plpgsql security definer set search_path = public as $$
declare v_org uuid; v_entry uuid; v_line jsonb;
begin
  select organisation_id into v_org from public.sites where id = p_site_id;
  if v_org is null then raise exception 'site not found' using errcode = 'P0002'; end if;
  -- Being able to SEE a site is not enough to log against it: read_only can see
  -- everything. You must actually be assigned to the site, manage it, or be
  -- admin/finance.
  if not (
    exists (select 1 from public.site_assignments a where a.site_id = p_site_id and a.user_id = auth.uid())
    or public.can_write_site(p_site_id)
    or public.role_in(v_org, 'owner','administrator','finance')
  ) then
    raise exception 'not permitted' using errcode = '42501';
  end if;
  if p_date > current_date then
    raise exception 'You cannot log vouchers for a future date' using errcode = 'check_violation';
  end if;

  insert into public.voucher_entries (organisation_id, site_id, entry_date, notes, recorded_by)
  values (v_org, p_site_id, p_date, p_notes, auth.uid())
  on conflict (site_id, entry_date) do update set notes = coalesce(excluded.notes, public.voucher_entries.notes)
  returning id into v_entry;

  -- A day already confirmed by a manager is only editable by a manager.
  if exists (select 1 from public.voucher_entries where id = v_entry and confirmed_at is not null)
     and not (public.can_write_site(p_site_id) or public.role_in(v_org, 'owner','administrator','finance')) then
    raise exception 'That day has been confirmed by a manager — ask them to change it' using errcode = '42501';
  end if;

  for v_line in select * from jsonb_array_elements(p_lines) loop
    insert into public.voucher_entry_lines (organisation_id, entry_id, category_id, quantity)
    values (v_org, v_entry, (v_line->>'category_id')::uuid, greatest((v_line->>'quantity')::int, 0))
    on conflict (entry_id, category_id) do update set quantity = excluded.quantity;
  end loop;

  -- Categories left out of the payload are cleared rather than left stale.
  delete from public.voucher_entry_lines
   where entry_id = v_entry
     and category_id not in (select (value->>'category_id')::uuid from jsonb_array_elements(p_lines));

  insert into public.activity_logs (organisation_id, user_id, entity_type, entity_id, action, metadata)
  values (v_org, auth.uid(), 'site', p_site_id, 'vouchers.recorded',
          jsonb_build_object('entry_id', v_entry, 'date', p_date));

  return v_entry;
end $$;
revoke all on function public.record_vouchers(uuid, date, jsonb, text) from public;
grant execute on function public.record_vouchers(uuid, date, jsonb, text) to authenticated;

create or replace function public.confirm_vouchers(p_entry_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare e public.voucher_entries%rowtype;
begin
  select * into e from public.voucher_entries where id = p_entry_id;
  if not found then raise exception 'entry not found' using errcode = 'P0002'; end if;
  if not (public.can_write_site(e.site_id) or public.role_in(e.organisation_id, 'owner','administrator','finance')) then
    raise exception 'not permitted' using errcode = '42501';
  end if;
  update public.voucher_entries set confirmed_by = auth.uid(), confirmed_at = now() where id = p_entry_id;
end $$;
revoke all on function public.confirm_vouchers(uuid) from public;
grant execute on function public.confirm_vouchers(uuid) to authenticated;

-- ---------- reporting ---------------------------------------------------------
-- Totals by day, week or month, optionally narrowed to one site or category.
create or replace function public.report_vouchers(
  p_org uuid, p_from date, p_to date, p_grain text default 'day',
  p_site_id uuid default null, p_category_id uuid default null
) returns table (period date, site_id uuid, site_name text, category_id uuid, category_label text, is_chargeable boolean, quantity bigint)
language sql stable security invoker set search_path = public as $$
  select
    case lower(p_grain)
      when 'month' then date_trunc('month', e.entry_date)::date
      when 'week'  then date_trunc('week',  e.entry_date)::date
      else e.entry_date
    end as period,
    s.id, s.name, c.id, c.label, c.is_chargeable, sum(l.quantity)::bigint
  from public.voucher_entry_lines l
  join public.voucher_entries e on e.id = l.entry_id
  join public.sites s on s.id = e.site_id
  join public.voucher_categories c on c.id = l.category_id
  where e.organisation_id = p_org
    and e.entry_date between p_from and p_to
    and (p_site_id is null or e.site_id = p_site_id)
    and (p_category_id is null or l.category_id = p_category_id)
  group by 1, s.id, s.name, c.id, c.label, c.is_chargeable
  order by 1 desc, s.name, c.label;
$$;

/* Sites that have not logged anything for a given day — the "missing
   submissions" figure on the management overview. */
create or replace function public.sites_missing_vouchers(p_org uuid, p_date date default current_date)
returns table (site_id uuid, site_name text)
language sql stable security invoker set search_path = public as $$
  select s.id, s.name
  from public.sites s
  where s.organisation_id = p_org and s.archived_at is null
    and s.site_type = 'kitchen' and s.status = 'operating'
    and not exists (select 1 from public.voucher_entries e where e.site_id = s.id and e.entry_date = p_date)
  order by s.name;
$$;

-- ---------- defaults ----------------------------------------------------------
create or replace function public.seed_org_voucher_defaults(org uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  insert into public.voucher_categories (organisation_id, key, label, description, is_chargeable, sort_order) values
    (org, 'vouchers',      'Vouchers used',       'Meal vouchers redeemed by site personnel',        true,  10),
    (org, 'paid-meals',    'Paid meals',          'Meals paid for at the counter',                   true,  20),
    (org, 'free-meals',    'Free meals',          'Meals provided at no charge under the contract',  false, 30),
    (org, 'complimentary', 'Complimentary meals', 'Goodwill meals outside the contract',             false, 40),
    (org, 'staff-meals',   'Staff meals',         'Meals taken by On A Roll staff on duty',          false, 50)
  on conflict (organisation_id, key) do nothing;
end $$;
create or replace function public.on_organisation_created_vouchers()
returns trigger language plpgsql security definer set search_path = public as $$
begin perform public.seed_org_voucher_defaults(new.id); return new; end $$;
create trigger organisations_seed_vouchers after insert on public.organisations
  for each row execute function public.on_organisation_created_vouchers();
do $$ declare o record; begin
  for o in select id from public.organisations loop perform public.seed_org_voucher_defaults(o.id); end loop;
end $$;

-- ---------- RLS ----------------------------------------------------------------
alter table public.voucher_categories  enable row level security;
alter table public.voucher_entries     enable row level security;
alter table public.voucher_entry_lines enable row level security;

create policy voucher_categories_select on public.voucher_categories for select to authenticated
  using (public.is_org_member(organisation_id));
create policy voucher_categories_write on public.voucher_categories for all to authenticated
  using (public.role_in(organisation_id, 'owner','administrator'))
  with check (public.role_in(organisation_id, 'owner','administrator'));

-- Anyone who can read the site can see its numbers; writing goes through
-- record_vouchers() so the same-day and confirmation rules always apply.
create policy voucher_entries_select on public.voucher_entries for select to authenticated using (
  public.role_in(organisation_id, 'owner','administrator','finance','read_only')
  or public.can_read_site(site_id)
);
create policy voucher_entries_write on public.voucher_entries for all to authenticated
  using (public.can_write_site(site_id) or public.role_in(organisation_id, 'owner','administrator','finance'))
  with check (public.can_write_site(site_id) or public.role_in(organisation_id, 'owner','administrator','finance'));

create policy voucher_lines_select on public.voucher_entry_lines for select to authenticated using (
  exists (select 1 from public.voucher_entries e where e.id = entry_id
           and (public.can_read_site(e.site_id) or public.role_in(e.organisation_id, 'owner','administrator','finance','read_only')))
);
create policy voucher_lines_write on public.voucher_entry_lines for all to authenticated using (
  exists (select 1 from public.voucher_entries e where e.id = entry_id
           and (public.can_write_site(e.site_id) or public.role_in(e.organisation_id, 'owner','administrator','finance')))
) with check (
  exists (select 1 from public.voucher_entries e where e.id = entry_id
           and (public.can_write_site(e.site_id) or public.role_in(e.organisation_id, 'owner','administrator','finance')))
);

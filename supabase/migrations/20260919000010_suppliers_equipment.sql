-- ============================================================================
-- 0010 — Phase 10: suppliers, supplier contacts, equipment catalogue and its
--        link into quotation line items.
-- ============================================================================

create type public.supplier_category as enum (
  'food', 'equipment', 'fabrication', 'extraction', 'refrigeration', 'electrical',
  'plumbing', 'transport', 'agency_staff', 'cleaning', 'other'
);

create table public.suppliers (
  id              uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  name            text not null check (length(name) between 1 and 200),
  category        public.supplier_category not null default 'other',
  email           text,
  phone           text,
  website         text,
  address         jsonb not null default '{}'::jsonb,
  vat_number      text,
  payment_terms_days int not null default 30 check (payment_terms_days between 0 and 180),
  account_number  text,
  notes           text,
  archived_at     timestamptz,
  created_by      uuid references auth.users(id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index suppliers_org_idx on public.suppliers (organisation_id, category) where archived_at is null;
create unique index suppliers_name_idx on public.suppliers (organisation_id, lower(name)) where archived_at is null;
create trigger suppliers_updated_at before update on public.suppliers for each row execute function public.set_updated_at();

create table public.supplier_contacts (
  id              uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  supplier_id     uuid not null references public.suppliers(id) on delete cascade,
  first_name      text not null,
  last_name       text not null default '',
  job_title       text,
  email           text,
  phone           text,
  is_primary      boolean not null default false,
  notes           text,
  archived_at     timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index supplier_contacts_supplier_idx on public.supplier_contacts (supplier_id) where archived_at is null;
create trigger supplier_contacts_updated_at before update on public.supplier_contacts for each row execute function public.set_updated_at();

-- ---------- equipment catalogue ----------------------------------------------
create table public.equipment (
  id              uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  name            text not null check (length(name) between 1 and 200),
  category        text not null default 'equipment',
  supplier_id     uuid references public.suppliers(id) on delete set null,
  supplier_sku    text,
  description     text,
  specification   text,
  cost_price      numeric(12,2) not null default 0 check (cost_price >= 0),
  sell_price      numeric(12,2) not null default 0 check (sell_price >= 0),
  vat_rate_key    text not null default 'standard',
  image_document_id     uuid references public.documents(id) on delete set null,
  datasheet_document_id uuid references public.documents(id) on delete set null,
  active          boolean not null default true,
  notes           text,
  created_by      uuid references auth.users(id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index equipment_org_idx on public.equipment (organisation_id, category) where active;
create index equipment_supplier_idx on public.equipment (supplier_id);
create trigger equipment_updated_at before update on public.equipment for each row execute function public.set_updated_at();

-- Late FKs that Phases 7 and 5 left open.
alter table public.expenses add constraint expenses_supplier_fk
  foreign key (supplier_id) references public.suppliers(id) on delete set null;
alter table public.catalogue_items add constraint catalogue_items_equipment_fk
  foreign key (equipment_id) references public.equipment(id) on delete set null;

-- ---------- equipment ⇄ quotation catalogue ----------------------------------
-- Equipment is the source of truth for specification and supplier pricing;
-- the quote catalogue is what appears in the line-item picker. Publishing keeps
-- one catalogue item per piece of equipment and refreshes its prices.
create or replace function public.publish_equipment_to_catalogue(p_equipment_id uuid)
returns uuid language plpgsql security definer set search_path = public as $$
declare e public.equipment%rowtype; v_id uuid;
begin
  select * into e from public.equipment where id = p_equipment_id;
  if not found then raise exception 'equipment not found' using errcode = 'P0002'; end if;
  if not public.role_in(e.organisation_id, 'owner','administrator','finance') then
    raise exception 'not permitted' using errcode = '42501';
  end if;

  select id into v_id from public.catalogue_items where equipment_id = p_equipment_id limit 1;
  if v_id is null then
    insert into public.catalogue_items (organisation_id, name, category, description, unit, cost_price, sell_price, vat_rate_key, equipment_id, active)
    values (e.organisation_id, e.name, 'equipment', coalesce(e.description, e.specification), 'each', e.cost_price, e.sell_price, e.vat_rate_key, e.id, e.active)
    returning id into v_id;
  else
    update public.catalogue_items
       set name = e.name, description = coalesce(e.description, e.specification),
           cost_price = e.cost_price, sell_price = e.sell_price, vat_rate_key = e.vat_rate_key, active = e.active
     where id = v_id;
  end if;
  return v_id;
end $$;
revoke all on function public.publish_equipment_to_catalogue(uuid) from public;
grant execute on function public.publish_equipment_to_catalogue(uuid) to authenticated;

-- Deactivating equipment deactivates its catalogue entry so it leaves the picker.
create or replace function public.equipment_sync_catalogue()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.active is distinct from old.active then
    update public.catalogue_items set active = new.active where equipment_id = new.id;
  end if;
  return new;
end $$;
create trigger equipment_sync after update of active on public.equipment for each row execute function public.equipment_sync_catalogue();

-- Spend by supplier, for the supplier workspace (costs are finance-visible only).
create or replace function public.supplier_spend(p_supplier_id uuid)
returns table (committed numeric, actual numeric, expense_count bigint)
language sql stable security invoker set search_path = public as $$
  select coalesce(sum(case when status = 'committed' then net else 0 end), 0)::numeric(12,2),
         coalesce(sum(case when status in ('actual','paid') then net else 0 end), 0)::numeric(12,2),
         count(*)
  from public.expenses where supplier_id = p_supplier_id and archived_at is null;
$$;

-- ---------- RLS --------------------------------------------------------------
alter table public.suppliers         enable row level security;
alter table public.supplier_contacts enable row level security;
alter table public.equipment         enable row level security;

create policy suppliers_select on public.suppliers for select to authenticated
  using (public.role_in(organisation_id, 'owner','administrator','finance','project_manager','read_only'));
create policy suppliers_write on public.suppliers for all to authenticated
  using (public.role_in(organisation_id, 'owner','administrator','finance'))
  with check (public.role_in(organisation_id, 'owner','administrator','finance'));

create policy supplier_contacts_select on public.supplier_contacts for select to authenticated
  using (public.role_in(organisation_id, 'owner','administrator','finance','project_manager','read_only'));
create policy supplier_contacts_write on public.supplier_contacts for all to authenticated
  using (public.role_in(organisation_id, 'owner','administrator','finance'))
  with check (public.role_in(organisation_id, 'owner','administrator','finance'));

create policy equipment_select on public.equipment for select to authenticated
  using (public.role_in(organisation_id, 'owner','administrator','finance','project_manager','read_only'));
create policy equipment_write on public.equipment for all to authenticated
  using (public.role_in(organisation_id, 'owner','administrator','finance'))
  with check (public.role_in(organisation_id, 'owner','administrator','finance'));

-- Supplier documents (quotes, datasheets, terms) reuse the documents table.
create or replace function public.seed_org_supplier_defaults(org uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  insert into public.document_categories (organisation_id, entity, key, label, sort_order) values
    (org, 'supplier', 'terms',        'Terms',             10),
    (org, 'supplier', 'price-list',   'Price List',        20),
    (org, 'supplier', 'certificates', 'Certificates',      30),
    (org, 'supplier', 'datasheets',   'Datasheets',        40),
    (org, 'supplier', 'other',        'Other',            999)
  on conflict do nothing;
end $$;
create or replace function public.on_organisation_created_suppliers()
returns trigger language plpgsql security definer set search_path = public as $$
begin perform public.seed_org_supplier_defaults(new.id); return new; end $$;
create trigger organisations_seed_suppliers after insert on public.organisations for each row execute function public.on_organisation_created_suppliers();
do $$ declare o record; begin for o in select id from public.organisations loop perform public.seed_org_supplier_defaults(o.id); end loop; end $$;

-- ============================================================================
-- 0005 — Phase 5: VAT rates, quote catalogue, quotations + items, revisions,
--        server-side totals, customer tokens, RLS.
-- ============================================================================

create type public.quote_status as enum ('draft', 'sent', 'viewed', 'accepted', 'rejected', 'expired', 'superseded');

-- ---------- VAT rates (configurable per org; never hardcode 20%) -----------
create table public.vat_rates (
  id              uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  key             text not null,
  label           text not null,
  rate            numeric(5,2) not null check (rate >= 0 and rate <= 100),
  is_default      boolean not null default false,
  active          boolean not null default true,
  sort_order      int not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (organisation_id, key)
);
create unique index vat_rates_one_default on public.vat_rates (organisation_id) where is_default;
create trigger vat_rates_updated_at before update on public.vat_rates for each row execute function public.set_updated_at();

-- ---------- catalogue --------------------------------------------------------
create table public.catalogue_items (
  id              uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  name            text not null,
  category        text not null default 'other',   -- equipment|labour|installation|catering|transport|materials|professional_services|other
  description     text,
  unit            text not null default 'each',
  cost_price      numeric(12,2) not null default 0 check (cost_price >= 0),
  sell_price      numeric(12,2) not null default 0 check (sell_price >= 0),
  vat_rate_key    text not null default 'standard',
  equipment_id    uuid,                              -- FK added in Phase 10
  active          boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index catalogue_items_org_idx on public.catalogue_items (organisation_id, category) where active;
create trigger catalogue_items_updated_at before update on public.catalogue_items for each row execute function public.set_updated_at();

-- ---------- quotes -----------------------------------------------------------
create table public.quotes (
  id                   uuid primary key default gen_random_uuid(),
  organisation_id      uuid not null references public.organisations(id) on delete cascade,
  quote_number         text not null,                -- OAR-Q-YYYY-#### (same across revisions)
  revision             int not null default 0 check (revision >= 0),
  root_quote_id        uuid references public.quotes(id) on delete set null,   -- first revision in the chain
  supersedes_quote_id  uuid references public.quotes(id) on delete set null,
  status               public.quote_status not null default 'draft',
  client_id            uuid not null references public.clients(id) on delete restrict,
  contact_id           uuid references public.client_contacts(id) on delete set null,
  project_id           uuid references public.projects(id) on delete set null,
  lead_id              uuid references public.leads(id) on delete set null,
  title                text not null,
  currency             char(3) not null default 'GBP',
  issue_date           date not null default current_date,
  expiry_date          date not null default (current_date + 30),
  discount_pct         numeric(5,2) not null default 0 check (discount_pct >= 0 and discount_pct <= 100),
  -- calculated by recalculate_quote(); never trusted from the client
  subtotal             numeric(12,2) not null default 0,
  discount_amount      numeric(12,2) not null default 0,
  vat_amount           numeric(12,2) not null default 0,
  total                numeric(12,2) not null default 0,
  cost_total           numeric(12,2) not null default 0,
  scope_notes          text,                          -- customer-facing
  terms                text,                          -- customer-facing
  internal_notes       text,
  public_token         text not null unique default encode(gen_random_bytes(24), 'hex'),
  sent_at              timestamptz,
  viewed_at            timestamptz,
  accepted_at          timestamptz,
  rejected_at          timestamptz,
  decision_name        text,
  decision_note        text,
  converted_project_id uuid references public.projects(id) on delete set null,
  converted_invoice_id uuid,                          -- FK added in 0006
  created_by           uuid references auth.users(id) on delete set null,
  archived_at          timestamptz,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  unique (organisation_id, quote_number, revision),
  check (expiry_date >= issue_date)
);
create index quotes_org_status_idx on public.quotes (organisation_id, status) where archived_at is null;
create index quotes_client_idx on public.quotes (client_id);
create index quotes_project_idx on public.quotes (project_id);
create trigger quotes_updated_at before update on public.quotes for each row execute function public.set_updated_at();

create or replace function public.quotes_assign_number()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.quote_number is null or new.quote_number = '' then
    new.quote_number := public.next_document_number(new.organisation_id, 'quote', 'OAR-Q');
  end if;
  if new.root_quote_id is null then new.root_quote_id := new.id; end if;
  return new;
end $$;
create trigger quotes_assign_number before insert on public.quotes for each row execute function public.quotes_assign_number();

create table public.quote_items (
  id                uuid primary key default gen_random_uuid(),
  organisation_id   uuid not null references public.organisations(id) on delete cascade,
  quote_id          uuid not null references public.quotes(id) on delete cascade,
  position          int not null default 0,
  catalogue_item_id uuid references public.catalogue_items(id) on delete set null,
  description       text not null,
  category          text not null default 'other',
  quantity          numeric(12,3) not null default 1 check (quantity >= 0),
  unit              text not null default 'each',
  cost_price        numeric(12,2) not null default 0 check (cost_price >= 0),   -- NEVER customer-facing
  sell_price        numeric(12,2) not null default 0 check (sell_price >= 0),
  discount_pct      numeric(5,2) not null default 0 check (discount_pct >= 0 and discount_pct <= 100),
  vat_rate          numeric(5,2) not null default 20 check (vat_rate >= 0),     -- snapshot at time of quoting
  -- calculated
  line_net          numeric(12,2) not null default 0,
  line_vat          numeric(12,2) not null default 0,
  line_total        numeric(12,2) not null default 0,
  internal_notes    text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create index quote_items_quote_idx on public.quote_items (quote_id, position);
create trigger quote_items_updated_at before update on public.quote_items for each row execute function public.set_updated_at();

-- ---------- calculation (single source of truth; mirrored in src/lib/money/calc.ts) ----
-- Line: net = round(qty * sell * (1 - line_disc%) * (1 - quote_disc%), 2); vat = round(net * rate%, 2)
-- Quote: subtotal = sum(qty*sell*(1-line_disc%)) ; discount_amount = subtotal - sum(net) ; vat = sum(vat) ; total = sum(net)+vat
create or replace function public.recalculate_quote(p_quote_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare q_disc numeric(5,2); v_sub numeric(12,2); v_net numeric(12,2); v_vat numeric(12,2); v_cost numeric(12,2); prev_guard text;
begin
  select discount_pct into q_disc from public.quotes where id = p_quote_id;
  if q_disc is null then return; end if;
  prev_guard := coalesce(current_setting('app.bypass_quote_guard', true), 'off');
  perform set_config('app.bypass_quote_guard', 'on', true);

  update public.quote_items i set
    line_net   = round(i.quantity * i.sell_price * (1 - i.discount_pct / 100) * (1 - q_disc / 100), 2),
    line_vat   = round(round(i.quantity * i.sell_price * (1 - i.discount_pct / 100) * (1 - q_disc / 100), 2) * i.vat_rate / 100, 2),
    line_total = round(i.quantity * i.sell_price * (1 - i.discount_pct / 100) * (1 - q_disc / 100), 2)
               + round(round(i.quantity * i.sell_price * (1 - i.discount_pct / 100) * (1 - q_disc / 100), 2) * i.vat_rate / 100, 2)
  where i.quote_id = p_quote_id;

  select coalesce(sum(round(quantity * sell_price * (1 - discount_pct / 100), 2)), 0),
         coalesce(sum(line_net), 0), coalesce(sum(line_vat), 0), coalesce(sum(round(quantity * cost_price, 2)), 0)
    into v_sub, v_net, v_vat, v_cost
    from public.quote_items where quote_id = p_quote_id;

  update public.quotes set subtotal = v_sub, discount_amount = v_sub - v_net, vat_amount = v_vat, total = v_net + v_vat, cost_total = v_cost
   where id = p_quote_id;
  perform set_config('app.bypass_quote_guard', prev_guard, true);
end $$;

create or replace function public.quote_items_recalc()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform public.recalculate_quote(coalesce(new.quote_id, old.quote_id));
  return null;
end $$;
-- Only user-editable columns retrigger (the recalc itself writes line_* columns).
create trigger quote_items_recalc after insert or delete or update of quantity, sell_price, cost_price, discount_pct, vat_rate on public.quote_items
  for each row execute function public.quote_items_recalc();

create or replace function public.quotes_recalc_on_discount()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.discount_pct is distinct from old.discount_pct then perform public.recalculate_quote(new.id); end if;
  return null;
end $$;
create trigger quotes_recalc_on_discount after update of discount_pct on public.quotes
  for each row execute function public.quotes_recalc_on_discount();

-- ---------- immutability: items only editable while draft ---------------------
create or replace function public.quote_items_guard()
returns trigger language plpgsql security definer set search_path = public as $$
declare s public.quote_status;
begin
  select status into s from public.quotes where id = coalesce(new.quote_id, old.quote_id);
  if s <> 'draft' and current_setting('app.bypass_quote_guard', true) is distinct from 'on' then
    raise exception 'Quote is % — create a revision to change it', s using errcode = 'check_violation';
  end if;
  return coalesce(new, old);
end $$;
create trigger quote_items_guard before insert or update or delete on public.quote_items
  for each row execute function public.quote_items_guard();

-- ---------- status transitions + audit --------------------------------------
create or replace function public.quotes_audit()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    insert into public.activity_logs (organisation_id, user_id, entity_type, entity_id, action, metadata)
    values (new.organisation_id, auth.uid(), 'quotes', new.id, 'quotes.created', jsonb_build_object('number', new.quote_number, 'revision', new.revision));
    if new.client_id is not null then
      insert into public.activity_logs (organisation_id, user_id, entity_type, entity_id, action, metadata)
      values (new.organisation_id, auth.uid(), 'client', new.client_id, 'quotes.created', jsonb_build_object('quote_id', new.id, 'number', new.quote_number));
    end if;
  elsif new.status is distinct from old.status then
    insert into public.activity_logs (organisation_id, user_id, entity_type, entity_id, action, metadata)
    values (new.organisation_id, auth.uid(), 'quotes', new.id, 'quotes.' || new.status::text, jsonb_build_object('from', old.status, 'number', new.quote_number, 'total', new.total));
  elsif new.total is distinct from old.total and old.status <> 'draft' then
    insert into public.activity_logs (organisation_id, user_id, entity_type, entity_id, action, metadata)
    values (new.organisation_id, auth.uid(), 'quotes', new.id, 'quotes.amount_changed', jsonb_build_object('from', old.total, 'to', new.total));
  end if;
  return new;
end $$;
create trigger quotes_audit after insert or update on public.quotes for each row execute function public.quotes_audit();

-- ---------- revisions -----------------------------------------------------
-- Copies a quote (items included) as revision N+1 in draft; marks the source superseded.
create or replace function public.create_quote_revision(p_quote_id uuid)
returns uuid language plpgsql security definer set search_path = public as $$
declare src public.quotes%rowtype; new_id uuid; next_rev int;
begin
  select * into src from public.quotes where id = p_quote_id;
  if not found then raise exception 'quote not found' using errcode = 'P0002'; end if;
  if not public.role_in(src.organisation_id, 'owner','administrator','finance') then raise exception 'not permitted' using errcode = '42501'; end if;
  if src.status in ('accepted') then raise exception 'Accepted quotes cannot be revised — issue a new quote' using errcode = 'check_violation'; end if;
  select coalesce(max(revision), 0) + 1 into next_rev from public.quotes where root_quote_id = src.root_quote_id;

  insert into public.quotes (organisation_id, quote_number, revision, root_quote_id, supersedes_quote_id, status, client_id, contact_id, project_id, lead_id, title, currency,
                             issue_date, expiry_date, discount_pct, scope_notes, terms, internal_notes, created_by)
  values (src.organisation_id, src.quote_number, next_rev, src.root_quote_id, src.id, 'draft', src.client_id, src.contact_id, src.project_id, src.lead_id, src.title, src.currency,
          current_date, greatest(current_date + 30, src.expiry_date), src.discount_pct, src.scope_notes, src.terms, src.internal_notes, auth.uid())
  returning id into new_id;

  insert into public.quote_items (organisation_id, quote_id, position, catalogue_item_id, description, category, quantity, unit, cost_price, sell_price, discount_pct, vat_rate, internal_notes)
  select organisation_id, new_id, position, catalogue_item_id, description, category, quantity, unit, cost_price, sell_price, discount_pct, vat_rate, internal_notes
    from public.quote_items where quote_id = src.id order by position;

  if src.status <> 'draft' then
    update public.quotes set status = 'superseded' where id = src.id;
  end if;
  return new_id;
end $$;
revoke all on function public.create_quote_revision(uuid) from public;
grant execute on function public.create_quote_revision(uuid) to authenticated;

-- ---------- quote → project --------------------------------------------------
create or replace function public.convert_quote_to_project(p_quote_id uuid, p_project_manager uuid default null, p_site_id uuid default null)
returns uuid language plpgsql security definer set search_path = public as $$
declare q public.quotes%rowtype; pid uuid;
begin
  select * into q from public.quotes where id = p_quote_id;
  if not found then raise exception 'quote not found' using errcode = 'P0002'; end if;
  if not public.role_in(q.organisation_id, 'owner','administrator') then raise exception 'not permitted' using errcode = '42501'; end if;
  if q.status <> 'accepted' then raise exception 'Only accepted quotes can be converted' using errcode = 'check_violation'; end if;
  if q.converted_project_id is not null then return q.converted_project_id; end if;
  if q.project_id is not null then
    -- attach to the existing project and lift its commercials from the quote
    update public.projects set contract_value = q.total - q.vat_amount, estimated_cost = q.cost_total, status = case when status in ('lead','quoted') then 'approved' else status end where id = q.project_id;
    pid := q.project_id;
  else
    insert into public.projects (organisation_id, name, status, client_id, site_id, lead_id, project_manager_id, contract_value, estimated_cost, created_by)
    values (q.organisation_id, q.title, 'approved', q.client_id, p_site_id, q.lead_id, p_project_manager, q.total - q.vat_amount, q.cost_total, auth.uid())
    returning id into pid;
  end if;
  update public.quotes set converted_project_id = pid, project_id = pid where id = q.id;
  if q.lead_id is not null then
    update public.leads set status = 'won', converted_project_id = coalesce(converted_project_id, pid) where id = q.lead_id;
  end if;
  return pid;
end $$;
revoke all on function public.convert_quote_to_project(uuid, uuid, uuid) from public;
grant execute on function public.convert_quote_to_project(uuid, uuid, uuid) to authenticated;

-- ---------- customer decision via public token (anon-safe RPC) --------------
-- Runs as definer; exposes nothing but the outcome. Called from the /q/[token] page.
create or replace function public.quote_customer_decision(p_token text, p_decision text, p_name text, p_note text default null)
returns boolean language plpgsql security definer set search_path = public as $$
declare q public.quotes%rowtype;
begin
  select * into q from public.quotes where public_token = p_token and archived_at is null;
  if not found then return false; end if;
  if q.status not in ('sent', 'viewed') then return false; end if;
  if q.expiry_date < current_date then update public.quotes set status = 'expired' where id = q.id; return false; end if;
  if p_decision = 'accept' then
    update public.quotes set status = 'accepted', accepted_at = now(), decision_name = left(p_name, 120), decision_note = left(p_note, 2000) where id = q.id;
  elsif p_decision = 'decline' then
    update public.quotes set status = 'rejected', rejected_at = now(), decision_name = left(p_name, 120), decision_note = left(p_note, 2000) where id = q.id;
  else
    return false;
  end if;
  return true;
end $$;
revoke all on function public.quote_customer_decision(text, text, text, text) from public;
-- executed by the service role from server code only

create or replace function public.quote_mark_viewed(p_token text)
returns void language plpgsql security definer set search_path = public as $$
begin
  update public.quotes set status = 'viewed', viewed_at = coalesce(viewed_at, now()) where public_token = p_token and status = 'sent';
  update public.quotes set viewed_at = coalesce(viewed_at, now()) where public_token = p_token and viewed_at is null;
end $$;
revoke all on function public.quote_mark_viewed(text) from public;

-- ---------- seed defaults per org ------------------------------------------------
create or replace function public.seed_org_finance_defaults(org uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  insert into public.vat_rates (organisation_id, key, label, rate, is_default, sort_order) values
    (org, 'standard', 'Standard 20%', 20, true, 10),
    (org, 'reduced',  'Reduced 5%',    5, false, 20),
    (org, 'zero',     'Zero 0%',       0, false, 30),
    (org, 'exempt',   'Exempt',        0, false, 40)
  on conflict do nothing;
end $$;
create or replace function public.on_organisation_created_finance()
returns trigger language plpgsql security definer set search_path = public as $$
begin perform public.seed_org_finance_defaults(new.id); return new; end $$;
create trigger organisations_seed_finance after insert on public.organisations for each row execute function public.on_organisation_created_finance();
do $$ declare o record; begin for o in select id from public.organisations loop perform public.seed_org_finance_defaults(o.id); end loop; end $$;

-- ---------- RLS ------------------------------------------------------------------
alter table public.vat_rates enable row level security;
alter table public.catalogue_items enable row level security;
alter table public.quotes enable row level security;
alter table public.quote_items enable row level security;

create policy vat_rates_select on public.vat_rates for select to authenticated using (public.is_org_member(organisation_id));
create policy vat_rates_write on public.vat_rates for all to authenticated
  using (public.role_in(organisation_id, 'owner','administrator','finance')) with check (public.role_in(organisation_id, 'owner','administrator','finance'));

create policy catalogue_select on public.catalogue_items for select to authenticated
  using (public.role_in(organisation_id, 'owner','administrator','finance','project_manager','read_only'));
create policy catalogue_write on public.catalogue_items for all to authenticated
  using (public.role_in(organisation_id, 'owner','administrator','finance')) with check (public.role_in(organisation_id, 'owner','administrator','finance'));

-- quotes: sales_read reads; sales_write writes; PMs see quotes on their projects
create policy quotes_select on public.quotes for select to authenticated using (
  public.role_in(organisation_id, 'owner','administrator','finance','read_only')
  or (project_id is not null and public.can_read_project(project_id))
);
create policy quotes_insert on public.quotes for insert to authenticated with check (public.role_in(organisation_id, 'owner','administrator','finance'));
create policy quotes_update on public.quotes for update to authenticated
  using (public.role_in(organisation_id, 'owner','administrator','finance')) with check (public.role_in(organisation_id, 'owner','administrator','finance'));

create policy quote_items_select on public.quote_items for select to authenticated using (
  exists (select 1 from public.quotes q where q.id = quote_id and (
    public.role_in(q.organisation_id, 'owner','administrator','finance','read_only') or (q.project_id is not null and public.can_read_project(q.project_id))))
);
create policy quote_items_write on public.quote_items for all to authenticated
  using (public.role_in(organisation_id, 'owner','administrator','finance')) with check (public.role_in(organisation_id, 'owner','administrator','finance'));

-- ---------- atomic line replacement (builder save) ---------------------------
create or replace function public.replace_quote_items(p_quote_id uuid, p_items jsonb)
returns void language plpgsql security definer set search_path = public as $$
declare q public.quotes%rowtype;
begin
  select * into q from public.quotes where id = p_quote_id;
  if not found then raise exception 'quote not found' using errcode = 'P0002'; end if;
  if not public.role_in(q.organisation_id, 'owner','administrator','finance') then raise exception 'not permitted' using errcode = '42501'; end if;
  if q.status <> 'draft' then raise exception 'Quote is not a draft' using errcode = 'check_violation'; end if;
  delete from public.quote_items where quote_id = p_quote_id;
  insert into public.quote_items (organisation_id, quote_id, position, catalogue_item_id, description, category, quantity, unit, cost_price, sell_price, discount_pct, vat_rate, internal_notes)
  select q.organisation_id, p_quote_id, (i.ord - 1)::int, nullif(i.item->>'catalogue_item_id','')::uuid,
         left(i.item->>'description', 500), coalesce(nullif(i.item->>'category',''), 'other'),
         coalesce((i.item->>'quantity')::numeric, 1), coalesce(nullif(i.item->>'unit',''), 'each'),
         coalesce((i.item->>'cost_price')::numeric, 0), coalesce((i.item->>'sell_price')::numeric, 0),
         coalesce((i.item->>'discount_pct')::numeric, 0), coalesce((i.item->>'vat_rate')::numeric, 0), nullif(i.item->>'internal_notes','')
  from jsonb_array_elements(p_items) with ordinality as i(item, ord)
  where coalesce(i.item->>'description','') <> '';
  perform public.recalculate_quote(p_quote_id);
end $$;
revoke all on function public.replace_quote_items(uuid, jsonb) from public;
grant execute on function public.replace_quote_items(uuid, jsonb) to authenticated;

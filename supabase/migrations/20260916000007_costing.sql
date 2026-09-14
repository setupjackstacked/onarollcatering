-- ============================================================================
-- 0007 — Phase 7: project costing — cost categories, estimates by category,
--        expenses (committed / actual), project financial view v2.
-- ============================================================================

create type public.cost_category as enum (
  'labour', 'food', 'equipment', 'materials', 'transport', 'accommodation', 'subcontractors', 'hire', 'utilities', 'other'
);
-- pending: raised, awaiting finance; committed: approved / PO raised, not yet incurred;
-- actual: incurred (invoice received); paid: settled; rejected: not a cost.
create type public.expense_status as enum ('pending', 'committed', 'actual', 'paid', 'rejected');

-- ---------- estimates by category (per project) ----------------------------
create table public.project_cost_estimates (
  id              uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  project_id      uuid not null references public.projects(id) on delete cascade,
  category        public.cost_category not null,
  amount          numeric(12,2) not null default 0 check (amount >= 0),
  notes           text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (project_id, category)
);
create trigger project_cost_estimates_updated_at before update on public.project_cost_estimates for each row execute function public.set_updated_at();

-- Keep projects.estimated_cost = sum of category estimates once any exist.
create or replace function public.project_estimates_rollup()
returns trigger language plpgsql security definer set search_path = public as $$
declare pid uuid := coalesce(new.project_id, old.project_id);
begin
  update public.projects set estimated_cost = coalesce((select sum(amount) from public.project_cost_estimates where project_id = pid), 0) where id = pid;
  return null;
end $$;
create trigger project_cost_estimates_rollup after insert or update or delete on public.project_cost_estimates
  for each row execute function public.project_estimates_rollup();

-- ---------- expenses ---------------------------------------------------------
create table public.expenses (
  id              uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  project_id      uuid references public.projects(id) on delete set null,      -- null = overhead
  supplier_id     uuid,                                                          -- FK added in Phase 10
  supplier_name   text,                                                          -- free text until suppliers exist
  category        public.cost_category not null default 'other',
  expense_date    date not null default current_date,
  description     text not null check (length(description) between 1 and 500),
  net             numeric(12,2) not null default 0 check (net >= 0),
  vat             numeric(12,2) not null default 0 check (vat >= 0),
  gross           numeric(12,2) generated always as (net + vat) stored,
  reference       text,
  receipt_document_id uuid references public.documents(id) on delete set null,
  status          public.expense_status not null default 'pending',
  employee_id     uuid,                                                          -- FK added in Phase 8 (staff expense claims)
  notes           text,
  approved_by     uuid references auth.users(id) on delete set null,
  approved_at     timestamptz,
  created_by      uuid references auth.users(id) on delete set null,
  archived_at     timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index expenses_org_date_idx on public.expenses (organisation_id, expense_date desc) where archived_at is null;
create index expenses_project_idx on public.expenses (project_id, status) where archived_at is null;
create trigger expenses_updated_at before update on public.expenses for each row execute function public.set_updated_at();

-- Only finance-level roles may move an expense out of pending / rejected.
create or replace function public.expenses_status_guard()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' and new.status not in ('pending') and not public.role_in(new.organisation_id, 'owner','administrator','finance') then
    raise exception 'Only finance can record approved costs' using errcode = '42501';
  end if;
  if tg_op = 'UPDATE' and new.status is distinct from old.status then
    if not public.role_in(new.organisation_id, 'owner','administrator','finance') then
      raise exception 'Only finance can change the status of a cost' using errcode = '42501';
    end if;
    if new.status in ('committed','actual','paid') and old.status in ('pending','rejected') then
      new.approved_by := auth.uid(); new.approved_at := now();
    end if;
    insert into public.activity_logs (organisation_id, user_id, entity_type, entity_id, action, metadata)
    values (new.organisation_id, auth.uid(), 'expenses', new.id, 'expenses.status_changed', jsonb_build_object('from', old.status, 'to', new.status, 'project_id', new.project_id, 'gross', new.gross));
  end if;
  return new;
end $$;
create trigger expenses_status_guard before insert or update on public.expenses for each row execute function public.expenses_status_guard();

create or replace function public.expenses_audit_insert()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.activity_logs (organisation_id, user_id, entity_type, entity_id, action, metadata)
  values (new.organisation_id, auth.uid(), 'expenses', new.id, 'expenses.created', jsonb_build_object('project_id', new.project_id, 'gross', new.gross, 'category', new.category));
  if new.project_id is not null then
    insert into public.activity_logs (organisation_id, user_id, entity_type, entity_id, action, metadata)
    values (new.organisation_id, auth.uid(), 'projects', new.project_id, 'projects.cost_added', jsonb_build_object('expense_id', new.id, 'gross', new.gross, 'category', new.category));
  end if;
  return new;
end $$;
create trigger expenses_audit after insert on public.expenses for each row execute function public.expenses_audit_insert();

-- ---------- financial view v2 ----------------------------------------------
-- Revenue = contract value (agreed) ; invoiced_net = issued invoices net of VAT (credit notes deducted).
-- Labour from approved timesheets is added to actual cost in Phase 8 (view recreated there).
drop view if exists public.project_financials;
create view public.project_financials with (security_invoker = true) as
select
  p.id as project_id,
  p.organisation_id,
  p.contract_value,
  coalesce(inv.invoiced_net, 0)::numeric(12,2)   as invoiced_net,
  coalesce(inv.received, 0)::numeric(12,2)       as received,
  p.estimated_cost,
  coalesce(ex.committed, 0)::numeric(12,2)       as committed_cost,
  coalesce(ex.actual, 0)::numeric(12,2)          as actual_cost,
  (p.contract_value - p.estimated_cost)::numeric(12,2) as estimated_gross_profit,
  case when p.contract_value > 0 then round((p.contract_value - p.estimated_cost) / p.contract_value * 100, 2) else null end as estimated_margin_pct,
  (p.contract_value - coalesce(ex.actual, 0) - coalesce(ex.committed, 0))::numeric(12,2) as forecast_gross_profit,
  case when p.contract_value > 0 then round((p.contract_value - coalesce(ex.actual, 0) - coalesce(ex.committed, 0)) / p.contract_value * 100, 2) else null end as forecast_margin_pct
from public.projects p
left join lateral (
  select sum(case when e.status = 'committed' then e.net else 0 end) as committed,
         sum(case when e.status in ('actual','paid') then e.net else 0 end) as actual
  from public.expenses e where e.project_id = p.id and e.archived_at is null
) ex on true
left join lateral (
  select sum(case when i.kind = 'credit_note' then -(i.total - i.vat_amount) else (i.total - i.vat_amount) end) as invoiced_net,
         sum(case when i.kind = 'credit_note' then 0 else i.amount_paid end) as received
  from public.invoices i where i.project_id = p.id and i.archived_at is null and i.status not in ('draft','cancelled')
) inv on true;

-- Per-category breakdown (estimate vs committed vs actual) for the project costs tab.
create or replace function public.project_cost_breakdown(p_project_id uuid)
returns table (category public.cost_category, estimated numeric, committed numeric, actual numeric)
language sql stable security invoker set search_path = public as $$
  with cats as (select unnest(enum_range(null::public.cost_category)) as category)
  select c.category,
         coalesce((select amount from public.project_cost_estimates est where est.project_id = p_project_id and est.category = c.category), 0)::numeric(12,2),
         coalesce((select sum(net) from public.expenses e where e.project_id = p_project_id and e.archived_at is null and e.category = c.category and e.status = 'committed'), 0)::numeric(12,2),
         coalesce((select sum(net) from public.expenses e where e.project_id = p_project_id and e.archived_at is null and e.category = c.category and e.status in ('actual','paid')), 0)::numeric(12,2)
  from cats c
  where public.can_read_project(p_project_id)
  order by c.category;
$$;

-- Seed category estimates from an accepted quote's line costs (quote categories → cost categories).
create or replace function public.map_quote_category(p text) returns public.cost_category language sql immutable as $$
  select case p
    when 'labour' then 'labour'::public.cost_category
    when 'installation' then 'subcontractors'::public.cost_category
    when 'equipment' then 'equipment'::public.cost_category
    when 'catering' then 'food'::public.cost_category
    when 'transport' then 'transport'::public.cost_category
    when 'materials' then 'materials'::public.cost_category
    else 'other'::public.cost_category end;
$$;

create or replace function public.seed_estimates_from_quote(p_project_id uuid, p_quote_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  insert into public.project_cost_estimates (organisation_id, project_id, category, amount, notes)
  select q.organisation_id, p_project_id, public.map_quote_category(qi.category), sum(qi.cost_price * qi.quantity), 'From quotation ' || q.quote_number
  from public.quote_items qi join public.quotes q on q.id = qi.quote_id
  where qi.quote_id = p_quote_id
  group by q.organisation_id, public.map_quote_category(qi.category), q.quote_number
  on conflict (project_id, category) do update set amount = excluded.amount, notes = excluded.notes;
end $$;
revoke all on function public.seed_estimates_from_quote(uuid, uuid) from public;

-- Patch conversion so estimates arrive with the project.
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
    update public.projects set contract_value = q.total - q.vat_amount, estimated_cost = q.cost_total, status = case when status in ('lead','quoted') then 'approved' else status end where id = q.project_id;
    pid := q.project_id;
  else
    insert into public.projects (organisation_id, name, status, client_id, site_id, lead_id, project_manager_id, contract_value, estimated_cost, created_by)
    values (q.organisation_id, q.title, 'approved', q.client_id, p_site_id, q.lead_id, p_project_manager, q.total - q.vat_amount, q.cost_total, auth.uid())
    returning id into pid;
  end if;
  perform public.seed_estimates_from_quote(pid, q.id);
  update public.quotes set converted_project_id = pid, project_id = pid where id = q.id;
  if q.lead_id is not null then
    update public.leads set status = 'won', converted_project_id = coalesce(converted_project_id, pid) where id = q.lead_id;
  end if;
  return pid;
end $$;

-- ---------- RLS ------------------------------------------------------------
alter table public.project_cost_estimates enable row level security;
alter table public.expenses enable row level security;

create policy estimates_select on public.project_cost_estimates for select to authenticated using (public.can_read_project(project_id));
create policy estimates_write on public.project_cost_estimates for all to authenticated
  using (public.can_write_project(project_id) or public.role_in(organisation_id, 'finance'))
  with check (public.can_write_project(project_id) or public.role_in(organisation_id, 'finance'));

-- finance-level roles see everything; PMs see costs on their projects; read_only sees all (no mutations).
create policy expenses_select on public.expenses for select to authenticated using (
  public.role_in(organisation_id, 'owner','administrator','finance','read_only')
  or (project_id is not null and public.can_read_project(project_id))
);
create policy expenses_insert on public.expenses for insert to authenticated with check (
  created_by = auth.uid() and (
    public.role_in(organisation_id, 'owner','administrator','finance')
    or (project_id is not null and public.can_write_project(project_id))
  )
);
create policy expenses_update on public.expenses for update to authenticated using (
  public.role_in(organisation_id, 'owner','administrator','finance')
  or (project_id is not null and public.can_write_project(project_id) and status = 'pending')
) with check (
  public.role_in(organisation_id, 'owner','administrator','finance')
  or (project_id is not null and public.can_write_project(project_id))
);
create policy expenses_delete on public.expenses for delete to authenticated using (public.role_in(organisation_id, 'owner','administrator'));

-- ============================================================================
-- 0022 — Daily food sales, site budgets, and the site P&L.
--
-- How the business actually makes money: On A Roll runs a kitchen inside a
-- client's building and sells food to the people who work there. The client
-- approves the kitchen and its operating budget; the profit is the food sales
-- less what it costs to run the kitchen. So the client invoice (invoices) and
-- the kitchen's trading position (this file) are two different things, and
-- neither belongs inside the other.
--
-- The three sides of a site's P&L:
--   revenue  — daily_sales, entered by the site manager, split by how it was
--              taken so it reconciles against the till
--   food and consumables — expenses, which until now could only be attributed
--              to a project; a kitchen is a site, so expenses gain site_id
--   labour   — already there, from approved timesheets at their snapshot rate
--
-- Staff never see any of it. A manager sees their own sites only. That is
-- enforced in RLS here, not just hidden in the interface.
-- ============================================================================

-- ---------- daily sales ------------------------------------------------------
create table public.daily_sales (
  id              uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  site_id         uuid not null references public.sites(id) on delete cascade,
  sale_date       date not null,
  -- Split by how the money arrived. Held gross, as the till reports it.
  cash            numeric(12,2) not null default 0 check (cash >= 0),
  card            numeric(12,2) not null default 0 check (card >= 0),
  account         numeric(12,2) not null default 0 check (account >= 0),
  total           numeric(12,2) generated always as (cash + card + account) stored,
  transactions    int check (transactions is null or transactions >= 0),
  notes           text,
  recorded_by     uuid references auth.users(id) on delete set null,
  confirmed_by    uuid references auth.users(id) on delete set null,
  confirmed_at    timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (site_id, sale_date)
);
create index daily_sales_org_date_idx on public.daily_sales (organisation_id, sale_date desc);
create index daily_sales_site_date_idx on public.daily_sales (site_id, sale_date desc);
create trigger daily_sales_updated_at before update on public.daily_sales
  for each row execute function public.set_updated_at();

comment on column public.daily_sales.account is
  'Charged to an account rather than paid at the counter — recovered later, so it is revenue on the day it was taken.';

-- Records a day's takings. One call for the whole day, so a partial save can't
-- leave a site with card but no cash.
create or replace function public.record_daily_sales(
  p_site_id uuid,
  p_date date,
  p_cash numeric default 0,
  p_card numeric default 0,
  p_account numeric default 0,
  p_transactions int default null,
  p_notes text default null
) returns uuid language plpgsql security definer set search_path = public as $$
declare v_org uuid; v_id uuid;
begin
  select organisation_id into v_org from public.sites where id = p_site_id;
  if v_org is null then raise exception 'site not found' using errcode = 'P0002'; end if;

  -- Managers of this site, and admins/finance. Deliberately NOT can_read_site:
  -- being able to see a kitchen is not permission to state what it took.
  if not (public.role_in(v_org, 'owner', 'administrator', 'finance')
          or public.can_write_site(p_site_id)) then
    raise exception 'not permitted' using errcode = '42501';
  end if;
  if p_date > current_date then
    raise exception 'A day cannot be recorded before it has happened' using errcode = 'check_violation';
  end if;

  insert into public.daily_sales (organisation_id, site_id, sale_date, cash, card, account, transactions, notes, recorded_by)
  values (v_org, p_site_id, p_date, coalesce(p_cash, 0), coalesce(p_card, 0), coalesce(p_account, 0),
          p_transactions, nullif(trim(coalesce(p_notes, '')), ''), auth.uid())
  on conflict (site_id, sale_date) do update
    set cash = excluded.cash, card = excluded.card, account = excluded.account,
        transactions = excluded.transactions, notes = excluded.notes, recorded_by = auth.uid()
  returning id into v_id;

  return v_id;
end $$;
revoke all on function public.record_daily_sales(uuid, date, numeric, numeric, numeric, int, text) from public;
grant execute on function public.record_daily_sales(uuid, date, numeric, numeric, numeric, int, text) to authenticated;

-- Finance signs a day off. After that the figure stops moving, because it has
-- been reconciled against the bank and reported on.
create or replace function public.confirm_daily_sales(p_site_id uuid, p_date date)
returns void language plpgsql security definer set search_path = public as $$
declare v_org uuid;
begin
  select organisation_id into v_org from public.sites where id = p_site_id;
  if v_org is null then raise exception 'site not found' using errcode = 'P0002'; end if;
  if not public.role_in(v_org, 'owner', 'administrator', 'finance') then
    raise exception 'not permitted' using errcode = '42501';
  end if;
  update public.daily_sales set confirmed_by = auth.uid(), confirmed_at = now()
   where site_id = p_site_id and sale_date = p_date;
end $$;
revoke all on function public.confirm_daily_sales(uuid, date) from public;
grant execute on function public.confirm_daily_sales(uuid, date) to authenticated;

-- A confirmed day is evidence. Nobody edits it back open without finance.
create or replace function public.daily_sales_confirmed_guard()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if old.confirmed_at is not null
     and (new.cash is distinct from old.cash or new.card is distinct from old.card
          or new.account is distinct from old.account)
     and new.confirmed_at is not distinct from old.confirmed_at
     and auth.uid() is not null
     and not public.role_in(old.organisation_id, 'owner', 'administrator', 'finance') then
    raise exception 'That day has been signed off. Ask finance to reopen it.' using errcode = 'check_violation';
  end if;
  return new;
end $$;
create trigger daily_sales_confirmed before update on public.daily_sales
  for each row execute function public.daily_sales_confirmed_guard();

-- ---------- the approved operating budget ------------------------------------
-- What the client signed off for this kitchen, per month. Actual spend is
-- measured against it rather than against a number in somebody's head.
create table public.site_budgets (
  id              uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  site_id         uuid not null references public.sites(id) on delete cascade,
  month           date not null,                                  -- first of the month
  food_budget     numeric(12,2) not null default 0 check (food_budget >= 0),
  labour_budget   numeric(12,2) not null default 0 check (labour_budget >= 0),
  other_budget    numeric(12,2) not null default 0 check (other_budget >= 0),
  revenue_target  numeric(12,2) not null default 0 check (revenue_target >= 0),
  total_budget    numeric(12,2) generated always as (food_budget + labour_budget + other_budget) stored,
  approved_by_client boolean not null default false,
  notes           text,
  created_by      uuid references auth.users(id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (site_id, month)
);
create index site_budgets_org_month_idx on public.site_budgets (organisation_id, month desc);
create trigger site_budgets_updated_at before update on public.site_budgets
  for each row execute function public.set_updated_at();

-- ---------- expenses belong to a kitchen, not only to a project ---------------
-- Food and consumables are bought for a site. Without this the cost side of the
-- P&L has nowhere to land.
alter table public.expenses add column if not exists site_id uuid references public.sites(id) on delete set null;
create index if not exists expenses_site_idx on public.expenses (site_id, expense_date desc) where archived_at is null;

-- ---------- the P&L ----------------------------------------------------------
-- One row per site for the period: what it took, what it cost, what is left.
-- security invoker, so a manager calling it sees only their own sites and an
-- administrator sees all of them — the same query, different answers.
create or replace function public.report_site_pl(p_org uuid, p_from date, p_to date)
returns table (
  site_id        uuid,
  site_name      text,
  revenue        numeric,
  cash           numeric,
  card           numeric,
  account        numeric,
  trading_days   bigint,
  food_cost      numeric,
  other_cost     numeric,
  labour_cost    numeric,
  total_cost     numeric,
  gross_profit   numeric,
  margin_pct     numeric,
  budget         numeric,
  budget_variance numeric
)
language sql stable security invoker set search_path = public as $$
  with sales as (
    select d.site_id,
           coalesce(sum(d.total), 0)   as revenue,
           coalesce(sum(d.cash), 0)    as cash,
           coalesce(sum(d.card), 0)    as card,
           coalesce(sum(d.account), 0) as account,
           count(*)                    as trading_days
      from public.daily_sales d
     where d.organisation_id = p_org and d.sale_date between p_from and p_to
     group by d.site_id
  ),
  costs as (
    select e.site_id,
           coalesce(sum(e.net) filter (where e.category = 'materials'), 0) as food_cost,
           coalesce(sum(e.net) filter (where e.category <> 'materials'), 0) as other_cost
      from public.expenses e
     where e.organisation_id = p_org and e.archived_at is null
       and e.status <> 'rejected'
       and e.site_id is not null
       and e.expense_date between p_from and p_to
     group by e.site_id
  ),
  labour as (
    select t.site_id,
           coalesce(sum((t.hours + t.overtime_hours) * coalesce(t.hourly_rate, 0)), 0) as labour_cost
      from public.timesheets t
     where t.organisation_id = p_org and t.status in ('approved', 'paid')
       and t.site_id is not null
       and t.work_date between p_from and p_to
     group by t.site_id
  ),
  budgets as (
    select b.site_id, coalesce(sum(b.total_budget), 0) as budget
      from public.site_budgets b
     where b.organisation_id = p_org
       and b.month between date_trunc('month', p_from)::date and date_trunc('month', p_to)::date
     group by b.site_id
  )
  select s.id, s.name,
         coalesce(sa.revenue, 0)::numeric(12,2),
         coalesce(sa.cash, 0)::numeric(12,2),
         coalesce(sa.card, 0)::numeric(12,2),
         coalesce(sa.account, 0)::numeric(12,2),
         coalesce(sa.trading_days, 0),
         coalesce(c.food_cost, 0)::numeric(12,2),
         coalesce(c.other_cost, 0)::numeric(12,2),
         coalesce(l.labour_cost, 0)::numeric(12,2),
         (coalesce(c.food_cost, 0) + coalesce(c.other_cost, 0) + coalesce(l.labour_cost, 0))::numeric(12,2),
         (coalesce(sa.revenue, 0) - coalesce(c.food_cost, 0) - coalesce(c.other_cost, 0) - coalesce(l.labour_cost, 0))::numeric(12,2),
         case when coalesce(sa.revenue, 0) > 0
              then round(((coalesce(sa.revenue, 0) - coalesce(c.food_cost, 0) - coalesce(c.other_cost, 0)
                           - coalesce(l.labour_cost, 0)) / sa.revenue) * 100, 1)
              else null end,
         coalesce(b.budget, 0)::numeric(12,2),
         -- Positive means under budget, which is the direction that is good news.
         (coalesce(b.budget, 0) - (coalesce(c.food_cost, 0) + coalesce(c.other_cost, 0)
                                   + coalesce(l.labour_cost, 0)))::numeric(12,2)
    from public.sites s
    left join sales   sa on sa.site_id = s.id
    left join costs   c  on c.site_id  = s.id
    left join labour  l  on l.site_id  = s.id
    left join budgets b  on b.site_id  = s.id
   where s.organisation_id = p_org
     and s.archived_at is null
     and s.site_type = 'kitchen'
   order by 3 desc;
$$;

-- Day-by-day takings for one site, for the trend on the site page.
create or replace function public.report_daily_sales(p_site_id uuid, p_from date, p_to date)
returns table (sale_date date, cash numeric, card numeric, account numeric, total numeric,
               transactions int, confirmed boolean)
language sql stable security invoker set search_path = public as $$
  select d.sale_date, d.cash, d.card, d.account, d.total, d.transactions, d.confirmed_at is not null
    from public.daily_sales d
   where d.site_id = p_site_id and d.sale_date between p_from and p_to
   order by d.sale_date desc;
$$;

-- Kitchens that traded but recorded nothing. Feeds the nightly sweep.
create or replace function public.sites_missing_sales(p_org uuid, p_date date default (current_date - 1))
returns table (site_id uuid, site_name text)
language sql stable security invoker set search_path = public as $$
  select s.id, s.name
    from public.sites s
   where s.organisation_id = p_org and s.archived_at is null
     and s.site_type = 'kitchen' and s.status = 'operating'
     and not exists (select 1 from public.daily_sales d where d.site_id = s.id and d.sale_date = p_date)
   order by s.name;
$$;

-- ---------- keep the profile email in step with the login ---------------------
-- profiles.email was only ever written when the account was created, so
-- changing an address in Supabase left the team list showing the old one. It
-- is a display field, but a stale one is worse than none.
create or replace function public.sync_profile_email()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.email is distinct from old.email then
    update public.profiles set email = new.email where id = new.id;
  end if;
  return new;
end $$;
create trigger on_auth_user_email_changed
  after update of email on auth.users
  for each row execute function public.sync_profile_email();

-- Repair anything that has already drifted.
update public.profiles p
   set email = u.email
  from auth.users u
 where u.id = p.id and p.email is distinct from u.email;

-- ---------- RLS ---------------------------------------------------------------
alter table public.daily_sales  enable row level security;
alter table public.site_budgets enable row level security;

-- Money is not staff-visible. There is no branch here for "assigned to the
-- site" — only managing it, or being finance-level.
create policy daily_sales_select on public.daily_sales for select to authenticated using (
  public.role_in(organisation_id, 'owner', 'administrator', 'finance', 'read_only')
  or site_id in (select public.my_managed_site_ids())
);
create policy daily_sales_write on public.daily_sales for all to authenticated using (
  public.role_in(organisation_id, 'owner', 'administrator', 'finance')
  or site_id in (select public.my_managed_site_ids())
) with check (
  public.role_in(organisation_id, 'owner', 'administrator', 'finance')
  or site_id in (select public.my_managed_site_ids())
);

-- A manager reads the budget they are working to; only finance sets it.
create policy site_budgets_select on public.site_budgets for select to authenticated using (
  public.role_in(organisation_id, 'owner', 'administrator', 'finance', 'read_only')
  or site_id in (select public.my_managed_site_ids())
);
create policy site_budgets_write on public.site_budgets for all to authenticated
  using (public.role_in(organisation_id, 'owner', 'administrator', 'finance'))
  with check (public.role_in(organisation_id, 'owner', 'administrator', 'finance'));

-- ---------- the nightly sweep also chases missing takings ---------------------
-- A kitchen that traded and recorded nothing is a hole in the P&L that gets
-- harder to fill the longer it is left, so it is chased the next morning.
create or replace function public.generate_operations_alerts(p_org uuid)
returns int language plpgsql security definer set search_path = public as $$
declare n int := 0; r record; today text := current_date::text;
begin
  for r in select * from public.leave_missing_documents(p_org) loop
    n := n + public.notify_roles(p_org, array['owner','administrator'], 'system',
      'Sick note still outstanding', r.employee_name || ' — ' || r.days || ' day(s) from ' || to_char(r.start_date, 'DD Mon'),
      'leave', r.leave_id, '/dashboard/leave', 'sicknote:' || r.leave_id);
  end loop;

  for r in
    select i.id, i.invoice_number, i.workflow_stage,
           current_date - coalesce(i.stage_changed_at, i.created_at)::date as days
      from public.invoices i
     where i.organisation_id = p_org and i.archived_at is null
       and i.status not in ('draft','cancelled','paid')
       and i.workflow_stage not in ('closed','paid')
       and current_date - coalesce(i.stage_changed_at, i.created_at)::date > 21
  loop
    n := n + public.notify_roles(p_org, array['owner','administrator','finance'], 'system',
      'Invoice stalled', r.invoice_number || ' has sat at ' || replace(r.workflow_stage::text, '_', ' ') || ' for ' || r.days || ' days',
      'invoice', r.id, '/dashboard/invoices/' || r.id, 'invoice_stalled:' || r.id || ':' || today);
  end loop;

  for r in select * from public.sites_missing_vouchers(p_org, current_date - 1) loop
    n := n + public.notify_roles(p_org, array['owner','administrator'], 'system',
      'No vouchers logged yesterday', r.site_name,
      'site', r.site_id, '/dashboard/sites/' || r.site_id || '/vouchers',
      'vouchers_missing:' || r.site_id || ':' || today);
  end loop;

  for r in select * from public.sites_missing_sales(p_org, current_date - 1) loop
    n := n + public.notify_roles(p_org, array['owner','administrator','finance'], 'system',
      'No takings recorded yesterday', r.site_name,
      'site', r.site_id, '/dashboard/sites/' || r.site_id || '/sales',
      'sales_missing:' || r.site_id || ':' || today);
  end loop;

  return n;
end $$;
revoke all on function public.generate_operations_alerts(uuid) from public;
grant execute on function public.generate_operations_alerts(uuid) to authenticated;

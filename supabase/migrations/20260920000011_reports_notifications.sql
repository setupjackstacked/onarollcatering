-- ============================================================================
-- 0011 — Phase 11: reporting functions and notification/alert generation.
-- Reports are SQL functions (security invoker) so RLS still decides what each
-- role can see. Notifications are generated idempotently via dedupe_key.
-- ============================================================================

-- ---------- reports ----------------------------------------------------------

-- Revenue by month from issued invoices (credit notes deducted), net of VAT.
create or replace function public.report_revenue_by_month(p_org uuid, p_months int default 12)
returns table (month date, invoiced_net numeric, received numeric)
language sql stable security invoker set search_path = public as $$
  with months as (
    select (date_trunc('month', current_date) - (n || ' months')::interval)::date as month
    from generate_series(0, greatest(p_months, 1) - 1) as n
  )
  select m.month,
         coalesce(sum(case when i.kind = 'credit_note' then -(i.total - i.vat_amount) else (i.total - i.vat_amount) end), 0)::numeric(12,2),
         coalesce(sum(case when i.kind = 'credit_note' then 0 else i.amount_paid end), 0)::numeric(12,2)
  from months m
  left join public.invoices i
    on i.organisation_id = p_org and i.archived_at is null and i.status not in ('draft','cancelled')
   and date_trunc('month', i.issue_date)::date = m.month
  group by m.month
  order by m.month;
$$;

-- Quotes by status, plus value, for the pipeline chart.
create or replace function public.report_quotes_by_status(p_org uuid, p_days int default 365)
returns table (status public.quote_status, quote_count bigint, value numeric)
language sql stable security invoker set search_path = public as $$
  select q.status, count(*), coalesce(sum(q.total), 0)::numeric(12,2)
  from public.quotes q
  where q.organisation_id = p_org and q.archived_at is null
    and q.issue_date >= current_date - make_interval(days => greatest(p_days, 1))
  group by q.status
  order by q.status;
$$;

-- Conversion: accepted vs decided (accepted + rejected + expired), by month.
create or replace function public.report_quote_conversion(p_org uuid, p_months int default 12)
returns table (month date, sent bigint, accepted bigint, accepted_value numeric)
language sql stable security invoker set search_path = public as $$
  with months as (
    select (date_trunc('month', current_date) - (n || ' months')::interval)::date as month
    from generate_series(0, greatest(p_months, 1) - 1) as n
  )
  select m.month,
         count(q.id) filter (where q.status <> 'draft'),
         count(q.id) filter (where q.status = 'accepted'),
         coalesce(sum(q.total) filter (where q.status = 'accepted'), 0)::numeric(12,2)
  from months m
  left join public.quotes q
    on q.organisation_id = p_org and q.archived_at is null
   and date_trunc('month', q.issue_date)::date = m.month
  group by m.month
  order by m.month;
$$;

-- Project profitability: contract value vs committed/actual cost (incl. labour).
create or replace function public.report_project_profitability(p_org uuid)
returns table (
  project_id uuid, project_number text, name text, status public.project_status,
  contract_value numeric, actual_cost numeric, committed_cost numeric, labour_cost numeric,
  forecast_gross_profit numeric, forecast_margin_pct numeric
)
language sql stable security invoker set search_path = public as $$
  select p.id, p.project_number, p.name, p.status,
         f.contract_value, f.actual_cost, f.committed_cost, f.labour_cost,
         f.forecast_gross_profit, f.forecast_margin_pct
  from public.projects p
  join public.project_financials f on f.project_id = p.id
  where p.organisation_id = p_org and p.archived_at is null
  order by f.forecast_margin_pct nulls last;
$$;

-- Outstanding debt, bucketed by how overdue it is.
create or replace function public.report_outstanding_invoices(p_org uuid)
returns table (bucket text, invoice_count bigint, balance numeric)
language sql stable security invoker set search_path = public as $$
  select case
           when i.due_date is null or i.due_date >= current_date then 'Not yet due'
           when current_date - i.due_date <= 30 then '1–30 days'
           when current_date - i.due_date <= 60 then '31–60 days'
           when current_date - i.due_date <= 90 then '61–90 days'
           else '90+ days'
         end as bucket,
         count(*),
         coalesce(sum(i.total - i.amount_paid), 0)::numeric(12,2)
  from public.invoices i
  where i.organisation_id = p_org and i.archived_at is null
    and i.status in ('issued','part_paid','overdue')
  group by 1
  order by 1;
$$;

create or replace function public.report_revenue_by_client(p_org uuid, p_months int default 12)
returns table (client_id uuid, client_name text, invoiced_net numeric, received numeric, outstanding numeric)
language sql stable security invoker set search_path = public as $$
  select c.id, c.name,
         coalesce(sum(case when i.kind = 'credit_note' then -(i.total - i.vat_amount) else (i.total - i.vat_amount) end), 0)::numeric(12,2),
         coalesce(sum(case when i.kind = 'credit_note' then 0 else i.amount_paid end), 0)::numeric(12,2),
         coalesce(sum(case when i.status in ('issued','part_paid','overdue') then i.total - i.amount_paid else 0 end), 0)::numeric(12,2)
  from public.clients c
  join public.invoices i on i.client_id = c.id and i.archived_at is null and i.status not in ('draft','cancelled')
  where c.organisation_id = p_org
    and i.issue_date >= (date_trunc('month', current_date) - make_interval(months => greatest(p_months, 1) - 1))::date
  group by c.id, c.name
  having coalesce(sum(i.total), 0) <> 0
  order by 3 desc;
$$;

-- Labour: approved/paid timesheet hours and cost, by project.
create or replace function public.report_labour_by_project(p_org uuid, p_days int default 90)
returns table (project_id uuid, project_number text, name text, hours numeric, labour_cost numeric)
language sql stable security invoker set search_path = public as $$
  select p.id, p.project_number, p.name,
         coalesce(sum(t.hours + t.overtime_hours), 0)::numeric(10,2),
         coalesce(sum((t.hours + t.overtime_hours) * coalesce(t.hourly_rate, 0)), 0)::numeric(12,2)
  from public.projects p
  join public.timesheets t on t.project_id = p.id and t.status in ('approved','paid')
  where p.organisation_id = p_org
    and t.work_date >= current_date - make_interval(days => greatest(p_days, 1))
  group by p.id, p.project_number, p.name
  order by 5 desc;
$$;

create or replace function public.report_employee_hours(p_org uuid, p_days int default 30)
returns table (employee_id uuid, employee_number text, full_name text, hours numeric, overtime numeric, labour_cost numeric)
language sql stable security invoker set search_path = public as $$
  select e.id, e.employee_number, (e.first_name || ' ' || e.last_name),
         coalesce(sum(t.hours), 0)::numeric(10,2),
         coalesce(sum(t.overtime_hours), 0)::numeric(10,2),
         coalesce(sum((t.hours + t.overtime_hours) * coalesce(t.hourly_rate, 0)), 0)::numeric(12,2)
  from public.employees e
  join public.timesheets t on t.employee_id = e.id and t.status in ('approved','paid')
  where e.organisation_id = p_org
    and t.work_date >= current_date - make_interval(days => greatest(p_days, 1))
  group by e.id, e.employee_number, e.first_name, e.last_name
  order by 4 desc;
$$;

create or replace function public.report_cost_breakdown(p_org uuid, p_days int default 365)
returns table (category public.cost_category, committed numeric, actual numeric)
language sql stable security invoker set search_path = public as $$
  select e.category,
         coalesce(sum(case when e.status = 'committed' then e.net else 0 end), 0)::numeric(12,2),
         coalesce(sum(case when e.status in ('actual','paid') then e.net else 0 end), 0)::numeric(12,2)
  from public.expenses e
  where e.organisation_id = p_org and e.archived_at is null
    and e.expense_date >= current_date - make_interval(days => greatest(p_days, 1))
  group by e.category
  order by 3 desc;
$$;

-- ---------- notifications ----------------------------------------------------
-- Raised for the people who can act on them. dedupe_key makes repeat runs safe.
create or replace function public.notify_roles(
  p_org uuid, p_roles text[], p_type public.notification_type, p_title text, p_body text,
  p_entity_type text, p_entity_id uuid, p_href text, p_dedupe text
) returns int language plpgsql security definer set search_path = public as $$
declare n int := 0;
begin
  insert into public.notifications (organisation_id, user_id, type, title, body, entity_type, entity_id, href, dedupe_key)
  select p_org, m.user_id, p_type, p_title, p_body, p_entity_type, p_entity_id, p_href, p_dedupe
  from public.organisation_members m
  where m.organisation_id = p_org and m.accepted_at is not null and m.role::text = any(p_roles)
  on conflict (organisation_id, user_id, dedupe_key) where dedupe_key is not null do nothing;
  get diagnostics n = row_count;
  return n;
end $$;
revoke all on function public.notify_roles(uuid, text[], public.notification_type, text, text, text, uuid, text, text) from public;

-- Generates every alert type for one organisation. Safe to run repeatedly;
-- the dedupe key is scoped per day (or per threshold) so nobody is spammed.
create or replace function public.generate_alerts(p_org uuid)
returns int language plpgsql security definer set search_path = public as $$
declare r record; n int := 0; today text := to_char(current_date, 'YYYY-MM-DD');
begin
  -- invoices overdue (finance + owners)
  for r in
    select i.id, i.invoice_number, i.total - i.amount_paid as balance, i.due_date, c.name as client
    from public.invoices i join public.clients c on c.id = i.client_id
    where i.organisation_id = p_org and i.archived_at is null and i.status in ('issued','part_paid','overdue')
      and i.due_date is not null and i.due_date < current_date
  loop
    n := n + public.notify_roles(p_org, array['owner','administrator','finance'], 'invoice_overdue',
      'Invoice ' || r.invoice_number || ' is overdue',
      r.client || ' — ' || to_char(r.balance, 'FM£999,999,990.00') || ' outstanding since ' || to_char(r.due_date, 'DD/MM/YYYY'),
      'invoices', r.id, '/dashboard/invoices/' || r.id, 'invoice_overdue:' || r.id || ':' || today);
  end loop;

  -- quotes expiring in the next 7 days (sales)
  for r in
    select q.id, q.quote_number, q.expiry_date, q.total, c.name as client
    from public.quotes q join public.clients c on c.id = q.client_id
    where q.organisation_id = p_org and q.archived_at is null and q.status in ('sent','viewed')
      and q.expiry_date between current_date and current_date + 7
  loop
    n := n + public.notify_roles(p_org, array['owner','administrator','finance'], 'quote_expiring',
      'Quotation ' || r.quote_number || ' expires ' || to_char(r.expiry_date, 'DD/MM/YYYY'),
      r.client || ' — ' || to_char(r.total, 'FM£999,999,990.00') || '. Follow up before it lapses.',
      'quotes', r.id, '/dashboard/quotes/' || r.id, 'quote_expiring:' || r.id || ':' || to_char(r.expiry_date, 'YYYY-MM-DD'));
  end loop;

  -- compliance documents expiring at 90/60/30/14/7 days, and on expiry
  for r in
    select d.id, d.name, d.expiry_date, d.entity_id,
           (e.first_name || ' ' || e.last_name) as who,
           (d.expiry_date - current_date) as days_left
    from public.documents d join public.employees e on e.id = d.entity_id
    where d.organisation_id = p_org and d.entity_type = 'employee' and d.archived_at is null
      and e.archived_at is null and d.expiry_date is not null
      and (d.expiry_date - current_date) in (90, 60, 30, 14, 7, 0)
  loop
    n := n + public.notify_roles(p_org, array['owner','administrator'], 'document_expiring',
      case when r.days_left = 0 then r.who || ': ' || r.name || ' expires today'
           else r.who || ': ' || r.name || ' expires in ' || r.days_left || ' days' end,
      'Expiry ' || to_char(r.expiry_date, 'DD/MM/YYYY') || '. Collect a replacement before scheduling further shifts.',
      'employee', r.entity_id, '/dashboard/employees/' || r.entity_id || '/documents',
      'document_expiring:' || r.id || ':' || r.days_left);
  end loop;

  -- timesheets waiting for approval for more than 3 days
  for r in
    select t.id, t.work_date, (e.first_name || ' ' || e.last_name) as who
    from public.timesheets t join public.employees e on e.id = t.employee_id
    where t.organisation_id = p_org and t.status = 'submitted'
      and t.submitted_at < now() - interval '3 days'
  loop
    n := n + public.notify_roles(p_org, array['owner','administrator'], 'timesheet_pending',
      'Timesheet awaiting approval', r.who || ' — ' || to_char(r.work_date, 'DD/MM/YYYY') || ', submitted more than 3 days ago',
      'timesheets', r.id, '/dashboard/timesheets/' || r.id, 'timesheet_pending:' || r.id || ':' || today);
  end loop;

  -- shifts in the next 7 days where a required document has already expired
  for r in
    select distinct s.id, s.shift_date, (e.first_name || ' ' || e.last_name) as who, d.name as doc
    from public.shifts s
    join public.employees e on e.id = s.employee_id
    join public.documents d on d.entity_type = 'employee' and d.entity_id = e.id and d.archived_at is null
    where s.organisation_id = p_org and s.status <> 'cancelled'
      and s.shift_date between current_date and current_date + 7
      and d.expiry_date is not null and d.expiry_date < s.shift_date
  loop
    n := n + public.notify_roles(p_org, array['owner','administrator'], 'staffing_conflict',
      'Scheduled with an expired document', r.who || ' is on shift ' || to_char(r.shift_date, 'DD/MM/YYYY') || ' but ' || r.doc || ' has expired',
      'shifts', r.id, '/dashboard/rota', 'staffing_conflict:' || r.id || ':' || today);
  end loop;

  -- overdue tasks (assignee only)
  for r in
    select t.id, t.title, t.due_date, t.assignee_user_id
    from public.tasks t
    where t.organisation_id = p_org and t.status <> 'complete'
      and t.due_date is not null and t.due_date < current_date and t.assignee_user_id is not null
  loop
    insert into public.notifications (organisation_id, user_id, type, title, body, entity_type, entity_id, href, dedupe_key)
    values (p_org, r.assignee_user_id, 'task_overdue', 'Task overdue: ' || r.title,
            'Was due ' || to_char(r.due_date, 'DD/MM/YYYY'), 'tasks', r.id, '/dashboard/tasks/' || r.id,
            'task_overdue:' || r.id || ':' || today)
    on conflict (organisation_id, user_id, dedupe_key) where dedupe_key is not null do nothing;
    n := n + 1;
  end loop;

  -- projects starting within 7 days with no project manager
  for r in
    select p.id, p.name, p.start_date
    from public.projects p
    where p.organisation_id = p_org and p.archived_at is null and p.project_manager_id is null
      and p.start_date between current_date and current_date + 7
  loop
    n := n + public.notify_roles(p_org, array['owner','administrator'], 'project_deadline',
      'Project starts soon with no manager', p.name || ' starts ' || to_char(r.start_date, 'DD/MM/YYYY'),
      'projects', r.id, '/dashboard/projects/' || r.id, 'project_unassigned:' || r.id || ':' || today);
  end loop;

  -- expire quotes whose validity has passed (housekeeping the reports rely on)
  update public.quotes set status = 'expired'
   where organisation_id = p_org and status in ('sent','viewed') and expiry_date < current_date;
  perform public.refresh_overdue_invoices(p_org);

  return n;
end $$;
revoke all on function public.generate_alerts(uuid) from public;
grant execute on function public.generate_alerts(uuid) to authenticated;

-- Every organisation, for the scheduled job.
create or replace function public.generate_alerts_all()
returns int language plpgsql security definer set search_path = public as $$
declare o record; n int := 0;
begin
  for o in select id from public.organisations loop
    n := n + public.generate_alerts(o.id);
  end loop;
  return n;
end $$;
revoke all on function public.generate_alerts_all() from public, anon, authenticated;

-- Documents past their expiry are marked expired so the UI doesn't have to guess.
create or replace function public.expire_documents(p_org uuid)
returns int language plpgsql security definer set search_path = public as $$
declare n int;
begin
  update public.documents set verification = 'expired'
   where organisation_id = p_org and entity_type = 'employee' and archived_at is null
     and expiry_date is not null and expiry_date < current_date and verification <> 'expired';
  get diagnostics n = row_count;
  return n;
end $$;
revoke all on function public.expire_documents(uuid) from public;
grant execute on function public.expire_documents(uuid) to authenticated;

-- ============================================================================
-- 0013 — The organisation trades in euro, not sterling.
--
-- Changes the currency default on every money-bearing document and replaces the
-- seeded UK VAT rates with Irish ones. Existing documents keep the currency
-- they were created with; only untouched seeded VAT rates are rewritten, so a
-- rate anyone has already edited is left exactly as they set it.
--
-- Irish rates as at September 2026 (confirm with the client's accountant):
--   23%   standard      — equipment supply, most goods and services
--   13.5% reduced       — construction, installation, cleaning
--   9%    catering      — restaurant, catering and hot takeaway food, from 1 July 2026
--   0%    zero          — most basic (cold, unprepared) food
--   0%    exempt        — outside the scope of VAT
-- ============================================================================

alter table public.leads    alter column currency set default 'EUR';
alter table public.projects alter column currency set default 'EUR';
alter table public.quotes   alter column currency set default 'EUR';
alter table public.invoices alter column currency set default 'EUR';

-- Nothing has been traded in sterling yet, so re-point the few existing rows too.
update public.leads    set currency = 'EUR' where currency = 'GBP';
update public.projects set currency = 'EUR' where currency = 'GBP';
update public.quotes    set currency = 'EUR' where currency = 'GBP' and status = 'draft';
update public.invoices  set currency = 'EUR' where currency = 'GBP' and status = 'draft';

-- Seed for new organisations.
create or replace function public.seed_org_finance_defaults(org uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  insert into public.vat_rates (organisation_id, key, label, rate, is_default, sort_order) values
    (org, 'standard', 'Standard 23%',            23,   true,  10),
    (org, 'reduced',  'Reduced 13.5%',           13.5, false, 20),
    (org, 'catering', 'Catering / hot food 9%',   9,   false, 30),
    (org, 'zero',     'Zero 0%',                  0,   false, 40),
    (org, 'exempt',   'Exempt',                   0,   false, 50)
  on conflict (organisation_id, key) do nothing;
end $$;

-- Re-point existing organisations, but only where the seeded UK rate is untouched.
do $$
declare o record;
begin
  for o in select id from public.organisations loop
    update public.vat_rates set label = 'Standard 23%', rate = 23
      where organisation_id = o.id and key = 'standard' and rate = 20 and label = 'Standard 20%';
    update public.vat_rates set label = 'Reduced 13.5%', rate = 13.5
      where organisation_id = o.id and key = 'reduced' and rate = 5 and label = 'Reduced 5%';
    -- 'catering' is new everywhere; the others already exist at 0%.
    insert into public.vat_rates (organisation_id, key, label, rate, is_default, sort_order)
    values (o.id, 'catering', 'Catering / hot food 9%', 9, false, 30)
    on conflict (organisation_id, key) do nothing;
  end loop;
end $$;

-- Alert bodies printed sterling amounts.
create or replace function public.generate_alerts(p_org uuid)
returns int language plpgsql security definer set search_path = public as $$
declare r record; n int := 0; today text := to_char(current_date, 'YYYY-MM-DD');
begin
  for r in
    select i.id, i.invoice_number, i.total - i.amount_paid as balance, i.due_date, c.name as client
    from public.invoices i join public.clients c on c.id = i.client_id
    where i.organisation_id = p_org and i.archived_at is null and i.status in ('issued','part_paid','overdue')
      and i.due_date is not null and i.due_date < current_date
  loop
    n := n + public.notify_roles(p_org, array['owner','administrator','finance'], 'invoice_overdue',
      'Invoice ' || r.invoice_number || ' is overdue',
      r.client || ' — ' || to_char(r.balance, 'FM€999,999,990.00') || ' outstanding since ' || to_char(r.due_date, 'DD/MM/YYYY'),
      'invoices', r.id, '/dashboard/invoices/' || r.id, 'invoice_overdue:' || r.id || ':' || today);
  end loop;

  for r in
    select q.id, q.quote_number, q.expiry_date, q.total, c.name as client
    from public.quotes q join public.clients c on c.id = q.client_id
    where q.organisation_id = p_org and q.archived_at is null and q.status in ('sent','viewed')
      and q.expiry_date between current_date and current_date + 7
  loop
    n := n + public.notify_roles(p_org, array['owner','administrator','finance'], 'quote_expiring',
      'Quotation ' || r.quote_number || ' expires ' || to_char(r.expiry_date, 'DD/MM/YYYY'),
      r.client || ' — ' || to_char(r.total, 'FM€999,999,990.00') || '. Follow up before it lapses.',
      'quotes', r.id, '/dashboard/quotes/' || r.id, 'quote_expiring:' || r.id || ':' || to_char(r.expiry_date, 'YYYY-MM-DD'));
  end loop;

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

  for r in
    select p.id, p.name, p.start_date
    from public.projects p
    where p.organisation_id = p_org and p.archived_at is null and p.project_manager_id is null
      and p.start_date between current_date and current_date + 7
  loop
    n := n + public.notify_roles(p_org, array['owner','administrator'], 'project_deadline',
      'Project starts soon with no manager', r.name || ' starts ' || to_char(r.start_date, 'DD/MM/YYYY'),
      'projects', r.id, '/dashboard/projects/' || r.id, 'project_unassigned:' || r.id || ':' || today);
  end loop;

  update public.quotes set status = 'expired'
   where organisation_id = p_org and status in ('sent','viewed') and expiry_date < current_date;
  perform public.refresh_overdue_invoices(p_org);

  return n;
end $$;

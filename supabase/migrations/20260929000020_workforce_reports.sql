-- ============================================================================
-- 0020 — Operational reports: hours by employee and site, holiday and sickness.
-- Security invoker throughout, so RLS keeps deciding what each role can see.
-- ============================================================================

create or replace function public.report_hours_by_site(p_org uuid, p_from date, p_to date)
returns table (site_id uuid, site_name text, employees bigint, hours numeric, overtime numeric, labour_cost numeric)
language sql stable security invoker set search_path = public as $$
  select s.id, s.name, count(distinct t.employee_id),
         coalesce(sum(t.hours), 0)::numeric(10,2),
         coalesce(sum(t.overtime_hours), 0)::numeric(10,2),
         coalesce(sum((t.hours + t.overtime_hours) * coalesce(t.hourly_rate, 0)), 0)::numeric(12,2)
  from public.sites s
  join public.timesheets t on t.site_id = s.id and t.status in ('approved','paid')
  where s.organisation_id = p_org and t.work_date between p_from and p_to
  group by s.id, s.name
  order by 6 desc;
$$;

create or replace function public.report_absence(p_org uuid, p_from date, p_to date)
returns table (
  employee_id uuid, employee_name text, site_name text,
  holiday_days numeric, sick_days numeric, unpaid_days numeric, other_days numeric,
  sick_occasions bigint, missing_notes bigint
)
language sql stable security invoker set search_path = public as $$
  select e.id, (e.first_name || ' ' || e.last_name), s.name,
         coalesce(sum(l.days) filter (where l.leave_type = 'holiday' and l.status = 'approved'), 0)::numeric(8,2),
         coalesce(sum(l.days) filter (where l.leave_type = 'sick'), 0)::numeric(8,2),
         coalesce(sum(l.days) filter (where l.leave_type = 'unpaid' and l.status = 'approved'), 0)::numeric(8,2),
         coalesce(sum(l.days) filter (where l.leave_type = 'other' and l.status = 'approved'), 0)::numeric(8,2),
         count(*) filter (where l.leave_type = 'sick'),
         count(*) filter (where l.document_required and l.document_id is null)
  from public.employees e
  left join public.sites s on s.id = e.primary_site_id
  left join public.leave_requests l on l.employee_id = e.id
       and l.start_date <= p_to and l.end_date >= p_from
       and l.status <> 'cancelled'
  where e.organisation_id = p_org and e.archived_at is null
  group by e.id, e.first_name, e.last_name, s.name
  having coalesce(sum(l.days), 0) > 0
  order by 5 desc, 4 desc;
$$;

-- ---------- alerts -------------------------------------------------------------
-- Extends the nightly sweep with the two things this operation needs chasing:
-- sick notes that never arrived, and invoice cases that have stopped moving.
create or replace function public.generate_operations_alerts(p_org uuid)
returns int language plpgsql security definer set search_path = public as $$
declare r record; n int := 0; today text := to_char(current_date, 'YYYY-MM-DD');
begin
  for r in select * from public.leave_missing_documents(p_org) loop
    n := n + public.notify_roles(p_org, array['owner','administrator'], 'document_expiring',
      'Doctor’s note outstanding',
      r.employee_name || ' — sick from ' || to_char(r.start_date, 'DD/MM/YYYY') || ', no note received',
      'employee', r.employee_id, '/dashboard/employees/' || r.employee_id || '/leave',
      'sick_note_missing:' || r.leave_id || ':' || today);
  end loop;

  -- Invoice cases sitting at the same stage for more than three weeks.
  for r in
    select i.id, i.invoice_number, i.workflow_stage, c.name as client,
           current_date - coalesce(i.stage_changed_at, i.created_at)::date as days
    from public.invoices i join public.clients c on c.id = i.client_id
    where i.organisation_id = p_org and i.archived_at is null
      and i.status not in ('draft','cancelled','paid')
      and i.workflow_stage not in ('draft','paid','closed')
      and coalesce(i.stage_changed_at, i.created_at) < now() - interval '21 days'
  loop
    n := n + public.notify_roles(p_org, array['owner','administrator','finance'], 'invoice_overdue',
      'Invoice ' || r.invoice_number || ' has stalled',
      r.client || ' — ' || replace(r.workflow_stage::text, '_', ' ') || ' for ' || r.days || ' days',
      'invoices', r.id, '/dashboard/invoices/' || r.id,
      'invoice_stalled:' || r.id || ':' || today);
  end loop;

  -- Kitchens that did not log yesterday's numbers.
  for r in select * from public.sites_missing_vouchers(p_org, current_date - 1) loop
    n := n + public.notify_roles(p_org, array['owner','administrator'], 'system',
      'No vouchers logged yesterday', r.site_name,
      'site', r.site_id, '/dashboard/sites/' || r.site_id || '/vouchers',
      'vouchers_missing:' || r.site_id || ':' || today);
  end loop;

  return n;
end $$;
revoke all on function public.generate_operations_alerts(uuid) from public;
grant execute on function public.generate_operations_alerts(uuid) to authenticated;

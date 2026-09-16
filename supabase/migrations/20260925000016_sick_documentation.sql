-- ============================================================================
-- 0016 — Sick leave documentation.
--
-- Every sick absence needs a doctor's note (the client's rule — there is no
-- self-certification window). The requirement is set by trigger rather than by
-- the application, so it holds however the row is created, and the absence is
-- flagged until the note arrives.
-- ============================================================================

alter table public.leave_requests add column if not exists document_id uuid references public.documents(id) on delete set null;
alter table public.leave_requests add column if not exists document_required boolean not null default false;
alter table public.leave_requests add column if not exists document_received_at timestamptz;

create index if not exists leave_missing_document_idx on public.leave_requests (organisation_id)
  where document_required and document_id is null;

create or replace function public.leave_document_requirement()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  new.document_required := (new.leave_type = 'sick');
  if new.document_id is not null and new.document_received_at is null then
    new.document_received_at := now();
  elsif new.document_id is null then
    new.document_received_at := null;
  end if;
  return new;
end $$;
create trigger leave_document_flag before insert or update on public.leave_requests
  for each row execute function public.leave_document_requirement();

-- Backfill: existing sick records are flagged as needing a note.
update public.leave_requests set document_required = true where leave_type = 'sick' and not document_required;

-- Attaches an uploaded document to a leave request. The document is an employee
-- document, so it is already covered by the employee document policies — this
-- only links it and checks the caller owns the absence or manages the person.
create or replace function public.attach_leave_document(p_leave_id uuid, p_document_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare l public.leave_requests%rowtype; d public.documents%rowtype;
begin
  select * into l from public.leave_requests where id = p_leave_id;
  if not found then raise exception 'leave request not found' using errcode = 'P0002'; end if;
  select * into d from public.documents where id = p_document_id;
  if not found then raise exception 'document not found' using errcode = 'P0002'; end if;
  if d.entity_type <> 'employee' or d.entity_id <> l.employee_id then
    raise exception 'that document belongs to someone else' using errcode = '42501';
  end if;
  if not (l.employee_id = public.my_employee_id()
          or public.manages_employee(l.employee_id)
          or public.role_in(l.organisation_id, 'owner','administrator')) then
    raise exception 'not permitted' using errcode = '42501';
  end if;
  update public.leave_requests set document_id = p_document_id where id = p_leave_id;
end $$;
revoke all on function public.attach_leave_document(uuid, uuid) from public;
grant execute on function public.attach_leave_document(uuid, uuid) to authenticated;

-- Sick absences still missing their note, for the dashboard and the alert sweep.
create or replace function public.leave_missing_documents(p_org uuid)
returns table (leave_id uuid, employee_id uuid, employee_name text, start_date date, end_date date, days numeric)
language sql stable security invoker set search_path = public as $$
  select l.id, e.id, (e.first_name || ' ' || e.last_name), l.start_date, l.end_date, l.days
  from public.leave_requests l
  join public.employees e on e.id = l.employee_id
  where l.organisation_id = p_org
    and l.document_required and l.document_id is null
    and l.status in ('requested', 'approved')
  order by l.start_date desc;
$$;

-- The employee document category a sick note is filed under.
create or replace function public.seed_org_sick_note_category(org uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  insert into public.document_categories (organisation_id, entity, key, label, sort_order)
  values (org, 'employee', 'sick-note', 'Sick Note', 15)
  on conflict do nothing;
end $$;
do $$ declare o record; begin
  for o in select id from public.organisations loop perform public.seed_org_sick_note_category(o.id); end loop;
end $$;
create or replace function public.on_organisation_created_sick_notes()
returns trigger language plpgsql security definer set search_path = public as $$
begin perform public.seed_org_sick_note_category(new.id); return new; end $$;
create trigger organisations_seed_sick_notes after insert on public.organisations
  for each row execute function public.on_organisation_created_sick_notes();

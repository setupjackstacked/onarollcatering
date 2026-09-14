-- ============================================================================
-- 0004 — Phase 4: tasks, notes, enquiry → lead conversion, lead → project,
--        member profile view, document RLS by entity.
-- ============================================================================

create type public.task_status as enum ('todo', 'in_progress', 'blocked', 'complete');
create type public.task_priority as enum ('low', 'medium', 'high', 'urgent');

-- ---------- tasks ----------------------------------------------------------
create table public.tasks (
  id               uuid primary key default gen_random_uuid(),
  organisation_id  uuid not null references public.organisations(id) on delete cascade,
  project_id       uuid references public.projects(id) on delete cascade,
  title            text not null check (length(title) between 1 and 200),
  description      text,
  assignee_user_id uuid references auth.users(id) on delete set null,
  due_date         date,
  priority         public.task_priority not null default 'medium',
  status           public.task_status not null default 'todo',
  completed_at     timestamptz,
  created_by       uuid references auth.users(id) on delete set null,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index tasks_org_status_idx on public.tasks (organisation_id, status);
create index tasks_project_idx on public.tasks (project_id);
create index tasks_assignee_idx on public.tasks (organisation_id, assignee_user_id) where status <> 'complete';
create trigger tasks_updated_at before update on public.tasks for each row execute function public.set_updated_at();

create or replace function public.tasks_set_completed_at()
returns trigger language plpgsql as $$
begin
  if new.status = 'complete' and (old.status is distinct from 'complete') then new.completed_at = now();
  elsif new.status <> 'complete' then new.completed_at = null; end if;
  return new;
end $$;
create trigger tasks_completed_at before update on public.tasks for each row execute function public.tasks_set_completed_at();

-- ---------- notes (internal, entity-linked) --------------------------------
create table public.notes (
  id              uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  entity_type     text not null,
  entity_id       uuid not null,
  body            text not null check (length(body) between 1 and 10000),
  pinned          boolean not null default false,
  created_by      uuid references auth.users(id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index notes_entity_idx on public.notes (organisation_id, entity_type, entity_id, created_at desc);
create trigger notes_updated_at before update on public.notes for each row execute function public.set_updated_at();

-- ---------- member directory (for assignee pickers) ------------------------
create view public.organisation_member_profiles with (security_invoker = true) as
select m.organisation_id, m.user_id, m.role, m.accepted_at, p.full_name, p.email
from public.organisation_members m
join public.profiles p on p.id = m.user_id;

-- ---------- RLS ------------------------------------------------------------
alter table public.tasks enable row level security;
alter table public.notes enable row level security;

-- tasks: visible if you can read the project (or org-level task and you have projects.read);
-- assignees can always see + update their own tasks.
create policy tasks_select on public.tasks for select to authenticated using (
  assignee_user_id = auth.uid()
  or (project_id is null and public.role_in(organisation_id, 'owner','administrator','finance','project_manager','read_only'))
  or (project_id is not null and public.can_read_project(project_id))
);
create policy tasks_insert on public.tasks for insert to authenticated with check (
  (project_id is null and public.role_in(organisation_id, 'owner','administrator','project_manager'))
  or (project_id is not null and public.can_write_project(project_id))
);
create policy tasks_update on public.tasks for update to authenticated using (
  assignee_user_id = auth.uid()
  or (project_id is null and public.role_in(organisation_id, 'owner','administrator','project_manager'))
  or (project_id is not null and public.can_write_project(project_id))
) with check (
  assignee_user_id = auth.uid()
  or (project_id is null and public.role_in(organisation_id, 'owner','administrator','project_manager'))
  or (project_id is not null and public.can_write_project(project_id))
);
create policy tasks_delete on public.tasks for delete to authenticated using (
  public.role_in(organisation_id, 'owner','administrator')
);

-- notes: any member with sales/projects read can see; writers = anyone but read_only; authors edit own
create policy notes_select on public.notes for select to authenticated using (
  public.role_in(organisation_id, 'owner','administrator','finance','project_manager')
  or (public.role_in(organisation_id, 'read_only'))
);
create policy notes_insert on public.notes for insert to authenticated with check (
  public.role_in(organisation_id, 'owner','administrator','finance','project_manager') and created_by = auth.uid()
);
create policy notes_update on public.notes for update to authenticated using (
  created_by = auth.uid() or public.role_in(organisation_id, 'owner','administrator')
) with check (
  created_by = auth.uid() or public.role_in(organisation_id, 'owner','administrator')
);
create policy notes_delete on public.notes for delete to authenticated using (
  created_by = auth.uid() or public.role_in(organisation_id, 'owner','administrator')
);

-- ---------- enquiry → lead (+ client + contact) conversion -----------------
-- Atomic, deduplicating. Returns the new lead id. Caller must be sales_write.
create or replace function public.convert_enquiry_to_lead(p_enquiry_id uuid, p_assignee uuid default null)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  e public.enquiries%rowtype;
  v_client_id uuid;
  v_contact_id uuid;
  v_lead_id uuid;
  v_first text; v_last text;
begin
  select * into e from public.enquiries where id = p_enquiry_id;
  if not found then raise exception 'enquiry not found' using errcode = 'P0002'; end if;
  if not public.role_in(e.organisation_id, 'owner','administrator','finance') then
    raise exception 'not permitted' using errcode = '42501';
  end if;
  if e.lead_id is not null then return e.lead_id; end if;

  -- client: match by contact email domain-insensitive exact name, else by email on an existing contact
  select c.id into v_client_id from public.clients c
   where c.organisation_id = e.organisation_id and c.archived_at is null
     and lower(c.name) = lower(e.company_name) limit 1;
  if v_client_id is null then
    select cc.client_id into v_client_id from public.client_contacts cc
     where cc.organisation_id = e.organisation_id and cc.archived_at is null
       and lower(cc.email) = lower(e.email) limit 1;
  end if;
  if v_client_id is null then
    insert into public.clients (organisation_id, name, email, phone, created_by)
    values (e.organisation_id, e.company_name, e.email, e.phone, auth.uid())
    returning id into v_client_id;
  end if;

  -- contact
  select cc.id into v_contact_id from public.client_contacts cc
   where cc.client_id = v_client_id and cc.archived_at is null and lower(cc.email) = lower(e.email) limit 1;
  if v_contact_id is null then
    v_first := split_part(e.contact_name, ' ', 1);
    v_last  := nullif(trim(substr(e.contact_name, length(v_first) + 1)), '');
    insert into public.client_contacts (organisation_id, client_id, first_name, last_name, job_title, email, phone,
                                        is_primary, is_project)
    values (e.organisation_id, v_client_id, v_first, coalesce(v_last, ''), e.job_title, e.email, e.phone,
            not exists (select 1 from public.client_contacts x where x.client_id = v_client_id and x.is_primary and x.archived_at is null),
            true)
    returning id into v_contact_id;
  end if;

  -- lead
  insert into public.leads (organisation_id, title, status, client_id, contact_id, company_name, contact_name,
                            contact_email, contact_phone, source_key, service_keys, project_location,
                            expected_start_date, assigned_user_id, notes, enquiry_id, created_by)
  values (e.organisation_id, e.project_name, 'new', v_client_id, v_contact_id, e.company_name, e.contact_name,
          e.email, e.phone, 'website', e.services, e.location, e.required_start_date, p_assignee,
          e.description, e.id, auth.uid())
  returning id into v_lead_id;

  update public.enquiries set lead_id = v_lead_id, status = 'converted' where id = e.id;

  -- carry attachments across as lead documents (metadata only; files stay in enquiry-uploads)
  insert into public.documents (organisation_id, entity_type, entity_id, category_key, name, mime_type, size_bytes, bucket, storage_path, uploaded_by)
  select e.organisation_id, 'lead', v_lead_id, 'tender-documents', a->>'name', a->>'mime', (a->>'size')::bigint, 'enquiry-uploads', a->>'path', auth.uid()
  from jsonb_array_elements(e.attachments) a
  on conflict (bucket, storage_path) do nothing;

  insert into public.activity_logs (organisation_id, user_id, entity_type, entity_id, action, metadata)
  values (e.organisation_id, auth.uid(), 'enquiries', e.id, 'enquiries.converted', jsonb_build_object('lead_id', v_lead_id, 'client_id', v_client_id));

  return v_lead_id;
end $$;
revoke all on function public.convert_enquiry_to_lead(uuid, uuid) from public;
grant execute on function public.convert_enquiry_to_lead(uuid, uuid) to authenticated;

-- ---------- lead → project conversion --------------------------------------
create or replace function public.convert_lead_to_project(
  p_lead_id uuid, p_name text default null, p_site_id uuid default null, p_project_manager uuid default null,
  p_contract_value numeric default null, p_start_date date default null
) returns uuid language plpgsql security definer set search_path = public as $$
declare
  l public.leads%rowtype;
  v_project_id uuid;
begin
  select * into l from public.leads where id = p_lead_id;
  if not found then raise exception 'lead not found' using errcode = 'P0002'; end if;
  if not public.role_in(l.organisation_id, 'owner','administrator') then
    raise exception 'not permitted' using errcode = '42501';
  end if;
  if l.converted_project_id is not null then return l.converted_project_id; end if;
  if l.client_id is null then raise exception 'lead has no client — create or link a client first' using errcode = '23502'; end if;

  insert into public.projects (organisation_id, name, status, client_id, site_id, lead_id, project_manager_id,
                               start_date, contract_value, estimated_cost, service_keys, created_by)
  values (l.organisation_id, coalesce(p_name, l.title), 'approved', l.client_id, p_site_id, l.id, p_project_manager,
          coalesce(p_start_date, l.expected_start_date), coalesce(p_contract_value, l.estimated_value, 0), 0,
          l.service_keys, auth.uid())
  returning id into v_project_id;

  update public.leads set converted_project_id = v_project_id, status = 'won' where id = l.id;

  -- move lead documents to the project
  update public.documents set entity_type = 'project', entity_id = v_project_id
   where entity_type = 'lead' and entity_id = l.id;

  return v_project_id;
end $$;
revoke all on function public.convert_lead_to_project(uuid, text, uuid, uuid, numeric, date) from public;
grant execute on function public.convert_lead_to_project(uuid, text, uuid, uuid, numeric, date) to authenticated;

-- ---------- generic activity for notes/documents via triggers --------------
create or replace function public.audit_note_or_document()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_action text; v_meta jsonb;
begin
  if tg_table_name = 'notes' then
    v_action := 'note.added'; v_meta := jsonb_build_object('note_id', new.id);
  else
    v_action := 'document.uploaded'; v_meta := jsonb_build_object('document_id', new.id, 'name', to_jsonb(new) ->> 'name');
  end if;
  insert into public.activity_logs (organisation_id, user_id, entity_type, entity_id, action, metadata)
  values (new.organisation_id, auth.uid(), new.entity_type, new.entity_id, v_action, v_meta);
  return new;
end $$;
create trigger notes_audit after insert on public.notes for each row execute function public.audit_note_or_document();
create trigger documents_audit after insert on public.documents for each row execute function public.audit_note_or_document();

-- ============================================================================
-- 0006 — Phase 6: invoices, items, payments, credit notes, immutability, overdue.
-- ============================================================================

create type public.invoice_status as enum ('draft', 'issued', 'part_paid', 'paid', 'overdue', 'cancelled', 'credit');
create type public.invoice_kind   as enum ('standard', 'deposit', 'milestone', 'final', 'credit_note');
create type public.payment_method as enum ('bank_transfer', 'card', 'cash', 'cheque', 'other');

create table public.invoices (
  id                    uuid primary key default gen_random_uuid(),
  organisation_id       uuid not null references public.organisations(id) on delete cascade,
  invoice_number        text not null,               -- OAR-INV-YYYY-#### assigned on ISSUE (drafts have none)
  kind                  public.invoice_kind not null default 'standard',
  status                public.invoice_status not null default 'draft',
  client_id             uuid not null references public.clients(id) on delete restrict,
  contact_id            uuid references public.client_contacts(id) on delete set null,
  project_id            uuid references public.projects(id) on delete set null,
  quote_id              uuid references public.quotes(id) on delete set null,
  credit_for_invoice_id uuid references public.invoices(id) on delete set null,
  title                 text not null,
  reference             text,                         -- client PO / reference
  currency              char(3) not null default 'GBP',
  issue_date            date,
  due_date              date,
  discount_pct          numeric(5,2) not null default 0 check (discount_pct >= 0 and discount_pct <= 100),
  subtotal              numeric(12,2) not null default 0,
  discount_amount       numeric(12,2) not null default 0,
  vat_amount            numeric(12,2) not null default 0,
  total                 numeric(12,2) not null default 0,
  amount_paid           numeric(12,2) not null default 0,   -- maintained from payments
  notes                 text,
  terms                 text,
  internal_notes        text,
  public_token          text not null unique default encode(gen_random_bytes(24), 'hex'),
  issued_at             timestamptz,
  sent_at               timestamptz,
  paid_at               timestamptz,
  cancelled_at          timestamptz,
  cancel_reason         text,
  created_by            uuid references auth.users(id) on delete set null,
  archived_at           timestamptz,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);
create unique index invoices_number_idx on public.invoices (organisation_id, invoice_number) where invoice_number <> '';
create index invoices_org_status_idx on public.invoices (organisation_id, status) where archived_at is null;
create index invoices_client_idx on public.invoices (client_id);
create index invoices_project_idx on public.invoices (project_id);
create index invoices_due_idx on public.invoices (organisation_id, due_date) where status in ('issued','part_paid','overdue');
create trigger invoices_updated_at before update on public.invoices for each row execute function public.set_updated_at();

alter table public.quotes add constraint quotes_converted_invoice_fk foreign key (converted_invoice_id) references public.invoices(id) on delete set null;

create table public.invoice_items (
  id              uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  invoice_id      uuid not null references public.invoices(id) on delete cascade,
  position        int not null default 0,
  description     text not null,
  category        text not null default 'other',
  quantity        numeric(12,3) not null default 1 check (quantity >= 0),
  unit            text not null default 'each',
  sell_price      numeric(12,2) not null default 0 check (sell_price >= 0),
  discount_pct    numeric(5,2) not null default 0 check (discount_pct >= 0 and discount_pct <= 100),
  vat_rate        numeric(5,2) not null default 20 check (vat_rate >= 0),
  line_net        numeric(12,2) not null default 0,
  line_vat        numeric(12,2) not null default 0,
  line_total      numeric(12,2) not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index invoice_items_invoice_idx on public.invoice_items (invoice_id, position);
create trigger invoice_items_updated_at before update on public.invoice_items for each row execute function public.set_updated_at();

create table public.payments (
  id              uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  invoice_id      uuid not null references public.invoices(id) on delete cascade,
  paid_on         date not null default current_date,
  amount          numeric(12,2) not null check (amount > 0),
  method          public.payment_method not null default 'bank_transfer',
  reference       text,
  notes           text,
  recorded_by     uuid references auth.users(id) on delete set null,
  created_at      timestamptz not null default now()
);
create index payments_invoice_idx on public.payments (invoice_id);
create index payments_org_date_idx on public.payments (organisation_id, paid_on desc);

-- ---------- calculation (same rules as quotes) --------------------------------
create or replace function public.recalculate_invoice(p_invoice_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare q_disc numeric(5,2); v_sub numeric(12,2); v_net numeric(12,2); v_vat numeric(12,2); v_paid numeric(12,2); v_status public.invoice_status; v_total numeric(12,2); v_due date; prev_guard text;
begin
  select discount_pct, status, due_date into q_disc, v_status, v_due from public.invoices where id = p_invoice_id;
  if q_disc is null then return; end if;
  prev_guard := coalesce(current_setting('app.bypass_invoice_guard', true), 'off');
  perform set_config('app.bypass_invoice_guard', 'on', true);

  update public.invoice_items i set
    line_net   = round(i.quantity * i.sell_price * (1 - i.discount_pct / 100) * (1 - q_disc / 100), 2),
    line_vat   = round(round(i.quantity * i.sell_price * (1 - i.discount_pct / 100) * (1 - q_disc / 100), 2) * i.vat_rate / 100, 2),
    line_total = round(i.quantity * i.sell_price * (1 - i.discount_pct / 100) * (1 - q_disc / 100), 2)
               + round(round(i.quantity * i.sell_price * (1 - i.discount_pct / 100) * (1 - q_disc / 100), 2) * i.vat_rate / 100, 2)
  where i.invoice_id = p_invoice_id;

  select coalesce(sum(round(quantity * sell_price * (1 - discount_pct / 100), 2)), 0), coalesce(sum(line_net), 0), coalesce(sum(line_vat), 0)
    into v_sub, v_net, v_vat from public.invoice_items where invoice_id = p_invoice_id;
  select coalesce(sum(amount), 0) into v_paid from public.payments where invoice_id = p_invoice_id;
  v_total := v_net + v_vat;

  -- derive payment status for live invoices only
  if v_status in ('issued', 'part_paid', 'paid', 'overdue') then
    if v_paid >= v_total and v_total > 0 then v_status := 'paid';
    elsif v_paid > 0 then v_status := 'part_paid';
    else v_status := 'issued'; end if;
    if v_status in ('issued', 'part_paid') and v_due is not null and v_due < current_date then v_status := 'overdue'; end if;
  end if;

  update public.invoices set subtotal = v_sub, discount_amount = v_sub - v_net, vat_amount = v_vat, total = v_total, amount_paid = v_paid,
    status = v_status, paid_at = case when v_status = 'paid' then coalesce(paid_at, now()) else null end
   where id = p_invoice_id;
  perform set_config('app.bypass_invoice_guard', prev_guard, true);
end $$;

create or replace function public.invoice_items_recalc()
returns trigger language plpgsql security definer set search_path = public as $$
begin perform public.recalculate_invoice(coalesce(new.invoice_id, old.invoice_id)); return null; end $$;
create trigger invoice_items_recalc after insert or delete or update of quantity, sell_price, discount_pct, vat_rate on public.invoice_items for each row execute function public.invoice_items_recalc();

create or replace function public.payments_recalc()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform public.recalculate_invoice(coalesce(new.invoice_id, old.invoice_id));
  if tg_op = 'INSERT' then
    insert into public.activity_logs (organisation_id, user_id, entity_type, entity_id, action, metadata)
    values (new.organisation_id, auth.uid(), 'invoices', new.invoice_id, 'invoices.payment_recorded', jsonb_build_object('amount', new.amount, 'method', new.method));
  end if;
  return null;
end $$;
create trigger payments_recalc after insert or update or delete on public.payments for each row execute function public.payments_recalc();

create or replace function public.invoices_recalc_on_discount()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.discount_pct is distinct from old.discount_pct or new.due_date is distinct from old.due_date then perform public.recalculate_invoice(new.id); end if;
  return null;
end $$;
create trigger invoices_recalc_on_change after update of discount_pct, due_date on public.invoices for each row execute function public.invoices_recalc_on_discount();

-- Overdue sweep (call from list pages / scheduled job). Idempotent.
create or replace function public.refresh_overdue_invoices(p_org uuid)
returns int language plpgsql security definer set search_path = public as $$
declare n int;
begin
  update public.invoices set status = 'overdue' where organisation_id = p_org and status in ('issued','part_paid') and due_date < current_date;
  get diagnostics n = row_count;
  return n;
end $$;
revoke all on function public.refresh_overdue_invoices(uuid) from public;
grant execute on function public.refresh_overdue_invoices(uuid) to authenticated;

-- ---------- immutability ----------------------------------------------------
-- Items: editable only while draft. Invoice header: after issue, only status-ish
-- and internal fields may change; financial/customer fields are frozen.
create or replace function public.invoice_items_guard()
returns trigger language plpgsql security definer set search_path = public as $$
declare s public.invoice_status;
begin
  select status into s from public.invoices where id = coalesce(new.invoice_id, old.invoice_id);
  if s <> 'draft' and current_setting('app.bypass_invoice_guard', true) is distinct from 'on' then
    raise exception 'Invoice is % — issue a credit note or cancel and reissue', s using errcode = 'check_violation';
  end if;
  return coalesce(new, old);
end $$;
create trigger invoice_items_guard before insert or update or delete on public.invoice_items for each row execute function public.invoice_items_guard();

create or replace function public.invoices_guard()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if old.status <> 'draft' and current_setting('app.bypass_invoice_guard', true) is distinct from 'on' then
    if new.client_id <> old.client_id or new.issue_date is distinct from old.issue_date or new.discount_pct <> old.discount_pct
       or new.title <> old.title or new.kind <> old.kind or new.currency <> old.currency or new.invoice_number <> old.invoice_number then
      raise exception 'Issued invoices cannot be changed — issue a credit note or cancel and reissue' using errcode = 'check_violation';
    end if;
  end if;
  return new;
end $$;
create trigger invoices_guard before update on public.invoices for each row execute function public.invoices_guard();

-- ---------- issue / cancel / credit ----------------------------------------------
create or replace function public.issue_invoice(p_invoice_id uuid, p_issue_date date default current_date, p_due_date date default null)
returns text language plpgsql security definer set search_path = public as $$
declare inv public.invoices%rowtype; terms int; num text; due date;
begin
  select * into inv from public.invoices where id = p_invoice_id;
  if not found then raise exception 'invoice not found' using errcode = 'P0002'; end if;
  if not public.role_in(inv.organisation_id, 'owner','administrator','finance') then raise exception 'not permitted' using errcode = '42501'; end if;
  if inv.status <> 'draft' then return inv.invoice_number; end if;
  if not exists (select 1 from public.invoice_items where invoice_id = inv.id) then raise exception 'Add at least one line before issuing' using errcode = 'check_violation'; end if;
  select payment_terms_days into terms from public.clients where id = inv.client_id;
  due := coalesce(p_due_date, p_issue_date + coalesce(terms, 30));
  num := public.next_document_number(inv.organisation_id, 'invoice', 'OAR-INV');
  perform set_config('app.bypass_invoice_guard', 'on', true);
  update public.invoices set invoice_number = num, status = (case when inv.kind = 'credit_note' then 'credit' else 'issued' end)::public.invoice_status,
    issue_date = p_issue_date, due_date = due, issued_at = now() where id = inv.id;
  perform set_config('app.bypass_invoice_guard', 'off', true);
  perform public.recalculate_invoice(inv.id);
  insert into public.activity_logs (organisation_id, user_id, entity_type, entity_id, action, metadata)
  values (inv.organisation_id, auth.uid(), 'invoices', inv.id, 'invoices.issued', jsonb_build_object('number', num, 'total', inv.total));
  if inv.project_id is not null then
    insert into public.activity_logs (organisation_id, user_id, entity_type, entity_id, action, metadata)
    values (inv.organisation_id, auth.uid(), 'project', inv.project_id, 'invoices.issued', jsonb_build_object('invoice_id', inv.id, 'number', num));
  end if;
  return num;
end $$;
revoke all on function public.issue_invoice(uuid, date, date) from public;
grant execute on function public.issue_invoice(uuid, date, date) to authenticated;

create or replace function public.cancel_invoice(p_invoice_id uuid, p_reason text)
returns void language plpgsql security definer set search_path = public as $$
declare inv public.invoices%rowtype;
begin
  select * into inv from public.invoices where id = p_invoice_id;
  if not found then raise exception 'invoice not found' using errcode = 'P0002'; end if;
  if not public.role_in(inv.organisation_id, 'owner','administrator','finance') then raise exception 'not permitted' using errcode = '42501'; end if;
  if inv.amount_paid > 0 then raise exception 'Invoice has payments — issue a credit note instead' using errcode = 'check_violation'; end if;
  perform set_config('app.bypass_invoice_guard', 'on', true);
  update public.invoices set status = 'cancelled', cancelled_at = now(), cancel_reason = left(p_reason, 500) where id = inv.id;
  perform set_config('app.bypass_invoice_guard', 'off', true);
  insert into public.activity_logs (organisation_id, user_id, entity_type, entity_id, action, metadata)
  values (inv.organisation_id, auth.uid(), 'invoices', inv.id, 'invoices.cancelled', jsonb_build_object('reason', left(p_reason, 500)));
end $$;
revoke all on function public.cancel_invoice(uuid, text) from public;
grant execute on function public.cancel_invoice(uuid, text) to authenticated;

-- Credit note: a draft credit_note invoice mirroring the original's lines (edit before issuing).
create or replace function public.create_credit_note(p_invoice_id uuid)
returns uuid language plpgsql security definer set search_path = public as $$
declare inv public.invoices%rowtype; new_id uuid;
begin
  select * into inv from public.invoices where id = p_invoice_id;
  if not found then raise exception 'invoice not found' using errcode = 'P0002'; end if;
  if not public.role_in(inv.organisation_id, 'owner','administrator','finance') then raise exception 'not permitted' using errcode = '42501'; end if;
  if inv.status in ('draft','cancelled','credit') then raise exception 'Credit notes are raised against issued invoices' using errcode = 'check_violation'; end if;
  insert into public.invoices (organisation_id, invoice_number, kind, status, client_id, contact_id, project_id, quote_id, credit_for_invoice_id, title, reference, currency, discount_pct, terms, created_by)
  values (inv.organisation_id, '', 'credit_note', 'draft', inv.client_id, inv.contact_id, inv.project_id, inv.quote_id, inv.id, 'Credit note — ' || inv.invoice_number, inv.reference, inv.currency, inv.discount_pct, inv.terms, auth.uid())
  returning id into new_id;
  insert into public.invoice_items (organisation_id, invoice_id, position, description, category, quantity, unit, sell_price, discount_pct, vat_rate)
  select organisation_id, new_id, position, description, category, quantity, unit, sell_price, discount_pct, vat_rate from public.invoice_items where invoice_id = inv.id order by position;
  return new_id;
end $$;
revoke all on function public.create_credit_note(uuid) from public;
grant execute on function public.create_credit_note(uuid) to authenticated;

-- Quote → invoice (full or deposit %). Draft; items copied without cost prices.
create or replace function public.create_invoice_from_quote(p_quote_id uuid, p_kind public.invoice_kind default 'standard', p_percent numeric default 100)
returns uuid language plpgsql security definer set search_path = public as $$
declare q public.quotes%rowtype; new_id uuid;
begin
  select * into q from public.quotes where id = p_quote_id;
  if not found then raise exception 'quote not found' using errcode = 'P0002'; end if;
  if not public.role_in(q.organisation_id, 'owner','administrator','finance') then raise exception 'not permitted' using errcode = '42501'; end if;
  if q.status <> 'accepted' then raise exception 'Only accepted quotes can be invoiced' using errcode = 'check_violation'; end if;
  if p_percent <= 0 or p_percent > 100 then raise exception 'percent must be between 1 and 100' using errcode = 'check_violation'; end if;
  if p_percent = 100 and p_kind = 'standard' and q.converted_invoice_id is not null then return q.converted_invoice_id; end if;

  insert into public.invoices (organisation_id, invoice_number, kind, status, client_id, contact_id, project_id, quote_id, title, currency, discount_pct, terms, notes, created_by)
  values (q.organisation_id, '', p_kind, 'draft', q.client_id, q.contact_id, q.project_id, q.id,
          case when p_percent < 100 then format('%s — %s%% %s', q.title, p_percent, p_kind) else q.title end,
          q.currency, case when p_percent = 100 then q.discount_pct else 0 end, q.terms, q.scope_notes, auth.uid())
  returning id into new_id;

  if p_percent = 100 then
    insert into public.invoice_items (organisation_id, invoice_id, position, description, category, quantity, unit, sell_price, discount_pct, vat_rate)
    select organisation_id, new_id, position, description, category, quantity, unit, sell_price, discount_pct, vat_rate from public.quote_items where quote_id = q.id order by position;
    if p_kind = 'standard' then update public.quotes set converted_invoice_id = new_id where id = q.id; end if;
  else
    -- single summary line at the requested percentage of the quote net, VAT at the blended effective rate
    insert into public.invoice_items (organisation_id, invoice_id, position, description, category, quantity, unit, sell_price, discount_pct, vat_rate)
    select q.organisation_id, new_id, 0, format('%s%% %s against quotation %s', p_percent, p_kind, q.quote_number), 'other', 1, 'each',
           round((q.total - q.vat_amount) * p_percent / 100, 2), 0,
           case when (q.total - q.vat_amount) > 0 then round(q.vat_amount / (q.total - q.vat_amount) * 100, 2) else 0 end;
  end if;
  return new_id;
end $$;
revoke all on function public.create_invoice_from_quote(uuid, public.invoice_kind, numeric) from public;
grant execute on function public.create_invoice_from_quote(uuid, public.invoice_kind, numeric) to authenticated;

create or replace function public.invoice_mark_viewed(p_token text)
returns void language sql security definer set search_path = public as $$
  update public.invoices set sent_at = coalesce(sent_at, now()) where public_token = p_token;
$$;
revoke all on function public.invoice_mark_viewed(text) from public;

-- ---------- RLS ----------------------------------------------------------------
alter table public.invoices enable row level security;
alter table public.invoice_items enable row level security;
alter table public.payments enable row level security;

create policy invoices_select on public.invoices for select to authenticated using (
  public.role_in(organisation_id, 'owner','administrator','finance','read_only')
  or (project_id is not null and public.can_read_project(project_id))
);
create policy invoices_insert on public.invoices for insert to authenticated with check (public.role_in(organisation_id, 'owner','administrator','finance'));
create policy invoices_update on public.invoices for update to authenticated
  using (public.role_in(organisation_id, 'owner','administrator','finance')) with check (public.role_in(organisation_id, 'owner','administrator','finance'));

create policy invoice_items_select on public.invoice_items for select to authenticated using (
  exists (select 1 from public.invoices i where i.id = invoice_id and (
    public.role_in(i.organisation_id, 'owner','administrator','finance','read_only') or (i.project_id is not null and public.can_read_project(i.project_id))))
);
create policy invoice_items_write on public.invoice_items for all to authenticated
  using (public.role_in(organisation_id, 'owner','administrator','finance')) with check (public.role_in(organisation_id, 'owner','administrator','finance'));

create policy payments_select on public.payments for select to authenticated using (public.role_in(organisation_id, 'owner','administrator','finance','read_only'));
create policy payments_insert on public.payments for insert to authenticated with check (public.role_in(organisation_id, 'owner','administrator','finance') and recorded_by = auth.uid());
create policy payments_delete on public.payments for delete to authenticated using (public.role_in(organisation_id, 'owner','administrator'));

create or replace function public.replace_invoice_items(p_invoice_id uuid, p_items jsonb)
returns void language plpgsql security definer set search_path = public as $$
declare inv public.invoices%rowtype;
begin
  select * into inv from public.invoices where id = p_invoice_id;
  if not found then raise exception 'invoice not found' using errcode = 'P0002'; end if;
  if not public.role_in(inv.organisation_id, 'owner','administrator','finance') then raise exception 'not permitted' using errcode = '42501'; end if;
  if inv.status <> 'draft' then raise exception 'Invoice is not a draft' using errcode = 'check_violation'; end if;
  delete from public.invoice_items where invoice_id = p_invoice_id;
  insert into public.invoice_items (organisation_id, invoice_id, position, description, category, quantity, unit, sell_price, discount_pct, vat_rate)
  select inv.organisation_id, p_invoice_id, (i.ord - 1)::int, left(i.item->>'description', 500), coalesce(nullif(i.item->>'category',''), 'other'),
         coalesce((i.item->>'quantity')::numeric, 1), coalesce(nullif(i.item->>'unit',''), 'each'),
         coalesce((i.item->>'sell_price')::numeric, 0), coalesce((i.item->>'discount_pct')::numeric, 0), coalesce((i.item->>'vat_rate')::numeric, 0)
  from jsonb_array_elements(p_items) with ordinality as i(item, ord)
  where coalesce(i.item->>'description','') <> '';
  perform public.recalculate_invoice(p_invoice_id);
end $$;
revoke all on function public.replace_invoice_items(uuid, jsonb) from public;
grant execute on function public.replace_invoice_items(uuid, jsonb) to authenticated;

-- ============================================================================
-- 0019 — Final payment packs.
--
-- Before an invoice goes to the client's finance department, On A Roll sends
-- ONE pdf containing the invoice, the payment certificate, the signed estimate
-- and the backup documentation, in that order.
--
-- Each generation is a numbered version that records exactly which documents
-- went into it. Regenerating does not overwrite: the previous pack stays, so
-- what was actually sent to a client can always be produced again.
-- ============================================================================

create table public.generated_payment_packs (
  id                 uuid primary key default gen_random_uuid(),
  organisation_id    uuid not null references public.organisations(id) on delete cascade,
  invoice_id         uuid not null references public.invoices(id) on delete cascade,
  version            int not null,
  document_id        uuid references public.documents(id) on delete set null,
  source_document_ids jsonb not null default '[]'::jsonb,
  page_count         int,
  generated_by       uuid references auth.users(id) on delete set null,
  generated_at       timestamptz not null default now(),
  unique (invoice_id, version)
);
create index payment_packs_invoice_idx on public.generated_payment_packs (invoice_id, version desc);

-- The next version number for an invoice's pack.
create or replace function public.next_pack_version(p_invoice_id uuid)
returns int language sql stable security definer set search_path = public as $$
  select coalesce(max(version), 0) + 1 from public.generated_payment_packs where invoice_id = p_invoice_id;
$$;
revoke all on function public.next_pack_version(uuid) from public;
grant execute on function public.next_pack_version(uuid) to authenticated;

-- Records a generated pack and writes it into the case history.
create or replace function public.record_payment_pack(
  p_invoice_id uuid, p_document_id uuid, p_sources jsonb, p_pages int
) returns uuid language plpgsql security definer set search_path = public as $$
declare inv public.invoices%rowtype; v_version int; v_id uuid;
begin
  select * into inv from public.invoices where id = p_invoice_id;
  if not found then raise exception 'invoice not found' using errcode = 'P0002'; end if;
  if not public.role_in(inv.organisation_id, 'owner','administrator','finance') then
    raise exception 'not permitted' using errcode = '42501';
  end if;

  v_version := public.next_pack_version(p_invoice_id);
  insert into public.generated_payment_packs (organisation_id, invoice_id, version, document_id, source_document_ids, page_count, generated_by)
  values (inv.organisation_id, p_invoice_id, v_version, p_document_id, coalesce(p_sources, '[]'::jsonb), p_pages, auth.uid())
  returning id into v_id;

  insert into public.invoice_events (organisation_id, invoice_id, action, note, document_id, user_id)
  values (inv.organisation_id, p_invoice_id, 'pack_generated',
          'Final payment pack v' || v_version || ' (' || coalesce(p_pages, 0) || ' pages)', p_document_id, auth.uid());

  return v_id;
end $$;
revoke all on function public.record_payment_pack(uuid, uuid, jsonb, int) from public;
grant execute on function public.record_payment_pack(uuid, uuid, jsonb, int) to authenticated;

alter table public.generated_payment_packs enable row level security;

create policy payment_packs_select on public.generated_payment_packs for select to authenticated
  using (public.role_in(organisation_id, 'owner','administrator','finance','read_only'));
create policy payment_packs_insert on public.generated_payment_packs for insert to authenticated
  with check (public.role_in(organisation_id, 'owner','administrator','finance'));
-- No update or delete: a pack that was sent to a client is a record of what was sent.

-- Invoice workflow: paperwork stage is independent of payment status, the case
-- history is append-only, and documents and payments land in it automatically.
create or replace function test_as(user_id uuid) returns void language plpgsql as $$
begin perform set_config('request.jwt.claim.sub', user_id::text, true); perform set_config('request.jwt.claim.role', 'authenticated', true); perform set_config('role', 'authenticated', true); end $$;
create or replace function test_reset() returns void language plpgsql as $$
begin perform set_config('role', 'postgres', true); perform set_config('request.jwt.claim.sub', '', true); end $$;

do $$
declare
  v_org uuid := '00000000-0000-4000-8000-000000000001';
  v_client uuid := '00000000-0000-4000-8000-0000000000c1';
  v_fin uuid := '00000000-0000-4000-8000-0000000000a2';
  v_pm uuid := '00000000-0000-4000-8000-0000000000a3';
  v_inv uuid; v_doc uuid; n int; r record; v_num text;
begin
  perform test_as(v_fin);
  insert into public.invoices (organisation_id, invoice_number, client_id, title, created_by)
  values (v_org, '', v_client, 'TEST workflow invoice', v_fin) returning id into v_inv;
  insert into public.invoice_items (organisation_id, invoice_id, position, description, quantity, unit, sell_price, vat_rate)
  values (v_org, v_inv, 0, 'TEST catering week 1', 1, 'each', 5000.00, 9);

  -- a draft has not entered the approval chain
  if (select workflow_stage from public.invoices where id = v_inv) <> 'draft' then raise exception 'new invoice not at draft'; end if;
  begin
    perform public.set_invoice_stage(v_inv, 'sent_to_site');
    raise exception 'moved a draft into the chain';
  exception when check_violation then null; end;

  -- issuing starts it
  v_num := public.issue_invoice(v_inv, current_date);
  if (select workflow_stage from public.invoices where id = v_inv) <> 'sent_to_site' then
    raise exception 'issuing did not start the chain (%)', (select workflow_stage from public.invoices where id = v_inv);
  end if;

  -- walk the chain; the money status is untouched throughout
  perform public.set_invoice_stage(v_inv, 'site_approved', 'TEST signed on site by M. Byrne');
  perform public.set_invoice_stage(v_inv, 'with_procurement');
  perform public.set_invoice_stage(v_inv, 'procurement_approved', 'TEST budget agreed');
  perform public.set_invoice_stage(v_inv, 'payment_certificate');
  if (select status from public.invoices where id = v_inv) <> 'issued' then
    raise exception 'paperwork changed the payment status';
  end if;
  if (select stage_changed_at from public.invoices where id = v_inv) is null then raise exception 'stage time not stamped'; end if;

  -- every move is in the history, in order
  -- four explicit moves plus the automatic one when the invoice was issued
  select count(*) into n from public.invoice_events where invoice_id = v_inv and action = 'stage_changed';
  if n <> 5 then raise exception 'expected 5 stage events, got %', n; end if;
  -- every event inside one transaction shares the same created_at, so assert on
  -- the transition itself rather than on ordering
  select * into r from public.invoice_events
   where invoice_id = v_inv and action = 'stage_changed' and to_stage = 'payment_certificate';
  if r.from_stage <> 'procurement_approved' then raise exception 'transition recorded from % instead', r.from_stage; end if;
  if r.user_id <> v_fin then raise exception 'event not attributed'; end if;
  if not exists (select 1 from public.invoice_events where invoice_id = v_inv and to_stage = 'sent_to_site') then
    raise exception 'issuing was not recorded in the history';
  end if;

  -- a document attached to the invoice lands in the history by itself
  insert into public.documents (organisation_id, entity_type, entity_id, category_key, name, mime_type, size_bytes, bucket, storage_path)
  values (v_org, 'invoice', v_inv, 'payment-certificate', 'TEST cert.pdf', 'application/pdf', 2048, 'invoice-documents', 'test/cert.pdf')
  returning id into v_doc;
  select count(*) into n from public.invoice_events where invoice_id = v_inv and action = 'document_added';
  if n <> 1 then raise exception 'document not recorded in the history'; end if;

  -- so does a payment
  perform public.set_invoice_stage(v_inv, 'with_finance');
  insert into public.payments (organisation_id, invoice_id, paid_on, amount, method, reference, recorded_by)
  values (v_org, v_inv, current_date, 2725.00, 'bank_transfer', 'TEST-REF-1', v_fin);
  select count(*) into n from public.invoice_events where invoice_id = v_inv and action = 'payment_recorded';
  if n <> 1 then raise exception 'payment not recorded in the history'; end if;
  if (select status from public.invoices where id = v_inv) <> 'part_paid' then raise exception 'part payment not reflected'; end if;
  -- part paid, but still with finance on paper: the two axes are independent
  if (select workflow_stage from public.invoices where id = v_inv) <> 'with_finance' then raise exception 'payment moved the paperwork'; end if;

  -- settling it closes the paperwork automatically
  insert into public.payments (organisation_id, invoice_id, paid_on, amount, method, recorded_by)
  values (v_org, v_inv, current_date, 2725.00, 'bank_transfer', v_fin);
  if (select status from public.invoices where id = v_inv) <> 'paid' then raise exception 'not marked paid'; end if;
  if (select workflow_stage from public.invoices where id = v_inv) <> 'paid' then raise exception 'paperwork not closed on payment'; end if;

  -- the history cannot be rewritten
  begin
    delete from public.invoice_events where invoice_id = v_inv;
    if (select count(*) from public.invoice_events where invoice_id = v_inv) = 0 then
      raise exception 'finance deleted the case history';
    end if;
  exception when insufficient_privilege then null; end;
  begin
    update public.invoice_events set note = 'rewritten' where invoice_id = v_inv;
    if exists (select 1 from public.invoice_events where invoice_id = v_inv and note = 'rewritten') then
      raise exception 'finance rewrote the case history';
    end if;
  exception when insufficient_privilege then null; end;

  -- a project manager with no finance rights cannot move the chain
  perform test_as(v_pm);
  begin
    perform public.set_invoice_stage(v_inv, 'closed');
    raise exception 'PM moved an invoice stage';
  exception when insufficient_privilege then null; end;

  -- the pipeline report groups by stage
  perform test_as(v_fin);
  select count(*) into n from public.report_invoice_pipeline(v_org);
  if n < 1 then raise exception 'pipeline report empty'; end if;
  select count(*) into n from public.report_payment_time(v_org, 12);
  if n < 1 then raise exception 'payment time report empty'; end if;

  perform test_reset();
  delete from public.invoices where id = v_inv;
  delete from public.documents where id = v_doc;
  raise notice 'PASS invoice workflow';
end $$;
drop function test_as(uuid); drop function test_reset();

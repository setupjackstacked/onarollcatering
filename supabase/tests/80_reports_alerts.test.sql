-- Phase 11: reporting functions and idempotent alert generation.
create or replace function test_as(user_id uuid) returns void language plpgsql as $$
begin perform set_config('request.jwt.claim.sub', user_id::text, true); perform set_config('request.jwt.claim.role', 'authenticated', true); perform set_config('role', 'authenticated', true); end $$;
create or replace function test_reset() returns void language plpgsql as $$
begin perform set_config('role', 'postgres', true); perform set_config('request.jwt.claim.sub', '', true); end $$;

do $$
declare
  v_org uuid := '00000000-0000-4000-8000-000000000001';
  v_client uuid := '00000000-0000-4000-8000-0000000000c1';
  v_owner uuid := '00000000-0000-4000-8000-0000000000a1';
  v_fin uuid := '00000000-0000-4000-8000-0000000000a2';
  v_ro uuid := '00000000-0000-4000-8000-0000000000a4';
  v_inv uuid; v_q uuid; n int; n2 int; r record;
begin
  perform test_as(v_fin);

  -- an overdue invoice and an expiring quote
  insert into public.invoices (organisation_id, invoice_number, client_id, title, created_by)
  values (v_org, '', v_client, 'TEST report invoice', v_fin) returning id into v_inv;
  insert into public.invoice_items (organisation_id, invoice_id, position, description, quantity, unit, sell_price, vat_rate)
  values (v_org, v_inv, 0, 'TEST line', 1, 'each', 1000.00, 20);
  perform public.issue_invoice(v_inv, current_date - 60, current_date - 40);

  insert into public.quotes (organisation_id, quote_number, client_id, title, issue_date, expiry_date)
  values (v_org, '', v_client, 'TEST expiring quote', current_date - 10, current_date + 3) returning id into v_q;
  insert into public.quote_items (organisation_id, quote_id, position, description, quantity, unit, cost_price, sell_price, vat_rate)
  values (v_org, v_q, 0, 'TEST line', 1, 'each', 500, 2000, 20);
  update public.quotes set status = 'sent', sent_at = now() where id = v_q;

  -- revenue and outstanding reports see it
  select coalesce(sum(invoiced_net), 0) into n from public.report_revenue_by_month(v_org, 3);
  if n < 1000 then raise exception 'revenue report missing invoice (%)', n; end if;
  select balance into r from public.report_outstanding_invoices(v_org) where bucket = '31–60 days' limit 1;
  if r is null then raise exception 'outstanding bucket missing'; end if;
  select count(*) into n from public.report_quotes_by_status(v_org, 365); if n < 1 then raise exception 'quote status report empty'; end if;
  select count(*) into n from public.report_revenue_by_client(v_org, 12); if n < 1 then raise exception 'revenue by client empty'; end if;
  select count(*) into n from public.report_project_profitability(v_org); if n < 1 then raise exception 'profitability empty'; end if;
  select count(*) into n from public.report_cost_breakdown(v_org, 365); -- may be zero rows; must not error

  -- alerts: generated once, idempotent on a second run the same day
  perform test_reset();
  n := public.generate_alerts(v_org);
  if n < 2 then raise exception 'expected alerts, got %', n; end if;
  select count(*) into n from public.notifications where organisation_id = v_org and type = 'invoice_overdue';
  n2 := public.generate_alerts(v_org);
  select count(*) into n2 from public.notifications where organisation_id = v_org and type = 'invoice_overdue';
  if n2 <> n then raise exception 'alerts duplicated on rerun (% then %)', n, n2; end if;

  -- read_only members are not alerted about finance items
  select count(*) into n from public.notifications where organisation_id = v_org and user_id = v_ro and type = 'invoice_overdue';
  if n <> 0 then raise exception 'read_only alerted'; end if;
  select count(*) into n from public.notifications where organisation_id = v_org and user_id = v_owner and type = 'quote_expiring';
  if n <> 1 then raise exception 'owner not alerted about expiring quote (%)', n; end if;

  -- housekeeping: the overdue sweep ran
  if (select status from public.invoices where id = v_inv) <> 'overdue' then raise exception 'invoice not marked overdue'; end if;

  delete from public.notifications where organisation_id = v_org;
  delete from public.invoices where id = v_inv;   -- items and payments cascade
  delete from public.quotes where id = v_q;
  raise notice 'PASS reports + alerts';
end $$;
drop function test_as(uuid); drop function test_reset();

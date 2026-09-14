-- Phase 5/6: quote and invoice calculations, revisions, immutability, payments, credit notes.
create or replace function test_as(user_id uuid) returns void language plpgsql as $$
begin perform set_config('request.jwt.claim.sub', user_id::text, true); perform set_config('request.jwt.claim.role', 'authenticated', true); perform set_config('role', 'authenticated', true); end $$;
create or replace function test_reset() returns void language plpgsql as $$
begin perform set_config('role', 'postgres', true); perform set_config('request.jwt.claim.sub', '', true); end $$;

do $$
declare v_q uuid; v_q2 uuid; v_inv uuid; v_dep uuid; v_cn uuid; r record; n int; v_num text; v_pid uuid;
begin
  -- finance creates a quote with two lines
  perform test_as('00000000-0000-4000-8000-0000000000a2');
  insert into public.quotes (organisation_id, quote_number, client_id, title, discount_pct)
  values ('00000000-0000-4000-8000-000000000001', '', '00000000-0000-4000-8000-0000000000c1', 'TEST Quote', 0) returning id into v_q;
  if (select quote_number from public.quotes where id = v_q) !~ '^OAR-Q-\d{4}-0001$' then raise exception 'quote number not assigned'; end if;
  if (select root_quote_id from public.quotes where id = v_q) <> v_q then raise exception 'root not self'; end if;

  insert into public.quote_items (organisation_id, quote_id, position, description, quantity, unit, cost_price, sell_price, discount_pct, vat_rate) values
    ('00000000-0000-4000-8000-000000000001', v_q, 0, 'Modular kitchen unit', 2, 'each', 10000.00, 15000.00, 0, 20),
    ('00000000-0000-4000-8000-000000000001', v_q, 1, 'Installation labour', 37.5, 'hour', 20.00, 45.00, 10, 20),
    ('00000000-0000-4000-8000-000000000001', v_q, 2, 'Food service (zero-rated)', 1, 'month', 8000.00, 12000.00, 0, 0);
  select * into r from public.quotes where id = v_q;
  -- line1 net 30000, vat 6000; line2 net 37.5*45*0.9=1518.75, vat 303.75; line3 net 12000 vat 0
  if r.subtotal <> 43518.75 then raise exception 'subtotal % <> 43518.75', r.subtotal; end if;
  if r.vat_amount <> 6303.75 then raise exception 'vat % <> 6303.75', r.vat_amount; end if;
  if r.total <> 49822.50 then raise exception 'total % <> 49822.50', r.total; end if;
  if r.cost_total <> 28750.00 then raise exception 'cost % <> 28750', r.cost_total; end if;

  -- quote-level discount 5%: each net *0.95 → 28500 + 1442.81 + 11400 = 41342.81 ; vat 5700 + 288.56 = 5988.56
  update public.quotes set discount_pct = 5 where id = v_q;
  select * into r from public.quotes where id = v_q;
  if r.discount_amount <> 2175.94 then raise exception 'discount % <> 2175.94', r.discount_amount; end if;
  if r.vat_amount <> 5988.56 then raise exception 'vat after disc % <> 5988.56', r.vat_amount; end if;
  if r.total <> 47331.37 then raise exception 'total after disc % <> 47331.37', r.total; end if;

  -- read_only cannot edit items; PM without project cannot see the quote
  perform test_as('00000000-0000-4000-8000-0000000000a4');
  update public.quote_items set sell_price = 1 where quote_id = v_q; get diagnostics n = row_count; if n <> 0 then raise exception 'read_only edited items'; end if;
  perform test_as('00000000-0000-4000-8000-0000000000a3');
  select count(*) into n from public.quotes where id = v_q; if n <> 0 then raise exception 'PM sees unrelated quote'; end if;

  -- send → items frozen
  perform test_as('00000000-0000-4000-8000-0000000000a2');
  update public.quotes set status = 'sent', sent_at = now() where id = v_q;
  begin
    update public.quote_items set sell_price = 1 where quote_id = v_q;
    raise exception 'edited items of a sent quote';
  exception when check_violation then null; end;

  -- customer views + accepts via token (service role path emulated as postgres)
  perform test_reset();
  perform public.quote_mark_viewed((select public_token from public.quotes where id = v_q));
  if (select status from public.quotes where id = v_q) <> 'viewed' then raise exception 'not viewed'; end if;
  if not public.quote_customer_decision((select public_token from public.quotes where id = v_q), 'accept', 'Sam Tester', 'ok') then raise exception 'accept failed'; end if;
  if (select status from public.quotes where id = v_q) <> 'accepted' then raise exception 'not accepted'; end if;
  if public.quote_customer_decision((select public_token from public.quotes where id = v_q), 'decline', 'x') then raise exception 'decision not idempotent'; end if;

  -- revision of accepted quote refused; revision of a sent quote works and supersedes
  perform test_as('00000000-0000-4000-8000-0000000000a2');
  begin perform public.create_quote_revision(v_q); raise exception 'revised an accepted quote'; exception when check_violation then null; end;
  insert into public.quotes (organisation_id, quote_number, client_id, title) values ('00000000-0000-4000-8000-000000000001', '', '00000000-0000-4000-8000-0000000000c1', 'TEST Q2') returning id into v_q2;
  insert into public.quote_items (organisation_id, quote_id, description, quantity, sell_price, vat_rate) values ('00000000-0000-4000-8000-000000000001', v_q2, 'x', 1, 100, 20);
  update public.quotes set status = 'sent' where id = v_q2;
  v_q2 := public.create_quote_revision(v_q2);
  if (select revision from public.quotes where id = v_q2) <> 1 then raise exception 'revision not 1'; end if;
  if (select status from public.quotes where id = (select supersedes_quote_id from public.quotes where id = v_q2)) <> 'superseded' then raise exception 'source not superseded'; end if;
  if (select count(*) from public.quote_items where quote_id = v_q2) <> 1 then raise exception 'items not copied'; end if;
  if (select total from public.quotes where id = v_q2) <> 120.00 then raise exception 'revision total not recalculated'; end if;

  -- quote → project (owner)
  perform test_as('00000000-0000-4000-8000-0000000000a1');
  v_pid := public.convert_quote_to_project(v_q, '00000000-0000-4000-8000-0000000000a3', null);
  if (select contract_value from public.projects where id = v_pid) <> 41342.81 then raise exception 'project contract value %', (select contract_value from public.projects where id = v_pid); end if;
  if (select estimated_cost from public.projects where id = v_pid) <> 28750.00 then raise exception 'project est cost'; end if;

  -- quote → deposit invoice 30% and full invoice
  perform test_as('00000000-0000-4000-8000-0000000000a2');
  v_dep := public.create_invoice_from_quote(v_q, 'deposit', 30);
  select * into r from public.invoices where id = v_dep;
  if r.status <> 'draft' or r.invoice_number <> '' then raise exception 'deposit should be draft without number'; end if;
  if r.total <> round(round(41342.81 * 0.3, 2) * (1 + round(5988.56/41342.81*100, 2)/100), 2) then raise exception 'deposit total %', r.total; end if;
  v_inv := public.create_invoice_from_quote(v_q, 'standard', 100);
  if (select converted_invoice_id from public.quotes where id = v_q) <> v_inv then raise exception 'quote not linked to invoice'; end if;
  if (select count(*) from public.invoice_items where invoice_id = v_inv) <> 3 then raise exception 'invoice items not copied'; end if;
  if (select total from public.invoices where id = v_inv) <> 47331.37 then raise exception 'invoice total %', (select total from public.invoices where id = v_inv); end if;

  -- issue: number assigned, due date from client terms (30 days), then frozen
  v_num := public.issue_invoice(v_inv, current_date);
  if v_num !~ '^OAR-INV-\d{4}-0001$' then raise exception 'invoice number %', v_num; end if;
  if (select due_date from public.invoices where id = v_inv) <> current_date + 30 then raise exception 'due date not from terms'; end if;
  if (select status from public.invoices where id = v_inv) <> 'issued' then raise exception 'not issued'; end if;
  begin update public.invoices set title = 'hacked' where id = v_inv; raise exception 'edited issued invoice'; exception when check_violation then null; end;
  begin insert into public.invoice_items (organisation_id, invoice_id, description, quantity, sell_price) values ('00000000-0000-4000-8000-000000000001', v_inv, 'x', 1, 1); raise exception 'added line to issued invoice'; exception when check_violation then null; end;
  -- internal notes still editable
  update public.invoices set internal_notes = 'ok' where id = v_inv;

  -- payments: part then full
  insert into public.payments (organisation_id, invoice_id, amount, method, recorded_by) values ('00000000-0000-4000-8000-000000000001', v_inv, 10000.00, 'bank_transfer', '00000000-0000-4000-8000-0000000000a2');
  if (select status from public.invoices where id = v_inv) <> 'part_paid' then raise exception 'not part_paid'; end if;
  if (select amount_paid from public.invoices where id = v_inv) <> 10000.00 then raise exception 'amount_paid wrong'; end if;
  insert into public.payments (organisation_id, invoice_id, amount, method, recorded_by) values ('00000000-0000-4000-8000-000000000001', v_inv, 37331.37, 'bank_transfer', '00000000-0000-4000-8000-0000000000a2');
  if (select status from public.invoices where id = v_inv) <> 'paid' then raise exception 'not paid'; end if;
  if (select paid_at from public.invoices where id = v_inv) is null then raise exception 'paid_at missing'; end if;

  -- cannot cancel a paid invoice; credit note works
  begin perform public.cancel_invoice(v_inv, 'x'); raise exception 'cancelled paid invoice'; exception when check_violation then null; end;
  v_cn := public.create_credit_note(v_inv);
  if (select kind from public.invoices where id = v_cn) <> 'credit_note' then raise exception 'not credit note'; end if;
  if (select total from public.invoices where id = v_cn) <> 47331.37 then raise exception 'credit total'; end if;
  perform public.issue_invoice(v_cn);
  if (select status from public.invoices where id = v_cn) <> 'credit' then raise exception 'credit status'; end if;

  -- overdue sweep
  perform test_reset();
  perform set_config('app.bypass_invoice_guard', 'on', true);
  update public.invoices set due_date = current_date - 1, status = 'issued', amount_paid = 0 where id = v_dep;
  update public.invoices set invoice_number = 'OAR-INV-TEST-0002' where id = v_dep;
  perform set_config('app.bypass_invoice_guard', 'off', true);
  perform test_as('00000000-0000-4000-8000-0000000000a2');
  -- recalc on due_date change already derived 'overdue'; the sweep is idempotent
  if (select status from public.invoices where id = v_dep) <> 'overdue' then raise exception 'not overdue'; end if;
  if public.refresh_overdue_invoices('00000000-0000-4000-8000-000000000001') <> 0 then raise exception 'overdue sweep not idempotent'; end if;

  -- org B isolation
  perform test_as('00000000-0000-4000-8000-0000000000b1');
  select count(*) into n from public.quotes; if n <> 0 then raise exception 'org B sees quotes'; end if;
  select count(*) into n from public.invoices; if n <> 0 then raise exception 'org B sees invoices'; end if;
  select count(*) into n from public.payments; if n <> 0 then raise exception 'org B sees payments'; end if;
  select count(*) into n from public.vat_rates; if n <> 4 then raise exception 'org B vat rates % (expected own 4)', n; end if;

  perform test_reset();
  raise notice 'PASS quotes + invoices';
end $$;
drop function test_as(uuid); drop function test_reset();

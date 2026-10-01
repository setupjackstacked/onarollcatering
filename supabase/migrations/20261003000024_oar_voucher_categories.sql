-- ============================================================================
-- 0024 — The voucher categories On A Roll actually uses.
--
-- The seeded defaults were a reasonable guess at a contract caterer's
-- vocabulary — vouchers, paid meals, free meals, complimentary, staff meals.
-- The business counts something simpler and more useful: what was served, and
-- whether a drink went with it.
--
--   Breakfast · Breakfast + Can/Water · Lunch · Lunch + Can/Water
--
-- All four are chargeable; the distinction here is meal type, not who pays.
-- Categories remain an admin-editable lookup, so this sets the starting point
-- rather than fixing it forever.
-- ============================================================================

create or replace function public.seed_org_voucher_defaults(org uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  insert into public.voucher_categories (organisation_id, key, label, description, is_chargeable, sort_order) values
    (org, 'breakfast',            'Breakfast',               'Breakfast served',                        true, 10),
    (org, 'breakfast-drink',      'Breakfast + Can/Water',   'Breakfast served with a can or water',    true, 20),
    (org, 'lunch',                'Lunch',                   'Lunch served',                            true, 30),
    (org, 'lunch-drink',          'Lunch + Can/Water',       'Lunch served with a can or water',        true, 40)
  on conflict (organisation_id, key) do nothing;
end $$;

-- Apply to every existing organisation.
do $$ declare o record; begin
  for o in select id from public.organisations loop perform public.seed_org_voucher_defaults(o.id); end loop;
end $$;

-- Retire the original guesses. A category that has already been counted against
-- is deactivated rather than deleted, so historical entries keep their meaning;
-- one that was never used is removed outright so the list stays short.
do $$
declare c record;
begin
  for c in
    select vc.id, vc.organisation_id, vc.key,
           exists (select 1 from public.voucher_entry_lines l where l.category_id = vc.id) as used
      from public.voucher_categories vc
     where vc.key in ('vouchers', 'paid-meals', 'free-meals', 'complimentary', 'staff-meals')
  loop
    if c.used then
      update public.voucher_categories set active = false where id = c.id;
    else
      delete from public.voucher_categories where id = c.id;
    end if;
  end loop;
end $$;

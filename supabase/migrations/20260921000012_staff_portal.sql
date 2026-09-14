-- ============================================================================
-- 0012 — Phase 12: staff portal. Lets an employee maintain their own contact
--        and emergency details without giving them access to HR fields.
-- ============================================================================

-- Employees may update their own row; a guard limits which columns can change.
create policy employees_update_self on public.employees for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create or replace function public.employees_self_update_guard()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  -- Service-role / server-side work (no JWT) and owners/administrators may change anything.
  if auth.uid() is null then return new; end if;
  if public.role_in(new.organisation_id, 'owner','administrator') then return new; end if;

  -- Everyone else (an employee editing their own record) may change only
  -- their phone number and emergency contact. Any other edit is rejected.
  if new.first_name is distinct from old.first_name
     or new.last_name is distinct from old.last_name
     or new.email is distinct from old.email
     or new.address is distinct from old.address
     or new.role_key is distinct from old.role_key
     or new.employment_type is distinct from old.employment_type
     or new.start_date is distinct from old.start_date
     or new.end_date is distinct from old.end_date
     or new.hourly_rate is distinct from old.hourly_rate
     or new.salary is distinct from old.salary
     or new.status is distinct from old.status
     or new.notes is distinct from old.notes
     or new.user_id is distinct from old.user_id
     or new.employee_number is distinct from old.employee_number
     or new.organisation_id is distinct from old.organisation_id
     or new.archived_at is distinct from old.archived_at
  then
    raise exception 'You can only change your phone number and emergency contact' using errcode = '42501';
  end if;
  return new;
end $$;
create trigger employees_self_update before update on public.employees
  for each row execute function public.employees_self_update_guard();

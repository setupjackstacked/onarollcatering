-- Development seed. DO NOT run against production.
-- All sample records are prefixed "SAMPLE" so they are unmistakable.

-- Organisation
insert into public.organisations (id, name, slug)
values ('00000000-0000-4000-8000-000000000001', 'On A Roll Catering', 'on-a-roll-catering')
on conflict (slug) do nothing;

-- Dev users. On real Supabase, create these through Auth (dashboard / CLI) instead;
-- the insert below only works on a local stack where auth.users is writable.
insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-4000-8000-0000000000a1', 'dev-owner@example.com',   '{"full_name":"SAMPLE Owner"}'),
  ('00000000-0000-4000-8000-0000000000a2', 'dev-finance@example.com', '{"full_name":"SAMPLE Finance"}'),
  ('00000000-0000-4000-8000-0000000000a3', 'dev-pm@example.com',      '{"full_name":"SAMPLE Project Manager"}'),
  ('00000000-0000-4000-8000-0000000000a4', 'dev-readonly@example.com','{"full_name":"SAMPLE Read Only"}'),
  ('00000000-0000-4000-8000-0000000000a5', 'dev-staff@example.com',   '{"full_name":"SAMPLE Staff"}')
on conflict (id) do nothing;

insert into public.organisation_members (organisation_id, user_id, role, accepted_at) values
  ('00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-0000000000a1', 'owner',           now()),
  ('00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-0000000000a2', 'finance',         now()),
  ('00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-0000000000a3', 'project_manager', now()),
  ('00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-0000000000a4', 'read_only',       now()),
  ('00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-0000000000a5', 'staff',           now())
on conflict (organisation_id, user_id) do nothing;

-- Sample client, contact, site
insert into public.clients (id, organisation_id, name, legal_name, email, phone, payment_terms_days, billing_address, notes)
values ('00000000-0000-4000-8000-0000000000c1', '00000000-0000-4000-8000-000000000001',
        'SAMPLE Northgate Construction', 'SAMPLE Northgate Construction Ltd', 'sample@example.com', '0000 000 0000', 30,
        '{"line1":"1 Sample Street","city":"Leeds","postcode":"LS1 1AA","country":"GB"}', 'Sample data — not a real client')
on conflict (id) do nothing;

insert into public.client_contacts (id, organisation_id, client_id, first_name, last_name, job_title, email, is_primary, is_project)
values ('00000000-0000-4000-8000-0000000000d1', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-0000000000c1',
        'Sample', 'Contact', 'Site Manager', 'sample.contact@example.com', true, true)
on conflict (id) do nothing;

insert into public.sites (id, organisation_id, client_id, name, address, postcode, site_contact_id)
values ('00000000-0000-4000-8000-0000000000e1', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-0000000000c1',
        'SAMPLE North Compound', '{"line1":"Sample Road","city":"Leeds","country":"GB"}', 'LS9 9ZZ', '00000000-0000-4000-8000-0000000000d1')
on conflict (id) do nothing;

-- Sample lead (from website) and a sample project assigned to the PM user
insert into public.leads (id, organisation_id, title, status, client_id, contact_id, source_key, service_keys,
                          estimated_value, project_location, assigned_user_id, notes)
values ('00000000-0000-4000-8000-0000000000f1', '00000000-0000-4000-8000-000000000001',
        'SAMPLE Site canteen for north compound', 'qualified', '00000000-0000-4000-8000-0000000000c1',
        '00000000-0000-4000-8000-0000000000d1', 'website', '{commercial-catering,modular-kitchens}',
        185000.00, 'Leeds', '00000000-0000-4000-8000-0000000000a1', 'Sample lead')
on conflict (id) do nothing;

insert into public.projects (id, organisation_id, name, status, client_id, site_id, lead_id, project_manager_id,
                             start_date, end_date, contract_value, estimated_cost, service_keys)
values ('00000000-0000-4000-8000-000000000101', '00000000-0000-4000-8000-000000000001',
        'SAMPLE North Compound catering', 'planning', '00000000-0000-4000-8000-0000000000c1',
        '00000000-0000-4000-8000-0000000000e1', '00000000-0000-4000-8000-0000000000f1', '00000000-0000-4000-8000-0000000000a3',
        current_date + 30, current_date + 400, 185000.00, 142000.00, '{commercial-catering,modular-kitchens}')
on conflict (id) do nothing;

-- Sample employee linked to the staff login (Phase 8)
insert into public.employees (id, organisation_id, employee_number, user_id, first_name, last_name, email, role_key,
                              employment_type, start_date, hourly_rate, status)
values ('00000000-0000-4000-8000-000000000201', '00000000-0000-4000-8000-000000000001', '', '00000000-0000-4000-8000-0000000000a5',
        'SAMPLE', 'Staff', 'dev-staff@example.com', 'chef', 'full_time', current_date - 200, 18.50, 'active')
on conflict (id) do nothing;

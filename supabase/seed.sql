-- ===========================================================================
-- seed.sql  (OPTIONAL demo data)
-- Run this after migrations to populate the app with realistic sample data so
-- you can explore every screen. Safe to skip for a real production shop.
-- All records use NULL for created_by so the seed works before any staff
-- account exists.
-- ===========================================================================

-- Shop identity
update public.shop_settings set
  shop_name        = 'Joe''s Garage',
  legal_name       = 'Joe''s Garage LLC',
  email            = 'service@joesgarage.example',
  phone            = '(555) 010-2020',
  address_line1    = '142 Industrial Way',
  city             = 'Springfield',
  state            = 'CA',
  postal_code      = '90210',
  default_tax_rate = 0.0825,
  default_labor_rate = 135.00
where id = 1;

-- Vendors
insert into public.vendors (id, name, phone, email) values
  ('11111111-1111-1111-1111-111111111101', 'NAPA Auto Parts', '(555) 200-1000', 'sales@napa.example'),
  ('11111111-1111-1111-1111-111111111102', 'O''Reilly Auto Parts', '(555) 200-2000', 'orders@oreilly.example'),
  ('11111111-1111-1111-1111-111111111103', 'WorldPac', '(555) 200-3000', 'support@worldpac.example')
on conflict (id) do nothing;

-- Parts inventory
insert into public.parts (part_number, name, category, brand, vendor_id, cost, price, quantity_on_hand, reorder_level) values
  ('OF-1145', 'Oil Filter', 'Filters', 'Mobil 1', '11111111-1111-1111-1111-111111111101', 6.50, 14.99, 24, 6),
  ('SYN-5W30', 'Full Synthetic 5W-30 (qt)', 'Fluids', 'Mobil 1', '11111111-1111-1111-1111-111111111101', 5.25, 11.99, 60, 12),
  ('BP-2201', 'Front Brake Pads (ceramic)', 'Brakes', 'Wagner', '11111111-1111-1111-1111-111111111102', 38.00, 89.99, 8, 4),
  ('BR-3310', 'Brake Rotor (front)', 'Brakes', 'Raybestos', '11111111-1111-1111-1111-111111111103', 41.00, 99.99, 6, 2),
  ('BAT-H6', 'Battery Group 48 (H6)', 'Electrical', 'Interstate', '11111111-1111-1111-1111-111111111101', 110.00, 199.99, 5, 2),
  ('WB-22', 'Wiper Blade 22"', 'Accessories', 'Bosch', '11111111-1111-1111-1111-111111111102', 7.00, 18.99, 30, 8)
on conflict do nothing;

-- Customers
insert into public.customers (id, first_name, last_name, company, email, phone, customer_type, city, state) values
  ('22222222-2222-2222-2222-222222222201', 'Maria',  'Gonzalez', null, 'maria.g@example.com', '(555) 301-1001', 'individual', 'Springfield', 'CA'),
  ('22222222-2222-2222-2222-222222222202', 'David',  'Chen',     null, 'dchen@example.com',  '(555) 301-1002', 'individual', 'Springfield', 'CA'),
  ('22222222-2222-2222-2222-222222222203', null,     null,       'Citywide Plumbing', 'fleet@citywideplumbing.example', '(555) 301-2000', 'fleet', 'Springfield', 'CA')
on conflict (id) do nothing;

-- Vehicles
insert into public.vehicles (id, customer_id, year, make, model, vin, license_plate, mileage) values
  ('33333333-3333-3333-3333-333333333301', '22222222-2222-2222-2222-222222222201', 2018, 'Honda', 'Civic', '2HGFC2F50JH500001', '7ABC123', 64200),
  ('33333333-3333-3333-3333-333333333302', '22222222-2222-2222-2222-222222222202', 2015, 'Toyota', 'Tacoma', '5TFAX5GN0FX500002', '8XYZ987', 98750),
  ('33333333-3333-3333-3333-333333333303', '22222222-2222-2222-2222-222222222203', 2020, 'Ford', 'Transit 250', '1FTBR1C80LK500003', 'CWP-12', 41200)
on conflict (id) do nothing;

-- A completed invoice (paid) for Maria's Civic — oil change + wipers
insert into public.invoices (id, customer_id, vehicle_id, status, issue_date, due_date, tax_rate)
values ('44444444-4444-4444-4444-444444444401',
        '22222222-2222-2222-2222-222222222201',
        '33333333-3333-3333-3333-333333333301',
        'draft', current_date - 20, current_date - 5, 0.0825)
on conflict (id) do nothing;

insert into public.invoice_items (invoice_id, item_type, description, quantity, unit_price, taxable, sort_order) values
  ('44444444-4444-4444-4444-444444444401', 'labor', 'Lube, oil & filter service', 0.5, 135.00, false, 1),
  ('44444444-4444-4444-4444-444444444401', 'part',  'Full Synthetic 5W-30 (qt)', 5, 11.99, true, 2),
  ('44444444-4444-4444-4444-444444444401', 'part',  'Oil Filter', 1, 14.99, true, 3),
  ('44444444-4444-4444-4444-444444444401', 'part',  'Wiper Blade 22"', 2, 18.99, true, 4)
on conflict do nothing;

-- Pay it in full (recalc trigger will mark it paid)
insert into public.payments (invoice_id, amount, method, paid_at)
select id, total, 'card', current_date - 18
from public.invoices where id = '44444444-4444-4444-4444-444444444401'
on conflict do nothing;

-- An open invoice (sent, unpaid) for David's Tacoma — front brakes
insert into public.invoices (id, customer_id, vehicle_id, status, issue_date, due_date, tax_rate)
values ('44444444-4444-4444-4444-444444444402',
        '22222222-2222-2222-2222-222222222202',
        '33333333-3333-3333-3333-333333333302',
        'sent', current_date - 3, current_date + 12, 0.0825)
on conflict (id) do nothing;

insert into public.invoice_items (invoice_id, item_type, description, quantity, unit_price, taxable, sort_order) values
  ('44444444-4444-4444-4444-444444444402', 'labor', 'Front brake pad & rotor replacement', 2.0, 135.00, false, 1),
  ('44444444-4444-4444-4444-444444444402', 'part',  'Front Brake Pads (ceramic)', 1, 89.99, true, 2),
  ('44444444-4444-4444-4444-444444444402', 'part',  'Brake Rotor (front)', 2, 99.99, true, 3),
  ('44444444-4444-4444-4444-444444444402', 'fee',   'Shop supplies & disposal', 1, 12.00, true, 4)
on conflict do nothing;

-- An open work order in progress for the fleet Transit
insert into public.work_orders (id, customer_id, vehicle_id, status, priority, customer_concern, odometer_in)
values ('55555555-5555-5555-5555-555555555501',
        '22222222-2222-2222-2222-222222222203',
        '33333333-3333-3333-3333-333333333303',
        'in_progress', 'high',
        'Battery dies overnight; dash warning lights intermittent.', 41200)
on conflict (id) do nothing;

insert into public.work_order_items (work_order_id, item_type, description, quantity, unit_price, sort_order) values
  ('55555555-5555-5555-5555-555555555501', 'labor', 'Electrical system diagnosis', 1.0, 135.00, 1),
  ('55555555-5555-5555-5555-555555555501', 'part',  'Battery Group 48 (H6)', 1, 199.99, 2)
on conflict do nothing;

-- An estimate awaiting customer approval
insert into public.estimates (id, customer_id, vehicle_id, status, issue_date, expiry_date, tax_rate, customer_concern)
values ('66666666-6666-6666-6666-666666666601',
        '22222222-2222-2222-2222-222222222201',
        '33333333-3333-3333-3333-333333333301',
        'sent', current_date - 1, current_date + 29, 0.0825,
        'Customer reports squealing from front brakes.')
on conflict (id) do nothing;

insert into public.estimate_items (estimate_id, item_type, description, quantity, unit_price, taxable, sort_order) values
  ('66666666-6666-6666-6666-666666666601', 'labor', 'Front brake service', 2.0, 135.00, false, 1),
  ('66666666-6666-6666-6666-666666666601', 'part',  'Front Brake Pads (ceramic)', 1, 89.99, true, 2),
  ('66666666-6666-6666-6666-666666666601', 'part',  'Brake Rotor (front)', 2, 99.99, true, 3)
on conflict do nothing;

-- Some expenses for the books
insert into public.expenses (expense_date, vendor_id, vendor_name, category_id, amount, tax_amount, payment_method, description)
select current_date - 10, '11111111-1111-1111-1111-111111111101', 'NAPA Auto Parts',
       (select id from public.expense_categories where name like 'Parts%' limit 1),
       420.55, 34.70, 'card', 'Weekly parts restock'
on conflict do nothing;

insert into public.expenses (expense_date, vendor_name, category_id, amount, payment_method, description)
select current_date - 5, 'City Power & Water',
       (select id from public.expense_categories where name = 'Utilities' limit 1),
       310.00, 'ach', 'Electric + water'
on conflict do nothing;

insert into public.expenses (expense_date, vendor_name, category_id, amount, payment_method, description)
select current_date - 2, 'Springfield Commercial Realty',
       (select id from public.expense_categories where name = 'Rent / Lease' limit 1),
       2400.00, 'ach', 'Monthly shop rent'
on conflict do nothing;

-- Appointments
insert into public.appointments (customer_id, vehicle_id, title, status, start_time, end_time)
values
  ('22222222-2222-2222-2222-222222222201', '33333333-3333-3333-3333-333333333301',
   'Brake inspection', 'scheduled', now() + interval '1 day' + interval '9 hours', now() + interval '1 day' + interval '10 hours'),
  ('22222222-2222-2222-2222-222222222202', '33333333-3333-3333-3333-333333333302',
   'Oil change', 'confirmed', now() + interval '2 days' + interval '13 hours', now() + interval '2 days' + interval '14 hours')
on conflict do nothing;

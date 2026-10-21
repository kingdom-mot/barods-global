-- =====================================================================
-- Barods Global: full database setup (schema + starting content)
-- HOW TO USE: open this file, select ALL the text, copy it, paste it into
-- Supabase > SQL Editor > New query, then click Run.
-- Safe to run more than once.
-- =====================================================================

-- Barods Global — core schema
-- Run in Supabase SQL editor (or `supabase db push`).

create extension if not exists "pgcrypto";

-- ---------- Locations: country › state › city › area ----------
create table if not exists countries (
  code text primary key,                -- 'NG', 'ZA'
  name text not null,
  currency text not null,               -- 'NGN', 'ZAR'
  currency_symbol text not null,
  active boolean not null default true
);

create table if not exists states (
  id uuid primary key default gen_random_uuid(),
  country_code text not null references countries(code),
  name text not null,
  slug text not null,
  active boolean not null default true,
  unique (country_code, slug)
);

create table if not exists cities (
  id uuid primary key default gen_random_uuid(),
  state_id uuid not null references states(id) on delete cascade,
  name text not null,
  slug text not null,
  active boolean not null default true,
  unique (state_id, slug)
);

create table if not exists areas (
  id uuid primary key default gen_random_uuid(),
  city_id uuid not null references cities(id) on delete cascade,
  name text not null,
  slug text not null,
  active boolean not null default true,
  unique (city_id, slug)
);

-- ---------- Users and agents ----------
do $$ begin create type user_role as enum ('super_admin', 'admin', 'agent'); exception when duplicate_object then null; end $$;

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  email text not null unique check (email ilike '%@barodsglobal.com' or role = 'super_admin'),
  role user_role not null default 'agent',
  is_owner boolean not null default false,   -- Babatunde Denton: cannot be removed
  created_at timestamptz not null default now()
);

create table if not exists agents (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid unique references profiles(id) on delete set null,
  slug text not null unique,
  full_name text not null,
  position text,
  email text not null,
  phone text,
  whatsapp text,
  photo_url text,
  bio text,
  socials jsonb not null default '{}',
  verified boolean not null default false,
  listings_need_approval boolean not null default true,
  status text not null default 'active' check (status in ('active', 'invited', 'suspended')),
  created_at timestamptz not null default now()
);

-- ---------- Taxonomies ----------
create table if not exists property_types (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid references property_types(id),
  name text not null,
  slug text not null unique,
  sort int not null default 0
);

create table if not exists amenities (
  id uuid primary key default gen_random_uuid(),
  group_name text not null,     -- Interior and finishing, Power and utilities, …
  name text not null,
  slug text not null unique,
  most_listed boolean not null default false
);

-- ---------- Properties ----------
do $$ begin create type listing_purpose as enum ('sale', 'rent', 'shortlet'); exception when duplicate_object then null; end $$;
do $$ begin create type listing_status as enum ('draft', 'pending_review', 'sent_back', 'published', 'archived'); exception when duplicate_object then null; end $$;
do $$ begin create type availability as enum ('available', 'under_offer', 'sold', 'let', 'unavailable'); exception when duplicate_object then null; end $$;

create table if not exists properties (
  id uuid primary key default gen_random_uuid(),
  ref text not null unique,                     -- BG-10231
  slug text not null unique,
  title text not null,
  description text,
  purpose listing_purpose not null,
  property_type_id uuid references property_types(id),
  agent_id uuid references agents(id),
  -- location
  country_code text not null references countries(code) default 'NG',
  state_id uuid references states(id),
  city_id uuid references cities(id),
  area_id uuid references areas(id),
  street text,
  lat double precision,
  lng double precision,
  -- price (stored in the listing's own currency)
  price numeric(16, 2),
  price_on_application boolean not null default false,
  currency text not null default 'NGN',
  price_period text check (price_period in ('once', 'year', 'month', 'night')),
  negotiable boolean,
  payment_plan text,               -- outright / instalment
  instalment_deposit_pct int,
  instalment_months int,
  -- rent (NG)
  payment_frequency text,
  minimum_tenure_years int,
  service_charge_band text,
  agency_fee_pct numeric(5, 2),
  legal_fee_pct numeric(5, 2),
  caution_fee text,
  -- rent (ZA)
  deposit text,
  lease_term_months int,
  pets_allowed boolean,
  -- sale (ZA)
  levies_band text,
  rates_taxes_band text,
  -- shortlet
  minimum_nights int,
  max_guests int,
  check_in time,
  check_out time,
  -- details
  bedrooms int,
  bathrooms int,
  toilets int,
  parking int,
  floor_size_sqm int,
  land_size text,
  condition text,
  furnishing text,
  serviced boolean default false,
  shared boolean default false,
  has_bq boolean default false,
  title_document text,
  video_url text,
  virtual_tour_url text,
  -- workflow
  status listing_status not null default 'draft',
  availability availability not null default 'available',
  featured boolean not null default false,
  label text,                      -- Hot Offer, New, Price Reduced, Sole Mandate, On Show, Offer Made
  review_note text,
  seo_title text,
  seo_description text,
  views int not null default 0,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists properties_search_idx
  on properties (status, purpose, country_code, state_id, city_id, property_type_id, price);

create table if not exists property_media (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references properties(id) on delete cascade,
  kind text not null default 'photo' check (kind in ('photo', 'floor_plan', 'document')),
  url text not null,
  is_public boolean not null default true,
  sort int not null default 0
);

create table if not exists property_amenities (
  property_id uuid references properties(id) on delete cascade,
  amenity_id uuid references amenities(id) on delete cascade,
  primary key (property_id, amenity_id)
);

-- ---------- Leads ----------
create table if not exists leads (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text,
  email text,
  message text,
  source text not null default 'property_enquiry',  -- property_enquiry, viewing_request, contact, agent_profile, service
  property_id uuid references properties(id) on delete set null,
  agent_id uuid references agents(id) on delete set null,
  status text not null default 'new'
    check (status in ('new', 'contacted', 'viewing_booked', 'offer_made', 'closed_won', 'closed_lost')),
  viewing_at timestamptz,
  internal_note text,
  created_at timestamptz not null default now()
);

-- ---------- Site content ----------
create table if not exists team_members (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  role text,
  email text,
  photo_url text,
  sort int not null default 0,
  show_on_home boolean not null default true
);

create table if not exists partners (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  logo_url text not null,
  link text,
  sort int not null default 0
);

create table if not exists posts (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  excerpt text,
  body text,
  cover_url text,
  category text,
  author text,
  status text not null default 'draft' check (status in ('draft', 'scheduled', 'published')),
  published_at timestamptz
);

create table if not exists site_settings (
  key text primary key,
  value jsonb not null
);

create table if not exists currency_rates (
  currency text primary key,          -- ZAR, USD, GBP, EUR, CAD
  per_ngn numeric(18, 8) not null,    -- units of currency per ₦1
  override_per_ngn numeric(18, 8),
  enabled boolean not null default true,
  updated_at timestamptz not null default now()
);

create table if not exists redirects (
  from_path text primary key,
  to_path text not null,
  hits int not null default 0
);

create table if not exists activity_log (
  id bigserial primary key,
  actor uuid references profiles(id),
  action text not null,
  entity text,
  entity_id text,
  created_at timestamptz not null default now()
);

-- ---------- Row-level security ----------
alter table properties enable row level security;
alter table leads enable row level security;
alter table agents enable row level security;

-- Public can read published listings and active agents.
drop policy if exists "public read published properties" on properties;
create policy "public read published properties" on properties
  for select using (status = 'published');
drop policy if exists "public read active agents" on agents;
create policy "public read active agents" on agents
  for select using (status = 'active');

-- Anyone can submit a lead (enquiry form); only staff/agents can read them.
drop policy if exists "public insert leads" on leads;
create policy "public insert leads" on leads for insert with check (true);

create or replace function current_role_is(r user_role) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid() and role = r)
$$;

drop policy if exists "staff read all leads" on leads;
create policy "staff read all leads" on leads for select
  using (current_role_is('admin') or current_role_is('super_admin'));
drop policy if exists "agents read own leads" on leads;
create policy "agents read own leads" on leads for select
  using (agent_id in (select id from agents where profile_id = auth.uid()));

drop policy if exists "staff manage properties" on properties;
create policy "staff manage properties" on properties for all
  using (current_role_is('admin') or current_role_is('super_admin'));
drop policy if exists "agents manage own properties" on properties;
create policy "agents manage own properties" on properties for all
  using (agent_id in (select id from agents where profile_id = auth.uid()))
  with check (agent_id in (select id from agents where profile_id = auth.uid())
              and status in ('draft', 'pending_review'));

-- The owner account can never be deleted.
create or replace function protect_owner() returns trigger language plpgsql as $$
begin
  if old.is_owner then raise exception 'The owner account cannot be removed'; end if;
  return old;
end $$;
drop trigger if exists profiles_protect_owner on profiles;
create trigger profiles_protect_owner before delete on profiles
  for each row execute function protect_owner();

-- ---------- Lock down every other table ----------
-- Supabase exposes all public tables to the browser key, so each table needs
-- row-level security. Reference content is read-only to the public; only staff edit.
do $$
declare t text;
begin
  foreach t in array array['countries','states','cities','areas','property_types','amenities',
    'property_media','property_amenities','team_members','partners','posts','site_settings',
    'currency_rates','redirects','profiles','activity_log'] loop
    execute format('alter table %I enable row level security', t);
  end loop;
  foreach t in array array['countries','states','cities','areas','property_types','amenities',
    'property_media','property_amenities','team_members','partners','site_settings',
    'currency_rates','redirects'] loop
    execute format('drop policy if exists "public read" on %I', t);
    execute format('create policy "public read" on %I for select using (true)', t);
  end loop;
  foreach t in array array['countries','states','cities','areas','property_types','amenities',
    'property_media','property_amenities','team_members','partners','posts','site_settings',
    'currency_rates','redirects','agents','leads','activity_log'] loop
    execute format('drop policy if exists "staff manage" on %I', t);
    execute format('create policy "staff manage" on %I for all using (current_role_is(''admin'') or current_role_is(''super_admin'')) with check (current_role_is(''admin'') or current_role_is(''super_admin''))', t);
  end loop;
end $$;

drop policy if exists "public read published posts" on posts;
create policy "public read published posts" on posts for select using (status = 'published');
drop policy if exists "read own profile" on profiles;
create policy "read own profile" on profiles for select using (id = auth.uid());
drop policy if exists "staff read profiles" on profiles;
create policy "staff read profiles" on profiles for select
  using (current_role_is('admin') or current_role_is('super_admin'));

-- =================== Starting content ===================
-- Barods Global — seed data (current live content from barodsglobal.com, Oct 2026)

insert into countries (code, name, currency, currency_symbol) values
  ('NG', 'Nigeria', 'NGN', '₦'),
  ('ZA', 'South Africa', 'ZAR', 'R')
on conflict (code) do nothing;

-- Nigeria: 36 states + FCT
insert into states (country_code, name, slug)
select 'NG', s, lower(regexp_replace(s, '[^A-Za-z]+', '-', 'g')) from unnest(array[
  'Abia','Adamawa','Akwa Ibom','Anambra','Bauchi','Bayelsa','Benue','Borno','Cross River','Delta',
  'Ebonyi','Edo','Ekiti','Enugu','FCT Abuja','Gombe','Imo','Jigawa','Kaduna','Kano','Katsina','Kebbi',
  'Kogi','Kwara','Lagos','Nasarawa','Niger','Ogun','Ondo','Osun','Oyo','Plateau','Rivers','Sokoto',
  'Taraba','Yobe','Zamfara'
]) as s
on conflict do nothing;

-- South Africa: 9 provinces
insert into states (country_code, name, slug)
select 'ZA', s, lower(regexp_replace(s, '[^A-Za-z]+', '-', 'g')) from unnest(array[
  'Eastern Cape','Free State','Gauteng','KwaZulu-Natal','Limpopo','Mpumalanga','North West',
  'Northern Cape','Western Cape'
]) as s
on conflict do nothing;

-- Cities Barods lists today (more are added from the admin portal)
insert into cities (state_id, name, slug)
select st.id, c.name, c.slug from (values
  ('ogun', 'Abeokuta', 'abeokuta'), ('ogun', 'Sagamu', 'sagamu'), ('ogun', 'Ijebu Ode', 'ijebu-ode'),
  ('lagos', 'Lagos', 'lagos'), ('lagos', 'Epe', 'epe'), ('lagos', 'Lekki', 'lekki'), ('lagos', 'Ikeja', 'ikeja'),
  ('oyo', 'Ibadan', 'ibadan'), ('ekiti', 'Ado-Ekiti', 'ado-ekiti'), ('fct-abuja', 'Abuja', 'abuja'),
  ('gauteng', 'Johannesburg', 'johannesburg'), ('gauteng', 'Pretoria', 'pretoria')
) as c(state_slug, name, slug)
join states st on st.slug = c.state_slug
on conflict do nothing;

insert into areas (city_id, name, slug)
select ci.id, a.name, a.slug from (values
  ('abeokuta', 'Ibara GRA', 'ibara-gra'), ('abeokuta', 'Oke-Mosan', 'oke-mosan'),
  ('abeokuta', 'Kemta', 'kemta'), ('abeokuta', 'Asero', 'asero'),
  ('johannesburg', 'Sandton', 'sandton'), ('johannesburg', 'Rosebank', 'rosebank')
) as a(city_slug, name, slug)
join cities ci on ci.slug = a.city_slug
on conflict do nothing;

-- Property types
insert into property_types (name, slug, sort) values
  ('Flat / Apartment', 'flat-apartment', 1), ('House', 'house', 2), ('Land', 'land', 3), ('Commercial', 'commercial', 4)
on conflict (slug) do nothing;

insert into property_types (parent_id, name, slug, sort)
select p.id, t.name, t.slug, t.sort from (values
  ('flat-apartment', 'Mini Flat', 'mini-flat', 1), ('flat-apartment', 'Self Contain', 'self-contain', 2),
  ('flat-apartment', 'Apartment', 'apartment', 3),
  ('house', 'Detached Duplex', 'detached-duplex', 1), ('house', 'Semi-detached Duplex', 'semi-detached-duplex', 2),
  ('house', 'Terraced Duplex', 'terraced-duplex', 3), ('house', 'Detached Bungalow', 'detached-bungalow', 4),
  ('house', 'Semi-detached Bungalow', 'semi-detached-bungalow', 5), ('house', 'Block of Flats', 'block-of-flats', 6),
  ('land', 'Residential Land', 'residential-land', 1), ('land', 'Commercial Land', 'commercial-land', 2),
  ('land', 'Mixed-use Land', 'mixed-use-land', 3), ('land', 'Farm Land', 'farm-land', 4),
  ('commercial', 'Office Space', 'office-space', 1), ('commercial', 'Shop', 'shop', 2),
  ('commercial', 'Plaza / Mall', 'plaza-mall', 3), ('commercial', 'Warehouse', 'warehouse', 4),
  ('commercial', 'Hotel / Guest House', 'hotel-guest-house', 5)
) as t(parent_slug, name, slug, sort)
join property_types p on p.slug = t.parent_slug
on conflict (slug) do nothing;

-- Amenities (5 groups)
insert into amenities (group_name, name, slug, most_listed)
select g, n, lower(regexp_replace(n, '[^A-Za-z0-9]+', '-', 'g')), m from (values
  ('Interior and finishing','Fitted kitchen',true),('Interior and finishing','Air conditioning',true),
  ('Interior and finishing','POP ceiling',false),('Interior and finishing','Built-in wardrobes',false),
  ('Interior and finishing','En-suite bedrooms',true),('Interior and finishing','Tiled floors',false),
  ('Interior and finishing','Water heater',false),('Interior and finishing','Guest toilet',false),
  ('Interior and finishing','Smart home',false),('Interior and finishing','Cinema room',false),
  ('Interior and finishing','Family lounge',false),('Interior and finishing','Jacuzzi / bathtub',false),
  ('Interior and finishing','Walk-in closet',false),
  ('Power and utilities','24/7 power supply',true),('Power and utilities','Prepaid meter',false),
  ('Power and utilities','Standby generator',false),('Power and utilities','Solar power',false),
  ('Power and utilities','Inverter',false),('Power and utilities','Borehole',true),
  ('Power and utilities','Treated water',false),('Power and utilities','Internet / WiFi',false),
  ('Security and safety','Security gate',true),('Security and safety','Perimeter fencing',false),
  ('Security and safety','Electric fence',false),('Security and safety','Burglar proof',false),
  ('Security and safety','CCTV',false),('Security and safety','Security / gateman',false),
  ('Security and safety','Intercom',false),('Security and safety','Fire safety',false),
  ('Outdoor and communal','Swimming pool',true),('Outdoor and communal','Landscaped garden',false),
  ('Outdoor and communal','Boys'' quarters (BQ)',true),('Outdoor and communal','Car park',false),
  ('Outdoor and communal','Balcony',false),('Outdoor and communal','Elevator',false),
  ('Outdoor and communal','Gym',false),('Outdoor and communal','Rooftop terrace',false),
  ('Outdoor and communal','Children''s playground',false),('Outdoor and communal','Tarred road',false),
  ('Services and entertainment','Netflix',false),('Services and entertainment','DStv',false),
  ('Services and entertainment','Smart TV',false),('Services and entertainment','Housekeeping',false),
  ('Services and entertainment','Washing machine',false),('Services and entertainment','Smart lock',false),
  ('Services and entertainment','Dedicated workspace',false)
) as a(g, n, m)
on conflict (slug) do nothing;

-- Team (Meet Our Team) — from the current site
insert into team_members (full_name, role, email, sort)
select * from (values
  ('Babatunde Denton', 'CEO', 'tunde@barodsglobal.com', 1),
  ('ESV Ajibola Akinwande ANIVS, RSV', 'General Manager', 'ajibola@barodsglobal.com', 2),
  ('Lawrita C. Agbor', 'HR / Senior Property Consultant', 'lawrita@barodsglobal.com', 3),
  ('Lolade Ogundimu', 'Executive Secretary', 'lolade@barodsglobal.com', 4),
  ('Kehinde Oregbesan', 'Lead Architect', 'kehinde@barodsglobal.com', 5),
  ('Toyosi Akinbobola', 'Property Consultant', 'toyosi@barodsglobal.com', 6)
) v(full_name, role, email, sort)
where not exists (select 1 from team_members);

-- Agents (public profiles)
insert into agents (slug, full_name, position, email, verified, status) values
  ('lawrita-agbor', 'Lawrita C. Agbor', 'Senior Property Consultant', 'lawrita@barodsglobal.com', true, 'active'),
  ('toyosi-akinbobola', 'Toyosi Akinbobola', 'Property Consultant', 'toyosi@barodsglobal.com', true, 'active'),
  ('ajibola-akinwande', 'ESV Ajibola Akinwande', 'General Manager', 'ajibola@barodsglobal.com', true, 'active')
on conflict (slug) do nothing;

-- Listings live on barodsglobal.com today
insert into properties (ref, slug, title, purpose, property_type_id, agent_id, country_code, state_id, city_id, area_id,
  price, currency, price_period, bedrooms, bathrooms, toilets, parking, floor_size_sqm, land_size,
  status, availability, featured, label, published_at, has_bq, condition)
select 'BG-10231', 'brand-new-luxury-5-bed-duplex-with-a-swimming-pool-bq',
  'Brand new luxury 5 bed duplex with a swimming pool & BQ', 'sale'::listing_purpose,
  (select id from property_types where slug = 'detached-duplex'),
  (select id from agents where slug = 'lawrita-agbor'),
  'NG', (select id from states where slug = 'ogun'), (select id from cities where slug = 'abeokuta'), null,
  220000000, 'NGN', 'once', 5, 5, 6, 2, 520, null,
  'published'::listing_status, 'available'::availability, true, 'Hot Offer', now() - interval '2 days', true, 'Newly built'
union all
select 'BG-10232', 'a-prime-plot-of-land-for-sale-at-ibara-gra-abeokuta-ogun-state',
  'A prime plot of land for sale at Ibara GRA, Abeokuta, Ogun State', 'sale',
  (select id from property_types where slug = 'residential-land'),
  (select id from agents where slug = 'toyosi-akinbobola'),
  'NG', (select id from states where slug = 'ogun'), (select id from cities where slug = 'abeokuta'),
  (select id from areas where slug = 'ibara-gra'),
  120000000, 'NGN', 'once', null, null, null, null, null, '450 sqm',
  'published', 'available', true, null, now() - interval '7 days', false, null
on conflict (ref) do nothing;

insert into site_settings (key, value) values
  ('contact', '{"address":"Suite B104, Providence Mall, Opposite Globus Bank, Leme Abiola Way, Abeokuta","phone":"+234 802 228 8806","email":"support@barodsglobal.com"}'),
  ('lead_recipients', '[]'),
  ('default_rent_period', '"year"')
on conflict (key) do nothing;

-- Placeholder rates (refreshed daily by the rates job)
insert into currency_rates (currency, per_ngn) values
  ('ZAR', 0.0118), ('USD', 0.00065), ('GBP', 0.00050), ('EUR', 0.00060), ('CAD', 0.00090)
on conflict (currency) do nothing;

-- =================== Listing details ===================
-- 0003: listing details (address, description, title document, photos, amenities). Safe to re-run.
alter table properties add column if not exists address text;

update properties set description = 'A brand new five-bedroom detached duplex with a private swimming pool and boys’ quarters, finished to a high standard in a secure neighbourhood of Abeokuta.', title_document = 'C of O' where ref = 'BG-10231';
insert into property_media (property_id, kind, url, sort)
select p.id, 'photo', v.url, v.sort from properties p, (values
  ('https://barodsglobal.com/wp-content/uploads/2025/08/1-584x438.png', 0)
) v(url, sort)
where p.ref = 'BG-10231' and not exists (select 1 from property_media m where m.property_id = p.id and m.url = v.url);
insert into property_amenities (property_id, amenity_id)
select p.id, a.id from properties p, amenities a
where p.ref = 'BG-10231' and a.name in ('Swimming pool', 'Boys'' quarters (BQ)', 'Fitted kitchen', 'En-suite bedrooms', 'Security gate')
on conflict do nothing;

update properties set description = 'A 450 sqm plot of land in Ibara GRA, one of Abeokuta’s most established residential neighbourhoods, with a Certificate of Occupancy (C of O). Ideal for building a family home or holding as a long-term investment, with easy access to major parts of the city.', title_document = 'Certificate of Occupancy (C of O)', address = 'Ibara GRA' where ref = 'BG-10232';
insert into property_media (property_id, kind, url, sort)
select p.id, 'photo', v.url, v.sort from properties p, (values
  ('https://barodsglobal.com/wp-content/uploads/2026/10/WhatsApp-Image-2026-10-07-at-4.28.25-PM.jpeg', 0),
  ('https://barodsglobal.com/wp-content/uploads/2026/10/11156564.jpeg', 1),
  ('https://barodsglobal.com/wp-content/uploads/2026/10/111.jpeg', 2),
  ('https://barodsglobal.com/wp-content/uploads/2026/10/2222.jpeg', 3),
  ('https://barodsglobal.com/wp-content/uploads/2026/10/IHIO.jpeg', 4),
  ('https://barodsglobal.com/wp-content/uploads/2026/10/WhatsApp-Image-2026-10-07-at-4.28.23-PM.jpeg', 5),
  ('https://barodsglobal.com/wp-content/uploads/2026/10/WhatsApp-Image-2026-10-07-at-4.28.25-PM-1.jpeg', 6)
) v(url, sort)
where p.ref = 'BG-10232' and not exists (select 1 from property_media m where m.property_id = p.id and m.url = v.url);
insert into property_amenities (property_id, amenity_id)
select p.id, a.id from properties p, amenities a
where p.ref = 'BG-10232' and a.name in ('Tarred road')
on conflict do nothing;

-- =================== Agent portal ===================
-- 0004: agent portal. Safe to run more than once.
--   1. Accounts: every new sign-in user gets a profile; only @barodsglobal.com emails are allowed.
--   2. Listings get their BG- reference and web address automatically.
--   3. Agents can only add/edit their own listings, which always go to admin review.
--   4. Photo storage bucket.
--   5. Cities and areas for every Nigerian state and South African province.

-- ---------- Helpers ----------
-- Fix: the role check must skip row-level security, or the profiles policy calls itself forever.
create or replace function current_role_is(r user_role) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid() and role = r)
$$;

create or replace function is_staff() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid() and role in ('admin', 'super_admin'))
$$;

create or replace function my_agent_id() returns uuid
language sql stable security definer set search_path = public as $$
  select id from agents where profile_id = auth.uid()
$$;

-- ---------- 1. Accounts ----------
create or replace function link_user(p_id uuid, p_email text, p_meta jsonb) returns void
language plpgsql security definer set search_path = public as $$
declare
  v_name text;
  v_owner boolean := lower(p_email) = 'tunde@barodsglobal.com';
  v_agent uuid;
  v_slug text;
begin
  if p_email is null or p_email not ilike '%@barodsglobal.com' then
    raise exception 'Only @barodsglobal.com email addresses can have a Barods account';
  end if;
  v_name := coalesce(nullif(p_meta->>'full_name', ''), initcap(replace(split_part(p_email, '@', 1), '.', ' ')));

  insert into profiles (id, full_name, email, role, is_owner)
  values (p_id, v_name, lower(p_email), case when v_owner then 'super_admin'::user_role else 'agent'::user_role end, v_owner)
  on conflict (id) do nothing;

  if v_owner then return; end if;

  -- Existing public agent card with the same email? Link it. Otherwise create one, hidden until completed.
  update agents set profile_id = p_id where lower(email) = lower(p_email) and profile_id is null returning id into v_agent;
  if v_agent is null and not exists (select 1 from agents where profile_id = p_id) then
    v_slug := trim(both '-' from regexp_replace(lower(v_name), '[^a-z0-9]+', '-', 'g'));
    if exists (select 1 from agents where slug = v_slug) then v_slug := v_slug || '-' || substr(p_id::text, 1, 4); end if;
    insert into agents (profile_id, slug, full_name, position, email, status)
    values (p_id, v_slug, v_name, 'Property Consultant', lower(p_email), 'invited');
  end if;
end $$;

create or replace function handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  perform link_user(new.id, new.email, coalesce(new.raw_user_meta_data, '{}'::jsonb));
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function handle_new_user();

-- Users created before this file ran
do $$
declare u record;
begin
  for u in select id, email, raw_user_meta_data from auth.users
           where id not in (select id from profiles) and email ilike '%@barodsglobal.com' loop
    perform link_user(u.id, u.email, coalesce(u.raw_user_meta_data, '{}'::jsonb));
  end loop;
end $$;

-- The owner can't be demoted either
create or replace function protect_owner_role() returns trigger language plpgsql as $$
begin
  if old.is_owner and (new.role <> old.role or not new.is_owner) then
    raise exception 'The owner account cannot be changed';
  end if;
  return new;
end $$;
drop trigger if exists profiles_protect_owner_role on profiles;
create trigger profiles_protect_owner_role before update on profiles
  for each row execute function protect_owner_role();

-- ---------- 2. Reference number and web address ----------
create sequence if not exists property_ref_seq;
do $$ begin
  perform setval('property_ref_seq',
    greatest(10232, coalesce((select max(substring(ref from 4)::int) from properties where ref ~ '^BG-[0-9]+$'), 0)));
end $$;

create or replace function properties_defaults() returns trigger language plpgsql as $$
begin
  if new.ref is null or new.ref = '' then new.ref := 'BG-' || nextval('property_ref_seq'); end if;
  if new.slug is null or new.slug = '' then
    new.slug := trim(both '-' from regexp_replace(lower(new.title), '[^a-z0-9]+', '-', 'g')) || '-' || lower(new.ref);
  end if;
  new.updated_at := now();
  return new;
end $$;
drop trigger if exists properties_defaults on properties;
create trigger properties_defaults before insert or update on properties
  for each row execute function properties_defaults();

-- ---------- 3. What agents can do ----------
-- Agents can't feature, label, approve or move a listing to another agent. Staff and the SQL editor can.
create or replace function properties_agent_guard() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null or is_staff() then return new; end if;
  if tg_op = 'INSERT' then
    new.agent_id := my_agent_id();
    new.featured := false; new.label := null; new.review_note := null; new.published_at := null; new.views := 0;
  else
    new.agent_id := old.agent_id; new.ref := old.ref; new.slug := old.slug;
    new.featured := old.featured; new.label := old.label; new.review_note := old.review_note;
    new.published_at := old.published_at; new.views := old.views;
  end if;
  return new;
end $$;
drop trigger if exists properties_agent_guard on properties;
create trigger properties_agent_guard before insert or update on properties
  for each row execute function properties_agent_guard();

drop policy if exists "agents manage own properties" on properties;
drop policy if exists "agents read own properties" on properties;
drop policy if exists "agents add properties" on properties;
drop policy if exists "agents edit own properties" on properties;
drop policy if exists "agents delete own drafts" on properties;
create policy "agents read own properties" on properties for select
  using (agent_id = my_agent_id());
create policy "agents add properties" on properties for insert
  with check (my_agent_id() is not null and status in ('draft', 'pending_review'));
create policy "agents edit own properties" on properties for update
  using (agent_id = my_agent_id())
  with check (agent_id = my_agent_id() and status in ('draft', 'pending_review'));
create policy "agents delete own drafts" on properties for delete
  using (agent_id = my_agent_id() and status in ('draft', 'sent_back'));

-- Marking a live listing Sold / Let / Under offer doesn't need a fresh review.
create or replace function set_listing_availability(p_id uuid, p_availability availability) returns void
language plpgsql security definer set search_path = public as $$
begin
  update properties set availability = p_availability
  where id = p_id and (agent_id = my_agent_id() or is_staff());
  if not found then raise exception 'Listing not found'; end if;
end $$;
grant execute on function set_listing_availability(uuid, availability) to authenticated;

-- Photos and features: public only for live listings; agents manage their own.
drop policy if exists "public read" on property_media;
create policy "public read" on property_media for select
  using (is_public and property_id in (select id from properties));
drop policy if exists "agents manage own media" on property_media;
create policy "agents manage own media" on property_media for all
  using (property_id in (select id from properties where agent_id = my_agent_id()))
  with check (property_id in (select id from properties where agent_id = my_agent_id()));

drop policy if exists "public read" on property_amenities;
create policy "public read" on property_amenities for select
  using (property_id in (select id from properties));
drop policy if exists "agents manage own amenities" on property_amenities;
create policy "agents manage own amenities" on property_amenities for all
  using (property_id in (select id from properties where agent_id = my_agent_id()))
  with check (property_id in (select id from properties where agent_id = my_agent_id()));

-- Agents see and update their own leads (status, notes).
drop policy if exists "agents update own leads" on leads;
create policy "agents update own leads" on leads for update
  using (agent_id = my_agent_id()) with check (agent_id = my_agent_id());

-- Agents can see and edit their own public card (not verification, slug or email).
drop policy if exists "agents read own card" on agents;
create policy "agents read own card" on agents for select using (profile_id = auth.uid());
drop policy if exists "agents edit own card" on agents;
create policy "agents edit own card" on agents for update
  using (profile_id = auth.uid()) with check (profile_id = auth.uid());

create or replace function agents_self_guard() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null or is_staff() then return new; end if;
  new.slug := old.slug; new.email := old.email; new.profile_id := old.profile_id;
  new.verified := old.verified; new.listings_need_approval := old.listings_need_approval;
  -- An agent can go from invited to active by completing their card, but can't un-suspend.
  if not (old.status = 'invited' and new.status = 'active') then new.status := old.status; end if;
  return new;
end $$;
drop trigger if exists agents_self_guard on agents;
create trigger agents_self_guard before update on agents
  for each row execute function agents_self_guard();

-- ---------- 4. Photo storage ----------
do $$
begin
  if exists (select 1 from information_schema.schemata where schema_name = 'storage') then
    insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    values ('listing-photos', 'listing-photos', true, 10485760, array['image/jpeg', 'image/png', 'image/webp'])
    on conflict (id) do nothing;

    execute 'drop policy if exists "barods upload own photos" on storage.objects';
    execute $p$create policy "barods upload own photos" on storage.objects for insert to authenticated
      with check (bucket_id = 'listing-photos' and (storage.foldername(name))[1] = auth.uid()::text)$p$;
    execute 'drop policy if exists "barods delete own photos" on storage.objects';
    execute $p$create policy "barods delete own photos" on storage.objects for delete to authenticated
      using (bucket_id = 'listing-photos' and (storage.foldername(name))[1] = auth.uid()::text)$p$;
  end if;
end $$;

-- ---------- 5. Cities and areas ----------
insert into cities (state_id, name, slug)
select st.id, c.name, lower(trim(both '-' from regexp_replace(c.name, '[^A-Za-z0-9]+', '-', 'g')))
from (values
  ('abia', 'Umuahia'), ('abia', 'Aba'), ('abia', 'Ohafia'), ('abia', 'Arochukwu'),
  ('adamawa', 'Yola'), ('adamawa', 'Jimeta'), ('adamawa', 'Mubi'), ('adamawa', 'Numan'),
  ('akwa-ibom', 'Uyo'), ('akwa-ibom', 'Eket'), ('akwa-ibom', 'Ikot Ekpene'), ('akwa-ibom', 'Oron'),
  ('anambra', 'Awka'), ('anambra', 'Onitsha'), ('anambra', 'Nnewi'), ('anambra', 'Ekwulobia'),
  ('bauchi', 'Bauchi'), ('bauchi', 'Azare'), ('bauchi', 'Misau'),
  ('bayelsa', 'Yenagoa'), ('bayelsa', 'Brass'), ('bayelsa', 'Ogbia'),
  ('benue', 'Makurdi'), ('benue', 'Gboko'), ('benue', 'Otukpo'),
  ('borno', 'Maiduguri'), ('borno', 'Biu'), ('borno', 'Bama'),
  ('cross-river', 'Calabar'), ('cross-river', 'Ikom'), ('cross-river', 'Ogoja'), ('cross-river', 'Obudu'),
  ('delta', 'Asaba'), ('delta', 'Warri'), ('delta', 'Sapele'), ('delta', 'Ughelli'), ('delta', 'Agbor'),
  ('ebonyi', 'Abakaliki'), ('ebonyi', 'Afikpo'), ('ebonyi', 'Onueke'),
  ('edo', 'Benin City'), ('edo', 'Auchi'), ('edo', 'Ekpoma'), ('edo', 'Uromi'),
  ('ekiti', 'Ikere-Ekiti'), ('ekiti', 'Ikole-Ekiti'), ('ekiti', 'Ijero-Ekiti'),
  ('enugu', 'Enugu'), ('enugu', 'Nsukka'), ('enugu', 'Agbani'), ('enugu', 'Oji River'),
  ('fct-abuja', 'Kubwa'), ('fct-abuja', 'Lugbe'), ('fct-abuja', 'Gwagwalada'), ('fct-abuja', 'Bwari'), ('fct-abuja', 'Kuje'),
  ('gombe', 'Gombe'), ('gombe', 'Kumo'), ('gombe', 'Billiri'),
  ('imo', 'Owerri'), ('imo', 'Orlu'), ('imo', 'Okigwe'),
  ('jigawa', 'Dutse'), ('jigawa', 'Hadejia'), ('jigawa', 'Gumel'),
  ('kaduna', 'Kaduna'), ('kaduna', 'Zaria'), ('kaduna', 'Kafanchan'),
  ('kano', 'Kano'), ('kano', 'Wudil'), ('kano', 'Rano'),
  ('katsina', 'Katsina'), ('katsina', 'Daura'), ('katsina', 'Funtua'),
  ('kebbi', 'Birnin Kebbi'), ('kebbi', 'Argungu'), ('kebbi', 'Yauri'),
  ('kogi', 'Lokoja'), ('kogi', 'Okene'), ('kogi', 'Idah'), ('kogi', 'Kabba'),
  ('kwara', 'Ilorin'), ('kwara', 'Offa'), ('kwara', 'Omu-Aran'),
  ('lagos', 'Ikoyi'), ('lagos', 'Victoria Island'), ('lagos', 'Ajah'), ('lagos', 'Ikorodu'), ('lagos', 'Yaba'),
  ('lagos', 'Surulere'), ('lagos', 'Gbagada'), ('lagos', 'Magodo'), ('lagos', 'Ibeju-Lekki'), ('lagos', 'Badagry'),
  ('lagos', 'Ojo'), ('lagos', 'Isolo'), ('lagos', 'Agege'), ('lagos', 'Ogba'), ('lagos', 'Maryland'),
  ('nasarawa', 'Lafia'), ('nasarawa', 'Keffi'), ('nasarawa', 'Akwanga'), ('nasarawa', 'Karu'),
  ('niger', 'Minna'), ('niger', 'Bida'), ('niger', 'Suleja'), ('niger', 'Kontagora'),
  ('ogun', 'Ota'), ('ogun', 'Ifo'), ('ogun', 'Mowe'), ('ogun', 'Ibafo'), ('ogun', 'Ilaro'),
  ('ondo', 'Akure'), ('ondo', 'Ondo'), ('ondo', 'Owo'), ('ondo', 'Ore'),
  ('osun', 'Osogbo'), ('osun', 'Ile-Ife'), ('osun', 'Ilesa'), ('osun', 'Ede'), ('osun', 'Iwo'),
  ('oyo', 'Ogbomoso'), ('oyo', 'Oyo'), ('oyo', 'Iseyin'), ('oyo', 'Saki'),
  ('plateau', 'Jos'), ('plateau', 'Bukuru'), ('plateau', 'Pankshin'),
  ('rivers', 'Port Harcourt'), ('rivers', 'Obio-Akpor'), ('rivers', 'Bonny'), ('rivers', 'Eleme'),
  ('sokoto', 'Sokoto'), ('sokoto', 'Tambuwal'), ('sokoto', 'Wurno'),
  ('taraba', 'Jalingo'), ('taraba', 'Wukari'), ('taraba', 'Bali'),
  ('yobe', 'Damaturu'), ('yobe', 'Potiskum'), ('yobe', 'Gashua'),
  ('zamfara', 'Gusau'), ('zamfara', 'Kaura Namoda'), ('zamfara', 'Talata Mafara'),
  ('eastern-cape', 'Gqeberha'), ('eastern-cape', 'East London'), ('eastern-cape', 'Mthatha'),
  ('free-state', 'Bloemfontein'), ('free-state', 'Welkom'),
  ('gauteng', 'Sandton'), ('gauteng', 'Midrand'), ('gauteng', 'Centurion'), ('gauteng', 'Soweto'),
  ('kwazulu-natal', 'Durban'), ('kwazulu-natal', 'Pietermaritzburg'), ('kwazulu-natal', 'Umhlanga'),
  ('limpopo', 'Polokwane'), ('limpopo', 'Tzaneen'),
  ('mpumalanga', 'Mbombela'), ('mpumalanga', 'Witbank'),
  ('north-west', 'Rustenburg'), ('north-west', 'Mahikeng'),
  ('northern-cape', 'Kimberley'), ('northern-cape', 'Upington'),
  ('western-cape', 'Cape Town'), ('western-cape', 'Stellenbosch'), ('western-cape', 'George'), ('western-cape', 'Paarl')
) as c(state_slug, name)
join states st on st.slug = c.state_slug
on conflict do nothing;

insert into areas (city_id, name, slug)
select ci.id, a.name, lower(trim(both '-' from regexp_replace(a.name, '[^A-Za-z0-9]+', '-', 'g')))
from (values
  ('ogun', 'abeokuta', 'Oke-Ilewo'), ('ogun', 'abeokuta', 'Kuto'), ('ogun', 'abeokuta', 'Adigbe'),
  ('ogun', 'abeokuta', 'Onikolobo'), ('ogun', 'abeokuta', 'Obantoko'), ('ogun', 'abeokuta', 'Isale-Ake'),
  ('ogun', 'abeokuta', 'Ita-Eko'), ('ogun', 'abeokuta', 'Olomore'), ('ogun', 'abeokuta', 'Panseke'),
  ('ogun', 'abeokuta', 'Idi-Aba'), ('ogun', 'abeokuta', 'Elega'), ('ogun', 'abeokuta', 'Quarry Road'),
  ('ogun', 'abeokuta', 'Olokemeji GRA Extension'), ('ogun', 'abeokuta', 'Pelican Valley Estate'),
  ('ogun', 'abeokuta', 'Lafenwa'), ('ogun', 'abeokuta', 'Totoro'), ('ogun', 'abeokuta', 'Camp'),
  ('lagos', 'lekki', 'Lekki Phase 1'), ('lagos', 'lekki', 'Chevron'), ('lagos', 'lekki', 'Ikota'),
  ('lagos', 'lekki', 'Osapa London'), ('lagos', 'lekki', 'Agungi'), ('lagos', 'lekki', 'Ikate'),
  ('lagos', 'lekki', 'Jakande'), ('lagos', 'lekki', 'VGC'), ('lagos', 'lekki', 'Orchid Road'),
  ('lagos', 'ajah', 'Sangotedo'), ('lagos', 'ajah', 'Abraham Adesanya'), ('lagos', 'ajah', 'Badore'), ('lagos', 'ajah', 'Thomas Estate'),
  ('lagos', 'ikeja', 'Ikeja GRA'), ('lagos', 'ikeja', 'Allen Avenue'), ('lagos', 'ikeja', 'Opebi'),
  ('lagos', 'ikeja', 'Alausa'), ('lagos', 'ikeja', 'Oregun'), ('lagos', 'ikeja', 'Adeniyi Jones'),
  ('lagos', 'ikoyi', 'Banana Island'), ('lagos', 'ikoyi', 'Old Ikoyi'), ('lagos', 'ikoyi', 'Parkview Estate'),
  ('lagos', 'victoria-island', 'Oniru'), ('lagos', 'victoria-island', 'Eko Atlantic'),
  ('lagos', 'magodo', 'Magodo Phase 1'), ('lagos', 'magodo', 'Magodo Phase 2'),
  ('lagos', 'yaba', 'Sabo'), ('lagos', 'yaba', 'Akoka'), ('lagos', 'surulere', 'Adeniran Ogunsanya'),
  ('fct-abuja', 'abuja', 'Maitama'), ('fct-abuja', 'abuja', 'Asokoro'), ('fct-abuja', 'abuja', 'Wuse'),
  ('fct-abuja', 'abuja', 'Wuse 2'), ('fct-abuja', 'abuja', 'Garki'), ('fct-abuja', 'abuja', 'Jabi'),
  ('fct-abuja', 'abuja', 'Utako'), ('fct-abuja', 'abuja', 'Gwarinpa'), ('fct-abuja', 'abuja', 'Katampe'),
  ('fct-abuja', 'abuja', 'Life Camp'), ('fct-abuja', 'abuja', 'Guzape'), ('fct-abuja', 'abuja', 'Lokogoma'),
  ('fct-abuja', 'abuja', 'Jahi'), ('fct-abuja', 'abuja', 'Mabushi'), ('fct-abuja', 'abuja', 'Apo'),
  ('fct-abuja', 'abuja', 'Wuye'), ('fct-abuja', 'abuja', 'Durumi'), ('fct-abuja', 'abuja', 'Kado'),
  ('oyo', 'ibadan', 'Bodija'), ('oyo', 'ibadan', 'Jericho'), ('oyo', 'ibadan', 'Oluyole Estate'),
  ('oyo', 'ibadan', 'Akobo'), ('oyo', 'ibadan', 'Iyaganku GRA'), ('oyo', 'ibadan', 'Ring Road'),
  ('oyo', 'ibadan', 'Challenge'), ('oyo', 'ibadan', 'Samonda'), ('oyo', 'ibadan', 'Agodi GRA'),
  ('rivers', 'port-harcourt', 'Old GRA'), ('rivers', 'port-harcourt', 'New GRA'), ('rivers', 'port-harcourt', 'Trans Amadi'),
  ('rivers', 'port-harcourt', 'Rumuola'), ('rivers', 'port-harcourt', 'Woji'), ('rivers', 'port-harcourt', 'Peter Odili Road'),
  ('ekiti', 'ado-ekiti', 'Ajilosun'), ('ekiti', 'ado-ekiti', 'Basiri'), ('ekiti', 'ado-ekiti', 'GRA'),
  ('gauteng', 'johannesburg', 'Fourways'), ('gauteng', 'johannesburg', 'Randburg'), ('gauteng', 'johannesburg', 'Melville'),
  ('gauteng', 'pretoria', 'Hatfield'), ('gauteng', 'pretoria', 'Menlyn'), ('gauteng', 'pretoria', 'Waterkloof'),
  ('western-cape', 'cape-town', 'Sea Point'), ('western-cape', 'cape-town', 'Camps Bay'), ('western-cape', 'cape-town', 'Claremont')
) as a(state_slug, city_slug, name)
join states st on st.slug = a.state_slug
join cities ci on ci.state_id = st.id and ci.slug = a.city_slug
on conflict do nothing;

-- =================== WordPress import ===================
-- 0005: WordPress import. Safe to run more than once.

-- Remember where each listing and agent came from, so the import can be re-run
-- (it updates instead of duplicating) and old links can be redirected.
alter table properties add column if not exists wp_id bigint unique;
alter table properties add column if not exists wp_slug text;
alter table agents add column if not exists wp_id bigint unique;
create index if not exists properties_wp_slug_idx on properties (wp_slug);

-- Every WordPress image to copy into Supabase storage, and how far the copy has got.
create table if not exists wp_media_copy (
  path text primary key,                 -- e.g. 2026/10/photo.jpeg (same path as on WordPress)
  source_url text not null,
  status text not null default 'pending' check (status in ('pending', 'done', 'error')),
  error text,
  updated_at timestamptz not null default now()
);
alter table wp_media_copy enable row level security;
drop policy if exists "staff manage" on wp_media_copy;
create policy "staff manage" on wp_media_copy for all
  using (current_role_is('admin') or current_role_is('super_admin'))
  with check (current_role_is('admin') or current_role_is('super_admin'));

-- Public bucket holding the copied WordPress images.
do $$
begin
  if exists (select 1 from information_schema.schemata where schema_name = 'storage') then
    insert into storage.buckets (id, name, public)
    values ('wp-media', 'wp-media', true)
    on conflict (id) do nothing;
  end if;
end $$;

-- The owner's account also links to his public agent card (Babatunde lists properties too).
create or replace function link_user(p_id uuid, p_email text, p_meta jsonb) returns void
language plpgsql security definer set search_path = public as $$
declare
  v_name text;
  v_owner boolean := lower(p_email) = 'tunde@barodsglobal.com';
  v_agent uuid;
  v_slug text;
begin
  if p_email is null or p_email not ilike '%@barodsglobal.com' then
    raise exception 'Only @barodsglobal.com email addresses can have a Barods account';
  end if;
  v_name := coalesce(nullif(p_meta->>'full_name', ''), initcap(replace(split_part(p_email, '@', 1), '.', ' ')));

  insert into profiles (id, full_name, email, role, is_owner)
  values (p_id, v_name, lower(p_email), case when v_owner then 'super_admin'::user_role else 'agent'::user_role end, v_owner)
  on conflict (id) do nothing;

  update agents set profile_id = p_id where lower(email) = lower(p_email) and profile_id is null returning id into v_agent;
  if v_owner then return; end if;

  if v_agent is null and not exists (select 1 from agents where profile_id = p_id) then
    v_slug := trim(both '-' from regexp_replace(lower(v_name), '[^a-z0-9]+', '-', 'g'));
    if exists (select 1 from agents where slug = v_slug) then v_slug := v_slug || '-' || substr(p_id::text, 1, 4); end if;
    insert into agents (profile_id, slug, full_name, position, email, status)
    values (p_id, v_slug, v_name, 'Property Consultant', lower(p_email), 'invited');
  end if;
end $$;

-- If the owner already signed in before his agent card existed, link it now.
update agents a set profile_id = p.id
from profiles p
where lower(a.email) = lower(p.email) and a.profile_id is null;

-- ===== 0007_site_content.sql =====
-- 0007: website content editable from the admin portal. Safe to run more than once.

-- ---------- Settings ----------
-- Lead recipients get a copy of every enquiry. Starting with the owner.
insert into site_settings (key, value) values ('lead_recipients', '["tunde@barodsglobal.com"]')
on conflict (key) do update set value = excluded.value
where site_settings.value = '[]'::jsonb;

insert into site_settings (key, value) values
  ('contact', '{"address":"Suite B104, Providence Mall, Opposite Globus Bank, Leme Abiola Way, Abeokuta","phone":"+234 802 228 8806","whatsapp":"+234 802 228 8806","email":"support@barodsglobal.com","tagline":"Your Trusted Partner in Real Estate & Construction Excellence."}'),
  ('socials', '{"facebook":"","instagram":"","linkedin":"","x":"","youtube":"","tiktok":""}'),
  ('hero', '{"eyebrow":"Real Estate and Construction","title":"Welcome To Barods Global Limited","subtitle":"Whether you’re buying your first home, selling property, investing in real estate, or building from the ground up, Barods is your trusted partner for excellence, innovation, and lasting value.","image":"/wp-content/uploads/2025/08/1-584x438.png"}'),
  ('mortgage', '{"ng_commercial_rate":22,"ng_commercial_min_deposit":20,"ng_commercial_max_term":20,"nhf_rate":6,"nhf_max_loan":15000000,"nhf_max_term":30,"za_prime_rate":10.5,"reviewed":"October 2026"}')
on conflict (key) do update set value = excluded.value || site_settings.value;  -- keep anything already edited, add new fields

-- Contact details are public; who receives leads is not.
drop policy if exists "public read" on site_settings;
create policy "public read" on site_settings for select using (key <> 'lead_recipients');

-- Live exchange rates are public (prices are converted for visitors).
drop policy if exists "public read" on currency_rates;
create policy "public read" on currency_rates for select using (true);

-- ---------- Team (Meet our team) ----------
alter table team_members add column if not exists show_on_about boolean not null default true;
update team_members t set photo_url = v.photo from (values
  ('tunde@barodsglobal.com', '/wp-content/uploads/2025/08/1-1.jpg'),
  ('ajibola@barodsglobal.com', '/wp-content/uploads/2025/08/3-1.jpg'),
  ('lawrita@barodsglobal.com', '/wp-content/uploads/2025/08/5-1.jpg'),
  ('lolade@barodsglobal.com', '/wp-content/uploads/2025/08/4-1.jpg'),
  ('kehinde@barodsglobal.com', '/wp-content/uploads/2025/08/6-1.jpg'),
  ('toyosi@barodsglobal.com', '/wp-content/uploads/2025/08/2-1.jpg')
) v(email, photo)
where t.email = v.email and t.photo_url is null;

-- ---------- Partners ----------
insert into partners (name, logo_url, sort)
select 'Partner ' || n, '/wp-content/uploads/2025/08/' || n || '.jpg', n
from generate_series(1, 9) n
where not exists (select 1 from partners);

-- ---------- Services ----------
create table if not exists services (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  summary text,
  body text,
  image_url text,
  sort int not null default 0,
  published boolean not null default true,
  updated_at timestamptz not null default now()
);
alter table services enable row level security;
drop policy if exists "public read" on services;
create policy "public read" on services for select using (published);
drop policy if exists "staff manage" on services;
create policy "staff manage" on services for all
  using (current_role_is('admin') or current_role_is('super_admin'))
  with check (current_role_is('admin') or current_role_is('super_admin'));

insert into services (slug, name, summary, image_url, sort) values
  ('architectural-designs', 'Architectural Designs',
   'Innovative architectural designs that combine creativity, functionality and sustainability — modern, practical and aesthetically pleasing spaces tailored to your needs.',
   '/wp-content/uploads/2025/08/plan4-b.png', 1),
  ('building-construction', 'Building Construction',
   'From residential homes to large-scale developments, building projects executed with precision and quality — durable, delivered on time and cost-effective.',
   '/wp-content/uploads/wp-realestate-uploads/_property_featured_image/2024/12/WhatsApp-Image-2024-12-19-at-11.35.12.jpeg', 2),
  ('property-management', 'Property Management',
   'Professional management that keeps your investments well-maintained, profitable and stress-free — tenant relations, maintenance and rent collection handled for you.',
   '/wp-content/uploads/2025/07/Barods-image.jpeg', 3)
on conflict (slug) do nothing;

-- ---------- Activity log: readable by staff, with the person's name ----------
drop policy if exists "staff manage" on activity_log;
create policy "staff manage" on activity_log for all
  using (current_role_is('admin') or current_role_is('super_admin'))
  with check (current_role_is('admin') or current_role_is('super_admin'));

-- ===== 0008_agent_areas.sql =====
-- 0008: areas each agent covers, shown on their public profile ("Areas: Lagos, Abeokuta, ...").
-- Safe to run more than once.
alter table agents add column if not exists service_areas text;

-- Carried over from the old WordPress profile.
update agents set service_areas = 'Lagos, Abeokuta, Ibadan, Johannesburg'
where slug = 'babatunde-denton' and (service_areas is null or service_areas = '');

-- ===== 0009_permissions.sql =====
-- 0009: permissions an admin can give individual people in the portal.
-- Admins and the owner can do everything; agents get only what's ticked for them.
-- Keys: listings, leads, blog, website, team, activity. Safe to run more than once.

alter table profiles add column if not exists permissions text[] not null default '{}';

-- Does the signed-in person have this permission? (Skips row security, like is_staff.)
create or replace function has_perm(p text) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from profiles
    where id = auth.uid() and (role in ('admin', 'super_admin') or p = any(permissions))
  )
$$;
grant execute on function has_perm(text) to authenticated, anon;

-- Listings: everything staff can do with listings, photos and features.
drop policy if exists "perm listings" on properties;
create policy "perm listings" on properties for all using (has_perm('listings')) with check (has_perm('listings'));
drop policy if exists "perm listings" on property_media;
create policy "perm listings" on property_media for all using (has_perm('listings')) with check (has_perm('listings'));
drop policy if exists "perm listings" on property_amenities;
create policy "perm listings" on property_amenities for all using (has_perm('listings')) with check (has_perm('listings'));
-- To reassign a listing they need the list of agents, including ones not on the website yet.
drop policy if exists "perm read agents" on agents;
create policy "perm read agents" on agents for select using (has_perm('listings') or has_perm('team'));

-- The listing guard lets people with the listings permission feature, label, approve and reassign.
create or replace function properties_agent_guard() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null or has_perm('listings') then return new; end if;
  if tg_op = 'INSERT' then
    new.agent_id := my_agent_id();
    new.featured := false; new.label := null; new.review_note := null; new.published_at := null; new.views := 0;
  else
    new.agent_id := old.agent_id; new.ref := old.ref; new.slug := old.slug;
    new.featured := old.featured; new.label := old.label; new.review_note := old.review_note;
    new.published_at := old.published_at; new.views := old.views;
  end if;
  return new;
end $$;

create or replace function set_listing_availability(p_id uuid, p_availability availability) returns void
language plpgsql security definer set search_path = public as $$
begin
  update properties set availability = p_availability
  where id = p_id and (agent_id = my_agent_id() or has_perm('listings'));
  if not found then raise exception 'Listing not found'; end if;
end $$;

-- Leads.
drop policy if exists "perm leads" on leads;
create policy "perm leads" on leads for all using (has_perm('leads')) with check (has_perm('leads'));

-- Blog.
drop policy if exists "perm blog" on posts;
create policy "perm blog" on posts for all using (has_perm('blog')) with check (has_perm('blog'));

-- Website content.
do $$
declare t text;
begin
  foreach t in array array['site_settings','team_members','partners','services','cities','areas','currency_rates'] loop
    execute format('drop policy if exists "perm website" on %I', t);
    execute format('create policy "perm website" on %I for all using (has_perm(''website'')) with check (has_perm(''website''))', t);
  end loop;
end $$;

-- Activity log: anyone signed in records their own actions; reading needs the permission.
drop policy if exists "log own actions" on activity_log;
create policy "log own actions" on activity_log for insert to authenticated with check (actor = auth.uid());
drop policy if exists "perm activity" on activity_log;
create policy "perm activity" on activity_log for select using (has_perm('activity'));

-- Names for the activity log and the agents list.
drop policy if exists "perm read profiles" on profiles;
create policy "perm read profiles" on profiles for select using (has_perm('activity') or has_perm('team'));

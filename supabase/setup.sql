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
language sql stable as $$
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

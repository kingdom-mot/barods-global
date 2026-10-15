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
create type user_role as enum ('super_admin', 'admin', 'agent');

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
create type listing_purpose as enum ('sale', 'rent', 'shortlet');
create type listing_status as enum ('draft', 'pending_review', 'sent_back', 'published', 'archived');
create type availability as enum ('available', 'under_offer', 'sold', 'let', 'unavailable');

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
create policy "public read published properties" on properties
  for select using (status = 'published');
create policy "public read active agents" on agents
  for select using (status = 'active');

-- Anyone can submit a lead (enquiry form); only staff/agents can read them.
create policy "public insert leads" on leads for insert with check (true);

create or replace function current_role_is(r user_role) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid() and role = r)
$$;

create policy "staff read all leads" on leads for select
  using (current_role_is('admin') or current_role_is('super_admin'));
create policy "agents read own leads" on leads for select
  using (agent_id in (select id from agents where profile_id = auth.uid()));

create policy "staff manage properties" on properties for all
  using (current_role_is('admin') or current_role_is('super_admin'));
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
create trigger profiles_protect_owner before delete on profiles
  for each row execute function protect_owner();

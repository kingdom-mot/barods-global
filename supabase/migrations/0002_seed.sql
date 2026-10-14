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
insert into team_members (full_name, role, email, sort) values
  ('Babatunde Denton', 'CEO', 'tunde@barodsglobal.com', 1),
  ('ESV Ajibola Akinwande ANIVS, RSV', 'General Manager', 'ajibola@barodsglobal.com', 2),
  ('Lawrita C. Agbor', 'HR / Senior Property Consultant', 'lawrita@barodsglobal.com', 3),
  ('Lolade Ogundimu', 'Executive Secretary', 'lolade@barodsglobal.com', 4),
  ('Kehinde Oregbesan', 'Lead Architect', 'kehinde@barodsglobal.com', 5),
  ('Toyosi Akinbobola', 'Property Consultant', 'toyosi@barodsglobal.com', 6);

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

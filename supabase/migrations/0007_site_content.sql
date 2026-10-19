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

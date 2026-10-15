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

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

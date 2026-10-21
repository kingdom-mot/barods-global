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

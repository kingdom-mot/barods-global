-- 0010: new agents appear on the website only after an admin approves them.
-- Agents can edit their own card but can no longer change its status (invited / active / suspended).
-- Safe to run more than once.
create or replace function agents_self_guard() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null or is_staff() or has_perm('team') then return new; end if;
  new.slug := old.slug; new.email := old.email; new.profile_id := old.profile_id;
  new.verified := old.verified; new.listings_need_approval := old.listings_need_approval;
  new.status := old.status;
  return new;
end $$;

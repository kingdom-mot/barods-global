-- 0013: security hardening (October 2026 review). Safe to run more than once.
-- Run AFTER the website update that saves leads through the server is live.

-- 1. Leads can only be created by the website's server (which applies the spam checks and sets safe values).
--    Before this, anyone with the public key could write leads directly, with any status or notes.
drop policy if exists "public insert leads" on leads;

-- 2. Internal database functions can't be called from outside. They still run as before inside the database
--    (sign-up linking, listing and agent guards, owner protection); only direct calls through the API are blocked.
do $$
declare f text;
begin
  foreach f in array array[
    'link_user(uuid, text, jsonb)',
    'handle_new_user()',
    'protect_owner()',
    'protect_owner_role()',
    'properties_defaults()',
    'properties_agent_guard()',
    'agents_self_guard()'
  ] loop
    if to_regprocedure(f) is not null then
      execute format('revoke execute on function %s from public, anon, authenticated', f);
    end if;
  end loop;
end $$;

-- 3. Signed-out visitors don't need to call the permission helpers.
do $$
begin
  if to_regprocedure('set_listing_availability(uuid, availability)') is not null then
    execute 'revoke execute on function set_listing_availability(uuid, availability) from public, anon';
    execute 'grant execute on function set_listing_availability(uuid, availability) to authenticated';
  end if;
end $$;

-- 0012: content fixes from the October 2026 website review. Safe to run more than once.

-- 1. Duplicate listing: "Brand New Luxury 5 Bed Duplex with a Swimming Pool & BQ" appears 6 times.
--    Keep BG-10231; archive the copies (off the website, still in the portal under Archived, restorable).
update properties
set status = 'archived'
where ref in ('BG-10233', 'BG-10234', 'BG-10235', 'BG-10236', 'BG-10237')
  and status <> 'archived'
  and title ilike '%5 bed%duplex%swimming pool%';

-- 2. BG-10247: "Chevron Lekk" → "Chevron Lekki" (title, description and address).
update properties
set title = regexp_replace(title, 'Lekk\M', 'Lekki', 'g'),
    description = regexp_replace(description, 'Lekk\M', 'Lekki', 'g'),
    address = regexp_replace(address, 'Lekk\M', 'Lekki', 'g')
where ref = 'BG-10247'
  and (title ~ 'Lekk\M' or description ~ 'Lekk\M' or address ~ 'Lekk\M');

-- 3. BG-10253: titled 5 bedroom but no bedroom count saved.
update properties
set bedrooms = 5
where ref = 'BG-10253' and bedrooms is null and title ~* '\m5[ -]?(bed|bedroom)';

-- 4. One title for Babatunde Denton everywhere (About Us uses "Founder and Chief Executive Officer").
update agents
set position = 'Founder and Chief Executive Officer'
where (slug = 'babatunde-denton' or lower(email) = 'tunde@barodsglobal.com')
  and position is distinct from 'Founder and Chief Executive Officer';
update team_members
set role = 'Founder and Chief Executive Officer'
where full_name ilike 'babatunde denton%' and role is distinct from 'Founder and Chief Executive Officer';

-- 5. Blog: every post has an author.
update posts set author = 'Barods Global' where author is null or btrim(author) = '';

-- 6. Blog: give "3 Reasons Why Abeokuta Is Ideal for First-Time Property Buyers" a category.
update posts set category = 'Buying'
where title ilike '3 reasons why abeokuta%' and (category is null or btrim(category) = '');

-- 7. Blog: the featured post's address was cut off mid-word ("…-destinat"). Rebuild it from the title,
--    shortened at a whole word. The old address keeps working: the site redirects it to the new one.
with fixed as (
  select id,
         case when length(full_slug) <= 90 then full_slug
              else regexp_replace(left(full_slug, 91), '-[^-]*$', '') end as new_slug
  from (
    select id, btrim(regexp_replace(lower(title), '[^a-z0-9]+', '-', 'g'), '-') as full_slug
    from posts
    where slug ~ '-destinat$'
  ) s
)
update posts p
set slug = f.new_slug
from fixed f
where p.id = f.id
  and f.new_slug <> p.slug
  and not exists (select 1 from posts x where x.slug = f.new_slug and x.id <> p.id);

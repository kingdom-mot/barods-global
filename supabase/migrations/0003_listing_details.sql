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

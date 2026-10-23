-- 0011: correct office address (M.K.O. Abiola Way, 110118). Only replaces the old address;
-- an address already edited in the portal is left alone. Safe to run more than once.
update site_settings
set value = jsonb_set(value, '{address}', '"Suite B104, Providence Mall, M.K.O. Abiola Way, Abeokuta 110118, Ogun State"')
where key = 'contact' and value->>'address' ilike '%Leme Abiola Way%';

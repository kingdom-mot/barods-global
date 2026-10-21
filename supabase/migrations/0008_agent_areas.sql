-- 0008: areas each agent covers, shown on their public profile ("Areas: Lagos, Abeokuta, ...").
-- Safe to run more than once.
alter table agents add column if not exists service_areas text;

-- Carried over from the old WordPress profile.
update agents set service_areas = 'Lagos, Abeokuta, Ibadan, Johannesburg'
where slug = 'babatunde-denton' and (service_areas is null or service_areas = '');

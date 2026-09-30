begin;

do $$
begin
  if to_regclass('public.apx_life_property_catalog') is null then
    raise exception 'Apply APX LIFE housing migration first.';
  end if;
end;
$$;

update public.apx_life_property_catalog
set interior_image = case property_id
  when 'saigon-rental-room' then 'assets/apx-life/interiors/saigon-rental-room.svg'
  when 'riverside-studio' then 'assets/apx-life/interiors/riverside-studio.svg'
  when 'garden-apartment' then 'assets/apx-life/interiors/garden-apartment.svg'
  when 'thu-thiem-townhouse' then 'assets/apx-life/interiors/thu-thiem-townhouse.svg'
  when 'skyline-penthouse' then 'assets/apx-life/interiors/skyline-penthouse.svg'
  when 'metropole-residence' then 'assets/apx-life/interiors/metropole-residence.svg'
  when 'green-villa' then 'assets/apx-life/interiors/green-villa.svg'
  when 'heritage-mansion' then 'assets/apx-life/interiors/heritage-mansion.svg'
  else interior_image
end
where property_id in (
  'saigon-rental-room', 'riverside-studio', 'garden-apartment',
  'thu-thiem-townhouse', 'skyline-penthouse', 'metropole-residence',
  'green-villa', 'heritage-mansion'
);

commit;
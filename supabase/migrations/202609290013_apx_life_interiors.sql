begin;

do $$
begin
  if to_regclass('public.apx_life_owned_properties') is null
     or to_regclass('public.apx_life_personal_wallets') is null
     or to_regprocedure('public.apx_user_can_play()') is null then
    raise exception 'Apply APX LIFE wallet and housing migrations first.';
  end if;
end;
$$;

create table if not exists public.apx_life_furniture_catalog (
  furniture_id text primary key check (furniture_id ~ '^[a-z0-9-]{3,60}$'),
  name text not null,
  description text not null,
  category text not null,
  price bigint not null check (price > 0),
  icon text not null,
  allowed_slots text[] not null check (cardinality(allowed_slots) > 0),
  allowed_rotations integer[] not null default array[0, 90, 180, 270],
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.apx_life_owned_furniture (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  furniture_id text not null references public.apx_life_furniture_catalog(furniture_id),
  purchase_price bigint not null check (purchase_price > 0),
  idempotency_key uuid not null,
  purchased_at timestamptz not null default now(),
  unique (owner_id, idempotency_key),
  unique (id, owner_id)
);

create table if not exists public.apx_life_room_layouts (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  owned_property_id uuid not null references public.apx_life_owned_properties(id) on delete cascade,
  layout jsonb not null default '{"schema_version":1,"items":[]}'::jsonb
    check (jsonb_typeof(layout) = 'object' and jsonb_typeof(layout -> 'items') = 'array'),
  updated_at timestamptz not null default now(),
  unique (owned_property_id)
);

create index if not exists apx_life_owned_furniture_owner_idx
  on public.apx_life_owned_furniture(owner_id, purchased_at desc);
create index if not exists apx_life_room_layouts_owner_idx
  on public.apx_life_room_layouts(owner_id, updated_at desc);

alter table public.apx_life_furniture_catalog enable row level security;
alter table public.apx_life_owned_furniture enable row level security;
alter table public.apx_life_room_layouts enable row level security;
revoke all on public.apx_life_furniture_catalog, public.apx_life_owned_furniture,
  public.apx_life_room_layouts from public, anon, authenticated;

insert into public.apx_life_furniture_catalog(
  furniture_id, name, description, category, price, icon, allowed_slots
) values
  ('sofa', 'Sofa', 'Sofa bọc vải cho khu tiếp khách.', 'Phòng khách', 12500000, 'assets/apx-life/items/sofa.svg', array['west','center','east','south-west','south','south-east']),
  ('coffee-table', 'Bàn trà', 'Bàn thấp đặt giữa khu tiếp khách.', 'Phòng khách', 3200000, 'assets/apx-life/items/coffee-table.svg', array['center','north','south']),
  ('television', 'TV', 'Màn hình giải trí treo tường.', 'Phòng khách', 9800000, 'assets/apx-life/items/television.svg', array['north','north-west','north-east']),
  ('work-desk', 'Bàn làm việc', 'Bàn gọn cho góc làm việc tại nhà.', 'Làm việc', 6400000, 'assets/apx-life/items/work-desk.svg', array['north','east','west']),
  ('bookcase', 'Kệ sách', 'Kệ sách đứng cho phòng sinh hoạt.', 'Làm việc', 4500000, 'assets/apx-life/items/bookcase.svg', array['north-west','north-east','west','east']),
  ('floor-lamp', 'Đèn đứng', 'Đèn sàn ánh sáng ấm.', 'Trang trí', 1800000, 'assets/apx-life/items/floor-lamp.svg', array['west','east','south-west','south-east']),
  ('bed', 'Giường', 'Giường đôi tối giản cho phòng ngủ.', 'Phòng ngủ', 14800000, 'assets/apx-life/items/bed.svg', array['north','center','south']),
  ('wardrobe', 'Tủ quần áo', 'Tủ lưu trữ cánh phẳng.', 'Phòng ngủ', 7900000, 'assets/apx-life/items/wardrobe.svg', array['north-west','north-east','west','east']),
  ('plant', 'Cây xanh', 'Chậu cây nội thất tạo điểm nhấn.', 'Trang trí', 950000, 'assets/apx-life/items/plant.svg', array['west','east','north-west','north-east','south-west','south-east']),
  ('wall-art', 'Tranh treo tường', 'Tranh trừu tượng do APX thiết kế.', 'Trang trí', 1250000, 'assets/apx-life/items/wall-art.svg', array['north','north-west','north-east']),
  ('rug', 'Thảm', 'Thảm dệt đặt tại trung tâm căn phòng.', 'Trang trí', 2100000, 'assets/apx-life/items/rug.svg', array['center','south','north']),
  ('dining-table', 'Bàn ăn', 'Bàn ăn bốn chỗ cho căn hộ.', 'Phòng ăn', 8700000, 'assets/apx-life/items/dining-table.svg', array['center','south','north']),
  ('dining-chair', 'Ghế ăn', 'Ghế ăn đồng bộ với bàn APX.', 'Phòng ăn', 1150000, 'assets/apx-life/items/dining-chair.svg', array['west','east','south-west','south-east'])
on conflict (furniture_id) do nothing;

create or replace function public.apx_life_room_home(p_owned_property_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_user uuid := (select auth.uid());
  v_property jsonb;
  v_items jsonb;
  v_owned jsonb;
begin
  if v_user is null or not public.apx_user_can_play() then raise exception 'Sign in to decorate a home.'; end if;
  select jsonb_build_object(
    'id', owned.id, 'property_id', owned.property_id, 'name', catalog.name,
    'interior_image', catalog.interior_image, 'storage_capacity', catalog.storage_capacity,
    'is_primary', owned.is_primary
  ) into v_property
  from public.apx_life_owned_properties owned
  join public.apx_life_property_catalog catalog using (property_id)
  where owned.id = p_owned_property_id and owned.owner_id = v_user;
  if v_property is null then raise exception 'This home is not yours.'; end if;

  select coalesce(layout, '{"schema_version":1,"items":[]}'::jsonb) into v_items
  from public.apx_life_room_layouts where owned_property_id = p_owned_property_id and owner_id = v_user;
  v_items := coalesce(v_items, '{"schema_version":1,"items":[]}'::jsonb);
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', owned.id, 'furniture_id', owned.furniture_id, 'name', catalog.name,
    'description', catalog.description, 'category', catalog.category,
    'price', catalog.price, 'icon', catalog.icon
  ) order by owned.purchased_at desc), '[]'::jsonb) into v_owned
  from public.apx_life_owned_furniture owned
  join public.apx_life_furniture_catalog catalog using (furniture_id)
  where owned.owner_id = v_user;

  select coalesce(jsonb_agg(jsonb_build_object(
    'furniture_id', furniture_id, 'name', name, 'description', description,
    'category', category, 'price', price, 'icon', icon,
    'allowed_slots', to_jsonb(allowed_slots), 'allowed_rotations', to_jsonb(allowed_rotations)
  ) order by category, price), '[]'::jsonb) into v_items
  from public.apx_life_furniture_catalog where is_active;

  return jsonb_build_object('property', v_property, 'layout',
    coalesce((select layout from public.apx_life_room_layouts where owned_property_id = p_owned_property_id and owner_id = v_user), '{"schema_version":1,"items":[]}'::jsonb),
    'owned_furniture', v_owned, 'catalog', v_items);
end;
$$;

create or replace function public.apx_life_buy_furniture(
  p_owned_property_id uuid, p_furniture_id text, p_idempotency_key uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := (select auth.uid());
  v_state jsonb;
  v_cash numeric;
  v_price bigint;
  v_owned_id uuid;
  v_existing public.apx_life_owned_furniture%rowtype;
begin
  if v_user is null or not public.apx_user_can_play() then raise exception 'Sign in to buy furniture.'; end if;
  if p_idempotency_key is null then raise exception 'Missing transaction id.'; end if;
  perform 1 from public.apx_life_owned_properties
  where id = p_owned_property_id and owner_id = v_user for update;
  if not found then raise exception 'This home is not yours.'; end if;
  select * into v_existing from public.apx_life_owned_furniture
  where owner_id = v_user and idempotency_key = p_idempotency_key;
  if found then return jsonb_build_object('ok', true, 'duplicate', true, 'owned_id', v_existing.id); end if;
  select price into v_price from public.apx_life_furniture_catalog
  where furniture_id = p_furniture_id and is_active;
  if not found then raise exception 'Furniture is unavailable.'; end if;
  select game_state into v_state from public.apx_game_saves where user_id = v_user for update;
  if v_state is null or coalesce(v_state ->> 'cash', '') !~ '^[0-9]{1,18}(\.[0-9]{1,2})?$' then raise exception 'Invalid personal balance.'; end if;
  v_cash := (v_state ->> 'cash')::numeric;
  if v_cash < v_price then raise exception 'Insufficient personal balance.'; end if;
  update public.apx_game_saves set game_state = jsonb_set(v_state, '{cash}', to_jsonb(v_cash - v_price), true),
    revision = revision + 1, updated_at = now() where user_id = v_user;
  insert into public.apx_life_owned_furniture(owner_id, furniture_id, purchase_price, idempotency_key)
  values (v_user, p_furniture_id, v_price, p_idempotency_key) returning id into v_owned_id;
  return jsonb_build_object('ok', true, 'duplicate', false, 'owned_id', v_owned_id, 'cash', v_cash - v_price);
end;
$$;

create or replace function public.apx_life_save_room_layout(p_owned_property_id uuid, p_layout jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := (select auth.uid());
  v_capacity integer;
  v_item jsonb;
  v_owned_id uuid;
  v_slot text;
  v_rotation integer;
  v_x numeric;
  v_y numeric;
  v_used_slots text[] := array[]::text[];
  v_used_owned_ids uuid[] := array[]::uuid[];
  v_items jsonb := '[]'::jsonb;
  v_clean jsonb;
begin
  if v_user is null or not public.apx_user_can_play() then raise exception 'Sign in to save a room layout.'; end if;
  if p_layout is null or jsonb_typeof(p_layout) <> 'object'
     or jsonb_typeof(p_layout -> 'items') <> 'array'
     or coalesce((p_layout ->> 'schema_version')::integer, 0) <> 1 then
    raise exception 'Invalid room layout schema.';
  end if;
  select catalog.storage_capacity into v_capacity
  from public.apx_life_owned_properties owned
  join public.apx_life_property_catalog catalog using (property_id)
  where owned.id = p_owned_property_id and owned.owner_id = v_user for update of owned;
  if not found then raise exception 'This home is not yours.'; end if;
  if jsonb_array_length(p_layout -> 'items') > v_capacity then raise exception 'Home item capacity exceeded.'; end if;

  for v_item in select value from jsonb_array_elements(p_layout -> 'items') loop
    if jsonb_typeof(v_item) <> 'object'
       or jsonb_typeof(v_item -> 'x') <> 'number'
       or jsonb_typeof(v_item -> 'y') <> 'number' then
      raise exception 'Each furniture placement needs an owned item, slot and numeric position.';
    end if;
    v_owned_id := (v_item ->> 'owned_id')::uuid;
    v_slot := v_item ->> 'slot';
    v_rotation := (v_item ->> 'rotation')::integer;
    v_x := (v_item ->> 'x')::numeric;
    v_y := (v_item ->> 'y')::numeric;
    if v_slot is null or v_slot <> all(array['north-west','north','north-east','west','center','east','south-west','south','south-east'])
       or v_x < 0 or v_x > 100 or v_y < 0 or v_y > 100
       or v_rotation not in (0, 90, 180, 270) then
      raise exception 'Furniture placement is outside the allowed room schema.';
    end if;
    perform 1 from public.apx_life_owned_furniture
    where id = v_owned_id and owner_id = v_user for update;
    if v_slot = any(v_used_slots) then raise exception 'A room slot can contain only one item.'; end if;
    if v_owned_id = any(v_used_owned_ids) then raise exception 'A furniture item can only be placed once in this home.'; end if;
    v_used_slots := array_append(v_used_slots, v_slot);
    v_used_owned_ids := array_append(v_used_owned_ids, v_owned_id);
    if not exists (
      select 1 from public.apx_life_owned_furniture owned
      join public.apx_life_furniture_catalog catalog using (furniture_id)
      where owned.id = v_owned_id and owned.owner_id = v_user
        and v_slot = any(catalog.allowed_slots)
        and v_rotation = any(catalog.allowed_rotations)
    ) then raise exception 'Furniture ownership or placement is invalid.'; end if;
    if exists (
      select 1 from public.apx_life_room_layouts layout
      cross join lateral jsonb_array_elements(layout.layout -> 'items') placed
      where layout.owner_id = v_user and layout.owned_property_id <> p_owned_property_id
        and placed.value ->> 'owned_id' = v_owned_id::text
    ) then raise exception 'This furniture is already placed in another home.'; end if;
    v_clean := jsonb_build_object('owned_id', v_owned_id, 'slot', v_slot, 'x', v_x, 'y', v_y, 'rotation', v_rotation);
    v_items := v_items || jsonb_build_array(v_clean);
  end loop;

  v_clean := jsonb_build_object('schema_version', 1, 'items', v_items);
  insert into public.apx_life_room_layouts(owner_id, owned_property_id, layout, updated_at)
  values (v_user, p_owned_property_id, v_clean, now())
  on conflict (owned_property_id) do update set layout = excluded.layout, updated_at = now()
  where public.apx_life_room_layouts.owner_id = v_user;
  if not found then raise exception 'This room layout is not yours.'; end if;
  return v_clean;
end;
$$;

revoke all on function public.apx_life_room_home(uuid),
  public.apx_life_buy_furniture(uuid, text, uuid),
  public.apx_life_save_room_layout(uuid, jsonb) from public, anon;
grant execute on function public.apx_life_room_home(uuid),
  public.apx_life_buy_furniture(uuid, text, uuid),
  public.apx_life_save_room_layout(uuid, jsonb) to authenticated;

commit;
begin;

do $$
begin
  if to_regclass('public.apx_player_profiles') is null
     or to_regclass('public.apx_game_saves') is null
     or to_regprocedure('public.apx_user_can_play()') is null then
    raise exception 'Apply the APX account migration before adding APX LIFE housing.';
  end if;
end;
$$;

create table if not exists public.apx_life_property_catalog (
  property_id text primary key check (property_id ~ '^[a-z0-9-]{3,60}$'),
  name text not null,
  description text not null,
  price bigint not null check (price > 0),
  daily_maintenance bigint not null default 0 check (daily_maintenance >= 0),
  rarity text not null check (rarity in ('Phổ thông', 'Hiếm', 'Cao cấp', 'Sử thi', 'Huyền thoại')),
  storage_capacity integer not null check (storage_capacity > 0),
  exterior_image text not null,
  interior_image text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.apx_life_owned_properties (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  property_id text not null references public.apx_life_property_catalog(property_id),
  purchase_price bigint not null check (purchase_price > 0),
  idempotency_key uuid not null,
  is_primary boolean not null default false,
  purchased_at timestamptz not null default now(),
  unique (owner_id, idempotency_key)
);

create index if not exists apx_life_owned_properties_owner_idx
  on public.apx_life_owned_properties(owner_id, purchased_at desc);
create unique index if not exists apx_life_one_primary_home_per_owner
  on public.apx_life_owned_properties(owner_id) where is_primary;

alter table public.apx_life_property_catalog enable row level security;
alter table public.apx_life_owned_properties enable row level security;
revoke all on public.apx_life_property_catalog, public.apx_life_owned_properties from public, anon, authenticated;

insert into public.apx_life_property_catalog(
  property_id, name, description, price, daily_maintenance, rarity, storage_capacity, exterior_image, interior_image
) values
  ('saigon-rental-room', 'Phòng trọ Sài Gòn', 'Không gian đầu tiên gọn gàng, gần nhịp sống thành phố.', 180000000, 20000, 'Phổ thông', 10, 'assets/apx-life/properties/saigon-rental-room.svg', 'assets/apx-life/interiors/home-interior.svg'),
  ('riverside-studio', 'Căn hộ Riverside', 'Căn hộ nhỏ cạnh bờ sông với ánh sáng tự nhiên.', 850000000, 65000, 'Hiếm', 25, 'assets/apx-life/properties/riverside-studio.svg', 'assets/apx-life/interiors/home-interior.svg'),
  ('garden-apartment', 'Căn hộ Garden', 'Căn hộ trung cấp có ban công nhìn ra mảng xanh.', 2800000000, 220000, 'Cao cấp', 50, 'assets/apx-life/properties/garden-apartment.svg', 'assets/apx-life/interiors/home-interior.svg'),
  ('thu-thiem-townhouse', 'Nhà phố Thủ Thiêm', 'Nhà phố nhiều tầng trong khu đô thị mới.', 7500000000, 600000, 'Sử thi', 100, 'assets/apx-life/properties/thu-thiem-townhouse.svg', 'assets/apx-life/interiors/home-interior.svg'),
  ('skyline-penthouse', 'Penthouse Skyline', 'Không gian tầng cao với tầm nhìn toàn cảnh đô thị.', 18000000000, 1500000, 'Huyền thoại', 180, 'assets/apx-life/properties/skyline-penthouse.svg', 'assets/apx-life/interiors/home-interior.svg')
on conflict (property_id) do nothing;

create or replace function public.apx_life_housing_home()
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare
  v_user uuid := (select auth.uid());
  v_state jsonb;
  v_cash numeric;
  v_catalog jsonb;
  v_owned jsonb;
begin
  if v_user is null or not public.apx_user_can_play() then
    raise exception 'Đăng nhập để sử dụng Cuộc sống CEO.';
  end if;

  select game_state into v_state
  from public.apx_game_saves
  where user_id = v_user;
  if v_state is null then raise exception 'Tài khoản chưa có bản lưu game.'; end if;
  if coalesce(v_state ->> 'cash', '') ~ '^[0-9]{1,18}(\.[0-9]{1,2})?$' then
    v_cash := (v_state ->> 'cash')::numeric;
  else
    v_cash := null;
  end if;

  select coalesce(jsonb_agg(jsonb_build_object(
    'property_id', property_id,
    'name', name,
    'description', description,
    'price', price,
    'daily_maintenance', daily_maintenance,
    'rarity', rarity,
    'storage_capacity', storage_capacity,
    'exterior_image', exterior_image,
    'interior_image', interior_image
  ) order by price), '[]'::jsonb)
  into v_catalog
  from public.apx_life_property_catalog
  where is_active;

  select coalesce(jsonb_agg(jsonb_build_object(
    'id', owned.id,
    'property_id', owned.property_id,
    'name', catalog.name,
    'description', catalog.description,
    'purchase_price', owned.purchase_price,
    'daily_maintenance', catalog.daily_maintenance,
    'rarity', catalog.rarity,
    'storage_capacity', catalog.storage_capacity,
    'exterior_image', catalog.exterior_image,
    'interior_image', catalog.interior_image,
    'is_primary', owned.is_primary,
    'purchased_at', owned.purchased_at
  ) order by owned.is_primary desc, owned.purchased_at desc), '[]'::jsonb)
  into v_owned
  from public.apx_life_owned_properties owned
  join public.apx_life_property_catalog catalog using (property_id)
  where owned.owner_id = v_user;

  return jsonb_build_object('cash', v_cash, 'catalog', v_catalog, 'owned', v_owned);
end;
$$;

create or replace function public.apx_life_public_properties(p_character_id uuid)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare
  v_owner uuid;
  v_properties jsonb;
begin
  if (select auth.uid()) is null or not public.apx_user_can_play() then
    raise exception 'Đăng nhập để xem nhà công khai.';
  end if;
  select user_id into v_owner
  from public.apx_player_profiles
  where character_id = p_character_id and not is_banned;
  if v_owner is null then raise exception 'Không tìm thấy hồ sơ người chơi.'; end if;

  select coalesce(jsonb_agg(jsonb_build_object(
    'property_id', owned.property_id,
    'name', catalog.name,
    'description', catalog.description,
    'rarity', catalog.rarity,
    'exterior_image', catalog.exterior_image,
    'is_primary', owned.is_primary
  ) order by owned.is_primary desc, owned.purchased_at desc), '[]'::jsonb)
  into v_properties
  from public.apx_life_owned_properties owned
  join public.apx_life_property_catalog catalog using (property_id)
  where owned.owner_id = v_owner;
  return v_properties;
end;
$$;

create or replace function public.apx_life_buy_property(p_property_id text, p_idempotency_key uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_user uuid := (select auth.uid());
  v_state jsonb;
  v_cash numeric;
  v_price bigint;
  v_existing public.apx_life_owned_properties%rowtype;
  v_owned_id uuid;
  v_primary boolean;
begin
  if v_user is null or not public.apx_user_can_play() then
    raise exception 'Đăng nhập để mua nhà.';
  end if;
  if p_idempotency_key is null then raise exception 'Thiếu mã xác nhận giao dịch.'; end if;

  select game_state into v_state
  from public.apx_game_saves
  where user_id = v_user
  for update;
  if v_state is null then raise exception 'Tài khoản chưa có bản lưu game.'; end if;

  select * into v_existing
  from public.apx_life_owned_properties
  where owner_id = v_user and idempotency_key = p_idempotency_key;
  if found then
    return jsonb_build_object('ok', true, 'duplicate', true, 'owned_id', v_existing.id,
      'property_id', v_existing.property_id, 'cash', coalesce((v_state ->> 'cash')::numeric, 0));
  end if;

  select price into v_price
  from public.apx_life_property_catalog
  where property_id = p_property_id and is_active;
  if not found then raise exception 'Loại nhà này không còn mở bán.'; end if;
  if coalesce(v_state ->> 'cash', '') !~ '^[0-9]{1,18}(\.[0-9]{1,2})?$' then
    raise exception 'Số dư cá nhân không hợp lệ.';
  end if;
  v_cash := (v_state ->> 'cash')::numeric;
  if v_cash < v_price then raise exception 'Tiền cá nhân không đủ để mua nhà.'; end if;

  v_primary := not exists (
    select 1 from public.apx_life_owned_properties where owner_id = v_user and is_primary
  );
  v_state := jsonb_set(v_state, '{cash}', to_jsonb(v_cash - v_price), true);
  update public.apx_game_saves
  set game_state = v_state, revision = revision + 1, updated_at = now()
  where user_id = v_user;

  insert into public.apx_life_owned_properties(owner_id, property_id, purchase_price, idempotency_key, is_primary)
  values (v_user, p_property_id, v_price, p_idempotency_key, v_primary)
  returning id into v_owned_id;

  return jsonb_build_object('ok', true, 'duplicate', false, 'owned_id', v_owned_id,
    'property_id', p_property_id, 'purchase_price', v_price, 'cash', v_cash - v_price, 'is_primary', v_primary);
end;
$$;

create or replace function public.apx_life_set_primary_home(p_owned_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare v_user uuid := (select auth.uid());
begin
  if v_user is null or not public.apx_user_can_play() then
    raise exception 'Đăng nhập để đổi nhà đang ở.';
  end if;
  if not exists (select 1 from public.apx_life_owned_properties where id = p_owned_id and owner_id = v_user) then
    raise exception 'Nhà này không thuộc sở hữu của bạn.';
  end if;
  update public.apx_life_owned_properties set is_primary = false where owner_id = v_user and is_primary;
  update public.apx_life_owned_properties set is_primary = true where id = p_owned_id and owner_id = v_user;
end;
$$;

revoke all on function public.apx_life_housing_home(), public.apx_life_public_properties(uuid), public.apx_life_buy_property(text,uuid), public.apx_life_set_primary_home(uuid) from public, anon;
grant execute on function public.apx_life_housing_home(), public.apx_life_public_properties(uuid), public.apx_life_buy_property(text,uuid), public.apx_life_set_primary_home(uuid) to authenticated;

commit;
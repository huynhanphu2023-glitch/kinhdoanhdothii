begin;

do $$
begin
  if to_regclass('public.apx_player_profiles') is null
     or to_regclass('public.apx_game_saves') is null
     or to_regclass('public.apx_life_property_catalog') is null
     or to_regprocedure('public.apx_user_can_play()') is null then
    raise exception 'Apply the APX account and APX LIFE housing migrations first.';
  end if;
end;
$$;

create table if not exists public.apx_life_personal_wallets (
  owner_id uuid primary key references auth.users(id) on delete cascade,
  balance numeric(24,2) not null default 0 check (balance >= 0),
  updated_at timestamptz not null default now()
);

create table if not exists public.apx_life_wallet_ledger (
  id bigint generated always as identity primary key,
  owner_id uuid not null references auth.users(id) on delete cascade,
  amount numeric(24,2) not null check (amount <> 0 or entry_type = 'opening'),
  balance_after numeric(24,2) not null check (balance_after >= 0),
  entry_type text not null check (entry_type in ('opening', 'credit', 'debit')),
  source text not null,
  idempotency_key uuid,
  details jsonb not null default '{}'::jsonb check (jsonb_typeof(details) = 'object'),
  created_at timestamptz not null default now()
);

create index if not exists apx_life_wallet_ledger_owner_created_idx
  on public.apx_life_wallet_ledger(owner_id, created_at desc);
create unique index if not exists apx_life_wallet_ledger_idempotency_idx
  on public.apx_life_wallet_ledger(owner_id, idempotency_key)
  where idempotency_key is not null;
create unique index if not exists apx_life_wallet_ledger_opening_idx
  on public.apx_life_wallet_ledger(owner_id)
  where entry_type = 'opening';

do $$
begin
  if exists (
    select 1 from public.apx_game_saves
    where coalesce(game_state ->> 'cash', '0') !~ '^[0-9]{1,18}(\.[0-9]{1,2})?$'
  ) then
    raise exception 'A game save contains an invalid personal cash value; inspect saves before applying APX LIFE wallet migration.';
  end if;
end;
$$;

insert into public.apx_life_personal_wallets(owner_id, balance)
select user_id, coalesce((game_state ->> 'cash')::numeric, 0)
from public.apx_game_saves
on conflict (owner_id) do nothing;

insert into public.apx_life_wallet_ledger(owner_id, amount, balance_after, entry_type, source, details)
select wallet.owner_id, wallet.balance, wallet.balance, 'opening', 'migration-opening-v1',
       jsonb_build_object('migration', '202609290012_apx_life_wallet_vehicles')
from public.apx_life_personal_wallets wallet
where not exists (
  select 1 from public.apx_life_wallet_ledger ledger
  where ledger.owner_id = wallet.owner_id and ledger.entry_type = 'opening'
);

create or replace function public.apx_life_sync_wallet_from_save()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_new_cash numeric(24,2);
  v_old_cash numeric(24,2);
  v_balance numeric(24,2);
  v_delta numeric(24,2);
begin
  if coalesce(new.game_state ->> 'cash', '0') !~ '^[0-9]{1,18}(\.[0-9]{1,2})?$' then
    raise exception 'Personal cash must be a non-negative amount.';
  end if;
  v_new_cash := coalesce((new.game_state ->> 'cash')::numeric, 0);

  if tg_op = 'INSERT' then
    insert into public.apx_life_personal_wallets(owner_id, balance)
    values (new.user_id, v_new_cash)
    on conflict (owner_id) do nothing;
    if not exists (
      select 1 from public.apx_life_wallet_ledger
      where owner_id = new.user_id and entry_type = 'opening'
    ) then
      insert into public.apx_life_wallet_ledger(owner_id, amount, balance_after, entry_type, source, details)
      values (new.user_id, v_new_cash, v_new_cash, 'opening', 'save-created-v1',
        jsonb_build_object('source', 'new-game-save'));
    end if;
    return new;
  end if;

  if old.user_id <> new.user_id then
    raise exception 'Save ownership cannot be changed.';
  end if;
  v_old_cash := coalesce((old.game_state ->> 'cash')::numeric, 0);
  if v_new_cash = v_old_cash then
    return new;
  end if;
  v_delta := v_new_cash - v_old_cash;
  update public.apx_life_personal_wallets
  set balance = balance + v_delta, updated_at = now()
  where owner_id = new.user_id and balance + v_delta >= 0
  returning balance into v_balance;
  if not found then
    raise exception 'Personal wallet is missing or has insufficient balance.';
  end if;

  insert into public.apx_life_wallet_ledger(owner_id, amount, balance_after, entry_type, source, details)
  values (new.user_id, v_delta, v_balance,
    case when v_delta > 0 then 'credit' else 'debit' end,
    'server-game-transaction', jsonb_build_object('save_revision', new.revision));
  return new;
end;
$$;

drop trigger if exists apx_life_sync_wallet_from_save on public.apx_game_saves;
create trigger apx_life_sync_wallet_from_save
after insert or update of game_state on public.apx_game_saves
for each row execute function public.apx_life_sync_wallet_from_save();

alter table public.apx_life_personal_wallets enable row level security;
alter table public.apx_life_wallet_ledger enable row level security;
revoke all on public.apx_life_personal_wallets, public.apx_life_wallet_ledger from public, anon, authenticated;

create or replace function public.apx_save_game_state(p_game_state jsonb, p_expected_revision bigint)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := (select auth.uid());
  v_state jsonb;
  v_revision bigint;
begin
  if v_user is null or not public.apx_user_can_play() then
    raise exception 'Sign in to save game progress.';
  end if;
  if p_game_state is null or jsonb_typeof(p_game_state) <> 'object' then
    raise exception 'Invalid game save.';
  end if;

  select game_state, revision into v_state, v_revision
  from public.apx_game_saves where user_id = v_user for update;

  if not found then
    if p_expected_revision is distinct from 0 then
      raise exception 'Game save changed; reload before saving.';
    end if;
    v_state := jsonb_set(p_game_state, '{cash}', '1000000000'::jsonb, true);
    insert into public.apx_game_saves(user_id, game_state, revision, updated_at)
    values (v_user, v_state, 1, now())
    on conflict (user_id) do nothing;
    select game_state, revision into v_state, v_revision
    from public.apx_game_saves where user_id = v_user for update;
    if v_revision <> 1 then
      raise exception 'Game save changed; reload before saving.';
    end if;
    return jsonb_build_object('game_state', v_state, 'revision', v_revision);
  end if;

  if p_expected_revision is distinct from v_revision then
    raise exception 'Game save changed; reload before saving.';
  end if;
  v_state := jsonb_set(p_game_state, '{cash}', coalesce(v_state -> 'cash', '0'::jsonb), true);
  update public.apx_game_saves
  set game_state = v_state, revision = v_revision + 1, updated_at = now()
  where user_id = v_user;
  return jsonb_build_object('game_state', v_state, 'revision', v_revision + 1);
end;
$$;

revoke all on function public.apx_save_game_state(jsonb, bigint) from public, anon;
grant execute on function public.apx_save_game_state(jsonb, bigint) to authenticated;
revoke insert, update on public.apx_game_saves from anon, authenticated;
revoke update (game_state, revision, updated_at) on public.apx_game_saves from anon, authenticated;

alter table public.apx_life_property_catalog
  add column if not exists garage_capacity integer not null default 1 check (garage_capacity >= 0);
update public.apx_life_property_catalog set garage_capacity = case property_id
  when 'saigon-rental-room' then 1
  when 'riverside-studio' then 1
  when 'garden-apartment' then 2
  when 'thu-thiem-townhouse' then 3
  when 'skyline-penthouse' then 3
  else garage_capacity end
where property_id in (
  'saigon-rental-room', 'riverside-studio', 'garden-apartment',
  'thu-thiem-townhouse', 'skyline-penthouse'
);

insert into public.apx_life_property_catalog(
  property_id, name, description, price, daily_maintenance, rarity, storage_capacity,
  exterior_image, interior_image, garage_capacity
) values
  ('metropole-residence', 'Chung cư cao cấp Metropole', 'Căn hộ cao tầng hoàn thiện với tiện ích riêng và tầm nhìn sông.', 8200000000, 680000, 'Sử thi', 110, 'assets/apx-life/properties/metropole-residence.svg', 'assets/apx-life/interiors/home-interior.svg', 2),
  ('green-villa', 'Biệt thự Vườn Xanh', 'Biệt thự thấp tầng có sân riêng giữa khu dân cư yên tĩnh.', 28000000000, 2100000, 'Huyền thoại', 240, 'assets/apx-life/properties/green-villa.svg', 'assets/apx-life/interiors/home-interior.svg', 4),
  ('heritage-mansion', 'Dinh thự Heritage', 'Dinh thự rộng với khuôn viên và gara nhiều chỗ.', 52000000000, 4200000, 'Huyền thoại', 400, 'assets/apx-life/properties/heritage-mansion.svg', 'assets/apx-life/interiors/home-interior.svg', 6)
on conflict (property_id) do nothing;

create table if not exists public.apx_life_vehicle_catalog (
  vehicle_id text primary key check (vehicle_id ~ '^[a-z0-9-]{3,60}$'),
  name text not null,
  vehicle_type text not null check (vehicle_type in ('Xe máy', 'Sedan', 'SUV', 'Xe thể thao', 'Xe sang')),
  description text not null,
  price bigint not null check (price > 0),
  daily_maintenance bigint not null default 0 check (daily_maintenance >= 0),
  rarity text not null check (rarity in ('Phổ thông', 'Hiếm', 'Cao cấp', 'Sử thi', 'Huyền thoại')),
  resale_rate numeric(4,3) not null default 0.700 check (resale_rate > 0 and resale_rate <= 1),
  stats jsonb not null default '{}'::jsonb check (jsonb_typeof(stats) = 'object'),
  image text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.apx_life_owned_vehicles (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  vehicle_id text not null references public.apx_life_vehicle_catalog(vehicle_id),
  purchase_price bigint not null check (purchase_price > 0),
  idempotency_key uuid not null,
  is_active boolean not null default false,
  purchased_at timestamptz not null default now(),
  unique (owner_id, idempotency_key)
);

create table if not exists public.apx_life_vehicle_transactions (
  id bigint generated always as identity primary key,
  owner_id uuid not null references auth.users(id) on delete cascade,
  owned_vehicle_id uuid,
  vehicle_id text not null references public.apx_life_vehicle_catalog(vehicle_id),
  transaction_type text not null check (transaction_type in ('buy', 'sell')),
  amount bigint not null check (amount > 0),
  idempotency_key uuid not null,
  created_at timestamptz not null default now(),
  unique (owner_id, idempotency_key)
);

create index if not exists apx_life_owned_vehicles_owner_idx
  on public.apx_life_owned_vehicles(owner_id, purchased_at desc);
create unique index if not exists apx_life_one_active_vehicle_per_owner
  on public.apx_life_owned_vehicles(owner_id) where is_active;
create index if not exists apx_life_vehicle_transactions_owner_idx
  on public.apx_life_vehicle_transactions(owner_id, created_at desc);

alter table public.apx_life_vehicle_catalog enable row level security;
alter table public.apx_life_owned_vehicles enable row level security;
alter table public.apx_life_vehicle_transactions enable row level security;
revoke all on public.apx_life_vehicle_catalog, public.apx_life_owned_vehicles,
  public.apx_life_vehicle_transactions from public, anon, authenticated;

insert into public.apx_life_vehicle_catalog(
  vehicle_id, name, vehicle_type, description, price, daily_maintenance, rarity, resale_rate, stats, image
) values
  ('lumen-city-110', 'Lumen City 110', 'Xe máy', 'Xe số gọn nhẹ cho những chuyến đi hằng ngày.', 18000000, 25000, 'Phổ thông', 0.650, '{"power":4,"comfort":3,"efficiency":9}', 'assets/apx-life/vehicles/lumen-city-110.svg'),
  ('vento-scoot-160', 'Vento Scoot 160', 'Xe máy', 'Tay ga đô thị với cốp rộng và dáng hiện đại.', 68000000, 55000, 'Hiếm', 0.680, '{"power":6,"comfort":7,"efficiency":8}', 'assets/apx-life/vehicles/vento-scoot-160.svg'),
  ('terra-trail-250', 'Terra Trail 250', 'Xe máy', 'Mẫu xe địa hình hư cấu cho những cung đường ngoại ô.', 145000000, 90000, 'Cao cấp', 0.700, '{"power":8,"comfort":5,"efficiency":6}', 'assets/apx-life/vehicles/terra-trail-250.svg'),
  ('solis-sedan', 'Solis Sedan', 'Sedan', 'Sedan gia đình cân bằng giữa tiện nghi và chi phí.', 520000000, 220000, 'Phổ thông', 0.700, '{"power":6,"comfort":7,"efficiency":7}', 'assets/apx-life/vehicles/solis-sedan.svg'),
  ('meridian-sedan', 'Meridian Sedan', 'Sedan', 'Sedan hạng trung với khoang lái yên tĩnh.', 980000000, 360000, 'Hiếm', 0.720, '{"power":7,"comfort":8,"efficiency":6}', 'assets/apx-life/vehicles/meridian-sedan.svg'),
  ('aurora-e-sedan', 'Aurora E Sedan', 'Sedan', 'Sedan điện hư cấu với thiết kế tối giản.', 1450000000, 180000, 'Cao cấp', 0.740, '{"power":8,"comfort":8,"efficiency":10}', 'assets/apx-life/vehicles/aurora-e-sedan.svg'),
  ('atlas-cross', 'Atlas Cross', 'SUV', 'SUV đa dụng cho gia đình và các chuyến đi xa.', 1150000000, 420000, 'Hiếm', 0.700, '{"power":7,"comfort":8,"efficiency":5}', 'assets/apx-life/vehicles/atlas-cross.svg'),
  ('banyan-urban-suv', 'Banyan Urban SUV', 'SUV', 'SUV đô thị gầm cao, khoang hành lý linh hoạt.', 1850000000, 560000, 'Cao cấp', 0.720, '{"power":8,"comfort":8,"efficiency":5}', 'assets/apx-life/vehicles/banyan-urban-suv.svg'),
  ('vanguard-7', 'Vanguard 7', 'SUV', 'SUV ba hàng ghế mang phong cách đường trường.', 2900000000, 780000, 'Sử thi', 0.730, '{"power":9,"comfort":9,"efficiency":4}', 'assets/apx-life/vehicles/vanguard-7.svg'),
  ('strix-coupe', 'Strix Coupe', 'Xe thể thao', 'Coupe hai cửa hư cấu thiên về cảm giác lái.', 3600000000, 920000, 'Sử thi', 0.700, '{"power":10,"comfort":6,"efficiency":3}', 'assets/apx-life/vehicles/strix-coupe.svg'),
  ('eclipse-gt', 'Eclipse GT', 'Xe thể thao', 'Mẫu GT hiệu suất cao, sản xuất giới hạn.', 6800000000, 1450000, 'Huyền thoại', 0.720, '{"power":10,"comfort":8,"efficiency":3}', 'assets/apx-life/vehicles/eclipse-gt.svg'),
  ('regent-grand', 'Regent Grand', 'Xe sang', 'Sedan sang trọng thủ công dành cho những dịp đặc biệt.', 9800000000, 1750000, 'Huyền thoại', 0.740, '{"power":9,"comfort":10,"efficiency":4}', 'assets/apx-life/vehicles/regent-grand.svg')
on conflict (vehicle_id) do nothing;

create or replace function public.apx_life_vehicle_home()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_user uuid := (select auth.uid());
  v_balance numeric;
  v_capacity integer := 1;
  v_catalog jsonb;
  v_owned jsonb;
  v_history jsonb;
begin
  if v_user is null or not public.apx_user_can_play() then
    raise exception 'Sign in to use APX LIFE garage.';
  end if;

  select balance into v_balance from public.apx_life_personal_wallets where owner_id = v_user;
  if not found then raise exception 'Personal wallet has not been initialized.'; end if;
  select catalog.garage_capacity into v_capacity
  from public.apx_life_owned_properties owned
  join public.apx_life_property_catalog catalog using (property_id)
  where owned.owner_id = v_user and owned.is_primary;
  v_capacity := coalesce(v_capacity, 1);

  select coalesce(jsonb_agg(jsonb_build_object(
    'vehicle_id', vehicle_id, 'name', name, 'vehicle_type', vehicle_type,
    'description', description, 'price', price, 'daily_maintenance', daily_maintenance,
    'rarity', rarity, 'resale_rate', resale_rate, 'stats', stats, 'image', image
  ) order by price), '[]'::jsonb) into v_catalog
  from public.apx_life_vehicle_catalog where is_active;

  select coalesce(jsonb_agg(jsonb_build_object(
    'id', owned.id, 'vehicle_id', owned.vehicle_id, 'name', catalog.name,
    'vehicle_type', catalog.vehicle_type, 'description', catalog.description,
    'purchase_price', owned.purchase_price, 'daily_maintenance', catalog.daily_maintenance,
    'rarity', catalog.rarity, 'resale_rate', catalog.resale_rate, 'stats', catalog.stats,
    'image', catalog.image, 'is_active', owned.is_active, 'purchased_at', owned.purchased_at
  ) order by owned.is_active desc, owned.purchased_at desc), '[]'::jsonb) into v_owned
  from public.apx_life_owned_vehicles owned
  join public.apx_life_vehicle_catalog catalog using (vehicle_id)
  where owned.owner_id = v_user;

  select coalesce(jsonb_agg(jsonb_build_object(
    'vehicle_id', vehicle_id, 'transaction_type', transaction_type,
    'amount', amount, 'created_at', created_at
  ) order by created_at desc), '[]'::jsonb) into v_history
  from public.apx_life_vehicle_transactions where owner_id = v_user;

  return jsonb_build_object('cash', v_balance, 'garage_capacity', v_capacity,
    'catalog', v_catalog, 'owned', v_owned, 'history', v_history);
end;
$$;

create or replace function public.apx_life_buy_vehicle(p_vehicle_id text, p_idempotency_key uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := (select auth.uid());
  v_state jsonb;
  v_cash numeric;
  v_wallet numeric;
  v_price bigint;
  v_capacity integer := 1;
  v_owned_id uuid;
  v_existing public.apx_life_owned_vehicles%rowtype;
  v_existing_tx public.apx_life_vehicle_transactions%rowtype;
begin
  if v_user is null or not public.apx_user_can_play() then raise exception 'Sign in to buy a vehicle.'; end if;
  if p_idempotency_key is null then raise exception 'Missing transaction id.'; end if;

  select game_state into v_state from public.apx_game_saves where user_id = v_user for update;
  if v_state is null then raise exception 'Game save not found.'; end if;
  select * into v_existing_tx from public.apx_life_vehicle_transactions
  where owner_id = v_user and idempotency_key = p_idempotency_key;
  if found then
    if v_existing_tx.transaction_type <> 'buy' then raise exception 'Transaction id was already used for another action.'; end if;
    return jsonb_build_object('ok', true, 'duplicate', true, 'owned_id', v_existing_tx.owned_vehicle_id,
      'vehicle_id', v_existing_tx.vehicle_id, 'cash', coalesce((v_state ->> 'cash')::numeric, 0));
  end if;
  select * into v_existing from public.apx_life_owned_vehicles
  where owner_id = v_user and idempotency_key = p_idempotency_key;
  if found then
    return jsonb_build_object('ok', true, 'duplicate', true, 'owned_id', v_existing.id,
      'vehicle_id', v_existing.vehicle_id, 'cash', coalesce((v_state ->> 'cash')::numeric, 0));
  end if;

  select price into v_price from public.apx_life_vehicle_catalog
  where vehicle_id = p_vehicle_id and is_active;
  if not found then raise exception 'Vehicle is unavailable.'; end if;
  perform 1 from public.apx_life_owned_properties
  where owner_id=v_user and is_primary for update;
  select catalog.garage_capacity into v_capacity
  from public.apx_life_owned_properties owned
  join public.apx_life_property_catalog catalog using (property_id)
  where owned.owner_id = v_user and owned.is_primary;
  v_capacity := coalesce(v_capacity, 1);
  if (select count(*) from public.apx_life_owned_vehicles where owner_id = v_user) >= v_capacity then
    raise exception 'Garage capacity is full; choose a larger primary home.';
  end if;
  if coalesce(v_state ->> 'cash', '') !~ '^[0-9]{1,18}(\.[0-9]{1,2})?$' then raise exception 'Invalid personal balance.'; end if;
  v_cash := (v_state ->> 'cash')::numeric;
  select balance into v_wallet from public.apx_life_personal_wallets where owner_id = v_user for update;
  if not found or v_wallet <> v_cash then raise exception 'Personal wallet is out of sync; reload and retry.'; end if;
  if v_cash < v_price then raise exception 'Insufficient personal balance.'; end if;

  v_state := jsonb_set(v_state, '{cash}', to_jsonb(v_cash - v_price), true);
  update public.apx_game_saves set game_state = v_state, revision = revision + 1, updated_at = now()
  where user_id = v_user;
  insert into public.apx_life_owned_vehicles(owner_id, vehicle_id, purchase_price, idempotency_key, is_active)
  values (v_user, p_vehicle_id, v_price, p_idempotency_key,
    not exists (select 1 from public.apx_life_owned_vehicles where owner_id = v_user and is_active))
  returning id into v_owned_id;
  insert into public.apx_life_vehicle_transactions(owner_id, owned_vehicle_id, vehicle_id, transaction_type, amount, idempotency_key)
  values (v_user, v_owned_id, p_vehicle_id, 'buy', v_price, p_idempotency_key);
  return jsonb_build_object('ok', true, 'duplicate', false, 'owned_id', v_owned_id,
    'vehicle_id', p_vehicle_id, 'purchase_price', v_price, 'cash', v_cash - v_price);
end;
$$;

create or replace function public.apx_life_set_active_vehicle(p_owned_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare v_user uuid := (select auth.uid());
begin
  if v_user is null or not public.apx_user_can_play() then raise exception 'Sign in to select a vehicle.'; end if;
  if not exists (select 1 from public.apx_life_owned_vehicles where id = p_owned_id and owner_id = v_user) then
    raise exception 'This vehicle is not yours.';
  end if;
  update public.apx_life_owned_vehicles set is_active = false where owner_id = v_user and is_active;
  update public.apx_life_owned_vehicles set is_active = true where id = p_owned_id and owner_id = v_user;
end;
$$;

create or replace function public.apx_life_sell_vehicle(p_owned_id uuid, p_idempotency_key uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := (select auth.uid());
  v_vehicle public.apx_life_owned_vehicles%rowtype;
  v_rate numeric;
  v_sale bigint;
  v_state jsonb;
  v_balance numeric;
  v_duplicate public.apx_life_vehicle_transactions%rowtype;
  v_wallet numeric;
begin
  if v_user is null or not public.apx_user_can_play() then raise exception 'Sign in to sell a vehicle.'; end if;
  if p_idempotency_key is null then raise exception 'Missing transaction id.'; end if;
  select * into v_duplicate from public.apx_life_vehicle_transactions
  where owner_id = v_user and idempotency_key = p_idempotency_key;
  if found then
    if v_duplicate.transaction_type <> 'sell' then raise exception 'Transaction id was already used for another action.'; end if;
    return jsonb_build_object('ok', true, 'duplicate', true, 'amount', v_duplicate.amount);
  end if;
  select game_state into v_state from public.apx_game_saves where user_id = v_user for update;
  if v_state is null then raise exception 'Game save not found.'; end if;
  select * into v_vehicle from public.apx_life_owned_vehicles
  where id = p_owned_id and owner_id = v_user for update;
  if not found then raise exception 'This vehicle is not yours.'; end if;
  select resale_rate into v_rate from public.apx_life_vehicle_catalog where vehicle_id = v_vehicle.vehicle_id;
  v_sale := greatest(0, floor(v_vehicle.purchase_price * v_rate)::bigint);
  select balance into v_wallet from public.apx_life_personal_wallets where owner_id = v_user for update;
  if not found or v_wallet <> (v_state ->> 'cash')::numeric then raise exception 'Personal wallet is out of sync; reload and retry.'; end if;
  v_balance := (v_state ->> 'cash')::numeric + v_sale;
  update public.apx_game_saves
  set game_state = jsonb_set(v_state, '{cash}', to_jsonb(v_balance), true), revision = revision + 1, updated_at = now()
  where user_id = v_user;
  insert into public.apx_life_vehicle_transactions(owner_id, owned_vehicle_id, vehicle_id, transaction_type, amount, idempotency_key)
  values (v_user, v_vehicle.id, v_vehicle.vehicle_id, 'sell', v_sale, p_idempotency_key);
  delete from public.apx_life_owned_vehicles where id = v_vehicle.id and owner_id = v_user;
  return jsonb_build_object('ok', true, 'duplicate', false, 'amount', v_sale, 'cash', v_balance,
    'resale_rate', v_rate, 'formula', 'floor(purchase_price * resale_rate)');
end;
$$;

revoke all on function public.apx_life_sync_wallet_from_save() from public, anon, authenticated;
revoke all on function public.apx_life_vehicle_home(),
  public.apx_life_buy_vehicle(text, uuid), public.apx_life_set_active_vehicle(uuid),
  public.apx_life_sell_vehicle(uuid, uuid) from public, anon;
grant execute on function public.apx_life_vehicle_home(),
  public.apx_life_buy_vehicle(text, uuid), public.apx_life_set_active_vehicle(uuid),
  public.apx_life_sell_vehicle(uuid, uuid) to authenticated;

commit;
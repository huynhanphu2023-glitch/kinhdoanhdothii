begin;

do $$
begin
  if to_regclass('public.apx_life_property_catalog') is null
     or to_regclass('public.apx_life_owned_properties') is null
     or to_regclass('public.apx_life_personal_wallets') is null
      or to_regclass('public.apx_life_room_layouts') is null
      or to_regclass('public.apx_life_owned_furniture') is null
     or to_regprocedure('public.apx_user_can_play()') is null then
    raise exception 'Apply APX LIFE wallet and housing migrations first.';
  end if;
end;
$$;

alter table public.apx_life_property_catalog
  add column if not exists resale_rate numeric(4,3) not null default 0.800
  check (resale_rate > 0 and resale_rate <= 1);

create table if not exists public.apx_life_property_maintenance (
  id bigint generated always as identity primary key,
  owner_id uuid not null references auth.users(id) on delete cascade,
  owned_property_id uuid not null references public.apx_life_owned_properties(id) on delete cascade,
  game_day bigint not null,
  amount bigint not null check (amount >= 0),
  status text not null check (status in ('due','paid')),
  created_at timestamptz not null default now(),
  paid_at timestamptz,
  unique (owner_id, owned_property_id, game_day)
);

create table if not exists public.apx_life_property_transactions (
  id bigint generated always as identity primary key,
  owner_id uuid not null references auth.users(id) on delete cascade,
  owned_property_id uuid,
  property_id text not null references public.apx_life_property_catalog(property_id),
  transaction_type text not null check (transaction_type in ('sell')),
  amount bigint not null check (amount > 0),
  idempotency_key uuid not null,
  created_at timestamptz not null default now(),
  unique (owner_id,idempotency_key)
);

create index if not exists apx_life_property_maintenance_owner_idx
  on public.apx_life_property_maintenance(owner_id,game_day desc,status);
create index if not exists apx_life_property_transactions_owner_idx
  on public.apx_life_property_transactions(owner_id,created_at desc);
alter table public.apx_life_property_maintenance enable row level security;
alter table public.apx_life_property_transactions enable row level security;
revoke all on public.apx_life_property_maintenance,public.apx_life_property_transactions from public,anon,authenticated;

create or replace function public.apx_life_guard_decor_maintenance()
returns trigger language plpgsql security definer set search_path='' as $$
begin
  if exists(select 1 from public.apx_life_property_maintenance
    where owner_id=new.owner_id and status='due') then
    raise exception 'Settle outstanding home maintenance before buying furniture or changing room layouts.';
  end if;
  return new;
end; $$;
drop trigger if exists apx_life_room_layout_no_maintenance_debt on public.apx_life_room_layouts;
create trigger apx_life_room_layout_no_maintenance_debt
before insert or update of layout on public.apx_life_room_layouts
for each row execute function public.apx_life_guard_decor_maintenance();
drop trigger if exists apx_life_owned_furniture_no_maintenance_debt on public.apx_life_owned_furniture;
create trigger apx_life_owned_furniture_no_maintenance_debt
before insert on public.apx_life_owned_furniture
for each row execute function public.apx_life_guard_decor_maintenance();
revoke all on function public.apx_life_guard_decor_maintenance() from public,anon,authenticated;

create or replace function public.apx_life_charge_maintenance()
returns jsonb language plpgsql security definer set search_path='' as $$
declare
  v_user uuid := (select auth.uid());
  v_day bigint := floor(extract(epoch from now())/900)::bigint;
  v_state jsonb;
  v_cash numeric;
  v_wallet numeric;
  v_today bigint := 0;
  v_due bigint := 0;
  v_debt bigint := 0;
  v_paid boolean := false;
begin
  if v_user is null or not public.apx_user_can_play() then raise exception 'Sign in required.'; end if;
  select game_state into v_state from public.apx_game_saves where user_id=v_user for update;
  if v_state is null or coalesce(v_state->>'cash','') !~ '^[0-9]{1,18}(\.[0-9]{1,2})?$' then raise exception 'Invalid personal balance.'; end if;
  v_cash := (v_state->>'cash')::numeric;
  select balance into v_wallet from public.apx_life_personal_wallets where owner_id=v_user for update;
  if not found or v_wallet<>v_cash then raise exception 'Personal wallet is out of sync; reload and retry.'; end if;

  insert into public.apx_life_property_maintenance(owner_id,owned_property_id,game_day,amount,status)
  select v_user,owned.id,v_day,catalog.daily_maintenance,'due'
  from public.apx_life_owned_properties owned
  join public.apx_life_property_catalog catalog using(property_id)
  where owned.owner_id=v_user and catalog.daily_maintenance>0
  on conflict(owner_id,owned_property_id,game_day) do nothing;

  select coalesce(sum(amount),0) into v_today from public.apx_life_property_maintenance
  where owner_id=v_user and game_day=v_day and status='due';
  select coalesce(sum(amount),0) into v_due from public.apx_life_property_maintenance
  where owner_id=v_user and status='due';
  if v_due>0 and v_cash>=v_due then
    update public.apx_game_saves
    set game_state=jsonb_set(v_state,'{cash}',to_jsonb(v_cash-v_due),true),revision=revision+1,updated_at=now()
    where user_id=v_user;
    update public.apx_life_property_maintenance set status='paid',paid_at=now()
    where owner_id=v_user and status='due';
    v_cash:=v_cash-v_due;
    v_paid:=true;
    v_due:=0;
  end if;
  select coalesce(sum(amount),0) into v_debt from public.apx_life_property_maintenance
  where owner_id=v_user and status='due';
  return jsonb_build_object('game_day',v_day,'charged_today',case when v_paid then v_today else 0 end,
    'debt',v_debt,'cash',v_cash,'paid',v_paid);
end; $$;

create or replace function public.apx_life_housing_home_v2()
returns jsonb language plpgsql security definer set search_path='' as $$
declare v_summary jsonb; v_home jsonb; v_owned jsonb; v_catalog jsonb; v_user uuid := (select auth.uid());
begin
  v_summary:=public.apx_life_charge_maintenance();
  v_home:=public.apx_life_housing_home();
  select coalesce(jsonb_agg(items.item || jsonb_build_object('resale_rate',catalog.resale_rate)),'[]'::jsonb)
  into v_owned from jsonb_array_elements(coalesce(v_home->'owned','[]'::jsonb)) as items(item)
  join public.apx_life_owned_properties owned on owned.id=(items.item->>'id')::uuid
  join public.apx_life_property_catalog catalog using(property_id)
  where owned.owner_id=v_user;
  select coalesce(jsonb_agg(items.item || jsonb_build_object('resale_rate',catalog.resale_rate)),'[]'::jsonb)
  into v_catalog from jsonb_array_elements(coalesce(v_home->'catalog','[]'::jsonb)) as items(item)
  join public.apx_life_property_catalog catalog on catalog.property_id=items.item->>'property_id';
  return v_home || jsonb_build_object('owned',v_owned,'catalog',v_catalog,'maintenance',v_summary);
end; $$;

create or replace function public.apx_life_sell_property(
  p_owned_id uuid,p_idempotency_key uuid,p_confirm_clear_layout boolean default false
)
returns jsonb language plpgsql security definer set search_path='' as $$
declare
  v_user uuid := (select auth.uid());
  v_existing public.apx_life_property_transactions%rowtype;
  v_property public.apx_life_owned_properties%rowtype;
  v_state jsonb;
  v_cash numeric;
  v_wallet numeric;
  v_rate numeric;
  v_sale bigint;
  v_balance numeric;
  v_next_home uuid;
  v_next_capacity integer := 1;
  v_vehicle_count integer;
begin
  if v_user is null or not public.apx_user_can_play() then raise exception 'Sign in required.'; end if;
  if p_idempotency_key is null then raise exception 'Missing transaction id.'; end if;
  select * into v_existing from public.apx_life_property_transactions
  where owner_id=v_user and idempotency_key=p_idempotency_key;
  if found then return jsonb_build_object('ok',true,'duplicate',true,'amount',v_existing.amount,'formula','floor(purchase_price * resale_rate)'); end if;
  select game_state into v_state from public.apx_game_saves where user_id=v_user for update;
  if v_state is null or coalesce(v_state->>'cash','') !~ '^[0-9]{1,18}(\.[0-9]{1,2})?$' then raise exception 'Invalid personal balance.'; end if;
  select * into v_property from public.apx_life_owned_properties where id=p_owned_id and owner_id=v_user for update;
  if not found then raise exception 'This home is not yours.'; end if;
  if v_property.is_primary then
    select coalesce(catalog.garage_capacity,1) into v_next_capacity
    from public.apx_life_owned_properties next_home
    join public.apx_life_property_catalog catalog using(property_id)
    where next_home.owner_id=v_user and next_home.id<>p_owned_id
    order by next_home.purchased_at desc limit 1;
    v_next_capacity:=coalesce(v_next_capacity,1);
    select count(*) into v_vehicle_count from public.apx_life_owned_vehicles where owner_id=v_user;
    if v_vehicle_count>v_next_capacity then raise exception 'Move or sell vehicles before selling this primary home; the next garage holds fewer vehicles.'; end if;
  end if;
  if exists(select 1 from public.apx_life_property_maintenance where owner_id=v_user and owned_property_id=p_owned_id and status='due') then
    raise exception 'Settle this home maintenance debt before selling it.';
  end if;
  if exists(select 1 from public.apx_life_room_layouts where owned_property_id=p_owned_id
      and jsonb_array_length(layout->'items')>0) and not coalesce(p_confirm_clear_layout,false) then
    raise exception 'Confirm moving placed furniture back to your inventory before selling.';
  end if;
  select resale_rate into v_rate from public.apx_life_property_catalog where property_id=v_property.property_id;
  v_sale:=greatest(1,floor(v_property.purchase_price*v_rate)::bigint);
  v_cash:=(v_state->>'cash')::numeric;
  select balance into v_wallet from public.apx_life_personal_wallets where owner_id=v_user for update;
  if not found or v_wallet<>v_cash then raise exception 'Personal wallet is out of sync; reload and retry.'; end if;
  v_balance:=v_cash+v_sale;
  update public.apx_game_saves set game_state=jsonb_set(v_state,'{cash}',to_jsonb(v_balance),true),
    revision=revision+1,updated_at=now() where user_id=v_user;
  insert into public.apx_life_property_transactions(owner_id,owned_property_id,property_id,transaction_type,amount,idempotency_key)
  values(v_user,p_owned_id,v_property.property_id,'sell',v_sale,p_idempotency_key);
  if v_property.is_primary then
    update public.apx_life_owned_properties set is_primary=false where id=p_owned_id and owner_id=v_user;
    select id into v_next_home from public.apx_life_owned_properties
    where owner_id=v_user and id<>p_owned_id order by purchased_at desc limit 1;
    if v_next_home is not null then update public.apx_life_owned_properties set is_primary=true where id=v_next_home and owner_id=v_user; end if;
  end if;
  if p_confirm_clear_layout then delete from public.apx_life_room_layouts where owned_property_id=p_owned_id and owner_id=v_user; end if;
  delete from public.apx_life_owned_properties where id=p_owned_id and owner_id=v_user;
  return jsonb_build_object('ok',true,'duplicate',false,'amount',v_sale,'cash',v_balance,
    'resale_rate',v_rate,'formula','floor(purchase_price * resale_rate)','cleared_placed_items',coalesce(p_confirm_clear_layout,false));
end; $$;

create or replace function public.apx_life_set_primary_home(p_owned_id uuid)
returns void language plpgsql security definer set search_path='' as $$
declare v_user uuid := (select auth.uid()); v_capacity integer; v_vehicle_count integer;
begin
  if v_user is null or not public.apx_user_can_play() then raise exception 'Sign in required.'; end if;
  select catalog.garage_capacity into v_capacity
  from public.apx_life_owned_properties owned
  join public.apx_life_property_catalog catalog using(property_id)
  where owned.id=p_owned_id and owned.owner_id=v_user for update of owned;
  if not found then raise exception 'This home is not yours.'; end if;
  select count(*) into v_vehicle_count from public.apx_life_owned_vehicles where owner_id=v_user;
  if v_vehicle_count>v_capacity then raise exception 'Garage capacity is below your vehicle count.'; end if;
  update public.apx_life_owned_properties set is_primary=false where owner_id=v_user and is_primary;
  update public.apx_life_owned_properties set is_primary=true where id=p_owned_id and owner_id=v_user;
end; $$;

revoke all on function public.apx_life_charge_maintenance(),public.apx_life_housing_home_v2(),
  public.apx_life_sell_property(uuid,uuid,boolean) from public,anon;
grant execute on function public.apx_life_charge_maintenance(),public.apx_life_housing_home_v2(),
  public.apx_life_sell_property(uuid,uuid,boolean) to authenticated;

commit;
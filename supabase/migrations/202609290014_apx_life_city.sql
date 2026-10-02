begin;

do $$
begin
  if to_regclass('public.apx_life_personal_wallets') is null
     or to_regclass('public.apx_game_saves') is null
     or to_regprocedure('public.apx_user_can_play()') is null then
    raise exception 'Apply APX LIFE wallet and housing migrations first.';
  end if;
end;
$$;

create table if not exists public.apx_life_locations (
  location_id text primary key check (location_id ~ '^[a-z0-9-]{3,60}$'),
  name text not null,
  description text not null,
  image text not null,
  map_x numeric(5,2) not null check (map_x between 0 and 100),
  map_y numeric(5,2) not null check (map_y between 0 and 100),
  opening_hours text not null,
  is_active boolean not null default true
);

create table if not exists public.apx_life_activities (
  activity_id text primary key check (activity_id ~ '^[a-z0-9-]{3,60}$'),
  location_id text not null references public.apx_life_locations(location_id),
  name text not null,
  description text not null,
  price bigint not null check (price >= 0),
  daily_limit integer not null default 1 check (daily_limit between 1 and 10),
  social_points integer not null default 1 check (social_points between 0 and 100),
  is_active boolean not null default true
);

create table if not exists public.apx_life_activity_logs (
  id bigint generated always as identity primary key,
  owner_id uuid not null references auth.users(id) on delete cascade,
  activity_id text not null references public.apx_life_activities(activity_id),
  game_day bigint not null,
  fee bigint not null check (fee >= 0),
  social_points integer not null check (social_points >= 0),
  idempotency_key uuid not null,
  created_at timestamptz not null default now(),
  unique (owner_id, idempotency_key)
);

create index if not exists apx_life_activity_logs_owner_day_idx
  on public.apx_life_activity_logs(owner_id, game_day, activity_id);
create index if not exists apx_life_activity_logs_owner_created_idx
  on public.apx_life_activity_logs(owner_id, created_at desc);

create table if not exists public.apx_life_events (
  event_id text primary key check (event_id ~ '^[a-z0-9-]{3,60}$'),
  name text not null,
  description text not null,
  image text not null,
  starts_at timestamptz not null,
  ends_at timestamptz not null check (ends_at > starts_at),
  capacity integer not null check (capacity > 0),
  ticket_price bigint not null default 0 check (ticket_price >= 0),
  is_active boolean not null default true
);

create table if not exists public.apx_life_event_attendees (
  id bigint generated always as identity primary key,
  event_id text not null references public.apx_life_events(event_id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  amount_paid bigint not null check (amount_paid >= 0),
  idempotency_key uuid not null,
  joined_at timestamptz not null default now(),
  unique (event_id, owner_id),
  unique (owner_id, idempotency_key)
);

alter table public.apx_life_locations enable row level security;
alter table public.apx_life_activities enable row level security;
alter table public.apx_life_activity_logs enable row level security;
alter table public.apx_life_events enable row level security;
alter table public.apx_life_event_attendees enable row level security;
revoke all on public.apx_life_locations, public.apx_life_activities,
  public.apx_life_activity_logs, public.apx_life_events,
  public.apx_life_event_attendees from public, anon, authenticated;

insert into public.apx_life_locations(location_id, name, description, image, map_x, map_y, opening_hours) values
  ('river-cafe', 'Cà phê Bến Sông', 'Quán cà phê yên tĩnh nhìn ra bờ sông và phố đêm.', 'assets/apx-life/locations/river-cafe.svg', 24, 33, '06:00–23:00 giờ game'),
  ('lantern-restaurant', 'Nhà hàng Đèn Lồng', 'Ẩm thực Việt đương đại trong không gian ấm.', 'assets/apx-life/locations/lantern-restaurant.svg', 47, 23, '10:00–22:00 giờ game'),
  ('apx-galleria', 'Trung tâm APX Galleria', 'Khu mua sắm và gặp gỡ giữa trung tâm đô thị.', 'assets/apx-life/locations/apx-galleria.svg', 73, 38, '09:00–22:00 giờ game'),
  ('lotus-park', 'Công viên Hồ Sen', 'Lối dạo ven hồ và khoảng xanh cộng đồng.', 'assets/apx-life/locations/lotus-park.svg', 32, 68, '05:00–22:00 giờ game'),
  ('skyline-hotel', 'Khách sạn Skyline', 'Khách sạn thành phố với sảnh đón khách rộng.', 'assets/apx-life/locations/skyline-hotel.svg', 72, 68, 'Mở cửa cả ngày game'),
  ('civic-event-hall', 'Trung tâm Sự kiện Civic', 'Không gian triển lãm, gala và hội chợ doanh nghiệp.', 'assets/apx-life/locations/civic-event-hall.svg', 52, 53, 'Theo lịch sự kiện')
on conflict (location_id) do nothing;

insert into public.apx_life_activities(activity_id, location_id, name, description, price, daily_limit, social_points) values
  ('cafe-coffee', 'river-cafe', 'Gọi cà phê', 'Dừng chân với một ly cà phê rang tại chỗ.', 50000, 2, 2),
  ('cafe-network', 'river-cafe', 'Gặp gỡ đối tác', 'Cuộc trò chuyện ngắn với một khách mời NPC.', 180000, 1, 4),
  ('cafe-postcard', 'river-cafe', 'Chụp bưu thiếp', 'Lưu một bưu thiếp kỹ thuật số của bờ sông.', 75000, 1, 3),
  ('restaurant-lunch', 'lantern-restaurant', 'Bữa trưa', 'Thưởng thức thực đơn trưa của nhà hàng.', 300000, 1, 3),
  ('restaurant-dinner', 'lantern-restaurant', 'Bữa tối tiếp khách', 'Một bữa tối trò chuyện cùng NPC doanh nhân.', 650000, 1, 5),
  ('restaurant-tasting', 'lantern-restaurant', 'Thực đơn đặc biệt', 'Trải nghiệm món mới theo mùa.', 420000, 1, 4),
  ('galleria-window', 'apx-galleria', 'Dạo trung tâm thương mại', 'Khám phá các khu trưng bày trong trung tâm.', 100000, 1, 2),
  ('galleria-gallery', 'apx-galleria', 'Thăm triển lãm', 'Xem một triển lãm sáng tạo địa phương.', 220000, 1, 4),
  ('galleria-meetup', 'apx-galleria', 'Gặp cộng đồng', 'Tham gia buổi giao lưu người chơi.', 150000, 1, 3),
  ('park-walk', 'lotus-park', 'Đi dạo ven hồ', 'Một vòng thư giãn quanh hồ Sen.', 0, 2, 2),
  ('park-postcard', 'lotus-park', 'Chụp bưu thiếp công viên', 'Lưu khung cảnh xanh vào nhật ký.', 25000, 1, 3),
  ('park-community', 'lotus-park', 'Sinh hoạt cộng đồng', 'Gặp gỡ cư dân và NPC tại công viên.', 50000, 1, 4),
  ('hotel-lounge', 'skyline-hotel', 'Dùng sảnh lounge', 'Nghỉ chân trong sảnh khách sạn.', 180000, 1, 2),
  ('hotel-network', 'skyline-hotel', 'Kết nối doanh nhân', 'Tham dự buổi kết nối nhỏ tại khách sạn.', 480000, 1, 5),
  ('hotel-suite-tour', 'skyline-hotel', 'Thăm phòng mẫu', 'Khám phá một phòng suite trưng bày.', 350000, 1, 3),
  ('event-expo', 'civic-event-hall', 'Triển lãm xe APX', 'Tham quan bộ sưu tập xe hư cấu.', 500000, 1, 5),
  ('event-gala', 'civic-event-hall', 'Gala CEO', 'Gặp gỡ cộng đồng doanh nhân APX.', 1000000, 1, 8),
  ('event-estate', 'civic-event-hall', 'Hội chợ bất động sản', 'Tìm hiểu các dự án nhà ở trong game.', 650000, 1, 6)
on conflict (activity_id) do nothing;

insert into public.apx_life_events(event_id, name, description, image, starts_at, ends_at, capacity, ticket_price) values
  ('apx-vehicle-expo-2026', 'Triển lãm xe APX', 'Trưng bày các mẫu xe hư cấu và giao lưu người chơi.', 'assets/apx-life/locations/civic-event-hall.svg', now() + interval '1 day', now() + interval '3 days', 500, 500000),
  ('ceo-gala-2026', 'Gala CEO APX', 'Đêm gặp gỡ cộng đồng nhà sáng lập APX.', 'assets/apx-life/locations/civic-event-hall.svg', now() + interval '5 days', now() + interval '7 days', 800, 1000000),
  ('property-fair-2026', 'Hội chợ bất động sản', 'Triển lãm nhà ở và thiết kế nội thất trong game.', 'assets/apx-life/locations/civic-event-hall.svg', now() + interval '9 days', now() + interval '11 days', 700, 650000)
on conflict (event_id) do nothing;

create or replace function public.apx_life_city_home()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_user uuid := (select auth.uid());
  v_locations jsonb;
  v_events jsonb;
  v_recent jsonb;
begin
  if v_user is null or not public.apx_user_can_play() then raise exception 'Sign in to visit the APX LIFE city.'; end if;
  select coalesce(jsonb_agg(jsonb_build_object(
    'location_id', location.location_id, 'name', location.name,
    'description', location.description, 'image', location.image,
    'map_x', location.map_x, 'map_y', location.map_y,
    'opening_hours', location.opening_hours,
    'activities', coalesce((select jsonb_agg(jsonb_build_object(
      'activity_id', activity.activity_id, 'name', activity.name,
      'description', activity.description, 'price', activity.price,
      'daily_limit', activity.daily_limit, 'social_points', activity.social_points
    ) order by activity.price) from public.apx_life_activities activity
      where activity.location_id = location.location_id and activity.is_active), '[]'::jsonb)
  ) order by location.name), '[]'::jsonb) into v_locations
  from public.apx_life_locations location where location.is_active;

  select coalesce(jsonb_agg(jsonb_build_object(
    'event_id', event.event_id, 'name', event.name, 'description', event.description,
    'image', event.image, 'starts_at', event.starts_at, 'ends_at', event.ends_at,
    'capacity', event.capacity, 'ticket_price', event.ticket_price,
    'attendee_count', (select count(*) from public.apx_life_event_attendees attendee where attendee.event_id = event.event_id),
    'joined', exists(select 1 from public.apx_life_event_attendees attendee where attendee.event_id = event.event_id and attendee.owner_id = v_user)
  ) order by event.starts_at), '[]'::jsonb) into v_events
  from public.apx_life_events event where event.is_active and event.ends_at > now();

  select coalesce(jsonb_agg(jsonb_build_object(
    'activity_id', activity.activity_id, 'activity_name', definition.name,
    'location_name', location.name, 'fee', activity.fee,
    'social_points', activity.social_points, 'created_at', activity.created_at
  ) order by activity.created_at desc), '[]'::jsonb) into v_recent
  from (select * from public.apx_life_activity_logs where owner_id = v_user order by created_at desc limit 3) activity
  join public.apx_life_activities definition using (activity_id)
  join public.apx_life_locations location using (location_id);
  return jsonb_build_object('locations', v_locations, 'events', v_events, 'recent', v_recent);
end;
$$;

create or replace function public.apx_life_do_activity(p_activity_id text, p_idempotency_key uuid)
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
  v_game_day bigint := floor(extract(epoch from now()) / 900)::bigint;
  v_activity public.apx_life_activities%rowtype;
  v_existing public.apx_life_activity_logs%rowtype;
  v_count integer;
  v_balance numeric;
begin
  if v_user is null or not public.apx_user_can_play() then raise exception 'Sign in to do this activity.'; end if;
  if p_idempotency_key is null then raise exception 'Missing transaction id.'; end if;
  select * into v_existing from public.apx_life_activity_logs where owner_id = v_user and idempotency_key = p_idempotency_key;
  if found then return jsonb_build_object('ok', true, 'duplicate', true, 'fee', v_existing.fee, 'social_points', v_existing.social_points); end if;
  select * into v_activity from public.apx_life_activities where activity_id = p_activity_id and is_active;
  if not found then raise exception 'This activity is unavailable.'; end if;
  select game_state into v_state from public.apx_game_saves where user_id = v_user for update;
  if v_state is null or coalesce(v_state ->> 'cash', '') !~ '^[0-9]{1,18}(\.[0-9]{1,2})?$' then raise exception 'Invalid personal balance.'; end if;
  select balance into v_wallet from public.apx_life_personal_wallets where owner_id = v_user for update;
  v_cash := (v_state ->> 'cash')::numeric;
  if not found or v_wallet <> v_cash then raise exception 'Personal wallet is out of sync; reload and retry.'; end if;
  select count(*) into v_count from public.apx_life_activity_logs
  where owner_id = v_user and activity_id = p_activity_id and game_day = v_game_day;
  if v_count >= v_activity.daily_limit then raise exception 'Daily activity limit reached.'; end if;
  if v_cash < v_activity.price then raise exception 'Insufficient personal balance.'; end if;
  v_balance := v_cash - v_activity.price;
  if v_activity.price > 0 then
    update public.apx_game_saves set game_state = jsonb_set(v_state, '{cash}', to_jsonb(v_balance), true),
      revision = revision + 1, updated_at = now() where user_id = v_user;
  end if;
  insert into public.apx_life_activity_logs(owner_id, activity_id, game_day, fee, social_points, idempotency_key)
  values (v_user, p_activity_id, v_game_day, v_activity.price, v_activity.social_points, p_idempotency_key);
  return jsonb_build_object('ok', true, 'duplicate', false, 'activity_id', p_activity_id,
    'fee', v_activity.price, 'cash', v_balance, 'social_points', v_activity.social_points, 'game_day', v_game_day);
end;
$$;

create or replace function public.apx_life_join_event(p_event_id text, p_idempotency_key uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := (select auth.uid());
  v_event public.apx_life_events%rowtype;
  v_state jsonb;
  v_cash numeric;
  v_wallet numeric;
  v_balance numeric;
  v_existing public.apx_life_event_attendees%rowtype;
begin
  if v_user is null or not public.apx_user_can_play() then raise exception 'Sign in to join an event.'; end if;
  if p_idempotency_key is null then raise exception 'Missing transaction id.'; end if;
  select * into v_event from public.apx_life_events where event_id = p_event_id and is_active for update;
  if not found or v_event.ends_at <= now() or v_event.starts_at > now() then raise exception 'This event is not open yet.'; end if;
  select * into v_existing from public.apx_life_event_attendees where event_id = p_event_id and owner_id = v_user;
  if found then return jsonb_build_object('ok', true, 'duplicate', true, 'amount_paid', v_existing.amount_paid); end if;
  if (select count(*) from public.apx_life_event_attendees where event_id = p_event_id) >= v_event.capacity then raise exception 'This event is full.'; end if;
  select game_state into v_state from public.apx_game_saves where user_id = v_user for update;
  if v_state is null or coalesce(v_state ->> 'cash', '') !~ '^[0-9]{1,18}(\.[0-9]{1,2})?$' then raise exception 'Invalid personal balance.'; end if;
  v_cash := (v_state ->> 'cash')::numeric;
  select balance into v_wallet from public.apx_life_personal_wallets where owner_id = v_user for update;
  if not found or v_wallet <> v_cash then raise exception 'Personal wallet is out of sync; reload and retry.'; end if;
  if v_cash < v_event.ticket_price then raise exception 'Insufficient personal balance.'; end if;
  v_balance := v_cash - v_event.ticket_price;
  if v_event.ticket_price > 0 then
    update public.apx_game_saves set game_state = jsonb_set(v_state, '{cash}', to_jsonb(v_balance), true),
      revision = revision + 1, updated_at = now() where user_id = v_user;
  end if;
  insert into public.apx_life_event_attendees(event_id, owner_id, amount_paid, idempotency_key)
  values (p_event_id, v_user, v_event.ticket_price, p_idempotency_key);
  return jsonb_build_object('ok', true, 'duplicate', false, 'amount_paid', v_event.ticket_price, 'cash', v_balance);
end;
$$;

revoke all on function public.apx_life_city_home(),
  public.apx_life_do_activity(text, uuid), public.apx_life_join_event(text, uuid) from public, anon;
grant execute on function public.apx_life_city_home(),
  public.apx_life_do_activity(text, uuid), public.apx_life_join_event(text, uuid) to authenticated;

commit;
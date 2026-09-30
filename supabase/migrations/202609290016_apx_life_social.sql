begin;

do $$
begin
  if to_regclass('public.apx_player_profiles') is null
     or to_regclass('public.apx_player_reports') is null
     or to_regprocedure('public.apx_user_can_play()') is null then
    raise exception 'Apply the APX account platform migration first.';
  end if;
end;
$$;

create table if not exists public.apx_life_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  bio text not null default '' check (char_length(bio) <= 180),
  is_private boolean not null default false,
  allow_home_visits boolean not null default false,
  share_primary_home boolean not null default false,
  share_active_vehicle boolean not null default false,
  updated_at timestamptz not null default now()
);
insert into public.apx_life_profiles(user_id)
select user_id from public.apx_player_profiles on conflict (user_id) do nothing;

create table if not exists public.apx_life_blocks (
  blocker_id uuid not null references auth.users(id) on delete cascade,
  blocked_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id), check (blocker_id <> blocked_id)
);
create table if not exists public.apx_life_follows (
  follower_id uuid not null references auth.users(id) on delete cascade,
  followed_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, followed_id), check (follower_id <> followed_id)
);
create table if not exists public.apx_life_friendships (
  user_low uuid not null references auth.users(id) on delete cascade,
  user_high uuid not null references auth.users(id) on delete cascade,
  requested_by uuid not null references auth.users(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending','accepted')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_low,user_high), check (user_low < user_high),
  check (requested_by = user_low or requested_by = user_high)
);
create table if not exists public.apx_life_posts (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 500),
  image_kind text check (image_kind in ('property','vehicle','location')),
  image_asset_id text,
  image_path text,
  created_at timestamptz not null default now(),
  check ((image_kind is null and image_asset_id is null and image_path is null)
      or (image_kind is not null and image_asset_id is not null and image_path is not null))
);
create table if not exists public.apx_life_post_likes (
  post_id uuid not null references public.apx_life_posts(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(), primary key (post_id,owner_id)
);
create table if not exists public.apx_life_comments (
  id bigint generated always as identity primary key,
  post_id uuid not null references public.apx_life_posts(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 200),
  created_at timestamptz not null default now()
);
create table if not exists public.apx_life_notifications (
  id bigint generated always as identity primary key,
  owner_id uuid not null references auth.users(id) on delete cascade,
  actor_id uuid references auth.users(id) on delete set null,
  notification_type text not null check (notification_type in ('like','comment','follow','friend_request','friend_accepted')),
  post_id uuid references public.apx_life_posts(id) on delete cascade,
  created_at timestamptz not null default now(), read_at timestamptz
);

create index if not exists apx_life_posts_created_idx on public.apx_life_posts(created_at desc,id desc);
create index if not exists apx_life_posts_owner_idx on public.apx_life_posts(owner_id,created_at desc);
create index if not exists apx_life_comments_post_idx on public.apx_life_comments(post_id,created_at desc);
create index if not exists apx_life_comments_owner_idx on public.apx_life_comments(owner_id,created_at desc);
create index if not exists apx_life_notifications_owner_idx on public.apx_life_notifications(owner_id,created_at desc);
create index if not exists apx_life_friendships_incoming_idx on public.apx_life_friendships(user_high,status,created_at desc);
create index if not exists apx_life_follows_target_idx on public.apx_life_follows(followed_id,created_at desc);

alter table public.apx_life_profiles enable row level security;
alter table public.apx_life_blocks enable row level security;
alter table public.apx_life_follows enable row level security;
alter table public.apx_life_friendships enable row level security;
alter table public.apx_life_posts enable row level security;
alter table public.apx_life_post_likes enable row level security;
alter table public.apx_life_comments enable row level security;
alter table public.apx_life_notifications enable row level security;
revoke all on public.apx_life_profiles,public.apx_life_blocks,public.apx_life_follows,
  public.apx_life_friendships,public.apx_life_posts,public.apx_life_post_likes,
  public.apx_life_comments,public.apx_life_notifications from public,anon,authenticated;
drop policy if exists apx_life_notifications_read_self on public.apx_life_notifications;
create policy apx_life_notifications_read_self on public.apx_life_notifications
  for select to authenticated using (owner_id=(select auth.uid()));
grant select on public.apx_life_notifications to authenticated;

do $$
begin
  if exists(select 1 from pg_catalog.pg_publication where pubname='supabase_realtime')
     and not exists(select 1 from pg_catalog.pg_publication_tables
       where pubname='supabase_realtime' and schemaname='public' and tablename='apx_life_notifications') then
    execute 'alter publication supabase_realtime add table public.apx_life_notifications';
  end if;
end;
$$;

create or replace function public.apx_life_is_blocked(p_left uuid,p_right uuid)
returns boolean language sql stable security definer set search_path='' as $$
  select exists(select 1 from public.apx_life_blocks where
    (blocker_id=p_left and blocked_id=p_right) or (blocker_id=p_right and blocked_id=p_left));
$$;

create or replace function public.apx_life_can_view_post(p_post_id uuid,p_viewer uuid)
returns boolean language sql stable security definer set search_path='' as $$
  select exists(select 1 from public.apx_life_posts post
    left join public.apx_life_profiles settings on settings.user_id=post.owner_id
    where post.id=p_post_id and not public.apx_life_is_blocked(post.owner_id,p_viewer)
      and (post.owner_id=p_viewer or not coalesce(settings.is_private,false)
        or exists(select 1 from public.apx_life_friendships f where f.status='accepted'
          and f.user_low=least(post.owner_id,p_viewer) and f.user_high=greatest(post.owner_id,p_viewer))));
$$;

create or replace function public.apx_life_update_profile(
  p_bio text,p_private boolean,p_visits boolean,p_share_home boolean,p_share_vehicle boolean
) returns void language plpgsql security definer set search_path='' as $$
declare v_user uuid := (select auth.uid());
begin
  if v_user is null or not public.apx_user_can_play() then raise exception 'Sign in required.'; end if;
  if p_bio is null or char_length(p_bio)>180 or p_bio ~ '<[^>]*>' then raise exception 'Bio must be up to 180 plain-text characters.'; end if;
  insert into public.apx_life_profiles(user_id,bio,is_private,allow_home_visits,share_primary_home,share_active_vehicle,updated_at)
  values(v_user,btrim(p_bio),p_private,p_visits,p_share_home,p_share_vehicle,now())
  on conflict(user_id) do update set bio=excluded.bio,is_private=excluded.is_private,
    allow_home_visits=excluded.allow_home_visits,share_primary_home=excluded.share_primary_home,
    share_active_vehicle=excluded.share_active_vehicle,updated_at=now();
end; $$;

create or replace function public.apx_life_friend_request(p_character_id uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
declare v_user uuid := (select auth.uid()); v_target uuid; v_low uuid; v_high uuid; v_row public.apx_life_friendships%rowtype;
begin
  if v_user is null or not public.apx_user_can_play() then raise exception 'Sign in required.'; end if;
  select user_id into v_target from public.apx_player_profiles where character_id=p_character_id and not is_banned;
  if v_target is null or v_target=v_user then raise exception 'Invalid friend target.'; end if;
  if public.apx_life_is_blocked(v_user,v_target) then raise exception 'Interaction is blocked.'; end if;
  v_low:=least(v_user,v_target); v_high:=greatest(v_user,v_target);
  select * into v_row from public.apx_life_friendships where user_low=v_low and user_high=v_high for update;
  if found then
    if v_row.status='accepted' or v_row.requested_by=v_user then return jsonb_build_object('status',v_row.status,'duplicate',true); end if;
    update public.apx_life_friendships set status='accepted',updated_at=now() where user_low=v_low and user_high=v_high;
    insert into public.apx_life_notifications(owner_id,actor_id,notification_type) values(v_row.requested_by,v_user,'friend_accepted');
    return jsonb_build_object('status','accepted','duplicate',false);
  end if;
  insert into public.apx_life_friendships(user_low,user_high,requested_by) values(v_low,v_high,v_user);
  insert into public.apx_life_notifications(owner_id,actor_id,notification_type) values(v_target,v_user,'friend_request');
  return jsonb_build_object('status','pending','duplicate',false);
end; $$;

create or replace function public.apx_life_friend_respond(p_character_id uuid,p_accept boolean)
returns jsonb language plpgsql security definer set search_path='' as $$
declare v_user uuid := (select auth.uid()); v_target uuid; v_low uuid; v_high uuid; v_row public.apx_life_friendships%rowtype;
begin
  if v_user is null or not public.apx_user_can_play() then raise exception 'Sign in required.'; end if;
  select user_id into v_target from public.apx_player_profiles where character_id=p_character_id and not is_banned;
  if v_target is null or v_target=v_user then raise exception 'Invalid friend request.'; end if;
  v_low:=least(v_user,v_target); v_high:=greatest(v_user,v_target);
  select * into v_row from public.apx_life_friendships where user_low=v_low and user_high=v_high for update;
  if not found or v_row.status<>'pending' or v_row.requested_by=v_user then raise exception 'No incoming friend request.'; end if;
  if p_accept then
    update public.apx_life_friendships set status='accepted',updated_at=now() where user_low=v_low and user_high=v_high;
    insert into public.apx_life_notifications(owner_id,actor_id,notification_type) values(v_row.requested_by,v_user,'friend_accepted');
    return jsonb_build_object('status','accepted');
  end if;
  delete from public.apx_life_friendships where user_low=v_low and user_high=v_high;
  return jsonb_build_object('status','declined');
end; $$;

create or replace function public.apx_life_block_player(p_character_id uuid,p_block boolean default true)
returns void language plpgsql security definer set search_path='' as $$
declare v_user uuid := (select auth.uid()); v_target uuid; v_low uuid; v_high uuid;
begin
  if v_user is null or not public.apx_user_can_play() then raise exception 'Sign in required.'; end if;
  select user_id into v_target from public.apx_player_profiles where character_id=p_character_id;
  if v_target is null or v_target=v_user then raise exception 'Invalid player.'; end if;
  if p_block then
    insert into public.apx_life_blocks(blocker_id,blocked_id) values(v_user,v_target) on conflict do nothing;
    delete from public.apx_life_follows where (follower_id=v_user and followed_id=v_target) or (follower_id=v_target and followed_id=v_user);
    v_low:=least(v_user,v_target); v_high:=greatest(v_user,v_target);
    delete from public.apx_life_friendships where user_low=v_low and user_high=v_high;
  else delete from public.apx_life_blocks where blocker_id=v_user and blocked_id=v_target; end if;
end; $$;

create or replace function public.apx_life_follow(p_character_id uuid,p_follow boolean default true)
returns void language plpgsql security definer set search_path='' as $$
declare v_user uuid := (select auth.uid()); v_target uuid;
begin
  if v_user is null or not public.apx_user_can_play() then raise exception 'Sign in required.'; end if;
  select user_id into v_target from public.apx_player_profiles where character_id=p_character_id and not is_banned;
  if v_target is null or v_target=v_user or public.apx_life_is_blocked(v_user,v_target) then raise exception 'Invalid follow target.'; end if;
  if p_follow then
    insert into public.apx_life_follows(follower_id,followed_id) values(v_user,v_target) on conflict do nothing;
    insert into public.apx_life_notifications(owner_id,actor_id,notification_type)
    select v_target,v_user,'follow' where not exists(select 1 from public.apx_life_notifications
      where owner_id=v_target and actor_id=v_user and notification_type='follow' and created_at>now()-interval '10 minutes');
  else delete from public.apx_life_follows where follower_id=v_user and followed_id=v_target; end if;
end; $$;

create or replace function public.apx_life_friend_cancel(p_character_id uuid)
returns void language plpgsql security definer set search_path='' as $$
declare v_user uuid := (select auth.uid()); v_target uuid; v_low uuid; v_high uuid; v_row public.apx_life_friendships%rowtype;
begin
  if v_user is null or not public.apx_user_can_play() then raise exception 'Sign in required.'; end if;
  select user_id into v_target from public.apx_player_profiles where character_id=p_character_id;
  if v_target is null or v_target=v_user then raise exception 'Invalid friend target.'; end if;
  v_low:=least(v_user,v_target); v_high:=greatest(v_user,v_target);
  select * into v_row from public.apx_life_friendships where user_low=v_low and user_high=v_high for update;
  if not found or (v_row.status='pending' and v_row.requested_by<>v_user) then raise exception 'No outgoing request or friendship exists.'; end if;
  delete from public.apx_life_friendships where user_low=v_low and user_high=v_high;
end; $$;

create or replace function public.apx_life_people(p_query text default '')
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare v_user uuid := (select auth.uid()); v_rows jsonb;
begin
  if v_user is null or not public.apx_user_can_play() then raise exception 'Sign in required.'; end if;
  select coalesce(jsonb_agg(row_data order by display_name),'[]'::jsonb) into v_rows from (
    select p.display_name,jsonb_build_object('character_id',p.character_id,'display_name',p.display_name,'avatar_url',p.avatar_url,
      'friend_status',f.status,'requested_by_me',coalesce(f.requested_by=v_user,false),
      'following',exists(select 1 from public.apx_life_follows follow where follow.follower_id=v_user and follow.followed_id=p.user_id)) as row_data
    from public.apx_player_profiles p
    left join public.apx_life_friendships f on f.user_low=least(v_user,p.user_id) and f.user_high=greatest(v_user,p.user_id)
    where p.user_id<>v_user and not p.is_banned and not public.apx_life_is_blocked(v_user,p.user_id)
      and (coalesce(p_query,'')='' or p.display_name ilike '%'||left(p_query,40)||'%')
    order by p.display_name limit 50
  ) matches;
  return v_rows;
end; $$;

create or replace function public.apx_life_social_assets()
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare v_user uuid := (select auth.uid()); v_options jsonb;
begin
  if v_user is null or not public.apx_user_can_play() then raise exception 'Sign in required.'; end if;
  select coalesce(jsonb_agg(option_data),'[]'::jsonb) into v_options from (
    select jsonb_build_object('kind','location','id',location_id,'name',name,'image',image) as option_data
    from public.apx_life_locations where is_active
    union all
    select jsonb_build_object('kind','property','id',owned.id,'name',catalog.name,'image',catalog.exterior_image)
    from public.apx_life_owned_properties owned join public.apx_life_property_catalog catalog using(property_id)
    join public.apx_life_profiles settings on settings.user_id=owned.owner_id
    where owned.owner_id=v_user and owned.is_primary and settings.share_primary_home and not settings.is_private
    union all
    select jsonb_build_object('kind','vehicle','id',owned.id,'name',catalog.name,'image',catalog.image)
    from public.apx_life_owned_vehicles owned join public.apx_life_vehicle_catalog catalog using(vehicle_id)
    join public.apx_life_profiles settings on settings.user_id=owned.owner_id
    where owned.owner_id=v_user and owned.is_active and settings.share_active_vehicle and not settings.is_private
  ) assets;
  return v_options;
end; $$;

create or replace function public.apx_life_create_post(p_body text,p_image_kind text default null,p_image_asset_id text default null)
returns jsonb language plpgsql security definer set search_path='' as $$
declare v_user uuid := (select auth.uid()); v_path text; v_post uuid;
begin
  if v_user is null or not public.apx_user_can_play() then raise exception 'Sign in required.'; end if;
  if p_body is null or char_length(btrim(p_body)) not between 1 and 500 or p_body ~ '<[^>]*>' then raise exception 'Post must be 1–500 plain-text characters.'; end if;
  insert into public.apx_life_profiles(user_id) values(v_user) on conflict do nothing;
  insert into public.apx_life_profiles(user_id) values(v_user) on conflict do nothing;
  perform 1 from public.apx_life_profiles where user_id=v_user for update;
  if (select count(*) from public.apx_life_posts where owner_id=v_user and created_at>now()-interval '1 minute')>=3 then raise exception 'Post rate limit reached.'; end if;
  if (select is_private from public.apx_life_profiles where user_id=v_user) then raise exception 'Private profiles cannot post to the public feed.'; end if;
  if p_image_kind is null and p_image_asset_id is null then v_path:=null;
  elsif p_image_kind='location' then
    select image into v_path from public.apx_life_locations where location_id=p_image_asset_id and is_active;
    if not found then raise exception 'Invalid location image.'; end if;
  elsif p_image_kind='property' then
    if not coalesce((select share_primary_home from public.apx_life_profiles where user_id=v_user),false) then raise exception 'Enable sharing your primary home first.'; end if;
    select catalog.exterior_image into v_path from public.apx_life_owned_properties owned join public.apx_life_property_catalog catalog using(property_id)
      where owned.id=p_image_asset_id::uuid and owned.owner_id=v_user and owned.is_primary;
    if not found then raise exception 'Select your primary home.'; end if;
  elsif p_image_kind='vehicle' then
    if not coalesce((select share_active_vehicle from public.apx_life_profiles where user_id=v_user),false) then raise exception 'Enable sharing your active vehicle first.'; end if;
    select catalog.image into v_path from public.apx_life_owned_vehicles owned join public.apx_life_vehicle_catalog catalog using(vehicle_id)
      where owned.id=p_image_asset_id::uuid and owned.owner_id=v_user and owned.is_active;
    if not found then raise exception 'Select your active vehicle.'; end if;
  else raise exception 'Unsupported image source.'; end if;
  insert into public.apx_life_posts(owner_id,body,image_kind,image_asset_id,image_path)
    values(v_user,btrim(p_body),p_image_kind,p_image_asset_id,v_path) returning id into v_post;
  return jsonb_build_object('id',v_post);
end; $$;

create or replace function public.apx_life_social_home(p_offset integer default 0)
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare v_user uuid := (select auth.uid()); v_posts jsonb; v_notifications jsonb; v_settings jsonb; v_unread integer;
begin
  if v_user is null or not public.apx_user_can_play() then raise exception 'Sign in required.'; end if;
  select coalesce(jsonb_agg(row_data order by created_at desc),'[]'::jsonb) into v_posts from (
    select post.created_at,jsonb_build_object('id',post.id,'owner_character_id',profile.character_id,
      'display_name',profile.display_name,'avatar_url',profile.avatar_url,'is_mine',post.owner_id=v_user,'body',post.body,
      'image_path',post.image_path,'created_at',post.created_at,
      'like_count',(select count(*) from public.apx_life_post_likes l where l.post_id=post.id),
      'liked',exists(select 1 from public.apx_life_post_likes l where l.post_id=post.id and l.owner_id=v_user),
      'comments',coalesce((select jsonb_agg(jsonb_build_object('display_name',cp.display_name,'body',c.body,'created_at',c.created_at) order by c.created_at)
        from (select * from public.apx_life_comments where post_id=post.id
          and not public.apx_life_is_blocked(owner_id,v_user) order by created_at desc limit 3) c
        join public.apx_player_profiles cp on cp.user_id=c.owner_id),'[]'::jsonb)) as row_data
    from public.apx_life_posts post join public.apx_player_profiles profile on profile.user_id=post.owner_id
    left join public.apx_life_profiles settings on settings.user_id=post.owner_id
    where not profile.is_banned and not public.apx_life_is_blocked(post.owner_id,v_user)
      and (post.owner_id=v_user or not coalesce(settings.is_private,false)
        or exists(select 1 from public.apx_life_friendships f where f.status='accepted'
          and f.user_low=least(post.owner_id,v_user) and f.user_high=greatest(post.owner_id,v_user)))
    order by post.created_at desc,post.id desc offset greatest(0,least(coalesce(p_offset,0),10000)) limit 20
  ) page;
  select coalesce(jsonb_agg(jsonb_build_object('id',n.id,'notification_type',n.notification_type,
    'actor_name',p.display_name,'post_id',n.post_id,'created_at',n.created_at,'read_at',n.read_at) order by n.created_at desc),'[]'::jsonb),
    count(*) filter (where n.read_at is null)::integer
  into v_notifications,v_unread from (select * from public.apx_life_notifications where owner_id=v_user order by created_at desc limit 30) n
  left join public.apx_player_profiles p on p.user_id=n.actor_id;
  select jsonb_build_object('bio',bio,'is_private',is_private,'allow_home_visits',allow_home_visits,
    'share_primary_home',share_primary_home,'share_active_vehicle',share_active_vehicle)
  into v_settings from public.apx_life_profiles where user_id=v_user;
  return jsonb_build_object('posts',v_posts,'notifications',v_notifications,'unread_notifications',coalesce(v_unread,0),'settings',v_settings);
end; $$;

create or replace function public.apx_life_delete_post(p_post_id uuid)
returns void language plpgsql security definer set search_path='' as $$
declare v_user uuid := (select auth.uid());
begin
  if v_user is null or not public.apx_user_can_play() then raise exception 'Sign in required.'; end if;
  delete from public.apx_life_posts where id=p_post_id and owner_id=v_user;
  if not found then raise exception 'Post is not yours or no longer exists.'; end if;
end; $$;

create or replace function public.apx_life_mark_notifications_read(p_ids bigint[])
returns integer language plpgsql security definer set search_path='' as $$
declare v_user uuid := (select auth.uid()); v_count integer;
begin
  if v_user is null or not public.apx_user_can_play() then raise exception 'Sign in required.'; end if;
  update public.apx_life_notifications set read_at=now()
  where owner_id=v_user and read_at is null and id=any(coalesce(p_ids,array[]::bigint[]));
  get diagnostics v_count=row_count;
  return v_count;
end; $$;

create or replace function public.apx_life_toggle_like(p_post_id uuid)
returns boolean language plpgsql security definer set search_path='' as $$
declare v_user uuid := (select auth.uid()); v_owner uuid; v_deleted integer;
begin
  if v_user is null or not public.apx_user_can_play() then raise exception 'Sign in required.'; end if;
  select owner_id into v_owner from public.apx_life_posts where id=p_post_id;
  if not found or not public.apx_life_can_view_post(p_post_id,v_user) then raise exception 'Post unavailable.'; end if;
  delete from public.apx_life_post_likes where post_id=p_post_id and owner_id=v_user;
  get diagnostics v_deleted=row_count;
  if v_deleted>0 then return false; end if;
  insert into public.apx_life_post_likes(post_id,owner_id) values(p_post_id,v_user) on conflict do nothing;
  if v_owner<>v_user then insert into public.apx_life_notifications(owner_id,actor_id,notification_type,post_id) values(v_owner,v_user,'like',p_post_id); end if;
  return true;
end; $$;

create or replace function public.apx_life_add_comment(p_post_id uuid,p_body text)
returns bigint language plpgsql security definer set search_path='' as $$
declare v_user uuid := (select auth.uid()); v_owner uuid; v_id bigint;
begin
  if v_user is null or not public.apx_user_can_play() then raise exception 'Sign in required.'; end if;
  if p_body is null or char_length(btrim(p_body)) not between 1 and 200 or p_body ~ '<[^>]*>' then raise exception 'Comment must be 1–200 plain-text characters.'; end if;
  select owner_id into v_owner from public.apx_life_posts where id=p_post_id;
  if not found or not public.apx_life_can_view_post(p_post_id,v_user) then raise exception 'Post unavailable.'; end if;
  perform 1 from public.apx_life_profiles where user_id=v_user for update;
  if (select count(*) from public.apx_life_comments where owner_id=v_user and created_at>now()-interval '1 minute')>=5 then raise exception 'Comment rate limit reached.'; end if;
  insert into public.apx_life_comments(post_id,owner_id,body) values(p_post_id,v_user,btrim(p_body)) returning id into v_id;
  if v_owner<>v_user then insert into public.apx_life_notifications(owner_id,actor_id,notification_type,post_id) values(v_owner,v_user,'comment',p_post_id); end if;
  return v_id;
end; $$;

create or replace function public.apx_life_friend_home()
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare v_user uuid := (select auth.uid()); v_friends jsonb; v_incoming jsonb; v_outgoing jsonb;
begin
  if v_user is null or not public.apx_user_can_play() then raise exception 'Sign in required.'; end if;
  select coalesce(jsonb_agg(jsonb_build_object('character_id',p.character_id,'display_name',p.display_name,'avatar_url',p.avatar_url)),'[]'::jsonb) into v_friends
  from public.apx_life_friendships f join public.apx_player_profiles p on p.user_id=case when f.user_low=v_user then f.user_high else f.user_low end
  where f.status='accepted' and (f.user_low=v_user or f.user_high=v_user) and not public.apx_life_is_blocked(v_user,p.user_id);
  select coalesce(jsonb_agg(jsonb_build_object('character_id',p.character_id,'display_name',p.display_name,'avatar_url',p.avatar_url)),'[]'::jsonb) into v_incoming
  from public.apx_life_friendships f join public.apx_player_profiles p on p.user_id=f.requested_by
  where f.status='pending' and f.requested_by<>v_user and (f.user_low=v_user or f.user_high=v_user);
  select coalesce(jsonb_agg(jsonb_build_object('character_id',p.character_id,'display_name',p.display_name,'avatar_url',p.avatar_url)),'[]'::jsonb) into v_outgoing
  from public.apx_life_friendships f join public.apx_player_profiles p on p.user_id=case when f.user_low=v_user then f.user_high else f.user_low end
  where f.status='pending' and f.requested_by=v_user;
  return jsonb_build_object('friends',v_friends,'incoming',v_incoming,'outgoing',v_outgoing);
end; $$;

create or replace function public.apx_life_social_profile(p_character_id uuid)
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare v_user uuid := (select auth.uid()); v_profile public.apx_player_profiles%rowtype; v_settings public.apx_life_profiles%rowtype; v_friend boolean; v_home jsonb; v_vehicle jsonb;
begin
  if v_user is null or not public.apx_user_can_play() then raise exception 'Sign in required.'; end if;
  select * into v_profile from public.apx_player_profiles where character_id=p_character_id and not is_banned;
  if not found or public.apx_life_is_blocked(v_user,v_profile.user_id) then raise exception 'Profile unavailable.'; end if;
  select * into v_settings from public.apx_life_profiles where user_id=v_profile.user_id;
  select exists(select 1 from public.apx_life_friendships where status='accepted'
    and user_low=least(v_user,v_profile.user_id) and user_high=greatest(v_user,v_profile.user_id)) into v_friend;
  if coalesce(v_settings.is_private,false) and v_user<>v_profile.user_id and not v_friend then
    return jsonb_build_object('display_name',v_profile.display_name,'avatar_url',v_profile.avatar_url,'is_private',true,'is_friend',false);
  end if;
  if not coalesce(v_settings.is_private,false) and coalesce(v_settings.share_primary_home,false) then
    select jsonb_build_object('name',catalog.name,'description',catalog.description,'image',catalog.exterior_image)
    into v_home from public.apx_life_owned_properties owned join public.apx_life_property_catalog catalog using(property_id)
    where owned.owner_id=v_profile.user_id and owned.is_primary;
  end if;
  if not coalesce(v_settings.is_private,false) and coalesce(v_settings.share_active_vehicle,false) then
    select jsonb_build_object('name',catalog.name,'vehicle_type',catalog.vehicle_type,'image',catalog.image)
    into v_vehicle from public.apx_life_owned_vehicles owned join public.apx_life_vehicle_catalog catalog using(vehicle_id)
    where owned.owner_id=v_profile.user_id and owned.is_active;
  end if;
  return jsonb_build_object('display_name',v_profile.display_name,'avatar_url',v_profile.avatar_url,
    'bio',coalesce(v_settings.bio,''),'is_private',coalesce(v_settings.is_private,false),'is_friend',v_friend,
    'allow_home_visits',coalesce(v_settings.allow_home_visits,false),'home',v_home,'vehicle',v_vehicle,
    'following',exists(select 1 from public.apx_life_follows where follower_id=v_user and followed_id=v_profile.user_id),
    'friend_status',(select status from public.apx_life_friendships where user_low=least(v_user,v_profile.user_id) and user_high=greatest(v_user,v_profile.user_id)));
end; $$;

create or replace function public.apx_life_report_player(p_character_id uuid,p_description text)
returns void language plpgsql security definer set search_path='' as $$
declare v_user uuid := (select auth.uid()); v_target uuid;
begin
  if v_user is null or not public.apx_user_can_play() then raise exception 'Sign in required.'; end if;
  select user_id into v_target from public.apx_player_profiles where character_id=p_character_id;
  if v_target is null or v_target=v_user or p_description is null or char_length(btrim(p_description)) not between 10 and 2000 or p_description ~ '<[^>]*>' then raise exception 'Invalid report.'; end if;
  insert into public.apx_player_reports(reporter_id,target_user_id,category,description) values(v_user,v_target,'other','[APX LIFE] '||btrim(p_description));
end; $$;

create or replace function public.apx_life_public_properties(p_character_id uuid)
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare v_user uuid := (select auth.uid()); v_owner uuid; v_private boolean; v_share boolean; v_result jsonb;
begin
  if v_user is null or not public.apx_user_can_play() then raise exception 'Sign in required.'; end if;
  select user_id into v_owner from public.apx_player_profiles where character_id=p_character_id and not is_banned;
  if v_owner is null or public.apx_life_is_blocked(v_user,v_owner) then raise exception 'Profile unavailable.'; end if;
  select is_private,share_primary_home into v_private,v_share from public.apx_life_profiles where user_id=v_owner;
  if v_owner<>v_user and (coalesce(v_private,false) or not coalesce(v_share,false)) then return '[]'::jsonb; end if;
  select coalesce(jsonb_agg(jsonb_build_object('property_id',owned.property_id,'name',catalog.name,'description',catalog.description,
    'rarity',catalog.rarity,'exterior_image',catalog.exterior_image,'is_primary',owned.is_primary)),'[]'::jsonb) into v_result
  from public.apx_life_owned_properties owned join public.apx_life_property_catalog catalog using(property_id)
  where owned.owner_id=v_owner and (owned.is_primary or v_owner=v_user);
  return v_result;
end; $$;

revoke all on function public.apx_life_is_blocked(uuid,uuid) from public,anon,authenticated;
revoke all on function public.apx_life_can_view_post(uuid,uuid) from public,anon,authenticated;
revoke all on function public.apx_life_update_profile(text,boolean,boolean,boolean,boolean),
  public.apx_life_friend_request(uuid),public.apx_life_friend_respond(uuid,boolean),
  public.apx_life_block_player(uuid,boolean),public.apx_life_follow(uuid,boolean),public.apx_life_friend_cancel(uuid),
  public.apx_life_create_post(text,text,text),public.apx_life_social_home(integer),
  public.apx_life_delete_post(uuid),public.apx_life_mark_notifications_read(bigint[]),
  public.apx_life_toggle_like(uuid),public.apx_life_add_comment(uuid,text),
  public.apx_life_friend_home(),public.apx_life_people(text),public.apx_life_social_assets(),public.apx_life_social_profile(uuid),
  public.apx_life_report_player(uuid,text),public.apx_life_public_properties(uuid) from public,anon;
grant execute on function public.apx_life_update_profile(text,boolean,boolean,boolean,boolean),
  public.apx_life_friend_request(uuid),public.apx_life_friend_respond(uuid,boolean),
  public.apx_life_block_player(uuid,boolean),public.apx_life_follow(uuid,boolean),public.apx_life_friend_cancel(uuid),
  public.apx_life_create_post(text,text,text),public.apx_life_social_home(integer),
  public.apx_life_delete_post(uuid),public.apx_life_mark_notifications_read(bigint[]),
  public.apx_life_toggle_like(uuid),public.apx_life_add_comment(uuid,text),
  public.apx_life_friend_home(),public.apx_life_people(text),public.apx_life_social_assets(),public.apx_life_social_profile(uuid),
  public.apx_life_report_player(uuid,text),public.apx_life_public_properties(uuid) to authenticated;

commit;
-- APX public profiles + persistent chat, using existing profile/save tables.
-- The old last_seen_at column remains untouched for compatibility but is no
-- longer updated, read, or exposed by the community API.
begin;

do $$
begin
  if to_regclass('public.apx_player_profiles') is null
     or to_regclass('public.apx_game_saves') is null then
    raise exception 'APX profile/save tables are missing; inspect the current database before applying this migration.';
  end if;
  if to_regprocedure('public.apx_community_players(text,integer)') is null then
    raise exception 'The expected APX community RPC is missing; inspect the current database before applying this migration.';
  end if;
  if to_regclass('public.apx_global_chat_messages') is not null
     or to_regclass('public.apx_direct_messages') is not null
     or to_regprocedure('public.apx_public_player_profile(uuid)') is not null
     or to_regprocedure('public.apx_global_chat_read(integer)') is not null
     or to_regprocedure('public.apx_global_chat_send(text)') is not null
     or to_regprocedure('public.apx_direct_message_threads(integer)') is not null
     or to_regprocedure('public.apx_direct_messages(uuid,integer)') is not null
     or to_regprocedure('public.apx_send_direct_message(uuid,text)') is not null then
    raise exception 'An APX chat/profile object already exists; inspect it before applying this migration.';
  end if;
end;
$$;

create table public.apx_global_chat_messages (
  id bigint generated always as identity primary key,
  sender_id uuid not null references auth.users(id) on delete cascade,
  body text not null check (char_length(btrim(body)) between 1 and 500),
  created_at timestamptz not null default now()
);
create index apx_global_chat_created_idx on public.apx_global_chat_messages(created_at desc);

create table public.apx_direct_messages (
  id bigint generated always as identity primary key,
  sender_id uuid not null references auth.users(id) on delete cascade,
  recipient_id uuid not null references auth.users(id) on delete cascade,
  body text not null check (char_length(btrim(body)) between 1 and 500),
  created_at timestamptz not null default now(),
  constraint apx_direct_messages_no_self check (sender_id <> recipient_id)
);
create index apx_direct_messages_thread_idx on public.apx_direct_messages(sender_id, recipient_id, created_at desc);
create index apx_direct_messages_recipient_idx on public.apx_direct_messages(recipient_id, sender_id, created_at desc);

alter table public.apx_global_chat_messages enable row level security;
alter table public.apx_direct_messages enable row level security;
revoke all on public.apx_global_chat_messages, public.apx_direct_messages from public, anon, authenticated;
revoke update (last_seen_at) on public.apx_player_profiles from anon, authenticated;

-- Recreate the ranking RPC without presence/last-seen output.
drop function public.apx_community_players(text, integer);
create function public.apx_community_players(p_mode text default 'players', p_limit integer default 100)
returns table (
  rank_position bigint,
  character_id uuid,
  display_name text,
  avatar_url text,
  company_name text,
  personal_cash numeric,
  business_cash numeric
)
language sql stable security definer set search_path = '' as $$
  with source as (
    select p.character_id, p.display_name, p.avatar_url,
      coalesce(s.game_state, '{}'::jsonb) as game_state,
      case when coalesce(s.game_state ->> 'cash', '') ~ '^[0-9]{1,18}(\.[0-9]{1,2})?$'
        then (s.game_state ->> 'cash')::numeric else 0::numeric end as personal_cash,
      case when coalesce(s.game_state ->> 'treasury', '') ~ '^[0-9]{1,18}(\.[0-9]{1,2})?$'
        then (s.game_state ->> 'treasury')::numeric else 0::numeric end as treasury_cash,
      case when jsonb_typeof(s.game_state -> 'companyOperations' -> 'companies') = 'object' then
        coalesce((select sum(case when coalesce(company.v ->> 'cash', '') ~ '^[0-9]{1,18}(\.[0-9]{1,2})?$'
          then (company.v ->> 'cash')::numeric else 0::numeric end)
          from jsonb_each(s.game_state -> 'companyOperations' -> 'companies') as company(k, v)), 0::numeric)
        else 0::numeric end as company_cash,
      case when jsonb_typeof(s.game_state -> 'companyOperations' -> 'companies') = 'object' then
        case when exists(select 1 from jsonb_object_keys(s.game_state -> 'companyOperations' -> 'companies')) then
          coalesce((select nullif(btrim(company.v ->> 'name'), '')
            from jsonb_each(s.game_state -> 'companyOperations' -> 'companies') as company(k, v)
            order by k limit 1), 'Doanh nghiệp APX')
          else coalesce(nullif(btrim(s.game_state -> 'companyIdentity' ->> 'name'), ''), 'Chưa thành lập') end
        else coalesce(nullif(btrim(s.game_state -> 'companyIdentity' ->> 'name'), ''), 'Chưa thành lập') end as company_name
    from public.apx_player_profiles p
    left join public.apx_game_saves s on s.user_id = p.user_id
    where not p.is_banned and (select auth.uid()) is not null
      and public.apx_user_can_play() and p_mode in ('players','personal','company')
      and (p_mode <> 'players' or p.user_id <> (select auth.uid()))
  ), ranked as (
    select row_number() over (order by
      case when p_mode = 'personal' then personal_cash when p_mode = 'company' then treasury_cash + company_cash else 0 end desc,
      character_id) as rank_position,
      character_id, display_name, avatar_url, company_name,
      personal_cash, treasury_cash + company_cash as business_cash
    from source
  )
  select * from ranked order by rank_position
  limit greatest(1, least(coalesce(p_limit, 100), 100));
$$;
revoke all on function public.apx_community_players(text, integer) from public, anon;
grant execute on function public.apx_community_players(text, integer) to authenticated;

create function public.apx_public_player_profile(p_character_id uuid)
returns table (
  character_id uuid, display_name text, avatar_url text, company_name text,
  personal_cash numeric, business_cash numeric, company_count integer, employee_count integer
)
language sql stable security definer set search_path = '' as $$
  select p.character_id, p.display_name, p.avatar_url,
    case when jsonb_typeof(s.game_state -> 'companyOperations' -> 'companies') = 'object' then
      case when exists(select 1 from jsonb_object_keys(s.game_state -> 'companyOperations' -> 'companies')) then
        coalesce((select nullif(btrim(company.v ->> 'name'), '') from jsonb_each(s.game_state -> 'companyOperations' -> 'companies') as company(k, v) order by k limit 1), 'Doanh nghiệp APX')
        else coalesce(nullif(btrim(s.game_state -> 'companyIdentity' ->> 'name'), ''), 'Chưa thành lập') end
      else coalesce(nullif(btrim(s.game_state -> 'companyIdentity' ->> 'name'), ''), 'Chưa thành lập') end,
    case when coalesce(s.game_state ->> 'cash', '') ~ '^[0-9]{1,18}(\.[0-9]{1,2})?$' then (s.game_state ->> 'cash')::numeric else 0::numeric end,
    (case when coalesce(s.game_state ->> 'treasury', '') ~ '^[0-9]{1,18}(\.[0-9]{1,2})?$' then (s.game_state ->> 'treasury')::numeric else 0::numeric end) +
      case when jsonb_typeof(s.game_state -> 'companyOperations' -> 'companies') = 'object' then coalesce((select sum(case when coalesce(company.v ->> 'cash', '') ~ '^[0-9]{1,18}(\.[0-9]{1,2})?$' then (company.v ->> 'cash')::numeric else 0::numeric end) from jsonb_each(s.game_state -> 'companyOperations' -> 'companies') as company(k, v)), 0::numeric) else 0::numeric end,
    case when jsonb_typeof(s.game_state -> 'companyOperations' -> 'companies') = 'object' then (select count(*)::integer from jsonb_object_keys(s.game_state -> 'companyOperations' -> 'companies')) else 0 end,
    case when jsonb_typeof(s.game_state -> 'hired') = 'array' then jsonb_array_length(s.game_state -> 'hired') else 0 end
  from public.apx_player_profiles p
  left join public.apx_game_saves s on s.user_id = p.user_id
  where p.character_id = p_character_id and not p.is_banned
    and (select auth.uid()) is not null and public.apx_user_can_play();
$$;

create function public.apx_global_chat_read(p_limit integer default 50)
returns table (message_id bigint, character_id uuid, display_name text, avatar_url text, body text, created_at timestamptz)
language plpgsql stable security definer set search_path = '' as $$
begin
  if (select auth.uid()) is null or not public.apx_user_can_play() then raise exception 'Sign-in required.'; end if;
  return query
    select m.id, p.character_id, p.display_name, p.avatar_url, m.body, m.created_at
    from (select * from public.apx_global_chat_messages order by created_at desc, id desc limit greatest(1, least(coalesce(p_limit, 50), 50))) m
    join public.apx_player_profiles p on p.user_id = m.sender_id
    where not p.is_banned order by m.created_at, m.id;
end;
$$;
create function public.apx_global_chat_send(p_body text)
returns void language plpgsql security definer set search_path = '' as $$
declare v_body text := btrim(coalesce(p_body, ''));
begin
  if (select auth.uid()) is null or not public.apx_user_can_play() then raise exception 'Sign-in required.'; end if;
  if char_length(v_body) < 1 or char_length(v_body) > 500 then raise exception 'Message must be 1 to 500 characters.'; end if;
  insert into public.apx_global_chat_messages(sender_id, body) values ((select auth.uid()), v_body);
end;
$$;

create function public.apx_direct_message_threads(p_limit integer default 50)
returns table (character_id uuid, display_name text, avatar_url text, last_message text, last_message_at timestamptz)
language plpgsql stable security definer set search_path = '' as $$
begin
  if (select auth.uid()) is null or not public.apx_user_can_play() then raise exception 'Sign-in required.'; end if;
  return query
    with thread_rows as (
      select case when m.sender_id = (select auth.uid()) then m.recipient_id else m.sender_id end as other_id,
        m.body, m.created_at, row_number() over (partition by case when m.sender_id = (select auth.uid()) then m.recipient_id else m.sender_id end order by m.created_at desc, m.id desc) as row_num
      from public.apx_direct_messages m
      where m.sender_id = (select auth.uid()) or m.recipient_id = (select auth.uid())
    )
    select p.character_id, p.display_name, p.avatar_url, t.body, t.created_at
    from thread_rows t join public.apx_player_profiles p on p.user_id = t.other_id
    where t.row_num = 1 and not p.is_banned
    order by t.created_at desc limit greatest(1, least(coalesce(p_limit, 50), 50));
end;
$$;
create function public.apx_direct_messages(p_character_id uuid, p_limit integer default 50)
returns table (character_id uuid, display_name text, avatar_url text, body text, created_at timestamptz, is_mine boolean)
language plpgsql stable security definer set search_path = '' as $$
declare v_peer uuid;
begin
  if (select auth.uid()) is null or not public.apx_user_can_play() then raise exception 'Sign-in required.'; end if;
  select user_id into v_peer from public.apx_player_profiles where character_id = p_character_id and not is_banned;
  if v_peer is null or v_peer = (select auth.uid()) then raise exception 'Invalid conversation.'; end if;
  return query
    select p.character_id, p.display_name, p.avatar_url, m.body, m.created_at, m.sender_id = (select auth.uid())
    from (select * from public.apx_direct_messages
      where (sender_id = (select auth.uid()) and recipient_id = v_peer) or (sender_id = v_peer and recipient_id = (select auth.uid()))
      order by created_at desc, id desc limit greatest(1, least(coalesce(p_limit, 50), 50))) m
    join public.apx_player_profiles p on p.user_id = m.sender_id
    order by m.created_at, m.id;
end;
$$;
create function public.apx_send_direct_message(p_character_id uuid, p_body text)
returns void language plpgsql security definer set search_path = '' as $$
declare v_peer uuid; v_body text := btrim(coalesce(p_body, ''));
begin
  if (select auth.uid()) is null or not public.apx_user_can_play() then raise exception 'Sign-in required.'; end if;
  if char_length(v_body) < 1 or char_length(v_body) > 500 then raise exception 'Message must be 1 to 500 characters.'; end if;
  select user_id into v_peer from public.apx_player_profiles where character_id = p_character_id and not is_banned;
  if v_peer is null or v_peer = (select auth.uid()) then raise exception 'Invalid recipient.'; end if;
  insert into public.apx_direct_messages(sender_id, recipient_id, body) values ((select auth.uid()), v_peer, v_body);
end;
$$;

revoke all on function public.apx_public_player_profile(uuid), public.apx_global_chat_read(integer), public.apx_global_chat_send(text), public.apx_direct_message_threads(integer), public.apx_direct_messages(uuid, integer), public.apx_send_direct_message(uuid, text) from public, anon;
grant execute on function public.apx_public_player_profile(uuid), public.apx_global_chat_read(integer), public.apx_global_chat_send(text), public.apx_direct_message_threads(integer), public.apx_direct_messages(uuid, integer), public.apx_send_direct_message(uuid, text) to authenticated;

commit;

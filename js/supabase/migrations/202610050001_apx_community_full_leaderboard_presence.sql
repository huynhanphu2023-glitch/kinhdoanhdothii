-- Return the full community leaderboard and allow authenticated players to
-- update their own online heartbeat without direct profile-table privileges.
begin;

do $$
begin
  if to_regclass('public.apx_player_profiles') is null
     or to_regclass('public.apx_game_saves') is null
     or to_regprocedure('public.apx_community_players(text,integer)') is null then
    raise exception 'APX community schema is missing; inspect the current database before applying this migration.';
  end if;
end;
$$;

create or replace function public.apx_mark_player_online()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  player_id uuid := (select auth.uid());
  updated_rows integer;
begin
  if player_id is null then
    raise exception 'Authentication is required to update online status.';
  end if;

  update public.apx_player_profiles
  set last_seen_at = now()
  where user_id = player_id and not is_banned;

  get diagnostics updated_rows = row_count;
  if updated_rows <> 1 then
    raise exception 'The active player profile could not be updated.';
  end if;
end;
$$;

revoke all on function public.apx_mark_player_online() from public, anon;
grant execute on function public.apx_mark_player_online() to authenticated;

drop function public.apx_community_players(text, integer);
create function public.apx_community_players(p_mode text default 'players', p_limit integer default 1000)
returns table (
  rank_position bigint,
  character_id uuid,
  display_name text,
  avatar_url text,
  company_name text,
  personal_cash numeric,
  business_cash numeric,
  last_seen_at timestamptz,
  is_online boolean
)
language sql
stable
security definer
set search_path = ''
as $$
  with source as (
    select
      p.character_id,
      p.display_name,
      p.avatar_url,
      p.last_seen_at,
      coalesce(s.game_state, '{}'::jsonb) as game_state,
      case
        when coalesce(s.game_state ->> 'cash', '') ~ '^[0-9]{1,18}(\.[0-9]{1,2})?$'
          then (s.game_state ->> 'cash')::numeric
        else 0::numeric
      end as personal_cash,
      case
        when coalesce(s.game_state ->> 'treasury', '') ~ '^[0-9]{1,18}(\.[0-9]{1,2})?$'
          then (s.game_state ->> 'treasury')::numeric
        else 0::numeric
      end as treasury_cash,
      case
        when jsonb_typeof(s.game_state -> 'companyOperations' -> 'companies') = 'object' then
          coalesce((
            select sum(
              case
                when coalesce(company.v ->> 'cash', '') ~ '^[0-9]{1,18}(\.[0-9]{1,2})?$'
                  then (company.v ->> 'cash')::numeric
                else 0::numeric
              end
            )
            from jsonb_each(s.game_state -> 'companyOperations' -> 'companies') as company(k, v)
          ), 0::numeric)
        else 0::numeric
      end as company_cash,
      case
        when jsonb_typeof(s.game_state -> 'companyOperations' -> 'companies') = 'object' then
          case
            when exists(select 1 from jsonb_object_keys(s.game_state -> 'companyOperations' -> 'companies')) then
              coalesce((
                select nullif(btrim(company.v ->> 'name'), '')
                from jsonb_each(s.game_state -> 'companyOperations' -> 'companies') as company(k, v)
                order by k
                limit 1
              ), 'Doanh nghiệp APX')
            else coalesce(nullif(btrim(s.game_state -> 'companyIdentity' ->> 'name'), ''), 'Chưa thành lập')
          end
        else coalesce(nullif(btrim(s.game_state -> 'companyIdentity' ->> 'name'), ''), 'Chưa thành lập')
      end as company_name
    from public.apx_player_profiles as p
    left join public.apx_game_saves as s on s.user_id = p.user_id
    where not p.is_banned
      and (select auth.uid()) is not null
      and public.apx_user_can_play()
      and p_mode in ('players', 'personal', 'company')
      and (p_mode <> 'players' or p.user_id <> (select auth.uid()))
  ),
  values_by_player as (
    select
      source.*,
      treasury_cash + company_cash as business_cash,
      coalesce(last_seen_at > now() - interval '90 seconds', false) as is_online
    from source
  ),
  ranked as (
    select
      row_number() over (
        order by
          case when p_mode = 'personal' then personal_cash when p_mode = 'company' then business_cash else 0 end desc,
          character_id
      ) as rank_position,
      character_id,
      display_name,
      avatar_url,
      company_name,
      personal_cash,
      business_cash,
      last_seen_at,
      is_online
    from values_by_player
  )
  select *
  from ranked
  order by rank_position
  limit greatest(1, least(coalesce(p_limit, 1000), 1000));
$$;

revoke all on function public.apx_community_players(text, integer) from public, anon;
grant execute on function public.apx_community_players(text, integer) to authenticated;

commit;

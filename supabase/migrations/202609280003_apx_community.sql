-- Public community directory and cash rankings based on existing APX profiles/saves.
-- No new user data tables are created; private emails and auth IDs are never returned.
begin;

do $$
begin
  if to_regclass('public.apx_player_profiles') is null
     or to_regclass('public.apx_game_saves') is null then
    raise exception 'APX profile/save tables are missing; inspect the current schema before applying this migration.';
  end if;
  if to_regprocedure('public.apx_community_players(text,integer)') is not null then
    raise exception 'APX community RPC already exists; inspect before applying this migration.';
  end if;
end;
$$;

create function public.apx_community_players(p_mode text default 'players', p_limit integer default 100)
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
      p.user_id,
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
      end as subsidiary_cash,
      coalesce(nullif(btrim(s.game_state -> 'companyIdentity' ->> 'name'), ''), 'APX Group') as company_name
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
      treasury_cash + subsidiary_cash as business_cash,
      coalesce(last_seen_at > now() - interval '90 seconds', false) as is_online
    from source
  ),
  ranked as (
    select
      row_number() over (
        order by
          case when p_mode = 'personal' then personal_cash when p_mode = 'company' then business_cash else 0 end desc,
          last_seen_at desc nulls last,
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
  select ranked.rank_position, ranked.character_id, ranked.display_name,
         ranked.avatar_url, ranked.company_name, ranked.personal_cash,
         ranked.business_cash, ranked.last_seen_at, ranked.is_online
  from ranked
  order by ranked.rank_position
  limit greatest(1, least(coalesce(p_limit, 100), 100));
$$;

revoke all on function public.apx_community_players(text, integer) from public, anon;
grant execute on function public.apx_community_players(text, integer) to authenticated;

commit;

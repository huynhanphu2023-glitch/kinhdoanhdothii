begin;

do $$
begin
  if to_regclass('public.apx_player_profiles') is null
     or to_regclass('public.apx_game_saves') is null
     or to_regprocedure('public.apx_public_player_profile(uuid)') is null then
    raise exception 'Apply the APX community profile migration before adding public profile details.';
  end if;
end;
$$;

create or replace function public.apx_public_player_profile_details(p_character_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_user uuid;
  v_character_id uuid;
  v_name text;
  v_avatar text;
  v_joined_at timestamptz;
  v_state jsonb;
  v_companies jsonb := '[]'::jsonb;
  v_achievements jsonb := '[]'::jsonb;
  v_company_count integer := 0;
  v_employee_count integer := 0;
  v_total_revenue numeric := 0;
  v_assets numeric := 0;
  v_personal_assets numeric := 0;
  v_transaction_count bigint := 0;
  v_products_sold numeric := 0;
  v_market_transactions bigint := 0;
  v_investment_transactions bigint := 0;
  v_company_rank bigint;
  v_business_cash numeric := 0;
  v_level integer;
  v_game_day integer;
begin
  if (select auth.uid()) is null or not public.apx_user_can_play() then
    raise exception 'Đăng nhập để xem hồ sơ cộng đồng.';
  end if;

  select p.user_id, p.character_id, p.display_name, p.avatar_url, p.created_at, coalesce(s.game_state, '{}'::jsonb)
  into v_user, v_character_id, v_name, v_avatar, v_joined_at, v_state
  from public.apx_player_profiles p
  left join public.apx_game_saves s on s.user_id = p.user_id
  where p.character_id = p_character_id and not p.is_banned;
  if v_user is null then raise exception 'Không tìm thấy hồ sơ người chơi.'; end if;

  v_level := case
    when coalesce(v_state #>> '{character,level,current}', '') ~ '^[0-9]{1,4}$'
      then (v_state #>> '{character,level,current}')::integer
    else null
  end;
  v_game_day := case
    when coalesce(v_state ->> 'day', '') ~ '^[0-9]{1,9}$' then (v_state ->> 'day')::integer
    else null
  end;

  select coalesce(jsonb_agg(jsonb_build_object(
    'id', c.key,
    'name', coalesce(nullif(btrim(c.value ->> 'name'), ''), 'Doanh nghiệp APX'),
    'field', coalesce(nullif(btrim(c.value ->> 'field'), ''), c.value ->> 'industryId', 'Doanh nghiệp'),
    'industry_id', c.value ->> 'industryId',
    'level', case when coalesce(c.value ->> 'level', '') ~ '^[0-9]{1,3}$' then (c.value ->> 'level')::integer else null end,
    'employee_count',
      (case when coalesce(c.value ->> 'seedStaff', '') ~ '^[0-9]{1,5}$' then (c.value ->> 'seedStaff')::integer else 0 end)
      + case when jsonb_typeof(c.value -> 'employeeAssignments') = 'array' then jsonb_array_length(c.value -> 'employeeAssignments') else 0 end,
    'value',
      coalesce((select sum(case when coalesce(a.value ->> 'value', '') ~ '^[0-9]{1,18}(\.[0-9]{1,2})?$' then (a.value ->> 'value')::numeric else 0 end)
        from jsonb_array_elements(case when jsonb_typeof(c.value -> 'assets') = 'array' then c.value -> 'assets' else '[]'::jsonb end) a(value)), 0)
      + coalesce((select sum(case when b.value ->> 'status' = 'Đang hoạt động' and coalesce(b.value ->> 'value', '') ~ '^[0-9]{1,18}(\.[0-9]{1,2})?$' then (b.value ->> 'value')::numeric else 0 end)
        from jsonb_array_elements(case when jsonb_typeof(c.value -> 'branches') = 'array' then c.value -> 'branches' else '[]'::jsonb end) b(value)), 0)
      + case when coalesce(c.value #>> '{inventory,value}', '') ~ '^[0-9]{1,18}(\.[0-9]{1,2})?$' then (c.value #>> '{inventory,value}')::numeric else 0 end
      + coalesce((select sum(case when coalesce(p.value ->> 'cost', '') ~ '^[0-9]{1,18}(\.[0-9]{1,2})?$' then (p.value ->> 'cost')::numeric else 0 end)
        from jsonb_array_elements(case when jsonb_typeof(v_state -> 'projects') = 'array' then v_state -> 'projects' else '[]'::jsonb end) p(value)
        where p.value ->> 'companyId' = c.key and p.value ->> 'status' in ('Đang xây', 'Đang hoạt động')), 0),
    'revenue', case when coalesce(c.value ->> 'totalRevenue', '') ~ '^[0-9]{1,18}(\.[0-9]{1,2})?$' then (c.value ->> 'totalRevenue')::numeric else 0 end,
    'profit', case when coalesce(c.value ->> 'totalProfit', '') ~ '^-?[0-9]{1,18}(\.[0-9]{1,2})?$' then (c.value ->> 'totalProfit')::numeric else 0 end,
    'business_cash', case when coalesce(c.value ->> 'cash', '') ~ '^[0-9]{1,18}(\.[0-9]{1,2})?$' then (c.value ->> 'cash')::numeric else 0 end
  ) order by c.key), '[]'::jsonb)
  into v_companies
  from jsonb_each(case
    when jsonb_typeof(v_state #> '{companyOperations,companies}') = 'object' then v_state #> '{companyOperations,companies}'
    else '{}'::jsonb
  end) c(key, value);

  v_company_count := jsonb_array_length(v_companies);
    select coalesce(sum((items.value ->> 'employee_count')::integer), 0),
      coalesce(sum((items.value ->> 'revenue')::numeric), 0),
      coalesce(sum((items.value ->> 'value')::numeric), 0)
  into v_employee_count, v_total_revenue, v_assets
  from jsonb_array_elements(v_companies) as items(value);

  select coalesce(sum(case when coalesce(a.value ->> 'currentValue', '') ~ '^[0-9]{1,18}(\.[0-9]{1,2})?$' then (a.value ->> 'currentValue')::numeric else 0 end), 0)
  into v_personal_assets
  from jsonb_array_elements(case when jsonb_typeof(v_state #> '{character,assets}') = 'array' then v_state #> '{character,assets}' else '[]'::jsonb end) a(value);
  v_assets := v_assets + v_personal_assets;
  select v_assets + coalesce(sum(case when coalesce(p.value ->> 'currentValue', '') ~ '^[0-9]{1,18}(\.[0-9]{1,2})?$' then (p.value ->> 'currentValue')::numeric else 0 end), 0)
  into v_assets
  from jsonb_each(case when jsonb_typeof(v_state #> '{character,propertyRecords}') = 'object' then v_state #> '{character,propertyRecords}' else '{}'::jsonb end) p(key, value);

  select coalesce(jsonb_agg(a.key order by a.key), '[]'::jsonb)
  into v_achievements
  from jsonb_each(case when jsonb_typeof(v_state #> '{character,achievements}') = 'object' then v_state #> '{character,achievements}' else '{}'::jsonb end) a(key, value)
  where coalesce(a.value ->> 'completed', 'false') = 'true';

  v_transaction_count := case
    when jsonb_typeof(v_state #> '{character,transactions}') = 'array' then jsonb_array_length(v_state #> '{character,transactions}')
    else 0
  end;

  if to_regclass('public.apx_market_transactions') is not null then
    execute 'select count(*) from public.apx_market_transactions where seller_id = $1 or buyer_id = $1' into v_market_transactions using v_user;
    execute 'select coalesce(sum(quantity), 0) from public.apx_market_transactions where seller_id = $1 and status = ''completed''' into v_products_sold using v_user;
  end if;
  if to_regclass('public.apx_investment_transactions') is not null then
    execute 'select count(*) from public.apx_investment_transactions where user_id = $1' into v_investment_transactions using v_user;
  end if;
  v_transaction_count := v_transaction_count + v_market_transactions + v_investment_transactions;

  if v_company_count > 0 then
    v_business_cash :=
      case when coalesce(v_state ->> 'treasury', '') ~ '^[0-9]{1,18}(\.[0-9]{1,2})?$' then (v_state ->> 'treasury')::numeric else 0 end
      + coalesce((select sum(case when coalesce(c.value ->> 'cash', '') ~ '^[0-9]{1,18}(\.[0-9]{1,2})?$' then (c.value ->> 'cash')::numeric else 0 end)
        from jsonb_each(case when jsonb_typeof(v_state #> '{companyOperations,companies}') = 'object' then v_state #> '{companyOperations,companies}' else '{}'::jsonb end) c(key, value)), 0);

    with player_business_cash as (
      select p.character_id,
        case when coalesce(s.game_state ->> 'treasury', '') ~ '^[0-9]{1,18}(\.[0-9]{1,2})?$' then (s.game_state ->> 'treasury')::numeric else 0 end
        + case when jsonb_typeof(s.game_state #> '{companyOperations,companies}') = 'object' then
            coalesce((select sum(case when coalesce(c.value ->> 'cash', '') ~ '^[0-9]{1,18}(\.[0-9]{1,2})?$' then (c.value ->> 'cash')::numeric else 0 end)
              from jsonb_each(s.game_state #> '{companyOperations,companies}') c(key, value)), 0)
          else 0 end as business_cash
      from public.apx_player_profiles p
      left join public.apx_game_saves s on s.user_id = p.user_id
      where not p.is_banned
    )
    select count(*) + 1 into v_company_rank
    from player_business_cash p
    where p.business_cash > v_business_cash
       or (p.business_cash = v_business_cash and p.character_id < v_character_id);
  end if;

  return jsonb_build_object(
    'character_id', v_character_id,
    'display_name', v_name,
    'avatar_url', v_avatar,
    'joined_at', v_joined_at,
    'level', v_level,
    'game_day', v_game_day,
    'skin_id', v_state #>> '{character,wardrobe,skinId}',
    'company_count', v_company_count,
    'companies', v_companies,
    'company_rank', v_company_rank,
    'employee_count', v_employee_count,
    'achievement_ids', v_achievements,
    'stats', jsonb_build_object(
      'transactions', v_transaction_count,
      'revenue', v_total_revenue,
      'assets', v_assets,
      'employees', v_employee_count,
      'products_sold', v_products_sold,
      'achievements', jsonb_array_length(v_achievements)
    )
  );
end;
$$;

revoke all on function public.apx_public_player_profile_details(uuid) from public, anon;
grant execute on function public.apx_public_player_profile_details(uuid) to authenticated;

commit;
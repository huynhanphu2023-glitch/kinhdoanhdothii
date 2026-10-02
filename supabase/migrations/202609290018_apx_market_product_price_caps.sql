begin;

do $$
begin
  if to_regclass('public.apx_market_npcs') is null
     or to_regclass('public.apx_market_listings') is null
     or to_regclass('public.apx_market_transactions') is null
     or to_regclass('public.apx_game_saves') is null
     or to_regprocedure('public.apx_market_credit_sale(uuid,text,text,numeric,bigint)') is null
     or to_regprocedure('public.apx_market_sync_listings(jsonb)') is null
     or to_regprocedure('public.apx_market_refresh_offline_listings()') is null then
    raise exception 'Apply APX marketplace migrations 007 and 008 first.';
  end if;
end;
$$;

create or replace function public.apx_market_product_price_cap(p_category text)
returns bigint
language sql
immutable
set search_path = ''
as $$
  select case p_category
    when 'technology' then 1000000::bigint
    when 'real-estate' then 1000000::bigint
    when 'lifestyle' then 500000::bigint
    else 0::bigint
  end;
$$;

update public.apx_market_npcs
set budget = case preferred_category
  when 'technology' then (array[250000, 500000, 750000, 1000000])[(abs(hashtext(display_code)::bigint) % 4)::integer + 1]
  when 'real-estate' then (array[250000, 500000, 750000, 1000000])[(abs(hashtext(display_code)::bigint) % 4)::integer + 1]
  else (array[100000, 200000, 350000, 500000])[(abs(hashtext(display_code)::bigint) % 4)::integer + 1]
end
where budget > public.apx_market_product_price_cap(preferred_category);

update public.apx_market_listings
set active = false, updated_at = now()
where unit_price > public.apx_market_product_price_cap(category);

create or replace function public.apx_market_sync_listings(p_listings jsonb)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := (select auth.uid());
  v_state jsonb;
begin
  if v_user is null or not public.apx_user_can_play() then
    raise exception 'Hãy đăng nhập bằng tài khoản hợp lệ.';
  end if;
  if jsonb_typeof(p_listings) <> 'array' or jsonb_array_length(p_listings) > 50 then
    raise exception 'Danh sách sản phẩm không hợp lệ.';
  end if;

  select game_state into v_state
  from public.apx_game_saves where user_id = v_user;
  if v_state is null then raise exception 'Không tìm thấy bản lưu người chơi.'; end if;

  update public.apx_market_listings
  set active = false, updated_at = now()
  where seller_user_id = v_user;

  insert into public.apx_market_listings(
    seller_user_id, company_id, company_name, product_id, product_name, category,
    unit_price, quality, reputation, available_units, active
  )
  select v_user, c.key, c.value ->> 'name', p.value ->> 'id', p.value ->> 'name',
    case when c.value ->> 'industryId' = 'technology' then 'technology'
      when c.value ->> 'industryId' = 'real-estate' then 'real-estate' else 'lifestyle' end,
    (p.value ->> 'price')::bigint,
    least(100::numeric, greatest(1::numeric, coalesce((p.value ->> 'quality')::numeric, 1))),
    least(100::numeric, greatest(0::numeric, coalesce((c.value ->> 'reputation')::numeric, 0))),
    case when coalesce((c.value #>> '{inventory,usePerSale}')::numeric, 0) > 0
      then floor(greatest(0, coalesce((c.value #>> '{inventory,stock}')::numeric, 0)) / (c.value #>> '{inventory,usePerSale}')::numeric)
      else 999999 end,
    coalesce((p.value ->> 'active')::boolean, true)
      and case when coalesce((c.value #>> '{inventory,usePerSale}')::numeric, 0) > 0
        then coalesce((c.value #>> '{inventory,stock}')::numeric, 0) > 0 else true end
  from jsonb_to_recordset(p_listings) as requested(company_id text, product_id text)
  join lateral jsonb_each(coalesce(v_state #> '{companyOperations,companies}', '{}'::jsonb)) c
    on c.key = requested.company_id
  join lateral jsonb_array_elements(coalesce(c.value -> 'products', '[]'::jsonb)) p
    on p.value ->> 'id' = requested.product_id
  where coalesce(c.value ->> 'status', '') = 'Đang hoạt động'
    and coalesce((p.value ->> 'active')::boolean, true)
    and coalesce((p.value ->> 'price')::bigint, 0) > 0
    and (p.value ->> 'price')::bigint <= public.apx_market_product_price_cap(
      case when c.value ->> 'industryId' = 'technology' then 'technology'
        when c.value ->> 'industryId' = 'real-estate' then 'real-estate' else 'lifestyle' end
    )
  on conflict (seller_user_id, company_id, product_id) do update set
    company_name = excluded.company_name, product_name = excluded.product_name,
    category = excluded.category, unit_price = excluded.unit_price,
    quality = excluded.quality, reputation = excluded.reputation,
    available_units = excluded.available_units, active = excluded.active, updated_at = now();
end;
$$;

create or replace function public.apx_market_refresh_offline_listings()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  s record;
  c record;
  p record;
  v_added integer := 0;
  v_units numeric;
  v_category text;
  v_price bigint;
begin
  update public.apx_market_listings
  set active = false, updated_at = now()
  where unit_price > public.apx_market_product_price_cap(category);

  for s in select user_id, game_state from public.apx_game_saves loop
    for c in select key, value from jsonb_each(coalesce(s.game_state #> '{companyOperations,companies}', '{}'::jsonb)) loop
      if coalesce(c.value ->> 'status', '') <> 'Đang hoạt động' then continue; end if;
      v_category := case when c.value ->> 'industryId' = 'technology' then 'technology'
        when c.value ->> 'industryId' = 'real-estate' then 'real-estate' else 'lifestyle' end;
      for p in select value from jsonb_array_elements(coalesce(c.value -> 'products', '[]'::jsonb)) loop
        v_price := coalesce((p.value ->> 'price')::bigint, 0);
        if not coalesce((p.value ->> 'active')::boolean, true) or v_price <= 0
           or v_price > public.apx_market_product_price_cap(v_category) then
          update public.apx_market_listings set active = false, updated_at = now()
          where seller_user_id = s.user_id and company_id = c.key and product_id = p.value ->> 'id';
          continue;
        end if;
        v_units := case when coalesce((c.value #>> '{inventory,usePerSale}')::numeric, 0) > 0
          then floor(greatest(0, coalesce((c.value #>> '{inventory,stock}')::numeric, 0)) / (c.value #>> '{inventory,usePerSale}')::numeric)
          else 999999 end;
        insert into public.apx_market_listings(
          seller_user_id, company_id, company_name, product_id, product_name, category,
          unit_price, quality, reputation, available_units, active
        ) values (
          s.user_id, c.key, c.value ->> 'name', p.value ->> 'id', p.value ->> 'name', v_category,
          v_price, least(100::numeric, greatest(1::numeric, coalesce((p.value ->> 'quality')::numeric, 1))),
          least(100::numeric, greatest(0::numeric, coalesce((c.value ->> 'reputation')::numeric, 0))),
          v_units, v_units > 0
        )
        on conflict (seller_user_id, company_id, product_id) do update set
          company_name = excluded.company_name, product_name = excluded.product_name,
          category = excluded.category, unit_price = excluded.unit_price,
          quality = excluded.quality, reputation = excluded.reputation,
          available_units = excluded.available_units, active = excluded.active, updated_at = now();
        v_added := v_added + 1;
      end loop;
    end loop;
  end loop;
  return v_added;
end;
$$;

create or replace function public.apx_market_run_npc_batch(lim integer default 800)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  n record;
  picked record;
  v_count integer := 0;
  v_qty numeric;
  v_total bigint;
begin
  for n in select * from public.apx_market_npcs order by random() limit greatest(1, least(lim, 800)) loop
    select l.* into picked
    from public.apx_market_listings l
    where l.active and l.available_units > 0
      and l.category = n.preferred_category
      and l.unit_price <= n.budget
      and l.unit_price <= public.apx_market_product_price_cap(l.category)
    order by -ln(greatest(random(), 0.000001)) / greatest(.05,
      ((1.15 - l.unit_price::numeric / nullif(n.budget, 0) * .35)
        + l.quality / 100 * .48 + l.reputation / 100 * .24 + least(1, l.available_units / 20) * .13)
      / (1 + coalesce((select count(*) from public.apx_market_transactions t
        where t.seller_id = l.seller_user_id and t.created_at > now() - interval '30 minutes'), 0) * .28)
    ) asc
    limit 1 for update;
    if not found then continue; end if;

    v_qty := least(1::numeric, picked.available_units);
    v_total := picked.unit_price;
    begin
      perform public.apx_market_credit_sale(picked.seller_user_id, picked.company_id, picked.product_id, v_qty, v_total);
      update public.apx_market_listings set available_units = available_units - v_qty, updated_at = now() where id = picked.id;
      insert into public.apx_market_transactions(
        buyer_type, buyer_label, seller_id, company_id, product_id, product_name,
        quantity, unit_price, total_price
      ) values (
        'NPC', 'Khách NPC #' || n.display_code, picked.seller_user_id, picked.company_id,
        picked.product_id, picked.product_name, v_qty, picked.unit_price, v_total
      );
      update public.apx_market_npcs set last_purchase_at = now() where id = n.id;
      v_count := v_count + 1;
    exception when others then
      null;
    end;
  end loop;
  return v_count;
end;
$$;

revoke all on function public.apx_market_run_npc_batch(integer) from public, anon, authenticated;
revoke all on function public.apx_market_product_price_cap(text) from public, anon, authenticated;

select cron.unschedule(jobid)
from cron.job where jobname = 'apx-market-npc-batch-every-five-minutes';
select cron.schedule('apx-market-npc-batch-every-five-minutes','*/5 * * * *','select public.apx_market_run_npc_batch(800);');

commit;
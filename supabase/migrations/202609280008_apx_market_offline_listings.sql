-- Keep product listings authoritative even while the seller is offline.
-- Every quantity is read from apx_game_saves; the browser never supplies stock.
create or replace function public.apx_market_sync_listings(p_listings jsonb)
returns void language plpgsql security definer set search_path = '' as $$
declare v_user uuid := (select auth.uid()); v_state jsonb;
begin
  if v_user is null or not public.apx_user_can_play() then raise exception 'Hãy đăng nhập bằng tài khoản hợp lệ.'; end if;
  if jsonb_typeof(p_listings) <> 'array' or jsonb_array_length(p_listings) > 50 then raise exception 'Danh sách sản phẩm không hợp lệ.'; end if;
  select game_state into v_state from public.apx_game_saves where user_id = v_user;
  if v_state is null then raise exception 'Không tìm thấy bản lưu người chơi.'; end if;

  update public.apx_market_listings set active = false, updated_at = now() where seller_user_id = v_user;
  insert into public.apx_market_listings(seller_user_id,company_id,company_name,product_id,product_name,category,unit_price,quality,reputation,available_units,active)
  select v_user, c.key, c.value->>'name', p.value->>'id', p.value->>'name',
    case when c.value->>'industryId' = 'technology' then 'technology' when c.value->>'industryId' = 'real-estate' then 'real-estate' else 'lifestyle' end,
    (p.value->>'price')::bigint, least(100::numeric,greatest(1::numeric,coalesce((p.value->>'quality')::numeric,1))),
    least(100::numeric,greatest(0::numeric,coalesce((c.value->>'reputation')::numeric,0))),
    case when coalesce((c.value#>>'{inventory,usePerSale}')::numeric,0) > 0
      then floor(greatest(0,coalesce((c.value#>>'{inventory,stock}')::numeric,0)) / (c.value#>>'{inventory,usePerSale}')::numeric)
      else 999999 end,
    coalesce((p.value->>'active')::boolean,true)
      and case when coalesce((c.value#>>'{inventory,usePerSale}')::numeric,0) > 0 then coalesce((c.value#>>'{inventory,stock}')::numeric,0) > 0 else true end
  from jsonb_to_recordset(p_listings) as requested(company_id text, product_id text)
  join lateral jsonb_each(coalesce(v_state#>'{companyOperations,companies}','{}'::jsonb)) c on c.key = requested.company_id
  join lateral jsonb_array_elements(coalesce(c.value->'products','[]'::jsonb)) p on p.value->>'id' = requested.product_id
  where coalesce(c.value->>'status','') = 'Đang hoạt động'
    and coalesce((p.value->>'active')::boolean,true)
    and coalesce((p.value->>'price')::bigint,0) > 0
  on conflict (seller_user_id,company_id,product_id) do update set
    company_name=excluded.company_name, product_name=excluded.product_name, category=excluded.category,
    unit_price=excluded.unit_price, quality=excluded.quality, reputation=excluded.reputation,
    available_units=excluded.available_units, active=excluded.active, updated_at=now();
end; $$;

-- The scheduled worker calls this independently of any browser session.
create or replace function public.apx_market_refresh_offline_listings()
returns integer language plpgsql security definer set search_path = '' as $$
declare s record; c record; p record; v_added integer := 0; v_units numeric;
begin
  for s in select user_id, game_state from public.apx_game_saves loop
    for c in select key, value from jsonb_each(coalesce(s.game_state#>'{companyOperations,companies}','{}'::jsonb)) loop
      if coalesce(c.value->>'status','') <> 'Đang hoạt động' then continue; end if;
      for p in select value from jsonb_array_elements(coalesce(c.value->'products','[]'::jsonb)) loop
        if not coalesce((p.value->>'active')::boolean,true) or coalesce((p.value->>'price')::bigint,0) <= 0 then continue; end if;
        v_units := case when coalesce((c.value#>>'{inventory,usePerSale}')::numeric,0) > 0
          then floor(greatest(0,coalesce((c.value#>>'{inventory,stock}')::numeric,0)) / (c.value#>>'{inventory,usePerSale}')::numeric)
          else 999999 end;
        insert into public.apx_market_listings(seller_user_id,company_id,company_name,product_id,product_name,category,unit_price,quality,reputation,available_units,active)
        values (s.user_id,c.key,c.value->>'name',p.value->>'id',p.value->>'name',
          case when c.value->>'industryId'='technology' then 'technology' when c.value->>'industryId'='real-estate' then 'real-estate' else 'lifestyle' end,
          (p.value->>'price')::bigint,least(100::numeric,greatest(1::numeric,coalesce((p.value->>'quality')::numeric,1))),
          least(100::numeric,greatest(0::numeric,coalesce((c.value->>'reputation')::numeric,0))),v_units,v_units>0)
        on conflict (seller_user_id,company_id,product_id) do update set
          company_name=excluded.company_name, product_name=excluded.product_name, category=excluded.category,
          unit_price=excluded.unit_price, quality=excluded.quality, reputation=excluded.reputation,
          available_units=excluded.available_units, active=excluded.active, updated_at=now();
        v_added := v_added + 1;
      end loop;
    end loop;
  end loop;
  return v_added;
end; $$;

revoke all on function public.apx_market_refresh_offline_listings() from public, anon, authenticated;
select cron.unschedule(jobid) from cron.job where jobname = 'apx-market-add-offline-listings-every-five-minutes';
select cron.schedule('apx-market-add-offline-listings-every-five-minutes','1-59/5 * * * *','select public.apx_market_refresh_offline_listings();');

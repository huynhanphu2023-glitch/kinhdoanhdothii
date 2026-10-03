-- APX marketplace: NPC demand and player-to-player commerce.
-- NPCs are system customers only; they are never auth users or leaderboard members.
create table public.apx_market_npcs (
  id uuid primary key default gen_random_uuid(),
  display_code text not null unique,
  customer_type text not null check (customer_type in ('consumer','business','urgent')),
  budget bigint not null check (budget > 0),
  preferred_category text not null check (preferred_category in ('lifestyle','technology','real-estate')),
  priority smallint not null default 2 check (priority between 1 and 4),
  last_purchase_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.apx_market_listings (
  id uuid primary key default gen_random_uuid(),
  seller_user_id uuid not null references auth.users(id) on delete cascade,
  company_id text not null,
  company_name text not null,
  product_id text not null,
  product_name text not null,
  category text not null check (category in ('lifestyle','technology','real-estate')),
  unit_price bigint not null check (unit_price > 0),
  quality numeric(5,2) not null check (quality between 1 and 100),
  reputation numeric(5,2) not null check (reputation between 0 and 100),
  available_units numeric(20,3) not null check (available_units >= 0),
  active boolean not null default true,
  updated_at timestamptz not null default now(),
  unique (seller_user_id, company_id, product_id)
);

create table public.apx_market_transactions (
  id bigint generated always as identity primary key,
  buyer_type text not null check (buyer_type in ('NPC','PLAYER')),
  buyer_id uuid,
  buyer_label text not null,
  seller_type text not null default 'COMPANY' check (seller_type = 'COMPANY'),
  seller_id uuid not null references auth.users(id) on delete restrict,
  company_id text not null,
  product_id text not null,
  product_name text not null,
  quantity numeric(20,3) not null check (quantity > 0),
  unit_price bigint not null check (unit_price > 0),
  total_price bigint not null check (total_price > 0),
  status text not null default 'completed' check (status in ('completed','cancelled')),
  created_at timestamptz not null default now(),
  check ((buyer_type = 'NPC' and buyer_id is null) or (buyer_type = 'PLAYER' and buyer_id is not null))
);
create index apx_market_listings_match_idx on public.apx_market_listings(category, active, available_units, updated_at desc);
create index apx_market_transactions_seller_idx on public.apx_market_transactions(seller_id, created_at desc);
create index apx_market_transactions_buyer_idx on public.apx_market_transactions(buyer_id, created_at desc) where buyer_id is not null;

alter table public.apx_market_npcs enable row level security;
alter table public.apx_market_listings enable row level security;
alter table public.apx_market_transactions enable row level security;
create policy apx_market_listing_read on public.apx_market_listings for select to authenticated using (active and available_units > 0);
create policy apx_market_tx_read on public.apx_market_transactions for select to authenticated using (seller_id = (select auth.uid()) or buyer_id = (select auth.uid()));
revoke all on public.apx_market_npcs, public.apx_market_listings, public.apx_market_transactions from anon, authenticated;
grant select on public.apx_market_listings, public.apx_market_transactions to authenticated;

-- The client only submits its own current products.  No direct table writes are granted.
create function public.apx_market_sync_listings(p_listings jsonb)
returns void language plpgsql security definer set search_path = '' as $$
declare v_user uuid := (select auth.uid());
begin
  if v_user is null or not public.apx_user_can_play() then raise exception 'Hãy đăng nhập bằng tài khoản hợp lệ.'; end if;
  if jsonb_typeof(p_listings) <> 'array' or jsonb_array_length(p_listings) > 50 then raise exception 'Danh sách sản phẩm không hợp lệ.'; end if;
  update public.apx_market_listings set active = false, updated_at = now() where seller_user_id = v_user;
  insert into public.apx_market_listings(seller_user_id,company_id,company_name,product_id,product_name,category,unit_price,quality,reputation,available_units,active)
  select v_user, x.company_id, x.company_name, x.product_id, x.product_name, x.category, x.unit_price, x.quality, x.reputation, x.available_units, x.active
  from jsonb_to_recordset(p_listings) as x(company_id text, company_name text, product_id text, product_name text, category text, unit_price bigint, quality numeric, reputation numeric, available_units numeric, active boolean)
  where x.company_id <> '' and x.product_id <> '' and x.product_name <> '' and x.category in ('lifestyle','technology','real-estate') and x.unit_price > 0 and x.available_units >= 0
  on conflict (seller_user_id,company_id,product_id) do update set company_name=excluded.company_name, product_name=excluded.product_name, category=excluded.category, unit_price=excluded.unit_price, quality=excluded.quality, reputation=excluded.reputation, available_units=excluded.available_units, active=excluded.active, updated_at=now();
end; $$;

-- Updates the authoritative game save after a completed sale. The row lock prevents overselling.
create function public.apx_market_credit_sale(p_seller uuid, p_company text, p_product text, p_quantity numeric, p_total bigint)
returns void language plpgsql security definer set search_path = '' as $$
declare v_state jsonb; v_company jsonb; v_company_key text; v_product_index int; v_stock numeric; v_use numeric; v_new_company jsonb;
begin
  select game_state into v_state from public.apx_game_saves where user_id=p_seller for update;
  if v_state is null then raise exception 'Không tìm thấy bản lưu người bán.'; end if;
  select key,value into v_company_key,v_company from jsonb_each(v_state #> '{companyOperations,companies}') where key=p_company;
  if v_company is null or coalesce(v_company->>'status','') <> 'Đang hoạt động' then raise exception 'Công ty không còn hoạt động.'; end if;
  select ordinality::int-1 into v_product_index from jsonb_array_elements(v_company->'products') with ordinality a(item,ordinality) where item->>'id'=p_product and coalesce((item->>'active')::boolean,true) limit 1;
  if v_product_index is null then raise exception 'Sản phẩm không còn bán.'; end if;
  v_stock:=coalesce((v_company#>>'{inventory,stock}')::numeric,0); v_use:=coalesce((v_company#>>'{inventory,usePerSale}')::numeric,0);
  if v_use > 0 and v_stock < p_quantity*v_use then raise exception 'Kho không đủ hàng.'; end if;
  v_new_company := jsonb_set(v_company,'{cash}',to_jsonb(coalesce((v_company->>'cash')::bigint,0)+p_total));
  v_new_company := jsonb_set(v_new_company,'{revenue}',to_jsonb(coalesce((v_company->>'revenue')::bigint,0)+p_total));
  v_new_company := jsonb_set(v_new_company,'{dailyRevenue}',to_jsonb(coalesce((v_company->>'dailyRevenue')::bigint,0)+p_total));
  v_new_company := jsonb_set(v_new_company,'{totalRevenue}',to_jsonb(coalesce((v_company->>'totalRevenue')::bigint,0)+p_total));
  v_new_company := jsonb_set(v_new_company,array['products',v_product_index::text,'unitsSold'],to_jsonb(coalesce((v_company#>>array['products',v_product_index::text,'unitsSold'])::numeric,0)+p_quantity));
  v_new_company := jsonb_set(v_new_company,array['products',v_product_index::text,'totalSold'],to_jsonb(coalesce((v_company#>>array['products',v_product_index::text,'totalSold'])::numeric,0)+p_quantity));
  v_new_company := jsonb_set(v_new_company,array['products',v_product_index::text,'revenue'],to_jsonb(coalesce((v_company#>>array['products',v_product_index::text,'revenue'])::bigint,0)+p_total));
  if v_use > 0 then v_new_company:=jsonb_set(v_new_company,'{inventory,stock}',to_jsonb(v_stock-p_quantity*v_use)); end if;
  update public.apx_game_saves set game_state=jsonb_set(v_state,array['companyOperations','companies',v_company_key],v_new_company),revision=revision+1,updated_at=now() where user_id=p_seller;
end; $$;

create function public.apx_market_buy_player(p_listing uuid, p_quantity numeric)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_buyer uuid := (select auth.uid()); v_l public.apx_market_listings%rowtype; v_total bigint; v_buyer_state jsonb; v_name text;
begin
  if v_buyer is null or not public.apx_user_can_play() then raise exception 'Hãy đăng nhập trước.'; end if;
  if p_quantity <= 0 or p_quantity > 1000 then raise exception 'Số lượng không hợp lệ.'; end if;
  select * into v_l from public.apx_market_listings where id=p_listing and active for update;
  if not found or v_l.available_units < p_quantity then raise exception 'Sản phẩm đã hết hàng hoặc ngừng bán.'; end if;
  if v_l.seller_user_id=v_buyer then raise exception 'Không thể mua sản phẩm của chính bạn.'; end if;
  select game_state into v_buyer_state from public.apx_game_saves where user_id=v_buyer for update;
  v_total:=round(v_l.unit_price*p_quantity); if coalesce((v_buyer_state->>'cash')::bigint,0)<v_total then raise exception 'Tiền cá nhân không đủ.'; end if;
  update public.apx_game_saves set game_state=jsonb_set(v_buyer_state,'{cash}',to_jsonb((v_buyer_state->>'cash')::bigint-v_total)),revision=revision+1,updated_at=now() where user_id=v_buyer;
  perform public.apx_market_credit_sale(v_l.seller_user_id,v_l.company_id,v_l.product_id,p_quantity,v_total);
  update public.apx_market_listings set available_units=greatest(0,available_units-p_quantity),updated_at=now() where id=v_l.id;
  select display_name into v_name from public.apx_player_profiles where user_id=v_buyer;
  insert into public.apx_market_transactions(buyer_type,buyer_id,buyer_label,seller_id,company_id,product_id,product_name,quantity,unit_price,total_price) values('PLAYER',v_buyer,coalesce(v_name,'Người chơi'),v_l.seller_user_id,v_l.company_id,v_l.product_id,v_l.product_name,p_quantity,v_l.unit_price,v_total);
  return jsonb_build_object('total',v_total);
end; $$;

create function public.apx_market_dashboard()
returns jsonb language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'transactions_today',(select count(*) from public.apx_market_transactions where created_at >= date_trunc('day',now())),
    'volume_today',(select coalesce(sum(total_price),0) from public.apx_market_transactions where created_at >= date_trunc('day',now())),
    'units_today',(select coalesce(sum(quantity),0) from public.apx_market_transactions where created_at >= date_trunc('day',now())),
    'npc_buyers_today',(select count(distinct buyer_label) from public.apx_market_transactions where buyer_type='NPC' and created_at >= date_trunc('day',now())),
    'player_buyers_today',(select count(distinct buyer_id) from public.apx_market_transactions where buyer_type='PLAYER' and created_at >= date_trunc('day',now())),
    'sellers',(select count(distinct seller_user_id) from public.apx_market_listings where active and available_units>0),
    'top_product',(select product_name from public.apx_market_transactions where created_at >= date_trunc('day',now()) group by product_name order by sum(quantity) desc limit 1)
  );
$$;

create function public.apx_market_company_stats(p_company_id text)
returns jsonb language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'today',coalesce(sum(total_price) filter(where created_at >= date_trunc('day',now())),0),
    'seven_days',coalesce(sum(total_price) filter(where created_at >= now()-interval '7 days'),0),
    'thirty_days',coalesce(sum(total_price) filter(where created_at >= now()-interval '30 days'),0),
    'total',coalesce(sum(total_price),0),
    'orders',count(*),
    'units',coalesce(sum(quantity),0),
    'customers',count(distinct buyer_type||':'||coalesce(buyer_id::text,buyer_label)),
    'player_customers',count(distinct buyer_id) filter(where buyer_type='PLAYER'),
    'npc_customers',count(distinct buyer_label) filter(where buyer_type='NPC'),
    'average_order',coalesce(round(avg(total_price)),0),
    'best_seller',(select product_name from public.apx_market_transactions t2 where t2.seller_id=(select auth.uid()) and t2.company_id=p_company_id group by product_name order by sum(quantity) desc limit 1)
  ) from public.apx_market_transactions where seller_id=(select auth.uid()) and company_id=p_company_id and status='completed';
$$;

-- One batch distributes purchases with weighted competition and a soft recent-order penalty.
create function public.apx_market_run_npc_batch(p_limit integer default 24)
returns integer language plpgsql security definer set search_path = '' as $$
declare n record; l record; picked record; v_count integer:=0; v_qty numeric; v_total bigint;
begin
  for n in select * from public.apx_market_npcs order by random() limit greatest(1,least(p_limit,80)) loop
    select l.* into picked
    from public.apx_market_listings l
    where l.active and l.available_units>0 and l.category=n.preferred_category and l.unit_price<=n.budget
    order by greatest(.05, (1.35 - l.unit_price::numeric/nullif(n.budget,0)*.45) + l.quality/100*.55 + l.reputation/100*.30 + least(1,l.available_units/20)*.20 - coalesce((select count(*) from public.apx_market_transactions t where t.seller_id=l.seller_user_id and t.created_at>now()-interval '15 minutes'),0)*.025 + random()*.25) desc
    limit 1 for update;
    if not found then continue; end if;
    v_qty:=least(1::numeric,picked.available_units); v_total:=picked.unit_price;
    begin
      perform public.apx_market_credit_sale(picked.seller_user_id,picked.company_id,picked.product_id,v_qty,v_total);
      update public.apx_market_listings set available_units=available_units-v_qty,updated_at=now() where id=picked.id;
      insert into public.apx_market_transactions(buyer_type,buyer_label,seller_id,company_id,product_id,product_name,quantity,unit_price,total_price) values('NPC','Khách NPC #'||n.display_code,picked.seller_user_id,picked.company_id,picked.product_id,picked.product_name,v_qty,picked.unit_price,v_total);
      update public.apx_market_npcs set last_purchase_at=now() where id=n.id; v_count:=v_count+1;
    exception when others then null; end;
  end loop;
  return v_count;
end; $$;

insert into public.apx_market_npcs(display_code,customer_type,budget,preferred_category,priority)
select lpad(g::text,4,'0'),case when g%9=0 then 'urgent' when g%4=0 then 'business' else 'consumer' end, case when g%3=0 then 5000000 when g%3=1 then 500000 else 3000000 end, (array['lifestyle','technology','real-estate'])[(g%3)+1],(g%4)+1 from generate_series(1,240) g;

revoke all on function public.apx_market_sync_listings(jsonb),public.apx_market_credit_sale(uuid,text,text,numeric,bigint),public.apx_market_buy_player(uuid,numeric),public.apx_market_dashboard(),public.apx_market_company_stats(text),public.apx_market_run_npc_batch(integer) from public,anon,authenticated;
grant execute on function public.apx_market_sync_listings(jsonb),public.apx_market_buy_player(uuid,numeric),public.apx_market_dashboard(),public.apx_market_company_stats(text) to authenticated;
create extension if not exists pg_cron with schema pg_catalog;
select cron.schedule('apx-market-npc-batch-every-five-minutes','*/5 * * * *','select public.apx_market_run_npc_batch(24);') where not exists (select 1 from cron.job where jobname='apx-market-npc-batch-every-five-minutes');

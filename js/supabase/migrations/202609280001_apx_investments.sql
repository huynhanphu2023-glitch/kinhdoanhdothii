-- APX investment system. Preflight avoids modifying any existing table or function.
do $$
begin
  if to_regclass('public.apx_investment_assets') is not null
     or to_regclass('public.apx_investment_positions') is not null
     or to_regclass('public.apx_investment_transactions') is not null
     or to_regprocedure('public.apx_investment_trade(text,text,numeric)') is not null
     or to_regprocedure('public.apx_investment_claim_maturities()') is not null
     or to_regprocedure('public.apx_investment_refresh_market()') is not null then
    raise exception 'An APX investment object already exists. Inspect it before applying this migration.';
  end if;
end $$;

create table public.apx_investment_assets (
  symbol text primary key check (symbol ~ '^[A-Z0-9-]{2,12}$'),
  name text not null,
  asset_type text not null check (asset_type in ('stock','bond','fund')),
  current_price bigint not null check (current_price > 0),
  previous_price bigint not null check (previous_price > 0),
  volatility numeric(7,5) not null default 0 check (volatility >= 0 and volatility <= 0.15),
  annual_rate numeric(7,4),
  maturity_days integer,
  price_updated_at timestamptz not null default now(),
  is_active boolean not null default true,
  description text not null default '',
  created_at timestamptz not null default now(),
  check ((asset_type = 'bond' and annual_rate is not null and annual_rate > 0 and maturity_days is not null and maturity_days > 0)
      or (asset_type <> 'bond' and annual_rate is null and maturity_days is null))
);
create table public.apx_investment_positions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  symbol text not null references public.apx_investment_assets(symbol),
  quantity numeric(20,6) not null check (quantity > 0),
  purchase_price bigint not null check (purchase_price > 0),
  acquired_at timestamptz not null default now(),
  matures_at timestamptz,
  annual_rate numeric(7,4),
  maturity_days integer,
  created_at timestamptz not null default now(),
  check ((matures_at is null and annual_rate is null and maturity_days is null)
      or (matures_at is not null and annual_rate > 0 and maturity_days > 0))
);
create table public.apx_investment_transactions (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  symbol text not null references public.apx_investment_assets(symbol),
  asset_type text not null check (asset_type in ('stock','bond','fund')),
  side text not null check (side in ('buy','sell','maturity')),
  quantity numeric(20,6) not null check (quantity > 0),
  price bigint not null check (price > 0),
  total_amount bigint not null check (total_amount > 0),
  realized_pnl bigint not null default 0,
  cash_after bigint not null check (cash_after >= 0),
  created_at timestamptz not null default now()
);
create index apx_investment_positions_user_symbol_idx on public.apx_investment_positions(user_id, symbol);
create index apx_investment_transactions_user_created_idx on public.apx_investment_transactions(user_id, created_at desc);

alter table public.apx_investment_assets enable row level security;
alter table public.apx_investment_positions enable row level security;
alter table public.apx_investment_transactions enable row level security;
create policy apx_investment_assets_read on public.apx_investment_assets for select to anon, authenticated using (is_active);
create policy apx_investment_positions_read_self on public.apx_investment_positions for select to authenticated using (user_id = (select auth.uid()));
create policy apx_investment_transactions_read_self on public.apx_investment_transactions for select to authenticated using (user_id = (select auth.uid()));
revoke all on public.apx_investment_assets, public.apx_investment_positions, public.apx_investment_transactions from anon, authenticated;
grant select on public.apx_investment_assets to anon, authenticated;
grant select on public.apx_investment_positions, public.apx_investment_transactions to authenticated;
revoke all on sequence public.apx_investment_transactions_id_seq from anon, authenticated;

insert into public.apx_investment_assets
  (symbol,name,asset_type,current_price,previous_price,volatility,annual_rate,maturity_days,description)
values
  ('APX','APX Group','stock',245650000,245650000,0.02500,null,null,'Tập đoàn công nghệ và đô thị APX.'),
  ('FPT','FPT Digital','stock',126200000,126200000,0.01800,null,null,'Doanh nghiệp công nghệ mẫu.'),
  ('HPG','Hoa Phat Industries','stock',28400000,28400000,0.03000,null,null,'Doanh nghiệp công nghiệp mẫu.'),
  ('VCF','Viet Capital Finance','stock',72500000,72500000,0.02200,null,null,'Doanh nghiệp tài chính mẫu.'),
  ('APX-B30','APX Bond 30','bond',100000000,100000000,0,10.5,30,'Trái phiếu APX, kỳ hạn 30 ngày thực.'),
  ('GOV-B90','Vietnam Gov Bond 90','bond',10000000,10000000,0,6.8,90,'Trái phiếu chính phủ mẫu, kỳ hạn 90 ngày thực.'),
  ('CORE-F','APX Core Fund','fund',1100000,1100000,0.01000,null,null,'Quỹ đa dạng hóa cổ phiếu vốn hóa lớn.'),
  ('TECH-F','APX Technology Fund','fund',680000,680000,0.01800,null,null,'Quỹ công nghệ mô phỏng.');

create function public.apx_investment_refresh_market()
returns void language plpgsql security definer set search_path = '' as $$
begin
  update public.apx_investment_assets a
  set previous_price = a.current_price,
      current_price = greatest(100, round(a.current_price * (1 + ((random() * 2 - 1) * a.volatility::double precision)))::bigint),
      price_updated_at = now()
  where a.asset_type in ('stock','fund') and a.is_active
    and a.price_updated_at <= now() - interval '5 minutes';
end;
$$;

create function public.apx_investment_claim_maturities()
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_user uuid := (select auth.uid());
  v_state jsonb;
  v_cash bigint;
  v_count integer := 0;
  v_lot record;
  v_principal bigint;
  v_interest bigint;
  v_payout bigint;
begin
  if v_user is null then raise exception 'Hãy đăng nhập để xem danh mục đầu tư.'; end if;
  if not public.apx_user_can_play() then raise exception 'Tài khoản hiện không thể giao dịch.'; end if;
  select s.game_state into v_state from public.apx_game_saves s where s.user_id = v_user for update;
  if v_state is null then raise exception 'Tài khoản chưa có bản lưu game trên Supabase.'; end if;
  v_cash := greatest(0, coalesce((v_state->>'cash')::bigint, 0));
  for v_lot in
    select p.* from public.apx_investment_positions p
    join public.apx_investment_assets a on a.symbol = p.symbol
    where p.user_id = v_user and a.asset_type = 'bond' and p.matures_at is not null and p.matures_at <= now()
    order by p.matures_at for update of p
  loop
    v_principal := round(v_lot.purchase_price * v_lot.quantity)::bigint;
    v_interest := round(v_principal * v_lot.annual_rate / 100 * v_lot.maturity_days / 365)::bigint;
    v_payout := v_principal + v_interest;
    v_cash := v_cash + v_payout;
    insert into public.apx_investment_transactions
      (user_id,symbol,asset_type,side,quantity,price,total_amount,realized_pnl,cash_after)
    values (v_user,v_lot.symbol,'bond','maturity',v_lot.quantity,v_lot.purchase_price,v_payout,v_interest,v_cash);
    delete from public.apx_investment_positions where id = v_lot.id;
    v_count := v_count + 1;
  end loop;
  if v_count > 0 then
    update public.apx_game_saves set game_state = jsonb_set(v_state, '{cash}', to_jsonb(v_cash), true),
      revision = revision + 1, updated_at = now() where user_id = v_user;
  end if;
  return jsonb_build_object('cash',v_cash,'matured_count',v_count);
end;
$$;

create function public.apx_investment_trade(p_symbol text, p_side text, p_quantity numeric)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_user uuid := (select auth.uid());
  v_asset public.apx_investment_assets%rowtype;
  v_state jsonb;
  v_cash bigint;
  v_new_cash bigint;
  v_total bigint;
  v_realized bigint := 0;
  v_remaining numeric(20,6);
  v_take numeric(20,6);
  v_lot record;
  v_lot_pnl bigint;
  v_matures timestamptz;
begin
  if v_user is null then raise exception 'Hãy đăng nhập để giao dịch.'; end if;
  if not public.apx_user_can_play() then raise exception 'Tài khoản hiện không thể giao dịch.'; end if;
  if p_side not in ('buy','sell') then raise exception 'Loại giao dịch không hợp lệ.'; end if;
  if p_quantity is null or p_quantity <= 0 or p_quantity > 1000000000 then raise exception 'Số lượng không hợp lệ.'; end if;
  perform public.apx_investment_claim_maturities();
  perform public.apx_investment_refresh_market();
  select a.* into v_asset from public.apx_investment_assets a
    where a.symbol = upper(trim(p_symbol)) and a.is_active for update;
  if not found then raise exception 'Không tìm thấy tài sản hoặc tài sản đã ngừng giao dịch.'; end if;
  if v_asset.asset_type in ('stock','bond') and p_quantity <> trunc(p_quantity) then
    raise exception 'Cổ phiếu và trái phiếu chỉ giao dịch theo số nguyên.';
  end if;
  if v_asset.asset_type = 'fund' and round(p_quantity,3) <> p_quantity then
    raise exception 'Chứng chỉ quỹ giao dịch tối đa 3 chữ số thập phân.';
  end if;
  select s.game_state into v_state from public.apx_game_saves s where s.user_id = v_user for update;
  if v_state is null then raise exception 'Tài khoản chưa có bản lưu game trên Supabase.'; end if;
  v_cash := greatest(0, coalesce((v_state->>'cash')::bigint, 0));
  v_total := round(v_asset.current_price * p_quantity)::bigint;
  if v_total < 1 then raise exception 'Giá trị giao dịch quá nhỏ.'; end if;
  if p_side = 'buy' then
    if v_cash < v_total then raise exception 'Bạn không đủ tiền mặt cho giao dịch này.'; end if;
    v_new_cash := v_cash - v_total;
    if v_asset.asset_type = 'bond' then v_matures := now() + make_interval(days => v_asset.maturity_days); else v_matures := null; end if;
    insert into public.apx_investment_positions
      (user_id,symbol,quantity,purchase_price,acquired_at,matures_at,annual_rate,maturity_days)
    values (v_user,v_asset.symbol,p_quantity,v_asset.current_price,now(),v_matures,
      case when v_asset.asset_type = 'bond' then v_asset.annual_rate else null end,
      case when v_asset.asset_type = 'bond' then v_asset.maturity_days else null end);
    insert into public.apx_investment_transactions
      (user_id,symbol,asset_type,side,quantity,price,total_amount,cash_after)
    values (v_user,v_asset.symbol,v_asset.asset_type,'buy',p_quantity,v_asset.current_price,v_total,v_new_cash);
  else
    select coalesce(sum(p.quantity),0) into v_remaining from public.apx_investment_positions p
    where p.user_id = v_user and p.symbol = v_asset.symbol and (p.matures_at is null or p.matures_at > now());
    if v_remaining < p_quantity then raise exception 'Bạn không sở hữu đủ số lượng để bán.'; end if;
    v_new_cash := v_cash + v_total;
    v_remaining := p_quantity;
    for v_lot in
      select p.* from public.apx_investment_positions p
      where p.user_id = v_user and p.symbol = v_asset.symbol and (p.matures_at is null or p.matures_at > now())
      order by p.acquired_at,p.id for update
    loop
      exit when v_remaining <= 0;
      v_take := least(v_remaining,v_lot.quantity);
      v_lot_pnl := round(v_take * (v_asset.current_price - v_lot.purchase_price))::bigint;
      v_realized := v_realized + v_lot_pnl;
      if v_take = v_lot.quantity then
        delete from public.apx_investment_positions where id = v_lot.id;
      else
        update public.apx_investment_positions set quantity = quantity - v_take where id = v_lot.id;
      end if;
      v_remaining := v_remaining - v_take;
    end loop;
    insert into public.apx_investment_transactions
      (user_id,symbol,asset_type,side,quantity,price,total_amount,realized_pnl,cash_after)
    values (v_user,v_asset.symbol,v_asset.asset_type,'sell',p_quantity,v_asset.current_price,v_total,v_realized,v_new_cash);
  end if;
  update public.apx_game_saves set game_state = jsonb_set(v_state, '{cash}', to_jsonb(v_new_cash), true),
    revision = revision + 1, updated_at = now() where user_id = v_user;
  return jsonb_build_object('symbol',v_asset.symbol,'side',p_side,'quantity',p_quantity,
    'price',v_asset.current_price,'total_amount',v_total,'realized_pnl',v_realized,'cash',v_new_cash);
end;
$$;

revoke all on function public.apx_investment_refresh_market() from public, anon, authenticated;
revoke all on function public.apx_investment_claim_maturities() from public, anon, authenticated;
revoke all on function public.apx_investment_trade(text,text,numeric) from public, anon, authenticated;
grant execute on function public.apx_investment_refresh_market(),
  public.apx_investment_claim_maturities(), public.apx_investment_trade(text,text,numeric) to authenticated;
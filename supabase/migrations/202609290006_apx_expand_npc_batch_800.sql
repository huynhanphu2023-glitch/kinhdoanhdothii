begin;

do $$
begin
  if to_regclass('public.apx_market_npcs') is null
     or to_regclass('public.apx_market_listings') is null
     or to_regclass('public.apx_market_transactions') is null
     or to_regprocedure('public.apx_market_credit_sale(uuid,text,text,numeric,bigint)') is null
     or to_regprocedure('public.apx_market_run_npc_batch(integer)') is null then
    raise exception 'Apply APX marketplace migrations 007 and 009 before increasing NPC batch size.';
  end if;
end;
$$;

insert into public.apx_market_npcs(display_code, customer_type, budget, preferred_category, priority)
select
  lpad(g::text, 4, '0'),
  case when g % 9 = 0 then 'urgent' when g % 4 = 0 then 'business' else 'consumer' end,
  case when g % 3 = 0 then 5000000 when g % 3 = 1 then 500000 else 3000000 end,
  (array['lifestyle', 'technology', 'real-estate'])[(g % 3) + 1],
  (g % 4) + 1
from generate_series(2401, 8000) as g
on conflict (display_code) do nothing;

create or replace function public.apx_market_run_npc_batch(lim integer default 800)
returns integer language plpgsql security definer set search_path = '' as $$
declare n record; picked record; v_count integer := 0; v_qty numeric; v_total bigint;
begin
  for n in select * from public.apx_market_npcs order by random() limit greatest(1, least(lim, 800)) loop
    select l.* into picked
    from public.apx_market_listings l
    where l.active and l.available_units > 0
      and l.category = n.preferred_category
      and l.unit_price <= n.budget
    order by -ln(greatest(random(), 0.000001)) / greatest(.05,
      ((1.15 - l.unit_price::numeric / nullif(n.budget, 0) * .35)
        + l.quality / 100 * .48
        + l.reputation / 100 * .24
        + least(1, l.available_units / 20) * .13)
      / (1 + coalesce((
        select count(*) from public.apx_market_transactions t
        where t.seller_id = l.seller_user_id
          and t.created_at > now() - interval '30 minutes'
      ), 0) * .28)
    ) asc
    limit 1 for update;
    if not found then continue; end if;

    v_qty := least(1::numeric, picked.available_units);
    v_total := picked.unit_price;
    begin
      perform public.apx_market_credit_sale(picked.seller_user_id, picked.company_id, picked.product_id, v_qty, v_total);
      update public.apx_market_listings
      set available_units = available_units - v_qty, updated_at = now()
      where id = picked.id;
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

select cron.unschedule(jobid)
from cron.job
where jobname = 'apx-market-npc-batch-every-five-minutes';

select cron.schedule(
  'apx-market-npc-batch-every-five-minutes',
  '*/5 * * * *',
  'select public.apx_market_run_npc_batch(800);'
);

commit;
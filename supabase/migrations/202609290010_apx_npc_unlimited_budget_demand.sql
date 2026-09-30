begin;

do $$
begin
  if to_regclass('public.apx_market_npcs') is null
     or to_regclass('public.apx_market_listings') is null
     or to_regclass('public.apx_market_transactions') is null
     or to_regprocedure('public.apx_market_credit_sale(uuid,text,text,numeric,bigint)') is null
     or to_regprocedure('public.apx_market_run_npc_batch(integer)') is null then
    raise exception 'Apply APX marketplace migrations 007 and 009 before enabling unlimited NPC demand.';
  end if;
end;
$$;

update public.apx_market_npcs
set budget = 9223372036854775807;

create or replace function public.apx_market_run_npc_batch(lim integer default 800)
returns integer language plpgsql security definer set search_path = '' as $$
declare n record; picked record; v_count integer := 0; v_qty numeric; v_total bigint;
begin
  for n in select * from public.apx_market_npcs order by random() limit greatest(1, least(lim, 800)) loop
    select l.* into picked
    from public.apx_market_listings l
    where l.active and l.available_units > 0
    order by random()
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
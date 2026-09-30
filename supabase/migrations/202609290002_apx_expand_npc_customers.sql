begin;

do $$
begin
  if to_regclass('public.apx_market_npcs') is null
     or to_regprocedure('public.apx_market_run_npc_batch(integer)') is null then
    raise exception 'Apply the APX marketplace migration before expanding NPC customers.';
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
from generate_series(241, 2400) as g
on conflict (display_code) do nothing;

select cron.unschedule(jobid)
from cron.job
where jobname = 'apx-market-npc-batch-every-five-minutes';

select cron.schedule(
  'apx-market-npc-batch-every-five-minutes',
  '*/5 * * * *',
  'select public.apx_market_run_npc_batch(80);'
);

commit;
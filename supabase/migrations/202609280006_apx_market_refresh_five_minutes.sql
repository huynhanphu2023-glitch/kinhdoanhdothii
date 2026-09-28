-- Keep simulated stock and fund prices on the same five-minute system clock,
-- even when no player has the investment page open.
do $$
begin
  if to_regprocedure('public.apx_investment_refresh_market()') is null then
    raise exception 'APX investment market function is missing; apply the investments migration first.';
  end if;
end;
$$;

create or replace function public.apx_investment_refresh_market()
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_bucket_start timestamptz := to_timestamp(floor(extract(epoch from now()) / 300) * 300);
begin
  update public.apx_investment_assets a
  set previous_price = a.current_price,
      current_price = greatest(100, round(a.current_price * (1 + ((random() * 2 - 1) * a.volatility::double precision)))::bigint),
      price_updated_at = now()
  where a.asset_type in ('stock','fund') and a.is_active
    and a.price_updated_at < v_bucket_start;
end;
$$;

revoke all on function public.apx_investment_refresh_market() from public, anon, authenticated;
grant execute on function public.apx_investment_refresh_market() to authenticated;

-- Supabase runs this job at every wall-clock five-minute boundary.
create extension if not exists pg_cron with schema pg_catalog;

do $$
declare
  v_job_id bigint;
begin
  for v_job_id in select jobid from cron.job where jobname = 'apx-refresh-market-every-five-minutes'
  loop
    perform cron.unschedule(v_job_id);
  end loop;

  perform cron.schedule(
    'apx-refresh-market-every-five-minutes',
    '*/5 * * * *',
    'select public.apx_investment_refresh_market();'
  );
end;
$$;

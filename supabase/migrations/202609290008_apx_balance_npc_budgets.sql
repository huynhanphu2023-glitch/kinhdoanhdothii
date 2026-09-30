begin;

do $$
begin
  if to_regclass('public.apx_market_npcs') is null then
    raise exception 'Apply APX marketplace migration 007 before balancing NPC budgets.';
  end if;
end;
$$;

update public.apx_market_npcs
set budget = case preferred_category
  when 'technology' then (array[2500000, 3500000, 5000000, 8000000])[(display_code::integer % 4) + 1]
  when 'real-estate' then (array[3000000, 5000000, 8000000, 10000000])[(display_code::integer % 4) + 1]
  else (array[500000, 1000000, 3000000, 5000000])[(display_code::integer % 4) + 1]
end
where display_code ~ '^[0-9]+$';

commit;
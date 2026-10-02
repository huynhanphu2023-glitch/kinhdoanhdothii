begin;

do $$
begin
  if to_regclass('public.apx_redeem_codes') is null
     or to_regclass('public.apx_redeem_claims') is null
     or to_regprocedure('public.apx_redeem_voucher(text)') is null
     or not exists (
       select 1 from information_schema.columns
       where table_schema = 'public' and table_name = 'apx_redeem_codes' and column_name = 'cash_reward'
     )
     or not exists (
       select 1 from information_schema.columns
       where table_schema = 'public' and table_name = 'apx_redeem_codes' and column_name = 'max_redemptions'
     ) then
    raise exception 'Apply migration 202609290001_apx_cash_giftcodes.sql before issuing this code.';
  end if;
end;
$$;

insert into public.apx_redeem_codes(
  code_hash,
  code_kind,
  ticket_count,
  cash_reward,
  max_redemptions,
  is_active
)
values (
  encode(extensions.digest('APX10TY2026', 'sha256'), 'hex'),
  'shared',
  1,
  10000000000,
  100,
  true
)
on conflict (code_hash) do nothing;

commit;
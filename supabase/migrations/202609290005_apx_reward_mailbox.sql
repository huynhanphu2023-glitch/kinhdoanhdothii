begin;

do $$
begin
  if to_regclass('public.apx_game_saves') is null
     or to_regclass('public.apx_redeem_codes') is null
     or to_regclass('public.apx_redeem_claims') is null
     or to_regprocedure('public.apx_redeem_voucher(text)') is null then
    raise exception 'Apply APX account and voucher migrations before creating the reward mailbox.';
  end if;
end;
$$;

create table if not exists public.apx_reward_mail (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  code_hash text references public.apx_redeem_codes(code_hash) on delete set null,
  subject text not null,
  body text not null,
  cash_reward bigint not null default 0 check (cash_reward between 0 and 9007199254740991),
  created_at timestamptz not null default now(),
  claimed_at timestamptz,
  unique (user_id, code_hash)
);

create index if not exists apx_reward_mail_user_created_idx
  on public.apx_reward_mail(user_id, created_at desc);

alter table public.apx_reward_mail enable row level security;
revoke all on public.apx_reward_mail from public, anon, authenticated;

create or replace function public.apx_reward_mail_list()
returns table (id bigint, subject text, body text, cash_reward bigint, created_at timestamptz, claimed_at timestamptz)
language plpgsql stable security definer set search_path = '' as $$
begin
  if (select auth.uid()) is null or not public.apx_user_can_play() then
    raise exception 'Đăng nhập trước khi mở hộp thư.';
  end if;
  return query
    select m.id, m.subject, m.body, m.cash_reward, m.created_at, m.claimed_at
    from public.apx_reward_mail m
    where m.user_id = (select auth.uid())
    order by m.created_at desc
    limit 100;
end;
$$;

create or replace function public.apx_reward_mail_claim(p_mail_id bigint)
returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  v_user uuid := (select auth.uid());
  v_mail public.apx_reward_mail%rowtype;
  v_state jsonb;
  v_cash bigint;
begin
  if v_user is null or not public.apx_user_can_play() then
    raise exception 'Đăng nhập trước khi nhận quà.';
  end if;
  select * into v_mail
  from public.apx_reward_mail
  where id = p_mail_id and user_id = v_user
  for update;
  if not found then raise exception 'Không tìm thấy thư quà tặng.'; end if;
  if v_mail.claimed_at is not null then raise exception 'Thư này đã được nhận rồi.'; end if;

  select game_state into v_state
  from public.apx_game_saves
  where user_id = v_user
  for update;
  if v_state is null then raise exception 'Không tìm thấy bản lưu game.'; end if;

  v_cash := coalesce((v_state ->> 'cash')::bigint, 0);
  if v_cash > 9007199254740991 - v_mail.cash_reward then
    raise exception 'Số dư vượt giới hạn hỗ trợ.';
  end if;
  v_cash := v_cash + v_mail.cash_reward;
  v_state := jsonb_set(v_state, '{cash}', to_jsonb(v_cash), true);

  update public.apx_game_saves
  set game_state = v_state, revision = revision + 1, updated_at = now()
  where user_id = v_user;
  update public.apx_reward_mail set claimed_at = now() where id = v_mail.id;

  return jsonb_build_object('ok', true, 'cash', v_cash, 'granted_cash', v_mail.cash_reward);
end;
$$;

revoke all on function public.apx_reward_mail_list(), public.apx_reward_mail_claim(bigint) from public, anon;
grant execute on function public.apx_reward_mail_list(), public.apx_reward_mail_claim(bigint) to authenticated;

do $$
declare
  v_hash text := encode(extensions.digest('APX10TY2026', 'sha256'), 'hex');
begin
  if not exists (
    select 1 from public.apx_redeem_codes
    where code_hash = v_hash and cash_reward = 10000000000
  ) then
    raise exception 'APX10TY2026 is missing or does not have the expected cash reward.';
  end if;

  insert into public.apx_reward_mail(user_id, code_hash, subject, body, cash_reward)
  select c.user_id, v_hash, 'Quà đền bù APX',
    'Xin lỗi vì sự cố khi đổi mã APX10TY2026. Bạn có thể nhận 10 tỷ tại thư này.',
    10000000000
  from public.apx_redeem_claims c
  where c.code_hash = v_hash
    and not exists (
      select 1 from public.apx_redeem_cash_corrections correction
      where correction.user_id = c.user_id and correction.code_hash = v_hash
    )
  on conflict (user_id, code_hash) do nothing;
end;
$$;

commit;
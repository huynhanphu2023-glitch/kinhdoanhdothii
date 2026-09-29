begin;

alter table public.apx_redeem_codes
  add column cash_reward bigint not null default 0
    check (cash_reward between 0 and 9007199254740991),
  add column max_redemptions integer
    check (max_redemptions is null or max_redemptions > 0);

create or replace function public.apx_redeem_voucher(p_code text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := (select auth.uid());
  v_code public.apx_redeem_codes%rowtype;
  v_normalized text;
  v_hash text;
  v_state jsonb;
  v_inventory jsonb;
  v_current integer;
  v_total integer;
  v_cash bigint;
  v_rows integer;
begin
  if v_user is null then raise exception 'Đăng nhập trước khi đổi mã.'; end if;
  if not public.apx_user_can_play() then raise exception 'Tài khoản hiện không thể đổi mã.'; end if;
  v_normalized := regexp_replace(upper(coalesce(p_code, '')), '[^A-Z0-9]', '', 'g');
  if length(v_normalized) < 6 or length(v_normalized) > 40 then raise exception 'Mã đổi quà không hợp lệ.'; end if;

  v_hash := encode(extensions.digest(v_normalized, 'sha256'), 'hex');
  select c.* into v_code
  from public.apx_redeem_codes c
  where c.code_hash = v_hash and c.is_active
  for update;
  if not found then raise exception 'Mã không tồn tại hoặc đã bị vô hiệu hóa.'; end if;
  if v_code.code_kind = 'single_use' and v_code.redeemed_at is not null then
    raise exception 'Mã riêng này đã được sử dụng.';
  end if;
  if exists (select 1 from public.apx_redeem_claims where user_id = v_user and code_hash = v_hash) then
    raise exception 'Tài khoản đã đổi mã này rồi.';
  end if;
  if v_code.max_redemptions is not null and
     (select count(*) from public.apx_redeem_claims where code_hash = v_hash) >= v_code.max_redemptions then
    raise exception 'Mã quà tặng đã hết lượt đổi.';
  end if;

  select s.game_state into v_state
  from public.apx_game_saves s
  where s.user_id = v_user
  for update;
  if v_state is null then raise exception 'Tài khoản chưa có bản lưu game trên Supabase.'; end if;

  insert into public.apx_redeem_claims(user_id, code_hash, ticket_count)
  values (v_user, v_hash, v_code.ticket_count)
  on conflict (user_id, code_hash) do nothing;
  get diagnostics v_rows = row_count;
  if v_rows = 0 then raise exception 'Tài khoản đã đổi mã này rồi.'; end if;

  if v_code.code_kind = 'single_use' then
    update public.apx_redeem_codes
    set redeemed_by = v_user, redeemed_at = now()
    where code_hash = v_hash;
  end if;

  if v_code.cash_reward > 0 then
    v_cash := coalesce((v_state ->> 'cash')::bigint, 0);
    if v_cash > 9007199254740991 - v_code.cash_reward then
      raise exception 'Số dư vượt giới hạn hỗ trợ.';
    end if;
    v_cash := v_cash + v_code.cash_reward;
    v_state := jsonb_set(v_state, '{cash}', to_jsonb(v_cash), true);
  else
    v_inventory := case
      when jsonb_typeof(v_state -> 'inventory') = 'object' then v_state -> 'inventory'
      else '{}'::jsonb
    end;
    v_current := greatest(0, coalesce((v_inventory ->> 'recruitment-ticket')::integer, 0));
    v_total := v_current + v_code.ticket_count;
    v_inventory := jsonb_set(v_inventory, '{recruitment-ticket}', to_jsonb(v_total), true);
    v_state := jsonb_set(v_state, '{inventory}', v_inventory, true);
  end if;

  update public.apx_game_saves
  set game_state = v_state, revision = revision + 1, updated_at = now()
  where user_id = v_user;

  return jsonb_build_object(
    'ok', true,
    'ticket_count', v_total,
    'granted', v_code.ticket_count,
    'cash', v_cash,
    'granted_cash', v_code.cash_reward,
    'reward_type', case when v_code.cash_reward > 0 then 'cash' else 'ticket' end,
    'code_kind', v_code.code_kind
  );
end;
$$;

revoke all on function public.apx_redeem_voucher(text) from public, anon, authenticated;
grant execute on function public.apx_redeem_voucher(text) to authenticated;

commit;
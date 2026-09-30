-- Route existing voucher rewards to the new recruitment-ticket inventory item.
-- APXVE2026 remains account-limited by apx_redeem_claims and now grants 10 tickets.
begin;

do $$
declare
  v_shared_code_count integer;
begin
  if to_regclass('public.apx_game_saves') is null
     or to_regclass('public.apx_redeem_codes') is null
     or to_regclass('public.apx_redeem_claims') is null
     or to_regprocedure('public.apx_redeem_voucher(text)') is null then
    raise exception 'APX save/voucher objects are missing; inspect the database before applying this migration.';
  end if;

  select count(*) into v_shared_code_count
  from public.apx_redeem_codes
  where code_hash = '81b4161ee1660c88146322b04470bf1d5c14fbb9b499e771b93542737ffd6c51'
    and code_kind = 'shared';

  if v_shared_code_count <> 1 then
    raise exception 'The expected APXVE2026 shared code was not found exactly once.';
  end if;
end;
$$;

update public.apx_redeem_codes
set ticket_count = 10
where code_hash = '81b4161ee1660c88146322b04470bf1d5c14fbb9b499e771b93542737ffd6c51'
  and code_kind = 'shared';

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

  v_inventory := case
    when jsonb_typeof(v_state -> 'inventory') = 'object' then v_state -> 'inventory'
    else '{}'::jsonb
  end;
  v_current := greatest(0, coalesce((v_inventory ->> 'recruitment-ticket')::integer, 0));
  v_total := v_current + v_code.ticket_count;
  v_inventory := jsonb_set(v_inventory, '{recruitment-ticket}', to_jsonb(v_total), true);
  v_state := jsonb_set(v_state, '{inventory}', v_inventory, true);

  update public.apx_game_saves
  set game_state = v_state, revision = revision + 1, updated_at = now()
  where user_id = v_user;

  return jsonb_build_object(
    'ok', true,
    'ticket_count', v_total,
    'granted', v_code.ticket_count,
    'code_kind', v_code.code_kind
  );
end;
$$;

revoke all on function public.apx_redeem_voucher(text) from public, anon, authenticated;
grant execute on function public.apx_redeem_voucher(text) to authenticated;

commit;

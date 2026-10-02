-- Atomic APXBank player-to-player transfers. Banking state remains in the
-- existing versioned game save; this RPC is the only cross-account writer.

create table if not exists public.apx_bank_transfer_requests (
  request_id uuid primary key,
  sender_id uuid not null references auth.users(id) on delete cascade,
  recipient_id uuid not null references auth.users(id) on delete cascade,
  amount bigint not null check (amount > 0),
  memo text not null default '',
  sender_balance_after bigint not null,
  created_at timestamptz not null default now()
);

alter table public.apx_bank_transfer_requests enable row level security;
revoke all on public.apx_bank_transfer_requests from anon, authenticated;

create or replace function public.apx_bank_prepend_entry(p_list jsonb, p_entry jsonb)
returns jsonb
language sql immutable set search_path = '' as $$
  select coalesce(jsonb_agg(item order by ordinal), '[]'::jsonb)
  from jsonb_array_elements(
    jsonb_build_array(p_entry) ||
    case when jsonb_typeof(p_list) = 'array' then p_list else '[]'::jsonb end
  ) with ordinality as items(item, ordinal)
  where ordinal <= 200;
$$;
revoke all on function public.apx_bank_prepend_entry(jsonb, jsonb) from public, anon, authenticated;

create or replace function public.apx_bank_transfer(
  p_recipient_character_id uuid,
  p_amount bigint,
  p_memo text,
  p_request_id uuid
)
returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  v_sender uuid := (select auth.uid());
  v_recipient uuid;
  v_sender_state jsonb;
  v_recipient_state jsonb;
  v_sender_bank jsonb;
  v_recipient_bank jsonb;
  v_sender_balance bigint;
  v_recipient_balance bigint;
  v_sender_after bigint;
  v_recipient_after bigint;
  v_memo text := left(btrim(coalesce(p_memo, '')), 120);
  v_recipient_name text;
  v_request public.apx_bank_transfer_requests%rowtype;
  v_now timestamptz := clock_timestamp();
  v_day integer;
  v_sender_tx jsonb;
  v_recipient_tx jsonb;
  v_sender_notice jsonb;
  v_recipient_notice jsonb;
begin
  if v_sender is null or not public.apx_user_can_play() then
    raise exception 'Đăng nhập tài khoản APX để chuyển tiền.';
  end if;
  if p_amount is null or p_amount <= 0 or p_amount > 9007199254740991 then
    raise exception 'Số tiền chuyển không hợp lệ.';
  end if;
  if p_request_id is null then raise exception 'Thiếu mã giao dịch.'; end if;

  select p.user_id, p.display_name into v_recipient, v_recipient_name
  from public.apx_player_profiles p
  where p.character_id = p_recipient_character_id and not p.is_banned;
  if v_recipient is null then raise exception 'Không tìm thấy tài khoản người nhận đang hoạt động.'; end if;
  if v_recipient = v_sender then raise exception 'Không thể chuyển tiền cho chính mình.'; end if;

  -- Lock both saves in a stable order so opposite-direction transfers cannot deadlock.
  perform 1 from public.apx_game_saves s
  where s.user_id in (v_sender, v_recipient)
  order by s.user_id for update;
  select s.game_state into v_sender_state from public.apx_game_saves s where s.user_id = v_sender;
  select s.game_state into v_recipient_state from public.apx_game_saves s where s.user_id = v_recipient;
  if v_sender_state is null or v_recipient_state is null then raise exception 'Một tài khoản chưa có tiến trình APX.'; end if;

  select * into v_request from public.apx_bank_transfer_requests r where r.request_id = p_request_id;
  if found then
    if v_request.sender_id <> v_sender or v_request.recipient_id <> v_recipient or v_request.amount <> p_amount then
      raise exception 'Mã giao dịch đã được dùng cho yêu cầu khác.';
    end if;
    return jsonb_build_object('ok', true, 'duplicate', true, 'amount', p_amount,
      'sender_balance', v_request.sender_balance_after, 'recipient_name', v_recipient_name);
  end if;

  v_sender_bank := coalesce(v_sender_state -> 'apxBank', '{}'::jsonb);
  v_recipient_bank := coalesce(v_recipient_state -> 'apxBank', '{}'::jsonb);
  if coalesce(v_sender_bank ->> 'accountBalance', '0') !~ '^[0-9]{1,18}$' then raise exception 'Số dư APXBank không hợp lệ.'; end if;
  if coalesce(v_recipient_bank ->> 'accountBalance', '0') !~ '^[0-9]{1,18}$' then raise exception 'Số dư người nhận không hợp lệ.'; end if;
  v_sender_balance := coalesce((v_sender_bank ->> 'accountBalance')::bigint, 0);
  v_recipient_balance := coalesce((v_recipient_bank ->> 'accountBalance')::bigint, 0);
  if v_sender_balance < p_amount then raise exception 'Số dư APXBank không đủ.'; end if;
  if v_recipient_balance > 9007199254740991 - p_amount then raise exception 'Số dư người nhận vượt giới hạn.'; end if;
  v_sender_after := v_sender_balance - p_amount;
  v_recipient_after := v_recipient_balance + p_amount;
  v_day := greatest(1, coalesce(nullif(v_sender_state ->> 'day', '')::integer, 1));

  v_sender_tx := jsonb_build_object('id', p_request_id::text, 'type', 'transfer-out', 'amount', -p_amount,
    'direction', 'out', 'memo', coalesce(v_memo, ''), 'gameDay', v_day, 'createdAt', v_now,
    'balanceAfter', v_sender_after, 'walletAfter', coalesce((v_sender_state ->> 'cash')::bigint, 0), 'recipientId', p_recipient_character_id::text);
  v_recipient_tx := jsonb_build_object('id', p_request_id::text || '-in', 'type', 'transfer-in', 'amount', p_amount,
    'direction', 'in', 'memo', case when v_memo = '' then 'Chuyển từ ' || coalesce((select display_name from public.apx_player_profiles where user_id = v_sender), 'Người chơi') else v_memo end,
    'gameDay', greatest(1, coalesce(nullif(v_recipient_state ->> 'day', '')::integer, 1)), 'createdAt', v_now,
    'balanceAfter', v_recipient_after, 'walletAfter', coalesce((v_recipient_state ->> 'cash')::bigint, 0), 'senderId', v_sender::text);
  v_sender_notice := jsonb_build_object('id', p_request_id::text, 'type', 'transfer', 'title', 'Đã chuyển tiền',
    'message', 'Đã chuyển ' || p_amount::text || ' cho ' || v_recipient_name || '.', 'createdAt', v_now, 'gameDay', v_day, 'read', false);
  v_recipient_notice := jsonb_build_object('id', p_request_id::text || '-in', 'type', 'transfer', 'title', 'Đã nhận tiền',
    'message', 'Bạn đã nhận ' || p_amount::text || ' từ một người chơi APX.', 'createdAt', v_now,
    'gameDay', greatest(1, coalesce(nullif(v_recipient_state ->> 'day', '')::integer, 1)), 'read', false);

  v_sender_bank := jsonb_set(v_sender_bank, '{accountBalance}', to_jsonb(v_sender_after), true);
  v_sender_bank := jsonb_set(v_sender_bank, '{totalSpent}', to_jsonb(coalesce((v_sender_bank ->> 'totalSpent')::bigint, 0) + p_amount), true);
  v_sender_bank := jsonb_set(v_sender_bank, '{transactions}', public.apx_bank_prepend_entry(v_sender_bank -> 'transactions', v_sender_tx), true);
  v_sender_bank := jsonb_set(v_sender_bank, '{notifications}', public.apx_bank_prepend_entry(v_sender_bank -> 'notifications', v_sender_notice), true);
  v_recipient_bank := jsonb_set(v_recipient_bank, '{accountBalance}', to_jsonb(v_recipient_after), true);
  v_recipient_bank := jsonb_set(v_recipient_bank, '{totalReceived}', to_jsonb(coalesce((v_recipient_bank ->> 'totalReceived')::bigint, 0) + p_amount), true);
  v_recipient_bank := jsonb_set(v_recipient_bank, '{transactions}', public.apx_bank_prepend_entry(v_recipient_bank -> 'transactions', v_recipient_tx), true);
  v_recipient_bank := jsonb_set(v_recipient_bank, '{notifications}', public.apx_bank_prepend_entry(v_recipient_bank -> 'notifications', v_recipient_notice), true);
  v_sender_state := jsonb_set(v_sender_state, '{apxBank}', v_sender_bank, true);
  v_recipient_state := jsonb_set(v_recipient_state, '{apxBank}', v_recipient_bank, true);

  update public.apx_game_saves set game_state = v_sender_state, revision = revision + 1, updated_at = v_now where user_id = v_sender;
  update public.apx_game_saves set game_state = v_recipient_state, revision = revision + 1, updated_at = v_now where user_id = v_recipient;
  insert into public.apx_bank_transfer_requests(request_id, sender_id, recipient_id, amount, memo, sender_balance_after, created_at)
  values (p_request_id, v_sender, v_recipient, p_amount, coalesce(v_memo, ''), v_sender_after, v_now);

  return jsonb_build_object('ok', true, 'duplicate', false, 'amount', p_amount,
    'sender_balance', v_sender_after, 'recipient_name', v_recipient_name, 'created_at', v_now);
end;
$$;

revoke all on function public.apx_bank_transfer(uuid, bigint, text, uuid) from public, anon;
grant execute on function public.apx_bank_transfer(uuid, bigint, text, uuid) to authenticated;

comment on table public.apx_bank_transfer_requests is 'Idempotency and audit records for atomic APXBank player transfers.';

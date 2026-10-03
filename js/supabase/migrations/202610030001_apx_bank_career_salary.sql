-- Credit completed career wages directly to the server-owned APXBank account.
-- A stable shift id makes retries safe and prevents duplicate salary credits.
create or replace function public.apx_bank_career_salary(
  p_shift_id text,
  p_amount bigint,
  p_memo text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := (select auth.uid());
  v_state jsonb;
  v_bank jsonb;
  v_history jsonb;
  v_result jsonb;
  v_transactions jsonb;
  v_balance numeric(24,2);
  v_total_received numeric(24,2);
  v_amount numeric(24,2);
  v_day integer;
  v_now timestamptz := clock_timestamp();
  v_tx jsonb;
  v_notice jsonb;
  v_revision bigint;
begin
  if v_user is null or not public.apx_user_can_play() then
    raise exception 'Đăng nhập tài khoản APX để nhận lương.';
  end if;
  if p_shift_id is null or length(btrim(p_shift_id)) < 1 or length(p_shift_id) > 100
    or p_amount is null or p_amount <= 0 or p_amount > 1000000 then
    raise exception 'Thông tin lương ca làm không hợp lệ.';
  end if;

  select game_state, revision into v_state, v_revision
  from public.apx_game_saves where user_id = v_user for update;
  if not found then raise exception 'Không tìm thấy tiến trình người chơi.'; end if;

  v_bank := coalesce(v_state -> 'apxBank', '{}'::jsonb);
  v_transactions := case
    when jsonb_typeof(v_bank -> 'transactions') = 'array' then v_bank -> 'transactions'
    else '[]'::jsonb
  end;

  if exists (
    select 1 from jsonb_array_elements(v_transactions) as tx(entry)
    where entry ->> 'id' = p_shift_id and entry ->> 'type' = 'salary'
  ) then
    return jsonb_build_object('game_state', v_state, 'revision', v_revision, 'duplicate', true);
  end if;

  v_history := case
    when jsonb_typeof(v_state #> '{career,history}') = 'array' then v_state #> '{career,history}'
    else '[]'::jsonb
  end;
  select item into v_result
  from jsonb_array_elements(v_history) as entries(item)
  where item ->> 'id' = p_shift_id
  limit 1;
  if v_result is null then
    raise exception 'Không tìm thấy kết quả ca đã hoàn thành để trả lương.';
  end if;
  if coalesce(v_result ->> 'salaryEarned', v_result ->> 'pay', '') !~ '^[0-9]{1,7}$' then
    raise exception 'Số tiền lương trong kết quả ca không hợp lệ.';
  end if;
  v_amount := coalesce((v_result ->> 'salaryEarned')::numeric, (v_result ->> 'pay')::numeric);
  if v_amount <> p_amount then raise exception 'Số tiền yêu cầu không khớp với kết quả ca.'; end if;
  if coalesce(v_result ->> 'day', '') !~ '^[0-9]{1,9}$' then
    raise exception 'Ngày game của ca làm không hợp lệ.';
  end if;
  v_day := greatest(1, (v_result ->> 'day')::integer);

  v_balance := coalesce(nullif(v_bank ->> 'accountBalance', '')::numeric, 0);
  v_total_received := coalesce(nullif(v_bank ->> 'totalReceived', '')::numeric, 0);
  if v_balance < 0 or v_balance > 9007199254740991 - v_amount then
    raise exception 'Số dư APXBank vượt giới hạn.';
  end if;
  v_balance := v_balance + v_amount;
  v_total_received := v_total_received + v_amount;

  v_tx := jsonb_build_object(
    'id', p_shift_id,
    'type', 'salary',
    'amount', v_amount,
    'direction', 'in',
    'memo', left(coalesce(nullif(btrim(p_memo), ''), 'Lương ca làm tại ' || coalesce(v_result ->> 'employer', 'đơn vị tuyển dụng')), 120),
    'gameDay', v_day,
    'createdAt', v_now,
    'balanceAfter', v_balance,
    'walletAfter', coalesce((v_state ->> 'cash')::numeric, 0)
  );
  v_notice := jsonb_build_object(
    'id', p_shift_id || '-salary',
    'type', 'income',
    'title', 'Đã nhận lương',
    'message', coalesce(v_tx ->> 'memo', 'Lương ca làm') || ' · ' || v_amount::text || ' đã vào APXBank.',
    'createdAt', v_now,
    'gameDay', v_day,
    'read', false
  );

  v_bank := jsonb_set(v_bank, '{accountBalance}', to_jsonb(v_balance), true);
  v_bank := jsonb_set(v_bank, '{totalReceived}', to_jsonb(v_total_received), true);
  v_bank := jsonb_set(v_bank, '{transactions}', public.apx_bank_prepend_entry(v_transactions, v_tx), true);
  v_bank := jsonb_set(v_bank, '{notifications}', public.apx_bank_prepend_entry(
    case when jsonb_typeof(v_bank -> 'notifications') = 'array' then v_bank -> 'notifications' else '[]'::jsonb end,
    v_notice
  ), true);
  v_bank := jsonb_set(v_bank, '{observedCash}', to_jsonb(greatest(0, coalesce((v_state ->> 'cash')::numeric, 0))), true);
  v_state := jsonb_set(v_state, '{apxBank}', v_bank, true);

  update public.apx_game_saves
  set game_state = v_state, revision = v_revision + 1, updated_at = v_now
  where user_id = v_user;
  return jsonb_build_object('game_state', v_state, 'revision', v_revision + 1, 'duplicate', false);
end;
$$;

revoke all on function public.apx_bank_career_salary(text, bigint, text) from public, anon;
grant execute on function public.apx_bank_career_salary(text, bigint, text) to authenticated;

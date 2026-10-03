create table if not exists public.apx_quest_reward_claims (
  user_id uuid not null references auth.users(id) on delete cascade,
  quest_id text not null,
  cash_amount bigint not null,
  career_exp integer not null,
  character_exp integer not null,
  claimed_at timestamptz not null default clock_timestamp(),
  primary key (user_id, quest_id),
  check (quest_id ~ '^personal_work_[0-9]{3}$')
);

alter table public.apx_quest_reward_claims enable row level security;
revoke all on table public.apx_quest_reward_claims from public, anon, authenticated;

create or replace function public.apx_quest_claim_reward(p_quest_id text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := (select auth.uid());
  v_state jsonb;
  v_quests jsonb;
  v_records jsonb;
  v_record jsonb;
  v_history jsonb;
  v_cash_reward bigint;
  v_career_reward integer;
  v_character_reward integer;
  v_shift_target integer;
  v_quest_index integer;
  v_cash numeric(24, 2);
  v_career_xp numeric;
  v_character_xp numeric;
  v_threshold numeric;
  v_level integer;
  v_level_data jsonb;
  v_character jsonb;
  v_career jsonb;
  v_revision bigint;
  v_now timestamptz := clock_timestamp();
  v_inserted integer;
  v_legacy_experience boolean;
  v_duplicate boolean := false;
begin
  if v_user is null or not public.apx_user_can_play() then
    raise exception 'Đăng nhập tài khoản APX để nhận thưởng nhiệm vụ.';
  end if;
  if p_quest_id is null or p_quest_id !~ '^personal_work_[0-9]{3}$' then
    raise exception 'Mã nhiệm vụ không hợp lệ.';
  end if;

  v_quest_index := substring(p_quest_id from '([0-9]{3})$')::integer;
  if v_quest_index < 1 or v_quest_index > 103 then
    raise exception 'Không tìm thấy nhiệm vụ này.';
  end if;

  if v_quest_index <= 5 then
    v_shift_target := case v_quest_index
      when 1 then 1
      when 2 then 3
      when 3 then 5
      when 4 then 10
      else 20
    end;
    v_career_reward := case v_quest_index
      when 1 then 100
      when 2 then 150
      when 3 then 200
      when 4 then 300
      else 500
    end;
  else
    v_shift_target := (v_quest_index - 3) * 10;
    v_career_reward := 500 + ((v_shift_target - 20) / 10) * 100;
  end if;
  v_cash_reward := greatest(20000, v_shift_target::bigint * 20000);
  v_character_reward := v_career_reward;

  select game_state, revision into v_state, v_revision
  from public.apx_game_saves
  where user_id = v_user
  for update;
  if not found then raise exception 'Không tìm thấy tiến trình người chơi.'; end if;

  v_quests := case
    when jsonb_typeof(v_state -> 'quests') = 'object' then v_state -> 'quests'
    else '{}'::jsonb
  end;
  v_records := case
    when jsonb_typeof(v_quests -> 'records') = 'object' then v_quests -> 'records'
    else '{}'::jsonb
  end;
  v_record := v_records -> p_quest_id;
  if v_record is null or v_record ->> 'status' <> 'COMPLETED' then
    raise exception 'Nhiệm vụ chưa hoàn thành.';
  end if;

  v_legacy_experience := coalesce(v_record ->> 'legacyExperienceClaimed', 'false') = 'true';
  if v_legacy_experience then
    v_career_reward := 0;
    v_character_reward := 0;
  end if;

  insert into public.apx_quest_reward_claims (
    user_id, quest_id, cash_amount, career_exp, character_exp
  ) values (
    v_user, p_quest_id, v_cash_reward, v_career_reward, v_character_reward
  )
  on conflict (user_id, quest_id) do nothing;
  get diagnostics v_inserted = row_count;

  if v_inserted = 0 then
    v_duplicate := true;
    v_cash_reward := 0;
    v_career_reward := 0;
    v_character_reward := 0;
  end if;

  v_cash := coalesce(nullif(v_state ->> 'cash', '')::numeric, 0);
  if v_cash < 0 or v_cash > 9007199254740991 - v_cash_reward then
    raise exception 'Số dư tiền cá nhân vượt giới hạn.';
  end if;
  v_state := jsonb_set(v_state, '{cash}', to_jsonb(v_cash + v_cash_reward), true);

  v_record := jsonb_set(v_record, '{rewardClaimed}', 'true'::jsonb, true);
  v_record := jsonb_set(v_record, '{rewardClaimedAt}', to_jsonb(v_now), true);
  v_records := jsonb_set(v_records, array[p_quest_id], v_record, true);
  v_quests := jsonb_set(v_quests, '{records}', v_records, true);

  v_history := case
    when jsonb_typeof(v_quests -> 'history') = 'array' then v_quests -> 'history'
    else '[]'::jsonb
  end;
  select coalesce(jsonb_agg(
    case when item ->> 'questId' = p_quest_id then
      jsonb_set(jsonb_set(item, '{rewardClaimed}', 'true'::jsonb, true), '{rewardClaimedAt}', to_jsonb(v_now), true)
    else item end
    order by ordinal
  ), '[]'::jsonb)
  into v_history
  from jsonb_array_elements(v_history) with ordinality as entries(item, ordinal);
  v_quests := jsonb_set(v_quests, '{history}', v_history, true);
  v_state := jsonb_set(v_state, '{quests}', v_quests, true);

  if v_career_reward > 0 then
    v_career := case
      when jsonb_typeof(v_state -> 'career') = 'object' then v_state -> 'career'
      else '{}'::jsonb
    end;
    v_career_xp := greatest(0, coalesce(nullif(v_career ->> 'xp', '')::numeric, 0)) + v_career_reward;
    v_level := 1;
    while v_level < 100 loop
      v_threshold := case
        when v_level = 1 then 100
        when v_level = 2 then 465
        when v_level = 3 then 1300
        else 1300 * power(3::numeric, v_level - 3)
      end;
      exit when v_career_xp < v_threshold;
      v_level := v_level + 1;
    end loop;
    v_career := jsonb_set(v_career, '{xp}', to_jsonb(v_career_xp), true);
    v_career := jsonb_set(v_career, '{level}', to_jsonb(v_level), true);
    v_state := jsonb_set(v_state, '{career}', v_career, true);
  end if;

  if v_character_reward > 0 then
    v_character := case
      when jsonb_typeof(v_state -> 'character') = 'object' then v_state -> 'character'
      else '{}'::jsonb
    end;
    v_level_data := case
      when jsonb_typeof(v_character -> 'level') = 'object' then v_character -> 'level'
      else '{}'::jsonb
    end;
    v_character_xp := greatest(0, coalesce(nullif(v_level_data ->> 'totalXP', '')::numeric, 0)) + v_character_reward;
    v_level := 1;
    while v_level < 100 loop
      v_threshold := case
        when v_level = 1 then 100
        when v_level = 2 then 465
        when v_level = 3 then 1300
        else 1300 * power(3::numeric, v_level - 3)
      end;
      exit when v_character_xp < v_threshold;
      v_level := v_level + 1;
    end loop;
    v_threshold := case
      when v_level = 1 then 0
      when v_level = 2 then 100
      when v_level = 3 then 465
      when v_level = 4 then 1300
      else 1300 * power(3::numeric, v_level - 4)
    end;
    v_level_data := jsonb_set(v_level_data, '{current}', to_jsonb(v_level), true);
    v_level_data := jsonb_set(v_level_data, '{xp}', to_jsonb(v_character_xp - v_threshold), true);
    v_level_data := jsonb_set(v_level_data, '{xpToNext}', to_jsonb(case
      when v_level = 1 then 100
      when v_level = 2 then 365
      when v_level = 3 then 835
      else 2600 * power(3::numeric, v_level - 4)
    end), true);
    v_level_data := jsonb_set(v_level_data, '{totalXP}', to_jsonb(v_character_xp), true);
    v_character := jsonb_set(v_character, '{level}', v_level_data, true);
    v_character := jsonb_set(v_character, '{lastXPReason}', jsonb_build_object(
      'text', 'Nhận thưởng nhiệm vụ',
      'day', greatest(1, coalesce(nullif(v_state ->> 'day', '')::integer, 1)),
      'amount', v_character_reward
    ), true);
    v_state := jsonb_set(v_state, '{character}', v_character, true);
  end if;

  update public.apx_game_saves
  set game_state = v_state, revision = v_revision + 1, updated_at = v_now
  where user_id = v_user;

  return jsonb_build_object(
    'game_state', v_state,
    'revision', v_revision + 1,
    'duplicate', v_duplicate,
    'reward', jsonb_build_object(
      'cash', v_cash_reward,
      'careerExp', v_career_reward,
      'characterExp', v_character_reward
    )
  );
end;
$$;

revoke all on function public.apx_quest_claim_reward(text) from public, anon;
grant execute on function public.apx_quest_claim_reward(text) to authenticated;

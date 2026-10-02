-- Keep game-save edits from minting personal cash, while allowing legitimate
-- client-side purchases to debit the server-backed wallet. Credits must use a
-- dedicated server transaction (for example APX Life purchase/sale RPCs).
create or replace function public.apx_save_game_state(p_game_state jsonb, p_expected_revision bigint)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := (select auth.uid());
  v_state jsonb;
  v_revision bigint;
  v_old_cash numeric(24,2);
  v_requested_cash numeric(24,2);
begin
  if v_user is null or not public.apx_user_can_play() then
    raise exception 'Sign in to save game progress.';
  end if;
  if p_game_state is null or jsonb_typeof(p_game_state) <> 'object' then
    raise exception 'Invalid game save.';
  end if;
  if coalesce(p_game_state ->> 'cash', '') !~ '^[0-9]{1,18}(\.[0-9]{1,2})?$' then
    raise exception 'Personal cash must be a non-negative amount.';
  end if;

  select game_state, revision into v_state, v_revision
  from public.apx_game_saves where user_id = v_user for update;

  if not found then
    if p_expected_revision is distinct from 0 then
      raise exception 'Game save changed; reload before saving.';
    end if;
    v_state := jsonb_set(p_game_state, '{cash}', '1000000000'::jsonb, true);
    insert into public.apx_game_saves(user_id, game_state, revision, updated_at)
    values (v_user, v_state, 1, now())
    on conflict (user_id) do nothing;
    select game_state, revision into v_state, v_revision
    from public.apx_game_saves where user_id = v_user for update;
    if v_revision <> 1 then
      raise exception 'Game save changed; reload before saving.';
    end if;
    return jsonb_build_object('game_state', v_state, 'revision', v_revision);
  end if;

  if p_expected_revision is distinct from v_revision then
    raise exception 'Game save changed; reload before saving.';
  end if;

  v_old_cash := coalesce((v_state ->> 'cash')::numeric, 0);
  v_requested_cash := (p_game_state ->> 'cash')::numeric;
  -- Saving may spend cash, but cannot create cash. Increases are accepted only
  -- through server-owned transaction RPCs that validate their source.
  if v_requested_cash > v_old_cash then
    v_requested_cash := v_old_cash;
  end if;
  v_state := jsonb_set(p_game_state, '{cash}', to_jsonb(v_requested_cash), true);

  update public.apx_game_saves
  set game_state = v_state, revision = v_revision + 1, updated_at = now()
  where user_id = v_user;
  return jsonb_build_object('game_state', v_state, 'revision', v_revision + 1);
end;
$$;

revoke all on function public.apx_save_game_state(jsonb, bigint) from public, anon;
grant execute on function public.apx_save_game_state(jsonb, bigint) to authenticated;

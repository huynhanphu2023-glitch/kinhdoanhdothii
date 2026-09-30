import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, apikey, content-type", "Access-Control-Allow-Methods": "POST, OPTIONS", "Content-Type": "application/json" };
const reply = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: cors });
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ADMIN_FEATURES_ENABLED = false;

Deno.serve(async (request: Request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (request.method !== "POST") return reply({ error: "Method not allowed" }, 405);
  if (!ADMIN_FEATURES_ENABLED) {
    return reply({ error: "APX Admin features have been disabled." }, 410);
  }
  try {
    const url = Deno.env.get("SUPABASE_URL");
    const anon = Deno.env.get("SUPABASE_ANON_KEY");
    const secret = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!url || !anon || !secret) return reply({ error: "Server environment is incomplete" }, 500);
    const bearer = request.headers.get("Authorization") || "";
    const token = bearer.replace(/^Bearer\s+/i, "");
    if (!token || token === bearer) return reply({ error: "Authentication required" }, 401);
    const authClient = createClient(url, anon, { global: { headers: { Authorization: `Bearer ${token}` } }, auth: { persistSession: false } });
    const { data: auth, error: authError } = await authClient.auth.getUser(token);
    if (authError || !auth.user) return reply({ error: "Invalid session" }, 401);
    const db = createClient(url, secret, { auth: { persistSession: false } });
    const { data: adminRow, error: adminError } = await db.from("apx_admin_users").select("user_id").eq("user_id", auth.user.id).maybeSingle();
    if (adminError || !adminRow) return reply({ error: "Admin permission required" }, 403);
    const { data: caller } = await db.from("apx_player_profiles").select("is_banned").eq("user_id", auth.user.id).maybeSingle();
    if (caller?.is_banned) return reply({ error: "Admin account is locked" }, 403);
    const input = await request.json();
    const audit = async (action: string, target: string | null, detail: Record<string, unknown> = {}) => {
      const { error } = await db.from("apx_admin_audit").insert({ admin_id: auth.user!.id, action, target_user_id: target, detail });
      if (error) throw error;
    };
    const targetOk = typeof input.user_id === "string" && uuid.test(input.user_id);

    if (input.action === "overview") {
      const [total, players, reports] = await Promise.all([
        db.from("apx_player_profiles").select("user_id", { count: "exact", head: true }),
        db.from("apx_player_profiles").select("user_id,character_id,display_name,avatar_url,is_banned,created_at").order("created_at", { ascending: false }).limit(40),
        db.from("apx_player_reports").select("id,reporter_id,target_user_id,category,description,status,created_at").in("status", ["new", "reviewing"]).order("created_at", { ascending: false }).limit(50)
      ]);
      for (const result of [total, players, reports]) if (result.error) throw result.error;
      return reply({ total_accounts: total.count || 0, players: players.data || [], reports: reports.data || [] });
    }
    if (input.action === "create_cash_giftcode") {
      const code = String(input.code || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
      const maxAccounts = input.max_accounts;
      if (code.length < 6 || code.length > 40) return reply({ error: "Giftcode must contain 6 to 40 letters or numbers" }, 400);
      if (!Number.isSafeInteger(maxAccounts) || maxAccounts < 1 || maxAccounts > 1_000_000) return reply({ error: "Account limit must be between 1 and 1,000,000" }, 400);
      const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(code));
      const codeHash = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
      const created = await db.from("apx_redeem_codes").insert({
        code_hash: codeHash,
        code_kind: "shared",
        ticket_count: 1,
        cash_reward: 10_000_000_000,
        max_redemptions: maxAccounts,
        is_active: true
      });
      if (created.error?.code === "23505") return reply({ error: "Giftcode này đã tồn tại; mã cũ được giữ nguyên." }, 409);
      if (created.error) throw created.error;
      await audit("create_cash_giftcode", null, { code_hash: codeHash, max_accounts: maxAccounts, cash_reward: 10_000_000_000 });
      return reply({ ok: true, max_accounts: maxAccounts, cash_reward: 10_000_000_000 });
    }
    if (!targetOk) return reply({ error: "Valid user_id UUID required" }, 400);
    const target = input.user_id as string;
    if (input.action === "player") {
      const [p, s] = await Promise.all([
        db.from("apx_player_profiles").select("user_id,character_id,display_name,avatar_url,is_banned,created_at").eq("user_id", target).maybeSingle(),
        db.from("apx_game_saves").select("game_state,revision,updated_at").eq("user_id", target).maybeSingle()
      ]);
      if (p.error) throw p.error;
      if (s.error) throw s.error;
      if (!p.data) return reply({ error: "Player not found" }, 404);
      await audit("view_player", target);
      return reply({ player: { ...p.data, ...(s.data || {}) } });
    }
    if (input.action === "set_ban") {
      if (typeof input.banned !== "boolean") return reply({ error: "banned must be boolean" }, 400);
      if (target === auth.user.id && input.banned) return reply({ error: "Cannot lock your own admin account" }, 400);
      const result = await db.from("apx_player_profiles").update({ is_banned: input.banned }).eq("user_id", target).select("user_id").maybeSingle();
      if (result.error) throw result.error;
      if (!result.data) return reply({ error: "Player not found" }, 404);
      await audit(input.banned ? "ban_player" : "unban_player", target);
      return reply({ ok: true });
    }
    if (input.action === "adjust_cash" || input.action === "adjust_inventory") {
      const isCash = input.action === "adjust_cash";
      const delta = isCash ? input.amount : input.delta;
      if (!Number.isSafeInteger(delta) || Math.abs(delta) > (isCash ? 1_000_000_000_000 : 1_000_000)) return reply({ error: "Change outside allowed range" }, 400);
      if (!isCash && (typeof input.item_id !== "string" || !/^[a-z0-9_-]{1,80}$/i.test(input.item_id))) return reply({ error: "Invalid inventory item id" }, 400);
      const { data: save, error } = await db.from("apx_game_saves").select("game_state,revision").eq("user_id", target).maybeSingle();
      if (error) throw error;
      if (!save) return reply({ error: "Player has no cloud save" }, 404);
      const state = save.game_state as Record<string, unknown>;
      let nextValue: number;
      if (isCash) {
        nextValue = (Number(state.cash) || 0) + delta;
        if (!Number.isSafeInteger(nextValue) || nextValue < 0) return reply({ error: "Cash balance would be invalid" }, 400);
        state.cash = nextValue;
      } else {
        const items = (state.inventory && typeof state.inventory === "object" ? state.inventory : {}) as Record<string, unknown>;
        if (!Object.prototype.hasOwnProperty.call(items, input.item_id)) return reply({ error: "Item is not in this player's inventory" }, 404);
        nextValue = (Number(items[input.item_id]) || 0) + delta;
        if (!Number.isSafeInteger(nextValue) || nextValue < 0) return reply({ error: "Inventory quantity would be invalid" }, 400);
        items[input.item_id] = nextValue;
        state.inventory = items;
      }
      const update = await db.from("apx_game_saves").update({ game_state: state, revision: Number(save.revision) + 1, updated_at: new Date().toISOString() }).eq("user_id", target).eq("revision", save.revision).select("user_id").maybeSingle();
      if (update.error) throw update.error;
      if (!update.data) return reply({ error: "Save changed concurrently; reload and retry" }, 409);
      await audit(input.action, target, { delta, item_id: isCash ? null : input.item_id, resulting_value: nextValue });
      return reply({ ok: true, value: nextValue });
    }
    if (input.action === "review_report") {
      if (!uuid.test(String(input.report_id || "")) || !["reviewing", "resolved", "rejected"].includes(input.status)) return reply({ error: "Invalid report id or status" }, 400);
      const result = await db.from("apx_player_reports").update({ status: input.status, reviewed_by: auth.user.id, resolution: String(input.resolution || "").slice(0, 2000), updated_at: new Date().toISOString() }).eq("id", input.report_id).select("id,target_user_id,status").maybeSingle();
      if (result.error) throw result.error;
      if (!result.data) return reply({ error: "Report not found" }, 404);
      await audit("review_report", result.data.target_user_id, { report_id: result.data.id, status: result.data.status });
      return reply({ ok: true });
    }
    return reply({ error: "Unknown action" }, 400);
  } catch (error) {
    console.error("APX Admin error", error);
    return reply({ error: error instanceof Error ? error.message : "Unexpected server error" }, 500);
  }
});

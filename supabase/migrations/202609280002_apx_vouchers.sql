begin;
do $$ begin
 if to_regclass('public.apx_redeem_codes') is not null or to_regclass('public.apx_redeem_claims') is not null or to_regprocedure('public.apx_redeem_voucher(text)') is not null then raise exception 'APX redeem-code object already exists; inspect before applying this migration.'; end if;
 if to_regclass('public.apx_game_saves') is null then raise exception 'APX game save table is missing.'; end if;
end $$;
create table public.apx_redeem_codes(code_hash text primary key check(code_hash ~ '^[0-9a-f]{64}$'),code_kind text not null check(code_kind in ('shared','single_use')),ticket_count integer not null default 1 check(ticket_count between 1 and 10),is_active boolean not null default true,redeemed_by uuid references auth.users(id) on delete set null,redeemed_at timestamptz,created_at timestamptz not null default now(),check((code_kind='shared' and redeemed_by is null and redeemed_at is null) or code_kind='single_use'));
create table public.apx_redeem_claims(user_id uuid not null references auth.users(id) on delete cascade,code_hash text not null references public.apx_redeem_codes(code_hash),ticket_count integer not null check(ticket_count between 1 and 10),claimed_at timestamptz not null default now(),primary key(user_id,code_hash));
create index apx_redeem_claims_code_idx on public.apx_redeem_claims(code_hash);
alter table public.apx_redeem_codes enable row level security; alter table public.apx_redeem_claims enable row level security;
revoke all on public.apx_redeem_codes,public.apx_redeem_claims from anon,authenticated;
insert into public.apx_redeem_codes(code_hash,code_kind,ticket_count) values
  ('81b4161ee1660c88146322b04470bf1d5c14fbb9b499e771b93542737ffd6c51','shared',1),
  ('17c82a8417e222c64ec9cb0df2b62ca47ec971a0224fd4750ff701a26be86e55','single_use',1),
  ('faa2ba5e137938bec526cc0be2a640ccb20104b35bed5c71e7c832f7ffa7e275','single_use',1),
  ('d28ea0f06bc179204e0e2e6f1ac76c980ac3cf3916546c0af867af44215e7b97','single_use',1),
  ('3a8782e5e5043e3e203f2dbac59cae2ff120fe59247bc106221a1fcd2f2cb9c7','single_use',1),
  ('be7166b79461ecd4b5b67f9f285a91eda3f913879cddc40efc7e7f92e630e3e9','single_use',1),
  ('de3ab50d4412d02731b059ca9c0ac889849c570be5be7c2bd4a82d266411392f','single_use',1),
  ('39d6b8f044608c5ec9e7865763e49cc91b8c7de33b60ddadbe68827a4263eac6','single_use',1),
  ('eabba37b2d1e32738cbf11958f38eb3b1840b59b3ef947a9388ae69ba70b1a26','single_use',1),
  ('3d614c450808082fee2fe22a7d21e8aebdf252e102e40758d2ef3f38523bd319','single_use',1),
  ('06e0406f2abd7175f6a71443fd4fd6931005ff9523ab6c983839420c72140bc9','single_use',1),
  ('f9e881122b9c7a7d2be246bb78cb43798f025acfcd4e50a9dac0f157b9d6df86','single_use',1),
  ('5b16f259cf86fdd0f505bf1a87c30f63f33857a333ce9ba09e30f37b600f43d3','single_use',1),
  ('ce08cdc433d449b188d7ebfa921774638c5fde6de89a99ff28a910d2728de3c7','single_use',1),
  ('2fd8d2730e1fcdb61b96e82f41c9d869b947240d0b73d0aa1eabe2cd664514b4','single_use',1),
  ('41530518fba22719f17f7a8b78526545afe5b90c5f224cd697593106c75c4f76','single_use',1),
  ('11a60f876417a5e0b4dc47eacbd8ac7c1c885fd4913de6f5b8de65574da5c688','single_use',1),
  ('d2a70ece8733fcd043821c645a665b5ec28c73d30ba007c8b8ffa22056b5c5b6','single_use',1),
  ('1c047e3ac32981ab1c16e44d351603e3e2c59fbb74e0a14eaab688357308bde1','single_use',1),
  ('3f24f969abc70784b6523498754e465acd7665c468afa827d9ce6eccbf42c703','single_use',1),
  ('88c8a0b5181856c019eb2debf4e32ed6c99924c3f6def2062d3c777f5ceed96b','single_use',1),
  ('784a4c08ab8fae10742268f2440fcc5f9980d608eb4ca59e4088f0e196c2963d','single_use',1),
  ('6fc1fcac0d136f51e05ac5c2bd689f87f2f865bd35fe06a178b7cc444c89fd43','single_use',1),
  ('658fbd020cc5dee281648c087584dccdefc280f204e3e27955dbbca8ba4814c0','single_use',1),
  ('80841fb4f5310fdeb099139a64b29567c3cb52dd43215a8c6662abcd9871336a','single_use',1),
  ('de8a8bee60a65d2b632ef75525aff6fa7961230d3c288b4fb46338b3a6499672','single_use',1),
  ('268f410796ce660359a916a5b1783dfdc9768d8adf30e7bd094c054d93d3fc28','single_use',1),
  ('0171f5c08a10654d25aa6b72d92cb411365daa37f18756a256fb78a83d204d09','single_use',1),
  ('3ae89aade26ad07976dfb93df84ad0419c0d3fb4af4701ad022afd3e32983efc','single_use',1),
  ('f591731ab08e56818f9eeb86bfba3109355b2101e9d3b1fc0ecf5b52e45ed592','single_use',1),
  ('83addbf64dd667c9ca47102a4f58c2289227ae6c1c53c3c3fb6118ef14000aeb','single_use',1),
  ('bc207416693a2752ccbc317ab665775c0df0430b3905f5b2854d285ba016d5e5','single_use',1),
  ('956b27b59a0fbfe5dcc6c8a834f9b36791a931fcc401d8c8d11cb032f02cc874','single_use',1),
  ('cb1c671a4b9de37f36e38cfed12d6c9f0b0ab33ba00228e9b4d72de0d616a524','single_use',1),
  ('74d741cc244b89c48cc5ff53a1c49f5609191962e7c1f1f434c9886b6b56c7a5','single_use',1),
  ('fa15510914fda943dbc1b6cc8de485b93e5e70a7d4e387b3f2d4be88c1552341','single_use',1),
  ('f74e88ebc8595e981e5e31b4929259dbe101513c8591662d5170c71dee41ad5a','single_use',1),
  ('3c71a80f887f66112e215e9af1e0487408ae2b7565ec5d8b1e672df422a30f9a','single_use',1),
  ('f9514b07c7abc058415bf1ad1388a024efe0e10eca1d6711142e4f0758e2e3b1','single_use',1),
  ('d8700fbd09fc3301101643efb818ae9911176f6b19a0371164c3880a10f456ae','single_use',1),
  ('2fecf446b22f48a96888d934c98eead55b85debcca85f1da69f7a500978ffac8','single_use',1),
  ('27eec976763ef25d52f2f484fe113c83d0297ab676c9619aaa9400eff6aed1fe','single_use',1),
  ('f1f46eed60560910ee8afcc7da829bc5437c3fce85ef7aea65a249657c861eb4','single_use',1),
  ('890048fa38813bdf0fe6d4673a4b820d51caf4e30da69c166a923713f0dde64a','single_use',1),
  ('a5b7def78b7ac12b7038811594118459ceaffff47644355e19adab6918c78006','single_use',1),
  ('f04ea0178a01a29d54a94cc2dbd007439b1e3e366d0aad8247c225df697f1387','single_use',1),
  ('1d287fb3e3aec68f883bf00df6c13277caf65268581082db11cd4a711ae0c156','single_use',1),
  ('143176db2447f46af31048a107590bceeffe26189a62077a33d029a4795e754f','single_use',1),
  ('b036fe95271165708f99e7a55476f833e0c7bcaba7af72bfa90164ff63d1af95','single_use',1),
  ('b15daea0fe2a3d3e9c051a8208c6720feb80fb9d8f2ca71a1b19af6ef84cb1f8','single_use',1),
  ('f135cd6c6aa44852bd72603b471d42ae6ee7d5298bc594553e8b9d85491a6120','single_use',1),
  ('c08a462f467f488157e2016491f757f2c963382ae8245a96b2f14a92f39f0aa6','single_use',1),
  ('e87a9442034ff1641cc459f3a353932cae74b077edb63105c06ef768267d3940','single_use',1),
  ('c814ba4326b5b28838d328807eed9aba487d65ae7fdc7e4d7f238a6ae1e38d26','single_use',1),
  ('6517479a7cea9bd66da0f4b86b38a21a0118b030d1e6059d5144b32008dd305a','single_use',1),
  ('fbd469b0eeeefb94c9bb5ef70e9ac1274e5c6deaafa68539ed129fa337527f4a','single_use',1),
  ('ef36954db5a8e6e69325540fbbd514e657ead1ed097d43de962f23da9cd7fc70','single_use',1),
  ('7942bc05ad641bd311cb8cee99ec3f159058facfa91f6b41e4dfdb9e7054579d','single_use',1),
  ('a408afaa75da8472df042a30e5d7247c4e609ccaaeff6790e62b802d1791167c','single_use',1),
  ('38f1aff105a3fa708c108c56527703b3bd9364d7dcb5bfb75e7df6110f1f3651','single_use',1),
  ('64236aabd531bd707f566b46b732ac7ea7bfab670b5d0641a80ea9e384901bb4','single_use',1),
  ('1b6ee37a52a603c736d316e180fcf0592d687a376a0a8f38796f891047019691','single_use',1),
  ('228322a4d0e015acfcb5dba1078e8928b21f78bdb6ae1d0139af93ed45f9201b','single_use',1),
  ('9049f678dc66f25c5488f28c23afab2acac8f359d001b60353cb4dc6fe65b376','single_use',1),
  ('e76d36ff6c40cbb09a2915cb05f033e53f8cf3024720a964dcb24236e72d0d14','single_use',1),
  ('5ce6fe1d24a22e8e8606f7990280fa538db09fe913e57f36ae33c23db04cde9c','single_use',1),
  ('8103541d806276fbba113b828ca9188c7f998fa5dd57fef85253e8a28a27fc36','single_use',1),
  ('db1ec1740d43e68534b30c01900af94f8276c09b63624f4f04a519926f5a2ec6','single_use',1),
  ('7db6581bce6ffa4776776263299bbbdfdfab97a69056d8a254f709baa09a6017','single_use',1),
  ('59e1f9d6836a19266a4af332c23bc510fb7b2e22eeebc2f5089e48f7aa1847d6','single_use',1),
  ('7db5e835a169dd5f2ec7847ce9a5b0f426ec9e2029e2661f5c0d3f5738026c51','single_use',1),
  ('fbf28aa4f834826ab578baaf7b39a28b62d5f672dcde37aaaa62bcbd97b2b122','single_use',1),
  ('679cd010d808dfd54ac8ca04cf79355474dd1d6ff88a81f14ad79c02a954b0f9','single_use',1),
  ('713b231c79be0e5b44935c370d710415090fd41cbe3efae1fe32bf077e1ed4e9','single_use',1),
  ('39b3c27fd51983688d5ce6ea0e61139b1315e1a91dc479ac060af9d9b4b4547d','single_use',1),
  ('9d510152e065c605f84974a77952355cc5d66eb4edccf4145952829d60ab69c1','single_use',1),
  ('432de5628b4c0a1a9448fb5f465db9a2eba3041fe286e1613d44aa5358bf99b4','single_use',1),
  ('2c712bd85f9f4df76c710c7a2ca880097747a269bd18eb30a563956a898bfead','single_use',1),
  ('bc7dc8350a340589fd3dcf908d1ed615f95f5a2fb216a66a41b996697cc77a8b','single_use',1),
  ('3aced12e3181c4a588a4b44067fc97869340dd156cabc1d2f06db10b40aa5e9b','single_use',1),
  ('20098d0e8d3119c8a2c8af4ead1c6c5b33601ecfe74b9f2e1d578421fde2203a','single_use',1),
  ('2517666acfa5498639d7870e2f481f533fafd752456a613f19d63264588258a5','single_use',1),
  ('ab2dd64020296086411afdab523c7a97605a2a2faf9b91602347ead0a6b60b56','single_use',1),
  ('ab29fe341386d52dbc5ad3aabd6c0cab218f3f8515ed682e8fc64e11b1558bff','single_use',1),
  ('45ff7582b422f387ecf7c0ba6055aca627504ad1cca68b705b193fc875811461','single_use',1),
  ('d67f26b6183818fc8fb8afa2401d6710ec22e02c720a7e5bb4d6ba49941c0963','single_use',1),
  ('b2bde625fd034736ddf34f5e26b59065e13636af5b7699cb12bab6621de36767','single_use',1),
  ('af3cee2370aae1ea8d203c6db6189b86c0738f9de62052b1bbfd24b261a88e59','single_use',1),
  ('f417a11081a222dbaf1cddf192a651f615681f1543c1064fe85ea731f377b150','single_use',1),
  ('7b2d7e2e65d108f246e9b60e5c80bc67a18a24ab841cd56ca1093661a83a231a','single_use',1),
  ('9b528ab972641c9c0540534f16a5b164f4694688ae1d4fb130c4aff089a582f4','single_use',1),
  ('253e234ab717b3e0c75823d113aca1992e8d8030e77b4c1e8efe5dce0f6f89cd','single_use',1),
  ('61c62e3f64f596e631d68a875956dcffff2dcddfc7a79eb8a32dda70d7b75d51','single_use',1),
  ('b5eb665414a5db7fe64ad1caeb916eaea49ca22549b2d28458240a7361639faa','single_use',1),
  ('b147c083055af941dcff53c99dc96cf3a7dd78137bd88cc4c3744f24f1e4859d','single_use',1),
  ('c12f4d97438355748d4c135f05344ae9710eacb3cfe0e510f3499616f830b646','single_use',1),
  ('41708af12d7c42760bd8f0ee709e1b7778f26e67eee2fdb093d665ed1554dfe0','single_use',1),
  ('4a0d68a4c01616483ba68fa9ae9a6b88020a9c1d39431d78293093480291541b','single_use',1),
  ('a66eccd9a90e7945f2f8bb1f256e2ca06d315d9cefe50d0515f132a207836812','single_use',1),
  ('ef80965ccbd788c88dfb70f3fa4a7ded7d3a0b1bcbe8e6275498c8b7c0b983c7','single_use',1),
  ('46cfc5c1374849d05a55d16bf0a733ebe2a09fa8c9bc566ad7f2769bac5a71fa','single_use',1);
create function public.apx_redeem_voucher(p_code text) returns jsonb language plpgsql security definer set search_path='' as $$
declare v_user uuid:=(select auth.uid()); v_code public.apx_redeem_codes%rowtype; v_normalized text; v_hash text; v_state jsonb; v_inventory jsonb; v_current integer; v_total integer; v_rows integer;
begin
 if v_user is null then raise exception 'Đăng nhập trước khi đổi mã.'; end if;
 if not public.apx_user_can_play() then raise exception 'Tài khoản hiện không thể đổi mã.'; end if;
 v_normalized:=regexp_replace(upper(coalesce(p_code,'')),'[^A-Z0-9]','','g');
 if length(v_normalized)<6 or length(v_normalized)>40 then raise exception 'Mã đổi quà không hợp lệ.'; end if;
 v_hash:=encode(extensions.digest(v_normalized,'sha256'),'hex');
 select c.* into v_code from public.apx_redeem_codes c where c.code_hash=v_hash and c.is_active for update;
 if not found then raise exception 'Mã không tồn tại hoặc đã bị vô hiệu hóa.'; end if;
 if v_code.code_kind='single_use' and v_code.redeemed_at is not null then raise exception 'Mã riêng này đã được sử dụng.'; end if;
 select s.game_state into v_state from public.apx_game_saves s where s.user_id=v_user for update;
 if v_state is null then raise exception 'Tài khoản chưa có bản lưu game trên Supabase.'; end if;
 insert into public.apx_redeem_claims(user_id,code_hash,ticket_count) values(v_user,v_hash,v_code.ticket_count) on conflict(user_id,code_hash) do nothing;
 get diagnostics v_rows=row_count;
 if v_rows=0 then raise exception 'Tài khoản đã đổi mã này rồi.'; end if;
 if v_code.code_kind='single_use' then update public.apx_redeem_codes set redeemed_by=v_user,redeemed_at=now() where code_hash=v_hash; end if;
 v_inventory:=case when jsonb_typeof(v_state->'inventory')='object' then v_state->'inventory' else '{}'::jsonb end;
 v_current:=greatest(0,coalesce((v_inventory->>'revenue-ticket')::integer,0)); v_total:=v_current+v_code.ticket_count;
 v_inventory:=jsonb_set(v_inventory,'{revenue-ticket}',to_jsonb(v_total),true); v_state:=jsonb_set(v_state,'{inventory}',v_inventory,true);
 update public.apx_game_saves set game_state=v_state,revision=revision+1,updated_at=now() where user_id=v_user;
 return jsonb_build_object('ok',true,'ticket_count',v_total,'granted',v_code.ticket_count,'code_kind',v_code.code_kind);
end; $$;
revoke all on function public.apx_redeem_voucher(text) from public,anon,authenticated; grant execute on function public.apx_redeem_voucher(text) to authenticated;
commit;

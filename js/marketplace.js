/* APX Marketplace: displays and synchronizes database-backed listings and transactions. */
(function () {
  "use strict";
  var listings = [], transactions = [], dashboard = null, loading = false, error = "";
  var companyStats = Object.create(null), requestedStats = Object.create(null);
  var companySales = Object.create(null), companySalesLoading = Object.create(null), companySalesError = Object.create(null);
  var companySalesTimer = null, watchedCompanyId = "", companySalesLastFetched = Object.create(null);
  function esc(v) { return String(v == null ? "" : v).replace(/[&<>"']/g, function (c) { return {"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]; }); }
  function money(v) { return window.APXUI.money(Number(v) || 0); }
  function signedIn() { return window.APXAccount && window.APXAccount.isLoggedIn && window.APXAccount.isLoggedIn(); }
  function category(company) { return company.industryId === "technology" ? "technology" : company.industryId === "real-estate" ? "real-estate" : "lifestyle"; }
  function ownListings() {
    var state = window.APXGame && window.APXGame.state;
    if (!state || !window.APXCompanies) return [];
    return window.APXCompanies.getCompanies(state).reduce(function (all, company) {
      var available = Number(company.inventory && company.inventory.usePerSale) > 0 ? Math.max(0, Number(company.inventory.stock) || 0) / Number(company.inventory.usePerSale) : 999999;
      company.products.filter(function (p) { return p.active; }).forEach(function (p) {
        all.push({ company_id: company.id, company_name: company.name, product_id: p.id, product_name: p.name, category: category(company), unit_price: Math.round(Number(p.price) || 0), quality: Number(p.quality) || 1, reputation: Number(company.reputation) || 0, available_units: available, active: available > 0 });
      }); return all;
    }, []);
  }
  function syncListings() {
    if (!signedIn()) return Promise.resolve();
    return window.APXAccount.getSupabaseClient().then(function (db) { return db.rpc("apx_market_sync_listings", { p_listings: ownListings() }); }).then(function (r) { if (r.error) throw r.error; });
  }
  function load(force) {
    if (!signedIn() || loading || (!force && listings.length)) return;
    loading = true; error = "";
    Promise.resolve().then(syncListings).then(function () { return window.APXAccount.getSupabaseClient(); }).then(function (db) {
      return Promise.all([db.from("apx_market_listings").select("*").eq("active",true).gt("available_units",0).order("updated_at",{ascending:false}).limit(100), db.from("apx_market_transactions").select("*").order("created_at",{ascending:false}).limit(50), db.rpc("apx_market_dashboard")]);
    }).then(function (r) { r.forEach(function (x) { if (x.error) throw x.error; }); listings=r[0].data||[]; transactions=r[1].data||[]; dashboard=r[2].data||{}; }).catch(function (e) { error=e.message||"Không tải được thị trường."; }).finally(function () { loading=false; if (window.APXGame && window.APXGame.state.route.section === "company" && window.APXGame.state.route.page === "market") window.APXGame.render(); });
  }
  function render() {
    if (!signedIn()) return '<header class="page-heading"><span class="eyebrow">THỊ TRƯỜNG APX</span><h1>Thị trường giao dịch</h1><p>Đăng nhập để xem sản phẩm, lịch sử giao dịch và mua bán với người chơi khác.</p></header>';
    load(false);
    var d=dashboard||{};
    var stats='<section class="group-metrics grid four"><article class="metric-card"><small>GIAO DỊCH HÔM NAY</small><strong>'+Number(d.transactions_today||0)+'</strong></article><article class="metric-card"><small>GIÁ TRỊ GIAO DỊCH</small><strong>'+money(d.volume_today)+'</strong></article><article class="metric-card"><small>KHÁCH NPC</small><strong>'+Number(d.npc_buyers_today||0)+'</strong></article><article class="metric-card"><small>NGƯỜI BÁN ĐANG HOẠT ĐỘNG</small><strong>'+Number(d.sellers||0)+'</strong></article></section>';
    var market=listings.map(function (x) { return '<article class="panel"><span class="eyebrow">'+esc(x.category)+' · '+esc(x.company_name)+'</span><h3>'+esc(x.product_name)+'</h3><div class="data-row"><span>Giá / chất lượng</span><strong>'+money(x.unit_price)+' · '+Number(x.quality).toFixed(0)+'</strong></div><div class="data-row"><span>Tồn có thể bán</span><strong>'+Math.floor(Number(x.available_units))+'</strong></div><form data-market-buy><input type="hidden" name="listing" value="'+esc(x.id)+'"><label>Số lượng<input name="quantity" type="number" min="1" max="100" value="1" required></label><button class="button button-gold" type="submit">Mua</button></form></article>'; }).join('') || '<p class="character-empty-note">Chưa có sản phẩm nào đang bán.</p>';
    var history=transactions.map(function (x) { return '<div class="data-row"><span>'+esc(x.buyer_type === 'NPC' ? '👤 '+x.buyer_label : '👤 '+x.buyer_label)+' · '+esc(x.product_name)+' × '+Number(x.quantity)+'</span><strong>'+money(x.total_price)+'</strong></div>'; }).join('') || '<p class="character-empty-note">Chưa có giao dịch của bạn.</p>';
    return '<header class="page-heading"><span class="eyebrow">THỊ TRƯỜNG APX · DỮ LIỆU THẬT</span><h1>Thị trường & khách hàng</h1><p>NPC và người chơi mua từ tất cả listing đủ điều kiện; giá, chất lượng, uy tín và kho quyết định cơ hội bán.</p></header>'+stats+(error?'<p class="character-empty-note">'+esc(error)+'</p>':'')+'<section class="panel"><div class="section-title-row"><div><span class="eyebrow">SẢN PHẨM ĐANG BÁN</span><h2>Mua từ người chơi</h2></div><button class="button" data-market-refresh>Làm mới</button></div><div class="company-branch-grid grid three">'+market+'</div></section><section class="panel"><span class="eyebrow">LỊCH SỬ GIAO DỊCH CỦA BẠN</span><h2>Đơn mua và đơn bán</h2>'+history+'</section>';
  }
  function companySummary(companyId) {
    if (!signedIn()) return null;
    if (!requestedStats[companyId]) {
      requestedStats[companyId] = true;
      window.APXAccount.getSupabaseClient().then(function (db) { return db.rpc("apx_market_company_stats", { p_company_id: companyId }); }).then(function (r) {
        if (r.error) throw r.error; companyStats[companyId] = r.data || {};
      }).catch(function () {}).finally(function () { if (window.APXGame) window.APXGame.render(); });
    }
    return companyStats[companyId] || null;
  }
  function companySalesIsVisible(companyId) {
    var state = window.APXGame && window.APXGame.state;
    return Boolean(state && state.route.section === "company" && state.route.page === "companies" &&
      state.companyManager && state.companyManager.companyId === companyId && state.companyManager.tab === "overview");
  }
  function refreshCompanySales(companyId) {
    if (!signedIn() || companySalesLoading[companyId] || Date.now() - (companySalesLastFetched[companyId] || 0) < 4500) return;
    companySalesLoading[companyId] = true;
    companySalesLastFetched[companyId] = Date.now();
    window.APXAccount.getSupabaseClient().then(function (db) {
      return db.from("apx_market_transactions")
        .select("id,buyer_label,product_name,quantity,unit_price,total_price,created_at")
        .eq("company_id", companyId)
        .eq("buyer_type", "NPC")
        .eq("status", "completed")
        .order("created_at", { ascending: false })
        .limit(20);
    }).then(function (result) {
      if (result.error) throw result.error;
      var rows = result.data || [];
      var wasLoaded = Object.prototype.hasOwnProperty.call(companySales, companyId);
      var previousIds = (companySales[companyId] || []).map(function (row) { return row.id; }).join(",");
      var nextIds = rows.map(function (row) { return row.id; }).join(",");
      companySales[companyId] = rows;
      companySalesError[companyId] = "";
      if ((!wasLoaded || previousIds !== nextIds) && companySalesIsVisible(companyId) && window.APXGame) window.APXGame.render();
    }).catch(function (requestError) {
      var message = requestError.message || "Không tải được đơn hàng NPC.";
      var changed = companySalesError[companyId] !== message;
      companySalesError[companyId] = message;
      if (changed && companySalesIsVisible(companyId) && window.APXGame) window.APXGame.render();
    }).finally(function () {
      companySalesLoading[companyId] = false;
    });
  }
  function companyRecentSales(companyId) {
    if (!signedIn()) return { rows: [], loading: false, error: "" };
    if (watchedCompanyId !== companyId) {
      if (companySalesTimer) window.clearInterval(companySalesTimer);
      watchedCompanyId = companyId;
      refreshCompanySales(companyId);
      companySalesTimer = window.setInterval(function () {
        if (!companySalesIsVisible(watchedCompanyId)) {
          window.clearInterval(companySalesTimer);
          companySalesTimer = null;
          watchedCompanyId = "";
          return;
        }
        refreshCompanySales(watchedCompanyId);
      }, 5000);
    } else {
      refreshCompanySales(companyId);
    }
    return { rows: companySales[companyId] || [], loading: Boolean(companySalesLoading[companyId]), error: companySalesError[companyId] || "" };
  }
  document.addEventListener("submit",function(e){var f=e.target;if(!f.matches("[data-market-buy]"))return;e.preventDefault();var fd=new FormData(f);window.APXAccount.getSupabaseClient().then(function(db){return db.rpc("apx_market_buy_player",{p_listing:fd.get("listing"),p_quantity:Number(fd.get("quantity"))});}).then(function(r){if(r.error)throw r.error;window.APXGame.toast("Đã mua hàng. Tổng thanh toán "+money(r.data.total)); return window.APXAccount.sync();}).then(function(){listings=[]; transactions=[]; load(true);}).catch(function(x){window.APXGame.toast(x.message||"Không thể mua hàng.","warning");});});
  document.addEventListener("click",function(e){if(e.target.closest("[data-market-refresh]")){listings=[];transactions=[];load(true);}});
  window.APXMarketplace={render:render,syncListings:syncListings,load:load,companySummary:companySummary,companyRecentSales:companyRecentSales};
})();

/* APX Investments: Supabase-backed market, portfolio and trading history. */
(function () {
  "use strict";

  var assets = [];
  var positions = [];
  var transactions = [];
  var activeTab = "market";
  var assetFilter = "all";
  var loading = false;
  var loaded = false;
  var loadError = "";
  var busy = false;
  var requestId = 0;
  var MARKET_REFRESH_INTERVAL_MS = 5 * 60 * 1000;
  var lastMarketRefreshAt = 0;
  var marketRefreshTimer = null;
  var marketRefreshing = false;

  function esc(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, function (ch) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch];
    });
  }

  function money(value) {
    return window.APXUI.money(Number(value) || 0);
  }

  function signedMoney(value) {
    var n = Number(value) || 0;
    return (n > 0 ? "+" : "") + money(n);
  }

  function assetTypeLabel(type) {
    return type === "stock" ? "Cổ phiếu" : type === "bond" ? "Trái phiếu" : "Quỹ đầu tư";
  }

  function sideLabel(side) {
    return side === "buy" ? "Mua" : side === "sell" ? "Bán" : "Đáo hạn";
  }

  function canUse() {
    return Boolean(window.APXAccount && window.APXAccount.isConfigured() && window.APXAccount.isLoggedIn());
  }

  function tabButton(id, label) {
    return '<button type="button" class="investment-tab' + (activeTab === id ? ' is-active' : '') +
      '" data-investment-tab="' + id + '">' + label + '</button>';
  }

  function header() {
    return '<header class="page-heading"><span class="eyebrow">APX CAPITAL</span>' +
      '<h1>Đầu tư</h1></header>' +
      '<nav class="investment-tabs" aria-label="Các mục đầu tư">' +
        tabButton("market", "Thị trường") + tabButton("portfolio", "Danh mục") +
        tabButton("transactions", "Giao dịch") + '</nav>';
  }

  function stats(state) {
    var currentValue = 0;
    var investedCost = 0;
    positions.forEach(function (position) {
      var asset = assets.find(function (item) { return item.symbol === position.symbol; });
      if (!asset) return;
      var quantity = Number(position.quantity) || 0;
      currentValue += quantity * Number(asset.current_price);
      investedCost += quantity * Number(position.purchase_price);
    });
    var pnl = currentValue - investedCost;
    return '<section class="investment-stat-grid" aria-label="Tổng quan tài sản">' +
      '<article class="investment-stat"><small>TỔNG TÀI SẢN ĐẦU TƯ</small><strong>' + money(currentValue + Number(state.cash || 0)) + '</strong><span>Tiền mặt và danh mục</span></article>' +
      '<article class="investment-stat"><small>TIỀN MẶT HIỆN CÓ</small><strong>' + money(state.cash) + '</strong><span>Số dư trong tài khoản game</span></article>' +
      '<article class="investment-stat"><small>TỔNG GIÁ TRỊ DANH MỤC</small><strong>' + money(currentValue) + '</strong><span>' + positions.length + ' lô tài sản đang nắm giữ</span></article>' +
      '<article class="investment-stat"><small>LÃI / LỖ CHƯA THỰC HIỆN</small><strong class="' + (pnl >= 0 ? 'is-positive' : 'is-negative') + '">' + signedMoney(pnl) + '</strong><span>So với giá mua</span></article>' +
    '</section>';
  }

  function marketFilter() {
    var entries = [["all","Tất cả"],["stock","Cổ phiếu"],["bond","Trái phiếu"],["fund","Quỹ đầu tư"]];
    return '<div class="investment-filter" role="group" aria-label="Lọc loại tài sản">' +
      entries.map(function (entry) {
        return '<button type="button" class="' + (assetFilter === entry[0] ? 'is-active' : '') +
          '" data-investment-filter="' + entry[0] + '">' + entry[1] + '</button>';
      }).join("") + '</div>';
  }

  function tradeForm(asset, side) {
    var step = asset.asset_type === "fund" ? "0.001" : "1";
    var min = step;
    var max = asset.asset_type === "fund" ? "1000000000" : "1000000000";
    return '<form class="investment-trade-form" data-investment-form>' +
      '<input type="hidden" name="symbol" value="' + esc(asset.symbol) + '">' +
      '<input type="hidden" name="side" value="' + side + '">' +
      '<label class="visually-hidden">Số lượng ' + esc(asset.symbol) + '</label>' +
      '<input name="quantity" type="number" min="' + min + '" max="' + max + '" step="' + step + '" value="' +
        (asset.asset_type === "fund" ? "1.000" : "1") + '" aria-label="Số lượng ' + esc(asset.symbol) + '" required>' +
      '<button type="submit" class="button ' + (side === "buy" ? "button-gold" : "") + '"' + (busy ? " disabled" : "") + '>' +
        (side === "buy" ? "Mua" : "Bán") + '</button></form>';
  }

  function marketView() {
    var filtered = assets.filter(function (asset) { return assetFilter === "all" || asset.asset_type === assetFilter; });
    if (!filtered.length) return '<div class="investment-empty panel">Chưa có tài sản trong mục này.</div>';
    return '<div class="investment-table-wrap"><table class="investment-table"><thead><tr>' +
      '<th>Tài sản</th><th>Giá</th><th>Thay đổi</th><th>Mua</th></tr></thead><tbody>' +
      filtered.map(function (asset) {
        var change = Number(asset.previous_price) ? (Number(asset.current_price) - Number(asset.previous_price)) / Number(asset.previous_price) * 100 : 0;
        var changeClass = change >= 0 ? "is-positive" : "is-negative";
        var details = asset.asset_type === "bond"
          ? Number(asset.annual_rate).toLocaleString("vi-VN") + "%/năm · " + asset.maturity_days + " ngày"
          : asset.description;
        return '<tr><td><strong class="investment-symbol">' + esc(asset.symbol) + '</strong><span class="investment-asset-name">' +
          esc(asset.name) + ' · ' + assetTypeLabel(asset.asset_type) + '</span><small class="investment-detail">' + esc(details) + '</small></td>' +
          '<td><strong>' + money(asset.current_price) + '</strong></td>' +
          '<td><span class="' + changeClass + '">' + (change > 0 ? "+" : "") + change.toFixed(2) + '%</span></td>' +
          '<td>' + tradeForm(asset, "buy") + '</td></tr>';
      }).join("") + '</tbody></table></div>';
  }

  function groupedPositions() {
    var map = {};
    positions.forEach(function (position) {
      if (!map[position.symbol]) map[position.symbol] = {
        symbol: position.symbol, quantity: 0, cost: 0, lots: [], nextMaturity: null
      };
      var group = map[position.symbol];
      var quantity = Number(position.quantity) || 0;
      group.quantity += quantity;
      group.cost += quantity * Number(position.purchase_price);
      group.lots.push(position);
      if (position.matures_at && (!group.nextMaturity || position.matures_at < group.nextMaturity)) {
        group.nextMaturity = position.matures_at;
      }
    });
    return Object.keys(map).map(function (symbol) {
      var group = map[symbol];
      var asset = assets.find(function (item) { return item.symbol === symbol; });
      group.asset = asset;
      group.price = Number(asset && asset.current_price) || 0;
      group.average = group.quantity ? group.cost / group.quantity : 0;
      group.value = group.price * group.quantity;
      group.pnl = group.value - group.cost;
      return group;
    });
  }

  function portfolioView() {
    var groups = groupedPositions();
    if (!groups.length) return '<div class="investment-empty panel"><strong>Danh mục chưa có tài sản</strong><p>Chọn một mã ở Thị trường để mua tài sản đầu tiên.</p><button class="button" type="button" data-investment-tab="market">Mở thị trường</button></div>';
    return '<div class="investment-table-wrap"><table class="investment-table"><thead><tr>' +
      '<th>Tài sản / giá mua TB</th><th>Số lượng</th><th>Giá hiện tại</th><th>Giá trị</th><th>Lãi / lỗ</th><th>Bán</th>' +
      '</tr></thead><tbody>' + groups.map(function (group) {
        var item = group.asset || {};
        var qty = group.quantity.toLocaleString("vi-VN", { maximumFractionDigits: 3 });
        var average = group.average;
        var maturity = group.nextMaturity ? '<small class="investment-detail">Đáo hạn: ' + new Date(group.nextMaturity).toLocaleDateString("vi-VN") + '</small>' : '';
        return '<tr><td><strong class="investment-symbol">' + esc(group.symbol) + '</strong><span class="investment-asset-name">' +
          esc(item.name || group.symbol) + '</span><small class="investment-detail">Giá mua TB ' + money(average) + '</small>' + maturity + '</td>' +
          '<td>' + qty + '</td><td>' + money(group.price) + '</td><td><strong>' + money(group.value) + '</strong></td>' +
          '<td class="' + (group.pnl >= 0 ? "is-positive" : "is-negative") + '">' + signedMoney(group.pnl) + '</td>' +
          '<td>' + tradeForm(item, "sell") + '</td></tr>';
      }).join("") + '</tbody></table></div>';
  }

  function transactionView() {
    if (!transactions.length) return '<div class="investment-empty panel">Giao dịch mua, bán và đáo hạn sẽ được lưu tại đây.</div>';
    return '<div class="investment-table-wrap"><table class="investment-table investment-history"><thead><tr>' +
      '<th>Thời gian</th><th>Loại</th><th>Tài sản</th><th>Mua / Bán</th><th>Số lượng</th><th>Giá</th><th>Tổng tiền</th>' +
      '</tr></thead><tbody>' + transactions.map(function (tx) {
        var date = new Date(tx.created_at);
        var label = tx.side === "maturity" ? "Đáo hạn" : sideLabel(tx.side);
        return '<tr><td>' + date.toLocaleString("vi-VN") + '</td><td>' + assetTypeLabel(tx.asset_type) +
          '</td><td><strong>' + esc(tx.symbol) + '</strong></td><td>' + label + '</td><td>' +
          Number(tx.quantity).toLocaleString("vi-VN", { maximumFractionDigits: 3 }) + '</td><td>' + money(tx.price) +
          '</td><td><strong>' + money(tx.total_amount) + '</strong>' +
          (Number(tx.realized_pnl) ? '<small class="investment-detail">Lãi ' + signedMoney(tx.realized_pnl) + '</small>' : '') +
          '</td></tr>';
      }).join("") + '</tbody></table></div>';
  }

  function queueLoad(state) {
    if (loading || loaded || !canUse()) return;
    loading = true;
    loadError = "";
    var thisRequest = ++requestId;
    (async function () {
      try {
        var db = await window.APXAccount.getSupabaseClient();
        var maturity = await db.rpc("apx_investment_claim_maturities");
        if (maturity.error) throw maturity.error;
        if (maturity.data && Number.isFinite(Number(maturity.data.cash))) {
          state.cash = Number(maturity.data.cash);
          window.APXGame.save();
        }
        var refresh = await db.rpc("apx_investment_refresh_market");
        if (refresh.error) throw refresh.error;
        var results = await Promise.all([
          db.from("apx_investment_assets").select("*").eq("is_active", true).order("asset_type").order("symbol"),
          db.from("apx_investment_positions").select("*").order("acquired_at"),
          db.from("apx_investment_transactions").select("*").order("created_at", { ascending: false }).limit(100)
        ]);
        results.forEach(function (result) { if (result.error) throw result.error; });
        assets = results[0].data || [];
        positions = results[1].data || [];
        transactions = results[2].data || [];
        loaded = true;
        lastMarketRefreshAt = Date.now();
        startMarketRefreshTimer();
      } catch (error) {
        loadError = error.message || "Không thể tải dữ liệu đầu tư.";
      } finally {
        loading = false;
        if (thisRequest === requestId && window.APXGame.state.route.section === "investment") {
          window.APXGame.render();
        }
      }
    })();
  }

  function refreshMarketIfDue() {
    var game = window.APXGame;
    if (!loaded || loading || marketRefreshing || !canUse() || document.hidden) return;
    if (!game || !game.state || !game.state.route || game.state.route.section !== "investment") return;
    if (Date.now() - lastMarketRefreshAt < MARKET_REFRESH_INTERVAL_MS) return;

    marketRefreshing = true;
    lastMarketRefreshAt = Date.now();
    (async function () {
      try {
        var db = await window.APXAccount.getSupabaseClient();
        var refresh = await db.rpc("apx_investment_refresh_market");
        if (refresh.error) throw refresh.error;
        var result = await db.from("apx_investment_assets").select("*").eq("is_active", true).order("asset_type").order("symbol");
        if (result.error) throw result.error;
        assets = result.data || [];
        loadError = "";
      } catch (error) {
        loadError = error.message || "Không thể cập nhật giá thị trường.";
      } finally {
        marketRefreshing = false;
        if (game.state && game.state.route.section === "investment") game.render();
      }
    })();
  }

  function startMarketRefreshTimer() {
    if (marketRefreshTimer) return;
    marketRefreshTimer = window.setInterval(refreshMarketIfDue, 15000);
  }

  function render(page, state) {
    activeTab = page === "portfolio" || page === "transactions" ? page : "market";
    if (loaded) refreshMarketIfDue();
    if (!canUse()) {
      return header() + '<section class="investment-login panel"><h2>Đăng nhập để đầu tư</h2>' +
        '<button class="button button-gold" type="button" data-action="navigate" data-section="account" data-page="profile">Mở đăng nhập và hồ sơ</button></section>';
    }
    if (!loaded && !loading) queueLoad(state);
    var message = loadError ? '<div class="investment-message is-error" role="alert">' + esc(loadError) + '</div>' :
      (!loaded ? '<div class="investment-message">Đang tải thị trường và danh mục của bạn…</div>' : "");
    var body = activeTab === "portfolio" ? portfolioView() : activeTab === "transactions" ? transactionView() :
      marketFilter() + marketView();
    return header() + stats(state) + message +
      '<section class="investment-panel panel"><div class="investment-panel-heading"><div>' +
        '<span class="eyebrow">' + (activeTab === "market" ? "CƠ HỘI ĐẦU TƯ" : activeTab === "portfolio" ? "TÀI SẢN ĐANG SỞ HỮU" : "SỔ GIAO DỊCH") + '</span>' +
        '<h2>' + (activeTab === "market" ? "Thị trường" : activeTab === "portfolio" ? "Danh mục của tôi" : "Lịch sử giao dịch") + '</h2></div>' +
        '<span class="investment-live"><i></i> ' + (loaded ? "ĐANG ĐỒNG BỘ" : "ĐANG KẾT NỐI") + '</span></div>' +
        (activeTab === "market" ? body : body) + '</section>' +
      '<p class="investment-note">Mô phỏng · không dùng tiền thật.</p>';
  }

  async function submitTrade(form) {
    if (busy) return;
    if (!canUse()) {
      window.APXGame.toast("Hãy đăng nhập để thực hiện giao dịch.", "warning");
      return;
    }
    var symbol = form.elements.symbol.value;
    var side = form.elements.side.value;
    var quantity = Number(form.elements.quantity.value);
    if (!Number.isFinite(quantity) || quantity <= 0) {
      window.APXGame.toast("Hãy nhập số lượng hợp lệ.", "warning");
      return;
    }
    busy = true;
    window.APXGame.render();
    try {
      var db = await window.APXAccount.getSupabaseClient();
      var result = await db.rpc("apx_investment_trade", {
        p_symbol: symbol,
        p_side: side,
        p_quantity: quantity
      });
      if (result.error) throw result.error;
      window.APXGame.state.cash = Number(result.data.cash);
      window.APXGame.save();
      window.APXGame.toast((side === "buy" ? "Đã mua " : "Đã bán ") + quantity + " " + symbol + ".", "success");
      loaded = false;
      loadError = "";
      window.APXGame.render();
      queueLoad(window.APXGame.state);
    } catch (error) {
      window.APXGame.toast(error.message || "Giao dịch không thành công.", "warning");
    } finally {
      busy = false;
      window.APXGame.render();
    }
  }

  document.addEventListener("click", function (event) {
    var tabButton = event.target.closest("[data-investment-tab]");
    if (tabButton) {
      window.APXNav.go("investment", tabButton.dataset.investmentTab);
      window.APXGame.render();
      return;
    }
    var filterButton = event.target.closest("[data-investment-filter]");
    if (filterButton) {
      assetFilter = filterButton.dataset.investmentFilter;
      window.APXGame.render();
    }
  });

  document.addEventListener("submit", function (event) {
    var form = event.target.closest("[data-investment-form]");
    if (!form) return;
    event.preventDefault();
    submitTrade(form);
  });

  window.APXPages.investment = render;
})();
/* Cộng đồng APX: danh sách người chơi và bảng xếp hạng công khai. */
window.APXPages = window.APXPages || {};
(function () {
  "use strict";
  var cache = Object.create(null);
  var pending = Object.create(null);
  var messages = Object.create(null);

  function esc(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function signedIn() {
    return window.APXAccount && window.APXAccount.isConfigured() && window.APXAccount.isLoggedIn();
  }
  function currentPage() {
    var route = window.APXGame && window.APXGame.state.route;
    return route && route.section === "community" ? route.page : "";
  }
  function load(page, force) {
    if (!signedIn()) return;
    if (pending[page]) return;
    if (cache[page] && !force) return;
    pending[page] = true;
    messages[page] = "Đang tải dữ liệu cộng đồng…";
    window.APXAccount.getSupabaseClient().then(function (db) {
      var mode = page === "players" ? "players" : page === "company-ranking" ? "company" : "personal";
      return db.rpc("apx_community_players", { p_mode: mode, p_limit: 100 });
    }).then(function (result) {
      if (result.error) throw result.error;
      cache[page] = Array.isArray(result.data) ? result.data : [];
      messages[page] = "";
    }).catch(function (error) {
      messages[page] = error && error.message ? error.message : "Không tải được dữ liệu cộng đồng.";
    }).finally(function () {
      pending[page] = false;
      if (currentPage() === page && window.APXGame) window.APXGame.render();
    });
  }
  function heading(title, detail) {
    return '<header class="page-heading"><span class="eyebrow">APX NETWORK · CỘNG ĐỒNG</span><h1>' + title + '</h1><p>' + detail + '</p></header>';
  }
  function playerRows(rows, ranking, metric) {
    if (!rows.length) return '<div class="panel community-empty"><strong>Chưa có người chơi khác trong danh sách.</strong><p>Khi có thêm tài khoản đăng nhập và tạo tiến trình, họ sẽ xuất hiện ở đây.</p></div>';
    return '<div class="panel community-table-wrap ' + (ranking ? "ranking" : "directory") + '"><div class="community-table community-table-head"><span>HẠNG</span><span>NGƯỜI CHƠI</span><span>CÔNG TY</span><span>TRẠNG THÁI</span>' + (ranking ? '<span>' + metric + '</span>' : '') + '</div>' + rows.map(function (player, index) {
      var rank = Number(player.rank_position) || index + 1;
      var avatar = player.avatar_url
        ? '<img src="' + esc(player.avatar_url) + '" alt="">'
        : '<span>' + esc(String(player.display_name || "NV").trim().split(/\s+/).slice(-2).map(function (part) { return part.charAt(0); }).join("").toLocaleUpperCase("vi-VN")) + '</span>';
      var amount = metric === "TÀI CHÍNH CÔNG TY" ? player.business_cash : player.personal_cash;
      return '<article class="community-table community-player-row"><span class="community-rank">' + String(rank).padStart(2, "0") + '</span><span class="community-player"><i class="community-avatar">' + avatar + '</i><strong>' + esc(player.display_name || "Người chơi") + '</strong></span><span class="community-company">' + esc(player.company_name || "APX Group") + '</span><span><i class="community-status ' + (player.is_online ? "online" : "") + '"></i>' + (player.is_online ? "Đang online" : "Ngoại tuyến") + '</span>' + (ranking ? '<strong class="community-amount">' + esc(window.APXUI.money(Number(amount) || 0)) + '</strong>' : '') + '</article>';
    }).join("") + '</div>';
  }
  function render(page) {
    if (!signedIn()) {
      return heading("Cộng đồng người chơi", "Đăng nhập để xem người chơi, trạng thái online và bảng xếp hạng.") + '<section class="panel community-empty"><strong>Cần đăng nhập Supabase</strong><p>Dữ liệu được lấy từ tài khoản người chơi trong project APX.</p><button class="button button-gold" type="button" data-action="section" data-section="account">Mở tài khoản</button></section>';
    }
    load(page, false);
    var isDirectory = page === "players";
    var isCompany = page === "company-ranking";
    var title = isDirectory ? "Người chơi APX" : isCompany ? "Bảng xếp hạng công ty" : "Bảng xếp hạng cá nhân";
    var detail = isDirectory ? "Danh sách tài khoản khác và trạng thái hoạt động gần đây." : isCompany ? "So sánh tiền mặt tập đoàn và các công ty thành viên." : "Xếp hạng theo tiền mặt cá nhân hiện có.";
    var rows = cache[page] || [];
    var metric = isCompany ? "TÀI CHÍNH CÔNG TY" : "TIỀN CÁ NHÂN";
    return heading(title, detail) +
      '<div class="community-toolbar"><nav class="community-tabs" aria-label="Bảng cộng đồng"><button type="button" class="' + (isDirectory ? "active" : "") + '" data-action="page" data-page="players">Người chơi</button><button type="button" class="' + (page === "personal-ranking" ? "active" : "") + '" data-action="page" data-page="personal-ranking">Tiền cá nhân</button><button type="button" class="' + (isCompany ? "active" : "") + '" data-action="page" data-page="company-ranking">Tài chính công ty</button></nav><button class="button" type="button" data-action-community="refresh" data-page="' + esc(page) + '" ' + (pending[page] ? "disabled" : "") + '>Cập nhật</button></div>' +
      '<div class="community-summary panel"><span><i class="community-status online"></i> Đang online trong khoảng 90 giây gần nhất</span><strong>' + (isDirectory ? rows.filter(function (p) { return p.is_online; }).length + ' người online trong danh sách' : 'Top ' + rows.length + ' tài khoản') + '</strong></div>' +
      (messages[page] ? '<p class="community-message" role="status">' + esc(messages[page]) + '</p>' : '') +
      playerRows(rows, !isDirectory, metric) +
      '<p class="community-note">Bảng xếp hạng hiển thị số dư tài chính với những người chơi đã đăng nhập vào cùng server Supabase. Danh sách sẽ tự cập nhật khi bạn mở trang hoặc bấm Cập nhật.</p>';
  }

  document.addEventListener("click", function (event) {
    var button = event.target.closest("[data-action-community='refresh']");
    if (!button) return;
    var page = button.dataset.page;
    delete cache[page];
    load(page, true);
    if (window.APXGame) window.APXGame.render();
  });

  window.APXPages.community = render;
})();

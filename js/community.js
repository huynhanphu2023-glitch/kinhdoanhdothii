/* Cộng đồng APX: hồ sơ công khai, bảng xếp hạng và tin nhắn có lưu lịch sử. */
window.APXPages = window.APXPages || {};
(function () {
  "use strict";
  var cache = Object.create(null);
  var pending = Object.create(null);
  var status = Object.create(null);
  var view = null;
  var profile = null;
  var peer = null;

  function esc(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function safeAvatar(url, name) {
    var value = String(url || "");
    if (/^https:\/\//i.test(value)) return '<img src="' + esc(value) + '" alt="">';
    return '<span>' + esc(String(name || "NV").trim().split(/\s+/).slice(-2).map(function (part) { return part.charAt(0); }).join("").toLocaleUpperCase("vi-VN")) + '</span>';
  }
  function signedIn() {
    return window.APXAccount && window.APXAccount.isConfigured() && window.APXAccount.isLoggedIn();
  }
  function currentPage() {
    var route = window.APXGame && window.APXGame.state.route;
    return route && route.section === "community" ? route.page : "";
  }
  function client() { return window.APXAccount.getSupabaseClient(); }
  function fetchPage(page, force) {
    if (!signedIn() || pending[page] || (cache[page] && !force)) return;
    pending[page] = true;
    status[page] = "Đang tải…";
    client().then(function (db) {
      if (page === "players" || page === "personal-ranking" || page === "company-ranking") {
        var mode = page === "players" ? "players" : page === "company-ranking" ? "company" : "personal";
        return db.rpc("apx_community_players", { p_mode: mode, p_limit: 100 });
      }
      if (page === "global-chat") return db.rpc("apx_global_chat_read", { p_limit: 50 });
      if (page === "messages") return db.rpc("apx_direct_message_threads", { p_limit: 50 });
      return { data: [], error: null };
    }).then(function (result) {
      if (result.error) throw result.error;
      cache[page] = Array.isArray(result.data) ? result.data : [];
      status[page] = "";
    }).catch(function (error) {
      status[page] = error && error.message ? error.message : "Không tải được dữ liệu.";
    }).finally(function () {
      pending[page] = false;
      if (currentPage() === page && window.APXGame) window.APXGame.render();
    });
  }
  function heading(title, detail) {
    return '<header class="page-heading"><span class="eyebrow">APX NETWORK · CỘNG ĐỒNG</span><h1>' + esc(title) + '</h1><p>' + esc(detail) + '</p></header>';
  }
  function toolbar(page) {
    return '<div class="community-toolbar"><nav class="community-tabs" aria-label="Cộng đồng APX"><button class="' + (page === "players" ? "active" : "") + '" data-action="page" data-page="players">Người chơi</button><button class="' + (page === "personal-ranking" ? "active" : "") + '" data-action="page" data-page="personal-ranking">BXH cá nhân</button><button class="' + (page === "company-ranking" ? "active" : "") + '" data-action="page" data-page="company-ranking">BXH công ty</button><button class="' + (page === "global-chat" ? "active" : "") + '" data-action="page" data-page="global-chat">Chat tổng</button><button class="' + (page === "messages" ? "active" : "") + '" data-action="page" data-page="messages">Tin nhắn</button></nav><button class="button" type="button" data-action-community="refresh" data-page="' + esc(page) + '"' + (pending[page] ? " disabled" : "") + '>Làm mới</button></div>';
  }
  function playerRows(rows, ranking, metric) {
    if (!rows.length) return '<div class="panel community-empty"><strong>Chưa có người chơi trong danh sách.</strong><p>Người chơi có tiến trình trên cùng server Supabase sẽ xuất hiện ở đây.</p></div>';
    return '<div class="panel community-table-wrap"><div class="community-table community-table-head ' + (ranking ? "ranking" : "directory") + '"><span>HẠNG</span><span>NGƯỜI CHƠI</span><span>CÔNG TY</span>' + (ranking ? '<span>' + metric + '</span>' : '<span>HỒ SƠ</span>') + '</div>' + rows.map(function (player, index) {
      var amount = metric === "TÀI CHÍNH CÔNG TY" ? player.business_cash : player.personal_cash;
      var identity = '<i class="community-avatar">' + safeAvatar(player.avatar_url, player.display_name) + '</i><strong>' + esc(player.display_name || "Người chơi") + '</strong>';
      return '<article class="community-table community-player-row ' + (ranking ? "ranking" : "directory") + '"><span class="community-rank">' + String(Number(player.rank_position) || index + 1).padStart(2, "0") + '</span><button class="community-player community-profile-link" type="button" data-action-community="profile" data-id="' + esc(player.character_id) + '">' + identity + '</button><span class="community-company">' + esc(player.company_name || "Chưa thành lập") + '</span>' + (ranking ? '<strong class="community-amount">' + esc(window.APXUI.money(Number(amount) || 0)) + '</strong>' : '<button class="button community-profile-button" type="button" data-action-community="profile" data-id="' + esc(player.character_id) + '">Xem hồ sơ</button>') + '</article>';
    }).join("") + '</div>';
  }
  function showProfile(characterId) {
    view = "profile"; profile = null; peer = null;
    status.profile = "Đang tải hồ sơ…";
    window.APXGame.render();
    client().then(function (db) { return db.rpc("apx_public_player_profile", { p_character_id: characterId }); })
      .then(function (result) {
        if (result.error) throw result.error;
        profile = Array.isArray(result.data) ? result.data[0] : result.data;
        if (!profile) throw new Error("Không tìm thấy hồ sơ người chơi.");
        status.profile = "";
      }).catch(function (error) { status.profile = error && error.message ? error.message : "Không tải được hồ sơ."; })
      .finally(function () { if (currentPage() && window.APXGame) window.APXGame.render(); });
  }
  function profileView() {
    var p = profile;
    if (!p) return '<section class="panel community-empty"><button class="button" data-action-community="back" type="button">← Quay lại</button><p role="status">' + esc(status.profile || "Đang tải hồ sơ…") + '</p></section>';
    return '<section class="panel public-player-profile"><button class="button" data-action-community="back" type="button">← Quay lại danh sách</button><div class="public-player-heading"><i class="community-avatar large">' + safeAvatar(p.avatar_url, p.display_name) + '</i><div><span class="eyebrow">HỒ SƠ NGƯỜI CHƠI</span><h2>' + esc(p.display_name) + '</h2><small>ID nhân vật: ' + esc(p.character_id) + '</small></div></div><div class="public-player-stats"><div><small>CÔNG TY CHÍNH</small><strong>' + esc(p.company_name || "Chưa thành lập") + '</strong></div><div><small>SỐ CÔNG TY</small><strong>' + Number(p.company_count || 0) + '</strong></div><div><small>NHÂN VIÊN</small><strong>' + Number(p.employee_count || 0) + '</strong></div><div><small>TIỀN CÁ NHÂN</small><strong>' + esc(window.APXUI.money(Number(p.personal_cash) || 0)) + '</strong></div><div><small>TÀI SẢN CÔNG TY</small><strong>' + esc(window.APXUI.money(Number(p.business_cash) || 0)) + '</strong></div></div><button class="button button-gold" type="button" data-action-community="dm" data-id="' + esc(p.character_id) + '" data-name="' + esc(p.display_name) + '" data-avatar="' + esc(p.avatar_url || "") + '">Nhắn tin</button></section>';
  }
  function chatMessages(rows, direct) {
    if (!rows.length) return '<p class="community-empty-chat">Chưa có tin nhắn. Hãy bắt đầu trò chuyện.</p>';
    return rows.map(function (item) {
      var time = item.created_at ? new Date(item.created_at).toLocaleString("vi-VN", { dateStyle: "short", timeStyle: "short" }) : "";
      return '<article class="community-chat-message"><i class="community-avatar">' + safeAvatar(item.avatar_url, item.display_name) + '</i><div><div class="community-chat-meta"><strong>' + esc(item.display_name || "Người chơi") + '</strong><time>' + esc(time) + '</time></div><p>' + esc(item.body || item.message || "") + '</p></div></article>';
    }).join("");
  }
  function globalChat() {
    fetchPage("global-chat", false);
    var rows = cache["global-chat"] || [];
    return heading("Chat tổng", "Trò chuyện với mọi người trong cộng đồng APX.") + toolbar("global-chat") + (status["global-chat"] ? '<p class="community-message" role="status">' + esc(status["global-chat"]) + '</p>' : '') + '<section class="panel community-chat-panel"><div class="community-chat-list">' + chatMessages(rows, false) + '</div><form id="globalChatForm" class="community-chat-form"><textarea name="body" maxlength="500" placeholder="Viết tin nhắn (tối đa 500 ký tự)…" required></textarea><button class="button button-gold" type="submit">Gửi</button></form></section>';
  }
  function openDirectMessages(characterId, name, avatarUrl) {
    peer = { character_id: characterId, display_name: name || "Người chơi", avatar_url: avatarUrl || "" };
    view = "dm";
    cache.dm = null;
    status.dm = "Đang tải lịch sử trò chuyện…";
    window.APXGame.render();
    client().then(function (db) { return db.rpc("apx_direct_messages", { p_character_id: characterId, p_limit: 50 }); })
      .then(function (result) { if (result.error) throw result.error; cache.dm = Array.isArray(result.data) ? result.data : []; status.dm = ""; })
      .catch(function (error) { status.dm = error && error.message ? error.message : "Không tải được tin nhắn."; })
      .finally(function () { if (currentPage() && window.APXGame) window.APXGame.render(); });
  }
  function directChat() {
    var rows = cache.dm || [];
    return heading("Tin nhắn riêng", "Cuộc trò chuyện được lưu trên Supabase và giữ nguyên sau khi bạn đăng nhập lại.") + toolbar("messages") + '<section class="panel community-chat-panel"><div class="community-chat-heading"><button class="button" data-action-community="back" type="button">← Danh sách trò chuyện</button><strong>' + esc(peer.display_name) + '</strong></div><div class="community-chat-list">' + (status.dm ? '<p role="status">' + esc(status.dm) + '</p>' : chatMessages(rows, true)) + '</div><form id="directChatForm" class="community-chat-form"><textarea name="body" maxlength="500" placeholder="Nhắn tin cho ' + esc(peer.display_name) + '…" required></textarea><button class="button button-gold" type="submit">Gửi</button></form></section>';
  }
  function inbox() {
    fetchPage("messages", false);
    var rows = cache.messages || [];
    return heading("Tin nhắn riêng", "Lịch sử trò chuyện với người chơi bạn từng nhắn tin.") + toolbar("messages") + (status.messages ? '<p class="community-message" role="status">' + esc(status.messages) + '</p>' : '') + (rows.length ? '<section class="community-inbox">' + rows.map(function (row) { return '<button class="panel community-inbox-row" type="button" data-action-community="open-thread" data-id="' + esc(row.character_id) + '" data-name="' + esc(row.display_name) + '" data-avatar="' + esc(row.avatar_url || "") + '"><i class="community-avatar">' + safeAvatar(row.avatar_url, row.display_name) + '</i><span><strong>' + esc(row.display_name) + '</strong><small>' + esc(row.last_message || "") + '</small></span><time>' + esc(row.last_message_at ? new Date(row.last_message_at).toLocaleDateString("vi-VN") : "") + '</time></button>'; }).join("") + '</section>' : '<section class="panel community-empty"><strong>Chưa có cuộc trò chuyện.</strong><p>Mở hồ sơ người chơi trong danh sách hoặc BXH để nhắn tin.</p></section>');
  }
  function render(page) {
    if (!signedIn()) return heading("Cộng đồng người chơi", "Đăng nhập để mở hồ sơ công khai, bảng xếp hạng và chat.") + '<section class="panel community-empty"><strong>Cần đăng nhập Supabase</strong><button class="button button-gold" type="button" data-action="section" data-section="account">Mở tài khoản</button></section>';
    if (view === "profile") return heading("Hồ sơ người chơi", "Thông tin công khai trong APX.") + profileView();
    if (view === "dm" && peer) return directChat();
    if (page === "global-chat") return globalChat();
    if (page === "messages") return inbox();
    fetchPage(page, false);
    var directory = page === "players";
    var company = page === "company-ranking";
    var title = directory ? "Người chơi APX" : company ? "Bảng xếp hạng công ty" : "Bảng xếp hạng cá nhân";
    var metric = company ? "TÀI CHÍNH CÔNG TY" : "TIỀN CÁ NHÂN";
    var rows = cache[page] || [];
    return heading(title, directory ? "Chọn một người chơi để xem hồ sơ và gửi tin nhắn." : "So sánh tài chính của người chơi cùng server.") + toolbar(page) + (status[page] ? '<p class="community-message" role="status">' + esc(status[page]) + '</p>' : '') + playerRows(rows, !directory, metric) + '<p class="community-note">Thông tin và bảng xếp hạng được tải khi bạn mở trang hoặc bấm Làm mới. Game không theo dõi ai đang online.</p>';
  }
  document.addEventListener("click", function (event) {
    var button = event.target.closest("[data-action-community]");
    if (!button) return;
    var action = button.dataset.actionCommunity;
    if (action === "refresh") {
      delete cache[button.dataset.page]; fetchPage(button.dataset.page, true);
    } else if (action === "profile") {
      showProfile(button.dataset.id);
    } else if (action === "dm" || action === "open-thread") {
      openDirectMessages(button.dataset.id, button.dataset.name, button.dataset.avatar);
    } else if (action === "back") {
      if (view === "dm") { view = null; peer = null; cache.messages = null; fetchPage("messages", true); }
      else { view = null; profile = null; }
      window.APXGame.render();
    }
  });
  document.addEventListener("submit", function (event) {
    var form = event.target;
    if (!form || (form.id !== "globalChatForm" && form.id !== "directChatForm")) return;
    event.preventDefault();
    var body = String(form.elements.body.value || "").trim();
    if (!body || body.length > 500 || pending.send) return;
    pending.send = true;
    client().then(function (db) {
      return form.id === "globalChatForm"
        ? db.rpc("apx_global_chat_send", { p_body: body })
        : db.rpc("apx_send_direct_message", { p_character_id: peer.character_id, p_body: body });
    }).then(function (result) {
      if (result.error) throw result.error;
      form.reset();
      if (form.id === "globalChatForm") { cache["global-chat"] = null; fetchPage("global-chat", true); }
      else { cache.dm = null; openDirectMessages(peer.character_id, peer.display_name, peer.avatar_url); }
    }).catch(function (error) {
      status[form.id === "globalChatForm" ? "global-chat" : "dm"] = error && error.message ? error.message : "Không gửi được tin nhắn.";
      if (window.APXGame) window.APXGame.render();
    }).finally(function () { pending.send = false; });
  });
  window.APXPages.community = render;
})();

/* Cộng đồng APX: hồ sơ công khai, bảng xếp hạng và tin nhắn có lưu lịch sử. */
window.APXPages = window.APXPages || {};
(function () {
  "use strict";
  var cache = Object.create(null);
  var pending = Object.create(null);
  var status = Object.create(null);
  var view = null;
  var profile = null;
  var profileCompanyId = null;
  var peer = null;
  var rewardMailCache = null;
  var rewardMailPending = false;
  var rewardMailStatus = "";
  var chatWidgetOpen = false;
  var chatWidgetDrag = null;
  var chatWidgetSuppressClick = false;

  function esc(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function safeAvatar(url, name) {
    var value = String(url || "");
    if (/^https:\/\//i.test(value) || /^assets\/characters\/player\/(?:skin|base)\/[a-z0-9._-]+\.png$/i.test(value)) return '<img src="' + esc(value) + '" alt="">';
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
      if (page === "global-chat") renderChatWidget();
    });
  }
  function heading(title, detail) {
    return '<header class="page-heading"><span class="eyebrow">APX NETWORK · CỘNG ĐỒNG</span><h1>' + esc(title) + '</h1></header>';
  }
  function toolbar(page) {
    return '<div class="community-toolbar"><nav class="community-tabs" aria-label="Cộng đồng APX"><button class="' + (page === "players" ? "active" : "") + '" data-action="page" data-page="players">Người chơi</button><button class="' + (page === "personal-ranking" ? "active" : "") + '" data-action="page" data-page="personal-ranking">BXH cá nhân</button><button class="' + (page === "company-ranking" ? "active" : "") + '" data-action="page" data-page="company-ranking">BXH công ty</button><button class="' + (page === "global-chat" ? "active" : "") + '" data-action="page" data-page="global-chat">Chat tổng</button><button class="' + (page === "messages" ? "active" : "") + '" data-action="page" data-page="messages">Tin nhắn</button></nav><button class="button" type="button" data-action-community="refresh" data-page="' + esc(page) + '"' + (pending[page] ? " disabled" : "") + '>Làm mới</button></div>';
  }
  function playerRows(rows, ranking, metric) {
    if (!rows.length) return '<div class="panel community-empty"><strong>Chưa có người chơi trong danh sách.</strong></div>';
    return '<div class="panel community-table-wrap"><div class="community-table community-table-head ' + (ranking ? "ranking" : "directory") + '"><span>HẠNG</span><span>NGƯỜI CHƠI</span><span>CÔNG TY</span>' + (ranking ? '<span>' + metric + '</span>' : '<span>HỒ SƠ</span>') + '</div>' + rows.map(function (player, index) {
      var amount = metric === "TÀI CHÍNH CÔNG TY" ? player.business_cash : player.personal_cash;
      var identity = '<i class="community-avatar">' + safeAvatar(player.avatar_url, player.display_name) + '</i><strong>' + esc(player.display_name || "Người chơi") + '</strong>';
      return '<article class="community-table community-player-row ' + (ranking ? "ranking" : "directory") + '"><span class="community-rank">' + String(Number(player.rank_position) || index + 1).padStart(2, "0") + '</span><button class="community-player community-profile-link" type="button" data-action-community="profile" data-id="' + esc(player.character_id) + '">' + identity + '</button><span class="community-company">' + esc(player.company_name || "Chưa thành lập") + '</span>' + (ranking ? '<strong class="community-amount">' + esc(window.APXUI.money(Number(amount) || 0)) + '</strong>' : '<button class="button community-profile-button" type="button" data-action-community="profile" data-id="' + esc(player.character_id) + '">Xem hồ sơ</button>') + '</article>';
    }).join("") + '</div>';
  }
  function showProfile(characterId) {
    view = "profile"; profile = null; profileCompanyId = null; peer = null;
    status.profile = "Đang tải hồ sơ…";
    window.APXGame.render();
    client().then(function (db) {
      return Promise.all([
        db.rpc("apx_public_player_profile_details", { p_character_id: characterId }),
        db.rpc("apx_life_public_properties", { p_character_id: characterId })
      ]);
    }).then(function (results) {
        results.forEach(function (result) { if (result.error) throw result.error; });
        profile = results[0].data;
        profile.life_properties = Array.isArray(results[1].data) ? results[1].data : [];
        if (!profile) throw new Error("Không tìm thấy hồ sơ người chơi.");
        status.profile = "";
      }).catch(function (error) { status.profile = error && error.message ? error.message : "Không tải được hồ sơ."; })
      .finally(function () { if (currentPage() && window.APXGame) window.APXGame.render(); });
  }
  function profileMoney(value) {
    return value == null || !Number.isFinite(Number(value)) ? "--" : window.APXUI.money(Number(value));
  }
  function profileNumber(value) {
    return value == null || !Number.isFinite(Number(value)) ? "--" : Number(value).toLocaleString("vi-VN");
  }
  function profileCompanyView() {
    var company = (profile && profile.companies || []).find(function (item) { return item.id === profileCompanyId; });
    if (!company) return '<section class="panel community-empty"><button class="button" data-action-community="back-to-profile" type="button">← Hồ sơ người chơi</button><p>Không có dữ liệu công ty.</p></section>';
    return heading(company.name || "Doanh nghiệp", "Thông tin công khai từ save của người chơi.") +
      '<section class="panel public-company-profile"><button class="button" data-action-community="back-to-profile" type="button">← Hồ sơ người chơi</button><div class="public-company-heading"><span class="eyebrow">' + esc(company.field || "Doanh nghiệp") + '</span><h2>' + esc(company.name || "Doanh nghiệp") + '</h2><span>Cấp ' + profileNumber(company.level) + '</span></div><div class="public-player-stats"><div><small>NHÂN VIÊN</small><strong>' + profileNumber(company.employee_count) + '</strong></div><div><small>GIÁ TRỊ CÔNG TY</small><strong>' + profileMoney(company.value) + '</strong></div><div><small>TỔNG DOANH THU</small><strong>' + profileMoney(company.revenue) + '</strong></div><div><small>TỔNG LỢI NHUẬN</small><strong>' + profileMoney(company.profit) + '</strong></div><div><small>HẠNG BXH TÀI CHÍNH</small><strong>' + (profile.company_rank ? '#' + profileNumber(profile.company_rank) : '--') + '</strong></div></div></section>';
  }
  function profileView() {
    var p = profile;
    if (!p) return '<section class="panel community-empty"><button class="button" data-action-community="back" type="button">← Quay lại</button><p role="status">' + esc(status.profile || "Đang tải hồ sơ…") + '</p></section>';
    var skin = window.APXWardrobe && window.APXWardrobe.findSkin
      ? (window.APXWardrobe.findSkin(p.skin_id) || window.APXWardrobe.findSkin("skin-base-dark"))
      : null;
    var avatar = (skin && skin.src) || p.avatar_url || "";
    var characterArt = skin
      ? '<div class="public-profile-character"><img src="' + esc(skin.src) + '" alt="' + esc(skin.name + ' · ' + (p.display_name || 'Người chơi')) + '"></div>'
      : '<i class="community-avatar large public-profile-avatar">' + safeAvatar(p.avatar_url, p.display_name) + '</i>';
    var playerCode = String(p.character_id || "").replace(/-/g, "").slice(0, 8).toUpperCase();
    var joined = p.joined_at ? new Date(p.joined_at).toLocaleDateString("vi-VN") : "--";
    var companies = Array.isArray(p.companies) ? p.companies : [];
    var lifeHouses = Array.isArray(p.life_properties) ? p.life_properties : [];
    var stats = p.stats || {};
    var definitions = window.APXCharacter && window.APXCharacter.achievementDefinitions || [];
    var achieved = Array.isArray(p.achievement_ids) ? p.achievement_ids : [];
    var achievementCards = definitions.map(function (item) {
      var unlocked = achieved.indexOf(item.id) >= 0;
      return '<article class="community-achievement' + (unlocked ? ' is-unlocked' : ' is-locked') + '" title="' + esc(item.description) + '"><span>' + esc(item.mark || '•') + '</span><strong>' + esc(item.title) + '</strong><small>' + (unlocked ? 'Đã đạt' : 'Chưa đạt') + '</small></article>';
    }).join('');
    var companyCards = companies.length ? companies.map(function (company) {
      return '<article class="panel public-company-card"><div><span class="eyebrow">' + esc(company.field || 'Doanh nghiệp') + ' · CẤP ' + profileNumber(company.level) + '</span><h3>' + esc(company.name || 'Doanh nghiệp') + '</h3></div><div class="public-company-card-stats"><span>Nhân viên<strong>' + profileNumber(company.employee_count) + '</strong></span><span>Giá trị<strong>' + profileMoney(company.value) + '</strong></span><span>Doanh thu<strong>' + profileMoney(company.revenue) + '</strong></span><span>Lợi nhuận<strong>' + profileMoney(company.profit) + '</strong></span></div><button class="button button-gold" type="button" data-action-community="show-company" data-id="' + esc(company.id) + '">Xem công ty</button></article>';
    }).join('') : '<section class="panel community-empty"><strong>Chưa thành lập doanh nghiệp</strong></section>';
    var lifeHouseCards = lifeHouses.length ? lifeHouses.map(function (house) {
      var fallback = house.exterior_image || '';
      var image = window.APXLife && window.APXLife.preferredHousePhoto ? window.APXLife.preferredHousePhoto(fallback) : fallback;
      return '<article class="panel public-life-house"><img src="' + esc(image) + '" alt="' + esc(house.name) + '" width="640" height="360" loading="lazy" data-life-profile-image data-fallback="' + esc(fallback) + '"><div><span class="eyebrow">' + esc(house.rarity || 'Nhà ở') + (house.is_primary ? ' · NƠI Ở CHÍNH' : '') + '</span><h3>' + esc(house.name) + '</h3><p>' + esc(house.description || '') + '</p></div></article>';
    }).join('') : '<p class="community-note">Chưa có nhà APX LIFE công khai.</p>';
    return '<section class="public-player-profile"><header class="panel public-player-hero"><button class="button public-profile-close" data-action-community="back" type="button" aria-label="Đóng hồ sơ">Đóng</button>' + characterArt + '<div class="public-profile-identity"><span class="eyebrow">HỒ SƠ NGƯỜI CHƠI</span><h2>' + esc(p.display_name || 'Người chơi') + '</h2><span>ID người chơi · ' + esc(playerCode || '--') + '</span><span>Cấp ' + profileNumber(p.level) + ' · Tham gia ' + esc(joined) + '</span></div><button class="button button-gold" type="button" data-action-community="dm" data-id="' + esc(p.character_id) + '" data-name="' + esc(p.display_name) + '" data-avatar="' + esc(avatar) + '">Nhắn tin</button></header>' +
      '<section class="public-player-stats"><article><small>GIAO DỊCH ĐÃ GHI NHẬN</small><strong>' + profileNumber(stats.transactions) + '</strong></article><article><small>TỔNG DOANH THU</small><strong>' + profileMoney(stats.revenue) + '</strong></article><article><small>GIÁ TRỊ TÀI SẢN</small><strong>' + profileMoney(stats.assets) + '</strong></article><article><small>NHÂN VIÊN</small><strong>' + profileNumber(stats.employees) + '</strong></article><article><small>SẢN PHẨM ĐÃ BÁN</small><strong>' + profileNumber(stats.products_sold) + '</strong></article><article><small>THÀNH TỰU</small><strong>' + profileNumber(stats.achievements) + ' / ' + profileNumber(definitions.length) + '</strong></article><article><small>NGÀY TRONG GAME</small><strong>' + profileNumber(p.game_day) + '</strong></article></section>' +
      '<section class="public-profile-section"><div class="section-title-row"><div><span class="eyebrow">APX LIFE</span><h3>Nhà đang sở hữu</h3></div></div><div class="public-life-houses">' + lifeHouseCards + '</div></section>' +
      '<section class="public-profile-section"><div class="section-title-row"><div><span class="eyebrow">HỆ SINH THÁI</span><h3>Doanh nghiệp</h3></div><span>' + (p.company_rank ? 'Hạng BXH #' + profileNumber(p.company_rank) : '') + '</span></div><div class="public-company-grid">' + companyCards + '</div></section>' +
      '<section class="public-profile-section"><div class="section-title-row"><div><span class="eyebrow">CỘT MỐC</span><h3>Thành tựu & huy hiệu</h3></div></div><div class="community-achievement-grid">' + (achievementCards || '<p class="community-note">Chưa có dữ liệu thành tựu.</p>') + '</div></section></section>';
  }
  function chatMessages(rows, direct, plainIdentity) {
    if (!rows.length) return '<p class="community-empty-chat">Chưa có tin nhắn. Hãy bắt đầu trò chuyện.</p>';
    return rows.map(function (item) {
      var time = item.created_at ? new Date(item.created_at).toLocaleString("vi-VN", { dateStyle: "short", timeStyle: "short" }) : "";
      var identity = item.character_id && !plainIdentity
        ? '<button class="community-chat-profile" type="button" data-action-community="profile" data-id="' + esc(item.character_id) + '"><i class="community-avatar">' + safeAvatar(item.avatar_url, item.display_name) + '</i><strong>' + esc(item.display_name || "Người chơi") + '</strong></button>'
        : '<i class="community-avatar">' + safeAvatar(item.avatar_url, item.display_name) + '</i><strong>' + esc(item.display_name || "Người chơi") + '</strong>';
      return '<article class="community-chat-message">' + identity + '<div><div class="community-chat-meta"><time>' + esc(time) + '</time></div><p>' + esc(item.body || item.message || "") + '</p></div></article>';
    }).join("");
  }
  function renderChatWidget() {
    var root = document.getElementById("globalChatWidgetRoot");
    if (!root) return;
    var draft = root.querySelector("#globalChatBubbleForm textarea");
    var draftValue = draft ? draft.value : "";
    var draftFocused = draft && document.activeElement === draft;
    var draftSelection = draftFocused ? [draft.selectionStart, draft.selectionEnd] : null;
    var list = root.querySelector(".global-chat-widget-list");
    var hadList = Boolean(list);
    var scrollPosition = list ? list.scrollTop : 0;
    var content = "";
    if (chatWidgetOpen) {
      if (!signedIn()) {
        content = '<section class="global-chat-widget-panel" aria-labelledby="globalChatWidgetTitle"><header class="global-chat-widget-header" data-chat-drag-handle><strong id="globalChatWidgetTitle">Chat tổng</strong><button type="button" class="global-chat-widget-close" data-global-chat-action="close" aria-label="Đóng chat">×</button></header><p class="global-chat-widget-locked">Đăng nhập để xem và gửi tin nhắn trong cộng đồng.</p><button class="button button-gold" type="button" data-action="section" data-section="account">Mở tài khoản</button></section>';
      } else {
        fetchPage("global-chat", false);
        var rows = cache["global-chat"] || [];
        var chatStatus = status["global-chat"];
        content = '<section class="global-chat-widget-panel" aria-labelledby="globalChatWidgetTitle"><header class="global-chat-widget-header" data-chat-drag-handle><div><strong id="globalChatWidgetTitle">Chat tổng</strong><small>Mọi người trong cộng đồng APX</small></div><div class="global-chat-widget-controls"><button type="button" class="global-chat-widget-close" data-global-chat-action="refresh" aria-label="Làm mới chat">↻</button><button type="button" class="global-chat-widget-close" data-global-chat-action="close" aria-label="Đóng chat">×</button></div></header>' +
          (chatStatus ? '<p class="global-chat-widget-status" role="status">' + esc(chatStatus) + '</p>' : '') +
          '<div class="community-chat-list global-chat-widget-list">' + chatMessages(rows, false, true) + '</div>' +
          '<form id="globalChatBubbleForm" class="community-chat-form global-chat-widget-form"><textarea name="body" maxlength="500" placeholder="Viết tin nhắn…" aria-label="Tin nhắn chat tổng" required></textarea><button class="button button-gold" type="submit"' + (pending.send ? " disabled" : "") + '>Gửi</button></form></section>';
      }
    }
    root.innerHTML = content + '<button type="button" class="global-chat-widget-launcher' + (chatWidgetOpen ? " is-open" : "") + '" data-global-chat-action="toggle" data-chat-drag-handle aria-expanded="' + (chatWidgetOpen ? "true" : "false") + '" aria-label="' + (chatWidgetOpen ? "Đóng chat tổng" : "Mở chat tổng") + '"><span aria-hidden="true">💬</span><strong>Chat tổng</strong></button>';
    var updatedList = root.querySelector(".global-chat-widget-list");
    if (updatedList) updatedList.scrollTop = hadList ? scrollPosition : updatedList.scrollHeight;
    var updatedDraft = root.querySelector("#globalChatBubbleForm textarea");
    if (updatedDraft) {
      updatedDraft.value = draftValue;
      if (draftFocused) {
        updatedDraft.focus();
        updatedDraft.setSelectionRange(draftSelection[0], draftSelection[1]);
      }
    }
  }
  function handleChatWidgetClick(event) {
    var button = event.target.closest("[data-global-chat-action]");
    if (!button) return;
    event.preventDefault();
    var action = button.dataset.globalChatAction;
    if (action === "toggle") {
      if (chatWidgetSuppressClick) {
        chatWidgetSuppressClick = false;
        return;
      }
      chatWidgetOpen = !chatWidgetOpen;
      if (chatWidgetOpen && signedIn()) fetchPage("global-chat", false);
    } else if (action === "close") {
      chatWidgetOpen = false;
    } else if (action === "refresh") {
      delete cache["global-chat"];
      fetchPage("global-chat", true);
    }
    renderChatWidget();
  }
  function startChatWidgetDrag(event) {
    var handle = event.target.closest("[data-chat-drag-handle]");
    if (!handle || event.button !== 0 || event.target.closest("button:not([data-global-chat-action='toggle'])")) return;
    var root = document.getElementById("globalChatWidgetRoot");
    if (!root) return;
    var rect = root.getBoundingClientRect();
    chatWidgetDrag = { pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, left: rect.left, top: rect.top, moved: false };
    handle.setPointerCapture(event.pointerId);
  }
  function moveChatWidget(event) {
    if (!chatWidgetDrag || event.pointerId !== chatWidgetDrag.pointerId) return;
    var dx = event.clientX - chatWidgetDrag.startX;
    var dy = event.clientY - chatWidgetDrag.startY;
    if (!chatWidgetDrag.moved && Math.abs(dx) + Math.abs(dy) < 5) return;
    chatWidgetDrag.moved = true;
    var root = document.getElementById("globalChatWidgetRoot");
    if (!root) return;
    var left = Math.max(8, Math.min(window.innerWidth - root.offsetWidth - 8, chatWidgetDrag.left + dx));
    var top = Math.max(8, Math.min(window.innerHeight - root.offsetHeight - 8, chatWidgetDrag.top + dy));
    root.style.left = left + "px";
    root.style.top = top + "px";
    root.style.right = "auto";
    root.style.bottom = "auto";
    root.classList.add("is-dragging");
  }
  function endChatWidgetDrag(event) {
    if (!chatWidgetDrag || event.pointerId !== chatWidgetDrag.pointerId) return;
    if (chatWidgetDrag.moved) {
      chatWidgetSuppressClick = true;
      window.setTimeout(function () { chatWidgetSuppressClick = false; }, 0);
    }
    chatWidgetDrag = null;
    var root = document.getElementById("globalChatWidgetRoot");
    if (root) root.classList.remove("is-dragging");
  }
  function keepChatWidgetInViewport() {
    var root = document.getElementById("globalChatWidgetRoot");
    if (!root || !root.style.left || !root.style.top) return;
    var rect = root.getBoundingClientRect();
    root.style.left = Math.max(8, Math.min(window.innerWidth - rect.width - 8, rect.left)) + "px";
    root.style.top = Math.max(8, Math.min(window.innerHeight - rect.height - 8, rect.top)) + "px";
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
    return heading("Tin nhắn", "Tin nhắn riêng và thư quà tặng trong cộng đồng APX.") + toolbar("messages") + mailboxTabs("messages") + (status.messages ? '<p class="community-message" role="status">' + esc(status.messages) + '</p>' : '') + (rows.length ? '<section class="community-inbox">' + rows.map(function (row) { return '<button class="panel community-inbox-row" type="button" data-action-community="open-thread" data-id="' + esc(row.character_id) + '" data-name="' + esc(row.display_name) + '" data-avatar="' + esc(row.avatar_url || "") + '"><i class="community-avatar">' + safeAvatar(row.avatar_url, row.display_name) + '</i><span><strong>' + esc(row.display_name) + '</strong><small>' + esc(row.last_message || "") + '</small></span><time>' + esc(row.last_message_at ? new Date(row.last_message_at).toLocaleDateString("vi-VN") : "") + '</time></button>'; }).join("") + '</section>' : '<section class="panel community-empty"><strong>Chưa có cuộc trò chuyện.</strong><p>Mở hồ sơ người chơi trong danh sách hoặc BXH để nhắn tin.</p></section>');
  }
  function mailboxTabs(active) {
    return '<nav class="community-tabs community-mail-tabs" aria-label="Hộp thư cộng đồng"><button class="' + (active === "messages" ? "active" : "") + '" type="button" data-action-community="show-inbox">Tin nhắn riêng</button><button class="' + (active === "reward-mail" ? "active" : "") + '" type="button" data-action-community="show-reward-mail">Thư quà tặng</button></nav>';
  }
  function fetchRewardMail(force) {
    if (!signedIn() || rewardMailPending || (Array.isArray(rewardMailCache) && !force)) return;
    rewardMailPending = true;
    rewardMailStatus = "Đang tải thư quà tặng…";
    client().then(function (db) {
      return db.rpc("apx_reward_mail_list");
    }).then(function (result) {
      if (result.error) throw result.error;
      rewardMailCache = Array.isArray(result.data) ? result.data : [];
      rewardMailStatus = "";
    }).catch(function (error) {
      rewardMailCache = [];
      rewardMailStatus = error && error.message ? error.message : "Không tải được thư quà tặng.";
    }).finally(function () {
      rewardMailPending = false;
      if (currentPage() === "messages" && view === "reward-mail" && window.APXGame) window.APXGame.render();
    });
  }
  function rewardInbox() {
    fetchRewardMail(false);
    var rows = rewardMailCache || [];
    var items = rows.map(function (mail) {
      var claimed = Boolean(mail.claimed_at);
      var created = mail.created_at ? new Date(mail.created_at).toLocaleString("vi-VN") : "";
      var action = claimed
        ? '<button class="button" type="button" disabled>Đã nhận</button>'
        : '<button class="button button-gold" type="button" data-action-community="claim-reward-mail" data-id="' + Number(mail.id) + '"' + (rewardMailPending ? " disabled" : "") + '>Nhận ' + esc(window.APXUI.money(Number(mail.cash_reward) || 0)) + '</button>';
      return '<article class="panel community-reward-mail' + (claimed ? ' is-claimed' : '') + '"><div class="community-reward-mail-header"><span class="eyebrow">THƯ QUÀ TẶNG · ' + esc(created) + '</span><strong>' + (claimed ? 'Đã nhận' : 'Chưa nhận') + '</strong></div><h3>' + esc(mail.subject) + '</h3><p>' + esc(mail.body) + '</p><div class="community-reward-mail-footer"><strong>' + esc(window.APXUI.money(Number(mail.cash_reward) || 0)) + '</strong>' + action + '</div></article>';
    }).join("");
    var content = rewardMailStatus
      ? '<p class="community-message" role="status">' + esc(rewardMailStatus) + '</p>'
      : items || '<section class="panel community-empty"><strong>Hộp thư chưa có quà.</strong><p>Thư đền bù và quà tặng sẽ xuất hiện ở đây.</p></section>';
    return heading("Thư quà tặng", "Quà trong thư chỉ được cộng vào tài khoản khi bạn bấm nhận.") + toolbar("messages") + mailboxTabs("reward-mail") + content;
  }
  function claimRewardMail(mailId) {
    if (rewardMailPending) return;
    rewardMailPending = true;
    rewardMailStatus = "Đang nhận quà…";
    window.APXGame.render();
    client().then(function (db) {
      return db.rpc("apx_reward_mail_claim", { p_mail_id: Number(mailId) });
    }).then(function (result) {
      if (result.error) throw result.error;
      var reward = result.data || {};
      return window.APXAccount.sync().then(function () { return reward; });
    }).then(function (reward) {
      rewardMailCache = (rewardMailCache || []).map(function (mail) {
        return Number(mail.id) === Number(mailId) ? Object.assign({}, mail, { claimed_at: new Date().toISOString() }) : mail;
      });
      rewardMailStatus = "";
      window.APXGame.toast("Đã nhận thư quà tặng " + window.APXUI.money(Number(reward.granted_cash) || 0) + ".");
    }).catch(function (error) {
      rewardMailStatus = error && error.message ? error.message : "Không nhận được quà.";
    }).finally(function () {
      rewardMailPending = false;
      if (currentPage() === "messages" && view === "reward-mail" && window.APXGame) window.APXGame.render();
    });
  }
  function render(page) {
    if (!signedIn()) return heading("Cộng đồng người chơi", "Đăng nhập để mở hồ sơ công khai, bảng xếp hạng và chat.") + '<section class="panel community-empty"><strong>Cần đăng nhập Supabase</strong><button class="button button-gold" type="button" data-action="section" data-section="account">Mở tài khoản</button></section>';
    if (view === "profile-company") return profileCompanyView();
    if (view === "reward-mail" && page === "messages") return rewardInbox();
    if (view === "profile") {
      var publicProfile = heading("Hồ sơ người chơi", "Thông tin công khai trong APX.") + profileView();
      window.requestAnimationFrame(function () {
        document.querySelectorAll("[data-life-profile-image]").forEach(function (image) {
          image.onerror = function () {
            image.onerror = null;
            image.src = image.dataset.fallback || "assets/apx-life/interiors/home-interior.svg";
          };
        });
      });
      return publicProfile;
    }
    if (view === "dm" && peer) return directChat();
    if (page === "global-chat") return globalChat();
    if (page === "messages") return inbox();
    fetchPage(page, false);
    var directory = page === "players";
    var company = page === "company-ranking";
    var title = directory ? "Người chơi APX" : company ? "Bảng xếp hạng công ty" : "Bảng xếp hạng cá nhân";
    var metric = company ? "TÀI CHÍNH CÔNG TY" : "TIỀN CÁ NHÂN";
    var rows = cache[page] || [];
    return heading(title) + toolbar(page) + (status[page] ? '<p class="community-message" role="status">' + esc(status[page]) + '</p>' : '') + playerRows(rows, !directory, metric);
  }
  document.addEventListener("click", function (event) {
    var button = event.target.closest("[data-action-community]");
    if (!button) return;
    var action = button.dataset.actionCommunity;
    if (action === "show-company") {
      profileCompanyId = button.dataset.id;
      view = "profile-company";
      window.APXGame.render();
    } else if (action === "back-to-profile") {
      view = "profile";
      window.APXGame.render();
    } else if (action === "show-inbox") {
      view = null; fetchPage("messages", true); window.APXGame.render();
    } else if (action === "show-reward-mail") {
      view = "reward-mail"; fetchRewardMail(false); window.APXGame.render();
    } else if (action === "claim-reward-mail") {
      claimRewardMail(button.dataset.id);
    } else if (action === "refresh") {
      if (view === "reward-mail") {
        rewardMailCache = null;
        fetchRewardMail(true);
      } else {
        delete cache[button.dataset.page]; fetchPage(button.dataset.page, true);
      }
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
  document.addEventListener("click", handleChatWidgetClick);
  document.addEventListener("pointerdown", startChatWidgetDrag);
  document.addEventListener("pointermove", moveChatWidget);
  document.addEventListener("pointerup", endChatWidgetDrag);
  document.addEventListener("pointercancel", endChatWidgetDrag);
  window.addEventListener("resize", keepChatWidgetInViewport);
  document.addEventListener("submit", function (event) {
    var form = event.target;
    if (!form || (form.id !== "globalChatForm" && form.id !== "globalChatBubbleForm" && form.id !== "directChatForm")) return;
    event.preventDefault();
    var body = String(form.elements.body.value || "").trim();
    if (!body || body.length > 500 || pending.send) return;
    var isGlobalChat = form.id === "globalChatForm" || form.id === "globalChatBubbleForm";
    pending.send = true;
    var submitButton = form.querySelector('[type="submit"]');
    if (submitButton) submitButton.disabled = true;
    client().then(function (db) {
      return isGlobalChat
        ? db.rpc("apx_global_chat_send", { p_body: body })
        : db.rpc("apx_send_direct_message", { p_character_id: peer.character_id, p_body: body });
    }).then(function (result) {
      if (result.error) throw result.error;
      form.reset();
      if (isGlobalChat) { cache["global-chat"] = null; fetchPage("global-chat", true); }
      else { cache.dm = null; openDirectMessages(peer.character_id, peer.display_name, peer.avatar_url); }
    }).catch(function (error) {
      status[isGlobalChat ? "global-chat" : "dm"] = error && error.message ? error.message : "Không gửi được tin nhắn.";
      if (isGlobalChat) renderChatWidget();
      if (window.APXGame && (!isGlobalChat || currentPage() === "global-chat")) window.APXGame.render();
    }).finally(function () {
      pending.send = false;
      renderChatWidget();
    });
  });
  window.APXCommunity = { renderChatWidget: renderChatWidget };
  window.APXPages.community = render;
})();

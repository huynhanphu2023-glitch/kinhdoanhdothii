/* APX phone: local-first apps backed by the existing game save and systems. */
(function () {
  "use strict";
  var apps = [
    ["messages", "Tin nhắn", "💬", "Tin nhắn"], ["phone", "Điện thoại", "📞", "Cuộc gọi"], ["contacts", "Danh bạ", "👥", "Liên hệ"], ["bank", "APXBank", "💳", "APXBank"],
    ["market", "Thị trường", "📈", "Đầu tư"], ["company", "Công việc", "💼", "Công ty"], ["map", "Bản đồ", "🗺️", "Thành phố"], ["weather", "Thời tiết", "🌤️", "Thời tiết"],
    ["news", "Tin tức APX", "📰", "Tin tức"], ["social", "Mạng xã hội", "🫶", "APX Life"], ["shop", "Cửa hàng", "🛍️", "Cửa hàng"], ["email", "Email", "✉️", "Thư"],
    ["calendar", "Lịch", "🗓️", "Lịch"], ["notes", "Ghi chú", "📝", "Ghi chú"], ["calculator", "Máy tính", "🧮", "Máy tính"], ["clock", "Đồng hồ", "⏱️", "Đồng hồ"],
    ["camera", "Camera", "📷", "Camera"], ["gallery", "Thư viện", "🌄", "Ảnh"], ["settings", "Cài đặt", "⚙️", "Cài đặt"], ["music", "Âm nhạc", "🎵", "Nhạc"],
    ["browser", "APX Web", "🌐", "Trình duyệt"], ["quests", "Nhiệm vụ", "🎯", "Nhiệm vụ"], ["profile", "Hồ sơ", "🪪", "Hồ sơ"]
  ];
  var root = document.getElementById("phoneRoot"), launcher = document.getElementById("phoneLauncher"), badge = document.getElementById("phoneBadge");
  var activeCall = null, calcValue = "", calcError = "";
  function esc(v) { return String(v == null ? "" : v).replace(/[&<>"']/g, function (c) { return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]; }); }
  function state() { return window.APXGame && window.APXGame.state; }
  function gameTime(s) { return window.APXGame && window.APXGame.getGameClock ? window.APXGame.getGameClock() : { day: s.day || 1, hour: 0, minute: 0 }; }
  function timeText(s) { var c = gameTime(s); return String(c.hour).padStart(2, "0") + ":" + String(c.minute).padStart(2, "0"); }
  function ensure(s) {
    if (!s.phone || typeof s.phone !== "object") s.phone = {};
    var p = s.phone;
    if (!Array.isArray(p.contacts)) p.contacts = [{ id: "npc-linh", name: "Linh", phone: "0900 000 168", avatar: "🌷", relationship: 50, mood: "Vui vẻ", memory: [], discovered: true }];
    if (!p.contacts.some(function (c) { return c.id === "npc-linh"; })) p.contacts.unshift({ id: "npc-linh", name: "Linh", phone: "0900 000 168", avatar: "🌷", relationship: 50, mood: "Vui vẻ", memory: [], discovered: true });
    ["notifications", "calls", "notes", "events", "emails", "alarms", "photos", "recentApps"].forEach(function (k) { if (!Array.isArray(p[k])) p[k] = []; });
    if (!p.chats || typeof p.chats !== "object") p.chats = { "npc-linh": [] };
    if (!Array.isArray(p.chats["npc-linh"])) p.chats["npc-linh"] = [];
    if (!p.wallpaper) p.wallpaper = "sunrise";
    if (typeof p.silent !== "boolean") p.silent = false;
    if (typeof p.notificationsEnabled !== "boolean") p.notificationsEnabled = true;
    if (!p.chats["npc-linh"].length) p.chats["npc-linh"].push({ id: "hello", from: "npc-linh", text: "Chào bạn, mình là Linh. Nhắn gì cho mình cũng được nha!", day: Number(s.day) || 1, minute: gameTime(s).hour * 60 + gameTime(s).minute, read: false });
    return p;
  }
  function save(message) { if (window.APXGame) { window.APXGame.save(); if (message) window.APXGame.toast(message); } }
  function notify(title, message, appId, type) {
    var s = state(); if (!s) return;
    var p = ensure(s), c = gameTime(s);
    p.notifications.unshift({ id: "pn-" + Date.now() + "-" + Math.random().toString(36).slice(2, 6), type: type || "system", title: title, message: message, timestamp: { day: c.day, minute: c.hour * 60 + c.minute }, read: false, action: appId || "notifications" });
    p.notifications = p.notifications.slice(0, 100);
    save(); refreshBadge();
    if (p.visible) render();
  }
  function unread(s) { var p = ensure(s); return p.notifications.filter(function (n) { return !n.read; }).length + Object.keys(p.chats).reduce(function (sum, id) { return sum + p.chats[id].filter(function (m) { return m.from !== "player" && !m.read; }).length; }, 0); }
  function refreshBadge() { var s = state(), n = s ? unread(s) : 0, target = document.getElementById("phoneBadge"); if (target) { target.hidden = !n; target.textContent = n > 99 ? "99+" : String(n); } }
  function contact(s, id) { return ensure(s).contacts.find(function (x) { return x.id === id; }) || ensure(s).contacts[0]; }
  function clockLabel(s) { var c = gameTime(s); return "Ngày " + c.day + " · " + timeText(s); }
  function shell(s, content, title, showBack) {
    var p = ensure(s), c = gameTime(s);
    return '<div class="apx-phone-shade" data-phone="shade"><section class="apx-phone-frame wallpaper-' + esc(p.wallpaper) + '" role="dialog" aria-label="Điện thoại APX"><header class="apx-phone-status"><span>' + timeText(s) + '</span><span>▮▮▮ ' + (navigator.onLine ? '⌁' : '◌') + ' · 86% ▰</span></header><div class="apx-phone-appbar">' + (showBack ? '<button data-phone="back" aria-label="Quay lại">‹</button>' : '<span class="apx-phone-brand">APX</span>') + '<strong>' + esc(title || "") + '</strong><button data-phone="notifications" aria-label="Thông báo">♧' + (unread(s) ? '<i>' + unread(s) + '</i>' : '') + '</button><button data-phone="close" aria-label="Đóng điện thoại">×</button></div><main class="apx-phone-screen">' + content + '</main><footer class="apx-phone-nav"><button data-phone="back">‹<small>Quay lại</small></button><button data-phone="home">○<small>Trang chủ</small></button><button data-phone="recent">▢<small>Ứng dụng</small></button></footer>' + (activeCall ? callOverlay(s) : '') + '</section></div>';
  }
  function open() { var s = state(); if (!s) return; var p = ensure(s); p.visible = true; if (!p.unlocked) renderLock(); else render(); }
  function close() { var s = state(); if (s && s.phone) { s.phone.visible = false; save(); } if (root) root.innerHTML = ""; }
  function renderLock() {
    var s = state(), p = ensure(s), c = gameTime(s), date = new Date(2026, 0, 1 + c.day - 1);
    var dayName = date.toLocaleDateString("vi-VN", { weekday: "long" });
    var notices = p.notifications.filter(function (n) { return !n.read; }).slice(0, 3);
    root.innerHTML = shell(s, '<section class="apx-lockscreen"><span class="apx-lock-day">' + esc(dayName) + ' · Ngày game ' + c.day + '</span><time>' + timeText(s) + '</time><span>APX Business World</span>' + (notices.length ? '<div class="apx-lock-notices">' + notices.map(function (n) { return '<p>🔔 <b>' + esc(n.title) + '</b><br>' + esc(n.message) + '</p>'; }).join('') + '</div>' : '<p class="apx-lock-weather">' + weather(s).icon + ' ' + weather(s).name + ' · ' + weather(s).temp + '°C</p>') + '<button class="apx-unlock" data-phone="unlock">Vuốt hoặc chạm để mở khóa ↑</button><small>' + (navigator.onLine ? '● Có kết nối' : '○ Ngoại tuyến · dữ liệu máy vẫn dùng được') + ' · ' + (p.silent ? '🔕 Im lặng' : '🔔 Có chuông') + '</small></section>', "Màn hình khóa", false);
  }
  function renderHome() {
    var s = state(), p = ensure(s), c = gameTime(s), unreadCount = unread(s), list = apps.map(function (a) { return '<button class="apx-app-icon" data-app="' + a[0] + '"><span>' + a[2] + (a[0] === "messages" && unreadCount ? '<i>' + unreadCount + '</i>' : '') + '</span><small>' + a[1] + '</small></button>'; }).join("");
    var salary = s.career && s.career.employment && s.career.employment.current;
    var forecast = weather(s);
    return '<section class="apx-home"><div class="apx-home-clock"><small>' + new Date(2026, 0, c.day).toLocaleDateString("vi-VN", { weekday: "long", day: "numeric", month: "long" }) + '</small><strong>' + timeText(s) + '</strong></div><div class="apx-widget-row"><article class="apx-widget apx-weather-widget"><span>' + forecast.icon + '</span><b>' + forecast.name + ' · ' + forecast.temp + '°</b><small>Dự báo mô phỏng theo ngày game</small></article><article class="apx-widget"><span>💰</span><b>' + window.APXUI.money(s.cash) + '</b><small>Số dư khả dụng</small></article></div><div class="apx-widget apx-work-widget"><b>💼 ' + (salary ? esc(salary.jobName || salary.title) : 'Chưa nhận việc') + '</b><small>' + (salary ? esc(salary.employer) : 'Mở Công việc để xem sự nghiệp') + '</small></div><button class="apx-notification-preview" data-phone="notifications">🔔 ' + unreadCount + ' thông báo chưa đọc <span>Xem ›</span></button><div class="apx-app-grid">' + list + '</div><p class="apx-offline-hint">Ứng dụng nội bộ dùng được ngoại tuyến. Nội dung cần máy chủ sẽ báo trạng thái trước khi mở.</p></section>';
  }
  function appHome(s, id) {
    var a = apps.find(function (x) { return x[0] === id; });
    return a ? '<section class="apx-quickapp"><div class="apx-quick-icon">' + a[2] + '</div><h2>' + a[1] + '</h2><p>' + (id === "camera" ? 'Chụp màn hình game cần quyền capture của trình duyệt; phiên bản này không tự xin quyền thiết bị.' : 'Ứng dụng sử dụng dữ liệu từ bản lưu game hiện tại.') + '</p><button class="apx-primary" data-app="' + id + '">Mở ứng dụng</button></section>' : "";
  }
  function routeButton(section, page, label) { return '<button class="apx-primary" data-route="' + esc(section) + '" data-page="' + esc(page) + '">' + esc(label) + ' ›</button>'; }
  function notificationsView(s) {
    var p = ensure(s), items = p.notifications.slice();
    if (s.apxBank && Array.isArray(s.apxBank.notifications)) items = items.concat(s.apxBank.notifications.map(function (n) { return { id: n.id, title: n.title, message: n.message, read: n.read, action: "bank", timestamp: { day: n.gameDay || s.day, minute: 0 }, type: n.type }; }));
    items.sort(function (a, b) { return Number(b.timestamp && b.timestamp.day || 0) - Number(a.timestamp && a.timestamp.day || 0); });
    return '<div class="apx-phone-list">' + (items.length ? items.map(function (n) { return '<button class="apx-notice ' + (n.read ? '' : 'unread') + '" data-notice="' + esc(n.id) + '" data-notice-app="' + esc(n.action || 'notifications') + '"><span>🔔</span><span><b>' + esc(n.title) + '</b><small>' + esc(n.message) + '</small><small>Ngày game ' + Number(n.timestamp && n.timestamp.day || s.day) + '</small></span></button>'; }).join('') : '<p class="apx-empty">Chưa có thông báo mới.</p>') + '</div>';
  }
  function messageView(s) {
    var p = ensure(s), id = p.activeContact || "npc-linh", who = contact(s, id), msgs = p.chats[id] || [];
    if (!p.activeContact) return '<div class="apx-conversation-list">' + p.contacts.map(function (c) { var chat = p.chats[c.id] || [], last = chat[chat.length - 1]; return '<button data-chat="' + esc(c.id) + '"><span class="apx-avatar">' + esc(c.avatar || '👤') + '</span><span><b>' + esc(c.name) + '</b><small>' + esc(last ? last.text : 'Bắt đầu trò chuyện') + '</small></span><i>' + chat.filter(function (m) { return m.from !== 'player' && !m.read; }).length + '</i></button>'; }).join('') + '<p class="apx-engine-note">Linh hiện dùng engine hội thoại cục bộ theo từ khóa và trạng thái tiền/công việc; chưa có AI/NPC server trong project.</p></div>';
    msgs.forEach(function (m) { if (m.from !== "player") m.read = true; });
    return '<section class="apx-chat"><div class="apx-chat-head"><button data-phone="chatlist">‹</button><span class="apx-avatar">' + esc(who.avatar) + '</span><b>' + esc(who.name) + '</b><small>' + esc(who.mood || 'Đang hoạt động') + ' · thân thiết ' + Number(who.relationship || 0) + '</small><button data-call="' + esc(id) + '">📞</button></div><div class="apx-chat-scroll">' + msgs.map(function (m) { return '<div class="apx-bubble ' + (m.from === 'player' ? 'mine' : '') + '">' + esc(m.text) + '<small>Ngày ' + m.day + ' · ' + String(Math.floor(m.minute / 60)).padStart(2, '0') + ':' + String(m.minute % 60).padStart(2, '0') + '</small></div>'; }).join('') + '<p class="apx-engine-note">Hội thoại chạy cục bộ; tin nhắn không thay đổi tài sản hay tiền.</p></div><form data-phone-form="message"><input name="text" maxlength="500" placeholder="Nhắn cho Linh…" required><button>Gửi</button></form></section>';
  }
  function contactsView(s) { return '<div class="apx-phone-list">' + ensure(s).contacts.map(function (c) { return '<article class="apx-contact"><span class="apx-avatar">' + esc(c.avatar || '👤') + '</span><span><b>' + esc(c.name) + '</b><small>' + esc(c.phone || 'Chưa có số') + ' · quan hệ ' + Number(c.relationship || 0) + '</small><small>' + esc(c.mood || 'Đã lưu') + '</small></span><button data-chat="' + esc(c.id) + '">💬</button><button data-call="' + esc(c.id) + '">📞</button></article>'; }).join('') + '</div>'; }
  function callOverlay(s) {
    var who = contact(s, activeCall.contactId), incoming = activeCall.incoming;
    return '<div class="apx-call-overlay"><span class="apx-avatar large">' + esc(who.avatar) + '</span><h2>' + esc(who.name) + (incoming ? ' đang gọi…' : '') + '</h2><small>' + (incoming ? 'Cuộc gọi thoại mô phỏng bằng hội thoại văn bản' : 'Đang kết nối · ' + clockLabel(s)) + '</small>' + (incoming ? '<button class="apx-primary" data-call-action="accept">Nhận cuộc gọi</button><button class="apx-secondary" data-call-action="decline">Từ chối</button>' : '<p>“Alo, mình gọi hỏi thăm bạn nè. Hôm nay công việc thế nào?”</p><button class="apx-secondary" data-call-action="mute">' + (activeCall.muted ? 'Bật tiếng' : 'Tắt tiếng') + '</button><button class="apx-danger" data-call-action="end">Kết thúc</button>') + '</div>';
  }
  function weather(s) { var day = Number(s.day) || 1, options = [["Nắng nhẹ", "☀️", 29], ["Nhiều mây", "☁️", 27], ["Mưa rào", "🌧️", 24], ["Có gió", "🌤️", 26]]; var w = options[(day * 7 + Math.floor(gameTime(s).hour / 6)) % options.length]; return { name: w[0], icon: w[1], temp: w[2] + (day % 3) }; }
  function realNews(s) {
    var list = [], c = gameTime(s), history = s.career && s.career.history || [], bank = s.apxBank && s.apxBank.transactions || [];
    history.slice(0, 4).forEach(function (r) { list.push({ day: r.day, text: (r.earlyClosed ? 'Ca làm được chốt sớm tại ' : 'Ca làm hoàn tất tại ') + r.employer + ' · lương ' + window.APXUI.money(r.pay) }); });
    bank.slice(0, 4).forEach(function (t) { list.push({ day: t.gameDay, text: (t.memo || t.type) + ' · ' + window.APXUI.money(Math.abs(Number(t.amount) || 0)) }); });
    if (s.companyIdentity && s.companyIdentity.name && s.companyIdentity.name !== 'Chưa thành lập') list.push({ day: c.day, text: 'Hồ sơ doanh nghiệp hiện tại: ' + s.companyIdentity.name });
    return list;
  }
  function appContent(s, id) {
    var p = ensure(s), c = gameTime(s), companies = window.APXCompanies && window.APXCompanies.getCompanies ? window.APXCompanies.getCompanies(s) : [], loans = s.apxBank && s.apxBank.loans || [];
    if (id === "notifications") return notificationsView(s);
    if (id === "messages" || id === "email") {
      if (id === "email") return '<p class="apx-engine-note">Thư nội bộ được lưu trong save game. Gửi cho Linh sẽ tạo hội thoại trong ứng dụng Tin nhắn.</p><form data-phone-form="email"><input name="to" value="Linh" aria-label="Người nhận"><input name="subject" placeholder="Tiêu đề" required><textarea name="body" placeholder="Nội dung thư" required></textarea><button class="apx-primary">Gửi thư nội bộ</button></form><h3>Thư đã gửi</h3>' + p.emails.slice().reverse().map(function (m) { return '<article class="apx-card"><b>' + esc(m.subject) + '</b><small>Đến ' + esc(m.to) + ' · Ngày ' + m.day + '</small><p>' + esc(m.body) + '</p></article>'; }).join('');
      return messageView(s);
    }
    if (id === "contacts") return contactsView(s);
    if (id === "phone") return '<form data-phone-form="dial"><label>Số điện thoại<input name="number" inputmode="tel" placeholder="Nhập số" value="' + esc(p.dial || '') + '"></label><div class="apx-keypad">' + ["1","2","3","4","5","6","7","8","9","*","0","#"].map(function (n) { return '<button type="button" data-key="' + n + '">' + n + '</button>'; }).join('') + '</div><button class="apx-primary">Gọi</button></form><h3>Gần đây</h3>' + p.calls.slice(0, 8).map(function (r) { return '<article class="apx-list-row"><span>📞</span><b>' + esc(r.name) + '</b><small>' + esc(r.kind) + ' · Ngày ' + r.day + '</small></article>'; }).join('');
    if (id === "bank") { var bankBal = s.apxBank && Number(s.apxBank.accountBalance) || 0; return '<article class="apx-card apx-balance"><small>Ví tiền game</small><strong>' + window.APXUI.money(s.cash) + '</strong><small>Số dư APXBank ' + window.APXUI.money(bankBal) + '</small></article><article class="apx-card">Khoản vay còn lại <b>' + window.APXUI.money(loans.reduce(function (n, x) { return n + (Number(x.remainingBalance) || 0); }, 0)) + '</b></article>' + routeButton("bank", "overview", "Mở APXBank đầy đủ"); }
    if (id === "market") return '<p>Thị trường được lấy từ mô-đun đầu tư hiện có.</p>' + routeButton("investment", "market", "Mở thị trường") + routeButton("investment", "portfolio", "Danh mục của tôi");
    if (id === "company") return '<article class="apx-card"><small>Công ty đang vận hành</small><strong>' + companies.length + '</strong><small>' + esc(s.companyIdentity && s.companyIdentity.name || 'Chưa đặt tên tập đoàn') + '</small></article><article class="apx-card"><small>Nhiệm vụ sự nghiệp</small><b>' + (s.career && s.career.activeJob ? esc(s.career.activeJob.title) : 'Chưa có ca làm') + '</b></article>' + routeButton("company", "overview", "Mở quản lý công ty") + routeButton("career", "current", "Mở công việc");
    if (id === "map") return '<div class="apx-map-preview">🏙️<b>Thành phố APX</b><small>Bản đồ dùng dữ liệu địa điểm của game.</small></div>' + routeButton("city", "map", "Mở bản đồ thành phố");
    if (id === "weather") { var w = weather(s); return '<div class="apx-weather-big">' + w.icon + '<strong>' + w.temp + '°C</strong><b>' + w.name + '</b><small>' + clockLabel(s) + ' · dự báo mô phỏng theo chu kỳ ngày game</small></div><div class="apx-forecast">' + [0,1,2,3].map(function (i) { var wc = weather(Object.assign({}, s, { day: c.day + i })); return '<article><small>' + ["Hôm nay","Ngày mai","+2 ngày","+3 ngày"][i] + '</small><b>' + wc.icon + ' ' + wc.temp + '°</b><small>' + wc.name + '</small></article>'; }).join('') + '</div><small>Dự báo nội bộ, không dùng dịch vụ thời tiết ngoài đời.</small>'; }
    if (id === "news") { var news = realNews(s); return news.length ? news.map(function (n) { return '<article class="apx-card"><small>Ngày game ' + n.day + '</small><p>' + esc(n.text) + '</p></article>'; }).join('') : '<p class="apx-empty">Chưa có sự kiện game để đưa lên APX News.</p>'; }
    if (id === "social") return '<p>Mạng xã hội sử dụng APX Life hiện có; yêu cầu đăng nhập và kết nối Internet.</p>' + routeButton("life", "social", "Mở APX Life");
    if (id === "shop") return '<p>Cửa hàng và kho đồ là mô-đun thật của game.</p>' + routeButton("shop", "overview", "Mở cửa hàng") + routeButton("inventory", "all", "Mở túi đồ");
    if (id === "calendar") { var entries = p.events.slice(); if (s.career && s.career.employment && s.career.employment.current) entries.push({ title: 'Kết thúc hợp đồng · ' + s.career.employment.current.employer, day: s.career.employment.current.endDay, source: 'Hợp đồng game' }); loans.forEach(function (l) { if (l.dueDay) entries.push({ title: 'Hạn trả khoản vay', day: l.dueDay, source: 'APXBank' }); }); return '<form data-phone-form="event"><input name="title" placeholder="Thêm lịch hẹn" required><input name="day" type="number" min="' + c.day + '" value="' + c.day + '"><button class="apx-primary">Lưu sự kiện</button></form>' + entries.sort(function (a,b) { return a.day-b.day; }).map(function (e) { return '<article class="apx-list-row"><span>🗓️</span><b>' + esc(e.title) + '</b><small>Ngày ' + Number(e.day) + ' · ' + esc(e.source || 'Cá nhân') + '</small></article>'; }).join(''); }
    if (id === "notes") return '<form data-phone-form="note"><input name="title" placeholder="Tiêu đề ghi chú" required><textarea name="body" placeholder="Nội dung"></textarea><button class="apx-primary">Lưu ghi chú</button></form><input data-note-search placeholder="Tìm ghi chú">' + p.notes.map(function (n) { return '<article class="apx-card"><button class="apx-delete" data-delete-note="' + esc(n.id) + '">×</button><b>' + esc(n.title) + '</b><small>Ngày game ' + n.day + '</small><p>' + esc(n.body) + '</p></article>'; }).join('');
    if (id === "calculator") return '<form data-phone-form="calc"><output>' + esc(calcError || calcValue || '0') + '</output><input name="expr" inputmode="decimal" placeholder="0" value="' + esc(calcValue) + '"><div class="apx-keypad">' + ["7","8","9","÷","4","5","6","×","1","2","3","−","(","0",")","+","C","%","⌫","="].map(function (k) { return '<button type="button" data-calc="' + k + '">' + k + '</button>'; }).join('') + '</div></form>';
    if (id === "clock") return '<div class="apx-weather-big"><strong>' + timeText(s) + '</strong><b>Ngày game ' + c.day + '</b><small>1 ngày game = 15 phút thực · dùng đồng hồ chung của game</small></div><form data-phone-form="alarm"><input name="time" type="time" required><button class="apx-primary">Đặt báo thức game</button></form>' + p.alarms.map(function (a) { return '<article class="apx-list-row"><span>⏰</span><b>' + esc(a.time) + '</b><small>' + (a.enabled ? 'Đang bật' : 'Đã tắt') + '</small><button data-toggle-alarm="' + esc(a.id) + '">Bật/tắt</button></article>'; }).join('');
    if (id === "gallery") return '<p>Hình nền điện thoại:</p><div class="apx-wallpapers">' + [["sunrise","🌅 Bình minh"],["rose","🌸 Hoa anh đào"],["night","🌙 Đêm APX"],["mint","🍃 Vườn xanh"]].map(function (x) { return '<button data-wallpaper="' + x[0] + '" class="wallpaper-' + x[0] + '">' + x[1] + (p.wallpaper === x[0] ? ' ✓' : '') + '</button>'; }).join('') + '</div><p>' + p.photos.length + ' ảnh chụp đã lưu.</p>';
    if (id === "camera") return '<div class="apx-camera-placeholder">📷<p>Chụp ảnh màn hình cần API capture của trình duyệt, hiện chưa được cấp trong game này.</p><button class="apx-secondary" data-phone="home">Quay lại</button></div>';
    if (id === "settings") return '<label class="apx-setting">Im lặng <input type="checkbox" data-setting="silent" ' + (p.silent ? 'checked' : '') + '></label><label class="apx-setting">Thông báo <input type="checkbox" data-setting="notificationsEnabled" ' + (p.notificationsEnabled ? 'checked' : '') + '></label><label class="apx-setting">Hình nền <select data-setting="wallpaper"><option value="sunrise">Bình minh</option><option value="rose">Hoa anh đào</option><option value="night">Đêm APX</option><option value="mint">Vườn xanh</option></select></label><article class="apx-card">Lưu trữ: save game hiện tại · ' + (window.APXAccount && window.APXAccount.isLoggedIn && window.APXAccount.isLoggedIn() ? 'đồng bộ theo tài khoản' : 'lưu trên máy này') + '</article><button class="apx-secondary" data-phone="lock">Khóa điện thoại</button>';
    if (id === "music") return '<article class="apx-card">Nhạc nền game</article><button class="apx-primary" data-music>Phát / tạm dừng nhạc</button><p>Điều khiển nhạc dùng nút nhạc hiện có của APX.</p>';
    if (id === "browser") return '<p>Trang nội bộ APX</p><div class="apx-internal-links">' + routeButton("investment", "market", "APX Market") + routeButton("company", "overview", "Công ty") + routeButton("city", "map", "Thành phố") + routeButton("career", "jobs", "Việc làm") + '</div><small>Trình duyệt nội bộ, không truy cập Internet.</small>';
    if (id === "quests") return '<article class="apx-card"><b>Nhiệm vụ sự nghiệp</b><p>' + (s.career && s.career.activeJob ? 'Đang làm: ' + esc(s.career.activeJob.title) : 'Chưa nhận ca làm') + '</p></article><article class="apx-card"><b>Mục tiêu khởi nghiệp</b><p>' + (s.career ? Math.min(8, s.career.completedJobs || 0) : 0) + '/8 ca · 2 tỷ vốn · cấp sự nghiệp 5</p></article>' + routeButton("career", "jobs", "Mở nhiệm vụ nghề nghiệp");
    if (id === "profile") return '<article class="apx-card"><span class="apx-avatar large">' + esc(s.character && s.character.profile && s.character.profile.initials || 'APX') + '</span><b>' + esc(s.character && s.character.profile && s.character.profile.name || 'Người chơi mới') + '</b><small>Tiền ' + window.APXUI.money(s.cash) + ' · Cấp ' + (s.character && s.character.level && s.character.level.current || 1) + '</small><small>Danh tiếng ' + (s.character && s.character.reputation && s.character.reputation.score || 0) + '</small></article>' + routeButton("character", "profile", "Mở hồ sơ đầy đủ");
    return appHome(s, id);
  }
  function render() {
    var s = state(); if (!s) return;
    var p = ensure(s); if (!p.visible) return;
    if (!p.unlocked) return renderLock();
    if (!p.appId) { root.innerHTML = shell(s, renderHome(), "", false); refreshBadge(); return; }
    var a = apps.find(function (x) { return x[0] === p.appId; }), title = a ? a[1] : "Thông báo";
    root.innerHTML = shell(s, appContent(s, p.appId), title, true);
    var select = root.querySelector('[data-setting="wallpaper"]'); if (select) select.value = p.wallpaper;
    refreshBadge();
  }
  function openApp(id) { var s = state(), p = ensure(s); if (id === "home") { p.appId = ""; p.activeContact = ""; } else { p.recentApps = [id].concat(p.recentApps.filter(function (x) { return x !== id; })).slice(0, 6); p.appId = id; } p.activeContact = ""; render(); save(); }
  function localReply(id, text, s) {
    var who = contact(s, id), t = text.toLocaleLowerCase("vi-VN"), cash = Number(s.cash) || 0, career = s.career || {}, reply, topic = "tâm sự";
    if (/chào|hello|hi|alo/.test(t)) { topic = "chào hỏi"; reply = "Chào bạn nè! Hôm nay thế nào rồi?"; }
    else if (/tiền|vay|ngân hàng|chuyển khoản/.test(t)) { topic = "tiền bạc"; reply = cash > 100000000 ? "Mình thấy bạn đang có tài chính ổn đó. Nhớ kiểm tra APXBank trước khi vay hay chuyển tiền nha!" : "Nếu đang khó khăn thì xem lại chi tiêu và khoản vay trong APXBank nhé. Mình không thể tự chuyển tiền đâu."; }
    else if (/công ty|nhân viên|công việc|đơn hàng|ca làm/.test(t)) { topic = "công việc"; reply = career.activeJob ? "Bạn đang trong ca '" + career.activeJob.title + "' phải không? Nhớ để ý những đơn đang chờ nhé." : "Bạn đang có " + (career.completedJobs || 0) + " ca hoàn thành. Có chuyện gì ở công ty kể mình nghe đi."; }
    else if (/đi chơi|cà phê|gặp|hẹn/.test(t)) { topic = "hẹn gặp"; reply = "Nghe vui đó! Mình ghi nhớ lời rủ nha, bạn xem lịch game rồi chọn lúc phù hợp nhé."; }
    else if (/buồn|mệt|lo|khó khăn/.test(t)) { topic = "cảm xúc"; reply = "Ôi, nghe có vẻ hôm nay hơi nặng nề. Muốn kể thêm cho mình nghe không?"; }
    else if (/thời tiết|mưa|nắng/.test(t)) { topic = "thời tiết"; var w = weather(s); reply = "Trong game đang " + w.name.toLowerCase() + ", khoảng " + w.temp + "°C đó."; }
    else if (/nhiệm vụ|giúp|việc gì/.test(t)) { topic = "nhiệm vụ"; reply = "Mình chưa nhận nhiệm vụ mới từ game; bạn thử xem mục Nhiệm vụ và Công việc nhé."; }
    else reply = ["Ừ, mình đang nghe nè. Kể thêm cho mình đi!", "Mình nhớ chuyện này rồi nha. Hôm nay trong game của bạn đang thế nào?", "Nghe thú vị đó! Bạn muốn mình góp ý phần nào?", "Mình hiểu ý bạn rồi. Còn chuyện gì nữa không?"][Math.abs(text.length + Number(s.day)) % 4];
    who.relationship = Math.max(0, Math.min(100, Number(who.relationship || 50) + (/cảm ơn|thương|quý|nhớ/.test(t) ? 2 : /không thích|phiền|im đi/.test(t) ? -2 : 1)));
    who.mood = who.relationship >= 70 ? "Thân thiết" : who.relationship < 35 ? "Hơi xa cách" : "Vui vẻ";
    who.memory = (who.memory || []).concat([{ topic: topic, day: Number(s.day), text: text.slice(0, 120) }]).slice(-30);
    return reply;
  }
  function sendMessage(id, text, s) {
    var p = ensure(s), list = p.chats[id] || (p.chats[id] = []), c = gameTime(s), clean = String(text || "").trim(); if (!clean) return;
    list.push({ id: "m-" + Date.now(), from: "player", text: clean, day: c.day, minute: c.hour * 60 + c.minute, read: true });
    list.push({ id: "m-" + (Date.now() + 1), from: id, text: localReply(id, clean, s), day: c.day, minute: c.hour * 60 + c.minute, read: false });
    list.splice(0, Math.max(0, list.length - 120));
    p.activeContact = id; p.appId = "messages"; save(); render(); refreshBadge();
  }
  function startCall(id, incoming) { activeCall = { contactId: id, incoming: Boolean(incoming), muted: false, startDay: gameTime(state()).day, startMinute: gameTime(state()).hour * 60 + gameTime(state()).minute }; if (state()) { ensure(state()).appId = "phone"; ensure(state()).visible = true; } render(); }
  function finishCall(kind) { var s = state(), c = gameTime(s), who = contact(s, activeCall.contactId), duration = Math.max(0, (c.day - activeCall.startDay) * 1440 + c.hour * 60 + c.minute - activeCall.startMinute); ensure(s).calls.unshift({ id: "call-" + Date.now(), name: who.name, kind: kind, day: c.day, minute: c.hour * 60 + c.minute, duration: duration }); activeCall = null; save("Đã lưu lịch sử cuộc gọi."); render(); }
  function routeOut(section, page) { close(); if (window.APXNav) window.APXNav.go(section, page); }
  function tick(now) {
    var s = state(); if (!s) return;
    var p = ensure(s), c = gameTime(s, now), minute = c.hour * 60 + c.minute, changed = false;
    if (p.notificationsEnabled && c.day % 2 === 1 && minute >= 600 && Number(p.lastProactiveDay) !== c.day) {
      p.lastProactiveDay = c.day; var chat = p.chats["npc-linh"];
      chat.push({ id: "npc-" + c.day, from: "npc-linh", text: c.day % 4 ? "Ê, mày đang ở đâu vậy? Khi nào rảnh kể mình nghe chuyện công việc nha!" : "Hôm nay hơi mệt, rủ mình đi cà phê lúc nào đó nha?", day: c.day, minute: minute, read: false }); chat.splice(0, Math.max(0, chat.length - 120));
      p.notifications.unshift({ id: "proactive-" + c.day, type: "message", title: "Linh nhắn tin", message: chat[chat.length - 1].text, timestamp: { day: c.day, minute: minute }, read: false, action: "messages" }); p.notifications = p.notifications.slice(0, 100); changed = true;
    }
    if (p.notificationsEnabled && c.day % 3 === 0 && minute >= 960 && Number(p.lastCallDay) !== c.day) {
      p.lastCallDay = c.day;
      if (p.visible) activeCall = { contactId: "npc-linh", incoming: true, muted: false, startDay: c.day, startMinute: minute };
      else { p.calls.unshift({ id: "missed-" + c.day, name: "Linh", kind: "Cuộc gọi nhỡ", day: c.day, minute: minute, duration: 0 }); p.notifications.unshift({ id: "missed-notice-" + c.day, type: "call", title: "Cuộc gọi nhỡ · Linh", message: "Linh đã gọi bạn lúc " + timeText(s) + ".", timestamp: { day: c.day, minute: minute }, read: false, action: "phone" }); }
      changed = true;
    }
    if (p.alarms.some(function (a) { return a.enabled && a.time === timeText(s) && a.lastDay !== c.day; })) { p.alarms.forEach(function (a) { if (a.enabled && a.time === timeText(s)) a.lastDay = c.day; }); p.notifications.unshift({ id: "alarm-" + c.day + "-" + minute, type: "alarm", title: "Báo thức", message: "Đã đến " + timeText(s) + " theo đồng hồ game.", timestamp: { day: c.day, minute: minute }, read: false, action: "clock" }); changed = true; }
    if (changed) { p.notifications = p.notifications.slice(0, 100); save(); refreshBadge(); }
    if (changed && p.visible) render();
    else if (p.visible) { var clock = root.querySelector(".apx-phone-status span"); if (clock) clock.textContent = timeText(s); }
  }
  if (launcher) launcher.addEventListener("click", open);
  document.addEventListener("click", function (e) {
    if (e.target.closest("#phoneLauncher")) return;
    var el = e.target.closest("[data-phone], [data-app], [data-chat], [data-call], [data-phone-action], [data-notice], [data-route], [data-call-action], [data-key], [data-calc], [data-wallpaper], [data-delete-note], [data-toggle-alarm], [data-music]"); if (!el) return;
    var s = state(); if (!s) return; var p = ensure(s);
    if (el.dataset.phone === "shade" && e.target !== el) return;
    if (el.dataset.phone === "shade" || el.dataset.phone === "close") { close(); return; }
    if (el.dataset.action === "phone-open") { open(); return; }
    if (el.dataset.phone === "unlock") { p.unlocked = true; p.visible = true; p.appId = ""; save(); render(); return; }
    if (el.dataset.phone === "lock") { p.unlocked = false; p.appId = ""; save(); renderLock(); return; }
    if (el.dataset.phone === "home") { openApp("home"); return; }
    if (el.dataset.phone === "back" || el.dataset.phone === "chatlist") { if (p.activeContact) p.activeContact = ""; else p.appId = ""; render(); return; }
    if (el.dataset.phone === "recent") { p.appId = "recent"; root.innerHTML = shell(s, '<div class="apx-app-grid">' + p.recentApps.map(function (id) { var a = apps.find(function (x) { return x[0] === id; }); return a ? '<button class="apx-app-icon" data-app="' + id + '"><span>' + a[2] + '</span><small>' + a[1] + '</small></button>' : ''; }).join('') + '</div>', 'Ứng dụng gần đây', true); return; }
    if (el.dataset.phone === "notifications") { p.appId = "notifications"; render(); return; }
    if (el.dataset.app) { if (el.dataset.app === "messages") p.activeContact = ""; openApp(el.dataset.app); return; }
    if (el.dataset.chat) { p.activeContact = el.dataset.chat; p.appId = "messages"; render(); return; }
    if (el.dataset.call) { startCall(el.dataset.call, false); return; }
    if (el.dataset.route) { routeOut(el.dataset.route, el.dataset.page); return; }
    if (el.dataset.notice) { var n = p.notifications.find(function (x) { return x.id === el.dataset.notice; }); if (n) n.read = true; if (el.dataset.noticeApp === "phone" && String(el.dataset.notice).indexOf("missed") >= 0) { p.appId = "phone"; render(); } else { p.appId = el.dataset.noticeApp || "notifications"; if (p.appId === "messages") p.activeContact = "npc-linh"; render(); } save(); return; }
    if (el.dataset.callAction === "accept") { activeCall.incoming = false; render(); return; }
    if (el.dataset.callAction === "decline") { finishCall("Từ chối cuộc gọi"); return; }
    if (el.dataset.callAction === "end") { finishCall("Cuộc gọi đã trả lời"); return; }
    if (el.dataset.callAction === "mute") { activeCall.muted = !activeCall.muted; render(); return; }
    if (el.dataset.key) { var form = root.querySelector('[data-phone-form="dial"]'), input = form && form.elements.number; if (input) input.value += el.dataset.key; return; }
    if (el.dataset.calc) { var inputCalc = root.querySelector('[data-phone-form="calc"] input'); if (!inputCalc) return; if (el.dataset.calc === "C") inputCalc.value = ""; else if (el.dataset.calc === "⌫") inputCalc.value = inputCalc.value.slice(0, -1); else if (el.dataset.calc === "=") { try { var expr = inputCalc.value.replace(/×/g, "*").replace(/÷/g, "/").replace(/−/g, "-"); if (!/^[0-9+\-*/().%\s]+$/.test(expr)) throw new Error(); var result = Function('"use strict";return (' + expr.replace(/(\d+(?:\.\d+)?)%/g, '($1/100)') + ')')(); if (!Number.isFinite(result)) throw new Error(); calcValue = String(result); calcError = ""; inputCalc.value = calcValue; } catch (_) { calcError = "Phép tính không hợp lệ"; } } else inputCalc.value += el.dataset.calc; return; }
    if (el.dataset.wallpaper) { p.wallpaper = el.dataset.wallpaper; save(); render(); return; }
    if (el.dataset.deleteNote) { p.notes = p.notes.filter(function (n) { return n.id !== el.dataset.deleteNote; }); save("Đã xóa ghi chú."); render(); return; }
    if (el.dataset.toggleAlarm) { var alarm = p.alarms.find(function (a) { return a.id === el.dataset.toggleAlarm; }); if (alarm) alarm.enabled = !alarm.enabled; save(); render(); return; }
    if (el.hasAttribute("data-music")) { var music = document.getElementById("musicToggle"); if (music) music.click(); }
  });
  document.addEventListener("submit", function (e) {
    var form = e.target, s = state(); if (!form.matches("[data-phone-form]") || !s) return; e.preventDefault(); var p = ensure(s), data = new FormData(form), type = form.dataset.phoneForm;
    if (type === "message") { sendMessage(p.activeContact || "npc-linh", data.get("text"), s); return; }
    if (type === "email") { var to = String(data.get("to") || "Linh"), subject = String(data.get("subject") || ""), body = String(data.get("body") || ""); p.emails.push({ to: to, subject: subject, body: body, day: Number(s.day) }); if (/linh/i.test(to)) sendMessage("npc-linh", "[Email: " + subject + "] " + body, s); else { save("Đã lưu thư nháp gửi đi trong điện thoại."); render(); } return; }
    if (type === "dial") { var num = String(data.get("number") || "").replace(/\s/g, ""), who = p.contacts.find(function (x) { return x.phone.replace(/\s/g, "") === num; }); if (!who) { window.APXGame.toast("Số này chưa có trong danh bạ. Cuộc gọi ngoài game cần dịch vụ máy chủ.", "warning"); return; } startCall(who.id, false); return; }
    if (type === "note") { p.notes.unshift({ id: "note-" + Date.now(), title: data.get("title"), body: data.get("body"), day: Number(s.day), done: false }); save("Đã lưu ghi chú vào save game."); render(); return; }
    if (type === "event") { p.events.push({ id: "event-" + Date.now(), title: data.get("title"), day: Math.max(Number(s.day), Number(data.get("day")) || Number(s.day)), source: "Cá nhân" }); save("Đã thêm lịch game."); render(); return; }
    if (type === "alarm") { var time = String(data.get("time") || ""); p.alarms.push({ id: "alarm-" + Date.now(), time: time, enabled: true, lastDay: 0 }); save("Đã đặt báo thức theo giờ game."); render(); }
  });
  document.addEventListener("change", function (e) { var s = state(); if (!s) return; var p = ensure(s); if (e.target.dataset.setting === "silent" || e.target.dataset.setting === "notificationsEnabled") p[e.target.dataset.setting] = e.target.checked; if (e.target.dataset.setting === "wallpaper") p.wallpaper = e.target.value; if (e.target.matches("[data-setting]")) { save("Đã lưu cài đặt điện thoại."); render(); } });
  document.addEventListener("input", function (e) { if (e.target.matches("[data-note-search]")) { var q = e.target.value.toLocaleLowerCase("vi-VN"); root.querySelectorAll(".apx-card").forEach(function (card) { card.hidden = q && !card.textContent.toLocaleLowerCase("vi-VN").includes(q); }); } });
  window.APXPhone = { open: open, close: close, openApp: openApp, goHome: function () { openApp("home"); }, getNotifications: function () { var s = state(); return s ? ensure(s).notifications.slice() : []; }, markNotificationRead: function (id) { var s = state(), n = s && ensure(s).notifications.find(function (x) { return x.id === id; }); if (n) { n.read = true; save(); } }, tick: tick };
  refreshBadge();
})();

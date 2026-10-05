/* APX LIFE phase 1: cloud-backed CEO housing. */
window.APXPages = window.APXPages || {};
(function () {
  "use strict";

  var data = null;
  var loading = false;
  var garageData = null;
  var garageLoading = false;
  var roomData = null;
  var roomLoading = false;
  var roomPropertyId = "";
  var selectedFurnitureId = "";
  var roomDraft = null;
  var cityData = null;
  var cityLoading = false;
  var selectedLocationId = "";
  var socialData = null;
  var socialAssets = [];
  var socialLoading = false;
  var socialOffset = 0;
  var socialProfile = null;
  var socialProfileId = "";
  var view = "";
  var friendData = null;
  var friendLoading = false;
  var peopleData = null;
  var peopleQuery = "";
  var maintenanceSummary = null;
  var maintenanceCheckedDay = null;
  var maintenanceChecking = false;
  var notificationChannel = null;
  var notificationDatabase = null;
  var notificationWasSubscribed = false;
  var seenNotificationIds = Object.create(null);
  var errorMessage = "";
  var resourceErrors = Object.create(null);
  var requestKeys = Object.create(null);
  var pending = Object.create(null);

  function esc(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, function (char) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char];
    });
  }
  function signedIn() {
    return Boolean(window.APXAccount && window.APXAccount.isConfigured() && window.APXAccount.isLoggedIn());
  }
  function formatMoney(value) {
    return window.APXUI.money(Number(value) || 0);
  }
  function routeActive() {
    var route = window.APXGame && window.APXGame.state.route;
    return Boolean(route && route.section === "life");
  }
  function makeRequestId() {
    if (window.crypto && typeof window.crypto.randomUUID === "function") return window.crypto.randomUUID();
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (char) {
      var random = Math.random() * 16 | 0;
      return (char === "x" ? random : (random & 3 | 8)).toString(16);
    });
  }
  function getRequestId(propertyId) {
    if (requestKeys[propertyId]) return requestKeys[propertyId];
    var storageKey = "apx-life-buy-idempotency-" + propertyId;
    try { requestKeys[propertyId] = sessionStorage.getItem(storageKey) || ""; } catch (_) {}
    if (!requestKeys[propertyId]) {
      requestKeys[propertyId] = makeRequestId();
      try { sessionStorage.setItem(storageKey, requestKeys[propertyId]); } catch (_) {}
    }
    return requestKeys[propertyId];
  }
  function clearRequestId(propertyId) {
    delete requestKeys[propertyId];
    try { sessionStorage.removeItem("apx-life-buy-idempotency-" + propertyId); } catch (_) {}
  }
  function walletSyncNotice() {
    return resourceErrors.walletSync
      ? '<div class="community-message" role="status">Ví cá nhân và bản lưu game chưa đồng bộ. Dữ liệu vẫn được hiển thị để xem; máy chủ tiếp tục bảo vệ các giao dịch cho đến khi trạng thái được đồng bộ.</div>'
      : "";
  }
  function load(force) {
    if (!signedIn() || loading || (!force && (data || resourceErrors.housing))) return Promise.resolve();
    if (force) {
      delete resourceErrors.housing;
      delete resourceErrors.walletSync;
    }
    loading = true;
    errorMessage = "";
    window.APXAccount.getSupabaseClient().then(function (db) {
      return db.rpc("apx_life_housing_home_v2");
    }).then(function (result) {
      if (result.error) throw result.error;
      data = result.data || { cash: null, catalog: [], owned: [] };
      maintenanceSummary = data.maintenance || maintenanceSummary;
      if (maintenanceSummary && maintenanceSummary.game_day != null) maintenanceCheckedDay = Number(maintenanceSummary.game_day);
      delete resourceErrors.housing;
      delete resourceErrors.walletSync;
    }).catch(function (error) {
      var message = error && error.message ? error.message : "Không tải được dữ liệu nhà ở.";
      if (message.indexOf("Personal wallet is out of sync") !== -1) {
        resourceErrors.walletSync = true;
        maintenanceSummary = null;
        return window.APXAccount.getSupabaseClient().then(function (db) {
          return db.rpc("apx_life_housing_home");
        }).then(function (result) {
          if (result.error) throw result.error;
          data = result.data || { cash: null, catalog: [], owned: [] };
          errorMessage = "";
          delete resourceErrors.housing;
        }).catch(function (fallbackError) {
          errorMessage = fallbackError && fallbackError.message
            ? fallbackError.message
            : "Không tải được dữ liệu nhà ở.";
          resourceErrors.housing = errorMessage;
          data = null;
        });
      }
      errorMessage = message;
      resourceErrors.housing = errorMessage;
      data = null;
    }).finally(function () {
      loading = false;
      if (routeActive() && window.APXGame) window.APXGame.render();
    });
  }
  function checkMaintenanceDay() {
    var currentDay = Math.floor(Date.now() / 900000);
    if (maintenanceChecking || maintenanceCheckedDay === currentDay) return;
    maintenanceChecking = true;
    window.APXAccount.getSupabaseClient().then(function (db) {
      return db.rpc("apx_life_charge_maintenance");
    }).then(function (result) {
      if (result.error) throw result.error;
      maintenanceSummary = result.data;
      maintenanceCheckedDay = currentDay;
      if (data) {
        data.cash = result.data.cash;
        data.maintenance = result.data;
      }
      if (result.data.paid) return window.APXAccount.syncTransactions();
    }).catch(function (error) {
      maintenanceCheckedDay = currentDay;
      var message = error && error.message ? error.message : "Không kiểm tra được phí duy trì nhà.";
      if (message.indexOf("Personal wallet is out of sync") !== -1) {
        resourceErrors.walletSync = true;
      } else {
        errorMessage = message;
      }
    }).finally(function () {
      maintenanceChecking = false;
      if (routeActive() && window.APXGame) window.APXGame.render();
    });
  }
  function refreshAfterRealtime() {
    var route = window.APXGame && window.APXGame.state.route;
    if (!route || route.section !== "life") return;
    if (route.page === "social") {
      socialData = null;
      loadSocial(true, false);
    } else if (route.page === "overview") {
      socialData = null;
      window.APXGame.render();
    }
  }
  function subscribeLifeNotifications() {
    if (!signedIn() || notificationChannel) return;
    window.APXAccount.getSupabaseClient().then(function (db) {
      notificationDatabase = db;
      return db.auth.getUser();
    }).then(function (result) {
      if (result.error) throw result.error;
      var user = result.data && result.data.user;
      if (!user || notificationChannel) return;
      notificationChannel = notificationDatabase.channel("apx-life-notifications-" + user.id)
        .on("postgres_changes", {
          event: "INSERT",
          schema: "public",
          table: "apx_life_notifications",
          filter: "owner_id=eq." + user.id
        }, function (payload) {
          var notificationId = payload.new && String(payload.new.id || "");
          if (!notificationId || seenNotificationIds[notificationId]) return;
          seenNotificationIds[notificationId] = true;
          if (socialData && (socialData.notifications || []).some(function (item) { return String(item.id) === notificationId; })) return;
          refreshAfterRealtime();
        }).subscribe(function (status) {
          if (status === "SUBSCRIBED") {
            var reconnected = notificationWasSubscribed;
            notificationWasSubscribed = true;
            if (reconnected) refreshAfterRealtime();
          } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT" || status === "CLOSED") {
            notificationWasSubscribed = false;
            refreshAfterRealtime();
          }
        });
    }).catch(function () {
      notificationChannel = null;
      notificationDatabase = null;
    });
  }
  function tabs(active) {
    return '<nav class="apx-life-tabs" aria-label="Cuộc sống CEO">' +
      '<button class="' + (active === "overview" ? "active" : "") + '" type="button" data-action="page" data-page="overview">Tổng quan</button>' +
      '<button class="' + (active === "homes" ? "active" : "") + '" type="button" data-action="page" data-page="homes">Nhà ở</button>' +
      '<button class="' + (active === "garage" ? "active" : "") + '" type="button" data-action="page" data-page="garage">Garage</button>' +
      '<button class="' + (active === "decor" ? "active" : "") + '" type="button" data-action="page" data-page="decor">Trang trí</button>' +
      '<button class="' + (active === "city" ? "active" : "") + '" type="button" data-action="page" data-page="city">Thành phố</button>' +
      '<button class="' + (active === "social" ? "active" : "") + '" type="button" data-action="page" data-page="social">Mạng xã hội</button>' +
      '<button class="' + (active === "friends" ? "active" : "") + '" type="button" data-action="page" data-page="friends">Bạn bè</button>' +
      '<button class="' + (active === "journal" ? "active" : "") + '" type="button" data-action="page" data-page="journal">Nhật ký</button>' +
      '<button class="' + (active === "shop" ? "active" : "") + '" type="button" data-action="page" data-page="shop">Cửa hàng</button>' +
      '</nav>';
  }
  function signInPrompt(page) {
    var pageLabels = {
      overview: "Tổng quan đời sống",
      homes: "Nhà ở",
      garage: "Garage",
      decor: "Trang trí",
      city: "Thành phố đời sống",
      social: "Mạng xã hội",
      friends: "Bạn bè",
      journal: "Nhật ký",
      shop: "Cửa hàng đời sống"
    };
    var pageLabel = pageLabels[page] || "Cuộc sống CEO";

    return '<header class="page-heading"><span class="eyebrow">APX LIFE · YÊU CẦU ĐĂNG NHẬP</span><h1>' + esc(pageLabel) + '</h1><p>Đăng nhập tài khoản APX để mở trang này và tải dữ liệu đời sống của bạn.</p></header>' +
      '<section class="panel apx-life-guest"><img src="assets/apx-life/ui/apx-life-cover.svg" alt="APX LIFE giữa thành phố Việt Nam về đêm" width="1200" height="520"><div><span class="eyebrow">DỮ LIỆU TÀI KHOẢN APX</span><h2>' + esc(pageLabel) + '</h2><button class="button button-gold" type="button" data-action="section" data-section="account">Đăng nhập tài khoản APX</button></div></section>';
  }
  function emptyHomes() {
    return '<section class="panel apx-life-empty"><span class="apx-life-empty-mark" aria-hidden="true">⌂</span><h2>Bạn chưa sở hữu căn nhà nào</h2></section>';
  }
  function ownedHomes() {
    var homes = data.owned || [];
    if (!homes.length) return emptyHomes();
    return '<section class="apx-life-owned-grid">' + homes.map(function (home) {
      return '<article class="panel apx-life-owned-card"><img src="' + esc(home.exterior_image) + '" alt="' + esc(home.name) + '" width="640" height="360" loading="lazy" data-life-image><div class="apx-life-home-copy"><div class="apx-life-card-title"><div><span class="apx-life-rarity">' + esc(home.rarity) + '</span><h3>' + esc(home.name) + '</h3></div>' + (home.is_primary ? '<span class="apx-life-primary">Nơi ở chính</span>' : '') + '</div><p>' + esc(home.description) + '</p><div class="apx-life-facts"><span>Giá mua<strong>' + formatMoney(home.purchase_price) + '</strong></span><span>Phí/ngày game<strong>' + formatMoney(home.daily_maintenance) + '</strong></span><span>Sức chứa<strong>' + Number(home.storage_capacity) + ' món</strong></span></div>' + (!home.is_primary ? '<button class="button" type="button" data-life-action="primary" data-id="' + esc(home.id) + '"' + (pending.primary ? ' disabled' : '') + '>Đặt làm nơi ở chính</button>' : '') + '<button class="button apx-life-sell" type="button" data-life-action="sell-home" data-id="' + esc(home.id) + '"' + (pending["sell-home-" + home.id] ? ' disabled' : '') + '>Bán lại · ' + formatMoney(Math.floor(Number(home.purchase_price) * Number(home.resale_rate))) + '</button></div></article>';
    }).join('') + '</section>';
  }
  function catalogCard(home) {
    var count = (data.owned || []).filter(function (owned) { return owned.property_id === home.property_id; }).length;
    return '<article class="panel apx-life-home-card"><img src="' + esc(home.exterior_image) + '" alt="' + esc(home.name) + '" width="640" height="360" loading="lazy" data-life-image><div class="apx-life-home-copy"><div class="apx-life-card-title"><div><span class="apx-life-rarity">' + esc(home.rarity) + '</span><h3>' + esc(home.name) + '</h3></div>' + (count ? '<span class="apx-life-owned-count">Đang sở hữu ' + count + '</span>' : '') + '</div><p>' + esc(home.description) + '</p><div class="apx-life-facts"><span>Giá mua<strong>' + formatMoney(home.price) + '</strong></span><span>Phí/ngày game<strong>' + formatMoney(home.daily_maintenance) + '</strong></span><span>Sức chứa<strong>' + Number(home.storage_capacity) + ' món</strong></span></div><button class="button button-gold" type="button" data-life-action="buy" data-id="' + esc(home.property_id) + '"' + (pending[home.property_id] ? ' disabled' : '') + '>' + (pending[home.property_id] ? 'Đang xử lý…' : count ? 'Mua thêm' : 'Mua nhà') + '</button></div></article>';
  }
  function overviewPage(state) {
    var primary = (data.owned || []).find(function (home) { return home.is_primary; });
    var profile = state && state.character && state.character.profile || {};
    var character = state && state.character || {};
    var level = character.level && character.level.current;
    var reputation = character.reputation && character.reputation.score;
    var playerName = profile.customized && profile.name ? profile.name : "Người chơi APX";
    var avatar = profile.avatar || profile.avatar_url || "";
    var activeVehicle = garageData && (garageData.owned || []).find(function (vehicle) { return vehicle.is_active; });
    var maintenance = data.maintenance || maintenanceSummary || {};
    var recentActivities = (cityData && cityData.recent || []).slice(0, 3).map(function (item) { return '<div><span>' + esc(item.activity_name || item.activity_id) + '</span><strong>' + formatMoney(item.fee) + '</strong></div>'; }).join("");
    var notifications = (socialData && socialData.notifications || []).slice(0, 3).map(function (item) { return '<div><span>' + esc(item.actor_name || 'Người chơi') + '</span><small>' + esc(item.notification_type) + '</small></div>'; }).join("");
    var overviewErrors = [resourceErrors.garage, resourceErrors.city, resourceErrors.social].filter(Boolean);
    return '<header class="page-heading"><span class="eyebrow">APX LIFE · CUỘC SỐNG CEO</span><h1>Cuộc sống CEO</h1><p>Không gian sống riêng, dùng tiền cá nhân và lưu theo tài khoản của bạn.</p></header>' +
      tabs("overview") +
      walletSyncNotice() +
      (overviewErrors.length ? '<div class="community-message" role="status">Một số dữ liệu chưa tải được: ' + esc(overviewErrors.join(' · ')) + ' <button class="button" type="button" data-life-retry="overview">Thử tải lại</button></div>' : '') +
      '<section class="panel apx-life-ceo"><div class="apx-life-ceo-avatar">' + (avatar ? '<img src="' + esc(avatar) + '" alt="Ảnh đại diện ' + esc(playerName) + '" width="72" height="72">' : '<span>' + esc(profile.initials || 'APX') + '</span>') + '</div><div><span class="eyebrow">HỒ SƠ CEO</span><h2>' + esc(playerName) + '</h2>' + (level != null || reputation != null ? '<small>' + (level != null ? 'Cấp ' + Number(level) : '') + (reputation != null ? ' · Uy tín ' + Number(reputation) : '') + '</small>' : '') + '</div><div class="apx-life-ceo-vehicle"><span class="eyebrow">XE ĐANG SỬ DỤNG</span><strong>' + (activeVehicle ? esc(activeVehicle.name) : 'Chưa có xe') + '</strong></div></section>' +
      '<section class="panel apx-life-wallet"><div><span class="eyebrow">VÍ CÁ NHÂN</span><strong>' + formatMoney(data.cash) + '</strong><small>Tách biệt quỹ công ty</small></div><button class="button button-gold" type="button" data-action="page" data-page="homes">Khám phá nhà ở</button></section>' +
      (Number(maintenance.debt) > 0 ? '<section class="panel apx-life-maintenance-debt" role="status"><strong>Nợ phí duy trì</strong><span>' + formatMoney(maintenance.debt) + '</span><p>Nhà được giữ nguyên; thu nợ khi đủ số dư.</p></section>' : '') +
      '<section class="apx-life-section"><div class="section-title-row"><div><span class="eyebrow">NƠI Ở HIỆN TẠI</span><h2>' + (primary ? esc(primary.name) : 'Chưa chọn nhà') + '</h2></div></div>' + (primary ? '<article class="panel apx-life-primary-card"><img src="' + esc(primary.exterior_image) + '" alt="' + esc(primary.name) + '" width="640" height="360" loading="lazy" data-life-image><div><p>' + esc(primary.description) + '</p><span>Phí duy trì mỗi ngày game: <strong>' + formatMoney(primary.daily_maintenance) + '</strong></span></div></article>' : emptyHomes()) + '</section>' +
      '<section class="apx-life-overview-columns"><section class="apx-life-section"><div class="section-title-row"><div><span class="eyebrow">GẦN ĐÂY</span><h2>Hoạt động</h2></div></div>' + (recentActivities ? '<div class="panel apx-life-history">' + recentActivities + '</div>' : '<p class="apx-life-history-empty">Chưa có hoạt động thành phố.</p>') + '</section><section class="apx-life-section"><div class="section-title-row"><div><span class="eyebrow">CỘNG ĐỒNG</span><h2>Thông báo</h2></div></div>' + (notifications ? '<div class="panel apx-life-history">' + notifications + '</div>' : '<p class="apx-life-history-empty">Chưa có thông báo.</p>') + '</section></section>' +
      '<button class="button button-gold" type="button" data-action="page" data-page="city">Đi ra thành phố</button>';
  }
  function homesPage() {
    var maintenance = data.maintenance || maintenanceSummary || {};
    return '<header class="page-heading"><span class="eyebrow">APX LIFE · NHÀ Ở</span><h1>Danh mục nhà ở</h1><p>Giao dịch dùng ví cá nhân; quyền sở hữu được xác nhận và lưu trên Supabase.</p></header>' +
      tabs("homes") +
      walletSyncNotice() +
      '<section class="panel apx-life-wallet"><div><span class="eyebrow">SỐ DƯ CÁ NHÂN</span><strong>' + formatMoney(data.cash) + '</strong></div></section>' +
      (Number(maintenance.debt) > 0 ? '<section class="panel apx-life-maintenance-debt" role="status"><strong>Nợ phí duy trì</strong><span>' + formatMoney(maintenance.debt) + '</span><p>Nhà được giữ nguyên; có thể hạn chế trang trí.</p></section>' : '') +
      (errorMessage ? '<p class="community-message" role="alert">' + esc(errorMessage) + '</p>' : '') +
      '<section class="apx-life-section"><div class="section-title-row"><div><span class="eyebrow">ĐÃ SỞ HỮU</span><h2>Nhà của tôi</h2></div><span>' + (data.owned || []).length + ' căn</span></div>' + ownedHomes() + '</section>' +
      '<section class="apx-life-section"><div class="section-title-row"><div><span class="eyebrow">DANH MỤC APX</span><h2>Chọn nơi ở</h2></div></div><section class="apx-life-catalog-grid">' + (data.catalog || []).map(catalogCard).join('') + '</section></section>';
  }
  function vehicleCard(vehicle, owned) {
    var stats = vehicle.stats || {};
    var price = owned ? vehicle.purchase_price : vehicle.price;
    var actions = owned
      ? '<div class="apx-life-vehicle-actions">' +
        (!vehicle.is_active ? '<button class="button" type="button" data-life-vehicle-action="active" data-id="' + esc(vehicle.id) + '"' + (pending.activeVehicle ? ' disabled' : '') + '>Dùng xe này</button>' : '<span class="apx-life-primary">Đang sử dụng</span>') +
        '<button class="button apx-life-sell" type="button" data-life-vehicle-action="sell" data-id="' + esc(vehicle.id) + '"' + (pending["sell-" + vehicle.id] ? ' disabled' : '') + '>Bán lại · ' + formatMoney(Math.floor(Number(vehicle.purchase_price) * Number(vehicle.resale_rate))) + '</button></div>'
      : '<button class="button button-gold" type="button" data-life-vehicle-action="buy" data-id="' + esc(vehicle.vehicle_id) + '"' + (pending["vehicle-" + vehicle.vehicle_id] ? ' disabled' : '') + '>' + (pending["vehicle-" + vehicle.vehicle_id] ? 'Đang xử lý…' : 'Mua xe') + '</button>';
    return '<article class="panel apx-life-vehicle-card' + (owned && vehicle.is_active ? ' is-active' : '') + '"><img src="' + esc(vehicle.image) + '" alt="' + esc(vehicle.name) + '" width="640" height="360" loading="lazy" data-life-image data-fallback="assets/apx-life/ui/vehicle-placeholder.svg"><div class="apx-life-home-copy"><div class="apx-life-card-title"><div><span class="apx-life-rarity">' + esc(vehicle.vehicle_type) + ' · ' + esc(vehicle.rarity) + '</span><h3>' + esc(vehicle.name) + '</h3></div>' + (owned && vehicle.is_active ? '<span class="apx-life-primary">Đang dùng</span>' : '') + '</div><p>' + esc(vehicle.description) + '</p><div class="apx-life-facts"><span>' + (owned ? 'Giá mua' : 'Giá bán') + '<strong>' + formatMoney(price) + '</strong></span><span>Bảo dưỡng/ngày<strong>' + formatMoney(vehicle.daily_maintenance) + '</strong></span><span>Thông số<strong>' + Number(stats.power || 0) + ' lực · ' + Number(stats.comfort || 0) + ' tiện nghi</strong></span></div>' + actions + '</div></article>';
  }
  function garagePage() {
    var vehicles = garageData.owned || [];
    var history = garageData.history || [];
    return '<header class="page-heading"><span class="eyebrow">APX LIFE · GARAGE</span><h1>Garage CEO</h1><p>Xe là tài sản mô phỏng và vật phẩm địa vị, không tăng lợi thế kinh doanh.</p></header>' +
      tabs("garage") +
      '<section class="panel apx-life-wallet"><div><span class="eyebrow">VÍ CÁ NHÂN</span><strong>' + formatMoney(garageData.cash) + '</strong></div><div><span class="eyebrow">SỨC CHỨA GARAGE</span><strong>' + vehicles.length + ' / ' + Number(garageData.garage_capacity) + ' xe</strong></div></section>' +
      (errorMessage ? '<p class="community-message" role="alert">' + esc(errorMessage) + '</p>' : '') +
      '<section class="apx-life-section"><div class="section-title-row"><div><span class="eyebrow">ĐÃ SỞ HỮU</span><h2>Garage của tôi</h2></div></div>' + (vehicles.length ? '<section class="apx-life-vehicle-grid">' + vehicles.map(function (vehicle) { return vehicleCard(vehicle, true); }).join("") + '</section>' : '<section class="panel apx-life-empty"><h2>Garage đang trống</h2></section>') + '</section>' +
      '<section class="apx-life-section"><div class="section-title-row"><div><span class="eyebrow">DANH MỤC APX</span><h2>Xe đang mở bán</h2></div></div><section class="apx-life-vehicle-grid">' + (garageData.catalog || []).map(function (vehicle) { return vehicleCard(vehicle, false); }).join("") + '</section></section>' +
      '<section class="apx-life-section"><div class="section-title-row"><div><span class="eyebrow">LỊCH SỬ</span><h2>Giao dịch garage</h2></div></div>' + (history.length ? '<div class="panel apx-life-history">' + history.map(function (item) { return '<div><span>' + (item.transaction_type === 'buy' ? 'Mua xe' : 'Bán xe') + ' · ' + esc(item.vehicle_id) + '</span><strong>' + formatMoney(item.amount) + '</strong></div>'; }).join("") + '</div>' : '<p class="apx-life-history-empty">Chưa có giao dịch.</p>') + '</section>';
  }
  function loadGarage(force) {
    if (!signedIn() || garageLoading || (!force && (garageData || resourceErrors.garage))) return Promise.resolve();
    if (force) delete resourceErrors.garage;
    garageLoading = true;
    errorMessage = "";
    return window.APXAccount.getSupabaseClient().then(function (db) {
      return db.rpc("apx_life_vehicle_home");
    }).then(function (result) {
      if (result.error) throw result.error;
      garageData = result.data || { cash: null, garage_capacity: 1, catalog: [], owned: [], history: [] };
      delete resourceErrors.garage;
    }).catch(function (error) {
      errorMessage = error && error.message ? error.message : "Không tải được garage.";
      resourceErrors.garage = errorMessage;
      garageData = null;
    }).finally(function () {
      garageLoading = false;
      if (routeActive() && window.APXGame) window.APXGame.render();
    });
  }
  var roomSlots = [
    { id: "north-west", label: "Góc trên trái", x: 17, y: 18 },
    { id: "north", label: "Trên giữa", x: 50, y: 18 },
    { id: "north-east", label: "Góc trên phải", x: 83, y: 18 },
    { id: "west", label: "Giữa trái", x: 17, y: 50 },
    { id: "center", label: "Trung tâm", x: 50, y: 50 },
    { id: "east", label: "Giữa phải", x: 83, y: 50 },
    { id: "south-west", label: "Góc dưới trái", x: 17, y: 82 },
    { id: "south", label: "Dưới giữa", x: 50, y: 82 },
    { id: "south-east", label: "Góc dưới phải", x: 83, y: 82 }
  ];
  function loadRoom(ownedPropertyId, force) {
    if (!signedIn() || roomLoading || (!force && resourceErrors.room) || (roomData && roomData.property.id === ownedPropertyId && !force)) return Promise.resolve();
    if (force) delete resourceErrors.room;
    roomLoading = true;
    errorMessage = "";
    return window.APXAccount.getSupabaseClient().then(function (db) {
      return db.rpc("apx_life_room_home", { p_owned_property_id: ownedPropertyId });
    }).then(function (result) {
      if (result.error) throw result.error;
      roomData = result.data;
      roomDraft = JSON.parse(JSON.stringify(roomData.layout || { schema_version: 1, items: [] }));
      if (!selectedFurnitureId && roomData.owned_furniture.length) selectedFurnitureId = roomData.owned_furniture[0].id;
      delete resourceErrors.room;
    }).catch(function (error) {
      errorMessage = error && error.message ? error.message : "Không tải được sơ đồ phòng.";
      resourceErrors.room = errorMessage;
      roomData = null;
    }).finally(function () {
      roomLoading = false;
      if (routeActive() && window.APXGame) window.APXGame.render();
    });
  }
  function roomPage() {
    var homeOptions = (data.owned || []).map(function (home) {
      return '<option value="' + esc(home.id) + '"' + (home.id === roomPropertyId ? ' selected' : '') + '>' + esc(home.name) + '</option>';
    }).join("");
    var ownedItems = roomData.owned_furniture || [];
    var itemOptions = ownedItems.map(function (item) {
      return '<option value="' + esc(item.id) + '"' + (item.id === selectedFurnitureId ? ' selected' : '') + '>' + esc(item.name) + '</option>';
    }).join("");
    var placements = roomDraft.items || [];
    var slotMarkup = roomSlots.map(function (slot) {
      var placed = placements.find(function (item) { return item.slot === slot.id; });
      var furniture = placed && ownedItems.find(function (item) { return item.id === placed.owned_id; });
      return '<div class="apx-life-room-slot' + (placed ? ' has-item' : '') + '"><button class="apx-life-room-slot-button" type="button" data-room-slot="' + slot.id + '" aria-label="Chọn vị trí ' + slot.label + '">' + (furniture ? '<img src="' + esc(furniture.icon) + '" alt="" width="48" height="48" loading="lazy" data-life-image data-fallback="assets/apx-life/items/furniture-placeholder.svg" style="transform:rotate(' + (Number(placed.rotation) || 0) + 'deg)"><span>' + esc(furniture.name) + '</span>' : '<span class="apx-life-room-slot-empty">' + slot.label + '</span>') + '</button>' + (placed ? '<div class="apx-life-room-item-actions"><button type="button" data-room-rotate="' + esc(placed.owned_id) + '" aria-label="Xoay ' + esc(furniture ? furniture.name : 'vật dụng') + '">Xoay</button><button type="button" data-room-remove="' + esc(placed.owned_id) + '" aria-label="Bỏ vật dụng khỏi sơ đồ">Bỏ</button></div>' : '') + '</div>';
    }).join("");
    var catalog = roomData.catalog || [];
    return '<header class="page-heading"><span class="eyebrow">APX LIFE · NỘI THẤT</span><h1>Trang trí nhà</h1><p>Chọn món đồ, chạm vị trí để xem trước rồi lưu bố trí lên tài khoản.</p></header>' +
      tabs("decor") +
      '<section class="panel apx-life-room-toolbar"><label>Nhà đang chỉnh<select data-room-property>' + homeOptions + '</select></label><label>Vật dụng của tôi<select data-room-furniture>' + (itemOptions || '<option value="">Chưa có đồ nội thất</option>') + '</select></label><span>Sức chứa: ' + placements.length + ' / ' + Number(roomData.property.storage_capacity) + '</span><button class="button button-gold" type="button" data-room-action="save"' + (pending.roomSave ? ' disabled' : '') + '>' + (pending.roomSave ? 'Đang lưu…' : 'Lưu bố trí') + '</button></section>' +
      (errorMessage ? '<p class="community-message" role="alert">' + esc(errorMessage) + '</p>' : '') +
      '<section class="apx-life-room-stage" aria-label="Xem trước bố trí nội thất"><img class="apx-life-room-background" src="' + esc(roomData.property.interior_image) + '" alt="' + esc(roomData.property.name) + '" width="640" height="360" loading="lazy" data-life-image>' + slotMarkup + '</section>' +
      '<section class="apx-life-section"><div class="section-title-row"><div><span class="eyebrow">KHO NỘI THẤT</span><h2>Vật dụng đã sở hữu</h2></div><span>' + ownedItems.length + ' món</span></div>' + (ownedItems.length ? '<div class="apx-life-furniture-grid">' + ownedItems.map(function (item) { return '<button class="panel apx-life-furniture-item' + (selectedFurnitureId === item.id ? ' selected' : '') + '" type="button" data-room-select-item="' + esc(item.id) + '"><img src="' + esc(item.icon) + '" alt="" width="56" height="56" loading="lazy" data-life-image data-fallback="assets/apx-life/items/furniture-placeholder.svg"><span>' + esc(item.name) + '</span></button>'; }).join("") + '</div>' : '') + '</section>' +
      '<section class="apx-life-section"><div class="section-title-row"><div><span class="eyebrow">CỬA HÀNG NỘI THẤT</span><h2>Chọn món mới</h2></div></div><section class="apx-life-furniture-grid">' + catalog.map(function (item) { return '<article class="panel apx-life-furniture-card"><img src="' + esc(item.icon) + '" alt="" width="56" height="56" loading="lazy" data-life-image data-fallback="assets/apx-life/items/furniture-placeholder.svg"><div><strong>' + esc(item.name) + '</strong><small>' + esc(item.description) + '</small><b>' + formatMoney(item.price) + '</b></div><button class="button" type="button" data-room-buy="' + esc(item.furniture_id) + '"' + (pending["furniture-" + item.furniture_id] ? ' disabled' : '') + '>Mua</button></article>'; }).join("") + '</section></section>';
  }
  function placeRoomItem(slotId) {
    if (!selectedFurnitureId) {
      window.APXGame.toast("Chọn một vật dụng đang sở hữu trước.");
      return;
    }
    var slot = roomSlots.find(function (item) { return item.id === slotId; });
    if (!slot) return;
    var sameItem = roomDraft.items.find(function (item) { return item.owned_id === selectedFurnitureId; });
    var occupying = roomDraft.items.find(function (item) { return item.slot === slotId; });
    roomDraft.items = roomDraft.items.filter(function (item) {
      return item.owned_id !== selectedFurnitureId && (!occupying || item.owned_id !== occupying.owned_id);
    });
    roomDraft.items.push({ owned_id: selectedFurnitureId, slot: slot.id, x: slot.x, y: slot.y, rotation: sameItem ? Number(sameItem.rotation) || 0 : 0 });
    window.APXGame.render();
  }
  function saveRoomLayout() {
    if (pending.roomSave || !roomData || !roomDraft) return;
    pending.roomSave = true;
    errorMessage = "";
    window.APXAccount.getSupabaseClient().then(function (db) {
      return db.rpc("apx_life_save_room_layout", { p_owned_property_id: roomPropertyId, p_layout: roomDraft });
    }).then(function (result) {
      if (result.error) throw result.error;
      roomData.layout = result.data;
      roomDraft = JSON.parse(JSON.stringify(result.data));
      window.APXGame.toast("Đã lưu bố trí căn phòng.");
    }).catch(function (error) {
      errorMessage = error && error.message ? error.message : "Không lưu được bố trí phòng.";
    }).finally(function () {
      pending.roomSave = false;
      if (routeActive() && window.APXGame) window.APXGame.render();
    });
  }
  function buyFurniture(furnitureId) {
    var key = "furniture-" + furnitureId;
    if (pending[key] || !roomPropertyId) return;
    var item = (roomData.catalog || []).find(function (entry) { return entry.furniture_id === furnitureId; });
    if (!item || !window.confirm("Mua " + item.name + " với giá " + formatMoney(item.price) + " bằng tiền cá nhân?")) return;
    pending[key] = true;
    errorMessage = "";
    var idempotencyKey = getRequestId(key);
    window.APXAccount.getSupabaseClient().then(function (db) {
      return db.rpc("apx_life_buy_furniture", { p_owned_property_id: roomPropertyId, p_furniture_id: furnitureId, p_idempotency_key: idempotencyKey });
    }).then(function (result) {
      if (result.error) throw result.error;
      clearRequestId(key);
      return window.APXAccount.syncTransactions();
    }).then(function () {
      roomData = null;
      return loadRoom(roomPropertyId, true);
    }).then(function () {
      window.APXGame.toast("Đã mua " + item.name + ".");
    }).catch(function (error) {
      errorMessage = error && error.message ? error.message : "Không mua được vật dụng.";
    }).finally(function () {
      pending[key] = false;
      if (routeActive() && window.APXGame) window.APXGame.render();
    });
  }
  function loadCity(force) {
    if (!signedIn() || cityLoading || (!force && (cityData || resourceErrors.city))) return Promise.resolve();
    if (force) delete resourceErrors.city;
    cityLoading = true;
    errorMessage = "";
    return window.APXAccount.getSupabaseClient().then(function (db) {
      return db.rpc("apx_life_city_home");
    }).then(function (result) {
      if (result.error) throw result.error;
      cityData = result.data || { locations: [], events: [], recent: [] };
      delete resourceErrors.city;
      if (!selectedLocationId && cityData.locations.length) selectedLocationId = cityData.locations[0].location_id;
    }).catch(function (error) {
      errorMessage = error && error.message ? error.message : "Không tải được thành phố APX LIFE.";
      resourceErrors.city = errorMessage;
      cityData = null;
    }).finally(function () {
      cityLoading = false;
      if (routeActive() && window.APXGame) window.APXGame.render();
    });
  }
  function cityPage() {
    var locations = cityData.locations || [];
    var location = locations.find(function (item) { return item.location_id === selectedLocationId; }) || locations[0];
    if (!location) return '<header class="page-heading"><span class="eyebrow">APX LIFE · THÀNH PHỐ</span><h1>Thành phố APX</h1></header><section class="panel apx-life-empty"><h2>Chưa có địa điểm</h2></section>';
    selectedLocationId = location.location_id;
    var mapMarkers = locations.map(function (item) {
      var x = Math.max(3, Math.min(97, Number(item.map_x) || 50));
      var y = Math.max(5, Math.min(95, Number(item.map_y) || 50));
      return '<button class="apx-life-map-marker' + (item.location_id === location.location_id ? ' active' : '') + '" type="button" data-city-location="' + esc(item.location_id) + '" style="left:' + x + '%;top:' + y + '%" aria-label="Mở ' + esc(item.name) + '"><span aria-hidden="true"></span><b>' + esc(item.name) + '</b></button>';
    }).join("");
    var events = (cityData.events || []).map(function (event) {
      var start = new Date(event.starts_at);
      var end = new Date(event.ends_at);
      var active = Date.now() >= start.getTime() && Date.now() <= end.getTime();
      return '<article class="panel apx-life-event-card"><img src="' + esc(event.image) + '" alt="' + esc(event.name) + '" width="640" height="360" loading="lazy" data-life-image data-fallback="assets/apx-life/locations/event-hall.svg"><div><span class="eyebrow">' + (active ? 'ĐANG DIỄN RA' : 'SỰ KIỆN THEO LỊCH') + '</span><h3>' + esc(event.name) + '</h3><p>' + esc(event.description) + '</p><small>' + esc(start.toLocaleString('vi-VN')) + ' – ' + esc(end.toLocaleString('vi-VN')) + ' · ' + Number(event.attendee_count) + '/' + Number(event.capacity) + ' người</small><strong>' + formatMoney(event.ticket_price) + '</strong>' + (event.joined ? '<span class="apx-life-primary">Đã đăng ký</span>' : '<button class="button" type="button" data-city-event="' + esc(event.event_id) + '"' + (!active || Number(event.attendee_count) >= Number(event.capacity) || pending['event-' + event.event_id] ? ' disabled' : '') + '>Tham gia</button>') + '</div></article>';
    }).join("");
    var activities = (location.activities || []).map(function (activity) {
      var key = "activity-" + activity.activity_id;
      return '<article class="panel apx-life-activity-card"><div><h3>' + esc(activity.name) + '</h3><p>' + esc(activity.description) + '</p><small>Giới hạn ' + Number(activity.daily_limit) + ' lượt/ngày game · +' + Number(activity.social_points) + ' điểm xã hội</small></div><strong>' + formatMoney(activity.price) + '</strong><button class="button button-gold" type="button" data-city-activity="' + esc(activity.activity_id) + '"' + (pending[key] ? ' disabled' : '') + '>' + (pending[key] ? 'Đang xử lý…' : 'Tham gia') + '</button></article>';
    }).join("");
    var recent = (cityData.recent || []).map(function (item) {
      return '<div><span>' + esc(item.activity_id) + '</span><strong>' + formatMoney(item.fee) + '</strong><small>+' + Number(item.social_points) + ' điểm xã hội</small></div>';
    }).join("");
    return '<header class="page-heading"><span class="eyebrow">APX LIFE · THÀNH PHỐ</span><h1>Thành phố APX</h1><p>Ghé những địa điểm hư cấu trong đô thị Việt Nam và tham gia hoạt động giới hạn theo ngày game.</p></header>' +
      tabs("city") +
      (errorMessage ? '<p class="community-message" role="alert">' + esc(errorMessage) + '</p>' : '') +
      '<section class="apx-life-city-layout"><div class="apx-life-city-map"><img src="assets/apx-life/locations/city-map.svg" alt="Bản đồ minh họa thành phố APX" width="960" height="600" loading="eager" data-life-image data-fallback="assets/apx-life/locations/city-map.svg">' + mapMarkers + '</div><aside class="panel apx-life-location-panel"><img src="' + esc(location.image) + '" alt="' + esc(location.name) + '" width="640" height="360" loading="lazy" data-life-image data-fallback="assets/apx-life/locations/event-hall.svg"><span class="eyebrow">' + esc(location.opening_hours) + '</span><h2>' + esc(location.name) + '</h2><p>' + esc(location.description) + '</p><div class="apx-life-location-list">' + locations.map(function (item) { return '<button type="button" data-city-location="' + esc(item.location_id) + '"' + (item.location_id === location.location_id ? ' aria-current="true"' : '') + '>' + esc(item.name) + '</button>'; }).join("") + '</div></aside></section>' +
      '<section class="apx-life-section"><div class="section-title-row"><div><span class="eyebrow">TẠI ĐỊA ĐIỂM</span><h2>Hoạt động</h2></div></div><section class="apx-life-activity-grid">' + activities + '</section></section>' +
      '<section class="apx-life-section"><div class="section-title-row"><div><span class="eyebrow">LỊCH SERVER</span><h2>Sự kiện</h2></div></div><section class="apx-life-event-grid">' + (events || '<p>Hiện chưa có sự kiện sắp tới.</p>') + '</section></section>' +
      '<section class="apx-life-section"><div class="section-title-row"><div><span class="eyebrow">NHẬT KÝ GẦN ĐÂY</span><h2>Hoạt động của tôi</h2></div></div>' + (recent ? '<div class="panel apx-life-history">' + recent + '</div>' : '<p class="apx-life-history-empty">Chưa có hoạt động nào.</p>') + '</section>';
  }
  function doCityActivity(activityId) {
    var key = "activity-" + activityId;
    if (pending[key]) return;
    var activity = (cityData.locations || []).reduce(function (found, location) {
      return found || (location.activities || []).find(function (item) { return item.activity_id === activityId; });
    }, null);
    if (!activity || !window.confirm("Tham gia " + activity.name + " với phí " + formatMoney(activity.price) + " tiền game?")) return;
    pending[key] = true;
    errorMessage = "";
    var idempotencyKey = getRequestId(key);
    window.APXAccount.getSupabaseClient().then(function (db) {
      return db.rpc("apx_life_do_activity", { p_activity_id: activityId, p_idempotency_key: idempotencyKey });
    }).then(function (result) {
      if (result.error) throw result.error;
      clearRequestId(key);
      window.APXGame.toast("Hoạt động hoàn tất · +" + Number(result.data.social_points) + " điểm xã hội.");
      return window.APXAccount.syncTransactions();
    }).then(function () {
      cityData = null;
      return loadCity(true);
    }).catch(function (error) {
      errorMessage = error && error.message ? error.message : "Không thể tham gia hoạt động.";
    }).finally(function () {
      pending[key] = false;
      if (routeActive() && window.APXGame) window.APXGame.render();
    });
  }
  function joinCityEvent(eventId) {
    var key = "event-" + eventId;
    if (pending[key]) return;
    var event = (cityData.events || []).find(function (item) { return item.event_id === eventId; });
    if (!event || !window.confirm("Đăng ký " + event.name + " với phí " + formatMoney(event.ticket_price) + " tiền game?")) return;
    pending[key] = true;
    errorMessage = "";
    var idempotencyKey = getRequestId(key);
    window.APXAccount.getSupabaseClient().then(function (db) {
      return db.rpc("apx_life_join_event", { p_event_id: eventId, p_idempotency_key: idempotencyKey });
    }).then(function (result) {
      if (result.error) throw result.error;
      clearRequestId(key);
      window.APXGame.toast("Đã đăng ký sự kiện " + event.name + ".");
      return window.APXAccount.syncTransactions();
    }).then(function () {
      cityData = null;
      return loadCity(true);
    }).catch(function (error) {
      errorMessage = error && error.message ? error.message : "Không thể đăng ký sự kiện.";
    }).finally(function () {
      pending[key] = false;
      if (routeActive() && window.APXGame) window.APXGame.render();
    });
  }
  function loadSocial(force, append) {
    if (!signedIn() || socialLoading || (!force && !append && (socialData || resourceErrors.social)) || (append && resourceErrors.social)) return Promise.resolve();
    if (force) delete resourceErrors.social;
    socialLoading = true;
    if (!append) socialOffset = 0;
    var pageOffset = append ? socialOffset : 0;
    errorMessage = "";
    return window.APXAccount.getSupabaseClient().then(function (db) {
      return Promise.all([
        db.rpc("apx_life_social_home", { p_offset: pageOffset }),
        db.rpc("apx_life_social_assets")
      ]);
    }).then(function (results) {
      results.forEach(function (result) { if (result.error) throw result.error; });
      var incoming = results[0].data || { posts: [], notifications: [] };
      socialData = append && socialData
        ? Object.assign({}, incoming, { posts: socialData.posts.concat(incoming.posts || []) })
        : incoming;
      socialAssets = Array.isArray(results[1].data) ? results[1].data : [];
      socialOffset = pageOffset + (incoming.posts || []).length;
      delete resourceErrors.social;
    }).catch(function (error) {
      errorMessage = error && error.message ? error.message : "Không tải được mạng xã hội.";
      resourceErrors.social = errorMessage;
    }).finally(function () {
      socialLoading = false;
      if (routeActive() && window.APXGame) window.APXGame.render();
    });
  }
  function loadFriends(force) {
    if (!signedIn() || friendLoading || (!force && (friendData || resourceErrors.friends))) return Promise.resolve();
    if (force) delete resourceErrors.friends;
    friendLoading = true;
    return window.APXAccount.getSupabaseClient().then(function (db) {
      return db.rpc("apx_life_friend_home");
    }).then(function (result) {
      if (result.error) throw result.error;
      friendData = result.data || { friends: [], incoming: [], outgoing: [] };
      delete resourceErrors.friends;
    }).catch(function (error) {
      errorMessage = error && error.message ? error.message : "Không tải được danh sách bạn bè.";
      resourceErrors.friends = errorMessage;
    }).finally(function () {
      friendLoading = false;
      if (routeActive() && window.APXGame) window.APXGame.render();
    });
  }
  function loadPeople(query) {
    peopleQuery = query || "";
    return window.APXAccount.getSupabaseClient().then(function (db) {
      return db.rpc("apx_life_people", { p_query: peopleQuery });
    }).then(function (result) {
      if (result.error) throw result.error;
      peopleData = Array.isArray(result.data) ? result.data : [];
      if (routeActive() && window.APXGame) window.APXGame.render();
    }).catch(function (error) {
      errorMessage = error && error.message ? error.message : "Không tìm thấy người chơi.";
      if (routeActive() && window.APXGame) window.APXGame.render();
    });
  }
  function loadSocialProfile(characterId) {
    socialProfile = null;
    socialProfileId = characterId;
    errorMessage = "";
    window.APXGame.render();
    window.APXAccount.getSupabaseClient().then(function (db) {
      return Promise.all([
        db.rpc("apx_life_social_profile", { p_character_id: characterId }),
        db.rpc("apx_life_public_properties", { p_character_id: characterId })
      ]);
    }).then(function (results) {
      results.forEach(function (result) { if (result.error) throw result.error; });
      socialProfile = results[0].data || null;
      socialProfile.properties = Array.isArray(results[1].data) ? results[1].data : [];
    }).catch(function (error) {
      errorMessage = error && error.message ? error.message : "Không tải được hồ sơ.";
    }).finally(function () { if (routeActive() && window.APXGame) window.APXGame.render(); });
  }
  function profileSocialView() {
    if (!socialProfile) return '<section class="panel apx-life-loading" role="status">' + (errorMessage ? esc(errorMessage) : 'Đang tải hồ sơ…') + '<button class="button" type="button" data-social-action="back">Quay lại</button></section>';
    var person = socialProfile;
    var properties = person.properties || [];
    return '<header class="page-heading"><span class="eyebrow">APX LIFE · HỒ SƠ CÔNG KHAI</span><h1>' + esc(person.display_name || 'Người chơi') + '</h1><p>' + esc(person.bio || (person.is_private ? 'Tài khoản riêng tư.' : '')) + '</p></header><div class="apx-life-social-actions"><button class="button" type="button" data-social-action="back">Quay lại</button>' + (person.is_private ? '<strong>Hồ sơ riêng tư</strong>' : '<button class="button" type="button" data-social-action="follow" data-id="' + esc(socialProfileId) + '">' + (person.following ? 'Bỏ theo dõi' : 'Theo dõi') + '</button><button class="button button-gold" type="button" data-social-action="friend" data-id="' + esc(socialProfileId) + '">' + (person.is_friend ? 'Bạn bè' : person.friend_status === 'pending' ? 'Lời mời đang chờ' : 'Kết bạn') + '</button><button class="button" type="button" data-social-action="block" data-id="' + esc(socialProfileId) + '">Chặn</button><button class="button" type="button" data-social-action="report" data-id="' + esc(socialProfileId) + '">Báo cáo</button>') + '</div>' +
      (person.home ? '<section class="panel apx-life-shared-asset"><img src="' + esc(person.home.image) + '" alt="' + esc(person.home.name) + '" width="640" height="360" loading="lazy" data-life-image><div><span class="eyebrow">NƠI Ở ĐƯỢC CHIA SẺ</span><h2>' + esc(person.home.name) + '</h2><p>' + esc(person.home.description) + '</p></div></section>' : '') +
      (person.vehicle ? '<section class="panel apx-life-shared-asset"><img src="' + esc(person.vehicle.image) + '" alt="' + esc(person.vehicle.name) + '" width="640" height="360" loading="lazy" data-life-image data-fallback="assets/apx-life/ui/vehicle-placeholder.svg"><div><span class="eyebrow">XE ĐƯỢC CHIA SẺ</span><h2>' + esc(person.vehicle.name) + '</h2><p>' + esc(person.vehicle.vehicle_type) + '</p></div></section>' : '') +
      (person.allow_home_visits && properties.length ? '<section class="apx-life-section"><div class="section-title-row"><div><span class="eyebrow">NHÀ CÔNG KHAI</span><h2>Ghé thăm · chỉ xem</h2></div></div><div class="apx-life-owned-grid">' + properties.map(function (home) { return '<article class="panel apx-life-owned-card"><img src="' + esc(home.exterior_image) + '" alt="' + esc(home.name) + '" width="640" height="360" loading="lazy" data-life-image><div class="apx-life-home-copy"><h3>' + esc(home.name) + '</h3><p>' + esc(home.description) + '</p></div></article>'; }).join("") + '</div></section>' : '');
  }
  function socialPage() {
    if (socialProfileId) return profileSocialView();
    if (!socialData && !socialLoading) loadSocial(false, false);
    if (socialLoading || !socialData) return '<header class="page-heading"><span class="eyebrow">APX LIFE · MẠNG XÃ HỘI</span><h1>Bảng tin</h1></header><section class="panel apx-life-loading" role="status">' + (errorMessage || 'Đang tải bảng tin…') + '</section>';
    var posts = (socialData.posts || []).map(function (post) {
      var commentMarkup = (post.comments || []).map(function (comment) { return '<div class="apx-life-comment"><strong>' + esc(comment.display_name) + '</strong><span data-user-text data-value="' + esc(comment.body) + '"></span></div>'; }).join("");
      return '<article class="panel apx-life-post"><header><button class="apx-life-post-author" type="button" data-social-profile="' + esc(post.owner_character_id) + '"><span class="apx-life-avatar">' + esc((post.display_name || 'NV').slice(0, 2)) + '</span><span><strong>' + esc(post.display_name) + '</strong><small>' + esc(new Date(post.created_at).toLocaleString('vi-VN')) + '</small></span></button>' + (post.is_mine ? '<button class="button" type="button" data-social-action="delete-post" data-id="' + esc(post.id) + '">Xóa bài</button>' : '') + '</header><p class="apx-life-post-body" data-user-text data-value="' + esc(post.body) + '"></p>' + (post.image_path ? '<img class="apx-life-post-image" src="' + esc(post.image_path) + '" alt="Ảnh APX LIFE do người đăng chọn" width="640" height="360" loading="lazy" data-life-image data-fallback="assets/apx-life/ui/apx-life-cover.svg">' : '') + '<div class="apx-life-post-actions"><button class="button" type="button" data-social-action="like" data-id="' + esc(post.id) + '">' + (post.liked ? 'Đã thích' : 'Thích') + ' · ' + Number(post.like_count) + '</button></div><div class="apx-life-comments">' + commentMarkup + '<form data-social-comment="' + esc(post.id) + '"><input name="body" maxlength="200" required placeholder="Viết bình luận…"><button class="button" type="submit">Gửi</button></form></div></article>';
    }).join("");
    var options = (socialAssets || []).map(function (asset) { return '<option value="' + esc(asset.kind + '|' + asset.id) + '">' + esc(asset.name) + '</option>'; }).join("");
    var notifications = (socialData.notifications || []).map(function (item) { return '<li class="' + (item.read_at ? '' : 'unread') + '"><span>' + esc(item.actor_name || 'Người chơi') + ' · ' + esc(item.notification_type) + '</span><small>' + esc(new Date(item.created_at).toLocaleString('vi-VN')) + '</small></li>'; }).join("");
    return '<header class="page-heading"><span class="eyebrow">APX LIFE · MẠNG XÃ HỘI</span><h1>Bảng tin</h1><p>Bài viết văn bản và ảnh chọn từ tài sản APX LIFE được phép chia sẻ.</p></header>' + tabs("social") +
      '<section class="panel apx-life-post-composer"><form id="lifePostForm"><textarea name="body" maxlength="500" required placeholder="Bạn muốn chia sẻ điều gì?" aria-label="Nội dung bài viết"></textarea><div><label>Ảnh có sẵn trong game<select name="asset"><option value="">Không đính kèm ảnh</option>' + options + '</select></label><button class="button button-gold" type="submit"' + (pending.post ? ' disabled' : '') + '>Đăng bài</button></div></form></section>' +
      '<section class="apx-life-social-layout"><div><div class="section-title-row"><div><span class="eyebrow">MỚI NHẤT</span><h2>Bài viết</h2></div><button class="button" type="button" data-social-action="refresh">Làm mới</button></div>' + (posts || '<section class="panel apx-life-empty"><h2>Bảng tin đang trống</h2><p>Đăng bài đầu tiên hoặc theo dõi người chơi khác.</p></section>') + ((socialData.posts || []).length >= 20 ? '<button class="button" type="button" data-social-action="more">Tải thêm</button>' : '') + '</div><aside class="panel apx-life-notifications"><span class="eyebrow">THÔNG BÁO · ' + Number(socialData.unread_notifications || 0) + ' chưa đọc</span><h2>Gần đây</h2><ul>' + (notifications || '<li>Chưa có thông báo.</li>') + '</ul><button class="button" type="button" data-social-action="read-notifications">Đánh dấu đã đọc</button><button class="button" type="button" data-social-action="settings">Cài đặt hồ sơ</button></aside></section>';
  }
  function friendsPage() {
    if (!friendData && !friendLoading) loadFriends(false);
    if (friendLoading || !friendData) return '<header class="page-heading"><span class="eyebrow">APX LIFE · BẠN BÈ</span><h1>Bạn bè</h1></header><section class="panel apx-life-loading" role="status">' + (errorMessage || 'Đang tải bạn bè…') + '</section>';
    var incoming = (friendData.incoming || []).map(function (person) { return '<article class="panel apx-life-person-row"><button type="button" data-social-profile="' + esc(person.character_id) + '"><strong>' + esc(person.display_name) + '</strong></button><button class="button button-gold" type="button" data-friend-action="accept" data-id="' + esc(person.character_id) + '">Chấp nhận</button><button class="button" type="button" data-friend-action="decline" data-id="' + esc(person.character_id) + '">Từ chối</button></article>'; }).join("");
    var friends = (friendData.friends || []).map(function (person) { return '<article class="panel apx-life-person-row"><button type="button" data-social-profile="' + esc(person.character_id) + '"><strong>' + esc(person.display_name) + '</strong></button><button class="button" type="button" data-friend-action="cancel" data-id="' + esc(person.character_id) + '">Hủy kết bạn</button></article>'; }).join("");
    var outgoing = (friendData.outgoing || []).map(function (person) { return '<article class="panel apx-life-person-row"><strong>' + esc(person.display_name) + '</strong><button class="button" type="button" data-friend-action="cancel" data-id="' + esc(person.character_id) + '">Hủy lời mời</button></article>'; }).join("");
    var people = (peopleData || []).map(function (person) { return '<article class="panel apx-life-person-row"><button type="button" data-social-profile="' + esc(person.character_id) + '"><strong>' + esc(person.display_name) + '</strong></button><button class="button" type="button" data-social-action="follow" data-id="' + esc(person.character_id) + '">' + (person.following ? 'Đang theo dõi' : 'Theo dõi') + '</button><button class="button button-gold" type="button" data-friend-action="request" data-id="' + esc(person.character_id) + '">' + (person.friend_status === 'accepted' ? 'Bạn bè' : person.friend_status === 'pending' ? 'Đang chờ' : 'Kết bạn') + '</button></article>'; }).join("");
    return '<header class="page-heading"><span class="eyebrow">APX LIFE · BẠN BÈ</span><h1>Bạn bè</h1><p>Lời mời, theo dõi và chặn được quản lý theo tài khoản APX hiện có.</p></header>' + tabs("friends") +
      '<form id="lifePeopleSearch" class="panel apx-life-people-search"><input name="query" maxlength="40" value="' + esc(peopleQuery) + '" placeholder="Tìm người chơi theo tên"><button class="button" type="submit">Tìm</button></form>' +
      '<section class="apx-life-section"><div class="section-title-row"><div><span class="eyebrow">NGƯỜI CHƠI</span><h2>Kết quả tìm kiếm</h2></div></div>' + (people || '<p class="apx-life-history-empty">Tìm người chơi để gửi lời mời.</p>') + '</section>' +
      '<section class="apx-life-section"><div class="section-title-row"><div><span class="eyebrow">ĐANG CHỜ</span><h2>Lời mời đến</h2></div></div>' + (incoming || '<p class="apx-life-history-empty">Không có lời mời đang chờ.</p>') + '</section>' +
      '<section class="apx-life-section"><div class="section-title-row"><div><span class="eyebrow">ĐÃ KẾT NỐI</span><h2>Bạn bè của tôi</h2></div></div>' + (friends || '<p class="apx-life-history-empty">Danh sách bạn bè đang trống.</p>') + '</section>' +
      '<section class="apx-life-section"><div class="section-title-row"><div><span class="eyebrow">ĐÃ GỬI</span><h2>Lời mời đi</h2></div></div>' + (outgoing || '<p class="apx-life-history-empty">Không có lời mời đi.</p>') + '</section>';
  }
  function profileSettingsPage() {
    var settings = socialData && socialData.settings || {};
    return '<header class="page-heading"><span class="eyebrow">APX LIFE · HỒ SƠ</span><h1>Cài đặt chia sẻ</h1><p>Hồ sơ không hiển thị email, số dư hay lịch sử chi tiêu.</p></header>' + tabs("social") + '<form id="lifeProfileSettings" class="panel apx-life-settings-form"><label>Giới thiệu<textarea name="bio" maxlength="180">' + esc(settings.bio || '') + '</textarea></label><label><input type="checkbox" name="private"' + (settings.is_private ? ' checked' : '') + '> Hồ sơ riêng tư</label><label><input type="checkbox" name="visits"' + (settings.allow_home_visits ? ' checked' : '') + '> Cho phép ghé thăm nhà công khai</label><label><input type="checkbox" name="shareHome"' + (settings.share_primary_home ? ' checked' : '') + '> Chia sẻ nhà chính</label><label><input type="checkbox" name="shareVehicle"' + (settings.share_active_vehicle ? ' checked' : '') + '> Chia sẻ xe đang sử dụng</label><button class="button button-gold" type="submit">Lưu cài đặt</button></form>';
  }
  function socialAction(action, id) {
    if (action === "back") { socialProfileId = ""; socialProfile = null; window.APXGame.render(); return; }
    if (action === "settings") { view = "settings"; window.APXGame.render(); return; }
    if (action === "refresh" || action === "more") { loadSocial(action === "refresh", action === "more"); return; }
    if (action === "report") {
      var description = window.prompt("Mô tả nội dung cần báo cáo (10–2000 ký tự):");
      if (!description) return;
      window.APXAccount.getSupabaseClient().then(function (db) { return db.rpc("apx_life_report_player", { p_character_id: id, p_description: description }); }).then(function (result) { if (result.error) throw result.error; window.APXGame.toast("Đã gửi báo cáo để kiểm duyệt."); }).catch(function (error) { errorMessage = error.message || "Không gửi được báo cáo."; window.APXGame.render(); });
      return;
    }
    if (action === "block" && !window.confirm("Chặn người chơi này? Hai bên sẽ không thể tương tác.")) return;
    if (action === "delete-post" && !window.confirm("Xóa bài viết của bạn?")) return;
    var person = socialProfile || (peopleData || []).find(function (item) { return item.character_id === id; }) || {};
    var functions = { follow: ["apx_life_follow", { p_character_id: id, p_follow: !person.following }], friend: ["apx_life_friend_request", { p_character_id: id }], block: ["apx_life_block_player", { p_character_id: id, p_block: true }], like: ["apx_life_toggle_like", { p_post_id: id }], "delete-post": ["apx_life_delete_post", { p_post_id: id }] };
    var call = functions[action];
    if (!call) return;
    pending["social-" + id] = true;
    window.APXAccount.getSupabaseClient().then(function (db) { return db.rpc(call[0], call[1]); }).then(function (result) { if (result.error) throw result.error; socialData = null; if (action === "follow" && socialProfile) socialProfile.following = !socialProfile.following; if (action === "friend" && socialProfile) { socialProfile.friend_status = result.data.status; socialProfile.is_friend = result.data.status === "accepted"; } if (action === "friend" || action === "block") { if (action === "block") { socialProfile = null; socialProfileId = ""; } } window.APXGame.toast(action === "like" ? (result.data ? "Đã thích bài viết." : "Đã bỏ thích.") : "Đã cập nhật."); if (window.APXGame.state.route.page === "friends") { peopleData = null; return Promise.all([loadFriends(true), loadPeople(peopleQuery)]); } return loadSocial(true, false); }).catch(function (error) { errorMessage = error && error.message ? error.message : "Không hoàn tất thao tác."; }).finally(function () { delete pending["social-" + id]; if (routeActive() && window.APXGame) window.APXGame.render(); });
  }
  function friendAction(action, characterId) {
    var calls = {
      request: ["apx_life_friend_request", { p_character_id: characterId }],
      accept: ["apx_life_friend_respond", { p_character_id: characterId, p_accept: true }],
      decline: ["apx_life_friend_respond", { p_character_id: characterId, p_accept: false }],
      cancel: ["apx_life_friend_cancel", { p_character_id: characterId }]
    };
    var call = calls[action];
    if (!call) return;
    var key = "friend-" + characterId;
    if (pending[key]) return;
    pending[key] = true;
    window.APXAccount.getSupabaseClient().then(function (db) { return db.rpc(call[0], call[1]); })
      .then(function (result) { if (result.error) throw result.error; friendData = null; peopleData = null; return Promise.all([loadFriends(true), loadPeople(peopleQuery)]); })
      .catch(function (error) { errorMessage = error && error.message ? error.message : "Không cập nhật được lời mời."; })
      .finally(function () { pending[key] = false; if (routeActive() && window.APXGame) window.APXGame.render(); });
  }
  function saveProfileSettings(form) {
    var elements = form.elements;
    var settings = socialData && socialData.settings || {};
    var args = {
      p_bio: elements.bio.value,
      p_private: elements.private.checked,
      p_visits: elements.visits.checked,
      p_share_home: elements.shareHome.checked,
      p_share_vehicle: elements.shareVehicle.checked
    };
    window.APXAccount.getSupabaseClient().then(function (db) { return db.rpc("apx_life_update_profile", args); })
      .then(function (result) { if (result.error) throw result.error; view = ""; socialData = null; window.APXGame.toast("Đã lưu cài đặt hồ sơ."); return loadSocial(true, false); })
      .catch(function (error) { errorMessage = error && error.message ? error.message : "Không lưu được cài đặt."; })
      .finally(function () { if (routeActive() && window.APXGame) window.APXGame.render(); });
  }
  function markSocialNotificationsRead() {
    var ids = (socialData.notifications || []).filter(function (item) { return !item.read_at; }).map(function (item) { return Number(item.id); });
    if (!ids.length) return;
    window.APXAccount.getSupabaseClient().then(function (db) { return db.rpc("apx_life_mark_notifications_read", { p_ids: ids }); })
      .then(function (result) { if (result.error) throw result.error; socialData = null; return loadSocial(true, false); })
      .catch(function (error) { errorMessage = error && error.message ? error.message : "Không cập nhật được thông báo."; })
      .finally(function () { if (routeActive() && window.APXGame) window.APXGame.render(); });
  }
  function createLifePost(form) {
    if (pending.post) return;
    var body = form.elements.body.value;
    var imageChoice = form.elements.asset.value;
    var imageParts = imageChoice ? imageChoice.split("|") : [];
    pending.post = true;
    window.APXAccount.getSupabaseClient().then(function (db) {
      return db.rpc("apx_life_create_post", { p_body: body, p_image_kind: imageParts[0] || null, p_image_asset_id: imageParts[1] || null });
    }).then(function (result) {
      if (result.error) throw result.error;
      form.reset(); socialData = null; window.APXGame.toast("Đã đăng bài."); return loadSocial(true, false);
    }).catch(function (error) { errorMessage = error && error.message ? error.message : "Không đăng được bài."; })
      .finally(function () { pending.post = false; if (routeActive() && window.APXGame) window.APXGame.render(); });
  }
  function submitLifeComment(form) {
    var postId = form.dataset.socialComment;
    if (pending["comment-" + postId]) return;
    pending["comment-" + postId] = true;
    window.APXAccount.getSupabaseClient().then(function (db) { return db.rpc("apx_life_add_comment", { p_post_id: postId, p_body: form.elements.body.value }); })
      .then(function (result) { if (result.error) throw result.error; form.reset(); socialData = null; return loadSocial(true, false); })
      .catch(function (error) { errorMessage = error && error.message ? error.message : "Không gửi được bình luận."; })
      .finally(function () { pending["comment-" + postId] = false; if (routeActive() && window.APXGame) window.APXGame.render(); });
  }
  function handleSocialSubmit(form) {
    if (form.id === "lifePostForm") { createLifePost(form); return true; }
    if (form.matches("[data-social-comment]")) { submitLifeComment(form); return true; }
    return false;
  }
  function bindImageFallbacks() {
    document.querySelectorAll("[data-life-image]").forEach(function (image) {
      var currentSource = image.getAttribute("src") || "";
      var preferredPhoto = preferredLifePhoto(currentSource);
      if (preferredPhoto !== currentSource) {
        image.dataset.fallback = currentSource;
        image.src = preferredPhoto;
      }
      image.onerror = function () {
        image.onerror = null;
        image.src = image.dataset.fallback || "assets/apx-life/interiors/home-interior.svg";
      };
    });
    document.querySelectorAll("[data-user-text]").forEach(function (element) {
      element.textContent = element.dataset.value || "";
      element.removeAttribute("data-value");
    });
  }
  function preferredLifePhoto(path) {
    var match = /^assets\/apx-life\/(properties|interiors|vehicles)\/([a-z0-9-]+)\.svg$/i.exec(String(path || ""));
    return match ? "assets/apx-life/" + match[1] + "/" + match[2] + ".webp" : path;
  }
  function preferredHousePhoto(path) { return preferredLifePhoto(path); }
  function buyProperty(propertyId) {
    if (pending[propertyId]) return;
    var property = (data.catalog || []).find(function (item) { return item.property_id === propertyId; });
    if (!property || !window.confirm("Mua " + property.name + " với giá " + formatMoney(property.price) + " bằng tiền cá nhân?")) return;
    pending[propertyId] = true;
    errorMessage = "";
    var idempotencyKey = getRequestId(propertyId);
    window.APXGame.render();
    window.APXAccount.getSupabaseClient().then(function (db) {
      return db.rpc("apx_life_buy_property", { p_property_id: propertyId, p_idempotency_key: idempotencyKey });
    }).then(function (result) {
      if (result.error) throw result.error;
      clearRequestId(propertyId);
      window.APXGame.toast(result.data && result.data.duplicate ? "Giao dịch trước đã được ghi nhận." : "Đã mua " + property.name + ".");
      return window.APXAccount.syncTransactions();
    }).then(function () {
      data = null;
      garageData = null;
      load(true);
    }).catch(function (error) {
      errorMessage = error && error.message ? error.message : "Không hoàn tất được giao dịch.";
    }).finally(function () {
      pending[propertyId] = false;
      if (routeActive() && window.APXGame) window.APXGame.render();
    });
  }
  function sellProperty(ownedId) {
    var key = "sell-home-" + ownedId;
    if (pending[key]) return;
    var home = (data.owned || []).find(function (item) { return item.id === ownedId; });
    if (!home) return;
    var resale = Math.floor(Number(home.purchase_price) * Number(home.resale_rate));
    if (!window.confirm("Bán " + home.name + " và nhận " + formatMoney(resale) + "? Công thức: floor(giá mua × " + Number(home.resale_rate).toFixed(2) + "). Đồ nội thất đã đặt sẽ được đưa về kho của bạn.")) return;
    pending[key] = true;
    errorMessage = "";
    var idempotencyKey = getRequestId(key);
    window.APXGame.render();
    window.APXAccount.getSupabaseClient().then(function (db) {
      return db.rpc("apx_life_sell_property", { p_owned_id: ownedId, p_idempotency_key: idempotencyKey, p_confirm_clear_layout: true });
    }).then(function (result) {
      if (result.error) throw result.error;
      clearRequestId(key);
      window.APXGame.toast("Đã bán nhà, nhận " + formatMoney(result.data.amount) + ".");
      return window.APXAccount.syncTransactions();
    }).then(function () {
      data = null;
      garageData = null;
      roomData = null;
      return load(true);
    }).catch(function (error) {
      errorMessage = error && error.message ? error.message : "Không bán được nhà.";
    }).finally(function () {
      pending[key] = false;
      if (routeActive() && window.APXGame) window.APXGame.render();
    });
  }
  function setPrimaryHome(ownedId) {
    if (pending.primary) return;
    pending.primary = true;
    errorMessage = "";
    window.APXAccount.getSupabaseClient().then(function (db) {
      return db.rpc("apx_life_set_primary_home", { p_owned_id: ownedId });
    }).then(function (result) {
      if (result.error) throw result.error;
      data = null;
      garageData = null;
      return load(true);
    }).catch(function (error) {
      errorMessage = error && error.message ? error.message : "Không đổi được nơi ở chính.";
    }).finally(function () {
      pending.primary = false;
      if (routeActive() && window.APXGame) window.APXGame.render();
    });
  }
  function buyVehicle(vehicleId) {
    var key = "vehicle-" + vehicleId;
    if (pending[key]) return;
    var vehicle = (garageData.catalog || []).find(function (item) { return item.vehicle_id === vehicleId; });
    if (!vehicle || !window.confirm("Mua " + vehicle.name + " với giá " + formatMoney(vehicle.price) + " bằng tiền cá nhân?")) return;
    pending[key] = true;
    errorMessage = "";
    var idempotencyKey = getRequestId(key);
    window.APXGame.render();
    window.APXAccount.getSupabaseClient().then(function (db) {
      return db.rpc("apx_life_buy_vehicle", { p_vehicle_id: vehicleId, p_idempotency_key: idempotencyKey });
    }).then(function (result) {
      if (result.error) throw result.error;
      clearRequestId(key);
      window.APXGame.toast(result.data && result.data.duplicate ? "Giao dịch mua xe đã được ghi nhận." : "Đã mua " + vehicle.name + ".");
      return window.APXAccount.syncTransactions();
    }).then(function () {
      garageData = null;
      return loadGarage(true);
    }).catch(function (error) {
      errorMessage = error && error.message ? error.message : "Không hoàn tất được giao dịch mua xe.";
    }).finally(function () {
      pending[key] = false;
      if (routeActive() && window.APXGame) window.APXGame.render();
    });
  }
  function setActiveVehicle(ownedId) {
    if (pending.activeVehicle) return;
    pending.activeVehicle = true;
    errorMessage = "";
    window.APXAccount.getSupabaseClient().then(function (db) {
      return db.rpc("apx_life_set_active_vehicle", { p_owned_id: ownedId });
    }).then(function (result) {
      if (result.error) throw result.error;
      return loadGarage(true);
    }).catch(function (error) {
      errorMessage = error && error.message ? error.message : "Không thể chọn xe đang sử dụng.";
    }).finally(function () {
      pending.activeVehicle = false;
      if (routeActive() && window.APXGame) window.APXGame.render();
    });
  }
  function sellVehicle(ownedId) {
    var key = "sell-" + ownedId;
    if (pending[key]) return;
    var vehicle = (garageData.owned || []).find(function (item) { return item.id === ownedId; });
    if (!vehicle) return;
    var resale = Math.floor(Number(vehicle.purchase_price) * Number(vehicle.resale_rate));
    if (!window.confirm("Bán " + vehicle.name + " với giá thu hồi " + formatMoney(resale) + "? Công thức: floor(giá mua × " + Number(vehicle.resale_rate).toFixed(2) + ").")) return;
    pending[key] = true;
    errorMessage = "";
    var idempotencyKey = getRequestId(key);
    window.APXAccount.getSupabaseClient().then(function (db) {
      return db.rpc("apx_life_sell_vehicle", { p_owned_id: ownedId, p_idempotency_key: idempotencyKey });
    }).then(function (result) {
      if (result.error) throw result.error;
      clearRequestId(key);
      window.APXGame.toast("Đã bán xe, nhận " + formatMoney(result.data.amount) + ".");
      return window.APXAccount.syncTransactions();
    }).then(function () {
      garageData = null;
      return loadGarage(true);
    }).catch(function (error) {
      errorMessage = error && error.message ? error.message : "Không hoàn tất được giao dịch bán xe.";
    }).finally(function () {
      pending[key] = false;
      if (routeActive() && window.APXGame) window.APXGame.render();
    });
  }
  function render(page, state) {
    if (!signedIn()) return signInPrompt(page);
    checkMaintenanceDay();
    subscribeLifeNotifications();
    if (page === "social") {
      if (!socialData && !socialLoading) loadSocial(false, false);
      if (socialLoading || !socialData) return '<header class="page-heading"><span class="eyebrow">APX LIFE · MẠNG XÃ HỘI</span><h1>Bảng tin</h1></header>' + tabs("social") + '<section class="panel apx-life-loading" role="status">' + (errorMessage ? esc(errorMessage) + '<button class="button" type="button" data-social-action="refresh">Thử tải lại</button>' : 'Đang tải bảng tin…') + '</section>';
      var socialOutput = view === "settings" ? profileSettingsPage() : socialPage();
      window.requestAnimationFrame(bindImageFallbacks);
      return socialOutput;
    }
    if (page === "friends") {
      if (!friendData && !friendLoading) loadFriends(false);
      if (friendLoading || !friendData) return '<header class="page-heading"><span class="eyebrow">APX LIFE · BẠN BÈ</span><h1>Bạn bè</h1></header>' + tabs("friends") + '<section class="panel apx-life-loading" role="status">' + (resourceErrors.friends ? esc(resourceErrors.friends) + '<button class="button" type="button" data-life-retry="friends">Thử tải lại</button>' : 'Đang tải danh sách…') + '</section>';
      var friendsOutput = friendsPage();
      return friendsOutput;
    }
    if (page === "journal") {
      if (!cityData && !cityLoading) loadCity(false);
      if (cityLoading || !cityData) return '<header class="page-heading"><span class="eyebrow">APX LIFE · NHẬT KÝ</span><h1>Nhật ký hoạt động</h1></header>' + tabs("journal") + '<section class="panel apx-life-loading" role="status">' + (resourceErrors.city ? esc(resourceErrors.city) + '<button class="button" type="button" data-life-retry="city">Thử tải lại</button>' : 'Đang tải nhật ký…') + '</section>';
      var journalRows = (cityData.recent || []).map(function (item) { return '<div><span>' + esc(item.activity_id) + '</span><strong>' + formatMoney(item.fee) + '</strong><small>+' + Number(item.social_points) + ' điểm xã hội · ' + esc(new Date(item.created_at).toLocaleString('vi-VN')) + '</small></div>'; }).join("");
      return '<header class="page-heading"><span class="eyebrow">APX LIFE · NHẬT KÝ</span><h1>Nhật ký hoạt động</h1><p>Những lần ghé thành phố gần đây.</p></header>' + tabs("journal") + (journalRows ? '<div class="panel apx-life-history">' + journalRows + '</div>' : '<section class="panel apx-life-empty"><h2>Nhật ký còn trống</h2><p>Hoạt động trong thành phố sẽ xuất hiện tại đây.</p></section>');
    }
    if (page === "shop") return '<header class="page-heading"><span class="eyebrow">APX LIFE · CỬA HÀNG</span><h1>Cửa hàng cuộc sống</h1><p>Catalog giá và tài sản được phục vụ từ Supabase.</p></header>' + tabs("shop") + '<section class="apx-life-shop-links"><button class="panel" type="button" data-action="page" data-page="homes"><span class="eyebrow">BẤT ĐỘNG SẢN</span><strong>Nhà ở</strong></button><button class="panel" type="button" data-action="page" data-page="garage"><span class="eyebrow">PHƯƠNG TIỆN</span><strong>Garage</strong></button><button class="panel" type="button" data-action="page" data-page="decor"><span class="eyebrow">NỘI THẤT</span><strong>Vật dụng trang trí</strong></button></section>';
    if (page === "city") {
      if (!cityData && !cityLoading) loadCity(false);
      if (cityLoading || !cityData) return '<header class="page-heading"><span class="eyebrow">APX LIFE · THÀNH PHỐ</span><h1>Thành phố APX</h1></header>' + tabs("city") + '<section class="panel apx-life-loading" role="status">' + (errorMessage ? esc(errorMessage) + '<button class="button" type="button" data-city-retry>Thử tải lại</button>' : 'Đang tải thành phố…') + '</section>';
      var cityOutput = cityPage();
      window.requestAnimationFrame(bindImageFallbacks);
      return cityOutput;
    }
    if (page === "garage") {
      if (!garageData && !garageLoading) loadGarage(false);
      if (garageLoading || !garageData) return '<header class="page-heading"><span class="eyebrow">APX LIFE · GARAGE</span><h1>Garage CEO</h1></header><section class="panel apx-life-loading" role="status">' + (resourceErrors.garage ? esc(resourceErrors.garage) + '<button class="button" type="button" data-life-retry="garage">Thử tải lại</button>' : 'Đang tải garage…') + '</section>';
      var garageOutput = garagePage();
      window.requestAnimationFrame(bindImageFallbacks);
      return garageOutput;
    }
    if (!data && !loading) load(false);
    if (loading || !data) {
      return '<header class="page-heading"><span class="eyebrow">APX LIFE · CUỘC SỐNG CEO</span><h1>Cuộc sống CEO</h1></header><section class="panel apx-life-loading" role="status">' + (resourceErrors.housing ? esc(resourceErrors.housing) + '<button class="button" type="button" data-life-retry="housing">Thử tải lại</button>' : 'Đang tải dữ liệu nhà ở…') + '</section>';
    }
    if (page === "decor") {
      var homes = data.owned || [];
      if (!homes.length) return '<header class="page-heading"><span class="eyebrow">APX LIFE · NỘI THẤT</span><h1>Trang trí nhà</h1></header>' + tabs("decor") + walletSyncNotice() + emptyHomes();
      var chosenHome = homes.find(function (home) { return home.id === roomPropertyId; }) || homes.find(function (home) { return home.is_primary; }) || homes[0];
      if (roomPropertyId !== chosenHome.id) {
        roomPropertyId = chosenHome.id;
        roomData = null;
        roomDraft = null;
      }
      if (!roomData && !roomLoading) loadRoom(roomPropertyId, false);
      if (roomLoading || !roomData) return '<header class="page-heading"><span class="eyebrow">APX LIFE · NỘI THẤT</span><h1>Trang trí nhà</h1></header>' + tabs("decor") + walletSyncNotice() + '<section class="panel apx-life-loading" role="status">' + (errorMessage ? esc(errorMessage) + '<button class="button" type="button" data-room-action="retry">Thử tải lại</button>' : 'Đang tải sơ đồ phòng…') + '</section>';
      var roomOutput = roomPage();
      window.requestAnimationFrame(bindImageFallbacks);
      return walletSyncNotice() + roomOutput;
    }
    if (page === "overview") {
      if (!garageData && !garageLoading) loadGarage(false);
      if (!cityData && !cityLoading) loadCity(false);
      if (!socialData && !socialLoading) loadSocial(false, false);
    }
    var output = page === "homes" ? homesPage() : overviewPage(state || {});
    window.requestAnimationFrame(bindImageFallbacks);
    return output;
  }

  document.addEventListener("click", function (event) {
    var retryButton = event.target.closest("[data-life-retry]");
    if (retryButton) {
      var resource = retryButton.dataset.lifeRetry;
      if (resource === "housing" || resource === "overview") load(true);
      if (resource === "garage" || resource === "overview") loadGarage(true);
      if (resource === "city" || resource === "overview") loadCity(true);
      if (resource === "friends") loadFriends(true);
      if (resource === "social" || resource === "overview") loadSocial(true, false);
      return;
    }
    var button = event.target.closest("[data-life-action]");
    if (button) {
      if (button.dataset.lifeAction === "buy") buyProperty(button.dataset.id);
      if (button.dataset.lifeAction === "primary") setPrimaryHome(button.dataset.id);
      if (button.dataset.lifeAction === "sell-home") sellProperty(button.dataset.id);
      return;
    }
    button = event.target.closest("[data-life-vehicle-action]");
    if (!button) return;
    if (button.dataset.lifeVehicleAction === "buy") buyVehicle(button.dataset.id);
    if (button.dataset.lifeVehicleAction === "active") setActiveVehicle(button.dataset.id);
    if (button.dataset.lifeVehicleAction === "sell") sellVehicle(button.dataset.id);
  });

  document.addEventListener("change", function (event) {
    if (event.target.matches("[data-room-property]")) {
      roomPropertyId = event.target.value;
      roomData = null;
      roomDraft = null;
      loadRoom(roomPropertyId, true);
    }
    if (event.target.matches("[data-room-furniture]")) selectedFurnitureId = event.target.value;
  });

  document.addEventListener("click", function (event) {
    var button = event.target.closest("[data-room-slot]");
    if (button) {
      placeRoomItem(button.dataset.roomSlot);
      return;
    }
    button = event.target.closest("[data-room-rotate]");
    if (button && roomDraft) {
      var item = roomDraft.items.find(function (placed) { return placed.owned_id === button.dataset.roomRotate; });
      if (item) item.rotation = (Number(item.rotation) + 90) % 360;
      window.APXGame.render();
      return;
    }
    button = event.target.closest("[data-room-remove]");
    if (button && roomDraft) {
      roomDraft.items = roomDraft.items.filter(function (placed) { return placed.owned_id !== button.dataset.roomRemove; });
      window.APXGame.render();
      return;
    }
    button = event.target.closest("[data-room-select-item]");
    if (button) {
      selectedFurnitureId = button.dataset.roomSelectItem;
      window.APXGame.render();
      return;
    }
    button = event.target.closest("[data-room-buy]");
    if (button) {
      buyFurniture(button.dataset.roomBuy);
      return;
    }
    button = event.target.closest("[data-room-action]");
    if (!button) return;
    if (button.dataset.roomAction === "save") saveRoomLayout();
    if (button.dataset.roomAction === "retry") loadRoom(roomPropertyId, true);
  });

  document.addEventListener("click", function (event) {
    var button = event.target.closest("[data-city-location]");
    if (button) {
      selectedLocationId = button.dataset.cityLocation;
      window.APXGame.render();
      return;
    }
    button = event.target.closest("[data-city-activity]");
    if (button) {
      doCityActivity(button.dataset.cityActivity);
      return;
    }
    button = event.target.closest("[data-city-event]");
    if (button) {
      joinCityEvent(button.dataset.cityEvent);
      return;
    }
    if (event.target.closest("[data-city-retry]")) loadCity(true);
  });

  document.addEventListener("click", function (event) {
    var button = event.target.closest("[data-social-profile]");
    if (button) {
      socialProfileId = button.dataset.socialProfile;
      loadSocialProfile(socialProfileId);
      return;
    }
    button = event.target.closest("[data-social-action]");
    if (button) {
      if (button.dataset.socialAction === "read-notifications") markSocialNotificationsRead();
      else socialAction(button.dataset.socialAction, button.dataset.id || "");
      return;
    }
    button = event.target.closest("[data-friend-action]");
    if (button) friendAction(button.dataset.friendAction, button.dataset.id);
  });

  document.addEventListener("submit", function (event) {
    var form = event.target;
    if (form.id === "lifePostForm" || form.matches("[data-social-comment]")) {
      event.preventDefault();
      handleSocialSubmit(form);
      return;
    }
    if (form.id === "lifeProfileSettings") {
      event.preventDefault();
      saveProfileSettings(form);
      return;
    }
    if (form.id === "lifePeopleSearch") {
      event.preventDefault();
      friendData = friendData || { friends: [], incoming: [], outgoing: [] };
      loadPeople(form.elements.query.value.trim());
    }
  });

  window.APXLife = {
    reset: function () { if (notificationChannel && notificationDatabase) notificationDatabase.removeChannel(notificationChannel); notificationChannel = null; notificationDatabase = null; notificationWasSubscribed = false; seenNotificationIds = Object.create(null); resourceErrors = Object.create(null); data = null; garageData = null; roomData = null; roomDraft = null; roomPropertyId = ""; selectedFurnitureId = ""; cityData = null; selectedLocationId = ""; socialData = null; socialAssets = []; socialProfile = null; socialProfileId = ""; friendData = null; peopleData = null; maintenanceSummary = null; maintenanceCheckedDay = null; errorMessage = ""; requestKeys = Object.create(null); pending = Object.create(null); },
    preferredHousePhoto: preferredHousePhoto,
    preferredLifePhoto: preferredLifePhoto,
    render: render
  };
  window.APXPages.life = render;
})();
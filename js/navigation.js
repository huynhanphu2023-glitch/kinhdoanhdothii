/* =========================================================
   APX BUSINESS WORLD — ĐIỀU HƯỚNG
   Quản lý các khu vực chính, trang con và breadcrumb.
   Nội dung của từng trang được tạo trong các file riêng.
   ========================================================= */

window.APX_NAVIGATION = [
  {
    id: "career",
    label: "Sự nghiệp",
    icon: "icon-users",
    pages: [
      { id: "current", label: "Công việc hiện tại" },
      { id: "jobs", label: "Tìm việc" },
      { id: "contract", label: "Hợp đồng" }
    ]
  },
  {
    id: "bank",
    label: "APXBank",
    icon: "icon-coins",
    pages: [{ id: "overview", label: "Tổng quan APXBank" }]
  },
  {
    id: "character",
    label: "Nhân vật",
    icon: "icon-grid",
    pages: [
      { id: "profile", label: "Hồ sơ cá nhân" },
      { id: "skills", label: "Kỹ năng" },
      { id: "assets", label: "Tài sản cá nhân" },
      { id: "achievements", label: "Thành tựu" }
    ]
  },
  {
    id: "city",
    label: "Thành phố",
    icon: "icon-city",
    pages: [
      { id: "map", label: "Bản đồ thành phố" },
      { id: "properties", label: "Bất động sản" },
      { id: "build", label: "Xây dựng" },
      { id: "market", label: "Thị trường" }
    ]
  },
  {
    id: "company",
    label: "Công ty",
    icon: "icon-company",
    pages: [
      { id: "overview", label: "Tổng quan tập đoàn" },
      { id: "companies", label: "Danh sách công ty" },
      { id: "finance", label: "Tài chính" },
      { id: "market", label: "Thị trường" }
    ]
  },
  {
    id: "life",
    label: "Cuộc sống CEO",
    icon: "icon-city",
    pages: [
      { id: "overview", label: "Tổng quan" },
      { id: "homes", label: "Nhà ở" },
      { id: "garage", label: "Garage" },
      { id: "decor", label: "Trang trí" },
      { id: "city", label: "Thành phố" },
      { id: "social", label: "Mạng xã hội" },
      { id: "friends", label: "Bạn bè" },
      { id: "journal", label: "Nhật ký" },
      { id: "shop", label: "Cửa hàng" }
    ]
  },
  {
    id: "inventory",
    label: "Túi đồ",
    icon: "icon-bag",
    pages: [
      { id: "all", label: "Tất cả vật phẩm" },
      { id: "equipment", label: "Trang bị" },
      { id: "materials", label: "Nguyên vật liệu" },
      { id: "documents", label: "Tài liệu và hợp đồng" }
    ]
  },
  {
    id: "shop",
    label: "Shop",
    icon: "icon-bag",
    pages: [
      { id: "overview", label: "Cửa hàng" }
    ]
  },
  {
    id: "employees",
    label: "Nhân viên",
    icon: "icon-users",
    pages: [
      { id: "directory", label: "Danh sách nhân viên" },
      { id: "hiring", label: "Tuyển dụng" },
      { id: "departments", label: "Phòng ban" },
      { id: "training", label: "Đào tạo" }
    ]
  },
  {
    id: "investment",
    label: "Đầu tư",
    icon: "icon-chart",
    pages: [
      { id: "market", label: "Thị trường" },
      { id: "portfolio", label: "Danh mục" },
      { id: "transactions", label: "Giao dịch" }
    ]
  },
  {
    id: "community",
    label: "Cộng đồng",
    icon: "icon-users",
    pages: [
      { id: "players", label: "Người chơi" },
      { id: "personal-ranking", label: "BXH tiền cá nhân" },
      { id: "company-ranking", label: "BXH tài chính công ty" },
      { id: "global-chat", label: "Chat tổng" },
      { id: "messages", label: "Tin nhắn riêng" }
    ]
  },
  {
    id: "account",
    label: "Tài khoản",
    icon: "icon-users",
    pages: [
      { id: "profile", label: "Đăng nhập và hồ sơ" },
      { id: "reports", label: "Báo cáo người chơi" }
    ]
  }
];

window.APX_NAV_AREAS = [
  {
    id: "personal",
    label: "Cá nhân",
    icon: "icon-grid",
    cards: [
      { section: "career", page: "current", label: "Công việc hiện tại", icon: "icon-users" },
      { section: "career", page: "jobs", label: "Tìm việc", icon: "icon-users" },
      { section: "character", page: "profile", label: "Hồ sơ cá nhân", icon: "icon-users" },
      { section: "character", page: "skills", label: "Kỹ năng", icon: "icon-chart" },
      { section: "character", page: "assets", label: "Tài sản", icon: "icon-coins" },
      { section: "character", page: "wardrobe", label: "Phòng thay đồ", icon: "icon-bag" }
    ]
  },
  {
    id: "business",
    label: "Kinh doanh",
    icon: "icon-company",
    cards: [
      { section: "company", page: "overview", label: "Công ty", icon: "icon-company" },
      { section: "company", page: "companies", label: "Danh sách công ty", icon: "icon-grid" },
      { section: "employees", page: "directory", label: "Nhân viên", icon: "icon-users" },
      { section: "employees", page: "hiring", label: "Tuyển dụng", icon: "icon-users" },
      { section: "employees", page: "departments", label: "Phòng ban", icon: "icon-grid" },
      { section: "employees", page: "training", label: "Đào tạo", icon: "icon-chart" },
      { section: "company", page: "finance", label: "Tài chính", icon: "icon-coins" },
      { section: "investment", page: "market", label: "Thị trường đầu tư", icon: "icon-chart" },
      { section: "investment", page: "portfolio", label: "Danh mục đầu tư", icon: "icon-coins" },
      { section: "investment", page: "transactions", label: "Giao dịch đầu tư", icon: "icon-chart" },
      { section: "company", page: "market", label: "Thị trường công ty", icon: "icon-chart" }
    ]
  },
  {
    id: "world",
    label: "Thế giới",
    icon: "icon-city",
    cards: [
      { section: "city", page: "map", label: "Bản đồ thành phố", icon: "icon-city" },
      { section: "city", page: "properties", label: "Bất động sản", icon: "icon-company" },
      { section: "city", page: "build", label: "Xây dựng", icon: "icon-grid" },
      { section: "city", page: "market", label: "Thị trường thành phố", icon: "icon-chart" },
      { section: "life", page: "city", label: "Thành phố đời sống", icon: "icon-city" },
      { section: "life", page: "journal", label: "Nhật ký", icon: "icon-chart" }
    ]
  },
  {
    id: "community",
    label: "Cộng đồng",
    icon: "icon-users",
    cards: [
      { section: "community", page: "players", label: "Người chơi", icon: "icon-users" },
      { section: "life", page: "friends", label: "Bạn bè", icon: "icon-users" },
      { section: "life", page: "social", label: "Mạng xã hội", icon: "icon-users" },
      { section: "community", page: "global-chat", label: "Chat tổng", icon: "icon-users" },
      { section: "community", page: "messages", label: "Tin nhắn riêng", icon: "icon-users" },
      { section: "community", page: "personal-ranking", label: "BXH tiền cá nhân", icon: "icon-chart" },
      { section: "community", page: "company-ranking", label: "BXH tài chính công ty", icon: "icon-chart" }
    ]
  },
  {
    id: "other",
    label: "Khác",
    icon: "menu",
    cards: [
      { section: "bank", page: "overview", label: "APXBank", icon: "icon-coins" },
      { action: "phone-open", label: "Điện thoại APX", icon: "icon-grid" },
      { section: "account", page: "profile", label: "Tài khoản", icon: "icon-users" },
      { section: "account", page: "reports", label: "Báo cáo người chơi", icon: "icon-close" },
      { section: "character", page: "achievements", label: "Thành tựu", icon: "icon-chart" },
      { section: "life", page: "overview", label: "Tổng quan đời sống", icon: "icon-city" },
      { section: "life", page: "homes", label: "Nhà ở", icon: "icon-company" },
      { section: "life", page: "garage", label: "Garage", icon: "icon-grid" },
      { section: "life", page: "decor", label: "Trang trí", icon: "icon-grid" },
      { section: "life", page: "shop", label: "Cửa hàng đời sống", icon: "icon-bag" },
      { section: "inventory", page: "all", label: "Tất cả vật phẩm", icon: "icon-bag" },
      { section: "inventory", page: "equipment", label: "Trang bị", icon: "icon-bag" },
      { section: "inventory", page: "materials", label: "Nguyên vật liệu", icon: "icon-bag" },
      { section: "inventory", page: "documents", label: "Tài liệu và hợp đồng", icon: "icon-bag" },
      { section: "shop", page: "overview", label: "Shop", icon: "icon-bag" }
    ]
  }
];

window.APX_NAV_UI = { areaId: null };

/*
  Hàm tìm một khu vực theo mã.
  Ví dụ: getSection("city") trả về dữ liệu điều hướng Thành phố.
*/
function apxFindSection(sectionId) {
  return window.APX_NAVIGATION.find(function (section) {
    return section.id === sectionId;
  });
}

/*
  Hàm tìm trang con theo mã khu vực và mã trang.
  Ví dụ: getPage("city", "build") trả về trang Xây dựng.
*/
function apxFindPage(sectionId, pageId) {
  var section = apxFindSection(sectionId);

  if (!section) {
    return null;
  }

  return section.pages.find(function (page) {
    return page.id === pageId;
  }) || null;
}

function apxFindNavLocation(sectionId, pageId) {
  for (var areaIndex = 0; areaIndex < window.APX_NAV_AREAS.length; areaIndex += 1) {
    var area = window.APX_NAV_AREAS[areaIndex];
    var card = area.cards.find(function (entry) {
      return entry.section === sectionId && entry.page === pageId;
    });
    if (card) {
      return { area: area, card: card };
    }
  }
  return null;
}

window.APXNav = {
  /*
    Lấy khu vực theo mã để các file khác có thể tra cứu.
  */
  getSection: function (sectionId) {
    return apxFindSection(sectionId);
  },

  /*
    Lấy trang con theo mã.
  */
  getPage: function (sectionId, pageId) {
    return apxFindPage(sectionId, pageId);
  },

  openArea: function (areaId) {
    var area = window.APX_NAV_AREAS.find(function (item) {
      return item.id === areaId;
    });
    if (!area) return;
    window.APX_NAV_UI.areaId = area.id;
    window.APXGame.render();
  },

  closeArea: function () {
    window.APX_NAV_UI.areaId = null;
    window.APXGame.render();
  },

  getActiveArea: function () {
    return window.APX_NAV_AREAS.find(function (area) {
      return area.id === window.APX_NAV_UI.areaId;
    }) || null;
  },

  renderArea: function (area) {
    return '<section class="nav-area-panel" role="dialog" aria-label="Mục ' + area.label + '"><header class="nav-area-panel-head"><h2>' + area.label + '</h2><button class="nav-area-close" type="button" data-action="nav-close" aria-label="Đóng bảng ' + area.label + '" title="Đóng"><svg class="icon" aria-hidden="true"><use href="#icon-close"></use></svg></button></header><div class="nav-area-grid">' +
      area.cards.map(function (card) {
        if (card.action === "phone-open") return '<button class="nav-area-card" type="button" data-action="phone-open"><svg class="icon" aria-hidden="true"><use href="#' + card.icon + '"></use></svg><span>' + card.label + '</span><b id="phoneBadge" class="nav-phone-badge" hidden>0</b><svg class="icon nav-area-arrow" aria-hidden="true"><use href="#icon-arrow"></use></svg></button>';
        var page = apxFindPage(card.section, card.page);
        if (!page || (page.adminOnly && !(window.APXAccount && window.APXAccount.isAdmin()))) return "";
        var gate = window.APXCareer && window.APXCareer.getGate(card.section, card.page, window.APXGame.state);
        var gateNote = gate ? '<small class="nav-area-lock-note">Mở ở cấp ' + gate.requiredLevel + '</small>' : '';
        return '<button class="nav-area-card' + (gate ? ' is-locked' : '') + '" type="button" data-action="page" data-section="' + card.section + '" data-page="' + card.page + '"' + (gate ? ' aria-label="' + card.label + ', khóa đến cấp ' + gate.requiredLevel + '"' : '') + '><svg class="icon" aria-hidden="true"><use href="#' + card.icon + '"></use></svg><span>' + card.label + gateNote + '</span>' + (gate ? '<span class="nav-area-lock" aria-hidden="true">🔒</span>' : '<svg class="icon nav-area-arrow" aria-hidden="true"><use href="#icon-arrow"></use></svg>') + '</button>';
      }).join("") +
      '</div></section>';
  },

  /*
    Chuẩn hóa đường dẫn đang lưu.
    Nếu đường dẫn bị thiếu hoặc không hợp lệ, quay về Hồ sơ nhân vật.
  */
  normalize: function () {
    var state = window.APXGame.state;

    if (!state.route || typeof state.route !== "object") {
      state.route = {
        section: "character",
        page: "profile"
      };
      return state.route;
    }

    var section = apxFindSection(state.route.section);

    if (!section) {
      state.route = {
        section: "character",
        page: "profile"
      };
      return state.route;
    }

    var page = apxFindPage(state.route.section, state.route.page);

    if (!page) {
      state.route.page = section.pages[0].id;
    }

    return state.route;
  },

  /*
    Chuyển khu vực hoặc trang con.
    Nếu không truyền pageId, mở trang con đầu tiên của khu vực đó.
  */
  go: function (sectionId, pageId) {
    var section = apxFindSection(sectionId);

    if (!section) {
      return;
    }

    var targetPage = pageId
      ? apxFindPage(sectionId, pageId)
      : section.pages[0];

    if (!targetPage) {
      targetPage = section.pages[0];
    }

    var gameState = window.APXGame && window.APXGame.state;
    if (sectionId === "bank" && gameState && (!gameState.route || gameState.route.section !== "bank")) {
      gameState.apxBank = gameState.apxBank || {};
      gameState.apxBank.returnRoute = gameState.route ? { section: gameState.route.section, page: gameState.route.page } : null;
    }

    window.APXGame.state.route = {
      section: section.id,
      page: targetPage.id
    };

    window.APX_NAV_UI.areaId = null;

    window.APXGame.save();
    window.APXGame.render();
  },

  /*
    Tạo menu khu vực chính, menu trang con và breadcrumb.
    Hàm này được main.js gọi mỗi lần đổi trang.
  */
  render: function () {
    var route = this.normalize();
    if (!apxFindSection(route.section)) {
      return;
    }

    var primaryNav = document.getElementById("primaryNav");
    var secondaryNav = document.getElementById("secondaryNav");
    var breadcrumb = document.getElementById("breadcrumb");
    var routeLocation = apxFindNavLocation(route.section, route.page);
    var selectedArea = window.APX_NAV_AREAS.find(function (area) {
      return area.id === window.APX_NAV_UI.areaId;
    }) || (routeLocation && routeLocation.area) || window.APX_NAV_AREAS[0];

    if (!primaryNav || !secondaryNav || !breadcrumb) {
      return;
    }

    primaryNav.innerHTML = window.APX_NAV_AREAS.map(function (area) {
      var isActive = area.id === selectedArea.id;
      var activeClass = isActive ? " active" : "";
      var pressed = isActive ? "true" : "false";
      var icon = area.icon === "menu"
        ? '<span class="nav-menu-icon" aria-hidden="true">☰</span>'
        : '<svg class="icon nav-icon" aria-hidden="true"><use href="#' + area.icon + '"></use></svg>';

      return (
        '<button class="nav-button' + activeClass + '"' +
          ' type="button"' +
          ' data-action="nav-category"' +
          ' data-area="' + area.id + '"' +
          ' aria-pressed="' + pressed + '"' +
          ' aria-label="Mở mục ' + area.label + '"' +
        '>' +
          icon +
          '<span class="nav-label">' + area.label + '</span>' +
        '</button>'
      );
    }).join("");

    secondaryNav.innerHTML = "";
    secondaryNav.parentElement.hidden = true;

    /*
      Dùng textContent để chỉ hiển thị đường dẫn,
      không chèn HTML do người dùng nhập vào.
    */
    var activePage = apxFindPage(route.section, route.page);

    var activeSection = apxFindSection(route.section);
    breadcrumb.textContent = window.APX_NAV_UI.areaId
      ? selectedArea.label
      : activePage
        ? activeSection.label + "  /  " + activePage.label
        : activeSection.label;
  }
};

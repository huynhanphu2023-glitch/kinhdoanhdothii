/* =========================================================
   APX BUSINESS WORLD — BỘ ĐIỀU KHIỂN CHÍNH
   Kết nối điều hướng, dữ liệu, các trang và thao tác game.
   ========================================================= */

(function () {
  var SAVE_KEY = "apx-business-world-save-v1";
  var RECOVERY_SAVE_KEY = SAVE_KEY + "-recovery";
  var realtimeClockStarted = false;
  var dayCloseInProgress = false;
  var lastDayCloseSyncAttemptAt = 0;
  var lastDayCloseSyncError = "";
  var GAME_DAY_DURATION_MS = 15 * 60 * 1000;
  var GAME_CLOCK_VERSION = 3;
  var localSaveBlocked = false;
  var localSaveWarning = "";
  var saveWarningShown = false;

  // Mốc kế tiếp luôn cách ngày hiện tại đúng 15 phút; game clock dùng chung toàn game.
  function nextGameDay(timestamp) {
    return (Number(timestamp) || Date.now()) + GAME_DAY_DURATION_MS;
  }

  function getGameClock(timestamp) {
    var now = Number(timestamp) || Date.now();
    var endAt = Number(state.nextDayAt) || (now + GAME_DAY_DURATION_MS);
    var startAt = Number(state.dayStartedAt) || (endAt - GAME_DAY_DURATION_MS);
    var progress = Math.max(0, Math.min(1, (now - startAt) / GAME_DAY_DURATION_MS));
    var totalMinutes = Math.min(1439, Math.floor(progress * 1440));
    return {
      day: Number(state.day) || 1,
      hour: Math.floor(totalMinutes / 60),
      minute: totalMinutes % 60,
      second: Math.floor((progress * 86400) % 60),
      progress: progress,
      now: now,
      dayStartedAt: startAt,
      nextDayAt: endAt,
      dayDurationMs: GAME_DAY_DURATION_MS
    };
  }

  /*
    Tạo bản sao mới từ trạng thái ban đầu.
    Nhờ vậy các lần chơi không dùng chung danh sách vật phẩm,
    dự án hoặc giao dịch.
  */
  function createFreshState() {
    var freshState = JSON.parse(JSON.stringify(window.APX_INITIAL_STATE));
    var now = Date.now();
    freshState.gameClockVersion = GAME_CLOCK_VERSION;
    freshState.dayStartedAt = now - GAME_DAY_DURATION_MS / 3;
    freshState.nextDayAt = now + GAME_DAY_DURATION_MS * 2 / 3;
    return freshState;
  }

  /*
    Đọc dữ liệu đã lưu trong trình duyệt.
    Nếu chưa có hoặc dữ liệu bị lỗi, dùng trạng thái ban đầu.
  */
  function loadState() {
    var freshState = createFreshState();
    var savedText;

    try {
      savedText = localStorage.getItem(SAVE_KEY);
    } catch (error) {
      localSaveBlocked = true;
      localSaveWarning = "Không thể đọc bản lưu cục bộ; game sẽ không ghi đè dữ liệu hiện có trong phiên này.";
      return freshState;
    }

    if (!savedText) return freshState;

    var savedState;
    try {
      savedState = JSON.parse(savedText);
    } catch (error) {
      try {
        if (localStorage.getItem(RECOVERY_SAVE_KEY)) {
          localSaveBlocked = true;
        } else {
          localStorage.setItem(RECOVERY_SAVE_KEY, savedText);
        }
        localSaveWarning = localSaveBlocked
          ? "Bản lưu cục bộ không đọc được và đã có bản khôi phục cũ; game sẽ không ghi đè dữ liệu."
          : "Bản lưu cục bộ không đọc được. Bản gốc đã được giữ lại để khôi phục; phiên mới chưa có tiến trình cũ.";
      } catch (backupError) {
        localSaveBlocked = true;
        localSaveWarning = "Bản lưu cục bộ không đọc được và không thể sao lưu an toàn; game sẽ không ghi đè dữ liệu.";
      }
      return freshState;
    }

    if (!savedState || typeof savedState !== "object" || Array.isArray(savedState)) {
      localSaveBlocked = true;
      localSaveWarning = "Bản lưu cục bộ có định dạng không hợp lệ; game sẽ không ghi đè dữ liệu.";
      return freshState;
    }

    if (!Object.prototype.hasOwnProperty.call(savedState, "nextDayAt")) {
      delete freshState.gameClockVersion;
      delete freshState.dayStartedAt;
      delete freshState.nextDayAt;
    }
    var restoredState = Object.assign(freshState, savedState);
    if (!Object.prototype.hasOwnProperty.call(savedState, "career") && restoredState.career) {
      restoredState.career.legacy = true;
      restoredState.career.version = 0;
    }
    return restoredState;
  }

  function showLocalSaveWarning() {
    if (!saveWarningShown && localSaveWarning) {
      saveWarningShown = true;
      toast(localSaveWarning, "warning");
    }
  }

  var state = loadState();

  /*
    Bổ sung các trường cần thiết nếu có bản lưu từ phiên bản cũ.
  */
  function prepareState() {
    if (!state.route || typeof state.route !== "object") {
      state.route = {
        section: "character",
        page: "profile"
      };
    }

    if (!Array.isArray(state.hired)) state.hired = [];
    if (!Array.isArray(state.buildings)) state.buildings = [];
    if (!Array.isArray(state.projects)) state.projects = [];
    if (!Array.isArray(state.ledger)) state.ledger = [];

    if (!state.inventory || typeof state.inventory !== "object") {
      state.inventory = {};
    }
    // Cấp một vé cho save cũ đúng một lần; số 0 sau khi dùng vẫn được giữ nguyên.
    if (!Object.prototype.hasOwnProperty.call(state.inventory, "revenue-ticket")) {
      state.inventory["revenue-ticket"] = state.businessOnboardingVersion >= 2 ? 0 : 1;
    }
    if (!Object.prototype.hasOwnProperty.call(state.inventory, "recruitment-ticket")) {
      state.inventory["recruitment-ticket"] = 0;
    }
    if (!Array.isArray(state.revenueTicketHistory)) state.revenueTicketHistory = [];

    if (typeof state.day !== "number") state.day = 1;
    if (typeof state.cash !== "number") state.cash = 1000000000;
    if (typeof state.treasury !== "number") state.treasury = 0;
    if (typeof state.networth !== "number") state.networth = Number(state.cash) || 0;

    if (typeof state.buildChoice !== "string") {
      state.buildChoice = "coffee";
    }

    if (typeof state.itemSearch !== "string") state.itemSearch = "";
    if (typeof state.employeeSearch !== "string") state.employeeSearch = "";

    if (typeof state.closedDays !== "number") state.closedDays = 0;
    if (Number(state.gameClockVersion) !== GAME_CLOCK_VERSION) {
      var savedBoundary = Number(state.nextDayAt);
      state.gameClockVersion = GAME_CLOCK_VERSION;
      if (Number.isFinite(savedBoundary) && savedBoundary > 0) {
        state.nextDayAt = savedBoundary;
        state.dayStartedAt = savedBoundary - GAME_DAY_DURATION_MS;
      } else {
        state.dayStartedAt = Date.now();
        state.nextDayAt = nextGameDay(state.dayStartedAt);
      }
    } else if (!Number.isFinite(Number(state.nextDayAt)) || Number(state.nextDayAt) <= 0) {
      state.dayStartedAt = Date.now();
      state.nextDayAt = nextGameDay(state.dayStartedAt);
    } else if (!Number.isFinite(Number(state.dayStartedAt)) || Number(state.dayStartedAt) <= 0) {
      state.dayStartedAt = Number(state.nextDayAt) - GAME_DAY_DURATION_MS;
    }
    if (typeof state.totalRevenue !== "number") state.totalRevenue = 0;
    if (typeof state.totalCosts !== "number") state.totalCosts = 0;
    if (typeof state.totalProfit !== "number") state.totalProfit = 0;
    if (!state.companyIdentity || typeof state.companyIdentity !== "object") state.companyIdentity = {};
    if (typeof state.companyIdentity.name !== "string" || !state.companyIdentity.name.trim()) state.companyIdentity.name = "Chưa thành lập";
    if (window.APXCareer) window.APXCareer.prepareState(state);
    if (window.APXQuest) window.APXQuest.ensureState(state);
  }

  prepareState();

  /*
    Escape nội dung trước khi chèn dữ liệu vào HTML.
    Các dữ liệu game hiện tại đều là dữ liệu cục bộ.
  */
  function escapeHTML(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, function (char) {
      var replacements = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
      };

      return replacements[char];
    });
  }

  /*
    Lưu trạng thái game và cập nhật số liệu trên thanh trên cùng.
  */
  function save(skipCloudSync) {
    if (window.APXBank) {
      window.APXBank.prepareState(state);
      window.APXBank.observeCash(state);
    }
    var accountSave = window.APXAccount && window.APXAccount.isLoggedIn && window.APXAccount.isLoggedIn();
    if (!accountSave) {
      if (localSaveBlocked) {
        showLocalSaveWarning();
        updateTopbar();
        return;
      }
      try {
        localStorage.setItem(SAVE_KEY, JSON.stringify(state));
      } catch (error) {
        if (!saveWarningShown) {
          saveWarningShown = true;
          toast("Không thể lưu tiến trình trên thiết bị này. Hãy kiểm tra dung lượng hoặc quyền lưu của trình duyệt.", "warning");
        }
        updateTopbar();
        return;
      }
    }

    updateTopbar();
    if (!skipCloudSync && window.APXAccount && window.APXAccount.queueSave) {
      window.APXAccount.queueSave(state);
    }
  }

  function updateTopbar() {
    var cash = document.getElementById("cashValue");
    var treasury = document.getElementById("treasuryValue");
    var day = document.getElementById("dayValue");
    var countdown = document.getElementById("dayCountdown");
    var gameTime = document.getElementById("gameTimeValue");
    var profile = state.character && state.character.profile;
    var playerName = profile && profile.customized ? profile.name : "Người chơi mới";
    var playerTitle = profile && profile.customized ? profile.title : "NGƯỜI CHƠI APX";
    var initials = profile && profile.customized ? profile.initials : "NV";
    var account = window.APXAccount;
    var loggedIn = Boolean(account && account.isLoggedIn && account.isLoggedIn());
    var saveLabel = document.querySelector(".save-message span:last-child");

    if (saveLabel) saveLabel.textContent = loggedIn
      ? "Tiến trình được lưu theo tài khoản của bạn"
      : "Tiến trình được lưu trên máy này";

    if (cash) {
      cash.textContent = window.APXUI.money(state.cash);
    }

    if (treasury) {
      treasury.textContent = window.APXUI.money(state.treasury);
    }

    if (day) {
      day.textContent = state.day;
    }

    if (gameTime) {
      var clock = getGameClock();
      gameTime.textContent = String(clock.hour).padStart(2, "0") + ":" + String(clock.minute).padStart(2, "0");
    }

    if (countdown) {
      var remaining = Math.max(0, Number(state.nextDayAt) - Date.now());
      var hours = Math.floor(remaining / 3600000);
      var minutes = Math.floor((remaining % 3600000) / 60000);
      var seconds = Math.floor((remaining % 60000) / 1000);
      countdown.textContent = "ĐỔI NGÀY SAU " +
        String(hours).padStart(2, "0") + ":" +
        String(minutes).padStart(2, "0") + ":" +
        String(seconds).padStart(2, "0");
    }

    var careerClockNodes = document.querySelectorAll("[data-career-clock]");
    if (careerClockNodes.length && state.career && state.career.activeJob && state.career.activeJob.gameplay) {
      var shiftSeconds = Math.max(0, Math.ceil((Number(state.career.activeJob.gameplay.deadlineAt) - Date.now()) / 1000));
      var shiftText = String(Math.floor(shiftSeconds / 60)).padStart(2, "0") + ":" + String(shiftSeconds % 60).padStart(2, "0");
      Array.prototype.forEach.call(careerClockNodes, function (node) { node.textContent = shiftText; });
    }

    Array.prototype.forEach.call(document.querySelectorAll(".page-owner, .player-copy strong, .current-player-copy strong"), function (element) {
      element.textContent = playerName;
    });
    Array.prototype.forEach.call(document.querySelectorAll(".player-copy small, .current-player-copy small"), function (element) {
      element.textContent = playerTitle.toLocaleUpperCase("vi-VN");
    });
    Array.prototype.forEach.call(document.querySelectorAll(".player-avatar, .current-player-avatar"), function (avatar) {
      if (avatar.querySelector("img")) {
        avatar.dataset.fallback = initials;
      } else {
        avatar.textContent = initials;
      }
    });
    updatePhysicalIndicators();
  }

  function updatePhysicalIndicators() {
    if (!window.APXCharacter || typeof window.APXCharacter.getPhysicalState !== "function") return;
    var physical = window.APXCharacter.getPhysicalState(state);
    if (!physical) return;
    Object.keys(physical).forEach(function (key) {
      var value = Math.max(0, Math.min(100, Number(physical[key]) || 0));
      Array.prototype.forEach.call(document.querySelectorAll('[data-physical-value="' + key + '"]'), function (node) {
        node.textContent = value;
      });
      Array.prototype.forEach.call(document.querySelectorAll('[data-physical-bar="' + key + '"]'), function (node) {
        node.style.width = value + "%";
        var progress = node.closest('[role="progressbar"]');
        if (progress) progress.setAttribute("aria-valuenow", value);
      });
    });
  }

  /*
    Hiển thị trang ứng với khu vực và trang con hiện tại.
  */
  function render() {
    var route = window.APXNav.normalize();
    var pageContent = document.getElementById("pageContent");

    if (!pageContent) {
      return;
    }

    if ((!window.APXAccount || !window.APXAccount.isLoggedIn()) && route.section !== "account") {
      state.route = { section: "account", page: "profile" };
      route = window.APXNav.normalize();
    }

    window.APXNav.render();

    var activeArea = window.APXNav.getActiveArea();
    var navigationPanelRoot = document.getElementById("navigationPanelRoot");
    if (navigationPanelRoot) {
      navigationPanelRoot.innerHTML = activeArea
        ? window.APXNav.renderArea(activeArea)
        : "";
    }

    var routeGate = window.APXCareer && window.APXCareer.getGate(route.section, route.page, state);
    var renderer = window.APXPages[route.section];

    if (routeGate) {
      pageContent.innerHTML = window.APXCareer.renderLocked(routeGate, state);
    } else if (typeof renderer === "function") {
      pageContent.innerHTML = renderer(route.page, state);
    } else {
      pageContent.innerHTML =
        '<section class="panel">' +
          "<h1>Trang đang được chuẩn bị</h1>" +
          "<p>Nội dung của khu vực này chưa sẵn sàng.</p>" +
        "</section>";
    }

    updateTopbar();
    if (window.APXCommunity && typeof window.APXCommunity.renderChatWidget === "function") {
      window.APXCommunity.renderChatWidget();
    }
  }

  /*
    Hiển thị thông báo ngắn.
    Dùng textContent để nội dung thông báo không bị hiểu thành HTML.
  */
  function toast(message, kind) {
    var root = document.getElementById("toastRoot");

    if (!root) {
      return;
    }

    var notice = document.createElement("div");
    notice.className = "toast" + (kind ? " " + kind : "");
    notice.setAttribute("role", "status");
    notice.textContent = message;

    root.appendChild(notice);

    window.setTimeout(function () {
      if (notice.parentNode) {
        notice.parentNode.removeChild(notice);
      }
    }, 3200);
  }

  /*
    Lấy tổng doanh thu tháng dự kiến từ công ty và dự án đang hoạt động.
  */
  function getMonthlyRevenue() {
    var companyRevenue = window.APXCompanies
      ? window.APXCompanies.getCompanies(state).reduce(function (sum, company) {
          return sum + (Number(company.revenue) || 0) * 30;
        }, 0)
      : 0;

    var projectRevenue = state.projects
      .filter(function (project) {
        return project.status === "Đang hoạt động";
      })
      .reduce(function (sum, project) {
        return sum + (Number(project.monthlyRevenue) || 0);
      }, 0);

    return companyRevenue + projectRevenue;
  }

  /*
    Tính lương tháng của nhân viên do người chơi tuyển thêm.
  */
  function getExtraMonthlyPayroll() {
    return state.hired.reduce(function (sum, candidateId) {
      var candidate = window.APX_DATA.candidates.find(function (person) {
        return person.id === candidateId;
      });

      return sum + (candidate ? Number(candidate.salary) || 0 : 0);
    }, 0);
  }

  /*
    Đóng sổ một ngày:
    - Ghi doanh thu và chi phí vào sổ.
    - Cập nhật ngân quỹ và tiền cá nhân.
    - Giảm thời gian xây dựng của dự án.
    - Chuyển sang ngày tiếp theo.
  */
  function closeDay(silent) {
    if (window.APXCharacter && typeof window.APXCharacter.updatePhysicalState === "function") {
      window.APXCharacter.updatePhysicalState(state, Date.now());
    }
    var closedDay = state.day;
    var companyResult = window.APXCompanies
      ? window.APXCompanies.closeAllCompanies(state)
      : { revenue: 0, cost: 0, profit: 0, companies: [] };
    var character = window.APXCharacter;
    var dailyRevenue = Number(companyResult.revenue) || 0;
    var dailyCost = Number(companyResult.cost) || 0;
    var dailyProfit = Number(companyResult.profit) || 0;
    var eligibleDividend = Math.min(
      Math.max(0, Number(state.treasury) || 0),
      Math.max(0, Math.round(dailyProfit * 0.08))
    );
    var cloudAccount = Boolean(window.APXAccount && window.APXAccount.isLoggedIn && window.APXAccount.isLoggedIn());
    var dividend = cloudAccount ? 0 : eligibleDividend;

    state.treasury -= dividend;
    state.cash += dividend;

    state.totalRevenue += dailyRevenue;
    state.totalCosts += dailyCost;
    state.totalProfit += dailyProfit;
    state.closedDays += 1;

    state.ledger.unshift({
      day: closedDay,
      revenue: dailyRevenue,
      cost: dailyCost,
      profit: dailyProfit,
      dividend: dividend,
      dividendHeld: cloudAccount ? eligibleDividend : 0,
      companies: companyResult.companies || []
    });

    // Chỉ lưu tối đa 30 giao dịch gần nhất.
    state.ledger = state.ledger.slice(0, 30);

    var completedProjects = [];

    state.projects.forEach(function (project) {
      if (project.status !== "Đang xây") {
        return;
      }

      project.daysLeft = Math.max(0, (Number(project.daysLeft) || 1) - 1);

      if (project.daysLeft === 0) {
        project.status = "Đang hoạt động";
        completedProjects.push(project.name);
      }
    });

    if (character) {
      character.onProjectsCompleted(state, completedProjects.length);
      character.onDayClosed(state, dailyProfit - dividend, dailyProfit);
    }

    if (window.APXCareer && typeof window.APXCareer.onGameDayClosed === "function") {
      window.APXCareer.onGameDayClosed(state, closedDay, { revenue: dailyRevenue, costs: dailyCost, profit: dailyProfit });
    }
    if (window.APXBank && typeof window.APXBank.onGameDayClosed === "function") {
      window.APXBank.onGameDayClosed(state, closedDay);
    }

    state.day += 1;
    state.nextDayAt = nextGameDay(state.nextDayAt);
    state.dayStartedAt = state.nextDayAt - GAME_DAY_DURATION_MS;
    save();
    if (!silent && window.APXBank && typeof window.APXBank.persistDayClose === "function") {
      window.APXBank.persistDayClose();
    }
    if (silent) return completedProjects;
    render();

    if (completedProjects.length) {
      toast(
        completedProjects.join(", ") +
        " đã hoàn thành và bắt đầu tạo doanh thu từ ngày kế tiếp."
      );
      return;
    }

    toast(
      "Đã khóa sổ ngày " + closedDay +
      ". Doanh thu " + window.APXUI.money(dailyRevenue) +
      ", lợi nhuận " + window.APXUI.money(dailyProfit) +
      ", cổ tức cá nhân " + window.APXUI.money(dividend) + "." +
      (cloudAccount && eligibleDividend > 0
        ? " " + window.APXUI.money(eligibleDividend) + " cổ tức được giữ lại trong ngân quỹ vì thanh toán cloud chưa được máy chủ xác nhận."
        : "")
    );
  }

  // Tự chốt những ngày đã trôi qua kể cả khi người chơi đóng trình duyệt.
  async function processElapsedGameDays() {
    if (dayCloseInProgress) return;
    var completedDays = 0;

    // Chỉ đọc bản lưu cục bộ cho khách; tiến trình đăng nhập thuộc riêng tài khoản cloud.
    var loggedInAccount = window.APXAccount && window.APXAccount.isLoggedIn && window.APXAccount.isLoggedIn();
    if (!loggedInAccount) {
      try {
        var latestSave = JSON.parse(localStorage.getItem(SAVE_KEY) || "null");
        if (latestSave && Number(latestSave.nextDayAt) > Number(state.nextDayAt)) {
          state = Object.assign(state, latestSave);
        }
      } catch (error) {
        // Tiếp tục bằng dữ liệu đang chạy nếu không đọc được bản lưu.
      }
    }

    if (Number(state.nextDayAt) > Date.now()) return;
    dayCloseInProgress = true;
    try {
      if (loggedInAccount) {
        if (!window.APXAccount.syncTransactions) {
          throw new Error("Không có dịch vụ đồng bộ giao dịch cloud.");
        }
        if (Date.now() - lastDayCloseSyncAttemptAt < 15000) return;
        lastDayCloseSyncAttemptAt = Date.now();
        await window.APXAccount.syncTransactions();
        lastDayCloseSyncError = "";
      }

      while (Number(state.nextDayAt) <= Date.now()) {
        closeDay(true);
        completedDays += 1;
      }
      if (completedDays) {
        save();
        if (window.APXBank && typeof window.APXBank.persistDayClose === "function") {
          window.APXBank.persistDayClose();
        }
        render();
        toast("Đã tự cập nhật " + completedDays + " ngày theo thời gian thực.");
      }
    } catch (error) {
      if (!loggedInAccount) throw error;
      var message = error && error.message ? error.message : "lỗi kết nối";
      if (message !== lastDayCloseSyncError) {
        toast("Chưa khóa sổ ngày vì chưa đồng bộ được doanh thu từ Supabase: " + message + ". Game sẽ thử lại.", "warning");
        lastDayCloseSyncError = message;
      }
    } finally {
      dayCloseInProgress = false;
    }
  }

  function startRealtimeClock() {
    if (realtimeClockStarted) return;
    realtimeClockStarted = true;
    processElapsedGameDays().then(function () {
      if (window.APXCharacter && typeof window.APXCharacter.updatePhysicalState === "function") {
        window.APXCharacter.updatePhysicalState(state, Date.now());
      }
      if (window.APXCareer && typeof window.APXCareer.startScheduler === "function") {
        window.APXCareer.startScheduler(state, Date.now());
      }
      save();
      updateTopbar();
    }).catch(function (error) {
      toast("Không thể khởi tạo đồng hồ game: " + (error && error.message ? error.message : "lỗi không xác định"), "warning");
    });
    window.setInterval(function () {
      var now = Date.now();
      if (Number(state.nextDayAt) <= now) {
        processElapsedGameDays();
      } else {
        if (window.APXPhone && typeof window.APXPhone.tick === "function") window.APXPhone.tick(now);
        if (window.APXCareer && typeof window.APXCareer.tick === "function") {
          var scheduled = window.APXCareer.tick(state, now);
          if (scheduled && scheduled.changed) {
            save();
            if (state.route && state.route.section === "career") render();
            if (scheduled.message) toast(scheduled.message);
          }
        }
        updateTopbar();
      }
      if (!dayCloseInProgress && window.APXCharacter && typeof window.APXCharacter.updatePhysicalState === "function" &&
          window.APXCharacter.updatePhysicalState(state, now)) {
        save();
      }
    }, 1000);
  }

  /*
    Khởi công dự án đang được chọn.
  */
  function buildProject() {
    var project = window.APX_DATA.projects.find(function (item) {
      return item.id === state.buildChoice;
    });

    if (!project) {
      toast("Không tìm thấy dự án đã chọn.", "warning");
      return;
    }

    var projectStart = window.APXCompanies
      ? window.APXCompanies.startProject(project, state)
      : { ok: false, message: "Hệ thống công ty chưa sẵn sàng." };
    if (!projectStart.ok) {
      toast(projectStart.message, "warning");
      return;
    }

    if (window.APXCharacter) window.APXCharacter.onProjectStarted(state);

    save();
    render();

    toast(projectStart.message + " Dự án cần " + (project.daysToBuild || 5) + " ngày trong game.");
  }

  /*
    Tuyển ứng viên và thêm vào trạng thái đã tuyển.
  */
  function hireCandidate(candidateId) {
    var offers = window.APXCompanies && window.APXCompanies.getRecruitmentOffers
      ? window.APXCompanies.getRecruitmentOffers(state)
      : [];
    var candidate = offers.find(function (person) { return person.id === candidateId; });
    if (!candidate) {
      toast("Ứng viên này không còn trong danh sách tuyển dụng hiện tại. Hãy chọn một ứng viên đang hiển thị.", "warning");
      return;
    }
    if (!window.APXCompanies || window.APXCompanies.getAvailableCandidates(state).every(function (person) {
      return person.id !== candidate.id;
    })) {
      toast("Đã chiêu mộ hết NPC hiện có trong danh sách.", "warning");
      return;
    }
    var employeeLimit = window.APXCompanies ? window.APXCompanies.getEmployeeLimit(state) : 0;
    if (!employeeLimit) {
      toast("Hãy thành lập công ty trước khi chiêu mộ nhân viên.", "warning");
      window.APXNav.go("company", "companies");
      return;
    }
    if (state.hired.length >= employeeLimit) {
      toast("Công ty đã đạt giới hạn nhân viên của cấp hiện tại.", "warning");
      return;
    }
    var recruitmentTickets = Number(state.inventory["recruitment-ticket"]) || 0;
    if (recruitmentTickets < 1) {
      toast("Bạn cần 1 vé tuyển dụng. Mua vé bằng tiền cá nhân hoặc nhập mã quà tặng.", "warning");
      return;
    }
    var destination = window.APXCompanies && window.APXCompanies.defaultCompanyForCandidate(candidate, state);
    if (!destination || !window.APXCompanies.assignHiredEmployee(state, candidate, destination)) {
      toast("Không tìm thấy chỗ trống ở công ty. Hãy nâng cấp quy mô hoặc thành lập thêm công ty.", "warning");
      return;
    }
    state.hired.push(candidate.id);
    state.inventory["recruitment-ticket"] = recruitmentTickets - 1;
    state.lastRecruited = candidate;
    if (window.APXCharacter) window.APXCharacter.onHire(state, candidate);
    save();
    render();

    toast(
      "Đã tuyển " + candidate.name +
      " với lương " + window.APXUI.money(candidate.salary) +
      " mỗi tháng. Lương sẽ được tính khi đóng sổ ngày."
    );
  }

  /*
    Xử lý nút mua thêm nguyên liệu trong túi đồ.
  */
  function useInventoryItem(itemId) {
    var item = window.APX_DATA.items.find(function (entry) {
      return entry.id === itemId;
    });

    if (!item) {
      toast("Không tìm thấy vật phẩm.", "warning");
      return;
    }

    if (itemId === "revenue-ticket") {
      var ticketCount = Number(state.inventory[itemId]) || 0;
      if (ticketCount < 1) {
        toast("Bạn đã dùng hết vé thu doanh thu.", "warning");
        return;
      }
      if (window.APXAccount && window.APXAccount.isLoggedIn && window.APXAccount.isLoggedIn()) {
        toast("Chưa thể đổi vé thành tiền cá nhân trên tài khoản cloud một cách an toàn. Vé và ngân quỹ chưa bị thay đổi.", "warning");
        return;
      }
      if (!window.APXCompanies) {
        toast("Chưa thể tính doanh thu doanh nghiệp.", "warning");
        return;
      }

      // Tính trên bản sao để không chạy chu kỳ vận hành, trừ chi phí,
      // giảm ngày dự án hoặc thay đổi các chỉ số của doanh nghiệp.
      var projectedProfit = window.APXCompanies.getCompanies(state).reduce(function (sum, company) {
        if (company.status !== "Đang hoạt động") return sum;
        var copy = JSON.parse(JSON.stringify(company));
        var revenue = window.APXCompanies.calculateCompanyRevenue(copy, state);
        var costs = window.APXCompanies.calculateCompanyCosts(copy, state, revenue);
        return sum + Number(revenue) - Number(costs.total);
      }, 0);
      var dividend = Math.min(
        Math.max(0, Number(state.treasury) || 0),
        Math.max(0, Math.round(projectedProfit * 0.08))
      );
      if (dividend <= 0) {
        toast("Hiện chưa có lợi nhuận dự kiến để vé quy đổi thành cổ tức. Vé chưa bị tiêu hao.", "warning");
        return;
      }

      state.inventory[itemId] = ticketCount - 1;
      state.treasury -= dividend;
      state.cash += dividend;
      state.revenueTicketHistory.unshift({
        day: Number(state.day) || 1,
        amount: dividend,
        projectedProfit: Math.round(projectedProfit),
        usedAt: new Date().toISOString()
      });
      state.revenueTicketHistory = state.revenueTicketHistory.slice(0, 30);
      save();
      render();
      toast("Đã dùng vé và nhận " + window.APXUI.money(dividend) + " cổ tức. Ngày và đồng hồ game không thay đổi.");
      return;
    }

    if (item.type !== "Nguyên liệu" || item.price <= 0) {
      toast("Thao tác sử dụng vật phẩm này chưa được triển khai.");
      return;
    }

    if (state.cash < item.price) {
      toast(
        "Tiền cá nhân chưa đủ. Cần " +
        window.APXUI.money(item.price) + ".",
        "warning"
      );
      return;
    }

    state.cash -= item.price;
    state.inventory[item.id] = (Number(state.inventory[item.id]) || 0) + 1;

    if (window.APXCharacter) window.APXCharacter.addCharacterXP(5, "Mua nguyên liệu");

    save();
    render();

    toast("Đã mua thêm 1 " + item.name + ".");
  }

  async function redeemTicketCode(form) {
    var account = window.APXAccount;
    var code = String(form.elements.code.value || "").trim();
    if (!account || !account.isConfigured() || !account.isLoggedIn()) {
      toast("Hãy đăng nhập tài khoản đã kết nối Supabase để đổi mã.", "warning");
      return;
    }
    if (!code) {
      toast("Nhập mã quà tặng trước khi đổi.", "warning");
      return;
    }
    var button = form.querySelector('button[type="submit"]');
    if (button) button.disabled = true;
    try {
      var db = await account.getSupabaseClient();
      var result = await db.rpc("apx_redeem_voucher", { p_code: code });
      if (result.error) throw result.error;
      var response = result.data || {};
      if (response.reward_type === "cash") {
        state.cash = Number(response.cash) || 0;
      } else {
        state.inventory["recruitment-ticket"] = Number(response.ticket_count) || 0;
      }
      save();
      form.reset();
      render();
      toast(response.reward_type === "cash"
        ? "Đổi mã thành công! Bạn nhận thêm " + window.APXUI.money(response.granted_cash) + "."
        : "Đổi mã thành công! Bạn nhận thêm " + Number(response.granted || 1) + " vé.");
    } catch (error) {
      toast(error.message || "Không đổi được mã. Hãy kiểm tra lại mã và kết nối.", "warning");
    } finally {
      if (button && button.isConnected) button.disabled = false;
    }
  }

  /*
    Mở cửa sổ thông tin công trình trên bản đồ.
  */
  function showBuilding(buildingId) {
    var building = window.APX_DATA.buildings.find(function (item) {
      return item.id === buildingId;
    });

    if (!building) {
      toast("Không tìm thấy thông tin công trình.", "warning");
      return;
    }

    var root = document.getElementById("modalRoot");

    if (!root) {
      return;
    }

    var personalOwnership = !building.owned && state.buildings.includes(building.id);
    var companyOwnerId = (state.companyBuildingOwnership || {})[building.id];
    var companyOwner = companyOwnerId && window.APXCompanies
      ? window.APXCompanies.getCompanyById(companyOwnerId, state)
      : null;
    var propertyRecord = personalOwnership && state.character && state.character.propertyRecords
      ? state.character.propertyRecords[building.id] || {}
      : {};
    var ownerName = companyOwner
      ? companyOwner.name
      : personalOwnership
      ? ((state.character && state.character.profile && state.character.profile.customized && state.character.profile.name) || "Người chơi mới")
      : building.owner;
    var currentValue = Number(propertyRecord.currentValue) || Number(building.value) || 0;
    var propertyAction = "";
    if (companyOwner) {
      propertyAction = '<p class="character-empty-note">Tài sản này thuộc ngân quỹ và hồ sơ của công ty.</p>';
    } else if (personalOwnership) {
      propertyAction = '<button class="button" type="button" data-action="sell-building" data-id="' + building.id + '">Bán tài sản</button>';
    } else if (!building.owned && building.status === "Mở bán") {
      propertyAction = '<button class="button button-gold" type="button" data-action="buy-building" data-id="' + building.id + '">Mua bằng tiền cá nhân</button>';
    }

    root.innerHTML =
      '<div class="modal-backdrop" data-action="close-modal">' +
        '<article class="modal" role="dialog" aria-modal="true" aria-labelledby="buildingModalTitle">' +
          '<span class="eyebrow">' + escapeHTML(building.type) + "</span>" +
          '<h2 id="buildingModalTitle">' + escapeHTML(building.name) + "</h2>" +
          '<div class="data-row"><span>Khu vực</span><strong>' +
            escapeHTML(building.district) + "</strong></div>" +
          '<div class="data-row"><span>Chủ sở hữu</span><strong>' +
            escapeHTML(ownerName) + "</strong></div>" +
          '<div class="data-row"><span>Trạng thái</span><strong>' +
            escapeHTML(companyOwner ? "Tài sản công ty" : (personalOwnership ? "Đang sở hữu cá nhân" : building.status)) + "</strong></div>" +
          '<div class="data-row"><span>Giá trị ước tính</span><strong>' +
            window.APXUI.money(currentValue) + "</strong></div>" +
          "<p>" + escapeHTML(building.detail) + "</p>" +
          propertyAction +
          '<button class="button button-gold" type="button" data-action="close-modal">Đóng</button>' +
        "</article>" +
      "</div>";
  }

  function closeModal() {
    var root = document.getElementById("modalRoot");

    if (root) {
      root.innerHTML = "";
    }
  }

  function submitPlayerProfile(form) {
    var name = String(form.elements.playerName.value || "").trim().replace(/\s+/g, " ");
    var title = String(form.elements.playerTitle.value || "").trim().replace(/\s+/g, " ");
    var age = Number(form.elements.playerAge.value);
    var location = String(form.elements.playerLocation.value || "").trim().replace(/\s+/g, " ");
    var bio = String(form.elements.playerBio.value || "").trim();

    if (name.length < 2 || name.length > 30 || !title || !location || !Number.isInteger(age) || age < 18 || age > 100) {
      toast("Kiểm tra tên, chức danh, tuổi từ 18 đến 100 và nơi ở rồi lưu lại nhé.", "warning");
      return;
    }

    if (window.APXCharacter) window.APXCharacter.prepareState(state);
    var profile = state.character.profile;
    var isFirstProfile = !profile.customized;
    var nameParts = name.split(" ");

    profile.name = name;
    profile.initials = nameParts.slice(-2).map(function (part) { return part.charAt(0); }).join("").toLocaleUpperCase("vi-VN");
    profile.title = title;
    profile.socialRank = title;
    profile.age = age;
    profile.location = location;
    profile.bio = bio;
    profile.customized = true;
    profile.editing = false;
    if (isFirstProfile) profile.startedAt = new Date().toISOString();

    // Giữ các module cũ tương thích với hồ sơ vừa chỉnh sửa.
    if (window.APX_DATA && window.APX_DATA.player) {
      Object.assign(window.APX_DATA.player, {
        name: name,
        initials: profile.initials,
        title: title,
        bio: bio,
        age: age,
        location: location
      });
    }

    save();
    render();
    toast(isFirstProfile ? "Đã tạo nhân vật " + name + "." : "Đã cập nhật thông tin nhân vật.");
  }

  /*
    Xử lý mọi nút có data-action.
    Việc dùng một bộ xử lý chung giúp các trang có thể được tạo lại
    mà không phải gắn sự kiện riêng cho từng nút.
  */
  function handleAction(button) {
    var action = button.dataset.action;

    switch (action) {
      case "section":
        window.APXNav.go(button.dataset.section);
        break;

      case "page":
        window.APXNav.go(button.dataset.section || state.route.section, button.dataset.page);
        break;

      case "nav-category":
        window.APXNav.openArea(button.dataset.area);
        break;

      case "nav-close":
        window.APXNav.closeArea();
        break;

      case "phone-open":
        if (window.APXPhone) window.APXPhone.open();
        window.APXNav.closeArea();
        break;

      case "phone-open-app":
        if (window.APXPhone) {
          window.APXPhone.open();
          window.APXPhone.openApp(button.dataset.phoneApp);
        }
        window.APXNav.closeArea();
        break;

      case "navigate":
        window.APXNav.go(button.dataset.section);
        break;

      case "advance-day":
        toast("Ngày game đồng bộ theo mốc 15 phút chung của hệ thống.", "warning");
        break;

      case "edit-profile":
        if (state.character && state.character.profile) {
          state.character.profile.editing = true;
          save();
          render();
        }
        break;

      case "cancel-profile-edit":
        if (state.character && state.character.profile && state.character.profile.customized) {
          state.character.profile.editing = false;
          save();
          render();
        }
        break;

      case "choose-project":
        state.buildChoice = button.dataset.id;
        save();
        render();
        break;

      case "build-project":
        buildProject();
        break;

      case "hire":
      case "hire-candidate":
        hireCandidate(button.dataset.id);
        break;

      case "buy-recruitment-ticket": {
        if (!window.APXCompanies || !window.APXCompanies.getCompanies(state).length) {
          toast("Hãy thành lập công ty trước khi mua vé tuyển dụng.", "warning");
          break;
        }
        var ticketDefinition = window.APX_DATA.items.find(function (item) { return item.id === "recruitment-ticket"; });
        var ticketPrice = Number(ticketDefinition && ticketDefinition.price);
        if (!Number.isSafeInteger(ticketPrice) || ticketPrice <= 0) {
          toast("Giá vé tuyển dụng chưa được cấu hình hợp lệ.", "warning");
          break;
        }
        if ((Number(state.cash) || 0) < ticketPrice) {
          toast("Bạn cần " + window.APXUI.money(ticketPrice) + " để mua 1 vé tuyển dụng.", "warning");
          break;
        }
        state.cash -= ticketPrice;
        state.inventory["recruitment-ticket"] = (Number(state.inventory["recruitment-ticket"]) || 0) + 1;
        save();
        render();
        toast("Đã mua 1 vé tuyển dụng với giá " + window.APXUI.money(ticketPrice) + ".");
        break;
      }

      case "company-upgrade": {
        var companyUpgrade = window.APXCompanies.upgradeCompany(button.dataset.id, state);
        toast(companyUpgrade.message, companyUpgrade.ok ? undefined : "warning");
        break;
      }

      case "open-company":
        if (window.APXCompanies && window.APXCompanies.getCompanyById(button.dataset.id)) {
          state.companyManager = { companyId: button.dataset.id, tab: "overview" };
          window.APXNav.go("company", "companies");
        }
        break;

      case "company-list":
        state.companyManager = { companyId: null, tab: "overview" };
        save(); render();
        break;

      case "company-manager-tab":
        if (state.companyManager) state.companyManager.tab = button.dataset.tab || "overview";
        save(); render();
        break;

      case "company-upgrade-branch": {
        var upgradeCompany = window.APXCompanies.getCompanyById(button.dataset.company, state);
        var upgradeBranch = upgradeCompany && upgradeCompany.branches.find(function (item) { return item.id === button.dataset.id; });
        var branchPrice = 180000000 * Math.max(1, Number(upgradeBranch && upgradeBranch.level) || 1);
        if (!window.confirm("Nâng cấp chi nhánh sẽ dùng " + window.APXUI.money(branchPrice) + " từ tiền công ty. Tiếp tục?")) break;
        var branchUpgrade = window.APXCompanies.upgradeBranch(button.dataset.company, button.dataset.id, state);
        toast(branchUpgrade.message, branchUpgrade.ok ? undefined : "warning");
        break;
      }

      case "company-close-branch": {
        if (!window.confirm("Đóng chi nhánh này? Nhân viên phải được điều chuyển trước.")) break;
        var branchClose = window.APXCompanies.closeBranch(button.dataset.company, button.dataset.id, state);
        toast(branchClose.message, branchClose.ok ? undefined : "warning");
        if (branchClose.ok) render();
        break;
      }

      case "company-toggle-product": {
        var productToggle = window.APXCompanies.updateProduct(button.dataset.company, button.dataset.id, { toggle: true }, state);
        toast(productToggle.message, productToggle.ok ? undefined : "warning");
        if (productToggle.ok) render();
        break;
      }

      case "company-upgrade-product": {
        var productUpgrade = window.APXCompanies.updateProduct(button.dataset.company, button.dataset.id, { upgrade: true }, state);
        toast(productUpgrade.message, productUpgrade.ok ? undefined : "warning");
        if (productUpgrade.ok) render();
        break;
      }

      case "company-run-marketing": {
        var campaign = window.APXCompanies.getCampaignDefinitions().find(function (item) { return item.id === button.dataset.id; });
        if (campaign && !window.confirm("Chiến dịch " + campaign.name + " tốn " + window.APXUI.money(campaign.cost) + " từ ngân quỹ công ty. Chạy chiến dịch?")) break;
        var marketing = window.APXCompanies.runMarketing(button.dataset.company, button.dataset.id, state);
        toast(marketing.message, marketing.ok ? undefined : "warning");
        if (marketing.ok) render();
        break;
      }

      case "company-adjust-salary": {
        var salaryChange = window.APXCompanies.adjustSalary(button.dataset.id, Number(button.dataset.delta), state);
        toast(salaryChange.message, salaryChange.ok ? undefined : "warning");
        if (salaryChange.ok) render();
        break;
      }

      case "company-buy-asset": {
        var building = window.APX_DATA.buildings.find(function (item) { return item.id === button.dataset.id; });
        if (building && !window.confirm("Mua " + building.name + " với giá " + window.APXUI.money(building.value) + " từ tiền mặt công ty?")) break;
        var companyAsset = window.APXCompanies.buyMarketAsset(button.dataset.company, button.dataset.id, state);
        toast(companyAsset.message, companyAsset.ok ? undefined : "warning");
        if (companyAsset.ok) render();
        break;
      }

      case "company-event": {
        var eventResult = window.APXCompanies.resolveBusinessEvent(button.dataset.id, state);
        toast(eventResult.message, eventResult.ok ? undefined : "warning");
        if (eventResult.ok) render();
        break;
      }

      case "buy-building": {
        var purchase = window.APXCharacter && window.APXCharacter.purchaseCityProperty(button.dataset.id);
        if (purchase) {
          toast(purchase.message, purchase.ok ? undefined : "warning");
          if (purchase.ok) { closeModal(); save(); render(); }
        }
        break;
      }

      case "sell-building": {
        var sale = window.APXCharacter && window.APXCharacter.sellCityProperty(button.dataset.id);
        if (sale) {
          toast(sale.message, sale.ok ? undefined : "warning");
          if (sale.ok) { closeModal(); save(); render(); }
        }
        break;
      }

      case "train-skill": {
        var training = window.APXCharacter && window.APXCharacter.trainSkill(button.dataset.id);
        if (training) {
          toast(training.message, training.ok ? undefined : "warning");
          if (training.ok) { save(); render(); }
        }
        break;
      }

      case "use-item":
        useInventoryItem(button.dataset.id);
        break;

      case "building":
        showBuilding(button.dataset.id);
        break;

      case "close-modal":
        closeModal();
        break;

      default:
        break;
    }
  }

  /*
    Gõ tìm kiếm: lưu từ khóa, dựng lại danh sách,
    rồi đưa con trỏ về đúng vị trí cũ.
  */
  function handleSearchInput(event) {
    var input = event.target;
    var inputId = input.id;

    if (inputId !== "itemSearch" && inputId !== "employeeSearch") {
      return;
    }

    var cursorStart = input.selectionStart;
    var cursorEnd = input.selectionEnd;

    if (inputId === "itemSearch") {
      state.itemSearch = input.value;
    } else {
      state.employeeSearch = input.value;
    }

    save();
    render();

    var updatedInput = document.getElementById(inputId);

    if (updatedInput) {
      updatedInput.focus();

      try {
        updatedInput.setSelectionRange(cursorStart, cursorEnd);
      } catch (error) {
        // Một số trình duyệt không hỗ trợ đặt con trỏ cho ô tìm kiếm.
      }
    }
  }

  /*
    Bấm Escape để đóng cửa sổ thông tin nếu đang mở.
  */
  function handleKeyboard(event) {
    if (event.key === "Escape") {
      closeModal();
    }
  }

  /*
    Gắn sự kiện toàn trang.
    Dùng ủy quyền sự kiện để các nút vẫn hoạt động sau khi đổi trang.
  */
  document.addEventListener("click", function (event) {
    var button = event.target.closest("[data-action]");

    if (!button) {
      return;
    }

    // Không để liên kết logo nhảy lên đầu trang.
    if (button.tagName === "A") {
      event.preventDefault();
    }

    // Bấm vào phần bên trong cửa sổ không làm cửa sổ tự đóng.
    if (
      button.classList.contains("modal-backdrop") &&
      event.target.closest(".modal")
    ) {
      return;
    }

    handleAction(button);
  });

  document.addEventListener("input", handleSearchInput);
  document.addEventListener("keydown", handleKeyboard);
  document.addEventListener("submit", function (event) {
    var form = event.target;
    if (!form) return;
    if (form.id === "redeemTicketCodeForm") {
      event.preventDefault(); redeemTicketCode(form); return;
    }
    if (form.id === "playerProfileForm") {
      event.preventDefault(); submitPlayerProfile(form); return;
    }
    if (form.id === "companyIdentityForm") {
      event.preventDefault();
      var groupName = String(form.elements.companyName.value || "").trim().replace(/\s+/g, " ");
      if (groupName.length < 2 || groupName.length > 36) {
        toast("Tên công ty cần từ 2 đến 36 ký tự.", "warning"); return;
      }
      state.companyIdentity.name = groupName;
      if (state.character && state.character.profile && state.character.profile.title === "Nhà sáng lập APX Group") {
        state.character.profile.title = "Nhà sáng lập " + groupName;
      }
      save(); render();
      toast("Đã lưu tên công ty riêng của bạn.");
      return;
    }
    if (form.id === "employeeTrainingForm") {
      event.preventDefault();
      var trainingResult = window.APXCompanies.trainEmployee(
        form.elements.employeeId.value,
        form.elements.courseId.value,
        state
      );
      toast(trainingResult.message, trainingResult.ok ? undefined : "warning");
      return;
    }

    if (form.id === "companyCreateForm") {
      event.preventDefault();
      var careerGate = window.APXCareer && window.APXCareer.canFoundCompany(state);
      if (careerGate && !careerGate.ok) {
        toast("Chưa thể thành lập công ty. " + careerGate.message, "warning");
        window.APXNav.go("career", "jobs");
        return;
      }
      var companyResult = window.APXCompanies.createCompany({ name: form.elements.name.value, industry: form.elements.industry.value, capitalPackage: form.elements.capitalPackage.value }, state);
      toast(companyResult.message, companyResult.ok ? undefined : "warning");
      if (companyResult.ok) render();
      return;
    }
    if (form.id === "companyProfileForm") {
      event.preventDefault();
      var companyProfileResult = window.APXCompanies.updateCompanyProfile(form.elements.companyId.value, { name: form.elements.name.value, industry: form.elements.industry.value }, state);
      toast(companyProfileResult.message, companyProfileResult.ok ? undefined : "warning");
      if (companyProfileResult.ok) render();
      return;
    }
    if (form.id === "companyOpenBranchForm") {
      event.preventDefault();
      var branchCompany = window.APXCompanies.getCompanyById(form.elements.companyId.value);
      var branchCost = branchCompany && (branchCompany.id === "coffee" ? 720000000 : branchCompany.id === "tech" ? 1150000000 : 980000000);
      if (!branchCompany || !window.confirm("Mở chi nhánh mới với chi phí " + window.APXUI.money(branchCost) + " từ tiền công ty?")) return;
      var branchResult = window.APXCompanies.openBranch(form.elements.companyId.value, { name: form.elements.name.value, location: form.elements.location.value }, state);
      toast(branchResult.message, branchResult.ok ? undefined : "warning"); if (branchResult.ok) render(); return;
    }
    if (form.id === "companyCreateProductForm") {
      event.preventDefault();
      var productCompany = window.APXCompanies.getCompanyById(form.elements.companyId.value);
      var researchCost = productCompany && productCompany.id === "tech" ? 90000000 : 55000000;
      if (!productCompany || !window.confirm("Phát triển sản phẩm cần " + window.APXUI.money(researchCost) + " từ tiền công ty. Tiếp tục?")) return;
      var createResult = window.APXCompanies.createProduct(form.elements.companyId.value, { name: form.elements.name.value, price: form.elements.price.value }, state);
      toast(createResult.message, createResult.ok ? undefined : "warning"); if (createResult.ok) render(); return;
    }
    if (form.dataset.companyForm === "product-price") {
      event.preventDefault();
      var priceResult = window.APXCompanies.updateProduct(form.elements.companyId.value, form.elements.productId.value, { price: form.elements.price.value }, state);
      toast(priceResult.message, priceResult.ok ? undefined : "warning"); if (priceResult.ok) render(); return;
    }
    if (form.id === "companyInventoryForm") {
      event.preventDefault();
      var inventoryCompany = window.APXCompanies.getCompanyById(form.elements.companyId.value);
      var inventoryCost = inventoryCompany && Number(form.elements.quantity.value) * inventoryCompany.inventory.unitCost;
      if (!inventoryCompany || !window.confirm("Nhập kho sẽ dùng " + window.APXUI.money(inventoryCost) + " từ tiền công ty. Tiếp tục?")) return;
      var stockResult = window.APXCompanies.buyInventory(form.elements.companyId.value, form.elements.quantity.value, state);
      toast(stockResult.message, stockResult.ok ? undefined : "warning"); if (stockResult.ok) render(); return;
    }
    if (form.id === "companyTransferForm") {
      event.preventDefault();
      var transferResult = window.APXCompanies.transferCash(form.elements.companyId.value, form.elements.amount.value, form.elements.direction.value, state);
      toast(transferResult.message, transferResult.ok ? undefined : "warning"); if (transferResult.ok) render();
    }
  });
  document.addEventListener("change", function (event) {
    var select = event.target;
    if (select && select.name === "capitalPackage" && select.form && select.form.id === "companyCreateForm") {
      var selectedPackage = select.options[select.selectedIndex];
      var totalLabel = document.getElementById("companyStartupTotal");
      var feeLabel = document.getElementById("companyStartupFee");
      var capitalLabel = document.getElementById("companyStartupCapital");
      if (selectedPackage && totalLabel) totalLabel.textContent = window.APXUI.money(Number(selectedPackage.dataset.total) || 0);
      if (selectedPackage && feeLabel) feeLabel.textContent = window.APXUI.money(Number(selectedPackage.dataset.fee) || 0);
      if (selectedPackage && capitalLabel) capitalLabel.textContent = window.APXUI.money(Number(selectedPackage.dataset.capital) || 0);
      var submitButton = select.form.querySelector('button[type="submit"]');
      if (submitButton) submitButton.disabled = Number(selectedPackage && selectedPackage.dataset.total) > Number(select.form.dataset.cash);
      return;
    }
    if (!select || select.dataset.change !== "move-company-employee") return;
    var destination = String(select.value || "").split("|");
    var moveResult = window.APXCompanies.moveEmployee(select.dataset.id, destination[0], destination[1], state);
    toast(moveResult.message, moveResult.ok ? undefined : "warning");
  });

  /*
    Công khai một số hàm để navigation.js gọi.
  */
  window.APXGame = {
    get state() {
      return state;
    },

    save: save,
    render: render,
    toast: toast,
    getGameClock: getGameClock,
    startRealtimeClock: startRealtimeClock,
    loadCloudState: function (cloudState) {
      if (!cloudState || typeof cloudState !== "object" || Array.isArray(cloudState)) {
        throw new Error("Bản lưu tài khoản không hợp lệ.");
      }
      var needsClockMigration = Number(cloudState.gameClockVersion) !== GAME_CLOCK_VERSION;
      state = Object.assign(createFreshState(), cloudState);
      if (!Object.prototype.hasOwnProperty.call(cloudState, "career") && state.career) {
        state.career.legacy = true;
        state.career.version = 0;
      }
      prepareState();
      if (window.APXCharacter) window.APXCharacter.prepareState(state);
      if (window.APXCompanies) window.APXCompanies.ensureState(state);
      save(!needsClockMigration);
      render();
      if (window.APXAccount && window.APXAccount.isLoggedIn()) startRealtimeClock();
    },
    createAccountState: function (profile) {
      state = createFreshState();
      prepareState();
      if (window.APXCharacter) window.APXCharacter.prepareState(state);
      if (window.APXCompanies) window.APXCompanies.ensureState(state);
      state.character.profile.customized = true;
      state.character.profile.name = profile.display_name;
      state.character.profile.initials = profile.display_name.trim().split(/\s+/).slice(-2).map(function (part) { return part.charAt(0); }).join("").toLocaleUpperCase("vi-VN");
      state.character.profile.characterId = profile.character_id;
      state.character.profile.avatar = profile.avatar_url || "";
      save(true);
      render();
      if (window.APXAccount && window.APXAccount.isLoggedIn()) startRealtimeClock();
    },
    startGuestState: function () {
      state = createFreshState();
      state.route = { section: "account", page: "profile" };
      prepareState();
      if (window.APXCharacter) window.APXCharacter.prepareState(state);
      if (window.APXCompanies) window.APXCompanies.ensureState(state);
      render();
    }
  };

  // Mở trang mặc định sau khi DOM và tất cả module đã tải xong.
 function initGame() {
  if (!window.APXAccount || !window.APXAccount.isLoggedIn()) {
    state.route = { section: "account", page: "profile" };
    render();
     showLocalSaveWarning();
     return;
   }
  if (window.APXAccount.isLoggedIn()) {
    if (window.APXGame && window.APXGame.startRealtimeClock) window.APXGame.startRealtimeClock();
    render();
    showLocalSaveWarning();
    return;
  }

  window.APXNav.go("account");
}
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initGame, { once: true });
  } else {
    initGame();
  }
})();

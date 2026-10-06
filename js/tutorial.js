/* First-job tutorial; progress lives in the normal player save. */
(function () {
  "use strict";

  var ROOT_ID = "apxTutorialRoot";
  var STATE_KEY = "newPlayerTutorial";
  var root = document.getElementById(ROOT_ID);

  function gameState() {
    return window.APXGame && window.APXGame.state;
  }

  function tutorialState() {
    var state = gameState();
    return state && state[STATE_KEY];
  }

  function saveAndRender() {
    if (!window.APXGame) return;
    window.APXGame.save();
    window.APXGame.render();
  }

  function routeIs(section, page) {
    var state = gameState();
    return Boolean(state && state.route && state.route.section === section && (!page || state.route.page === page));
  }

  function initialize() {
    if (!root || !window.APXAccount || !window.APXAccount.isLoggedIn()) return;
    var state = gameState();
    if (!state) return;
    if (!state[STATE_KEY]) {
      var career = state.career || {};
      var employment = career.employment || {};
      var completedShifts = Number(career.completedWorkShifts || career.completedJobs) || 0;
      var alreadyWorking = Boolean(employment.current || career.activeJob);
      var priorSignedJob = Array.isArray(employment.history) && employment.history.some(function (event) {
        return event.type === "signed";
      });
      state[STATE_KEY] = completedShifts > 0
        ? { version: 1, phase: "complete", foundJobBoard: true, selectedJob: true, acceptedJob: true, firstShiftCompleted: true, guidanceHidden: true }
        : employment.pending
          ? { version: 1, phase: "review", foundJobBoard: true, selectedJob: true, acceptedJob: false, firstShiftCompleted: false, guidanceHidden: false }
          : alreadyWorking || priorSignedJob
            ? { version: 1, phase: "employed", foundJobBoard: true, selectedJob: true, acceptedJob: true, firstShiftCompleted: false, guidanceHidden: false }
            : { version: 1, phase: "welcome", foundJobBoard: false, selectedJob: false, acceptedJob: false, firstShiftCompleted: false, guidanceHidden: false };
      window.APXGame.save();
    }
    render();
  }

  function addHighlight(selector) {
    document.querySelectorAll(".apx-tutorial-target").forEach(function (element) {
      element.classList.remove("apx-tutorial-target");
    });
    if (!selector) return;
    var target = document.querySelector(selector);
    if (target) target.classList.add("apx-tutorial-target");
  }

  function render() {
    if (!root) return;
    if (!window.APXAccount || !window.APXAccount.isLoggedIn()) {
      root.innerHTML = "";
      addHighlight("");
      return;
    }
    var state = tutorialState();
    if (!state || state.phase === "complete") {
      root.innerHTML = "";
      addHighlight("");
      return;
    }
    if (state.minimized) {
      var completedTasks = [state.foundJobBoard, state.acceptedJob, state.firstShiftCompleted].filter(Boolean).length;
      root.innerHTML = '<button class="apx-tutorial-launch" type="button" data-tutorial-action="expand">Nhiệm vụ tân thủ <span>' + completedTasks + '/3</span></button>';
      addHighlight("");
      return;
    }

    var route = gameState() && gameState().route || {};
    var narrative = "";
    var highlight = "";
    if (state.phase === "welcome") {
      narrative = '<p>Chào mừng bạn đến với thành phố. Muốn bắt đầu cuộc sống, trước tiên bạn cần tìm một công việc.</p><button class="button button-gold" type="button" data-tutorial-action="begin">Bắt đầu tìm việc</button>';
    } else if (state.phase === "search") {
      narrative = '<p>Hãy mở bản đồ/thành phố và tìm khu vực Tuyển dụng.</p>';
      highlight = route.section === "city" && route.page === "map"
        ? '[data-action-tutorial="open-recruitment"]'
        : window.APX_NAV_UI && window.APX_NAV_UI.areaId === "world"
          ? '.nav-area-panel [data-section="city"][data-page="map"]'
          : '[data-area="world"]';
    } else if (state.phase === "offers") {
      narrative = '<p>Đây là nơi bạn có thể tìm việc. Hãy xem các công việc đang tuyển.</p><p>Mỗi công việc có yêu cầu, mức lương và thời hạn hợp đồng khác nhau. Hãy chọn công việc phù hợp.</p>';
    } else if (state.phase === "review") {
      narrative = '<p>Bạn đã tìm thấy một công việc. Hãy đọc kỹ hợp đồng trước khi nhận.</p>';
    } else if (state.phase === "employed") {
      narrative = '<p>Tốt! Bạn đã có công việc đầu tiên. Hãy đến nơi làm việc và bắt đầu ca làm.</p>';
    }

    var tasks = '<ul class="apx-tutorial-tasks">' +
      '<li class="' + (state.foundJobBoard ? "is-done" : "") + '">' + (state.foundJobBoard ? "✓" : "□") + ' Tìm việc làm</li>' +
      '<li class="' + (state.acceptedJob ? "is-done" : "") + '">' + (state.acceptedJob ? "✓" : "□") + ' Nhận công việc</li>' +
      '<li class="' + (state.firstShiftCompleted ? "is-done" : "") + '">' + (state.firstShiftCompleted ? "✓" : "□") + ' Hoàn thành ca làm đầu tiên</li>' +
      '</ul>';
    root.innerHTML = '<aside class="apx-tutorial-card" aria-label="Hướng dẫn tân thủ"><div class="apx-tutorial-heading"><span class="eyebrow">APX · HƯỚNG DẪN TÂN THỦ</span><button type="button" class="apx-tutorial-close" aria-label="Thu gọn hướng dẫn" data-tutorial-action="minimize">×</button></div>' +
      (state.guidanceHidden ? '<p>Hướng dẫn đã được bỏ qua. Nhiệm vụ đầu tiên vẫn được lưu.</p>' : narrative) +
      tasks +
      (state.guidanceHidden ? '<button class="button" type="button" data-tutorial-action="resume">Mở lại hướng dẫn</button>' : '<button class="apx-tutorial-skip" type="button" data-tutorial-action="skip">Bỏ qua hướng dẫn</button>') +
      '</aside>';
    addHighlight(highlight);
  }

  function updateFromRoute() {
    var state = tutorialState();
    if (!state || state.phase !== "search") return;
    if (routeIs("career", "jobs")) {
      state.phase = "offers";
      state.foundJobBoard = true;
      window.APXGame.save();
    }
  }

  function handleClick(event) {
    var button = event.target.closest("[data-tutorial-action], [data-action-tutorial]");
    if (!button) return;
    var state = tutorialState();
    if (!state) return;

    if (button.dataset.tutorialAction === "open-recruitment") {
      state.phase = "offers";
      state.foundJobBoard = true;
      window.APXGame.save();
      window.APXNav.go("career", "jobs");
      return;
    }
    if (button.dataset.tutorialAction === "begin") {
      state.phase = "search";
      saveAndRender();
    } else if (button.dataset.tutorialAction === "minimize") {
      state.minimized = true;
      saveAndRender();
    } else if (button.dataset.tutorialAction === "skip") {
      state.guidanceHidden = true;
      state.minimized = true;
      saveAndRender();
    } else if (button.dataset.tutorialAction === "expand") {
      state.minimized = false;
      saveAndRender();
    } else if (button.dataset.tutorialAction === "resume") {
      state.guidanceHidden = false;
      state.minimized = false;
      saveAndRender();
    }
  }

  function setPhase(phase, updates) {
    var state = tutorialState();
    if (!state || state.phase === "complete") return;
    state.phase = phase;
    Object.assign(state, updates || {});
  }

  document.addEventListener("click", handleClick);
  window.addEventListener("apx-account-ready", initialize);
  window.APXTutorial = {
    render: function () {
      updateFromRoute();
      render();
    },
    onJobSelected: function () {
      setPhase("review", { foundJobBoard: true, selectedJob: true });
    },
    onJobAccepted: function () {
      setPhase("employed", { foundJobBoard: true, selectedJob: true, acceptedJob: true });
    },
    onFirstShiftCompleted: function () {
      setPhase("complete", { foundJobBoard: true, selectedJob: true, acceptedJob: true, firstShiftCompleted: true });
    },
    initialize: initialize
  };
  initialize();
})();

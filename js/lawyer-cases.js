/* APX lawyer case engine. Case data is registered by js/cases/case_*.js. */
window.APXPages = window.APXPages || {};
(function () {
  "use strict";

  var STAT_KEYS = ["legalAnalysis", "evidence", "procedure", "argument", "caseUnderstanding", "clientTrust"];
  var rewardClaimsInFlight = Object.create(null);

  function escapeHTML(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, function (character) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[character];
    });
  }

  function money(value) {
    return "₫ " + Math.round(Number(value) || 0).toLocaleString("vi-VN");
  }

  function gameState() {
    return window.APXGame && window.APXGame.state;
  }

  function lawyerState(state) {
    if (!state.career || typeof state.career !== "object") state.career = {};
    if (!state.career.lawyer || typeof state.career.lawyer !== "object") {
      state.career.lawyer = { xp: 0, reputation: 0, completedCases: 0, cases: {}, activeCaseId: null, selectedCaseId: null };
    }
    var lawyer = state.career.lawyer;
    if (typeof lawyer.joined !== "boolean") lawyer.joined = false;
    lawyer.xp = Math.max(0, Math.floor(Number(lawyer.xp) || 0));
    lawyer.reputation = Math.max(-100, Math.min(100, Math.floor(Number(lawyer.reputation) || 0)));
    lawyer.completedCases = Math.max(0, Math.floor(Number(lawyer.completedCases) || 0));
    if (!lawyer.cases || typeof lawyer.cases !== "object" || Array.isArray(lawyer.cases)) lawyer.cases = {};
    Object.keys(lawyer.cases).forEach(function (caseId) {
      var savedCase = lawyer.cases[caseId];
      if (savedCase && savedCase.status === "completed" && savedCase.result &&
          !Object.prototype.hasOwnProperty.call(savedCase.result, "rewardStatus")) {
        savedCase.result.rewardStatus = "paid";
      }
    });
    if (typeof lawyer.activeCaseId !== "string") lawyer.activeCaseId = null;
    if (typeof lawyer.selectedCaseId !== "string") lawyer.selectedCaseId = null;
    return lawyer;
  }

  function getCases() {
    return Array.isArray(window.APX_LAW_CASES) ? window.APX_LAW_CASES.map(normalizeCase) : [];
  }

  function normalizeCase(source) {
    if (!source || typeof source !== "object") return source;
    var caseData = Object.assign({}, source);
    caseData.meta = caseData.meta || {
      title: source.title,
      shortTitle: source.title,
      category: source.type || "Vụ án",
      difficulty: source.difficulty,
      reward: source.reward,
      exp: source.exp
    };
    caseData.timeline = (source.timeline || []).map(function (item) {
      return Object.assign({}, item, {
        title: item.title || item.event || "",
        content: item.content || ""
      });
    });
    caseData.evidence = (source.evidence || []).map(function (item) {
      return Object.assign({}, item, {
        title: item.title || item.name || "",
        content: item.content || item.description || ""
      });
    });
    caseData.questions = (source.questions || []).map(function (question) {
      return Object.assign({}, question, {
        title: question.title || question.text || "",
        situation: question.situation || "",
        choices: (question.choices || []).map(function (choice) {
          return Object.assign({}, choice, {
            unlocks: choice.unlocks || choice.unlock || []
          });
        })
      });
    });
    caseData.endings = (source.endings || []).map(function (ending) {
      return Object.assign({}, ending, {
        type: ending.type || ending.result || "RESULT",
        description: ending.description || ending.result || ""
      });
    });
    if (typeof source.calculateScore === "function") {
      caseData.calculateScore = source.calculateScore.bind(source);
    }
    if (typeof source.resolveEnding === "function") {
      caseData.resolveEnding = function (score, random) {
        var resolved = source.resolveEnding.call(source, score, random);
        return typeof resolved === "string"
          ? caseData.endings.find(function (ending) { return ending.id === resolved; }) || null
          : resolved;
      };
    }
    return caseData;
  }

  function findCase(caseId) {
    return getCases().find(function (caseData) { return caseData && caseData.id === caseId; }) || null;
  }

  function validateCase(caseData) {
    if (!caseData || !caseData.meta || !Array.isArray(caseData.questions) || !caseData.questions.length) {
      return "Dữ liệu vụ án chưa đầy đủ.";
    }
    if (Array.isArray(caseData.endings) && caseData.endings.length > 100) {
      return "Mỗi vụ án chỉ được khai báo tối đa 100 kết cục.";
    }
    if (!Array.isArray(caseData.endings) || !caseData.endings.length || !caseData.calculateScore || !caseData.resolveEnding) {
      return "Dữ liệu chấm điểm và kết cục vụ án chưa đầy đủ.";
    }
    var questionIds = Object.create(null);
    var choiceIds = ["A", "B", "C", "D"];
    for (var i = 0; i < caseData.questions.length; i += 1) {
      var question = caseData.questions[i];
      if (!question || !question.id || questionIds[question.id] || !Array.isArray(question.choices) || question.choices.length !== 4) {
        return "Mỗi tình huống phải có mã riêng và đúng bốn lựa chọn.";
      }
      if (question.choices.some(function (choice, index) {
        return !choice || choice.id !== choiceIds[index] || !String(choice.text || "").trim();
      })) {
        return "Các lựa chọn phải có đủ nội dung và theo thứ tự A, B, C, D.";
      }
      questionIds[question.id] = true;
    }
    return "";
  }

  function createProgress(caseData, gameDay) {
    var stats = {};
    STAT_KEYS.forEach(function (key) {
      stats[key] = Number(caseData.scoring && caseData.scoring.initial && caseData.scoring.initial[key]) || 0;
    });
    var progress = {
      status: "active",
      startedDay: Math.max(1, Number(gameDay) || 1),
      currentQuestion: 0,
      answers: {},
      stats: stats,
      unlockedEvidence: [],
      unlockedBranches: [],
      openedEvidence: [],
      readLaws: [],
      activatedQuestions: [],
      result: null
    };
    (caseData.evidence || []).forEach(function (evidence) {
      if (evidence.availableAtStart) progress.unlockedEvidence.push(evidence.id);
    });
    activateQuestion(caseData, progress, 0);
    return progress;
  }

  function addUnique(list, id) {
    if (id && list.indexOf(id) < 0) list.push(id);
  }

  function unlockItem(caseData, progress, id) {
    if ((caseData.evidence || []).some(function (item) { return item.id === id; })) {
      addUnique(progress.unlockedEvidence, id);
    } else if ((caseData.legalLibrary || []).some(function (item) { return item.id === id; })) {
      addUnique(progress.readLaws, id);
    }
  }

  function unlockBranch(caseData, progress, branchId) {
    var branch = caseData.branches && caseData.branches[branchId];
    if (!branch) return;
    addUnique(progress.unlockedBranches, branchId);
    (branch.unlocks || []).forEach(function (id) { unlockItem(caseData, progress, id); });
  }

  function activateQuestion(caseData, progress, index) {
    var question = caseData.questions[index];
    if (!question || progress.activatedQuestions.indexOf(question.id) >= 0) return;
    (question.unlocks || []).forEach(function (branchId) { unlockBranch(caseData, progress, branchId); });
    addUnique(progress.activatedQuestions, question.id);
  }

  function persistAndRender(message, kind) {
    if (!window.APXGame) return;
    window.APXGame.save();
    window.APXGame.render();
    if (message) window.APXGame.toast(message, kind);
  }

  function startCase(caseData) {
    var state = gameState();
    if (!state || !caseData) return;
    var issue = validateCase(caseData);
    if (issue) return window.APXGame.toast(issue, "warning");
    var lawyer = lawyerState(state);
    if (!state.career || !state.career.activeJob || state.career.activeJob.type !== "lawyer") {
      return window.APXGame.toast("Hãy ứng tuyển và bắt đầu ca Luật sư trong mục Công việc hiện tại trước.", "warning");
    }
    if (lawyer.cases[caseData.id] && lawyer.cases[caseData.id].status === "completed") {
      lawyer.selectedCaseId = caseData.id;
      return persistAndRender();
    }
    if (lawyer.activeCaseId && lawyer.activeCaseId !== caseData.id) {
      return window.APXGame.toast("Hãy hoàn tất vụ án đang xử lý trước khi nhận hồ sơ khác.", "warning");
    }
    if (!lawyer.cases[caseData.id]) lawyer.cases[caseData.id] = createProgress(caseData, state.day);
    lawyer.activeCaseId = caseData.id;
    lawyer.selectedCaseId = null;
    state.route = { section: "career", page: "current" };
    persistAndRender("Đã tiếp nhận hồ sơ " + caseData.meta.shortTitle + ".");
  }

  function chooseAnswer(caseData, questionId, choiceId) {
    var state = gameState(), lawyer = state && lawyerState(state);
    var progress = lawyer && lawyer.cases[caseData.id];
    if (!progress || progress.status !== "active") return;
    var question = caseData.questions[progress.currentQuestion];
    if (!question || question.id !== questionId || progress.answers[questionId]) return;
    var choice = question.choices.find(function (item) { return item.id === choiceId; });
    if (!choice) return window.APXGame.toast("Lựa chọn không hợp lệ.", "warning");

    progress.answers[questionId] = choice.id;
    Object.keys(choice.effects || {}).forEach(function (key) {
      if (STAT_KEYS.indexOf(key) < 0) return;
      var next = (Number(progress.stats[key]) || 0) + Number(choice.effects[key]);
      if (Number.isFinite(next)) progress.stats[key] = next;
    });
    (choice.unlocks || []).forEach(function (unlockId) {
      if (caseData.branches && caseData.branches[unlockId]) unlockBranch(caseData, progress, unlockId);
      else unlockItem(caseData, progress, unlockId);
    });
    persistAndRender("Đã ghi nhận hướng xử lý. Hãy tiếp tục nghiên cứu hồ sơ.");
  }

  function advanceQuestion(caseData) {
    var state = gameState(), lawyer = state && lawyerState(state);
    var progress = lawyer && lawyer.cases[caseData.id];
    if (!progress || progress.status !== "active") return;
    var question = caseData.questions[progress.currentQuestion];
    if (!question || !progress.answers[question.id]) {
      return window.APXGame.toast("Hãy chọn phương án cho tình huống hiện tại trước.", "warning");
    }
    if (progress.currentQuestion >= caseData.questions.length - 1) return;
    progress.currentQuestion += 1;
    activateQuestion(caseData, progress, progress.currentQuestion);
    persistAndRender();
  }

  function scoreAnalysis(caseData, progress) {
    var positive = [], negative = [];
    caseData.questions.forEach(function (question) {
      var choiceId = progress.answers[question.id];
      var choice = question.choices.find(function (item) { return item.id === choiceId; });
      if (!choice) return;
      var impact = Object.keys(choice.effects || {}).reduce(function (sum, key) {
        return sum + (STAT_KEYS.indexOf(key) >= 0 ? Number(choice.effects[key]) || 0 : 0);
      }, 0);
      var note = question.title + ": " + choice.text;
      if (impact > 0) positive.push(note);
      if (impact < 0) negative.push(note);
    });
    return { positive: positive.slice(0, 4), negative: negative.slice(0, 4) };
  }

  function finishCase(caseData) {
    var state = gameState(), lawyer = state && lawyerState(state);
    var progress = lawyer && lawyer.cases[caseData.id];
    if (!progress || progress.status !== "active") return;
    var answered = caseData.questions.every(function (question) { return Boolean(progress.answers[question.id]); });
    if (!answered) return window.APXGame.toast("Hãy hoàn thành toàn bộ tình huống trước khi kết thúc vụ án.", "warning");
    if (!caseData.calculateScore || !caseData.resolveEnding) {
      return window.APXGame.toast("Vụ án thiếu hàm đánh giá kết quả.", "warning");
    }
    if (!state.career || !state.career.activeJob || state.career.activeJob.type !== "lawyer" ||
        !window.APXCareer || typeof window.APXCareer.finishLawyerCase !== "function") {
      return window.APXGame.toast("Hãy bắt đầu ca Luật sư trong Công việc hiện tại trước khi bàn giao hồ sơ.", "warning");
    }

    var score = caseData.calculateScore(progress.stats);
    var ending = caseData.resolveEnding(score, Math.random());
    if (!ending) return window.APXGame.toast("Chưa xác định được kết cục vụ án.", "warning");

    var reputationChange = Number(ending.reputation) || 0;
    var analysis = scoreAnalysis(caseData, progress);
    var evidenceSummary = (caseData.evidence || []).filter(function (item) {
      return progress.unlockedEvidence.indexOf(item.id) >= 0;
    }).map(function (item) {
      return { id: item.id, title: item.title, importance: item.importance, reviewed: progress.openedEvidence.indexOf(item.id) >= 0 };
    });
    var lawSummary = (caseData.legalLibrary || []).filter(function (item) {
      return progress.readLaws.indexOf(item.id) >= 0;
    }).map(function (item) { return { id: item.id, title: item.title, content: item.content }; });

    var reward = Math.max(0, Number(caseData.meta.reward) || 0);
    var rewardMultiplier = ending.rewardMultiplier == null ? 1 : Math.max(0, Number(ending.rewardMultiplier) || 0);
    var finalReward = Math.round(reward * rewardMultiplier);
    progress.result = {
      score: score,
      endingId: ending.id,
      endingTitle: ending.title,
      endingType: ending.type,
      description: ending.description,
      reward: finalReward,
      rewardStatus: finalReward > 0 ? "pending" : "paid",
      xp: Math.max(0, Number(caseData.meta.exp) || 0),
      salary: 0,
      reputationChange: reputationChange,
      strengths: analysis.positive,
      weaknesses: analysis.negative,
      evidence: evidenceSummary,
      legalBasis: lawSummary,
      completedDay: Math.max(1, Number(state.day) || 1)
    };
    progress.status = "completed";
    lawyer.activeCaseId = null;
    lawyer.selectedCaseId = caseData.id;
    lawyer.completedCases += 1;
    lawyer.reputation = Math.max(-100, Math.min(100, lawyer.reputation + reputationChange));
    var careerResult = window.APXCareer.finishLawyerCase(state, score);
    if (!careerResult) {
      progress.status = "active";
      lawyer.activeCaseId = caseData.id;
      lawyer.completedCases = Math.max(0, lawyer.completedCases - 1);
      lawyer.reputation = Math.max(-100, Math.min(100, lawyer.reputation - reputationChange));
      return;
    }
    progress.result.salary = Math.max(0, Number(careerResult.pay) || 0);
    lawyer.xp += progress.result.xp;
    persistAndRender("Vụ án đã kết thúc. Kết quả đã lưu; đang xác nhận tiền thưởng.");
    claimCaseReward(caseData, progress);
  }

  function claimCaseReward(caseData, progress) {
    if (!caseData || !progress || !progress.result || progress.result.rewardStatus === "paid") return;
    var rewardId = "lawyer-case-" + caseData.id;
    if (rewardClaimsInFlight[rewardId]) return;
    if (!window.APXBank || typeof window.APXBank.claimLawyerCaseReward !== "function") {
      progress.result.rewardStatus = "pending";
      window.APXGame.save();
      window.APXGame.render();
      window.APXGame.toast("Kết quả đã lưu nhưng hệ thống thưởng APXBank chưa sẵn sàng.", "warning");
      return;
    }
    rewardClaimsInFlight[rewardId] = true;
    progress.result.rewardStatus = "processing";
    window.APXGame.save();
    Promise.resolve().then(function () {
      return window.APXBank.claimLawyerCaseReward(
        window.APXGame.state,
        caseData.id,
        progress.result.reward,
        "Thưởng hoàn thành vụ án: " + caseData.meta.title
      );
    }).then(function () {
      var currentProgress = lawyerState(window.APXGame.state).cases[caseData.id] || progress;
      currentProgress.result.rewardStatus = "paid";
      window.APXGame.save();
      window.APXGame.render();
      window.APXGame.toast(money(currentProgress.result.reward) + " tiền thưởng đã vào APXBank.");
    }).catch(function (error) {
      var currentProgress = lawyerState(window.APXGame.state).cases[caseData.id] || progress;
      currentProgress.result.rewardStatus = "pending";
      window.APXGame.save();
      window.APXGame.render();
      window.APXGame.toast("Vụ án đã lưu nhưng tiền thưởng chưa được xác nhận. Có thể thử lại. " +
        (error && error.message ? error.message : ""), "warning");
    }).then(function () {
      delete rewardClaimsInFlight[rewardId];
    });
  }

  function renderCaseList(state) {
    var lawyer = lawyerState(state);
    var data = getCases();
    var employedAsLawyer = Boolean(state.career && state.career.activeJob && state.career.activeJob.type === "lawyer");
    if (!data.length) return '<div class="panel lawyer-case-empty">Chưa có hồ sơ vụ án nào được đăng ký.</div>';
    return '<div class="lawyer-case-list">' + data.map(function (caseData) {
      var issue = validateCase(caseData);
      var progress = lawyer.cases[caseData.id];
      var status = progress && progress.status === "completed" ? "Hoàn thành" : progress ? "Đang làm" : "Chưa làm";
      var blocked = lawyer.activeCaseId && lawyer.activeCaseId !== caseData.id && !progress;
      var action = progress && progress.status === "completed" ? "result" : "start";
      var label = progress && progress.status === "completed" ? "Xem kết quả" : progress ? "Tiếp tục hồ sơ" : "Nhận vụ án";
      if (!employedAsLawyer && !progress) label = "Nhận việc Luật sư để mở";
      return '<article class="panel lawyer-case-card"><div class="lawyer-case-card-top"><span class="lawyer-case-icon" aria-hidden="true">⚖️</span><span class="lawyer-case-status">' + escapeHTML(status) + '</span></div>' +
        '<span class="eyebrow">VỤ ÁN ' + String(data.indexOf(caseData) + 1).padStart(2, "0") + '</span>' +
        '<span class="eyebrow">' + escapeHTML(caseData.meta.category || "Vụ án") + ' · ' + escapeHTML(caseData.id) + '</span><h2>' + escapeHTML(caseData.meta.title) + '</h2>' +
        '<div class="lawyer-case-meta"><span>Độ khó<strong>' + escapeHTML(caseData.meta.difficulty || "—") + '</strong></span><span>Thù lao hồ sơ<strong>' + money(caseData.meta.reward) + '</strong></span><span>EXP<strong>+' + escapeHTML(caseData.meta.exp || 0) + '</strong></span></div>' +
        (issue ? '<p class="lawyer-case-error">' + escapeHTML(issue) + '</p>' : '') +
        '<button class="button button-gold" type="button" data-law-case-action="' + action + '" data-case-id="' + escapeHTML(caseData.id) + '"' + (issue || blocked || (!employedAsLawyer && (!progress || progress.status !== "completed")) ? " disabled" : "") + '>' + escapeHTML(blocked ? "Hoàn tất hồ sơ đang mở trước" : label) + '</button></article>';
    }).join("") + '</div>';
  }

  function renderEvidence(caseData, progress) {
    var evidence = (caseData.evidence || []).filter(function (item) {
      return progress.unlockedEvidence.indexOf(item.id) >= 0;
    });
    if (!evidence.length) return '<p class="lawyer-case-muted">Chưa có tài liệu được mở. Hãy phân tích tình huống để tìm hướng điều tra.</p>';
    return '<div class="lawyer-case-stack">' + evidence.map(function (item) {
      return '<details class="lawyer-case-document" data-law-case-evidence="' + escapeHTML(item.id) + '"><summary><span>' + escapeHTML(item.title) + '</span><small>' + escapeHTML(item.type || "Tài liệu") + '</small></summary><p>' + escapeHTML(item.content) + '</p></details>';
    }).join("") + '</div>';
  }

  function renderLibrary(caseData, progress) {
    var laws = caseData.legalLibrary || [];
    return '<label class="lawyer-case-search">Tìm trong thư viện pháp luật<input type="search" data-law-case-search placeholder="Nhập từ khóa, ví dụ: chứng cứ" autocomplete="off"></label>' +
      '<div class="lawyer-case-stack lawyer-case-laws">' + laws.map(function (law) {
        var read = progress.readLaws.indexOf(law.id) >= 0;
        return '<details class="lawyer-case-document" data-law-case-law="' + escapeHTML(law.id) + '"><summary><span>' + escapeHTML(law.title) + '</span>' + (read ? '<small>Đã tham khảo</small>' : '') + '</summary><p>' + escapeHTML(law.content) + '</p><small class="lawyer-case-keywords">' + escapeHTML((law.keywords || []).join(" · ")) + '</small></details>';
      }).join("") + '</div><p class="lawyer-case-muted" data-law-case-search-empty hidden>Không tìm thấy nội dung phù hợp.</p>';
  }

  function renderQuestion(caseData, progress) {
    var question = caseData.questions[progress.currentQuestion];
    if (!question) return '<p class="lawyer-case-error">Không tìm thấy tình huống tiếp theo trong hồ sơ.</p>';
    var selected = progress.answers[question.id];
    var choices = question.choices.map(function (choice, index) {
      var letter = String.fromCharCode(65 + index);
      return '<button class="lawyer-case-choice' + (selected === choice.id ? ' is-selected' : '') + '" type="button" data-law-case-action="choose" data-case-id="' + escapeHTML(caseData.id) + '" data-question-id="' + escapeHTML(question.id) + '" data-choice-id="' + escapeHTML(choice.id) + '"' + (selected ? " disabled" : "") + '><span>' + letter + '</span><strong>' + escapeHTML(choice.text) + '</strong></button>';
    }).join("");
    var last = progress.currentQuestion === caseData.questions.length - 1;
    var nextAction = last
      ? '<button class="button button-gold" type="button" data-law-case-action="finish" data-case-id="' + escapeHTML(caseData.id) + '"' + (!selected ? " disabled" : "") + '>KẾT THÚC VỤ ÁN</button>'
      : '<button class="button button-gold" type="button" data-law-case-action="next" data-case-id="' + escapeHTML(caseData.id) + '"' + (!selected ? " disabled" : "") + '>Tiếp tục xử lý tình tiết</button>';
    return '<article class="lawyer-case-analysis"><span class="eyebrow">PHÂN TÍCH · TÌNH HUỐNG ' + (progress.currentQuestion + 1) + '/' + caseData.questions.length + '</span><h3>' + escapeHTML(question.title) + '</h3><p>' + escapeHTML(question.situation) + '</p><div class="lawyer-case-choices">' + choices + '</div>' + nextAction + '</article>';
  }

  function renderWorkspace(caseData, progress) {
    var timeline = caseData.timeline || [];
    var request = caseData.clientRequest || {};
    var clientDetails = [
      caseData.client.company ? "Đơn vị: " + caseData.client.company : "",
      caseData.client.workingTime ? "Thời gian làm việc: " + caseData.client.workingTime : "",
      caseData.client.phone ? "Điện thoại: " + caseData.client.phone : ""
    ].filter(Boolean);
    var company = caseData.company || {};
    var companyFacts = [
      company.name ? company.name : "",
      company.field ? company.field : "",
      company.business ? company.business : "",
      company.employees ? Number(company.employees).toLocaleString("vi-VN") + " nhân viên" : "",
      company.members ? Number(company.members).toLocaleString("vi-VN") + " thành viên" : "",
      company.charterCapital ? "Vốn điều lệ " + money(company.charterCapital) : ""
    ].filter(Boolean);
    return '<section class="panel lawyer-case-workspace"><div class="lawyer-case-workspace-head"><div><span class="eyebrow">HỒ SƠ ĐANG XỬ LÝ · NGÀY GAME ' + progress.startedDay + '</span><h2>' + escapeHTML(caseData.meta.title) + '</h2></div><span class="lawyer-case-badge">Luật sư</span></div>' +
      '<div class="lawyer-case-column">' +
      '<section class="lawyer-case-section"><h3>Hồ sơ vụ án</h3>' + (caseData.description ? '<p>' + escapeHTML(caseData.description) + '</p>' : '') +
      '<div class="lawyer-case-parties"><div><small>Khách hàng</small><strong>' + escapeHTML(caseData.client.name) + '</strong><span>' + escapeHTML(caseData.client.occupation) + (caseData.client.age ? ' · ' + escapeHTML(caseData.client.age) + ' tuổi' : '') + '</span>' + (caseData.client.role ? '<span>' + escapeHTML(caseData.client.role) + '</span>' : '') + (caseData.clientDetails || clientDetails.length ? '<p>' + escapeHTML(clientDetails.join(" · ")) + '</p>' : '') + '<p>' + escapeHTML(caseData.client.description || "") + '</p></div><div><small>Đối phương</small><strong>' + escapeHTML(caseData.opponent.name) + '</strong><span>' + escapeHTML(caseData.opponent.occupation) + (caseData.opponent.age ? ' · ' + escapeHTML(caseData.opponent.age) + ' tuổi' : '') + '</span>' + (caseData.opponent.role ? '<span>' + escapeHTML(caseData.opponent.role) + '</span>' : '') + '<p>' + escapeHTML(caseData.opponent.description || "") + '</p></div></div>' +
      (companyFacts.length ? '<p class="lawyer-case-property"><strong>Doanh nghiệp:</strong> ' + escapeHTML(companyFacts.join(" · ")) + '</p>' : '') +
      (caseData.property ? '<p class="lawyer-case-property"><strong>Tài sản:</strong> ' + escapeHTML(caseData.property.type) + ' · ' + escapeHTML(caseData.property.location) + ' · Giá thỏa thuận ' + money(caseData.property.price) + '</p>' : '') +
      (caseData.property && caseData.property.deposit ? '<p class="lawyer-case-property"><strong>Tiền đặt cọc:</strong> ' + money(caseData.property.deposit) + '</p>' : '') +
      (request.primary || request.secondary ? '<div class="lawyer-case-request"><strong>Yêu cầu khách hàng</strong>' + (request.primary ? '<p>' + escapeHTML(request.primary) + '</p>' : '') + (request.secondary ? '<p>' + escapeHTML(request.secondary) + '</p>' : '') + '</div>' : '') + '</section>' +
      '<section class="lawyer-case-section"><h3>Diễn biến thời gian</h3><ol class="lawyer-case-timeline">' + timeline.map(function (item) {
        return '<li><time>' + escapeHTML(item.date) + '</time><div>' + (item.title ? '<strong>' + escapeHTML(item.title) + '</strong>' : '') + (item.content ? '<p>' + escapeHTML(item.content) + '</p>' : '') + '</div></li>';
      }).join("") + '</ol></section>' +
      '<section class="lawyer-case-section"><h3>Tài liệu và chứng cứ</h3>' + renderEvidence(caseData, progress) + '</section>' +
      '<section class="lawyer-case-section"><h3>📚 Thư viện pháp luật</h3><p class="lawyer-case-muted">Quy định hư cấu chỉ phục vụ gameplay, không phải tư vấn pháp lý ngoài đời.</p>' + renderLibrary(caseData, progress) + '</section>' +
      '<section class="lawyer-case-section"><h3>Phân tích vụ án</h3><p class="lawyer-case-guidance">Đọc hồ sơ, kiểm tra tài liệu và tra cứu căn cứ trong thư viện trước khi chọn phương án. Lựa chọn sẽ ảnh hưởng đến tình tiết được mở tiếp theo.</p>' + renderQuestion(caseData, progress) + '</section></div></section>';
  }

  function renderResult(caseData, progress, lawyer) {
    var result = progress.result;
    if (!result) return "";
    var impactText = result.reputationChange > 0
      ? "+" + result.reputationChange
      : String(result.reputationChange);
    var evidence = result.evidence || [];
    var keyEvidence = evidence.filter(function (item) { return item.importance === "critical" || item.importance === "high"; });
    return '<section class="panel lawyer-case-result"><span class="eyebrow">KẾT QUẢ · NGÀY GAME ' + result.completedDay + '</span><h2>' + escapeHTML(result.endingTitle) + '</h2><p class="lawyer-case-result-description">' + escapeHTML(result.description) + '</p><p>Điểm đánh giá: ' + escapeHTML(result.score) + '/100 · Kết quả đã chốt</p>' +
      '<div class="lawyer-case-score">Điểm phân tích<strong>' + result.score + '%</strong></div>' +
      '<div class="lawyer-case-rewards"><span>Thưởng vụ án<strong>' + money(result.reward) + '</strong></span><span>EXP Luật sư<strong>+' + result.xp + '</strong></span><span>Danh tiếng<strong>' + impactText + ' · hiện có ' + lawyer.reputation + '</strong></span></div>' +
      (result.rewardStatus === "paid"
        ? '<p class="lawyer-case-muted">Tiền thưởng đã được xác nhận vào APXBank.</p>'
        : '<p class="lawyer-case-error">Tiền thưởng đang chờ xác nhận hoặc migration APXBank chưa sẵn sàng.</p><button class="button" type="button" data-law-case-action="claim-reward" data-case-id="' + escapeHTML(caseData.id) + '">Thử nhận thưởng lại</button>') +
      '<div class="lawyer-case-review-grid"><section><h3>Điểm xử lý tốt</h3>' + (result.strengths.length ? '<ul>' + result.strengths.map(function (item) { return '<li>' + escapeHTML(item) + '</li>'; }).join("") + '</ul>' : '<p>Hồ sơ chưa có lựa chọn tạo lợi thế rõ rệt.</p>') + '</section>' +
      '<section><h3>Điểm cần cải thiện</h3>' + (result.weaknesses.length ? '<ul>' + result.weaknesses.map(function (item) { return '<li>' + escapeHTML(item) + '</li>'; }).join("") + '</ul>' : '<p>Không có lựa chọn gây bất lợi rõ rệt theo hồ sơ.</p>') + '</section></div>' +
      '<section class="lawyer-case-review"><h3>Chứng cứ trọng tâm</h3>' + (keyEvidence.length ? '<ul>' + keyEvidence.map(function (item) { return '<li><strong>' + escapeHTML(item.title) + '</strong> · ' + (item.reviewed ? "đã mở đọc" : "đã được phát hiện nhưng chưa mở đọc") + '</li>'; }).join("") + '</ul>' : '<p>Không mở được chứng cứ trọng tâm trong quá trình xử lý.</p>') + '</section>' +
      '<section class="lawyer-case-review"><h3>Căn cứ đã tham khảo</h3>' + (result.legalBasis.length ? '<ul>' + result.legalBasis.map(function (item) { return '<li><strong>' + escapeHTML(item.title) + '</strong><p>' + escapeHTML(item.content) + '</p></li>'; }).join("") + '</ul>' : '<p>Chưa ghi nhận căn cứ pháp lý nào được mở trong thư viện.</p>') + '</section>' +
      '<section class="lawyer-case-consequence"><strong>Hậu quả vụ án</strong><p>' + escapeHTML(result.description) + '</p><small>Danh tiếng thay đổi ' + impactText + '. Kết quả đã được lưu vào tiến trình nghề Luật sư.</small></section></section>';
  }

  function render(state) {
    var lawyer = lawyerState(state);
    var selectedCase = findCase(lawyer.selectedCaseId);
    var selectedProgress = selectedCase && lawyer.cases[selectedCase.id];
    return '<header class="page-heading"><span class="eyebrow">NGHỀ NGHIỆP · LUẬT SƯ</span><h1>Danh sách vụ án</h1><p>Hồ sơ và quy định dưới đây là dữ liệu giả lập phục vụ gameplay, không phải tư vấn pháp lý thực tế.</p></header>' +
      '<section class="panel lawyer-case-guidance"><a class="button button-gold" href="#" data-action="page" data-section="career" data-page="jobs">Tìm việc Luật sư</a> <a class="button" href="#" data-action="page" data-section="career" data-page="current">Công việc hiện tại</a></section>' +
      renderCaseList(state) +
      (selectedCase && selectedProgress && selectedProgress.status === "completed" ? renderResult(selectedCase, selectedProgress, lawyer) : "");
  }

  function startCareerCase(state) {
    if (!state || !state.career || !state.career.activeJob || state.career.activeJob.type !== "lawyer") return false;
    if (!getCases().length) {
      window.APXGame.toast("Chưa có hồ sơ vụ án nào được đăng ký.", "warning");
      return false;
    }
    return true;
  }

  function renderShift(state) {
    var lawyer = lawyerState(state);
    var caseData = findCase(lawyer.activeCaseId);
    var progress = caseData && lawyer.cases[caseData.id];
    if (!caseData || !progress || progress.status !== "active") {
      return '<header class="page-heading"><span class="eyebrow">CA LÀM · LUẬT SƯ</span><h1>Chọn hồ sơ cần xử lý</h1><p>Tiến trình vụ án được lưu tự động; có thể tiếp tục từ câu hỏi gần nhất.</p></header>' + renderCaseList(state);
    }
    return '<header class="page-heading"><span class="eyebrow">CA LÀM · LUẬT SƯ</span><h1>' + escapeHTML(caseData.meta.title) + '</h1><p>Đọc hồ sơ, xem chứng cứ và xử lý các tình huống để bàn giao ca.</p></header>' +
      '<section class="panel lawyer-case-career"><span>⚖️ ' + escapeHTML(state.career.activeJob.employer) + '</span><span>Tiến độ tình huống ' + (progress.currentQuestion + 1) + '/' + caseData.questions.length + '</span><span>Hồ sơ đang làm</span></section>' + renderWorkspace(caseData, progress);
  }

  function renderCareerResult(state) {
    var lawyer = lawyerState(state);
    var caseData = findCase(lawyer.selectedCaseId);
    var progress = caseData && lawyer.cases[caseData.id];
    return caseData && progress && progress.status === "completed" ? renderResult(caseData, progress, lawyer) : "";
  }

  function applyLibraryFilter(input) {
    var query = String(input.value || "").trim().toLocaleLowerCase("vi-VN");
    var cards = document.querySelectorAll(".lawyer-case-laws [data-law-case-law]");
    var visible = 0;
    Array.prototype.forEach.call(cards, function (card) {
      var matches = !query || card.textContent.toLocaleLowerCase("vi-VN").indexOf(query) >= 0;
      card.hidden = !matches;
      if (matches) visible += 1;
    });
    var empty = document.querySelector("[data-law-case-search-empty]");
    if (empty) empty.hidden = visible > 0;
  }

  document.addEventListener("click", function (event) {
    var button = event.target.closest("[data-law-case-action]");
    if (!button) return;
    var caseData = findCase(button.dataset.caseId);
    var action = button.dataset.lawCaseAction;
    if (!caseData) return window.APXGame.toast("Không tìm thấy dữ liệu vụ án.", "warning");
    if (action === "start") return startCase(caseData);
    var state = gameState(), lawyer = state && lawyerState(state);
    if (action === "result") {
      if (!lawyer || !lawyer.cases[caseData.id] || lawyer.cases[caseData.id].status !== "completed") return;
      lawyer.selectedCaseId = caseData.id;
      return persistAndRender();
    }
    if (action === "claim-reward") {
      var progress = lawyer && lawyer.cases[caseData.id];
      if (!progress || progress.status !== "completed" || !progress.result || progress.result.rewardStatus === "paid") return;
      return claimCaseReward(caseData, progress);
    }
    if (action === "choose") return chooseAnswer(caseData, button.dataset.questionId, button.dataset.choiceId);
    if (action === "next") return advanceQuestion(caseData);
    if (action === "finish") return finishCase(caseData);
  });

  document.addEventListener("input", function (event) {
    var input = event.target.closest("[data-law-case-search]");
    if (input) applyLibraryFilter(input);
  });

  document.addEventListener("toggle", function (event) {
    var details = event.target;
    if (!details || !details.open) return;
    var evidenceId = details.getAttribute("data-law-case-evidence");
    var lawId = details.getAttribute("data-law-case-law");
    if (!evidenceId && !lawId) return;
    var state = gameState(), lawyer = state && lawyerState(state);
    var caseData = lawyer && findCase(lawyer.activeCaseId);
    var progress = caseData && lawyer.cases[caseData.id];
    if (!progress || progress.status !== "active") return;
    if (evidenceId && progress.unlockedEvidence.indexOf(evidenceId) >= 0) addUnique(progress.openedEvidence, evidenceId);
    if (lawId && (caseData.legalLibrary || []).some(function (law) { return law.id === lawId; })) addUnique(progress.readLaws, lawId);
    window.APXGame.save();
  }, true);

  window.APXLawyerCases = {
    ensureState: lawyerState,
    render: render,
    renderShift: renderShift,
    renderCareerResult: renderCareerResult,
    startCareerCase: startCareerCase
  };
})();

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
    caseData.finalArguments = (source.finalArguments || []).map(function (argument) {
      return Object.assign({}, argument);
    });
    caseData.investigationActions = (source.investigationActions || []).map(function (action) {
      return Object.assign({}, action, {
        discoveries: action.discoveries || [],
        unlocksEvidence: action.unlocksEvidence || []
      });
    });
    caseData.investigationEvents = (source.investigationEvents || []).map(function (event) {
      return Object.assign({}, event, {
        choices: (event.choices || []).map(function (choice) { return Object.assign({}, choice); })
      });
    });
    if (source.finalDefense && typeof source.finalDefense === "object") {
      caseData.finalDefense = Object.assign({}, source.finalDefense, {
        arguments: (source.finalDefense.arguments || []).map(function (argument) {
          return Object.assign({}, argument);
        })
      });
    }
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
    var hasInvestigation = caseData && Array.isArray(caseData.investigationActions) &&
      caseData.investigationActions.length > 0;
    if (!caseData || !caseData.meta || !Array.isArray(caseData.questions) ||
        (!caseData.questions.length && !hasInvestigation)) {
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
    if (hasInvestigation) {
      var actionIds = Object.create(null);
      for (var actionIndex = 0; actionIndex < caseData.investigationActions.length; actionIndex += 1) {
        var action = caseData.investigationActions[actionIndex];
        if (!action || !action.id || actionIds[action.id] || !String(action.title || "").trim() ||
            !Number.isFinite(Number(action.cost)) || Number(action.cost) <= 0) {
          return "Mỗi hành động điều tra phải có mã riêng, tiêu đề và chi phí lượt hợp lệ.";
        }
        var missingEvidence = action.unlocksEvidence.some(function (id) {
          return !caseData.evidence.some(function (item) { return item.id === id; });
        });
        var invalidActionEffect = Object.keys(action.effects || {}).some(function (key) {
          return STAT_KEYS.indexOf(key) < 0 || !Number.isFinite(Number(action.effects[key]));
        });
        if (missingEvidence || invalidActionEffect) return "Hành động điều tra tham chiếu dữ liệu không hợp lệ.";
        actionIds[action.id] = true;
      }
      for (var eventIndex = 0; eventIndex < caseData.investigationEvents.length; eventIndex += 1) {
        var investigationEvent = caseData.investigationEvents[eventIndex];
        if (!investigationEvent.id || !Array.isArray(investigationEvent.choices) ||
            investigationEvent.choices.length !== 2 || investigationEvent.choices.some(function (choice) {
              return !choice.id || !String(choice.text || "").trim() ||
                Object.keys(choice.effects || {}).some(function (key) {
                  return STAT_KEYS.indexOf(key) < 0 || !Number.isFinite(Number(choice.effects[key]));
                }) ||
                (choice.unlocksEvidence || []).some(function (id) {
                  return !caseData.evidence.some(function (item) { return item.id === id; });
                });
            })) return "Sự kiện điều tra phải có hai lựa chọn hợp lệ.";
      }
    }
    var argumentIds = Object.create(null);
    for (var argumentIndex = 0; argumentIndex < caseData.finalArguments.length; argumentIndex += 1) {
      var argument = caseData.finalArguments[argumentIndex];
      if (!argument || !argument.id || argumentIds[argument.id] || !String(argument.title || "").trim() ||
          !String(argument.tradeoff || "").trim() || !String(argument.rationale || "").trim()) {
        return "Mỗi chiến lược kết luận phải có mã riêng, lập luận và đánh đổi.";
      }
      var unknownEvidence = (argument.requiresEvidence || []).some(function (id) {
        return !caseData.evidence.some(function (item) { return item.id === id; });
      });
      var unknownLaw = (argument.requiresLaw || []).some(function (id) {
        return !caseData.legalLibrary.some(function (item) { return item.id === id; });
      });
      var invalidEffect = Object.keys(argument.effects || {}).some(function (key) {
        return STAT_KEYS.indexOf(key) < 0 || !Number.isFinite(Number(argument.effects[key]));
      });
      if (unknownEvidence || unknownLaw || invalidEffect) {
        return "Chiến lược kết luận tham chiếu nguồn hoặc điểm tác động không hợp lệ.";
      }
      argumentIds[argument.id] = true;
    }
    if (caseData.finalDefense) {
      var defense = caseData.finalDefense;
      if (!Array.isArray(defense.arguments) || !defense.arguments.length ||
          !Number.isInteger(Number(defense.selectionLimit)) || Number(defense.selectionLimit) < 1 ||
          Number(defense.selectionLimit) > defense.arguments.length ||
          !Number.isInteger(Number(defense.minimumSelection == null ? defense.selectionLimit : defense.minimumSelection)) ||
          Number(defense.minimumSelection == null ? defense.selectionLimit : defense.minimumSelection) < 0 ||
          Number(defense.minimumSelection == null ? defense.selectionLimit : defense.minimumSelection) > Number(defense.selectionLimit)) {
        return "Dữ liệu lựa chọn luận điểm cuối chưa hợp lệ.";
      }
      var defenseIds = Object.create(null);
      for (var defenseIndex = 0; defenseIndex < defense.arguments.length; defenseIndex += 1) {
        var defenseArgument = defense.arguments[defenseIndex];
        if (!defenseArgument || !defenseArgument.id || defenseIds[defenseArgument.id] ||
            !String(defenseArgument.text || "").trim()) {
          return "Mỗi luận điểm cuối phải có mã riêng và nội dung.";
        }
        var defenseUnknownEvidence = (defenseArgument.requiresEvidence || []).some(function (id) {
          return !caseData.evidence.some(function (item) { return item.id === id; });
        });
        var defenseUnknownLaw = (defenseArgument.requiresLaw || []).some(function (id) {
          return !caseData.legalLibrary.some(function (item) { return item.id === id; });
        });
        var defenseInvalidEffect = Object.keys(defenseArgument.effects || {}).some(function (key) {
          return STAT_KEYS.indexOf(key) < 0 || !Number.isFinite(Number(defenseArgument.effects[key]));
        });
        if (defenseUnknownEvidence || defenseUnknownLaw || defenseInvalidEffect) {
          return "Luận điểm cuối tham chiếu nguồn hoặc điểm tác động không hợp lệ.";
        }
        defenseIds[defenseArgument.id] = true;
      }
      if ((defense.idealCombination || []).some(function (id) { return !defenseIds[id]; })) {
        return "Tổ hợp luận điểm lý tưởng tham chiếu mã không tồn tại.";
      }
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
      mechanicsVersion: Number(caseData.mechanicsVersion) || 1,
      startedDay: Math.max(1, Number(gameDay) || 1),
      currentQuestion: 0,
      answers: {},
      pendingAnswers: {},
      finalArgumentId: null,
      selectedFinalDefenseIds: [],
      phase: Array.isArray(caseData.investigationActions) && caseData.investigationActions.length
        ? (Array.isArray(caseData.meetingDialogue) ? "intro" : "investigation") : "questions",
      investigationTurnsRemaining: Math.max(1, Number(caseData.investigationTurns) || 8),
      meetingQuestionsAsked: [],
      meetingResponses: [],
      activeEvidenceId: null,
      completedInvestigationActions: [],
      discoveries: [],
      investigationEventChoices: {},
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

  function migrateProgress(caseData, progress) {
    if (!progress || progress.status !== "active") return;
    var oldMechanicsVersion = Number(progress.mechanicsVersion) || 1;
    if (!progress.answers || typeof progress.answers !== "object" || Array.isArray(progress.answers)) progress.answers = {};
    if (!progress.pendingAnswers || typeof progress.pendingAnswers !== "object" || Array.isArray(progress.pendingAnswers)) {
      progress.pendingAnswers = {};
    }
    if (oldMechanicsVersion >= Number(caseData.mechanicsVersion)) {
      if (!(Array.isArray(caseData.investigationActions) && caseData.investigationActions.length)) {
        var nextUnansweredQuestion = caseData.questions.findIndex(function (question) {
          return !progress.answers[question.id];
        });
        progress.currentQuestion = nextUnansweredQuestion < 0
          ? Math.max(0, caseData.questions.length - 1)
          : nextUnansweredQuestion;
      }
      return;
    }
    var currentQuestionIds = Object.create(null);
    caseData.questions.forEach(function (question) { currentQuestionIds[question.id] = true; });
    Object.keys(progress.answers).forEach(function (questionId) {
      if (!currentQuestionIds[questionId]) delete progress.answers[questionId];
    });
    if (!Array.isArray(progress.selectedFinalDefenseIds)) progress.selectedFinalDefenseIds = [];
    if (Array.isArray(caseData.investigationActions) && caseData.investigationActions.length) {
      if (!Array.isArray(progress.completedInvestigationActions)) progress.completedInvestigationActions = [];
      if (!Array.isArray(progress.discoveries)) progress.discoveries = [];
      if (!progress.investigationEventChoices || typeof progress.investigationEventChoices !== "object") {
        progress.investigationEventChoices = {};
      }
      progress.phase = progress.phase || "investigation";
      if (!Number.isFinite(Number(progress.investigationTurnsRemaining))) {
        progress.investigationTurnsRemaining = Math.max(1, Number(caseData.investigationTurns) || 8);
      }
      if (!Array.isArray(progress.meetingQuestionsAsked)) progress.meetingQuestionsAsked = [];
      if (!Array.isArray(progress.meetingResponses)) progress.meetingResponses = [];
      if (Array.isArray(caseData.meetingDialogue) && oldMechanicsVersion < 5 &&
          progress.completedInvestigationActions.length === 0) progress.phase = "intro";
    }
    progress.selectedFinalDefenseIds = progress.selectedFinalDefenseIds.filter(function (id) {
      return caseData.finalDefense && caseData.finalDefense.arguments.some(function (argument) {
        return argument.id === id;
      });
    });
    var firstUnanswered = caseData.questions.findIndex(function (question) {
      return !progress.answers[question.id];
    });
    progress.currentQuestion = firstUnanswered < 0
      ? Math.max(0, caseData.questions.length - 1)
      : firstUnanswered;
    progress.mechanicsVersion = Number(caseData.mechanicsVersion) || 1;
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
    migrateProgress(caseData, lawyer.cases[caseData.id]);
    lawyer.activeCaseId = caseData.id;
    lawyer.selectedCaseId = null;
    state.route = { section: "career", page: "current" };
    persistAndRender("Đã tiếp nhận hồ sơ " + caseData.meta.shortTitle + ".");
  }

  function chooseAnswer(caseData, questionId, choiceId) {
    var state = gameState(), lawyer = state && lawyerState(state);
    var progress = lawyer && lawyer.cases[caseData.id];
    if (!progress || progress.status !== "active") return;
    migrateProgress(caseData, progress);
    var question = caseData.questions[progress.currentQuestion];
    if (!question || question.id !== questionId || progress.answers[questionId]) return;
    var choice = question.choices.find(function (item) { return item.id === choiceId; });
    if (!choice) return window.APXGame.toast("Lựa chọn không hợp lệ.", "warning");
    var missing = missingResearch(caseData, progress, choice);
    if (missing.length) {
      return window.APXGame.toast("Hãy kiểm tra căn cứ trước: " + missing.join(", ") + ".", "warning");
    }

    if (caseData.confirmAnswers) {
      progress.pendingAnswers[questionId] = choice.id;
      return persistAndRender("Đã chọn đáp án. Bạn có thể đổi lựa chọn trước khi xác nhận.");
    }
    return recordAnswer(caseData, progress, question, choice.id);
  }

  function confirmAnswer(caseData, questionId) {
    var state = gameState(), lawyer = state && lawyerState(state);
    var progress = lawyer && lawyer.cases[caseData.id];
    if (!progress || progress.status !== "active" || !caseData.confirmAnswers) return;
    migrateProgress(caseData, progress);
    var question = caseData.questions[progress.currentQuestion];
    if (!question || question.id !== questionId || progress.answers[questionId]) return;
    return recordAnswer(caseData, progress, question, progress.pendingAnswers[questionId]);
  }

  function recordAnswer(caseData, progress, question, choiceId) {
    if (!question || progress.answers[question.id]) return;
    var choice = question.choices.find(function (item) { return item.id === choiceId; });
    if (!choice) return window.APXGame.toast("Hãy chọn một đáp án trước khi tiếp tục.", "warning");
    var missing = missingResearch(caseData, progress, choice);
    if (missing.length) {
      return window.APXGame.toast("Hãy kiểm tra căn cứ trước: " + missing.join(", ") + ".", "warning");
    }

    progress.answers[question.id] = choice.id;
    delete progress.pendingAnswers[question.id];
    Object.keys(choice.effects || {}).forEach(function (key) {
      if (STAT_KEYS.indexOf(key) < 0) return;
      var next = (Number(progress.stats[key]) || 0) + Number(choice.effects[key]);
      if (Number.isFinite(next)) progress.stats[key] = next;
    });
    (choice.unlocks || []).forEach(function (unlockId) {
      if (caseData.branches && caseData.branches[unlockId]) unlockBranch(caseData, progress, unlockId);
      else unlockItem(caseData, progress, unlockId);
    });
    if (progress.currentQuestion < caseData.questions.length - 1) {
      progress.currentQuestion += 1;
      activateQuestion(caseData, progress, progress.currentQuestion);
      persistAndRender("Đã ghi nhận quyết định. Tình tiết tiếp theo đã mở.");
      return;
    }
    persistAndRender("Đã ghi nhận quyết định cuối. Hãy xem lại hồ sơ rồi kết thúc vụ án.");
  }

  function chooseFinalArgument(caseData, argumentId) {
    var state = gameState(), lawyer = state && lawyerState(state);
    var progress = lawyer && lawyer.cases[caseData.id];
    if (!progress || progress.status !== "active" || progress.mechanicsVersion < 2) return;
    migrateProgress(caseData, progress);
    if (!caseData.questions.every(function (question) { return Boolean(progress.answers[question.id]); })) {
      return window.APXGame.toast("Hãy hoàn tất các tình huống trước khi chọn chiến lược kết luận.", "warning");
    }
    var argument = caseData.finalArguments.find(function (item) { return item.id === argumentId; });
    if (!argument) return window.APXGame.toast("Không tìm thấy chiến lược kết luận.", "warning");
    var missing = missingResearch(caseData, progress, argument);
    if (missing.length) {
      return window.APXGame.toast("Chưa đủ căn cứ cho chiến lược này: " + missing.join(", ") + ".", "warning");
    }
    progress.finalArgumentId = argument.id;
    persistAndRender("Đã chốt hướng lập luận. Bạn vẫn có thể đổi chiến lược trước khi bàn giao.");
  }

  function chooseFinalDefenseArgument(caseData, argumentId) {
    var state = gameState(), lawyer = state && lawyerState(state);
    var progress = lawyer && lawyer.cases[caseData.id];
    var defense = caseData.finalDefense;
    if (!progress || progress.status !== "active" || !defense) return;
    migrateProgress(caseData, progress);
    if ((caseData.investigationActions.length
      ? progress.phase !== "defense"
      : !caseData.questions.every(function (question) { return Boolean(progress.answers[question.id]); }))) {
      return window.APXGame.toast("Hãy hoàn tất phần điều tra trước khi chọn luận điểm.", "warning");
    }
    var argument = defense.arguments.find(function (item) { return item.id === argumentId; });
    if (!argument) return window.APXGame.toast("Không tìm thấy luận điểm này.", "warning");
    var selected = progress.selectedFinalDefenseIds.indexOf(argument.id);
    if (selected >= 0) {
      progress.selectedFinalDefenseIds.splice(selected, 1);
    } else {
      if (progress.selectedFinalDefenseIds.length >= Number(defense.selectionLimit)) {
        return window.APXGame.toast("Chọn tối đa " + defense.selectionLimit + " luận điểm.", "warning");
      }
      var missing = missingResearch(caseData, progress, argument);
      if (missing.length) {
        return window.APXGame.toast("Chưa đủ căn cứ cho luận điểm này: " + missing.join(", ") + ".", "warning");
      }
      progress.selectedFinalDefenseIds.push(argument.id);
    }
    persistAndRender("Đã cập nhật lựa chọn luận điểm cuối.");
  }

  function runInvestigationAction(caseData, actionId) {
    var state = gameState(), lawyer = state && lawyerState(state);
    var progress = lawyer && lawyer.cases[caseData.id];
    if (!progress || progress.status !== "active" || progress.phase !== "investigation") return;
    migrateProgress(caseData, progress);
    var pendingEvent = caseData.investigationEvents.find(function (event) {
      return !progress.investigationEventChoices[event.id] &&
        progress.completedInvestigationActions.length >= Number(event.triggerActions || 2);
    });
    if (pendingEvent) return window.APXGame.toast("Hãy xử lý tình tiết mới trước khi tiếp tục điều tra.", "warning");
    var action = caseData.investigationActions.find(function (item) { return item.id === actionId; });
    if (!action || progress.completedInvestigationActions.indexOf(action.id) >= 0) {
      return window.APXGame.toast("Hành động điều tra không hợp lệ hoặc đã thực hiện.", "warning");
    }
    if (progress.investigationTurnsRemaining < Number(action.cost)) {
      return window.APXGame.toast("Không đủ lượt điều tra cho hành động này.", "warning");
    }
    progress.investigationTurnsRemaining -= Number(action.cost);
    addUnique(progress.completedInvestigationActions, action.id);
    Object.keys(action.effects || {}).forEach(function (key) {
      progress.stats[key] = (Number(progress.stats[key]) || 0) + Number(action.effects[key]);
    });
    (action.unlocksEvidence || []).forEach(function (id) { unlockItem(caseData, progress, id); });
    (action.discoveries || []).forEach(function (discovery) { addUnique(progress.discoveries, discovery); });
    persistAndRender(action.result && action.result.title
      ? "Điều tra xong: " + action.result.title
      : "Đã cập nhật hồ sơ điều tra.");
  }

  function chooseInvestigationEvent(caseData, eventId, choiceId) {
    var state = gameState(), lawyer = state && lawyerState(state);
    var progress = lawyer && lawyer.cases[caseData.id];
    if (!progress || progress.status !== "active" || progress.phase !== "investigation") return;
    var event = caseData.investigationEvents.find(function (item) { return item.id === eventId; });
    if (!event || progress.investigationEventChoices[eventId]) return;
    if (progress.completedInvestigationActions.length < Number(event.triggerActions || 2)) return;
    var choice = event.choices.find(function (item) { return item.id === choiceId; });
    if (!choice) return window.APXGame.toast("Lựa chọn tình tiết không hợp lệ.", "warning");
    progress.investigationEventChoices[eventId] = choice.id;
    Object.keys(choice.effects || {}).forEach(function (key) {
      progress.stats[key] = (Number(progress.stats[key]) || 0) + Number(choice.effects[key]);
    });
    (choice.unlocksEvidence || []).forEach(function (id) { unlockItem(caseData, progress, id); });
    (choice.discoveries || []).forEach(function (discovery) { addUnique(progress.discoveries, discovery); });
    persistAndRender("Đã ghi nhận cách xử lý tình tiết mới.");
  }

  function closeInvestigation(caseData) {
    var state = gameState(), lawyer = state && lawyerState(state);
    var progress = lawyer && lawyer.cases[caseData.id];
    if (!progress || progress.status !== "active" || progress.phase !== "investigation") return;
    var evidenceCount = progress.unlockedEvidence.length;
    var pendingEvent = caseData.investigationEvents.some(function (event) {
      return !progress.investigationEventChoices[event.id] &&
        progress.completedInvestigationActions.length >= Number(event.triggerActions || 2);
    });
    if (pendingEvent) return window.APXGame.toast("Hãy xử lý tình tiết bất ngờ trước khi đóng hồ sơ.", "warning");
    if (evidenceCount < Number(caseData.minimumEvidence || 3)) {
      return window.APXGame.toast("Cần thu thập ít nhất " + caseData.minimumEvidence + " chứng cứ trước khi đóng hồ sơ.", "warning");
    }
    progress.phase = "defense";
    persistAndRender("Đã đóng điều tra. Hãy chọn luận điểm để xây dựng hồ sơ biện hộ.");
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
    migrateProgress(caseData, progress);
    var hasInvestigation = caseData.investigationActions.length > 0;
    var answered = hasInvestigation
      ? progress.phase === "defense"
      : caseData.questions.every(function (question) { return Boolean(progress.answers[question.id]); });
    if (!answered) return window.APXGame.toast("Hãy hoàn thành toàn bộ tình huống trước khi kết thúc vụ án.", "warning");
    var finalArgument = caseData.finalArguments.find(function (item) {
      return item.id === progress.finalArgumentId;
    });
    var finalDefense = caseData.finalDefense;
    var selectedDefense = finalDefense
      ? (progress.selectedFinalDefenseIds || []).map(function (id) {
        return finalDefense.arguments.find(function (item) { return item.id === id; });
      }).filter(Boolean)
      : [];
    if (progress.mechanicsVersion >= 2 && caseData.finalArguments.length && !finalArgument) {
      return window.APXGame.toast("Hãy chọn và xác nhận chiến lược kết luận trước khi bàn giao.", "warning");
    }
    if (finalDefense && (selectedDefense.length < Number(finalDefense.minimumSelection == null
      ? finalDefense.selectionLimit : finalDefense.minimumSelection) ||
      selectedDefense.length > Number(finalDefense.selectionLimit))) {
      return window.APXGame.toast("Hãy chọn từ " +
        Number(finalDefense.minimumSelection == null ? finalDefense.selectionLimit : finalDefense.minimumSelection) +
        " đến " + finalDefense.selectionLimit + " luận điểm trước khi bàn giao.", "warning");
    }
    if (finalDefense) {
      var missingDefenseResearch = [];
      selectedDefense.forEach(function (argument) {
        missingDefenseResearch = missingDefenseResearch.concat(missingResearch(caseData, progress, argument));
      });
      if (missingDefenseResearch.length) {
        return window.APXGame.toast("Hãy đọc đủ căn cứ cho các luận điểm đã chọn: " +
          Array.from(new Set(missingDefenseResearch)).join(", ") + ".", "warning");
      }
    }
    if (!caseData.calculateScore || !caseData.resolveEnding) {
      return window.APXGame.toast("Vụ án thiếu hàm đánh giá kết quả.", "warning");
    }
    if (!state.career || !state.career.activeJob || state.career.activeJob.type !== "lawyer" ||
        !window.APXCareer || typeof window.APXCareer.finishLawyerCase !== "function") {
      return window.APXGame.toast("Hãy bắt đầu ca Luật sư trong Công việc hiện tại trước khi bàn giao hồ sơ.", "warning");
    }

    var research = researchScore(caseData, progress);
    var assessedStats = Object.assign({}, progress.stats, {
      evidence: (Number(progress.stats.evidence) || 0) + (hasInvestigation ? 0 : research.evidencePoints),
      legalAnalysis: (Number(progress.stats.legalAnalysis) || 0) + (hasInvestigation ? 0 : research.lawPoints)
    });
    if (Number(caseData.evidenceCountBonusPerItem) > 0) {
      assessedStats.evidenceCountScore = Math.min(
        100,
        progress.unlockedEvidence.length * Number(caseData.evidenceCountBonusPerItem)
      );
    }
    if (hasInvestigation) assessedStats.procedure = Math.min(100, progress.completedInvestigationActions.length * 5);
    if (finalArgument) {
      Object.keys(finalArgument.effects || {}).forEach(function (key) {
        assessedStats[key] = (Number(assessedStats[key]) || 0) + Number(finalArgument.effects[key]);
      });
    }
    selectedDefense.forEach(function (argument) {
      Object.keys(argument.effects || {}).forEach(function (key) {
        assessedStats[key] = (Number(assessedStats[key]) || 0) + Number(argument.effects[key]);
      });
    });
    var idealDefenseCount = selectedDefense.filter(function (argument) {
      return finalDefense && (finalDefense.idealCombination || []).indexOf(argument.id) >= 0;
    }).length;
    var selectionScoring = finalDefense && finalDefense.selectionScoring;
    if (finalDefense && !selectionScoring && Number(finalDefense.idealBonus) > 0) {
      assessedStats.argument = (Number(assessedStats.argument) || 0) +
        idealDefenseCount * Number(finalDefense.idealBonus);
    }
    var score = caseData.calculateScore(assessedStats);
    var defenseAdjustment = 0;
    if (selectionScoring) {
      selectedDefense.forEach(function (argument) {
        if ((selectionScoring.positiveIds || []).indexOf(argument.id) >= 0) {
          defenseAdjustment += Number(selectionScoring.positiveBonus) || 0;
        } else if ((selectionScoring.negativeIds || []).indexOf(argument.id) >= 0) {
          defenseAdjustment -= Number(selectionScoring.negativePenalty) || 0;
        } else if ((selectionScoring.neutralIds || []).indexOf(argument.id) >= 0) {
          defenseAdjustment += Number(selectionScoring.neutralBonus) || 0;
        }
      });
    }
    (caseData.completionBonuses || []).forEach(function (bonus) {
      if ((bonus.evidenceIds || []).every(function (actionId) {
        return progress.completedInvestigationActions.indexOf(actionId) >= 0;
      })) defenseAdjustment += Number(bonus.points) || 0;
    });
    if (selectionScoring || (caseData.completionBonuses || []).length) {
      score = Math.round(Math.max(0, Math.min(100, score + defenseAdjustment)));
    }
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
      finalArgument: finalArgument ? {
        id: finalArgument.id,
        title: finalArgument.title,
        rationale: finalArgument.rationale,
        tradeoff: finalArgument.tradeoff
      } : null,
      finalDefense: selectedDefense.map(function (argument) {
        return { id: argument.id, text: argument.text, tags: argument.tags || [] };
      }),
      finalDefenseIdealCount: idealDefenseCount,
      finalDefenseScoreAdjustment: defenseAdjustment,
      reward: finalReward,
      rewardStatus: finalReward > 0 ? "pending" : "paid",
      xp: Math.max(0, Number(caseData.meta.exp) || 0),
      salary: 0,
      reputationChange: reputationChange,
      strengths: analysis.positive,
      weaknesses: analysis.negative,
      evidence: evidenceSummary,
      legalBasis: lawSummary,
      research: {
        evidenceReviewed: evidenceSummary.filter(function (item) { return item.reviewed; }).length,
        lawsRead: lawSummary.length,
        evidencePoints: research.evidencePoints,
        lawPoints: research.lawPoints
      },
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
      var standalone = Boolean(caseData.standaloneUrl);
      var embedded = Boolean(caseData.embeddedUrl);
      var issue = standalone || embedded ? "" : validateCase(caseData);
      var progress = lawyer.cases[caseData.id];
      var status = embedded ? "Trong game" : standalone ? "Hồ sơ gốc" : progress && progress.status === "completed" ? "Hoàn thành" : progress ? "Đang làm" : "Chưa làm";
      var blocked = !standalone && lawyer.activeCaseId && lawyer.activeCaseId !== caseData.id && !progress;
      var action = progress && progress.status === "completed" ? "result" : "start";
      var label = embedded ? "CHƠI VỤ ÁN →" : standalone ? "MỞ MINI-GAME GỐC →" : progress && progress.status === "completed" ? "Xem kết quả" : progress ? "Tiếp tục hồ sơ" : "Nhận vụ án";
      if (!standalone && !embedded && !employedAsLawyer && !progress) label = "Nhận việc Luật sư để mở";
      return '<article class="panel lawyer-case-card"><div class="lawyer-case-card-top"><span class="lawyer-case-icon" aria-hidden="true">⚖️</span><span class="lawyer-case-status">' + escapeHTML(status) + '</span></div>' +
        '<span class="eyebrow">VỤ ÁN ' + String(data.indexOf(caseData) + 1).padStart(2, "0") + '</span>' +
        '<span class="eyebrow">' + escapeHTML(caseData.meta.category || "Vụ án") + ' · ' + escapeHTML(caseData.id) + '</span><h2>' + escapeHTML(caseData.meta.title) + '</h2>' +
        '<div class="lawyer-case-meta"><span>Độ khó<strong>' + escapeHTML(caseData.meta.difficulty || "—") + '</strong></span><span>Thù lao hồ sơ<strong>' + money(caseData.meta.reward) + '</strong></span><span>EXP<strong>+' + escapeHTML(caseData.meta.exp || 0) + '</strong></span></div>' +
        (issue ? '<p class="lawyer-case-error">' + escapeHTML(issue) + '</p>' : '') +
        (embedded
          ? '<button class="button button-gold" type="button" data-law-case-action="open-embedded" data-case-id="' + escapeHTML(caseData.id) + '">' + escapeHTML(label) + '</button>'
          : standalone
          ? '<a class="button button-gold" href="' + escapeHTML(caseData.standaloneUrl) + '" target="_blank" rel="noopener">' + escapeHTML(label) + '</a>'
          : '<button class="button button-gold" type="button" data-law-case-action="' + action + '" data-case-id="' + escapeHTML(caseData.id) + '"' + (issue || blocked || (!employedAsLawyer && (!progress || progress.status !== "completed")) ? " disabled" : "") + '>' + escapeHTML(blocked ? "Hoàn tất hồ sơ đang mở trước" : label) + '</button>') +
        '</article>';
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

  function missingResearch(caseData, progress, choice) {
    if (!Array.isArray(progress.openedEvidence)) progress.openedEvidence = [];
    if (!Array.isArray(progress.readLaws)) progress.readLaws = [];
    var missing = [];
    (choice.requiresEvidence || []).forEach(function (id) {
      if (progress.openedEvidence.indexOf(id) < 0) {
        var evidence = (caseData.evidence || []).find(function (item) { return item.id === id; });
        missing.push(evidence ? evidence.title : id);
      }
    });
    (choice.requiresLaw || []).forEach(function (id) {
      if (progress.readLaws.indexOf(id) < 0) {
        var law = (caseData.legalLibrary || []).find(function (item) { return item.id === id; });
        missing.push(law ? law.title : id);
      }
    });
    return missing;
  }

  function refreshResearchChoices(caseData, progress) {
    var question = caseData.questions[progress.currentQuestion];
    if (!question) return;
    Array.prototype.forEach.call(document.querySelectorAll('[data-law-case-choice]'), function (button) {
      if (button.dataset.caseId !== caseData.id || button.dataset.questionId !== question.id) return;
      var choice = question.choices.find(function (item) { return item.id === button.dataset.choiceId; });
      if (!choice) return;
      var missing = missingResearch(caseData, progress, choice);
      button.disabled = Boolean(progress.answers[question.id]);
      button.classList.toggle("is-research-locked", missing.length > 0);
      button.title = missing.length ? "Hãy đọc căn cứ trước: " + missing.join(" · ") : "";
      var hint = document.querySelector('[data-law-case-research="' + button.dataset.choiceId + '"]');
      if (hint) hint.textContent = missing.length ? "Cần đọc: " + missing.join(" · ") : "";
    });
  }

  function refreshFinalDefenseChoices(caseData, progress) {
    if (!caseData.finalDefense) return;
    var selectedIds = progress.selectedFinalDefenseIds || [];
    Array.prototype.forEach.call(document.querySelectorAll('[data-law-case-action="choose-defense"]'), function (button) {
      if (button.dataset.caseId !== caseData.id) return;
      var argument = caseData.finalDefense.arguments.find(function (item) {
        return item.id === button.dataset.argumentId;
      });
      if (!argument) return;
      var selected = selectedIds.indexOf(argument.id) >= 0;
      var missing = missingResearch(caseData, progress, argument);
      button.disabled = missing.length > 0 ||
        (!selected && selectedIds.length >= Number(caseData.finalDefense.selectionLimit));
      var hint = button.parentElement.querySelector("[data-law-case-defense-research]");
      if (hint) hint.textContent = missing.length ? "Cần đọc: " + missing.join(" · ") : "";
    });
  }

  function renderInvestigationStage(caseData, progress) {
    if (progress.phase === "defense") return renderFinalDefense(caseData, progress);
    var actionCount = progress.completedInvestigationActions.length;
    var pendingEvent = caseData.investigationEvents.find(function (event) {
      return !progress.investigationEventChoices[event.id] &&
        actionCount >= Number(event.triggerActions || 2);
    });
    var actions = caseData.investigationActions.map(function (action) {
      var used = progress.completedInvestigationActions.indexOf(action.id) >= 0;
      var blocked = Boolean(pendingEvent) || progress.investigationTurnsRemaining < Number(action.cost);
      return '<button class="lawyer-case-choice lawyer-investigation-action" type="button" data-law-case-action="investigate" data-case-id="' +
        escapeHTML(caseData.id) + '" data-investigation-id="' + escapeHTML(action.id) + '"' +
        (used || blocked ? ' disabled' : '') + '><strong>' + escapeHTML(action.title) +
        '</strong><span>' + escapeHTML(action.description || "") + ' · ' + escapeHTML(action.cost) +
        ' lượt</span></button>';
    }).join("");
    var eventHtml = pendingEvent
      ? '<div class="lawyer-investigation-overlay"><section class="lawyer-investigation-event"><span class="eyebrow">⚠ TÌNH TIẾT BẤT NGỜ</span><h4>' +
        escapeHTML(pendingEvent.title) + '</h4><p>' + escapeHTML(pendingEvent.text) + '</p><div class="lawyer-case-choices">' +
        pendingEvent.choices.map(function (choice) {
          return '<button class="lawyer-case-choice" type="button" data-law-case-action="investigation-event" data-case-id="' +
            escapeHTML(caseData.id) + '" data-event-id="' + escapeHTML(pendingEvent.id) + '" data-choice-id="' +
            escapeHTML(choice.id) + '"><strong>' + escapeHTML(choice.text) + '</strong></button>';
        }).join("") + '</div></section></div>'
      : "";
    var discoveries = progress.discoveries.length
      ? '<ul>' + progress.discoveries.map(function (item) { return '<li>' + escapeHTML(item) + '</li>'; }).join("") + '</ul>'
      : '<p class="lawyer-case-muted">Chưa phát hiện tình tiết đáng chú ý.</p>';
    var enoughEvidence = progress.unlockedEvidence.length >= Number(caseData.minimumEvidence || 3);
    return '<section class="lawyer-case-section"><span class="eyebrow">ĐIỀU TRA VỤ ÁN</span><h3>Phòng điều tra hồ sơ</h3>' +
      '<p>' + escapeHTML(caseData.investigationInstruction || "Chọn hành động điều tra; mỗi hành động chỉ thực hiện một lần và tiêu tốn lượt.") +
      '</p><div class="lawyer-investigation-progress"><strong>Còn ' + progress.investigationTurnsRemaining + ' lượt điều tra</strong><span>' +
      progress.unlockedEvidence.length + ' chứng cứ · ' + actionCount + '/' + caseData.investigationActions.length + ' hành động</span></div>' +
      '<div class="lawyer-case-progress-track"><i style="width:' + Math.max(0, Math.min(100,
        progress.investigationTurnsRemaining / Math.max(1, Number(caseData.investigationTurns) || 8) * 100)) + '%"></i></div>' +
      '<h4>🔎 Hành động điều tra</h4><div class="lawyer-case-choices">' + actions + '</div>' + eventHtml +
      '<h4>Tình tiết đã phát hiện</h4>' + discoveries +
      '<button class="button button-gold" type="button" data-law-case-action="close-investigation" data-case-id="' +
        escapeHTML(caseData.id) + '"' + (!enoughEvidence || pendingEvent ? ' disabled' : '') + '>ĐÓNG HỒ SƠ ĐIỀU TRA →</button></section>';
  }

  function researchScore(caseData, progress) {
    if (!Array.isArray(progress.openedEvidence)) progress.openedEvidence = [];
    if (!Array.isArray(progress.readLaws)) progress.readLaws = [];
    var evidencePoints = 0;
    (caseData.evidence || []).forEach(function (item) {
      if (progress.openedEvidence.indexOf(item.id) < 0) return;
      evidencePoints += item.importance === "critical" ? 4 : item.importance === "high" ? 3 : 1;
    });
    return {
      evidencePoints: Math.min(18, evidencePoints),
      lawPoints: Math.min(12, progress.readLaws.length * 3)
    };
  }

  function renderQuestion(caseData, progress) {
    var question = caseData.questions[progress.currentQuestion];
    if (!question) return '<p class="lawyer-case-error">Không tìm thấy tình huống tiếp theo trong hồ sơ.</p>';
    var selected = caseData.confirmAnswers
      ? progress.pendingAnswers[question.id] || progress.answers[question.id]
      : progress.answers[question.id];
    var answered = Boolean(progress.answers[question.id]);
    var choices = question.choices.map(function (choice, index) {
      var letter = String.fromCharCode(65 + index);
      var missing = missingResearch(caseData, progress, choice);
      return '<div class="lawyer-case-choice-option"><button class="lawyer-case-choice' + (selected === choice.id ? ' is-selected' : '') + (missing.length ? ' is-research-locked' : '') + '" type="button" data-law-case-action="choose" data-law-case-choice data-case-id="' + escapeHTML(caseData.id) + '" data-question-id="' + escapeHTML(question.id) + '" data-choice-id="' + escapeHTML(choice.id) + '"' + (answered ? " disabled" : "") + (missing.length ? ' title="Hãy đọc căn cứ trước: ' + escapeHTML(missing.join(" · ")) + '"' : "") + '><span>' + letter + '</span><strong>' + escapeHTML(choice.text) + '</strong></button><small class="lawyer-case-research-hint" data-law-case-research="' + escapeHTML(choice.id) + '">' + (missing.length ? "Cần đọc: " + escapeHTML(missing.join(" · ")) : "") + '</small></div>';
    }).join("");
    var last = progress.currentQuestion === caseData.questions.length - 1;
    var nextAction = caseData.confirmAnswers && !answered
      ? '<p class="lawyer-case-muted">Bạn có thể đổi đáp án trước khi xác nhận.</p><button class="button button-gold" type="button" data-law-case-action="confirm-answer" data-case-id="' + escapeHTML(caseData.id) + '" data-question-id="' + escapeHTML(question.id) + '"' + (!selected ? " disabled" : "") + '>XÁC NHẬN ĐÁP ÁN VÀ TIẾP TỤC →</button>'
      : last && selected && caseData.finalDefense
      ? renderFinalDefense(caseData, progress)
      : last && selected && progress.mechanicsVersion >= 2 && caseData.finalArguments.length
        ? renderFinalArguments(caseData, progress)
        : last
          ? '<button class="button button-gold" type="button" data-law-case-action="finish" data-case-id="' + escapeHTML(caseData.id) + '"' + (!selected ? " disabled" : "") + '>KẾT THÚC VỤ ÁN</button>'
          : '<p class="lawyer-case-muted">Chọn một hướng xử lý để mở tình tiết tiếp theo.</p>';
    return '<article class="lawyer-case-analysis"><span class="eyebrow">PHÂN TÍCH · TÌNH HUỐNG ' + (progress.currentQuestion + 1) + '/' + caseData.questions.length + '</span><h3>' + escapeHTML(question.title) + '</h3><p>' + escapeHTML(question.situation) + '</p><div class="lawyer-case-choices">' + choices + '</div>' + nextAction + '</article>';
  }

  function renderFinalDefense(caseData, progress) {
    var defense = caseData.finalDefense;
    var selectedIds = progress.selectedFinalDefenseIds || [];
    var options = defense.arguments.map(function (argument) {
      var selected = selectedIds.indexOf(argument.id) >= 0;
      var missing = missingResearch(caseData, progress, argument);
      var sources = [].concat(argument.requiresEvidence || [], argument.requiresLaw || []).map(function (id) {
        var evidence = caseData.evidence.find(function (item) { return item.id === id; });
        var law = caseData.legalLibrary.find(function (item) { return item.id === id; });
        return evidence ? evidence.title : law ? law.title : id;
      });
      return '<article class="lawyer-final-argument' + (selected ? ' is-selected' : '') + '">' +
        '<button class="lawyer-case-choice lawyer-final-argument-choice" type="button" data-law-case-action="choose-defense" data-case-id="' +
          escapeHTML(caseData.id) + '" data-argument-id="' + escapeHTML(argument.id) + '"' +
          (missing.length || (!selected && selectedIds.length >= Number(defense.selectionLimit)) ? ' disabled' : '') +
          (selected ? ' aria-pressed="true"' : ' aria-pressed="false"') + '>' +
          '<strong>' + escapeHTML(argument.text) + '</strong><span>' +
          (argument.tags || []).map(escapeHTML).join(' · ') + '</span></button>' +
        (missing.length ? '<small data-law-case-defense-research>Cần đọc: ' + escapeHTML(missing.join(' · ')) + '</small>' : '') +
        (sources.length ? '<small>Căn cứ: ' + escapeHTML(sources.join(' · ')) + '</small>' : '') + '</article>';
    }).join("");
    var minimumSelection = Number(defense.minimumSelection == null ? defense.selectionLimit : defense.minimumSelection);
    var complete = selectedIds.length >= minimumSelection &&
      selectedIds.length <= Number(defense.selectionLimit);
    return '<section class="lawyer-final-arguments"><span class="eyebrow">BIỆN HỘ CUỐI · TỰ XÂY DỰNG HỒ SƠ</span>' +
      '<h3>' + escapeHTML(defense.title || "Chọn luận điểm") + '</h3>' +
      '<p>' + escapeHTML(defense.instruction || ("Chọn " + defense.selectionLimit + " luận điểm; hãy ưu tiên căn cứ phù hợp và xử lý cả điểm bất lợi.")) + '</p>' +
      '<div class="lawyer-final-argument-list">' + options + '</div>' +
      '<button class="button button-gold" type="button" data-law-case-action="finish" data-case-id="' +
        escapeHTML(caseData.id) + '"' + (!complete ? ' disabled' : '') + '>KẾT THÚC VỤ ÁN</button>' +
      (caseData.investigationActions.length
        ? '<button class="button" type="button" data-law-case-action="reopen-investigation" data-case-id="' +
          escapeHTML(caseData.id) + '">← QUAY LẠI ĐIỀU TRA VÀ MỞ CHỨNG CỨ</button>'
        : '') + '</section>';
  }

  function renderFinalArguments(caseData, progress) {
    var options = caseData.finalArguments.map(function (argument) {
      var selected = progress.finalArgumentId === argument.id;
      var missing = missingResearch(caseData, progress, argument);
      var sources = [].concat(argument.requiresEvidence || [], argument.requiresLaw || []).map(function (id) {
        var evidence = caseData.evidence.find(function (item) { return item.id === id; });
        var law = caseData.legalLibrary.find(function (item) { return item.id === id; });
        return evidence ? evidence.title : law ? law.title : id;
      });
      return '<article class="lawyer-final-argument' + (selected ? ' is-selected' : '') + '">' +
        '<button class="lawyer-case-choice lawyer-final-argument-choice" type="button" data-law-case-action="choose-argument" data-case-id="' +
          escapeHTML(caseData.id) + '" data-argument-id="' + escapeHTML(argument.id) + '"' +
          (missing.length ? ' disabled' : '') + (selected ? ' aria-pressed="true"' : ' aria-pressed="false"') + '>' +
          '<strong>' + escapeHTML(argument.title) + '</strong><span>' + escapeHTML(argument.rationale) + '</span></button>' +
        '<p><strong>Đánh đổi:</strong> ' + escapeHTML(argument.tradeoff) + '</p>' +
        '<small>' + (sources.length ? 'Căn cứ: ' + escapeHTML(sources.join(' · ')) : 'Không yêu cầu nguồn bổ sung') +
          (missing.length ? ' · Cần mở: ' + escapeHTML(missing.join(' · ')) : '') + '</small></article>';
    }).join("");
    return '<section class="lawyer-final-arguments"><span class="eyebrow">BƯỚC CUỐI · CHỌN CHIẾN LƯỢC</span>' +
      '<h3>Không có phương án nào thắng mọi mặt</h3>' +
      '<p>Chỉ chọn được phương án có đủ chứng cứ và căn cứ đã đọc. Quyết định này tác động trực tiếp đến điểm phân tích.</p>' +
      '<div class="lawyer-final-argument-list">' + options + '</div>' +
      '<button class="button button-gold" type="button" data-law-case-action="finish" data-case-id="' +
        escapeHTML(caseData.id) + '"' + (!progress.finalArgumentId ? ' disabled' : '') + '>BÀN GIAO LẬP LUẬN CUỐI</button></section>';
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
      '<section class="lawyer-case-section"><h3>' + (caseData.investigationActions.length ? "Điều tra và xây dựng hồ sơ" : "Phân tích vụ án") +
      '</h3><p class="lawyer-case-guidance">' + (caseData.investigationActions.length
        ? "Điều tra có giới hạn lượt. Đọc chứng cứ trước khi chọn luận điểm cuối."
        : "Một số quyết định chỉ khả dụng khi đã mở đúng chứng cứ và căn cứ luật. Nguồn được kiểm tra cũng cải thiện điểm phân tích cuối vụ.") +
      '</p>' + (caseData.investigationActions.length
        ? renderInvestigationStage(caseData, progress)
        : renderQuestion(caseData, progress)) + '</section></div></section>';
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
      (result.finalArgument ? '<section class="lawyer-case-review"><h3>Chiến lược đã chọn: ' + escapeHTML(result.finalArgument.title) + '</h3><p>' + escapeHTML(result.finalArgument.rationale) + '</p><small>Đánh đổi: ' + escapeHTML(result.finalArgument.tradeoff) + '</small></section>' : '') +
      (Array.isArray(result.finalDefense) && result.finalDefense.length ? '<section class="lawyer-case-review"><h3>Luận điểm đã chọn</h3><ul>' + result.finalDefense.map(function (argument) {
        return '<li>' + escapeHTML(argument.text) + '</li>';
      }).join("") + '</ul><p>Luận điểm nền tảng được củng cố: ' + Number(result.finalDefenseIdealCount || 0) + '/' + result.finalDefense.length + '.</p></section>' : '') +
      '<section class="lawyer-case-review"><h3>Nghiên cứu ảnh hưởng đến kết quả</h3><p>Đã mở ' + Number(result.research && result.research.evidenceReviewed || 0) + ' chứng cứ và tham khảo ' + Number(result.research && result.research.lawsRead || 0) + ' căn cứ pháp lý.</p></section>' +
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
    migrateProgress(caseData, progress);
    var caseProgressLabel = caseData.investigationActions.length
      ? progress.phase === "defense"
        ? "Giai đoạn biện hộ cuối"
        : progress.phase === "meeting"
          ? "Gặp khách hàng"
          : progress.phase === "intro"
            ? "Tiếp nhận hồ sơ"
            : "Điều tra · còn " + progress.investigationTurnsRemaining + " lượt"
      : "Tiến độ tình huống " + (progress.currentQuestion + 1) + "/" + caseData.questions.length;
    return '<header class="page-heading"><span class="eyebrow">CA LÀM · LUẬT SƯ</span><h1>' + escapeHTML(caseData.meta.title) + '</h1><p>Đọc hồ sơ, xem chứng cứ và xử lý các tình huống để bàn giao ca.</p></header>' +
      '<section class="panel lawyer-case-career"><span>⚖️ ' + escapeHTML(state.career.activeJob.employer) + '</span><span>' + escapeHTML(caseProgressLabel) + '</span><span>Hồ sơ đang làm</span></section>' +
      (caseData.id === "CASE_006"
        ? renderCase006Workspace(caseData, progress)
        : caseData.id === "CASE_007"
          ? renderLegacyInvestigationWorkspace(caseData, progress)
          : caseData.id === "CASE_009"
            ? renderLegacyInvestigationWorkspace(caseData, progress)
          : caseData.id === "CASE_008"
            ? renderCase008Workspace(caseData, progress)
            : renderWorkspace(caseData, progress));
  }

  function renderCase008Workspace(caseData, progress) {
    var body;
    if (progress.phase === "intro") {
      body = '<section class="lawyer-case-section"><span class="eyebrow">HỒ SƠ VỤ ÁN</span><h3>' +
        escapeHTML(caseData.meta.title) + '</h3><p>' + escapeHTML(caseData.description) +
        '</p><div class="lawyer-case-parties"><div><small>Khách hàng</small><strong>' +
        escapeHTML(caseData.client.name) + '</strong><span>' + escapeHTML(caseData.client.occupation) +
        '</span></div><div><small>Đối phương</small><strong>' + escapeHTML(caseData.opponent.name) +
        '</strong><span>' + escapeHTML(caseData.opponent.occupation) + '</span></div></div>' +
        '<button class="button button-gold" type="button" data-law-case-action="case008-start-meeting" data-case-id="CASE_008">NHẬN VỤ ÁN →</button></section>';
    } else if (progress.phase === "meeting") {
      var dialogue = (caseData.meetingDialogue || []).map(function (line) {
        return '<div class="lawyer-case-dialogue' + (line.speaker === "Bạn" ? ' is-lawyer' : '') +
          '"><strong>' + escapeHTML(line.speaker) + '</strong><p>' + escapeHTML(line.text) + '</p></div>';
      }).join("");
      var asked = progress.meetingQuestionsAsked || [];
      var questions = (caseData.meetingQuestions || []).map(function (question) {
        return '<button class="lawyer-case-choice lawyer-case-meeting-choice" type="button" data-law-case-action="case008-ask" data-case-id="CASE_008" data-meeting-question="' +
          escapeHTML(question.id) + '"' + (asked.indexOf(question.id) >= 0 ? ' disabled' : '') +
          '><strong>' + escapeHTML(question.title) + '</strong><span>' + escapeHTML(question.quote) + '</span></button>';
      }).join("");
      var responses = (progress.meetingResponses || []).map(function (response) {
        return '<div class="lawyer-case-meeting-note"><strong>Thông tin mới</strong><p>' +
          escapeHTML(response) + '</p></div>';
      }).join("");
      body = '<div class="lawyer-case-columns"><section class="lawyer-case-section"><span class="eyebrow">GẶP KHÁCH HÀNG · 18:40</span>' +
        '<h3>Văn phòng luật sư</h3>' + dialogue + responses + '<div class="lawyer-case-choices">' + questions +
        '</div><button class="button button-gold" type="button" data-law-case-action="case008-start-investigation" data-case-id="CASE_008">📂 NHẬN HỒ SƠ VÀ BẮT ĐẦU ĐIỀU TRA</button></section>' +
        '<aside class="lawyer-case-section"><h3>📋 Ghi chú ban đầu</h3><ul>' +
        (caseData.meetingNotes || []).map(function (note) { return '<li>' + escapeHTML(note) + '</li>'; }).join("") +
        '</ul></aside></div>';
    } else if (progress.phase === "investigation") {
      var timeline = (caseData.timeline || []).map(function (item) {
        return '<li><time>' + escapeHTML(item.date) + '</time><div><strong>' +
          escapeHTML(item.title) + '</strong><p>' + escapeHTML(item.content) + '</p></div></li>';
      }).join("");
      body = '<div class="lawyer-case-columns"><main>' +
        '<section class="lawyer-case-section"><span class="eyebrow">ĐIỀU TRA VỤ ÁN</span><h3>Phòng điều tra hồ sơ</h3><p>' +
        escapeHTML(caseData.investigationInstruction) + '<strong> Còn ' +
        progress.investigationTurnsRemaining + ' lượt điều tra</strong></p>' +
        renderInvestigationStage(caseData, progress) + '</section></main>' +
        '<aside class="lawyer-case-column"><section class="lawyer-case-section"><h3>📁 Chứng cứ</h3>' +
        '<p class="lawyer-case-muted">Bấm vào từng tài liệu để đọc toàn bộ nội dung.</p>' +
        renderEvidence(caseData, progress) + '</section><section class="lawyer-case-section"><h3>🕒 Dòng thời gian</h3>' +
        '<ol class="lawyer-case-timeline">' + timeline + '</ol></section>' +
        '<section class="lawyer-case-section"><h3>🧩 Tình tiết đã phát hiện</h3>' +
        (progress.discoveries.length
          ? '<ul>' + progress.discoveries.map(function (item) { return '<li>' + escapeHTML(item) + '</li>'; }).join("") + '</ul>'
          : '<p class="lawyer-case-muted">Chưa phát hiện tình tiết đáng chú ý.</p>') +
        '</section></aside></div>';
    } else {
      body = renderFinalDefense(caseData, progress);
    }
    return '<section class="panel lawyer-case-workspace"><div class="lawyer-case-workspace-head"><div><span class="eyebrow">VỤ ÁN 08 · CA LÀM · NGÀY GAME ' +
      progress.startedDay + '</span><h2>' + escapeHTML(caseData.meta.title) +
      '</h2></div><span class="lawyer-case-badge">Luật sư</span></div>' + body + '</section>';
  }

  function renderLegacyInvestigationWorkspace(caseData, progress) {
    var body;
    if (progress.phase === "intro") {
      body = '<section class="lawyer-case-section"><span class="eyebrow">HỒ SƠ VỤ ÁN</span><h3>' +
        escapeHTML(caseData.meta.title) + '</h3><p>' + escapeHTML(caseData.description) +
        '</p><div class="lawyer-case-parties"><div><small>Khách hàng</small><strong>' +
        escapeHTML(caseData.client.name) + '</strong><span>' + escapeHTML(caseData.client.occupation) +
        '</span></div><div><small>Đối phương</small><strong>' + escapeHTML(caseData.opponent.name) +
        '</strong><span>' + escapeHTML(caseData.opponent.occupation) + '</span></div></div>' +
        '<button class="button button-gold" type="button" data-law-case-action="legacy-case-start-meeting" data-case-id="' + escapeHTML(caseData.id) + '">NHẬN VỤ ÁN →</button></section>';
    } else if (progress.phase === "meeting") {
      var dialogue = (caseData.meetingDialogue || []).map(function (line) {
        return '<div class="lawyer-case-dialogue' + (line.speaker === "Bạn" ? ' is-lawyer' : '') +
          '"><strong>' + escapeHTML(line.speaker) + '</strong><p>' + escapeHTML(line.text) + '</p></div>';
      }).join("");
      var asked = progress.meetingQuestionsAsked || [];
      var questions = (caseData.meetingQuestions || []).map(function (question) {
        return '<button class="lawyer-case-choice lawyer-case-meeting-choice" type="button" data-law-case-action="legacy-case-ask" data-case-id="' + escapeHTML(caseData.id) + '" data-meeting-question="' +
          escapeHTML(question.id) + '"' + (asked.indexOf(question.id) >= 0 ? ' disabled' : '') +
          '><strong>' + escapeHTML(question.title) + '</strong><span>' + escapeHTML(question.quote) + '</span></button>';
      }).join("");
      var responses = (progress.meetingResponses || []).map(function (response) {
        return '<div class="lawyer-case-meeting-note"><strong>Thông tin mới</strong><p>' +
          escapeHTML(response) + '</p></div>';
      }).join("");
      body = '<div class="lawyer-case-columns"><section class="lawyer-case-section"><span class="eyebrow">GẶP KHÁCH HÀNG · 19:10</span>' +
        '<h3>Văn phòng luật sư</h3>' + dialogue + responses + '<div class="lawyer-case-choices">' + questions +
        '</div><button class="button button-gold" type="button" data-law-case-action="legacy-case-start-investigation" data-case-id="' + escapeHTML(caseData.id) + '">📂 NHẬN HỒ SƠ VÀ BẮT ĐẦU ĐIỀU TRA</button></section>' +
        '<aside class="lawyer-case-section"><h3>📋 Ghi chú ban đầu</h3><ul>' +
        (caseData.meetingNotes || []).map(function (note) { return '<li>' + escapeHTML(note) + '</li>'; }).join("") +
        '</ul></aside></div>';
    } else if (progress.phase === "investigation") {
      var timeline = (caseData.timeline || []).map(function (item) {
        return '<li><time>' + escapeHTML(item.date) + '</time><div><strong>' +
          escapeHTML(item.title) + '</strong><p>' + escapeHTML(item.content) + '</p></div></li>';
      }).join("");
      body = '<div class="lawyer-case-columns"><main>' +
        '<section class="lawyer-case-section"><span class="eyebrow">ĐIỀU TRA VỤ ÁN</span><h3>Phòng điều tra hồ sơ</h3><p>' +
        escapeHTML(caseData.investigationInstruction) + '<strong> Còn ' +
        progress.investigationTurnsRemaining + ' lượt điều tra</strong></p>' +
        renderInvestigationStage(caseData, progress) + '</section></main>' +
        '<aside class="lawyer-case-column"><section class="lawyer-case-section"><h3>📁 Chứng cứ</h3>' +
        '<p class="lawyer-case-muted">Bấm vào từng tài liệu để đọc toàn bộ nội dung.</p>' +
        renderEvidence(caseData, progress) + '</section><section class="lawyer-case-section"><h3>🕒 Dòng thời gian</h3>' +
        '<ol class="lawyer-case-timeline">' + timeline + '</ol></section>' +
        '<section class="lawyer-case-section"><div class="lawyer-case-discoveries"><h3>🧩 Tình tiết đã phát hiện</h3>' +
        (progress.discoveries.length
          ? '<ul>' + progress.discoveries.map(function (item) { return '<li>' + escapeHTML(item) + '</li>'; }).join("") + '</ul>'
          : '<p class="lawyer-case-muted">Chưa phát hiện tình tiết đáng chú ý.</p>') +
        '</div></section></aside></div>';
    } else {
      body = renderFinalDefense(caseData, progress);
    }
    return '<section class="panel lawyer-case-workspace"><div class="lawyer-case-workspace-head"><div><span class="eyebrow">VỤ ÁN ' + escapeHTML(caseData.id.slice(-2)) + ' · CA LÀM · NGÀY GAME ' +
      progress.startedDay + '</span><h2>' + escapeHTML(caseData.meta.title) +
      '</h2></div><span class="lawyer-case-badge">Luật sư</span></div>' + body + '</section>';
  }

  function renderCase006Workspace(caseData, progress) {
    var body = "";
    if (progress.phase === "intro") {
      body = '<section class="lawyer-case-section"><span class="eyebrow">HỒ SƠ MỚI</span><h3>' +
        escapeHTML(caseData.meta.title) + '</h3><p>' + escapeHTML(caseData.description) +
        '</p><div class="lawyer-case-parties"><div><small>Khách hàng</small><strong>Nguyễn Hoài Nam</strong><span>Người yêu cầu bồi thường</span></div><div><small>Người liên quan</small><strong>Lê Văn Thành</strong><span>Người điều khiển xe</span></div></div>' +
        '<button class="button button-gold" type="button" data-law-case-action="case006-meeting" data-case-id="CASE_006">GẶP KHÁCH HÀNG →</button></section>';
    } else if (progress.phase === "meeting") {
      var dialogue = (caseData.meetingDialogue || []).map(function (line) {
        return '<div class="lawyer-case-dialogue' + (line.speaker === "Bạn" ? ' is-lawyer' : '') +
          '"><strong>' + escapeHTML(line.speaker) + '</strong><p>' + escapeHTML(line.text) + '</p></div>';
      }).join("");
      var asked = progress.meetingQuestionsAsked || [];
      var answers = [
        { id: "timeline", title: "Hỏi kỹ dòng thời gian", quote: "Anh nhớ mình đã đi ở đâu, lúc nào?", answer: "Nam nói thêm: “Tôi vừa rời thang máy. Tôi không nhớ chính xác mình đi ở làn nào.”" },
        { id: "hidden", title: "Hỏi: “Còn điều gì anh chưa kể?”", quote: "Kiểm tra xem khách hàng có bỏ sót thông tin.", answer: "Nam im lặng rồi nói: “Tôi có thấy một người quen gần lối ra, nhưng tôi nghĩ chuyện đó không liên quan.”" }
      ];
      body = '<div class="lawyer-case-columns"><section class="lawyer-case-section"><span class="eyebrow">BUỔI GẶP KHÁCH HÀNG</span><h3>Trao đổi với Nguyễn Hoài Nam</h3>' +
        dialogue + (progress.meetingResponses || []).map(function (item) {
          return '<div class="lawyer-case-meeting-note"><strong>Thông tin mới</strong><p>' + escapeHTML(item) + '</p></div>';
        }).join("") + '<div class="lawyer-case-choices">' + answers.map(function (item) {
          return '<button class="lawyer-case-choice lawyer-case-meeting-choice" type="button" data-law-case-action="case006-ask" data-case-id="CASE_006" data-meeting-question="' +
            item.id + '"' + (asked.indexOf(item.id) >= 0 ? ' disabled' : '') + '><strong>' + escapeHTML(item.title) +
            '</strong><span>' + escapeHTML(item.quote) + '</span></button>';
        }).join("") + '</div><button class="button button-gold" type="button" data-law-case-action="case006-start-investigation" data-case-id="CASE_006">📂 NHẬN HỒ SƠ VÀ BẮT ĐẦU ĐIỀU TRA</button></section>' +
        '<aside class="lawyer-case-section"><h3>Ghi chú ban đầu</h3><ul>' + (caseData.meetingNotes || []).map(function (note) {
          return '<li>' + escapeHTML(note) + '</li>';
        }).join("") + '</ul></aside></div>';
    } else if (progress.phase === "investigation") {
      var unlocked = (caseData.evidence || []).filter(function (item) {
        return progress.unlockedEvidence.indexOf(item.id) >= 0;
      });
      var timeline = (caseData.timeline || []).map(function (item) {
        return '<li><time>' + escapeHTML(item.date) + '</time><div><strong>' + escapeHTML(item.title) +
          '</strong><p>' + escapeHTML(item.content) + '</p></div></li>';
      }).join("");
      var evidence = unlocked.length ? unlocked.map(function (item) {
        return '<button class="lawyer-case-document-button" type="button" data-law-case-action="case006-open-evidence" data-case-id="CASE_006" data-evidence-id="' +
          escapeHTML(item.id) + '"><strong>' + escapeHTML(item.icon || "📄") + ' ' + escapeHTML(item.id) + ' · ' + escapeHTML(item.title) +
          '</strong><small>' + escapeHTML(item.status || item.type || "Tài liệu") + ' · ' +
          (progress.openedEvidence.indexOf(item.id) >= 0 ? 'Đã mở' : 'Bấm để mở tài liệu đầy đủ →') + '</small></button>';
      }).join("") : '<p class="lawyer-case-muted">🔒 Chưa có tài liệu. Hãy điều tra để thu thập chứng cứ.</p>';
      var selectedEvidence = (caseData.evidence || []).find(function (item) {
        return item.id === progress.activeEvidenceId;
      });
      var modal = selectedEvidence ? '<div class="lawyer-case-document-overlay" role="dialog" aria-modal="true" aria-label="' +
        escapeHTML(selectedEvidence.title) + '"><article class="lawyer-case-document-modal"><span class="eyebrow">' +
        escapeHTML(selectedEvidence.id) + ' · TÀI LIỆU VỤ ÁN</span><h3>' + escapeHTML(selectedEvidence.title) +
        '</h3><p>' + escapeHTML(selectedEvidence.content).replace(/\. /g, ".<br>") + '</p><small>APX LAW OFFICE · HỒ SƠ NỘI BỘ</small><br><button class="button" type="button" data-law-case-action="case006-close-evidence" data-case-id="CASE_006">ĐÓNG TÀI LIỆU</button></article></div>' : '';
      body = '<div class="lawyer-case-columns"><main>' + renderInvestigationStage(caseData, progress) +
        '</main><aside class="lawyer-case-column"><section class="lawyer-case-section"><h3>📁 Chứng cứ</h3><p class="lawyer-case-muted">Bấm vào từng tài liệu để mở toàn bộ nội dung.</p>' +
        '<div class="lawyer-case-stack">' + evidence + '</div></section><section class="lawyer-case-section"><h3>🕒 Dòng thời gian</h3><ol class="lawyer-case-timeline">' +
        timeline + '</ol></section></aside></div>' + modal;
    } else {
      body = renderFinalDefense(caseData, progress);
    }
    return '<section class="panel lawyer-case-workspace"><div class="lawyer-case-workspace-head"><div><span class="eyebrow">VỤ ÁN 06 · CA LÀM · NGÀY GAME ' +
      progress.startedDay + '</span><h2>' + escapeHTML(caseData.meta.title) +
      '</h2></div><span class="lawyer-case-badge">Luật sư</span></div>' + body + '</section>';
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
    if (action === "open-embedded") {
      if (!caseData.embeddedUrl) return window.APXGame.toast("Không tìm thấy mini-game của vụ án.", "warning");
      var gameRoot = document.getElementById("lawyerCaseGameRoot");
      if (!gameRoot) return window.APXGame.toast("Không thể mở mini-game trong game.", "warning");
      gameRoot.innerHTML = '<section class="lawyer-case-game-overlay" role="dialog" aria-modal="true" aria-label="' +
        escapeHTML(caseData.meta.title) + '">' +
        '<header class="lawyer-case-game-toolbar"><strong>' + escapeHTML(caseData.meta.title) +
        '</strong><button class="button" type="button" data-law-case-action="close-embedded" data-case-id="' +
        escapeHTML(caseData.id) + '">Quay lại game</button></header>' +
        '<iframe class="lawyer-case-game-frame" src="' + escapeHTML(caseData.embeddedUrl) +
        '" title="' + escapeHTML(caseData.meta.title) + '" allow="fullscreen"></iframe></section>';
      var gameFrame = gameRoot.querySelector(".lawyer-case-game-frame");
      if (gameFrame) {
        gameFrame.addEventListener("load", function () {
          if (!gameFrame.contentWindow) return;
          gameFrame.contentWindow.addEventListener("keydown", function (frameEvent) {
            if (frameEvent.key !== "Escape") return;
            frameEvent.preventDefault();
            gameRoot.replaceChildren();
          });
        }, { once: true });
      }
      var closeButton = gameRoot.querySelector('[data-law-case-action="close-embedded"]');
      if (closeButton) closeButton.focus();
      return;
    }
    if (action === "close-embedded") {
      var embeddedRoot = document.getElementById("lawyerCaseGameRoot");
      if (embeddedRoot) embeddedRoot.replaceChildren();
      return;
    }
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
    if (action === "legacy-case-start-meeting" || action === "legacy-case-ask" ||
        action === "legacy-case-start-investigation") {
      var case007Progress = lawyer && lawyer.cases[caseData.id];
      if (!case007Progress || case007Progress.status !== "active" ||
          (caseData.id !== "CASE_007" && caseData.id !== "CASE_009")) return;
      if (action === "legacy-case-start-meeting" && case007Progress.phase === "intro") {
        case007Progress.phase = "meeting";
      } else if (action === "legacy-case-ask" && case007Progress.phase === "meeting") {
        var meetingQuestionId = button.dataset.meetingQuestion;
        var meetingQuestion = (caseData.meetingQuestions || []).find(function (item) {
          return item.id === meetingQuestionId;
        });
        if (!meetingQuestion) return window.APXGame.toast("Câu hỏi gặp khách hàng không hợp lệ.", "warning");
        if (!Array.isArray(case007Progress.meetingQuestionsAsked)) case007Progress.meetingQuestionsAsked = [];
        if (case007Progress.meetingQuestionsAsked.indexOf(meetingQuestionId) >= 0) return;
        case007Progress.meetingQuestionsAsked.push(meetingQuestionId);
        if (!Array.isArray(case007Progress.meetingResponses)) case007Progress.meetingResponses = [];
        case007Progress.meetingResponses.push(meetingQuestion.response);
        Object.keys(meetingQuestion.effects || {}).forEach(function (key) {
          if (STAT_KEYS.indexOf(key) < 0) return;
          case007Progress.stats[key] =
            (Number(case007Progress.stats[key]) || 0) + Number(meetingQuestion.effects[key]);
        });
      } else if (action === "legacy-case-start-investigation" && case007Progress.phase === "meeting") {
        case007Progress.phase = "investigation";
      } else {
        return;
      }
      return persistAndRender();
    }
    if (action === "case008-start-meeting" || action === "case008-ask" ||
        action === "case008-start-investigation") {
      var case008Progress = lawyer && lawyer.cases[caseData.id];
      if (!case008Progress || case008Progress.status !== "active" || caseData.id !== "CASE_008") return;
      if (action === "case008-start-meeting" && case008Progress.phase === "intro") {
        case008Progress.phase = "meeting";
      } else if (action === "case008-ask" && case008Progress.phase === "meeting") {
        var case008QuestionId = button.dataset.meetingQuestion;
        var case008Question = (caseData.meetingQuestions || []).find(function (item) {
          return item.id === case008QuestionId;
        });
        if (!case008Question) return window.APXGame.toast("Câu hỏi gặp khách hàng không hợp lệ.", "warning");
        if (!Array.isArray(case008Progress.meetingQuestionsAsked)) case008Progress.meetingQuestionsAsked = [];
        if (case008Progress.meetingQuestionsAsked.indexOf(case008QuestionId) >= 0) return;
        case008Progress.meetingQuestionsAsked.push(case008QuestionId);
        if (!Array.isArray(case008Progress.meetingResponses)) case008Progress.meetingResponses = [];
        case008Progress.meetingResponses.push(case008Question.response);
        Object.keys(case008Question.effects || {}).forEach(function (key) {
          if (STAT_KEYS.indexOf(key) < 0) return;
          case008Progress.stats[key] =
            (Number(case008Progress.stats[key]) || 0) + Number(case008Question.effects[key]);
        });
      } else if (action === "case008-start-investigation" && case008Progress.phase === "meeting") {
        case008Progress.phase = "investigation";
      } else {
        return;
      }
      return persistAndRender();
    }
    if (action === "reopen-investigation") {
      var defenseProgress = lawyer && lawyer.cases[caseData.id];
      if (!defenseProgress || defenseProgress.status !== "active" ||
          defenseProgress.phase !== "defense" || !caseData.investigationActions.length) return;
      defenseProgress.phase = "investigation";
      return persistAndRender("Đã quay lại hồ sơ điều tra. Các luận điểm đã chọn vẫn được giữ lại.");
    }
    if (action === "choose") return chooseAnswer(caseData, button.dataset.questionId, button.dataset.choiceId);
    if (action === "confirm-answer") return confirmAnswer(caseData, button.dataset.questionId);
    if (action === "choose-argument") return chooseFinalArgument(caseData, button.dataset.argumentId);
    if (action === "choose-defense") return chooseFinalDefenseArgument(caseData, button.dataset.argumentId);
    if (action === "case006-meeting" || action === "case006-start-investigation" ||
        action === "case006-ask" || action === "case006-open-evidence" ||
        action === "case006-close-evidence") {
      var caseProgress = lawyer && lawyer.cases[caseData.id];
      if (!caseProgress || caseProgress.status !== "active" || caseData.id !== "CASE_006") return;
      if (action === "case006-meeting" && caseProgress.phase === "intro") {
        caseProgress.phase = "meeting";
      } else if (action === "case006-start-investigation" && caseProgress.phase === "meeting") {
        caseProgress.phase = "investigation";
      } else if (action === "case006-ask" && caseProgress.phase === "meeting") {
        var questionId = button.dataset.meetingQuestion;
        var meetingAnswers = {
          timeline: "Nam nói thêm: “Tôi vừa rời thang máy. Tôi không nhớ chính xác mình đi ở làn nào.”",
          hidden: "Nam im lặng rồi nói: “Tôi có thấy một người quen gần lối ra, nhưng tôi nghĩ chuyện đó không liên quan.”"
        };
        if (!meetingAnswers[questionId]) return window.APXGame.toast("Câu hỏi gặp khách hàng không hợp lệ.", "warning");
        if (!Array.isArray(caseProgress.meetingQuestionsAsked)) caseProgress.meetingQuestionsAsked = [];
        if (caseProgress.meetingQuestionsAsked.indexOf(questionId) >= 0) return;
        caseProgress.meetingQuestionsAsked.push(questionId);
        if (!Array.isArray(caseProgress.meetingResponses)) caseProgress.meetingResponses = [];
        caseProgress.meetingResponses.push(meetingAnswers[questionId]);
        caseProgress.stats.caseUnderstanding = (Number(caseProgress.stats.caseUnderstanding) || 0) + 8;
        if (questionId === "hidden") {
          caseProgress.stats.clientTrust = (Number(caseProgress.stats.clientTrust) || 0) + 4;
        }
      } else if (action === "case006-open-evidence" && caseProgress.phase === "investigation") {
        var evidenceId = button.dataset.evidenceId;
        if (caseProgress.unlockedEvidence.indexOf(evidenceId) < 0) {
          return window.APXGame.toast("Tài liệu này chưa được mở khóa.", "warning");
        }
        caseProgress.activeEvidenceId = evidenceId;
        addUnique(caseProgress.openedEvidence, evidenceId);
      } else if (action === "case006-close-evidence") {
        caseProgress.activeEvidenceId = null;
      } else {
        return;
      }
      return persistAndRender();
    }
    if (action === "investigate") return runInvestigationAction(caseData, button.dataset.investigationId);
    if (action === "investigation-event") {
      return chooseInvestigationEvent(caseData, button.dataset.eventId, button.dataset.choiceId);
    }
    if (action === "close-investigation") return closeInvestigation(caseData);
    if (action === "finish") return finishCase(caseData);
  });

  document.addEventListener("input", function (event) {
    var input = event.target.closest("[data-law-case-search]");
    if (input) applyLibraryFilter(input);
  });

  document.addEventListener("keydown", function (event) {
    if (event.key !== "Escape") return;
    var gameRoot = document.getElementById("lawyerCaseGameRoot");
    if (!gameRoot || !gameRoot.firstElementChild) return;
    gameRoot.replaceChildren();
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
    if (!Array.isArray(progress.openedEvidence)) progress.openedEvidence = [];
    if (!Array.isArray(progress.readLaws)) progress.readLaws = [];
    if (evidenceId && progress.unlockedEvidence.indexOf(evidenceId) >= 0) addUnique(progress.openedEvidence, evidenceId);
    if (lawId && (caseData.legalLibrary || []).some(function (law) { return law.id === lawId; })) addUnique(progress.readLaws, lawId);
    refreshResearchChoices(caseData, progress);
    refreshFinalDefenseChoices(caseData, progress);
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

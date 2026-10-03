window.APXQuest = (function () {
  "use strict";

  var definitions = window.APX_QUEST_DATA || [];
  var statusLabels = {
    LOCKED: "Đã khóa",
    AVAILABLE: "Sẵn sàng",
    ACTIVE: "Đang làm",
    COMPLETED: "Hoàn thành"
  };
  var requirementLabels = {
    work_shifts_completed: "Ca làm hoàn thành",
    salary_received: "Lương đã nhận",
    current_job_active: "Đang có công việc"
  };

  function careerState(state) {
    return state && state.career || {};
  }

  function metrics(state) {
    var career = careerState(state);
    return {
      work_shifts_completed: Math.max(0, Number(career.completedWorkShifts) || 0),
      salary_received: Math.max(0, Number(career.totalSalaryReceived) || 0),
      current_job_active: career.activeJob ||
        (career.employment && career.employment.current && career.employment.current.status === "active")
        ? 1
        : 0
    };
  }

  function ensureState(state) {
    if (!state || typeof state !== "object") return null;
    if (!state.quests || typeof state.quests !== "object") {
      state.quests = {
        version: 3,
        createdAt: new Date().toISOString(),
        records: {},
        history: []
      };
    }

    var questState = state.quests;
    var previousVersion = Number(questState.version) || 1;
    questState.version = 3;
    if (!questState.records || typeof questState.records !== "object") questState.records = {};
    if (!Array.isArray(questState.history)) questState.history = [];
    if (!Array.isArray(questState.processedWorkShiftPayments)) questState.processedWorkShiftPayments = [];

    definitions.forEach(function (definition, index) {
      var record = questState.records[definition.id];
      if (!record || typeof record !== "object") {
        record = {
          status: definition.unlockAfter ? "LOCKED" : "AVAILABLE",
          createdAt: new Date().toISOString(),
          completedAt: null,
          rewardClaimed: false,
          progress: {}
        };
        questState.records[definition.id] = record;
      }
      if (["LOCKED", "AVAILABLE", "ACTIVE", "COMPLETED"].indexOf(record.status) < 0) {
        record.status = definition.unlockAfter ? "LOCKED" : "AVAILABLE";
      }
      if (!record.createdAt) record.createdAt = new Date().toISOString();
      if (!record.progress || typeof record.progress !== "object") record.progress = {};
      if (previousVersion < 3 && record.status === "COMPLETED" && record.rewardClaimed === true) {
        record.legacyExperienceClaimed = true;
        record.rewardClaimed = false;
      }
      if (record.status === "COMPLETED" && typeof record.rewardClaimed !== "boolean") {
        record.rewardClaimed = false;
      }

      var previous = index > 0 ? definitions[index - 1] : null;
      if (definition.unlockAfter && previous && previous.id !== definition.unlockAfter) {
        record.status = "LOCKED";
      }
    });

    return questState;
  }

  function addPhoneNotice(state, title, message) {
    if (!state.phone || typeof state.phone !== "object") state.phone = {};
    if (!Array.isArray(state.phone.notifications)) state.phone.notifications = [];
    var clock = window.APXGame && window.APXGame.getGameClock
      ? window.APXGame.getGameClock()
      : { day: Number(state.day) || 1, hour: 0, minute: 0 };
    state.phone.notifications.unshift({
      id: "quest-" + Date.now() + "-" + Math.random().toString(36).slice(2, 7),
      type: "quest",
      title: title,
      message: message,
      timestamp: { day: Number(clock.day) || 1, minute: (Number(clock.hour) || 0) * 60 + (Number(clock.minute) || 0) },
      read: false,
      action: "quests"
    });
    state.phone.notifications = state.phone.notifications.slice(0, 100);
  }

  function unlockNext(state, questState, completedDefinition) {
    var next = definitions.find(function (definition) {
      return definition.unlockAfter === completedDefinition.id;
    });
    if (!next) return;
    var record = questState.records[next.id];
    if (record.status !== "LOCKED") return;
    record.status = "AVAILABLE";
    record.availableAt = new Date().toISOString();
    addPhoneNotice(state, "Nhiệm vụ mới đã mở!", "Quest mới: " + next.title);
    if (window.APXGame && window.APXGame.toast) {
      window.APXGame.toast("Nhiệm vụ mới đã mở! " + next.title);
    }
  }

  function onWorkShiftPaid(state, workRecord) {
    var career = careerState(state);
    var questState = ensureState(state);
    if (!questState || !career) return [];
    var paymentId = workRecord && workRecord.id
      ? [workRecord.id, workRecord.day, workRecord.salaryReceivedAt].join(":")
      : null;
    if (paymentId && questState.processedWorkShiftPayments.indexOf(paymentId) >= 0) return [];
    if (paymentId) {
      questState.processedWorkShiftPayments.push(paymentId);
      questState.processedWorkShiftPayments = questState.processedWorkShiftPayments.slice(-1000);
    }
    var current = metrics(state);
    var completed = [];

    for (var index = 0; index < definitions.length; index += 1) {
      var definition = definitions[index];
      var record = questState.records[definition.id];
      var previous = index > 0 ? definitions[index - 1] : null;

      if (record.status === "LOCKED" && previous && questState.records[previous.id].status === "COMPLETED") {
        record.status = "AVAILABLE";
        record.availableAt = new Date().toISOString();
        addPhoneNotice(state, "Nhiệm vụ mới đã mở!", "Quest mới: " + definition.title);
        if (window.APXGame && window.APXGame.toast) {
          window.APXGame.toast("Nhiệm vụ mới đã mở! " + definition.title);
        }
      }
      if (record.status === "AVAILABLE") record.status = "ACTIVE";
      if (record.status !== "ACTIVE") continue;

      var requirementsMet = definition.requirements.every(function (requirement) {
        var value = current[requirement.type] || 0;
        record.progress[requirement.type] = value;
        return value >= requirement.target;
      });
      if (!requirementsMet) continue;

      record.status = "COMPLETED";
      record.completedAt = new Date().toISOString();
      record.progressAtCompletion = Object.assign({}, record.progress);
      record.rewardClaimed = false;
      record.legacyExperienceClaimed = false;
      var cashReward = Math.max(0, Math.floor(Number(definition.reward.cash) || 0));
      var careerReward = Math.max(0, Math.floor(Number(definition.reward.careerExp) || 0));
      var characterReward = Math.max(0, Math.floor(Number(definition.reward.characterExp) || 0));
      var historyEntry = {
        questId: definition.id,
        completedAt: record.completedAt,
        rewardClaimed: false,
        progressAtCompletion: Object.assign({}, record.progressAtCompletion),
        reward: { cash: cashReward, careerExp: careerReward, characterExp: characterReward }
      };
      questState.history.unshift(historyEntry);
      questState.history = questState.history.slice(0, 200);
      completed.push(definition.id);
      addPhoneNotice(state, "Hoàn thành nhiệm vụ!", "Bạn đã hoàn thành: " + definition.title + ". Hãy nhận quà trong mục Nhiệm vụ.");
      if (window.APXGame && window.APXGame.toast) {
        window.APXGame.toast("Hoàn thành nhiệm vụ! Hãy nhấn Nhận để lấy tiền và EXP.");
      }
      unlockNext(state, questState, definition);
      if (state.phone && state.phone.visible && window.APXPhone && window.APXPhone.refresh) {
        window.APXPhone.refresh();
      }
      break;
    }

    return completed;
  }

  function claimReward(state, questId) {
    var questState = ensureState(state);
    var definition = definitions.find(function (item) { return item.id === questId; });
    var record = questState && questState.records[questId];
    if (!definition || !record || record.status !== "COMPLETED" || record.rewardClaimed) return null;

    var career = careerState(state);
    var cashReward = Math.max(0, Math.floor(Number(definition.reward.cash) || 0));
    var careerReward = record.legacyExperienceClaimed
      ? 0
      : Math.max(0, Math.floor(Number(definition.reward.careerExp) || 0));
    var characterReward = record.legacyExperienceClaimed
      ? 0
      : Math.max(0, Math.floor(Number(definition.reward.characterExp) || 0));

    record.rewardClaimed = true;
    record.rewardClaimedAt = new Date().toISOString();
    state.cash = Math.max(0, Number(state.cash) || 0) + cashReward;
    career.xp = Math.max(0, Number(career.xp) || 0) + careerReward;
    if (window.APXCareer && typeof window.APXCareer.getProgress === "function") {
      window.APXCareer.getProgress(state);
    }
    if (characterReward > 0 && window.APXCharacter && window.APXCharacter.addCharacterXP) {
      window.APXCharacter.addCharacterXP(characterReward, "Nhiệm vụ: " + definition.title);
    }

    var historyEntry = questState.history.find(function (entry) { return entry.questId === questId; });
    if (historyEntry) {
      historyEntry.rewardClaimed = true;
      historyEntry.rewardClaimedAt = record.rewardClaimedAt;
    }
    addPhoneNotice(state, "Đã nhận thưởng nhiệm vụ", definition.title + " · +" +
      window.APXUI.money(cashReward) + (careerReward ? " · +" + careerReward + " EXP" : " · EXP đã nhận trước đó"));
    return { cash: cashReward, careerExp: careerReward, characterExp: characterReward };
  }

  function currentProgress(state, questState, definition, record) {
    var current = metrics(state);
    var total = 0, score = 0;
    var rows = definition.requirements.map(function (requirement) {
      var value = Math.max(0, Number(current[requirement.type]) || 0);
      var done = value >= requirement.target;
      var shown = Math.min(value, requirement.target);
      var ratio = requirement.target > 0 ? shown / requirement.target : 1;
      total += 1;
      score += ratio;
      record.progress[requirement.type] = value;
      return {
        type: requirement.type,
        label: requirementLabels[requirement.type] || requirement.type,
        value: value,
        shown: shown,
        target: requirement.target,
        done: done
      };
    });
    return { rows: rows, percent: total ? Math.round(score / total * 100) : 0 };
  }

  function statusText(status) {
    return statusLabels[status] || statusLabels.LOCKED;
  }

  function syncCompletedQuests(state, questState) {
    var current = metrics(state);
    definitions.forEach(function (definition, index) {
      var record = questState.records[definition.id];
      var previous = index > 0 ? definitions[index - 1] : null;
      if (record.status === "LOCKED" && (!previous || questState.records[previous.id].status === "COMPLETED")) {
        record.status = "AVAILABLE";
      }
      if (record.status === "AVAILABLE") record.status = "ACTIVE";
      if (record.status !== "ACTIVE") return;

      var requirementsMet = definition.requirements.every(function (requirement) {
        var value = Math.max(0, Number(current[requirement.type]) || 0);
        record.progress[requirement.type] = value;
        return value >= requirement.target;
      });
      if (!requirementsMet) return;

      record.status = "COMPLETED";
      record.completedAt = record.completedAt || new Date().toISOString();
      record.progressAtCompletion = Object.assign({}, record.progress);
      if (typeof record.rewardClaimed !== "boolean") record.rewardClaimed = false;
      if (!questState.history.some(function (entry) { return entry.questId === definition.id; })) {
        questState.history.unshift({
          questId: definition.id,
          completedAt: record.completedAt,
          rewardClaimed: record.rewardClaimed,
          progressAtCompletion: Object.assign({}, record.progressAtCompletion),
          reward: {
            cash: Math.max(0, Math.floor(Number(definition.reward.cash) || 0)),
            careerExp: Math.max(0, Math.floor(Number(definition.reward.careerExp) || 0)),
            characterExp: Math.max(0, Math.floor(Number(definition.reward.characterExp) || 0))
          }
        });
        questState.history = questState.history.slice(0, 200);
      }
    });
  }

  function questCard(state, questState, definition) {
    var record = questState.records[definition.id];
    var progress = currentProgress(state, questState, definition, record);
    var cashReward = Number(definition.reward.cash) || 0;
    var careerReward = Number(definition.reward.careerExp) || 0;
    var characterReward = Number(definition.reward.characterExp) || 0;
    var claimButton = record.status === "COMPLETED" && !record.rewardClaimed
      ? '<button class="button button-gold apx-quest-claim" type="button" data-quest-action="claim" data-quest-id="' + definition.id + '">Nhận</button>'
      : "";
    var rewardLabel = record.legacyExperienceClaimed
      ? "EXP đã nhận trước đó"
      : "+" + careerReward + " EXP nghề nghiệp" + (characterReward ? " · +" + characterReward + " EXP nhân vật" : "");
    var requirements = progress.rows.map(function (item) {
      var value = item.type === "salary_received"
        ? window.APXUI.money(item.shown)
        : item.type === "current_job_active" ? (item.done ? "Có" : "Chưa có") : item.shown;
      var target = item.type === "salary_received" ? window.APXUI.money(item.target) : item.type === "current_job_active" ? "Có" : String(item.target);
      return '<li class="apx-quest-requirement ' + (item.done ? "is-complete" : "") + '"><span>' + (item.done ? "✓ " : "") + item.label + '</span><strong>' + value + ' / ' + target + '</strong></li>';
    }).join("");
    return '<article class="apx-card apx-quest-card quest-' + record.status.toLowerCase() + '"><div class="apx-quest-card-top"><span class="eyebrow">' + definition.category + ' · ' + definition.type + '</span><span class="apx-quest-status">' + statusText(record.status) + '</span></div><h3>' + definition.title + '</h3><p>' + definition.description + '</p><ul class="apx-quest-requirements">' + requirements + '</ul><div class="progress" role="progressbar" aria-label="' + definition.title + '" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + progress.percent + '"><span style="width:' + progress.percent + '%"></span></div><div class="apx-quest-reward"><span>Phần thưởng</span><strong>' + window.APXUI.money(cashReward) + ' · ' + rewardLabel + '</strong>' + claimButton + '</div></article>';
  }

  function render(state) {
    var questState = ensureState(state);
    syncCompletedQuests(state, questState);
    var career = careerState(state);
    var xpProgress = window.APXCareer && window.APXCareer.getProgress
      ? window.APXCareer.getProgress(state)
      : { level: Number(career.level) || 1, xp: Number(career.xp) || 0, next: 500, totalXP: Number(career.xp) || 0 };
    var active = [];
    var completed = [];
    var locked = [];

    definitions.forEach(function (definition) {
      var status = questState.records[definition.id].status;
      if (status === "COMPLETED") completed.push(definition);
      else if (status === "LOCKED") locked.push(definition);
      else active.push(definition);
    });

    var pct = xpProgress.next ? Math.min(100, Math.round(xpProgress.xp / xpProgress.next * 100)) : 0;
    function section(title, items, key) {
      if (!items.length) return "";
      return '<section class="apx-quest-section"><h3>' + title + ' · ' + items.length + '</h3><div class="apx-quest-list">' + items.map(function (item) {
        return questCard(state, questState, item);
      }).join("") + '</div></section>';
    }

    return '<header class="page-heading"><span class="eyebrow">PERSONAL · CAREER</span><h1>Nhiệm vụ cá nhân</h1><p>Hoàn thành ca làm và nhận lương để phát triển sự nghiệp.</p></header><section class="apx-quest-board"><header class="apx-quest-xp apx-card"><div><span>Nghề nghiệp · cấp ' + xpProgress.level + '</span><strong>EXP: ' + xpProgress.xp.toLocaleString("vi-VN") + ' / ' + xpProgress.next.toLocaleString("vi-VN") + '</strong></div><div class="progress" role="progressbar" aria-label="EXP nghề nghiệp" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + pct + '"><span style="width:' + pct + '%"></span></div><small>Tổng EXP: ' + xpProgress.totalXP.toLocaleString("vi-VN") + '</small></header>' +
      section("Đang làm", active, "active") +
      section("Đã hoàn thành", completed, "completed") +
      section("Đã khóa", locked, "locked") +
      '</section>';
  }

  return {
    definitions: definitions,
    ensureState: ensureState,
    onWorkShiftPaid: onWorkShiftPaid,
    claimReward: claimReward,
    render: render
  };
})();

document.addEventListener("click", function (event) {
  var button = event.target.closest('[data-quest-action="claim"]');
  if (!button || !window.APXGame) return;
  var state = window.APXGame.state;
  var account = window.APXAccount;
  if (account && account.isLoggedIn && account.isLoggedIn()) {
    if (!account.claimQuestReward) {
      if (window.APXGame.toast) window.APXGame.toast("Chưa thể nhận thưởng do thiếu kết nối máy chủ.");
      return;
    }
    button.disabled = true;
    account.claimQuestReward(button.dataset.questId).then(function (reward) {
      window.APXGame.render();
      if (window.APXGame.toast) {
        window.APXGame.toast("Đã nhận +" + window.APXUI.money(reward.cash) +
          (reward.careerExp ? " và +" + reward.careerExp + " EXP!" : " tiền thưởng!"));
      }
    }).catch(function (error) {
      button.disabled = false;
      if (window.APXGame.toast) {
        window.APXGame.toast("Chưa nhận được thưởng: " + error.message);
      }
    });
    return;
  }
  var reward = window.APXQuest.claimReward(state, button.dataset.questId);
  if (!reward) return;
  window.APXGame.save();
  window.APXGame.render();
  if (window.APXGame.toast) {
    window.APXGame.toast("Đã nhận +" + window.APXUI.money(reward.cash) +
      (reward.careerExp ? " và +" + reward.careerExp + " EXP!" : " tiền thưởng!"));
  }
});
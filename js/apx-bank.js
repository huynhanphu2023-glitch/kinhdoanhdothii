/* APXBank: saved personal banking, savings, loans and credit. */
window.APXPages = window.APXPages || {};
(function () {
  "use strict";

  var VIEWS = [
    ["overview", "Tổng quan"], ["account", "Tài khoản"], ["transfer", "Chuyển tiền"],
    ["savings", "Tiết kiệm"], ["loans", "Khoản vay"], ["credit", "Tín dụng"], ["history", "Lịch sử"]
  ];
  var SAVINGS = {
    flexible: { id: "flexible", name: "Không kỳ hạn", days: 0, rate: 0.001, min: 100000, daily: true },
    save3: { id: "save3", name: "3 ngày", days: 3, rate: 0.012, min: 250000 },
    save7: { id: "save7", name: "7 ngày", days: 7, rate: 0.035, min: 500000 },
    save30: { id: "save30", name: "30 ngày", days: 30, rate: 0.12, min: 1000000 },
    save90: { id: "save90", name: "90 ngày", days: 90, rate: 0.35, min: 5000000 }
  };
  var LOAN_TERMS = { 3: 0.02, 7: 0.05, 30: 0.16, 90: 0.42 };
  var txNames = {
    salary: "Nhận lương", income: "Nhận tiền", expense: "Chi tiêu", deposit: "Nạp tiền", withdraw: "Rút tiền",
    "transfer-in": "Nhận tiền", "transfer-out": "Chuyển tiền", "savings-open": "Gửi tiết kiệm",
    "savings-withdraw": "Rút tiết kiệm", "savings-maturity": "Tiền gốc đáo hạn", interest: "Nhận lãi",
    "loan-disbursement": "Vay", "loan-payment": "Trả nợ", "debt-collection": "APXBank tự động thu nợ",
    "lawyer-reward": "Thưởng vụ án", fee: "Phí"
  };
  var txFilter = "all";
  var savingAmount = 100000;
  var loanAmount = 1000000;
  var savingPlan = "flexible";
  var pendingTransferStorageKey = "apx-bank-pending-transfer-v1";

  function esc(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function money(value) {
    var amount = Math.round(Number(value) || 0), sign = amount < 0 ? "− " : "", absolute = Math.abs(amount);
    function compact(divisor, suffix, digits) {
      var number = (absolute / divisor).toFixed(digits).replace(/\.?0+$/, "");
      return sign + "₫ " + Number(number).toLocaleString("vi-VN", { maximumFractionDigits: digits }) + " " + suffix;
    }
    if (absolute >= 1000000000000) return compact(1000000000000, "nghìn tỷ", 9);
    if (absolute >= 1000000000) return compact(1000000000, "tỷ", 6);
    if (absolute >= 1000000) return compact(1000000, "triệu", 6);
    return sign + "₫ " + absolute.toLocaleString("vi-VN");
  }
  function quickAmounts(max) {
    var limit = Number(max), values = [10000000, 50000000, 100000000, 500000000, 1000000000];
    return '<div class="apx-bank-quick-amounts" aria-label="Chọn nhanh số tiền">' + values.map(function (value) {
      return '<button type="button" data-bank-quick-amount="' + value + '"' + (Number.isFinite(limit) && value > limit ? ' disabled title="Vượt số dư hiện có"' : '') + '>' + money(value) + '</button>';
    }).join('') + '</div>';
  }
  function uuid() {
    if (window.crypto && window.crypto.randomUUID) return window.crypto.randomUUID();
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) { var r = Math.random() * 16 | 0; return (c === "x" ? r : (r & 3 | 8)).toString(16); });
  }
  function ensure(state) {
    if (!state.apxBank || typeof state.apxBank !== "object") state.apxBank = {};
    var b = state.apxBank;
    b.version = 1;
    b.accountBalance = Math.max(0, Math.floor(Number(b.accountBalance) || 0));
    b.totalReceived = Math.max(0, Math.floor(Number(b.totalReceived) || 0));
    b.totalSpent = Math.max(0, Math.floor(Number(b.totalSpent) || 0));
    b.creditScore = Math.max(300, Math.min(850, Math.floor(Number(b.creditScore) || 600)));
    ["savings", "loans", "transactions", "notifications"].forEach(function (k) { if (!Array.isArray(b[k])) b[k] = []; });
    if (!Number.isFinite(Number(b.openedAt))) b.openedAt = Date.now();
    if (!Number.isFinite(Number(b.lastProcessedDay))) b.lastProcessedDay = Math.max(0, (Number(state.day) || 1) - 1);
    if (!b.view || !VIEWS.some(function (v) { return v[0] === b.view; })) b.view = "overview";
    if (b.observedCash == null || !Number.isFinite(Number(b.observedCash))) b.observedCash = Math.max(0, Number(state.cash) || 0);
    if (!b.counters || typeof b.counters !== "object") b.counters = { onTime: 0, late: 0 };
    if (!Number.isFinite(Number(b.counters.onTime))) b.counters.onTime = 0;
    if (!Number.isFinite(Number(b.counters.late))) b.counters.late = 0;
    b.counters.onTime = Math.max(0, Number(b.counters.onTime) || 0);
    b.counters.late = Math.max(0, Number(b.counters.late) || 0);
    return b;
  }
  function profileId(state) { return String(state.character && state.character.profile && state.character.profile.characterId || ""); }
  function notify(state, type, title, message) {
    var b = ensure(state);
    b.notifications.unshift({ id: uuid(), type: type, title: title, message: message, createdAt: new Date().toISOString(), gameDay: Number(state.day) || 1, read: false });
    b.notifications = b.notifications.slice(0, 50);
  }
  function addTx(state, type, amount, memo, extras) {
    var b = ensure(state), value = Math.round(Number(amount) || 0);
    if (value > 0) b.totalReceived += value;
    if (value < 0) b.totalSpent += Math.abs(value);
    var tx = Object.assign({
      id: uuid(), type: type, amount: value, direction: value >= 0 ? "in" : "out", memo: String(memo || ""),
      gameDay: Number(state.day) || 1, createdAt: new Date().toISOString(), balanceAfter: b.accountBalance,
      walletAfter: Math.max(0, Number(state.cash) || 0)
    }, extras || {});
    b.transactions.unshift(tx);
    b.transactions = b.transactions.slice(0, 200);
    b.observedCash = Math.max(0, Number(state.cash) || 0);
    return tx;
  }
  function observeCash(state) {
    var b = ensure(state), current = Math.max(0, Number(state.cash) || 0), previous = Number(b.observedCash);
    if (!Number.isFinite(previous)) { b.observedCash = current; return; }
    var delta = Math.round(current - previous);
    if (!delta) return;
    addTx(state, delta > 0 ? "income" : "expense", delta, delta > 0 ? "Thu nhập từ hoạt động game" : "Chi tiêu trong game");
  }
  function scoreChange(state, delta, reason) {
    var b = ensure(state), old = b.creditScore;
    b.creditScore = Math.max(300, Math.min(850, old + Number(delta)));
    if (old !== b.creditScore) notify(state, "credit", "Điểm tín dụng thay đổi", reason + ": " + old + " → " + b.creditScore + ".");
  }
  function savingValue(item) {
    return item.status === "active" && item.daily ? Math.max(0, Number(item.currentValue) || Number(item.principal) || 0) : Math.max(0, Number(item.currentValue) || Number(item.principal) || 0);
  }
  function loanOutstanding(state) { return Math.max(0, Number(state.character && state.character.debt) || 0); }
  function totals(state) {
    var b = ensure(state), assetValue = 0;
    if (window.APXCharacter && window.APXCharacter.metrics) {
      try { assetValue = Number(window.APXCharacter.metrics(state).assetValue) || 0; } catch (_) {}
    } else {
      assetValue = (state.character && state.character.assets || []).reduce(function (sum, a) { return sum + (Number(a.currentValue) || 0); }, 0);
    }
    var savings = b.savings.reduce(function (sum, s) { return sum + (s.status === "active" ? savingValue(s) : 0); }, 0);
    var assets = Math.max(0, Number(state.cash) || 0) + b.accountBalance + savings + assetValue;
    var debt = loanOutstanding(state);
    var career = state.career || {}, roleSalary = career.employment && career.employment.current && Number(career.employment.current.salary) || 0;
    var careerLevel = window.APXCareer && window.APXCareer.getLevel ? window.APXCareer.getLevel(state) : 1;
    var baseLimit = 1000000 + careerLevel * 500000 + roleSalary * 4 + Math.max(0, assets - debt) * 0.25;
    var limit = Math.min(500000000, Math.round(baseLimit * b.creditScore / 650));
    return { wallet: Math.max(0, Number(state.cash) || 0), balance: b.accountBalance, savingValue: savings, assetValue: Math.round(assetValue), assets: Math.round(assets), debt: debt, netWorth: Math.round(assets - debt), credit: b.creditScore, limit: limit, availableLoan: Math.max(0, limit - debt) };
  }
  function dateText(value) {
    if (!value) return "—";
    var date = typeof value === "number" ? new Date(value) : new Date(value);
    return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString("vi-VN", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
  }
  function creditRank(score) { return score >= 800 ? "AAA" : score >= 740 ? "A" : score >= 670 ? "B" : score >= 580 ? "C" : "D"; }
  function creditStatus(score) { return score >= 670 ? "Tốt" : score >= 580 ? "Theo dõi" : "Rủi ro cao"; }
  function shell(state, body) {
    var b = ensure(state);
    var nav = VIEWS.map(function (view) { return '<button type="button" class="apx-bank-tab' + (b.view === view[0] ? ' active' : '') + '" data-bank-view="' + view[0] + '">' + view[1] + '</button>'; }).join("");
    return '<div class="apx-bank-shell"><header class="apx-bank-top"><div><span class="eyebrow">NGÂN HÀNG SỐ APX</span><h1>APXBank</h1></div><button type="button" class="apx-bank-close" aria-label="Đóng APXBank" data-bank-action="close">×</button></header><nav class="apx-bank-tabs" aria-label="Chức năng APXBank">' + nav + '</nav><main class="apx-bank-content">' + body + '</main></div>';
  }
  function metric(label, value, tone) { return '<article class="apx-bank-metric ' + (tone || '') + '"><span>' + label + '</span><strong>' + value + '</strong></article>'; }
  function unreadCount(b) { return b.notifications.filter(function (n) { return !n.read; }).length; }
  function notificationList(state, compact) {
    var items = ensure(state).notifications.slice(0, compact ? 4 : 50);
    if (!items.length) return '<div class="apx-bank-empty">Chưa có thông báo mới.</div>';
    return '<div class="apx-bank-notifications">' + items.map(function (n) { return '<article class="apx-bank-notice ' + (n.read ? 'read' : '') + '"><div><strong>' + esc(n.title) + '</strong><p>' + esc(n.message) + '</p><small>Ngày game ' + Number(n.gameDay || 1) + ' · ' + dateText(n.createdAt) + '</small></div>' + (!n.read ? '<button type="button" data-bank-action="read-notice" data-id="' + esc(n.id) + '">Đã đọc</button>' : '') + '</article>'; }).join('') + '</div>';
  }
  function overview(state) {
    var b = ensure(state), t = totals(state), scorePct = Math.round((t.credit - 300) / 550 * 100);
    return '<header class="apx-bank-heading"><div><span class="eyebrow">TÀI CHÍNH CÁ NHÂN</span><h2>Tổng quan</h2><p>Ngày game ' + Number(state.day || 1) + ' · ' + unreadCount(b) + ' thông báo chưa đọc</p></div><span class="apx-bank-credit-badge">' + creditRank(t.credit) + ' · ' + t.credit + '</span></header><section class="apx-bank-metrics">' + metric('Số dư APXBank', money(t.balance), 'primary') + metric('Tổng tài sản', money(t.assets)) + metric('Tổng nợ', money(t.debt), 'debt') + metric('Tài sản ròng', money(t.netWorth)) + metric('Điểm tín dụng', t.credit + ' · ' + creditRank(t.credit), 'credit') + metric('Trạng thái tài khoản', 'Đang hoạt động') + '</section><section class="apx-bank-shortcuts">' + VIEWS.slice(1).map(function (v) { return '<button type="button" data-bank-view="' + v[0] + '"><span>' + v[1] + '</span><b>›</b></button>'; }).join('') + '</section><section class="apx-bank-panel"><div class="apx-bank-panel-head"><h3>Hồ sơ tín dụng</h3><span>' + creditStatus(t.credit) + '</span></div><div class="apx-bank-scorebar"><span style="width:' + scorePct + '%"></span></div><div class="apx-bank-inline"><span>Hạn mức ' + money(t.limit) + '</span><span>Còn có thể vay ' + money(t.availableLoan) + '</span></div></section><section class="apx-bank-panel"><div class="apx-bank-panel-head"><h3>Thông báo ngân hàng</h3><button type="button" data-bank-view="history">Lịch sử giao dịch</button></div>' + notificationList(state, true) + '</section>';
  }
  function accountPage(state) {
    var b = ensure(state), id = profileId(state), t = totals(state);
    return '<header class="apx-bank-heading"><div><span class="eyebrow">TÀI KHOẢN THANH TOÁN</span><h2>Tài khoản APXBank</h2></div><span class="apx-bank-account-state">● Đang hoạt động</span></header><section class="apx-bank-account-card"><div><small>Số dư tài khoản</small><strong>' + money(b.accountBalance) + '</strong></div><div class="apx-bank-account-id"><small>Số tài khoản / ID nhân vật</small><code id="apxBankAccountId">' + esc(id || 'Đang đồng bộ ID') + '</code><button type="button" data-bank-action="copy-id" ' + (!id ? 'disabled' : '') + '>Sao chép</button></div><div class="apx-bank-account-meta"><span>Ngày mở<strong>' + dateText(b.openedAt) + '</strong></span><span>Tiền mặt trong game<strong>' + money(t.wallet) + '</strong></span><span>Tổng tiền đã nhận<strong>' + money(b.totalReceived) + '</strong></span><span>Tổng tiền đã chi<strong>' + money(b.totalSpent) + '</strong></span></div></section><section class="apx-bank-two-col"><form class="apx-bank-form apx-bank-panel" data-bank-form="wallet"><h3>Nạp tiền</h3><p>Chuyển tiền mặt từ ví game vào APXBank.</p><input name="amount" type="number" min="1" step="1" placeholder="Số tiền" required>' + quickAmounts(t.wallet) + '<button class="button button-gold" type="submit" data-direction="deposit">Nạp tiền</button></form><form class="apx-bank-form apx-bank-panel" data-bank-form="wallet"><h3>Rút tiền</h3><p>Chuyển số dư APXBank về ví game.</p><input name="amount" type="number" min="1" step="1" placeholder="Số tiền" required>' + quickAmounts(b.accountBalance) + '<button class="button" type="submit" data-direction="withdraw">Rút tiền</button></form></section><button class="button" type="button" data-bank-view="transfer">Chuyển tiền cho người chơi</button>';
  }
  function transferPage(state) {
    var t = totals(state), id = profileId(state);
    return '<header class="apx-bank-heading"><div><span class="eyebrow">CHUYỂN TIỀN NGƯỜI CHƠI</span><h2>Chuyển tiền</h2><p>Số dư sau giao dịch: <strong id="apxBankTransferPreview">' + money(t.balance) + '</strong></p></div></header><form class="apx-bank-form apx-bank-panel apx-bank-transfer-form" data-bank-form="transfer"><label>Người nhận<input name="recipient_name" type="text" maxlength="40" placeholder="Tên người nhận" required></label><label>ID tài khoản / ID nhân vật<input name="recipient_id" type="text" placeholder="UUID nhân vật APX" required></label><label>Số tiền<input name="amount" data-bank-transfer-amount type="number" min="1" max="' + t.balance + '" step="1" placeholder="Số tiền cần chuyển" required></label>' + quickAmounts(t.balance) + '<label>Nội dung<input name="memo" type="text" maxlength="120" placeholder="Nội dung chuyển tiền"></label><div class="apx-bank-transfer-summary">Số dư hiện tại <strong>' + money(t.balance) + '</strong> → sau chuyển <strong data-bank-balance-after>' + money(t.balance) + '</strong></div><small>Chuyển tiền tới ID nhân vật của tài khoản APXBank. Giao dịch được xác nhận nguyên tử trên máy chủ.</small><button class="button button-gold" type="submit">Xác nhận chuyển</button></form>' + (!id ? '<p class="apx-bank-inline-error">Đang đồng bộ ID tài khoản; thử lại sau khi hồ sơ tải xong.</p>' : '');
  }
  function savingsPage(state) {
    var b = ensure(state), plan = SAVINGS[savingPlan] || SAVINGS.flexible, amount = Math.max(0, Number(savingAmount) || 0);
    var interest = Math.round(amount * plan.rate);
    var maturity = plan.days ? 'Ngày game ' + (Number(state.day || 1) + plan.days) : 'Linh hoạt · nhận lãi mỗi ngày game';
    var cards = Object.keys(SAVINGS).map(function (key) { var item = SAVINGS[key]; return '<button class="apx-bank-plan ' + (savingPlan === key ? 'active' : '') + '" type="button" data-bank-action="select-plan" data-plan="' + key + '"><strong>' + item.name + '</strong><span>Lãi ' + (item.daily ? (item.rate * 100).toFixed(2) + '% / ngày' : (item.rate * 100).toFixed(1) + '% / kỳ') + '</span><small>Tối thiểu ' + money(item.min) + '</small></button>'; }).join('');
    var list = b.savings.length ? b.savings.slice().reverse().map(function (s) { var active = s.status === 'active'; return '<article class="apx-bank-loan-card"><div class="apx-bank-panel-head"><strong>' + esc((SAVINGS[s.packageId] || {}).name || 'Tiết kiệm') + '</strong><span class="apx-bank-status ' + (active ? 'active' : 'paid') + '">' + (active ? 'Đang gửi' : s.status === 'matured' ? 'Đã đáo hạn' : 'Đã rút') + '</span></div><div class="apx-bank-loan-facts"><span>Số tiền hiện tại<strong>' + money(savingValue(s)) + '</strong></span><span>Lãi dự kiến<strong>' + money(s.accruedInterest != null ? s.accruedInterest : s.expectedInterest) + '</strong></span><span>Ngày đáo hạn<strong>' + (s.maturityDay ? 'Ngày game ' + s.maturityDay : 'Không kỳ hạn') + '</strong></span></div>' + (active && s.daily ? '<button class="button" type="button" data-bank-action="withdraw-saving" data-id="' + esc(s.id) + '">Rút khoản tiết kiệm</button>' : '') + '</article>'; }).join('') : '<div class="apx-bank-empty">Chưa có khoản tiết kiệm.</div>';
    return '<header class="apx-bank-heading"><div><span class="eyebrow">APXBANK · TIẾT KIỆM</span><h2>Tiết kiệm APXBank</h2></div><strong class="apx-bank-balance-pill">Số dư ' + money(b.accountBalance) + '</strong></header><div class="apx-bank-plans">' + cards + '</div><section class="apx-bank-two-col"><form class="apx-bank-form apx-bank-panel" data-bank-form="saving"><h3>Gửi ' + esc(plan.name) + '</h3><label>Số tiền<input name="amount" data-bank-saving-amount type="number" min="' + plan.min + '" step="1" value="' + amount + '" required></label>' + quickAmounts(b.accountBalance) + '<div class="apx-bank-preview-grid"><span>Tiền gốc<strong data-saving-principal>' + money(amount) + '</strong></span><span>Lãi dự kiến<strong data-saving-interest>' + money(interest) + '</strong></span><span>Ngày đáo hạn<strong data-saving-maturity>' + esc(maturity) + '</strong></span><span>Dự kiến nhận<strong data-saving-total>' + money(amount + interest) + '</strong></span></div><small>Lãi suất ' + (plan.daily ? (plan.rate * 100).toFixed(2) + '% mỗi ngày game' : (plan.rate * 100).toFixed(1) + '% / kỳ') + ' · Tối thiểu ' + money(plan.min) + '</small><button class="button button-gold" type="submit">Gửi tiết kiệm</button></form><section class="apx-bank-panel"><h3>Khoản tiết kiệm của tôi</h3><div class="apx-bank-stack">' + list + '</div></section></section>';
  }
  function loanState(loan, day) {
    if (loan.status === 'paid' || Number(loan.remainingBalance) <= 0) return ["Đã tất toán", "paid"];
    if (loan.status === 'overdue' || day > Number(loan.dueDay)) return ["Quá hạn", "overdue"];
    if (day >= Number(loan.dueDay)) return ["Đến hạn", "due"];
    if (Number(loan.dueDay) - day <= 2) return ["Sắp đến hạn", "soon"];
    return ["Đang trả", "active"];
  }
  function loanCard(state, loan) {
    var b = ensure(state), status = loanState(loan, Number(state.day) || 1), left = Math.max(0, Number(loan.dueDay) - Number(state.day || 1));
    return '<article class="apx-bank-loan-card"><div class="apx-bank-panel-head"><strong>Khoản vay ' + money(loan.principal) + '</strong><span class="apx-bank-status ' + status[1] + '">' + status[0] + '</span></div><div class="apx-bank-loan-facts"><span>Ban đầu<strong>' + money(loan.principal) + '</strong></span><span>Còn nợ<strong>' + money(loan.remainingBalance) + '</strong></span><span>Lãi suất<strong>' + (Number(loan.interestRate) * 100).toFixed(1) + '% / kỳ</strong></span><span>Đáo hạn<strong>Ngày game ' + loan.dueDay + '</strong></span><span>Còn lại<strong>' + left + ' ngày</strong></span><span>Ngày góp kế tiếp<strong>Ngày game ' + loan.nextPaymentDay + '</strong></span></div>' + (loan.status !== 'paid' && Number(loan.remainingBalance) > 0 ? '<form class="apx-bank-repay" data-bank-form="repay"><input type="hidden" name="loan_id" value="' + esc(loan.id) + '"><input name="amount" type="number" min="1" max="' + loan.remainingBalance + '" step="1" value="' + Math.min(loan.installmentAmount, loan.remainingBalance) + '" required>' + quickAmounts(loan.remainingBalance) + '<button class="button button-gold" type="submit">Thanh toán</button><button class="button" type="button" data-bank-action="pay-all" data-id="' + esc(loan.id) + '">Tất toán</button></form>' : '') + '</article>';
  }
  function loansPage(state) {
    var b = ensure(state), t = totals(state), amount = Math.max(0, Number(loanAmount) || 0), term = Number(document.querySelector("[data-bank-loan-term]") && document.querySelector("[data-bank-loan-term]").value) || 7;
    var rate = LOAN_TERMS[term] || LOAN_TERMS[7], interest = Math.ceil(amount * rate), total = amount + interest;
    var eligible = amount >= 100000 && amount <= t.availableLoan;
    var loans = b.loans.length ? b.loans.slice().reverse().map(function (loan) { return loanCard(state, loan); }).join('') : '<div class="apx-bank-empty">Chưa có khoản vay.</div>';
    return '<header class="apx-bank-heading"><div><span class="eyebrow">APXBANK · TÍN DỤNG</span><h2>Vay tiền</h2></div></header><section class="apx-bank-metrics">' + metric('Hạn mức vay hiện tại', money(t.limit), 'credit') + metric('Điểm tín dụng', t.credit + ' · ' + creditRank(t.credit)) + metric('Tổng tài sản', money(t.assets)) + metric('Tổng nợ', money(t.debt), 'debt') + metric('Khả năng vay', money(t.availableLoan), 'primary') + '</section><section class="apx-bank-two-col"><form class="apx-bank-form apx-bank-panel" data-bank-form="loan"><h3>Gửi yêu cầu vay</h3><label>Số tiền muốn vay<input name="amount" data-bank-loan-amount type="number" min="100000" max="' + t.availableLoan + '" step="1" value="' + amount + '" required></label>' + quickAmounts(t.availableLoan) + '<label>Thời hạn<select name="term" data-bank-loan-term>' + [3, 7, 30, 90].map(function (d) { return '<option value="' + d + '" ' + (term === d ? 'selected' : '') + '>' + d + ' ngày game</option>'; }).join('') + '</select></label><div class="apx-bank-preview-grid"><span>Lãi suất<strong data-loan-rate>' + (rate * 100).toFixed(1) + '% / kỳ</strong></span><span>Tiền gốc<strong data-loan-principal>' + money(amount) + '</strong></span><span>Tiền lãi<strong data-loan-interest>' + money(interest) + '</strong></span><span>Tổng phải trả<strong data-loan-total>' + money(total) + '</strong></span><span>Ngày đáo hạn<strong data-loan-maturity>Ngày game ' + (Number(state.day || 1) + term - 1) + '</strong></span></div><p data-loan-eligibility class="apx-bank-loan-eligibility ' + (eligible ? 'good' : 'bad') + '">' + (eligible ? 'Đủ điều kiện vay' : 'Khoản vay vượt hạn mức') + '</p><small>APXBank tự động thu từng khoản góp mỗi ngày game từ số dư APXBank.</small><button class="button button-gold" type="submit" data-bank-loan-submit ' + (!eligible ? 'disabled' : '') + '>Gửi yêu cầu vay</button></form><section class="apx-bank-panel"><div class="apx-bank-panel-head"><h3>Khoản vay của tôi</h3><strong>' + b.loans.filter(function (l) { return l.status !== 'paid'; }).length + ' đang mở</strong></div><div class="apx-bank-stack">' + loans + '</div></section></section>';
  }
  function creditPage(state) {
    var b = ensure(state), t = totals(state), paid = b.loans.filter(function (l) { return l.status === 'paid'; }).length, open = b.loans.filter(function (l) { return l.status !== 'paid'; }).length, pct = Math.round((t.credit - 300) / 550 * 100);
    return '<header class="apx-bank-heading"><div><span class="eyebrow">APXBANK · LỊCH SỬ TÍN DỤNG</span><h2>Hồ sơ tín dụng</h2></div><span class="apx-bank-credit-badge">Hạng ' + creditRank(t.credit) + '</span></header><section class="apx-bank-credit-score"><div><small>Điểm tín dụng</small><strong>' + t.credit + '</strong><span>Hạng ' + creditRank(t.credit) + ' · ' + creditStatus(t.credit) + '</span></div><div class="apx-bank-scorebar"><span style="width:' + pct + '%"></span></div><div class="apx-bank-score-scale"><span>300 · Rủi ro cao</span><span>850 · Xuất sắc</span></div></section><section class="apx-bank-metrics">' + metric('Tổng khoản vay', b.loans.length) + metric('Đã tất toán', paid) + metric('Đang tồn tại', open) + metric('Trả đúng hạn', b.counters.onTime) + metric('Lần quá hạn', b.counters.late, 'debt') + metric('Nợ hiện tại', money(t.debt), 'debt') + metric('Hạn mức vay', money(t.limit), 'credit') + '</section><section class="apx-bank-panel"><h3>Các khoản vay</h3><div class="apx-bank-stack">' + (b.loans.length ? b.loans.slice().reverse().map(function (l) { return loanCard(state, l); }).join('') : '<div class="apx-bank-empty">Chưa có lịch sử tín dụng.</div>') + '</div></section>';
  }
  function historyPage(state) {
    var b = ensure(state), types = Array.from(new Set(b.transactions.map(function (t) { return t.type; })));
    var items = b.transactions.filter(function (t) { return txFilter === 'all' || t.type === txFilter; });
    return '<header class="apx-bank-heading"><div><span class="eyebrow">APXBANK · GIAO DỊCH</span><h2>Lịch sử giao dịch</h2></div><select data-bank-filter aria-label="Lọc loại giao dịch"><option value="all">Tất cả loại</option>' + types.map(function (type) { return '<option value="' + esc(type) + '" ' + (txFilter === type ? 'selected' : '') + '>' + esc(txNames[type] || type) + '</option>'; }).join('') + '</select></header><section class="apx-bank-panel"><div class="apx-bank-table-wrap"><table class="apx-bank-table"><thead><tr><th>Thời gian</th><th>Loại giao dịch</th><th>Nội dung</th><th>Số tiền</th><th>Số dư APXBank</th></tr></thead><tbody>' + (items.length ? items.map(function (tx) { var positive = Number(tx.amount) >= 0; return '<tr><td>' + dateText(tx.createdAt) + '<small>Ngày game ' + Number(tx.gameDay || 1) + '</small></td><td>' + esc(txNames[tx.type] || tx.type) + '</td><td>' + esc(tx.memo) + '</td><td class="' + (positive ? 'positive' : 'negative') + '">' + (positive ? '+' : '−') + money(Math.abs(Number(tx.amount))) + '</td><td>' + money(tx.balanceAfter) + '</td></tr>'; }).join('') : '<tr><td colspan="5" class="apx-bank-empty">Chưa có giao dịch phù hợp.</td></tr>') + '</tbody></table></div></section><section class="apx-bank-panel"><div class="apx-bank-panel-head"><h3>Thông báo</h3><span>' + unreadCount(b) + ' chưa đọc</span></div>' + notificationList(state, false) + '</section>';
  }
  function render(view, state) {
    var b = ensure(state), page = view === "overview" ? overview(state) : view === "account" ? accountPage(state) : view === "transfer" ? transferPage(state) : view === "savings" ? savingsPage(state) : view === "loans" ? loansPage(state) : view === "credit" ? creditPage(state) : historyPage(state);
    return shell(state, page);
  }
  function commit(state, message, waitForServer) {
    ensure(state);
    if (window.APXCharacter && window.APXCharacter.metrics) window.APXCharacter.metrics(state);
    if (!window.APXGame) return Promise.resolve(false);
    var account = window.APXAccount;
    if (waitForServer && account && account.isLoggedIn && account.isLoggedIn() && account.flushSave) {
      window.APXGame.save(true);
      return account.flushSave().then(function () {
        window.APXGame.render();
        if (message) window.APXGame.toast(message);
        return true;
      }).catch(async function (error) {
        try { if (account.sync) await account.sync(); } catch (_) {}
        window.APXGame.render();
        window.APXGame.toast("Giao dịch chưa được lưu trên máy chủ: " + (error && error.message ? error.message : "lỗi đồng bộ"), "warning");
        return false;
      });
    }
    window.APXGame.save();
    window.APXGame.render();
    if (message) window.APXGame.toast(message);
    return Promise.resolve(true);
  }
  function parseAmount(value) {
    var amount = Number(value);
    if (!Number.isSafeInteger(amount) || amount <= 0) throw new Error("Nhập số tiền nguyên lớn hơn 0.");
    return amount;
  }
  function gameIncome(state, type, amount, memo) {
    var value = parseAmount(amount), b = ensure(state);
    addTx(state, type, value, memo);
    notify(state, "income", type === "salary" ? "Đã nhận lương" : "Đã nhận tiền", memo + " · " + money(value) + ".");
    b.observedCash = Math.max(0, Number(state.cash) || 0);
  }
  function recordCareerSalary(state, shiftId, amount, memo) {
    var value = parseAmount(amount), message = String(memo || "Lương ca làm");
    if (!shiftId) throw new Error("Thiếu mã ca làm để xác nhận lương.");
    if (window.APXAccount && window.APXAccount.isLoggedIn && window.APXAccount.isLoggedIn()) {
      if (typeof window.APXAccount.creditCareerSalary !== "function") {
        throw new Error("Hệ thống lưu lương APXBank chưa sẵn sàng.");
      }
      return window.APXAccount.creditCareerSalary(shiftId, value, message);
    }

    var b = ensure(state);
    b.accountBalance += value;
    addTx(state, "salary", value, message, { id: String(shiftId) });
    notify(state, "income", "Đã nhận lương", message + " · " + money(value) + " đã vào APXBank.");
    return Promise.resolve(true);
  }
  async function claimLawyerCaseReward(state, caseId, amount, memo) {
    var value = parseAmount(amount), id = "lawyer-case-" + String(caseId || "");
    if (!/^lawyer-case-[A-Za-z0-9_-]{1,64}$/.test(id)) throw new Error("Mã vụ án không hợp lệ để nhận thưởng.");
    var message = String(memo || "Thưởng hoàn thành vụ án");
    if (window.APXAccount && window.APXAccount.isLoggedIn && window.APXAccount.isLoggedIn()) {
      if (!window.APXAccount.getSupabaseClient || !window.APXAccount.flushSave || !window.APXAccount.sync) {
        throw new Error("Hệ thống lưu thưởng vụ án chưa sẵn sàng.");
      }
      window.APXGame.save();
      await window.APXAccount.flushSave();
      var db = await window.APXAccount.getSupabaseClient();
      var result = await db.rpc("apx_lawyer_case_reward", {
        p_case_id: String(caseId),
        p_amount: value,
        p_memo: message
      });
      if (result.error) {
        if (/apx_lawyer_case_reward|function.*not found|schema cache/i.test(result.error.message || "")) {
          throw new Error("Thưởng vụ án trên tài khoản cần migration 202610040001_apx_lawyer_case_reward.sql trong Supabase.");
        }
        throw result.error;
      }
      await window.APXAccount.sync();
      return true;
    }

    var b = ensure(state);
    if (b.transactions.some(function (transaction) { return transaction.id === id; })) return Promise.resolve(true);
    b.accountBalance += value;
    addTx(state, "lawyer-reward", value, message, { id: id });
    notify(state, "income", "Đã nhận thưởng vụ án", message + " · " + money(value) + " đã vào APXBank.");
    return Promise.resolve(true);
  }
  function addLoanPayment(state, loan, amount, automatic) {
    var b = ensure(state), pay = Math.min(Math.max(0, Number(amount) || 0), Number(loan.remainingBalance) || 0);
    if (!pay) return 0;
    b.accountBalance -= pay;
    loan.remainingBalance -= pay;
    loan.paidAmount = (Number(loan.paidAmount) || 0) + pay;
    loan.lastPaidDay = Number(state.day) || 1;
    if (state.character) state.character.debt = Math.max(0, (Number(state.character.debt) || 0) - pay);
    addTx(state, automatic ? "debt-collection" : "loan-payment", -pay, (automatic ? "Khoản góp vay " : "Thanh toán khoản vay ") + loan.id, { loanId: loan.id });
    if (loan.remainingBalance <= 0) {
      loan.remainingBalance = 0;
      loan.status = "paid";
      loan.paidAt = new Date().toISOString();
      notify(state, "loan-paid", "Khoản vay đã tất toán", "Khoản vay " + money(loan.principal) + " đã được thanh toán hết.");
    } else if (Number(state.day) > Number(loan.dueDay)) loan.status = "overdue";
    return pay;
  }
  function processDay(state, closedDay) {
    var b = ensure(state), day = Number(closedDay);
    if (!Number.isSafeInteger(day) || day <= Number(b.lastProcessedDay)) return;
    b.savings.forEach(function (s) {
      if (s.status !== "active") return;
      if (s.daily) {
        var interest = Math.floor(savingValue(s) * Number(s.rate));
        if (interest > 0) {
          s.currentValue = savingValue(s) + interest;
          s.accruedInterest = (Number(s.accruedInterest) || 0) + interest;
          addTx(state, "interest", interest, "Lãi tiết kiệm không kỳ hạn · ngày game " + day, { savingId: s.id, savingBalanceAfter: s.currentValue });
          notify(state, "savings-interest", "Đã cộng lãi tiết kiệm", "Gói không kỳ hạn nhận " + money(interest) + "; số dư tiết kiệm " + money(s.currentValue) + ".");
        }
      } else if (day >= Number(s.maturityDay)) {
        s.status = "matured"; s.maturedAtDay = day;
        b.accountBalance += Number(s.principal) || 0;
        addTx(state, "savings-maturity", Number(s.principal) || 0, "Hoàn gốc tiết kiệm " + s.id, { savingId: s.id });
        if (Number(s.expectedInterest) > 0) { b.accountBalance += Number(s.expectedInterest); addTx(state, "interest", Number(s.expectedInterest), "Lãi tiết kiệm đáo hạn " + s.id, { savingId: s.id }); }
        notify(state, "savings-matured", "Tiền tiết kiệm đáo hạn", "Gốc và lãi " + money(Number(s.principal) + Number(s.expectedInterest)) + " đã về tài khoản APXBank.");
      }
    });
    b.loans.forEach(function (loan) {
      if (loan.status === "paid" || day < Number(loan.nextPaymentDay)) return;
      if (day === Number(loan.dueDay) - 1 && !loan.dueSoonNotified) { loan.dueSoonNotified = true; notify(state, "loan-due-soon", "Khoản vay sắp đến hạn", "Khoản vay còn " + money(loan.remainingBalance) + " và sẽ đáo hạn ngày game " + loan.dueDay + "."); }
      if (day === Number(loan.dueDay) && !loan.dueNotified) { loan.dueNotified = true; notify(state, "loan-due", "Khoản vay đến hạn", "APXBank sẽ thử thu khoản góp từ số dư tài khoản hôm nay."); }
      if (day > Number(loan.dueDay) && !loan.dueNotified) { loan.dueNotified = true; notify(state, "loan-overdue", "Khoản vay quá hạn", "Hãy thanh toán khoản góp còn lại cho APXBank."); }
      var due = Math.min(Number(loan.remainingBalance), Number(loan.installmentAmount));
      var available = Math.max(0, Number(b.accountBalance) || 0);
      if (available >= due) {
        var paid = addLoanPayment(state, loan, due, true);
        loan.paidInstallments = (Number(loan.paidInstallments) || 0) + 1;
        loan.nextPaymentDay = day + 1;
        if (paid > 0) notify(state, "debt-collected", "APXBank tự động thu nợ", "Đã thu " + money(paid) + " từ tài khoản.");
        if (loan.status !== "paid") loan.status = day > Number(loan.dueDay) ? "overdue" : "active";
        if (loan.status !== "paid" && day <= Number(loan.dueDay)) { b.counters.onTime += 1; scoreChange(state, 1, "Thanh toán kỳ vay đúng hạn"); }
        if (loan.status === "paid" && day <= Number(loan.dueDay)) { b.counters.onTime += 1; scoreChange(state, 20, "Tất toán khoản vay đúng hạn"); }
      } else {
        if (available > 0) addLoanPayment(state, loan, available, true);
        if (loan.status !== "paid") loan.status = "overdue";
        if (loan.status !== "paid" && Number(loan.penalizedInstallmentDay) !== Number(loan.nextPaymentDay)) {
          loan.penalizedInstallmentDay = Number(loan.nextPaymentDay);
          b.counters.late += 1;
          scoreChange(state, -12, "Kỳ thanh toán vay bị trễ");
          notify(state, "loan-overdue", "Khoản vay quá hạn", "Số dư APXBank không đủ cho kỳ góp. Hãy nạp tiền hoặc thanh toán thủ công.");
        }
      }
    });
    b.lastProcessedDay = day;
  }
  function persistDayClose() {
    var account = window.APXAccount;
    if (!window.APXGame || !account || !account.isLoggedIn || !account.isLoggedIn() || !account.flushSave) return;
    window.APXGame.save(true);
    account.flushSave().catch(function (error) {
      window.APXGame.toast("Chưa đồng bộ được giao dịch APXBank trong ngày: " + (error && error.message ? error.message : "lỗi kết nối") + ". Game sẽ thử lưu lại.", "warning");
      if (account.queueSave) account.queueSave(window.APXGame.state);
    });
  }
  function savePackage(state, amount) {
    var b = ensure(state), plan = SAVINGS[savingPlan] || SAVINGS.flexible;
    if (amount < plan.min) throw new Error("Số tiền gửi tối thiểu là " + money(plan.min) + ".");
    if (b.accountBalance < amount) throw new Error("Số dư APXBank không đủ. Hãy nạp tiền trước.");
    var interest = plan.daily ? 0 : Math.round(amount * plan.rate);
    var record = { id: uuid(), packageId: plan.id, principal: amount, currentValue: amount, rate: plan.rate, daily: !!plan.daily, days: plan.days, expectedInterest: interest, accruedInterest: 0, startDay: Number(state.day) || 1, maturityDay: plan.days ? Number(state.day || 1) + plan.days : null, status: "active", createdAt: new Date().toISOString() };
    b.accountBalance -= amount;
    b.savings.push(record);
    addTx(state, "savings-open", -amount, "Gửi tiết kiệm " + plan.name, { savingId: record.id });
    notify(state, "savings-open", "Gửi tiết kiệm thành công", "Đã gửi " + money(amount) + " vào gói " + plan.name + ".");
  }
  function applyLoan(state, amount, term) {
    var b = ensure(state), t = totals(state), rate = LOAN_TERMS[term];
    if (!rate || amount < 100000) throw new Error("Khoản vay tối thiểu là " + money(100000) + ".");
    if (amount > t.availableLoan) throw new Error("Khoản vay vượt hạn mức hiện tại " + money(t.availableLoan) + ".");
    var interest = Math.ceil(amount * rate), total = amount + interest, loan = {
      id: uuid(), principal: amount, interestRate: rate, interest: interest, totalRepayment: total,
      remainingBalance: total, paidAmount: 0, termDays: term, startDay: Number(state.day) || 1,
      dueDay: Number(state.day || 1) + term - 1, nextPaymentDay: Number(state.day) || 1,
      installmentAmount: Math.ceil(total / term), paidInstallments: 0, status: "active", createdAt: new Date().toISOString()
    };
    b.loans.push(loan);
    b.accountBalance += amount;
    if (state.character) state.character.debt = (Number(state.character.debt) || 0) + total;
    addTx(state, "loan-disbursement", amount, "Giải ngân khoản vay " + loan.id, { loanId: loan.id });
    notify(state, "loan", "Khoản vay được duyệt", "APXBank đã giải ngân " + money(amount) + ". Tổng phải trả " + money(total) + ".");
  }
  async function transfer(state, data, form) {
    var amount = parseAmount(data.amount), target = String(data.recipient_id || "").trim(), memo = String(data.memo || "").trim();
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(target)) throw new Error("ID người nhận phải là UUID nhân vật APX hợp lệ.");
    if (target === profileId(state)) throw new Error("Không thể chuyển tiền cho chính mình.");
    if (amount > ensure(state).accountBalance) throw new Error("Số dư APXBank không đủ.");
    if (!window.APXAccount || !window.APXAccount.isLoggedIn()) throw new Error("Đăng nhập tài khoản APX để chuyển tiền.");
    var db = await window.APXAccount.getSupabaseClient();
    var fingerprint = JSON.stringify([profileId(state), target, amount, memo]);
    var pending;
    try { pending = JSON.parse(sessionStorage.getItem(pendingTransferStorageKey) || "null"); } catch (_) { pending = null; }
    if (pending && pending.fingerprint !== fingerprint) throw new Error("Còn một lệnh chuyển tiền trước chưa được xác nhận. Hãy gửi lại đúng thông tin của lệnh đó trước khi tạo giao dịch mới.");
    if (!pending) {
      pending = { fingerprint: fingerprint, id: uuid(), status: "preparing" };
      sessionStorage.setItem(pendingTransferStorageKey, JSON.stringify(pending));
    }
    if (pending.status !== "sent") {
      await window.APXAccount.flushSave();
      pending.status = "sent";
      sessionStorage.setItem(pendingTransferStorageKey, JSON.stringify(pending));
    }
    var result = await db.rpc("apx_bank_transfer", { p_recipient_character_id: target, p_amount: amount, p_memo: memo, p_request_id: pending.id });
    if (result.error) {
      sessionStorage.removeItem(pendingTransferStorageKey);
      if (/apx_bank_transfer|function.*not found|schema cache/i.test(result.error.message || "")) throw new Error("Chuyển tiền liên ngân hàng chưa sẵn sàng. Hãy chạy migration 202610020001_apx_bank_transfers.sql trong Supabase trước.");
      throw result.error;
    }
    if (window.APXAccount.sync) await window.APXAccount.sync();
    sessionStorage.removeItem(pendingTransferStorageKey);
    var playerName = result.data && result.data.recipient_name || String(data.recipient_name || "người nhận");
    if (window.APXGame) window.APXGame.toast("Đã chuyển " + money(amount) + " cho " + playerName + ".");
  }
  async function submit(event) {
    var form = event.target.closest("form[data-bank-form]");
    if (!form) return;
    event.preventDefault();
    var state = window.APXGame && window.APXGame.state;
    if (!state) return;
    var data = Object.fromEntries(new FormData(form).entries());
    var button = form.querySelector('[type="submit"]');
    try {
      if (button) { button.disabled = true; button.dataset.originalText = button.textContent; button.textContent = "Đang xác nhận…"; }
      var b = ensure(state);
      if (form.dataset.bankForm === "wallet") {
        var amount = parseAmount(data.amount), direction = form.querySelector("[data-direction]").dataset.direction;
        var account = window.APXAccount;
        if (account && account.isLoggedIn && account.isLoggedIn() && account.transferBankCash) {
          if (direction === "deposit" && (Number(state.cash) || 0) < amount) throw new Error("Ví game không đủ tiền để nạp.");
          if (direction === "withdraw" && b.accountBalance < amount) throw new Error("Số dư APXBank không đủ để rút.");
          if (button) button.textContent = "Đang xác nhận…";
          await account.transferBankCash(direction, amount);
          window.APXGame.render();
          window.APXGame.toast(direction === "withdraw" ? "Đã rút tiền về ví game." : "Đã nạp tiền vào APXBank.");
          return;
        }
        if (direction === "deposit") {
          if ((Number(state.cash) || 0) < amount) throw new Error("Ví game không đủ tiền để nạp.");
          state.cash -= amount; b.accountBalance += amount; addTx(state, "deposit", amount, "Nạp tiền từ ví game");
          notify(state, "deposit", "Nạp tiền thành công", "Đã nạp " + money(amount) + " vào APXBank.");
        } else {
          if (b.accountBalance < amount) throw new Error("Số dư APXBank không đủ để rút.");
          b.accountBalance -= amount; state.cash = (Number(state.cash) || 0) + amount; addTx(state, "withdraw", -amount, "Rút tiền về ví game");
          notify(state, "withdraw", "Rút tiền thành công", "Đã chuyển " + money(amount) + " về ví game.");
        }
        await commit(state, "Số dư APXBank đã được cập nhật.", true);
      } else if (form.dataset.bankForm === "saving") {
        savePackage(state, parseAmount(data.amount)); await commit(state, "Gửi tiết kiệm thành công.", true);
      } else if (form.dataset.bankForm === "loan") {
        var amountLoan = parseAmount(data.amount), term = Number(data.term); applyLoan(state, amountLoan, term); await commit(state, "APXBank đã duyệt và giải ngân khoản vay.", true);
      } else if (form.dataset.bankForm === "repay") {
        var loan = b.loans.find(function (item) { return item.id === data.loan_id; });
        if (!loan || loan.status === "paid") throw new Error("Không tìm thấy khoản vay còn nợ.");
        var pay = Math.min(parseAmount(data.amount), Number(loan.remainingBalance));
        if (b.accountBalance < pay) throw new Error("Số dư APXBank không đủ. Hãy nạp tiền trước.");
        addLoanPayment(state, loan, pay, false); await commit(state, "Đã thanh toán " + money(pay) + " cho khoản vay.", true);
      } else if (form.dataset.bankForm === "transfer") {
        await transfer(state, data, form); window.APXGame.render();
      }
    } catch (error) {
      if (window.APXGame) { window.APXGame.render(); window.APXGame.toast(error.message || "Không thể hoàn tất giao dịch.", "warning"); }
    } finally {
      if (button) { button.disabled = false; if (button.dataset.originalText) button.textContent = button.dataset.originalText; }
    }
  }
  function action(button) {
    var state = window.APXGame && window.APXGame.state;
    if (!state) return;
    if (button.hasAttribute("data-bank-quick-amount")) {
      var amountInput = button.closest("form") && button.closest("form").querySelector('[name="amount"]');
      if (amountInput) { amountInput.value = button.dataset.bankQuickAmount; amountInput.dispatchEvent(new Event("input", { bubbles: true })); }
      return;
    }
    var b = ensure(state), id = button.dataset.id;
    if (button.dataset.bankView) { b.view = button.dataset.bankView; return commit(state); }
    if (button.dataset.bankAction === "close") {
      var route = b.returnRoute;
      b.view = "overview";
      if (route && window.APXNav.getPage(route.section, route.page)) window.APXNav.go(route.section, route.page);
      else window.APXNav.go("career", "current");
      return;
    }
    if (button.dataset.bankAction === "select-plan") { savingPlan = button.dataset.plan; savingAmount = Math.max(savingAmount, (SAVINGS[savingPlan] || SAVINGS.flexible).min); return window.APXGame.render(); }
    if (button.dataset.bankAction === "read-notice") { var notice = b.notifications.find(function (n) { return n.id === id; }); if (notice) notice.read = true; return commit(state); }
    if (button.dataset.bankAction === "copy-id") {
      var accountId = profileId(state);
      if (!accountId) return window.APXGame.toast("ID tài khoản đang đồng bộ.", "warning");
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(accountId).then(function () { window.APXGame.toast("Đã sao chép ID APXBank."); }).catch(function () { window.APXGame.toast(accountId); });
      else window.APXGame.toast(accountId);
      return;
    }
    if (button.dataset.bankAction === "withdraw-saving") {
      var saving = b.savings.find(function (s) { return s.id === id && s.daily && s.status === "active"; });
      if (!saving) return;
      var value = savingValue(saving); saving.status = "withdrawn"; saving.closedAt = new Date().toISOString();
      b.accountBalance += value; addTx(state, "savings-withdraw", value, "Rút tiết kiệm không kỳ hạn", { savingId: saving.id });
      notify(state, "savings-withdraw", "Đã rút tiết kiệm", "Đã chuyển " + money(value) + " về APXBank."); return commit(state, "Đã rút tiền tiết kiệm.", true);
    }
    if (button.dataset.bankAction === "pay-all") {
      var loan = b.loans.find(function (l) { return l.id === id && l.status !== "paid"; });
      if (!loan) return;
      if (b.accountBalance < loan.remainingBalance) return window.APXGame.toast("Số dư APXBank không đủ để tất toán.", "warning");
      addLoanPayment(state, loan, loan.remainingBalance, false); return commit(state, "Khoản vay đã được thanh toán.", true);
    }
  }
  function updateSavingPreview() {
    var state = window.APXGame && window.APXGame.state, form = document.querySelector('[data-bank-form="saving"]');
    if (!state || !form) return;
    var amount = Math.max(0, Number(form.elements.amount.value) || 0), plan = SAVINGS[savingPlan] || SAVINGS.flexible;
    var interest = Math.round(amount * plan.rate);
    var values = { "[data-saving-principal]": money(amount), "[data-saving-interest]": money(interest), "[data-saving-maturity]": plan.days ? "Ngày game " + (Number(state.day || 1) + plan.days) : "Linh hoạt · nhận lãi mỗi ngày game", "[data-saving-total]": money(amount + interest) };
    Object.keys(values).forEach(function (selector) { var node = form.querySelector(selector); if (node) node.textContent = values[selector]; });
  }
  function updateLoanPreview() {
    var state = window.APXGame && window.APXGame.state, form = document.querySelector('[data-bank-form="loan"]');
    if (!state || !form) return;
    var amount = Math.max(0, Number(form.elements.amount.value) || 0), term = Number(form.elements.term.value) || 7, rate = LOAN_TERMS[term] || LOAN_TERMS[7];
    var t = totals(state), interest = Math.ceil(amount * rate), eligible = amount >= 100000 && amount <= t.availableLoan;
    var values = { "[data-loan-rate]": (rate * 100).toFixed(1) + "% / kỳ", "[data-loan-principal]": money(amount), "[data-loan-interest]": money(interest), "[data-loan-total]": money(amount + interest), "[data-loan-maturity]": "Ngày game " + (Number(state.day || 1) + term - 1) };
    Object.keys(values).forEach(function (selector) { var node = form.querySelector(selector); if (node) node.textContent = values[selector]; });
    var notice = form.querySelector("[data-loan-eligibility]"), button = form.querySelector("[data-bank-loan-submit]"), amountInput = form.elements.amount;
    if (notice) { notice.textContent = eligible ? "Đủ điều kiện vay" : "Khoản vay vượt hạn mức"; notice.className = "apx-bank-loan-eligibility " + (eligible ? "good" : "bad"); }
    if (button) button.disabled = !eligible;
    if (amountInput) amountInput.max = t.availableLoan;
  }
  function input(event) {
    var target = event.target;
    if (target.matches("[data-bank-saving-amount]")) { savingAmount = Math.max(0, Number(target.value) || 0); updateSavingPreview(); }
    if (target.matches("[data-bank-loan-amount]")) { loanAmount = Math.max(0, Number(target.value) || 0); updateLoanPreview(); }
    if (target.matches("[data-bank-transfer-amount]")) {
      var state = window.APXGame.state, balance = ensure(state).accountBalance, amount = Number(target.value) || 0;
      var text = money(Math.max(0, balance - amount));
      var preview = document.querySelector("[data-bank-balance-after]"); if (preview) preview.textContent = text;
      var secondary = document.getElementById("apxBankTransferPreview"); if (secondary) secondary.textContent = text;
    }
  }
  function change(event) {
    var target = event.target;
    if (target.matches("[data-bank-filter]")) { txFilter = target.value; return window.APXGame.render(); }
    if (target.matches("[data-bank-loan-term]")) updateLoanPreview();
  }

  window.APXBank = {
    prepareState: ensure,
    observeCash: observeCash,
    recordGameIncome: gameIncome,
    recordCareerSalary: recordCareerSalary,
    claimLawyerCaseReward: claimLawyerCaseReward,
    onGameDayClosed: processDay,
    persistDayClose: persistDayClose,
    refreshTotals: totals,
    getCreditLimit: function (state) { return totals(state).limit; },
    render: render
  };
  window.APXPages.bank = function (page, state) {
    var b = ensure(state);
    if (!window.APXAccount || !window.APXAccount.isLoggedIn()) return shell(state, '<header class="apx-bank-heading"><div><span class="eyebrow">APXBANK · ĐĂNG NHẬP</span><h2>Đăng nhập để mở tài khoản</h2></div></header><button class="button button-gold" type="button" data-action="section" data-section="account">Đăng nhập APX</button>');
    return render(b.view, state);
  };
  document.addEventListener("click", function (event) { var button = event.target.closest("[data-bank-action], [data-bank-view], [data-bank-quick-amount]"); if (button) action(button); });
  document.addEventListener("submit", submit);
  document.addEventListener("input", input);
  document.addEventListener("change", change);
})();

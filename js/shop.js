/* APX Shop: focused employee-recruitment supply. */
window.APXPages = window.APXPages || {};
(function () {
  "use strict";

  function escapeHTML(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, function (character) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[character];
    });
  }

  window.APXPages.shop = function (page, state) {
    var ticket = (window.APX_DATA.items || []).find(function (item) { return item.id === "recruitment-ticket"; });
    if (!ticket) {
      return '<header class="page-heading"><span class="eyebrow">APX TALENT NETWORK</span><h1>Cửa hàng</h1></header>' +
        '<section class="panel shop-empty" role="alert"><h2>Không tải được danh mục vé tuyển dụng</h2><p>Hãy tải lại trò chơi hoặc báo lỗi này cho quản trị viên.</p></section>';
    }
    var quantity = Math.max(0, Number(state.inventory && state.inventory[ticket.id]) || 0);
    var price = Math.max(0, Number(ticket.price) || 0);
    var canAfford = (Number(state.cash) || 0) >= price;
    var hasCompany = Boolean(window.APXCompanies && window.APXCompanies.getCompanies(state).length);
    var canBuy = canAfford && hasCompany;
    var buttonLabel = !hasCompany ? "Cần thành lập công ty" : canAfford ? "Mua 1 vé" : "Không đủ tiền";
    return '<header class="page-heading"><span class="eyebrow">APX TALENT NETWORK</span><h1>Cửa hàng tuyển dụng</h1><p>Đầu tư vào đội ngũ là một quyết định vận hành: mỗi nhân viên mở thêm năng lực, đồng thời làm tăng chi phí lương.</p></header>' +
      '<section class="shop-balance panel"><span>TIỀN MẶT CÁ NHÂN</span><strong>' + window.APXUI.money(state.cash) + '</strong><span>Vé đang có: ' + quantity + '</span></section>' +
      '<section class="shop-catalog panel"><article class="shop-product"><div class="shop-product-copy"><span class="eyebrow">' + escapeHTML(ticket.type) + ' · ' + escapeHTML(ticket.rarity) + '</span><h2>' + escapeHTML(ticket.name) + '</h2><p>' + escapeHTML(ticket.description) + '</p><p class="shop-product-effect">' + escapeHTML(ticket.effect) + '</p></div><div class="shop-product-buy"><strong>' + window.APXUI.money(price) + '</strong><button class="button button-gold" type="button" data-action="buy-recruitment-ticket"' + (canBuy ? '' : ' disabled') + '>' + buttonLabel + '</button></div></article></section>' +
      '<section class="panel shop-guidance"><h2>Trước khi tuyển</h2><p>Trong mục Nhân viên → Tuyển dụng, xem trước hồ sơ, kỹ năng, hiệu suất và lương tháng của tối đa 3 ứng viên đang được chào. Danh sách luân phiên theo ngày game; vé chỉ bị tiêu hao khi bạn xác nhận tuyển.</p></section>';
  };
})();
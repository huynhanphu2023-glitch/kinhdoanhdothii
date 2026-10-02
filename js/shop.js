/* APX Shop: empty storefront until items are added. */
window.APXPages = window.APXPages || {};
(function () {
  "use strict";

  window.APXPages.shop = function () {
    return '<header class="page-heading"><span class="eyebrow">APX MARKETPLACE</span><h1>Shop</h1></header>' +
      '<section class="shop-empty panel"><span class="shop-empty-mark" aria-hidden="true">APX</span><h2>Chưa có vật phẩm</h2></section>';
  };
})();
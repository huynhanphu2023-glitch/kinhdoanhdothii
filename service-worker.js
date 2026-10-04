"use strict";

var CACHE_NAME = "apx-pwa-shell-v20";
var APP_SHELL = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./assets/icons/apx-pwa.svg",
  "./css/style.css",
  "./css/components.css",
  "./css/account.css",
  "./css/career.css",
  "./css/lawyer-cases.css",
  "./css/apx-bank.css",
  "./css/phone.css",
  "./css/apx-light-theme.css?v=20261003-modern-latte",
  "./js/data.js",
  "./js/navigation.js",
  "./js/character.js",
  "./js/city.js",
  "./js/marketplace.js",
  "./js/company.js",
  "./js/apx-life.js",
  "./js/inventory.js",
  "./js/shop.js",
  "./js/employees.js",
  "./js/investments.js",
  "./js/community.js",
  "./js/career.js",
  "./js/cases/case_001.js",
  "./js/cases/case_002.js",
  "./js/cases/case_003.js",
  "./js/cases/case_004.js",
  "./js/cases/case_005.js",
  "./js/cases/case_006.js",
  "./js/lawyer-cases.js",
  "./js/questData.js",
  "./js/questSystem.js",
  "./js/apx-bank.js",
  "./js/main.js",
  "./js/music.js",
  "./js/character-system.js",
  "./js/company-system.js",
  "./js/wardrobe.js",
  "./js/supabase-config.js",
  "./js/account-system.js",
  "./js/phone.js",
  "./js/pwa.js"
];

self.addEventListener("install", function (event) {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function (cache) { return cache.addAll(APP_SHELL); })
      .then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.map(function (key) {
        if (key !== CACHE_NAME && key.indexOf("apx-pwa-") === 0) return caches.delete(key);
        return Promise.resolve(false);
      }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener("fetch", function (event) {
  var request = event.request;
  var url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).then(function (response) {
        if (response.ok) {
          var copy = response.clone();
          caches.open(CACHE_NAME).then(function (cache) { cache.put("./index.html", copy); });
        }
        return response;
      }).catch(function () {
        return caches.match(request).then(function (cached) {
          return cached || caches.match("./index.html");
        });
      })
    );
    return;
  }

  if (!/\.(?:css|js|json|webmanifest|svg|png|jpe?g|webp|woff2?)$/i.test(url.pathname)) return;
  var update = fetch(request).then(function (response) {
    if (response.ok && response.type === "basic") {
      return caches.open(CACHE_NAME).then(function (cache) {
        return cache.put(request, response.clone()).then(function () { return response; });
      });
    }
    return response;
  });
  event.waitUntil(update.then(function () {}, function () {}));
  event.respondWith(
    caches.match(request).then(function (cached) {
      return cached || update;
    })
  );
});

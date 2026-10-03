(function () {
  "use strict";

  var installButton = document.getElementById("pwaInstallButton");
  var installPrompt = null;
  var isStandalone = window.matchMedia("(display-mode: standalone)").matches ||
    window.navigator.standalone === true;

  function showInstallHelp() {
    var message = /iphone|ipad|ipod/i.test(window.navigator.userAgent)
      ? "Để cài APX trên iPhone/iPad: mở bằng Safari, chạm nút Chia sẻ rồi chọn “Thêm vào Màn hình chính”."
      : "Trình duyệt chưa sẵn sàng hiện lời mời cài đặt. Hãy mở APX bằng Chrome hoặc Edge rồi chọn “Cài đặt ứng dụng” trong menu trình duyệt.";
    if (window.APXGame && window.APXGame.toast) window.APXGame.toast(message);
    else window.alert(message);
  }

  if (installButton) {
    if (isStandalone) {
      installButton.hidden = true;
    } else {
      installButton.addEventListener("click", function () {
        if (!installPrompt) {
          showInstallHelp();
          return;
        }

        installPrompt.prompt();
        installPrompt.userChoice.then(function () {
          installPrompt = null;
        }).catch(function (error) {
          console.error("APX PWA installation prompt failed.", error);
        });
      });
    }
  }

  window.addEventListener("beforeinstallprompt", function (event) {
    event.preventDefault();
    installPrompt = event;
    if (installButton) installButton.hidden = false;
  });

  window.addEventListener("appinstalled", function () {
    installPrompt = null;
    if (installButton) installButton.hidden = true;
    if (window.APXGame && window.APXGame.toast) window.APXGame.toast("APX đã được cài đặt trên thiết bị.");
  });

  if ("serviceWorker" in navigator && window.isSecureContext) {
    window.addEventListener("load", function () {
      navigator.serviceWorker.register("./service-worker.js", { scope: "./" })
        .catch(function (error) {
          console.error("APX offline support could not be enabled.", error);
        });
    }, { once: true });
  }
})();

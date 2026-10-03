/* Supabase auth, cloud saves and player reports. */

(function () {
  "use strict";

  var config = window.APX_SUPABASE_CONFIG || {};
  var configured = Boolean(config.url && config.anonKey);

  var clientPromise = null;
  var client = null;
  var profile = null;
  var saveTimer = null;
  var lastSyncedGameState = null;
  var pageMessage = "";
  var pendingOtpEmail = sessionStorage.getItem("apx-pending-otp-email") || "";
  var selectedPlayer = null;
  var adminData = null;

  var esc = function (value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, function (c) {
      return ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
      })[c];
    });
  };

  var money = function (value) {
    return window.APXUI.money(Number(value) || 0);
  };

  function supabase() {
    if (!configured) {
      return Promise.reject(new Error("Chưa cấu hình Supabase."));
    }

    if (!clientPromise) {
      clientPromise = import(
        "https://esm.sh/@supabase/supabase-js@2"
      ).then(function (sdk) {
        client = sdk.createClient(
          config.url,
          config.anonKey,
          {
            auth: {
              persistSession: true,
              autoRefreshToken: true,
              detectSessionInUrl: true
            }
          }
        );

        client.auth.onAuthStateChange(function (event, session) {
          if (event === "SIGNED_OUT") {
            window.clearTimeout(saveTimer);
            saveTimer = null;
            profile = null;
            if (window.APXLife && window.APXLife.reset) window.APXLife.reset();

            if (window.APXNav) {
              window.APXNav.render();
            }

            if (window.APXGame) {
              if (typeof window.APXGame.startGuestState === "function") {
                window.APXGame.startGuestState();
              } else {
                window.APXGame.render();
              }
            }
          }

          if (event === "SIGNED_IN" && session) {
            syncAccount().catch(showError);
          }
        });

        return client;
      });
    }

    return clientPromise;
  }

  function showError(error) {
    pageMessage =
      error && error.message
        ? error.message
        : String(error || "Đã xảy ra lỗi.");

    if (window.APXGame) {
      window.APXGame.render();
    }
  }

  async function syncAccount() {
    window.clearTimeout(saveTimer);
    saveTimer = null;
    if (window.APXLife && window.APXLife.reset) window.APXLife.reset();
    var db = await supabase();

    var auth = await db.auth.getSession();
    var session = auth.data && auth.data.session;

    if (!session) {
      profile = null;
      lastSyncedGameState = null;
      return;
    }

    var profileResult = await db
      .from("apx_player_profiles")
      .select(
        "user_id,character_id,display_name,avatar_url,is_banned,created_at"
      )
      .eq("user_id", session.user.id)
      .single();

    if (profileResult.error) {
      throw profileResult.error;
    }

    profile = profileResult.data;

    if (profile.is_banned) {
      await db.auth.signOut();
      throw new Error(
        "Tài khoản này đang bị khóa. Hãy liên hệ quản trị viên."
      );
    }

    var saveResult = await db
      .from("apx_game_saves")
      .select("game_state,revision,updated_at")
      .eq("user_id", profile.user_id)
      .maybeSingle();

    if (saveResult.error) {
      throw saveResult.error;
    }

    if (saveResult.data && saveResult.data.game_state) {
      lastSyncedGameState = copyGameState(saveResult.data.game_state);
      window.APXGame.loadCloudState(
        saveResult.data.game_state
      );
    } else {
      lastSyncedGameState = null;
      window.APXGame.createAccountState(profile);
      await writeSave(window.APXGame.state);
      pageMessage = "Đã tạo tiến trình mới và lưu riêng cho tài khoản này.";
    }

    if (
      window.APXGame.state &&
      window.APXGame.state.character &&
      window.APXGame.state.character.profile
    ) {
      window.APXGame.state.character.profile.avatar =
        profile.avatar_url || "";
    }

    pageMessage = "Đã kết nối tài khoản và đồng bộ dữ liệu.";

    window.APXNav.render();
    window.APXGame.render();
    if (window.APXWardrobe && window.APXWardrobe.syncPlayerAvatars) {
      window.APXWardrobe.syncPlayerAvatars();
    }
  }

  function copyGameState(state) {
    return JSON.parse(JSON.stringify(state));
  }

  function mergeCloudTransactionChanges(localState, cloudState) {
    if (!lastSyncedGameState || !cloudState) return;
    var cashDelta = (Number(cloudState.cash) || 0) - (Number(lastSyncedGameState.cash) || 0);
    if (cashDelta) localState.cash = (Number(localState.cash) || 0) + cashDelta;

    var previousInventory = lastSyncedGameState.inventory || {};
    var cloudInventory = cloudState.inventory || {};
    if (!localState.inventory || typeof localState.inventory !== "object") localState.inventory = {};
    Object.keys(Object.assign({}, previousInventory, cloudInventory)).forEach(function (itemId) {
      var quantityDelta = (Number(cloudInventory[itemId]) || 0) - (Number(previousInventory[itemId]) || 0);
      if (quantityDelta) localState.inventory[itemId] = (Number(localState.inventory[itemId]) || 0) + quantityDelta;
    });

    var previousCompanies = lastSyncedGameState.companyOperations && lastSyncedGameState.companyOperations.companies || {};
    var cloudCompanies = cloudState.companyOperations && cloudState.companyOperations.companies || {};
    var localCompanies = localState.companyOperations && localState.companyOperations.companies || {};

    Object.keys(cloudCompanies).forEach(function (companyId) {
      var previous = previousCompanies[companyId];
      var cloud = cloudCompanies[companyId];
      var local = localCompanies[companyId];
      if (!previous || !cloud || !local) return;

      ["cash", "revenue", "dailyRevenue", "totalRevenue"].forEach(function (key) {
        var delta = (Number(cloud[key]) || 0) - (Number(previous[key]) || 0);
        if (delta) local[key] = (Number(local[key]) || 0) + delta;
      });

      var previousProducts = previous.products || [];
      var cloudProducts = cloud.products || [];
      var localProducts = local.products || [];
      cloudProducts.forEach(function (cloudProduct) {
        var previousProduct = previousProducts.find(function (product) { return product.id === cloudProduct.id; });
        var localProduct = localProducts.find(function (product) { return product.id === cloudProduct.id; });
        if (!previousProduct || !localProduct) return;
        ["unitsSold", "totalSold", "revenue"].forEach(function (key) {
          var delta = (Number(cloudProduct[key]) || 0) - (Number(previousProduct[key]) || 0);
          if (delta) localProduct[key] = (Number(localProduct[key]) || 0) + delta;
        });
      });

      var stockDelta = (Number(cloud.inventory && cloud.inventory.stock) || 0) - (Number(previous.inventory && previous.inventory.stock) || 0);
      if (stockDelta && local.inventory) local.inventory.stock = (Number(local.inventory.stock) || 0) + stockDelta;
    });

    var previousBank = lastSyncedGameState.apxBank || {};
    var cloudBank = cloudState.apxBank || {};
    var localBank = localState.apxBank;
    if (localBank && Object.keys(cloudBank).length) {
      // Apply server deltas on top of unsaved local deltas so a concurrent
      // transfer cannot be lost when another bank action is queued locally.
      ["accountBalance", "totalReceived", "totalSpent"].forEach(function (key) {
        var bankDelta = (Number(cloudBank[key]) || 0) - (Number(previousBank[key]) || 0);
        if (bankDelta) localBank[key] = (Number(localBank[key]) || 0) + bankDelta;
      });
      ["transactions", "notifications"].forEach(function (key) {
        if (!Array.isArray(localBank[key])) localBank[key] = [];
        var previousIds = new Set((previousBank[key] || []).map(function (item) { return String(item.id); }));
        var localIds = new Set(localBank[key].map(function (item) { return String(item.id); }));
        (cloudBank[key] || []).forEach(function (item) {
          if (!previousIds.has(String(item.id)) && !localIds.has(String(item.id))) {
            localBank[key].unshift(item);
            localIds.add(String(item.id));
          }
        });
      });
    }

    lastSyncedGameState = copyGameState(cloudState);
  }

  async function flushSave() {
    window.clearTimeout(saveTimer);
    saveTimer = null;
    if (!profile) throw new Error("Hãy đăng nhập để đồng bộ số dư APXBank.");
    await withTimeout(supabase(), 12000, "Kết nối Supabase quá 12 giây không phản hồi.");
    if (!window.APXGame || !window.APXGame.state) throw new Error("Chưa tải tiến trình người chơi.");
    return withTimeout(writeSave(window.APXGame.state), 12000, "Supabase lưu quá 12 giây không phản hồi; hãy kiểm tra mạng hoặc trạng thái dịch vụ.");
  }

  async function transferBankCash(direction, amount) {
    if (!profile) throw new Error("Hãy đăng nhập để rút hoặc nạp tiền APXBank.");
    var db = await withTimeout(supabase(), 12000, "Supabase không phản hồi.");
    var result = await withTimeout(db.rpc("apx_bank_cash_transfer", {
      p_direction: direction, p_amount: amount
    }), 12000, "Supabase không phản hồi khi xử lý giao dịch.");
    if (result.error) throw result.error;
    if (!result.data || !result.data.game_state) throw new Error("Máy chủ không trả về số dư mới.");
    var game = window.APXGame;
    Object.keys(game.state).forEach(function (key) { delete game.state[key]; });
    Object.assign(game.state, result.data.game_state);
    lastSyncedGameState = copyGameState(result.data.game_state);
    game.save(true);
    return result.data;
  }

  async function creditCareerSalary(shiftId, amount, memo) {
    if (!profile) throw new Error("Hãy đăng nhập để nhận lương vào APXBank.");
    var game = window.APXGame;
    if (!game || !game.state) throw new Error("Chưa tải tiến trình người chơi.");
    var salary = Number(amount);
    if (!Number.isSafeInteger(salary) || salary <= 0 || salary > 1000000) {
      throw new Error("Số tiền lương không hợp lệ.");
    }
    if (!shiftId) throw new Error("Thiếu mã ca làm để xác nhận lương.");

    await flushSave();
    var db = await withTimeout(supabase(), 12000, "Supabase không phản hồi.");
    var result = await withTimeout(db.rpc("apx_bank_career_salary", {
      p_shift_id: String(shiftId),
      p_amount: salary,
      p_memo: String(memo || "")
    }), 12000, "Supabase không phản hồi khi chuyển lương vào APXBank.");
    if (result.error) throw result.error;
    if (!result.data || !result.data.game_state) {
      throw new Error("Máy chủ không trả về số dư APXBank mới.");
    }

    mergeCloudTransactionChanges(game.state, result.data.game_state);
    game.save();
    return result.data;
  }

  function withTimeout(promise, ms, message) {
    return new Promise(function (resolve, reject) {
      var timer = window.setTimeout(function () { reject(new Error(message)); }, ms);
      Promise.resolve(promise).then(function (value) { window.clearTimeout(timer); resolve(value); }, function (error) { window.clearTimeout(timer); reject(error); });
    });
  }

  async function syncTransactionChanges() {
    if (!profile) return;
    if (!lastSyncedGameState) return syncAccount();
    var db = await supabase();
    var result = await db.from("apx_game_saves")
      .select("game_state,revision")
      .eq("user_id", profile.user_id)
      .maybeSingle();
    if (result.error) throw result.error;
    if (!result.data || !result.data.game_state || !window.APXGame) return;
    mergeCloudTransactionChanges(window.APXGame.state, result.data.game_state);
    window.APXGame.save(true);
    return result.data;
  }

  async function writeSave(state) {
    if (!client || !profile || !state) return;

    var current = await client
      .from("apx_game_saves")
      .select("game_state,revision")
      .eq("user_id", profile.user_id)
      .maybeSingle();

    if (current.error) {
      throw current.error;
    }

    if (current.data && current.data.game_state) {
      mergeCloudTransactionChanges(state, current.data.game_state);
    }

    var revision = current.data
      ? Number(current.data.revision) || 0
      : 0;

    var result = await client.rpc("apx_save_game_state", {
      p_game_state: state,
      p_expected_revision: revision
    });

    if (result.error) {
      throw result.error;
    }

    if (!result.data || !result.data.game_state) {
      throw new Error(
        "Bản lưu vừa được cập nhật ở nơi khác; tải lại trước khi tiếp tục lưu."
      );
    }

    var savedBank = result.data.game_state.apxBank || {};
    var requestedBank = state.apxBank || {};
    if (requestedBank.accountBalance != null && (Number(savedBank.accountBalance) || 0) !== (Number(requestedBank.accountBalance) || 0)) {
      throw new Error("Máy chủ đã giữ số dư APXBank cũ. RPC apx_save_game_state hiện chỉ lưu ví tiền mặt, chưa lưu số dư/nghiệp vụ APXBank. Cần cập nhật RPC ngân hàng trên Supabase.");
    }

    state.cash = Number(result.data.game_state.cash) || 0;
    lastSyncedGameState = copyGameState(result.data.game_state);
  }

  function queueSave(state) {
    if (!profile || !client) return;

    window.clearTimeout(saveTimer);

    saveTimer = window.setTimeout(function () {
      writeSave(state)
        .then(function () {
          pageMessage = "Đã lưu lên tài khoản.";
        })
        .catch(function (error) {
          pageMessage =
            "Lưu lên đám mây lỗi: " + error.message;
        });
    }, 900);
  }

  async function adminCall(action, payload) {
    var db = await supabase();

    var result = await db.auth.getSession();

    var token =
      result.data &&
      result.data.session &&
      result.data.session.access_token;

    if (!token) {
      throw new Error("Hãy đăng nhập trước.");
    }

    var response = await fetch(
      config.url.replace(/\/$/, "") +
        "/functions/v1/" +
        encodeURIComponent(
          config.adminFunction || "apx-admin"
        ),
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: config.anonKey,
          Authorization: "Bearer " + token
        },
        body: JSON.stringify(
          Object.assign(
            { action: action },
            payload || {}
          )
        )
      }
    );

    var body = await response
      .json()
      .catch(function () {
        return {};
      });

    if (!response.ok) {
      throw new Error(
        body.error || "Admin request bị từ chối."
      );
    }

    return body;
  }

  function card(title, description, body) {
    return (
      '<section class="panel apx-account-card">' +
        '<div class="apx-account-card-head">' +
          "<div>" +
            "<h2>" + title + "</h2>" +
            "<p>" + description + "</p>" +
          "</div>" +
        "</div>" +
        body +
      "</section>"
    );
  }

  function field(
    label,
    name,
    type,
    autocomplete,
    required,
    value
  ) {
    return (
      '<label class="apx-account-field">' +
        "<span>" + label + "</span>" +
        '<input name="' +
          name +
          '" type="' +
          type +
          '" autocomplete="' +
          autocomplete +
          '"' +
          (value != null ? ' value="' + esc(value) + '"' : "") +
          (required ? " required" : "") +
        ">" +
      "</label>"
    );
  }

  function status() {
    return (
      '<p class="apx-account-status" role="status">' +
        esc(
          pageMessage ||
          (
            configured
              ? "Chưa đăng nhập. Hãy đăng nhập để mở khóa trò chơi."
              : "Chưa cấu hình Supabase; hiện chưa thể đăng nhập vào game."
          )
        ) +
      "</p>"
    );
  }

  function authView() {
    return (
      '<div class="page-heading">' +
        '<span class="eyebrow">TÀI KHOẢN VÀ ĐỒNG BỘ</span>' +
        "<h1>Tài khoản người chơi</h1>" +
        "<p>Đăng ký để lưu nhân vật và tiến trình trên nhiều thiết bị.</p>" +
      "</div>" +

      (
        configured
          ? (
              card(
                "Đăng nhập",
                "Dùng email để khôi phục tiến trình",
                '<form data-form="login" class="apx-account-form">' +
                  field(
                    "Email",
                    "email",
                    "email",
                    "email",
                    true
                  ) +
                  field(
                    "Mật khẩu",
                    "password",
                    "password",
                    "current-password",
                    true
                  ) +
                  '<button class="button button-primary" type="submit">Đăng nhập</button>' +
                "</form>"
              ) +

              card(
                "Tạo tài khoản và nhân vật",
                "Tên nhân vật sẽ được tạo cùng ID duy nhất sau khi đăng ký thành công.",
                '<form data-form="signup" class="apx-account-form">' +
                  field(
                    "Tên nhân vật",
                    "display_name",
                    "text",
                    "nickname",
                    true
                  ) +
                  field(
                    "Email",
                    "email",
                    "email",
                    "email",
                    true
                  ) +
                  field(
                    "Mật khẩu (ít nhất 8 ký tự)",
                    "password",
                    "password",
                    "new-password",
                    true
                  ) +
                  '<button class="button button-primary" type="submit">Tạo tài khoản</button>' +
                "</form>"
              )
            )
          : card(
              "Sẵn sàng nối Supabase",
              "Khi bạn có project, điền Project URL và public anon/publishable key trong js/supabase-config.js rồi triển khai migration và Edge Function.",
              '<a class="button" href="SUPABASE_SETUP.md" target="_blank" rel="noopener">Mở hướng dẫn kết nối</a>'
            )
      ) +

      (pendingOtpEmail ? card(
        "Nhập mã OTP trong email",
        "Mã xác nhận đã được gửi tới " + esc(pendingOtpEmail) + ". Nhập mã để kích hoạt tài khoản.",
        '<form data-form="verify-otp" class="apx-account-form">' +
          '<label class="apx-account-field"><span>Mã OTP</span><input name="token" type="text" inputmode="numeric" autocomplete="one-time-code" pattern="[0-9]{6,8}" minlength="6" maxlength="8" placeholder="Nhập mã trong email" required></label>' +
          '<button class="button button-primary" type="submit">Xác nhận mã</button>' +
          '<button class="button" type="button" data-action-account="resend-otp">Gửi lại mã</button>' +
        '</form>'
      ) : "") +

      (profile ? profileView() : "") +
      status()
    );
  }

  function profileView() {
    if (!profile) return "";

    var avatar = profile.avatar_url
      ? '<img src="' +
        esc(profile.avatar_url) +
        '" alt="Ảnh đại diện">'
      : "<span>" +
        esc(
          profile.display_name
            .split(/\s+/)
            .map(function (x) {
              return x[0];
            })
            .slice(-2)
            .join("")
            .toLocaleUpperCase("vi-VN")
        ) +
        "</span>";

    return (
      card(
        "Hồ sơ của tôi",
        "ID nhân vật: " + esc(profile.character_id),
        '<div class="apx-account-profile">' +
          '<div class="apx-account-avatar">' +
            avatar +
          "</div>" +
          "<div>" +
            "<strong>" +
              esc(profile.display_name) +
            "</strong>" +
            "<p>" +
              esc(profile.user_id) +
            "</p>" +
          "</div>" +
          '<button class="button" data-action-account="logout">Đăng xuất</button>' +
        "</div>" +

        '<form data-form="profile" class="apx-account-form">' +
          field(
            "Tên hiển thị",
            "display_name",
            "text",
            "nickname",
            true
          ) +
          field(
            "URL ảnh đại diện (tùy chọn)",
            "avatar_url",
            "text",
            "url",
            false,
            profile.avatar_url || ""
          ) +
          '<label class="apx-account-field apx-account-avatar-upload">' +
            "<span>Hoặc tải ảnh từ thiết bị (PNG, JPG, WEBP; tối đa 5 MB)</span>" +
            '<input name="avatar_file" type="file" accept="image/png,image/jpeg,image/webp">' +
            '<small class="apx-account-avatar-upload-status" data-avatar-upload-status aria-live="polite">Chọn ảnh để tải lên và tự điền URL; sau đó bấm Lưu hồ sơ.</small>' +
          "</label>" +
          '<button class="button" type="submit">Lưu hồ sơ</button>' +
        "</form>"
      )
    );
  }

  function reportsView() {
    return (
      '<div class="page-heading">' +
        '<span class="eyebrow">AN TOÀN CỘNG ĐỒNG</span>' +
        "<h1>Báo cáo người chơi</h1>" +
        "<p>Gửi nội dung để quản trị viên xem xét.</p>" +
      "</div>" +

      card(
        "Gửi báo cáo",
        "Chỉ tài khoản đã đăng nhập mới gửi được báo cáo.",
        '<form data-form="report" class="apx-account-form">' +

          field(
            "ID người chơi bị báo cáo (nếu biết)",
            "target_user_id",
            "text",
            "off",
            false
          ) +

          '<label class="apx-account-field">' +
            "<span>Lý do</span>" +
            '<select name="category">' +
              '<option value="harassment">Quấy rối</option>' +
              '<option value="cheating">Gian lận</option>' +
              '<option value="impersonation">Mạo danh</option>' +
              '<option value="other">Khác</option>' +
            "</select>" +
          "</label>" +

          '<label class="apx-account-field">' +
            "<span>Mô tả</span>" +
            '<textarea name="description" rows="5" minlength="10" maxlength="2000" required></textarea>' +
          "</label>" +

          '<button class="button button-primary" type="submit">Gửi báo cáo</button>' +
        "</form>"
      ) +

      status()
    );
  }

  function playerMarkup(player) {
    if (!player) {
      return "<p>Chọn một tài khoản để xem thông tin.</p>";
    }

    var save = player.game_state || {};
    var company = save.companyOperations || {};
    var inventory = save.inventory || {};

    var inventoryRows = Object.keys(inventory)
      .map(function (id) {
        return (
          '<div class="apx-admin-asset-row">' +
            "<span>" +
              esc(id) +
              " · SL " +
              esc(inventory[id]) +
            "</span>" +

            '<form data-form="inventory" class="apx-admin-inline">' +
              '<input type="hidden" name="item_id" value="' +
                esc(id) +
              '">' +

              '<input type="number" name="delta" min="-1000000" max="1000000" step="1" placeholder="± số lượng" required>' +

              '<button class="button" type="submit">Cập nhật</button>' +
            "</form>" +
          "</div>"
        );
      })
      .join("");

    var assets =
      save.character &&
      Array.isArray(save.character.assets)
        ? save.character.assets
            .map(function (asset) {
              return (
                "<li>" +
                  esc(asset.name) +
                  " · " +
                  money(asset.currentValue) +
                "</li>"
              );
            })
            .join("")
        : "";

    return (
      '<div class="apx-admin-player">' +

        "<h3>" +
          esc(player.display_name) +
        "</h3>" +

        "<p>ID tài khoản: " +
          esc(player.user_id) +
        "</p>" +

        "<p>ID nhân vật: " +
          esc(player.character_id) +
        "</p>" +

        "<p>Tiền cá nhân: " +
          money(save.cash) +
        "</p>" +

        "<p>Ngân quỹ công ty: " +
          money(save.treasury) +
        "</p>" +

        "<p>Bất động sản: " +
          esc(
            (save.buildings || []).join(", ") ||
            "Chưa có"
          ) +
        "</p>" +

        "<p>Công ty: " +
          esc(
            Object.keys(
              company.companies || {}
            ).join(", ") ||
            "Chưa có dữ liệu"
          ) +
        "</p>" +

        "<p>Tài sản cá nhân:</p>" +

        "<ul>" +
          (assets || "<li>Chưa có</li>") +
        "</ul>" +

        "<p>Trạng thái: <strong>" +
          (
            player.is_banned
              ? "Đang khóa"
              : "Đang hoạt động"
          ) +
        "</strong></p>" +

        "<h4>Tiền và vật phẩm</h4>" +

        '<div class="apx-admin-actions">' +

          '<form data-form="cash" class="apx-admin-inline">' +
            '<input type="number" name="amount" min="-1000000000000" max="1000000000000" step="1" placeholder="± tiền cá nhân" required>' +
            '<button class="button" type="submit">Điều chỉnh</button>' +
          "</form>" +

          '<button class="button" data-action-account="ban" data-user="' +
            esc(player.user_id) +
            '" data-banned="' +
            (!player.is_banned) +
            '">' +
            (
              player.is_banned
                ? "Mở khóa"
                : "Khóa tài khoản"
            ) +
          "</button>" +

        "</div>" +

        '<div class="apx-admin-assets">' +
          (
            inventoryRows ||
            "<p>Không có vật phẩm trong kho.</p>"
          ) +
        "</div>" +

      "</div>"
    );
  }

  function adminView() {
    return (
      '<div class="page-heading">' +
        '<span class="eyebrow">QUẢN TRỊ CÓ XÁC THỰC MÁY CHỦ</span>' +
        "<h1>Admin</h1>" +
        "<p>Mỗi yêu cầu đều được Edge Function kiểm tra quyền Admin.</p>" +
      "</div>" +

      '<div class="apx-admin-toolbar">' +

        '<button class="button button-primary" data-action-account="admin-refresh">Tải số liệu</button>' +

        '<form data-form="player-search">' +
          '<input name="user_id" placeholder="Dán UUID tài khoản để tìm" required>' +
          '<button class="button" type="submit">Tìm theo ID</button>' +
        "</form>" +

      "</div>" +

      card(
        "Tạo giftcode 10 tỷ",
        "Mỗi tài khoản đổi mã này một lần; mã mới không ghi đè mã cũ.",
        '<form data-form="giftcode" class="apx-account-form">' +
          '<label class="apx-account-field"><span>Mã giftcode mới</span><input name="code" type="text" minlength="6" maxlength="40" pattern="[A-Za-z0-9]{6,40}" autocomplete="off" required></label>' +
          '<label class="apx-account-field"><span>Số tài khoản tối đa</span><input name="max_accounts" type="number" min="1" max="1000000" step="1" required></label>' +
          '<button class="button button-primary" type="submit">Tạo mã</button>' +
        '</form>'
      ) +

      (
        adminData
          ? '<div class="apx-admin-stats"><div class="panel"><small>TỔNG TÀI KHOẢN</small><strong>' +
              (adminData.total_accounts || 0) +
            "</strong></div></div>"
          : ""
      ) +

      card(
        "Người chơi gần đây",
        "Tài khoản mới nhất; bấm xem để mở thông tin",
        '<div class="apx-admin-list">' +

          (
            (adminData && adminData.players) || []
          )
            .map(function (p) {
              return (
                '<button type="button" class="apx-admin-player-row" data-action-account="player" data-user="' +
                  esc(p.user_id) +
                '">' +

                  "<strong>" +
                    esc(p.display_name) +
                  "</strong>" +

                  "<small>" +
                    esc(p.user_id) +
                  "</small>" +

                  "<span>" +
                    (
                      p.is_banned
                        ? "Đã khóa"
                        : "Hoạt động"
                    ) +
                  "</span>" +

                "</button>"
              );
            })
            .join("") +

        "</div>"
      ) +

      card(
        "Chi tiết và quản lý",
        "Tài sản, tiền, trạng thái tài khoản",
        playerMarkup(selectedPlayer)
      ) +

      card(
        "Báo cáo cần xử lý",
        "Cập nhật trạng thái báo cáo",

        '<div class="apx-admin-list">' +

          (
            (
              (adminData && adminData.reports) || []
            )
              .map(function (r) {
                return (
                  '<article class="apx-admin-report">' +

                    "<strong>" +
                      esc(r.category) +
                      " · " +
                      esc(r.status) +
                    "</strong>" +

                    "<p>" +
                      esc(r.description) +
                    "</p>" +

                    "<small>Báo cáo ID " +
                      esc(r.id) +
                      " · người chơi " +
                      esc(
                        r.target_user_id ||
                        "chưa xác định"
                      ) +
                    "</small>" +

                    "<div>" +

                      '<button class="button" data-action-account="review" data-report="' +
                        esc(r.id) +
                        '" data-status="reviewing">Đang xem xét</button> ' +

                      '<button class="button" data-action-account="review" data-report="' +
                        esc(r.id) +
                        '" data-status="resolved">Đã xử lý</button> ' +

                      '<button class="button" data-action-account="review" data-report="' +
                        esc(r.id) +
                        '" data-status="rejected">Từ chối</button>' +

                    "</div>" +

                  "</article>"
                );
              })
              .join("") ||
            "<p>Không có báo cáo.</p>"
          ) +

        "</div>"
      ) +

      status()
    );
  }

  function render(page) {
    if (page === "reports") {
      return reportsView();
    }

    return authView();
  }

  function getFormData(form) {
    return Object.fromEntries(
      new FormData(form).entries()
    );
  }

  function validateAvatarFile(file) {
    var allowed = ["image/png", "image/jpeg", "image/webp"];
    if (!file || allowed.indexOf(file.type) === -1) {
      throw new Error("Ảnh đại diện cần là PNG, JPG hoặc WEBP.");
    }
    if (file.size > 5 * 1024 * 1024) {
      throw new Error("Ảnh đại diện không được lớn hơn 5 MB.");
    }
  }

  function prepareAvatarImage(file) {
    validateAvatarFile(file);
    return new Promise(function (resolve, reject) {
      var objectUrl = URL.createObjectURL(file);
      var image = new Image();
      image.onload = function () {
        try {
          var scale = Math.min(1, 320 / Math.max(image.naturalWidth, image.naturalHeight));
          var canvas = document.createElement("canvas");
          canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
          canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
          var context = canvas.getContext("2d");
          context.fillStyle = "#ffffff";
          context.fillRect(0, 0, canvas.width, canvas.height);
          context.drawImage(image, 0, 0, canvas.width, canvas.height);
          canvas.toBlob(function (blob) {
            URL.revokeObjectURL(objectUrl);
            if (!blob) return reject(new Error("Không đọc được ảnh này. Hãy thử ảnh PNG, JPG hoặc WEBP khác."));
            var compressed = new File([blob], "avatar.jpg", { type: "image/jpeg" });
            var reader = new FileReader();
            reader.onload = function () { resolve({ file: compressed, dataUrl: String(reader.result || "") }); };
            reader.onerror = function () { reject(new Error("Không thể xử lý ảnh đại diện.")); };
            reader.readAsDataURL(blob);
          }, "image/jpeg", 0.82);
        } catch (error) {
          URL.revokeObjectURL(objectUrl);
          reject(error);
        }
      };
      image.onerror = function () {
        URL.revokeObjectURL(objectUrl);
        reject(new Error("Không mở được tệp ảnh đã chọn."));
      };
      image.src = objectUrl;
    });
  }

  async function uploadAvatarFile(file, preparedImage) {
    var prepared = preparedImage || await prepareAvatarImage(file);
    if (!profile) throw new Error("Hãy đăng nhập lại để tải ảnh đại diện.");
    try {
      var db = await supabase();
      var bucket = config.avatarBucket || "apx-avatars";
      var path = profile.user_id + "/avatar";
      var result = await db.storage.from(bucket).upload(path, prepared.file, {
        cacheControl: "60",
        contentType: prepared.file.type,
        upsert: true
      });
      if (result.error) throw result.error;
      return {
        url: db.storage.from(bucket).getPublicUrl(path).data.publicUrl + "?v=" + Date.now(),
        storedLocally: false
      };
    } catch (storageError) {
      // Keep avatar selection usable even when Storage is not configured yet.
      // The compact data URL is saved with the profile and works in <img> tags.
      return { url: prepared.dataUrl, storedLocally: true, storageError: storageError };
    }
  }

  async function handleAvatarFileChange(event) {
    var input = event.target.closest('input[name="avatar_file"]');
    if (!input || !input.files || !input.files[0]) return;
    var form = input.closest('form[data-form="profile"]');
    if (!form) return;
    var statusNode = form.querySelector("[data-avatar-upload-status]");
    var urlField = form.elements.avatar_url;
    var file = input.files[0];
    try {
      validateAvatarFile(file);
      form.dataset.avatarUploading = "true";
      if (statusNode) statusNode.textContent = "Đang xử lý ảnh và điền địa chỉ ảnh…";
      var prepared = await prepareAvatarImage(file);
      if (urlField) urlField.value = prepared.dataUrl;
      if (statusNode) statusNode.textContent = "Ảnh đã được điền. Đang lưu bản ảnh dùng chung…";
      var uploaded = await uploadAvatarFile(file, prepared);
      var url = uploaded.url;
      form.dataset.avatarUploadedName = file.name;
      form.dataset.avatarUploadedUrl = url;
      if (urlField) urlField.value = url;
      if (statusNode) statusNode.textContent = uploaded.storedLocally
        ? "Kho ảnh trực tuyến chưa sẵn sàng; ảnh đã được nén và điền vào URL hồ sơ. Bấm Lưu hồ sơ để áp dụng."
        : "Đã tải ảnh lên; URL đã được điền. Bấm Lưu hồ sơ để áp dụng ảnh đại diện.";
    } catch (error) {
      delete form.dataset.avatarUploadedName;
      delete form.dataset.avatarUploadedUrl;
      if (statusNode) statusNode.textContent = error.message || "Không tải được ảnh đại diện.";
    } finally {
      delete form.dataset.avatarUploading;
    }
  }

  async function handleSubmit(event) {
    var form = event.target.closest(
      "form[data-form]"
    );

    if (!form) return;

    event.preventDefault();

    var kind = form.dataset.form;
    var data = getFormData(form);

    try {
      pageMessage = "Đang xử lý…";

      window.APXGame.render();

      var db = await supabase();

      if (kind === "signup") {
        var name = String(
          data.display_name || ""
        ).trim();

        if (name.length < 2 || name.length > 40) {
          throw new Error(
            "Tên nhân vật cần từ 2 đến 40 ký tự."
          );
        }

        if (String(data.password).length < 8) {
          throw new Error(
            "Mật khẩu cần ít nhất 8 ký tự."
          );
        }

        var sign = await db.auth.signUp({
          email: data.email,
          password: data.password,
          options: {
            data: {
              display_name: name
            }
          }
        });

        if (sign.error) {
          throw sign.error;
        }

        if (sign.data.session) {
          await db.auth.signOut();
          throw new Error(
            "Supabase đang bỏ qua OTP. Bật Confirm email trong Supabase để bắt buộc nhập mã xác nhận."
          );
        }

        pendingOtpEmail = String(data.email || "").trim().toLowerCase();
        sessionStorage.setItem("apx-pending-otp-email", pendingOtpEmail);
        pageMessage =
          "Đã gửi mã OTP tới email. Mở thư, nhập mã bên dưới để hoàn tất đăng ký.";

      } else if (kind === "verify-otp") {
        if (!pendingOtpEmail) {
          throw new Error("Hãy đăng ký email trước để nhận mã OTP.");
        }

        var token = String(data.token || "").replace(/\s+/g, "");
        if (!/^[0-9]{6,8}$/.test(token)) {
          throw new Error("Mã OTP cần có từ 6 đến 8 chữ số.");
        }

        var verification = await db.auth.verifyOtp({
          email: pendingOtpEmail,
          token: token,
          type: "email"
        });
        if (verification.error) throw verification.error;

        pendingOtpEmail = "";
        sessionStorage.removeItem("apx-pending-otp-email");
        await syncAccount();
        pageMessage = "Xác nhận OTP thành công. Nhân vật đã được kích hoạt.";

      } else if (kind === "login") {
        var login =
          await db.auth.signInWithPassword({
            email: data.email,
            password: data.password
          });

        if (login.error) {
          throw login.error;
        }

        await syncAccount();

      } else if (kind === "profile") {
        var displayName = String(
          data.display_name || ""
        ).trim();

        if (
          displayName.length < 2 ||
          displayName.length > 40
        ) {
          throw new Error(
            "Tên hiển thị cần từ 2 đến 40 ký tự."
          );
        }

        var avatarUrl = String(
          data.avatar_url || ""
        ).trim() || null;
        var avatarFile = data.avatar_file;

        if (avatarUrl && !/^data:image\/(jpeg|png|webp);base64,/i.test(avatarUrl)) {
          try {
            var parsedAvatarUrl = new URL(avatarUrl);
            if (parsedAvatarUrl.protocol !== "https:" && parsedAvatarUrl.protocol !== "http:") throw new Error();
          } catch (_) {
            throw new Error("URL ảnh cần bắt đầu bằng http:// hoặc https://.");
          }
        }

        if (avatarFile && avatarFile.name) {
          if (form.dataset.avatarUploading === "true") {
            throw new Error("Ảnh đang được xử lý, đợi một chút rồi bấm Lưu hồ sơ.");
          }
          validateAvatarFile(avatarFile);
          avatarUrl = form.dataset.avatarUploadedName === avatarFile.name
            ? form.dataset.avatarUploadedUrl
            : (await uploadAvatarFile(avatarFile)).url;
        }

        var updated = await db
          .from("apx_player_profiles")
          .update({
            display_name: displayName,
            avatar_url: avatarUrl
          })
          .eq("user_id", profile.user_id)
          .select("*")
          .single();

        if (updated.error) {
          throw updated.error;
        }

        profile = updated.data;

        window.APXGame.state.character.profile.name =
          displayName;

        window.APXGame.state.character.profile.initials =
          displayName
            .split(/\s+/)
            .slice(-2)
            .map(function (x) {
              return x[0];
            })
            .join("")
            .toLocaleUpperCase("vi-VN");

        window.APXGame.state.character.profile.avatar =
          profile.avatar_url || "";

        window.APXGame.save();
        if (window.APXWardrobe && window.APXWardrobe.syncPlayerAvatars) {
          window.APXWardrobe.syncPlayerAvatars();
        }

        pageMessage =
          "Đã cập nhật hồ sơ.";

      } else if (kind === "report") {
        if (!profile) {
          throw new Error(
            "Hãy đăng nhập để gửi báo cáo."
          );
        }

        var target = String(
          data.target_user_id || ""
        ).trim();

        if (
          target &&
          !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
            target
          )
        ) {
          throw new Error(
            "ID người chơi phải là UUID hợp lệ."
          );
        }

        var report = await db
          .from("apx_player_reports")
          .insert({
            reporter_id: profile.user_id,
            target_user_id: target || null,
            category: data.category,
            description:
              String(
                data.description || ""
              ).trim()
          });

        if (report.error) {
          throw report.error;
        }

        pageMessage =
          "Đã gửi báo cáo cho quản trị viên.";

      } else if (kind === "player-search") {
        selectedPlayer =
          await adminCall("player", {
            user_id: data.user_id.trim()
          });

        selectedPlayer =
          selectedPlayer.player;

      } else if (kind === "giftcode") {
        var maxAccounts = Number(data.max_accounts);
        if (!Number.isSafeInteger(maxAccounts) || maxAccounts < 1 || maxAccounts > 1000000) {
          throw new Error("Giới hạn tài khoản phải từ 1 đến 1.000.000.");
        }
        await adminCall("create_cash_giftcode", {
          code: String(data.code || "").trim(),
          max_accounts: maxAccounts
        });
        form.reset();
        pageMessage = "Đã tạo giftcode mới nhận 10 tỷ. Mã cũ vẫn được giữ nguyên.";

      } else if (kind === "cash") {
        var amount = Number(data.amount);

        if (!Number.isSafeInteger(amount)) {
          throw new Error(
            "Số tiền phải là số nguyên an toàn."
          );
        }

        await adminCall(
          "adjust_cash",
          {
            user_id: selectedPlayer.user_id,
            amount: amount
          }
        );

        selectedPlayer =
          (
            await adminCall(
              "player",
              {
                user_id:
                  selectedPlayer.user_id
              }
            )
          ).player;

        pageMessage =
          "Đã cập nhật số dư và ghi nhật ký quản trị.";

      } else if (kind === "inventory") {
        var delta = Number(data.delta);

        if (!Number.isSafeInteger(delta)) {
          throw new Error(
            "Số lượng phải là số nguyên."
          );
        }

        await adminCall(
          "adjust_inventory",
          {
            user_id: selectedPlayer.user_id,
            item_id: data.item_id,
            delta: delta
          }
        );

        selectedPlayer =
          (
            await adminCall(
              "player",
              {
                user_id:
                  selectedPlayer.user_id
              }
            )
          ).player;

        pageMessage =
          "Đã cập nhật vật phẩm và ghi nhật ký quản trị.";
      }

    } catch (error) {
      pageMessage =
        error.message ||
        "Không thể hoàn thành thao tác.";
    }

    window.APXGame.render();
    if (window.APXWardrobe && window.APXWardrobe.syncPlayerAvatars) {
      window.APXWardrobe.syncPlayerAvatars();
    }
  }

  async function handleClick(event) {
    var button = event.target.closest(
      "[data-action-account]"
    );

    if (!button) return;

    var action =
      button.dataset.actionAccount;

    try {
      if (action === "logout") {
        var db = await supabase();

        await db.auth.signOut();

        profile = null;
        if (window.APXLife && window.APXLife.reset) window.APXLife.reset();

        pageMessage =
          "Đã đăng xuất. Tiến trình trên thiết bị vẫn được giữ.";

      } else if (action === "resend-otp") {
        if (!pendingOtpEmail) {
          throw new Error("Chưa có email chờ xác nhận. Hãy gửi lại biểu mẫu đăng ký.");
        }

        var resendDb = await supabase();
        var resendResult = await resendDb.auth.resend({
          type: "signup",
          email: pendingOtpEmail
        });
        if (resendResult.error) throw resendResult.error;

        pageMessage =
          "Đã gửi lại mã. Kiểm tra cả thư rác; chờ một phút trước lần gửi tiếp theo.";

      } else if (action === "admin-refresh") {
        adminData =
          await adminCall("overview");

      } else if (action === "player") {
        selectedPlayer =
          (
            await adminCall(
              "player",
              {
                user_id:
                  button.dataset.user
              }
            )
          ).player;

      } else if (action === "ban") {
        await adminCall(
          "set_ban",
          {
            user_id:
              button.dataset.user,
            banned:
              button.dataset.banned === "true"
          }
        );

        pageMessage =
          button.dataset.banned === "true"
            ? "Đã khóa tài khoản."
            : "Đã mở khóa tài khoản.";

        adminData =
          await adminCall("overview");

        if (selectedPlayer) {
          selectedPlayer =
            (
              await adminCall(
                "player",
                {
                  user_id:
                    selectedPlayer.user_id
                }
              )
            ).player;
        }

      } else if (action === "review") {
        await adminCall(
          "review_report",
          {
            report_id:
              button.dataset.report,
            status:
              button.dataset.status,
            resolution:
              "Đã cập nhật từ bảng quản trị."
          }
        );

        pageMessage =
          "Đã cập nhật báo cáo.";

        adminData =
          await adminCall("overview");
      }

    } catch (error) {
      pageMessage =
        error.message ||
        "Thao tác bị từ chối.";
    }

    window.APXNav.render();
    window.APXGame.render();
  }

  document.addEventListener(
    "submit",
    handleSubmit
  );

  document.addEventListener(
    "change",
    handleAvatarFileChange
  );

  document.addEventListener(
    "click",
    handleClick
  );

  window.APXPages.account = render;

  /* =========================
     PUBLIC ACCOUNT API
     ========================= */

  window.APXAccount = {
    isLoggedIn: function () {
      return Boolean(profile);
    },

    isConfigured: function () {
      return configured;
    },

    queueSave: queueSave,

    getSupabaseClient: supabase,

    sync: syncAccount,

    syncTransactions: syncTransactionChanges,

    flushSave: flushSave,
    transferBankCash: transferBankCash,
    creditCareerSalary: creditCareerSalary,

    render: render
  };

  window.APXNav.render();

  if (
    window.APXGame &&
    typeof window.APXGame.render === "function"
  ) {
    window.APXGame.render();
  }

  if (configured) {
    supabase()
      .then(function (db) {
        return db.auth.getSession();
      })
      .then(function (result) {
        if (
          result.data &&
          result.data.session
        ) {
          return syncAccount();
        }
      })
      .catch(function (error) {
        pageMessage = error.message;
      });
  }

})();

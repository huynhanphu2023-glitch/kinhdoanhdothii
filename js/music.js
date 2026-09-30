(function () {
  var button = document.getElementById("musicToggle");
  if (!button) return;

  var MUSIC_KEY = "apx-business-world-music-enabled-v1";
  var audio = new Audio("assets/music/background.mp3");
  var savedPreference = null;

  try {
    savedPreference = localStorage.getItem(MUSIC_KEY);
  } catch (error) {
    // Music controls still work when browser storage is unavailable.
  }

  var enabled = savedPreference !== "off";
  audio.loop = true;
  audio.volume = 0.35;
  audio.preload = "auto";

  function updateButton(playing) {
    var label = playing ? "Tắt nhạc" : "Bật nhạc";
    button.querySelector("span").textContent = label;
    button.setAttribute("aria-label", label + " nền");
    button.setAttribute("aria-pressed", String(playing));
    button.title = playing ? "Tắt nhạc nền" : "Bật nhạc nền";
  }

  function rememberPreference() {
    try {
      localStorage.setItem(MUSIC_KEY, enabled ? "on" : "off");
    } catch (error) {
      // Music controls still work when browser storage is unavailable.
    }
  }

  function startMusic() {
    if (!enabled || !audio.paused) return;
    audio.play().catch(function () {
      updateButton(false);
      button.title = "Không phát được nhạc. Kiểm tra assets/music/background.mp3.";
    });
  }

  button.addEventListener("click", function () {
    enabled = !enabled;
    rememberPreference();

    if (enabled) {
      startMusic();
    } else {
      audio.pause();
      audio.currentTime = 0;
      updateButton(false);
    }
  });

  audio.addEventListener("play", function () {
    updateButton(true);
  });
  audio.addEventListener("pause", function () {
    updateButton(false);
  });
  audio.addEventListener("error", function () {
    updateButton(false);
    button.title = "Chưa tìm thấy nhạc: thêm file assets/music/background.mp3.";
  });

  if (enabled) {
    startMusic();
    document.addEventListener("pointerdown", startMusic, { once: true });
    document.addEventListener("keydown", startMusic, { once: true });
  }
})();

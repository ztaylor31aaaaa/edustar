
"use strict";

const ACCESS_KEY = "edustar_access";
const ACCESS_CODE = "stupidlyakward";

// The game files must exist at these paths inside public/.
const GAME_PATHS = {
  game1: "/games/snubby/snubby/mathlesson1.html"
};

function hasAccess() {
  return sessionStorage.getItem(ACCESS_KEY) === "granted";
}

function grantAccess() {
  sessionStorage.setItem(ACCESS_KEY, "granted");
}

document.addEventListener("DOMContentLoaded", () => {
  const accessForm = document.getElementById("access-form");

  if (accessForm) {
    accessForm.addEventListener("submit", event => {
      event.preventDefault();

      const input = document.getElementById("access-code");
      const error = document.getElementById("access-error");

      if (input.value !== ACCESS_CODE) {
        error.hidden = false;
        input.select();
        return;
      }

      error.hidden = true;
      grantAccess();

      const params = new URLSearchParams(location.search);
      const requestedGame = params.get("game") || "game1";

      if (!GAME_PATHS[requestedGame]) {
        location.href = "/play/";
        return;
      }

      location.href =
        "/play/?game=" + encodeURIComponent(requestedGame);
    });
  }

  const frame = document.getElementById("game-frame");

  if (frame) {
    if (!hasAccess()) {
      location.replace("/signin/");
      return;
    }

    const params = new URLSearchParams(location.search);
    const game = params.get("game") || "game1";
    const gamePath = GAME_PATHS[game];

    if (!gamePath) {
      location.replace("/signin/");
      return;
    }

    frame.src = gamePath;

    const exitButton = document.querySelector(".exit-game");

    if (exitButton) {
      let hideTimer;

      function showExit() {
        exitButton.classList.add("visible");
        clearTimeout(hideTimer);
        hideTimer = setTimeout(() => {
          exitButton.classList.remove("visible");
        }, 2200);
      }

      document.addEventListener("mousemove", showExit);
      document.addEventListener("keydown", showExit);
      exitButton.addEventListener("mouseenter", () => {
        clearTimeout(hideTimer);
        exitButton.classList.add("visible");
      });
    }
  }
});

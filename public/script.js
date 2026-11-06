"use strict";

const ACCESS_KEY = "edustar_access";
const ACCESS_CODE = "stupidlyakward";

const GAME_PATHS = {
  game1: "/games/snubby/snubby/mathlesson1.html"
};

function hasAccess() {
  return sessionStorage.getItem(ACCESS_KEY) === "granted";
}

function grantAccess() {
  sessionStorage.setItem(ACCESS_KEY, "granted");
}

function isLocalGameUrl(value) {
  try {
    const url = new URL(value, location.href);
    return url.origin === location.origin &&
      url.pathname.startsWith("/games/") &&
      /\\.html?$/i.test(url.pathname);
  } catch {
    return false;
  }
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
      location.href = "/choose/";
    });
  }

  if (document.body.classList.contains("choose-page") && !hasAccess()) {
    location.replace("/signin/");
    return;
  }

  const frame = document.getElementById("game-frame");
  if (!frame) return;

  if (!hasAccess()) {
    location.replace("/signin/");
    return;
  }

  const params = new URLSearchParams(location.search);
  const game = params.get("game") || "game1";
  const gamePath = GAME_PATHS[game];

  if (!gamePath) {
    location.replace("/choose/");
    return;
  }

  frame.addEventListener("load", () => {
    try {
      const win = frame.contentWindow;
      const doc = frame.contentDocument;
      if (!win || !doc) return;

      doc.addEventListener("click", event => {
        const link = event.target.closest("a[target='_blank'], a[ target='_blank' i]");
        if (!link || !isLocalGameUrl(link.href)) return;
        event.preventDefault();
        event.stopPropagation();
        frame.src = link.href;
      }, true);

      const originalOpen = win.open.bind(win);
      win.open = (url, target, features) => {
        if (url && isLocalGameUrl(url)) {
          frame.src = new URL(url, location.href).href;
          return win;
        }
        return originalOpen(url, target, features);
      };
    } catch (error) {
      console.warn("Could not attach local game navigation:", error);
    }
  });

  frame.src = gamePath;

  const exitButton = document.querySelector(".exit-game");
  if (exitButton) {
    let hideTimer;
    function showExit() {
      exitButton.classList.add("visible");
      clearTimeout(hideTimer);
      hideTimer = setTimeout(() => exitButton.classList.remove("visible"), 2500);
    }
    document.addEventListener("mousemove", showExit);
    document.addEventListener("keydown", showExit);
    exitButton.addEventListener("mouseenter", () => {
      clearTimeout(hideTimer);
      exitButton.classList.add("visible");
    });
    showExit();
  }
});

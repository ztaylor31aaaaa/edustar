"use strict";

const ACCESS_KEY = "edustar_access";

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
    accessForm.addEventListener("submit", async event => {
      event.preventDefault();
      const input = document.getElementById("access-code");
      const error = document.getElementById("access-error");

      const code = input.value.trim();
      const submit = accessForm.querySelector("button[type=submit]");
      submit.disabled = true;
      submit.textContent = "Checking…";
      let accepted = false;
      try {
        const response = await fetch("/api/dev-verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code })
        });
        accepted = response.ok;
      } catch {}
      submit.disabled = false;
      submit.innerHTML = 'Continue <span aria-hidden="true">→</span>';
      if (!accepted) {
        error.textContent = "That developer code is invalid or has expired.";
        error.hidden = false;
        input.select();
        return;
      }

      error.hidden = true;
      grantAccess();
      const card = document.querySelector(".signin-card");
      card.innerHTML = '<p class="signin-eyebrow">ACCESS GRANTED</p><h1>Choose your experience.</h1><p class="signin-description">Select where you want to go.</p><div class="signin-choice-grid"><button class="signin-choice" type="button" data-destination="/play/?game=game1"><strong>Original game portal</strong><span>Open the original Snubby experience →</span></button><button class="signin-choice" type="button" data-destination="/arcade/"><strong>SunsetOS</strong><span>Open the updated game hub →</span></button></div><a class="signin-home-link" href="/">← Back to home</a>';
      card.querySelectorAll("[data-destination]").forEach(button => button.addEventListener("click", () => {
        const destination = button.dataset.destination;
        if (destination === "/play/?game=game1" || destination === "/arcade/") location.assign(destination);
      }));
    });
  }

  if (document.body.classList.contains("choose-page")) {
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

"use strict";

const ACCESS_KEY = "edustar_access";
const SUNSET_ACCESS_KEY = "sunsetos_access";
const GAME_ACCESS_CODE = "stupidlyakward";

// A fresh 10-character code is created for this browser tab's current page session.
var code = sessionStorage.getItem("sunsetos_dev_code");
if (!code) {
  code = Array.from(crypto.getRandomValues(new Uint8Array(5)), value => value.toString(16).padStart(2, "0")).join("");
  sessionStorage.setItem("sunsetos_dev_code", code);
}
var devmode = false;

const GAME_PATHS = {
  game1: "/games/snubby/snubby/mathlesson1.html"
};

function hasAccess() {
  return sessionStorage.getItem(ACCESS_KEY) === "granted";
}

function grantAccess() {
  sessionStorage.setItem(ACCESS_KEY, "granted");
  // This session-only launch code is passed to the two maintenance activity pages.
  const launchCode = Array.from(crypto.getRandomValues(new Uint8Array(24)), value => value.toString(16).padStart(2, "0")).join("");
  sessionStorage.setItem("sunset_activity_launchcode", launchCode);
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
  const card = document.querySelector(".signin-card");

  function showChoices() {
    card.innerHTML = '<p class="signin-eyebrow">GAME ACCESS GRANTED</p><h1>Choose your experience.</h1><p class="signin-description">Your normal game access is active. Solaris requires an additional developer code.</p><div class="signin-choice-grid"><button class="signin-choice" type="button" id="original-portal"><strong>Original game portal</strong><span>Open the original Snubby games →</span></button><button class="signin-choice" type="button" id="sunsetos-choice"><strong>Solaris</strong><span>Enter the separate developer code →</span></button></div><a class="signin-home-link" href="/">← Back to home</a>';
    card.querySelector("#original-portal").addEventListener("click", () => location.assign("/play/?game=game1#launchcode=" + encodeURIComponent(sessionStorage.getItem("sunset_activity_launchcode") || "")));
    card.querySelector("#sunsetos-choice").addEventListener("click", showSunsetCodeForm);
  }

  function showSunsetCodeForm() {
    card.innerHTML = '<p class="signin-eyebrow">RESTRICTED ACCESS</p><h1>Solaris.</h1><p class="signin-description">Developer and tester access only.</p><form id="sunset-code-form" class="signin-form"><label for="sunset-code">Access code</label><input id="sunset-code" type="password" placeholder="Access code" autocomplete="off" required><p id="sunset-error" class="signin-error" role="alert" hidden>Invalid or expired developer code. Contact an authorised tester.</p><button class="signin-submit" type="submit">Unlock Solaris <span aria-hidden="true">→</span></button></form><a class="signin-home-link" href="#" id="back-choices">← Back to experiences</a>';
    card.querySelector("#back-choices").addEventListener("click", event => { event.preventDefault(); showChoices(); });
    card.querySelector("#sunset-code-form").addEventListener("submit", event => {
      event.preventDefault();
      const input = card.querySelector("#sunset-code");
      const error = card.querySelector("#sunset-error");
      if (devmode !== code || input.value.trim().toLowerCase() !== devmode) {
        error.hidden = false;
        input.select();
        return;
      }
      sessionStorage.setItem(SUNSET_ACCESS_KEY, "granted");
      location.assign("/arcade/#launchcode=" + encodeURIComponent(sessionStorage.getItem("sunset_activity_launchcode") || ""));
    });
  }

  if (accessForm) {
    accessForm.addEventListener("submit", event => {
      event.preventDefault();
      const input = document.getElementById("access-code");
      const error = document.getElementById("access-error");
      if (input.value !== GAME_ACCESS_CODE) {
        error.hidden = false;
        input.select();
        return;
      }
      error.hidden = true;
      grantAccess();
      showChoices();
    });
  }

  if (document.body.classList.contains("choose-page")) {
    location.replace("/signin/");
    return;
  }

  const frame = document.getElementById("game-frame");
  if (!frame) return;

  const launchParams = new URLSearchParams(location.hash.slice(1));
  const suppliedLaunchCode = launchParams.get("launchcode") || "";
  const expectedLaunchCode = sessionStorage.getItem("sunset_activity_launchcode") || "";
  history.replaceState(null, "", location.pathname + location.search);
  if (!hasAccess() || !suppliedLaunchCode || !expectedLaunchCode || suppliedLaunchCode !== expectedLaunchCode) {
    document.body.innerHTML = '<main style="min-height:100vh;display:grid;place-items:center;padding:24px;background:#fffdf5;color:#242018;font-family:Arial,sans-serif"><section style="max-width:560px;padding:32px;border:1px solid #e7dfca;border-radius:16px;background:#fff"><p style="font-size:12px;font-weight:700;letter-spacing:1.5px;color:#a77b00">ACCELERATE MY EDUCATION · ACCESS CHECK</p><h1>Activity unavailable</h1><p>This page can only be opened through the sign-in launch process. Open the sign-in page and choose the original game portal.</p><a href="/signin/" style="color:#9b7300;font-weight:700">Return to sign in →</a></section></main>';
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

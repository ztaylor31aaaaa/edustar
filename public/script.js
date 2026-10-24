
const TEST_PASSWORD = "stupidlyakward";

// These paths will be used for your two game websites.
const GAME_PATHS = {
    game1: "/games/game1.html",
    game2: "/games/game2.html"
};

const homePage = document.getElementById("home-page");
const gamePage = document.getElementById("game-page");
const passwordModal = document.getElementById("password-modal");
const passwordForm = document.getElementById("password-form");
const passwordInput = document.getElementById("password-input");
const passwordError = document.getElementById("password-error");
const gameFrame = document.getElementById("game-frame");
const gameTitle = document.getElementById("game-title");

let selectedGame = "game1";

function openPasswordPrompt(game) {
    selectedGame = game;

    passwordInput.value = "";
    passwordError.textContent = "";

    passwordModal.classList.remove("hidden");
    passwordInput.focus();
}

function closePasswordPrompt() {
    passwordModal.classList.add("hidden");
    passwordError.textContent = "";
}

function openGame(game) {
    const path = GAME_PATHS[game];

    if (!path) {
        passwordError.textContent = "That activity could not be found.";
        return;
    }

    closePasswordPrompt();

    homePage.classList.add("hidden");
    gamePage.classList.remove("hidden");

    gameTitle.textContent =
        game === "game1"
            ? "Interactive Activity One"
            : "Interactive Activity Two";

    // Keep the landing page HTML unchanged when adding the games.
    gameFrame.src = path;

    window.scrollTo(0, 0);
}

document.querySelectorAll("[data-game]").forEach((button) => {
    button.addEventListener("click", () => {
        openPasswordPrompt(button.dataset.game);
    });
});

document.getElementById("start-button").addEventListener("click", () => {
    openPasswordPrompt("game1");
});

document.getElementById("close-modal").addEventListener("click", () => {
    closePasswordPrompt();
});

passwordModal.addEventListener("click", (event) => {
    if (event.target === passwordModal) {
        closePasswordPrompt();
    }
});

passwordForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const enteredPassword = passwordInput.value;

    if (enteredPassword === TEST_PASSWORD) {
        openGame(selectedGame);
    } else {
        passwordError.textContent = "Incorrect password. Please try again.";
        passwordInput.select();
    }
});

document.getElementById("back-button").addEventListener("click", () => {
    // Stop the game when returning to the landing page.
    gameFrame.src = "about:blank";

    gamePage.classList.add("hidden");
    homePage.classList.remove("hidden");

    window.scrollTo(0, 0);
});

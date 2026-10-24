
const TEST_PASSWORD = "stupidlyakward";

const GAME_PATHS = {
    game1: "/games/game1.html",
    game2: "/games/game2.html"
};

const GAME_NAMES = {
    game1: "Learning Activity One",
    game2: "Learning Activity Two"
};

function getSelectedGame() {
    const params = new URLSearchParams(window.location.search);
    const game = params.get("game");

    return Object.hasOwn(GAME_PATHS, game) ? game : null;
}

// Sign-in page
const passwordForm = document.getElementById("password-form");

if (passwordForm) {
    const selectedGame = getSelectedGame();
    const nameElement = document.getElementById("resource-name");
    const errorElement = document.getElementById("password-error");
    const passwordInput = document.getElementById("password-input");

    if (!selectedGame) {
        nameElement.textContent = "Resource unavailable";
        passwordForm.hidden = true;
        errorElement.textContent =
            "Please return to the resource library and select an activity.";
    } else {
        nameElement.textContent = GAME_NAMES[selectedGame];

        passwordForm.addEventListener("submit", (event) => {
            event.preventDefault();

            if (passwordInput.value !== TEST_PASSWORD) {
                errorElement.textContent =
                    "The password is incorrect. Please try again.";
                passwordInput.select();
                return;
            }

            window.location.href =
                "/play.html?game=" + encodeURIComponent(selectedGame);
        });
    }
}

// Game page
const gameFrame = document.getElementById("game-frame");

if (gameFrame) {
    const selectedGame = getSelectedGame();

    if (selectedGame) {
        gameFrame.src = GAME_PATHS[selectedGame];
    } else {
        document.body.innerHTML = `
            <main style="padding:40px;font-family:Arial,sans-serif">
                <h2>Resource unavailable</h2>
                <p>Please return to the resource library and select a game.</p>
                <a href="/">Return to resources</a>
            </main>
        `;
    }
}

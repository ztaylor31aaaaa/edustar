
function SettingsB() {
    var x = document.getElementById("settings");
    if (x.style.display === "none") {
      x.style.display = "block";
    } else {
      x.style.display = "none";
    }
}

function SettingsNew() {
    var overlay = document.getElementById("settingsOverlay");
    var panel = document.getElementById("settingsNEW");
  
    if (!panel) {
        popupAlert('Hey! Settings got changed a little! And you are on a older version of\nthe site! Clear browser data and it should fix the issue!', 0, 0);
        return;
    }
  
    // if it breaks just in case idk
    if (!overlay) {
      if (panel.style.display === "none" || panel.style.display === "") {
        panel.style.display = "block";
        panel.classList.remove("slide-out");
        panel.classList.add("slide-in");
      } else {
        panel.classList.remove("slide-in");
        panel.classList.add("slide-out");
        setTimeout(function() {
          panel.style.display = "none";
        }, 500);
      }
      return;
    }
  
    // New overlay-based behavior
    if (overlay.style.display === "none" || overlay.style.display === "") {
      overlay.style.display = "block";
      panel.classList.remove("slide-out");
      panel.classList.add("slide-in");
    } else {
      panel.classList.remove("slide-in");
      panel.classList.add("slide-out");
      setTimeout(function() {
        overlay.style.display = "none";
      }, 500);
    }
}
  

// check if the system is low quality because well if we dont then bad stuff
var LOW_END_MODE = localStorage.getItem('perform_mode') === 'true'; // Ensure it's a boolean

if (LOW_END_MODE === null) {
    LOW_END_MODE = false;
    localStorage.setItem('perform_mode', 'false');
}

const badsystem =
    (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4) ||
    (navigator.deviceMemory && navigator.deviceMemory <= 2);

console.log("CORES:", navigator.hardwareConcurrency);
console.log("MEM:", navigator.deviceMemory);

if (!badsystem) {
    console.log("Checked system, seems fine, maybe runs fine too :sob:");
} else if (LOW_END_MODE === false && badsystem && !localStorage.getItem('asked_pref')) {
    // popupAlert("Low-end system detected.\nWould you like to enable performance mode?", () => { LOW_END_MODE = true; localStorage.setItem('perform_mode', 'true'); window.location.reload(); }, () => { LOW_END_MODE = false; localStorage.setItem('perform_mode', 'false'); localStorage.setItem('asked_pref', true); }, "yes", "no");
}

const PerfValue = document.getElementById("PerfValue");

let DefaultPerfValue = 'Disabled';
let PerfColor = 'red';

function PerformanceOption() {
    if (LOW_END_MODE) {
        LOW_END_MODE = false;
        localStorage.setItem('perform_mode', 'false');
        DefaultPerfValue = 'Disabled';
        PerfColor = 'red';
        window.location.reload();
    } else {
        LOW_END_MODE = true;
        localStorage.setItem('perform_mode', 'true');
        PerfColor = 'green';
        DefaultPerfValue = 'Enabled';
        window.location.reload();
    }

    PerfValue.innerHTML = `<a style="color: ${PerfColor};">${DefaultPerfValue}</a>`;
}

if (LOW_END_MODE) {
    PerfColor = 'green';
    DefaultPerfValue = 'Enabled';
    if (!document.body.style.transition) {
        document.body.style.setProperty("-webkit-transition", "none", "important");
        document.body.style.setProperty("-moz-transition", "none", "important");
        document.body.style.setProperty("-o-transition", "none", "important");
        document.body.style.setProperty("transition", "none", "important");
    }
    // css animations
    const style = document.createElement("style");
    style.innerHTML = `
    * {
        animation: none !important;
        transition: none !important;
        scroll-behavior: auto !important;
    }
    `;
    document.head.appendChild(style);

    // js animations
    window.requestAnimationFrame = () => 0;
    window.cancelAnimationFrame = () => {};
    document.querySelectorAll('.switch-scene').forEach(el => el.remove());

    // mc server
    document.querySelectorAll('#embed').forEach(el => el.remove());
    localStorage.setItem('MCToggle', 'false');
} else {
    DefaultPerfValue = 'Disabled';
    PerfColor = 'red';
}

PerfValue.innerHTML = `<a style="color: ${PerfColor};">${DefaultPerfValue}</a>`;


//spanish shit

var spanish;//Had to import because it would say 'not defined' 
//like shut your dumbass up



spanish = localStorage.getItem("spanish"); //dont delete main variable to the spanish you fucking cunt

//if (localStorage.getItem('spanish') == 'true') alert("Brokener");

//if (spanish == 'true') {
   // alert("ON");
// } else {
//    alert("OFF");
 // }

//the dyslexic shit, i feel your pain
var dyslexicv; 

dyslexicv = localStorage.getItem("dyslexic");

function toggleDyslexia() {
    var dyslexic = localStorage.getItem('dyslexic');
  
    if (dyslexic === 'true') {
      localStorage.setItem('dyslexic', 'false');
      alert("SET TO DYSLEXIC OFF");
    } else {
      localStorage.setItem('dyslexic', 'true');
      alert("SET TO DYSLEXIC");
    }
  
    location.reload();
} 

//if (localStorage.getItem('dyslexic') == 'true') document.getElementById("body").style.fontFamily = "OpenDyslexic-Regular";

function fontcheck() { //SO THE GODDAMN WEBSITE CAN READ THE FUCKING FONT
    if (dyslexicv == 'true') { //For people who cant read well, like me
        document.body.style.fontFamily = "OpenDyslexic-Regular";
     } else {
        document.body.style.fontFamily = "AOTFShinGoProRegular";
    }
}

//The Dev Mode
var dev; 

dev = localStorage.getItem("dev");

function toggleDevMode() {
    var dev = localStorage.getItem('dev');
  
    if (dev === 'true') {
      localStorage.setItem('dev', 'false');
      alert("DEV OFF");
    } else {
      localStorage.setItem('dev', 'true');
      alert("DEV ON");
    }
  
    location.reload();
}  

// Dark Mode
const DarkValue = document.getElementById("DarkValue");

let dark = localStorage.getItem("dark");

function updateDarkModeValue() {
    if (!DarkValue) return;

    const isDark = dark === 'true';
    DarkValue.textContent = isDark ? 'Enabled' : 'Disabled';
    DarkValue.style.color = isDark ? 'green' : 'red';
}

updateDarkModeValue();

function toggleDarkMode() {
    dark = localStorage.getItem('dark') === 'true' ? 'false' : 'true';
    localStorage.setItem('dark', dark);
    checkcolor();
}

function changeImage(a, b) { 
    if (a == null || b == null) {
      console.log("No id was given to changeImage() function.");
      return;
    }
  
    var element = document.getElementById(b);
    if (element) {
      element.src = a;
      if (dark === 'true') {
        console.log("Changed id " + b + " to dark mode.");
      } else {
        console.log("Changed id " + b + " to light mode.");
      }
    } else {
      console.log("Element with id " + b + " does not exist.");
    }
    // So if like before if the image doesnt exist or like the id doesnt exitst it will say that instead of it throwing a error
}

function checkcolor() { // main
    dark = localStorage.getItem("dark");
    const isDark = dark === "true";
    const iconMode = isDark ? "dark" : "light";

    document.body.classList.toggle("dark-mode", isDark);
    updateDarkModeValue();

    const themedIcons = {
        bottomz: "unknown.png",
        abtme: "huh.png",
        notifz: "notifs.png",
        cashapp: "cashapp.png",
        webz: "web.png",
        settinz: "settings.png",
        discord: "discord.png",
        closegame: "close.png",
        shop: "shop.png"
    };

    Object.entries(themedIcons).forEach(([elementId, filename]) => {
        changeImage(cdnicons(`icons/${iconMode}/${filename}`), elementId);
    });
}

// After so long, even aden at one point mentioned and i pushed it over and over but hey here it is

const SITE_THEMES = {
    classic: {
        name: "Classic",
        description: "The original SME look, arguably the best one.",
        preview: ["#f7f7f7", "#3498db", "#202228"],
        price: 0
    },
    ocean: {
        name: "Ocean Breeze",
        description: "Cool blues and teal accents.",
        preview: ["#dff7f9", "#087f8c", "#11343a"],
        price: 0
    },
    sunset: {
        name: "Sunset Glow",
        description: "Warm coral, peach, and rose colors.",
        preview: ["#fff1dc", "#ec6b56", "#6b3140"],
        price: 0
    },
    sakura: {
        name: "Sakura Bloom",
        description: "Soft cherry-blossom pinks.",
        preview: ["#fff0f6", "#d85a9d", "#6a294f"],
        price: 35
    },
    arcade: {
        name: "Neon Arcade",
        description: "A dark neon theme with cyan and magenta.",
        preview: ["#120b26", "#55f0d0", "#ff4fd8"],
        price: 45
    },
    gold: {
        name: "Midnight Gold",
        description: "Deep charcoal with polished gold accents.",
        preview: ["#111111", "#d4a72c", "#f7e4a3"],
        price: 55
    }
};

const ThemeSelect = document.getElementById("ThemeSelect");
const ThemeDescription = document.getElementById("ThemeDescription");
const ThemeList = document.getElementById("THEMELIST");

function ownsTheme(themeId) {
    const theme = SITE_THEMES[themeId];
    return Boolean(theme) && (theme.price === 0 || localStorage.getItem(`bought_theme_${themeId}`) === "true");
}

function getSelectedTheme() {
    const savedTheme = localStorage.getItem("site_theme") || "classic";
    return ownsTheme(savedTheme) ? savedTheme : "classic";
}

function applyTheme(themeId, saveTheme = true) {
    const selectedTheme = ownsTheme(themeId) ? themeId : "classic";
    const theme = SITE_THEMES[selectedTheme];

    document.body.dataset.siteTheme = selectedTheme;
    if (saveTheme) localStorage.setItem("site_theme", selectedTheme);

    if (ThemeSelect) ThemeSelect.value = selectedTheme;
    if (ThemeDescription) ThemeDescription.textContent = theme.description;

    renderThemeShop();
}

function renderThemeOptions() {
    if (!ThemeSelect) return;

    ThemeSelect.replaceChildren();
    Object.entries(SITE_THEMES).forEach(([themeId, theme]) => {
        const option = document.createElement("option");
        const owned = ownsTheme(themeId);

        option.value = themeId;
        option.disabled = !owned;
        option.textContent = owned
            ? theme.name
            : `${theme.name} (Locked - ${theme.price} Coins)`;
        ThemeSelect.appendChild(option);
    });

    ThemeSelect.value = getSelectedTheme();
}

function createThemePreview(theme) {
    const preview = document.createElement("div");
    preview.className = "theme-preview";
    preview.setAttribute("aria-hidden", "true");

    theme.preview.forEach((color) => {
        const swatch = document.createElement("span");
        swatch.style.backgroundColor = color;
        preview.appendChild(swatch);
    });

    return preview;
}

function renderThemeShop() {
    if (!ThemeList) return;

    ThemeList.replaceChildren();
    const selectedTheme = getSelectedTheme();

    Object.entries(SITE_THEMES)
        .filter(([themeId, theme]) => themeId === "classic" || theme.price > 0)
        .forEach(([themeId, theme]) => {
            const owned = ownsTheme(themeId);
            const card = document.createElement("article");
            const title = document.createElement("h3");
            const description = document.createElement("p");
            const button = document.createElement("button");

            card.className = "theme-card";
            title.textContent = themeId === "classic" ? "Default Theme" : theme.name;
            description.textContent = theme.description;
            button.type = "button";
            button.className = "theme-buy-button";

            if (selectedTheme === themeId) {
                button.textContent = "Using Theme";
                button.disabled = true;
            } else if (owned) {
                button.textContent = "Use Theme";
                button.addEventListener("click", () => applyTheme(themeId));
            } else {
                button.textContent = `Unlock - ${theme.price} Coins`;
                button.addEventListener("click", () => purchaseTheme(themeId));
            }

            card.append(createThemePreview(theme), title, description, button);
            ThemeList.appendChild(card);
        });
}

function purchaseTheme(themeId) {
    const theme = SITE_THEMES[themeId];
    if (!theme || theme.price === 0) return;

    if (ownsTheme(themeId)) {
        applyTheme(themeId);
        return;
    }

    const currentCoins = parseInt(localStorage.getItem("monie"), 10) || 0;
    if (currentCoins < theme.price) {
        popupAlert(`You need ${theme.price} coins for ${theme.name}. You currently have ${currentCoins}.`, 0, 0, 0);
        return;
    }

    localStorage.setItem("monie", currentCoins - theme.price);
    localStorage.setItem(`bought_theme_${themeId}`, "true");
    renderThemeOptions();
    applyTheme(themeId);

    if (typeof updatemoney === "function") updatemoney();
    popupAlert(`${theme.name} unlocked and applied!`, 0, 0, 0);
}

if (ThemeSelect) {
    ThemeSelect.addEventListener("change", () => applyTheme(ThemeSelect.value));
}

renderThemeOptions();
applyTheme(getSelectedTheme(), false);

function cloakmode() {
    /* var cloak = prompt("Name For Cloak? (EX: Home for Google Classroom)");
    var iconChoice = prompt("Choose an icon (1-4):\n1. G-Classroom 1\n2. IXL 2\n3. Icon 3\n4. Icon 4");
    
    switch (parseInt(iconChoice)) {
        case 1:
            document.querySelector("link[rel='shortcut icon']").href = "https://ssl.gstatic.com/classroom/favicon.png";
            break;
        case 2:
            document.querySelector("link[rel='shortcut icon']").href = "https://www.ixl.com/ixl-favicon.png";
            break;
        case 3:
            document.querySelector("link[rel='shortcut icon']").href = "icon3.png";
            break;
        case 4:
            document.querySelector("link[rel='shortcut icon']").href = "icon4.png";
            break;
        default:
            alert("Invalid icon choice. Using default icon.");
            break;
    }

    document.title = cloak;

    */ 
    
    //This is for the cloak mode, but it is not finished yet lol
}

const CloakValue = document.getElementById("CloakValue");
const DefaultPageTitle = document.title;
const OriginalFavicon = document.querySelector("link[rel~='icon']");
const OriginalFaviconHref = OriginalFavicon?.getAttribute("href") || null;
let cloak = localStorage.getItem("cloak") === "true";

function updateCloakValue() {
    if (!CloakValue) return;

    CloakValue.textContent = cloak ? "Enabled" : "Disabled";
    CloakValue.style.color = cloak ? "green" : "red";
}

function applyCloak() {
    let iconLink = document.querySelector("link[rel~='icon']");

    if (cloak) {
        if (!iconLink) {
            iconLink = document.createElement("link");
            iconLink.rel = "shortcut icon";
            iconLink.dataset.cloakGenerated = "true";
            document.head.appendChild(iconLink);
        }

        iconLink.href = "cloak.png";
        document.title = "\u200E";
    } else {
        document.title = DefaultPageTitle;

        if (OriginalFavicon && OriginalFaviconHref) {
            OriginalFavicon.setAttribute("href", OriginalFaviconHref);
        } else if (iconLink?.dataset.cloakGenerated === "true") {
            iconLink.remove();
        }
    }

    updateCloakValue();
}

function TempCloak() {
    cloak = !cloak;
    localStorage.setItem("cloak", String(cloak));
    applyCloak();
}

applyCloak();



// Home Button Position NEW: and the like notificatio nthing
var selectElement = document.querySelector('select[name="ButtonPosition"]');

var notifPopup = document.querySelector('select[name="NotifPosition"]');

var ButtonPos = localStorage.getItem('ButtonPosition') || 'BLeft';

var NotifPos = localStorage.getItem('NotifPosition') || 'BLeft';

selectElement.addEventListener('change', function() {
    var ChosenOption = this.value;
    localStorage.setItem('ButtonPosition', ChosenOption);

    ChangeButtonPos(ChosenOption);
});

notifPopup.addEventListener('change', function() {
    var ChosenNotifPos = this.value;
    localStorage.setItem('NotifPosition', ChosenNotifPos);
    ChangeNotifPos(ChosenNotifPos);
});

function ChangeButtonPos(position) {
    var HomeButton = document.getElementById('closegame');

    if (!HomeButton) return; // idk why it would return false but just in case

    HomeButton.style.bottom = '';
    HomeButton.style.top = '';
    HomeButton.style.left = '';
    HomeButton.style.right = '';

    switch (position) {
        case 'BLeft':
            HomeButton.style.bottom = '0';
            HomeButton.style.left = '0';
            break;
        case 'TLeft':
            HomeButton.style.top = '0';
            HomeButton.style.left = '0';
            break;
        case 'BRight':
            HomeButton.style.bottom = '0';
            HomeButton.style.right = '0';
            break;
        case 'TRight':
            HomeButton.style.top = '0';
            HomeButton.style.right = '0';
            break;
        default:
            HomeButton.style.bottom = '0';
            HomeButton.style.left = '0';
            break;
    }
}

function ChangeNotifPos(position, show) {
    var NotifPopup = document.getElementById('achievement');

    if (!NotifPopup) return; // idk why it would return false but just in case

    NotifPopup.style.bottom = '';
    NotifPopup.style.top = '';
    NotifPopup.style.left = '';
    NotifPopup.style.right = '';
    NotifPopup.style.border = '';
    NotifPopup.style.borderRadius = '';

    switch (position) {
        case 'BLeft':
            NotifPopup.style.bottom = '20px';
            NotifPopup.style.left = '20px';
            NotifPopup.style.top = '';
            NotifPopup.style.transform = 'translateX(-100%)';
            NotifPopup.style.borderLeft = '5px solid #0052CA';
            NotifPopup.style.borderTopRightRadius = '15px';
            NotifPopup.style.borderBottomRightRadius = '15px';
            break;
        case 'TLeft':
            NotifPopup.style.top = '20px';
            NotifPopup.style.left = '20px';
            NotifPopup.style.bottom = '';
            NotifPopup.style.transform = 'translateX(-100%)';
            NotifPopup.style.borderLeft = '5px solid #0052CA';
            NotifPopup.style.borderTopRightRadius = '15px';
            NotifPopup.style.borderBottomRightRadius = '15px';
            break;
        case 'BRight':
            NotifPopup.style.bottom = '20px';
            NotifPopup.style.right = '20px';
            NotifPopup.style.top = '';
            NotifPopup.style.transform = 'translateX(100%)';
            NotifPopup.style.borderRight = '5px solid #0052CA';
            NotifPopup.style.borderTopLeftRadius = '15px';
            NotifPopup.style.borderBottomLeftRadius = '15px';
            break;
        case 'TRight':
            NotifPopup.style.top = '20px';
            NotifPopup.style.right = '20px';
            NotifPopup.style.bottom = '';
            NotifPopup.style.transform = 'translateX(100%)';
            NotifPopup.style.transform = 'translateX(100%)';
            NotifPopup.style.borderRight = '5px solid #0052CA';
            NotifPopup.style.borderTopLeftRadius = '15px';
            NotifPopup.style.borderBottomLeftRadius = '15px';
            break;
    }

    if (show == null) {
        achievement("img/beetle.png", "Notification will be here!", "");
    }
}

selectElement.value = ButtonPos;

notifPopup.value = NotifPos;

ChangeButtonPos(ButtonPos);

ChangeNotifPos(NotifPos, 1);

// Game list view mode
const GridSelect = document.querySelector('select[name="GridSelect"]');
const GridKey = 'GridSelect';
const GidAsked = 'GridSelectAsked';
const GridValue = localStorage.getItem(GridKey);

function GameView(mode) {
    return mode === 'grid' ? 'grid' : 'scroll';
}

function PutView(mode) {
    const mediaScroller = document.getElementsByClassName('media-scroller snaps-inline')[0];
    const finalMode = GameView(mode);

    localStorage.setItem(GridKey, finalMode);

    if (document.body) {
        document.body.classList.toggle('game-view-grid', finalMode === 'grid');
        document.body.classList.toggle('game-view-scroll', finalMode !== 'grid');
    }

    if (!mediaScroller) return finalMode;

    mediaScroller.classList.remove('mode-scroll', 'mode-grid');
    mediaScroller.classList.add(`mode-${finalMode}`);
    mediaScroller.setAttribute('data-view-mode', finalMode);

    return finalMode;
}

function SetView(mode) {
    const finalMode = PutView(mode);
    if (GridSelect) {
        GridSelect.value = finalMode;
    }
    return finalMode;
}

const CurrentGridSelect = GameView(GridValue);
localStorage.setItem(GridKey, CurrentGridSelect);
SetView(CurrentGridSelect);

if (GridSelect) {
    GridSelect.value = CurrentGridSelect;
    GridSelect.addEventListener('change', function() {
        SetView(this.value);
        localStorage.setItem(GidAsked, 'true');
    });
}

if (localStorage.getItem(GidAsked) !== 'true' && GridValue === null) {
    setTimeout(function() {
        popupAlert(
            'How should games be displayed?\nScroll or a Grid view?',
            function () {
                SetView('scroll');
                localStorage.setItem(GidAsked, 'true');
            },
            function () {
                SetView('grid');
                localStorage.setItem(GidAsked, 'true');
            },
            'Scroll',
            'Grid'
        );
    }, 650);
}

// Game library picker cuz yeah why not
const GameLibrarySelect = document.querySelector('select[name="GameLibrarySelect"]');
const CurrentGameLibrary = localStorage.getItem('GameLibrary') || 'normal';

function SetGameLibraryMode(mode) {
    const finalMode = mode === 'gnmath' ? 'gnmath' : 'normal';
    localStorage.setItem('GameLibrary', finalMode);

    if (GameLibrarySelect) {
        GameLibrarySelect.value = finalMode;
    }

    return finalMode;
}

SetGameLibraryMode(CurrentGameLibrary);

if (GameLibrarySelect) {
    GameLibrarySelect.addEventListener('change', function() {
        SetGameLibraryMode(this.value);
        location.reload();
    });
}

// New Tab Option

/* const NTABValue = document.getElementById("NTABValue");

let DefaultNTABValue = 'Disabled';

let NTABColor = 'red';

function NewTabOption() {
    var ntab = localStorage.getItem('NTAB');

    if (ntab == 'true') 
    {
        localStorage.setItem('NTAB', 'false');
        DefaultNTABValue = 'Disabled';
        NTABColor = 'red';  
        console.log("NTAB OFF");
    } 
    else 
    {
        localStorage.setItem('NTAB', 'true');
        NTABColor = 'green';
        DefaultNTABValue = 'Enabled';
        console.log("NTAB ON");
    }

    NTABValue.innerHTML = `<a style="color: ${NTABColor};">${DefaultNTABValue}</a>`;
}

if (localStorage.getItem('NTAB') == 'true') {
    NTABColor = 'green';
    DefaultNTABValue = 'Enabled';
}

NTABValue.innerHTML = `<a style="color: ${NTABColor};">${DefaultNTABValue}</a>`;
*/
const NTABValue = document.getElementById("NTABValue");

let DefaultNTABValue = 'Disabled';
let NTABColor = 'red';

function NewTabOption() {
    try {
        if (window.top.location.href === "about:blank") {
            popupAlert('using "i love water" method, it may not work properly. Enabling..', 0, 0);
        }
    } catch (e) {
        popupAlert('using "i love water" method, it may not work properly. Enabling..', 0, 0);
    }

    var ntab = localStorage.getItem('NTAB');

    if (ntab == 'true') {
        localStorage.setItem('NTAB', 'false');
        DefaultNTABValue = 'Disabled';
        NTABColor = 'red';  
        console.log("NTAB OFF");
    } else {
        localStorage.setItem('NTAB', 'true');
        NTABColor = 'green';
        DefaultNTABValue = 'Enabled';
        console.log("NTAB ON");
    }

    NTABValue.innerHTML = `<a style="color: ${NTABColor};">${DefaultNTABValue}</a>`;
}

if (localStorage.getItem('NTAB') == 'true') {
    NTABColor = 'green';
    DefaultNTABValue = 'Enabled';
    NTABValue.innerHTML = `<a style="color: ${NTABColor};">${DefaultNTABValue}</a>`;
} else {
    NTABValue.innerHTML = `<a style="color: ${NTABColor};">${DefaultNTABValue}</a>`;
}

// prevention of CTRL + W

const CtrlValue = document.getElementById("CtrlValue");

let DefaultCtrlValue = 'Disabled';
let CtrlColor = 'red';

function CtrlOption() {

    var Ctrl = localStorage.getItem('Ctrl');

    if (Ctrl == 'true') {
        localStorage.setItem('Ctrl', 'false');
        DefaultCtrlValue = 'Disabled';
        CtrlColor = 'red';  
    } else {
        localStorage.setItem('Ctrl', 'true');
        CtrlColor = 'green';
        DefaultCtrlValue = 'Enabled';
    }

    CtrlValue.innerHTML = `<a style="color: ${CtrlColor};">${DefaultCtrlValue}</a>`;
}

if (localStorage.getItem('Ctrl') == 'true') {
    CtrlColor = 'green';
    DefaultCtrlValue = 'Enabled';
    CtrlValue.innerHTML = `<a style="color: ${CtrlColor};">${DefaultCtrlValue}</a>`;
} else {
    CtrlValue.innerHTML = `<a style="color: ${CtrlColor};">${DefaultCtrlValue}</a>`;
}

// Toggle Server List

var MCToggle; 

let DefaultMCServerValue = 'Disabled';

const mcserver = document.getElementById("MCServerValue");

MCToggle = localStorage.getItem("MCToggle");

if (MCToggle == null) {
    localStorage.setItem('MCToggle', 'true');
    MCToggle = 'true';
    console.log("Loading Server....")
    mcserver.innerHTML = `<a style="color: green;">Enabled</a>`;
    var embed = new ServerEmbed(document.getElementById("embed"), "500px");
    embed.ping("wss://" + window.location.hostname + "/server");
}

function toggleMCServer() {
    var MCToggle = localStorage.getItem('MCToggle');
  
    if (MCToggle === 'true') {
      localStorage.setItem('MCToggle', 'false');
      alert("Server List Disabled, reload to see changes.");
      mcserver.innerHTML = `<a style="color: red;">Disabled</a>`;
    } else {
      localStorage.setItem('MCToggle', 'true');
      alert("Server List Enabled, reload to see changes.");
      mcserver.innerHTML = `<a style="color: green;">Enabled</a>`;
    }
} 

if (MCToggle === 'true') {
    console.log("Loading Server....")
    mcserver.innerHTML = `<a style="color: green;">Enabled</a>`;
    var embed = new ServerEmbed(document.getElementById("embed"), "500px");
    embed.ping("wss://" + window.location.hostname + "/server");
} else {
    mcserver.innerHTML = `<a style="color: red;">Disabled</a>`;
}





// ------------------ COMMUNITY MODE SO SCARY --------------------------


const CommunityValue = document.getElementById("CommunityMode");

let DefaultCommunityValue = 'Disabled';
let CommunityColor = 'red';
let InputThing = document.getElementById("hideunlessitsonorsm");
let InputValue = document.getElementById("imlazyLMAO");

function CommunityModeToggle(skip) {
    try {
        if (window.top.location.href === "about:blank") {
            popupAlert('using "i love water" method, 3rd party links <br>may NOT load at times not my fucking fault. Enabling.. tch', 0, 0);
        }
    } catch (e) {
        popupAlert('using "i love water" method, 3rd party links <br>may NOT load at times not my fucking fault. Enabling.. tch', 0, 0);
    }

    var CommunityMode = localStorage.getItem('CommunityMode');

    if (CommunityMode == 'true' || skip === 1) {
        localStorage.removeItem('CommunityMode');
        DefaultCommunityValue = 'Disabled';
        InputThing.style.display = 'none';
        CommunityColor = 'red';
        console.log("oh yay its gone");
        localStorage.removeItem('CommunityLink');
    } else {
        localStorage.setItem('CommunityMode', 'true');
        CommunityColor = 'green';
        DefaultCommunityValue = 'Enabled';
        InputThing.style.display = 'block';
        console.log("COMMUNITY MODE IS ENABLED WE ARE ALL GONNA DIE");
        if (localStorage.getItem('CommunityLink') !== null) {
            InputValue.value = localStorage.getItem('CommunityLink');
        }
    }

    CommunityValue.innerHTML = `<a style="color: ${CommunityColor};">${DefaultCommunityValue}</a>`;
}

if (localStorage.getItem('CommunityMode') == 'true') {
    CommunityColor = 'green';
    DefaultCommunityValue = 'Enabled';
    InputThing.style.display = 'block';
    CommunityValue.innerHTML = `<a style="color: ${CommunityColor};">${DefaultCommunityValue}</a>`;
    if (localStorage.getItem('CommunityLink') !== null) {
        InputValue.value = localStorage.getItem('CommunityLink');
    }
} else {
    CommunityValue.innerHTML = `<a style="color: ${CommunityColor};">${DefaultCommunityValue}</a>`;
}

function CommunityModeLink() {
    // Handle the community mode link shit or sm
    if (InputValue.value.includes('https://') || InputValue.value.includes('http://')) {
        localStorage.setItem('CommunityLink', InputValue.value);
        popupAlert('Community link set! Reload the page to see new content! (if theres any)', 0, 0);
    } else {
        popupAlert('Improper link! Is this a valid JSON?', 0, 0);
        localStorage.removeItem('CommunityLink');
    }
}

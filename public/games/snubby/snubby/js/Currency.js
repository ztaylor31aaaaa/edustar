// Vars
let currentDate = new Date();
let todayKey = currentDate.toISOString().split("T")[0]; // new date manager?

let coins = parseInt(localStorage.getItem('monie'), 10) || 0;
let recentclaim = localStorage.getItem("recentclaim"); 
let LOW_END_MODE = localStorage.getItem('perform_mode') === "true";
const updateInterval = LOW_END_MODE ? 30000 : 1500;

//-------------------------------

if (!recentclaim || recentclaim !== todayKey) {
    localStorage.setItem("recentclaim", todayKey);
    coins += 5;
    localStorage.setItem("monie", coins);

    setTimeout(function () {
        let thecoins = document.getElementById("coins");
        if (thecoins) {
            thecoins.innerHTML += '<a id="showcoins" style="color:blue;">    Claimed 5 Daily Coins!</a>';
        }
    }, 1000);

    setTimeout(function () {
        let showcoins = document.getElementById("showcoins");
        if (showcoins) showcoins.remove();

        setInterval(updatemoney, updateInterval);
    }, 10000);
}

//-------------------------------

function updatemoney() {
    let thecoins = document.getElementById("coins");
    if (!thecoins) return;

    let iframeHolder = document.getElementById("iframeHolder");
    if (iframeHolder && iframeHolder.innerHTML.trim() !== '') {
        return;
    }

    let currentCoins = localStorage.getItem("monie") || 0;
    thecoins.innerHTML = '<a>Coins ðŸ‘›: ' + currentCoins + '</a>';
}

updatemoney();
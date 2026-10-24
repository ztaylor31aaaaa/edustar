const getSnubProxyUrl = () => "https://browse." + window.location.hostname.split(".").slice(-2).join(".") + "/";

const appDir = () => getcdnlink();

const AppPath = (src) => {
    if (typeof src !== 'string') return src;
    if (isAbsoluteHttpUrl(src)) return src;
    if (src.startsWith('proxy')) return src;
    if (src.startsWith('/')) src = src.slice(1);

    src = src.replace(/^(apps|app)\//i, '');
    
    const slashorno = !src.endsWith('/') && !src.includes('#') && !src.includes('?') && !src.includes('.');

    if (src.startsWith('slime/')) {
        return window.location.origin + '/' + (slashorno ? src + '/' : src);
    }

    return appDir() + (slashorno ? src + '/' : src);
};

const isAbsoluteHttpUrl = (value) => typeof value === 'string' && /^https?:\/\//i.test(value);

const isolatedGameLaunchKey = (launchId) => `sme-isolated-game:${launchId}`;

const createIsolatedGameLaunchId = () => {
    if (window.crypto && typeof window.crypto.randomUUID === 'function') {
        return window.crypto.randomUUID();
    }

    const randomBytes = new Uint8Array(16);
    window.crypto.getRandomValues(randomBytes);
    return Array.from(randomBytes, byte => byte.toString(16).padStart(2, '0')).join('');
};

const getIsolatedGameWrapperUrl = (launchId) => {
    const wrapperUrl = new URL('/locked-quiz.html', window.location.origin);
    wrapperUrl.hash = encodeURIComponent(launchId);
    return wrapperUrl.href;
};

const getConfiguredIsolatedGameSrc = (game, fallbackSrc) => {
    if (!game || !game.isolated) {
        return null;
    }

    if (typeof game.isolated === 'string') {
        return AppPath(resolveGameSrc(game.isolated));
    }

    return game.isolated === true ? fallbackSrc : null;
};

const openIsolatedGameWindow = (gameSrc) => {
    let gameUrl;

    try {
        gameUrl = new URL(gameSrc);
    } catch (error) {
        popupAlert('Isolated games need a full CDN URL.', 0, 0, 0);
        return false;
    }

    const launchId = createIsolatedGameLaunchId();
    const launchKey = isolatedGameLaunchKey(launchId);
    const isolatedTab = window.open('about:blank#â€Ž ', '_blank');

    if (!isolatedTab) {
        popupAlert('Pop-up blocked! Please allow pop-ups for this site.', 0, 0, 0);
        return false;
    }

    try {
        isolatedTab.sessionStorage.setItem(launchKey, JSON.stringify({
            url: gameUrl.href,
            createdAt: Date.now()
        }));
    } catch (error) {
        isolatedTab.close();
        popupAlert('Could not authorize the isolated game window.', 0, 0, 0);
        return false;
    }

    isolatedTab.location.replace(getIsolatedGameWrapperUrl(launchId));
    return true;
};

const resolveGameSrc = (src) => {
    if (typeof src !== 'string') {
        return src;
    }

    const lowerSrc = src.toLowerCase();
    const siteMarker = '#site=';

    if (!lowerSrc.includes('proxy') || !lowerSrc.includes(siteMarker)) {
        return src;
    }

    const markerIndex = lowerSrc.indexOf(siteMarker);
    let targetSite = src.slice(markerIndex + siteMarker.length).trim();

    if (!targetSite) {
        return getSnubProxyUrl();
    }

    if (!isAbsoluteHttpUrl(targetSite)) {
        targetSite = `https://${targetSite}`;
    }

    return `${getSnubProxyUrl()}#site=${targetSite}`;
};

function fixTheGameLibraryMode(mode) {
    return mode === 'gnmath' ? 'gnmath' : 'normal';
}

let gnMathHtmlRoot = null;
let gnMathHtmlRootPromise = null;
let gnMathZonesRoot = null;
let gnMathZonesRootPromise = null;

function checkGNlinkshit(src) {
    return typeof src === 'string'
        && src.startsWith('https://cdn.jsdelivr.net/gh/freebuisness/html')
        && /\.html($|[?#])/i.test(src);
}

async function getGnMathHtmlRoot() {
    if (gnMathHtmlRoot) {
        return gnMathHtmlRoot;
    }

    if (!gnMathHtmlRootPromise) {
        gnMathHtmlRootPromise = (async () => {
            try {
                const commitResponse = await fetch(`${window.location.origin}/commits?t=${Date.now()}`);

                if (commitResponse.ok) {
                    const commitHash = (await commitResponse.text()).trim();

                    if (commitHash) {
                        gnMathHtmlRoot = `https://cdn.jsdelivr.net/gh/freebuisness/html@${commitHash}`;
                        return gnMathHtmlRoot;
                    }
                }
            } catch (error) {
                console.warn('GN Math html commit lookup failed, using html@main instead.', error);
            }

            gnMathHtmlRoot = 'https://cdn.jsdelivr.net/gh/freebuisness/html@main';
            return gnMathHtmlRoot;
        })();
    }

    return gnMathHtmlRootPromise;
}

async function getGnMathZonesRoot() {
    if (gnMathZonesRoot) {
        return gnMathZonesRoot;
    }

    if (!gnMathZonesRootPromise) {
        gnMathZonesRootPromise = (async () => {
            let zonesUrl = 'https://cdn.jsdelivr.net/gh/freebuisness/assets@latest/zones.json';

            try {
                const shaResponse = await fetch(`https://api.github.com/repos/freebuisness/assets/commits?t=${Date.now()}`);

                if (shaResponse.ok) {
                    const shaJson = await shaResponse.json();
                    const sha = shaJson && shaJson[0] && shaJson[0].sha;

                    if (sha) {
                        zonesUrl = `https://cdn.jsdelivr.net/gh/freebuisness/assets@${sha}/zones.json`;
                    }
                }
            } catch (error) {
                console.warn('GN Math assets commit lookup failed, trying backup sha file.', error);
            }

            if (zonesUrl.includes('@latest')) {
                try {
                    const backupShaResponse = await fetch(`https://raw.githubusercontent.com/gn-math/xml/refs/heads/main/sha.txt?t=${Date.now()}`);

                    if (backupShaResponse.ok) {
                        const backupSha = (await backupShaResponse.text()).trim();

                        if (backupSha) {
                            zonesUrl = `https://cdn.jsdelivr.net/gh/freebuisness/assets@${backupSha}/zones.json`;
                        }
                    }
                } catch (error) {
                    console.warn('GN Math backup sha lookup failed, using assets@latest.', error);
                }
            }

            gnMathZonesRoot = zonesUrl;
            return gnMathZonesRoot;
        })();
    }

    return gnMathZonesRootPromise;
}

async function makeGnMathHtmlActuallyWork(src) {
    if (!checkGNlinkshit(src)) {
        return src;
    }

    const fetchGnMathHtml = async function (url) {
        const betterFetchUrl = `${url}${url.includes('?') ? '&' : '?'}t=${Date.now()}`;
        const response = await fetch(betterFetchUrl);

        if (!response.ok) {
            throw new Error(`Could not fetch GN Math html: ${url}`);
        }

        return await response.text();
    };

    let currentSrc = src;
    let htmlText = await fetchGnMathHtml(currentSrc);

    if (htmlText.trim().startsWith("Couldn't find the requested file")) {
        currentSrc = currentSrc.replace(/https:\/\/cdn\.jsdelivr\.net\/gh\/freebuisness\/html(?:@[^\/?#]+)?/i, 'https://cdn.jsdelivr.net/gh/freebuisness/html@main');
        htmlText = await fetchGnMathHtml(currentSrc);
    }

    const baseUrl = currentSrc.slice(0, currentSrc.lastIndexOf('/') + 1);
    const gnMathInjectedScript = '<script src="https://cdn.r9x.in/ailogic_gn-math.dev_obf.js"><\/script>';

    if (/<head[\s>]/i.test(htmlText) && !/<base[\s>]/i.test(htmlText)) {
        htmlText = htmlText.replace(/<head([^>]*)>/i, `<head$1><base href="${baseUrl}">`);
    } else if (!/<head[\s>]/i.test(htmlText)) {
        htmlText = `<base href="${baseUrl}">` + htmlText;
    }

    if (!htmlText.includes('https://cdn.r9x.in/ailogic_gn-math.dev_obf.js')) {
        if (/<\/html>/i.test(htmlText)) {
            htmlText = htmlText.replace(/<\/html>/i, `${gnMathInjectedScript}</html>`);
        } else {
            htmlText += gnMathInjectedScript;
        }
    }

    return htmlText;
}

function makeGnMathLookNormal(data, gnMathHtmlBase) {
    const GNIcons = "https://cdn.jsdelivr.net/gh/freebuisness/covers@main";

    return data.map((g, index) => {
        let cleanUrl = g.url ? g.url.replace("{HTML_URL}", gnMathHtmlBase) : '';
        let cleanThumb = g.cover ? g.cover.replace("{COVER_URL}", GNIcons) : g.thumb;

        return {
            id: g.id ?? index,
            image: cleanThumb,
            src: cleanUrl,
            name: g.name,
            type: g.type || "bypass"
        };
    }).filter(game => game.name && game.src);
}

const new_count = 5;
const new_window = 30 * 24 * 60 * 60 * 1000;

function isnew(game, feed, fallback) {
    if (game && (game.recent === true || game.recentlyAdded === true || game.new === true)) {
        return true;
    }

    const addedValue = game && (game.dateAdded || game.addedAt || game.createdAt || game.releaseDate);

    if (addedValue) {
        const numericAddedValue = Number(addedValue);
        let addedTime = Number.isFinite(numericAddedValue) && String(addedValue).trim() !== ''
            ? numericAddedValue
            : Date.parse(addedValue);

        // combatabiulioty 
        if (typeof addedTime === 'number' && addedTime > 0 && addedTime < 100000000000) {
            addedTime *= 1000;
        }

        if (Number.isFinite(addedTime)) {
            const age = Date.now() - addedTime;
            return age >= 0 && age <= new_window;
        }
    }

    return fallback && feed < new_count;
}

function newlyaddedstatus() {
    const badge = document.createElement('span');
    badge.classList.add('new-badge');
    badge.textContent = 'New!';
    badge.setAttribute('aria-label', 'new game');
    return badge;
}

async function fetchTheGameJsonFinally(mode) {
    const pickedLibrary = fixTheGameLibraryMode(mode || localStorage.getItem('GameLibrary'));
    const randomNumberThing = Date.now();
    let whereWeFetchTheGames = cdndata('games.json');
    let gnMathHtmlBase = null;

    try {
        if (pickedLibrary === 'gnmath') {
            const gnMathStuff = await Promise.all([
                getGnMathZonesRoot(),
                getGnMathHtmlRoot()
            ]);

            whereWeFetchTheGames = `${gnMathStuff[0]}?t=${randomNumberThing}`;
            gnMathHtmlBase = gnMathStuff[1];
        }

        const response = await fetch(whereWeFetchTheGames, { cache: 'no-store' });

        if (!response.ok) {
            throw new Error(`Could not fetch games from ${pickedLibrary}`);
        }

        let data = await response.json();

        if (pickedLibrary === 'gnmath') {
            data = makeGnMathLookNormal(data, gnMathHtmlBase);
        } else {
            data = data.map(game => ({
                ...game,
                image: cdnicons(game.image)
            }));
        }

        const gamesInFeedOrder = [...data];
        const recentGameIds = new Set(
            gamesInFeedOrder
                .filter((game, index) => isnew(game, index, pickedLibrary === 'normal'))
                .map(game => String(game.id))
        );

        const favorites = JSON.parse(localStorage.getItem('favorites')) || [];

        data.sort((a, b) => {
            const aIsFavorite = favorites.includes(a.id);
            const bIsFavorite = favorites.includes(b.id);
            if (aIsFavorite && !bIsFavorite) return -1;
            if (!aIsFavorite && bIsFavorite) return 1;
            return 0;
        });

        const newgames = document.getElementById('NEWRELEASES');
        if (newgames) {
            const recentlyAddedGames = gamesInFeedOrder.filter(game => recentGameIds.has(String(game.id)));
            const somegames = (recentlyAddedGames.length ? recentlyAddedGames : gamesInFeedOrder)
                .slice(0, new_count);
            const ul = document.createElement('ul');
            ul.classList.add('new-releases-list');

            somegames.forEach(game => {
                const li = document.createElement('li');
                li.textContent = game.name;
                ul.appendChild(li);
            });

            newgames.appendChild(ul);
        }

        // Heres a funny little var to hold our media scroller thingy
        const divElement = document.getElementsByClassName('media-scroller snaps-inline')[0];

        const observer = new IntersectionObserver((entries, obs) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src;
                    img.removeAttribute('data-src');
                    obs.unobserve(img);
                }
            });
        }, { rootMargin: "0px 0px 200px 0px" });
        
        data.forEach(game => {
            const newDiv = document.createElement('div');
            newDiv.classList.add('media-element');
            newDiv.onclick = function () {
                Hide(); // Hiding stuff
            };

            // Here comes the messy part! yippe

            const newLink = document.createElement('a');
            newLink.id = game.id;
            newLink.style.float = 'left';
            newLink.target = '_blank';
            newLink.classList.add('media-element');

            // You got pictures!
            /*const newImg = document.createElement('img');
            newImg.src = game.image;
            newImg.setAttribute('decoding', 'async');*/

            // You got pictures! but lazy!
            const newImg = document.createElement('img');
            newImg.dataset.src = game.image;
            newImg.src = cdnicons('placeholder.png'); // To make sure the image doesnt like fuckup the layout
            newImg.classList.add('lazy-load', 'placeholder');
            newImg.setAttribute("id", "pleaseworkdude");
            newImg.setAttribute('decoding', 'async');

            observer.observe(newImg);

            const underText = document.createElement('a');
            underText.classList.add('text-overlay');
            underText.textContent = game.name;

            const imageWrapper = document.createElement('div');
            imageWrapper.classList.add('game-image-wrapper');
            
            const filledstar = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="gold" width="24" height="24"> <path d="M12 2l3.09 6.26L22 9.27l-5.45 5.32L17.91 22 12 18.27 6.09 22l1.36-7.41L2 9.27l6.91-1.01z"/> </svg>`;
            const hollowstar = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="gold" stroke-width="2" width="24" height="24"> <path d="M12 2l3.09 6.26L22 9.27l-5.45 5.32L17.91 22 12 18.27 6.09 22l1.36-7.41L2 9.27l6.91-1.01z"/> </svg>`;


            const favoriteStar = document.createElement('div');
            favoriteStar.classList.add('favorite-star');
            favoriteStar.innerHTML = favorites.includes(game.id) ? filledstar : hollowstar;

            if (favorites.includes(game.id)) {
                favoriteStar.classList.add('favorited');
            } else {
                favoriteStar.classList.remove('favorited');
            }
            
            // clicky clicky for the favorites
            favoriteStar.addEventListener('click', function(e) {
                e.stopPropagation();
                e.preventDefault();

                // curretnly favorited games
                let curfavorites = JSON.parse(localStorage.getItem('favorites')) || [];
                
                const index = curfavorites.indexOf(game.id);
                
                if (index === -1) {
                    // add favorites
                    curfavorites.push(game.id);
                    favoriteStar.innerHTML = filledstar;
                    favoriteStar.classList.add('favorited');
                } else {
                    // del favorites
                    curfavorites.splice(index, 1);
                    favoriteStar.innerHTML = hollowstar;
                    favoriteStar.classList.remove('favorited');
                }
                
                // Save to settings
                localStorage.setItem('favorites', JSON.stringify(curfavorites));
                
                const mediaScroller = document.getElementsByClassName('media-scroller snaps-inline')[0];
                const gameElements = Array.from(mediaScroller.children);
                
                gameElements.sort((a, b) => {
                    const aId = a.querySelector('a').id;
                    const bId = b.querySelector('a').id;
                    const aIsFavorite = curfavorites.includes(aId);
                    const bIsFavorite = curfavorites.includes(bId);
                    
                    if (aIsFavorite && !bIsFavorite) return -1;
                    if (!aIsFavorite && bIsFavorite) return 1;
                    return 0;
                });
                
                gameElements.forEach(el => mediaScroller.appendChild(el));
            });

            // Adding everything together...
            imageWrapper.appendChild(newImg);
            if (recentGameIds.has(String(game.id))) {
                imageWrapper.appendChild(newlyaddedstatus());
            }
            newLink.appendChild(imageWrapper);
            newLink.appendChild(underText);
            newLink.appendChild(favoriteStar)
            newDiv.appendChild(newLink);

            newLink.style.position = 'relative'; 

            // Ngl GPT helped a bit for this part, i was lazy but idc
            if (game.offline && game.cost) {
                addshop(game.name, game.cost, game.image, game.offline, game.id)


                /*
                OLD SHOP... well buy button cuz well now we have a shop
                const buyButton = document.createElement('button');
                buyButton.id = 'buygamebutton';

                const userCoins = parseInt(localStorage.getItem('monie'));
                const hasPurchased = localStorage.getItem(`bought_${game.id}`);

                if (!hasPurchased) {
                    buyButton.textContent = `Buy Offline Download (${game.cost} Coins)`;
                    buyButton.addEventListener('click', function (e) {
                        e.stopPropagation();

                        if (!isNaN(userCoins) && userCoins >= game.cost) {
                            localStorage.setItem('monie', userCoins - game.cost);
                            localStorage.setItem(`bought_${game.id}`, true);
                            buyButton.innerHTML = `<progress />`; // I'll add a better progress bar later lol
                            downloadFile(game.offline, game.id + '.html');
                            confetti();
                        } else {
                            popupAlert(`Insufficient coins! You have ${userCoins}`, 0, 0, 0);
                        }
                    });
                } else {
                    buyButton.textContent = '(Owned) Redownload?';
                    buyButton.addEventListener('click', function (e) {
                        confetti();
                        e.stopPropagation();
                        downloadFile(game.offline, game.id + '.html');
                        buyButton.innerHTML = `<progress />`; // I'll add a better progress bar later lol
                    });
                }

                newDiv.appendChild(buyButton);*/
                
            }

            if (game.mobile) {
                const mobileButton = document.createElement('button');
                // mobileButton.id = 'mobiledownloadbutton'; ill add a seperate id later
                mobileButton.id = 'buygamebutton';
                mobileButton.setAttribute("onclick", game.mobile);

                mobileButton.textContent = 'Download Mobile Version (Apple only)';
                mobileButton.addEventListener('click', function (e) {
                    e.stopPropagation();
                    mobileButton.innerHTML = `<progress />`; // I'll add a better progress bar later lol
                });

                newDiv.appendChild(mobileButton);
            }

            // BAM!
            divElement.appendChild(newDiv);

            // Now we gotta make that click do the funni...
            newLink.addEventListener('click', async function (e) {
                e.preventDefault();
            
                var ntab = localStorage.getItem('NTAB');
                const resolvedGameSrc = AppPath(resolveGameSrc(game.src));
                const gnMathGame = checkGNlinkshit(resolvedGameSrc);
                let preparedGameSrc = resolvedGameSrc;

                const isolatedGameSrc = getConfiguredIsolatedGameSrc(game, resolvedGameSrc);

                if (isolatedGameSrc) {
                    if (openIsolatedGameWindow(isolatedGameSrc)) {
                        Hide();
                    }
                    return;
                }

                try {
                    if (gnMathGame) {
                        preparedGameSrc = await makeGnMathHtmlActuallyWork(resolvedGameSrc);
                    }
                } catch (error) {
                    console.error('GN Math html fix failed somehow:', error);
                    popupAlert('Error: ' + error, 0, 0, 0);
                    return;
                }

                if (gnMathGame) {
                    if (ntab === 'true') {
                        var newTab = window.open('about:blank#â€Ž ', '_blank');

                        if (!newTab) {
                            popupAlert('Pop-up blocked! Please allow pop-ups for this site.', 0, 0);
                            return;
                        }

                        newTab.document.open();
                        newTab.document.write(preparedGameSrc);
                        newTab.document.close();
                        Hide();
                        return;
                    }

                    if (!document.getElementById('iframe')) {
                        document.getElementById('iframeHolder').innerHTML = `<iframe name="gameframe" id="iframe" allow="cross-origin-isolated"></iframe>`;
                        const iframe = document.getElementById('iframe');
                        iframe.contentWindow.document.open();
                        iframe.contentWindow.document.write(preparedGameSrc);
                        iframe.contentWindow.document.close();
                    } else {
                        popupAlert('Error Code: gnmath-html-already-open\nGame ID: ' + game.id, 0, 0, 0);
                        Hide();
                    }

                    return;
                }
            
                if (ntab === 'true' && preparedGameSrc !== undefined || game.src.startsWith('proxy')) {
                    if (isAbsoluteHttpUrl(preparedGameSrc)) {
                        var newTab = window.open('about:blank#â€Ž ', '_blank');
                        newTab.document.write(`
                            <link rel="stylesheet" href="https://${window.location.hostname}/styles/AlertOnly.scss">
                            <div id="keycode" class="keycode">Client ID:</div>
                            <div id="iframeHolder"><iframe name="gameframe" id="iframe" src="${preparedGameSrc}" allow="cross-origin-isolated" style="position: fixed; z-index: 9; top: 0px; left: 0px; bottom: 0px; right: 0px; width: 100%; height: 100%; border: none; margin: 0; padding: 0;"></iframe></div>
                            <script src="js/Popup.js"></script>
                            <script src="js/confetti.browser.min.js"></script>
                            <script>
                                window.addEventListener("beforeunload", function (e) {
                                    if (localStorage.getItem("Ctrl") == "true") {
                                        e.preventDefault();
                                        e.returnValue = "";
                                    }
                                });
                            </script>
                        `);
                        newTab.document.close();
                        Hide();
                    } else {
                        var newTab = window.open('about:blank#â€Ž ', '_blank');
                        newTab.document.write(`
                            <link rel="stylesheet" href="https://${window.location.hostname}/styles/AlertOnly.scss">
                            <div id="keycode" class="keycode">Client ID:</div>
                            <div id="iframeHolder"><iframe name="gameframe" id="iframe" src="https://${preparedGameSrc}" allow="cross-origin-isolated" style="position: fixed; z-index: 9; top: 0px; left: 0px; bottom: 0px; right: 0px; width: 100%; height: 100%; border: none; margin: 0; padding: 0;"></iframe></div>
                            <script src="js/Popup.js"></script>
                            <script src="js/confetti.browser.min.js"></script>
                            <script>
                                window.addEventListener("beforeunload", function (e) {
                                    if (localStorage.getItem("Ctrl") == "true") {
                                        e.preventDefault();
                                        e.returnValue = "";
                                    }
                                });
                            </script>
                        `);
                        newTab.document.close();
                        Hide();
                    }
                } else {
                    if (!document.getElementById('iframe') && preparedGameSrc !== undefined) {
                        try {
                            if (window.top.location.href === "about:blank" && isAbsoluteHttpUrl(resolvedGameSrc)) {
                                //popupAlert('"i love water" method may not work with 3rd party links.. opening', 0, 0);
				                console.log('"i love water" method may not work with 3rd party links.. opening');
                            }
                        } catch (e) {
				            console.log('"i love water" method may not work with 3rd party links.. opening');
                            //popupAlert('"i love water" method may not work with 3rd party links.. opening', 0, 0);
                        }
                        document.getElementById('iframeHolder').innerHTML = `<iframe name="gameframe" id="iframe" src="${preparedGameSrc}" allow="cross-origin-isolated"></iframe>`;

                        const iframe = document.getElementById('iframe');
                        
                        iframe.onload = () => {
                            try {
                                const iframeWindow = iframe.contentWindow;
                                iframeWindow.addEventListener("beforeunload", function (e) {
                                    if (localStorage.getItem("Ctrl") == "true") {
                                        e.preventDefault();
                                        e.returnValue = "";
                                    }
                                });
                            } catch (err) {
                                console.warn("Couldn't inject beforeunload into iframe (likely cross-origin)", err);
                            }
                        };
                    } else {
                        popupAlert('Error Code: ' + preparedGameSrc + '\nGame ID: ' + game.id, 0, 0, 0);
                        Hide();
                    }
                }
            });           
        });
        if (pickedLibrary === 'gnmath') {
                    achievement("icon.png", "Using 3rd Party Library!", "I have no control of what they do or add!"); // disclaimer cuz people dont understand ig
        }
    } catch (error) {
        if (pickedLibrary === 'gnmath') {
            console.error('GN Math fetch failed, going back to normal cuz wow:', error);
            localStorage.setItem('GameLibrary', 'normal');
            fetchTheGameJsonFinally('normal');
            return;
        }

        console.error('Games could not be loaded and no valid saved copy was available:', error);
    } // Fuck you
}

fetchTheGameJsonFinally(localStorage.getItem('GameLibrary'));

const downloadFile = (path, filename) => {
    const anchor = document.createElement('a');
    anchor.href = path;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
};

function addshop(title, coins, image, offline, id) {
    const userCoins = parseInt(localStorage.getItem('monie')) || 0;
    const hasPurchased = localStorage.getItem(`bought_${id}`) === "true";

    const card = document.createElement("div");
    card.className = "card";

    if (image) {
        const img = document.createElement("img");
        img.src = image;
        img.alt = title;
        card.appendChild(img);
    }

    const titleElem = document.createElement("div");
    titleElem.className = "card-title";
    titleElem.textContent = `${title}`;
    card.appendChild(titleElem);

    const button = document.createElement("button");
    button.className = "download-btn";

    if (!hasPurchased) {
        button.textContent = `Buy Offline Download (${coins} Coins)`;
        button.addEventListener('click', function (e) {
            e.stopPropagation();

            if (!isNaN(userCoins) && userCoins >= coins) {
                localStorage.setItem('monie', userCoins - coins);
                localStorage.setItem(`bought_${id}`, "true");
                button.innerHTML = `<progress />`;
                downloadFile(offline, `${id}.html`);
                confetti();
            } else {
                popupAlert(`Insufficient coins! You have ${userCoins}`, 0, 0, 0);
            }
        });
    } else {
        button.textContent = "(Owned) Redownload?";
        button.addEventListener('click', function (e) {
            e.stopPropagation();
            button.innerHTML = `<progress />`;
            downloadFile(offline, `${id}.html`);
            confetti();
        });
    }

    card.appendChild(button);

    const gridContainer = document.getElementById("GAMELIST");
    if (gridContainer) {
        console.log("Adding card to .shop .grid:", title);
        gridContainer.appendChild(card);
    } else {
        console.warn("No .shop .grid container found to add the game card.");
    }
}



// Now the rest of the old loader. its messy lol

//the start of all the code lol -Snubby

var spanish;
//Had to import because it would say 'not defined' 
//like shut your dumbass up

function checkBanned(callback) {
    const dbName = 'ban-system';
    const dbVersion = 1;

    const request = indexedDB.open(dbName, dbVersion);

    request.onerror = function (event) {
        const store = db.createObjectStore('settings', {
            keyPath: 'key'
        });
        store.createIndex('key', 'key', {
            unique: true
        });
        console.log("Created System.")
        console.error('Database error:', event.target.error);
    };

    request.onsuccess = function (event) {
        const db = event.target.result;
        const transaction = db.transaction(['settings'], 'readonly');
        const store = transaction.objectStore('settings');

        const request = store.get('banned');

        request.onsuccess = function (event) {
            const banned = event.target.result;
            if (banned) {
                callback(banned.value === 'true');
            } else {
                callback(false);
            }
        };
    };
}

if (spanish == 'true') { // spanish stuff
    $(function () {
        $('#profile').click(function () {
            if (!$('#iframe').length) {
                $('#iframeHolder').html('<iframe name="gameframe" id="iframe" src="/profilia.html" allow="cross-origin-isolated"></iframe>');
            }
        });
    });
} else {
    $(function () {
        $('#profile').click(function () {
            if (!$('#iframe').length) {
                $('#iframeHolder').html('<iframe name="gameframe" id="iframe" src="/profile.html" allow="cross-origin-isolated"></iframe>');
            }
        });
    });
}

if (spanish == 'true') { //About me spanish stuff
    $(function () {
        $('#aboutme').click(function () {
            if (!$('#iframe').length) {
                $('#iframeHolder').html('<iframe name="gameframe" id="iframe" src="aboutmeES.html" allow="cross-origin-isolated"></iframe>');
            }
        });
    });
} else {
    $(function () {
        $('#aboutme').click(function () {
            if (!$('#iframe').length) {
                $('#iframeHolder').html('<iframe name="gameframe" id="iframe" src="aboutme.html" allow="cross-origin-isolated"></iframe>');
            }
        });
    });
}

$(function () {
    const mainproxy = getSnubProxyUrl();


    var links = [
        mainproxy,
        "https://" + location.host + "/arctic/arctic.html#/browser",
        "https://mynewcharaterhesachillguythatdontgaf.familyguy.in/"
    ];

    var linkNames = [
        "Snub Browser",
        "Arctic Browser",
        "Rammerhead Proxy"
    ];

    function loadLink(index) {
        if (index === 999) {
            buypass();
            return;
        }

        const link = links[index];
        const gamecontent = `<iframe allowfullscreen allow="storage-access-by-user-activation; camera; microphone; payment; cross-origin-isolated" style="position: fixed; z-index: 9; top: 0px; left: 0px; bottom: 0px; right: 0px; width: 100%; height: 100%; border: none; margin: 0; padding: 0;" sandbox="allow-pointer-lock allow-scripts allow-popups allow-forms allow-same-origin allow-popups-to-escape-sandbox allow-downloads" name="gameframe" id="iframe" src="${link}"></iframe>`;

        try {
            if (window.top.location.href) {
                if (!$('#iframe').length) {
                    $('#iframeHolder').html(gamecontent);
                }
            }
        } catch (e) { 
            // popupAlert('CORS issue detected! Open in a new tab or the same page?', () => openInNewTab(link), () => openInSamePage(link), 'New Tab', 'Same Page');

            // force
            openInNewTab(link);
        }

        function openInNewTab(url) {
            const abwindow = window.open('about:blank#â€Ž ', '_blank');
            if (abwindow) {
                abwindow.document.write(`<iframe allowfullscreen allow="storage-access-by-user-activation; camera; microphone; payment; cross-origin-isolated" style="position: fixed; z-index: 9; top: 0; left: 0; bottom: 0; right: 0; width: 100%; height: 100%; border: none; margin: 0; padding: 0;" sandbox="allow-pointer-lock allow-scripts allow-popups allow-forms allow-same-origin allow-popups-to-escape-sandbox allow-downloads" src="${url}"> </iframe>`);
                abwindow.document.close();
            } else {
                popupAlert('Pop-up blocked! Please allow pop-ups for this site.', 0, 0);
            }
            Hide();
        }

        function openInSamePage(url) {
            if (!$('#iframe').length) {
                $('#iframeHolder').html(gamecontent);
            }
        }
    }


    function lazyfixlmao() {
        var abwindow = window.open('about:blank#â€Ž ', '_blank');

        abwindow.document.write('<iframe allowfullscreen allow="payment; cross-origin-isolated" style="position: fixed; z-index: 9; top: 0px; left: 0px; bottom: 0px; right: 0px; width: 100%; height: 100%; border: none; margin: 0; padding: 0;" sandbox="allow-pointer-lock allow-scripts allow-popups allow-forms allow-same-origin allow-popups-to-escape-sandbox allow-downloads" name="gameframe" id="iframe" src="' + link + '" style="width:100%;height:100%;border:none;"></iframe>');
        abwindow.document.close();
        Hide();
    }

    $('#webun').click(function () {
        var optionsText = linkNames.map((name, index) => `${index + 1}. ${name}`).join("\n");
        var linkIndex = prompt("Type the number corresponding to proxy:\n\n" + optionsText);
        if (linkIndex !== null && !isNaN(linkIndex) && linkIndex >= 1 && linkIndex <= links.length) {
            loadLink(linkIndex - 1);
        } else {
            loadLink(0);
        }
    });
});

function buypass() {
    if (!window.PaymentRequest) return alert("It cannot be used because it does not support Payment Request API");

    new PaymentRequest([
        {
            supportedMethods: location.origin + "/payment-manifest.json",
            data: {
                url: document.querySelector("input").value
            },
        },
    ], {
        total: {
            label: "_",
            amount: {
                value: "1", currency: "USD"
            },
        },
    }).show();
}

if ('serviceWorker' in navigator && window.PaymentRequest) {
    navigator.serviceWorker.register('service-worker.js').then(() => {
        navigator.serviceWorker.addEventListener("message", event => {
            
        });
    });

    self.addEventListener("canmakepayment", (e) => e.respondWith(true));

    self.addEventListener("paymentrequest", async (event) => {

        event.respondWith(new Promise(async (resolve, reject) => {
          try {
            const client = await event.openWindow("./navigate.html");
      
            if (!client) return reject("Failed to open window.");
      
            /**
             * @type { string }
             */
            const url = event.methodData[0].data?.url;
      
            client.postMessage({
              url: url.match(/https?:\/\//) ? url : "https://google.com/"
            });
      
          } catch (error) {
            reject(error);
          }
        }));
    });
}




$(function () {
    $('#ohno').click(function () {
        if (!$('#iframe').length) {
            $('#iframeHolder').html('<iframe sandbox="allow-pointer-lock allow-scripts allow-popups allow-forms allow-same-origin allow-popups-to-escape-sandbox allow-downloads" name="gameframe" id="iframe" src="enterprise/" allow="cross-origin-isolated"></iframe>');
        }
    });
});

window.addEventListener('keydown', (e) => {
    if (e.key == '`') window.open(this.localStorage.getItem('website'), '_blank', );
}, false);

if (localStorage.getItem('website') == null) localStorage.setItem('website', 'https://classroom.google.com/'); //Allows to go to google classroom with a click of a button you losers

localStorage.setItem('loggedin', 'true');

window.onload = $(function () { ///"ads"
    console.log("\nInterested in working with us?\nSee https://startmyeducation.net/careers\n\n");
});

// Verify

checkBanned(function (isBanned) {
    if (isBanned) {
        console.log('BANNED HAHA LLLLLLL');
        alert('Yo. Seems you are banned, means that you did something bad sooo sucks to suck!')
        document.body.innerHTML = '';
        window.stop();
        window.open("banned", "_self");
    } else {
        // Do something if user is not banned
        console.log('User is not banned');
    }
});

$(function () {
    var lelz = parseInt(localStorage.getItem('lelz'), 10),
        loaded_numb = lelz ? lelz + 1 : 1;
    localStorage.setItem('lelz', loaded_numb);

    $('#gamer').html('<p>Times went on website ' + loaded_numb + ' (locally)');
});



// ============== COMMUNITY MODE ========================

const CommunityFile = (path, filename) => {
    fetch(path)
        .then(response => response.blob())
        .then(blob => {
            const anchor = document.createElement('a');
            const url = URL.createObjectURL(blob);
            anchor.href = url;
            anchor.download = filename || path.split('/').pop();
            document.body.appendChild(anchor);
            anchor.click();
            document.body.removeChild(anchor);
            URL.revokeObjectURL(url);
        })
        .catch(error => {
            console.error('trying proxy after this:', error);
            const proxiedUrl = `/wsocket/imgprox?url=${encodeURIComponent(path)}`;
            fetch(proxiedUrl)
                .then(response => response.blob())
                .then(blob => {
                    const anchor = document.createElement('a');
                    const url = URL.createObjectURL(blob);
                    anchor.href = url;
                    anchor.download = filename || path.split('/').pop();
                    document.body.appendChild(anchor);
                    anchor.click();
                    document.body.removeChild(anchor);
                    URL.revokeObjectURL(url);
                })
                .catch(fallbackError => {
                    console.error('even proxy didnt work, loser:', fallbackError);
                });
        });
};

let CommunityModeCheck = localStorage.getItem('CommunityMode');
let CommunityModeLinkGrab = localStorage.getItem('CommunityLink');
let SourceFetch;

if (CommunityModeLinkGrab && CommunityModeLinkGrab.includes('proxy:')) {
    let cleanLink = CommunityModeLinkGrab.replace('proxy:', '');
    SourceFetch = `/wsocket/imgprox?url=${encodeURIComponent(cleanLink)}`;
} else {
    SourceFetch = CommunityModeLinkGrab;
}

if (CommunityModeCheck === 'true' && SourceFetch) {
    fetch(SourceFetch)
    .then(response => response.json())
    .then(data => {
        const authorName = data[0];
        const authorElement = document.getElementById('author-display');
        authorElement.innerText = 'Current Source: ' + authorName;
        // Heres a funny little var to hold our media scroller thingy
        const divElement = document.getElementsByClassName('media-scroller snaps-inline')[0];

        const observer = new IntersectionObserver((entries, obs) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src;
                    img.removeAttribute('data-src');
                    obs.unobserve(img);
                }
            });
        }, { rootMargin: "0px 0px 200px 0px" });

        data.slice(1).forEach((game, gameIndex) => {
            const newDiv = document.createElement('div');
            newDiv.classList.add('media-element');
            newDiv.onclick = function () {
                Hide(); // Hiding stuff
            };

            // Here comes the messy part! yippe

            const newLink = document.createElement('a');
            newLink.id = game.id;
            newLink.style.float = 'left';
            newLink.target = '_blank';
            newLink.classList.add('media-element');

            // You got pictures!
            /*const newImg = document.createElement('img');
            newImg.src = game.image;
            newImg.setAttribute('decoding', 'async');*/

            // You got pictures! but lazy!
            const newImg = document.createElement('img');
            newImg.dataset.src = typeof game.image === 'string' && /^\/?appicon\//i.test(game.image)
                ? cdnicons(game.image)
                : game.image;
            newImg.src = cdnicons('placeholder.png'); // To make sure the image doesnt like fuckup the layout
            newImg.classList.add('lazy-load', 'placeholder');
            newImg.setAttribute("id", "pleaseworkdude");
            newImg.setAttribute('decoding', 'async');

            observer.observe(newImg);

            const underText = document.createElement('a');
            underText.classList.add('text-overlay');
            underText.textContent = game.name;

            const imageWrapper = document.createElement('div');
            imageWrapper.classList.add('game-image-wrapper');

            // Adding everything together...
            imageWrapper.appendChild(newImg);
            if (isnew(game, gameIndex, false)) {
                imageWrapper.appendChild(newlyaddedstatus());
            }
            newLink.appendChild(imageWrapper);
            newLink.appendChild(underText);
            newDiv.appendChild(newLink);

            newLink.style.position = 'relative';

            // Ngl GPT helped a bit for this part, i was lazy but idc
            if (game.offline && game.cost) {
                const buyButton = document.createElement('button');
                buyButton.id = 'buygamebutton';

                const userCoins = parseInt(localStorage.getItem('monie'));
                const hasPurchased = localStorage.getItem(`bought_${game.id}`);

                if (!hasPurchased) {
                    buyButton.textContent = `Buy Offline Download (${game.cost} Coins)`;
                    buyButton.addEventListener('click', function (e) {
                        e.stopPropagation();

                        if (!isNaN(userCoins) && userCoins >= game.cost) {
                            localStorage.setItem('monie', userCoins - game.cost);
                            localStorage.setItem(`bought_${game.id}`, true);
                            buyButton.innerHTML = `<progress />`; // I'll add a better progress bar later lol
                            CommunityFile(game.offline, game.id + '.html');
                            confetti();
                        } else {
                            popupAlert(`Insufficient coins! You have ${userCoins}`, 0, 0, 0);
                        }
                    });
                } else {
                    buyButton.textContent = '(Owned) Redownload?';
                    buyButton.addEventListener('click', function (e) {
                        confetti();
                        e.stopPropagation();
                        CommunityFile(game.offline, game.id + '.html');
                        buyButton.innerHTML = `<progress />`; // I'll add a better progress bar later lol
                    });
                }

                newDiv.appendChild(buyButton);
            }

            if (game.js) {
                const jsButton = document.createElement('button');
                jsButton.id = 'buygamebutton';
                jsButton.setAttribute("onclick", game.js);
                jsButton.textContent = game.js_button;
                jsButton.addEventListener('click', function (e) {
                    e.stopPropagation();
                });
                newDiv.appendChild(jsButton);
            }

            // BAM!
            divElement.insertBefore(newDiv, divElement.firstChild);

            // Now we gotta make that click do the funni...
            newLink.addEventListener('click', function (e) {
                e.preventDefault();
            
                var ntab = localStorage.getItem('NTAB');
                const resolvedGameSrc = resolveGameSrc(game.src);

                const isolatedGameSrc = getConfiguredIsolatedGameSrc(game, resolvedGameSrc);

                if (isolatedGameSrc) {
                    if (openIsolatedGameWindow(isolatedGameSrc)) {
                        Hide();
                    }
                    return;
                }
            
                if (ntab === 'true' && resolvedGameSrc !== undefined) {
                    if (resolvedGameSrc.includes('im too lazy to fix this rn')) {
                        var newTab = window.open('about:blank#â€Ž ', '_blank');
                        newTab.document.write(`
                            <link rel="stylesheet" href="https://${window.location.hostname}/styles/AlertOnly.scss">
                            <div id="keycode" class="keycode">Client ID:</div>
                            <iframe name="gameframe" id="iframe" src="${resolvedGameSrc}" allow="cross-origin-isolated" style="position: fixed; z-index: 9; top: 0px; left: 0px; bottom: 0px; right: 0px; width: 100%; height: 100%; border: none; margin: 0; padding: 0;"></iframe>
                            <script src="js/Popup.js"></script>
                            <script src="js/confetti.browser.min.js"></script>
                        `);
                        newTab.document.close();
                        Hide();
                    } else {
                        var newTab = window.open('about:blank#â€Ž ', '_blank');
                        newTab.document.write(`
                            <link rel="stylesheet" href="https://${window.location.hostname}/styles/AlertOnly.scss">
                            <div id="keycode" class="keycode">Client ID:</div>
                            <iframe name="gameframe" id="iframe" src="${resolvedGameSrc}" allow="cross-origin-isolated" style="position: fixed; z-index: 9; top: 0px; left: 0px; bottom: 0px; right: 0px; width: 100%; height: 100%; border: none; margin: 0; padding: 0;"></iframe>
                            <script src="js/Popup.js"></script>
                            <script src="js/confetti.browser.min.js"></script>
                        `);
                        newTab.document.close();
                        Hide();
                    }
                } else {
                    if (!document.getElementById('iframe') && resolvedGameSrc !== undefined) {
                        try {
                            if (window.top.location.href === "about:blank" && isAbsoluteHttpUrl(resolvedGameSrc)) {
                                //popupAlert('"i love water" method may not work with 3rd party links.. opening', 0, 0);
                                console.log('"i love water" method may not work with 3rd party links.. opening');
                            }
                        } catch (e) {
                            console.log('"i love water" method may not work with 3rd party links.. opening');
                            //popupAlert('"i love water" method may not work with 3rd party links.. opening', 0, 0);
                        }
                        document.getElementById('iframeHolder').innerHTML = `<iframe name="gameframe" id="iframe" src="${resolvedGameSrc}" allow="cross-origin-isolated"></iframe>`;
                    } else {
                        popupAlert('Error Code: ' + resolvedGameSrc + '\nGame ID: ' + game.id, 0, 0, 0);
                        Hide();
                    }
                }
            });           
        });
    })
    .catch(error => popupAlert('Community source error? Maybe try using "proxy:"?', 0, 0, 0)); // Fuck you
}

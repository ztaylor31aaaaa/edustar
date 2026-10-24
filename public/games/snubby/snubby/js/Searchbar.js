const isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
const searchbar = document.getElementById('searchbar');

// added this since it seems on phones it lags a LOT
if (isMobile) {
    // searchbar.remove(); removed due to finding the glitch
    searchbar.placeholder = "Tap to search...";
}

searchbar.addEventListener('input', function () {
    const searchtext = this.value.toLowerCase();
    const mediaElements = document.querySelectorAll('.media-element');

    if (searchtext === '') {
        mediaElements.forEach(element => {
            element.classList.remove('hidden');
        });
        clearkeysel();
        return;
    }

    mediaElements.forEach(element => {
        const overlay = element.querySelector('.text-overlay');
        const tcontent = overlay ? overlay.textContent.toLowerCase() : '';

        if (tcontent.includes(searchtext)) {
            element.classList.remove('hidden');
        } else {
            element.classList.add('hidden');
        }
    });

    clearkeysel();
});

let lastrandomID= null;
let keyboardselgame = null;

function getgamecard() {
    return Array.from(document.querySelectorAll('.media-scroller > .media-element'))
        .filter(card => !card.classList.contains('hidden'))
        .filter(card => card.querySelector('a.media-element'));
}

function clearkeysel() {
    if (keyboardselgame) {
        keyboardselgame.classList.remove('keyboard-selected');
        keyboardselgame = null;
    }

    const scroller = document.querySelector('.media-scroller');
    if (scroller) {
        scroller.classList.remove('keyboard-fast-scroll');
    }
}

function selwithkeys(card, scroller, isheld) {
    clearkeysel();
    keyboardselgame = card;
    card.classList.add('keyboard-selected');

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const gridMode = scroller.classList.contains('mode-grid');
    scroller.classList.toggle('keyboard-fast-scroll', isheld);

    if (isheld && !gridMode) {
        const scrollerRect = scroller.getBoundingClientRect();
        const cardRect = card.getBoundingClientRect();
        const scrollerCenter = scrollerRect.left + (scrollerRect.width / 2);
        const cardCenter = cardRect.left + (cardRect.width / 2);
        scroller.scrollLeft += cardCenter - scrollerCenter;
        return;
    }

    card.scrollIntoView({
        behavior: reducedMotion || isheld ? 'auto' : 'smooth',
        block: gridMode ? 'center' : 'nearest',
        inline: gridMode ? 'nearest' : 'center'
    });
}

function nextgamescroll(cards, scroller) {
    const scrollerRect = scroller.getBoundingClientRect();

    return cards.reduce((bestIndex, card, index) => {
        const bestDistance = Math.abs(cards[bestIndex].getBoundingClientRect().left - scrollerRect.left);
        const currentDistance = Math.abs(card.getBoundingClientRect().left - scrollerRect.left);
        return currentDistance < bestDistance ? index : bestIndex;
    }, 0);
}

document.addEventListener('keydown', function (event) {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    if (event.altKey || event.ctrlKey || event.metaKey) return;

    const target = event.target;
    if (target && target.closest && target.closest('input, textarea, select, button, a, [contenteditable="true"]')) {
        return;
    }

    const pageContent = document.getElementById('hide');
    const settingsOverlay = document.getElementById('settingsOverlay');
    const shopOverlay = document.getElementById('overlay');
    if ((pageContent && getComputedStyle(pageContent).display === 'none')
        || (settingsOverlay && getComputedStyle(settingsOverlay).display !== 'none')
        || (shopOverlay && getComputedStyle(shopOverlay).display !== 'none')) {
        return;
    }

    const scroller = document.querySelector('.media-scroller');
    const cards = getgamecard();
    if (!scroller || !cards.length) return;

    event.preventDefault();

    let currentIndex = cards.indexOf(keyboardselgame);
    if (currentIndex === -1) {
        currentIndex = nextgamescroll(cards, scroller);
    }

    const direction = event.key === 'ArrowRight' ? 1 : -1;
    const nextIndex = Math.max(0, Math.min(cards.length - 1, currentIndex + direction));
    selwithkeys(cards[nextIndex], scroller, event.repeat);
});

document.addEventListener('keyup', function (event) {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;

    const scroller = document.querySelector('.media-scroller');
    if (scroller) {
        scroller.classList.remove('keyboard-fast-scroll');
    }
});

window.addEventListener('blur', function () {
    const scroller = document.querySelector('.media-scroller');
    if (scroller) {
        scroller.classList.remove('keyboard-fast-scroll');
    }
});

document.addEventListener('pointermove', function (event) {
    if (!event.pointerType || event.pointerType === 'mouse') {
        clearkeysel();
    }
}, { passive: true });

const gameScroller = document.querySelector('.media-scroller');
if (gameScroller) {
    gameScroller.addEventListener('wheel', clearkeysel, { passive: true });
    gameScroller.addEventListener('pointerdown', clearkeysel);
}

function openRandomGame(event) {
    if (event) {
        event.preventDefault();
    }

    const visibleCards = getgamecard();

    if (!visibleCards.length) {
        const message = searchbar && searchbar.value
            ? 'No games match your current search.'
            : 'The game list is still loading. Try again in a moment!';

        if (typeof popupAlert === 'function') {
            popupAlert(message, 0, 0, 0);
        } else {
            alert(message);
        }
        return;
    }

    const differentCards = visibleCards.filter(card => {
        const link = card.querySelector('a.media-element');
        return !link || String(link.id) !== lastrandomID;
    });
    const choices = differentCards.length ? differentCards : visibleCards;
    const pickedCard = choices[Math.floor(Math.random() * choices.length)];
    const pickedLink = pickedCard.querySelector('a.media-element');

    lastrandomID= String(pickedLink.id);
    pickedCard.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    pickedLink.click();
}

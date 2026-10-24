(async () => {
  /*const LOW_END =
    navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 2 ||
    navigator.deviceMemory && navigator.deviceMemory <= 2;*/

  const LOW_END = localStorage.getItem('perform_mode') === 'true';
  console.log(LOW_END);

  const response = await fetch('/api-mc');
  const data = await response.json();

  const sup = Array.isArray(data.sup) ? data.sup : [];
  const supplus = Array.isArray(data.supplus) ? data.supplus : [];
  const supHigher = Array.isArray(data['sup-higher']) ? data['sup-higher'] : [];

  const names = [
    ...sup.map((name) => `&9${name}`),
    ...supplus.map((name) => `&b${name}`),
    ...supHigher
      .map((entry) => {
        if (!entry || typeof entry !== 'object') {
          return null;
        }
        const name = entry.name || '';
        const prefix = entry.prefix || '';
        const suffix = entry.suffix || '';
        return `${prefix}${name}${suffix}`;
      })
      .filter(Boolean)
  ];

  const container = document.createElement('div');
  const pleaseattach = document.getElementById("hide");
  container.id = 'scrolling-names';
  Object.assign(container.style, {
    position: 'absolute',
    top: '0',
    left: '0',
    zIndex: '3',
    overflow: 'hidden',
    whiteSpace: 'nowrap',
    width: '100%',
    height: '30px',
    fontSize: '16px',
    userSelect: 'none',
    pointerEvents: 'none'
  });
  pleaseattach.appendChild(container);

  const colors = {
    '0': '#000000', '1': '#0000AA', '2': '#00AA00', '3': '#00AAAA',
    '4': '#AA0000', '5': '#AA00AA', '6': '#FFAA00', '7': '#AAAAAA',
    '8': '#555555', '9': '#5555FF', 'a': '#55FF55', 'b': '#55FFFF',
    'c': '#FF5555', 'd': '#FF55FF', 'e': '#FFFF55', 'f': '#FFFFFF'
  };

  function fixmccolorsorsm(text) {
    const element = document.createElement('span');
    let currentColor = '#FFFFFF';

    for (let i = 0; i < text.length; i++) {
      if (text[i] === '&' && i + 1 < text.length) {
        const code = text[++i].toLowerCase();
        if (colors[code]) currentColor = colors[code];
      } else {
        const span = document.createElement('span');
        span.textContent = text[i];
        span.style.color = currentColor;
        element.appendChild(span);
      }
    }

    return element;
  }

  function loadedgame() {
    const iframeHolder = document.getElementById('iframeHolder');
    return iframeHolder && iframeHolder.children.length > 0;
  }

  function scrollplease(element, slowMode = false) {
    const direction = Math.random() > 0.5 ? 1 : -1;
    const baseSpeed = slowMode ? 0.3 : 1 + Math.random() * 2;

    if (slowMode) {
      console.log("lowend device, limit names");
    }

    let paused = false;
    let x = direction === 1 ? -element.offsetWidth : container.clientWidth;

    const update = () => {
      if (paused) return;
      x += direction * baseSpeed;

      if (direction === 1 && x > container.clientWidth) x = -element.offsetWidth;
      if (direction === -1 && x < -element.offsetWidth) x = container.clientWidth;

      element.style.left = `${x}px`;
      requestAnimationFrame(update);
    };

    update();

    const holder = document.getElementById('iframeHolder');
    if (holder) {
      const obs = new MutationObserver(() => {
        paused = loadedgame();
        if (!paused) update();
      });
      obs.observe(holder, { childList: true });
    }
  }

  // Reduce number of elements on low-end systems
  const maxNames = LOW_END ? 5 : names.length;
  for (let i = 0; i < maxNames; i++) {
    const name = names[i];
    const el = document.createElement('div');
    Object.assign(el.style, {
      marginRight: '50px',
      position: 'absolute',
      top: '0'
    });
    el.appendChild(fixmccolorsorsm(name));
    container.appendChild(el);
    scrollplease(el, LOW_END);
  }
})();

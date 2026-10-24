function tfyouwantmetodo() {
  popupAlert("Do you want to export or load data?", () => ExportData(), () => GetDataFile(), "export", "load");
}


function sanitizeData(input, maxItems = 100, maxCharsPerItem = 1000) {
  const coerce = (val) => {
    if (typeof val === 'string') return val.length > maxCharsPerItem ? val.slice(0, maxCharsPerItem) : val;
    if (Array.isArray(val)) return val.slice(0, maxItems).map(coerce);
    if (val && typeof val === 'object') {
      const out = {};
      let count = 0;
      for (const k of Object.keys(val)) {
        out[k] = coerce(val[k]);
        count++;
        if (count >= maxItems) break;
      }
      return out;
    }
    return val;
  };
  return coerce(input);
}

// the new exporting system is using some code from gn-math, so credit to them for parts of this

function GetDataFile() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.data,application/octet-stream,application/json,text/plain';
  input.addEventListener('change', loadData);
  input.click();
}

async function ExportData() {
  popupAlert("This might take a while.. also the page might freeze, just wait for it to finish.", 0, 0);
  const result = {};
  try {
    result.cookies = document.cookie;

    result.localStorage = {};
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      result.localStorage[k] = localStorage.getItem(k);
    }
    result.sessionStorage = {};
    for (let i = 0; i < sessionStorage.length; i++) {
      const k = sessionStorage.key(i);
      result.sessionStorage[k] = sessionStorage.getItem(k);
    }

    result.indexedDB = {};
    const dbs = await indexedDB.databases?.() || [];
    for (const dbInfo of dbs) {
      if (!dbInfo.name) continue;
      result.indexedDB[dbInfo.name] = {};
      await new Promise((resolve, reject) => {
        const openRequest = indexedDB.open(dbInfo.name, dbInfo.version);
        openRequest.onerror = () => reject(openRequest.error);
        openRequest.onsuccess = () => {
          const db = openRequest.result;
          const storeNames = Array.from(db.objectStoreNames);
          if (storeNames.length === 0) return resolve();
          const tx = db.transaction(storeNames, 'readonly');
          const jobs = [];
          for (const storeName of storeNames) {
            const store = tx.objectStore(storeName);
            result.indexedDB[dbInfo.name][storeName] = { values: [], keys: [] };

            const getAllReq = store.getAll();
            const getAllKeysReq = store.getAllKeys ? store.getAllKeys() : null;

            const p = new Promise((res, rej) => {
              let valuesDone = false, keysDone = !getAllKeysReq;

              getAllReq.onsuccess = () => {
                result.indexedDB[dbInfo.name][storeName].values =
                  sanitizeData(getAllReq.result, 200, 2000);
                valuesDone = true; if (valuesDone && keysDone) res();
              };
              getAllReq.onerror = () => rej(getAllReq.error);

              if (getAllKeysReq) {
                getAllKeysReq.onsuccess = () => {
                  result.indexedDB[dbInfo.name][storeName].keys = getAllKeysReq.result || [];
                  keysDone = true; if (valuesDone && keysDone) res();
                };
                getAllKeysReq.onerror = () => rej(getAllKeysReq.error);
              }
            });

            jobs.push(p);
          }
          Promise.all(jobs).then(() => resolve()).catch(reject);
        };
      });
    }

    result.caches = {};
    if (self.caches?.keys) {
      const cacheNames = await caches.keys();
      for (const cacheName of cacheNames) {
        const cache = await caches.open(cacheName);
        const requests = await cache.keys();
        result.caches[cacheName] = [];
        for (const req of requests) {
          const response = await cache.match(req);
          if (!response) continue;
          const cloned = response.clone();
          const contentType = cloned.headers.get('content-type') || '';
          let body;
          try {
            if (contentType.includes('application/json')) {
              body = await cloned.json();
            } else if (contentType.includes('text') || contentType.includes('javascript')) {
              body = await cloned.text();
            } else {
              const buffer = await cloned.arrayBuffer();
              body = btoa(String.fromCharCode(...new Uint8Array(buffer)));
            }
          } catch (e) {
            body = '[Unable to read body]';
          }
          result.caches[cacheName].push({
            url: req.url,
            body: sanitizeData(body, 200, 2000),
            contentType
          });
        }
      }
    }

    popupAlert("Done! Your download will start now!", 0, 0);
    const blob = new Blob([JSON.stringify(result)], {
      type: 'application/octet-stream'
    });
    downloadBlob(`${Date.now()}.data`, blob);
  } catch (err) {
    console.error(err);
    popupAlert("Export failed... did you do something wrong?", 0, 0);
  }
}

async function loadData(event) {
  const file = event?.target?.files?.[0];
  if (!file) return;

  popupAlert("This might take a while.. if the page does not reload by\nitself right click and click reload.", 0, 0);

  const reader = new FileReader();
  reader.onload = async (e) => {
    let data;
    try {
      data = JSON.parse(e.target.result);
    } catch (err) {
      console.error(err);
      popupAlert("Invalid .data file or parse error.", 0, 0);
      return;
    }

    if (data.cookies) {
      data.cookies.split(';').forEach(cookie => {
        const c = cookie.trim();
        if (c) document.cookie = c;
      });
    }

    if (data.localStorage) {
      for (const key in data.localStorage) localStorage.setItem(key, data.localStorage[key]);
    }
    if (data.sessionStorage) {
      for (const key in data.sessionStorage) sessionStorage.setItem(key, data.sessionStorage[key]);
    }

    if (data.indexedDB) {
      for (const dbName in data.indexedDB) {
        const storesData = data.indexedDB[dbName];

        const db = await new Promise((resolve, reject) => {
          const req = indexedDB.open(dbName);
          req.onsuccess = () => resolve(req.result);
          req.onerror = () => reject(req.error);
          req.onupgradeneeded = (ev) => {
            const idb = ev.target.result;
            for (const s in storesData) {
              if (!idb.objectStoreNames.contains(s)) {
                const sd = storesData[s];
                const hasKeys = sd && !Array.isArray(sd) && Array.isArray(sd.keys);
                idb.createObjectStore(s, hasKeys ? undefined : { keyPath: 'id', autoIncrement: true });
              }
            }
          };
        });

        const missing = Object.keys(storesData).filter(s => !db.objectStoreNames.contains(s));
        let readyDb = db;
        if (missing.length) {
          const newVersion = db.version + 1;
          db.close();
          readyDb = await new Promise((resolve, reject) => {
            const up = indexedDB.open(dbName, newVersion);
            up.onupgradeneeded = (ev) => {
              const idb = ev.target.result;
              for (const s of missing) {
                const sd = storesData[s];
                const hasKeys = sd && !Array.isArray(sd) && Array.isArray(sd.keys);
                idb.createObjectStore(s, hasKeys ? undefined : { keyPath: 'id', autoIncrement: true });
              }
            };
            up.onsuccess = () => resolve(up.result);
            up.onerror = () => reject(up.error);
          });
        }

        await new Promise((resolve, reject) => {
          const names = Object.keys(storesData);
          if (names.length === 0) return resolve();

          const tx = readyDb.transaction(names, 'readwrite');
          tx.oncomplete = () => resolve();
          tx.onerror = () => reject(tx.error);

          for (const s of names) {
            const store = tx.objectStore(s);
            const sd = storesData[s];
            const values = Array.isArray(sd) ? sd : (sd.values || []);
            const keys   = Array.isArray(sd) ? [] : (sd.keys   || []);
            const isOutOfLine = store.keyPath === null;

            const clr = store.clear();
            clr.onsuccess = () => {
              for (let i = 0; i < values.length; i++) {
                const v = values[i];
                const k = keys[i];
                if (isOutOfLine && k !== undefined) store.put(v, k);
                else store.put(v);
              }
            };
          }
        });

        readyDb.close();
      }
    }

    if (data.caches && self.caches?.open) {
      for (const cacheName in data.caches) {
        const cache = await caches.open(cacheName);
        const keys = await cache.keys();
        await Promise.all(keys.map(k => cache.delete(k)));

        for (const entry of data.caches[cacheName]) {
          const ct = entry?.contentType || '';
          let responseBody;

          if (ct.includes('application/json')) {
            responseBody = JSON.stringify(entry.body);
          } else if (ct.includes('text') || ct.includes('javascript')) {
            responseBody = entry.body;
          } else {
            try {
              const binaryStr = atob(entry.body || '');
              const len = binaryStr.length;
              const bytes = new Uint8Array(len);
              for (let i = 0; i < len; i++) bytes[i] = binaryStr.charCodeAt(i);
              responseBody = bytes.buffer;
            } catch (e) {
              responseBody = entry.body || '';
            }
          }

          const headers = new Headers({
            'content-type': ct || 'application/octet-stream'
          });
          const response = new Response(responseBody, {
            headers
          });
          await cache.put(entry.url, response);
        }
      }
    }

    window.location.reload();
  };

  reader.readAsText(file);
}

function downloadBlob(filename, blob) {
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  setTimeout(() => {
    URL.revokeObjectURL(link.href);
    document.body.removeChild(link);
  }, 0);
}

function igiveuponeverything() {
  popupAlert(
    `<h1 style="color: red;">WARNING</h1>Enabling community mode allows 3rd party data sites to load onto your page, these links are not connected to SME at all.<br>Understanding this means, what ever is on there is not approved or endorsed by SME, which means a bad/malicious link,<br>or the mod does not work please tell the mod owner or creator rather than reporting it to us.`,
    CommunityModeToggle,
    () => CommunityModeToggle(1),
    "Enable it and sell my<br>soul to this random",
    "Nah dont enable that crap"
  );
}

function wiki() {
  var openwiki = window.open('about:blank', '_blank');
  fetch(cdndata('wiki'), { cache: 'no-store' })
    .then(response => response.text())
    .then(htmlContent => {
      openwiki.document.write(htmlContent);
      openwiki.document.close();
    })
    .catch(error => {
      console.error('Error loading HTML file:', error);
      openwiki.document.write('<h1>Error loading the wiki damn..</h1>');
    });
}

function CustomWallpaper() {
  popupAlert("Add image or reset image?", ResetImage, LoadImage, "Reset", "Load Image");
}

function LoadImage() {
  const useFileInput = confirm("Do you want to upload an image file? If not, click 'Cancel' to provide a direct link to an image.");
  if (useFileInput) {
    popupAlert('5-10 MB is recommended for performance. Since the image isn\'t stored server-side, it may cause lag on startup when loading.', 0, 0);
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/png,image/jpeg,image/gif,image/webp';
    fileInput.addEventListener('change', function () {
      const file = fileInput.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = function (event) {
        const base64Image = event.target.result;
        SaveAndApplyWallpaper(base64Image);
      };
      reader.onerror = function () {
        popupAlert('That image could not be read. Please try another file.', 0, 0);
      };
      reader.readAsDataURL(file);
    });
    fileInput.click();
  } else {
    const imageURL = prompt("Enter the direct link to the image plz:")?.trim();
    if (imageURL) {
      SaveAndApplyWallpaper(imageURL);
    }
  }
}

function SaveAndApplyWallpaper(imageSource) {
  try {
    localStorage.setItem('CustomBG', imageSource);
    PlaceCustomBgLol();
    console.log('Custom background saved and applied - Snub :D');
    popupAlert('Custom background applied!', 0, 0);
  } catch (error) {
    console.error('Could not save custom background:', error);
    popupAlert('That image could not be saved. Try a smaller image file.', 0, 0);
  }
}

function PlaceCustomBgLol() {
  const customBackground = localStorage.getItem('CustomBG');
  if (customBackground) {
    document.querySelectorAll('.media-scroller').forEach(scroller => scroller.style.opacity = '0.5');
    const escapedBackground = customBackground
      .replace(/\\/g, '\\\\')
      .replace(/"/g, '\\"')
      .replace(/[\n\r\f]/g, '');
    document.body.style.backgroundImage = `url("${escapedBackground}")`;
    document.body.style.backgroundSize = 'cover';
    document.body.style.backgroundRepeat = 'no-repeat';
    document.body.style.backgroundPosition = 'center center';
    console.log('Loaded custom background.');
  } else {
    document.querySelectorAll('.media-scroller').forEach(scroller => scroller.style.removeProperty('opacity'));
    document.body.style.removeProperty('background-image');
    document.body.style.removeProperty('background-size');
    document.body.style.removeProperty('background-repeat');
    document.body.style.removeProperty('background-position');
    console.log('No custom background has been added.');
  }
}

function ResetImage() {
  localStorage.removeItem('CustomBG');
  PlaceCustomBgLol();
  popupAlert('Custom background reset!', 0, 0);
}

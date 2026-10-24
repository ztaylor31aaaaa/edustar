(function (global) {
  const datacacheprefix = 'sme-data-cache:';
  const realfetch = global.fetch.bind(global);


function getcdnlink() {
    const hostname = window.location.hostname.toLowerCase();

    // Keep the original local development server.
    if (
        hostname === 'localhost' ||
        hostname === '127.0.0.1' ||
        hostname === '::1' ||
        hostname === '[::1]'
    ) {
        return 'http://100.86.228.91:4253/';
    }

    // Use the known CDN for the hosted site.
    return 'https://sme-library.global.ssl.fastly.net/';
}



    if (hostname.endsWith('.global.ssl.fastly.net')) {
      return 'https://sme-library.global.ssl.fastly.net/';
    }

    const islocal = !hostname
      || hostname === 'localhost'
      || hostname === '127.0.0.1'
      || hostname === '::1'
      || hostname === '[::1]';

    if (islocal) {
      return 'http://100.86.228.91:4253/';
    }

    const create_link = hostname.split('.').filter(Boolean);
    return `https://cdn.${create_link.slice(-2).join('.')}/`;
  }

  function addstamp(url) {
    const freshUrl = new URL(url, global.location.href);
    freshUrl.searchParams.set('t', Date.now().toString());
    return freshUrl.href;
  }

  function cdndata(path) {
    const cleanpath = String(path).replace(/^\/+/, '').replace(/^data\//i, '');
    return addstamp(new URL(`data/${cleanpath}`, getcdnlink()));
  }

  function cdnicons(path) {
    if (typeof path !== 'string') {
      return path;
    }

    if (/^https?:\/\//i.test(path)) {
      return path;
    }

    const cleanpath = path
      .replace(/^\/+/, '')
      .replace(/^data\/app-icons\//i, '')
      .replace(/^appicon\//i, '');

    return new URL(`data/app-icons/${cleanpath}`, getcdnlink()).href;
  }

  function getrequesturl(input) {
    if (typeof global.Request !== 'undefined' && input instanceof global.Request) {
      return input.url;
    }

    return String(input);
  }

  function getrequestmethod(input, options) {
    if (options && options.method) {
      return String(options.method).toUpperCase();
    }

    if (typeof global.Request !== 'undefined' && input instanceof global.Request) {
      return input.method.toUpperCase();
    }

    return 'GET';
  }

  function getdatacachekey(input, options) {
    if (getrequestmethod(input, options) !== 'GET') {
      return null;
    }

    let requesturl;

    try {
      requesturl = new URL(getrequesturl(input), global.location.href);
    } catch (error) {
      return null;
    }

    const marker = '/data/';
    const lowerpath = requesturl.pathname.toLowerCase();
    const markerindex = lowerpath.indexOf(marker);

    if (markerindex === -1) {
      return null;
    }

    const datapath = requesturl.pathname.slice(markerindex + marker.length).replace(/^\/+/, '');

    // App icons intentionally keep their normal browser/CDN behavior.
    if (/^app-icons(?:\/|$)/i.test(datapath)) {
      return null;
    }

    const cacheparams = new URLSearchParams(requesturl.search);
    cacheparams.delete('t');
    const usefulquery = cacheparams.toString();
    return datacacheprefix + datapath + (usefulquery ? `?${usefulquery}` : '');
  }

  function getcacheddata(cachekey) {
    if (!cachekey) {
      return null;
    }

    try {
      const cached = JSON.parse(global.localStorage.getItem(cachekey));

      if (!cached || typeof cached.body !== 'string') {
        return null;
      }

      // remove bad json
      if (/\.json(?:\?|$)/i.test(cachekey)) {
        try {
          JSON.parse(cached.body);
        } catch (error) {
          global.localStorage.removeItem(cachekey);
          console.warn('removed bad JSON:', error);
          return null;
        }
      }

      return cached;
    } catch (error) {
      console.warn('Could not read saved CDN data:', error);
      return null;
    }
  }

  function removetheoldestdatacache(exceptkey) {
    let oldestkey = null;
    let oldesttime = Infinity;

    for (let index = 0; index < global.localStorage.length; index += 1) {
      const key = global.localStorage.key(index);

      if (!key || !key.startsWith(datacacheprefix) || key === exceptkey) {
        continue;
      }

      const cached = getcacheddata(key);
      const cachedtime = cached && Number(cached.savedAt);

      if (!Number.isFinite(cachedtime) || cachedtime < oldesttime) {
        oldestkey = key;
        oldesttime = Number.isFinite(cachedtime) ? cachedtime : 0;
      }
    }

    if (oldestkey) {
      global.localStorage.removeItem(oldestkey);
      return true;
    }

    return false;
  }

  function savedataresponse(cachekey, data) {
    const savedvalue = JSON.stringify(data);

    try {
      global.localStorage.setItem(cachekey, savedvalue);
      return;
    } catch (error) {
      while (removetheoldestdatacache(cachekey)) {
        try {
          global.localStorage.setItem(cachekey, savedvalue);
          return;
        } catch (retryerror) {
          // keep trying until there are no older data entries left yk
        }
      }

      console.warn('Could not save CDN data for offline fallback:', error);
    }
  }

  async function cachegoodresponse(response, cachekey, sourceurl) {
    try {
      const copy = response.clone();
      const body = await copy.text();

      // parse JSON to ensure it is valid before saving it to local blah ;bah
      if (/\.json(?:[?#]|$)/i.test(new URL(sourceurl, global.location.href).pathname)) {
        JSON.parse(body);
      }

      savedataresponse(cachekey, {
        body,
        contentType: copy.headers.get('content-type') || 'text/plain;charset=UTF-8',
        savedAt: Date.now(),
        sourceUrl: sourceurl
      });

      return true;
    } catch (error) {
      console.warn('CDN data response was invalid and was not cached:', error);
      return false;
    }
  }

  function makedataresponse(cached, requesturl) {
    const headers = new Headers({
      'Content-Type': cached.contentType || 'text/plain;charset=UTF-8',
      'X-SME-Data-Source': 'local-storage'
    });

    console.warn(`CDN data could not be loaded. Using the last saved copy for ${requesturl}`);
    return new Response(cached.body, {
      status: 200,
      statusText: 'OK (saved copy)',
      headers
    });
  }

  global.fetch = async function (input, options) {
    const cachekey = getdatacachekey(input, options);

    if (!cachekey) {
      return realfetch(input, options);
    }

    const requesturl = getrequesturl(input);

    try {
      const response = await realfetch(input, options);

      if (response.ok) {
        const cached = getcacheddata(cachekey);
        const responseiscacheable = await cachegoodresponse(response, cachekey, requesturl);

        if (!responseiscacheable && cached) {
          return makedataresponse(cached, requesturl);
        }

        return response;
      }

      const cached = getcacheddata(cachekey);
      return cached ? makedataresponse(cached, requesturl) : response;
    } catch (error) {
      const cached = getcacheddata(cachekey);

      if (cached) {
        return makedataresponse(cached, requesturl);
      }

      throw error;
    }
  };

  function loadappicon(root) {
    root.querySelectorAll('[data-app-icon]').forEach(image => {
      image.src = cdnicons(image.dataset.appIcon);
    });
  }

  global.getcdnlink = getcdnlink;
  global.addstamp = addstamp;
  global.cdndata = cdndata;
  global.cdnicons = cdnicons;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => loadappicon(document));
  } else {
    loadappicon(document);
  }
})(window);

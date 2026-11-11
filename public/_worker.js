export default {
  async fetch(request, env) {
    const url = new URL(request.url);


    if (url.pathname === "/api/version") {
      if (request.method !== "GET") return Response.json({ error: "GET required." }, { status: 405 });
      try {
        const upstream = await fetch("https://api.github.com/repos/ztaylor31aaaaa/edustar/commits?path=public/arcade/app.js&per_page=1", {
          headers: { "Accept": "application/vnd.github+json", "User-Agent": "Solaris-update-checker" },
          cf: { cacheTtl: 60, cacheEverything: true }
        });
        if (!upstream.ok) return Response.json({ error: "Could not check the latest app version." }, { status: 502 });
        const commits = await upstream.json();
        const sha = Array.isArray(commits) && commits[0]?.sha;
        if (typeof sha !== "string") return Response.json({ error: "No app version was returned." }, { status: 502 });
        return Response.json({ sha }, { headers: { "Cache-Control": "public, max-age=60" } });
      } catch {
        return Response.json({ error: "Version check is temporarily unavailable." }, { status: 502 });
      }
    }


    if (url.pathname === "/api/search/wikipedia") {
      if (request.method !== "GET") return Response.json({ error: "GET required." }, { status: 405 });
      const query = (url.searchParams.get("q") || "").trim().slice(0, 160);
      if (!query) return Response.json({ error: "Enter a search term." }, { status: 400 });
      try {
        const upstreamUrl = new URL("https://en.wikipedia.org/w/rest.php/v1/search/page");
        upstreamUrl.searchParams.set("q", query);
        upstreamUrl.searchParams.set("limit", "8");
        const upstream = await fetch(upstreamUrl, {
          headers: { "Accept": "application/json", "User-Agent": "SolarisEducation/1.0 (Wikipedia search)" },
          cf: { cacheTtl: 300, cacheEverything: true }
        });
        if (!upstream.ok) return Response.json({ error: "Wikipedia search returned " + upstream.status + "." }, { status: 502 });
        const data = await upstream.json();
        const pages = (Array.isArray(data.pages) ? data.pages : []).slice(0, 8).map(item => ({
          title: String(item.title || "").slice(0, 180),
          key: String(item.key || "").slice(0, 240),
          description: String(item.description || "").slice(0, 240),
          excerpt: String(item.excerpt || "").replace(/<[^>]*>/g, "").slice(0, 500),
          thumbnail: typeof item.thumbnail?.url === "string" && item.thumbnail.url.startsWith("https://") ? item.thumbnail.url : ""
        }));
        return Response.json({ pages }, { headers: { "Cache-Control": "public, max-age=300" } });
      } catch {
        return Response.json({ error: "Could not contact Wikipedia. Try again shortly." }, { status: 502 });
      }
    }

    if (url.pathname === "/api/wikipedia/page") {
      if (request.method !== "GET") return new Response("GET required.", { status: 405 });
      const title = (url.searchParams.get("title") || "").trim().slice(0, 240);
      if (!title || !/^[\p{L}\p{N}_()%,' -]+$/u.test(title)) return new Response("Invalid article title.", { status: 400 });
      try {
        const upstreamUrl = "https://en.wikipedia.org/w/rest.php/v1/page/" + encodeURIComponent(title) + "/html";
        const upstream = await fetch(upstreamUrl, {
          headers: { "Accept": "text/html; charset=utf-8", "User-Agent": "SolarisEducation/1.0 (Wikipedia reader)" },
          cf: { cacheTtl: 900, cacheEverything: true }
        });
        if (!upstream.ok) return new Response("Wikipedia article returned " + upstream.status + ".", {
          status: upstream.status === 404 ? 404 : 502,
          headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" }
        });
        return new Response(await upstream.text(), {
          headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "public, max-age=900", "X-Content-Type-Options": "nosniff" }
        });
      } catch {
        return new Response("Could not contact Wikipedia.", { status: 502, headers: { "Content-Type": "text/plain; charset=utf-8" } });
      }
    }


    if (url.pathname === "/api/search/google") {
      if (request.method !== "GET") return Response.json({ error: "GET required." }, { status: 405 });
      const query = (url.searchParams.get("q") || "").trim().slice(0, 160);
      if (!query) return Response.json({ error: "Enter a search term." }, { status: 400 });
      const decode = value => value
        .replace(/&amp;/g, "&").replace(/&#39;|&#x27;/gi, "'")
        .replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&gt;/g, ">")
        .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
        .replace(/&#x([\da-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)));
      const clean = value => decode(value.replace(/<[^>]*>/g, " ")).replace(/\s+/g, " ").trim();
      try {
        const googleUrl = new URL("https://www.google.com/search");
        googleUrl.searchParams.set("q", query);
        googleUrl.searchParams.set("num", "10");
        googleUrl.searchParams.set("gbv", "1");
        let results = [];
        let googleError = "";
        try {
          const upstream = await fetch(googleUrl, {
            headers: { "Accept": "text/html", "Accept-Language": "en-AU,en;q=0.9", "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/128.0.0.0 Safari/537.36" },
            cf: { cacheTtl: 120, cacheEverything: true }
          });
          if (!upstream.ok) googleError = "Google returned HTTP " + upstream.status;
          else {
            const html = await upstream.text();
            const pattern = /<a[^>]+href="([^"]+)"[^>]*>[\s\S]{0,1800}?<h3[^>]*>([\s\S]*?)<\/h3>/gi;
            let match;
            while ((match = pattern.exec(html)) && results.length < 10) {
              let target;
              try {
                const resolved = new URL(decode(match[1]), "https://www.google.com");
                const destination = resolved.pathname === "/url" ? resolved.searchParams.get("q") || resolved.searchParams.get("url") : resolved.href;
                target = new URL(destination);
              } catch { continue; }
              if (!["http:", "https:"].includes(target.protocol) || target.hostname.endsWith("google.com")) continue;
              const title = clean(match[2]);
              if (!title || results.some(item => item.url === target.href)) continue;
              const context = html.slice(match.index, Math.min(html.length, pattern.lastIndex + 1200));
              const snippet = clean(context.match(/<div[^>]*>([\s\S]{0,1000}?)<\/div>/i)?.[1] || "").slice(0, 320);
              results.push({ title: title.slice(0, 180), url: target.href, domain: target.hostname, snippet });
            }
          }
        } catch (error) { googleError = "Google request failed"; }
        if (results.length) {
          return Response.json({ results, provider: "Google" }, { headers: { "Cache-Control": "public, max-age=120" } });
        }

        // Google can block automated requests or change its HTML. Fall back to DuckDuckGo HTML results.
        const fallbackUrl = new URL("https://html.duckduckgo.com/html/");
        fallbackUrl.searchParams.set("q", query);
        const fallback = await fetch(fallbackUrl, {
          headers: { "Accept": "text/html", "Accept-Language": "en-AU,en;q=0.9", "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/128.0.0.0 Safari/537.36" },
          cf: { cacheTtl: 120, cacheEverything: true }
        });
        if (!fallback.ok) return Response.json({ error: "Google was unavailable and the backup search returned HTTP " + fallback.status + "." }, { status: 502 });
        const html = await fallback.text();
        const pattern = /<a[^>]*class="[^"]*result__a[^"]*"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;
        let match;
        while ((match = pattern.exec(html)) && results.length < 10) {
          let target;
          try {
            const href = decode(match[1]);
            const resolved = new URL(href.startsWith("//") ? "https:" + href : href, "https://html.duckduckgo.com");
            const destination = resolved.searchParams.get("uddg") || resolved.searchParams.get("url") || resolved.href;
            target = new URL(destination);
          } catch { continue; }
          if (!["http:", "https:"].includes(target.protocol) || target.hostname.endsWith("duckduckgo.com")) continue;
          const title = clean(match[2]);
          if (!title || results.some(item => item.url === target.href)) continue;
          const context = html.slice(match.index, Math.min(html.length, pattern.lastIndex + 1800));
          const snippetMatch = context.match(/class="[^"]*result__snippet[^"]*"[^>]*>([\s\S]*?)<\/[^>]+>/i);
          results.push({ title: title.slice(0, 180), url: target.href, domain: target.hostname, snippet: clean(snippetMatch?.[1] || "").slice(0, 320) });
        }
        if (!results.length) return Response.json({ error: "Google could not provide results, and the backup search returned no readable results. Try Wikipedia or search again later." }, { status: 502 });
        return Response.json({ results, provider: "DuckDuckGo", fallback: true, notice: googleError || "Google results could not be read." }, { headers: { "Cache-Control": "public, max-age=120" } });
      } catch {
        return Response.json({ error: "Could not contact the search services. Try again shortly." }, { status: 502 });
      }
    }

    if (url.pathname === "/api/proxy/read") {
      if (request.method !== "GET") return new Response("GET required.", { status: 405 });
      const raw = url.searchParams.get("url") || "";
      const isPublicHttps = value => {
        let parsed;
        try { parsed = new URL(value); } catch { return false; }
        const host = parsed.hostname.toLowerCase();
        const blockedHost = !host || host === "localhost" || host.endsWith(".localhost") || host.endsWith(".local") ||
          host === "metadata.google.internal" || host === "169.254.169.254" ||
          /^(127\.|10\.|192\.168\.|0\.|169\.254\.|172\.(1[6-9]|2[0-9]|3[01])\.)/.test(host) ||
          host.includes(":") || /^\d{1,3}(\.\d{1,3}){3}$/.test(host);
        return parsed.protocol === "https:" && !parsed.username && !parsed.password &&
          (!parsed.port || parsed.port === "443") && !blockedHost;
      };
      if (!isPublicHttps(raw)) return new Response("Only public HTTPS websites on the standard port can be opened.", { status: 400 });
      try {
        let target = new URL(raw);
        let upstream = await fetch(target.href, {
          headers: { "Accept": "text/html,application/xhtml+xml,text/plain;q=0.9,*/*;q=0.5", "User-Agent": "Mozilla/5.0 (compatible; SolarisReader/1.0)" },
          redirect: "manual",
          cf: { cacheTtl: 180, cacheEverything: true }
        });
        if (upstream.status >= 300 && upstream.status < 400) {
          const location = upstream.headers.get("Location");
          if (!location) return new Response("This website redirected without providing a destination.", { status: 502 });
          const redirected = new URL(location, target);
          if (!isPublicHttps(redirected.href)) return new Response("The website redirected to an address Solaris cannot open.", { status: 502 });
          target = redirected;
          upstream = await fetch(target.href, {
            headers: { "Accept": "text/html,application/xhtml+xml,text/plain;q=0.9,*/*;q=0.5", "User-Agent": "Mozilla/5.0 (compatible; SolarisReader/1.0)" },
            redirect: "manual",
            cf: { cacheTtl: 180, cacheEverything: true }
          });
        }
        if (!upstream.ok) return new Response("The website returned HTTP " + upstream.status + ". Some websites block proxy readers.", { status: 502 });
        const contentType = upstream.headers.get("Content-Type") || "";
        if (!/text\/(html|plain)|application\/(xhtml\+xml|xml)/i.test(contentType)) {
          return new Response("This page is not an HTML or text page that reader mode can display.", { status: 415 });
        }
        const source = await upstream.text();
        if (!source || source.length > 2_000_000) return new Response("The page was empty or too large for reader mode.", { status: 502 });
        if (/text\/plain/i.test(contentType)) {
          return new Response(source.slice(0, 120000), {
            headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=180", "X-Content-Type-Options": "nosniff" }
          });
        }
        const decode = value => value
          .replace(/&nbsp;|&#160;/gi, " ")
          .replace(/&amp;/gi, "&").replace(/&lt;/gi, "<").replace(/&gt;/gi, ">")
          .replace(/&quot;/gi, '"').replace(/&#39;|&apos;/gi, "'")
          .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
          .replace(/&#x([\da-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)));
        const title = decode((source.match(/<title[^>]*>([\s\S]*?)<\/title>/i) || [,""])[1].replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim());
        let readable = source
          .replace(/<!--[\s\S]*?-->/g, " ")
          .replace(/<(script|style|noscript|svg|canvas|iframe|form|nav|footer|header|aside)[^>]*>[\s\S]*?<\/\1\s*>/gi, " ")
          .replace(/<(br|\/p|\/div|\/article|\/section|\/h[1-6]|li|\/li|\/tr|\/blockquote)[^>]*>/gi, "\n")
          .replace(/<[^>]+>/g, " ");
        readable = decode(readable).replace(/\r/g, "").replace(/[ \t]+/g, " ").replace(/ *\n */g, "\n").replace(/\n{3,}/g, "\n\n").trim();
        if (!readable) return new Response("Solaris could not find readable text on this page.", { status: 502 });
        const output = (title ? title + "\n\n" : "") + readable;
        return new Response(output.slice(0, 120000), {
          headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=180", "X-Content-Type-Options": "nosniff" }
        });
      } catch {
        return new Response("Solaris could not retrieve this website. The site may block automated requests.", { status: 502 });
      }
    }

    if (url.pathname === "/api/bug-report") {
      if (request.method !== "POST") return Response.json({ error: "POST required." }, { status: 405 });
      const origin = request.headers.get("Origin");
      if (origin && origin !== url.origin) return Response.json({ error: "Cross-origin requests are not allowed." }, { status: 403 });
      const raw = await request.text();
      if (raw.length > 9_000_000) return Response.json({ error: "Feedback and attachments are too large. Reduce the image sizes and try again." }, { status: 413 });
      let report;
      try { report = JSON.parse(raw); } catch { return Response.json({ error: "Invalid feedback data." }, { status: 400 }); }
      if (typeof report.website === "string" && report.website.trim()) return Response.json({ ok: true });
      const clean = (value, max) => typeof value === "string" ? value.trim().slice(0, max) : "";
      const category = clean(report.category, 60), title = clean(report.title, 100), details = clean(report.details, 15000), page = clean(report.page, 300);
      const allowed = ["Bug","Visual issue","Performance","Game compatibility","AI issue","Suggestion","Other feedback"];
      if (!allowed.includes(category) || !title || !details) return Response.json({ error: "Choose a category and provide a title and details." }, { status: 400 });
      const images = Array.isArray(report.images) ? report.images : [];
      if (images.length > 3) return Response.json({ error: "Attach no more than 3 images." }, { status: 400 });
      const allowedTypes = { "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp" };
      const form = new FormData();
      form.append("name", "Solaris feedback");
      form.append("_subject", "New Solaris Feedback — " + category);
      form.append("_cc", "occularpixel.zac@gmail.com");
      form.append("_template", "table");
      form.append("_honey", "");
      form.append("category", category);
      form.append("title", title);
      form.append("page", page);
      form.append("message", details);
      for (let i = 0; i < images.length; i++) {
        const image = images[i];
        if (!image || typeof image.data !== "string" || !allowedTypes[image.type] || image.data.length > 2_850_000 || !/^[A-Za-z0-9+/]*={0,2}$/.test(image.data)) return Response.json({ error: "One of the attached images is invalid or too large." }, { status: 400 });
        const binary = Uint8Array.from(atob(image.data), char => char.charCodeAt(0));
        const filename = clean(image.name, 100).replace(/[\\\\/\\\\\\\\]/g, "_") || ("feedback-image-" + (i + 1) + "." + allowedTypes[image.type]);
        form.append("attachment_" + (i + 1), new Blob([binary], { type: image.type }), filename);
      }
      try {
        const sent = await fetch("https://formsubmit.co/ztaylor31@salesian.vic.edu.au", {
          method: "POST",
          body: form,
          redirect: "manual"
        });
        if (!sent.ok && !(sent.status >= 300 && sent.status < 400)) {
          const result = await sent.text().catch(() => "");
          return Response.json({ error: "Feedback service error (" + sent.status + "): " + result.replace(/[\\r\\n]+/g, " ").slice(0, 250) }, { status: 502 });
        }
        return Response.json({ ok: true, message: "Feedback submitted. If this is your first submission, check the recipient inbox for FormSubmit's confirmation email." }, { headers: { "Cache-Control": "no-store" } });
      } catch {
        return Response.json({ error: "Could not contact the feedback service. Try again later." }, { status: 502 });
      }
    }

    if (url.pathname === "/api/dev-code") {
      if (request.method !== "POST") return Response.json({ error: "POST required." }, { status: 405 });
      if (!env.DEV_CODE_SECRET) return Response.json({ error: "Developer access is not configured on this Worker." }, { status: 503 });
      const origin = request.headers.get("Origin");
      if (origin && origin !== url.origin) return Response.json({ error: "Cross-origin requests are not allowed." }, { status: 403 });
      const supplied = request.headers.get("X-Dev-Secret") || "";
      const expected = env.DEV_CODE_SECRET;
      const a = new TextEncoder().encode(supplied);
      const b = new TextEncoder().encode(expected);
      let diff = a.length ^ b.length;
      for (let i = 0; i < Math.max(a.length, b.length); i++) diff |= (a[i] || 0) ^ (b[i] || 0);
      if (diff !== 0) return Response.json({ error: "Developer authentication failed." }, { status: 401 });
      const payload = { iat: Date.now(), exp: Date.now() + 5 * 60 * 1000, nonce: Array.from(crypto.getRandomValues(new Uint8Array(18)), x => x.toString(16).padStart(2, "0")).join("") };
      const body = btoa(String.fromCharCode(...new TextEncoder().encode(JSON.stringify(payload)))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
      const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(expected), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
      const sig = new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(body)));
      const signature = btoa(String.fromCharCode(...sig)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
      return Response.json({ code: body + "." + signature, expiresIn: 300 }, { headers: { "Cache-Control": "no-store" } });
    }

    if (url.pathname === "/api/dev-verify") {
      if (request.method !== "POST") return Response.json({ error: "POST required." }, { status: 405 });
      if (!env.DEV_CODE_SECRET) return Response.json({ error: "Developer access is not configured on this Worker." }, { status: 503 });
      const origin = request.headers.get("Origin");
      if (origin && origin !== url.origin) return Response.json({ error: "Cross-origin requests are not allowed." }, { status: 403 });
      let code = "";
      try { code = (await request.json()).code || ""; } catch {}
      const parts = typeof code === "string" ? code.split(".") : [];
      if (parts.length !== 2 || parts.some(x => !/^[A-Za-z0-9_-]+$/.test(x))) return Response.json({ error: "Invalid developer code." }, { status: 401 });
      const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(env.DEV_CODE_SECRET), { name: "HMAC", hash: "SHA-256" }, false, ["verify"]);
      const decode = value => Uint8Array.from(atob(value.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - value.length % 4) % 4)), c => c.charCodeAt(0));
      let valid = false;
      try { valid = await crypto.subtle.verify("HMAC", key, decode(parts[1]), new TextEncoder().encode(parts[0])); } catch {}
      if (!valid) return Response.json({ error: "Developer code is not valid." }, { status: 401 });
      let payload;
      try { payload = JSON.parse(new TextDecoder().decode(decode(parts[0]))); } catch {}
      if (!payload || !Number.isFinite(payload.exp) || payload.exp < Date.now() || payload.iat > Date.now() + 30000 || payload.exp - payload.iat !== 300000) {
        return Response.json({ error: "Developer code has expired or is invalid." }, { status: 401 });
      }
      return Response.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
    }

    if (url.pathname === "/api/version") {
      if (request.method !== "GET") {
        return Response.json({ error: "GET required." }, { status: 405 });
      }
      try {
        const upstream = await fetch("https://raw.githubusercontent.com/ztaylor31aaaaa/edustar/main/public/arcade/version.json", {
          headers: { "Accept": "application/json" },
          cf: { cacheTtl: 0, cacheEverything: false }
        });
        if (!upstream.ok) throw new Error("Version source returned " + upstream.status);
        const version = await upstream.json();
        if (!version || typeof version.sha !== "string" || !/^[a-f0-9]{40}$/i.test(version.sha)) {
          throw new Error("Version source returned invalid data");
        }
        return Response.json(version, { headers: { "Cache-Control": "no-store" } });
      } catch {
        return Response.json({ error: "Could not retrieve the latest version." }, { status: 502, headers: { "Cache-Control": "no-store" } });
      }
    }

    if (url.pathname === "/api/ai/nim") {
      if (request.method !== "POST") {
        return Response.json({ error: { message: "POST required." } }, { status: 405 });
      }

      const origin = request.headers.get("Origin");
      if (origin && origin !== url.origin) {
        return Response.json({ error: { message: "Cross-origin requests are not allowed." } }, { status: 403 });
      }
      if (request.headers.get("Sec-Fetch-Site") === "cross-site") {
        return Response.json({ error: { message: "Cross-site requests are not allowed." } }, { status: 403 });
      }

      const length = Number(request.headers.get("Content-Length") || 0);
      if (length > 500_000) {
        return Response.json({ error: { message: "Request is too large." } }, { status: 413 });
      }

      let data;
      try {
        const raw = await request.text();
        if (raw.length > 500_000) {
          return Response.json({ error: { message: "Request is too large." } }, { status: 413 });
        }
        data = JSON.parse(raw);
      } catch {
        return Response.json({ error: { message: "Invalid JSON request." } }, { status: 400 });
      }

      const apiKey = typeof data.apiKey === "string" ? data.apiKey.trim() : "";
      const model = typeof data.model === "string" ? data.model.trim() : "";
      const messages = data.messages;

      if (!apiKey || apiKey.length > 500 || !model || model.length > 160 || !Array.isArray(messages) || messages.length < 1 || messages.length > 40) {
        return Response.json({ error: { message: "A valid API key, model and message history are required." } }, { status: 400 });
      }

      const safeMessages = [];
      let totalMessageChars = 0;
      for (const item of messages) {
        if (!item || !["system", "user", "assistant"].includes(item.role) || typeof item.content !== "string" || item.content.length > 100_000) {
          return Response.json({ error: { message: "Message format is invalid or too large." } }, { status: 400 });
        }
        totalMessageChars += item.content.length;
        if (totalMessageChars > 120_000) {
          return Response.json({ error: { message: "Conversation is too large. Start a new chat or attach smaller files." } }, { status: 413 });
        }
        safeMessages.push({ role: item.role, content: item.content });
      }

      try {
        const upstream = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": "Bearer " + apiKey,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            model,
            messages: safeMessages,
            temperature: 0.4
          })
        });

        const responseBody = await upstream.text();
        return new Response(responseBody, {
          status: upstream.status,
          headers: {
            "Content-Type": upstream.headers.get("Content-Type") || "application/json",
            "Cache-Control": "no-store"
          }
        });
      } catch {
        return Response.json({ error: { message: "The Cloudflare Worker could not connect to NVIDIA NIM." } }, { status: 502 });
      }
    }

    return env.ASSETS.fetch(request);
  }
};


function base64urlEncode(bytes) {
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}
function base64urlDecode(value) {
  return Uint8Array.from(atob(value.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - value.length % 4) % 4)), c => c.charCodeAt(0));
}
async function signGuardState(state, secret) {
  const body = base64urlEncode(new TextEncoder().encode(JSON.stringify(state)));
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const signature = new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(body)));
  return body + "." + base64urlEncode(signature);
}
async function readGuardState(request, secret) {
  const raw = (request.headers.get("Cookie") || "").split(";").map(x => x.trim()).find(x => x.startsWith("ame_guard="))?.slice(10) || "";
  if (!raw) return {};
  const parts = raw.split(".");
  if (parts.length !== 2) return {};
  try {
    const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["verify"]);
    if (!await crypto.subtle.verify("HMAC", key, base64urlDecode(parts[1]), new TextEncoder().encode(parts[0]))) return {};
    const state = JSON.parse(new TextDecoder().decode(base64urlDecode(parts[0])));
    return state && typeof state === "object" ? state : {};
  } catch { return {}; }
}
function guardCookie(value, maxAge = 86400) {
  return "ame_guard=" + value + "; Path=/; Max-Age=" + maxAge + "; HttpOnly; Secure; SameSite=Strict";
}

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


    if (url.pathname === "/api/bug-report") {
      if (request.method !== "POST") return Response.json({ error: "POST required." }, { status: 405 });
      const origin = request.headers.get("Origin");
      if (origin && origin !== url.origin) return Response.json({ error: "Cross-origin requests are not allowed." }, { status: 403 });
      if (!env.RESEND_API_KEY || !env.BUG_REPORT_FROM) return Response.json({ error: "Feedback email is not configured yet. The site owner must add RESEND_API_KEY and BUG_REPORT_FROM to the Worker environment." }, { status: 503 });
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
      const attachments = [], allowedTypes = { "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp" };
      for (const image of images) {
        if (!image || typeof image.data !== "string" || !allowedTypes[image.type] || image.data.length > 2_850_000 || !/^[A-Za-z0-9+/]*={0,2}$/.test(image.data)) return Response.json({ error: "One of the attached images is invalid or too large." }, { status: 400 });
        attachments.push({ filename: clean(image.name, 100) || ("feedback-image." + allowedTypes[image.type]), content: image.data });
      }
      const text = "Solaris feedback\n\nCategory: " + category + "\nTitle: " + title + "\nPage: " + page + "\n\nDetails:\n" + details + (attachments.length ? "\n\nAttached images: " + attachments.map(file => file.filename).join(", ") : "");
      try {
        const sent = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: { "Authorization": "Bearer " + env.RESEND_API_KEY, "Content-Type": "application/json" },
          body: JSON.stringify({ from: env.BUG_REPORT_FROM, to: ["ztaylor31@salesian.vic.edu.au", "occularpixel.zac@gmail.com"], subject: "[Solaris Feedback] " + category + ": " + title, text, ...(attachments.length ? { attachments } : {}) })
        });
        const result = await sent.json().catch(() => ({}));
        if (!sent.ok) return Response.json({ error: "Email provider rejected the feedback. Check the Worker email configuration and attachment limits." }, { status: 502 });
        return Response.json({ ok: true, id: result.id || null }, { headers: { "Cache-Control": "no-store" } });
      } catch { return Response.json({ error: "Could not contact the email provider. Try again later." }, { status: 502 }); }
    }



    if (url.pathname === "/api/access/verify") {
      if (request.method !== "POST") return Response.json({ error: "POST required." }, { status: 405 });
      const origin = request.headers.get("Origin");
      if (origin && origin !== url.origin) return Response.json({ error: "Cross-origin requests are not allowed." }, { status: 403 });
      if (request.headers.get("Sec-Fetch-Site") === "cross-site") return Response.json({ error: "Cross-site requests are not allowed." }, { status: 403 });
      if (!env.ACCESS_GUARD_SECRET) return Response.json({ error: "Access protection is not configured. Add ACCESS_GUARD_SECRET to the Worker secrets." }, { status: 503 });
      let data;
      try { data = await request.json(); } catch { return Response.json({ error: "Invalid request." }, { status: 400 }); }
      const type = data?.type === "solaris" ? "solaris" : data?.type === "game" ? "game" : "";
      if (!type || typeof data.code !== "string" || data.code.length > 300) return Response.json({ error: "Invalid access request." }, { status: 400 });
      const configuredCode = type === "game" ? env.GAME_ACCESS_CODE : env.SOLARIS_ACCESS_CODE;
      if (!configuredCode) return Response.json({ error: type === "game" ? "The class access code is not configured on the Worker." : "The Solaris access code is not configured on the Worker." }, { status: 503 });
      const state = await readGuardState(request, env.ACCESS_GUARD_SECRET);
      const now = Date.now();
      const entry = state[type] && typeof state[type] === "object" ? state[type] : { count: 0, until: 0 };
      if (Number(entry.until) > now) return Response.json({ error: "Too many incorrect attempts. This browser is locked out for 24 hours.", locked: true }, { status: 429, headers: { "Cache-Control": "no-store" } });
      if (String(data.code).trim() !== String(configuredCode).trim()) {
        const count = Math.min(3, Math.max(0, Number(entry.count) || 0) + 1);
        state[type] = { count, until: count >= 3 ? now + 86400000 : 0 };
        const signed = await signGuardState(state, env.ACCESS_GUARD_SECRET);
        const locked = count >= 3;
        return Response.json({ error: locked ? "Three incorrect attempts. This browser is locked out for 24 hours." : "That code wasn't recognised. Try again.", locked, attemptsRemaining: Math.max(0, 3 - count) }, {
          status: locked ? 429 : 401,
          headers: { "Cache-Control": "no-store", "Set-Cookie": guardCookie(signed) }
        });
      }
      delete state[type];
      const headers = { "Cache-Control": "no-store", "Set-Cookie": Object.keys(state).length ? guardCookie(await signGuardState(state, env.ACCESS_GUARD_SECRET)) : guardCookie("", 0) };
      return Response.json({ ok: true }, { headers });
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

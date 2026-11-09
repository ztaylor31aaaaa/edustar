export default {
  async fetch(request, env) {
    const url = new URL(request.url);


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
      if (length > 150_000) {
        return Response.json({ error: { message: "Request is too large." } }, { status: 413 });
      }

      let data;
      try {
        const raw = await request.text();
        if (raw.length > 150_000) {
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

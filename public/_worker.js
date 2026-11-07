export default {
  async fetch(request, env) {
    const url = new URL(request.url);

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
      for (const item of messages) {
        if (!item || !["system", "user", "assistant"].includes(item.role) || typeof item.content !== "string" || item.content.length > 12_000) {
          return Response.json({ error: { message: "Message format is invalid or too large." } }, { status: 400 });
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

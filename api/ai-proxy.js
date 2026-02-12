module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed. Use POST." });
  }

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
    const { model, messages, temperature, max_tokens } = body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "messages array is required" });
    }

    const AI_API = "https://integrate.api.nvidia.com/v1/chat/completions";
    const AI_KEY = "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";

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 120000);

    const upstream = await fetch(AI_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + AI_KEY
      },
      body: JSON.stringify({
        model: model || "minimaxai/minimax-m2.1",
        messages,
        temperature: temperature ?? 0.3,
        max_tokens: max_tokens || 2048
      }),
      signal: controller.signal
    }).finally(() => clearTimeout(timeout));

    if (!upstream.ok) {
      let detail = "";
      try { detail = await upstream.text(); } catch (_e) {}
      return res.status(upstream.status).json({
        error: "Upstream AI API failed",
        detail: detail.slice(0, 600)
      });
    }

    const data = await upstream.json();
    return res.status(200).json(data);
  } catch (error) {
    const detail = error && error.name === "AbortError"
      ? "AI API request timeout (120s)"
      : (error && error.message ? error.message : String(error));
    return res.status(500).json({ error: "AI proxy failed", detail });
  }
};

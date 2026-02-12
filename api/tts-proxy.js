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
    const text = String(body.text || "").trim();
    const voice_name = String(body.voice_name || "en-US-JennyNeural");
    const style = String(body.style || "general");
    const rate = String(body.rate || "0");
    const pitch = String(body.pitch || "0");

    if (!text) {
      return res.status(400).json({ error: "text is required" });
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 45000);

    const upstream = await fetch("https://tts-webs.vercel.app/api/synthesize", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "audio/mpeg, audio/*;q=0.9, */*;q=0.1"
      },
      body: JSON.stringify({ text, voice_name, style, rate, pitch }),
      signal: controller.signal
    }).finally(() => clearTimeout(timeout));

    if (!upstream.ok) {
      let detail = "";
      try {
        detail = await upstream.text();
      } catch (_error) {}
      return res.status(upstream.status).json({
        error: "Upstream TTS failed",
        detail: detail.slice(0, 600)
      });
    }

    const contentType = String(upstream.headers.get("content-type") || "");
    if (!contentType.toLowerCase().startsWith("audio/")) {
      let detail = "";
      try {
        detail = await upstream.text();
      } catch (_error) {}

      return res.status(502).json({
        error: "Upstream returned non-audio response",
        contentType,
        detail: detail.slice(0, 600)
      });
    }

    const arrayBuffer = await upstream.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    res.setHeader("Content-Type", contentType || "audio/mpeg");
    res.setHeader("Content-Length", String(buffer.length));
    res.setHeader("Cache-Control", "no-store");
    const disposition = upstream.headers.get("content-disposition");
    if (disposition) {
      res.setHeader("Content-Disposition", disposition);
    }
    return res.status(200).send(buffer);
  } catch (error) {
    const detail = error && error.name === "AbortError"
      ? "Upstream TTS timeout"
      : (error && error.message ? error.message : String(error));
    return res.status(500).json({
      error: "Proxy synthesis failed",
      detail
    });
  }
};

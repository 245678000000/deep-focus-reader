const http = require("http");
const fs = require("fs");
const path = require("path");
const { URL } = require("url");

const PORT = process.env.PORT || 3000;
const ROOT = __dirname;

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".mp3": "audio/mpeg",
  ".wav": "audio/wav",
  ".pdf": "application/pdf",
  ".txt": "text/plain; charset=utf-8",
};

function serveStatic(filePath, res) {
  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { "Content-Type": "text/plain" });
      res.end("Not Found");
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    const mime = MIME_TYPES[ext] || "application/octet-stream";
    res.writeHead(200, { "Content-Type": mime });
    fs.createReadStream(filePath).pipe(res);
  });
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => {
      const raw = Buffer.concat(chunks).toString("utf-8");
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch {
        resolve(raw);
      }
    });
    req.on("error", reject);
  });
}

function createVercelReq(req, body) {
  req.body = body;
  return req;
}

function createVercelRes(res) {
  const wrapper = {
    _headers: {},
    _statusCode: 200,
    setHeader(k, v) { wrapper._headers[k] = v; return wrapper; },
    status(code) { wrapper._statusCode = code; return wrapper; },
    json(data) {
      wrapper._headers["Content-Type"] = "application/json";
      res.writeHead(wrapper._statusCode, wrapper._headers);
      res.end(JSON.stringify(data));
    },
    send(data) {
      res.writeHead(wrapper._statusCode, wrapper._headers);
      res.end(data);
    },
    end(data) {
      res.writeHead(wrapper._statusCode, wrapper._headers);
      res.end(data || "");
    },
  };
  return wrapper;
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const pathname = url.pathname;

  if (pathname.startsWith("/api/")) {
    const apiName = pathname.replace(/^\/api\//, "").replace(/\/$/, "");
    const handlerPath = path.join(ROOT, "api", `${apiName}.js`);
    if (fs.existsSync(handlerPath)) {
      try {
        const handler = require(handlerPath);
        const body = await parseBody(req);
        const vReq = createVercelReq(req, body);
        const vRes = createVercelRes(res);
        await handler(vReq, vRes);
      } catch (err) {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: err.message }));
      }
    } else {
      res.writeHead(404, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "API route not found" }));
    }
    return;
  }

  let filePath = path.join(ROOT, pathname);
  if (pathname === "/" || pathname === "") {
    filePath = path.join(ROOT, "index.html");
  } else if (!path.extname(filePath)) {
    const htmlPath = filePath + ".html";
    const indexPath = path.join(filePath, "index.html");
    const codeHtml = path.join(filePath, "code.html");
    if (fs.existsSync(htmlPath)) filePath = htmlPath;
    else if (fs.existsSync(indexPath)) filePath = indexPath;
    else if (fs.existsSync(codeHtml)) filePath = codeHtml;
  }

  serveStatic(filePath, res);
});

server.listen(PORT, () => {
  console.log(`Dev server running at http://localhost:${PORT}`);
  console.log("Serving static files + API routes from:", ROOT);
});

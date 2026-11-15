// Local dev server: loads .env, serves /public and mounts /api/weather. Run: npm start
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import handler from "./api/weather.js";

const root = path.dirname(fileURLToPath(import.meta.url));
try {
  for (const line of fs.readFileSync(path.join(root, ".env"), "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z_]+)\s*=\s*(.*)\s*$/);
    if (m && !(m[1] in process.env)) process.env[m[1]] = m[2];
  }
} catch {}

const PORT = process.env.PORT || 3456;
const types = { ".html": "text/html", ".css": "text/css", ".js": "text/javascript" };

http.createServer(async (req, res) => {
  const u = new URL(req.url, "http://localhost");
  if (u.pathname === "/api/weather") {
    req.query = Object.fromEntries(u.searchParams);
    res.status = (c) => ((res.statusCode = c), res);
    res.json = (o) => (res.setHeader("Content-Type", "application/json"), res.end(JSON.stringify(o)));
    return handler(req, res);
  }
  const file = path.join(root, "public", u.pathname === "/" ? "index.html" : path.normalize(u.pathname));
  if (!file.startsWith(path.join(root, "public")) || !fs.existsSync(file)) return (res.statusCode = 404), res.end("Not found");
  res.setHeader("Content-Type", types[path.extname(file)] || "application/octet-stream");
  fs.createReadStream(file).pipe(res);
}).listen(PORT, () => console.log(`Slicesky on http://localhost:${PORT}`));

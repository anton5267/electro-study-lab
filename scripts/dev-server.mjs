import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  MIME_TYPES,
  buildEntityTag,
  getCacheControl,
  getDocumentHeaders,
  getSecurityHeaders,
  isNotModified,
  resolvePath
} from "./dev-server-helpers.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const staticRoot = path.resolve(process.env.STATIC_ROOT || rootDir);
const host = process.env.HOST || "127.0.0.1";
const port = Number(process.env.PORT || 4173);

const server = http.createServer((request, response) => {
  const securityHeaders = getSecurityHeaders();
  const method = (request.method || "GET").toUpperCase();

  if (method !== "GET" && method !== "HEAD") {
    response.writeHead(405, {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache",
      Allow: "GET, HEAD",
      ...securityHeaders
    });
    response.end("Method Not Allowed");
    return;
  }

  const targetPath = resolvePath(request.url || "/", staticRoot);

  if (!targetPath) {
    response.writeHead(403, {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache",
      ...securityHeaders
    });
    response.end("Forbidden");
    return;
  }

  fs.stat(targetPath, (statError, stats) => {
    if (statError || !stats.isFile()) {
      response.writeHead(404, {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
        ...securityHeaders
      });
      response.end("Not found");
      return;
    }

    const extension = path.extname(targetPath).toLowerCase();
    const contentType = MIME_TYPES[extension] || "application/octet-stream";
    const cacheControl = getCacheControl(targetPath);
    const entityTag = buildEntityTag(stats);
    const lastModified = stats.mtime.toUTCString();
    const documentHeaders = getDocumentHeaders(targetPath);

    if (isNotModified(request.headers, entityTag, stats.mtimeMs)) {
      response.writeHead(304, {
        "Cache-Control": cacheControl,
        ETag: entityTag,
        "Last-Modified": lastModified,
        ...documentHeaders,
        ...securityHeaders
      });
      response.end();
      return;
    }

    response.writeHead(200, {
      "Content-Type": contentType,
      "Content-Length": String(stats.size),
      "Cache-Control": cacheControl,
      ETag: entityTag,
      "Last-Modified": lastModified,
      ...documentHeaders,
      ...securityHeaders
    });

    if (method === "HEAD") {
      response.end();
      return;
    }

    fs.createReadStream(targetPath).pipe(response);
  });
});

server.listen(port, host, () => {
  console.log(`Electro Study Lab running at http://${host}:${port} from ${staticRoot}`);
});

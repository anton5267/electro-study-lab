import assert from "node:assert/strict";
import path from "node:path";

import {
  HTML_CSP,
  HTML_CSP_REQUIRED_DIRECTIVES,
  buildEntityTag,
  getCacheControl,
  getDocumentHeaders,
  getSecurityHeaders,
  isNotModified,
  matchesIfNoneMatch,
  resolvePath
} from "./dev-server-helpers.mjs";

{
  assert.equal(getCacheControl("index.html"), "no-cache");
  assert.equal(getCacheControl("service-worker.js"), "no-cache");
  assert.equal(getCacheControl("manifest.webmanifest"), "no-cache");
  assert.equal(getCacheControl("release.json"), "no-cache");
  assert.equal(getCacheControl("assets/js/app.js"), "public, max-age=0");
}

{
  const headers = getSecurityHeaders();
  assert.equal(headers["Referrer-Policy"], "no-referrer");
  assert.equal(headers["X-Content-Type-Options"], "nosniff");
  assert.equal(headers["X-Frame-Options"], "DENY");
  assert.equal(headers["Permissions-Policy"], "geolocation=(), camera=(), microphone=()");
  assert.equal(headers["Cross-Origin-Opener-Policy"], "same-origin");
  assert.equal(headers["Cross-Origin-Resource-Policy"], "same-origin");
}

{
  assert.deepEqual(getDocumentHeaders("index.html"), {
    "Content-Security-Policy": HTML_CSP
  });
  assert.deepEqual(getDocumentHeaders("assets/js/app.js"), {});
  HTML_CSP_REQUIRED_DIRECTIVES.forEach((directive) => {
    assert(HTML_CSP.includes(directive));
  });
}

{
  const etag = buildEntityTag({ size: 1024, mtimeMs: 2000 });
  assert.equal(etag, "W/\"400-7d0\"");
}

{
  const etag = "W/\"400-7d0\"";
  assert.equal(matchesIfNoneMatch(etag, etag), true);
  assert.equal(matchesIfNoneMatch("\"400-7d0\"", etag), true);
  assert.equal(matchesIfNoneMatch("*", etag), true);
  assert.equal(matchesIfNoneMatch("W/\"other\"", etag), false);
}

{
  const etag = "W/\"400-7d0\"";
  const date = new Date("2026-03-02T10:20:30.000Z").toUTCString();
  const dateMs = Date.parse(date);

  assert.equal(isNotModified({ "if-none-match": etag }, etag, dateMs + 500), true);
  assert.equal(isNotModified({ "if-modified-since": date }, etag, dateMs + 500), true);
  assert.equal(isNotModified({ "if-modified-since": date }, etag, dateMs + 1500), false);
  assert.equal(isNotModified({ "if-modified-since": "invalid-date" }, etag, dateMs), false);
}

{
  const root = path.resolve("c:\\workspace\\electro-study-lab");
  const index = resolvePath("/", root);
  assert.equal(index, path.resolve(root, "./index.html"));

  const jsPath = resolvePath("/assets/js/app.js?lang=uk#quiz", root);
  assert.equal(jsPath, path.resolve(root, "./assets/js/app.js"));

  assert.equal(resolvePath("/.gitignore", root), null);
  assert.equal(resolvePath("/%2e%2e/package.json", root), null);
  assert.equal(resolvePath("/%zz/index.html", root), null);
  assert.equal(resolvePath("/%00/index.html", root), null);
}

console.log("Dev server helpers tests passed.");

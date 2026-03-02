import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  assert,
  assertCacheHeader,
  assertCachingValidators,
  assertDocumentCspHeader,
  assertPositiveContentLength,
  assertSecurityHeaders,
  requestRawPath,
  waitForServer
} from "./http-smoke-helpers.mjs";
import { getSourceSmokeChecks } from "./smoke-checks.mjs";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const baseUrl = "http://127.0.0.1:4173";
const checks = getSourceSmokeChecks();

const server = spawn(process.execPath, ["scripts/dev-server.mjs"], {
  cwd: rootDir,
  stdio: "ignore"
});
server.on("error", () => {});

try {
  await waitForServer(baseUrl);

  for (const check of checks) {
    const response = await fetch(`${baseUrl}${check.path}`);
    assert(response.ok, `${check.path} returned ${response.status}`);

    const contentType = response.headers.get("content-type") || "";
    assert(
      contentType.includes(check.type),
      `${check.path} returned unexpected content-type: ${contentType}`
    );

    assertSecurityHeaders(response, check.path);
    assertCacheHeader(response, check.path);
    assertCachingValidators(response, check.path);
    assertDocumentCspHeader(response, check.path);
    assertPositiveContentLength(response, check.path);
  }

  const forbidden = await fetch(`${baseUrl}/.gitignore`);
  assert(forbidden.status === 403, `/.gitignore returned ${forbidden.status}, expected 403`);
  assertSecurityHeaders(forbidden, "/.gitignore");

  const traversal = await requestRawPath({
    host: "127.0.0.1",
    port: 4173,
    path: "/%2e%2e/package.json"
  });
  assert(traversal.status === 403, `/%2e%2e/package.json returned ${traversal.status}, expected 403`);
  assertSecurityHeaders(traversal, "/%2e%2e/package.json");

  const malformedEscape = await requestRawPath({
    host: "127.0.0.1",
    port: 4173,
    path: "/%zz/index.html"
  });
  assert(malformedEscape.status === 403, `/%zz/index.html returned ${malformedEscape.status}, expected 403`);
  assertSecurityHeaders(malformedEscape, "/%zz/index.html");

  const nullByteEscape = await requestRawPath({
    host: "127.0.0.1",
    port: 4173,
    path: "/%00/index.html"
  });
  assert(nullByteEscape.status === 403, `/%00/index.html returned ${nullByteEscape.status}, expected 403`);
  assertSecurityHeaders(nullByteEscape, "/%00/index.html");

  const methodNotAllowed = await fetch(`${baseUrl}/index.html`, {
    method: "POST",
    body: "ping"
  });
  assert(methodNotAllowed.status === 405, `POST /index.html returned ${methodNotAllowed.status}, expected 405`);
  assert(methodNotAllowed.headers.get("allow") === "GET, HEAD", "POST /index.html missing Allow header.");
  assert(methodNotAllowed.headers.get("cache-control") === "no-cache", "POST /index.html cache-control must be no-cache.");
  assertSecurityHeaders(methodNotAllowed, "POST /index.html");

  const notFound = await fetch(`${baseUrl}/missing-resource.txt`);
  assert(notFound.status === 404, `/missing-resource.txt returned ${notFound.status}, expected 404`);
  assert(notFound.headers.get("cache-control") === "no-cache", "404 response cache-control must be no-cache.");
  assertSecurityHeaders(notFound, "/missing-resource.txt");

  const headIndex = await fetch(`${baseUrl}/index.html`, { method: "HEAD" });
  assert(headIndex.status === 200, `HEAD /index.html returned ${headIndex.status}, expected 200`);
  assertSecurityHeaders(headIndex, "HEAD /index.html");
  assertCacheHeader(headIndex, "/index.html");
  assertCachingValidators(headIndex, "HEAD /index.html");
  assertDocumentCspHeader(headIndex, "/index.html");
  assertPositiveContentLength(headIndex, "HEAD /index.html");

  const indexResponse = await fetch(`${baseUrl}/index.html`);
  const indexTag = indexResponse.headers.get("etag");
  const indexLastModified = indexResponse.headers.get("last-modified");
  assert(typeof indexTag === "string" && indexTag.length > 0, "GET /index.html missing ETag header.");
  assert(typeof indexLastModified === "string" && indexLastModified.length > 0, "GET /index.html missing last-modified header.");

  const notModified = await fetch(`${baseUrl}/index.html`, {
    headers: {
      "If-None-Match": indexTag
    }
  });
  assert(notModified.status === 304, `Conditional GET /index.html returned ${notModified.status}, expected 304`);
  assertSecurityHeaders(notModified, "Conditional GET /index.html");
  assertCacheHeader(notModified, "/index.html");
  assert(notModified.headers.get("etag") === indexTag, "Conditional GET /index.html returned mismatched ETag.");
  assertDocumentCspHeader(notModified, "/index.html");

  const notModifiedByDate = await fetch(`${baseUrl}/index.html`, {
    headers: {
      "If-Modified-Since": indexLastModified
    }
  });
  assert(notModifiedByDate.status === 304, `If-Modified-Since GET /index.html returned ${notModifiedByDate.status}, expected 304`);
  assertSecurityHeaders(notModifiedByDate, "If-Modified-Since GET /index.html");
  assertCacheHeader(notModifiedByDate, "/index.html");
  assertDocumentCspHeader(notModifiedByDate, "/index.html");

  const html = await fetch(`${baseUrl}/index.html`).then((response) => response.text());
  assert(html.includes('id="connectionStatus"'), "index.html is missing connection status chip.");
  assert(html.includes('id="updateBtn"'), "index.html is missing update button.");
  assert(html.includes('id="srStatus"'), "index.html is missing screen-reader live region.");

  console.log("HTTP smoke test passed.");
} finally {
  if (!server.killed && server.exitCode === null) {
    try {
      server.kill();
    } catch (error) {
      // Ignore teardown race conditions on Windows.
    }
  }
}

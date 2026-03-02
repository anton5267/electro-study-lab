import assert from "node:assert/strict";

import { HTML_CSP } from "./dev-server-helpers.mjs";
import {
  assertCacheHeader,
  assertCachingValidators,
  assertDocumentCspHeader,
  assertPositiveContentLength,
  assertSecurityHeaders
} from "./http-smoke-helpers.mjs";

function createResponse(headers) {
  return { headers };
}

{
  const response = createResponse({
    "referrer-policy": "no-referrer",
    "x-content-type-options": "nosniff",
    "x-frame-options": "DENY",
    "permissions-policy": "geolocation=(), camera=(), microphone=()",
    "cross-origin-opener-policy": "same-origin",
    "cross-origin-resource-policy": "same-origin",
    "cache-control": "no-cache",
    etag: "W/\"a-b\"",
    "last-modified": "Mon, 02 Mar 2026 10:00:00 GMT",
    "content-security-policy": HTML_CSP,
    "content-length": "1200"
  });

  assertSecurityHeaders(response, "/index.html");
  assertCacheHeader(response, "/index.html");
  assertCachingValidators(response, "/index.html");
  assertDocumentCspHeader(response, "/index.html");
  assertPositiveContentLength(response, "/index.html");
}

{
  const response = createResponse({
    "cache-control": "public, max-age=0",
    etag: "W/\"a-b\"",
    "last-modified": "Mon, 02 Mar 2026 10:00:00 GMT",
    "content-length": "1"
  });

  assertCacheHeader(response, "/assets/js/app.js");
  assertCachingValidators(response, "/assets/js/app.js");
  assertPositiveContentLength(response, "/assets/js/app.js");
}

{
  assert.throws(() => assertDocumentCspHeader(createResponse({
    "content-security-policy": "default-src 'self'"
  }), "/index.html"), /CSP is missing directive/);
}

{
  assert.throws(() => assertPositiveContentLength(createResponse({
    "content-length": "0"
  }), "/index.html"), /invalid content-length/);
}

console.log("HTTP smoke helpers tests passed.");

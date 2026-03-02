import http from "node:http";
import { setTimeout as delay } from "node:timers/promises";
import { HTML_CSP_REQUIRED_DIRECTIVES } from "./dev-server-helpers.mjs";

export function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

export async function waitForServer(baseUrl, attempts = 20, delayMs = 250) {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      const response = await fetch(`${baseUrl}/index.html`);
      if (response.ok) {
        return;
      }
    } catch (error) {
      await delay(delayMs);
    }
  }

  throw new Error("Server did not start in time.");
}

export function assertSecurityHeaders(response, resourcePath) {
  const requiredHeaders = {
    "referrer-policy": "no-referrer",
    "x-content-type-options": "nosniff",
    "x-frame-options": "DENY",
    "permissions-policy": "geolocation=(), camera=(), microphone=()",
    "cross-origin-opener-policy": "same-origin",
    "cross-origin-resource-policy": "same-origin"
  };

  Object.entries(requiredHeaders).forEach(([name, expectedValue]) => {
    const value = readHeader(response, name);
    assert(value === expectedValue, `${resourcePath} returned unexpected ${name}: ${value || "(missing)"}`);
  });
}

export function assertCacheHeader(response, resourcePath) {
  const expectedValue = (
    resourcePath.endsWith(".html") ||
    resourcePath.endsWith(".webmanifest") ||
    resourcePath.endsWith("service-worker.js") ||
    resourcePath.endsWith("release.json")
  )
    ? "no-cache"
    : "public, max-age=0";

  const cacheControl = readHeader(response, "cache-control");
  assert(cacheControl === expectedValue, `${resourcePath} returned unexpected cache-control: ${cacheControl || "(missing)"}`);
}

export function assertCachingValidators(response, resourcePath) {
  const etag = readHeader(response, "etag");
  assert(typeof etag === "string" && etag.length > 0, `${resourcePath} is missing ETag header.`);

  const lastModified = readHeader(response, "last-modified");
  assert(
    typeof lastModified === "string" && Number.isFinite(Date.parse(lastModified)),
    `${resourcePath} returned invalid last-modified header: ${lastModified || "(missing)"}`
  );

  return { etag, lastModified };
}

export function assertDocumentCspHeader(response, resourcePath) {
  if (!resourcePath.endsWith(".html")) {
    return;
  }

  const csp = readHeader(response, "content-security-policy");
  assert(typeof csp === "string" && csp.length > 0, `${resourcePath} is missing content-security-policy header.`);
  HTML_CSP_REQUIRED_DIRECTIVES.forEach((directive) => {
    assert(csp.includes(directive), `${resourcePath} CSP is missing directive: ${directive}`);
  });
  assert(!csp.includes("'unsafe-eval'"), `${resourcePath} CSP must not allow unsafe-eval.`);
}

export function assertPositiveContentLength(response, resourcePath) {
  const raw = readHeader(response, "content-length");
  const parsed = Number(raw);
  assert(Number.isFinite(parsed) && parsed > 0, `${resourcePath} returned invalid content-length: ${raw || "(missing)"}`);
}

export function requestRawPath({ host, port, path, method = "GET" }) {
  return new Promise((resolve, reject) => {
    const request = http.request({
      host,
      port,
      method,
      path
    }, (response) => {
      response.resume();
      response.on("end", () => {
        resolve({
          status: Number(response.statusCode || 0),
          headers: response.headers
        });
      });
    });

    request.on("error", reject);
    request.end();
  });
}

function readHeader(response, name) {
  if (response?.headers?.get) {
    return response.headers.get(name);
  }

  if (response?.headers && typeof response.headers === "object") {
    return response.headers[name.toLowerCase()] || null;
  }

  return null;
}

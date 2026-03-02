import path from "node:path";

export const MIME_TYPES = Object.freeze({
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".svg": "image/svg+xml",
  ".webmanifest": "application/manifest+json; charset=utf-8"
});

export const HTML_CSP = "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'";
export const HTML_CSP_REQUIRED_DIRECTIVES = Object.freeze([
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com",
  "img-src 'self' data:",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'"
]);

export function getCacheControl(filePath) {
  const extension = path.extname(filePath).toLowerCase();
  const fileName = path.basename(filePath).toLowerCase();

  if (extension === ".html" || fileName === "service-worker.js" || extension === ".webmanifest" || fileName === "release.json") {
    return "no-cache";
  }

  return "public, max-age=0";
}

export function getSecurityHeaders() {
  return {
    "Referrer-Policy": "no-referrer",
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Permissions-Policy": "geolocation=(), camera=(), microphone=()",
    "Cross-Origin-Opener-Policy": "same-origin",
    "Cross-Origin-Resource-Policy": "same-origin"
  };
}

export function getDocumentHeaders(filePath, cspValue = HTML_CSP) {
  if (path.extname(filePath).toLowerCase() !== ".html") {
    return {};
  }

  return {
    "Content-Security-Policy": cspValue
  };
}

export function buildEntityTag(stats) {
  const sizeHex = Number(stats?.size || 0).toString(16);
  const mtimeHex = Math.trunc(Number(stats?.mtimeMs || 0)).toString(16);
  return `W/"${sizeHex}-${mtimeHex}"`;
}

export function matchesIfNoneMatch(rawValue, entityTag) {
  if (typeof rawValue !== "string" || !rawValue.trim()) {
    return false;
  }

  const normalizedTag = entityTag.startsWith("W/") ? entityTag.slice(2) : entityTag;

  return rawValue
    .split(",")
    .map((value) => value.trim())
    .some((value) => {
      if (value === "*") {
        return true;
      }

      if (value === entityTag || value === normalizedTag) {
        return true;
      }

      if (value.startsWith("W/")) {
        return value.slice(2) === normalizedTag;
      }

      return false;
    });
}

export function isNotModified(requestHeaders, entityTag, mtimeMs) {
  if (matchesIfNoneMatch(requestHeaders["if-none-match"], entityTag)) {
    return true;
  }

  const ifModifiedSince = requestHeaders["if-modified-since"];
  if (typeof ifModifiedSince !== "string") {
    return false;
  }

  const timestamp = Date.parse(ifModifiedSince);
  if (!Number.isFinite(timestamp)) {
    return false;
  }

  const normalizedMtime = Math.trunc(Number(mtimeMs || 0) / 1000) * 1000;
  return normalizedMtime <= timestamp;
}

export function resolvePath(urlPath, staticRoot) {
  const rawPath = String(urlPath || "/").split("?")[0].split("#")[0];
  const pathOnly = rawPath.startsWith("/") ? rawPath : `/${rawPath}`;
  const encodedSegments = pathOnly.split("/");
  const decodedSegments = [];

  for (const segment of encodedSegments) {
    let decodedSegment;
    try {
      decodedSegment = decodeURIComponent(segment);
    } catch (error) {
      return null;
    }

    if (decodedSegment.includes("/") || decodedSegment.includes("\\") || decodedSegment.includes("\0")) {
      return null;
    }

    decodedSegments.push(decodedSegment);
  }

  const pathname = decodedSegments.join("/");
  const segments = decodedSegments.filter(Boolean);
  if (segments.some((segment) => segment.startsWith("."))) {
    return null;
  }

  const normalized = pathname === "/" ? "/index.html" : pathname;
  const normalizedStaticRoot = path.resolve(staticRoot);
  const filePath = path.resolve(normalizedStaticRoot, `.${normalized}`);
  const relative = path.relative(normalizedStaticRoot, filePath);

  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    return null;
  }

  return filePath;
}

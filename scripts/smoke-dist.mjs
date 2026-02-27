import fs from "node:fs";
import { spawn } from "node:child_process";
import path from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const distDir = path.join(rootDir, "dist");
const baseUrl = "http://127.0.0.1:4174";
const checks = [
  { path: "/index.html", type: "text/html" },
  { path: "/404.html", type: "text/html" },
  { path: "/manifest.webmanifest", type: "application/manifest+json" },
  { path: "/service-worker.js", type: "text/javascript" },
  { path: "/release.json", type: "application/json" },
  { path: "/assets/css/main.css", type: "text/css" },
  { path: "/assets/js/app.js", type: "text/javascript" },
  { path: "/assets/js/modules/content.js", type: "text/javascript" },
  { path: "/assets/js/modules/assessment-state.js", type: "text/javascript" },
  { path: "/assets/js/modules/progress-state.js", type: "text/javascript" },
  { path: "/assets/js/modules/runtime.js", type: "text/javascript" },
  { path: "/assets/js/modules/study-helpers.js", type: "text/javascript" },
  { path: "/assets/js/modules/storage.js", type: "text/javascript" },
  { path: "/assets/js/modules/templates.js", type: "text/javascript" },
  { path: "/assets/js/modules/validation.js", type: "text/javascript" },
  { path: "/assets/js/modules/utils.js", type: "text/javascript" },
  { path: "/assets/data/study-pack-template.json", type: "application/json" },
  { path: "/assets/icons/icon-192.svg", type: "image/svg+xml" },
  { path: "/assets/icons/icon-512.svg", type: "image/svg+xml" }
];

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function waitForServer() {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    try {
      const response = await fetch(`${baseUrl}/index.html`);
      if (response.ok) {
        return;
      }
    } catch (error) {
      await delay(250);
    }
  }

  throw new Error("Dist server did not start in time.");
}

assert(fs.existsSync(distDir), "dist/ does not exist. Run `npm run package` first.");
assert(fs.existsSync(path.join(distDir, ".nojekyll")), "dist/.nojekyll is missing.");

const server = spawn(process.execPath, ["scripts/dev-server.mjs"], {
  cwd: rootDir,
  env: {
    ...process.env,
    STATIC_ROOT: distDir,
    PORT: "4174"
  },
  stdio: "ignore"
});
server.on("error", () => {});

try {
  await waitForServer();

  for (const check of checks) {
    const response = await fetch(`${baseUrl}${check.path}`);
    assert(response.ok, `${check.path} returned ${response.status}`);

    const contentType = response.headers.get("content-type") || "";
    assert(
      contentType.includes(check.type),
      `${check.path} returned unexpected content-type: ${contentType}`
    );
  }

  const html = await fetch(`${baseUrl}/index.html`).then((response) => response.text());
  assert(html.includes('id="connectionStatus"'), "dist/index.html is missing connection status chip.");
  assert(html.includes('id="updateBtn"'), "dist/index.html is missing update button.");

  const releaseManifest = await fetch(`${baseUrl}/release.json`).then((response) => response.json());
  assert(typeof releaseManifest.version === "string" && releaseManifest.version.length > 0, "release.json is missing version.");
  assert(Array.isArray(releaseManifest.files) && releaseManifest.files.includes("assets"), "release.json has invalid file manifest.");

  console.log("Dist smoke test passed.");
} finally {
  if (!server.killed && server.exitCode === null) {
    try {
      server.kill();
    } catch (error) {
      // Ignore teardown race conditions on Windows.
    }
  }
}

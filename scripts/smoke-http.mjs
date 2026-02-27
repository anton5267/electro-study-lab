import { spawn } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const baseUrl = "http://127.0.0.1:4173";
const checks = [
  { path: "/index.html", type: "text/html" },
  { path: "/manifest.webmanifest", type: "application/manifest+json" },
  { path: "/service-worker.js", type: "text/javascript" },
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

  throw new Error("Development server did not start in time.");
}

const server = spawn(process.execPath, ["scripts/dev-server.mjs"], {
  cwd: rootDir,
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

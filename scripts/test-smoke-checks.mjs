import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  getDistSmokeChecks,
  getExpectedPrecachePaths,
  getSourceSmokeChecks
} from "./smoke-checks.mjs";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const moduleDir = path.join(rootDir, "assets", "js", "modules");

{
  const source = getSourceSmokeChecks();
  assert(Array.isArray(source) && source.length > 0, "Source smoke checks must not be empty.");
  assert(source.some((check) => check.path === "/index.html"), "Source checks must include /index.html.");
  assert(source.some((check) => check.path === "/service-worker.js"), "Source checks must include /service-worker.js.");
}

{
  const dist = getDistSmokeChecks();
  assert(Array.isArray(dist) && dist.length > 0, "Dist smoke checks must not be empty.");
  assert(dist.some((check) => check.path === "/404.html"), "Dist checks must include /404.html.");
  assert(dist.some((check) => check.path === "/release.json"), "Dist checks must include /release.json.");
}

{
  const precache = getExpectedPrecachePaths();
  assert(Array.isArray(precache) && precache.length > 0, "Expected precache paths must not be empty.");
  assert(precache.every((item) => typeof item === "string" && item.length > 0), "Expected precache paths must be non-empty strings.");
  assert(precache.every((item) => !item.startsWith("/")), "Expected precache paths must be slash-trimmed.");
  assert(!precache.includes("service-worker.js"), "Expected precache paths must not include service-worker.js.");
  assert(new Set(precache).size === precache.length, "Expected precache paths must be unique.");
}

{
  const sourcePaths = new Set(getSourceSmokeChecks().map((check) => check.path));
  const expected = getExpectedPrecachePaths().map((path) => `/${path}`);

  expected.forEach((path) => {
    assert(sourcePaths.has(path), `Expected precache path is missing in source checks: ${path}`);
  });
}

{
  const expectedModulePaths = fs.readdirSync(moduleDir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(".js"))
    .map((entry) => `/assets/js/modules/${entry.name}`)
    .sort();

  const sourceModulePaths = getSourceSmokeChecks()
    .map((check) => check.path)
    .filter((resourcePath) => resourcePath.startsWith("/assets/js/modules/"))
    .sort();

  const distModulePaths = getDistSmokeChecks()
    .map((check) => check.path)
    .filter((resourcePath) => resourcePath.startsWith("/assets/js/modules/"))
    .sort();

  assert(new Set(sourceModulePaths).size === sourceModulePaths.length, "Source module smoke checks must be unique.");
  assert(new Set(distModulePaths).size === distModulePaths.length, "Dist module smoke checks must be unique.");

  assert.deepEqual(sourceModulePaths, expectedModulePaths, "Source module smoke checks must match assets/js/modules/*.js.");
  assert.deepEqual(distModulePaths, expectedModulePaths, "Dist module smoke checks must match assets/js/modules/*.js.");
}

console.log("Smoke checks tests passed.");

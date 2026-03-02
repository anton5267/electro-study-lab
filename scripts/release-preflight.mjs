import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = parseArgs(process.argv.slice(2));
const useFullQuality = Boolean(args["full-quality"]);
const tag = typeof args.tag === "string" ? args.tag.trim() : "";

try {
  if (tag) {
    validateTag(tag);
    validateChangelogForTag(tag);
  }

  runStep("Quality Gate", ["npm", "run", useFullQuality ? "quality" : "quality:quick"]);
  runStep("Build Package", ["npm", "run", "package"]);
  runStep("Dist Smoke", ["npm", "run", "smoke:dist"]);
  runStep("Dist Browser Smoke", ["npm", "run", "smoke:dist:browser"]);
  validateDistManifest();

  console.log("Release preflight passed.");
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}

function parseArgs(rawArgs) {
  const options = {};

  rawArgs.forEach((arg) => {
    if (!arg.startsWith("--")) {
      return;
    }

    const separatorIndex = arg.indexOf("=");
    if (separatorIndex !== -1) {
      options[arg.slice(2, separatorIndex)] = arg.slice(separatorIndex + 1);
      return;
    }

    options[arg.slice(2)] = true;
  });

  return options;
}

function runStep(label, command) {
  console.log(`\n[preflight] ${label}: ${command.join(" ")}`);
  const result = spawnSync(command[0], command.slice(1), {
    cwd: rootDir,
    stdio: "inherit",
    shell: process.platform === "win32"
  });

  if (result.status !== 0) {
    throw new Error(`[preflight] ${label} failed.`);
  }
}

function validateTag(tagValue) {
  if (!/^v\d+\.\d+\.\d+$/.test(tagValue)) {
    throw new Error(`Invalid --tag value: "${tagValue}". Expected format: vMAJOR.MINOR.PATCH`);
  }
}

function validateChangelogForTag(tagValue) {
  const version = tagValue.replace(/^v/, "");
  const changelogPath = path.join(rootDir, "CHANGELOG.md");
  const changelog = fs.readFileSync(changelogPath, "utf8");
  const heading = `## [${version}]`;

  if (!changelog.includes(heading)) {
    throw new Error(`CHANGELOG.md is missing release section: ${heading}`);
  }
}

function validateDistManifest() {
  const releasePath = path.join(rootDir, "dist", "release.json");
  if (!fs.existsSync(releasePath)) {
    throw new Error("dist/release.json is missing after package step.");
  }

  const payload = JSON.parse(fs.readFileSync(releasePath, "utf8"));
  if (typeof payload.version !== "string" || !payload.version.trim()) {
    throw new Error("dist/release.json must contain a non-empty \"version\".");
  }

  if (!Array.isArray(payload.files) || !payload.files.length) {
    throw new Error("dist/release.json must contain a non-empty \"files\" array.");
  }

  const requiredEntries = ["index.html", "assets", "service-worker.js", "manifest.webmanifest"];
  requiredEntries.forEach((entry) => {
    if (!payload.files.includes(entry)) {
      throw new Error(`dist/release.json is missing expected file entry: ${entry}`);
    }
  });
}

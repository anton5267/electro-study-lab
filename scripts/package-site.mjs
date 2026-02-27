import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const distDir = path.join(rootDir, "dist");
const packageJson = JSON.parse(fs.readFileSync(path.join(rootDir, "package.json"), "utf8"));
const staticEntries = [
  "index.html",
  "elektro-lernseite 2.html",
  "manifest.webmanifest",
  "service-worker.js",
  "assets"
];

function assertExists(relativePath) {
  const targetPath = path.join(rootDir, relativePath);
  if (!fs.existsSync(targetPath)) {
    throw new Error(`Missing required deploy asset: ${relativePath}`);
  }
}

function copyEntry(relativePath) {
  const sourcePath = path.join(rootDir, relativePath);
  const targetPath = path.join(distDir, relativePath);
  fs.cpSync(sourcePath, targetPath, { recursive: true });
}

fs.rmSync(distDir, { recursive: true, force: true });
fs.mkdirSync(distDir, { recursive: true });

staticEntries.forEach(assertExists);
staticEntries.forEach(copyEntry);

fs.copyFileSync(path.join(rootDir, "index.html"), path.join(distDir, "404.html"));
fs.writeFileSync(path.join(distDir, ".nojekyll"), "", "utf8");

const optionalFiles = ["CNAME"];
optionalFiles.forEach((relativePath) => {
  const sourcePath = path.join(rootDir, relativePath);
  if (fs.existsSync(sourcePath)) {
    fs.copyFileSync(sourcePath, path.join(distDir, relativePath));
  }
});

const releaseManifest = {
  name: packageJson.name,
  version: packageJson.version,
  packagedAt: new Date().toISOString(),
  gitSha: process.env.GITHUB_SHA || "",
  workflows: [
    "quality",
    "deploy-pages",
    "release"
  ],
  files: staticEntries
};

fs.writeFileSync(
  path.join(distDir, "release.json"),
  JSON.stringify(releaseManifest, null, 2),
  "utf8"
);

console.log("Static site package created in dist/.");

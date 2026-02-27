import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";
import { fileURLToPath } from "node:url";

import { chromium } from "playwright";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const distDir = path.join(rootDir, "dist");
const baseUrl = "http://127.0.0.1:4175";

function assertVisible(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function waitForServer() {
  for (let attempt = 0; attempt < 30; attempt += 1) {
    try {
      const response = await fetch(`${baseUrl}/index.html`);
      if (response.ok) {
        return;
      }
    } catch (error) {
      await delay(250);
    }
  }

  throw new Error("Dist browser server did not start in time.");
}

async function dismissWelcomeModal(page) {
  const closeButton = page.locator("#closeWelcomeBtn");
  if (await closeButton.isVisible().catch(() => false)) {
    await closeButton.click();
    await page.locator("#welcomeModal").waitFor({ state: "hidden" });
  }
}

async function waitForActiveSection(page, sectionId) {
  await page.waitForFunction((expectedSectionId) => {
    return document.querySelector(".section.active")?.id === expectedSectionId;
  }, sectionId);
}

assert(fs.existsSync(distDir), "dist/ does not exist. Run `npm run package` first.");

const server = spawn(process.execPath, ["scripts/dev-server.mjs"], {
  cwd: rootDir,
  env: {
    ...process.env,
    STATIC_ROOT: distDir,
    PORT: "4175"
  },
  stdio: "ignore"
});
server.on("error", () => {});

let browser;

try {
  await waitForServer();

  browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();

  await context.addInitScript(() => {
    window.localStorage.setItem("study.onboardingSeen", JSON.stringify(true));
    window.__copiedText = "";

    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        writeText: async (text) => {
          window.__copiedText = text;
        },
        readText: async () => window.__copiedText || ""
      }
    });
  });

  const page = await context.newPage();
  await page.goto(`${baseUrl}/index.html`, { waitUntil: "networkidle" });
  await dismissWelcomeModal(page);
  await waitForActiveSection(page, "overview");

  const releaseManifest = await page.evaluate(async () => {
    return fetch("./release.json").then((response) => response.json());
  });
  assert.equal(releaseManifest.version, "1.0.0");
  assert(Array.isArray(releaseManifest.files) && releaseManifest.files.includes("assets"));

  await page.locator('#languageSwitcher [data-lang="de"]').click();
  await page.waitForFunction(() => document.documentElement.lang === "de");

  await page.locator("#tabQuiz").click();
  await waitForActiveSection(page, "quiz");
  await page.locator("#shareLinkBtn").click();

  const copiedUrl = await page.evaluate(() => window.__copiedText);
  assertVisible(copiedUrl.includes("lang=de"), "Dist share link is missing language state.");
  assertVisible(copiedUrl.endsWith("#quiz"), "Dist share link is missing active section.");

  await page.locator("#tabExam").click();
  await waitForActiveSection(page, "exam");
  await page.locator('[data-start-exam="true"]').click();
  await page.locator('[data-submit-exam="true"]').waitFor();
  await page.locator('[data-exam-answer]').first().click();
  await page.reload({ waitUntil: "networkidle" });
  await page.locator('[data-submit-exam="true"]').waitFor();

  const selectedExamAnswers = await page.locator(".exam-question .quiz-option.selected").count();
  assertVisible(selectedExamAnswers >= 1, "Dist exam state was not restored after reload.");

  console.log("Dist browser smoke test passed.");
} finally {
  if (browser) {
    await browser.close();
  }

  if (!server.killed && server.exitCode === null) {
    try {
      server.kill();
    } catch (error) {
      // Ignore teardown race conditions on Windows.
    }
  }
}

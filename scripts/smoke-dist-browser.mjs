import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

import { chromium } from "playwright";
import {
  assertVisible,
  dismissWelcomeModal,
  waitForActiveSection,
  waitForWarningToast,
  waitForServer
} from "./browser-smoke-helpers.mjs";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const distDir = path.join(rootDir, "dist");
const baseUrl = "http://127.0.0.1:4175";

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
const fixturePaths = [];

try {
  await waitForServer(baseUrl);

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

  await page.evaluate(() => {
    window.localStorage.setItem("study.reviewQueue", JSON.stringify(["qq-2"]));
    window.localStorage.setItem("study.quizMode", JSON.stringify("default"));
    window.localStorage.setItem("study.quizAnswers", JSON.stringify({}));
    window.localStorage.setItem("study.quizVariantIds", JSON.stringify([]));
    window.localStorage.setItem("study.viewState", JSON.stringify({
      activeSection: "overview",
      activeTopic: "measurement",
      searchQuery: "",
      currentCard: 0,
      diagramSelections: {}
    }));
  });

  await page.goto(`${baseUrl}/index.html?lang=de`, { waitUntil: "networkidle" });
  await dismissWelcomeModal(page);
  await waitForActiveSection(page, "overview");
  await page.waitForFunction(() => window.location.search.includes("topic=measurement"));

  await page.locator("#reviewNowBtn").click();
  await waitForActiveSection(page, "quiz");
  await page.waitForFunction(() => window.location.search.includes("topic=switching"));

  const adaptiveReviewCount = await page.locator(".quiz-card").count();
  assertVisible(adaptiveReviewCount >= 1, "Dist adaptive review did not open review questions.");

  await page.locator("#tabExam").click();
  await waitForActiveSection(page, "exam");
  await page.locator("#examDurationSelect").selectOption("15");
  await page.locator("#examCountSelect").selectOption("10");
  await page.locator("#tabOverview").click();
  await waitForActiveSection(page, "overview");
  await page.locator("#tabExam").click();
  await waitForActiveSection(page, "exam");

  const persistedDuration = await page.locator("#examDurationSelect").inputValue();
  const persistedCount = await page.locator("#examCountSelect").inputValue();
  assertVisible(persistedDuration === "15", "Dist exam duration setting did not persist in intro state.");
  assertVisible(persistedCount === "10", "Dist exam question count setting did not persist in intro state.");

  await page.locator('[data-start-exam="true"]').click();
  await page.locator('[data-submit-exam="true"]').waitFor();
  await page.locator('[data-exam-answer]').first().click();
  await page.reload({ waitUntil: "networkidle" });
  await page.locator('[data-submit-exam="true"]').waitFor();

  const selectedExamAnswers = await page.locator(".exam-question .quiz-option.selected").count();
  assertVisible(selectedExamAnswers >= 1, "Dist exam state was not restored after reload.");

  const invalidPackPath = await writeFixtureFile("dist-pack-invalid", {
    uk: {
      flashcards: [
        {
          id: "fc-1",
          topic: "unknown",
          term: "",
          def: "broken"
        }
      ]
    }
  });
  fixturePaths.push(invalidPackPath);
  const invalidPackToastCount = await page.locator(".toast.warning").count();
  await page.locator("#importPackInput").setInputFiles(invalidPackPath);
  await waitForWarningToast(page, invalidPackToastCount);

  const invalidBackupPath = await writeFixtureFile("dist-backup-invalid", {
    language: "uk",
    progress: {
      checklist: ["bad-index"]
    }
  });
  fixturePaths.push(invalidBackupPath);
  const invalidBackupToastCount = await page.locator(".toast.warning").count();
  await page.locator("#importProgressInput").setInputFiles(invalidBackupPath);
  await waitForWarningToast(page, invalidBackupToastCount);
  await page.waitForFunction(() => document.documentElement.lang === "de");

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

  await Promise.all(fixturePaths.map((fixturePath) => fs.promises.rm(fixturePath, { force: true }).catch(() => {})));
}

async function writeFixtureFile(label, payload) {
  const fixturePath = path.join(os.tmpdir(), `${label}-${Date.now()}.json`);
  await fs.promises.writeFile(fixturePath, JSON.stringify(payload, null, 2), "utf8");
  return fixturePath;
}

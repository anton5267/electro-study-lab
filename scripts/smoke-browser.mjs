import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";
import { fileURLToPath } from "node:url";

import { chromium } from "playwright";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const baseUrl = "http://127.0.0.1:4173";

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

  throw new Error("Development server did not start in time.");
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

async function buildBackupFixture() {
  const fixturePath = path.join(os.tmpdir(), `electro-study-backup-${Date.now()}.json`);
  const payload = {
    version: 2,
    savedAt: "2026-02-27T18:00:00.000Z",
    language: "uk",
    onboardingSeen: true,
    viewState: {
      activeSection: "flashcards",
      activeTopic: "switching",
      searchQuery: "",
      currentCard: 1,
      diagramSelections: {}
    },
    progress: {
      checklist: [0],
      seenCards: [0],
      cardOrder: [],
      practiceAnswers: {},
      practiceSolved: [],
      quizAnswers: {},
      quizMastered: [],
      quizMode: "default",
      quizVariantIds: [],
      reviewQueue: [],
      stats: {
        quizRuns: 0,
        examRuns: 0,
        practiceSolvedCount: 0,
        bestQuizScore: 0,
        bestExamScore: 0,
        averageExamScore: 0,
        averageQuizScore: 0,
        studyStreak: 0,
        lastStudyDate: "",
        achievements: [],
        history: []
      },
      examState: null
    }
  };

  await fs.promises.writeFile(fixturePath, JSON.stringify(payload, null, 2), "utf8");
  return fixturePath;
}

const server = spawn(process.execPath, ["scripts/dev-server.mjs"], {
  cwd: rootDir,
  stdio: "ignore"
});
server.on("error", () => {});

let browser;
let fixturePath = "";

try {
  await waitForServer();

  browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();

  await context.addInitScript(() => {
    window.__copiedText = "";

    const originalClipboard = navigator.clipboard;
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        writeText: async (text) => {
          window.__copiedText = text;
          if (originalClipboard?.writeText) {
            try {
              await originalClipboard.writeText(text);
            } catch (error) {
              return;
            }
          }
        },
        readText: async () => window.__copiedText || ""
      }
    });
  });

  const page = await context.newPage();
  await page.goto(`${baseUrl}/index.html`, { waitUntil: "networkidle" });
  await dismissWelcomeModal(page);
  await waitForActiveSection(page, "overview");

  await page.locator('#languageSwitcher [data-lang="de"]').click();
  await page.waitForFunction(() => document.documentElement.lang === "de");

  await page.locator("#searchInput").fill("schutz");
  await delay(250);
  await page.locator('[data-topic-filter="safety"]').click();
  await page.locator("#tabQuiz").click();
  await waitForActiveSection(page, "quiz");
  await page.locator("#shareLinkBtn").click();

  const copiedUrl = await page.evaluate(() => window.__copiedText);
  assertVisible(copiedUrl.includes("lang=de"), "Share link is missing language state.");
  assertVisible(copiedUrl.includes("topic=safety"), "Share link is missing topic state.");
  assertVisible(copiedUrl.includes("q=schutz"), "Share link is missing search query state.");
  assertVisible(copiedUrl.endsWith("#quiz"), "Share link is missing active section.");

  await page.locator("#tabExam").click();
  await waitForActiveSection(page, "exam");
  await page.locator("#examDurationSelect").selectOption("6");
  await page.locator("#examCountSelect").selectOption("6");
  await page.locator('[data-start-exam="true"]').click();
  await page.locator('[data-submit-exam="true"]').waitFor();
  await page.locator('[data-exam-answer]').first().click();
  await page.reload({ waitUntil: "networkidle" });
  await page.locator('[data-submit-exam="true"]').waitFor();
  await waitForActiveSection(page, "exam");

  const selectedExamAnswers = await page.locator(".exam-question .quiz-option.selected").count();
  assertVisible(selectedExamAnswers >= 1, "Running exam answer was not restored after reload.");

  fixturePath = await buildBackupFixture();
  await page.locator("#importProgressInput").setInputFiles(fixturePath);
  await page.waitForFunction(() => document.documentElement.lang === "uk");
  await waitForActiveSection(page, "flashcards");
  await page.waitForFunction(() => {
    return Boolean(document.getElementById("fcTerm")?.textContent?.trim());
  });

  const flashcardTerm = await page.locator("#fcTerm").textContent();
  assertVisible(Boolean(flashcardTerm && flashcardTerm.trim().length), "Backup import did not restore flashcard view.");

  console.log("Browser smoke test passed.");
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

  if (fixturePath) {
    await fs.promises.rm(fixturePath, { force: true }).catch(() => {});
  }
}

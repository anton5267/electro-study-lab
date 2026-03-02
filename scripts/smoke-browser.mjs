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
const baseUrl = "http://127.0.0.1:4173";

async function buildBackupFixture() {
  const fixturePath = path.join(os.tmpdir(), `electro-study-backup-valid-${Date.now()}.json`);
  const payload = {
    version: 2,
    savedAt: "2026-02-27T18:00:00.000Z",
    language: "uk",
    onboardingSeen: true,
    examSettings: {
      durationMinutes: 15,
      questionCount: 10
    },
    viewState: {
      activeSection: "flashcards",
      activeTopic: "measurement",
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
      reviewQueue: ["qq-2"],
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

async function buildInvalidBackupFixture() {
  const fixturePath = path.join(os.tmpdir(), `electro-study-backup-invalid-${Date.now()}.json`);
  const payload = {
    language: "uk",
    progress: {
      checklist: ["bad-index"]
    }
  };

  await fs.promises.writeFile(fixturePath, JSON.stringify(payload, null, 2), "utf8");
  return fixturePath;
}

async function buildInvalidCustomPackFixture() {
  const fixturePath = path.join(os.tmpdir(), `electro-study-pack-invalid-${Date.now()}.json`);
  const payload = {
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
const fixturePaths = [];

try {
  await waitForServer(baseUrl);

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

  await page.goto(`${baseUrl}/index.html?lang=uk&topic=measurement#theory`, { waitUntil: "networkidle" });
  await waitForActiveSection(page, "theory");
  await page.reload({ waitUntil: "networkidle" });
  await waitForActiveSection(page, "theory");

  await page.locator('#languageSwitcher [data-lang="de"]').click();
  await page.waitForFunction(() => document.documentElement.lang === "de");

  await page.locator("#searchInput").fill("schutz");
  await page.waitForTimeout(250);
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
  await page.locator("#tabOverview").click();
  await waitForActiveSection(page, "overview");
  await page.locator("#tabExam").click();
  await waitForActiveSection(page, "exam");

  const persistedDuration = await page.locator("#examDurationSelect").inputValue();
  const persistedCount = await page.locator("#examCountSelect").inputValue();
  assertVisible(persistedDuration === "6", "Exam duration setting did not persist in intro state.");
  assertVisible(persistedCount === "6", "Exam question count setting did not persist in intro state.");

  await page.locator('[data-start-exam="true"]').click();
  await page.locator('[data-submit-exam="true"]').waitFor();
  await page.locator('[data-exam-answer]').first().click();
  await page.reload({ waitUntil: "networkidle" });
  await page.locator('[data-submit-exam="true"]').waitFor();
  await waitForActiveSection(page, "exam");

  const selectedExamAnswers = await page.locator(".exam-question .quiz-option.selected").count();
  assertVisible(selectedExamAnswers >= 1, "Running exam answer was not restored after reload.");

  const invalidPackPath = await buildInvalidCustomPackFixture();
  fixturePaths.push(invalidPackPath);
  const invalidPackToastCount = await page.locator(".toast.warning").count();
  await page.locator("#importPackInput").setInputFiles(invalidPackPath);
  await waitForWarningToast(page, invalidPackToastCount);
  const persistedCustomPack = await page.evaluate(() => window.localStorage.getItem("study.customPack"));
  assertVisible(!persistedCustomPack, "Invalid custom pack should not be persisted.");

  const invalidBackupPath = await buildInvalidBackupFixture();
  fixturePaths.push(invalidBackupPath);
  const invalidBackupToastCount = await page.locator(".toast.warning").count();
  await page.locator("#importProgressInput").setInputFiles(invalidBackupPath);
  await waitForWarningToast(page, invalidBackupToastCount);
  await page.waitForFunction(() => document.documentElement.lang === "de");
  await waitForActiveSection(page, "exam");

  const validBackupPath = await buildBackupFixture();
  fixturePaths.push(validBackupPath);
  await page.locator("#importProgressInput").setInputFiles(validBackupPath);
  await page.waitForFunction(() => document.documentElement.lang === "uk");
  await waitForActiveSection(page, "flashcards");
  await page.waitForFunction(() => {
    return Boolean(document.getElementById("fcTerm")?.textContent?.trim());
  });

  const flashcardTerm = await page.locator("#fcTerm").textContent();
  assertVisible(Boolean(flashcardTerm && flashcardTerm.trim().length), "Backup import did not restore flashcard view.");

  await page.locator("#tabExam").click();
  await waitForActiveSection(page, "exam");
  const importedDuration = await page.locator("#examDurationSelect").inputValue();
  const importedCount = await page.locator("#examCountSelect").inputValue();
  assertVisible(importedDuration === "15", "Backup import did not restore exam duration setting.");
  assertVisible(importedCount === "10", "Backup import did not restore exam question count setting.");
  await page.locator("#tabOverview").click();
  await waitForActiveSection(page, "overview");

  const backupActionLabels = await page.$$eval("#exportProgressBtn, #importProgressBtn", (nodes) => (
    nodes.map((node) => node.textContent?.trim() || "")
  ));
  assertVisible(
    backupActionLabels.every((label) => label.length > 0 && !label.includes("undefined")),
    "Backup action buttons must have visible labels."
  );

  await page.locator("#tabFlashcards").click();
  await waitForActiveSection(page, "flashcards");
  await page.waitForFunction(() => Boolean(document.getElementById("fcTerm")?.textContent?.trim()));
  const flashcardUiText = await page.$$eval(
    "#shuffleCardsBtn, #prevCardBtn, #flipCardBtn, #nextCardBtn, #flashcardStatus",
    (nodes) => nodes.map((node) => node.textContent?.trim() || "")
  );
  assertVisible(
    flashcardUiText.every((value) => value.length > 0 && !value.includes("undefined")),
    "Flashcard controls/status should never render undefined labels."
  );

  await page.waitForFunction(() => window.location.search.includes("topic=measurement"));
  await page.locator("#reviewNowBtn").click();
  await waitForActiveSection(page, "quiz");
  await page.waitForFunction(() => window.location.search.includes("topic=switching"));

  const reviewQuestionCount = await page.locator(".quiz-card").count();
  assertVisible(reviewQuestionCount >= 1, "Adaptive review mode did not open a review quiz.");

  await page.locator('[data-topic-filter="measurement"]').click();
  await page.waitForFunction(() => window.location.search.includes("topic=measurement"));
  await page.locator("#tabExam").click();
  await waitForActiveSection(page, "exam");
  await page.locator('[data-start-exam="true"]').click();
  await page.locator('[data-submit-exam="true"]').waitFor();
  await page.waitForFunction(() => {
    const labels = Array.from(document.querySelectorAll(".exam-question .topic-chip"))
      .map((node) => node.textContent?.trim())
      .filter(Boolean);
    return labels.length > 0;
  });
  const examTopicLabels = await page.$$eval(".exam-question .topic-chip", (nodes) => (
    nodes.map((node) => node.textContent?.trim() || "")
  ));
  assertVisible(
    examTopicLabels.every((label) => label === "Розрахунки"),
    "Measurement-scoped exam should include only measurement topic questions."
  );
  await page.locator('[data-submit-exam="true"]').click();
  await page.locator('[data-reset-exam="true"]').click();

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

  await Promise.all(fixturePaths.map((fixturePath) => fs.promises.rm(fixturePath, { force: true }).catch(() => {})));
}

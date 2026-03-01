import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";
import { fileURLToPath } from "node:url";

import { chromium, devices } from "playwright";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const baseUrl = "http://127.0.0.1:4173";
const axeSource = fs.readFileSync(path.join(rootDir, "node_modules", "axe-core", "axe.min.js"), "utf8");

function assert(condition, message) {
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

async function runAxe(page, label) {
  await page.addScriptTag({ content: axeSource });
  const result = await page.evaluate(async () => {
    return window.axe.run(document, {
      runOnly: {
        type: "tag",
        values: ["wcag2a", "wcag2aa", "best-practice"]
      }
    });
  });

  const blocking = result.violations.filter((violation) => ["serious", "critical"].includes(violation.impact));
  if (blocking.length) {
    const details = blocking.map((violation) => {
      const targets = violation.nodes.map((node) => node.target.join(" ")).join(" | ");
      return `${violation.id}: ${violation.help} -> ${targets}`;
    }).join("\n");
    throw new Error(`${label} has accessibility violations:\n${details}`);
  }
}

async function assertNoHorizontalOverflow(page, label) {
  const hasOverflow = await page.evaluate(() => {
    return document.documentElement.scrollWidth > document.documentElement.clientWidth + 1;
  });

  assert(!hasOverflow, `${label} has horizontal overflow.`);
}

async function assertPrintView(page) {
  await page.emulateMedia({ media: "print" });
  const printSnapshot = await page.evaluate(() => ({
    navHidden: window.getComputedStyle(document.querySelector(".main-nav")).display === "none",
    heroActionsHidden: window.getComputedStyle(document.querySelector(".hero-actions")).display === "none",
    examHidden: window.getComputedStyle(document.getElementById("exam")).display === "none",
    analyticsHidden: window.getComputedStyle(document.getElementById("analytics")).display === "none",
    theoryVisible: window.getComputedStyle(document.getElementById("theory")).display === "block"
  }));

  assert(printSnapshot.navHidden, "Print view still shows main navigation.");
  assert(printSnapshot.heroActionsHidden, "Print view still shows hero actions.");
  assert(printSnapshot.examHidden, "Print view still shows exam section.");
  assert(printSnapshot.analyticsHidden, "Print view still shows analytics section.");
  assert(printSnapshot.theoryVisible, "Print view does not expose content sections.");
  await page.emulateMedia({ media: "screen" });
}

async function auditDesktop(browser) {
  const context = await browser.newContext({
    bypassCSP: true
  });
  const page = await context.newPage();
  await page.goto(`${baseUrl}/index.html`, { waitUntil: "networkidle" });
  await dismissWelcomeModal(page);
  await runAxe(page, "Desktop overview");
  await assertPrintView(page);
  await context.close();
}

async function auditMobile(browser) {
  const context = await browser.newContext({
    ...devices["iPhone 13"],
    isMobile: true,
    bypassCSP: true
  });
  const page = await context.newPage();
  await page.goto(`${baseUrl}/index.html`, { waitUntil: "networkidle" });
  await dismissWelcomeModal(page);
  await assertNoHorizontalOverflow(page, "Mobile overview");
  await page.locator("#tabFlashcards").click();
  await page.waitForFunction(() => document.querySelector(".section.active")?.id === "flashcards");
  await assertNoHorizontalOverflow(page, "Mobile flashcards");
  await page.locator("#tabQuiz").click();
  await page.waitForFunction(() => document.querySelector(".section.active")?.id === "quiz");
  await runAxe(page, "Mobile quiz");
  await context.close();
}

const server = spawn(process.execPath, ["scripts/dev-server.mjs"], {
  cwd: rootDir,
  stdio: "ignore"
});
server.on("error", () => {});

let browser;

try {
  await waitForServer();
  browser = await chromium.launch({ headless: true });
  await auditDesktop(browser);
  await auditMobile(browser);
  console.log("Accessibility audit passed.");
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

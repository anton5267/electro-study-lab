import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";
import { fileURLToPath } from "node:url";

import pixelmatch from "pixelmatch";
import { chromium } from "playwright";
import { PNG } from "pngjs";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const baseUrl = "http://127.0.0.1:4173";
const baselineDir = path.join(rootDir, "qa", "visual-baselines");
const diffDir = path.join(rootDir, "artifacts", "visual-diffs");
const updateMode = process.argv.includes("--update");
const defaultMaxDiffPixels = 200;
const visualStabilityCss = `
  *,
  *::before,
  *::after {
    animation: none !important;
    transition: none !important;
  }

  body,
  button,
  input,
  select,
  textarea,
  a,
  p,
  span,
  div,
  h1,
  h2,
  h3,
  h4,
  strong,
  label {
    font-family: "Segoe UI", Arial, sans-serif !important;
  }

  svg text {
    font-family: Arial, sans-serif !important;
  }

  body {
    background: #0b141d !important;
  }

  body::before,
  .hero-backdrop {
    display: none !important;
  }

  .hero,
  .panel,
  .surface-card,
  .theory-card,
  .practice-card,
  .quiz-card,
  .checklist-item,
  .flashcard,
  .metric-card,
  .spot-card,
  .banner-card,
  .summary-card,
  .exam-result-card,
  .note-chip,
  .status-chip,
  .topic-chip,
  .topic-filter-btn,
  .quiz-option,
  .lang-switcher,
  .search-wrap {
    background-image: none !important;
    box-shadow: none !important;
    filter: none !important;
    backdrop-filter: none !important;
  }
`;

const scenarios = [
  {
    name: "desktop-overview",
    context: {
      viewport: { width: 1440, height: 1400 }
    },
    fullPage: true,
    setup: async () => {}
  },
  {
    name: "desktop-quiz",
    context: {
      viewport: { width: 1440, height: 1400 }
    },
    fullPage: true,
    setup: async (page) => {
      await page.locator("#tabQuiz").click();
      await waitForActiveSection(page, "quiz");
    }
  },
  {
    name: "desktop-theory",
    context: {
      viewport: { width: 1440, height: 1400 }
    },
    fullPage: true,
    setup: async (page) => {
      await page.locator("#tabTheory").click();
      await waitForActiveSection(page, "theory");
    }
  },
  {
    name: "mobile-overview",
    context: {
      viewport: { width: 390, height: 844 },
      deviceScaleFactor: 1,
      hasTouch: true
    },
    fullPage: false,
    screenshotSelector: ".hero",
    maxDiffPixels: 800,
    pixelThreshold: 0.2,
    setup: async () => {}
  }
];

function ensureDirectory(directory) {
  fs.mkdirSync(directory, { recursive: true });
}

function removeIfExists(filePath) {
  if (fs.existsSync(filePath)) {
    fs.rmSync(filePath, { force: true });
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

async function preparePage(page) {
  await page.goto(`${baseUrl}/index.html`, { waitUntil: "networkidle" });
  await page.emulateMedia({ reducedMotion: "reduce", colorScheme: "light" });
  await page.addStyleTag({ content: visualStabilityCss });
  await page.evaluate(async () => {
    if (document.fonts?.ready) {
      await document.fonts.ready;
    }
  });
}

async function waitForActiveSection(page, sectionId) {
  await page.waitForFunction((expectedSectionId) => {
    return document.querySelector(".section.active")?.id === expectedSectionId;
  }, sectionId);
}

async function createScenarioBuffer(browser, scenario) {
  const context = await browser.newContext({
    ...scenario.context,
    serviceWorkers: "block"
  });

  await context.addInitScript(() => {
    window.localStorage.setItem("study.onboardingSeen", JSON.stringify(true));
  });

  const page = await context.newPage();
  await preparePage(page);
  await scenario.setup(page);
  await page.evaluate(async () => {
    if (document.fonts?.ready) {
      await document.fonts.ready;
    }
  });

  const screenshot = scenario.screenshotSelector
    ? await page.locator(scenario.screenshotSelector).screenshot({
        animations: "disabled",
        caret: "hide"
      })
    : await page.screenshot({
        fullPage: scenario.fullPage,
        animations: "disabled",
        caret: "hide"
      });

  await context.close();
  return screenshot;
}

function compareWithBaseline(name, actualBuffer, options) {
  const maxDiffPixels = options.maxDiffPixels ?? defaultMaxDiffPixels;
  const pixelThreshold = options.pixelThreshold ?? 0.1;
  const baselinePath = path.join(baselineDir, `${name}.png`);
  const actualPath = path.join(diffDir, `${name}.actual.png`);
  const diffPath = path.join(diffDir, `${name}.diff.png`);

  if (updateMode || !fs.existsSync(baselinePath)) {
    fs.writeFileSync(baselinePath, actualBuffer);
    removeIfExists(actualPath);
    removeIfExists(diffPath);
    return null;
  }

  const baselinePng = PNG.sync.read(fs.readFileSync(baselinePath));
  const actualPng = PNG.sync.read(actualBuffer);

  if (baselinePng.width !== actualPng.width || baselinePng.height !== actualPng.height) {
    fs.writeFileSync(actualPath, actualBuffer);
    throw new Error(`${name} screenshot size changed from ${baselinePng.width}x${baselinePng.height} to ${actualPng.width}x${actualPng.height}.`);
  }

  const diffPng = new PNG({ width: baselinePng.width, height: baselinePng.height });
  const diffPixels = pixelmatch(
    baselinePng.data,
    actualPng.data,
    diffPng.data,
    baselinePng.width,
    baselinePng.height,
    {
      threshold: pixelThreshold,
      includeAA: false
    }
  );

  if (diffPixels > maxDiffPixels) {
    fs.writeFileSync(actualPath, actualBuffer);
    fs.writeFileSync(diffPath, PNG.sync.write(diffPng));
    throw new Error(`${name} visual regression exceeded threshold: ${diffPixels} pixels differ.`);
  }

  removeIfExists(actualPath);
  removeIfExists(diffPath);
  return diffPixels;
}

const server = spawn(process.execPath, ["scripts/dev-server.mjs"], {
  cwd: rootDir,
  stdio: "ignore"
});
server.on("error", () => {});

let browser;

try {
  ensureDirectory(baselineDir);
  ensureDirectory(diffDir);

  await waitForServer();
  browser = await chromium.launch({ headless: true });

  for (const scenario of scenarios) {
    const buffer = await createScenarioBuffer(browser, scenario);
    const diffPixels = compareWithBaseline(scenario.name, buffer, {
      maxDiffPixels: scenario.maxDiffPixels,
      pixelThreshold: scenario.pixelThreshold
    });

    if (updateMode || diffPixels === null) {
      console.log(`Updated baseline: ${scenario.name}`);
    } else {
      console.log(`OK  ${scenario.name} (${diffPixels} px diff)`);
    }
  }

  console.log(updateMode ? "Visual baselines refreshed." : "Visual regression test passed.");
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

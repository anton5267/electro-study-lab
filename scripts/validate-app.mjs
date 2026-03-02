import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";
import { HTML_CSP_REQUIRED_DIRECTIVES } from "./dev-server-helpers.mjs";
import { getExpectedPrecachePaths } from "./smoke-checks.mjs";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(scriptDir, "..");
const failures = [];

async function check(label, run) {
  try {
    await run();
    console.log(`OK  ${label}`);
  } catch (error) {
    failures.push({ label, message: error.message });
    console.log(`ERR ${label}`);
    console.log(`    ${error.message}`);
  }
}

function readText(relativePath) {
  return fs.readFileSync(path.join(rootDir, relativePath), "utf8");
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function assertUniqueIds(items, label) {
  const ids = items.map((item) => item.id);
  assert(new Set(ids).size === ids.length, `${label} contains duplicate ids.`);
}

function assertTopicCoverage(language, collectionName, items, topicLabels) {
  items.forEach((item) => {
    assert(
      typeof item.topic === "string" && topicLabels[item.topic],
      `${language}.${collectionName} uses unknown topic "${item.topic}".`
    );
  });
}

await check("JavaScript syntax", () => {
  const files = [
    "assets/js/app.js",
    "assets/js/modules/content.js",
    "assets/js/modules/assessment-state.js",
    "assets/js/modules/checklist-state.js",
    "assets/js/modules/checklist-control.js",
    "assets/js/modules/flashcard-state.js",
    "assets/js/modules/practice-state.js",
    "assets/js/modules/practice-control.js",
    "assets/js/modules/quiz-control.js",
    "assets/js/modules/theory-control.js",
    "assets/js/modules/jump-control.js",
    "assets/js/modules/keyboard-control.js",
    "assets/js/modules/nav-control.js",
    "assets/js/modules/language-control.js",
    "assets/js/modules/topic-control.js",
    "assets/js/modules/exam-intro-control.js",
    "assets/js/modules/exam-control.js",
    "assets/js/modules/exam-preferences.js",
    "assets/js/modules/exam-runtime.js",
    "assets/js/modules/exam-session.js",
    "assets/js/modules/quiz-session.js",
    "assets/js/modules/progress-state.js",
    "assets/js/modules/runtime.js",
    "assets/js/modules/storage.js",
    "assets/js/modules/study-helpers.js",
    "assets/js/modules/review-planner.js",
    "assets/js/modules/progress-metrics.js",
    "assets/js/modules/view-plan.js",
    "assets/js/modules/templates.js",
    "assets/js/modules/validation.js",
    "assets/js/modules/utils.js",
    "scripts/dev-server.mjs",
    "scripts/dev-server-helpers.mjs",
    "scripts/package-site.mjs",
    "scripts/release-preflight.mjs",
    "scripts/content-workbench.mjs",
    "scripts/check-size-budget.mjs",
    "scripts/build-study-pack-from-csv.mjs",
    "scripts/validate-custom-pack.mjs",
    "scripts/validate-backup-payload.mjs",
    "scripts/export-content-to-csv.mjs",
    "scripts/audit-accessibility.mjs",
    "scripts/browser-smoke-helpers.mjs",
    "scripts/http-smoke-helpers.mjs",
    "scripts/smoke-checks.mjs",
    "scripts/smoke-browser.mjs",
    "scripts/smoke-dist.mjs",
    "scripts/smoke-dist-browser.mjs",
    "scripts/smoke-http.mjs",
    "scripts/visual-regression.mjs",
    "scripts/test-runtime.mjs",
    "scripts/test-storage.mjs",
    "scripts/test-dev-server-helpers.mjs",
    "scripts/test-http-smoke-helpers.mjs",
    "scripts/test-smoke-checks.mjs",
    "scripts/test-progress-state.mjs",
    "scripts/test-assessment-state.mjs",
    "scripts/test-checklist-state.mjs",
    "scripts/test-checklist-control.mjs",
    "scripts/test-flashcard-state.mjs",
    "scripts/test-practice-state.mjs",
    "scripts/test-practice-control.mjs",
    "scripts/test-quiz-control.mjs",
    "scripts/test-theory-control.mjs",
    "scripts/test-jump-control.mjs",
    "scripts/test-keyboard-control.mjs",
    "scripts/test-nav-control.mjs",
    "scripts/test-language-control.mjs",
    "scripts/test-topic-control.mjs",
    "scripts/test-exam-intro-control.mjs",
    "scripts/test-validation.mjs",
    "scripts/test-review-planner.mjs",
    "scripts/test-view-plan.mjs",
    "scripts/test-progress-metrics.mjs",
    "scripts/test-exam-runtime.mjs",
    "scripts/test-exam-control.mjs",
    "scripts/test-exam-session.mjs",
    "scripts/test-quiz-session.mjs",
    "scripts/test-exam-preferences.mjs",
    "scripts/test-validate-custom-pack.mjs",
    "scripts/test-validate-backup-payload.mjs",
    "scripts/test-content-workbench.mjs",
    "scripts/test-build-study-pack-from-csv.mjs",
    "scripts/test-content-csv-roundtrip.mjs",
    "scripts/test-size-budget.mjs",
    "scripts/test-export-content-to-csv.mjs",
    "service-worker.js"
  ];

  files.forEach((file) => {
    const result = spawnSync(process.execPath, ["--check", file], {
      cwd: rootDir,
      encoding: "utf8"
    });

    assert(
      result.status === 0,
      `${file} failed syntax check.\n${(result.stderr || result.stdout || "").trim()}`
    );
  });
});

await check("Test command coverage", () => {
  const packageJson = JSON.parse(readText("package.json"));
  const testCommand = packageJson?.scripts?.test;

  assert(typeof testCommand === "string" && testCommand.length > 0, "package.json scripts.test must be defined.");

  const referencedTests = [...testCommand.matchAll(/scripts\/test-[\w-]+\.mjs/g)].map((match) => match[0]);
  const referencedSet = new Set(referencedTests);
  const availableTests = fs.readdirSync(path.join(rootDir, "scripts"))
    .filter((entry) => entry.startsWith("test-") && entry.endsWith(".mjs"))
    .map((entry) => `scripts/${entry}`);
  const availableSet = new Set(availableTests);

  assert(referencedSet.size === referencedTests.length, "package.json scripts.test contains duplicate test entries.");
  assert(availableTests.length > 0, "No scripts/test-*.mjs files found.");

  const missingFromCommand = availableTests.filter((entry) => !referencedSet.has(entry));
  const unknownInCommand = [...referencedSet].filter((entry) => !availableSet.has(entry));

  assert(!missingFromCommand.length, `scripts.test is missing test files: ${missingFromCommand.join(", ")}`);
  assert(!unknownInCommand.length, `scripts.test references unknown test files: ${unknownInCommand.join(", ")}`);
});

await check("HTML id bindings", () => {
  const html = readText("index.html");
  const appSource = readText("assets/js/app.js");
  const dynamicIds = new Set(["examDurationSelect", "examCountSelect"]);
  const ids = [...appSource.matchAll(/document\.getElementById\("([^"]+)"\)/g)].map((match) => match[1]);
  const missing = ids.filter((id) => !dynamicIds.has(id) && !html.includes(`id="${id}"`));

  assert(!missing.length, `Missing ids in index.html: ${missing.join(", ")}`);
});

await check("CSP baseline", () => {
  const html = readText("index.html");
  const cspMetaMatch = html.match(/<meta\s+[^>]*http-equiv="Content-Security-Policy"[^>]*content="([^"]+)"/i);

  assert(Boolean(cspMetaMatch), "Missing CSP meta tag.");

  const cspValue = cspMetaMatch[1];
  HTML_CSP_REQUIRED_DIRECTIVES.forEach((directive) => {
    assert(cspValue.includes(directive), `CSP is missing directive: ${directive}`);
  });

  assert(!cspValue.includes("'unsafe-eval'"), "CSP must not allow unsafe-eval.");
});

await check("JSON resources", () => {
  JSON.parse(readText("manifest.webmanifest"));
  JSON.parse(readText("assets/data/study-pack-template.json"));
  JSON.parse(readText("assets/data/backup-template.json"));
});

await check("Backup template validity", async () => {
  const contentUrl = pathToFileURL(path.join(rootDir, "assets/js/modules/content.js")).href;
  const validationUrl = pathToFileURL(path.join(rootDir, "assets/js/modules/validation.js")).href;
  const { buildContentPack, sanitizeCustomPack } = await import(contentUrl);
  const { validateBackupPayload } = await import(validationUrl);

  const templatePayload = JSON.parse(readText("assets/data/backup-template.json"));
  const customPack = sanitizeCustomPack(templatePayload.customPack ?? null);
  const contentPack = buildContentPack(customPack);
  const result = validateBackupPayload(templatePayload, contentPack);

  assert(
    result.valid,
    `assets/data/backup-template.json is invalid.\n${result.errors.map((message) => `- ${message}`).join("\n")}`
  );
});

await check("NPM script contracts", () => {
  const packageJson = JSON.parse(readText("package.json"));
  const scripts = packageJson?.scripts ?? {};

  const requiredQualityCommands = [
    "npm test",
    "npm run validate",
    "npm run content:gate",
    "npm run content:validate:pack",
    "npm run progress:validate:backup",
    "npm run size:check",
    "npm run package",
    "npm run smoke",
    "npm run smoke:dist",
    "npm run smoke:dist:browser",
    "npm run audit:a11y",
    "npm run visual:test"
  ];
  const requiredQuickCommands = [
    "npm test",
    "npm run validate",
    "npm run content:gate",
    "npm run content:validate:pack",
    "npm run progress:validate:backup",
    "npm run size:check"
  ];

  assert(typeof scripts.quality === "string", "package.json scripts.quality must be defined.");
  assert(typeof scripts["quality:quick"] === "string", "package.json scripts.quality:quick must be defined.");
  assert(typeof scripts["release:preflight"] === "string", "package.json scripts.release:preflight must be defined.");
  assert(
    scripts.smoke === "npm run smoke:http && npm run smoke:browser",
    "package.json scripts.smoke must chain smoke:http and smoke:browser."
  );

  requiredQualityCommands.forEach((command) => {
    assert(scripts.quality.includes(command), `scripts.quality is missing command: ${command}`);
  });

  requiredQuickCommands.forEach((command) => {
    assert(scripts["quality:quick"].includes(command), `scripts.quality:quick is missing command: ${command}`);
  });
});

await check("CSV pack builder", () => {
  const outputFile = "artifacts/generated-study-pack.validate.json";
  const outputPath = path.join(rootDir, outputFile);
  const result = spawnSync(process.execPath, [
    "scripts/build-study-pack-from-csv.mjs",
    "--input=assets/data/csv-template",
    `--output=${outputFile}`
  ], {
    cwd: rootDir,
    encoding: "utf8"
  });

  assert(
    result.status === 0,
    `CSV pack builder failed.\n${(result.stderr || result.stdout || "").trim()}`
  );

  JSON.parse(fs.readFileSync(outputPath, "utf8"));
  fs.rmSync(outputPath, { force: true });
});

await check("Service worker asset coverage", () => {
  const source = readText("service-worker.js");
  const matches = [...source.matchAll(/"\.\/([^"]+)"/g)].map((match) => match[1]);
  const assets = new Set(matches);
  const required = getExpectedPrecachePaths();

  required.forEach((asset) => {
    assert(assets.has(asset), `service-worker.js is missing cached asset: ${asset}`);
  });
});

await check("Service worker safety guards", () => {
  const source = readText("service-worker.js");

  assert(source.includes('if (url.origin !== ORIGIN)'), "service-worker.js must enforce same-origin caching guard.");
  assert(source.includes('if (request.mode === "navigate")'), "service-worker.js must separate navigation handling.");
  assert(source.includes("isCacheableNavigationResponse"), "service-worker.js must validate navigation responses before fallback caching.");
  assert(source.includes('contentType.includes("text/html")'), "service-worker.js navigation cache must be restricted to HTML responses.");
  assert(
    source.includes("const CACHE_NAME = `electro-study-lab-${cacheVer(PRE_CACHE_ASSETS)}`;"),
    "service-worker.js must derive CACHE_NAME from PRE_CACHE_ASSETS to avoid manual cache-version drift."
  );
  assert(source.includes("function cacheVer(assets)"), "service-worker.js must expose cache version helper.");
});

await check("Base content parity", async () => {
  const moduleUrl = pathToFileURL(path.join(rootDir, "assets/js/modules/content.js")).href;
  const { BASE_CONTENT } = await import(moduleUrl);
  const languages = ["uk", "de"];
  const arrayCollections = ["theory", "flashcards", "practiceProblems", "quizData", "checklistItems"];
  const idCollections = ["theory", "flashcards", "practiceProblems", "quizData"];

  languages.forEach((language) => {
    const content = BASE_CONTENT[language];
    assert(content && typeof content === "object", `Missing language pack: ${language}`);
    assert(content.flashcardsUi && typeof content.flashcardsUi === "object", `${language}.flashcardsUi must be an object.`);
    ["shuffle", "previous", "next", "flip", "frontHint", "backHint", "counter", "status"].forEach((key) => {
      assert(typeof content.flashcardsUi[key] === "string", `${language}.flashcardsUi.${key} must be a string.`);
    });

    arrayCollections.forEach((collectionName) => {
      assert(Array.isArray(content[collectionName]), `${language}.${collectionName} must be an array.`);
    });

    idCollections.forEach((collectionName) => {
      assertUniqueIds(content[collectionName], `${language}.${collectionName}`);
      assertTopicCoverage(language, collectionName, content[collectionName], content.topicLabels);
    });

    content.quizData.forEach((item) => {
      assert(Array.isArray(item.opts) && item.opts.length === 4, `${language}.quizData:${item.id} must have 4 options.`);
      assert(Number.isInteger(item.correct) && item.correct >= 0 && item.correct < 4, `${language}.quizData:${item.id} has invalid correct index.`);
    });
  });

  arrayCollections.forEach((collectionName) => {
    assert(
      BASE_CONTENT.uk[collectionName].length === BASE_CONTENT.de[collectionName].length,
      `${collectionName} length differs between uk and de.`
    );
  });

  idCollections.forEach((collectionName) => {
    const ukIds = BASE_CONTENT.uk[collectionName].map((item) => item.id).join("|");
    const deIds = BASE_CONTENT.de[collectionName].map((item) => item.id).join("|");
    assert(ukIds === deIds, `${collectionName} ids differ between uk and de.`);
  });

  const ukTopics = Object.keys(BASE_CONTENT.uk.topicLabels).sort().join("|");
  const deTopics = Object.keys(BASE_CONTENT.de.topicLabels).sort().join("|");
  assert(ukTopics === deTopics, "Topic labels differ between uk and de.");
});

if (failures.length) {
  process.exitCode = 1;
} else {
  console.log("All validation checks passed.");
}

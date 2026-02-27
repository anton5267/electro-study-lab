import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";

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
    "assets/js/modules/progress-state.js",
    "assets/js/modules/runtime.js",
    "assets/js/modules/storage.js",
    "assets/js/modules/study-helpers.js",
    "assets/js/modules/templates.js",
    "assets/js/modules/validation.js",
    "assets/js/modules/utils.js",
    "scripts/dev-server.mjs",
    "scripts/package-site.mjs",
    "scripts/audit-accessibility.mjs",
    "scripts/smoke-browser.mjs",
    "scripts/smoke-dist.mjs",
    "scripts/smoke-dist-browser.mjs",
    "scripts/smoke-http.mjs",
    "scripts/visual-regression.mjs",
    "scripts/test-runtime.mjs",
    "scripts/test-progress-state.mjs",
    "scripts/test-assessment-state.mjs",
    "scripts/test-validation.mjs",
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

await check("HTML id bindings", () => {
  const html = readText("index.html");
  const appSource = readText("assets/js/app.js");
  const dynamicIds = new Set(["examDurationSelect", "examCountSelect"]);
  const ids = [...appSource.matchAll(/document\.getElementById\("([^"]+)"\)/g)].map((match) => match[1]);
  const missing = ids.filter((id) => !dynamicIds.has(id) && !html.includes(`id="${id}"`));

  assert(!missing.length, `Missing ids in index.html: ${missing.join(", ")}`);
});

await check("JSON resources", () => {
  JSON.parse(readText("manifest.webmanifest"));
  JSON.parse(readText("assets/data/study-pack-template.json"));
});

await check("Service worker asset coverage", () => {
  const source = readText("service-worker.js");
  const matches = [...source.matchAll(/"\.\/([^"]+)"/g)].map((match) => match[1]);
  const assets = new Set(matches);
  const required = [
    "index.html",
    "manifest.webmanifest",
    "assets/css/main.css",
    "assets/js/app.js",
    "assets/js/modules/content.js",
    "assets/js/modules/assessment-state.js",
    "assets/js/modules/progress-state.js",
    "assets/js/modules/runtime.js",
    "assets/js/modules/study-helpers.js",
    "assets/js/modules/storage.js",
    "assets/js/modules/templates.js",
    "assets/js/modules/validation.js",
    "assets/js/modules/utils.js",
    "assets/data/study-pack-template.json",
    "assets/icons/icon-192.svg",
    "assets/icons/icon-512.svg"
  ];

  required.forEach((asset) => {
    assert(assets.has(asset), `service-worker.js is missing cached asset: ${asset}`);
  });
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

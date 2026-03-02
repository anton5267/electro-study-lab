import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { buildContentPack, sanitizeCustomPack } from "../assets/js/modules/content.js";
import { migrateBackupPayload } from "../assets/js/modules/progress-state.js";
import { validateBackupPayload } from "../assets/js/modules/validation.js";

const MAX_IMPORT_FILE_SIZE_BYTES = 1 * 1024 * 1024;
const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(scriptDir, "..");

try {
  main();
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const report = validateBackupFile(args.file);

  if (args.json) {
    console.log(JSON.stringify(report, null, 2));
    if (!report.valid) {
      process.exitCode = 1;
    }
    return;
  }

  if (!report.valid) {
    throw new Error(report.error);
  }

  console.log(`Backup payload is valid: ${report.file}`);
  printSummary(report.summary);
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

function validateBackupFile(rawFilePath) {
  const targetPath = typeof rawFilePath === "string" && rawFilePath.trim()
    ? rawFilePath
    : "assets/data/backup-template.json";
  const absolutePath = path.resolve(rootDir, targetPath);
  const relativePath = path.relative(rootDir, absolutePath) || path.basename(absolutePath);

  if (!fs.existsSync(absolutePath)) {
    return {
      valid: false,
      file: relativePath,
      error: `Backup file not found: ${relativePath}`
    };
  }

  const fileSize = fs.statSync(absolutePath).size;
  if (fileSize > MAX_IMPORT_FILE_SIZE_BYTES) {
    return {
      valid: false,
      file: relativePath,
      error: `File is too large (${fileSize} bytes). Max allowed: ${MAX_IMPORT_FILE_SIZE_BYTES} bytes.`
    };
  }

  let rawPayload;
  try {
    rawPayload = JSON.parse(fs.readFileSync(absolutePath, "utf8"));
  } catch (error) {
    return {
      valid: false,
      file: relativePath,
      error: `Invalid JSON in ${relativePath}.`
    };
  }

  const payload = migrateBackupPayload(rawPayload);
  const customPack = sanitizeCustomPack(payload?.customPack ?? null);
  const contentPack = buildContentPack(customPack);
  const validation = validateBackupPayload(payload, contentPack);

  if (!validation.valid) {
    return {
      valid: false,
      file: relativePath,
      errors: validation.errors,
      error: `Backup payload is invalid:\n${validation.errors.map((message) => `- ${message}`).join("\n")}`
    };
  }

  return {
    valid: true,
    file: relativePath,
    summary: buildSummary(payload)
  };
}

function buildSummary(payload) {
  const progress = payload?.progress ?? {};
  return {
    language: typeof payload?.language === "string" ? payload.language : null,
    checklist: Array.isArray(progress.checklist) ? progress.checklist.length : 0,
    seenCards: Array.isArray(progress.seenCards) ? progress.seenCards.length : 0,
    practiceSolved: Array.isArray(progress.practiceSolved) ? progress.practiceSolved.length : 0,
    quizMastered: Array.isArray(progress.quizMastered) ? progress.quizMastered.length : 0,
    reviewQueue: Array.isArray(progress.reviewQueue) ? progress.reviewQueue.length : 0
  };
}

function printSummary(summary) {
  console.log(
    `language=${summary.language ?? "n/a"}, checklist=${summary.checklist}, seenCards=${summary.seenCards}, practiceSolved=${summary.practiceSolved}, quizMastered=${summary.quizMastered}, reviewQueue=${summary.reviewQueue}`
  );
}

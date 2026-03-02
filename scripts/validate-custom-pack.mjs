import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { BASE_CONTENT } from "../assets/js/modules/content.js";
import { validateCustomPack } from "../assets/js/modules/validation.js";

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
  const report = validatePackFile(args.file);

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

  console.log(`Custom pack is valid: ${report.file}`);
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

function validatePackFile(rawFilePath) {
  const targetPath = typeof rawFilePath === "string" && rawFilePath.trim()
    ? rawFilePath
    : "assets/data/study-pack-template.json";
  const absolutePath = path.resolve(rootDir, targetPath);
  const relativePath = path.relative(rootDir, absolutePath) || path.basename(absolutePath);

  if (!fs.existsSync(absolutePath)) {
    return {
      valid: false,
      file: relativePath,
      error: `Custom pack file not found: ${relativePath}`
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

  let pack;
  try {
    pack = JSON.parse(fs.readFileSync(absolutePath, "utf8"));
  } catch (error) {
    return {
      valid: false,
      file: relativePath,
      error: `Invalid JSON in ${relativePath}.`
    };
  }

  const validation = validateCustomPack(pack, BASE_CONTENT);
  if (!validation.valid) {
    return {
      valid: false,
      file: relativePath,
      errors: validation.errors,
      error: `Custom pack is invalid:\n${validation.errors.map((message) => `- ${message}`).join("\n")}`
    };
  }

  return {
    valid: true,
    file: relativePath,
    summary: buildSummary(pack)
  };
}

function buildSummary(pack) {
  const summary = {};

  ["uk", "de"].forEach((language) => {
    const languagePack = pack?.[language];
    if (!languagePack || typeof languagePack !== "object" || Array.isArray(languagePack)) {
      return;
    }

    const theory = Array.isArray(languagePack.theory) ? languagePack.theory.length : 0;
    const flashcards = Array.isArray(languagePack.flashcards) ? languagePack.flashcards.length : 0;
    const practice = Array.isArray(languagePack.practiceProblems) ? languagePack.practiceProblems.length : 0;
    const quiz = Array.isArray(languagePack.quizData) ? languagePack.quizData.length : 0;
    const checklist = Array.isArray(languagePack.checklistItems) ? languagePack.checklistItems.length : 0;

    summary[language] = {
      theory,
      flashcards,
      practice,
      quiz,
      checklist
    };
  });

  return summary;
}

function printSummary(summary) {
  Object.entries(summary).forEach(([language, values]) => {
    console.log(
      `[${language}] theory=${values.theory}, flashcards=${values.flashcards}, practice=${values.practice}, quiz=${values.quiz}, checklist=${values.checklist}`
    );
  });
}

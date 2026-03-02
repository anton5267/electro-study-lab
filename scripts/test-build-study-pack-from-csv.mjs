import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const QUIZ_HEADER = "id,topic,q,opt1,opt2,opt3,opt4,correct,explanation";
const PRACTICE_HEADER = "id,topic,prompt,answer,tolerance,explanation";
const FLASHCARD_HEADER = "id,topic,term,def";

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "electro-csv-builder-test-"));

try {
  runValidBuildCase();
  runDuplicateIdCase();
  runLanguageMismatchCase();
  runLanguageOrderIndependenceCase();
  runArgsWithEqualsPathCase();
  runInvalidHeaderCase();
  runInvalidColumnCountCase();
  runMalformedQuoteCase();
  console.log("CSV builder tests passed.");
} finally {
  fs.rmSync(tempDir, { recursive: true, force: true });
}

function runValidBuildCase() {
  const inputDir = path.join(tempDir, "valid");
  const outputPath = path.join(tempDir, "valid-pack.json");
  seedMinimalCsv(inputDir);

  const result = runBuilder(inputDir, outputPath);
  assert.equal(result.status, 0, `Valid CSV build failed:\n${result.stderr || result.stdout}`);

  const payload = JSON.parse(fs.readFileSync(outputPath, "utf8"));
  assert.equal(payload.uk.quizData[0].id, "ext-qq-201");
  assert.equal(payload.de.practiceProblems[0].id, "ext-pp-201");
}

function runDuplicateIdCase() {
  const inputDir = path.join(tempDir, "duplicate-id");
  const outputPath = path.join(tempDir, "duplicate-pack.json");
  seedMinimalCsv(inputDir);

  writeFile(path.join(inputDir, "uk.quiz.csv"), [
    QUIZ_HEADER,
    "dup-qq,safety,Питання 1,A,B,C,D,0,Пояснення 1",
    "dup-qq,safety,Питання 2,A,B,C,D,1,Пояснення 2"
  ].join("\n"));

  const result = runBuilder(inputDir, outputPath);
  assert.notEqual(result.status, 0, "Duplicate ID case must fail.");
  assert(matchOutput(result, "Duplicate id"), "Duplicate ID error was not reported.");
}

function runLanguageMismatchCase() {
  const inputDir = path.join(tempDir, "language-mismatch");
  const outputPath = path.join(tempDir, "language-mismatch-pack.json");
  seedMinimalCsv(inputDir);

  writeFile(path.join(inputDir, "de.quiz.csv"), [
    QUIZ_HEADER,
    "other-qq-201,safety,Kontrollfrage?,A,B,C,D,1,Erklaerung"
  ].join("\n"));

  const strictResult = runBuilder(inputDir, outputPath);
  assert.notEqual(strictResult.status, 0, "Language mismatch case must fail by default.");
  assert(matchOutput(strictResult, "Language parity mismatch"), "Language mismatch error was not reported.");

  const allowedResult = runBuilder(inputDir, outputPath, ["--allow-language-mismatch"]);
  assert.equal(allowedResult.status, 0, `Language mismatch should pass with override:\n${allowedResult.stderr || allowedResult.stdout}`);
}

function runLanguageOrderIndependenceCase() {
  const inputDir = path.join(tempDir, "language-order");
  const outputPath = path.join(tempDir, "language-order-pack.json");
  seedMinimalCsv(inputDir);

  writeFile(path.join(inputDir, "uk.quiz.csv"), [
    QUIZ_HEADER,
    "ext-qq-201,safety,Питання 201,A,B,C,D,1,Пояснення 201",
    "ext-qq-202,safety,Питання 202,A,B,C,D,2,Пояснення 202"
  ].join("\n"));

  writeFile(path.join(inputDir, "de.quiz.csv"), [
    QUIZ_HEADER,
    "ext-qq-202,safety,Frage 202,A,B,C,D,2,Erklaerung 202",
    "ext-qq-201,safety,Frage 201,A,B,C,D,1,Erklaerung 201"
  ].join("\n"));

  const result = runBuilder(inputDir, outputPath);
  assert.equal(result.status, 0, `Language parity must ignore row order:\n${result.stderr || result.stdout}`);
}

function runArgsWithEqualsPathCase() {
  const inputDir = path.join(tempDir, "equals-path");
  const outputPath = path.join(tempDir, "generated=pack.json");
  seedMinimalCsv(inputDir);

  const result = runBuilder(inputDir, outputPath);
  assert.equal(result.status, 0, `Builder should support '=' in output path:\n${result.stderr || result.stdout}`);
  assert.equal(fs.existsSync(outputPath), true, "Builder did not create output file for '=' path.");
}

function runInvalidHeaderCase() {
  const inputDir = path.join(tempDir, "invalid-header");
  const outputPath = path.join(tempDir, "invalid-header-pack.json");
  seedMinimalCsv(inputDir);

  writeFile(path.join(inputDir, "uk.practice.csv"), [
    "id,topic,task,answer,tolerance,explanation",
    "ext-pp-201,measurement,Обчисли I,2.3,0.01,Пояснення"
  ].join("\n"));

  const result = runBuilder(inputDir, outputPath);
  assert.notEqual(result.status, 0, "Invalid header case must fail.");
  assert(matchOutput(result, "Invalid header"), "Header validation error was not reported.");
}

function runInvalidColumnCountCase() {
  const inputDir = path.join(tempDir, "invalid-column-count");
  const outputPath = path.join(tempDir, "invalid-column-count-pack.json");
  seedMinimalCsv(inputDir);

  writeFile(path.join(inputDir, "uk.flashcards.csv"), [
    FLASHCARD_HEADER,
    "ext-fc-201,switching,Термін,Визначення,зайва колонка"
  ].join("\n"));

  const result = runBuilder(inputDir, outputPath);
  assert.notEqual(result.status, 0, "Invalid column count case must fail.");
  assert(matchOutput(result, "Invalid column count"), "Column-count validation error was not reported.");
}

function runMalformedQuoteCase() {
  const inputDir = path.join(tempDir, "malformed-quote");
  const outputPath = path.join(tempDir, "malformed-quote-pack.json");
  seedMinimalCsv(inputDir);

  writeFile(path.join(inputDir, "uk.quiz.csv"), [
    QUIZ_HEADER,
    "ext-qq-201,safety,\"Незакрите питання,A,B,C,D,1,Пояснення"
  ].join("\n"));

  const result = runBuilder(inputDir, outputPath);
  assert.notEqual(result.status, 0, "Malformed quote case must fail.");
  assert(matchOutput(result, "Malformed CSV"), "Malformed CSV error was not reported.");
}

function seedMinimalCsv(inputDir) {
  writeFile(path.join(inputDir, "uk.quiz.csv"), [
    QUIZ_HEADER,
    "ext-qq-201,safety,Контрольне питання?,A,B,C,D,1,Пояснення"
  ].join("\n"));

  writeFile(path.join(inputDir, "de.quiz.csv"), [
    QUIZ_HEADER,
    "ext-qq-201,safety,Kontrollfrage?,A,B,C,D,1,Erklaerung"
  ].join("\n"));

  writeFile(path.join(inputDir, "uk.practice.csv"), [
    PRACTICE_HEADER,
    "ext-pp-201,measurement,Обчисли I,2.3,0.01,Пояснення"
  ].join("\n"));

  writeFile(path.join(inputDir, "de.practice.csv"), [
    PRACTICE_HEADER,
    "ext-pp-201,measurement,Berechne I,2.3,0.01,Erklaerung"
  ].join("\n"));

  writeFile(path.join(inputDir, "uk.flashcards.csv"), [
    FLASHCARD_HEADER,
    "ext-fc-201,switching,Термін,Визначення"
  ].join("\n"));

  writeFile(path.join(inputDir, "de.flashcards.csv"), [
    FLASHCARD_HEADER,
    "ext-fc-201,switching,Begriff,Definition"
  ].join("\n"));
}

function writeFile(filePath, content) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${content}\n`, "utf8");
}

function runBuilder(inputDir, outputPath, extraArgs = []) {
  return spawnSync(process.execPath, [
    "scripts/build-study-pack-from-csv.mjs",
    `--input=${inputDir}`,
    `--output=${outputPath}`,
    ...extraArgs
  ], {
    cwd: rootDir,
    encoding: "utf8"
  });
}

function matchOutput(result, pattern) {
  const haystack = `${result.stdout || ""}\n${result.stderr || ""}`;
  return haystack.includes(pattern);
}

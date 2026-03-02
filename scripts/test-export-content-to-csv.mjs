import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outputDir = path.join(os.tmpdir(), `electro-content-export-${Date.now()}`);

try {
  const result = spawnSync(process.execPath, [
    "scripts/export-content-to-csv.mjs",
    `--output=${outputDir}`
  ], {
    cwd: rootDir,
    encoding: "utf8"
  });

  assert.equal(result.status, 0, `CSV export failed:\n${result.stderr || result.stdout}`);

  const expectedFiles = [
    "uk.quiz.csv",
    "uk.practice.csv",
    "uk.flashcards.csv",
    "uk.checklist.txt",
    "de.quiz.csv",
    "de.practice.csv",
    "de.flashcards.csv",
    "de.checklist.txt"
  ];

  expectedFiles.forEach((name) => {
    const fullPath = path.join(outputDir, name);
    assert(fs.existsSync(fullPath), `Missing exported file: ${name}`);
    assert(fs.statSync(fullPath).size > 0, `Exported file is empty: ${name}`);
  });

  const quizHeader = fs.readFileSync(path.join(outputDir, "uk.quiz.csv"), "utf8").split(/\r?\n/)[0];
  const practiceHeader = fs.readFileSync(path.join(outputDir, "uk.practice.csv"), "utf8").split(/\r?\n/)[0];
  const flashcardsHeader = fs.readFileSync(path.join(outputDir, "uk.flashcards.csv"), "utf8").split(/\r?\n/)[0];

  assert.equal(quizHeader, "id,topic,q,opt1,opt2,opt3,opt4,correct,explanation");
  assert.equal(practiceHeader, "id,topic,prompt,answer,tolerance,explanation");
  assert.equal(flashcardsHeader, "id,topic,term,def");

  const prefixedDir = path.join(outputDir, "prefixed");
  const prefixedResult = spawnSync(process.execPath, [
    "scripts/export-content-to-csv.mjs",
    `--output=${prefixedDir}`,
    "--id-prefix=ext-"
  ], {
    cwd: rootDir,
    encoding: "utf8"
  });

  assert.equal(prefixedResult.status, 0, `Prefixed CSV export failed:\n${prefixedResult.stderr || prefixedResult.stdout}`);
  const firstQuizDataRow = fs.readFileSync(path.join(prefixedDir, "uk.quiz.csv"), "utf8").split(/\r?\n/)[1] || "";
  assert(firstQuizDataRow.startsWith("ext-"), "Prefixed export must prepend id-prefix to IDs.");

  console.log("Content CSV export tests passed.");
} finally {
  fs.rmSync(outputDir, { recursive: true, force: true });
}

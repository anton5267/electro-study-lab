import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "electro-validate-backup-test-"));

try {
  runDefaultTemplateCase();
  runValidBackupCase();
  runFilePathWithEqualsCase();
  runValidBackupJsonCase();
  runInvalidJsonCase();
  runInvalidSchemaCase();
  runMissingFileCase();
  runTooLargeCase();
  console.log("Backup payload validation CLI tests passed.");
} finally {
  fs.rmSync(tempDir, { recursive: true, force: true });
}

function runDefaultTemplateCase() {
  const result = runValidatorWithArgs([]);
  assert.equal(result.status, 0, `Default backup template should pass:\n${result.stderr || result.stdout}`);
  assert(matchOutput(result, "Backup payload is valid"), "Default backup template success message is missing.");
}

function runValidBackupCase() {
  const filePath = path.join(tempDir, "valid-backup.json");
  writeJson(filePath, {
    version: 1,
    savedAt: "2026-03-02T10:00:00.000Z",
    language: "uk",
    progress: {
      checklist: [0, 1],
      seenCards: [0],
      practiceSolved: ["pp-1"],
      quizMastered: ["qq-1"],
      reviewQueue: ["qq-2"]
    }
  });

  const result = runValidatorWithArgs([`--file=${filePath}`]);
  assert.equal(result.status, 0, `Valid backup should pass:\n${result.stderr || result.stdout}`);
  assert(matchOutput(result, "Backup payload is valid"), "Valid backup success message is missing.");
}

function runValidBackupJsonCase() {
  const filePath = path.join(tempDir, "valid-backup-json.json");
  writeJson(filePath, {
    language: "uk",
    progress: {
      checklist: [0],
      seenCards: [1]
    }
  });

  const result = runValidatorWithArgs([`--file=${filePath}`, "--json"]);
  assert.equal(result.status, 0, `Valid backup JSON mode should pass:\n${result.stderr || result.stdout}`);

  const payload = JSON.parse(String(result.stdout || "{}"));
  assert.equal(payload.valid, true);
  assert.equal(typeof payload.summary?.checklist, "number");
}

function runFilePathWithEqualsCase() {
  const filePath = path.join(tempDir, "valid=backup.json");
  writeJson(filePath, {
    language: "uk",
    progress: {
      checklist: [],
      seenCards: []
    }
  });

  const result = runValidatorWithArgs([`--file=${filePath}`]);
  assert.equal(result.status, 0, `Backup path with '=' should pass:\n${result.stderr || result.stdout}`);
  assert(matchOutput(result, "Backup payload is valid"), "Path with '=' did not return backup success message.");
}

function runInvalidJsonCase() {
  const filePath = path.join(tempDir, "invalid-backup-json.json");
  fs.writeFileSync(filePath, "{\"progress\": ", "utf8");

  const result = runValidatorWithArgs([`--file=${filePath}`]);
  assert.notEqual(result.status, 0, "Invalid JSON backup case must fail.");
  assert(matchOutput(result, "Invalid JSON"), "Invalid JSON backup error message is missing.");
}

function runInvalidSchemaCase() {
  const filePath = path.join(tempDir, "invalid-backup-schema.json");
  writeJson(filePath, {
    version: 1,
    language: "uk",
    progress: {
      checklist: ["bad-index"]
    }
  });

  const result = runValidatorWithArgs([`--file=${filePath}`]);
  assert.notEqual(result.status, 0, "Invalid schema backup case must fail.");
  assert(matchOutput(result, "Backup payload is invalid"), "Invalid backup schema error message is missing.");
}

function runMissingFileCase() {
  const filePath = path.join(tempDir, "missing-backup.json");
  const result = runValidatorWithArgs([`--file=${filePath}`]);
  assert.notEqual(result.status, 0, "Missing backup file case must fail.");
  assert(matchOutput(result, "Backup file not found"), "Missing backup file error message is missing.");
}

function runTooLargeCase() {
  const filePath = path.join(tempDir, "too-large-backup.json");
  const oversized = "a".repeat(1_049_000);
  writeJson(filePath, {
    progress: {
      checklist: [],
      notes: oversized
    }
  });

  const result = runValidatorWithArgs([`--file=${filePath}`]);
  assert.notEqual(result.status, 0, "Too-large backup file case must fail.");
  assert(matchOutput(result, "File is too large"), "Too-large backup file error message is missing.");
}

function runValidatorWithArgs(args) {
  return spawnSync(process.execPath, ["scripts/validate-backup-payload.mjs", ...args], {
    cwd: rootDir,
    encoding: "utf8"
  });
}

function writeJson(filePath, payload) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
}

function matchOutput(result, pattern) {
  const output = `${result.stdout || ""}\n${result.stderr || ""}`;
  return output.includes(pattern);
}

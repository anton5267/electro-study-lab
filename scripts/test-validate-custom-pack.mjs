import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "electro-validate-pack-test-"));

try {
  runValidPackCase();
  runValidPackJsonCase();
  runFilePathWithEqualsCase();
  runInvalidSchemaJsonCase();
  runInvalidJsonCase();
  runInvalidSchemaCase();
  runMissingFileCase();
  runTooLargeCase();
  console.log("Custom pack validation CLI tests passed.");
} finally {
  fs.rmSync(tempDir, { recursive: true, force: true });
}

function runValidPackCase() {
  const filePath = path.join(tempDir, "valid-pack.json");
  writeJson(filePath, {
    uk: {
      flashcards: [
        {
          id: "ext-fc-9001",
          topic: "safety",
          term: "Тестовий термін",
          def: "Тестове визначення"
        }
      ]
    }
  });

  const result = runValidator(filePath);
  assert.equal(result.status, 0, `Valid pack should pass:\n${result.stderr || result.stdout}`);
  assert(matchOutput(result, "Custom pack is valid"), "Valid-pack success message is missing.");
}

function runValidPackJsonCase() {
  const filePath = path.join(tempDir, "valid-pack-json.json");
  writeJson(filePath, {
    uk: {
      flashcards: [
        {
          id: "ext-fc-9003",
          topic: "safety",
          term: "Термін JSON",
          def: "Визначення JSON"
        }
      ]
    }
  });

  const result = runValidatorWithArgs([`--file=${filePath}`, "--json"]);
  assert.equal(result.status, 0, `Valid JSON mode should pass:\n${result.stderr || result.stdout}`);

  const payload = JSON.parse(String(result.stdout || "{}"));
  assert.equal(payload.valid, true, "JSON mode must report valid=true for valid pack.");
  assert.equal(typeof payload.file, "string");
  assert.equal(typeof payload.summary?.uk?.flashcards, "number");
}

function runInvalidJsonCase() {
  const filePath = path.join(tempDir, "invalid-json-pack.json");
  fs.writeFileSync(filePath, "{\"uk\": {\"flashcards\": [}", "utf8");

  const result = runValidator(filePath);
  assert.notEqual(result.status, 0, "Invalid JSON case must fail.");
  assert(matchOutput(result, "Invalid JSON"), "Invalid JSON error message is missing.");
}

function runFilePathWithEqualsCase() {
  const filePath = path.join(tempDir, "valid=pack.json");
  writeJson(filePath, {
    uk: {
      flashcards: [
        {
          id: "ext-fc-9002",
          topic: "safety",
          term: "Термін 2",
          def: "Визначення 2"
        }
      ]
    }
  });

  const result = runValidator(filePath);
  assert.equal(result.status, 0, `Path with '=' should pass:\n${result.stderr || result.stdout}`);
  assert(matchOutput(result, "Custom pack is valid"), "Path with '=' did not return success message.");
}

function runInvalidSchemaJsonCase() {
  const filePath = path.join(tempDir, "invalid-schema-pack-json.json");
  writeJson(filePath, {
    fr: {}
  });

  const result = runValidatorWithArgs([`--file=${filePath}`, "--json"]);
  assert.notEqual(result.status, 0, "Invalid schema JSON mode must fail.");

  const payload = JSON.parse(String(result.stdout || "{}"));
  assert.equal(payload.valid, false, "JSON mode must report valid=false for invalid pack.");
  assert(Array.isArray(payload.errors) && payload.errors.length > 0, "JSON mode must expose validation errors.");
}

function runInvalidSchemaCase() {
  const filePath = path.join(tempDir, "invalid-schema-pack.json");
  writeJson(filePath, {
    fr: {}
  });

  const result = runValidator(filePath);
  assert.notEqual(result.status, 0, "Invalid schema case must fail.");
  assert(matchOutput(result, "Custom pack is invalid"), "Schema validation error message is missing.");
}

function runMissingFileCase() {
  const missingPath = path.join(tempDir, "missing-pack.json");
  const result = runValidator(missingPath);
  assert.notEqual(result.status, 0, "Missing-file case must fail.");
  assert(matchOutput(result, "Custom pack file not found"), "Missing-file error message is missing.");
}

function runTooLargeCase() {
  const filePath = path.join(tempDir, "too-large-pack.json");
  const oversizedChecklist = "a".repeat(1_049_000);
  writeJson(filePath, {
    uk: {
      checklistItems: [oversizedChecklist]
    }
  });

  const result = runValidator(filePath);
  assert.notEqual(result.status, 0, "Too-large file case must fail.");
  assert(matchOutput(result, "File is too large"), "File size guard error message is missing.");
}

function runValidator(filePath) {
  return runValidatorWithArgs([`--file=${filePath}`]);
}

function runValidatorWithArgs(args) {
  return spawnSync(process.execPath, ["scripts/validate-custom-pack.mjs", ...args], {
    cwd: rootDir,
    encoding: "utf8"
  });
}

function writeJson(filePath, payload) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
}

function matchOutput(result, pattern) {
  const haystack = `${result.stdout || ""}\n${result.stderr || ""}`;
  return haystack.includes(pattern);
}

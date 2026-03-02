import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

import { BASE_CONTENT } from "../assets/js/modules/content.js";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "electro-content-roundtrip-"));
const exportDir = path.join(tempRoot, "export");
const outputPack = path.join(tempRoot, "generated-pack.json");

try {
  const exportResult = spawnSync(process.execPath, [
    "scripts/export-content-to-csv.mjs",
    `--output=${exportDir}`,
    "--id-prefix=ext-"
  ], {
    cwd: rootDir,
    encoding: "utf8"
  });

  assert.equal(exportResult.status, 0, `CSV export failed:\n${exportResult.stderr || exportResult.stdout}`);

  const buildResult = spawnSync(process.execPath, [
    "scripts/build-study-pack-from-csv.mjs",
    `--input=${exportDir}`,
    `--output=${outputPack}`
  ], {
    cwd: rootDir,
    encoding: "utf8"
  });

  assert.equal(buildResult.status, 0, `CSV build failed:\n${buildResult.stderr || buildResult.stdout}`);

  const payload = JSON.parse(fs.readFileSync(outputPack, "utf8"));
  ["uk", "de"].forEach((language) => {
    const generated = payload[language];
    const base = BASE_CONTENT[language];

    assert(generated, `Missing language pack in generated payload: ${language}`);
    assert.equal(generated.quizData.length, base.quizData.length, `${language}: quiz length mismatch after roundtrip`);
    assert.equal(generated.practiceProblems.length, base.practiceProblems.length, `${language}: practice length mismatch after roundtrip`);
    assert.equal(generated.flashcards.length, base.flashcards.length, `${language}: flashcards length mismatch after roundtrip`);
    assert.equal(generated.checklistItems.length, base.checklistItems.length, `${language}: checklist length mismatch after roundtrip`);

    assert(
      generated.quizData.every((item) => item.id.startsWith("ext-")),
      `${language}: expected all quiz ids to contain id-prefix`
    );
  });

  console.log("Content CSV roundtrip tests passed.");
} finally {
  fs.rmSync(tempRoot, { recursive: true, force: true });
}

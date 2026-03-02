import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

{
  const pass = runWorkbench([
    "--enforce",
    "--min-topics=1",
    "--min-theory=1",
    "--min-flashcards=1",
    "--min-practice=1",
    "--min-quiz=1",
    "--min-checklist=1",
    "--min-topic-theory=1",
    "--min-topic-flashcards=1",
    "--min-topic-practice=1",
    "--min-topic-quiz=1",
    "--min-complexity-quiz-medium=0",
    "--min-complexity-quiz-long=0",
    "--min-complexity-practice-strict=0",
    "--min-complexity-practice-relaxed=0"
  ]);

  assert.equal(pass.status, 0, `Workbench should pass with low thresholds:\n${pass.stderr || pass.stdout}`);
}

{
  const fail = runWorkbench([
    "--enforce",
    "--min-topics=99",
    "--min-theory=999",
    "--min-flashcards=999",
    "--min-practice=999",
    "--min-quiz=999",
    "--min-checklist=999",
    "--min-topic-theory=999",
    "--min-topic-flashcards=999",
    "--min-topic-practice=999",
    "--min-topic-quiz=999",
    "--min-complexity-quiz-medium=999",
    "--min-complexity-quiz-long=999",
    "--min-complexity-practice-strict=999",
    "--min-complexity-practice-relaxed=999"
  ]);

  assert.notEqual(fail.status, 0, "Workbench must fail with unrealistic thresholds.");
  const output = `${fail.stdout || ""}\n${fail.stderr || ""}`;
  assert(output.includes("Content workbench found issues"), "Failure output should include issues summary.");
}

{
  const json = runWorkbench(["--json"]);
  assert.equal(json.status, 0, `Workbench JSON mode should pass:\n${json.stderr || json.stdout}`);
  const payload = JSON.parse(json.stdout);
  assert.equal(typeof payload.metrics.uk.counts.quizData, "number");
  assert.equal(typeof payload.metrics.de.byTopic.safety.quizData, "number");
  assert.equal(typeof payload.metrics.uk.complexity.quizMedium, "number");
  assert.equal(typeof payload.options.complexityMinimums.quizLong, "number");
}

console.log("Content workbench tests passed.");

function runWorkbench(args) {
  return spawnSync(process.execPath, ["scripts/content-workbench.mjs", ...args], {
    cwd: rootDir,
    encoding: "utf8"
  });
}

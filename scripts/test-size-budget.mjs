import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

{
  const pass = runBudget([
    "--max-app-js=1000000",
    "--max-content-js=1000000",
    "--max-templates-js=1000000",
    "--max-sw-js=1000000",
    "--max-main-css=1000000",
    "--max-total-js=1000000"
  ]);

  assert.equal(pass.status, 0, `Size budget should pass with generous limits:\n${pass.stderr || pass.stdout}`);
}

{
  const fail = runBudget([
    "--max-app-js=1",
    "--max-content-js=1",
    "--max-templates-js=1",
    "--max-sw-js=1",
    "--max-main-css=1",
    "--max-total-js=1"
  ]);

  assert.notEqual(fail.status, 0, "Size budget must fail with tiny limits.");
  const output = `${fail.stdout || ""}\n${fail.stderr || ""}`;
  assert(output.includes("Size budget exceeded"), "Failure output should mention exceeded budget.");
}

{
  const jsonResult = runBudget(["--json"]);
  assert.equal(jsonResult.status, 0, `JSON output mode should pass:\n${jsonResult.stderr || jsonResult.stdout}`);
  const payload = JSON.parse(jsonResult.stdout);
  assert.equal(typeof payload.targets.appJs, "number");
  assert.equal(typeof payload.limits.totalJs, "number");
  assert.equal(Array.isArray(payload.warnings), true);
  assert.equal(typeof payload.warningThresholdPct, "number");
}

{
  const baseline = JSON.parse(runBudget(["--json"]).stdout);
  const nearLimit = runBudget([
    `--max-app-js=${baseline.targets.appJs + 10}`,
    "--max-content-js=1000000",
    "--max-templates-js=1000000",
    "--max-sw-js=1000000",
    "--max-main-css=1000000",
    "--max-total-js=1000000",
    "--warn-threshold-pct=10"
  ]);

  assert.equal(nearLimit.status, 0, `Near-limit case should still pass:\n${nearLimit.stderr || nearLimit.stdout}`);
  assert((nearLimit.stdout || "").includes("Size budget warnings"), "Near-limit case should print warnings.");
}

{
  const invalidWarnThreshold = runBudget(["--warn-threshold-pct=200"]);
  assert.notEqual(invalidWarnThreshold.status, 0, "Invalid warning threshold must fail.");
  const output = `${invalidWarnThreshold.stdout || ""}\n${invalidWarnThreshold.stderr || ""}`;
  assert(output.includes("Invalid numeric value for warn-threshold-pct"), "Invalid warn-threshold error message is missing.");
}

console.log("Size budget tests passed.");

function runBudget(args) {
  return spawnSync(process.execPath, ["scripts/check-size-budget.mjs", ...args], {
    cwd: rootDir,
    encoding: "utf8"
  });
}

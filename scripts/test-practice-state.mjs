import assert from "node:assert/strict";

import {
  evaluatePracticeAnswer,
  resolvePracticeAttempt
} from "../assets/js/modules/practice-state.js";

{
  const result = evaluatePracticeAnswer("", 12, 0.1);
  assert.deepEqual(result, { answered: false, correct: false });
}

{
  const result = evaluatePracticeAnswer("12.05", 12, 0.1);
  assert.deepEqual(result, { answered: true, correct: true });
}

{
  const result = evaluatePracticeAnswer("bad", 12, 0.1);
  assert.deepEqual(result, { answered: true, correct: false });
}

{
  const currentSolved = new Set(["pp-1"]);
  const attempt = resolvePracticeAttempt(currentSolved, "pp-2", "5", 5, 0);

  assert.equal(attempt.correct, true);
  assert.equal(attempt.answered, true);
  assert.equal(attempt.changed, true);
  assert.deepEqual([...attempt.practiceSolved].sort(), ["pp-1", "pp-2"]);
  assert.deepEqual([...currentSolved], ["pp-1"]);
}

{
  const currentSolved = new Set(["pp-1"]);
  const attempt = resolvePracticeAttempt(currentSolved, "pp-1", "5", 5, 0);

  assert.equal(attempt.correct, true);
  assert.equal(attempt.changed, false);
  assert.deepEqual([...attempt.practiceSolved], ["pp-1"]);
}

{
  const currentSolved = new Set(["pp-1"]);
  const attempt = resolvePracticeAttempt(currentSolved, "pp-2", "7", 5, 0);

  assert.equal(attempt.correct, false);
  assert.equal(attempt.changed, false);
  assert.deepEqual([...attempt.practiceSolved], ["pp-1"]);
}

console.log("Practice state tests passed.");

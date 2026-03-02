import assert from "node:assert/strict";

import { buildFinalizedQuizSession } from "../assets/js/modules/quiz-session.js";

{
  const questions = [
    { id: "qq-1", correct: 1, q: "Q1", opts: ["A", "B", "C", "D"] },
    { id: "qq-2", correct: 0, q: "Q2", opts: ["A", "B", "C", "D"] }
  ];
  const answers = {
    "qq-1": 1,
    "qq-2": 3
  };

  const finalized = buildFinalizedQuizSession(
    questions,
    answers,
    new Set(["qq-1"]),
    new Set(["qq-2"]),
    "review"
  );

  assert.equal(finalized.score, 1);
  assert.equal(finalized.total, 2);
  assert.equal(finalized.sessionLabel, "review");
  assert.deepEqual([...finalized.reviewQueue], ["qq-2"]);
  assert.deepEqual([...finalized.quizMastered], ["qq-1"]);
}

{
  const finalized = buildFinalizedQuizSession(
    [{ id: "qq-3", correct: 2, q: "Q3", opts: ["A", "B", "C", "D"] }],
    { "qq-3": 2 },
    new Set(),
    new Set(),
    "variant"
  );

  assert.equal(finalized.sessionLabel, "variant");
}

{
  const finalized = buildFinalizedQuizSession(
    [{ id: "qq-4", correct: 0, q: "Q4", opts: ["A", "B", "C", "D"] }],
    { "qq-4": 0 },
    new Set(),
    new Set(),
    "default"
  );

  assert.equal(finalized.sessionLabel, "full");
}

console.log("Quiz session tests passed.");

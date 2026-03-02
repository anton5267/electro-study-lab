import assert from "node:assert/strict";

import { buildFinalizedExamSession } from "../assets/js/modules/exam-session.js";

{
  const questions = [
    { id: "qq-1", correct: 1, q: "Q1", opts: ["A", "B", "C", "D"] },
    { id: "qq-2", correct: 0, q: "Q2", opts: ["A", "B", "C", "D"] }
  ];
  const answers = {
    "qq-1": 1,
    "qq-2": 2
  };
  const reviewQueue = new Set(["qq-1"]);
  const quizMastered = new Set(["qq-2"]);

  const result = buildFinalizedExamSession(
    questions,
    answers,
    reviewQueue,
    quizMastered,
    12,
    true
  );

  assert.equal(result.score, 1);
  assert.equal(result.total, 2);
  assert.equal(result.sessionLabel, "12 min");
  assert.deepEqual([...result.reviewQueue], ["qq-2"]);
  assert.deepEqual([...result.quizMastered], ["qq-1"]);

  assert.equal(result.exam.status, "finished");
  assert.deepEqual(result.exam.questionIds, ["qq-1", "qq-2"]);
  assert.equal(result.exam.result.score, 1);
  assert.equal(result.exam.result.total, 2);
  assert.equal(result.exam.result.timeout, true);
  assert.equal(result.exam.result.wrongQuestions.length, 1);
  assert.equal(result.exam.result.wrongQuestions[0].id, "qq-2");
}

{
  const result = buildFinalizedExamSession(
    [{ id: "qq-3", correct: 0, q: "Q3", opts: ["A", "B", "C", "D"] }],
    {},
    new Set(),
    new Set(),
    "bad",
    false
  );

  assert.equal(result.sessionLabel, "10 min");
}

console.log("Exam session tests passed.");

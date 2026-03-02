import assert from "node:assert/strict";

import { buildProgressMetrics } from "../assets/js/modules/progress-metrics.js";

const content = {
  checklistItems: ["a", "b", "c"],
  flashcards: [{}, {}, {}, {}],
  practiceProblems: [{}, {}],
  quizData: [{}, {}, {}, {}, {}]
};

{
  const metrics = buildProgressMetrics(content, {
    checked: new Set([0]),
    seenCards: new Set([0, 1]),
    practiceSolved: new Set(["p1"]),
    quizMastered: new Set(["q1", "q2"]),
    averageQuizScore: 0,
    averageExamScore: 0,
    lastExamPercent: 0
  });

  assert.equal(metrics.total, 15);
  assert.equal(metrics.done, 6);
  assert.equal(metrics.completion, 40);
  assert.equal(metrics.lastExamPercent, 0);
  assert.equal(metrics.accuracyPercent, null);
  assert.deepEqual(metrics.checklist, { done: 1, total: 3 });
  assert.deepEqual(metrics.flashcards, { done: 2, total: 4 });
}

{
  const metrics = buildProgressMetrics(content, {
    checked: [1, 2, 3],
    seenCards: [1, 2, 3, 4],
    practiceSolved: [1, 2],
    quizMastered: [1, 2, 3, 4, 5],
    averageQuizScore: 80,
    averageExamScore: 60,
    lastExamPercent: 75
  });

  assert.equal(metrics.done, 15);
  assert.equal(metrics.completion, 100);
  assert.equal(metrics.lastExamPercent, 75);
  assert.equal(metrics.accuracyPercent, 70);
}

console.log("Progress metrics tests passed.");

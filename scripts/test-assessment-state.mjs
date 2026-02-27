import assert from "node:assert/strict";

import {
  answerExamQuestion,
  answerQuestion,
  buildFinishedExamState,
  buildRecordedStats,
  createDefaultQuizState,
  createEmptyExamState,
  createQuizVariantState,
  createReviewQuizState,
  createRunningExamState,
  findNextUnansweredQuestion,
  getExamQuestions,
  resolveAssessmentResults
} from "../assets/js/modules/assessment-state.js";

const content = {
  quizData: [
    { id: "qq-1", topic: "safety", correct: 1 },
    { id: "qq-2", topic: "switching", correct: 0 },
    { id: "qq-3", topic: "safety", correct: 2 }
  ]
};

function reverseShuffle(items) {
  return [...items].reverse();
}

{
  assert.deepEqual(createDefaultQuizState(), {
    quizMode: "default",
    quizVariantIds: [],
    quizAnswers: {},
    quizLogged: false
  });
}

{
  assert.deepEqual(createQuizVariantState(content, reverseShuffle, 2), {
    quizMode: "variant",
    quizVariantIds: ["qq-3", "qq-2"],
    quizAnswers: {},
    quizLogged: false
  });
}

{
  assert.deepEqual(createReviewQuizState(content, new Set(["qq-2", "qq-3"]), "all"), {
    quizMode: "review",
    quizVariantIds: ["qq-2", "qq-3"],
    quizAnswers: {},
    quizLogged: false
  });

  assert.equal(createReviewQuizState(content, new Set(["qq-2"]), "safety"), null);
}

{
  const answers = answerQuestion({ "qq-1": 1 }, "qq-2", 3);
  assert.deepEqual(answers, { "qq-1": 1, "qq-2": 3 });
  assert.equal(findNextUnansweredQuestion(content.quizData, answers).id, "qq-3");
}

{
  assert.deepEqual(createEmptyExamState(), {
    status: "idle",
    questionIds: [],
    answers: {},
    durationMinutes: 10,
    endAt: null,
    timerId: null,
    result: null
  });
}

{
  const exam = createRunningExamState(content, 2, 15, 1_000, reverseShuffle);
  assert.equal(exam.status, "running");
  assert.deepEqual(exam.questionIds, ["qq-3", "qq-2"]);
  assert.equal(exam.durationMinutes, 15);
  assert.equal(exam.endAt, 901000);
  assert.deepEqual(exam.answers, {});
}

{
  const exam = answerExamQuestion(createRunningExamState(content, 2, 10, 5_000, reverseShuffle), "qq-3", 1);
  assert.equal(exam.answers["qq-3"], 1);
}

{
  const questions = getExamQuestions(content, ["qq-3", "missing", "qq-1"]);
  assert.deepEqual(questions.map((question) => question.id), ["qq-3", "qq-1"]);
}

{
  const outcome = resolveAssessmentResults(
    content.quizData,
    { "qq-1": 1, "qq-2": 2, "qq-3": 2 },
    new Set(["qq-2"]),
    new Set(["qq-2"])
  );

  assert.equal(outcome.score, 2);
  assert.deepEqual(outcome.wrongQuestions.map((question) => question.id), ["qq-2"]);
  assert.deepEqual([...outcome.reviewQueue], ["qq-2"]);
  assert.deepEqual([...outcome.quizMastered].sort(), ["qq-1", "qq-3"]);
}

{
  const examState = buildFinishedExamState(["qq-1", "qq-2"], {
    score: 1,
    wrongQuestions: [content.quizData[1]]
  }, true);

  assert.equal(examState.status, "finished");
  assert.equal(examState.result.score, 1);
  assert.equal(examState.result.total, 2);
  assert.equal(examState.result.timeout, true);
  assert.deepEqual(examState.result.wrongQuestions.map((question) => question.id), ["qq-2"]);
}

{
  const stats = buildRecordedStats({
    quizRuns: 1,
    examRuns: 0,
    practiceSolvedCount: 0,
    bestQuizScore: 50,
    bestExamScore: 0,
    averageExamScore: 0,
    averageQuizScore: 50,
    studyStreak: 0,
    lastStudyDate: "",
    achievements: [],
    history: []
  }, "quiz", 3, 4, "variant", "2026-02-27T16:00:00.000Z");

  assert.equal(stats.quizRuns, 2);
  assert.equal(stats.bestQuizScore, 75);
  assert.equal(stats.averageQuizScore, 62.5);
  assert.equal(stats.history[0].percent, 75);
  assert.equal(stats.history[0].label, "variant");
}

console.log("Assessment state tests passed.");

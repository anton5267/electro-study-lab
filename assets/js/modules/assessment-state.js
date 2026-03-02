import { appendHistoryEntry } from "./storage.js";
import { getQuizScore } from "./study-helpers.js";
import { toPercent } from "./utils.js";

export function createDefaultQuizState() {
  return {
    quizMode: "default",
    quizVariantIds: [],
    quizAnswers: {},
    quizLogged: false
  };
}

export function createQuizVariantState(content, shuffleArray, limit = 8) {
  const allIds = content.quizData.map((question) => question.id);

  return {
    quizMode: "variant",
    quizVariantIds: shuffleArray(allIds).slice(0, Math.min(limit, allIds.length)),
    quizAnswers: {},
    quizLogged: false
  };
}

export function createReviewQuizState(content, reviewQueue, activeTopic) {
  const reviewIds = content.quizData
    .filter((question) => reviewQueue.has(question.id) && (activeTopic === "all" || activeTopic === question.topic))
    .map((question) => question.id);

  if (!reviewIds.length) {
    return null;
  }

  return {
    quizMode: "review",
    quizVariantIds: reviewIds,
    quizAnswers: {},
    quizLogged: false
  };
}

export function answerQuestion(answers, questionId, optionIndex) {
  return {
    ...answers,
    [questionId]: optionIndex
  };
}

export function findNextUnansweredQuestion(questions, answers) {
  return questions.find((question) => answers[question.id] === undefined) || null;
}

export function createEmptyExamState() {
  return {
    status: "idle",
    questionIds: [],
    answers: {},
    durationMinutes: 10,
    endAt: null,
    timerId: null,
    result: null
  };
}

export function createRunningExamState(content, questionCount, durationMinutes, now, shuffleArray, activeTopic = "all") {
  const allQuestions = Array.isArray(content?.quizData) ? content.quizData : [];
  const topicQuestions = activeTopic === "all"
    ? allQuestions
    : allQuestions.filter((question) => question.topic === activeTopic);
  const sourceQuestions = topicQuestions.length ? topicQuestions : allQuestions;
  const questionIds = (typeof shuffleArray === "function"
    ? shuffleArray(sourceQuestions.map((question) => question.id))
    : sourceQuestions.map((question) => question.id))
    .slice(0, Math.min(questionCount, sourceQuestions.length));

  return {
    ...createEmptyExamState(),
    status: "running",
    questionIds,
    durationMinutes,
    endAt: now + durationMinutes * 60 * 1000
  };
}

export function getExamQuestions(content, questionIds) {
  return questionIds
    .map((id) => content.quizData.find((question) => question.id === id))
    .filter(Boolean);
}

export function answerExamQuestion(examState, questionId, optionIndex) {
  return {
    ...examState,
    answers: answerQuestion(examState.answers, questionId, optionIndex)
  };
}

export function resolveAssessmentResults(questions, answers, reviewQueue, quizMastered) {
  const nextReviewQueue = new Set(reviewQueue);
  const nextQuizMastered = new Set(quizMastered);

  questions.forEach((question) => {
    const isCorrect = Number(answers[question.id]) === question.correct;

    if (isCorrect) {
      nextReviewQueue.delete(question.id);
      nextQuizMastered.add(question.id);
    } else {
      nextReviewQueue.add(question.id);
      nextQuizMastered.delete(question.id);
    }
  });

  return {
    score: getQuizScore(questions, answers),
    wrongQuestions: questions.filter((question) => Number(answers[question.id]) !== question.correct),
    reviewQueue: nextReviewQueue,
    quizMastered: nextQuizMastered
  };
}

export function buildFinishedExamState(questionIds, outcome, timeout) {
  return {
    ...createEmptyExamState(),
    status: "finished",
    questionIds: [...questionIds],
    result: {
      score: outcome.score,
      total: questionIds.length,
      timeout,
      wrongQuestions: outcome.wrongQuestions
    }
  };
}

export function buildRecordedStats(stats, type, score, total, label, at = new Date().toISOString()) {
  const percent = toPercent(score, total);
  const nextStats = { ...stats };

  if (type === "quiz") {
    const nextRuns = nextStats.quizRuns + 1;
    nextStats.averageQuizScore = ((nextStats.averageQuizScore * nextStats.quizRuns) + percent) / nextRuns;
    nextStats.quizRuns = nextRuns;
    nextStats.bestQuizScore = Math.max(nextStats.bestQuizScore, percent);
  } else {
    const nextRuns = nextStats.examRuns + 1;
    nextStats.averageExamScore = ((nextStats.averageExamScore * nextStats.examRuns) + percent) / nextRuns;
    nextStats.examRuns = nextRuns;
    nextStats.bestExamScore = Math.max(nextStats.bestExamScore, percent);
  }

  return appendHistoryEntry(nextStats, {
    type,
    score,
    total,
    percent,
    label,
    at
  });
}

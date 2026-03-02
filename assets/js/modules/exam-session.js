import { buildFinishedExamState, resolveAssessmentResults } from "./assessment-state.js";

export function buildFinalizedExamSession(
  questions,
  answers,
  reviewQueue,
  quizMastered,
  durationMinutes,
  timeout
) {
  const outcome = resolveAssessmentResults(questions, answers, reviewQueue, quizMastered);

  return {
    reviewQueue: outcome.reviewQueue,
    quizMastered: outcome.quizMastered,
    score: outcome.score,
    total: questions.length,
    sessionLabel: formatExamSessionLabel(durationMinutes),
    exam: buildFinishedExamState(questions.map((question) => question.id), outcome, timeout)
  };
}

function formatExamSessionLabel(durationMinutes) {
  const duration = Number(durationMinutes);
  const normalized = Number.isFinite(duration) && duration > 0 ? duration : 10;
  return `${normalized} min`;
}

import { resolveAssessmentResults } from "./assessment-state.js";
import { getQuizSessionLabel } from "./study-helpers.js";

export function buildFinalizedQuizSession(
  questions,
  answers,
  reviewQueue,
  quizMastered,
  quizMode
) {
  const outcome = resolveAssessmentResults(questions, answers, reviewQueue, quizMastered);

  return {
    reviewQueue: outcome.reviewQueue,
    quizMastered: outcome.quizMastered,
    score: outcome.score,
    total: questions.length,
    sessionLabel: getQuizSessionLabel(quizMode)
  };
}

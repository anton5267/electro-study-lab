import { safeNumber, withinTolerance } from "./utils.js";

export function evaluatePracticeAnswer(rawValue, correctAnswer, tolerance) {
  if (rawValue === undefined || rawValue === "") {
    return {
      answered: false,
      correct: false
    };
  }

  const parsedAnswer = safeNumber(rawValue);
  const correct = parsedAnswer !== null && withinTolerance(parsedAnswer, correctAnswer, tolerance);

  return {
    answered: true,
    correct
  };
}

export function resolvePracticeAttempt(practiceSolved, problemId, rawValue, correctAnswer, tolerance) {
  const outcome = evaluatePracticeAnswer(rawValue, correctAnswer, tolerance);
  const nextPracticeSolved = practiceSolved instanceof Set ? new Set(practiceSolved) : new Set();
  let changed = false;

  if (outcome.correct && typeof problemId === "string" && problemId && !nextPracticeSolved.has(problemId)) {
    nextPracticeSolved.add(problemId);
    changed = true;
  }

  return {
    ...outcome,
    practiceSolved: nextPracticeSolved,
    changed
  };
}

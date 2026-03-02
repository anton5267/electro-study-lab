export const PRACTICE_ACTIONS = Object.freeze({
  NONE: "none",
  UPDATE_ANSWER: "update-answer",
  CHECK_PROBLEM: "check-problem"
});

function normalizeProblemId(value) {
  return typeof value === "string" && value ? value : null;
}

export function resolvePracticeInputAction(target) {
  if (!target || typeof target.closest !== "function") {
    return { type: PRACTICE_ACTIONS.NONE };
  }

  const input = target.closest("[data-problem-input]");
  if (!input) {
    return { type: PRACTICE_ACTIONS.NONE };
  }

  const problemId = normalizeProblemId(input.dataset.problemInput);
  if (!problemId) {
    return { type: PRACTICE_ACTIONS.NONE };
  }

  return {
    type: PRACTICE_ACTIONS.UPDATE_ANSWER,
    problemId,
    value: input.value ?? ""
  };
}

export function resolvePracticeClickAction(target) {
  if (!target || typeof target.closest !== "function") {
    return { type: PRACTICE_ACTIONS.NONE };
  }

  const button = target.closest("[data-check-problem]");
  if (!button) {
    return { type: PRACTICE_ACTIONS.NONE };
  }

  const problemId = normalizeProblemId(button.dataset.checkProblem);
  if (!problemId) {
    return { type: PRACTICE_ACTIONS.NONE };
  }

  return {
    type: PRACTICE_ACTIONS.CHECK_PROBLEM,
    problemId
  };
}

export function resolvePracticeKeydownAction(target, key) {
  if (key !== "Enter") {
    return { type: PRACTICE_ACTIONS.NONE };
  }

  if (!target || typeof target.closest !== "function") {
    return { type: PRACTICE_ACTIONS.NONE };
  }

  const input = target.closest("[data-problem-input]");
  if (!input) {
    return { type: PRACTICE_ACTIONS.NONE };
  }

  const problemId = normalizeProblemId(input.dataset.problemInput);
  if (!problemId) {
    return { type: PRACTICE_ACTIONS.NONE };
  }

  return {
    type: PRACTICE_ACTIONS.CHECK_PROBLEM,
    problemId
  };
}

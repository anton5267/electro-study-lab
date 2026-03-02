export const QUIZ_ACTIONS = Object.freeze({
  NONE: "none",
  ANSWER: "answer"
});

function normalizeQuestionId(value) {
  return typeof value === "string" && value ? value : null;
}

function normalizeOptionIndex(value) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 0 || parsed > 3) {
    return null;
  }

  return parsed;
}

export function resolveQuizClickAction(target, quizAnswers) {
  if (!target || typeof target.closest !== "function") {
    return { type: QUIZ_ACTIONS.NONE };
  }

  const button = target.closest("[data-answer-question]");
  if (!button) {
    return { type: QUIZ_ACTIONS.NONE };
  }

  const questionId = normalizeQuestionId(button.dataset.answerQuestion);
  const optionIndex = normalizeOptionIndex(button.dataset.optionIndex);

  if (!questionId || optionIndex === null) {
    return { type: QUIZ_ACTIONS.NONE };
  }

  if (quizAnswers && quizAnswers[questionId] !== undefined) {
    return { type: QUIZ_ACTIONS.NONE };
  }

  return {
    type: QUIZ_ACTIONS.ANSWER,
    questionId,
    optionIndex
  };
}

export function resolveQuizKeyboardAction(questions, quizAnswers, optionIndex) {
  const normalizedOption = normalizeOptionIndex(optionIndex);
  if (normalizedOption === null) {
    return { type: QUIZ_ACTIONS.NONE };
  }

  const question = Array.isArray(questions)
    ? questions.find((item) => item && normalizeQuestionId(item.id) && quizAnswers?.[item.id] === undefined)
    : null;

  if (!question) {
    return { type: QUIZ_ACTIONS.NONE };
  }

  return {
    type: QUIZ_ACTIONS.ANSWER,
    questionId: question.id,
    optionIndex: normalizedOption
  };
}

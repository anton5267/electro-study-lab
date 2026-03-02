import {
  buildExamSnapshot,
  isRunningExam,
  resolveRuntimeRestoreAction
} from "./exam-runtime.js";

export const EXAM_RUNTIME_ACTIONS = Object.freeze({
  NONE: "none",
  ANSWER: "answer",
  SUBMIT: "submit"
});

function normalizeOptionIndex(value) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 0 || parsed > 3) {
    return null;
  }

  return parsed;
}

function normalizeQuestionId(value) {
  return typeof value === "string" && value ? value : null;
}

export function resolveExamSubmitPlan(examState, timeout = false) {
  if (!isRunningExam(examState)) {
    return null;
  }

  return {
    timeout: Boolean(timeout),
    examSnapshot: buildExamSnapshot(examState)
  };
}

export function buildResetExamState(createEmptyExamState) {
  if (typeof createEmptyExamState !== "function") {
    return null;
  }

  return createEmptyExamState();
}

export function resolveExamRuntimeAction(target) {
  if (!target || typeof target.closest !== "function") {
    return { type: EXAM_RUNTIME_ACTIONS.NONE };
  }

  const answerButton = target.closest("[data-exam-answer]");
  if (answerButton) {
    const questionId = normalizeQuestionId(answerButton.dataset.examAnswer);
    const optionIndex = normalizeOptionIndex(answerButton.dataset.optionIndex);
    if (!questionId || optionIndex === null) {
      return { type: EXAM_RUNTIME_ACTIONS.NONE };
    }

    return {
      type: EXAM_RUNTIME_ACTIONS.ANSWER,
      questionId,
      optionIndex
    };
  }

  if (target.closest("[data-submit-exam]")) {
    return {
      type: EXAM_RUNTIME_ACTIONS.SUBMIT,
      timeout: false
    };
  }

  return { type: EXAM_RUNTIME_ACTIONS.NONE };
}

export function resolveExamKeyboardAction(questions, examAnswers, optionIndex) {
  const normalizedOption = normalizeOptionIndex(optionIndex);
  if (normalizedOption === null) {
    return { type: EXAM_RUNTIME_ACTIONS.NONE };
  }

  const question = Array.isArray(questions)
    ? questions.find((item) => item && normalizeQuestionId(item.id) && examAnswers?.[item.id] === undefined)
    : null;

  if (!question) {
    return { type: EXAM_RUNTIME_ACTIONS.NONE };
  }

  return {
    type: EXAM_RUNTIME_ACTIONS.ANSWER,
    questionId: question.id,
    optionIndex: normalizedOption
  };
}

export function shouldResetExamFromTarget(target) {
  return Boolean(target && typeof target.closest === "function" && target.closest("[data-reset-exam]"));
}

export function resolveExamRestorePlan(examState, now = Date.now()) {
  const action = resolveRuntimeRestoreAction(examState, now);
  if (action !== "timeout") {
    return { action };
  }

  return {
    action,
    timeout: true,
    examSnapshot: buildExamSnapshot(examState)
  };
}

export function isRunningExam(examState) {
  return Boolean(examState && examState.status === "running");
}

export const EXAM_TICK_ACTIONS = Object.freeze({
  CLEAR_TIMER: "clear-timer",
  SUBMIT_TIMEOUT: "submit-timeout",
  RENDER: "render"
});

export function shouldAutoSubmitExam(examState, now = Date.now()) {
  if (!isRunningExam(examState)) {
    return false;
  }

  return now >= (Number(examState.endAt) || 0);
}

export function resolveExamTickAction(examState, now = Date.now()) {
  if (!isRunningExam(examState)) {
    return EXAM_TICK_ACTIONS.CLEAR_TIMER;
  }

  if (shouldAutoSubmitExam(examState, now)) {
    return EXAM_TICK_ACTIONS.SUBMIT_TIMEOUT;
  }

  return EXAM_TICK_ACTIONS.RENDER;
}

export function buildStartedExamState(createRunningExamState, content, questionCount, durationMinutes, now, shuffleArray, timerId) {
  if (typeof createRunningExamState !== "function") {
    return null;
  }

  return {
    ...createRunningExamState(content, questionCount, durationMinutes, now, shuffleArray),
    timerId: timerId ?? null
  };
}

export function buildExamSnapshot(examState) {
  const duration = Number(examState?.durationMinutes);
  return {
    durationMinutes: Number.isFinite(duration) ? Math.max(1, duration) : 10,
    answers: examState?.answers && typeof examState.answers === "object" && !Array.isArray(examState.answers)
      ? { ...examState.answers }
      : {}
  };
}

export function resolveRuntimeRestoreAction(examState, now = Date.now()) {
  if (!isRunningExam(examState)) {
    return "persist";
  }

  if (shouldAutoSubmitExam(examState, now)) {
    return "timeout";
  }

  return "resume";
}

export const EXAM_INTRO_ACTIONS = Object.freeze({
  NONE: "none",
  START_EXAM: "start-exam",
  UPDATE_SETTINGS: "update-settings"
});

function normalizeSettingValue(value, fallback) {
  if (value !== undefined && value !== null && value !== "") {
    return value;
  }

  return fallback;
}

export function resolveExamIntroClickAction(target, durationValue, questionCountValue) {
  if (!target || typeof target.closest !== "function") {
    return { type: EXAM_INTRO_ACTIONS.NONE };
  }

  const button = target.closest("[data-start-exam]");
  if (!button) {
    return { type: EXAM_INTRO_ACTIONS.NONE };
  }

  return {
    type: EXAM_INTRO_ACTIONS.START_EXAM,
    durationValue: normalizeSettingValue(durationValue, 0),
    questionCountValue: normalizeSettingValue(questionCountValue, 0)
  };
}

export function resolveExamIntroChangeAction(target, currentDurationValue, currentQuestionCountValue) {
  if (!target || typeof target.closest !== "function") {
    return { type: EXAM_INTRO_ACTIONS.NONE };
  }

  const durationSelect = target.closest("#examDurationSelect");
  if (durationSelect) {
    return {
      type: EXAM_INTRO_ACTIONS.UPDATE_SETTINGS,
      durationValue: normalizeSettingValue(durationSelect.value, currentDurationValue),
      questionCountValue: normalizeSettingValue(currentQuestionCountValue, 0)
    };
  }

  const countSelect = target.closest("#examCountSelect");
  if (countSelect) {
    return {
      type: EXAM_INTRO_ACTIONS.UPDATE_SETTINGS,
      durationValue: normalizeSettingValue(currentDurationValue, 0),
      questionCountValue: normalizeSettingValue(countSelect.value, currentQuestionCountValue)
    };
  }

  return { type: EXAM_INTRO_ACTIONS.NONE };
}

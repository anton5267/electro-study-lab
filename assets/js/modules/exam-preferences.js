export const EXAM_DURATION_OPTIONS = Object.freeze([6, 10, 15]);
export const EXAM_QUESTION_COUNT_OPTIONS = Object.freeze([6, 8, 10]);
export const DEFAULT_EXAM_DURATION_MINUTES = 10;
export const DEFAULT_EXAM_QUESTION_COUNT = 8;

export function normalizeExamSetting(value, allowedValues, fallback) {
  const parsed = Number(value);
  if (Number.isFinite(parsed) && allowedValues.includes(parsed)) {
    return parsed;
  }

  return fallback;
}

export function buildExamPreferences(durationValue, questionCountValue) {
  return resolveExamSettings(
    durationValue,
    questionCountValue,
    DEFAULT_EXAM_DURATION_MINUTES,
    DEFAULT_EXAM_QUESTION_COUNT
  );
}

export function resolveExamSettings(durationValue, questionCountValue, durationFallback, questionCountFallback) {
  return {
    durationMinutes: normalizeExamSetting(
      durationValue,
      EXAM_DURATION_OPTIONS,
      durationFallback
    ),
    questionCount: normalizeExamSetting(
      questionCountValue,
      EXAM_QUESTION_COUNT_OPTIONS,
      questionCountFallback
    )
  };
}

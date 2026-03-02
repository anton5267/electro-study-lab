import assert from "node:assert/strict";

import {
  buildExamPreferences,
  DEFAULT_EXAM_DURATION_MINUTES,
  DEFAULT_EXAM_QUESTION_COUNT,
  EXAM_DURATION_OPTIONS,
  EXAM_QUESTION_COUNT_OPTIONS,
  normalizeExamSetting,
  resolveExamSettings
} from "../assets/js/modules/exam-preferences.js";

{
  assert.equal(normalizeExamSetting(6, EXAM_DURATION_OPTIONS, 10), 6);
  assert.equal(normalizeExamSetting("15", EXAM_DURATION_OPTIONS, 10), 15);
  assert.equal(normalizeExamSetting("bad", EXAM_DURATION_OPTIONS, 10), 10);
  assert.equal(normalizeExamSetting(12, EXAM_DURATION_OPTIONS, 10), 10);
}

{
  const prefs = buildExamPreferences(15, 10);
  assert.deepEqual(prefs, { durationMinutes: 15, questionCount: 10 });
}

{
  const prefs = buildExamPreferences(undefined, undefined);
  assert.deepEqual(prefs, {
    durationMinutes: DEFAULT_EXAM_DURATION_MINUTES,
    questionCount: DEFAULT_EXAM_QUESTION_COUNT
  });
}

{
  const prefs = buildExamPreferences("6", 999);
  assert.deepEqual(prefs, {
    durationMinutes: 6,
    questionCount: DEFAULT_EXAM_QUESTION_COUNT
  });
}

{
  const settings = resolveExamSettings("bad", 100, 15, 6);
  assert.deepEqual(settings, {
    durationMinutes: 15,
    questionCount: 6
  });
}

{
  const settings = resolveExamSettings("6", "10", 15, 8);
  assert.deepEqual(settings, {
    durationMinutes: 6,
    questionCount: 10
  });
}

{
  assert.deepEqual(EXAM_DURATION_OPTIONS, [6, 10, 15]);
  assert.deepEqual(EXAM_QUESTION_COUNT_OPTIONS, [6, 8, 10]);
}

console.log("Exam preferences tests passed.");

import assert from "node:assert/strict";

import {
  EXAM_INTRO_ACTIONS,
  resolveExamIntroClickAction,
  resolveExamIntroChangeAction
} from "../assets/js/modules/exam-intro-control.js";

{
  const action = resolveExamIntroClickAction({
    closest(selector) {
      if (selector === "[data-start-exam]") {
        return {};
      }

      return null;
    }
  }, "15", "10");

  assert.deepEqual(action, {
    type: EXAM_INTRO_ACTIONS.START_EXAM,
    durationValue: "15",
    questionCountValue: "10"
  });
}

{
  const action = resolveExamIntroClickAction({
    closest() {
      return null;
    }
  }, "10", "8");

  assert.deepEqual(action, {
    type: EXAM_INTRO_ACTIONS.NONE
  });
}

{
  const action = resolveExamIntroChangeAction({
    closest(selector) {
      if (selector === "#examDurationSelect") {
        return { value: "6" };
      }

      return null;
    }
  }, 10, 8);

  assert.deepEqual(action, {
    type: EXAM_INTRO_ACTIONS.UPDATE_SETTINGS,
    durationValue: "6",
    questionCountValue: 8
  });
}

{
  const action = resolveExamIntroChangeAction({
    closest(selector) {
      if (selector === "#examCountSelect") {
        return { value: "10" };
      }

      return null;
    }
  }, 10, 8);

  assert.deepEqual(action, {
    type: EXAM_INTRO_ACTIONS.UPDATE_SETTINGS,
    durationValue: 10,
    questionCountValue: "10"
  });
}

{
  const action = resolveExamIntroChangeAction({
    closest(selector) {
      if (selector === "#examDurationSelect") {
        return { value: "" };
      }

      return null;
    }
  }, 10, 8);

  assert.deepEqual(action, {
    type: EXAM_INTRO_ACTIONS.UPDATE_SETTINGS,
    durationValue: 10,
    questionCountValue: 8
  });
}

console.log("Exam intro control tests passed.");

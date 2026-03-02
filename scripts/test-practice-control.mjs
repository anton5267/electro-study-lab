import assert from "node:assert/strict";

import {
  PRACTICE_ACTIONS,
  resolvePracticeClickAction,
  resolvePracticeInputAction,
  resolvePracticeKeydownAction
} from "../assets/js/modules/practice-control.js";

{
  const action = resolvePracticeInputAction({
    closest(selector) {
      if (selector === "[data-problem-input]") {
        return {
          dataset: { problemInput: "pp-2" },
          value: "12.5"
        };
      }
      return null;
    }
  });

  assert.deepEqual(action, {
    type: PRACTICE_ACTIONS.UPDATE_ANSWER,
    problemId: "pp-2",
    value: "12.5"
  });
}

{
  const action = resolvePracticeInputAction({
    closest() {
      return null;
    }
  });

  assert.deepEqual(action, { type: PRACTICE_ACTIONS.NONE });
}

{
  const action = resolvePracticeClickAction({
    closest(selector) {
      if (selector === "[data-check-problem]") {
        return {
          dataset: { checkProblem: "pp-3" }
        };
      }
      return null;
    }
  });

  assert.deepEqual(action, {
    type: PRACTICE_ACTIONS.CHECK_PROBLEM,
    problemId: "pp-3"
  });
}

{
  const action = resolvePracticeClickAction(null);
  assert.deepEqual(action, { type: PRACTICE_ACTIONS.NONE });
}

{
  const action = resolvePracticeKeydownAction({
    closest(selector) {
      if (selector === "[data-problem-input]") {
        return {
          dataset: { problemInput: "pp-4" }
        };
      }
      return null;
    }
  }, "Enter");

  assert.deepEqual(action, {
    type: PRACTICE_ACTIONS.CHECK_PROBLEM,
    problemId: "pp-4"
  });
}

{
  const action = resolvePracticeKeydownAction({
    closest() {
      return null;
    }
  }, "Enter");

  assert.deepEqual(action, { type: PRACTICE_ACTIONS.NONE });
}

{
  const action = resolvePracticeKeydownAction({
    closest() {
      return {
        dataset: { problemInput: "pp-1" }
      };
    }
  }, "Escape");

  assert.deepEqual(action, { type: PRACTICE_ACTIONS.NONE });
}

console.log("Practice control tests passed.");

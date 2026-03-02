import assert from "node:assert/strict";

import {
  EXAM_RUNTIME_ACTIONS,
  buildResetExamState,
  resolveExamKeyboardAction,
  resolveExamRuntimeAction,
  resolveExamRestorePlan,
  resolveExamSubmitPlan,
  shouldResetExamFromTarget
} from "../assets/js/modules/exam-control.js";

{
  assert.equal(resolveExamSubmitPlan({ status: "idle" }, false), null);
}

{
  const plan = resolveExamSubmitPlan({
    status: "running",
    durationMinutes: 15,
    answers: { "qq-1": 2 }
  }, true);

  assert.equal(plan.timeout, true);
  assert.deepEqual(plan.examSnapshot, {
    durationMinutes: 15,
    answers: { "qq-1": 2 }
  });
}

{
  function createEmptyExamState() {
    return {
      status: "idle",
      answers: {},
      durationMinutes: 10
    };
  }

  const reset = buildResetExamState(createEmptyExamState);
  assert.deepEqual(reset, {
    status: "idle",
    answers: {},
    durationMinutes: 10
  });
}

{
  assert.equal(buildResetExamState(null), null);
}

{
  const answerTarget = {
    closest(selector) {
      if (selector === "[data-exam-answer]") {
        return {
          dataset: {
            examAnswer: "qq-4",
            optionIndex: "2"
          }
        };
      }

      return null;
    }
  };

  assert.deepEqual(resolveExamRuntimeAction(answerTarget), {
    type: EXAM_RUNTIME_ACTIONS.ANSWER,
    questionId: "qq-4",
    optionIndex: 2
  });
}

{
  const missingQuestionTarget = {
    closest(selector) {
      if (selector === "[data-exam-answer]") {
        return {
          dataset: {
            examAnswer: "",
            optionIndex: "2"
          }
        };
      }

      return null;
    }
  };

  assert.deepEqual(resolveExamRuntimeAction(missingQuestionTarget), {
    type: EXAM_RUNTIME_ACTIONS.NONE
  });
}

{
  const invalidAnswerTarget = {
    closest(selector) {
      if (selector === "[data-exam-answer]") {
        return {
          dataset: {
            examAnswer: "qq-4",
            optionIndex: "8"
          }
        };
      }

      return null;
    }
  };

  assert.deepEqual(resolveExamRuntimeAction(invalidAnswerTarget), {
    type: EXAM_RUNTIME_ACTIONS.NONE
  });
}

{
  const submitTarget = {
    closest(selector) {
      if (selector === "[data-submit-exam]") {
        return { dataset: {} };
      }

      return null;
    }
  };

  assert.deepEqual(resolveExamRuntimeAction(submitTarget), {
    type: EXAM_RUNTIME_ACTIONS.SUBMIT,
    timeout: false
  });
}

{
  assert.deepEqual(resolveExamRuntimeAction(null), {
    type: EXAM_RUNTIME_ACTIONS.NONE
  });
}

{
  const action = resolveExamKeyboardAction(
    [{ id: "qq-1" }, { id: "qq-2" }],
    { "qq-1": 3 },
    1
  );

  assert.deepEqual(action, {
    type: EXAM_RUNTIME_ACTIONS.ANSWER,
    questionId: "qq-2",
    optionIndex: 1
  });
}

{
  const action = resolveExamKeyboardAction([{ id: "qq-1" }], { "qq-1": 3 }, 2);
  assert.deepEqual(action, {
    type: EXAM_RUNTIME_ACTIONS.NONE
  });
}

{
  const action = resolveExamKeyboardAction([{ id: "qq-1" }], {}, 10);
  assert.deepEqual(action, {
    type: EXAM_RUNTIME_ACTIONS.NONE
  });
}

{
  assert.equal(shouldResetExamFromTarget({
    closest(selector) {
      return selector === "[data-reset-exam]" ? {} : null;
    }
  }), true);

  assert.equal(shouldResetExamFromTarget({
    closest() {
      return null;
    }
  }), false);
}

{
  assert.deepEqual(resolveExamRestorePlan({ status: "idle" }, 100), {
    action: "persist"
  });

  assert.deepEqual(resolveExamRestorePlan({ status: "running", endAt: 150 }, 100), {
    action: "resume"
  });

  const timeoutPlan = resolveExamRestorePlan({
    status: "running",
    endAt: 50,
    durationMinutes: 6,
    answers: { "qq-2": 1 }
  }, 100);

  assert.equal(timeoutPlan.action, "timeout");
  assert.equal(timeoutPlan.timeout, true);
  assert.deepEqual(timeoutPlan.examSnapshot, {
    durationMinutes: 6,
    answers: { "qq-2": 1 }
  });
}

console.log("Exam control tests passed.");

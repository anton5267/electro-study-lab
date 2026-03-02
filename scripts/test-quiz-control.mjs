import assert from "node:assert/strict";

import {
  QUIZ_ACTIONS,
  resolveQuizClickAction,
  resolveQuizKeyboardAction
} from "../assets/js/modules/quiz-control.js";

{
  const action = resolveQuizClickAction({
    closest(selector) {
      if (selector === "[data-answer-question]") {
        return {
          dataset: {
            answerQuestion: "qq-3",
            optionIndex: "2"
          }
        };
      }

      return null;
    }
  }, {});

  assert.deepEqual(action, {
    type: QUIZ_ACTIONS.ANSWER,
    questionId: "qq-3",
    optionIndex: 2
  });
}

{
  const action = resolveQuizClickAction({
    closest(selector) {
      if (selector === "[data-answer-question]") {
        return {
          dataset: {
            answerQuestion: "qq-3",
            optionIndex: "2"
          }
        };
      }

      return null;
    }
  }, { "qq-3": 1 });

  assert.deepEqual(action, { type: QUIZ_ACTIONS.NONE });
}

{
  const action = resolveQuizClickAction({
    closest() {
      return null;
    }
  }, {});

  assert.deepEqual(action, { type: QUIZ_ACTIONS.NONE });
}

{
  const action = resolveQuizKeyboardAction(
    [
      { id: "qq-1" },
      { id: "qq-2" }
    ],
    { "qq-1": 2 },
    1
  );

  assert.deepEqual(action, {
    type: QUIZ_ACTIONS.ANSWER,
    questionId: "qq-2",
    optionIndex: 1
  });
}

{
  const action = resolveQuizKeyboardAction(
    [{ id: "qq-1" }],
    { "qq-1": 3 },
    0
  );

  assert.deepEqual(action, { type: QUIZ_ACTIONS.NONE });
}

{
  const action = resolveQuizKeyboardAction(
    [{ id: "qq-1" }],
    {},
    9
  );

  assert.deepEqual(action, { type: QUIZ_ACTIONS.NONE });
}

console.log("Quiz control tests passed.");

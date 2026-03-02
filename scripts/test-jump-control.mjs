import assert from "node:assert/strict";

import {
  JUMP_ACTIONS,
  resolveJumpAction
} from "../assets/js/modules/jump-control.js";

const sections = ["overview", "theory", "flashcards", "practice", "quiz", "exam", "checklist", "analytics"];

{
  const action = resolveJumpAction({
    closest(selector) {
      if (selector === "[data-action='review-now']") {
        return {};
      }
      return null;
    }
  }, sections);

  assert.deepEqual(action, { type: JUMP_ACTIONS.REVIEW_NOW });
}

{
  const action = resolveJumpAction({
    closest(selector) {
      if (selector === "[data-jump-section]") {
        return {
          dataset: {
            jumpSection: "quiz"
          }
        };
      }
      return null;
    }
  }, sections);

  assert.deepEqual(action, {
    type: JUMP_ACTIONS.JUMP_SECTION,
    sectionId: "quiz"
  });
}

{
  const action = resolveJumpAction({
    closest(selector) {
      if (selector === "[data-jump-section]") {
        return {
          dataset: {
            jumpSection: "unknown"
          }
        };
      }
      return null;
    }
  }, sections);

  assert.deepEqual(action, { type: JUMP_ACTIONS.NONE });
}

{
  const action = resolveJumpAction({
    closest() {
      return null;
    }
  }, sections);

  assert.deepEqual(action, { type: JUMP_ACTIONS.NONE });
}

{
  const action = resolveJumpAction(null, sections);
  assert.deepEqual(action, { type: JUMP_ACTIONS.NONE });
}

console.log("Jump control tests passed.");

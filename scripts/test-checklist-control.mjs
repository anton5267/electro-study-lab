import assert from "node:assert/strict";

import {
  CHECKLIST_ACTIONS,
  resolveChecklistClickAction
} from "../assets/js/modules/checklist-control.js";

{
  const action = resolveChecklistClickAction({
    closest(selector) {
      if (selector === "[data-check-index]") {
        return {
          dataset: {
            checkIndex: "2"
          }
        };
      }

      return null;
    }
  });

  assert.deepEqual(action, {
    type: CHECKLIST_ACTIONS.TOGGLE_ITEM,
    index: "2"
  });
}

{
  const action = resolveChecklistClickAction({
    closest() {
      return {
        dataset: {
          checkIndex: ""
        }
      };
    }
  });

  assert.deepEqual(action, {
    type: CHECKLIST_ACTIONS.NONE
  });
}

{
  const action = resolveChecklistClickAction({
    closest() {
      return null;
    }
  });

  assert.deepEqual(action, {
    type: CHECKLIST_ACTIONS.NONE
  });
}

console.log("Checklist control tests passed.");

import assert from "node:assert/strict";

import {
  THEORY_ACTIONS,
  applyDiagramSelection,
  resolveTheoryClickAction
} from "../assets/js/modules/theory-control.js";

{
  const action = resolveTheoryClickAction({
    closest(selector) {
      if (selector === "[data-hotspot-index]") {
        return {
          dataset: {
            cardId: "theory-1",
            hotspotIndex: "2"
          }
        };
      }
      return null;
    }
  });

  assert.deepEqual(action, {
    type: THEORY_ACTIONS.SELECT_HOTSPOT,
    cardId: "theory-1",
    hotspotIndex: 2
  });
}

{
  const action = resolveTheoryClickAction({
    closest() {
      return null;
    }
  });

  assert.deepEqual(action, { type: THEORY_ACTIONS.NONE });
}

{
  const action = resolveTheoryClickAction({
    closest(selector) {
      if (selector === "[data-hotspot-index]") {
        return {
          dataset: {
            cardId: "",
            hotspotIndex: "bad"
          }
        };
      }
      return null;
    }
  });

  assert.deepEqual(action, { type: THEORY_ACTIONS.NONE });
}

{
  const current = { "theory-1": 0 };
  const next = applyDiagramSelection(current, "theory-2", 3);

  assert.deepEqual(next, { "theory-1": 0, "theory-2": 3 });
  assert.deepEqual(current, { "theory-1": 0 });
}

{
  const next = applyDiagramSelection(null, "theory-3", 1);
  assert.deepEqual(next, { "theory-3": 1 });
}

{
  const current = { "theory-1": 1 };
  const next = applyDiagramSelection(current, "theory-2", "bad");
  assert.deepEqual(next, { "theory-1": 1 });
}

console.log("Theory control tests passed.");

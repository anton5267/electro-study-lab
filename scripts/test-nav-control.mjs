import assert from "node:assert/strict";

import {
  NAV_ACTIONS,
  resolveNavClickAction,
  resolveNavKeydownAction
} from "../assets/js/modules/nav-control.js";

const SECTION_IDS = ["overview", "theory", "flashcards", "practice", "quiz", "exam", "checklist", "analytics"];

{
  assert.deepEqual(resolveNavClickAction("quiz", SECTION_IDS), {
    type: NAV_ACTIONS.SELECT_SECTION,
    sectionId: "quiz"
  });

  assert.deepEqual(resolveNavClickAction("unknown", SECTION_IDS), {
    type: NAV_ACTIONS.NONE
  });
}

{
  const action = resolveNavKeydownAction("ArrowRight", 1, ["overview", "theory", "quiz"], SECTION_IDS);
  assert.deepEqual(action, {
    type: NAV_ACTIONS.MOVE_TO_TAB,
    nextIndex: 2,
    sectionId: "quiz"
  });
}

{
  const action = resolveNavKeydownAction("ArrowLeft", 0, ["overview", "theory", "quiz"], SECTION_IDS);
  assert.deepEqual(action, {
    type: NAV_ACTIONS.MOVE_TO_TAB,
    nextIndex: 2,
    sectionId: "quiz"
  });
}

{
  assert.deepEqual(
    resolveNavKeydownAction("Home", 2, ["overview", "theory", "quiz"], SECTION_IDS),
    {
      type: NAV_ACTIONS.MOVE_TO_TAB,
      nextIndex: 0,
      sectionId: "overview"
    }
  );

  assert.deepEqual(
    resolveNavKeydownAction("End", 0, ["overview", "theory", "quiz"], SECTION_IDS),
    {
      type: NAV_ACTIONS.MOVE_TO_TAB,
      nextIndex: 2,
      sectionId: "quiz"
    }
  );
}

{
  assert.deepEqual(
    resolveNavKeydownAction("Enter", 0, ["overview", "theory", "quiz"], SECTION_IDS),
    { type: NAV_ACTIONS.NONE }
  );

  assert.deepEqual(
    resolveNavKeydownAction("ArrowRight", -1, ["overview", "theory", "quiz"], SECTION_IDS),
    { type: NAV_ACTIONS.NONE }
  );

  assert.deepEqual(
    resolveNavKeydownAction("ArrowRight", 0, ["unknown"], SECTION_IDS),
    { type: NAV_ACTIONS.NONE }
  );
}

console.log("Nav control tests passed.");

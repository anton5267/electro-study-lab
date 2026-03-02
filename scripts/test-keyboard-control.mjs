import assert from "node:assert/strict";

import {
  KEYBOARD_ACTIONS,
  resolveMainShortcutAction,
  resolveModalShortcutAction
} from "../assets/js/modules/keyboard-control.js";

const SECTION_IDS = ["overview", "theory", "flashcards", "practice", "quiz", "exam", "checklist", "analytics"];

{
  assert.deepEqual(resolveModalShortcutAction("Escape"), {
    type: KEYBOARD_ACTIONS.MODAL_DISMISS
  });

  assert.deepEqual(resolveModalShortcutAction("Tab"), {
    type: KEYBOARD_ACTIONS.MODAL_TRAP_FOCUS
  });

  assert.deepEqual(resolveModalShortcutAction("Enter"), {
    type: KEYBOARD_ACTIONS.NONE
  });
}

{
  assert.deepEqual(resolveMainShortcutAction("A", "quiz", SECTION_IDS), {
    type: KEYBOARD_ACTIONS.QUIZ_ANSWER,
    optionIndex: 0
  });

  assert.deepEqual(resolveMainShortcutAction("d", "exam", SECTION_IDS), {
    type: KEYBOARD_ACTIONS.EXAM_ANSWER,
    optionIndex: 3
  });
}

{
  assert.deepEqual(resolveMainShortcutAction("3", "flashcards", SECTION_IDS), {
    type: KEYBOARD_ACTIONS.SECTION_JUMP,
    sectionId: "flashcards"
  });
}

{
  assert.deepEqual(resolveMainShortcutAction("ArrowRight", "flashcards", SECTION_IDS), {
    type: KEYBOARD_ACTIONS.FLASHCARD_NEXT
  });

  assert.deepEqual(resolveMainShortcutAction("ArrowLeft", "flashcards", SECTION_IDS), {
    type: KEYBOARD_ACTIONS.FLASHCARD_PREVIOUS
  });

  assert.deepEqual(resolveMainShortcutAction(" ", "flashcards", SECTION_IDS), {
    type: KEYBOARD_ACTIONS.FLASHCARD_FLIP
  });
}

{
  assert.deepEqual(resolveMainShortcutAction("Z", "overview", SECTION_IDS), {
    type: KEYBOARD_ACTIONS.NONE
  });
}

console.log("Keyboard control tests passed.");

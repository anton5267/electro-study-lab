export const KEYBOARD_ACTIONS = Object.freeze({
  NONE: "none",
  MODAL_DISMISS: "modal-dismiss",
  MODAL_TRAP_FOCUS: "modal-trap-focus",
  QUIZ_ANSWER: "quiz-answer",
  EXAM_ANSWER: "exam-answer",
  SECTION_JUMP: "section-jump",
  FLASHCARD_NEXT: "flashcard-next",
  FLASHCARD_PREVIOUS: "flashcard-previous",
  FLASHCARD_FLIP: "flashcard-flip"
});

function resolveOptionIndexFromKey(key) {
  if (!/^[a-dA-D]$/.test(key)) {
    return null;
  }

  return key.toUpperCase().charCodeAt(0) - 65;
}

function resolveSectionFromKey(key, sectionIds) {
  if (!/^[1-8]$/.test(key)) {
    return null;
  }

  const index = Number(key) - 1;
  if (!Array.isArray(sectionIds) || index < 0 || index >= sectionIds.length) {
    return null;
  }

  return sectionIds[index];
}

export function resolveModalShortcutAction(key) {
  if (key === "Escape") {
    return { type: KEYBOARD_ACTIONS.MODAL_DISMISS };
  }

  if (key === "Tab") {
    return { type: KEYBOARD_ACTIONS.MODAL_TRAP_FOCUS };
  }

  return { type: KEYBOARD_ACTIONS.NONE };
}

export function resolveMainShortcutAction(key, activeSection, sectionIds) {
  if (activeSection === "quiz") {
    const optionIndex = resolveOptionIndexFromKey(key);
    if (optionIndex !== null) {
      return {
        type: KEYBOARD_ACTIONS.QUIZ_ANSWER,
        optionIndex
      };
    }
  }

  if (activeSection === "exam") {
    const optionIndex = resolveOptionIndexFromKey(key);
    if (optionIndex !== null) {
      return {
        type: KEYBOARD_ACTIONS.EXAM_ANSWER,
        optionIndex
      };
    }
  }

  const sectionId = resolveSectionFromKey(key, sectionIds);
  if (sectionId) {
    return {
      type: KEYBOARD_ACTIONS.SECTION_JUMP,
      sectionId
    };
  }

  if (activeSection === "flashcards") {
    if (key === "ArrowRight") {
      return { type: KEYBOARD_ACTIONS.FLASHCARD_NEXT };
    }

    if (key === "ArrowLeft") {
      return { type: KEYBOARD_ACTIONS.FLASHCARD_PREVIOUS };
    }

    if (key === " ") {
      return { type: KEYBOARD_ACTIONS.FLASHCARD_FLIP };
    }
  }

  return { type: KEYBOARD_ACTIONS.NONE };
}

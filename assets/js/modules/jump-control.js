export const JUMP_ACTIONS = Object.freeze({
  NONE: "none",
  REVIEW_NOW: "review-now",
  JUMP_SECTION: "jump-section"
});

function normalizeSectionId(value, allowedSections) {
  if (typeof value !== "string" || !value) {
    return null;
  }

  if (Array.isArray(allowedSections) && allowedSections.length && !allowedSections.includes(value)) {
    return null;
  }

  return value;
}

export function resolveJumpAction(target, allowedSections) {
  if (!target || typeof target.closest !== "function") {
    return { type: JUMP_ACTIONS.NONE };
  }

  if (target.closest("[data-action='review-now']")) {
    return { type: JUMP_ACTIONS.REVIEW_NOW };
  }

  const jumpButton = target.closest("[data-jump-section]");
  if (!jumpButton) {
    return { type: JUMP_ACTIONS.NONE };
  }

  const sectionId = normalizeSectionId(jumpButton.dataset.jumpSection, allowedSections);
  if (!sectionId) {
    return { type: JUMP_ACTIONS.NONE };
  }

  return {
    type: JUMP_ACTIONS.JUMP_SECTION,
    sectionId
  };
}

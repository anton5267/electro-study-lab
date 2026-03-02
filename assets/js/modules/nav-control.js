export const NAV_ACTIONS = Object.freeze({
  NONE: "none",
  SELECT_SECTION: "select-section",
  MOVE_TO_TAB: "move-to-tab"
});

function normalizeSectionId(sectionId, allowedSections) {
  if (typeof sectionId !== "string" || !sectionId) {
    return null;
  }

  if (Array.isArray(allowedSections) && allowedSections.length && !allowedSections.includes(sectionId)) {
    return null;
  }

  return sectionId;
}

export function resolveNavClickAction(sectionId, allowedSections) {
  const normalizedSectionId = normalizeSectionId(sectionId, allowedSections);
  if (!normalizedSectionId) {
    return { type: NAV_ACTIONS.NONE };
  }

  return {
    type: NAV_ACTIONS.SELECT_SECTION,
    sectionId: normalizedSectionId
  };
}

export function resolveNavKeydownAction(key, currentIndex, tabSections, allowedSections) {
  if (!Array.isArray(tabSections) || !tabSections.length) {
    return { type: NAV_ACTIONS.NONE };
  }

  if (!Number.isInteger(currentIndex) || currentIndex < 0 || currentIndex >= tabSections.length) {
    return { type: NAV_ACTIONS.NONE };
  }

  let nextIndex = null;

  if (key === "ArrowRight") {
    nextIndex = (currentIndex + 1) % tabSections.length;
  } else if (key === "ArrowLeft") {
    nextIndex = (currentIndex - 1 + tabSections.length) % tabSections.length;
  } else if (key === "Home") {
    nextIndex = 0;
  } else if (key === "End") {
    nextIndex = tabSections.length - 1;
  }

  if (nextIndex === null) {
    return { type: NAV_ACTIONS.NONE };
  }

  const sectionId = normalizeSectionId(tabSections[nextIndex], allowedSections);
  if (!sectionId) {
    return { type: NAV_ACTIONS.NONE };
  }

  return {
    type: NAV_ACTIONS.MOVE_TO_TAB,
    nextIndex,
    sectionId
  };
}

export const CHECKLIST_ACTIONS = Object.freeze({
  NONE: "none",
  TOGGLE_ITEM: "toggle-item"
});

function readChecklistIndex(dataset) {
  if (!dataset || typeof dataset.checkIndex !== "string" || !dataset.checkIndex) {
    return null;
  }

  return dataset.checkIndex;
}

export function resolveChecklistClickAction(target) {
  if (!target || typeof target.closest !== "function") {
    return { type: CHECKLIST_ACTIONS.NONE };
  }

  const item = target.closest("[data-check-index]");
  if (!item) {
    return { type: CHECKLIST_ACTIONS.NONE };
  }

  const index = readChecklistIndex(item.dataset);
  if (index === null) {
    return { type: CHECKLIST_ACTIONS.NONE };
  }

  return {
    type: CHECKLIST_ACTIONS.TOGGLE_ITEM,
    index
  };
}

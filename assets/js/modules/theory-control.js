export const THEORY_ACTIONS = Object.freeze({
  NONE: "none",
  SELECT_HOTSPOT: "select-hotspot"
});

function normalizeCardId(value) {
  return typeof value === "string" && value ? value : null;
}

function normalizeHotspotIndex(value) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 0) {
    return null;
  }

  return parsed;
}

export function resolveTheoryClickAction(target) {
  if (!target || typeof target.closest !== "function") {
    return { type: THEORY_ACTIONS.NONE };
  }

  const hotspotButton = target.closest("[data-hotspot-index]");
  if (!hotspotButton) {
    return { type: THEORY_ACTIONS.NONE };
  }

  const cardId = normalizeCardId(hotspotButton.dataset.cardId);
  const hotspotIndex = normalizeHotspotIndex(hotspotButton.dataset.hotspotIndex);

  if (!cardId || hotspotIndex === null) {
    return { type: THEORY_ACTIONS.NONE };
  }

  return {
    type: THEORY_ACTIONS.SELECT_HOTSPOT,
    cardId,
    hotspotIndex
  };
}

export function applyDiagramSelection(diagramSelections, cardId, hotspotIndex) {
  const normalizedCardId = normalizeCardId(cardId);
  const normalizedHotspotIndex = normalizeHotspotIndex(hotspotIndex);

  const nextSelections = diagramSelections && typeof diagramSelections === "object" && !Array.isArray(diagramSelections)
    ? { ...diagramSelections }
    : {};

  if (!normalizedCardId || normalizedHotspotIndex === null) {
    return nextSelections;
  }

  nextSelections[normalizedCardId] = normalizedHotspotIndex;
  return nextSelections;
}

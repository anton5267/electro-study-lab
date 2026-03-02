function normalizeCount(value) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return 0;
  }

  return parsed;
}

function normalizeIndex(value, total) {
  if (!total) {
    return 0;
  }

  const parsed = Number(value);
  if (!Number.isInteger(parsed)) {
    return 0;
  }

  return ((parsed % total) + total) % total;
}

export function getNextCardIndex(currentCard, visibleCount) {
  const total = normalizeCount(visibleCount);
  if (!total) {
    return null;
  }

  const current = normalizeIndex(currentCard, total);
  return (current + 1) % total;
}

export function getPreviousCardIndex(currentCard, visibleCount) {
  const total = normalizeCount(visibleCount);
  if (!total) {
    return null;
  }

  const current = normalizeIndex(currentCard, total);
  return (current - 1 + total) % total;
}

export function resolveSeenCardsOnFlip(visibleIndexes, currentCard, seenCards) {
  const visible = Array.isArray(visibleIndexes) ? visibleIndexes : [];
  if (!visible.length) {
    return {
      seenCards: seenCards instanceof Set ? new Set(seenCards) : new Set(),
      changed: false
    };
  }

  const current = normalizeIndex(currentCard, visible.length);
  const actualIndex = Number(visible[current]);

  if (!Number.isInteger(actualIndex) || actualIndex < 0) {
    return {
      seenCards: seenCards instanceof Set ? new Set(seenCards) : new Set(),
      changed: false
    };
  }

  const nextSeenCards = seenCards instanceof Set ? new Set(seenCards) : new Set();
  if (nextSeenCards.has(actualIndex)) {
    return {
      seenCards: nextSeenCards,
      changed: false
    };
  }

  nextSeenCards.add(actualIndex);
  return {
    seenCards: nextSeenCards,
    changed: true
  };
}

export function createShuffledCardOrder(totalCards, shuffleArray) {
  const total = normalizeCount(totalCards);
  const baseOrder = Array.from({ length: total }, (_, index) => index);

  if (!total || typeof shuffleArray !== "function") {
    return baseOrder;
  }

  const shuffled = shuffleArray(baseOrder);
  if (!Array.isArray(shuffled)) {
    return baseOrder;
  }

  const normalized = [...new Set(
    shuffled.filter((value) => Number.isInteger(value) && value >= 0 && value < total)
  )];

  if (normalized.length !== total) {
    return baseOrder;
  }

  return normalized;
}

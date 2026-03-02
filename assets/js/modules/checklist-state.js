function normalizeChecklistTotal(totalItems) {
  const parsed = Number(totalItems);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return 0;
  }

  return parsed;
}

export function normalizeChecklistIndex(index, totalItems) {
  const total = normalizeChecklistTotal(totalItems);
  const parsed = Number(index);

  if (!Number.isInteger(parsed) || parsed < 0 || parsed >= total) {
    return null;
  }

  return parsed;
}

export function createCompletedChecklist(totalItems) {
  const total = normalizeChecklistTotal(totalItems);
  const values = Array.from({ length: total }, (_, index) => index);
  return new Set(values);
}

export function createEmptyChecklist() {
  return new Set();
}

export function resolveChecklistToggle(checked, index, totalItems) {
  const nextChecked = checked instanceof Set ? new Set(checked) : new Set();
  const normalizedIndex = normalizeChecklistIndex(index, totalItems);

  if (normalizedIndex === null) {
    return {
      checked: nextChecked,
      changed: false
    };
  }

  if (nextChecked.has(normalizedIndex)) {
    nextChecked.delete(normalizedIndex);
  } else {
    nextChecked.add(normalizedIndex);
  }

  return {
    checked: nextChecked,
    changed: true
  };
}

import assert from "node:assert/strict";

import {
  createCompletedChecklist,
  createEmptyChecklist,
  normalizeChecklistIndex,
  resolveChecklistToggle
} from "../assets/js/modules/checklist-state.js";

{
  assert.deepEqual([...createCompletedChecklist(4)], [0, 1, 2, 3]);
  assert.deepEqual([...createCompletedChecklist(0)], []);
  assert.deepEqual([...createCompletedChecklist("bad")], []);
}

{
  assert.deepEqual([...createEmptyChecklist()], []);
}

{
  assert.equal(normalizeChecklistIndex(0, 3), 0);
  assert.equal(normalizeChecklistIndex("2", 3), 2);
  assert.equal(normalizeChecklistIndex(-1, 3), null);
  assert.equal(normalizeChecklistIndex(3, 3), null);
  assert.equal(normalizeChecklistIndex("bad", 3), null);
}

{
  const current = new Set([0, 2]);
  const toggledOn = resolveChecklistToggle(current, "1", 3);
  assert.equal(toggledOn.changed, true);
  assert.deepEqual([...toggledOn.checked].sort(), [0, 1, 2]);
  assert.deepEqual([...current].sort(), [0, 2]);
}

{
  const current = new Set([0, 1, 2]);
  const toggledOff = resolveChecklistToggle(current, 1, 3);
  assert.equal(toggledOff.changed, true);
  assert.deepEqual([...toggledOff.checked].sort(), [0, 2]);
}

{
  const current = new Set([0]);
  const unchanged = resolveChecklistToggle(current, 10, 3);
  assert.equal(unchanged.changed, false);
  assert.deepEqual([...unchanged.checked], [0]);
}

console.log("Checklist state tests passed.");

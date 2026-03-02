import assert from "node:assert/strict";

import {
  createShuffledCardOrder,
  getNextCardIndex,
  getPreviousCardIndex,
  resolveSeenCardsOnFlip
} from "../assets/js/modules/flashcard-state.js";

{
  assert.equal(getNextCardIndex(0, 3), 1);
  assert.equal(getNextCardIndex(2, 3), 0);
  assert.equal(getNextCardIndex(10, 3), 2);
  assert.equal(getNextCardIndex(0, 0), null);
}

{
  assert.equal(getPreviousCardIndex(0, 3), 2);
  assert.equal(getPreviousCardIndex(2, 3), 1);
  assert.equal(getPreviousCardIndex(-1, 3), 1);
  assert.equal(getPreviousCardIndex(0, 0), null);
}

{
  const seen = new Set([0]);
  const result = resolveSeenCardsOnFlip([2, 1, 3], 1, seen);
  assert.equal(result.changed, true);
  assert.deepEqual([...result.seenCards].sort(), [0, 1]);
  assert.deepEqual([...seen], [0]);
}

{
  const seen = new Set([1]);
  const result = resolveSeenCardsOnFlip([2, 1, 3], 1, seen);
  assert.equal(result.changed, false);
  assert.deepEqual([...result.seenCards], [1]);
}

{
  const result = resolveSeenCardsOnFlip([], 0, new Set([0]));
  assert.equal(result.changed, false);
  assert.deepEqual([...result.seenCards], [0]);
}

{
  const reverse = (items) => [...items].reverse();
  assert.deepEqual(createShuffledCardOrder(4, reverse), [3, 2, 1, 0]);
  assert.deepEqual(createShuffledCardOrder(3, null), [0, 1, 2]);
  assert.deepEqual(createShuffledCardOrder(3, () => [0, 0, 1]), [0, 1, 2]);
}

console.log("Flashcard state tests passed.");

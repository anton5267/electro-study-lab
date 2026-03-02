import assert from "node:assert/strict";

import {
  getStorageKey,
  loadJson,
  migrateStorageSchema,
  saveJson
} from "../assets/js/modules/storage.js";

function createLocalStorage() {
  const store = new Map();
  return {
    getItem(key) {
      return store.has(key) ? store.get(key) : null;
    },
    setItem(key, value) {
      store.set(String(key), String(value));
    },
    removeItem(key) {
      store.delete(key);
    }
  };
}

const originalWindow = globalThis.window;
globalThis.window = {
  localStorage: createLocalStorage()
};

try {
  {
    const requiredKeys = [
      "schemaVersion",
      "language",
      "checklist",
      "seenCards",
      "cardOrder",
      "practiceAnswers",
      "practiceSolved",
      "quizAnswers",
      "quizMastered",
      "quizMode",
      "quizVariantIds",
      "reviewQueue",
      "stats",
      "customPack",
      "onboardingSeen",
      "examState",
      "examDurationMinutes",
      "examQuestionCount",
      "viewState"
    ];

    requiredKeys.forEach((key) => {
      assert.equal(typeof getStorageKey(key), "string", `Storage key "${key}" must be defined.`);
      assert(getStorageKey(key).startsWith("study."), `Storage key "${key}" must use study.* namespace.`);
    });
  }

  {
    migrateStorageSchema();
    assert.equal(loadJson(getStorageKey("schemaVersion"), 0), 1);
  }

  {
    migrateStorageSchema();
    assert.equal(loadJson(getStorageKey("schemaVersion"), 0), 1);
  }

  console.log("Storage tests passed.");
} finally {
  globalThis.window = originalWindow;
}

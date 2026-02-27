import assert from "node:assert/strict";

import {
  buildBackupPayload,
  createImportedBackupState,
  normalizeStudyProgress,
  readStringArray
} from "../assets/js/modules/progress-state.js";
import { hydrateExamState as hydrateExamStateHelper } from "../assets/js/modules/runtime.js";

const SECTION_IDS = ["overview", "theory", "flashcards", "practice", "quiz", "exam", "checklist", "analytics"];

const contentPack = {
  uk: {
    topicLabels: {
      safety: "Безпека",
      switching: "Схеми"
    },
    theory: [
      { id: "theory-1" },
      { id: "theory-2" }
    ],
    flashcards: [
      { id: "fc-1" },
      { id: "fc-2" },
      { id: "fc-3" }
    ],
    practiceProblems: [
      { id: "pp-1" },
      { id: "pp-2" }
    ],
    quizData: [
      { id: "qq-1", correct: 1 },
      { id: "qq-2", correct: 0 }
    ],
    checklistItems: ["A", "B", "C"],
    achievements: {
      starter: {},
      finisher: {}
    }
  },
  de: {
    topicLabels: {
      safety: "Sicherheit",
      switching: "Schaltungen"
    },
    theory: [
      { id: "theory-1" },
      { id: "theory-2" }
    ],
    flashcards: [
      { id: "fc-1" },
      { id: "fc-2" },
      { id: "fc-3" }
    ],
    practiceProblems: [
      { id: "pp-1" },
      { id: "pp-2" }
    ],
    quizData: [
      { id: "qq-1", correct: 1 },
      { id: "qq-2", correct: 0 }
    ],
    checklistItems: ["A", "B", "C"],
    achievements: {
      starter: {},
      finisher: {}
    }
  }
};

function createEmptyExamState() {
  return {
    status: "idle",
    questionIds: [],
    answers: {},
    durationMinutes: 10,
    endAt: null,
    timerId: null,
    result: null
  };
}

function hydrateExamState(value, content) {
  return hydrateExamStateHelper(value, content.quizData, createEmptyExamState, 1000);
}

{
  assert.deepEqual(readStringArray(["a", 1, "b", null]), ["a", "b"]);
}

{
  const payload = buildBackupPayload({
    lang: "de",
    onboardingSeen: true,
    customPack: { uk: { flashcards: [{ id: "extra" }] } },
    activeSection: "quiz",
    activeTopic: "switching",
    searchQuery: "kreuz",
    currentCard: 2,
    diagramSelections: { "theory-1": 1 },
    checked: new Set([0, 2]),
    seenCards: new Set([1]),
    cardOrder: [2, 1, 0],
    practiceAnswers: { "pp-1": "12" },
    practiceSolved: new Set(["pp-1"]),
    quizAnswers: { "qq-1": 2 },
    quizMastered: new Set(["qq-1"]),
    quizMode: "review",
    quizVariantIds: ["qq-1"],
    reviewQueue: new Set(["qq-2"]),
    stats: { quizRuns: 4 },
    exam: { status: "running" }
  }, () => ({ status: "running", questionIds: ["qq-1"] }), new Date("2026-02-27T15:00:00.000Z"));

  assert.deepEqual(payload, {
    version: 2,
    savedAt: "2026-02-27T15:00:00.000Z",
    language: "de",
    onboardingSeen: true,
    customPack: { uk: { flashcards: [{ id: "extra" }] } },
    viewState: {
      activeSection: "quiz",
      activeTopic: "switching",
      searchQuery: "kreuz",
      currentCard: 2,
      diagramSelections: { "theory-1": 1 }
    },
    progress: {
      checklist: [0, 2],
      seenCards: [1],
      cardOrder: [2, 1, 0],
      practiceAnswers: { "pp-1": "12" },
      practiceSolved: ["pp-1"],
      quizAnswers: { "qq-1": 2 },
      quizMastered: ["qq-1"],
      quizMode: "review",
      quizVariantIds: ["qq-1"],
      reviewQueue: ["qq-2"],
      stats: { quizRuns: 4 },
      examState: { status: "running", questionIds: ["qq-1"] }
    }
  });
}

{
  const normalized = normalizeStudyProgress({
    activeTopic: "unknown",
    checked: new Set([0, 4]),
    seenCards: [2, 9],
    cardOrder: [2, 2, 0],
    currentCard: 9,
    diagramSelections: {
      "theory-2": 3,
      missing: 1
    },
    practiceAnswers: {
      "pp-1": "12",
      missing: "nope"
    },
    practiceSolved: ["pp-2", "missing"],
    quizAnswers: {
      "qq-1": 3,
      nope: 1
    },
    quizMastered: ["qq-2", "missing"],
    quizMode: "variant",
    quizVariantIds: ["qq-2", "missing"],
    reviewQueue: new Set(["qq-1", "missing"]),
    stats: {
      quizRuns: 3,
      achievements: ["starter", "missing"]
    },
    examState: {
      status: "running",
      questionIds: ["qq-1", "missing"],
      answers: {
        "qq-1": 2,
        missing: 1
      },
      durationMinutes: 12,
      endAt: 1500
    }
  }, contentPack.uk, hydrateExamState);

  assert.equal(normalized.activeTopic, "all");
  assert.deepEqual([...normalized.checked], [0]);
  assert.deepEqual([...normalized.seenCards], [2]);
  assert.deepEqual(normalized.cardOrder, [0, 1, 2]);
  assert.equal(normalized.currentCard, 2);
  assert.deepEqual(normalized.diagramSelections, { "theory-2": 3 });
  assert.deepEqual(normalized.practiceAnswers, { "pp-1": "12" });
  assert.deepEqual([...normalized.practiceSolved], ["pp-2"]);
  assert.deepEqual(normalized.quizAnswers, { "qq-1": 3 });
  assert.deepEqual([...normalized.quizMastered], ["qq-2"]);
  assert.equal(normalized.quizMode, "variant");
  assert.deepEqual(normalized.quizVariantIds, ["qq-2"]);
  assert.deepEqual([...normalized.reviewQueue], ["qq-1"]);
  assert.deepEqual(normalized.stats.achievements, ["starter"]);
  assert.equal(normalized.exam.status, "running");
  assert.deepEqual(normalized.exam.questionIds, ["qq-1"]);
}

{
  const imported = createImportedBackupState({
    language: "de",
    onboardingSeen: false,
    customPack: { de: { checklistItems: ["Extra"] } },
    viewState: {
      activeSection: "theory",
      activeTopic: "switching",
      searchQuery: "kreuz",
      currentCard: 1,
      diagramSelections: {
        "theory-1": 0
      }
    },
    progress: {
      checklist: [0, 1],
      seenCards: [0],
      cardOrder: [1, 0, 2],
      practiceAnswers: { "pp-2": "18" },
      practiceSolved: ["pp-2"],
      quizAnswers: { "qq-2": 1 },
      quizMastered: ["qq-2"],
      quizMode: "review",
      quizVariantIds: ["qq-1", "qq-2"],
      reviewQueue: ["qq-1"],
      stats: {
        quizRuns: 2,
        achievements: ["finisher"]
      },
      examState: {
        status: "running",
        questionIds: ["qq-2"],
        answers: { "qq-2": 0 },
        durationMinutes: 8,
        endAt: 5000
      }
    }
  }, contentPack, "uk", SECTION_IDS, hydrateExamState);

  assert.equal(imported.lang, "de");
  assert.equal(imported.customPack.de.checklistItems[0], "Extra");
  assert.equal(imported.activeSection, "exam");
  assert.equal(imported.activeTopic, "switching");
  assert.equal(imported.searchQuery, "kreuz");
  assert.equal(imported.currentCard, 1);
  assert.deepEqual(imported.diagramSelections, { "theory-1": 0 });
  assert.deepEqual([...imported.checked], [0, 1]);
  assert.deepEqual(imported.cardOrder, [1, 0, 2]);
  assert.equal(imported.quizLogged, false);
  assert.equal(imported.onboardingSeen, false);
  assert.equal(imported.exam.status, "running");
  assert.deepEqual(imported.exam.questionIds, ["qq-2"]);
}

console.log("Progress state tests passed.");

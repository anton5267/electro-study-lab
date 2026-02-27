import assert from "node:assert/strict";

import { BASE_CONTENT, buildContentPack } from "../assets/js/modules/content.js";
import { validateBackupPayload, validateCustomPack } from "../assets/js/modules/validation.js";

{
  const validPack = {
    uk: {
      flashcards: [
        {
          id: "custom-fc-200",
          topic: "measurement",
          term: "Тестовий термін",
          def: "Тестове пояснення"
        }
      ],
      quizData: [
        {
          id: "custom-qq-200",
          topic: "measurement",
          q: "Тест?",
          opts: ["A", "B", "C", "D"],
          correct: 2,
          explanation: "Пояснення"
        }
      ]
    }
  };

  const result = validateCustomPack(validPack, BASE_CONTENT);
  assert.equal(result.valid, true);
  assert.deepEqual(result.errors, []);
}

{
  const invalidPack = {
    uk: {
      flashcards: [
        {
          id: "fc-1",
          topic: "unknown",
          term: "",
          def: "ok"
        }
      ]
    },
    extra: {}
  };

  const result = validateCustomPack(invalidPack, BASE_CONTENT);
  assert.equal(result.valid, false);
  assert(result.errors.some((message) => message.includes("Unknown root key")));
  assert(result.errors.some((message) => message.includes("collides with base ids")));
  assert(result.errors.some((message) => message.includes("known topic")));
}

{
  const customPack = {
    uk: {
      theory: [
        {
          id: "custom-theory-1",
          topic: "switching",
          icon: "S1",
          title: "Додаткова схема",
          lead: "Пояснення",
          intro: ["Крок 1"],
          diagram: {
            type: "spar",
            hotspots: [{ label: "L", text: "Line" }]
          }
        }
      ],
      quizData: [
        {
          id: "custom-qq-1",
          topic: "switching",
          q: "Тест?",
          opts: ["A", "B", "C", "D"],
          correct: 0,
          explanation: "Пояснення"
        }
      ]
    }
  };
  const contentPack = buildContentPack(customPack);
  const validBackup = {
    version: 2,
    savedAt: "2026-02-27T12:00:00.000Z",
    language: "uk",
    onboardingSeen: true,
    customPack,
    viewState: {
      activeSection: "theory",
      activeTopic: "switching",
      searchQuery: "схема",
      currentCard: 2,
      diagramSelections: {
        "custom-theory-1": 0
      }
    },
    progress: {
      checklist: [0, 1],
      seenCards: [0],
      cardOrder: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
      practiceAnswers: { "pp-1": "0.23" },
      practiceSolved: ["pp-1"],
      quizAnswers: { "qq-1": 1 },
      quizMastered: ["qq-1"],
      quizMode: "variant",
      quizVariantIds: ["qq-1", "qq-2"],
      reviewQueue: ["qq-3"],
      stats: {
        quizRuns: 1
      },
      examState: {
        status: "finished",
        questionIds: ["qq-1", "qq-2"],
        result: {
          score: 1,
          total: 2,
          timeout: false,
          wrongQuestionIds: ["qq-2"]
        }
      }
    }
  };

  const result = validateBackupPayload(validBackup, contentPack);
  assert.equal(result.valid, true);
  assert.deepEqual(result.errors, []);
}

{
  const contentPack = buildContentPack(null);
  const invalidBackup = {
    version: 0,
    savedAt: "not-a-date",
    language: "uk",
    activeTopic: "bad-topic",
    viewState: {
      activeSection: "missing",
      currentCard: -1,
      diagramSelections: {
        unknown: 4
      }
    },
    progress: {
      checklist: [],
      seenCards: [],
      cardOrder: [],
      practiceAnswers: {},
      practiceSolved: [],
      quizAnswers: {},
      quizMastered: [],
      quizMode: "bad-mode",
      quizVariantIds: [],
      reviewQueue: [],
      examState: {
        status: "finished",
        questionIds: ["qq-1"],
        result: {
          score: "x",
          total: 1,
          timeout: "no",
          wrongQuestionIds: ["missing"]
        }
      }
    }
  };

  const result = validateBackupPayload(invalidBackup, contentPack);
  assert.equal(result.valid, false);
  assert(result.errors.some((message) => message.includes("Backup version")));
  assert(result.errors.some((message) => message.includes("savedAt")));
  assert(result.errors.some((message) => message.includes("unknown topic")));
  assert(result.errors.some((message) => message.includes("viewState.activeSection")));
  assert(result.errors.some((message) => message.includes("viewState.currentCard")));
  assert(result.errors.some((message) => message.includes("viewState.diagramSelections")));
  assert(result.errors.some((message) => message.includes('quizMode')));
  assert(result.errors.some((message) => message.includes("score must be a number")));
  assert(result.errors.some((message) => message.includes("wrongQuestionIds")));
}

console.log("Validation tests passed.");

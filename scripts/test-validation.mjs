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
  const htmlPack = {
    uk: {
      flashcards: [
        {
          id: "custom-fc-unsafe",
          topic: "measurement",
          term: "<img src=x onerror=alert(1)>",
          def: "safe"
        }
      ]
    }
  };

  const result = validateCustomPack(htmlPack, BASE_CONTENT);
  assert.equal(result.valid, false);
  assert(result.errors.some((message) => message.includes("must not contain HTML tags")));
}

{
  const oversizedPack = {
    uk: {
      flashcards: Array.from({ length: 501 }, (_, index) => ({
        id: `custom-fc-limit-${index + 1}`,
        topic: "measurement",
        term: `Термін ${index + 1}`,
        def: `Опис ${index + 1}`
      }))
    }
  };

  const result = validateCustomPack(oversizedPack, BASE_CONTENT);
  assert.equal(result.valid, false);
  assert(result.errors.some((message) => message.includes("exceeds max items")));
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
    examSettings: {
      durationMinutes: 10,
      questionCount: 8
    },
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
    examSettings: {
      durationMinutes: 99,
      questionCount: "bad"
    },
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
  assert(result.errors.some((message) => message.includes("examSettings.durationMinutes")));
  assert(result.errors.some((message) => message.includes("examSettings.questionCount")));
  assert(result.errors.some((message) => message.includes('quizMode')));
  assert(result.errors.some((message) => message.includes("score must be a number")));
  assert(result.errors.some((message) => message.includes("wrongQuestionIds")));
}

{
  const contentPack = buildContentPack(null);
  const invalidProgressTypes = {
    language: "uk",
    progress: {
      checklist: [0, "bad-index"],
      seenCards: [{}],
      cardOrder: [0, -1],
      practiceAnswers: { "pp-1": null },
      practiceSolved: [123],
      quizAnswers: { "qq-1": 9 },
      quizMastered: [false],
      quizVariantIds: [null],
      reviewQueue: [{}]
    }
  };

  const result = validateBackupPayload(invalidProgressTypes, contentPack);
  assert.equal(result.valid, false);
  assert(result.errors.some((message) => message.includes("progress.checklist must contain non-negative integers")));
  assert(result.errors.some((message) => message.includes("progress.seenCards must contain non-negative integers")));
  assert(result.errors.some((message) => message.includes("progress.cardOrder must contain non-negative integers")));
  assert(result.errors.some((message) => message.includes("progress.practiceAnswers must map ids to string/number values")));
  assert(result.errors.some((message) => message.includes("progress.practiceSolved must contain non-empty strings")));
  assert(result.errors.some((message) => message.includes("progress.quizAnswers must map ids to answer indexes 0-3")));
  assert(result.errors.some((message) => message.includes("progress.quizMastered must contain non-empty strings")));
  assert(result.errors.some((message) => message.includes("progress.quizVariantIds must contain non-empty strings")));
  assert(result.errors.some((message) => message.includes("progress.reviewQueue must contain non-empty strings")));
}

{
  const unsafeLegacyPack = {
    uk: {
      flashcards: [
        {
          id: "legacy-fc-1",
          topic: "measurement",
          term: "<script>alert(1)</script>Voltage",
          def: "<b>Unsafe</b> content"
        }
      ]
    }
  };

  const contentPack = buildContentPack(unsafeLegacyPack);
  const importedCard = contentPack.uk.flashcards.find((item) => item.id === "legacy-fc-1");

  assert(importedCard);
  assert.equal(importedCard.term.includes("<"), false);
  assert.equal(importedCard.def.includes("<"), false);
}

console.log("Validation tests passed.");

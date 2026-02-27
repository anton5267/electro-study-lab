import assert from "node:assert/strict";

import {
  buildViewStateSnapshot,
  buildStateUrl,
  getInitialUrlState,
  normalizeViewStateSnapshot,
  resolveInitialViewState,
  hydrateExamState,
  serializeExamState
} from "../assets/js/modules/runtime.js";

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
    ]
  },
  de: {
    topicLabels: {
      safety: "Sicherheit",
      switching: "Schaltungen"
    },
    theory: [
      { id: "theory-1" },
      { id: "theory-2" }
    ]
  }
};

const questions = [
  { id: "qq-1", correct: 1 },
  { id: "qq-2", correct: 0 },
  { id: "qq-3", correct: 2 }
];

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

{
  const state = getInitialUrlState(
    "http://localhost:4173/index.html?lang=de&topic=safety&q=schutz#quiz",
    contentPack,
    "uk",
    SECTION_IDS
  );

  assert.deepEqual(state, {
    lang: "de",
    activeTopic: "safety",
    searchQuery: "schutz",
    section: "quiz"
  });
}

{
  const state = getInitialUrlState(
    "http://localhost:4173/index.html?lang=fr&topic=unknown&q=test#missing",
    contentPack,
    "uk",
    SECTION_IDS
  );

  assert.deepEqual(state, {
    lang: "uk",
    activeTopic: "all",
    searchQuery: "test",
    section: "overview"
  });
}

{
  const url = buildStateUrl("http://localhost:4173/index.html?lang=uk#overview", {
    lang: "de",
    activeTopic: "switching",
    searchQuery: "kreuz",
    activeSection: "flashcards"
  });

  assert.equal(url, "/index.html?lang=de&topic=switching&q=kreuz#flashcards");
}

{
  const state = resolveInitialViewState(
    "http://localhost:4173/index.html?lang=de",
    {
      activeSection: "practice",
      activeTopic: "safety",
      searchQuery: "schutz",
      currentCard: 4,
      diagramSelections: {
        "theory-1": 2,
        missing: 1
      }
    },
    contentPack,
    "uk",
    SECTION_IDS
  );

  assert.deepEqual(state, {
    lang: "de",
    activeSection: "practice",
    activeTopic: "safety",
    searchQuery: "schutz",
    currentCard: 4,
    diagramSelections: {
      "theory-1": 2
    }
  });
}

{
  const snapshot = buildViewStateSnapshot({
    activeSection: "theory",
    activeTopic: "switching",
    searchQuery: "kreuz",
    currentCard: 3,
    diagramSelections: {
      "theory-2": 1
    }
  });

  assert.deepEqual(snapshot, {
    activeSection: "theory",
    activeTopic: "switching",
    searchQuery: "kreuz",
    currentCard: 3,
    diagramSelections: {
      "theory-2": 1
    }
  });
}

{
  const normalized = normalizeViewStateSnapshot({
    activeSection: "missing",
    activeTopic: "unknown",
    searchQuery: 42,
    currentCard: -1,
    diagramSelections: {
      "theory-2": 2,
      broken: 1,
      "theory-1": -1
    }
  }, contentPack.uk, SECTION_IDS);

  assert.deepEqual(normalized, {
    activeSection: "overview",
    activeTopic: "all",
    searchQuery: "",
    currentCard: 0,
    diagramSelections: {
      "theory-2": 2
    }
  });
}

{
  const running = hydrateExamState({
    status: "running",
    questionIds: ["qq-1", "qq-2", "unknown"],
    answers: {
      "qq-1": 2,
      "qq-2": 0,
      nope: 1
    },
    durationMinutes: 15,
    endAt: 123456
  }, questions, createEmptyExamState, 42);

  assert.equal(running.status, "running");
  assert.deepEqual(running.questionIds, ["qq-1", "qq-2"]);
  assert.deepEqual(running.answers, { "qq-1": 2, "qq-2": 0 });
  assert.equal(running.durationMinutes, 15);
  assert.equal(running.endAt, 123456);
}

{
  const finished = hydrateExamState({
    status: "finished",
    questionIds: ["qq-1", "qq-2"],
    result: {
      score: 1,
      total: 2,
      timeout: true,
      wrongQuestionIds: ["qq-2", "missing"]
    }
  }, questions, createEmptyExamState, 42);

  assert.equal(finished.status, "finished");
  assert.equal(finished.result.score, 1);
  assert.equal(finished.result.total, 2);
  assert.equal(finished.result.timeout, true);
  assert.deepEqual(finished.result.wrongQuestions.map((item) => item.id), ["qq-2"]);
}

{
  const serialized = serializeExamState({
    status: "finished",
    questionIds: ["qq-1", "qq-2"],
    result: {
      score: 1,
      total: 2,
      timeout: false,
      wrongQuestions: [{ id: "qq-2" }]
    }
  });

  assert.deepEqual(serialized, {
    status: "finished",
    questionIds: ["qq-1", "qq-2"],
    result: {
      score: 1,
      total: 2,
      timeout: false,
      wrongQuestionIds: ["qq-2"]
    }
  });
}

console.log("Runtime tests passed.");

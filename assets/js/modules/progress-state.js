import { buildViewStateSnapshot, normalizeViewStateSnapshot } from "./runtime.js";
import { createDefaultStats, normalizeStats } from "./storage.js";
import { buildExamPreferences } from "./exam-preferences.js";
import { clamp, normalizeCardOrder, normalizeMap, normalizeNumberArray } from "./utils.js";

export const BACKUP_VERSION = 3;

export function readStringArray(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item) => typeof item === "string");
}

export function migrateBackupPayload(payload) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return payload;
  }

  const migrated = {
    ...payload
  };
  const legacyProgress = extractLegacyProgress(payload);
  if (!migrated.progress && legacyProgress) {
    migrated.progress = legacyProgress;
  }

  if (!migrated.viewState) {
    const legacyViewState = extractLegacyViewState(payload);
    if (legacyViewState) {
      migrated.viewState = legacyViewState;
    }
  }

  if (!migrated.examSettings) {
    const legacyExamSettings = extractLegacyExamSettings(payload);
    if (legacyExamSettings) {
      migrated.examSettings = legacyExamSettings;
    }
  }

  migrated.version = BACKUP_VERSION;
  return migrated;
}

export function buildBackupPayload(state, serializeExamState, now = new Date()) {
  return {
    version: BACKUP_VERSION,
    savedAt: now.toISOString(),
    language: state.lang,
    onboardingSeen: state.onboardingSeen,
    examSettings: {
      durationMinutes: state.examDurationMinutes,
      questionCount: state.examQuestionCount
    },
    customPack: state.customPack,
    viewState: buildViewStateSnapshot(state),
    progress: {
      checklist: [...state.checked],
      seenCards: [...state.seenCards],
      cardOrder: state.cardOrder,
      practiceAnswers: state.practiceAnswers,
      practiceSolved: [...state.practiceSolved],
      quizAnswers: state.quizAnswers,
      quizMastered: [...state.quizMastered],
      quizMode: state.quizMode,
      quizVariantIds: state.quizVariantIds,
      reviewQueue: [...state.reviewQueue],
      stats: state.stats,
      examState: serializeExamState(state.exam)
    }
  };
}

export function createImportedBackupState(payload, contentPack, currentLanguage, sectionIds, hydrateExamState) {
  const nextLanguage = contentPack[payload.language] ? payload.language : currentLanguage;
  const content = contentPack[nextLanguage];
  const viewState = normalizeViewStateSnapshot(
    payload.viewState ?? { activeTopic: payload.activeTopic },
    content,
    sectionIds
  );
  const progress = normalizeStudyProgress({
    ...payload.progress,
    activeTopic: viewState.activeTopic,
    currentCard: viewState.currentCard,
    diagramSelections: viewState.diagramSelections
  }, content, hydrateExamState);
  const examSettings = resolveImportedExamSettings(payload.examSettings);

  const importedState = {
    customPack: payload.customPack ?? null,
    lang: nextLanguage,
    activeSection: progress.exam.status === "running" ? "exam" : viewState.activeSection,
    activeTopic: progress.activeTopic,
    searchQuery: viewState.searchQuery,
    currentCard: progress.currentCard,
    diagramSelections: progress.diagramSelections,
    checked: progress.checked,
    seenCards: progress.seenCards,
    cardOrder: progress.cardOrder,
    practiceAnswers: progress.practiceAnswers,
    practiceSolved: progress.practiceSolved,
    quizAnswers: progress.quizAnswers,
    quizMastered: progress.quizMastered,
    quizMode: progress.quizMode,
    quizVariantIds: progress.quizVariantIds,
    reviewQueue: progress.reviewQueue,
    stats: progress.stats,
    exam: progress.exam,
    quizLogged: false,
    onboardingSeen: Boolean(payload.onboardingSeen)
  };

  if (examSettings) {
    importedState.examDurationMinutes = examSettings.durationMinutes;
    importedState.examQuestionCount = examSettings.questionCount;
  }

  return importedState;
}

export function normalizeStudyProgress(source, content, hydrateExamState) {
  const practiceIds = new Set(content.practiceProblems.map((problem) => problem.id));
  const quizIds = new Set(content.quizData.map((question) => question.id));
  const theoryIds = new Set(content.theory.map((card) => card.id));
  const stats = normalizeStats(source.stats ?? createDefaultStats());

  return {
    activeTopic: source.activeTopic !== "all" && !content.topicLabels[source.activeTopic] ? "all" : source.activeTopic || "all",
    checked: new Set(normalizeNumberArray(toArray(source.checked ?? source.checklist ?? []), content.checklistItems.length)),
    seenCards: new Set(normalizeNumberArray(toArray(source.seenCards ?? []), content.flashcards.length)),
    cardOrder: normalizeCardOrder(toArray(source.cardOrder ?? []), content.flashcards.length),
    currentCard: clamp(Number(source.currentCard) || 0, 0, Math.max(content.flashcards.length - 1, 0)),
    diagramSelections: Object.fromEntries(
      Object.entries(normalizeMap(source.diagramSelections ?? {})).filter(([cardId, index]) => (
        theoryIds.has(cardId) &&
        Number.isInteger(Number(index)) &&
        Number(index) >= 0
      )).map(([cardId, index]) => [cardId, Number(index)])
    ),
    practiceAnswers: Object.fromEntries(
      Object.entries(normalizeMap(source.practiceAnswers ?? {})).filter(([id]) => practiceIds.has(id))
    ),
    practiceSolved: new Set(readStringArray(toArray(source.practiceSolved ?? [])).filter((id) => practiceIds.has(id))),
    quizAnswers: Object.fromEntries(
      Object.entries(normalizeMap(source.quizAnswers ?? {})).filter(([id]) => quizIds.has(id))
    ),
    quizMastered: new Set(readStringArray(toArray(source.quizMastered ?? [])).filter((id) => quizIds.has(id))),
    quizMode: typeof source.quizMode === "string" ? source.quizMode : "default",
    quizVariantIds: readStringArray(toArray(source.quizVariantIds ?? [])).filter((id) => quizIds.has(id)),
    reviewQueue: new Set(readStringArray(toArray(source.reviewQueue ?? [])).filter((id) => quizIds.has(id))),
    stats: {
      ...stats,
      achievements: stats.achievements.filter((id) => content.achievements[id])
    },
    exam: hydrateExamState(source.examState ?? source.exam ?? null, content)
  };
}

function toArray(value) {
  if (Array.isArray(value)) {
    return value;
  }

  if (value instanceof Set) {
    return [...value];
  }

  return [];
}

function resolveImportedExamSettings(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return buildExamPreferences(value.durationMinutes, value.questionCount);
}

function extractLegacyProgress(payload) {
  const keys = [
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
    "examState"
  ];
  const progress = {};
  let hasAny = false;

  keys.forEach((key) => {
    if (payload[key] === undefined) {
      return;
    }
    progress[key] = payload[key];
    hasAny = true;
  });

  return hasAny ? progress : null;
}

function extractLegacyViewState(payload) {
  const keys = ["activeSection", "activeTopic", "searchQuery", "currentCard", "diagramSelections"];
  const viewState = {};
  let hasAny = false;

  keys.forEach((key) => {
    if (payload[key] === undefined) {
      return;
    }
    viewState[key] = payload[key];
    hasAny = true;
  });

  return hasAny ? viewState : null;
}

function extractLegacyExamSettings(payload) {
  if (payload.examDurationMinutes === undefined && payload.examQuestionCount === undefined) {
    return null;
  }

  return {
    durationMinutes: payload.examDurationMinutes,
    questionCount: payload.examQuestionCount
  };
}

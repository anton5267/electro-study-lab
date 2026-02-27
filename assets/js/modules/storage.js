const STORAGE_KEYS = {
  language: "study.language",
  checklist: "study.checklist",
  seenCards: "study.seenCards",
  cardOrder: "study.cardOrder",
  practiceAnswers: "study.practiceAnswers",
  practiceSolved: "study.practiceSolved",
  quizAnswers: "study.quizAnswers",
  quizMastered: "study.quizMastered",
  quizMode: "study.quizMode",
  quizVariantIds: "study.quizVariantIds",
  reviewQueue: "study.reviewQueue",
  stats: "study.stats",
  customPack: "study.customPack",
  onboardingSeen: "study.onboardingSeen",
  examState: "study.examState",
  viewState: "study.viewState"
};

export function getStorageKey(key) {
  return STORAGE_KEYS[key];
}

export function loadJson(key, fallbackValue) {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallbackValue;
  } catch (error) {
    return fallbackValue;
  }
}

export function saveJson(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    return;
  }
}

export function removeStorageKey(key) {
  try {
    window.localStorage.removeItem(key);
  } catch (error) {
    return;
  }
}

export function appendHistoryEntry(stats, entry) {
  const history = Array.isArray(stats.history) ? [...stats.history] : [];
  history.unshift(entry);

  return {
    ...stats,
    history: history.slice(0, 12)
  };
}

export function createDefaultStats() {
  return {
    quizRuns: 0,
    examRuns: 0,
    practiceSolvedCount: 0,
    bestQuizScore: 0,
    bestExamScore: 0,
    averageExamScore: 0,
    averageQuizScore: 0,
    studyStreak: 0,
    lastStudyDate: "",
    achievements: [],
    history: []
  };
}

export function normalizeStats(value) {
  const fallback = createDefaultStats();

  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return fallback;
  }

  return {
    quizRuns: Number(value.quizRuns) || 0,
    examRuns: Number(value.examRuns) || 0,
    practiceSolvedCount: Number(value.practiceSolvedCount) || 0,
    bestQuizScore: Number(value.bestQuizScore) || 0,
    bestExamScore: Number(value.bestExamScore) || 0,
    averageExamScore: Number(value.averageExamScore) || 0,
    averageQuizScore: Number(value.averageQuizScore) || 0,
    studyStreak: Number(value.studyStreak) || 0,
    lastStudyDate: typeof value.lastStudyDate === "string" ? value.lastStudyDate : "",
    achievements: Array.isArray(value.achievements) ? value.achievements.filter((item) => typeof item === "string") : [],
    history: Array.isArray(value.history) ? value.history.slice(0, 12) : []
  };
}

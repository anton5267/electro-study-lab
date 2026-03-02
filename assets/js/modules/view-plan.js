const APP_BOOT_VIEW_IDS = [
  "static",
  "overview",
  "theory",
  "flashcards",
  "practice",
  "quiz",
  "exam",
  "checklist",
  "analytics",
  "progress"
];

const SEARCH_DEPENDENT_VIEW_IDS = ["overview", "theory", "flashcards", "practice", "checklist"];
const TOPIC_DEPENDENT_VIEW_IDS = ["topicFilters", "overview", "theory", "flashcards", "practice", "quiz", "checklist", "analytics"];
const PROGRESS_VIEW_IDS_WITH_ANALYTICS = ["progress", "overview", "analytics"];
const PROGRESS_VIEW_IDS_BASE = ["progress", "overview"];

export function getAppBootViewPlan() {
  return {
    viewIds: [...APP_BOOT_VIEW_IDS],
    resetFlashcards: true
  };
}

export function getSearchDependentViewPlan() {
  return {
    viewIds: [...SEARCH_DEPENDENT_VIEW_IDS],
    resetFlashcards: true
  };
}

export function getTopicDependentViewPlan() {
  return {
    viewIds: [...TOPIC_DEPENDENT_VIEW_IDS],
    resetFlashcards: true
  };
}

export function getProgressDependentViewPlan(includeAnalytics = true) {
  return {
    viewIds: includeAnalytics ? [...PROGRESS_VIEW_IDS_WITH_ANALYTICS] : [...PROGRESS_VIEW_IDS_BASE],
    resetFlashcards: false
  };
}

export function dedupeViewIds(viewIds) {
  return [...new Set(Array.isArray(viewIds) ? viewIds : [])];
}

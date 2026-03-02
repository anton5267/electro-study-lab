const MODULE_CHECKS = [
  { path: "/assets/js/modules/content.js", type: "text/javascript" },
  { path: "/assets/js/modules/assessment-state.js", type: "text/javascript" },
  { path: "/assets/js/modules/checklist-state.js", type: "text/javascript" },
  { path: "/assets/js/modules/checklist-control.js", type: "text/javascript" },
  { path: "/assets/js/modules/flashcard-state.js", type: "text/javascript" },
  { path: "/assets/js/modules/practice-state.js", type: "text/javascript" },
  { path: "/assets/js/modules/practice-control.js", type: "text/javascript" },
  { path: "/assets/js/modules/quiz-control.js", type: "text/javascript" },
  { path: "/assets/js/modules/theory-control.js", type: "text/javascript" },
  { path: "/assets/js/modules/jump-control.js", type: "text/javascript" },
  { path: "/assets/js/modules/keyboard-control.js", type: "text/javascript" },
  { path: "/assets/js/modules/nav-control.js", type: "text/javascript" },
  { path: "/assets/js/modules/language-control.js", type: "text/javascript" },
  { path: "/assets/js/modules/topic-control.js", type: "text/javascript" },
  { path: "/assets/js/modules/exam-intro-control.js", type: "text/javascript" },
  { path: "/assets/js/modules/exam-control.js", type: "text/javascript" },
  { path: "/assets/js/modules/exam-preferences.js", type: "text/javascript" },
  { path: "/assets/js/modules/exam-runtime.js", type: "text/javascript" },
  { path: "/assets/js/modules/exam-session.js", type: "text/javascript" },
  { path: "/assets/js/modules/quiz-session.js", type: "text/javascript" },
  { path: "/assets/js/modules/progress-state.js", type: "text/javascript" },
  { path: "/assets/js/modules/review-planner.js", type: "text/javascript" },
  { path: "/assets/js/modules/progress-metrics.js", type: "text/javascript" },
  { path: "/assets/js/modules/runtime.js", type: "text/javascript" },
  { path: "/assets/js/modules/study-helpers.js", type: "text/javascript" },
  { path: "/assets/js/modules/storage.js", type: "text/javascript" },
  { path: "/assets/js/modules/view-plan.js", type: "text/javascript" },
  { path: "/assets/js/modules/templates.js", type: "text/javascript" },
  { path: "/assets/js/modules/validation.js", type: "text/javascript" },
  { path: "/assets/js/modules/utils.js", type: "text/javascript" }
];

const SHARED_CHECKS = [
  { path: "/index.html", type: "text/html" },
  { path: "/manifest.webmanifest", type: "application/manifest+json" },
  { path: "/service-worker.js", type: "text/javascript" },
  { path: "/assets/css/main.css", type: "text/css" },
  { path: "/assets/js/app.js", type: "text/javascript" },
  ...MODULE_CHECKS,
  { path: "/assets/data/study-pack-template.json", type: "application/json" },
  { path: "/assets/icons/icon-192.svg", type: "image/svg+xml" },
  { path: "/assets/icons/icon-512.svg", type: "image/svg+xml" }
];

export function getSourceSmokeChecks() {
  return [...SHARED_CHECKS];
}

export function getDistSmokeChecks() {
  return [
    { path: "/index.html", type: "text/html" },
    { path: "/404.html", type: "text/html" },
    { path: "/manifest.webmanifest", type: "application/manifest+json" },
    { path: "/service-worker.js", type: "text/javascript" },
    { path: "/release.json", type: "application/json" },
    { path: "/assets/css/main.css", type: "text/css" },
    { path: "/assets/js/app.js", type: "text/javascript" },
    ...MODULE_CHECKS,
    { path: "/assets/data/study-pack-template.json", type: "application/json" },
    { path: "/assets/icons/icon-192.svg", type: "image/svg+xml" },
    { path: "/assets/icons/icon-512.svg", type: "image/svg+xml" }
  ];
}

export function getExpectedPrecachePaths() {
  return getSourceSmokeChecks()
    .map((check) => check.path)
    .filter((resourcePath) => resourcePath !== "/service-worker.js")
    .map((resourcePath) => resourcePath.slice(1));
}

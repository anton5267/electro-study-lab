import { BASE_CONTENT, buildContentPack, sanitizeCustomPack } from "./modules/content.js";
import {
  createDefaultStats,
  getStorageKey as keyFor,
  loadJson,
  migrateStorageSchema,
  normalizeStats,
  removeStorageKey,
  saveJson
} from "./modules/storage.js";
import {
  answerExamQuestion,
  answerQuestion,
  buildRecordedStats,
  createDefaultQuizState,
  createEmptyExamState,
  createQuizVariantState,
  createReviewQuizState,
  createRunningExamState,
  getExamQuestions as getExamQuestionsHelper
} from "./modules/assessment-state.js";
import {
  createCompletedChecklist,
  createEmptyChecklist,
  resolveChecklistToggle
} from "./modules/checklist-state.js";
import {
  CHECKLIST_ACTIONS,
  resolveChecklistClickAction
} from "./modules/checklist-control.js";
import {
  EXAM_RUNTIME_ACTIONS,
  resolveExamKeyboardAction,
  buildResetExamState,
  resolveExamRuntimeAction,
  resolveExamRestorePlan,
  resolveExamSubmitPlan,
  shouldResetExamFromTarget
} from "./modules/exam-control.js";
import {
  EXAM_INTRO_ACTIONS,
  resolveExamIntroClickAction,
  resolveExamIntroChangeAction
} from "./modules/exam-intro-control.js";
import {
  createShuffledCardOrder,
  getNextCardIndex,
  getPreviousCardIndex,
  resolveSeenCardsOnFlip
} from "./modules/flashcard-state.js";
import {
  PRACTICE_ACTIONS,
  resolvePracticeClickAction,
  resolvePracticeInputAction,
  resolvePracticeKeydownAction
} from "./modules/practice-control.js";
import {
  QUIZ_ACTIONS,
  resolveQuizClickAction,
  resolveQuizKeyboardAction
} from "./modules/quiz-control.js";
import {
  JUMP_ACTIONS,
  resolveJumpAction
} from "./modules/jump-control.js";
import {
  NAV_ACTIONS,
  resolveNavClickAction,
  resolveNavKeydownAction
} from "./modules/nav-control.js";
import {
  TOPIC_ACTIONS,
  resolveTopicFilterAction
} from "./modules/topic-control.js";
import {
  LANGUAGE_ACTIONS,
  resolveLanguageClickAction
} from "./modules/language-control.js";
import {
  KEYBOARD_ACTIONS,
  resolveMainShortcutAction,
  resolveModalShortcutAction
} from "./modules/keyboard-control.js";
import {
  THEORY_ACTIONS,
  applyDiagramSelection,
  resolveTheoryClickAction
} from "./modules/theory-control.js";
import {
  evaluatePracticeAnswer,
  resolvePracticeAttempt
} from "./modules/practice-state.js";
import { buildFinalizedExamSession } from "./modules/exam-session.js";
import { buildFinalizedQuizSession } from "./modules/quiz-session.js";
import {
  formatHistoryLabel as formatHistoryLabelHelper,
  getAchievementProgress as getAchievementProgressHelper,
  getActiveQuizQuestions as getActiveQuizQuestionsHelper,
  getCustomPackSummary as getCustomPackSummaryHelper,
  getLastExamPercent as getLastExamPercentHelper,
  getNextRecommendedStep as getNextRecommendedStepHelper,
  getQuizModeMessage as getQuizModeMessageHelper,
  getQuizScore as getQuizScoreHelper,
  getReviewItems as getReviewItemsHelper,
  getSearchResults as getSearchResultsHelper,
  getTopicMastery as getTopicMasteryHelper,
  getVisibleFlashcardIndexes as getVisibleFlashcardIndexesHelper,
  hasStudyProgress as hasStudyProgressHelper,
  isAchievementUnlocked as isAchievementUnlockedHelper,
  isQuizCompleted as isQuizCompletedHelper,
  matchesActiveTopic as matchesActiveTopicHelper
} from "./modules/study-helpers.js";
import {
  resolveAdaptiveReviewCandidate,
  resolveAdaptiveReviewTopic as resolveAdaptiveReviewTopicHelper
} from "./modules/review-planner.js";
import {
  buildBackupPayload,
  createImportedBackupState,
  migrateBackupPayload,
  normalizeStudyProgress,
  readStringArray
} from "./modules/progress-state.js";
import {
  EXAM_TICK_ACTIONS,
  buildStartedExamState,
  resolveExamTickAction
} from "./modules/exam-runtime.js";
import {
  buildExamPreferences,
  DEFAULT_EXAM_DURATION_MINUTES,
  DEFAULT_EXAM_QUESTION_COUNT,
  resolveExamSettings
} from "./modules/exam-preferences.js";
import { buildProgressMetrics } from "./modules/progress-metrics.js";
import {
  dedupeViewIds,
  getAppBootViewPlan,
  getProgressDependentViewPlan,
  getSearchDependentViewPlan,
  getTopicDependentViewPlan
} from "./modules/view-plan.js";
import {
  buildViewStateSnapshot,
  buildStateUrl,
  resolveInitialViewState,
  hydrateExamState as hydrateExamStateHelper,
  serializeExamState as serializeExamStateHelper
} from "./modules/runtime.js";
import {
  validateBackupPayload,
  validateCustomPack
} from "./modules/validation.js";
import {
  renderAchievementItem as renderAchievementItemTemplate,
  renderChecklistItems as renderChecklistItemsTemplate,
  renderExamIntro as renderExamIntroTemplate,
  renderExamResult as renderExamResultTemplate,
  renderExamRuntime as renderExamRuntimeTemplate,
  renderHistoryItem as renderHistoryItemTemplate,
  renderNextStepCard as renderNextStepCardTemplate,
  renderPracticeProblem as renderPracticeProblemTemplate,
  renderQuizCard as renderQuizCardTemplate,
  renderQuizModeBanner as renderQuizModeBannerTemplate,
  renderQuizSummary as renderQuizSummaryTemplate,
  renderReviewItem as renderReviewItemTemplate,
  renderSearchResults as renderSearchResultsTemplate,
  renderStatCard as renderStatCardTemplate,
  renderTheoryCard as renderTheoryCardTemplate,
  renderTopicFilters as renderTopicFiltersTemplate,
  renderTopicMastery as renderTopicMasteryTemplate,
  renderWelcomeSteps as renderWelcomeStepsTemplate
} from "./modules/templates.js";
import {
  clamp,
  createSequence,
  debounce,
  format,
  isTypingTarget,
  matchesQuery,
  normalizeCardOrder,
  normalizeMap,
  normalizeNumberArray,
  shuffleArray,
  toPercent
} from "./modules/utils.js";

const SECTION_IDS = ["overview", "theory", "flashcards", "practice", "quiz", "exam", "checklist", "analytics"];
const MAX_IMPORT_FILE_SIZE_BYTES = 1 * 1024 * 1024;

const dom = {
  badge: document.getElementById("badge"),
  heroKicker: document.getElementById("heroKicker"),
  titleMain: document.getElementById("titleMain"),
  titleAccent: document.getElementById("titleAccent"),
  subtitle: document.getElementById("subtitle"),
  skipLink: document.getElementById("skipLink"),
  languageSwitcher: document.getElementById("languageSwitcher"),
  printBtn: document.getElementById("printBtn"),
  resetAllBtn: document.getElementById("resetAllBtn"),
  installBtn: document.getElementById("installBtn"),
  shareLinkBtn: document.getElementById("shareLinkBtn"),
  searchInput: document.getElementById("searchInput"),
  clearSearchBtn: document.getElementById("clearSearchBtn"),
  topicFilters: document.getElementById("topicFilters"),
  keyboardHint: document.getElementById("keyboardHint"),
  importHint: document.getElementById("importHint"),
  offlineHint: document.getElementById("offlineHint"),
  connectionStatus: document.getElementById("connectionStatus"),
  updateBtn: document.getElementById("updateBtn"),
  progressHeading: document.getElementById("progressHeading"),
  progressLabel: document.getElementById("progressLabel"),
  progressBar: document.getElementById("progressBar"),
  completionValue: document.getElementById("completionValue"),
  metricChecklistLabel: document.getElementById("metricChecklistLabel"),
  metricChecklistValue: document.getElementById("metricChecklistValue"),
  metricFlashcardsLabel: document.getElementById("metricFlashcardsLabel"),
  metricFlashcardsValue: document.getElementById("metricFlashcardsValue"),
  metricPracticeLabel: document.getElementById("metricPracticeLabel"),
  metricPracticeValue: document.getElementById("metricPracticeValue"),
  metricQuizLabel: document.getElementById("metricQuizLabel"),
  metricQuizValue: document.getElementById("metricQuizValue"),
  metricExamLabel: document.getElementById("metricExamLabel"),
  metricExamValue: document.getElementById("metricExamValue"),
  metricAccuracyLabel: document.getElementById("metricAccuracyLabel"),
  metricAccuracyValue: document.getElementById("metricAccuracyValue"),
  spotlightHeading: document.getElementById("spotlightHeading"),
  reviewQueueLabel: document.getElementById("reviewQueueLabel"),
  reviewQueueValue: document.getElementById("reviewQueueValue"),
  sessionsLabel: document.getElementById("sessionsLabel"),
  sessionsValue: document.getElementById("sessionsValue"),
  reviewNowBtn: document.getElementById("reviewNowBtn"),
  generateVariantBtn: document.getElementById("generateVariantBtn"),
  navTabs: Array.from(document.querySelectorAll(".nav-tab")),
  sections: Array.from(document.querySelectorAll(".section")),
  tabOverview: document.getElementById("tabOverview"),
  tabTheory: document.getElementById("tabTheory"),
  tabFlashcards: document.getElementById("tabFlashcards"),
  tabPractice: document.getElementById("tabPractice"),
  tabQuiz: document.getElementById("tabQuiz"),
  tabExam: document.getElementById("tabExam"),
  tabChecklist: document.getElementById("tabChecklist"),
  tabAnalytics: document.getElementById("tabAnalytics"),
  overviewTitle: document.getElementById("overviewTitle"),
  overviewLead: document.getElementById("overviewLead"),
  dashboardSearchTitle: document.getElementById("dashboardSearchTitle"),
  dashboardSearchLead: document.getElementById("dashboardSearchLead"),
  searchResults: document.getElementById("searchResults"),
  reviewTitle: document.getElementById("reviewTitle"),
  reviewLead: document.getElementById("reviewLead"),
  reviewList: document.getElementById("reviewList"),
  resourceTitle: document.getElementById("resourceTitle"),
  resourceLead: document.getElementById("resourceLead"),
  nextStepTitle: document.getElementById("nextStepTitle"),
  nextStepLead: document.getElementById("nextStepLead"),
  nextStepCard: document.getElementById("nextStepCard"),
  backupTitle: document.getElementById("backupTitle"),
  backupLead: document.getElementById("backupLead"),
  importPackBtn: document.getElementById("importPackBtn"),
  downloadTemplateLink: document.getElementById("downloadTemplateLink"),
  clearCustomPackBtn: document.getElementById("clearCustomPackBtn"),
  resourceNote: document.getElementById("resourceNote"),
  importPackInput: document.getElementById("importPackInput"),
  exportProgressBtn: document.getElementById("exportProgressBtn"),
  importProgressBtn: document.getElementById("importProgressBtn"),
  backupNote: document.getElementById("backupNote"),
  importProgressInput: document.getElementById("importProgressInput"),
  achievementsTitle: document.getElementById("achievementsTitle"),
  achievementsLead: document.getElementById("achievementsLead"),
  achievementsList: document.getElementById("achievementsList"),
  theoryTitle: document.getElementById("theoryTitle"),
  theoryLead: document.getElementById("theoryLead"),
  theoryContainer: document.getElementById("theoryContainer"),
  flashcardsTitle: document.getElementById("flashcardsTitle"),
  flashcardsLead: document.getElementById("flashcardsLead"),
  shuffleCardsBtn: document.getElementById("shuffleCardsBtn"),
  flashcard: document.getElementById("flashcard"),
  fcFrontHint: document.getElementById("fcFrontHint"),
  fcBackHint: document.getElementById("fcBackHint"),
  fcTerm: document.getElementById("fcTerm"),
  fcTopic: document.getElementById("fcTopic"),
  fcDef: document.getElementById("fcDef"),
  fcCounter: document.getElementById("fcCounter"),
  prevCardBtn: document.getElementById("prevCardBtn"),
  flipCardBtn: document.getElementById("flipCardBtn"),
  nextCardBtn: document.getElementById("nextCardBtn"),
  flashcardStatus: document.getElementById("flashcardStatus"),
  practiceTitle: document.getElementById("practiceTitle"),
  practiceLead: document.getElementById("practiceLead"),
  resetPracticeBtn: document.getElementById("resetPracticeBtn"),
  practiceContainer: document.getElementById("practiceContainer"),
  quizTitle: document.getElementById("quizTitle"),
  quizLead: document.getElementById("quizLead"),
  generateQuizVariantBtn: document.getElementById("generateQuizVariantBtn"),
  resetQuizBtn: document.getElementById("resetQuizBtn"),
  quizModeBanner: document.getElementById("quizModeBanner"),
  quizSummary: document.getElementById("quizSummary"),
  quizContainer: document.getElementById("quizContainer"),
  examTitle: document.getElementById("examTitle"),
  examLead: document.getElementById("examLead"),
  examIntro: document.getElementById("examIntro"),
  examRuntime: document.getElementById("examRuntime"),
  examResult: document.getElementById("examResult"),
  checklistTitle: document.getElementById("checklistTitle"),
  checklistLead: document.getElementById("checklistLead"),
  completeChecklistBtn: document.getElementById("completeChecklistBtn"),
  resetChecklistBtn: document.getElementById("resetChecklistBtn"),
  checklistSummary: document.getElementById("checklistSummary"),
  checklistContainer: document.getElementById("checklistContainer"),
  analyticsTitle: document.getElementById("analyticsTitle"),
  analyticsLead: document.getElementById("analyticsLead"),
  analyticsStatsTitle: document.getElementById("analyticsStatsTitle"),
  analyticsStatsLead: document.getElementById("analyticsStatsLead"),
  analyticsHistoryTitle: document.getElementById("analyticsHistoryTitle"),
  analyticsHistoryLead: document.getElementById("analyticsHistoryLead"),
  analyticsTopicsTitle: document.getElementById("analyticsTopicsTitle"),
  analyticsTopicsLead: document.getElementById("analyticsTopicsLead"),
  statsCards: document.getElementById("statsCards"),
  historyList: document.getElementById("historyList"),
  topicMastery: document.getElementById("topicMastery"),
  toastStack: document.getElementById("toastStack"),
  srStatus: document.getElementById("srStatus"),
  welcomeModal: document.getElementById("welcomeModal"),
  welcomeTitle: document.getElementById("welcomeTitle"),
  welcomeCopy: document.getElementById("welcomeCopy"),
  welcomeSteps: document.getElementById("welcomeSteps"),
  startWelcomeBtn: document.getElementById("startWelcomeBtn"),
  closeWelcomeBtn: document.getElementById("closeWelcomeBtn")
};

migrateStorageSchema();
const state = createInitialState();

bindEvents();
initPwa();
restoreRuntimeState({ notify: true });
renderApp();

function createInitialState() {
  const customPack = sanitizeCustomPack(loadJson(keyFor("customPack"), null));
  const contentPack = buildContentPack(customPack);
  const storedLanguage = loadJson(keyFor("language"), "uk");
  const storedViewState = loadJson(keyFor("viewState"), {});
  const initialViewState = resolveInitialViewState(window.location.href, storedViewState, contentPack, storedLanguage, SECTION_IDS);
  const lang = initialViewState.lang;
  const current = contentPack[lang];
  const exam = hydrateExamState(loadJson(keyFor("examState"), null), current);
  const examPreferences = buildExamPreferences(
    loadJson(keyFor("examDurationMinutes"), DEFAULT_EXAM_DURATION_MINUTES),
    loadJson(keyFor("examQuestionCount"), DEFAULT_EXAM_QUESTION_COUNT)
  );

  return {
    lang,
    contentPack,
    customPack,
    activeSection: exam.status === "running" ? "exam" : initialViewState.activeSection,
    searchQuery: initialViewState.searchQuery,
    activeTopic: initialViewState.activeTopic,
    currentCard: initialViewState.currentCard,
    diagramSelections: initialViewState.diagramSelections,
    checked: new Set(normalizeNumberArray(loadJson(keyFor("checklist"), []), current.checklistItems.length)),
    seenCards: new Set(normalizeNumberArray(loadJson(keyFor("seenCards"), []), current.flashcards.length)),
    cardOrder: normalizeCardOrder(loadJson(keyFor("cardOrder"), []), current.flashcards.length),
    practiceAnswers: normalizeMap(loadJson(keyFor("practiceAnswers"), {})),
    practiceSolved: new Set(readStringArray(loadJson(keyFor("practiceSolved"), []))),
    quizAnswers: normalizeMap(loadJson(keyFor("quizAnswers"), {})),
    quizMastered: new Set(readStringArray(loadJson(keyFor("quizMastered"), []))),
    quizMode: loadJson(keyFor("quizMode"), "default"),
    quizVariantIds: readStringArray(loadJson(keyFor("quizVariantIds"), [])),
    quizLogged: false,
    reviewQueue: new Set(readStringArray(loadJson(keyFor("reviewQueue"), []))),
    stats: normalizeStats(loadJson(keyFor("stats"), createDefaultStats())),
    examDurationMinutes: examPreferences.durationMinutes,
    examQuestionCount: examPreferences.questionCount,
    exam,
    pwaPrompt: null,
    onboardingSeen: Boolean(loadJson(keyFor("onboardingSeen"), false)),
    isOnline: navigator.onLine,
    updateReady: false,
    serviceWorkerRegistration: null,
    modalReturnFocus: null
  };
}

function bindEvents() {
  dom.languageSwitcher.addEventListener("click", handleLanguageSwitcherClick);

  dom.navTabs.forEach((tab) => {
    tab.addEventListener("click", handleNavTabClick);
    tab.addEventListener("keydown", handleNavTabKeydown);
  });

  dom.printBtn.addEventListener("click", () => window.print());
  dom.resetAllBtn.addEventListener("click", resetAllProgress);
  dom.installBtn.addEventListener("click", installPwa);
  dom.shareLinkBtn.addEventListener("click", copyCurrentViewLink);
  dom.clearSearchBtn.addEventListener("click", clearSearch);
  dom.searchInput.addEventListener("input", debounce(handleSearchInput, 120));
  dom.topicFilters.addEventListener("click", handleTopicFilterClick);
  dom.reviewNowBtn.addEventListener("click", startReviewMode);
  dom.generateVariantBtn.addEventListener("click", generateQuizVariant);
  dom.importPackBtn.addEventListener("click", () => dom.importPackInput.click());
  dom.clearCustomPackBtn.addEventListener("click", clearCustomPack);
  dom.importPackInput.addEventListener("change", handleImportPack);
  dom.exportProgressBtn.addEventListener("click", exportProgressBackup);
  dom.importProgressBtn.addEventListener("click", () => dom.importProgressInput.click());
  dom.importProgressInput.addEventListener("change", handleImportProgress);
  dom.updateBtn.addEventListener("click", activateAppUpdate);

  dom.theoryContainer.addEventListener("click", handleTheoryClick);

  dom.shuffleCardsBtn.addEventListener("click", shuffleFlashcards);
  dom.flashcard.addEventListener("click", flipFlashcard);
  dom.prevCardBtn.addEventListener("click", previousCard);
  dom.flipCardBtn.addEventListener("click", flipFlashcard);
  dom.nextCardBtn.addEventListener("click", nextCard);

  dom.practiceContainer.addEventListener("input", handlePracticeInput);
  dom.practiceContainer.addEventListener("keydown", handlePracticeKeydown);
  dom.practiceContainer.addEventListener("click", handlePracticeClick);
  dom.resetPracticeBtn.addEventListener("click", resetPractice);

  dom.quizContainer.addEventListener("click", handleQuizClick);
  dom.generateQuizVariantBtn.addEventListener("click", generateQuizVariant);
  dom.resetQuizBtn.addEventListener("click", resetQuiz);

  dom.examIntro.addEventListener("click", handleExamIntroClick);
  dom.examIntro.addEventListener("change", handleExamIntroChange);
  dom.examRuntime.addEventListener("click", handleExamRuntimeClick);
  dom.examResult.addEventListener("click", handleExamResultClick);

  dom.checklistContainer.addEventListener("click", handleChecklistClick);
  dom.completeChecklistBtn.addEventListener("click", completeChecklist);
  dom.resetChecklistBtn.addEventListener("click", resetChecklist);

  dom.searchResults.addEventListener("click", handleJumpButtons);
  dom.reviewList.addEventListener("click", handleJumpButtons);
  dom.nextStepCard.addEventListener("click", handleJumpButtons);

  dom.startWelcomeBtn.addEventListener("click", startWelcomeFlow);
  dom.closeWelcomeBtn.addEventListener("click", () => dismissWelcomeModal(true));
  dom.welcomeModal.addEventListener("click", (event) => {
    if (event.target === dom.welcomeModal) {
      dismissWelcomeModal(true);
    }
  });

  window.addEventListener("online", () => handleConnectivityChange(true));
  window.addEventListener("offline", () => handleConnectivityChange(false));
  document.addEventListener("keydown", handleKeyboardShortcuts);
}

function renderApp() {
  const viewPlan = getAppBootViewPlan();
  renderViews(viewPlan.viewIds, { resetFlashcards: viewPlan.resetFlashcards });
  showSection(state.activeSection, false);
  refreshUrlAndViewState();
  maybeShowOnboarding();
}

function renderStaticText() {
  const content = getContent();
  const flashcardsUi = content.flashcardsUi || {};

  document.documentElement.lang = content.htmlLang;
  document.title = content.metaTitle;
  dom.skipLink.textContent = content.common.skipToContent;
  dom.badge.textContent = content.badge;
  dom.heroKicker.textContent = content.heroKicker;
  dom.titleMain.textContent = content.titleMain;
  dom.titleAccent.textContent = content.titleAccent;
  dom.subtitle.textContent = content.subtitle;
  dom.printBtn.textContent = content.printLabel;
  dom.resetAllBtn.textContent = content.resetAll;
  dom.shareLinkBtn.textContent = content.copyLinkLabel;
  dom.searchInput.value = state.searchQuery;
  dom.searchInput.placeholder = content.searchPlaceholder;
  dom.clearSearchBtn.textContent = content.clearSearch;
  dom.keyboardHint.textContent = content.keyboardHint;
  dom.importHint.textContent = content.importHint;
  dom.offlineHint.textContent = content.offlineHint;
  dom.installBtn.textContent = content.installLabel;
  dom.progressHeading.textContent = content.progressHeading;
  dom.metricChecklistLabel.textContent = content.metricChecklistLabel;
  dom.metricFlashcardsLabel.textContent = content.metricFlashcardsLabel;
  dom.metricPracticeLabel.textContent = content.metricPracticeLabel;
  dom.metricQuizLabel.textContent = content.metricQuizLabel;
  dom.metricExamLabel.textContent = content.metricExamLabel;
  dom.metricAccuracyLabel.textContent = content.metricAccuracyLabel;
  dom.spotlightHeading.textContent = content.spotlightHeading;
  dom.reviewQueueLabel.textContent = content.reviewQueueLabel;
  dom.sessionsLabel.textContent = content.sessionsLabel;
  dom.reviewNowBtn.textContent = content.reviewNow;
  dom.generateVariantBtn.textContent = content.generateVariantHero;
  dom.tabOverview.textContent = content.tabs.overview;
  dom.tabTheory.textContent = content.tabs.theory;
  dom.tabFlashcards.textContent = content.tabs.flashcards;
  dom.tabPractice.textContent = content.tabs.practice;
  dom.tabQuiz.textContent = content.tabs.quiz;
  dom.tabExam.textContent = content.tabs.exam;
  dom.tabChecklist.textContent = content.tabs.checklist;
  dom.tabAnalytics.textContent = content.tabs.analytics;
  dom.overviewTitle.textContent = content.sections.overview.title;
  dom.overviewLead.textContent = content.sections.overview.lead;
  dom.dashboardSearchTitle.textContent = content.overview.searchTitle;
  dom.dashboardSearchLead.textContent = content.overview.searchLead;
  dom.reviewTitle.textContent = content.overview.reviewTitle;
  dom.reviewLead.textContent = content.overview.reviewLead;
  dom.resourceTitle.textContent = content.overview.resourceTitle;
  dom.resourceLead.textContent = content.overview.resourceLead;
  dom.nextStepTitle.textContent = content.overview.nextStepTitle;
  dom.nextStepLead.textContent = content.overview.nextStepLead;
  dom.backupTitle.textContent = content.overview.backupTitle;
  dom.backupLead.textContent = content.overview.backupLead;
  dom.achievementsTitle.textContent = content.overview.achievementsTitle;
  dom.achievementsLead.textContent = content.overview.achievementsLead;
  dom.importPackBtn.textContent = content.overview.importPack;
  dom.downloadTemplateLink.textContent = content.overview.downloadTemplate;
  dom.clearCustomPackBtn.textContent = content.overview.clearCustomPack;
  dom.exportProgressBtn.textContent = content.overview.exportProgress;
  dom.importProgressBtn.textContent = content.overview.importProgress;
  dom.backupNote.textContent = content.overview.backupNote;
  dom.theoryTitle.textContent = content.sections.theory.title;
  dom.theoryLead.textContent = content.sections.theory.lead;
  dom.flashcardsTitle.textContent = content.sections.flashcards.title;
  dom.flashcardsLead.textContent = content.sections.flashcards.lead;
  dom.shuffleCardsBtn.textContent = flashcardsUi.shuffle || "";
  dom.fcFrontHint.textContent = flashcardsUi.frontHint || "";
  dom.fcBackHint.textContent = flashcardsUi.backHint || "";
  dom.prevCardBtn.textContent = flashcardsUi.previous || "";
  dom.flipCardBtn.textContent = flashcardsUi.flip || "";
  dom.nextCardBtn.textContent = flashcardsUi.next || "";
  dom.practiceTitle.textContent = content.sections.practice.title;
  dom.practiceLead.textContent = content.sections.practice.lead;
  dom.resetPracticeBtn.textContent = content.practice.reset;
  dom.quizTitle.textContent = content.sections.quiz.title;
  dom.quizLead.textContent = content.sections.quiz.lead;
  dom.generateQuizVariantBtn.textContent = content.quiz.generateVariant;
  dom.resetQuizBtn.textContent = content.quiz.reset;
  dom.examTitle.textContent = content.sections.exam.title;
  dom.examLead.textContent = content.sections.exam.lead;
  dom.checklistTitle.textContent = content.sections.checklist.title;
  dom.checklistLead.textContent = content.sections.checklist.lead;
  dom.completeChecklistBtn.textContent = content.checklist.complete;
  dom.resetChecklistBtn.textContent = content.checklist.reset;
  dom.analyticsTitle.textContent = content.sections.analytics.title;
  dom.analyticsLead.textContent = content.sections.analytics.lead;
  dom.analyticsStatsTitle.textContent = content.analytics.statsTitle;
  dom.analyticsStatsLead.textContent = content.analytics.statsLead;
  dom.analyticsHistoryTitle.textContent = content.analytics.historyTitle;
  dom.analyticsHistoryLead.textContent = content.analytics.historyLead;
  dom.analyticsTopicsTitle.textContent = content.analytics.topicsTitle;
  dom.analyticsTopicsLead.textContent = content.analytics.topicsLead;
  dom.welcomeTitle.textContent = content.onboarding.title;
  dom.welcomeCopy.textContent = content.onboarding.copy;
  dom.startWelcomeBtn.textContent = content.onboarding.start;
  dom.closeWelcomeBtn.textContent = content.onboarding.close;
  dom.welcomeSteps.innerHTML = renderWelcomeSteps(content);
  renderSystemStatus(content);

  Array.from(dom.languageSwitcher.querySelectorAll(".lang-btn")).forEach((button) => {
    const active = button.dataset.lang === state.lang;
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", String(active));
  });

  renderTopicFilters(content);
}

function renderWelcomeSteps(content) {
  return renderWelcomeStepsTemplate(content.onboarding.steps);
}

function renderSystemStatus(content) {
  dom.connectionStatus.textContent = state.isOnline ? content.status.online : content.status.offline;
  dom.connectionStatus.classList.toggle("online", state.isOnline);
  dom.connectionStatus.classList.toggle("offline", !state.isOnline);
  dom.updateBtn.textContent = state.updateReady ? content.status.updateNow : content.status.updateReady;
  dom.updateBtn.classList.toggle("hidden", !state.updateReady);
}

function renderTopicFilters(content) {
  const filters = [
    { id: "all", label: content.common.allTopics },
    ...Object.entries(content.topicLabels).map(([id, label]) => ({ id, label }))
  ];

  dom.topicFilters.innerHTML = renderTopicFiltersTemplate(filters, state.activeTopic);
}

function matchesActiveTopic(topic) {
  return matchesActiveTopicHelper(state.activeTopic, topic);
}

function renderOverview() {
  const content = getContent();
  const searchResults = getSearchResults();
  const reviewItems = getReviewItems();
  const nextStep = getNextRecommendedStep();

  dom.searchResults.innerHTML = renderSearchResults(searchResults, content);
  dom.reviewList.innerHTML = reviewItems.length
    ? `<div class="review-list">${reviewItems.map((item) => renderReviewItem(item)).join("")}</div>`
    : `<div class="empty-state">${content.overview.emptyReview}</div>`;
  dom.nextStepCard.innerHTML = renderNextStepCard(nextStep, content);
  renderAchievements(content);

  dom.reviewQueueValue.textContent = String(reviewItems.length);
  dom.sessionsValue.textContent = String(state.stats.quizRuns + state.stats.examRuns);

  const customSummary = getCustomPackSummary();
  dom.resourceNote.textContent = customSummary
    ? `${content.overview.resourceNote} ${customSummary}`
    : content.overview.resourceNote;
}

function renderNextStepCard(nextStep, content) {
  return renderNextStepCardTemplate(nextStep, content);
}

function renderSearchResults(searchResults, content) {
  return renderSearchResultsTemplate(searchResults, content, Boolean(state.searchQuery.trim()));
}

function renderReviewItem(item) {
  return renderReviewItemTemplate(item, getContent());
}

function renderTheory() {
  const content = getContent();
  const visibleCards = content.theory.filter((card) => matchesQuery([
    card.title,
    card.lead,
    ...(card.intro || []),
    content.topicLabels[card.topic] || card.topic
  ], state.searchQuery) && matchesActiveTopic(card.topic));

  dom.theoryContainer.innerHTML = visibleCards.length
    ? visibleCards.map((card) => renderTheoryCard(card, content)).join("")
    : `<div class="empty-state">${content.overview.noResults}</div>`;
}

function renderTheoryCard(card, content) {
  const selectedHotspot = state.diagramSelections[card.id] ?? 0;
  const activeHotspot = card.diagram?.hotspots?.[selectedHotspot];
  return renderTheoryCardTemplate(card, content, selectedHotspot, activeHotspot);
}

function renderFlashcards(resetFlip = false) {
  const content = getContent();
  const flashcardsUi = content.flashcardsUi || {};
  const visibleIndexes = getVisibleFlashcardIndexes();

  if (!visibleIndexes.length) {
    dom.fcTerm.textContent = "";
    dom.fcTopic.textContent = "";
    dom.fcDef.textContent = "";
    dom.fcCounter.textContent = "0 / 0";
    dom.flashcardStatus.textContent = content.overview.noResults;
    dom.flashcard.classList.remove("flipped");
    return;
  }

  state.currentCard = clamp(state.currentCard, 0, visibleIndexes.length - 1);
  const flashcardIndex = visibleIndexes[state.currentCard];
  const card = content.flashcards[flashcardIndex];

  dom.fcTerm.textContent = card.term;
  dom.fcTopic.textContent = content.topicLabels[card.topic] || card.topic;
  dom.fcDef.textContent = card.def;
  dom.fcCounter.textContent = format(flashcardsUi.counter || "{current} / {total}", {
    current: state.currentCard + 1,
    total: visibleIndexes.length
  });
  dom.flashcardStatus.textContent = format(flashcardsUi.status || "{seen} / {total}", {
    seen: state.seenCards.size,
    total: content.flashcards.length
  });

  if (resetFlip) {
    dom.flashcard.classList.remove("flipped");
  }
}

function renderPractice() {
  const content = getContent();
  const visibleProblems = content.practiceProblems.filter((problem) => matchesQuery([
    problem.prompt,
    problem.explanation,
    content.topicLabels[problem.topic] || problem.topic
  ], state.searchQuery) && matchesActiveTopic(problem.topic));

  dom.practiceContainer.innerHTML = visibleProblems.length
    ? visibleProblems.map((problem) => renderPracticeProblem(problem, content)).join("")
    : `<div class="empty-state">${content.overview.noResults}</div>`;
}

function renderPracticeProblem(problem, content) {
  const value = state.practiceAnswers[problem.id] ?? "";
  const solved = state.practiceSolved.has(problem.id);
  const result = getPracticeResult(problem.id, problem);
  return renderPracticeProblemTemplate(problem, content, value, solved, result);
}

function renderQuiz() {
  const content = getContent();
  const activeQuestions = getActiveQuizQuestions();
  const modeMessage = getQuizModeMessage(content);

  dom.quizModeBanner.innerHTML = renderQuizModeBannerTemplate(modeMessage);

  if (!activeQuestions.length) {
    dom.quizContainer.innerHTML = `<div class="empty-state">${content.overview.emptyReview}</div>`;
    dom.quizSummary.innerHTML = "";
    return;
  }

  dom.quizContainer.innerHTML = activeQuestions
    .map((question, index) => renderQuizCard(question, index, activeQuestions.length, content, false))
    .join("");

  if (isQuizCompleted(activeQuestions) && !state.quizLogged) {
    finalizeQuizSession(activeQuestions);
  }

  dom.quizSummary.innerHTML = isQuizCompleted(activeQuestions)
    ? renderQuizSummary(activeQuestions, content)
    : "";
}

function renderQuizCard(question, index, total, content, examMode) {
  const answers = examMode ? state.exam.answers : state.quizAnswers;
  return renderQuizCardTemplate(question, index, total, content, answers[question.id], examMode);
}

function renderQuizSummary(activeQuestions, content) {
  const score = getQuizScore(activeQuestions);
  const percentage = toPercent(score, activeQuestions.length);
  const wrongQuestions = activeQuestions.filter((question) => Number(state.quizAnswers[question.id]) !== question.correct);
  const message = percentage >= 90
    ? content.quiz.messages.excellent
    : percentage >= 70
      ? content.quiz.messages.good
      : content.quiz.messages.retry;

  return renderQuizSummaryTemplate(
    content,
    score,
    activeQuestions.length,
    percentage,
    wrongQuestions,
    content.quiz.reviewEmpty,
    message
  );
}

function renderExam() {
  const content = getContent();

  if (state.exam.status === "idle") {
    dom.examIntro.innerHTML = renderExamIntro(content, state.examDurationMinutes, state.examQuestionCount);
    dom.examRuntime.innerHTML = "";
    dom.examResult.innerHTML = "";
    return;
  }

  if (state.exam.status === "running") {
    dom.examIntro.innerHTML = "";
    dom.examRuntime.innerHTML = renderExamRuntime(content);
    dom.examResult.innerHTML = "";
    return;
  }

  dom.examIntro.innerHTML = "";
  dom.examRuntime.innerHTML = "";
  dom.examResult.innerHTML = renderExamResult(content);
}

function renderExamIntro(content, durationMinutes, questionCount) {
  return renderExamIntroTemplate(content, durationMinutes, questionCount);
}

function renderExamRuntime(content) {
  const questions = getExamQuestions();
  const remainingMs = Math.max(0, state.exam.endAt - Date.now());
  const questionsMarkup = questions
    .map((question, index) => renderQuizCard(question, index, questions.length, content, true))
    .join("");

  return renderExamRuntimeTemplate(content, questionsMarkup, formatDuration(remainingMs));
}

function renderExamResult(content) {
  return renderExamResultTemplate(content, state.exam.result);
}

function renderChecklist() {
  const content = getContent();
  const visibleItems = content.checklistItems.filter((item) => matchesQuery([item], state.searchQuery));

  dom.checklistSummary.textContent = format(content.checklist.summary, {
    done: state.checked.size,
    total: content.checklistItems.length
  });

  const visibleChecklistItems = visibleItems.map((item) => ({
    text: item,
    index: content.checklistItems.indexOf(item)
  }));

  dom.checklistContainer.innerHTML = visibleItems.length
    ? renderChecklistItemsTemplate(visibleChecklistItems, state.checked)
    : `<div class="empty-state">${content.overview.noResults}</div>`;
}

function renderAnalytics() {
  const content = getContent();
  const history = Array.isArray(state.stats.history) ? state.stats.history : [];
  const mastery = getTopicMastery(content);

  dom.statsCards.innerHTML = `
    <div class="stats-grid">
      ${renderStatCard(content.analytics.statLabels.quizRuns, state.stats.quizRuns)}
      ${renderStatCard(content.analytics.statLabels.examRuns, state.stats.examRuns)}
      ${renderStatCard(content.analytics.statLabels.bestQuiz, `${Math.round(state.stats.bestQuizScore)}%`)}
      ${renderStatCard(content.analytics.statLabels.bestExam, `${Math.round(state.stats.bestExamScore)}%`)}
      ${renderStatCard(content.analytics.statLabels.avgQuiz, `${Math.round(state.stats.averageQuizScore)}%`)}
      ${renderStatCard(content.analytics.statLabels.avgExam, `${Math.round(state.stats.averageExamScore)}%`)}
      ${renderStatCard(content.analytics.statLabels.streak, state.stats.studyStreak)}
      ${renderStatCard(content.analytics.statLabels.practice, state.stats.practiceSolvedCount)}
    </div>
  `;

  dom.historyList.innerHTML = history.length
    ? `<div class="history-list">${history.map((item) => renderHistoryItem(item, content)).join("")}</div>`
    : `<div class="empty-state">${content.analytics.emptyHistory}</div>`;

  dom.topicMastery.innerHTML = renderTopicMasteryTemplate(mastery, content);
}

function renderStatCard(label, value) {
  return renderStatCardTemplate(label, value);
}

function renderHistoryItem(item, content) {
  return renderHistoryItemTemplate(
    item,
    item.type === "exam" ? content.tabs.exam : content.tabs.quiz,
    state.lang,
    formatHistoryLabel(item, content)
  );
}

function updateProgress() {
  const content = getContent();
  const metrics = buildProgressMetrics(content, {
    checked: state.checked,
    seenCards: state.seenCards,
    practiceSolved: state.practiceSolved,
    quizMastered: state.quizMastered,
    averageQuizScore: state.stats.averageQuizScore,
    averageExamScore: state.stats.averageExamScore,
    lastExamPercent: getLastExamPercent()
  });

  dom.progressLabel.textContent = format(content.progressTemplate, { done: metrics.done, total: metrics.total });
  dom.completionValue.textContent = format(content.completionTemplate, { pct: metrics.completion });
  dom.progressBar.style.width = `${metrics.completion}%`;
  dom.metricChecklistValue.textContent = `${metrics.checklist.done}/${metrics.checklist.total}`;
  dom.metricFlashcardsValue.textContent = `${metrics.flashcards.done}/${metrics.flashcards.total}`;
  dom.metricPracticeValue.textContent = `${metrics.practice.done}/${metrics.practice.total}`;
  dom.metricQuizValue.textContent = `${metrics.quiz.done}/${metrics.quiz.total}`;
  dom.metricExamValue.textContent = metrics.lastExamPercent > 0 ? `${Math.round(metrics.lastExamPercent)}%` : "—";
  dom.metricAccuracyValue.textContent = metrics.accuracyPercent !== null ? `${metrics.accuracyPercent}%` : "—";
}

function renderViews(viewIds, { resetFlashcards = false } = {}) {
  dedupeViewIds(viewIds).forEach((viewId) => {
    switch (viewId) {
      case "static":
        renderStaticText();
        break;
      case "topicFilters":
        renderTopicFilters(getContent());
        break;
      case "overview":
        renderOverview();
        break;
      case "theory":
        renderTheory();
        break;
      case "flashcards":
        renderFlashcards(resetFlashcards);
        break;
      case "practice":
        renderPractice();
        break;
      case "quiz":
        renderQuiz();
        break;
      case "exam":
        renderExam();
        break;
      case "checklist":
        renderChecklist();
        break;
      case "analytics":
        renderAnalytics();
        break;
      case "progress":
        updateProgress();
        break;
      default:
        break;
    }
  });
}

function refreshUrlAndViewState() {
  syncUrlState();
  persistViewState();
}

function rerenderSearchDependentViews() {
  const viewPlan = getSearchDependentViewPlan();
  renderViews(viewPlan.viewIds, { resetFlashcards: viewPlan.resetFlashcards });
  refreshUrlAndViewState();
}

function rerenderTopicDependentViews() {
  const viewPlan = getTopicDependentViewPlan();
  renderViews(viewPlan.viewIds, { resetFlashcards: viewPlan.resetFlashcards });
  refreshUrlAndViewState();
}

function rerenderProgressDependentViews({ includeAnalytics = true } = {}) {
  const viewPlan = getProgressDependentViewPlan(includeAnalytics);
  renderViews(viewPlan.viewIds, { resetFlashcards: viewPlan.resetFlashcards });
}

function showSection(sectionId, updateHash = true) {
  if (!SECTION_IDS.includes(sectionId)) {
    sectionId = "overview";
  }

  state.activeSection = sectionId;

  dom.sections.forEach((section) => {
    const active = section.id === sectionId;
    section.classList.toggle("active", active);
    section.setAttribute("aria-hidden", String(!active));
  });

  dom.navTabs.forEach((tab) => {
    const active = tab.dataset.section === sectionId;
    tab.classList.toggle("active", active);
    tab.setAttribute("aria-selected", String(active));
    tab.setAttribute("tabindex", active ? "0" : "-1");
  });

  if (updateHash) {
    syncUrlState();
  }

  persistViewState();
}

function setLanguage(language) {
  if (!state.contentPack[language] || language === state.lang) {
    return;
  }

  state.lang = language;
  normalizeStateAfterContentChange();
  saveJson(keyFor("language"), state.lang);
  renderApp();
}

function handleSearchInput(event) {
  state.searchQuery = event.target.value || "";
  state.currentCard = 0;
  rerenderSearchDependentViews();
}

function handleNavTabClick(event) {
  const action = resolveNavClickAction(event.currentTarget?.dataset?.section, SECTION_IDS);
  if (action.type !== NAV_ACTIONS.SELECT_SECTION) {
    return;
  }

  showSection(action.sectionId);
}

function handleNavTabKeydown(event) {
  const currentIndex = dom.navTabs.indexOf(event.currentTarget);
  const tabSections = dom.navTabs.map((tab) => tab.dataset.section);
  const action = resolveNavKeydownAction(event.key, currentIndex, tabSections, SECTION_IDS);
  if (action.type !== NAV_ACTIONS.MOVE_TO_TAB) {
    return;
  }

  event.preventDefault();
  const nextTab = dom.navTabs[action.nextIndex];
  showSection(action.sectionId);
  nextTab.focus();
}

function handleTopicFilterClick(event) {
  const action = resolveTopicFilterAction(
    event.target,
    ["all", ...Object.keys(getContent().topicLabels)]
  );
  if (action.type !== TOPIC_ACTIONS.SELECT_TOPIC) {
    return;
  }

  state.activeTopic = action.topic;
  state.currentCard = 0;
  rerenderTopicDependentViews();
}

function clearSearch() {
  state.searchQuery = "";
  dom.searchInput.value = "";
  rerenderSearchDependentViews();
}

function handleLanguageSwitcherClick(event) {
  const action = resolveLanguageClickAction(event.target, Object.keys(state.contentPack));
  if (action.type !== LANGUAGE_ACTIONS.SET_LANGUAGE) {
    return;
  }

  setLanguage(action.language);
}

function handleTheoryClick(event) {
  const action = resolveTheoryClickAction(event.target);
  if (action.type !== THEORY_ACTIONS.SELECT_HOTSPOT) {
    return;
  }

  state.diagramSelections = applyDiagramSelection(
    state.diagramSelections,
    action.cardId,
    action.hotspotIndex
  );
  persistViewState();
  renderTheory();
}

function getVisibleFlashcardIndexes() {
  return getVisibleFlashcardIndexesHelper(getContent(), state.cardOrder, state.searchQuery, state.activeTopic);
}

function flipFlashcard() {
  const visibleIndexes = getVisibleFlashcardIndexes();
  if (!visibleIndexes.length) {
    return;
  }

  dom.flashcard.classList.toggle("flipped");
  if (!dom.flashcard.classList.contains("flipped")) {
    return;
  }

  const nextSeen = resolveSeenCardsOnFlip(visibleIndexes, state.currentCard, state.seenCards);
  if (nextSeen.changed) {
    state.seenCards = nextSeen.seenCards;
    saveJson(keyFor("seenCards"), [...state.seenCards]);
    noteStudyProgress();
    rerenderProgressDependentViews();
  }
}

function nextCard() {
  const visibleIndexes = getVisibleFlashcardIndexes();
  const nextIndex = getNextCardIndex(state.currentCard, visibleIndexes.length);
  if (nextIndex === null) {
    return;
  }

  state.currentCard = nextIndex;
  persistViewState();
  renderFlashcards(true);
}

function previousCard() {
  const visibleIndexes = getVisibleFlashcardIndexes();
  const previousIndex = getPreviousCardIndex(state.currentCard, visibleIndexes.length);
  if (previousIndex === null) {
    return;
  }

  state.currentCard = previousIndex;
  persistViewState();
  renderFlashcards(true);
}

function shuffleFlashcards() {
  state.cardOrder = createShuffledCardOrder(getContent().flashcards.length, shuffleArray);
  state.currentCard = 0;
  saveJson(keyFor("cardOrder"), state.cardOrder);
  persistViewState();
  renderFlashcards(true);
}

function handlePracticeInput(event) {
  const action = resolvePracticeInputAction(event.target);
  if (action.type !== PRACTICE_ACTIONS.UPDATE_ANSWER) {
    return;
  }

  state.practiceAnswers[action.problemId] = action.value;
  saveJson(keyFor("practiceAnswers"), state.practiceAnswers);
}

function handlePracticeClick(event) {
  const action = resolvePracticeClickAction(event.target);
  if (action.type === PRACTICE_ACTIONS.CHECK_PROBLEM) {
    checkPracticeProblem(action.problemId);
  }
}

function checkPracticeProblem(problemId) {
  const content = getContent();
  const problem = content.practiceProblems.find((item) => item.id === problemId);
  if (!problem) {
    return;
  }

  const attempt = resolvePracticeAttempt(
    state.practiceSolved,
    problemId,
    state.practiceAnswers[problemId],
    problem.answer,
    problem.tolerance
  );
  if (attempt.changed) {
    state.practiceSolved = attempt.practiceSolved;
    saveJson(keyFor("practiceSolved"), [...state.practiceSolved]);
    state.stats.practiceSolvedCount = state.practiceSolved.size;
  }

  noteStudyProgress();
  renderViews(["practice"]);
  rerenderProgressDependentViews();
}

function getPracticeResult(problemId, problem) {
  const content = getContent();
  const evaluation = evaluatePracticeAnswer(state.practiceAnswers[problemId], problem.answer, problem.tolerance);
  if (!evaluation.answered) {
    return null;
  }

  return {
    correct: evaluation.correct,
    message: format(evaluation.correct ? content.practice.correct : content.practice.wrong, {
      text: problem.explanation
    })
  };
}

function getActiveQuizQuestions() {
  return getActiveQuizQuestionsHelper(
    getContent(),
    state.quizMode,
    state.quizVariantIds,
    state.reviewQueue,
    state.activeTopic
  );
}

function getQuizModeMessage(content) {
  return getQuizModeMessageHelper(content, state.quizMode);
}

function handleQuizClick(event) {
  const action = resolveQuizClickAction(event.target, state.quizAnswers);
  if (action.type !== QUIZ_ACTIONS.ANSWER) {
    return;
  }

  state.quizAnswers = answerQuestion(state.quizAnswers, action.questionId, action.optionIndex);
  saveJson(keyFor("quizAnswers"), state.quizAnswers);
  renderQuiz();
}

function generateQuizVariant() {
  Object.assign(state, createQuizVariantState(getContent(), shuffleArray));
  persistQuizState();
  renderViews(["quiz"]);
  rerenderProgressDependentViews({ includeAnalytics: false });
  showSection("quiz");
}

function startReviewMode() {
  const content = getContent();
  const adaptiveTopic = resolveAdaptiveReviewTopicHelper(content, state.reviewQueue, getTopicMastery(content), "all");
  const nextReviewCandidate = resolveAdaptiveReviewCandidate(
    state.activeTopic,
    adaptiveTopic,
    (topic) => createReviewQuizState(content, state.reviewQueue, topic),
    "all"
  );

  if (!nextReviewCandidate) {
    generateQuizVariant();
    return;
  }

  const previousTopic = state.activeTopic;
  state.activeTopic = nextReviewCandidate.topic;

  Object.assign(state, nextReviewCandidate.candidate);
  persistQuizState();

  if (state.activeTopic !== previousTopic) {
    rerenderTopicDependentViews();
    if (state.activeTopic !== "all" && content.toasts.reviewFocus) {
      showToast(format(content.toasts.reviewFocus, { topic: content.topicLabels[state.activeTopic] }), "info");
    }
  } else {
    renderQuiz();
  }

  showSection("quiz");
}

function resetQuiz() {
  Object.assign(state, createDefaultQuizState());
  persistQuizState();
  renderQuiz();
}

function persistQuizState() {
  saveJson(keyFor("quizAnswers"), state.quizAnswers);
  saveJson(keyFor("quizMode"), state.quizMode);
  saveJson(keyFor("quizVariantIds"), state.quizVariantIds);
}

function isQuizCompleted(questions) {
  return isQuizCompletedHelper(questions, state.quizAnswers);
}

function getQuizScore(questions) {
  return getQuizScoreHelper(questions, state.quizAnswers);
}

function finalizeQuizSession(questions) {
  const finalized = buildFinalizedQuizSession(
    questions,
    state.quizAnswers,
    state.reviewQueue,
    state.quizMastered,
    state.quizMode
  );
  state.reviewQueue = finalized.reviewQueue;
  state.quizMastered = finalized.quizMastered;

  saveJson(keyFor("reviewQueue"), [...state.reviewQueue]);
  saveJson(keyFor("quizMastered"), [...state.quizMastered]);

  recordSession("quiz", finalized.score, finalized.total, finalized.sessionLabel);
  state.quizLogged = true;
  rerenderProgressDependentViews();
}

function handleExamIntroClick(event) {
  const durationValue = document.getElementById("examDurationSelect")?.value ?? state.examDurationMinutes;
  const questionCountValue = document.getElementById("examCountSelect")?.value ?? state.examQuestionCount;
  const action = resolveExamIntroClickAction(event.target, durationValue, questionCountValue);
  if (action.type !== EXAM_INTRO_ACTIONS.START_EXAM) {
    return;
  }

  const settings = resolveExamSettings(
    action.durationValue,
    action.questionCountValue,
    state.examDurationMinutes,
    state.examQuestionCount
  );
  persistExamSettings(settings.durationMinutes, settings.questionCount);
  startExam(settings.durationMinutes, settings.questionCount);
}

function handleExamIntroChange(event) {
  const action = resolveExamIntroChangeAction(
    event.target,
    state.examDurationMinutes,
    state.examQuestionCount
  );
  if (action.type !== EXAM_INTRO_ACTIONS.UPDATE_SETTINGS) {
    return;
  }

  const settings = resolveExamSettings(
    action.durationValue,
    action.questionCountValue,
    state.examDurationMinutes,
    state.examQuestionCount
  );
  persistExamSettings(settings.durationMinutes, settings.questionCount);
}

function startExam(durationMinutes, questionCount) {
  clearExamTimer();
  state.exam = buildStartedExamState(
    createRunningExamState,
    getContent(),
    questionCount,
    durationMinutes,
    Date.now(),
    shuffleArray,
    window.setInterval(handleExamTick, 1000),
    state.activeTopic
  );

  persistExamState();
  renderExam();
  showSection("exam");
}

function handleExamTick() {
  const action = resolveExamTickAction(state.exam, Date.now());

  if (action === EXAM_TICK_ACTIONS.CLEAR_TIMER) {
    clearExamTimer();
    return;
  }

  if (action === EXAM_TICK_ACTIONS.SUBMIT_TIMEOUT) {
    submitExam(true);
    return;
  }

  renderExam();
}

function handleExamRuntimeClick(event) {
  const action = resolveExamRuntimeAction(event.target);
  if (action.type === EXAM_RUNTIME_ACTIONS.ANSWER) {
    state.exam = answerExamQuestion(state.exam, action.questionId, action.optionIndex);
    persistExamState();
    renderExam();
    return;
  }

  if (action.type === EXAM_RUNTIME_ACTIONS.SUBMIT) {
    submitExam(action.timeout);
  }
}

function handleExamResultClick(event) {
  if (!shouldResetExamFromTarget(event.target)) {
    return;
  }

  clearExamTimer();
  state.exam = buildResetExamState(createEmptyExamState);
  persistExamState();
  renderExam();
}

function getExamQuestions() {
  return getExamQuestionsHelper(getContent(), state.exam.questionIds);
}

function submitExam(timeout) {
  const submitPlan = resolveExamSubmitPlan(state.exam, timeout);
  if (!submitPlan) {
    return;
  }

  clearExamTimer();
  finalizeExamSession(submitPlan.examSnapshot, submitPlan.timeout);

  renderViews(["exam"]);
  rerenderProgressDependentViews();
}

function clearExamTimer() {
  if (state.exam.timerId) {
    window.clearInterval(state.exam.timerId);
    state.exam.timerId = null;
  }
}

function completeChecklist() {
  state.checked = createCompletedChecklist(getContent().checklistItems.length);
  saveJson(keyFor("checklist"), [...state.checked]);
  noteStudyProgress();
  renderViews(["checklist"]);
  rerenderProgressDependentViews({ includeAnalytics: false });
}

function resetChecklist() {
  state.checked = createEmptyChecklist();
  saveJson(keyFor("checklist"), []);
  renderViews(["checklist"]);
  rerenderProgressDependentViews({ includeAnalytics: false });
}

function handleChecklistClick(event) {
  const action = resolveChecklistClickAction(event.target);
  if (action.type !== CHECKLIST_ACTIONS.TOGGLE_ITEM) {
    return;
  }

  const next = resolveChecklistToggle(state.checked, action.index, getContent().checklistItems.length);
  if (!next.changed) {
    return;
  }
  state.checked = next.checked;

  saveJson(keyFor("checklist"), [...state.checked]);
  noteStudyProgress();
  renderViews(["checklist"]);
  rerenderProgressDependentViews({ includeAnalytics: false });
}

function handleJumpButtons(event) {
  const action = resolveJumpAction(event.target, SECTION_IDS);
  if (action.type === JUMP_ACTIONS.REVIEW_NOW) {
    startReviewMode();
    return;
  }

  if (action.type === JUMP_ACTIONS.JUMP_SECTION) {
    showSection(action.sectionId);
  }
}

function handleKeyboardShortcuts(event) {
  if (!dom.welcomeModal.classList.contains("hidden")) {
    const modalAction = resolveModalShortcutAction(event.key);
    if (modalAction.type === KEYBOARD_ACTIONS.MODAL_DISMISS) {
      dismissWelcomeModal(true);
    } else if (modalAction.type === KEYBOARD_ACTIONS.MODAL_TRAP_FOCUS) {
      trapModalFocus(event);
    }
    return;
  }

  if (isTypingTarget(event.target)) {
    return;
  }

  const action = resolveMainShortcutAction(event.key, state.activeSection, SECTION_IDS);
  if (action.type === KEYBOARD_ACTIONS.QUIZ_ANSWER) {
    answerQuizWithKeyboard(action.optionIndex);
    return;
  }

  if (action.type === KEYBOARD_ACTIONS.EXAM_ANSWER) {
    answerExamWithKeyboard(action.optionIndex);
    return;
  }

  if (action.type === KEYBOARD_ACTIONS.SECTION_JUMP) {
    showSection(action.sectionId);
    return;
  }

  if (state.activeSection === "flashcards") {
    if (action.type === KEYBOARD_ACTIONS.FLASHCARD_NEXT) {
      nextCard();
    } else if (action.type === KEYBOARD_ACTIONS.FLASHCARD_PREVIOUS) {
      previousCard();
    } else if (action.type === KEYBOARD_ACTIONS.FLASHCARD_FLIP) {
      event.preventDefault();
      flipFlashcard();
    }
  }
}

function handlePracticeKeydown(event) {
  const action = resolvePracticeKeydownAction(event.target, event.key);
  if (action.type !== PRACTICE_ACTIONS.CHECK_PROBLEM) {
    return;
  }

  event.preventDefault();
  checkPracticeProblem(action.problemId);
}

function answerQuizWithKeyboard(optionIndex) {
  const action = resolveQuizKeyboardAction(getActiveQuizQuestions(), state.quizAnswers, optionIndex);
  if (action.type !== QUIZ_ACTIONS.ANSWER) {
    return;
  }

  state.quizAnswers = answerQuestion(state.quizAnswers, action.questionId, action.optionIndex);
  saveJson(keyFor("quizAnswers"), state.quizAnswers);
  renderQuiz();
}

function answerExamWithKeyboard(optionIndex) {
  const action = resolveExamKeyboardAction(getExamQuestions(), state.exam.answers, optionIndex);
  if (action.type !== EXAM_RUNTIME_ACTIONS.ANSWER) {
    return;
  }

  state.exam = answerExamQuestion(state.exam, action.questionId, action.optionIndex);
  persistExamState();
  renderExam();
}

function recordSession(type, score, total, label) {
  markStudyActivity({ persist: false });
  state.stats = buildRecordedStats(state.stats, type, score, total, label);
  syncAchievements({ persist: false });
  persistStats();
}

function formatHistoryLabel(item, content) {
  return formatHistoryLabelHelper(item, content);
}

function getSearchResults() {
  return getSearchResultsHelper(getContent(), state.searchQuery.trim(), state.activeTopic);
}

function getReviewItems() {
  return getReviewItemsHelper(getContent(), state.reviewQueue, state.activeTopic);
}

function getNextRecommendedStep() {
  return getNextRecommendedStepHelper(getContent(), state);
}

function getTopicMastery(content) {
  return getTopicMasteryHelper(content, state.seenCards, state.practiceSolved, state.quizMastered);
}

function getLastExamPercent() {
  return getLastExamPercentHelper(state.stats);
}

function getCustomPackSummary() {
  return getCustomPackSummaryHelper(state.customPack, state.lang);
}

function initPwa() {
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("./service-worker.js").then((registration) => {
        state.serviceWorkerRegistration = registration;
        watchServiceWorker(registration);
      }).catch(() => {});
    });

    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (!state.updateReady) {
        return;
      }

      announceStatus(getContent().toasts.updated);
      window.location.reload();
    });
  }

  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    state.pwaPrompt = event;
    dom.installBtn.classList.remove("hidden");
  });

  window.addEventListener("appinstalled", () => {
    state.pwaPrompt = null;
    dom.installBtn.classList.add("hidden");
    showToast(getContent().toasts.installed, "success");
  });
}

function watchServiceWorker(registration) {
  if (registration.waiting) {
    setUpdateReady(true);
  }

  registration.addEventListener("updatefound", () => {
    const worker = registration.installing;
    if (!worker) {
      return;
    }

    worker.addEventListener("statechange", () => {
      if (worker.state === "installed" && navigator.serviceWorker.controller) {
        setUpdateReady(true);
        showToast(getContent().toasts.updateReady, "info");
      }
    });
  });
}

function setUpdateReady(value) {
  state.updateReady = Boolean(value);
  renderSystemStatus(getContent());
}

function activateAppUpdate() {
  const registration = state.serviceWorkerRegistration;
  if (!registration?.waiting) {
    return;
  }

  registration.waiting.postMessage({ type: "SKIP_WAITING" });
}

async function installPwa() {
  if (!state.pwaPrompt) {
    return;
  }

  state.pwaPrompt.prompt();
  await state.pwaPrompt.userChoice.catch(() => null);
  state.pwaPrompt = null;
  dom.installBtn.classList.add("hidden");
}

function exportProgressBackup() {
  const payload = buildBackupPayload(state, serializeExamState);

  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `electro-study-backup-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

function handleImportProgress(event) {
  const file = event.target.files?.[0];
  if (!file) {
    return;
  }

  if (isImportFileTooLarge(file)) {
    showToast(getContent().importMessages.tooLarge, "warning");
    dom.importProgressInput.value = "";
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    try {
      const parsed = JSON.parse(String(reader.result || "{}"));
      const migratedPayload = migrateBackupPayload(parsed);
      const backupValidation = validateBackupPayload(
        migratedPayload,
        buildContentPack(migratedPayload?.customPack ?? null)
      );
      if (!backupValidation.valid) {
        showToast(formatImportError(getContent().importMessages.backupInvalid, backupValidation.errors), "warning");
        return;
      }

      applyBackupPayload(migratedPayload);
      showToast(getContent().importMessages.backupImported, "success");
    } catch (error) {
      showToast(getContent().importMessages.backupInvalid, "warning");
    } finally {
      dom.importProgressInput.value = "";
    }
  };

  reader.readAsText(file);
}

function handleImportPack(event) {
  const file = event.target.files?.[0];
  if (!file) {
    return;
  }

  if (isImportFileTooLarge(file)) {
    showToast(getContent().importMessages.tooLarge, "warning");
    dom.importPackInput.value = "";
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    try {
      const parsed = JSON.parse(String(reader.result || "{}"));
      const customPackValidation = validateCustomPack(parsed, BASE_CONTENT);
      if (!customPackValidation.valid) {
        showToast(formatImportError(getContent().importMessages.invalid, customPackValidation.errors), "warning");
        return;
      }

      const sanitizedPack = sanitizeCustomPack(parsed);
      state.customPack = sanitizedPack;
      saveJson(keyFor("customPack"), sanitizedPack);
      rebuildContentPack();
      showToast(getContent().importMessages.success, "success");
    } catch (error) {
      showToast(getContent().importMessages.invalid, "warning");
    } finally {
      dom.importPackInput.value = "";
    }
  };

  reader.readAsText(file);
}

function applyBackupPayload(payload) {
  clearExamTimer();

  const sanitizedCustomPack = sanitizeCustomPack(payload.customPack ?? null);
  const sanitizedPayload = {
    ...payload,
    customPack: sanitizedCustomPack
  };

  state.contentPack = buildContentPack(sanitizedCustomPack);
  Object.assign(
    state,
    createImportedBackupState(sanitizedPayload, state.contentPack, state.lang, SECTION_IDS, hydrateExamState)
  );
  persistExamSettings(state.examDurationMinutes, state.examQuestionCount);

  saveJson(keyFor("customPack"), state.customPack);
  saveJson(keyFor("language"), state.lang);
  saveJson(keyFor("checklist"), [...state.checked]);
  saveJson(keyFor("seenCards"), [...state.seenCards]);
  saveJson(keyFor("cardOrder"), state.cardOrder);
  saveJson(keyFor("practiceAnswers"), state.practiceAnswers);
  saveJson(keyFor("practiceSolved"), [...state.practiceSolved]);
  saveJson(keyFor("quizAnswers"), state.quizAnswers);
  saveJson(keyFor("quizMastered"), [...state.quizMastered]);
  saveJson(keyFor("quizMode"), state.quizMode);
  saveJson(keyFor("quizVariantIds"), state.quizVariantIds);
  saveJson(keyFor("reviewQueue"), [...state.reviewQueue]);
  saveJson(keyFor("stats"), state.stats);
  saveJson(keyFor("onboardingSeen"), state.onboardingSeen);
  persistExamState();

  normalizeStateAfterContentChange();
  syncAchievements({ persist: false, toast: false });
  persistStats();
  renderApp();
}

function clearCustomPack() {
  state.customPack = null;
  removeStorageKey(keyFor("customPack"));
  rebuildContentPack();
  showToast(getContent().importMessages.cleared, "success");
}

function rebuildContentPack() {
  state.contentPack = buildContentPack(state.customPack);
  normalizeStateAfterContentChange();
  renderApp();
}

function normalizeStateAfterContentChange() {
  const content = getContent();
  const serializedExamState = serializeExamState(state.exam);

  clearExamTimer();

  Object.assign(
    state,
    normalizeStudyProgress(
      {
        ...state,
        examState: serializedExamState
      },
      content,
      hydrateExamState
    )
  );

  saveJson(keyFor("checklist"), [...state.checked]);
  saveJson(keyFor("seenCards"), [...state.seenCards]);
  saveJson(keyFor("cardOrder"), state.cardOrder);
  saveJson(keyFor("practiceAnswers"), state.practiceAnswers);
  saveJson(keyFor("practiceSolved"), [...state.practiceSolved]);
  saveJson(keyFor("quizMastered"), [...state.quizMastered]);
  saveJson(keyFor("reviewQueue"), [...state.reviewQueue]);
  persistExamState();
  persistQuizState();
  persistViewState();

  if (state.exam.status === "running") {
    restoreRuntimeState();
  }
}

function resetPractice() {
  state.practiceAnswers = {};
  state.practiceSolved.clear();
  removeStorageKey(keyFor("practiceAnswers"));
  saveJson(keyFor("practiceSolved"), []);
  state.stats.practiceSolvedCount = 0;
  persistStats();
  renderViews(["practice"]);
  rerenderProgressDependentViews();
}

function resetAllProgress() {
  if (!window.confirm(getContent().alerts.resetAll)) {
    return;
  }

  clearExamTimer();
  state.checked.clear();
  state.seenCards.clear();
  state.practiceAnswers = {};
  state.practiceSolved.clear();
  state.quizAnswers = {};
  state.quizMastered.clear();
  state.quizMode = "default";
  state.quizVariantIds = [];
  state.quizLogged = false;
  state.reviewQueue.clear();
  state.stats = createDefaultStats();
  state.examDurationMinutes = DEFAULT_EXAM_DURATION_MINUTES;
  state.examQuestionCount = DEFAULT_EXAM_QUESTION_COUNT;
  state.customPack = null;
  state.contentPack = buildContentPack(null);
  state.activeTopic = "all";
  state.currentCard = 0;
  state.cardOrder = createSequence(BASE_CONTENT[state.lang].flashcards.length);
  state.exam = createEmptyExamState();
  state.onboardingSeen = false;

  [
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
    "examDurationMinutes",
    "examQuestionCount",
    "customPack",
    "onboardingSeen",
    "examState",
    "viewState"
  ].forEach((key) => removeStorageKey(keyFor(key)));

  renderApp();
}

function persistExamSettings(durationMinutes, questionCount) {
  state.examDurationMinutes = durationMinutes;
  state.examQuestionCount = questionCount;
  saveJson(keyFor("examDurationMinutes"), state.examDurationMinutes);
  saveJson(keyFor("examQuestionCount"), state.examQuestionCount);
}

function getContent() {
  return state.contentPack[state.lang];
}

function formatDuration(milliseconds) {
  const totalSeconds = Math.ceil(milliseconds / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function formatImportError(prefix, errors) {
  if (!Array.isArray(errors) || !errors.length) {
    return prefix;
  }

  return `${prefix} ${errors[0]}`;
}

function isImportFileTooLarge(file) {
  return Number(file?.size) > MAX_IMPORT_FILE_SIZE_BYTES;
}

function syncUrlState() {
  window.history.replaceState(null, "", buildStateUrl(window.location.href, state));
}

function persistViewState() {
  saveJson(keyFor("viewState"), buildViewStateSnapshot(state));
}

async function copyCurrentViewLink() {
  const absoluteUrl = new URL(buildStateUrl(window.location.href, state), window.location.origin).href;
  const copied = await copyTextToClipboard(absoluteUrl);
  showToast(getContent().toasts[copied ? "linkCopied" : "copyFailed"], copied ? "success" : "warning");
}

async function copyTextToClipboard(text) {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (error) {
      return false;
    }
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "absolute";
  textarea.style.left = "-9999px";
  document.body.appendChild(textarea);
  textarea.select();

  let copied = false;
  try {
    copied = document.execCommand("copy");
  } catch (error) {
    copied = false;
  }

  textarea.remove();
  return copied;
}

function hydrateExamState(value, content) {
  return hydrateExamStateHelper(value, content.quizData, createEmptyExamState);
}

function serializeExamState(examState) {
  return serializeExamStateHelper(examState);
}

function persistExamState() {
  const serialized = serializeExamState(state.exam);
  if (!serialized) {
    removeStorageKey(keyFor("examState"));
    return;
  }

  saveJson(keyFor("examState"), serialized);
}

function finalizeExamSession(examSnapshot, timeout) {
  const questions = getExamQuestions();
  const finalized = buildFinalizedExamSession(
    questions,
    examSnapshot.answers,
    state.reviewQueue,
    state.quizMastered,
    examSnapshot.durationMinutes,
    timeout
  );
  state.reviewQueue = finalized.reviewQueue;
  state.quizMastered = finalized.quizMastered;

  saveJson(keyFor("reviewQueue"), [...state.reviewQueue]);
  saveJson(keyFor("quizMastered"), [...state.quizMastered]);
  recordSession("exam", finalized.score, finalized.total, finalized.sessionLabel);

  state.exam = finalized.exam;

  persistExamState();
}

function restoreRuntimeState({ notify = false } = {}) {
  clearExamTimer();

  const plan = resolveExamRestorePlan(state.exam, Date.now());
  if (plan.action === "persist") {
    persistExamState();
    return;
  }

  if (plan.action === "timeout") {
    finalizeExamSession(plan.examSnapshot, plan.timeout);
    return;
  }

  state.exam.timerId = window.setInterval(handleExamTick, 1000);
  persistExamState();

  if (notify) {
    showToast(getContent().toasts.examRestored, "info");
  }
}

function renderAchievements(content) {
  const achievementIds = Object.keys(content.achievements || {});

  dom.achievementsList.innerHTML = achievementIds.length
    ? `<div class="achievement-list">${achievementIds
        .sort((left, right) => Number(state.stats.achievements.includes(right)) - Number(state.stats.achievements.includes(left)))
        .map((achievementId) => renderAchievementItem(achievementId, content))
        .join("")}</div>`
    : `<div class="empty-state">${content.analytics.emptyAchievements}</div>`;
}

function renderAchievementItem(achievementId, content) {
  const unlocked = state.stats.achievements.includes(achievementId);
  const progress = getAchievementProgress(achievementId, content);
  return renderAchievementItemTemplate(achievementId, content, unlocked, progress);
}

function getAchievementProgress(achievementId, content) {
  return getAchievementProgressHelper(achievementId, state, content);
}

function noteStudyProgress() {
  markStudyActivity({ persist: false });
  syncAchievements({ persist: false });
  persistStats();
}

function markStudyActivity({ persist = true } = {}) {
  const today = getDayStamp();
  const previous = state.stats.lastStudyDate;

  if (!previous) {
    state.stats.studyStreak = 1;
    state.stats.lastStudyDate = today;
  } else if (previous !== today) {
    const diff = getDayDifference(previous, today);
    state.stats.studyStreak = diff === 1 ? state.stats.studyStreak + 1 : 1;
    state.stats.lastStudyDate = today;
  }

  if (persist) {
    persistStats();
  }
}

function getDayStamp(date = new Date()) {
  const offsetDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return offsetDate.toISOString().slice(0, 10);
}

function getDayDifference(fromStamp, toStamp) {
  const from = new Date(`${fromStamp}T00:00:00`);
  const to = new Date(`${toStamp}T00:00:00`);
  return Math.round((to - from) / 86_400_000);
}

function syncAchievements({ persist = true, toast = true } = {}) {
  const content = getContent();
  const unlocked = new Set(state.stats.achievements);
  const newlyUnlocked = [];

  Object.keys(content.achievements || {}).forEach((achievementId) => {
    if (unlocked.has(achievementId) || !isAchievementUnlocked(achievementId, content)) {
      return;
    }

    unlocked.add(achievementId);
    newlyUnlocked.push(achievementId);
  });

  if (!newlyUnlocked.length) {
    if (persist) {
      persistStats();
    }
    return;
  }

  state.stats.achievements = [...unlocked];

  if (persist) {
    persistStats();
  }

  if (toast) {
    newlyUnlocked.forEach((achievementId) => {
      showToast(`${content.toasts.achievement}: ${content.achievements[achievementId]}`, "success");
    });
  }
}

function isAchievementUnlocked(achievementId, content) {
  return isAchievementUnlockedHelper(achievementId, state, content);
}

function persistStats() {
  saveJson(keyFor("stats"), state.stats);
}

function showToast(message, tone = "info") {
  if (!message) {
    return;
  }

  if (dom.toastStack.childElementCount >= 4) {
    dom.toastStack.firstElementChild?.remove();
  }

  const toast = document.createElement("div");
  toast.className = `toast ${tone}`;
  toast.textContent = message;
  dom.toastStack.appendChild(toast);
  announceStatus(message);

  window.setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(8px)";
  }, 2600);

  window.setTimeout(() => {
    toast.remove();
  }, 3000);
}

function announceStatus(message) {
  dom.srStatus.textContent = "";
  window.setTimeout(() => {
    dom.srStatus.textContent = message;
  }, 10);
}

function handleConnectivityChange(isOnline) {
  state.isOnline = isOnline;
  renderSystemStatus(getContent());
  showToast(getContent().toasts[isOnline ? "online" : "offline"], isOnline ? "success" : "warning");
}

function maybeShowOnboarding() {
  if (state.onboardingSeen) {
    hideWelcomeModal();
    return;
  }

  if (hasStudyProgress()) {
    setOnboardingSeen(true);
    hideWelcomeModal();
    return;
  }

  state.modalReturnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  dom.welcomeModal.classList.remove("hidden");
  dom.welcomeModal.setAttribute("aria-hidden", "false");
  window.setTimeout(() => {
    dom.startWelcomeBtn.focus();
  }, 0);
}

function hideWelcomeModal() {
  dom.welcomeModal.classList.add("hidden");
  dom.welcomeModal.setAttribute("aria-hidden", "true");
  if (state.modalReturnFocus instanceof HTMLElement) {
    state.modalReturnFocus.focus();
  }
  state.modalReturnFocus = null;
}

function dismissWelcomeModal(markSeen) {
  if (markSeen) {
    setOnboardingSeen(true);
  }

  hideWelcomeModal();
}

function startWelcomeFlow() {
  dismissWelcomeModal(true);
  showSection(getNextRecommendedStep().section);
}

function setOnboardingSeen(value) {
  state.onboardingSeen = Boolean(value);
  saveJson(keyFor("onboardingSeen"), state.onboardingSeen);
}

function hasStudyProgress() {
  return hasStudyProgressHelper(state);
}

function trapModalFocus(event) {
  const focusable = Array.from(
    dom.welcomeModal.querySelectorAll("button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])")
  ).filter((element) => !element.hasAttribute("disabled"));

  if (!focusable.length) {
    return;
  }

  const first = focusable[0];
  const last = focusable[focusable.length - 1];

  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}


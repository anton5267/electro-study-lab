import { BASE_CONTENT, buildContentPack } from "./modules/content.js";
import {
  createDefaultStats,
  getStorageKey,
  loadJson,
  normalizeStats,
  removeStorageKey,
  saveJson
} from "./modules/storage.js";
import {
  answerExamQuestion,
  answerQuestion,
  buildFinishedExamState,
  buildRecordedStats,
  createDefaultQuizState,
  createEmptyExamState,
  createQuizVariantState,
  createReviewQuizState,
  createRunningExamState,
  findNextUnansweredQuestion,
  getExamQuestions as getExamQuestionsHelper,
  resolveAssessmentResults
} from "./modules/assessment-state.js";
import {
  formatHistoryLabel as formatHistoryLabelHelper,
  getAchievementProgress as getAchievementProgressHelper,
  getActiveQuizQuestions as getActiveQuizQuestionsHelper,
  getCustomPackSummary as getCustomPackSummaryHelper,
  getLastExamPercent as getLastExamPercentHelper,
  getNextRecommendedStep as getNextRecommendedStepHelper,
  getQuizModeMessage as getQuizModeMessageHelper,
  getQuizScore as getQuizScoreHelper,
  getQuizSessionLabel as getQuizSessionLabelHelper,
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
  buildBackupPayload,
  createImportedBackupState,
  normalizeStudyProgress,
  readStringArray
} from "./modules/progress-state.js";
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
  average,
  clamp,
  createSequence,
  debounce,
  format,
  isTypingTarget,
  matchesQuery,
  normalizeCardOrder,
  normalizeMap,
  normalizeNumberArray,
  safeNumber,
  shuffleArray,
  toPercent,
  withinTolerance
} from "./modules/utils.js";

const SECTION_IDS = ["overview", "theory", "flashcards", "practice", "quiz", "exam", "checklist", "analytics"];

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

const state = createInitialState();

bindEvents();
initPwa();
restoreRuntimeState({ notify: true });
renderApp();

function createInitialState() {
  const customPack = loadJson(getStorageKey("customPack"), null);
  const contentPack = buildContentPack(customPack);
  const storedLanguage = loadJson(getStorageKey("language"), "uk");
  const storedViewState = loadJson(getStorageKey("viewState"), {});
  const initialViewState = resolveInitialViewState(window.location.href, storedViewState, contentPack, storedLanguage, SECTION_IDS);
  const lang = initialViewState.lang;
  const current = contentPack[lang];
  const exam = hydrateExamState(loadJson(getStorageKey("examState"), null), current);

  return {
    lang,
    contentPack,
    customPack,
    activeSection: exam.status === "running" ? "exam" : initialViewState.activeSection,
    searchQuery: initialViewState.searchQuery,
    activeTopic: initialViewState.activeTopic,
    currentCard: initialViewState.currentCard,
    diagramSelections: initialViewState.diagramSelections,
    checked: new Set(normalizeNumberArray(loadJson(getStorageKey("checklist"), []), current.checklistItems.length)),
    seenCards: new Set(normalizeNumberArray(loadJson(getStorageKey("seenCards"), []), current.flashcards.length)),
    cardOrder: normalizeCardOrder(loadJson(getStorageKey("cardOrder"), []), current.flashcards.length),
    practiceAnswers: normalizeMap(loadJson(getStorageKey("practiceAnswers"), {})),
    practiceSolved: new Set(readStringArray(loadJson(getStorageKey("practiceSolved"), []))),
    quizAnswers: normalizeMap(loadJson(getStorageKey("quizAnswers"), {})),
    quizMastered: new Set(readStringArray(loadJson(getStorageKey("quizMastered"), []))),
    quizMode: loadJson(getStorageKey("quizMode"), "default"),
    quizVariantIds: readStringArray(loadJson(getStorageKey("quizVariantIds"), [])),
    quizLogged: false,
    reviewQueue: new Set(readStringArray(loadJson(getStorageKey("reviewQueue"), []))),
    stats: normalizeStats(loadJson(getStorageKey("stats"), createDefaultStats())),
    exam,
    pwaPrompt: null,
    onboardingSeen: Boolean(loadJson(getStorageKey("onboardingSeen"), false)),
    isOnline: navigator.onLine,
    updateReady: false,
    serviceWorkerRegistration: null,
    modalReturnFocus: null
  };
}

function bindEvents() {
  dom.languageSwitcher.addEventListener("click", (event) => {
    const button = event.target.closest(".lang-btn");
    if (button) {
      setLanguage(button.dataset.lang);
    }
  });

  dom.navTabs.forEach((tab) => {
    tab.addEventListener("click", () => showSection(tab.dataset.section));
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
  renderStaticText();
  renderOverview();
  renderTheory();
  renderFlashcards(true);
  renderPractice();
  renderQuiz();
  renderExam();
  renderChecklist();
  renderAnalytics();
  updateProgress();
  showSection(state.activeSection, false);
  syncUrlState();
  persistViewState();
  maybeShowOnboarding();
}

function renderStaticText() {
  const content = getContent();

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
  dom.shuffleCardsBtn.textContent = content.flashcards.shuffle;
  dom.fcFrontHint.textContent = content.flashcards.frontHint;
  dom.fcBackHint.textContent = content.flashcards.backHint;
  dom.prevCardBtn.textContent = content.flashcards.previous;
  dom.flipCardBtn.textContent = content.flashcards.flip;
  dom.nextCardBtn.textContent = content.flashcards.next;
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
  dom.fcCounter.textContent = format(content.flashcards.counter, {
    current: state.currentCard + 1,
    total: visibleIndexes.length
  });
  dom.flashcardStatus.textContent = format(content.flashcards.status, {
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
    dom.examIntro.innerHTML = renderExamIntro(content);
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

function renderExamIntro(content) {
  return renderExamIntroTemplate(content);
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
  const total = content.checklistItems.length + content.flashcards.length + content.practiceProblems.length + content.quizData.length + 1;
  const lastExamPercent = getLastExamPercent();
  const done = state.checked.size + state.seenCards.size + state.practiceSolved.size + state.quizMastered.size + (lastExamPercent > 0 ? 1 : 0);
  const completion = toPercent(done, total);
  const accuracyValues = [state.stats.averageQuizScore, state.stats.averageExamScore].filter((value) => value > 0);

  dom.progressLabel.textContent = format(content.progressTemplate, { done, total });
  dom.completionValue.textContent = format(content.completionTemplate, { pct: completion });
  dom.progressBar.style.width = `${completion}%`;
  dom.metricChecklistValue.textContent = `${state.checked.size}/${content.checklistItems.length}`;
  dom.metricFlashcardsValue.textContent = `${state.seenCards.size}/${content.flashcards.length}`;
  dom.metricPracticeValue.textContent = `${state.practiceSolved.size}/${content.practiceProblems.length}`;
  dom.metricQuizValue.textContent = `${state.quizMastered.size}/${content.quizData.length}`;
  dom.metricExamValue.textContent = lastExamPercent > 0 ? `${Math.round(lastExamPercent)}%` : "—";
  dom.metricAccuracyValue.textContent = accuracyValues.length ? `${Math.round(average(accuracyValues))}%` : "—";
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
  saveJson(getStorageKey("language"), state.lang);
  renderApp();
}

function handleSearchInput(event) {
  state.searchQuery = event.target.value || "";
  state.currentCard = 0;
  renderOverview();
  renderTheory();
  renderFlashcards(true);
  renderPractice();
  renderChecklist();
  syncUrlState();
  persistViewState();
}

function handleNavTabKeydown(event) {
  const currentIndex = dom.navTabs.indexOf(event.currentTarget);
  if (currentIndex === -1) {
    return;
  }

  let nextIndex = null;

  if (event.key === "ArrowRight") {
    nextIndex = (currentIndex + 1) % dom.navTabs.length;
  } else if (event.key === "ArrowLeft") {
    nextIndex = (currentIndex - 1 + dom.navTabs.length) % dom.navTabs.length;
  } else if (event.key === "Home") {
    nextIndex = 0;
  } else if (event.key === "End") {
    nextIndex = dom.navTabs.length - 1;
  }

  if (nextIndex === null) {
    return;
  }

  event.preventDefault();
  const nextTab = dom.navTabs[nextIndex];
  showSection(nextTab.dataset.section);
  nextTab.focus();
}

function handleTopicFilterClick(event) {
  const button = event.target.closest("[data-topic-filter]");
  if (!button) {
    return;
  }

  state.activeTopic = button.dataset.topicFilter;
  state.currentCard = 0;
  renderStaticText();
  renderOverview();
  renderTheory();
  renderFlashcards(true);
  renderPractice();
  renderQuiz();
  renderChecklist();
  renderAnalytics();
  syncUrlState();
  persistViewState();
}

function clearSearch() {
  state.searchQuery = "";
  dom.searchInput.value = "";
  renderOverview();
  renderTheory();
  renderFlashcards(true);
  renderPractice();
  renderChecklist();
  syncUrlState();
  persistViewState();
}

function handleTheoryClick(event) {
  const button = event.target.closest("[data-hotspot-index]");
  if (!button) {
    return;
  }

  state.diagramSelections[button.dataset.cardId] = Number(button.dataset.hotspotIndex);
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

  const actualIndex = visibleIndexes[state.currentCard];
  if (!state.seenCards.has(actualIndex)) {
    state.seenCards.add(actualIndex);
    saveJson(getStorageKey("seenCards"), [...state.seenCards]);
    noteStudyProgress();
    updateProgress();
    renderOverview();
    renderAnalytics();
  }
}

function nextCard() {
  const visibleIndexes = getVisibleFlashcardIndexes();
  if (!visibleIndexes.length) {
    return;
  }

  state.currentCard = (state.currentCard + 1) % visibleIndexes.length;
  persistViewState();
  renderFlashcards(true);
}

function previousCard() {
  const visibleIndexes = getVisibleFlashcardIndexes();
  if (!visibleIndexes.length) {
    return;
  }

  state.currentCard = (state.currentCard - 1 + visibleIndexes.length) % visibleIndexes.length;
  persistViewState();
  renderFlashcards(true);
}

function shuffleFlashcards() {
  state.cardOrder = shuffleArray(createSequence(getContent().flashcards.length));
  state.currentCard = 0;
  saveJson(getStorageKey("cardOrder"), state.cardOrder);
  persistViewState();
  renderFlashcards(true);
}

function handlePracticeInput(event) {
  const input = event.target.closest("[data-problem-input]");
  if (!input) {
    return;
  }

  state.practiceAnswers[input.dataset.problemInput] = input.value;
  saveJson(getStorageKey("practiceAnswers"), state.practiceAnswers);
}

function handlePracticeClick(event) {
  const button = event.target.closest("[data-check-problem]");
  if (button) {
    checkPracticeProblem(button.dataset.checkProblem);
  }
}

function checkPracticeProblem(problemId) {
  const content = getContent();
  const problem = content.practiceProblems.find((item) => item.id === problemId);
  if (!problem) {
    return;
  }

  const parsedAnswer = safeNumber(state.practiceAnswers[problemId]);
  const correct = parsedAnswer !== null && withinTolerance(parsedAnswer, problem.answer, problem.tolerance);

  if (correct) {
    state.practiceSolved.add(problemId);
    saveJson(getStorageKey("practiceSolved"), [...state.practiceSolved]);
    state.stats.practiceSolvedCount = state.practiceSolved.size;
  }

  noteStudyProgress();
  renderPractice();
  updateProgress();
  renderOverview();
  renderAnalytics();
}

function getPracticeResult(problemId, problem) {
  const content = getContent();
  const rawValue = state.practiceAnswers[problemId];

  if (rawValue === undefined || rawValue === "") {
    return null;
  }

  const parsedAnswer = safeNumber(rawValue);
  const correct = parsedAnswer !== null && withinTolerance(parsedAnswer, problem.answer, problem.tolerance);

  return {
    correct,
    message: format(correct ? content.practice.correct : content.practice.wrong, {
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
  const button = event.target.closest("[data-answer-question]");
  if (!button) {
    return;
  }

  const questionId = button.dataset.answerQuestion;
  if (state.quizAnswers[questionId] !== undefined) {
    return;
  }

  state.quizAnswers = answerQuestion(state.quizAnswers, questionId, Number(button.dataset.optionIndex));
  saveJson(getStorageKey("quizAnswers"), state.quizAnswers);
  renderQuiz();
}

function generateQuizVariant() {
  Object.assign(state, createQuizVariantState(getContent(), shuffleArray));
  persistQuizState();
  renderQuiz();
  updateProgress();
  renderOverview();
  showSection("quiz");
}

function startReviewMode() {
  const nextQuizState = createReviewQuizState(getContent(), state.reviewQueue, state.activeTopic);
  if (!nextQuizState) {
    generateQuizVariant();
    return;
  }

  Object.assign(state, nextQuizState);
  persistQuizState();
  renderQuiz();
  showSection("quiz");
}

function resetQuiz() {
  Object.assign(state, createDefaultQuizState());
  persistQuizState();
  renderQuiz();
}

function persistQuizState() {
  saveJson(getStorageKey("quizAnswers"), state.quizAnswers);
  saveJson(getStorageKey("quizMode"), state.quizMode);
  saveJson(getStorageKey("quizVariantIds"), state.quizVariantIds);
}

function isQuizCompleted(questions) {
  return isQuizCompletedHelper(questions, state.quizAnswers);
}

function getQuizScore(questions) {
  return getQuizScoreHelper(questions, state.quizAnswers);
}

function finalizeQuizSession(questions) {
  const outcome = resolveAssessmentResults(questions, state.quizAnswers, state.reviewQueue, state.quizMastered);
  state.reviewQueue = outcome.reviewQueue;
  state.quizMastered = outcome.quizMastered;

  saveJson(getStorageKey("reviewQueue"), [...state.reviewQueue]);
  saveJson(getStorageKey("quizMastered"), [...state.quizMastered]);

  recordSession("quiz", outcome.score, questions.length, getQuizSessionLabel());
  state.quizLogged = true;
  updateProgress();
  renderOverview();
  renderAnalytics();
}

function handleExamIntroClick(event) {
  const button = event.target.closest("[data-start-exam]");
  if (!button) {
    return;
  }

  const durationSelect = document.getElementById("examDurationSelect");
  const countSelect = document.getElementById("examCountSelect");
  const durationMinutes = Number(durationSelect?.value || 10);
  const questionCount = Number(countSelect?.value || 8);
  startExam(durationMinutes, questionCount);
}

function startExam(durationMinutes, questionCount) {
  clearExamTimer();
  state.exam = {
    ...createRunningExamState(getContent(), questionCount, durationMinutes, Date.now(), shuffleArray),
    timerId: window.setInterval(handleExamTick, 1000),
  };

  persistExamState();
  renderExam();
  showSection("exam");
}

function handleExamTick() {
  if (state.exam.status !== "running") {
    clearExamTimer();
    return;
  }

  if (Date.now() >= state.exam.endAt) {
    submitExam(true);
    return;
  }

  renderExam();
}

function handleExamRuntimeClick(event) {
  const answerButton = event.target.closest("[data-exam-answer]");
  if (answerButton) {
    state.exam = answerExamQuestion(state.exam, answerButton.dataset.examAnswer, Number(answerButton.dataset.optionIndex));
    persistExamState();
    renderExam();
    return;
  }

  const submitButton = event.target.closest("[data-submit-exam]");
  if (submitButton) {
    submitExam(false);
  }
}

function handleExamResultClick(event) {
  const button = event.target.closest("[data-reset-exam]");
  if (!button) {
    return;
  }

  clearExamTimer();
  state.exam = createEmptyExamState();
  persistExamState();
  renderExam();
}

function getExamQuestions() {
  return getExamQuestionsHelper(getContent(), state.exam.questionIds);
}

function submitExam(timeout) {
  if (state.exam.status !== "running") {
    return;
  }

  clearExamTimer();
  finalizeExamSession({
    durationMinutes: state.exam.durationMinutes,
    answers: { ...state.exam.answers }
  }, timeout);

  renderExam();
  renderOverview();
  renderAnalytics();
  updateProgress();
}

function clearExamTimer() {
  if (state.exam.timerId) {
    window.clearInterval(state.exam.timerId);
    state.exam.timerId = null;
  }
}

function completeChecklist() {
  state.checked = new Set(createSequence(getContent().checklistItems.length));
  saveJson(getStorageKey("checklist"), [...state.checked]);
  noteStudyProgress();
  renderChecklist();
  updateProgress();
  renderOverview();
}

function resetChecklist() {
  state.checked.clear();
  saveJson(getStorageKey("checklist"), []);
  renderChecklist();
  updateProgress();
  renderOverview();
}

function handleChecklistClick(event) {
  const item = event.target.closest("[data-check-index]");
  if (!item) {
    return;
  }

  const index = Number(item.dataset.checkIndex);
  if (state.checked.has(index)) {
    state.checked.delete(index);
  } else {
    state.checked.add(index);
  }

  saveJson(getStorageKey("checklist"), [...state.checked]);
  noteStudyProgress();
  renderChecklist();
  updateProgress();
  renderOverview();
}

function handleJumpButtons(event) {
  const reviewButton = event.target.closest("[data-action='review-now']");
  if (reviewButton) {
    startReviewMode();
    return;
  }

  const jumpButton = event.target.closest("[data-jump-section]");
  if (jumpButton) {
    showSection(jumpButton.dataset.jumpSection);
  }
}

function handleKeyboardShortcuts(event) {
  if (!dom.welcomeModal.classList.contains("hidden")) {
    if (event.key === "Escape") {
      dismissWelcomeModal(true);
    } else if (event.key === "Tab") {
      trapModalFocus(event);
    }
    return;
  }

  if (isTypingTarget(event.target)) {
    return;
  }

  if (state.activeSection === "quiz" && /^[a-dA-D]$/.test(event.key)) {
    answerQuizWithKeyboard(event.key.toUpperCase().charCodeAt(0) - 65);
    return;
  }

  if (state.activeSection === "exam" && /^[a-dA-D]$/.test(event.key)) {
    answerExamWithKeyboard(event.key.toUpperCase().charCodeAt(0) - 65);
    return;
  }

  if (/^[1-8]$/.test(event.key)) {
    showSection(SECTION_IDS[Number(event.key) - 1]);
    return;
  }

  if (state.activeSection === "flashcards") {
    if (event.key === "ArrowRight") {
      nextCard();
    } else if (event.key === "ArrowLeft") {
      previousCard();
    } else if (event.key === " ") {
      event.preventDefault();
      flipFlashcard();
    }
  }
}

function handlePracticeKeydown(event) {
  const input = event.target.closest("[data-problem-input]");
  if (!input || event.key !== "Enter") {
    return;
  }

  event.preventDefault();
  checkPracticeProblem(input.dataset.problemInput);
}

function answerQuizWithKeyboard(optionIndex) {
  const question = findNextUnansweredQuestion(getActiveQuizQuestions(), state.quizAnswers);
  if (!question || optionIndex < 0 || optionIndex > 3) {
    return;
  }

  state.quizAnswers = answerQuestion(state.quizAnswers, question.id, optionIndex);
  saveJson(getStorageKey("quizAnswers"), state.quizAnswers);
  renderQuiz();
}

function answerExamWithKeyboard(optionIndex) {
  const question = findNextUnansweredQuestion(getExamQuestions(), state.exam.answers);
  if (!question || optionIndex < 0 || optionIndex > 3) {
    return;
  }

  state.exam = answerExamQuestion(state.exam, question.id, optionIndex);
  persistExamState();
  renderExam();
}

function recordSession(type, score, total, label) {
  markStudyActivity({ persist: false });
  state.stats = buildRecordedStats(state.stats, type, score, total, label);
  syncAchievements({ persist: false });
  persistStats();
}

function getQuizSessionLabel() {
  return getQuizSessionLabelHelper(state.quizMode);
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

  const reader = new FileReader();
  reader.onload = () => {
    try {
      const parsed = JSON.parse(String(reader.result || "{}"));
      const backupValidation = validateBackupPayload(parsed, buildContentPack(parsed.customPack ?? null));
      if (!backupValidation.valid) {
        showToast(formatImportError(getContent().importMessages.backupInvalid, backupValidation.errors), "warning");
        return;
      }

      applyBackupPayload(parsed);
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

  const reader = new FileReader();
  reader.onload = () => {
    try {
      const parsed = JSON.parse(String(reader.result || "{}"));
      const customPackValidation = validateCustomPack(parsed, BASE_CONTENT);
      if (!customPackValidation.valid) {
        showToast(formatImportError(getContent().importMessages.invalid, customPackValidation.errors), "warning");
        return;
      }

      state.customPack = parsed;
      saveJson(getStorageKey("customPack"), parsed);
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

  state.contentPack = buildContentPack(payload.customPack ?? null);
  Object.assign(
    state,
    createImportedBackupState(payload, state.contentPack, state.lang, SECTION_IDS, hydrateExamState)
  );

  saveJson(getStorageKey("customPack"), state.customPack);
  saveJson(getStorageKey("language"), state.lang);
  saveJson(getStorageKey("checklist"), [...state.checked]);
  saveJson(getStorageKey("seenCards"), [...state.seenCards]);
  saveJson(getStorageKey("cardOrder"), state.cardOrder);
  saveJson(getStorageKey("practiceAnswers"), state.practiceAnswers);
  saveJson(getStorageKey("practiceSolved"), [...state.practiceSolved]);
  saveJson(getStorageKey("quizAnswers"), state.quizAnswers);
  saveJson(getStorageKey("quizMastered"), [...state.quizMastered]);
  saveJson(getStorageKey("quizMode"), state.quizMode);
  saveJson(getStorageKey("quizVariantIds"), state.quizVariantIds);
  saveJson(getStorageKey("reviewQueue"), [...state.reviewQueue]);
  saveJson(getStorageKey("stats"), state.stats);
  saveJson(getStorageKey("onboardingSeen"), state.onboardingSeen);
  persistExamState();

  normalizeStateAfterContentChange();
  syncAchievements({ persist: false, toast: false });
  persistStats();
  renderApp();
}

function clearCustomPack() {
  state.customPack = null;
  removeStorageKey(getStorageKey("customPack"));
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

  saveJson(getStorageKey("checklist"), [...state.checked]);
  saveJson(getStorageKey("seenCards"), [...state.seenCards]);
  saveJson(getStorageKey("cardOrder"), state.cardOrder);
  saveJson(getStorageKey("practiceAnswers"), state.practiceAnswers);
  saveJson(getStorageKey("practiceSolved"), [...state.practiceSolved]);
  saveJson(getStorageKey("quizMastered"), [...state.quizMastered]);
  saveJson(getStorageKey("reviewQueue"), [...state.reviewQueue]);
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
  removeStorageKey(getStorageKey("practiceAnswers"));
  saveJson(getStorageKey("practiceSolved"), []);
  state.stats.practiceSolvedCount = 0;
  persistStats();
  renderPractice();
  renderOverview();
  renderAnalytics();
  updateProgress();
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
    "customPack",
    "onboardingSeen",
    "examState",
    "viewState"
  ].forEach((key) => removeStorageKey(getStorageKey(key)));

  renderApp();
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

function syncUrlState() {
  window.history.replaceState(null, "", buildStateUrl(window.location.href, state));
}

function persistViewState() {
  saveJson(getStorageKey("viewState"), buildViewStateSnapshot(state));
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
    removeStorageKey(getStorageKey("examState"));
    return;
  }

  saveJson(getStorageKey("examState"), serialized);
}

function finalizeExamSession(examSnapshot, timeout) {
  const questions = getExamQuestions();
  const outcome = resolveAssessmentResults(questions, examSnapshot.answers, state.reviewQueue, state.quizMastered);
  state.reviewQueue = outcome.reviewQueue;
  state.quizMastered = outcome.quizMastered;

  saveJson(getStorageKey("reviewQueue"), [...state.reviewQueue]);
  saveJson(getStorageKey("quizMastered"), [...state.quizMastered]);
  recordSession("exam", outcome.score, questions.length, `${examSnapshot.durationMinutes} min`);

  state.exam = buildFinishedExamState(questions.map((question) => question.id), outcome, timeout);

  persistExamState();
}

function restoreRuntimeState({ notify = false } = {}) {
  clearExamTimer();

  if (state.exam.status !== "running") {
    persistExamState();
    return;
  }

  if ((state.exam.endAt || 0) <= Date.now()) {
    finalizeExamSession({
      durationMinutes: state.exam.durationMinutes,
      answers: { ...state.exam.answers }
    }, true);
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
  saveJson(getStorageKey("stats"), state.stats);
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
  saveJson(getStorageKey("onboardingSeen"), state.onboardingSeen);
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

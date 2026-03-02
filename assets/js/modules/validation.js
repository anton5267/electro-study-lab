import { BASE_CONTENT } from "./content.js";
import { EXAM_DURATION_OPTIONS, EXAM_QUESTION_COUNT_OPTIONS } from "./exam-preferences.js";

const SECTION_IDS = ["overview", "theory", "flashcards", "practice", "quiz", "exam", "checklist", "analytics"];
const MAX_CUSTOM_PACK_ITEMS_PER_COLLECTION = 500;

export function validateCustomPack(pack, baseContent) {
  const errors = [];

  if (!pack || typeof pack !== "object" || Array.isArray(pack)) {
    return {
      valid: false,
      errors: ["Custom pack must be an object."]
    };
  }

  const allowedLanguages = ["uk", "de"];
  const allowedKeys = ["theory", "flashcards", "practiceProblems", "quizData", "checklistItems"];
  const presentLanguages = allowedLanguages.filter((language) => pack[language] && typeof pack[language] === "object" && !Array.isArray(pack[language]));

  if (!presentLanguages.length) {
    errors.push("Custom pack must contain at least one language object: uk or de.");
  }

  Object.keys(pack).forEach((key) => {
    if (!allowedLanguages.includes(key)) {
      errors.push(`Unknown root key "${key}" in custom pack.`);
    }
  });

  allowedLanguages.forEach((language) => {
    if (pack[language] === undefined) {
      return;
    }

    const languagePack = pack[language];
    if (!languagePack || typeof languagePack !== "object" || Array.isArray(languagePack)) {
      errors.push(`${language} must be an object.`);
      return;
    }

    Object.keys(languagePack).forEach((key) => {
      if (!allowedKeys.includes(key)) {
        errors.push(`${language} contains unsupported key "${key}".`);
      }
    });

    allowedKeys.forEach((collectionName) => {
      if (languagePack[collectionName] === undefined) {
        return;
      }

      if (!Array.isArray(languagePack[collectionName])) {
        errors.push(`${language}.${collectionName} must be an array.`);
        return;
      }

      if (languagePack[collectionName].length > MAX_CUSTOM_PACK_ITEMS_PER_COLLECTION) {
        errors.push(
          `${language}.${collectionName} exceeds max items (${MAX_CUSTOM_PACK_ITEMS_PER_COLLECTION}).`
        );
      }
    });

    validateTheory(languagePack.theory || [], language, baseContent[language], errors);
    validateFlashcards(languagePack.flashcards || [], language, baseContent[language], errors);
    validatePracticeProblems(languagePack.practiceProblems || [], language, baseContent[language], errors);
    validateQuizData(languagePack.quizData || [], language, baseContent[language], errors);
    validateChecklist(languagePack.checklistItems || [], language, errors);
  });

  return {
    valid: errors.length === 0,
    errors
  };
}

export function validateBackupPayload(payload, contentPack) {
  const errors = [];

  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return {
      valid: false,
      errors: ["Backup payload must be an object."]
    };
  }

  if (!payload.progress || typeof payload.progress !== "object" || Array.isArray(payload.progress)) {
    errors.push('Backup payload must contain a "progress" object.');
    return { valid: false, errors };
  }

  const allowedLanguages = Object.keys(contentPack);
  const language = typeof payload.language === "string" && allowedLanguages.includes(payload.language)
    ? payload.language
    : allowedLanguages[0];
  const content = contentPack[language];

  if (payload.version !== undefined && (!Number.isInteger(payload.version) || payload.version < 1)) {
    errors.push("Backup version must be a positive integer.");
  }

  if (payload.savedAt !== undefined && (typeof payload.savedAt !== "string" || Number.isNaN(Date.parse(payload.savedAt)))) {
    errors.push("savedAt must be a valid ISO date string.");
  }

  if (payload.language !== undefined && (typeof payload.language !== "string" || !allowedLanguages.includes(payload.language))) {
    errors.push(`Backup language must be one of: ${allowedLanguages.join(", ")}.`);
  }

  if (
    payload.activeTopic !== undefined &&
    !(payload.activeTopic === "all" || (typeof payload.activeTopic === "string" && content.topicLabels[payload.activeTopic]))
  ) {
    errors.push(`Backup contains unknown topic "${payload.activeTopic}".`);
  }

  if (payload.customPack !== undefined && payload.customPack !== null) {
    const customPackValidation = validateCustomPack(payload.customPack, BASE_CONTENT);
    if (!customPackValidation.valid) {
      errors.push(...customPackValidation.errors.map((message) => `customPack: ${message}`));
    }
  }

  if (payload.onboardingSeen !== undefined && typeof payload.onboardingSeen !== "boolean") {
    errors.push("onboardingSeen must be a boolean.");
  }

  if (payload.examSettings !== undefined) {
    validateExamSettings(payload.examSettings, errors);
  }

  if (payload.viewState !== undefined && payload.viewState !== null) {
    validateViewState(payload.viewState, content, errors);
  }

  const progress = payload.progress;
  const progressArrayFields = [
    "checklist",
    "seenCards",
    "cardOrder",
    "practiceSolved",
    "quizMastered",
    "quizVariantIds",
    "reviewQueue"
  ];
  progressArrayFields.forEach((field) => assertArray(progress[field], `progress.${field}`, errors));

  assertObject(progress.practiceAnswers, "progress.practiceAnswers", errors);
  assertObject(progress.quizAnswers, "progress.quizAnswers", errors);

  ["checklist", "seenCards", "cardOrder"].forEach((field) => {
    assertNonNegativeIntegerArrayMembers(progress[field], `progress.${field}`, errors);
  });
  ["practiceSolved", "quizMastered", "quizVariantIds", "reviewQueue"].forEach((field) => {
    assertStringArrayMembers(progress[field], `progress.${field}`, errors);
  });

  assertPracticeAnswers(progress.practiceAnswers, errors);
  assertQuizAnswers(progress.quizAnswers, errors);

  if (
    progress.quizMode !== undefined &&
    !["default", "review", "variant"].includes(progress.quizMode)
  ) {
    errors.push('progress.quizMode must be "default", "review", or "variant".');
  }

  if (progress.stats !== undefined && (!progress.stats || typeof progress.stats !== "object" || Array.isArray(progress.stats))) {
    errors.push("progress.stats must be an object.");
  }

  if (progress.examState !== undefined && progress.examState !== null) {
    validateExamState(progress.examState, content, errors);
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

function validateTheory(items, language, baseLanguage, errors) {
  validateDuplicateIds(items, language, "theory", baseLanguage.theory, errors);

  items.forEach((item, index) => {
    const label = `${language}.theory[${index}]`;
    validateRequiredString(item.id, `${label}.id`, errors);
    validateTopic(item.topic, `${label}.topic`, baseLanguage.topicLabels, errors);
    validateRequiredString(item.icon, `${label}.icon`, errors);
    validateRequiredString(item.title, `${label}.title`, errors);
    validateRequiredString(item.lead, `${label}.lead`, errors);

    if (!Array.isArray(item.intro) || !item.intro.length || item.intro.some((part) => typeof part !== "string")) {
      errors.push(`${label}.intro must be a non-empty string array.`);
    } else if (item.intro.some((part) => containsHtmlMarkup(part))) {
      errors.push(`${label}.intro must not contain HTML tags.`);
    }

    if (item.table !== undefined) {
      if (!item.table || typeof item.table !== "object" || Array.isArray(item.table)) {
        errors.push(`${label}.table must be an object.`);
      } else {
        if (!Array.isArray(item.table.headers) || !item.table.headers.length || item.table.headers.some((value) => typeof value !== "string")) {
          errors.push(`${label}.table.headers must be a non-empty string array.`);
        } else if (item.table.headers.some((value) => containsHtmlMarkup(value))) {
          errors.push(`${label}.table.headers must not contain HTML tags.`);
        }

        if (!Array.isArray(item.table.rows) || item.table.rows.some((row) => !Array.isArray(row) || row.some((cell) => typeof cell !== "string"))) {
          errors.push(`${label}.table.rows must be an array of string arrays.`);
        } else if (item.table.rows.some((row) => row.some((cell) => containsHtmlMarkup(cell)))) {
          errors.push(`${label}.table.rows must not contain HTML tags.`);
        }
      }
    }

    if (item.diagram !== undefined) {
      if (!item.diagram || typeof item.diagram !== "object" || Array.isArray(item.diagram)) {
        errors.push(`${label}.diagram must be an object.`);
      } else {
        if (!["spar", "cross"].includes(item.diagram.type)) {
          errors.push(`${label}.diagram.type must be "spar" or "cross".`);
        }

        if (
          !Array.isArray(item.diagram.hotspots) ||
          !item.diagram.hotspots.length ||
          item.diagram.hotspots.some((hotspot) => !hotspot || typeof hotspot.label !== "string" || typeof hotspot.text !== "string")
        ) {
          errors.push(`${label}.diagram.hotspots must be a non-empty array of { label, text } objects.`);
        } else if (item.diagram.hotspots.some((hotspot) => containsHtmlMarkup(hotspot.label) || containsHtmlMarkup(hotspot.text))) {
          errors.push(`${label}.diagram.hotspots must not contain HTML tags.`);
        }
      }
    }

    validateOptionalString(item.highlight, `${label}.highlight`, errors);
    validateOptionalString(item.danger, `${label}.danger`, errors);
  });
}

function validateFlashcards(items, language, baseLanguage, errors) {
  validateDuplicateIds(items, language, "flashcards", baseLanguage.flashcards, errors);

  items.forEach((item, index) => {
    const label = `${language}.flashcards[${index}]`;
    validateRequiredString(item.id, `${label}.id`, errors);
    validateTopic(item.topic, `${label}.topic`, baseLanguage.topicLabels, errors);
    validateRequiredString(item.term, `${label}.term`, errors);
    validateRequiredString(item.def, `${label}.def`, errors);
  });
}

function validatePracticeProblems(items, language, baseLanguage, errors) {
  validateDuplicateIds(items, language, "practiceProblems", baseLanguage.practiceProblems, errors);

  items.forEach((item, index) => {
    const label = `${language}.practiceProblems[${index}]`;
    validateRequiredString(item.id, `${label}.id`, errors);
    validateTopic(item.topic, `${label}.topic`, baseLanguage.topicLabels, errors);
    validateRequiredString(item.prompt, `${label}.prompt`, errors);
    validateRequiredNumber(item.answer, `${label}.answer`, errors);
    validateRequiredNumber(item.tolerance, `${label}.tolerance`, errors, { min: 0 });
    validateRequiredString(item.explanation, `${label}.explanation`, errors);
  });
}

function validateQuizData(items, language, baseLanguage, errors) {
  validateDuplicateIds(items, language, "quizData", baseLanguage.quizData, errors);

  items.forEach((item, index) => {
    const label = `${language}.quizData[${index}]`;
    validateRequiredString(item.id, `${label}.id`, errors);
    validateTopic(item.topic, `${label}.topic`, baseLanguage.topicLabels, errors);
    validateRequiredString(item.q, `${label}.q`, errors);

    if (!Array.isArray(item.opts) || item.opts.length !== 4 || item.opts.some((option) => typeof option !== "string")) {
      errors.push(`${label}.opts must be an array of 4 strings.`);
    } else if (item.opts.some((option) => containsHtmlMarkup(option))) {
      errors.push(`${label}.opts must not contain HTML tags.`);
    }

    if (!Number.isInteger(item.correct) || item.correct < 0 || item.correct > 3) {
      errors.push(`${label}.correct must be an integer from 0 to 3.`);
    }

    validateRequiredString(item.explanation, `${label}.explanation`, errors);
  });
}

function validateChecklist(items, language, errors) {
  items.forEach((item, index) => {
    if (typeof item !== "string" || !item.trim()) {
      errors.push(`${language}.checklistItems[${index}] must be a non-empty string.`);
    } else if (containsHtmlMarkup(item)) {
      errors.push(`${language}.checklistItems[${index}] must not contain HTML tags.`);
    }
  });
}

function validateExamState(examState, content, errors) {
  if (!examState || typeof examState !== "object" || Array.isArray(examState)) {
    errors.push("progress.examState must be an object.");
    return;
  }

  if (!["running", "finished"].includes(examState.status)) {
    errors.push('progress.examState.status must be "running" or "finished".');
    return;
  }

  if (!Array.isArray(examState.questionIds) || !examState.questionIds.length) {
    errors.push("progress.examState.questionIds must be a non-empty array.");
    return;
  }

  const validQuestionIds = new Set(content.quizData.map((item) => item.id));
  if (examState.questionIds.some((id) => typeof id !== "string" || !validQuestionIds.has(id))) {
    errors.push("progress.examState.questionIds contains unknown quiz ids.");
  }

  if (examState.status === "running") {
    assertObject(examState.answers, "progress.examState.answers", errors);

    if (
      examState.answers &&
      Object.entries(examState.answers).some(([id, answer]) => (
        typeof id !== "string" ||
        !validQuestionIds.has(id) ||
        !Number.isInteger(Number(answer)) ||
        Number(answer) < 0 ||
        Number(answer) > 3
      ))
    ) {
      errors.push("progress.examState.answers must map valid quiz ids to answer indexes 0-3.");
    }

    if (!Number.isFinite(Number(examState.durationMinutes)) || Number(examState.durationMinutes) <= 0) {
      errors.push("progress.examState.durationMinutes must be a positive number.");
    }

    if (!Number.isFinite(Number(examState.endAt))) {
      errors.push("progress.examState.endAt must be a timestamp number.");
    }
  }

  if (examState.status === "finished") {
    if (!examState.result || typeof examState.result !== "object" || Array.isArray(examState.result)) {
      errors.push("progress.examState.result must be an object.");
      return;
    }

    if (!Number.isFinite(Number(examState.result.score))) {
      errors.push("progress.examState.result.score must be a number.");
    }

    if (!Number.isFinite(Number(examState.result.total))) {
      errors.push("progress.examState.result.total must be a number.");
    }

    if (typeof examState.result.timeout !== "boolean") {
      errors.push("progress.examState.result.timeout must be a boolean.");
    }

    if (
      !Array.isArray(examState.result.wrongQuestionIds) ||
      examState.result.wrongQuestionIds.some((id) => typeof id !== "string" || !validQuestionIds.has(id))
    ) {
      errors.push("progress.examState.result.wrongQuestionIds must be an array of valid quiz ids.");
    }
  }
}

function validateViewState(viewState, content, errors) {
  if (!viewState || typeof viewState !== "object" || Array.isArray(viewState)) {
    errors.push("viewState must be an object.");
    return;
  }

  if (viewState.activeSection !== undefined && !SECTION_IDS.includes(viewState.activeSection)) {
    errors.push(`viewState.activeSection must be one of: ${SECTION_IDS.join(", ")}.`);
  }

  if (
    viewState.activeTopic !== undefined &&
    !(viewState.activeTopic === "all" || (typeof viewState.activeTopic === "string" && content.topicLabels[viewState.activeTopic]))
  ) {
    errors.push(`viewState.activeTopic contains unknown topic "${viewState.activeTopic}".`);
  }

  if (viewState.searchQuery !== undefined && typeof viewState.searchQuery !== "string") {
    errors.push("viewState.searchQuery must be a string.");
  }

  if (
    viewState.currentCard !== undefined &&
    (!Number.isInteger(viewState.currentCard) || viewState.currentCard < 0)
  ) {
    errors.push("viewState.currentCard must be a non-negative integer.");
  }

  if (viewState.diagramSelections !== undefined) {
    if (!viewState.diagramSelections || typeof viewState.diagramSelections !== "object" || Array.isArray(viewState.diagramSelections)) {
      errors.push("viewState.diagramSelections must be an object.");
      return;
    }

    const validTheoryIds = new Set(content.theory.map((item) => item.id));
    const hasInvalidSelection = Object.entries(viewState.diagramSelections).some(([id, index]) => (
      typeof id !== "string" ||
      !validTheoryIds.has(id) ||
      !Number.isInteger(Number(index)) ||
      Number(index) < 0
    ));

    if (hasInvalidSelection) {
      errors.push("viewState.diagramSelections must map valid theory ids to non-negative indexes.");
    }
  }
}

function validateExamSettings(examSettings, errors) {
  if (!examSettings || typeof examSettings !== "object" || Array.isArray(examSettings)) {
    errors.push("examSettings must be an object.");
    return;
  }

  const duration = Number(examSettings.durationMinutes);
  if (!Number.isFinite(duration) || !EXAM_DURATION_OPTIONS.includes(duration)) {
    errors.push(`examSettings.durationMinutes must be one of: ${EXAM_DURATION_OPTIONS.join(", ")}.`);
  }

  const questionCount = Number(examSettings.questionCount);
  if (!Number.isFinite(questionCount) || !EXAM_QUESTION_COUNT_OPTIONS.includes(questionCount)) {
    errors.push(`examSettings.questionCount must be one of: ${EXAM_QUESTION_COUNT_OPTIONS.join(", ")}.`);
  }
}

function validateDuplicateIds(items, language, collectionName, baseItems, errors) {
  const ids = items.map((item) => item?.id).filter((id) => typeof id === "string");
  const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
  const baseIds = new Set(baseItems.map((item) => item.id));
  const collisions = ids.filter((id) => baseIds.has(id));

  if (duplicates.length) {
    errors.push(`${language}.${collectionName} contains duplicate ids: ${[...new Set(duplicates)].join(", ")}.`);
  }

  if (collisions.length) {
    errors.push(`${language}.${collectionName} collides with base ids: ${[...new Set(collisions)].join(", ")}.`);
  }
}

function validateTopic(value, label, topicLabels, errors) {
  if (typeof value !== "string" || !topicLabels[value]) {
    errors.push(`${label} must reference a known topic.`);
  }
}

function validateRequiredString(value, label, errors) {
  if (typeof value !== "string" || !value.trim()) {
    errors.push(`${label} must be a non-empty string.`);
    return;
  }

  if (containsHtmlMarkup(value)) {
    errors.push(`${label} must not contain HTML tags.`);
  }
}

function validateOptionalString(value, label, errors) {
  if (value === undefined) {
    return;
  }

  if (typeof value !== "string" || !value.trim()) {
    errors.push(`${label} must be a non-empty string when provided.`);
    return;
  }

  if (containsHtmlMarkup(value)) {
    errors.push(`${label} must not contain HTML tags.`);
  }
}

function validateRequiredNumber(value, label, errors, options = {}) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    errors.push(`${label} must be a finite number.`);
    return;
  }

  if (options.min !== undefined && numeric < options.min) {
    errors.push(`${label} must be >= ${options.min}.`);
  }
}

function assertArray(value, label, errors) {
  if (value !== undefined && !Array.isArray(value)) {
    errors.push(`${label} must be an array.`);
  }
}

function assertObject(value, label, errors) {
  if (value !== undefined && (!value || typeof value !== "object" || Array.isArray(value))) {
    errors.push(`${label} must be an object.`);
  }
}

function assertNonNegativeIntegerArrayMembers(value, label, errors) {
  if (!Array.isArray(value)) {
    return;
  }

  if (value.some((item) => !Number.isInteger(Number(item)) || Number(item) < 0)) {
    errors.push(`${label} must contain non-negative integers.`);
  }
}

function assertStringArrayMembers(value, label, errors) {
  if (!Array.isArray(value)) {
    return;
  }

  if (value.some((item) => typeof item !== "string" || !item.trim())) {
    errors.push(`${label} must contain non-empty strings.`);
  }
}

function assertPracticeAnswers(value, errors) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return;
  }

  const hasInvalidEntry = Object.entries(value).some(([id, answer]) => (
    typeof id !== "string" ||
    !id ||
    !(
      typeof answer === "string" ||
      (typeof answer === "number" && Number.isFinite(answer))
    )
  ));

  if (hasInvalidEntry) {
    errors.push("progress.practiceAnswers must map ids to string/number values.");
  }
}

function assertQuizAnswers(value, errors) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return;
  }

  const hasInvalidEntry = Object.entries(value).some(([id, answer]) => (
    typeof id !== "string" ||
    !id ||
    !Number.isInteger(Number(answer)) ||
    Number(answer) < 0 ||
    Number(answer) > 3
  ));

  if (hasInvalidEntry) {
    errors.push("progress.quizAnswers must map ids to answer indexes 0-3.");
  }
}

function containsHtmlMarkup(value) {
  return /<[^>]*>/.test(value);
}

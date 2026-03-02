import { normalizeMap } from "./utils.js";

export function getInitialUrlState(urlString, contentPack, storedLanguage, sectionIds) {
  const url = new URL(urlString);
  const params = url.searchParams;
  const lang = contentPack[params.get("lang")] ? params.get("lang") : (contentPack[storedLanguage] ? storedLanguage : "uk");
  const current = contentPack[lang];
  const rawTopic = params.get("topic");
  const activeTopic = rawTopic === "all" || current.topicLabels[rawTopic] ? rawTopic || "all" : "all";
  const hash = url.hash.replace("#", "").trim().toLowerCase();

  return {
    lang,
    activeTopic,
    searchQuery: params.get("q") || "",
    section: sectionIds.includes(hash) ? hash : "overview"
  };
}

export function resolveInitialViewState(urlString, storedViewState, contentPack, storedLanguage, sectionIds) {
  const url = new URL(urlString);
  const urlState = getInitialUrlState(urlString, contentPack, storedLanguage, sectionIds);
  const current = contentPack[urlState.lang];
  const stored = normalizeViewStateSnapshot(storedViewState, current, sectionIds);
  const hashSection = url.hash.replace("#", "").trim().toLowerCase();
  const hasSectionHash = sectionIds.includes(hashSection);

  return {
    lang: urlState.lang,
    activeSection: hasSectionHash ? urlState.section : stored.activeSection,
    activeTopic: url.searchParams.has("topic") ? urlState.activeTopic : stored.activeTopic,
    searchQuery: url.searchParams.has("q") ? urlState.searchQuery : stored.searchQuery,
    currentCard: stored.currentCard,
    diagramSelections: stored.diagramSelections
  };
}

export function buildStateUrl(urlString, state) {
  const url = new URL(urlString);

  url.searchParams.set("lang", state.lang);

  if (state.activeTopic !== "all") {
    url.searchParams.set("topic", state.activeTopic);
  } else {
    url.searchParams.delete("topic");
  }

  if (state.searchQuery.trim()) {
    url.searchParams.set("q", state.searchQuery.trim());
  } else {
    url.searchParams.delete("q");
  }

  url.hash = `#${state.activeSection}`;
  return `${url.pathname}${url.search}${url.hash}`;
}

export function buildViewStateSnapshot(state) {
  return {
    activeSection: state.activeSection,
    activeTopic: state.activeTopic,
    searchQuery: state.searchQuery,
    currentCard: state.currentCard,
    diagramSelections: state.diagramSelections
  };
}

export function normalizeViewStateSnapshot(value, content, sectionIds) {
  const source = value && typeof value === "object" && !Array.isArray(value) ? value : {};
  const diagramSelections = normalizeMap(source.diagramSelections ?? {});
  const validTheoryIds = new Set(Array.isArray(content?.theory) ? content.theory.map((card) => card.id) : []);

  return {
    activeSection: sectionIds.includes(source.activeSection) ? source.activeSection : "overview",
    activeTopic: source.activeTopic === "all" || content.topicLabels[source.activeTopic] ? source.activeTopic || "all" : "all",
    searchQuery: typeof source.searchQuery === "string" ? source.searchQuery : "",
    currentCard: Number.isInteger(source.currentCard) && source.currentCard >= 0 ? source.currentCard : 0,
    diagramSelections: Object.fromEntries(
      Object.entries(diagramSelections).filter(([cardId, index]) => (
        typeof cardId === "string" &&
        validTheoryIds.has(cardId) &&
        Number.isInteger(Number(index)) &&
        Number(index) >= 0
      )).map(([cardId, index]) => [cardId, Number(index)])
    )
  };
}

export function hydrateExamState(value, questions, createEmptyExamState, now = Date.now()) {
  const empty = createEmptyExamState();

  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return empty;
  }

  const validQuestionIds = readStringArray(value.questionIds ?? []).filter((id) => questions.some((question) => question.id === id));
  if (!validQuestionIds.length) {
    return empty;
  }

  const normalizedAnswers = Object.fromEntries(
    Object.entries(normalizeMap(value.answers ?? {})).filter(([id, optionIndex]) => (
      validQuestionIds.includes(id) &&
      Number.isInteger(Number(optionIndex)) &&
      Number(optionIndex) >= 0 &&
      Number(optionIndex) <= 3
    )).map(([id, optionIndex]) => [id, Number(optionIndex)])
  );

  if (value.status === "running") {
    return {
      ...empty,
      status: "running",
      questionIds: validQuestionIds,
      answers: normalizedAnswers,
      durationMinutes: Math.max(1, Number(value.durationMinutes) || 10),
      endAt: Number(value.endAt) || (now + 10 * 60 * 1000)
    };
  }

  if (value.status === "finished" && value.result && typeof value.result === "object") {
    return {
      ...empty,
      status: "finished",
      questionIds: validQuestionIds,
      result: {
        score: Number(value.result.score) || 0,
        total: Number(value.result.total) || validQuestionIds.length,
        timeout: Boolean(value.result.timeout),
        wrongQuestions: readStringArray(value.result.wrongQuestionIds ?? [])
          .map((id) => questions.find((question) => question.id === id))
          .filter(Boolean)
      }
    };
  }

  return empty;
}

export function serializeExamState(examState) {
  if (examState.status === "idle") {
    return null;
  }

  if (examState.status === "running") {
    return {
      status: "running",
      questionIds: examState.questionIds,
      answers: examState.answers,
      durationMinutes: examState.durationMinutes,
      endAt: examState.endAt
    };
  }

  return {
    status: "finished",
    questionIds: examState.questionIds,
    result: {
      score: examState.result?.score || 0,
      total: examState.result?.total || examState.questionIds.length,
      timeout: Boolean(examState.result?.timeout),
      wrongQuestionIds: (examState.result?.wrongQuestions || []).map((question) => question.id)
    }
  };
}

function readStringArray(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item) => typeof item === "string");
}

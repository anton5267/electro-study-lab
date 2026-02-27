import { matchesQuery, toPercent } from "./utils.js";

export function matchesActiveTopic(activeTopic, topic) {
  return activeTopic === "all" || activeTopic === topic;
}

export function getVisibleFlashcardIndexes(content, cardOrder, searchQuery, activeTopic) {
  return cardOrder.filter((index) => {
    const card = content.flashcards[index];
    return matchesQuery([
      card.term,
      card.def,
      content.topicLabels[card.topic] || card.topic
    ], searchQuery) && matchesActiveTopic(activeTopic, card.topic);
  });
}

export function getActiveQuizQuestions(content, quizMode, quizVariantIds, reviewQueue, activeTopic) {
  const topicFiltered = (items) => items.filter((question) => matchesActiveTopic(activeTopic, question.topic));

  if (quizMode === "review") {
    return topicFiltered(content.quizData.filter((question) => reviewQueue.has(question.id)));
  }

  if (quizMode === "variant" && quizVariantIds.length) {
    return topicFiltered(quizVariantIds
      .map((id) => content.quizData.find((question) => question.id === id))
      .filter(Boolean));
  }

  return topicFiltered(content.quizData);
}

export function getQuizModeMessage(content, quizMode) {
  if (quizMode === "review") {
    return content.quiz.reviewMode;
  }

  if (quizMode === "variant") {
    return content.quiz.variantMode;
  }

  return content.quiz.defaultMode;
}

export function isQuizCompleted(questions, answers) {
  return questions.every((question) => answers[question.id] !== undefined);
}

export function getQuizScore(questions, answers) {
  return questions.reduce((sum, question) => {
    return sum + (Number(answers[question.id]) === question.correct ? 1 : 0);
  }, 0);
}

export function getQuizSessionLabel(quizMode) {
  if (quizMode === "review") {
    return "review";
  }

  if (quizMode === "variant") {
    return "variant";
  }

  return "full";
}

export function formatHistoryLabel(item, content) {
  if (item.type === "exam") {
    return item.label;
  }

  if (item.label === "review") {
    return content.quiz.reviewMode;
  }

  if (item.label === "variant") {
    return content.quiz.variantMode;
  }

  return content.quiz.defaultMode;
}

export function getSearchResults(content, query, activeTopic) {
  if (!query) {
    return [];
  }

  const theoryResults = content.theory
    .filter((card) => matchesQuery([card.title, card.lead, ...(card.intro || [])], query) && matchesActiveTopic(activeTopic, card.topic))
    .map((card) => ({
      type: "theory",
      section: "theory",
      title: card.title,
      preview: card.lead,
      topic: card.topic
    }));

  const flashcardResults = content.flashcards
    .filter((card) => matchesQuery([card.term, card.def], query) && matchesActiveTopic(activeTopic, card.topic))
    .map((card) => ({
      type: "flashcards",
      section: "flashcards",
      title: card.term,
      preview: card.def,
      topic: card.topic
    }));

  const practiceResults = content.practiceProblems
    .filter((problem) => matchesQuery([problem.prompt, problem.explanation], query) && matchesActiveTopic(activeTopic, problem.topic))
    .map((problem) => ({
      type: "practice",
      section: "practice",
      title: problem.prompt,
      preview: problem.explanation,
      topic: problem.topic
    }));

  const quizResults = content.quizData
    .filter((question) => matchesQuery([question.q, question.explanation], query) && matchesActiveTopic(activeTopic, question.topic))
    .map((question) => ({
      type: "quiz",
      section: "quiz",
      title: question.q,
      preview: question.explanation,
      topic: question.topic
    }));

  const checklistResults = activeTopic === "all"
    ? content.checklistItems
      .filter((item) => matchesQuery([item], query))
      .map((item) => ({
        type: "checklist",
        section: "checklist",
        title: item,
        preview: item,
        topic: ""
      }))
    : [];

  return [...theoryResults, ...flashcardResults, ...practiceResults, ...quizResults, ...checklistResults].slice(0, 12);
}

export function getReviewItems(content, reviewQueue, activeTopic) {
  return content.quizData.filter((question) => reviewQueue.has(question.id) && matchesActiveTopic(activeTopic, question.topic));
}

export function getNextRecommendedStep(content, snapshot) {
  if (
    snapshot.seenCards.size === 0 &&
    snapshot.practiceSolved.size === 0 &&
    snapshot.stats.quizRuns === 0 &&
    snapshot.checked.size === 0
  ) {
    return {
      section: "theory",
      title: content.sections.theory.title,
      copy: content.sections.theory.lead
    };
  }

  if (snapshot.reviewQueue.size) {
    return {
      section: "quiz",
      title: content.reviewNow,
      copy: content.quiz.reviewMode
    };
  }

  if (snapshot.seenCards.size < content.flashcards.length) {
    return {
      section: "flashcards",
      title: content.sections.flashcards.title,
      copy: content.sections.flashcards.lead
    };
  }

  if (snapshot.practiceSolved.size < content.practiceProblems.length) {
    return {
      section: "practice",
      title: content.sections.practice.title,
      copy: content.sections.practice.lead
    };
  }

  if (snapshot.quizMastered.size < content.quizData.length) {
    return {
      section: "quiz",
      title: content.sections.quiz.title,
      copy: content.sections.quiz.lead
    };
  }

  if (snapshot.checked.size < content.checklistItems.length) {
    return {
      section: "checklist",
      title: content.sections.checklist.title,
      copy: content.sections.checklist.lead
    };
  }

  return {
    section: "exam",
    title: content.sections.exam.title,
    copy: content.sections.exam.lead
  };
}

export function getTopicMastery(content, seenCards, practiceSolved, quizMastered) {
  return Object.keys(content.topicLabels).map((topic) => {
    const flashcards = content.flashcards.filter((item) => item.topic === topic);
    const practice = content.practiceProblems.filter((item) => item.topic === topic);
    const quiz = content.quizData.filter((item) => item.topic === topic);
    const total = flashcards.length + practice.length + quiz.length;
    const done =
      flashcards.filter((item) => seenCards.has(content.flashcards.indexOf(item))).length +
      practice.filter((item) => practiceSolved.has(item.id)).length +
      quiz.filter((item) => quizMastered.has(item.id)).length;

    return {
      topic,
      total,
      done,
      percent: toPercent(done, total || 1)
    };
  });
}

export function getLastExamPercent(stats) {
  const history = Array.isArray(stats.history) ? stats.history : [];
  const examEntry = history.find((entry) => entry.type === "exam");
  return examEntry ? Number(examEntry.percent) : 0;
}

export function getCustomPackSummary(customPack, lang) {
  if (!customPack || typeof customPack !== "object") {
    return "";
  }

  const languagePack = customPack[lang];
  if (!languagePack) {
    return "";
  }

  const counts = [
    Array.isArray(languagePack.theory) ? languagePack.theory.length : 0,
    Array.isArray(languagePack.flashcards) ? languagePack.flashcards.length : 0,
    Array.isArray(languagePack.practiceProblems) ? languagePack.practiceProblems.length : 0,
    Array.isArray(languagePack.quizData) ? languagePack.quizData.length : 0
  ];

  const total = counts.reduce((sum, value) => sum + value, 0);
  return total ? `+${total}` : "";
}

export function getAchievementProgress(achievementId, snapshot, content) {
  switch (achievementId) {
    case "firstQuiz":
      return { done: Math.min(snapshot.stats.quizRuns, 1), total: 1 };
    case "firstExam":
      return { done: Math.min(snapshot.stats.examRuns, 1), total: 1 };
    case "fullChecklist":
      return { done: snapshot.checked.size, total: content.checklistItems.length };
    case "fullFlashcards":
      return { done: snapshot.seenCards.size, total: content.flashcards.length };
    case "fullPractice":
      return { done: snapshot.practiceSolved.size, total: content.practiceProblems.length };
    default:
      return { done: 0, total: 0 };
  }
}

export function isAchievementUnlocked(achievementId, snapshot, content) {
  const progress = getAchievementProgress(achievementId, snapshot, content);
  return progress.total > 0 && progress.done >= progress.total;
}

export function hasStudyProgress(snapshot) {
  return Boolean(
    snapshot.checked.size ||
    snapshot.seenCards.size ||
    snapshot.practiceSolved.size ||
    snapshot.quizMastered.size ||
    snapshot.reviewQueue.size ||
    snapshot.stats.quizRuns ||
    snapshot.stats.examRuns ||
    snapshot.stats.history.length
  );
}

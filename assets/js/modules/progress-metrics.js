import { average, toPercent } from "./utils.js";

export function buildProgressMetrics(content, snapshot) {
  const checklistTotal = Array.isArray(content?.checklistItems) ? content.checklistItems.length : 0;
  const flashcardsTotal = Array.isArray(content?.flashcards) ? content.flashcards.length : 0;
  const practiceTotal = Array.isArray(content?.practiceProblems) ? content.practiceProblems.length : 0;
  const quizTotal = Array.isArray(content?.quizData) ? content.quizData.length : 0;

  const checklistDone = toCount(snapshot.checked);
  const flashcardsDone = toCount(snapshot.seenCards);
  const practiceDone = toCount(snapshot.practiceSolved);
  const quizDone = toCount(snapshot.quizMastered);
  const lastExamPercent = Number(snapshot.lastExamPercent) || 0;

  const total = checklistTotal + flashcardsTotal + practiceTotal + quizTotal + 1;
  const done = checklistDone + flashcardsDone + practiceDone + quizDone + (lastExamPercent > 0 ? 1 : 0);
  const completion = toPercent(done, total);

  const accuracyValues = [Number(snapshot.averageQuizScore) || 0, Number(snapshot.averageExamScore) || 0].filter((value) => value > 0);
  const accuracyPercent = accuracyValues.length ? Math.round(average(accuracyValues)) : null;

  return {
    total,
    done,
    completion,
    checklist: {
      done: checklistDone,
      total: checklistTotal
    },
    flashcards: {
      done: flashcardsDone,
      total: flashcardsTotal
    },
    practice: {
      done: practiceDone,
      total: practiceTotal
    },
    quiz: {
      done: quizDone,
      total: quizTotal
    },
    lastExamPercent,
    accuracyPercent
  };
}

function toCount(value) {
  if (value instanceof Set) {
    return value.size;
  }

  if (Array.isArray(value)) {
    return value.length;
  }

  return Number(value) || 0;
}

import assert from "node:assert/strict";

import {
  dedupeViewIds,
  getAppBootViewPlan,
  getProgressDependentViewPlan,
  getSearchDependentViewPlan,
  getTopicDependentViewPlan
} from "../assets/js/modules/view-plan.js";

{
  const plan = getAppBootViewPlan();
  assert.equal(plan.resetFlashcards, true);
  assert.deepEqual(plan.viewIds.slice(0, 3), ["static", "overview", "theory"]);
  assert(plan.viewIds.includes("progress"));
}

{
  const plan = getSearchDependentViewPlan();
  assert.equal(plan.resetFlashcards, true);
  assert.deepEqual(plan.viewIds, ["overview", "theory", "flashcards", "practice", "checklist"]);
}

{
  const plan = getTopicDependentViewPlan();
  assert.equal(plan.resetFlashcards, true);
  assert.deepEqual(plan.viewIds, ["topicFilters", "overview", "theory", "flashcards", "practice", "quiz", "checklist", "analytics"]);
}

{
  const withAnalytics = getProgressDependentViewPlan(true);
  const withoutAnalytics = getProgressDependentViewPlan(false);
  assert.deepEqual(withAnalytics.viewIds, ["progress", "overview", "analytics"]);
  assert.deepEqual(withoutAnalytics.viewIds, ["progress", "overview"]);
  assert.equal(withAnalytics.resetFlashcards, false);
}

{
  assert.deepEqual(dedupeViewIds(["overview", "overview", "quiz"]), ["overview", "quiz"]);
  assert.deepEqual(dedupeViewIds([]), []);
  assert.deepEqual(dedupeViewIds(null), []);
}

console.log("View plan tests passed.");

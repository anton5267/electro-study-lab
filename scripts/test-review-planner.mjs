import assert from "node:assert/strict";

import {
  buildAdaptiveReviewTopicCandidates,
  resolveAdaptiveReviewCandidate,
  resolveAdaptiveReviewTopic
} from "../assets/js/modules/review-planner.js";

const content = {
  quizData: [
    { id: "qq-1", topic: "safety" },
    { id: "qq-2", topic: "switching" },
    { id: "qq-3", topic: "switching" },
    { id: "qq-4", topic: "measurement" }
  ]
};

{
  const topic = resolveAdaptiveReviewTopic(content, new Set(), []);
  assert.equal(topic, "all");
}

{
  const topic = resolveAdaptiveReviewTopic(
    content,
    new Set(["qq-1", "qq-2", "qq-3"]),
    [
      { topic: "safety", percent: 10 },
      { topic: "switching", percent: 40 }
    ]
  );

  assert.equal(topic, "switching");
}

{
  const topic = resolveAdaptiveReviewTopic(
    content,
    new Set(["qq-1", "qq-4"]),
    [
      { topic: "safety", percent: 80 },
      { topic: "measurement", percent: 20 }
    ]
  );

  assert.equal(topic, "measurement");
}

{
  const topic = resolveAdaptiveReviewTopic(
    {
      quizData: [
        { id: "qa", topic: "z-topic" },
        { id: "qb", topic: "a-topic" }
      ]
    },
    new Set(["qa", "qb"]),
    [
      { topic: "z-topic", percent: 35 },
      { topic: "a-topic", percent: 35 }
    ]
  );

  assert.equal(topic, "a-topic");
}

{
  assert.deepEqual(
    buildAdaptiveReviewTopicCandidates("switching", "safety", "all"),
    ["switching", "safety", "all"]
  );

  assert.deepEqual(
    buildAdaptiveReviewTopicCandidates("all", "all", "all"),
    ["all"]
  );

  assert.deepEqual(
    buildAdaptiveReviewTopicCandidates("", null, "all"),
    ["all"]
  );
}

{
  const calls = [];
  const selected = resolveAdaptiveReviewCandidate(
    "switching",
    "safety",
    (topic) => {
      calls.push(topic);
      return topic === "safety" ? { quizMode: "review", quizVariantIds: ["qq-2"] } : null;
    },
    "all"
  );

  assert.deepEqual(calls, ["switching", "safety"]);
  assert.deepEqual(selected, {
    topic: "safety",
    candidate: { quizMode: "review", quizVariantIds: ["qq-2"] }
  });
}

{
  const calls = [];
  const selected = resolveAdaptiveReviewCandidate(
    "all",
    "all",
    (topic) => {
      calls.push(topic);
      return { quizMode: "review", quizVariantIds: [] };
    },
    "all"
  );

  assert.deepEqual(calls, ["all"]);
  assert.deepEqual(selected, {
    topic: "all",
    candidate: { quizMode: "review", quizVariantIds: [] }
  });
}

{
  const selected = resolveAdaptiveReviewCandidate("switching", "safety", null, "all");
  assert.equal(selected, null);
}

console.log("Review planner tests passed.");

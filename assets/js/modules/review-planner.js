export function resolveAdaptiveReviewTopic(content, reviewQueue, topicMastery, fallbackTopic = "all") {
  if (!(reviewQueue instanceof Set) || !reviewQueue.size) {
    return fallbackTopic;
  }

  const questions = Array.isArray(content?.quizData) ? content.quizData : [];
  const pendingByTopic = questions.reduce((accumulator, question) => {
    if (!reviewQueue.has(question.id)) {
      return accumulator;
    }

    if (typeof question.topic !== "string" || !question.topic) {
      return accumulator;
    }

    accumulator[question.topic] = (accumulator[question.topic] || 0) + 1;
    return accumulator;
  }, {});

  const masteryByTopic = new Map(
    Array.isArray(topicMastery)
      ? topicMastery
        .filter((item) => item && typeof item.topic === "string")
        .map((item) => [item.topic, Number(item.percent) || 0])
      : []
  );

  const rankedTopics = Object.entries(pendingByTopic)
    .map(([topic, pending]) => ({
      topic,
      pending,
      percent: masteryByTopic.get(topic) ?? 0
    }))
    .sort((left, right) => right.pending - left.pending || left.percent - right.percent || left.topic.localeCompare(right.topic));

  return rankedTopics[0]?.topic || fallbackTopic;
}

export function buildAdaptiveReviewTopicCandidates(activeTopic, adaptiveTopic, fallbackTopic = "all") {
  const ordered = [activeTopic, adaptiveTopic, fallbackTopic];
  const unique = [];

  ordered.forEach((topic) => {
    if (typeof topic !== "string" || !topic || unique.includes(topic)) {
      return;
    }

    unique.push(topic);
  });

  return unique.length ? unique : [fallbackTopic];
}

export function resolveAdaptiveReviewCandidate(activeTopic, adaptiveTopic, createCandidate, fallbackTopic = "all") {
  if (typeof createCandidate !== "function") {
    return null;
  }

  const topics = buildAdaptiveReviewTopicCandidates(activeTopic, adaptiveTopic, fallbackTopic);

  for (const topic of topics) {
    const candidate = createCandidate(topic);
    if (candidate) {
      return { topic, candidate };
    }
  }

  return null;
}

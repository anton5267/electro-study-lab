export const TOPIC_ACTIONS = Object.freeze({
  NONE: "none",
  SELECT_TOPIC: "select-topic"
});

function normalizeTopic(value, allowedTopics) {
  if (typeof value !== "string" || !value) {
    return null;
  }

  if (Array.isArray(allowedTopics) && allowedTopics.length && !allowedTopics.includes(value)) {
    return null;
  }

  return value;
}

export function resolveTopicFilterAction(target, allowedTopics) {
  if (!target || typeof target.closest !== "function") {
    return { type: TOPIC_ACTIONS.NONE };
  }

  const button = target.closest("[data-topic-filter]");
  if (!button) {
    return { type: TOPIC_ACTIONS.NONE };
  }

  const topic = normalizeTopic(button.dataset.topicFilter, allowedTopics);
  if (!topic) {
    return { type: TOPIC_ACTIONS.NONE };
  }

  return {
    type: TOPIC_ACTIONS.SELECT_TOPIC,
    topic
  };
}

import assert from "node:assert/strict";

import {
  TOPIC_ACTIONS,
  resolveTopicFilterAction
} from "../assets/js/modules/topic-control.js";

{
  const action = resolveTopicFilterAction({
    closest(selector) {
      if (selector === "[data-topic-filter]") {
        return {
          dataset: {
            topicFilter: "switching"
          }
        };
      }

      return null;
    }
  }, ["all", "switching", "safety"]);

  assert.deepEqual(action, {
    type: TOPIC_ACTIONS.SELECT_TOPIC,
    topic: "switching"
  });
}

{
  const action = resolveTopicFilterAction({
    closest() {
      return {
        dataset: {
          topicFilter: "measurement"
        }
      };
    }
  }, ["all", "switching", "safety"]);

  assert.deepEqual(action, {
    type: TOPIC_ACTIONS.NONE
  });
}

{
  const action = resolveTopicFilterAction({
    closest() {
      return null;
    }
  }, ["all"]);

  assert.deepEqual(action, {
    type: TOPIC_ACTIONS.NONE
  });
}

console.log("Topic control tests passed.");

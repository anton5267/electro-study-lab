import assert from "node:assert/strict";

import {
  LANGUAGE_ACTIONS,
  resolveLanguageClickAction
} from "../assets/js/modules/language-control.js";

{
  const action = resolveLanguageClickAction({
    closest(selector) {
      if (selector === ".lang-btn") {
        return {
          dataset: {
            lang: "de"
          }
        };
      }

      return null;
    }
  }, ["uk", "de"]);

  assert.deepEqual(action, {
    type: LANGUAGE_ACTIONS.SET_LANGUAGE,
    language: "de"
  });
}

{
  const action = resolveLanguageClickAction({
    closest(selector) {
      if (selector === ".lang-btn") {
        return {
          dataset: {
            lang: "fr"
          }
        };
      }

      return null;
    }
  }, ["uk", "de"]);

  assert.deepEqual(action, {
    type: LANGUAGE_ACTIONS.NONE
  });
}

{
  const action = resolveLanguageClickAction({
    closest() {
      return null;
    }
  }, ["uk", "de"]);

  assert.deepEqual(action, {
    type: LANGUAGE_ACTIONS.NONE
  });
}

console.log("Language control tests passed.");

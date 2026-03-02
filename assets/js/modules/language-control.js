export const LANGUAGE_ACTIONS = Object.freeze({
  NONE: "none",
  SET_LANGUAGE: "set-language"
});

function normalizeLanguage(value, availableLanguages) {
  if (typeof value !== "string" || !value) {
    return null;
  }

  if (Array.isArray(availableLanguages) && availableLanguages.length && !availableLanguages.includes(value)) {
    return null;
  }

  return value;
}

export function resolveLanguageClickAction(target, availableLanguages) {
  if (!target || typeof target.closest !== "function") {
    return { type: LANGUAGE_ACTIONS.NONE };
  }

  const button = target.closest(".lang-btn");
  if (!button) {
    return { type: LANGUAGE_ACTIONS.NONE };
  }

  const language = normalizeLanguage(button.dataset.lang, availableLanguages);
  if (!language) {
    return { type: LANGUAGE_ACTIONS.NONE };
  }

  return {
    type: LANGUAGE_ACTIONS.SET_LANGUAGE,
    language
  };
}

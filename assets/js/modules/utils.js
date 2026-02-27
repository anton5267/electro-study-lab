export function format(template, values = {}) {
  return String(template).replace(/\{(\w+)\}/g, (_, key) => values[key] ?? "");
}

export function createSequence(length) {
  return Array.from({ length }, (_, index) => index);
}

export function shuffleArray(items) {
  const copy = [...items];

  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }

  return copy;
}

export function average(values) {
  if (!values.length) {
    return 0;
  }

  const total = values.reduce((sum, value) => sum + Number(value || 0), 0);
  return total / values.length;
}

export function debounce(fn, delay = 150) {
  let timeoutId;

  return (...args) => {
    window.clearTimeout(timeoutId);
    timeoutId = window.setTimeout(() => fn(...args), delay);
  };
}

export function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export function normalizeNumberArray(value, maxLength) {
  if (!Array.isArray(value)) {
    return [];
  }

  return [...new Set(value)]
    .map((item) => Number(item))
    .filter((item) => Number.isInteger(item) && item >= 0 && item < maxLength);
}

export function normalizeMap(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return { ...value };
}

export function normalizeChoiceAnswers(value, maxLength, optionsPerQuestion = 4) {
  const source = normalizeMap(value);

  return Object.entries(source).reduce((accumulator, [questionIndex, optionIndex]) => {
    const normalizedQuestion = Number(questionIndex);
    const normalizedOption = Number(optionIndex);

    if (
      Number.isInteger(normalizedQuestion) &&
      normalizedQuestion >= 0 &&
      normalizedQuestion < maxLength &&
      Number.isInteger(normalizedOption) &&
      normalizedOption >= 0 &&
      normalizedOption < optionsPerQuestion
    ) {
      accumulator[normalizedQuestion] = normalizedOption;
    }

    return accumulator;
  }, {});
}

export function normalizeCardOrder(value, maxLength) {
  const normalized = normalizeNumberArray(value, maxLength);
  return normalized.length === maxLength ? normalized : createSequence(maxLength);
}

export function isTypingTarget(target) {
  if (!target) {
    return false;
  }

  return (
    target.tagName === "INPUT" ||
    target.tagName === "TEXTAREA" ||
    target.tagName === "SELECT" ||
    target.isContentEditable
  );
}

export function normalizeText(value) {
  return String(value || "").trim().toLowerCase();
}

export function matchesQuery(parts, query) {
  const normalizedQuery = normalizeText(query);
  if (!normalizedQuery) {
    return true;
  }

  return parts.some((part) => normalizeText(part).includes(normalizedQuery));
}

export function toPercent(value, total) {
  if (!total) {
    return 0;
  }

  return Math.round((value / total) * 100);
}

export function formatDate(value, language) {
  try {
    return new Intl.DateTimeFormat(language === "de" ? "de-DE" : "uk-UA", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit"
    }).format(new Date(value));
  } catch (error) {
    return "";
  }
}

export function safeNumber(value) {
  const numeric = Number(String(value).replace(",", "."));
  return Number.isFinite(numeric) ? numeric : null;
}

export function withinTolerance(value, expected, tolerance = 0) {
  return Math.abs(value - expected) <= tolerance;
}

import { BASE_CONTENT } from "../assets/js/modules/content.js";

const ID_COLLECTIONS = ["theory", "flashcards", "practiceProblems", "quizData"];
const ARRAY_COLLECTIONS = [...ID_COLLECTIONS, "checklistItems"];

const DEFAULT_THRESHOLDS = {
  topics: 3,
  theory: 6,
  flashcards: 12,
  practiceProblems: 8,
  quizData: 16,
  checklistItems: 12
};

const DEFAULT_TOPIC_MINIMUMS = {
  theory: 1,
  flashcards: 1,
  practiceProblems: 1,
  quizData: 1
};
const DEFAULT_COMPLEXITY_MINIMUMS = {
  quizMedium: 0,
  quizLong: 0,
  practiceStrict: 0,
  practiceRelaxed: 0
};

const args = parseArgs(process.argv.slice(2));
const thresholds = resolveThresholds(args);
const topicMinimums = resolveTopicMinimums(args);
const complexityMinimums = resolveComplexityMinimums(args);

const languages = Object.keys(BASE_CONTENT);
const metrics = Object.fromEntries(languages.map((lang) => [lang, buildLanguageMetrics(BASE_CONTENT[lang])]));
const issues = validateParity(BASE_CONTENT, languages);

if (args.enforce) {
  for (const language of languages) {
    const metric = metrics[language];
    issues.push(...validateThresholds(language, metric, thresholds));
    issues.push(...validateTopicCoverage(language, metric, topicMinimums));
    issues.push(...validateComplexityCoverage(language, metric, complexityMinimums));
  }
}

if (args.json) {
  console.log(JSON.stringify({
    options: {
      enforce: args.enforce,
      thresholds,
      topicMinimums,
      complexityMinimums
    },
    metrics
  }, null, 2));
} else {
  printReport(metrics, thresholds, topicMinimums, complexityMinimums, args.enforce);

  if (issues.length) {
    console.log("");
    console.log("Content workbench found issues:");
    issues.forEach((issue) => console.log(`- ${issue}`));
  } else {
    console.log("");
    console.log("Content workbench passed.");
  }
}

if (issues.length) {
  process.exitCode = 1;
}

function parseArgs(rawArgs) {
  const options = {
    enforce: false,
    json: false,
    values: {}
  };

  rawArgs.forEach((arg) => {
    if (arg === "--enforce") {
      options.enforce = true;
      return;
    }

    if (arg === "--json") {
      options.json = true;
      return;
    }

    if (arg.startsWith("--") && arg.includes("=")) {
      const [key, value] = arg.slice(2).split("=");
      options.values[key] = value;
    }
  });

  return options;
}

function readIntegerOption(argsOptions, argName, envName, fallback) {
  const argValue = argsOptions.values[argName];
  const envValue = process.env[envName];
  const candidate = argValue ?? envValue;

  if (candidate === undefined || candidate === "") {
    return fallback;
  }

  const parsed = Number(candidate);
  if (!Number.isInteger(parsed) || parsed < 0) {
    throw new Error(`Invalid numeric value for ${argName}/${envName}: "${candidate}"`);
  }

  return parsed;
}

function resolveThresholds(argsOptions) {
  return {
    topics: readIntegerOption(argsOptions, "min-topics", "CONTENT_MIN_TOPICS", DEFAULT_THRESHOLDS.topics),
    theory: readIntegerOption(argsOptions, "min-theory", "CONTENT_MIN_THEORY", DEFAULT_THRESHOLDS.theory),
    flashcards: readIntegerOption(argsOptions, "min-flashcards", "CONTENT_MIN_FLASHCARDS", DEFAULT_THRESHOLDS.flashcards),
    practiceProblems: readIntegerOption(argsOptions, "min-practice", "CONTENT_MIN_PRACTICE", DEFAULT_THRESHOLDS.practiceProblems),
    quizData: readIntegerOption(argsOptions, "min-quiz", "CONTENT_MIN_QUIZ", DEFAULT_THRESHOLDS.quizData),
    checklistItems: readIntegerOption(argsOptions, "min-checklist", "CONTENT_MIN_CHECKLIST", DEFAULT_THRESHOLDS.checklistItems)
  };
}

function resolveTopicMinimums(argsOptions) {
  return {
    theory: readIntegerOption(argsOptions, "min-topic-theory", "CONTENT_MIN_TOPIC_THEORY", DEFAULT_TOPIC_MINIMUMS.theory),
    flashcards: readIntegerOption(argsOptions, "min-topic-flashcards", "CONTENT_MIN_TOPIC_FLASHCARDS", DEFAULT_TOPIC_MINIMUMS.flashcards),
    practiceProblems: readIntegerOption(argsOptions, "min-topic-practice", "CONTENT_MIN_TOPIC_PRACTICE", DEFAULT_TOPIC_MINIMUMS.practiceProblems),
    quizData: readIntegerOption(argsOptions, "min-topic-quiz", "CONTENT_MIN_TOPIC_QUIZ", DEFAULT_TOPIC_MINIMUMS.quizData)
  };
}

function resolveComplexityMinimums(argsOptions) {
  return {
    quizMedium: readIntegerOption(
      argsOptions,
      "min-complexity-quiz-medium",
      "CONTENT_MIN_COMPLEXITY_QUIZ_MEDIUM",
      DEFAULT_COMPLEXITY_MINIMUMS.quizMedium
    ),
    quizLong: readIntegerOption(
      argsOptions,
      "min-complexity-quiz-long",
      "CONTENT_MIN_COMPLEXITY_QUIZ_LONG",
      DEFAULT_COMPLEXITY_MINIMUMS.quizLong
    ),
    practiceStrict: readIntegerOption(
      argsOptions,
      "min-complexity-practice-strict",
      "CONTENT_MIN_COMPLEXITY_PRACTICE_STRICT",
      DEFAULT_COMPLEXITY_MINIMUMS.practiceStrict
    ),
    practiceRelaxed: readIntegerOption(
      argsOptions,
      "min-complexity-practice-relaxed",
      "CONTENT_MIN_COMPLEXITY_PRACTICE_RELAXED",
      DEFAULT_COMPLEXITY_MINIMUMS.practiceRelaxed
    )
  };
}

function buildLanguageMetrics(content) {
  const topicKeys = Object.keys(content.topicLabels || {});
  const counts = {
    topics: topicKeys.length,
    theory: Array.isArray(content.theory) ? content.theory.length : 0,
    flashcards: Array.isArray(content.flashcards) ? content.flashcards.length : 0,
    practiceProblems: Array.isArray(content.practiceProblems) ? content.practiceProblems.length : 0,
    quizData: Array.isArray(content.quizData) ? content.quizData.length : 0,
    checklistItems: Array.isArray(content.checklistItems) ? content.checklistItems.length : 0
  };

  const byTopic = Object.fromEntries(topicKeys.map((topic) => [topic, {
    theory: 0,
    flashcards: 0,
    practiceProblems: 0,
    quizData: 0
  }]));
  const complexity = {
    quizMedium: 0,
    quizLong: 0,
    practiceStrict: 0,
    practiceRelaxed: 0
  };

  ID_COLLECTIONS.forEach((collectionName) => {
    (content[collectionName] || []).forEach((item) => {
      if (item && typeof item.topic === "string" && byTopic[item.topic]) {
        byTopic[item.topic][collectionName] += 1;
      }
    });
  });

  (content.quizData || []).forEach((item) => {
    const length = normalizeTextLength(item?.q);
    if (length >= 80) {
      complexity.quizLong += 1;
    } else if (length >= 40) {
      complexity.quizMedium += 1;
    }
  });

  (content.practiceProblems || []).forEach((item) => {
    const tolerance = Number(item?.tolerance);
    if (!Number.isFinite(tolerance)) {
      return;
    }

    if (tolerance <= 0.1) {
      complexity.practiceStrict += 1;
    } else {
      complexity.practiceRelaxed += 1;
    }
  });

  return {
    counts,
    byTopic,
    complexity
  };
}

function validateParity(contentPack, languages) {
  const issues = [];
  if (languages.length < 2) {
    return issues;
  }

  const [referenceLanguage, ...restLanguages] = languages;
  const reference = contentPack[referenceLanguage];
  const referenceTopics = Object.keys(reference.topicLabels || {}).sort().join("|");

  restLanguages.forEach((language) => {
    const candidate = contentPack[language];
    const candidateTopics = Object.keys(candidate.topicLabels || {}).sort().join("|");
    if (referenceTopics !== candidateTopics) {
      issues.push(`Topic keys mismatch: ${referenceLanguage} vs ${language}.`);
    }

    ARRAY_COLLECTIONS.forEach((collectionName) => {
      const refLength = Array.isArray(reference[collectionName]) ? reference[collectionName].length : 0;
      const candidateLength = Array.isArray(candidate[collectionName]) ? candidate[collectionName].length : 0;
      if (refLength !== candidateLength) {
        issues.push(`Length mismatch for ${collectionName}: ${referenceLanguage}=${refLength}, ${language}=${candidateLength}.`);
      }
    });

    ID_COLLECTIONS.forEach((collectionName) => {
      const referenceIds = (reference[collectionName] || []).map((item) => item.id).join("|");
      const candidateIds = (candidate[collectionName] || []).map((item) => item.id).join("|");
      if (referenceIds !== candidateIds) {
        issues.push(`ID sequence mismatch for ${collectionName}: ${referenceLanguage} vs ${language}.`);
      }
    });
  });

  return issues;
}

function validateThresholds(language, metric, thresholdValues) {
  const issues = [];
  const { counts } = metric;
  const map = {
    topics: "topics",
    theory: "theory",
    flashcards: "flashcards",
    practiceProblems: "practiceProblems",
    quizData: "quizData",
    checklistItems: "checklistItems"
  };

  Object.entries(map).forEach(([label, key]) => {
    if (counts[key] < thresholdValues[key]) {
      issues.push(`${language}: ${label}=${counts[key]} is below minimum ${thresholdValues[key]}.`);
    }
  });

  return issues;
}

function validateTopicCoverage(language, metric, topicMinimumValues) {
  const issues = [];
  const topics = Object.keys(metric.byTopic);

  topics.forEach((topic) => {
    const topicData = metric.byTopic[topic];
    Object.keys(topicMinimumValues).forEach((collectionName) => {
      const minimum = topicMinimumValues[collectionName];
      if (topicData[collectionName] < minimum) {
        issues.push(`${language}.${topic}: ${collectionName}=${topicData[collectionName]} is below topic minimum ${minimum}.`);
      }
    });
  });

  return issues;
}

function validateComplexityCoverage(language, metric, complexityMinimumValues) {
  const issues = [];
  const complexity = metric.complexity || {};

  Object.entries(complexityMinimumValues).forEach(([key, minimum]) => {
    const value = Number(complexity[key]) || 0;
    if (value < minimum) {
      issues.push(`${language}: complexity.${key}=${value} is below minimum ${minimum}.`);
    }
  });

  return issues;
}

function printReport(metricsByLanguage, thresholdValues, topicMinimumValues, complexityMinimumValues, enforceMode) {
  console.log(`Content workbench report (${enforceMode ? "enforce" : "report"} mode):`);
  console.log("");

  Object.entries(metricsByLanguage).forEach(([language, metric]) => {
    const { counts, byTopic, complexity } = metric;
    console.log(`[${language}] counts: topics=${counts.topics}, theory=${counts.theory}, flashcards=${counts.flashcards}, practice=${counts.practiceProblems}, quiz=${counts.quizData}, checklist=${counts.checklistItems}`);
    Object.entries(byTopic).forEach(([topic, values]) => {
      console.log(`  - ${topic}: theory=${values.theory}, flashcards=${values.flashcards}, practice=${values.practiceProblems}, quiz=${values.quizData}`);
    });
    console.log(`  - complexity: quizMedium=${complexity.quizMedium}, quizLong=${complexity.quizLong}, practiceStrict=${complexity.practiceStrict}, practiceRelaxed=${complexity.practiceRelaxed}`);
    console.log("");
  });

  console.log(`Global minimums: topics=${thresholdValues.topics}, theory=${thresholdValues.theory}, flashcards=${thresholdValues.flashcards}, practice=${thresholdValues.practiceProblems}, quiz=${thresholdValues.quizData}, checklist=${thresholdValues.checklistItems}`);
  console.log(`Per-topic minimums: theory=${topicMinimumValues.theory}, flashcards=${topicMinimumValues.flashcards}, practice=${topicMinimumValues.practiceProblems}, quiz=${topicMinimumValues.quizData}`);
  console.log(`Complexity minimums: quizMedium=${complexityMinimumValues.quizMedium}, quizLong=${complexityMinimumValues.quizLong}, practiceStrict=${complexityMinimumValues.practiceStrict}, practiceRelaxed=${complexityMinimumValues.practiceRelaxed}`);
}

function normalizeTextLength(value) {
  if (typeof value !== "string") {
    return 0;
  }

  return value.trim().length;
}

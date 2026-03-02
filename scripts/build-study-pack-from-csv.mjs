import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { BASE_CONTENT } from "../assets/js/modules/content.js";
import { validateCustomPack } from "../assets/js/modules/validation.js";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(scriptDir, "..");
const supportedLanguages = ["uk", "de"];

const CSV_SCHEMAS = {
  quiz: ["id", "topic", "q", "opt1", "opt2", "opt3", "opt4", "correct", "explanation"],
  practice: ["id", "topic", "prompt", "answer", "tolerance", "explanation"],
  flashcards: ["id", "topic", "term", "def"]
};

try {
  main();
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const inputDir = path.resolve(rootDir, args.input || "assets/data/csv-template");
  const outputPath = path.resolve(rootDir, args.output || "artifacts/generated-study-pack.json");
  const allowLanguageMismatch = toBoolean(args["allow-language-mismatch"], false);

  const pack = {};

  supportedLanguages.forEach((language) => {
    const languagePack = buildLanguagePack(language, inputDir);
    if (Object.keys(languagePack).length) {
      pack[language] = languagePack;
    }
  });

  if (!Object.keys(pack).length) {
    throw new Error("No content rows found. Nothing to build.");
  }

  if (!allowLanguageMismatch) {
    const parityErrors = validateGeneratedLanguageParity(pack);
    if (parityErrors.length) {
      throw new Error(`Language parity mismatch:\n${parityErrors.map((item) => `- ${item}`).join("\n")}`);
    }
  }

  const validation = validateCustomPack(pack, BASE_CONTENT);
  if (!validation.valid) {
    throw new Error(`Generated pack is invalid:\n${validation.errors.map((item) => `- ${item}`).join("\n")}`);
  }

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify(pack, null, 2)}\n`, "utf8");

  console.log(`Study pack generated: ${path.relative(rootDir, outputPath)}`);
  printSummary(pack);
}

function parseArgs(rawArgs) {
  const options = {};
  rawArgs.forEach((arg) => {
    if (!arg.startsWith("--")) {
      return;
    }

    const separatorIndex = arg.indexOf("=");
    if (separatorIndex !== -1) {
      const key = arg.slice(2, separatorIndex);
      const value = arg.slice(separatorIndex + 1);
      options[key] = value;
      return;
    }

    options[arg.slice(2)] = true;
  });
  return options;
}

function buildLanguagePack(language, sourceDir) {
  const quizRows = readCsv(path.join(sourceDir, `${language}.quiz.csv`), CSV_SCHEMAS.quiz);
  const practiceRows = readCsv(path.join(sourceDir, `${language}.practice.csv`), CSV_SCHEMAS.practice);
  const flashcardRows = readCsv(path.join(sourceDir, `${language}.flashcards.csv`), CSV_SCHEMAS.flashcards);
  const checklistItems = readChecklist(path.join(sourceDir, `${language}.checklist.txt`));

  assertUniqueRowIds(quizRows, `${language}.quiz.csv`);
  assertUniqueRowIds(practiceRows, `${language}.practice.csv`);
  assertUniqueRowIds(flashcardRows, `${language}.flashcards.csv`);

  const languagePack = {};

  if (quizRows.length) {
    languagePack.quizData = quizRows.map((row) => mapQuizRow(row, language));
  }

  if (practiceRows.length) {
    languagePack.practiceProblems = practiceRows.map((row) => mapPracticeRow(row, language));
  }

  if (flashcardRows.length) {
    languagePack.flashcards = flashcardRows.map((row) => mapFlashcardRow(row, language));
  }

  if (checklistItems.length) {
    languagePack.checklistItems = checklistItems;
  }

  return languagePack;
}

function readCsv(filePath, expectedHeaders) {
  if (!fs.existsSync(filePath)) {
    return [];
  }

  const fileLabel = path.basename(filePath);
  const source = fs.readFileSync(filePath, "utf8");
  const lines = source
    .replace(/^\uFEFF/, "")
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"));

  if (!lines.length) {
    return [];
  }

  const headers = splitCsvLine(lines[0], `header of ${fileLabel}`);
  assertExpectedHeaders(headers, expectedHeaders, fileLabel);

  return lines.slice(1).map((line, index) => {
    const lineNumber = index + 2;
    const values = splitCsvLine(line, `${fileLabel}:${lineNumber}`);
    assertColumnCount(values, headers, fileLabel, lineNumber);
    const row = {};

    headers.forEach((header, headerIndex) => {
      row[header] = (values[headerIndex] || "").trim();
    });

    row.__line = lineNumber;
    return row;
  });
}

function assertExpectedHeaders(actualHeaders, expectedHeaders, fileLabel) {
  const sameLength = actualHeaders.length === expectedHeaders.length;
  const sameOrder = sameLength && actualHeaders.every((header, index) => header === expectedHeaders[index]);

  if (sameOrder) {
    return;
  }

  throw new Error([
    `Invalid header in ${fileLabel}.`,
    `Expected: ${expectedHeaders.join(",")}`,
    `Actual:   ${actualHeaders.join(",")}`
  ].join("\n"));
}

function assertUniqueRowIds(rows, fileLabel) {
  const seen = new Map();

  rows.forEach((row) => {
    const id = row.id;
    if (!id) {
      return;
    }

    if (seen.has(id)) {
      throw new Error(`Duplicate id "${id}" in ${fileLabel} at lines ${seen.get(id)} and ${row.__line}.`);
    }

    seen.set(id, row.__line);
  });
}

function assertColumnCount(values, headers, fileLabel, lineNumber) {
  if (values.length === headers.length) {
    return;
  }

  throw new Error(
    `Invalid column count in ${fileLabel} at line ${lineNumber}. Expected ${headers.length}, got ${values.length}.`
  );
}

function splitCsvLine(line, contextLabel = "csv line") {
  const values = [];
  let token = "";
  let quoted = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];

    if (char === "\"") {
      if (quoted && next === "\"") {
        token += "\"";
        index += 1;
      } else {
        quoted = !quoted;
      }
      continue;
    }

    if (char === "," && !quoted) {
      values.push(token);
      token = "";
      continue;
    }

    token += char;
  }

  values.push(token);
  if (quoted) {
    throw new Error(`Malformed CSV in ${contextLabel}: unclosed quote.`);
  }

  return values.map((value) => value.trim());
}

function readChecklist(filePath) {
  if (!fs.existsSync(filePath)) {
    return [];
  }

  return fs.readFileSync(filePath, "utf8")
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"));
}

function assertKnownTopic(topic, language, line) {
  const labels = BASE_CONTENT[language]?.topicLabels || {};
  if (labels[topic]) {
    return;
  }

  throw new Error(`Unknown topic "${topic}" at line ${line} for language "${language}".`);
}

function mapQuizRow(row, language) {
  assertField(row, "id");
  assertField(row, "topic");
  assertField(row, "q");
  assertField(row, "opt1");
  assertField(row, "opt2");
  assertField(row, "opt3");
  assertField(row, "opt4");
  assertField(row, "correct");
  assertField(row, "explanation");
  assertKnownTopic(row.topic, language, row.__line);

  const correct = Number(row.correct);
  if (!Number.isInteger(correct) || correct < 0 || correct > 3) {
    throw new Error(`Invalid quiz correct index at line ${row.__line}: "${row.correct}"`);
  }

  return {
    id: row.id,
    topic: row.topic,
    q: row.q,
    opts: [row.opt1, row.opt2, row.opt3, row.opt4],
    correct,
    explanation: row.explanation
  };
}

function mapPracticeRow(row, language) {
  assertField(row, "id");
  assertField(row, "topic");
  assertField(row, "prompt");
  assertField(row, "answer");
  assertField(row, "tolerance");
  assertField(row, "explanation");
  assertKnownTopic(row.topic, language, row.__line);

  const answer = Number(row.answer);
  const tolerance = Number(row.tolerance);
  if (!Number.isFinite(answer)) {
    throw new Error(`Invalid practice answer at line ${row.__line}: "${row.answer}"`);
  }
  if (!Number.isFinite(tolerance) || tolerance < 0) {
    throw new Error(`Invalid practice tolerance at line ${row.__line}: "${row.tolerance}"`);
  }

  return {
    id: row.id,
    topic: row.topic,
    prompt: row.prompt,
    answer,
    tolerance,
    explanation: row.explanation
  };
}

function mapFlashcardRow(row, language) {
  assertField(row, "id");
  assertField(row, "topic");
  assertField(row, "term");
  assertField(row, "def");
  assertKnownTopic(row.topic, language, row.__line);

  return {
    id: row.id,
    topic: row.topic,
    term: row.term,
    def: row.def
  };
}

function assertField(row, key) {
  if (!row[key]) {
    throw new Error(`Missing "${key}" value at line ${row.__line}`);
  }
}

function toBoolean(value, fallback = false) {
  if (value === undefined) {
    return fallback;
  }

  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (normalized === "true" || normalized === "1" || normalized === "yes") {
      return true;
    }
    if (normalized === "false" || normalized === "0" || normalized === "no") {
      return false;
    }
  }

  return fallback;
}

function validateGeneratedLanguageParity(pack) {
  if (!pack.uk || !pack.de) {
    return [];
  }

  const trackedCollections = ["quizData", "practiceProblems", "flashcards"];
  const issues = [];

  trackedCollections.forEach((collectionName) => {
    const uk = Array.isArray(pack.uk[collectionName]) ? pack.uk[collectionName] : [];
    const de = Array.isArray(pack.de[collectionName]) ? pack.de[collectionName] : [];

    if (uk.length !== de.length) {
      issues.push(`${collectionName} length differs: uk=${uk.length}, de=${de.length}.`);
      return;
    }

    const ukIds = uk.map((item) => item?.id || "");
    const deIds = de.map((item) => item?.id || "");
    const deSet = new Set(deIds);
    const ukSet = new Set(ukIds);

    const missingInDe = ukIds.filter((id) => !deSet.has(id));
    const missingInUk = deIds.filter((id) => !ukSet.has(id));

    if (missingInDe.length || missingInUk.length) {
      const issuesParts = [];
      if (missingInDe.length) {
        issuesParts.push(`missing in de: ${missingInDe.slice(0, 3).join(", ")}`);
      }
      if (missingInUk.length) {
        issuesParts.push(`missing in uk: ${missingInUk.slice(0, 3).join(", ")}`);
      }
      issues.push(`${collectionName} id mismatch (${issuesParts.join("; ")}).`);
    }
  });

  return issues;
}

function printSummary(packData) {
  Object.entries(packData).forEach(([language, languagePack]) => {
    const summary = {
      quizData: Array.isArray(languagePack.quizData) ? languagePack.quizData.length : 0,
      practiceProblems: Array.isArray(languagePack.practiceProblems) ? languagePack.practiceProblems.length : 0,
      flashcards: Array.isArray(languagePack.flashcards) ? languagePack.flashcards.length : 0,
      checklistItems: Array.isArray(languagePack.checklistItems) ? languagePack.checklistItems.length : 0
    };

    console.log(`[${language}] quiz=${summary.quizData}, practice=${summary.practiceProblems}, flashcards=${summary.flashcards}, checklist=${summary.checklistItems}`);
  });
}

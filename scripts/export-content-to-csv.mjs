import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { BASE_CONTENT } from "../assets/js/modules/content.js";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = parseArgs(process.argv.slice(2));
const outputDir = path.resolve(rootDir, args.output || "artifacts/content-csv-export");
const idPrefix = String(args["id-prefix"] || "");

run();

function run() {
  fs.mkdirSync(outputDir, { recursive: true });

  ["uk", "de"].forEach((language) => {
    const content = BASE_CONTENT[language];
    if (!content) {
      return;
    }

    writeCsv(
      path.join(outputDir, `${language}.quiz.csv`),
      ["id", "topic", "q", "opt1", "opt2", "opt3", "opt4", "correct", "explanation"],
      content.quizData.map((item) => [
        withPrefix(item.id),
        item.topic,
        item.q,
        item.opts?.[0] ?? "",
        item.opts?.[1] ?? "",
        item.opts?.[2] ?? "",
        item.opts?.[3] ?? "",
        String(item.correct),
        item.explanation
      ])
    );

    writeCsv(
      path.join(outputDir, `${language}.practice.csv`),
      ["id", "topic", "prompt", "answer", "tolerance", "explanation"],
      content.practiceProblems.map((item) => [
        withPrefix(item.id),
        item.topic,
        item.prompt,
        String(item.answer),
        String(item.tolerance),
        item.explanation
      ])
    );

    writeCsv(
      path.join(outputDir, `${language}.flashcards.csv`),
      ["id", "topic", "term", "def"],
      content.flashcards.map((item) => [
        withPrefix(item.id),
        item.topic,
        item.term,
        item.def
      ])
    );

    fs.writeFileSync(
      path.join(outputDir, `${language}.checklist.txt`),
      `${content.checklistItems.map((item) => `${item}\n`).join("")}`,
      "utf8"
    );
  });

  console.log(`Content exported to: ${path.relative(rootDir, outputDir)}`);
}

function parseArgs(rawArgs) {
  const options = {};
  rawArgs.forEach((arg) => {
    if (!arg.startsWith("--") || !arg.includes("=")) {
      return;
    }

    const [key, value] = arg.slice(2).split("=");
    options[key] = value;
  });
  return options;
}

function writeCsv(filePath, header, rows) {
  const lines = [header.map(escapeCsv).join(",")];
  rows.forEach((row) => {
    lines.push(row.map((value) => escapeCsv(String(value ?? ""))).join(","));
  });
  fs.writeFileSync(filePath, `${lines.join("\n")}\n`, "utf8");
}

function escapeCsv(value) {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, "\"\"")}"`;
  }
  return value;
}

function withPrefix(value) {
  return `${idPrefix}${value}`;
}

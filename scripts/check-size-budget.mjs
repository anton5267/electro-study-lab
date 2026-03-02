import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const DEFAULT_LIMITS = {
  appJs: 85_000,
  contentJs: 90_000,
  templatesJs: 25_000,
  serviceWorkerJs: 6_000,
  mainCss: 35_000,
  totalJs: 250_000
};
const DEFAULT_WARNING_THRESHOLD_PCT = 1;

const args = parseArgs(process.argv.slice(2));
const limits = resolveLimits(args);
const warningThresholdPct = resolveWarningThresholdPct(args);

const targets = {
  appJs: sizeOf("assets/js/app.js"),
  contentJs: sizeOf("assets/js/modules/content.js"),
  templatesJs: sizeOf("assets/js/modules/templates.js"),
  serviceWorkerJs: sizeOf("service-worker.js"),
  mainCss: sizeOf("assets/css/main.css"),
  totalJs: totalJsSize("assets/js")
};

const failures = Object.entries(targets)
  .filter(([key, size]) => size > limits[key])
  .map(([key, size]) => `${key}: ${size} > ${limits[key]}`);
const warnings = Object.entries(targets)
  .map(([key, size]) => {
    const limit = limits[key];
    const remaining = limit - size;
    const headroomPct = limit > 0 ? (remaining / limit) * 100 : 0;
    return {
      key,
      remaining,
      headroomPct
    };
  })
  .filter((item) => item.remaining >= 0 && item.headroomPct <= warningThresholdPct)
  .map((item) => `${item.key}: headroom ${item.remaining} bytes (${item.headroomPct.toFixed(2)}%)`);

if (args.json) {
  console.log(JSON.stringify({
    limits,
    targets,
    warningThresholdPct,
    warnings,
    ok: failures.length === 0
  }, null, 2));
} else {
  console.log("Size budget report:");
  Object.keys(targets).forEach((key) => {
    console.log(`- ${key}: ${targets[key]} / ${limits[key]}`);
  });

  if (failures.length) {
    console.log("");
    console.log("Size budget exceeded:");
    failures.forEach((item) => console.log(`- ${item}`));
  } else if (warnings.length) {
    console.log("");
    console.log("Size budget warnings:");
    warnings.forEach((item) => console.log(`- ${item}`));
  } else {
    console.log("");
    console.log("Size budget passed.");
  }
}

if (failures.length) {
  process.exitCode = 1;
}

function parseArgs(rawArgs) {
  const options = {
    json: false,
    values: {}
  };

  rawArgs.forEach((arg) => {
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

function resolveLimits(argsOptions) {
  return {
    appJs: readIntegerOption(argsOptions, "max-app-js", "SIZE_MAX_APP_JS", DEFAULT_LIMITS.appJs),
    contentJs: readIntegerOption(argsOptions, "max-content-js", "SIZE_MAX_CONTENT_JS", DEFAULT_LIMITS.contentJs),
    templatesJs: readIntegerOption(argsOptions, "max-templates-js", "SIZE_MAX_TEMPLATES_JS", DEFAULT_LIMITS.templatesJs),
    serviceWorkerJs: readIntegerOption(argsOptions, "max-sw-js", "SIZE_MAX_SW_JS", DEFAULT_LIMITS.serviceWorkerJs),
    mainCss: readIntegerOption(argsOptions, "max-main-css", "SIZE_MAX_MAIN_CSS", DEFAULT_LIMITS.mainCss),
    totalJs: readIntegerOption(argsOptions, "max-total-js", "SIZE_MAX_TOTAL_JS", DEFAULT_LIMITS.totalJs)
  };
}

function resolveWarningThresholdPct(argsOptions) {
  const argValue = argsOptions.values["warn-threshold-pct"];
  const envValue = process.env.SIZE_WARN_THRESHOLD_PCT;
  const candidate = argValue ?? envValue;

  if (candidate === undefined || candidate === "") {
    return DEFAULT_WARNING_THRESHOLD_PCT;
  }

  const parsed = Number(candidate);
  if (!Number.isFinite(parsed) || parsed < 0 || parsed > 100) {
    throw new Error(`Invalid numeric value for warn-threshold-pct/SIZE_WARN_THRESHOLD_PCT: "${candidate}"`);
  }

  return parsed;
}

function readIntegerOption(argsOptions, argName, envName, fallback) {
  const argValue = argsOptions.values[argName];
  const envValue = process.env[envName];
  const candidate = argValue ?? envValue;

  if (candidate === undefined || candidate === "") {
    return fallback;
  }

  const parsed = Number(candidate);
  if (!Number.isInteger(parsed) || parsed < 1) {
    throw new Error(`Invalid numeric value for ${argName}/${envName}: "${candidate}"`);
  }

  return parsed;
}

function sizeOf(relativePath) {
  const fullPath = path.join(rootDir, relativePath);
  return fs.statSync(fullPath).size;
}

function totalJsSize(relativeDir) {
  const fullDir = path.join(rootDir, relativeDir);
  const entries = fs.readdirSync(fullDir, { withFileTypes: true });

  return entries.reduce((sum, entry) => {
    const nextRelative = path.join(relativeDir, entry.name);
    if (entry.isDirectory()) {
      return sum + totalJsSize(nextRelative);
    }

    if (entry.isFile() && entry.name.endsWith(".js")) {
      return sum + sizeOf(nextRelative);
    }

    return sum;
  }, 0);
}

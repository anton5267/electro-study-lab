# Changelog

All notable changes to this project should be documented in this file.

## [Unreleased]

### Added

- Security automation baseline for repository maintenance:
  - Dependabot configuration for `npm` and `github-actions`.
  - `gitleaks` configuration and CI workflow for secret scanning on pushes and pull requests.
- `SECURITY.md` with disclosure process and response targets.
- GitHub admin scripts for reproducible security setup:
  - `scripts/github/enable-security-analysis.ps1`
  - `scripts/github/apply-branch-protection.ps1`
- `ROADMAP.md` with a phased 2026 delivery plan.
- `CONTRIBUTING-CONTENT.md` with contribution rules for bilingual content updates.
- `LICENSE` (MIT) for open-source usage terms.
- Content tooling for systematic expansion:
  - `scripts/content-workbench.mjs` for content metrics by language/topic and parity checks.
  - `content-workbench` now reports and enforces optional complexity coverage metrics (`quizMedium`, `quizLong`, `practiceStrict`, `practiceRelaxed`).
  - npm scripts `content:report` and `content:gate`.
  - `scripts/check-size-budget.mjs` and npm script `size:check`.
  - `size:check` now emits low-headroom warnings (configurable via `--warn-threshold-pct` / `SIZE_WARN_THRESHOLD_PCT`) before hard budget failures.
  - `scripts/build-study-pack-from-csv.mjs` and `assets/data/csv-template/` for CSV-to-JSON content pack generation.
  - npm scripts `content:pack:csv` and `content:export:csv`.
  - `scripts/export-content-to-csv.mjs` for exporting base content into editable CSVs.
  - `export-content-to-csv` now supports `--id-prefix` for custom-pack safe IDs.
  - `scripts/test-build-study-pack-from-csv.mjs` for automated CSV-builder validation.
  - `scripts/test-size-budget.mjs` for size-gate pass/fail/json coverage.
  - Added warning-threshold validation coverage in `scripts/test-size-budget.mjs` for invalid `--warn-threshold-pct` inputs.
  - `scripts/test-export-content-to-csv.mjs` for export pipeline checks.
  - `scripts/validate-custom-pack.mjs` for standalone custom-pack JSON validation before import.
  - `validate-custom-pack` now supports `--json` machine-readable output for CI/automation consumption.
  - `scripts/validate-backup-payload.mjs` for standalone backup JSON validation before progress import.
  - `assets/data/backup-template.json` as a ready-to-validate backup payload template.
  - `scripts/test-validate-custom-pack.mjs` for CLI validator coverage (valid/invalid/oversize cases).
  - `scripts/test-validate-backup-payload.mjs` for backup-validator CLI coverage (valid/invalid/oversize/path-with-equals cases).
  - `scripts/release-preflight.mjs` and `RELEASE-CHECKLIST.md` for reproducible pre-tag release validation.
- Base learning content extension in both `uk` and `de`:
  - flashcards: `fc-11..fc-12`
  - practice problems: `pp-7..pp-8`
  - quiz questions: `qq-13..qq-16`

### Changed

- Hardened custom content import pipeline:
  - Added sanitization for imported custom packs before merge/render.
  - Rejected HTML markup in custom-pack validation fields to reduce XSS risk.
  - Added max import file size guard (`1 MB`) for pack/backup imports with localized error messages.
  - Added per-collection custom-pack item guard (`max 500`) to reduce import abuse and runtime freeze risk.
  - Added strict backup `progress` type guards for numeric arrays (`checklist/seenCards/cardOrder`), string arrays (`practiceSolved/quizMastered/quizVariantIds/reviewQueue`) and answer maps (`practiceAnswers/quizAnswers`).
  - Added backup payload migration to normalize legacy root fields into modern `progress/viewState/examSettings` structure before validation/import.
- Added CSP meta policy in `index.html` to restrict script/object/frame sources.
- Refactored UI update orchestration in `app.js`:
  - Added centralized view-render helpers (`renderViews`, `rerender*` helpers).
  - Replaced duplicated multi-render blocks in search/topic/quiz/exam/checklist/practice flows.
  - Standardized URL/view-state synchronization through shared helper.
- Hardened service-worker fetch strategy:
  - Navigation fallback is now limited to navigation requests only.
  - Added same-origin runtime caching rules for scripts/styles/images/fonts/manifest/json.
  - Enabled navigation preload and explicit cache version bump.
  - Navigation fallback cache now stores only successful HTML responses.
  - Precache list now includes all modular runtime dependencies (`exam-preferences`, `exam-runtime`, `exam-session`, `quiz-session`, `review-planner`, `progress-metrics`, `view-plan`) for reliable offline boot.
  - Cache name is now derived from a deterministic hash of `PRE_CACHE_ASSETS`, removing manual cache-version bump drift.
- Hardened local static server behavior:
  - added baseline response headers (`Referrer-Policy`, `X-Content-Type-Options`, `X-Frame-Options`, `Permissions-Policy`, `Cross-Origin-Opener-Policy`, `Cross-Origin-Resource-Policy`);
  - HTML responses now include a baseline `Content-Security-Policy` header aligned with app CSP directives;
  - restricted methods to `GET/HEAD` with explicit `405` for other methods;
  - blocked dotfile path access (e.g. `/.gitignore`) and encoded traversal attempts (e.g. `/%2e%2e/package.json`) with `403`;
  - malformed URL-encoding paths (e.g. `/%zz/index.html`) are rejected with `403`;
  - null-byte encoded paths (e.g. `/%00/index.html`) are rejected with `403`;
  - error responses (`403/404/405`) now include explicit `Cache-Control: no-cache`;
  - successful static responses now include `ETag` + `Last-Modified` validators and support conditional `304 Not Modified` responses for `If-None-Match` / `If-Modified-Since`;
  - successful static responses now also include explicit `Content-Length` for stronger `GET/HEAD` parity;
  - `If-Modified-Since` comparison now uses HTTP-second precision to avoid false `200` responses caused by millisecond-level file timestamps;
  - applied `no-cache` policy to `index.html`, `404.html`, `service-worker.js`, `manifest.webmanifest`, and `release.json`;
  - added dedicated smoke assertions for new header/method/path contracts, including HTML CSP header checks and `If-None-Match`/`If-Modified-Since` cache-validator behavior, in both source and dist HTTP tests.
  - extracted server path/header/cache-validator logic into `scripts/dev-server-helpers.mjs` and covered it with dedicated unit tests in `scripts/test-dev-server-helpers.mjs`.
  - centralized required HTML CSP directives in `scripts/dev-server-helpers.mjs` and reused them in both `validate-app` and HTTP smoke assertions to keep CSP checks synchronized.
- added `scripts/test-http-smoke-helpers.mjs` to unit-test HTTP smoke assertion helpers (security/cache/CSP/content-length validators) outside of full integration smoke runs.
- added `scripts/test-smoke-checks.mjs` to unit-test centralized smoke-resource lists and expected precache-path synchronization contracts.
  - strengthened `test-smoke-checks` to enforce exact parity between real `assets/js/modules/*.js` files and source/dist module smoke manifests.
  - extracted shared HTTP smoke helpers into `scripts/http-smoke-helpers.mjs` to keep source/dist smoke checks synchronized.
- Extracted shared browser smoke helpers into `scripts/browser-smoke-helpers.mjs` to keep source/dist browser flows synchronized.
- Extracted shared HTTP smoke resource lists into `scripts/smoke-checks.mjs` to keep source/dist HTTP checks synchronized.
- `scripts/validate-app.mjs` now reuses centralized expected precache-paths from `scripts/smoke-checks.mjs` for service-worker asset coverage checks.
- `scripts/validate-app.mjs` now verifies that `package.json` `scripts.test` covers all `scripts/test-*.mjs` files (no missing or stale entries).
- `scripts/validate-app.mjs` now also verifies npm script contracts for `quality`, `quality:quick`, and `smoke` chains to prevent accidental gate drift.
- `scripts/validate-app.mjs` now validates `assets/data/backup-template.json` through `validateBackupPayload` (not only JSON syntax).
- Upgraded review-mode behavior:
  - `startReviewMode` now picks an adaptive topic from review queue and mastery data.
  - When current topic has no review items, app auto-falls back to the best matching topic/all.
  - Added localized toast feedback when adaptive topic focus changes.
  - Moved adaptive review ranking into `assets/js/modules/review-planner.js` for isolated tests.
- `startReviewMode` now delegates next review-candidate resolution to `resolveAdaptiveReviewCandidate` in `assets/js/modules/review-planner.js`, reducing orchestration complexity in `app.js`.
- Added dedicated test coverage for adaptive review planner in `scripts/test-review-planner.mjs`.
- Added isolated view-plan module and tests:
  - `assets/js/modules/view-plan.js` for bootstrap/search/topic/progress render plans.
  - `scripts/test-view-plan.mjs` for render-plan and dedupe behavior.
- Exam intro now remembers the last selected duration and question count in local storage for faster repeated exam sessions.
- Added `assets/js/modules/exam-preferences.js` and `scripts/test-exam-preferences.mjs` to isolate exam-setting normalization/defaults from `app.js`.
- `app.js` now reuses `resolveExamSettings` from `assets/js/modules/exam-preferences.js` for exam-intro start/change flows, removing duplicated normalization logic.
- Added `assets/js/modules/exam-session.js` and `scripts/test-exam-session.mjs` to isolate exam finalization math/state transitions from `app.js`.
- Added `assets/js/modules/quiz-session.js` and `scripts/test-quiz-session.mjs` to isolate quiz finalization math/state transitions from `app.js`.
- Added `assets/js/modules/checklist-state.js` and `scripts/test-checklist-state.mjs` to isolate checklist complete/reset/toggle transitions and index-guard behavior from `app.js`.
- `app.js` checklist handlers now delegate complete/reset/toggle state transitions to `checklist-state.js`, reducing inline mutation logic in the orchestration layer.
- Added `assets/js/modules/checklist-control.js` and `scripts/test-checklist-control.mjs` to isolate checklist toggle intent parsing from `app.js`.
- `app.js` checklist click handler now delegates `[data-check-index]` parsing to `checklist-control.js`, reducing inline DOM-branching in orchestration code.
- Added `assets/js/modules/flashcard-state.js` and `scripts/test-flashcard-state.mjs` to isolate flashcard next/previous/seen/shuffle transitions and guard behavior from `app.js`.
- `app.js` flashcard handlers now delegate next/previous/seen/shuffle state transitions to `flashcard-state.js`, reducing inline mutation logic in the orchestration layer.
- Added `assets/js/modules/practice-state.js` and `scripts/test-practice-state.mjs` to isolate practice answer evaluation and solved-set transitions from `app.js`.
- `app.js` practice handlers now delegate answer evaluation/solved transitions to `practice-state.js`, removing duplicated numeric tolerance checks in the orchestration layer.
- Added `assets/js/modules/practice-control.js` and `scripts/test-practice-control.mjs` to isolate practice input/check action parsing from `app.js`.
- `app.js` practice handlers now delegate DOM action parsing (`input`/`check`) to `practice-control.js`, reducing inline event-branching in the orchestration layer.
- `app.js` practice `Enter` keydown handler now delegates action parsing to `practice-control.js`, completing extraction of practice event-branching from `app.js`.
- Added `assets/js/modules/quiz-control.js` and `scripts/test-quiz-control.mjs` to isolate quiz answer action parsing (`click`/`keyboard`) from `app.js`.
- `app.js` quiz handlers now delegate answer action parsing and guard checks to `quiz-control.js`, reducing duplicated branch logic in the orchestration layer.
- Added `assets/js/modules/theory-control.js` and `scripts/test-theory-control.mjs` to isolate theory hotspot action parsing/selection from `app.js`.
- `app.js` theory handlers now delegate hotspot parsing/selection updates to `theory-control.js`, reducing inline DOM-branching and map mutation logic.
- Added `assets/js/modules/jump-control.js` and `scripts/test-jump-control.mjs` to isolate `review-now`/`jump-section` action parsing from `app.js`.
- `app.js` jump handlers now delegate spotlight/review/search action parsing to `jump-control.js` with section validation, reducing inline navigation-branching logic.
- Added `assets/js/modules/keyboard-control.js` and `scripts/test-keyboard-control.mjs` to isolate keyboard-shortcut intent parsing from `app.js`.
- `app.js` keyboard handler now delegates modal/section/answer/flashcard shortcut parsing to `keyboard-control.js`, reducing inline conditional branching in orchestration code.
- Added `assets/js/modules/nav-control.js` and `scripts/test-nav-control.mjs` to isolate nav-tab click/keydown intent parsing from `app.js`.
- `app.js` nav-tab handlers now delegate click/keydown parsing to `nav-control.js` with section validation, reducing inline navigation/focus branching logic.
- Added `assets/js/modules/language-control.js` and `scripts/test-language-control.mjs` to isolate language-switch intent parsing from `app.js`.
- `app.js` language switcher now delegates `.lang-btn` click parsing to `language-control.js`, reducing inline branching in orchestration code.
- Added `assets/js/modules/topic-control.js` and `scripts/test-topic-control.mjs` to isolate topic-filter intent parsing from `app.js`.
- `app.js` topic-filter handler now delegates `[data-topic-filter]` parsing with allowed-topic validation to `topic-control.js`, reducing inline DOM-branching in orchestration code.
- Added `assets/js/modules/exam-intro-control.js` and `scripts/test-exam-intro-control.mjs` to isolate exam-intro start/change intent parsing from `app.js`.
- `app.js` exam-intro handlers now delegate start/change parsing to `exam-intro-control.js`, reducing selector-branching in orchestration code.
- Hardened `exam-control` runtime answer parsing to reject empty question ids before answer transitions.
- Backup payload now includes `examSettings` (duration/question count) and restores them on import.
- Added `scripts/test-content-workbench.mjs` to validate content-gate thresholds and JSON output mode.
- Added `scripts/test-content-csv-roundtrip.mjs` to verify export->build CSV pipeline on full base content.
- Added `assets/js/modules/progress-metrics.js` and `scripts/test-progress-metrics.mjs` for isolated progress math checks.
- Added `assets/js/modules/exam-runtime.js` and `scripts/test-exam-runtime.mjs` for isolated exam runtime lifecycle logic (running/timeout/restore/snapshot).
- `app.js` exam runtime handlers now delegate tick action planning and started-state assembly to `exam-runtime.js`, reducing inline timer-transition logic in the orchestration layer.
- Added `assets/js/modules/exam-control.js` and `scripts/test-exam-control.mjs` for isolated exam submit/reset/restore transition planning.
- `app.js` exam submit/reset/restore handlers now delegate transition plans to `exam-control.js`, reducing inline orchestration branching.
- `app.js` exam runtime click handlers now delegate button action parsing (`answer`/`submit`/`reset`) to `exam-control.js`, reducing DOM-branching in orchestration code.
- `app.js` exam keyboard-answer handler now delegates unresolved-question/option guard parsing to `exam-control.js`, reducing duplicated guard logic in orchestration code.
- Hardened CSV builder input validation:
  - robust CLI argument parsing for paths containing `=`;
  - strict CSV header schema checks by file type;
  - strict per-row column count checks and malformed quote detection;
  - duplicate id detection with row references;
  - topic key validation against language topic labels.
  - strict `uk/de` ID parity checks for generated `quizData/practiceProblems/flashcards` with optional `--allow-language-mismatch` escape hatch.
  - parity checks are now order-insensitive and compare language ID sets to avoid false failures on row reordering.
- Browser smoke tests now verify adaptive review topic fallback in both source and dist scenarios.
- Browser smoke tests now also verify exam-intro setting persistence (duration/question count) in both source and dist scenarios.
- Browser smoke tests now also verify invalid custom-pack/backup import paths (warning toast + no unintended state switch) in both source and dist scenarios.
- Added `npm run quality:quick` as a fast local gate (tests + validate + content gates + size budget) before running full `quality`.
- `npm run quality` now includes `npm run content:gate` and `npm run size:check` before packaging and smoke checks.
- `npm run quality` now also includes `npm run content:validate:pack` to validate custom-pack template integrity in the main gate.
- `npm run quality` and `npm run quality:quick` now also include `npm run progress:validate:backup` to validate backup-template integrity in both gates.
- `storage.js` now includes missing key bindings for `examDurationMinutes` and `examQuestionCount` to prevent key collisions through undefined storage keys.
- Added `storage` schema migration bootstrap (`migrateStorageSchema`) and dedicated `scripts/test-storage.mjs` coverage.
- `scripts/validate-app.mjs` now enforces CSP baseline directives and rejects `unsafe-eval`.
- `scripts/validate-app.mjs` now checks service-worker safety guards (same-origin cache guard, navigate-only fallback, HTML-only fallback caching).

## [1.0.0] - 2026-02-27

### Added

- Bilingual static study app with theory, flashcards, practice, quiz, exam, checklist and analytics.
- Local persistence for progress, review state, exam restore, URL state and custom content packs.
- PWA support with offline cache, install flow and update handling.
- Backup/import/export flows with strict validation and recovery of working state.
- Automated quality stack: unit-style scripts, HTTP/browser smoke tests, accessibility audit and visual regression baselines.
- GitHub Actions workflows for quality gate, GitHub Pages deploy and tagged releases.

### Changed

- Refactored core app logic into dedicated modules for runtime, progress state, assessment state, validation, templates and study helpers.
- Hardened accessibility semantics for tabs, keyboard navigation and print/mobile behavior.

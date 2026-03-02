# Electro Study Lab

Статичний навчальний застосунок для підготовки з електротехніки.

Публічний застосунок: `https://anton5267.github.io/electro-study-lab/`
План розвитку: `ROADMAP.md`
Гайд по контенту: `CONTRIBUTING-CONTENT.md`

## Структура

- `index.html` — головна сторінка застосунку.
- `elektro-lernseite 2.html` — сумісний редирект на `index.html`.
- `assets/css/main.css` — увесь візуальний шар, адаптивність і стилі друку.
- `assets/js/app.js` — стан, рендеринг, режими навчання, імпорт та аналітика.
- `assets/js/modules/assessment-state.js` — чиста логіка квізу та екзамену: сесії, відповіді, результати і статистика проходжень.
- `assets/js/modules/checklist-state.js` — pure-логіка checklist-flow (complete/reset/toggle + index guards) без прив'язки до DOM.
- `assets/js/modules/checklist-control.js` — pure-логіка parsing checklist toggle intents (`[data-check-index]`) без DOM side effects.
- `assets/js/modules/flashcard-state.js` — pure-логіка flashcard-flow (next/prev/seen/shuffle) з guard-перевірками індексів і порядку.
- `assets/js/modules/practice-state.js` — pure-логіка практичних перевірок (answer evaluation + solved-set transitions) без DOM.
- `assets/js/modules/practice-control.js` — pure-логіка parsing намірів для practice input/check/keydown дій у DOM-подіях.
- `assets/js/modules/quiz-control.js` — pure-логіка parsing намірів quiz answer дій (click/keyboard) без UI-побічних ефектів.
- `assets/js/modules/theory-control.js` — pure-логіка parsing/select action для theory hotspots без DOM-побічних ефектів.
- `assets/js/modules/jump-control.js` — pure-логіка parsing jump/review-now actions для spotlight/search/review переходів.
- `assets/js/modules/keyboard-control.js` — pure-логіка parsing keyboard-shortcut intents (modal/section/answer/flashcards) без side effects.
- `assets/js/modules/nav-control.js` — pure-логіка parsing nav-tab click/keydown intents (section select + focus navigation).
- `assets/js/modules/language-control.js` — pure-логіка parsing language-switch intents для `.lang-btn` без DOM side effects.
- `assets/js/modules/topic-control.js` — pure-логіка parsing topic-filter intents (`[data-topic-filter]`) з валідацією дозволених тем.
- `assets/js/modules/exam-intro-control.js` — pure-логіка parsing exam-intro intents (start/change settings) без DOM side effects.
- `assets/js/modules/exam-control.js` — pure-плани exam submit/reset/restore transitions і runtime/keyboard action parsing для orchestration-рівня.
- `assets/js/modules/content.js` — базовий двомовний контент і злиття з користувацьким пакетом.
- `assets/js/modules/progress-state.js` — чиста логіка backup-payload, імпорту прогресу і нормалізації state під поточний content pack.
- `assets/js/modules/runtime.js` — URL-стан, серіалізація і відновлення екзаменаційної сесії.
- `assets/js/modules/exam-preferences.js` — pure-константи і нормалізація налаштувань екзамену (тривалість/кількість питань, runtime fallback resolution).
- `assets/js/modules/exam-runtime.js` — pure-утиліти runtime-життєвого циклу екзамену (auto-submit, tick action planning, started-state builder, restore action, snapshot).
- `assets/js/modules/exam-session.js` — pure-фіналізація екзаменаційної сесії (scoring, review/mastery updates, finished state).
- `assets/js/modules/quiz-session.js` — pure-фіналізація квіз-сесії (scoring, review/mastery updates, session label).
- `assets/js/modules/storage.js` — ключі `localStorage` і нормалізація статистики.
- `assets/js/modules/study-helpers.js` — чисті селектори та похідна навчальна логіка.
- `assets/js/modules/review-planner.js` — pure-логіка пріоритезації теми для adaptive review mode і вибору next review-candidate.
- `assets/js/modules/progress-metrics.js` — pure-розрахунок прогрес-метрик (completion, accuracy, per-section counters).
- `assets/js/modules/view-plan.js` — pure-плани ререндерів для bootstrap/search/topic/progress UI-орchestration.
- `assets/js/modules/templates.js` — HTML-шаблони для секцій, карток, квізу, екзамену та аналітики.
- `assets/js/modules/validation.js` — схема валідації для `custom pack` і `backup` імпорту.
- `assets/js/modules/utils.js` — спільні утиліти.
- `assets/data/study-pack-template.json` — шаблон для імпорту власних тем.
- `assets/data/backup-template.json` — шаблон резервної копії прогресу для перевірки/автоматизації імпорту.
- `assets/data/csv-template/` — стартові CSV-файли (`uk/de`) для швидкого batch-створення custom pack.
- `manifest.webmanifest` — опис PWA для встановлення.
- `service-worker.js` — кешування ресурсів для офлайн-режиму.
- `assets/icons/` — іконки застосунку.
- `.github/workflows/deploy-pages.yml` — CI/CD workflow, який перевіряє застосунок і публікує його на GitHub Pages.
- `.github/workflows/quality.yml` — CI workflow, який ганяє повний `quality` gate на GitHub Actions.
- `.github/workflows/release.yml` — workflow для тегів `v*`, який перевіряє проєкт і збирає GitHub Release з zip-артефактом.
- `.github/workflows/gitleaks.yml` — workflow для secret scanning на `push`, `pull_request` і вручну.
- `.github/dependabot.yml` — автопідтримка npm і GitHub Actions залежностей.
- `.gitleaks.toml` — конфігурація для секрет-сканера `gitleaks`.
- `scripts/github/enable-security-analysis.ps1` — вмикає GitHub security analysis (secret scanning, push protection, dependabot security updates).
- `scripts/github/apply-branch-protection.ps1` — застосовує branch protection (required checks, PR review, no force-push).
- `.github/release.yml` — категорії для autogenerated GitHub release notes.
- `CHANGELOG.md` — базовий журнал змін і стартова release-нота для поточного стану проєкту.
- `RELEASE-CHECKLIST.md` — pre-release чекліст перед створенням git-тега `v*`.
- `ROADMAP.md` — покроковий план розвитку продукту на 2026 рік.
- `CONTRIBUTING-CONTENT.md` — правила та чекліст для додавання нових питань/задач/карток.
- `LICENSE` — ліцензія проєкту (MIT).
- `SECURITY.md` — політика відповідального security disclosure.
- `scripts/dev-server.mjs` — локальний статичний сервер для роботи через `http://localhost` із базовими security headers (включно з CSP для HTML), method/path guards, explicit `Content-Length` на `200` і conditional caching (`ETag` / `Last-Modified` / `304`).
- `scripts/dev-server-helpers.mjs` — pure-утиліти локального сервера: path-resolution guards, cache/CSP headers, ETag/conditional validators і централізований CSP-contract для validate/smoke.
- `scripts/package-site.mjs` — збірка статичного deploy-пакета в `dist/` для GitHub Pages або іншого хостингу.
- `scripts/content-workbench.mjs` — звіт і quality-gate для контенту: обсяг, покриття по темах, міжмовна парність `UA/DE`.
- `scripts/check-size-budget.mjs` — size-budget gate для ключових файлів (`app.js`, `content.js`, `main.css`, `service-worker.js`, total JS).
- `scripts/build-study-pack-from-csv.mjs` — генератор `custom pack` JSON з CSV-файлів для швидкого контент-спринту.
  - за замовчуванням вимагає ID-парність між `uk/de` для `quiz/practice/flashcards`.
- `scripts/validate-custom-pack.mjs` — CLI-перевірка `custom pack` JSON перед імпортом у застосунок.
- `scripts/validate-backup-payload.mjs` — CLI-перевірка backup JSON перед імпортом прогресу в застосунок.
- `scripts/export-content-to-csv.mjs` — експорт поточного базового контенту у CSV (`uk/de`) для batch-редагування.
- `scripts/audit-accessibility.mjs` — headless accessibility і layout audit: axe-core, mobile overflow і print-view checks.
- `scripts/browser-smoke-helpers.mjs` — спільні helper-функції для browser smoke-сценаріїв (server wait, section sync, modal close).
- `scripts/http-smoke-helpers.mjs` — спільні helper-функції для HTTP smoke-перевірок (header/cache assertions, raw path checks).
- `scripts/smoke-checks.mjs` — централізований список HTTP smoke-ресурсів і expected precache-paths для source/dist/validate синхронізації.
- `scripts/smoke-browser.mjs` — Playwright smoke-test реальних browser-сценаріїв: share-link, restore exam і import backup.
- `scripts/smoke-dist.mjs` — smoke-перевірка вже зібраного `dist/` пакета через локальний статичний сервер.
- `scripts/smoke-dist-browser.mjs` — headless browser smoke-test уже зібраного `dist/` пакета.
- `scripts/smoke-http.mjs` — smoke-перевірка основних HTTP-ресурсів через локальний сервер.
- `scripts/visual-regression.mjs` — Playwright + pixelmatch regression runner з baseline PNG для desktop/mobile layout.
- `scripts/release-preflight.mjs` — pre-release оркестратор: quality/packaging/dist smoke + release-manifest checks перед тегом.
- `scripts/test-runtime.mjs` — сценарні тести на URL-state і відновлення екзамену.
- `scripts/test-storage.mjs` — сценарні тести ключів localStorage та міграції storage-схеми.
- `scripts/test-dev-server-helpers.mjs` — сценарні тести pure-helper логіки локального сервера (path guards, cache/CSP headers, ETag/304 checks).
- `scripts/test-http-smoke-helpers.mjs` — сценарні тести helper-асертів HTTP smoke (security/cache/CSP/content-length validators).
- `scripts/test-smoke-checks.mjs` — сценарні тести централізованих smoke-check списків і expected precache-paths синхронізації.
- `scripts/test-progress-state.mjs` — сценарні тести на backup/export/import і нормалізацію progress state.
- `scripts/test-assessment-state.mjs` — сценарні тести на quiz/exam state transitions і статистику сесій.
- `scripts/test-checklist-state.mjs` — сценарні тести pure-checklist логіки (complete/reset/toggle + invalid index guards).
- `scripts/test-checklist-control.mjs` — сценарні тести pure-parsing логіки checklist toggle intents.
- `scripts/test-flashcard-state.mjs` — сценарні тести pure-flashcard логіки (next/prev/seen/shuffle + guard behavior).
- `scripts/test-practice-state.mjs` — сценарні тести pure-practice логіки (answer evaluation + solved-set transitions).
- `scripts/test-practice-control.mjs` — сценарні тести pure-parsing логіки practice input/check/keydown actions.
- `scripts/test-quiz-control.mjs` — сценарні тести pure-parsing логіки quiz answer actions (click/keyboard).
- `scripts/test-theory-control.mjs` — сценарні тести pure-parsing/select логіки theory hotspot actions.
- `scripts/test-jump-control.mjs` — сценарні тести pure-parsing логіки review-now/jump-section actions.
- `scripts/test-keyboard-control.mjs` — сценарні тести pure-parsing логіки keyboard-shortcut intents (modal/section/answer/flashcards).
- `scripts/test-nav-control.mjs` — сценарні тести pure-parsing логіки nav-tab click/keydown intents.
- `scripts/test-language-control.mjs` — сценарні тести pure-parsing логіки language-switch intents.
- `scripts/test-topic-control.mjs` — сценарні тести pure-parsing логіки topic-filter intents.
- `scripts/test-exam-intro-control.mjs` — сценарні тести pure-parsing логіки exam-intro start/change intents.
- `scripts/test-exam-control.mjs` — сценарні тести pure-планів exam submit/reset/restore transitions і runtime/keyboard action parsing.
- `scripts/test-validation.mjs` — тести на коректний і некоректний імпорт даних.
- `scripts/test-review-planner.mjs` — сценарні тести adaptive review planner (topic ranking/fallback + next review-candidate selection).
- `scripts/test-view-plan.mjs` — тести планувальника ререндерів (view plans + dedupe).
- `scripts/test-progress-metrics.mjs` — тести pure-розрахунків прогрес-метрик.
- `scripts/test-exam-runtime.mjs` — тести pure-утиліт runtime-циклу екзамену (running/timeout/tick action planning/start-state builder/restore/snapshot).
- `scripts/test-exam-session.mjs` — тести pure-фіналізації екзамену (result payload, review/mastery transitions, labels).
- `scripts/test-quiz-session.mjs` — тести pure-фіналізації квізу (result payload, review/mastery transitions, session labels).
- `scripts/test-exam-preferences.mjs` — тести pure-логіки налаштувань екзамену (options/defaults/normalization + runtime fallback resolution).
- `scripts/test-validate-custom-pack.mjs` — тести CLI-валідатора custom-pack JSON (valid/invalid/oversize).
- `scripts/test-validate-backup-payload.mjs` — тести CLI-валідатора backup JSON (valid/invalid/oversize).
- `scripts/test-content-workbench.mjs` — тести content-gate утиліти (threshold pass/fail + json mode).
- `scripts/test-build-study-pack-from-csv.mjs` — тести CSV-builder (header schema, duplicate ids, valid generation).
- `scripts/test-size-budget.mjs` — тести size-budget gate (pass/fail/json mode).
- `scripts/test-export-content-to-csv.mjs` — тести CSV-експорту базового контенту.
- `scripts/test-content-csv-roundtrip.mjs` — інтеграційний roundtrip test: export CSV -> build pack -> валідація обсягів.
- `scripts/validate-app.mjs` — локальна технічна перевірка структури, контенту й зв'язків HTML/JS.
- `dist/` — згенерований deploy-пакет; створюється скриптом `npm run package` і не комітиться.
- `dist/release.json` — manifest збірки: версія, час пакування, git SHA і склад пакета.
- `qa/visual-baselines/` — baseline screenshots для візуальної регресії.
- `package.json` — мінімальний опис проєкту та команда валідації.

## Можливості

- двомовність `UA / DE`
- теорія з інтерактивними схемами
- флешкартки з перемішуванням і прогресом
- розрахункові задачі з перевіркою
- квіз з випадковими варіантами
- режим повторення слабких питань
- екзаменаційний режим з таймером
- запам'ятовування останніх налаштувань екзамену (тривалість і кількість питань)
- відновлення незавершеного екзамену після перезавантаження
- чеклист навчання
- локальна аналітика і журнал проходжень
- резервна копія і відновлення прогресу разом із поточним робочим станом та налаштуваннями екзамену
- URL-стан для мови, теми, пошуку та активної секції
- друк / PDF
- імпорт власного JSON-пакета
- встановлення як PWA та офлайн-режим

## Розробка

Проєкт не потребує сторонніх залежностей.

- `npm run validate` — перевірка синтаксису JS, HTML id bindings, CSP baseline, service-worker safety guards, JSON-ресурсів, валідності backup-template і узгодженості базового контенту `UA/DE`.
- `npm run serve` — запуск локального сервера для нормальної роботи PWA / Service Worker.
- `npm run package` — збірка deployable `dist/` пакета з `404.html` і `.nojekyll`.
- `npm run content:report` — друк поточних метрик контенту (теми, теорія, картки, практика, quiz, покриття по темах).
- `npm run content:gate` — перевірка контент-порогів і парності `UA/DE`; входить у `npm run quality`.
- `npm run content:pack:csv` — збірка `artifacts/generated-study-pack.json` із CSV-шаблонів у `assets/data/csv-template/`.
  - порядок рядків між `uk/de` може відрізнятись, але множина `id` у `quiz/practice/flashcards` має співпадати.
  - override (не рекомендовано): `npm run content:pack:csv -- --allow-language-mismatch`
- `npm run content:validate:pack` — валідація JSON-пакета перед імпортом.
  - власний файл: `npm run content:validate:pack -- --file=./path/to/custom-pack.json`
  - machine-readable результат: `npm run content:validate:pack -- --json`
- `npm run progress:validate:backup` — валідація backup JSON перед імпортом прогресу.
  - за замовчуванням перевіряє `assets/data/backup-template.json`
  - власний файл: `npm run progress:validate:backup -- --file=./path/to/backup.json`
  - machine-readable результат: `npm run progress:validate:backup -- --json`
- `npm run content:export:csv` — експорт базового пакета у CSV в `artifacts/content-csv-export/`.
  - опціонально: `npm run content:export:csv -- --id-prefix=ext-` для унікальних id під custom-pack.
- `npm run size:check` — перевірка size-budget для ключових статичних ресурсів.
  - попередження low-headroom: `npm run size:check -- --warn-threshold-pct=5`
- `npm run audit:a11y` — accessibility/layout audit через Playwright і axe-core.
- `npm run smoke:http` — базовий HTTP smoke-test по ключових сторінках, модулях, маніфесту, іконках і службових ресурсах.
- `npm run smoke:browser` — headless browser smoke-test через Playwright по основних user flows.
- `npm run smoke:dist` — перевірка зібраного deployable `dist/` пакета і `release.json`.
- `npm run smoke:dist:browser` — перевірка зібраного `dist/` пакета в реальному headless браузері.
- `npm run smoke` — повний smoke-прогін: HTTP + browser scenarios.
- `npm run visual:refresh` — оновлення baseline screenshot-ів для visual regression.
- `npm run visual:test` — pixel-diff перевірка desktop/mobile snapshots проти baseline.
- `npm run release:preflight` — pre-release gate перед тегом: `quality:quick` + package + dist smoke + release-manifest checks.
  - повний режим: `npm run release:preflight -- --full-quality`
  - перевірка секції changelog під тег: `npm run release:preflight -- --tag=vX.Y.Z`
- `npm run quality:quick` — швидкий pre-push gate: tests + validate + content gates + backup-template validation + size-budget (без package/smoke/a11y/visual).
- `npm run quality` — повний технічний прогін: tests + validate + content gates (`content:gate`, `content:validate:pack`) + backup-template validation + package + source smoke + dist smoke + accessibility audit + visual regression.
- Пороги `content:gate` можна перевизначати через env-перемінні:
  - `CONTENT_MIN_TOPICS`, `CONTENT_MIN_THEORY`, `CONTENT_MIN_FLASHCARDS`, `CONTENT_MIN_PRACTICE`, `CONTENT_MIN_QUIZ`, `CONTENT_MIN_CHECKLIST`
  - `CONTENT_MIN_TOPIC_THEORY`, `CONTENT_MIN_TOPIC_FLASHCARDS`, `CONTENT_MIN_TOPIC_PRACTICE`, `CONTENT_MIN_TOPIC_QUIZ`
  - `CONTENT_MIN_COMPLEXITY_QUIZ_MEDIUM`, `CONTENT_MIN_COMPLEXITY_QUIZ_LONG`, `CONTENT_MIN_COMPLEXITY_PRACTICE_STRICT`, `CONTENT_MIN_COMPLEXITY_PRACTICE_RELAXED`
- Пороги `size:check` можна перевизначати через env-перемінні:
  - `SIZE_MAX_APP_JS`, `SIZE_MAX_CONTENT_JS`, `SIZE_MAX_TEMPLATES_JS`, `SIZE_MAX_SW_JS`, `SIZE_MAX_MAIN_CSS`, `SIZE_MAX_TOTAL_JS`, `SIZE_WARN_THRESHOLD_PCT`
- Імпорт `custom pack` має guard на розмір колекцій: максимум `500` елементів на кожну колекцію (`theory`, `flashcards`, `practiceProblems`, `quizData`, `checklistItems`) для запобігання перевантаженню застосунку.
- Backup-імпорт має strict type-guards для `progress` полів: числові індекси в `checklist/seenCards/cardOrder`, рядкові id-масиви в `practiceSolved/quizMastered/quizVariantIds/reviewQueue`, та коректні answer-map значення в `practiceAnswers/quizAnswers`.
- GitHub Actions workflow `Quality` запускає той самий `npm run quality` на `push`, `pull_request` і вручну через `workflow_dispatch`.
- GitHub Actions workflow `Deploy Pages` запускає `npm run quality`, окремо перевіряє `dist/` і публікує його на GitHub Pages.
- GitHub Actions workflow `Release` запускається на тегах `v*`, збирає `dist/`, перевіряє пакет і в браузері, пакує zip-архів і створює GitHub Release.
- Для запуску release workflow вручну через git-тег:
  - `git tag v1.0.1`
  - `git push origin v1.0.1`
- GitHub Actions workflow `Secret Scan` запускає `gitleaks` на `push`, `pull_request` і вручну.
- Dependabot щотижня створює PR-оновлення для npm і GitHub Actions.
- GitHub release notes групуються через `.github/release.yml`, а ручний changelog лежить у `CHANGELOG.md`.
- Для увімкнення GitHub security analysis:
  - `pwsh scripts/github/enable-security-analysis.ps1`
- Для застосування branch protection на `main`:
  - `pwsh scripts/github/apply-branch-protection.ps1 -Branches @("main")`
- `npm test` — сценарні тести для runtime-логіки без браузерних залежностей.

## Архітектура

- `app.js` лишився точкою orchestration: DOM, події, стан і зшивка всіх режимів.
- `progress-state.js` тримає окремо логіку backup/export/import і normalization, щоб не змішувати її з DOM-обробниками.
- `assessment-state.js` тримає окремо assessment-логіку, щоб `app.js` не зберігав у собі низькорівневі переходи quiz/exam state.
- `checklist-state.js` тримає ізольований checklist-flow (complete/reset/toggle + index guards), щоб не змішувати ці переходи з DOM-обробниками в `app.js`.
- `checklist-control.js` тримає ізольований parsing checklist toggle intents (`[data-check-index]`), щоб прибрати click-branching з `app.js`.
- `flashcard-state.js` тримає ізольований flashcard-flow (next/prev/seen/shuffle + order guards), щоб прибрати ці переходи з `app.js`.
- `practice-state.js` тримає ізольовану логіку практичних перевірок (answer evaluation + solved-set transitions), щоб не дублювати цю математику в `app.js`.
- `practice-control.js` тримає ізольований parsing practice input/check/keydown actions, щоб прибрати DOM-branching з `app.js`.
- `quiz-control.js` тримає ізольований parsing quiz answer actions (click/keyboard), щоб прибрати дубльовані answer-guard перевірки з `app.js`.
- `theory-control.js` тримає ізольований parsing/select hotspot actions для theory-карток, щоб прибрати DOM-branching і прямі мутації map з `app.js`.
- `jump-control.js` тримає ізольований parsing review-now/jump-section actions з валідацією секцій, щоб прибрати переходи-парсинг з `app.js`.
- `keyboard-control.js` тримає ізольований parsing keyboard-shortcut intents (modal/section/answer/flashcards), щоб прибрати умовні гілки парсингу з `app.js`.
- `nav-control.js` тримає ізольований parsing nav-tab click/keydown intents (section select + focus navigation), щоб прибрати routing-branching з `app.js`.
- `language-control.js` тримає ізольований parsing language-switch intents для `.lang-btn`, щоб прибрати click-branching з `app.js`.
- `topic-control.js` тримає ізольований parsing topic-filter intents (`[data-topic-filter]`) з валідацією тем, щоб прибрати topic click-branching з `app.js`.
- `exam-intro-control.js` тримає ізольований parsing exam-intro start/change intents, щоб прибрати selector-branching з `app.js`.
- `study-helpers.js` тримає чисту логіку без доступу до DOM: пошук, фільтрацію, рекомендації, mastery, досягнення.
- `review-planner.js` тримає isolated-логіку адаптивного вибору теми повторення, candidate fallback order і next review-candidate resolution.
- `progress-metrics.js` тримає ізольований розрахунок прогресу, completion і accuracy, щоб не змішувати математику з DOM-рендером.
- `view-plan.js` тримає ізольовані набори view-plan для ререндерів і дедуплікації view-id без прив'язки до DOM.
- `exam-preferences.js` тримає ізольовані константи, нормалізацію exam-intro налаштувань і runtime fallback resolution, щоб поведінку тривалості/кількості питань тестувати окремо.
- `exam-runtime.js` тримає ізольований runtime-контур екзамену (визначення running/timeout, tick action planning, started-state builder, safe snapshot перед фіналізацією, restore action).
- `exam-control.js` тримає ізольовані submit/reset/restore transition plans і runtime/keyboard action parsing для екзамену, щоб зменшити умовну логіку в `app.js`.
- `exam-session.js` тримає ізольовану фіналізацію екзамену (score/review/mastery/finished-state), щоб прибрати цю математику з `app.js`.
- `quiz-session.js` тримає ізольовану фіналізацію квізу (score/review/mastery/session-label), щоб прибрати цю математику з `app.js`.
- `runtime.js` тримає адресний стан, view-state snapshots і серіалізацію/гідратацію екзамену, щоб цю поведінку можна було тестувати окремо.
- `dev-server-helpers.mjs` тримає isolated-логіку локального HTTP-сервера (path guards, cache/CSP headers, validators), щоб її можна було тестувати unit-тестами без запуску сервера.
- `validation.js` відсікає биті імпорти, backup-схеми і некоректний view-state до того, як вони потраплять у застосунок.
- `templates.js` тримає рядкові шаблони інтерфейсу, щоб `app.js` не змішував бізнес-логіку з розміткою.
- `storage.js` відповідає за `localStorage`, key-binding контракти, schema migration bootstrap і нормалізацію даних.
- `content.js` тримає двомовний пакет і правила злиття з користувацьким JSON.

## Формат імпорту

Бери за основу `assets/data/study-pack-template.json`.
Підтримувані масиви всередині кожної мови:

- `theory`
- `flashcards`
- `practiceProblems`
- `quizData`
- `checklistItems`

Імпортований контент додається до базового і зберігається локально в браузері.

Для batch-підготовки пакета можна редагувати файли в `assets/data/csv-template/` і згенерувати JSON командою:

- `npm run content:pack:csv`

Щоб стартувати не з шаблону, а з актуального базового контенту, експортуй його в CSV:

- `npm run content:export:csv`
- `npm run content:export:csv -- --id-prefix=ext-`

## Ліцензія

MIT, див. `LICENSE`.

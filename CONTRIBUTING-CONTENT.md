# Contributing Content

Цей документ описує мінімальні правила для додавання нових навчальних матеріалів у `assets/js/modules/content.js` або через JSON import-пакети.

## 1. Обов'язкова парність мов

- Кожен новий елемент у `uk` повинен мати відповідник у `de` з тим самим `id`.
- Порядок `id` у `theory`, `flashcards`, `practiceProblems`, `quizData` має бути однаковий для `uk` і `de`.
- Нові `topic` ключі додаються синхронно у `topicLabels` обох мов.

## 2. Структура даних

- `theory`: унікальний `id`, валідний `topic`, непорожні `title/lead/intro`.
- `flashcards`: унікальний `id`, `term`, `def`.
- `practiceProblems`: унікальний `id`, числові `answer` і `tolerance >= 0`.
- `quizData`: унікальний `id`, рівно 4 опції в `opts`, `correct` в діапазоні `0..3`.
- `checklistItems`: короткі дії без HTML-розмітки.

## 3. Якість формулювань

- Кожне quiz-питання має перевіряти один чіткий факт або навичку.
- У `explanation` пояснюй, чому правильна відповідь правильна, а не лише повторюй її.
- Уникай надто схожих дистракторів, якщо вони не мають навчальної цінності.
- Для розрахункових задач явно задавай одиниці виміру у `prompt`.

## 4. Безпека та валідація

- Не використовуй HTML-теги у полях контенту import-пакета.
- Не додавай секрети, токени, особисті дані у приклади.
- Перед PR обов'язково запускай:
  - `npm test`
  - `npm run validate`
  - `npm run content:validate:pack -- --file=./path/to/custom-pack.json` (для custom JSON перед імпортом)
  - `npm run content:gate`
  - `npm run quality`

## 5. Мінімальний чек перед merge

- [ ] Новий контент відображається коректно в `UA` і `DE`.
- [ ] Прогрес, review-queue і analytics працюють на нових `id`.
- [ ] Імпорт custom-pack не ламає базовий контент.
- [ ] `npm run quality` проходить без помилок.

## 6. Batch-режим через CSV

- Швидкий шлях для масового наповнення: редагувати `assets/data/csv-template/*.csv`.
- Якщо треба почати з поточного реального контенту, а не з мінімального шаблону:
  - `npm run content:export:csv`
  - або одразу з префіксом id для custom-pack: `npm run content:export:csv -- --id-prefix=ext-`
  - скопіювати потрібні файли з `artifacts/content-csv-export/` у `assets/data/csv-template/`
- Після редагування згенерувати пакет:
  - `npm run content:pack:csv`
  - за замовчуванням builder перевіряє ID-парність `uk/de`; порядок рядків може відрізнятися, але множина ID має збігатися.
  - не вимикай парність (`--allow-language-mismatch`) без крайньої потреби.
- Згенерований файл: `artifacts/generated-study-pack.json`.

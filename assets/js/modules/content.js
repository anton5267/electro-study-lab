function deepClone(value) {
  return JSON.parse(JSON.stringify(value));
}

const CUSTOM_COLLECTION_KEYS = ["theory", "flashcards", "practiceProblems", "quizData", "checklistItems"];
const CONTROL_CHAR_PATTERN = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;
const HTML_TAG_PATTERN = /<[^>]*>/g;

function cleanPlainText(value, maxLength = 1200) {
  if (typeof value !== "string") {
    return "";
  }

  return value
    .replace(CONTROL_CHAR_PATTERN, "")
    .replace(HTML_TAG_PATTERN, "")
    .replace(/\r\n?/g, "\n")
    .trim()
    .slice(0, maxLength);
}

function cleanStringArray(value, maxLength = 1200) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => cleanPlainText(item, maxLength))
    .filter((item) => item.length > 0);
}

function toFiniteNumber(value, fallback = 0) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function toQuizOptions(value) {
  const options = cleanStringArray(value, 600).slice(0, 4);
  while (options.length < 4) {
    options.push("");
  }
  return options;
}

function sanitizeTheoryItem(item) {
  if (!item || typeof item !== "object" || Array.isArray(item)) {
    return null;
  }

  const sanitized = {
    id: cleanPlainText(item.id, 120),
    topic: cleanPlainText(item.topic, 80),
    icon: cleanPlainText(item.icon, 24),
    title: cleanPlainText(item.title, 320),
    lead: cleanPlainText(item.lead, 1000),
    intro: cleanStringArray(item.intro, 1800)
  };

  if (item.table && typeof item.table === "object" && !Array.isArray(item.table)) {
    const headers = cleanStringArray(item.table.headers, 220);
    const rows = Array.isArray(item.table.rows)
      ? item.table.rows
        .filter((row) => Array.isArray(row))
        .map((row) => cleanStringArray(row, 300))
        .filter((row) => row.length > 0)
      : [];

    if (headers.length || rows.length) {
      sanitized.table = { headers, rows };
    }
  }

  if (item.diagram && typeof item.diagram === "object" && !Array.isArray(item.diagram)) {
    const type = item.diagram.type === "cross" ? "cross" : "spar";
    const hotspots = Array.isArray(item.diagram.hotspots)
      ? item.diagram.hotspots
        .filter((hotspot) => hotspot && typeof hotspot === "object" && !Array.isArray(hotspot))
        .map((hotspot) => ({
          label: cleanPlainText(hotspot.label, 160),
          text: cleanPlainText(hotspot.text, 900)
        }))
        .filter((hotspot) => hotspot.label && hotspot.text)
      : [];

    if (hotspots.length) {
      sanitized.diagram = { type, hotspots };
    }
  }

  const highlight = cleanPlainText(item.highlight, 900);
  if (highlight) {
    sanitized.highlight = highlight;
  }

  const danger = cleanPlainText(item.danger, 900);
  if (danger) {
    sanitized.danger = danger;
  }

  return sanitized.id ? sanitized : null;
}

function sanitizeFlashcardItem(item) {
  if (!item || typeof item !== "object" || Array.isArray(item)) {
    return null;
  }

  const sanitized = {
    id: cleanPlainText(item.id, 120),
    topic: cleanPlainText(item.topic, 80),
    term: cleanPlainText(item.term, 360),
    def: cleanPlainText(item.def, 1200)
  };

  return sanitized.id ? sanitized : null;
}

function sanitizePracticeItem(item) {
  if (!item || typeof item !== "object" || Array.isArray(item)) {
    return null;
  }

  const sanitized = {
    id: cleanPlainText(item.id, 120),
    topic: cleanPlainText(item.topic, 80),
    prompt: cleanPlainText(item.prompt, 1000),
    answer: toFiniteNumber(item.answer, 0),
    tolerance: Math.max(0, toFiniteNumber(item.tolerance, 0)),
    explanation: cleanPlainText(item.explanation, 1000)
  };

  return sanitized.id ? sanitized : null;
}

function sanitizeQuizItem(item) {
  if (!item || typeof item !== "object" || Array.isArray(item)) {
    return null;
  }

  const numericCorrect = Number(item.correct);
  const correct = Number.isInteger(numericCorrect) ? Math.min(3, Math.max(0, numericCorrect)) : 0;

  const sanitized = {
    id: cleanPlainText(item.id, 120),
    topic: cleanPlainText(item.topic, 80),
    q: cleanPlainText(item.q, 1000),
    opts: toQuizOptions(item.opts),
    correct,
    explanation: cleanPlainText(item.explanation, 1000)
  };

  return sanitized.id ? sanitized : null;
}

function sanitizeLanguagePack(languagePack = {}) {
  const sanitized = {};

  if (Array.isArray(languagePack.theory)) {
    sanitized.theory = languagePack.theory.map(sanitizeTheoryItem).filter(Boolean);
  }

  if (Array.isArray(languagePack.flashcards)) {
    sanitized.flashcards = languagePack.flashcards.map(sanitizeFlashcardItem).filter(Boolean);
  }

  if (Array.isArray(languagePack.practiceProblems)) {
    sanitized.practiceProblems = languagePack.practiceProblems.map(sanitizePracticeItem).filter(Boolean);
  }

  if (Array.isArray(languagePack.quizData)) {
    sanitized.quizData = languagePack.quizData.map(sanitizeQuizItem).filter(Boolean);
  }

  if (Array.isArray(languagePack.checklistItems)) {
    sanitized.checklistItems = cleanStringArray(languagePack.checklistItems, 600);
  }

  return sanitized;
}

export function sanitizeCustomPack(customPack = null) {
  if (!customPack || typeof customPack !== "object" || Array.isArray(customPack)) {
    return null;
  }

  const sanitized = {};

  if (customPack.uk && typeof customPack.uk === "object" && !Array.isArray(customPack.uk)) {
    sanitized.uk = sanitizeLanguagePack(customPack.uk);
  }

  if (customPack.de && typeof customPack.de === "object" && !Array.isArray(customPack.de)) {
    sanitized.de = sanitizeLanguagePack(customPack.de);
  }

  return Object.keys(sanitized).length ? sanitized : null;
}

function mergeLanguage(baseLanguage, customLanguage = {}) {
  const merged = deepClone(baseLanguage);

  CUSTOM_COLLECTION_KEYS.forEach((key) => {
    if (Array.isArray(customLanguage[key]) && customLanguage[key].length) {
      merged[key] = [...merged[key], ...customLanguage[key]];
    }
  });

  return merged;
}

export function buildContentPack(customPack = null) {
  const sanitizedCustomPack = sanitizeCustomPack(customPack);

  if (!sanitizedCustomPack) {
    return deepClone(BASE_CONTENT);
  }

  return {
    uk: mergeLanguage(BASE_CONTENT.uk, sanitizedCustomPack.uk),
    de: mergeLanguage(BASE_CONTENT.de, sanitizedCustomPack.de)
  };
}

export const BASE_CONTENT = {
  uk: {
    metaTitle: "Electro Study Lab | Підготовка до контролю",
    htmlLang: "uk",
    heroKicker: "Навчальна лабораторія з електротехніки",
    badge: "⚡ Electro Study Lab",
    titleMain: "Професійна",
    titleAccent: "підготовка",
    subtitle: "Теорія, флешкартки, задачі, варіанти тестів, екзаменаційний режим, аналітика та імпорт власних тем в одному статичному застосунку.",
    progressHeading: "Загальний прогрес",
    progressTemplate: "{done} із {total} навчальних кроків завершено",
    completionTemplate: "{pct}%",
    metricChecklistLabel: "Чеклист",
    metricFlashcardsLabel: "Картки",
    metricPracticeLabel: "Задачі",
    metricQuizLabel: "Квіз",
    metricExamLabel: "Екзамен",
    metricAccuracyLabel: "Точність",
    topicLabels: {
      safety: "Безпека",
      switching: "Схеми",
      measurement: "Розрахунки"
    },
    typeLabels: {
      theory: "Теорія",
      flashcards: "Картка",
      practice: "Задача",
      quiz: "Питання",
      checklist: "Чеклист"
    },
    common: {
      open: "Перейти",
      repeat: "Повторити",
      start: "Почати",
      restart: "Запустити знову",
      selected: "Вибрано",
      allTopics: "Усі теми",
      recommended: "Рекомендовано",
      skipToContent: "Перейти до основного вмісту"
    },
    keyboardHint: "Клавіші: 1-8 для секцій, стрілки для карток, пробіл для перевороту, A-D для відповідей.",
    importHint: "Можна імпортувати свій JSON-пакет з додатковими темами.",
    offlineHint: "Після встановлення сторінка може працювати офлайн.",
    status: {
      online: "Онлайн",
      offline: "Офлайн",
      updateReady: "Доступне оновлення",
      updateNow: "Оновити застосунок"
    },
    spotlightHeading: "Фокус на слабких місцях",
    reviewQueueLabel: "На повторення",
    sessionsLabel: "Сесій",
    reviewNow: "Повторити слабкі місця",
    generateVariantHero: "Новий варіант квізу",
    installLabel: "Встановити застосунок",
    copyLinkLabel: "Скопіювати посилання",
    printLabel: "Друк / PDF",
    resetAll: "Повний скидання",
    searchPlaceholder: "Пошук по теорії, картках, квізу, задачах...",
    clearSearch: "Очистити",
    tabs: {
      overview: "Огляд",
      theory: "Теорія",
      flashcards: "Картки",
      practice: "Задачі",
      quiz: "Квіз",
      exam: "Екзамен",
      checklist: "Чеклист",
      analytics: "Аналітика"
    },
    sections: {
      overview: {
        title: "Центр керування навчанням",
        lead: "Тут видно знайдені матеріали, чергу повторення, імпорт власних тем і швидкі дії для нової сесії."
      },
      theory: {
        title: "Теорія",
        lead: "Стислі, але повні картки тем з таблицями, інтерактивними схемами і ключовими акцентами."
      },
      flashcards: {
        title: "Флешкартки",
        lead: "Прогортай терміни, перевертай картки та закривай поняття, які ще не сидять автоматично."
      },
      practice: {
        title: "Розрахункові задачі",
        lead: "Практика з формулами, логікою схем і перевіркою відповідей з поясненнями."
      },
      quiz: {
        title: "Тренувальний квіз",
        lead: "Можна пройти повний набір або згенерувати новий випадковий варіант."
      },
      exam: {
        title: "Екзаменаційний режим",
        lead: "Таймер, одна спроба, результат тільки після завершення, окремий запис в історію."
      },
      checklist: {
        title: "Персональний чеклист",
        lead: "Відмічай лише те, що можеш пояснити без підглядання."
      },
      analytics: {
        title: "Аналітика навчання",
        lead: "Статистика проходжень, середні результати, історія сесій і твоя зона ризику."
      }
    },
    overview: {
      searchTitle: "Швидкий пошук",
      searchLead: "Пошук працює одночасно по всіх типах матеріалу.",
      reviewTitle: "Розумне повторення",
      reviewLead: "Помилкові питання та несильні теми автоматично потрапляють у чергу повторення.",
      resourceTitle: "Пакети контенту",
      resourceLead: "Імпортуй додаткові теми через JSON, або скачай шаблон для заповнення.",
      importPack: "Імпортувати пакет",
      downloadTemplate: "Скачати шаблон",
      clearCustomPack: "Прибрати свій пакет",
      resourceNote: "Після імпорту власні теми додаються до базових і зберігаються локально.",
      nextStepTitle: "Що робити далі",
      nextStepLead: "Система радить наступний крок на основі твого прогресу.",
      backupTitle: "Резервна копія",
      backupLead: "Експортуй локальний прогрес або віднови його з JSON-файла.",
      exportProgress: "Експортувати прогрес",
      importProgress: "Імпортувати прогрес",
      backupNote: "У резервну копію входять прогрес, статистика та власний пакет тем.",
      achievementsTitle: "Досягнення",
      achievementsLead: "Малі віхи, які показують, що рух іде не хаотично, а системно.",
      emptySearch: "Порожній запит. Почни вводити тему, формулу або назву схеми.",
      emptyReview: "Поки що черга повторення порожня. Вона з'явиться після помилок у квізі або екзамені.",
      noResults: "Нічого не знайдено за цим запитом."
    },
    flashcardsUi: {
      shuffle: "Перемішати",
      previous: "← Назад",
      next: "Далі →",
      flip: "Перевернути",
      frontHint: "Питання / термін",
      backHint: "Відповідь / пояснення",
      counter: "Картка {current} з {total}",
      status: "Переглянуто {seen} з {total} карток"
    },
    practice: {
      reset: "Скинути задачі",
      check: "Перевірити",
      checked: "Перевірено",
      placeholder: "Введи відповідь",
      solvedLabel: "Розв'язано {done} з {total}",
      correct: "Правильно. {text}",
      wrong: "Поки ні. {text}",
      toleranceNote: "Можна вводити десяткові дроби через крапку або кому."
    },
    quiz: {
      generateVariant: "Згенерувати варіант",
      reset: "Скинути квіз",
      reviewMode: "Режим повторення: у цьому наборі лише слабкі питання.",
      variantMode: "Випадковий варіант: згенеровано новий набір питань.",
      defaultMode: "Повний набір тем.",
      questionLabel: "Питання {current} з {total}",
      correct: "✓ Правильно! {text}",
      wrong: "✗ Помилка. {text}",
      summaryTitle: "Підсумок квізу",
      summaryLabel: "Результат",
      reviewTitle: "Що повторити",
      reviewEmpty: "Помилок немає. Цей блок можна вважати закритим.",
      messages: {
        excellent: "Майже без помилок. Рівень уже дуже близький до контрольної.",
        good: "Результат сильний, але кілька тем ще варто швидко переглянути.",
        retry: "Є слабкі місця. Пройди повторення і знову запускай варіант."
      }
    },
    exam: {
      introTitle: "Імітація контрольної",
      introCopy: "Режим бере випадковий варіант, запускає таймер і не показує правильні відповіді до завершення.",
      settingsTitle: "Параметри",
      durationLabel: "Тривалість",
      questionCountLabel: "Кількість питань",
      start: "Почати екзамен",
      submit: "Завершити зараз",
      runningLabel: "Час до завершення",
      finishedTitle: "Екзамен завершено",
      resultLabel: "Результат",
      retry: "Запустити ще раз",
      empty: "Екзамен ще не розпочато.",
      timeoutMessage: "Час вийшов. Результат зафіксовано автоматично."
    },
    checklist: {
      reset: "Скинути",
      complete: "Позначити все",
      summary: "Закрито {done} з {total}. Чеклист зберігається локально."
    },
    analytics: {
      statsTitle: "Ключові показники",
      statsLead: "Усі значення рахуються на основі локальної історії сесій.",
      historyTitle: "Останні проходження",
      historyLead: "Останні зафіксовані спроби квізів та екзаменів.",
      topicsTitle: "Освоєння по темах",
      topicsLead: "Яка тема вже закрита, а де ще найбільший запас росту.",
      statLabels: {
        quizRuns: "Квізів пройдено",
        examRuns: "Екзаменів пройдено",
        bestQuiz: "Кращий квіз",
        bestExam: "Кращий екзамен",
        avgQuiz: "Середній квіз",
        avgExam: "Середній екзамен",
        practice: "Розв'язаних задач",
        streak: "Серія днів"
      },
      emptyHistory: "Історія ще порожня.",
      emptyAchievements: "Поки що без досягнень. Вони відкриваються автоматично в процесі навчання."
    },
    onboarding: {
      title: "Швидкий старт",
      copy: "Застосунок уже готовий до роботи. Почни з рекомендованого кроку або пройди цей короткий маршрут.",
      steps: [
        "Вибери тему через фільтр або пошук.",
        "Переглянь теорію і флешкартки.",
        "Закрий задачі, квіз і екзамен, щоб отримати повну аналітику."
      ],
      start: "Почати",
      close: "Пізніше"
    },
    achievements: {
      firstQuiz: "Перший завершений квіз",
      firstExam: "Перший завершений екзамен",
      fullChecklist: "Увесь чеклист закрито",
      fullFlashcards: "Переглянуто всі флешкартки",
      fullPractice: "Розв'язано всі задачі"
    },
    importMessages: {
      success: "Пакет імпортовано і додано до базового контенту.",
      cleared: "Користувацький пакет видалено.",
      invalid: "Файл не схожий на коректний пакет контенту.",
      backupImported: "Резервну копію прогресу успішно відновлено.",
      backupInvalid: "Файл резервної копії має некоректний формат.",
      tooLarge: "Файл завеликий для імпорту. Максимум 1 MB."
    },
    toasts: {
      saved: "Зміни збережено локально.",
      installed: "Застосунок можна запускати як окрему PWA.",
      achievement: "Нове досягнення відкрито",
      online: "З'єднання відновлено.",
      offline: "Немає мережі. Працюємо з локальними даними.",
      updateReady: "Нова версія готова до встановлення.",
      updated: "Застосунок оновлено.",
      linkCopied: "Посилання на поточний стан скопійовано.",
      examRestored: "Незавершений екзамен відновлено після перезавантаження.",
      copyFailed: "Не вдалося скопіювати посилання автоматично.",
      reviewFocus: "Повторення автоматично сфокусовано на темі: {topic}."
    },
    alerts: {
      resetAll: "Справді скинути весь прогрес, історію та власний пакет?",
      resetBase: "Справді скинути прогрес без видалення власного пакета?"
    },
    diagrams: {
      phase: "L",
      neutral: "N",
      lamp: "Лампа",
      sparLabel: "3 проводи",
      crossLabel: "Перехресний вимикач"
    },
    theory: [
      {
        id: "body-current",
        topic: "safety",
        icon: "⚡",
        title: "Дія струму на тіло людини",
        lead: "Небезпеку визначає насамперед сила струму, а не сама по собі напруга.",
        intro: [
          "Коли струм проходить через тіло, наслідки залежать від <strong>сили струму</strong>, шляху проходження, тривалості дії та стану шкіри.",
          "Особливо небезпечний шлях через грудну клітку: рука-рука або рука-нога, бо він зачіпає серце та дихальні м'язи."
        ],
        table: {
          headers: ["Струм", "Наслідок"],
          rows: [
            ["0,5–1 мА", "Поріг відчуття"],
            ["1–15 мА", "Судоми, поріг невідпускання"],
            ["15–50 мА", "Сильні спазми, ризик зупинки дихання"],
            ["50–80 мА", "Фібриляція шлуночків"],
            [">300 мА", "Опіки та миттєва зупинка серця"]
          ]
        },
        danger: "⚠️ Уже 50 мА можуть бути смертельно небезпечними.",
        highlight: "💡 За законом Ома при 230 V і приблизно 1000 Ω через тіло може піти близько 230 мА.",
        diagram: null
      },
      {
        id: "spar-switch",
        topic: "switching",
        icon: "💡",
        title: "Економна прохідна схема",
        lead: "Керування лампою з двох місць при меншій кількості провідників.",
        intro: [
          "Економна прохідна схема дозволяє зекономити один провід, якщо нейтраль використовується спільно.",
          "Для контролю важливо не просто знати назву схеми, а вміти пояснити, де проходить фаза і чому схема не є універсальною."
        ],
        highlight: "💡 Перевага: менше матеріалу. Недолік: придатна не для кожної ситуації і потребує уважного дотримання правил підключення.",
        diagram: {
          type: "spar",
          hotspots: [
            { label: "Фаза L", text: "Фаза подається на перший перемикач і визначає, чи отримає лампа живлення." },
            { label: "Міжвимикачевий зв'язок", text: "Між вимикачами залишається тільки необхідний мінімум провідників." },
            { label: "Нейтраль N", text: "Нейтраль підводиться до лампи як спільний провідник." }
          ]
        }
      },
      {
        id: "cross-switch",
        topic: "switching",
        icon: "🔀",
        title: "Перехресна схема",
        lead: "Одна лампа може керуватись з трьох або більше точок.",
        intro: [
          "Базова побудова: прохідний вимикач – перехресний – прохідний. Кожна додаткова точка додає ще один перехресний вимикач.",
          "У контрольних часто питають, який апарат стоїть посередині та скільки їх потрібно для N точок."
        ],
        table: {
          headers: ["Елемент", "Роль"],
          rows: [
            ["Прохідні вимикачі", "Початок і кінець схеми"],
            ["Перехресний вимикач", "Перехрещує перемички"],
            ["Лампа", "Навантаження"]
          ]
        },
        highlight: "💡 Для 4 точок керування потрібні 2 прохідні та 2 перехресні вимикачі.",
        diagram: {
          type: "cross",
          hotspots: [
            { label: "WS1", text: "Перший прохідний вимикач задає один із двох можливих шляхів фази." },
            { label: "KS", text: "Перехресний вимикач міняє місцями перемички, змінюючи стан кола." },
            { label: "WS2", text: "Останній прохідний вимикач завершує логіку подачі фази на лампу." }
          ]
        }
      },
      {
        id: "protection",
        topic: "safety",
        icon: "🛡️",
        title: "Захисні заходи",
        lead: "Установки мають не просто працювати, а захищати людину при пошкодженнях.",
        intro: [
          "Захист будується на поєднанні ізоляції, систем заземлення, ПЗВ, малої напруги та спеціальних режимів живлення.",
          "Теоретичне питання часто формулюють як порівняння PE, TN-S, RCD, SELV або захисного розділення."
        ],
        table: {
          headers: ["Захід", "Суть"],
          rows: [
            ["PE", "Відводить струм пошкодження"],
            ["TN-S", "PE і N окремо по всій мережі"],
            ["RCD / FI", "Відключає при струмі витоку"],
            ["SELV", "Безпечна наднизька напруга"],
            ["Захисне розділення", "Гальванічне відокремлення від мережі"]
          ]
        },
        highlight: "💡 RCD не замінює заземлення та правильну схему мережі, а працює разом із ними."
      },
      {
        id: "impulse-relay",
        topic: "switching",
        icon: "🔌",
        title: "Імпульсна схема зі струмоштовховим реле",
        lead: "Багато точок керування без складної логіки з перемичками.",
        intro: [
          "У такій схемі всі кнопки підключаються паралельно й дають короткий імпульс на бістабільне реле.",
          "Це зручніше для великих об'єктів, де точок керування багато, а прокладати перехресні зв'язки невигідно."
        ],
        table: {
          headers: ["Елемент", "Функція"],
          rows: [
            ["Кнопки", "Подають імпульс"],
            ["Бістабільне реле", "Пам'ятає стан EIN/AUS"],
            ["Навантаження", "Лампа або інший споживач"]
          ]
        },
        highlight: "💡 Головний плюс: масштабування. Додаткова кнопка не ускладнює логіку схеми."
      },
      {
        id: "measurements",
        topic: "measurement",
        icon: "📏",
        title: "Базові вимірювання та закон Ома",
        lead: "Половина типових задач тримається на розумінні U, I, R та P.",
        intro: [
          "Напруга показує різницю потенціалів, струм показує потік заряду, опір описує перешкоду проходженню струму.",
          "Для швидких розрахунків достатньо впевнено користуватись формулами I = U / R, U = I · R та P = U · I."
        ],
        table: {
          headers: ["Величина", "Одиниця", "Позначення"],
          rows: [
            ["Напруга", "вольт", "U"],
            ["Струм", "ампер", "I"],
            ["Опір", "ом", "R"],
            ["Потужність", "ват", "P"]
          ]
        },
        highlight: "💡 Якщо не знаєш, з чого почати задачу, спочатку випиши, що дано, і зведи все до стандартних одиниць."
      }
    ],
    flashcards: [
      { id: "fc-1", topic: "safety", term: "Від якої сили струму можлива фібриляція шлуночків?", def: "Приблизно від 50 до 80 мА. Це вже смертельно небезпечний діапазон." },
      { id: "fc-2", topic: "switching", term: "Чим економна прохідна схема відрізняється від звичайної?", def: "Вона використовує три провідники замість чотирьох, бо одна перемичка не потрібна." },
      { id: "fc-3", topic: "switching", term: "З чого складається перехресна схема?", def: "З двох прохідних вимикачів на краях і одного або кількох перехресних посередині." },
      { id: "fc-4", topic: "safety", term: "Що робить RCD / FI?", def: "Порівнює струми в L і N та відключає коло, якщо є небезпечна різниця." },
      { id: "fc-5", topic: "switching", term: "Що таке імпульсна схема?", def: "Схема з бістабільним реле, де кожен імпульс змінює стан виходу." },
      { id: "fc-6", topic: "measurement", term: "Який опір тіла часто беруть у спрощених розрахунках?", def: "Близько 1000–2000 Ω для сухої людини." },
      { id: "fc-7", topic: "safety", term: "Для чого потрібен провідник PE?", def: "Щоб струм пошкодження пішов у землю, а не через людину." },
      { id: "fc-8", topic: "switching", term: "Чому імпульсна схема краща для багатьох точок?", def: "Бо всі кнопки просто підключаються паралельно." },
      { id: "fc-9", topic: "measurement", term: "Що показує закон Ома?", def: "Зв'язок між напругою, струмом і опором: I = U / R." },
      { id: "fc-10", topic: "safety", term: "Що означає SELV?", def: "Безпечна наднизька напруга, яка зменшує ризик небезпечного дотику." },
      { id: "fc-11", topic: "measurement", term: "Що означає формула P = I^2 * R?", def: "Що потужність втрат на опорі росте з квадратом струму." },
      { id: "fc-12", topic: "safety", term: "Чому волога шкіра підвищує ризик ураження?", def: "Бо зменшується опір тіла і через людину може пройти більший струм." }
    ],
    practiceProblems: [
      { id: "pp-1", topic: "measurement", prompt: "Обчисли струм при U = 230 V і R = 1000 Ω. Введи значення в амперах.", answer: 0.23, tolerance: 0.005, explanation: "I = U / R = 230 / 1000 = 0,23 A." },
      { id: "pp-2", topic: "measurement", prompt: "Через провідник тече 2 A при опорі 12 Ω. Яка напруга на ньому?", answer: 24, tolerance: 0.2, explanation: "U = I · R = 2 · 12 = 24 V." },
      { id: "pp-3", topic: "measurement", prompt: "При U = 24 V і I = 3 A знайди потужність навантаження у ватах.", answer: 72, tolerance: 0.2, explanation: "P = U · I = 24 · 3 = 72 W." },
      { id: "pp-4", topic: "switching", prompt: "Скільки перехресних вимикачів потрібно для 5 точок керування однією лампою?", answer: 3, tolerance: 0, explanation: "Потрібні 2 прохідні на краях і 3 перехресні посередині." },
      { id: "pp-5", topic: "safety", prompt: "RCD спрацьовує при 30 мА. Введи це значення в амперах.", answer: 0.03, tolerance: 0.001, explanation: "30 мА = 0,03 A." },
      { id: "pp-6", topic: "switching", prompt: "Скільки провідників використовує економна прохідна схема між точками керування?", answer: 3, tolerance: 0, explanation: "Назва схеми і означає економію до трьох провідників." },
      { id: "pp-7", topic: "measurement", prompt: "Знайди опір при U = 230 V та I = 5 A. Введи значення в омах.", answer: 46, tolerance: 0.3, explanation: "R = U / I = 230 / 5 = 46 Ω." },
      { id: "pp-8", topic: "safety", prompt: "Струм витоку 18 мА, поріг ПЗВ 30 мА. Введи 1 якщо ПЗВ має спрацювати, або 0 якщо ні.", answer: 0, tolerance: 0, explanation: "18 мА менше порогу 30 мА, тому звичайне ПЗВ не повинно спрацювати." }
    ],
    quizData: [
      { id: "qq-1", topic: "safety", q: "Від якої сили струму вже можлива фібриляція шлуночків?", opts: ["10 мА", "50 мА", "150 мА", "300 мА"], correct: 1, explanation: "Діапазон 50–80 мА вже критичний для серця." },
      { id: "qq-2", topic: "switching", q: "Скільки провідників потребує економна прохідна схема?", opts: ["2", "3", "4", "5"], correct: 1, explanation: "У ній зекономлений один провідник порівняно зі звичайною прохідною схемою." },
      { id: "qq-3", topic: "switching", q: "Який апарат стоїть між двома прохідними вимикачами?", opts: ["Кнопка", "Перехресний вимикач", "Автомат", "Контактор"], correct: 1, explanation: "Саме перехресний вимикач працює посередині схеми." },
      { id: "qq-4", topic: "safety", q: "Коли спрацьовує ПЗВ / RCD для захисту людини?", opts: ["При перенапрузі", "При різниці струмів приблизно від 30 мА", "При нагріві", "При будь-якому струмі 1 А"], correct: 1, explanation: "Типовий рівень персонального захисту становить 30 мА." },
      { id: "qq-5", topic: "switching", q: "Що є центральним елементом імпульсної схеми?", opts: ["Трансформатор", "Бістабільне реле", "Димер", "Термореле"], correct: 1, explanation: "Саме реле перемикає стан при кожному імпульсі." },
      { id: "qq-6", topic: "safety", q: "Який захід означає безпечну наднизьку напругу?", opts: ["TN-S", "RCD", "SELV", "PE"], correct: 2, explanation: "SELV = Safe Extra Low Voltage." },
      { id: "qq-7", topic: "measurement", q: "Яка формула виражає закон Ома для струму?", opts: ["I = U / R", "I = U · R", "R = U · I", "P = U / I"], correct: 0, explanation: "Струм дорівнює напрузі, поділеній на опір." },
      { id: "qq-8", topic: "switching", q: "Як підключаються кнопки в імпульсній схемі?", opts: ["Послідовно", "Паралельно", "Через перехресні вимикачі", "Через димер"], correct: 1, explanation: "Всі кнопки подають той самий імпульс на реле і тому підключаються паралельно." },
      { id: "qq-9", topic: "safety", q: "Для чого потрібен провідник PE?", opts: ["Для збільшення напруги", "Для відведення струму пошкодження", "Для вимірювання струму", "Для керування освітленням"], correct: 1, explanation: "PE створює безпечний шлях для струму пошкодження." },
      { id: "qq-10", topic: "measurement", q: "Яка потужність при U = 12 V та I = 2 A?", opts: ["6 W", "12 W", "24 W", "48 W"], correct: 2, explanation: "P = U · I = 12 · 2 = 24 W." },
      { id: "qq-11", topic: "switching", q: "Скільки перехресних вимикачів потрібно для 4 точок керування?", opts: ["1", "2", "3", "4"], correct: 1, explanation: "На краях 2 прохідні, посередині 2 перехресні." },
      { id: "qq-12", topic: "safety", q: "Що небезпечніше для людини: лише висока напруга чи струм через тіло?", opts: ["Лише напруга", "Насамперед струм через тіло", "Тільки опір", "Тільки потужність"], correct: 1, explanation: "Критичний фактор ураження людини це сила струму через тіло." },
      { id: "qq-13", topic: "measurement", q: "Який опір при U = 230 V та I = 5 A?", opts: ["23 Ω", "46 Ω", "115 Ω", "230 Ω"], correct: 1, explanation: "R = U / I = 230 / 5 = 46 Ω." },
      { id: "qq-14", topic: "switching", q: "Які вимикачі стоять на краях перехресної схеми?", opts: ["Два прохідні вимикачі", "Два перехресні вимикачі", "Два автомати", "Два димери"], correct: 0, explanation: "На краях ставлять саме два прохідні вимикачі, а перехресні розташовують між ними." },
      { id: "qq-15", topic: "safety", q: "Що треба зробити перед роботою у щитку?", opts: ["Знеструмити коло і перевірити відсутність напруги", "Одягнути рукавиці та працювати під напругою", "Вимкнути лише освітлення в кімнаті", "Торкнутися провідника тильною стороною руки"], correct: 0, explanation: "Базова безпечна послідовність: відключити живлення, перевірити відсутність напруги, зафіксувати стан." },
      { id: "qq-16", topic: "measurement", q: "Як зміниться струм при незмінному опорі, якщо напругу подвоїти?", opts: ["Подвоїться", "Зменшиться вдвічі", "Не зміниться", "Зросте в чотири рази"], correct: 0, explanation: "За законом Ома I = U / R, отже при сталому R подвоєння U подвоює I." }
    ],
    checklistItems: [
      "Я знаю діапазони струму та їх фізіологічну дію на організм.",
      "Я можу пояснити, чому 50 мА вже смертельно небезпечні.",
      "Я розумію різницю між звичайною та економною прохідною схемою.",
      "Я знаю будову перехресної схеми.",
      "Я можу пояснити принцип імпульсної схеми.",
      "Я знаю, як працює RCD / FI.",
      "Я розрізняю PE, TN-S, SELV і захисне розділення.",
      "Я впевнено користуюсь законом Ома.",
      "Я вмію знаходити потужність через U та I.",
      "Я можу сказати, скільки перехресних вимикачів потрібно для N точок.",
      "Я впізнаю типові контрольні питання по захисту.",
      "Я готовий пройти екзаменаційний режим без підказок."
    ]
  },
  de: {
    metaTitle: "Electro Study Lab | Kontrollvorbereitung",
    htmlLang: "de",
    heroKicker: "Lernlabor für Elektrotechnik",
    badge: "⚡ Electro Study Lab",
    titleMain: "Professionelle",
    titleAccent: "Vorbereitung",
    subtitle: "Theorie, Flashcards, Rechenaufgaben, Quizvarianten, Prüfungsmodus, Statistik und Import eigener Themen in einer statischen Lernapp.",
    progressHeading: "Gesamtfortschritt",
    progressTemplate: "{done} von {total} Lernschritten erledigt",
    completionTemplate: "{pct}%",
    metricChecklistLabel: "Checkliste",
    metricFlashcardsLabel: "Karten",
    metricPracticeLabel: "Aufgaben",
    metricQuizLabel: "Quiz",
    metricExamLabel: "Prüfung",
    metricAccuracyLabel: "Trefferquote",
    topicLabels: {
      safety: "Sicherheit",
      switching: "Schaltungen",
      measurement: "Berechnungen"
    },
    typeLabels: {
      theory: "Theorie",
      flashcards: "Karte",
      practice: "Aufgabe",
      quiz: "Frage",
      checklist: "Checkliste"
    },
    common: {
      open: "Öffnen",
      repeat: "Wiederholen",
      start: "Starten",
      restart: "Neu starten",
      selected: "Gewählt",
      allTopics: "Alle Themen",
      recommended: "Empfohlen",
      skipToContent: "Zum Hauptinhalt springen"
    },
    keyboardHint: "Shortcuts: 1-8 für Bereiche, Pfeile für Karten, Leertaste zum Umdrehen, A-D für Antworten.",
    importHint: "Eigene Themen können per JSON-Paket importiert werden.",
    offlineHint: "Nach der Installation kann die App auch offline laufen.",
    status: {
      online: "Online",
      offline: "Offline",
      updateReady: "Update verfügbar",
      updateNow: "App aktualisieren"
    },
    spotlightHeading: "Fokus auf Schwachstellen",
    reviewQueueLabel: "Zu wiederholen",
    sessionsLabel: "Sitzungen",
    reviewNow: "Schwächen trainieren",
    generateVariantHero: "Neues Quiz-Set",
    installLabel: "App installieren",
    copyLinkLabel: "Link kopieren",
    printLabel: "Druck / PDF",
    resetAll: "Alles zurücksetzen",
    searchPlaceholder: "Suche in Theorie, Karten, Quiz und Aufgaben...",
    clearSearch: "Leeren",
    tabs: {
      overview: "Übersicht",
      theory: "Theorie",
      flashcards: "Karten",
      practice: "Aufgaben",
      quiz: "Quiz",
      exam: "Prüfung",
      checklist: "Checkliste",
      analytics: "Analyse"
    },
    sections: {
      overview: {
        title: "Lernzentrale",
        lead: "Hier siehst du Suchergebnisse, Wiederholungsqueue, Import eigener Themen und die wichtigsten Schnellaktionen."
      },
      theory: {
        title: "Theorie",
        lead: "Kompakte, aber vollständige Themenkarten mit Tabellen, interaktiven Schaltbildern und prüfungsrelevanten Hinweisen."
      },
      flashcards: {
        title: "Flashcards",
        lead: "Begriffe aktiv abrufen, Karten drehen und gezielt die Lücken schließen, die noch nicht automatisch sitzen."
      },
      practice: {
        title: "Rechenaufgaben",
        lead: "Training mit Formeln, Schaltungslogik und sofortiger Prüfung inklusive Erklärung."
      },
      quiz: {
        title: "Trainingsquiz",
        lead: "Entweder den kompletten Fragenpool bearbeiten oder einen neuen Zufallsvariant erzeugen."
      },
      exam: {
        title: "Prüfungsmodus",
        lead: "Mit Timer, nur einem Durchlauf und Ergebnis erst nach dem Ende."
      },
      checklist: {
        title: "Persönliche Checkliste",
        lead: "Nur das abhaken, was du ohne Hilfe erklären kannst."
      },
      analytics: {
        title: "Lernanalyse",
        lead: "Durchläufe, Durchschnittswerte, Verlauf und deine aktuelle Risikozone."
      }
    },
    overview: {
      searchTitle: "Schnellsuche",
      searchLead: "Die Suche läuft gleichzeitig über alle Materialarten.",
      reviewTitle: "Intelligente Wiederholung",
      reviewLead: "Falsche Fragen und schwache Themen landen automatisch in der Wiederholungsschlange.",
      resourceTitle: "Inhaltspakete",
      resourceLead: "Zusätzliche Themen per JSON importieren oder die Vorlage herunterladen.",
      importPack: "Paket importieren",
      downloadTemplate: "Vorlage laden",
      clearCustomPack: "Eigenes Paket entfernen",
      resourceNote: "Importierte Inhalte werden lokal zu den Basisthemen hinzugefügt.",
      nextStepTitle: "Nächster Schritt",
      nextStepLead: "Das System schlägt auf Basis deines Fortschritts den sinnvollsten nächsten Schritt vor.",
      backupTitle: "Sicherung",
      backupLead: "Lokalen Fortschritt exportieren oder aus einer JSON-Datei wiederherstellen.",
      exportProgress: "Fortschritt exportieren",
      importProgress: "Fortschritt importieren",
      backupNote: "Die Sicherung enthält Fortschritt, Statistik und dein eigenes Themenpaket.",
      achievementsTitle: "Erfolge",
      achievementsLead: "Kleine Meilensteine, die zeigen, dass dein Lernen systematisch vorangeht.",
      emptySearch: "Leere Suche. Gib ein Thema, eine Formel oder einen Schaltungsbegriff ein.",
      emptyReview: "Noch keine Wiederholungseinträge. Sie entstehen nach Fehlern im Quiz oder Prüfungsmodus.",
      noResults: "Zu dieser Suche wurde nichts gefunden."
    },
    flashcardsUi: {
      shuffle: "Mischen",
      previous: "← Zurück",
      next: "Weiter →",
      flip: "Umdrehen",
      frontHint: "Frage / Begriff",
      backHint: "Antwort / Erklärung",
      counter: "Karte {current} von {total}",
      status: "{seen} von {total} Karten angesehen"
    },
    practice: {
      reset: "Aufgaben zurücksetzen",
      check: "Prüfen",
      checked: "Geprüft",
      placeholder: "Antwort eingeben",
      solvedLabel: "{done} von {total} gelöst",
      correct: "Richtig. {text}",
      wrong: "Noch nicht. {text}",
      toleranceNote: "Dezimalzahlen können mit Punkt oder Komma eingegeben werden."
    },
    quiz: {
      generateVariant: "Variante erzeugen",
      reset: "Quiz zurücksetzen",
      reviewMode: "Wiederholungsmodus: Dieser Satz enthält nur Schwachstellen.",
      variantMode: "Zufallsvariante: Ein neuer Fragensatz wurde erstellt.",
      defaultMode: "Kompletter Fragenpool.",
      questionLabel: "Frage {current} von {total}",
      correct: "✓ Richtig! {text}",
      wrong: "✗ Falsch. {text}",
      summaryTitle: "Quiz-Auswertung",
      summaryLabel: "Ergebnis",
      reviewTitle: "Das solltest du wiederholen",
      reviewEmpty: "Keine Fehler. Diesen Block kannst du abhaken.",
      messages: {
        excellent: "Fast fehlerfrei. Das Niveau ist bereits sehr nah an der Kontrolle.",
        good: "Starkes Ergebnis, aber ein paar Themen solltest du kurz wiederholen.",
        retry: "Es gibt Schwächen. Erst wiederholen, dann den nächsten Variant starten."
      }
    },
    exam: {
      introTitle: "Kontrollsimulation",
      introCopy: "Der Modus erstellt eine Zufallsvariante, startet den Timer und zeigt die richtigen Antworten erst am Ende.",
      settingsTitle: "Einstellungen",
      durationLabel: "Dauer",
      questionCountLabel: "Fragenanzahl",
      start: "Prüfung starten",
      submit: "Jetzt abgeben",
      runningLabel: "Verbleibende Zeit",
      finishedTitle: "Prüfung beendet",
      resultLabel: "Ergebnis",
      retry: "Neu starten",
      empty: "Die Prüfung wurde noch nicht gestartet.",
      timeoutMessage: "Die Zeit ist abgelaufen. Das Ergebnis wurde automatisch gespeichert."
    },
    checklist: {
      reset: "Zurücksetzen",
      complete: "Alles abhaken",
      summary: "{done} von {total} erledigt. Die Checkliste wird lokal gespeichert."
    },
    analytics: {
      statsTitle: "Kennzahlen",
      statsLead: "Alle Werte basieren auf deiner lokalen Verlaufshistorie.",
      historyTitle: "Letzte Durchläufe",
      historyLead: "Zuletzt gespeicherte Quiz- und Prüfungsversuche.",
      topicsTitle: "Themenbeherrschung",
      topicsLead: "Hier siehst du, welche Themen schon stark sind und wo noch Reserve ist.",
      statLabels: {
        quizRuns: "Quizdurchläufe",
        examRuns: "Prüfungsdurchläufe",
        bestQuiz: "Bestes Quiz",
        bestExam: "Beste Prüfung",
        avgQuiz: "Quizdurchschnitt",
        avgExam: "Prüfungsdurchschnitt",
        practice: "Gelöste Aufgaben",
        streak: "Tagesserie"
      },
      emptyHistory: "Die Verlaufshistorie ist noch leer.",
      emptyAchievements: "Noch keine Erfolge. Sie werden automatisch beim Lernen freigeschaltet."
    },
    onboarding: {
      title: "Schnellstart",
      copy: "Die App ist einsatzbereit. Starte direkt mit dem empfohlenen Schritt oder folge diesem kurzen Ablauf.",
      steps: [
        "Thema über Filter oder Suche auswählen.",
        "Theorie und Flashcards durchgehen.",
        "Aufgaben, Quiz und Prüfung absolvieren, um volle Analyse zu erhalten."
      ],
      start: "Starten",
      close: "Später"
    },
    achievements: {
      firstQuiz: "Erstes abgeschlossenes Quiz",
      firstExam: "Erste abgeschlossene Prüfung",
      fullChecklist: "Komplette Checkliste erledigt",
      fullFlashcards: "Alle Flashcards gesehen",
      fullPractice: "Alle Aufgaben gelöst"
    },
    importMessages: {
      success: "Das Paket wurde importiert und zum Basisinhalt hinzugefügt.",
      cleared: "Das eigene Paket wurde entfernt.",
      invalid: "Die Datei sieht nicht wie ein gültiges Inhaltspaket aus.",
      backupImported: "Die Fortschrittssicherung wurde erfolgreich wiederhergestellt.",
      backupInvalid: "Die Sicherungsdatei hat kein gültiges Format.",
      tooLarge: "Die Datei ist zu groß für den Import. Maximum 1 MB."
    },
    toasts: {
      saved: "Änderungen wurden lokal gespeichert.",
      installed: "Die App kann jetzt als PWA gestartet werden.",
      achievement: "Neuer Erfolg freigeschaltet",
      online: "Die Verbindung ist wieder da.",
      offline: "Keine Verbindung. Lokale Daten werden weiter genutzt.",
      updateReady: "Eine neue Version ist bereit.",
      updated: "Die App wurde aktualisiert.",
      linkCopied: "Link zum aktuellen Lernstand wurde kopiert.",
      examRestored: "Die laufende Prüfung wurde nach dem Neuladen wiederhergestellt.",
      copyFailed: "Der Link konnte nicht automatisch kopiert werden.",
      reviewFocus: "Wiederholung wurde automatisch auf das Thema fokussiert: {topic}."
    },
    alerts: {
      resetAll: "Wirklich Fortschritt, Verlauf und eigenes Paket komplett löschen?",
      resetBase: "Wirklich nur den Fortschritt zurücksetzen?"
    },
    diagrams: {
      phase: "L",
      neutral: "N",
      lamp: "Lampe",
      sparLabel: "3 Leiter",
      crossLabel: "Kreuzschalter"
    },
    theory: [
      {
        id: "body-current",
        topic: "safety",
        icon: "⚡",
        title: "Wirkung des Stromes auf den Körper",
        lead: "Entscheidend für die Gefährdung ist vor allem die Stromstärke und nicht die Spannung allein.",
        intro: [
          "Wenn Strom durch den Körper fließt, hängen die Folgen von <strong>Stromstärke</strong>, Stromweg, Einwirkdauer und Hautzustand ab.",
          "Besonders kritisch ist der Weg durch den Brustbereich, also Hand-Hand oder Hand-Fuß, weil Herz und Atemmuskulatur betroffen sein können."
        ],
        table: {
          headers: ["Strom", "Folge"],
          rows: [
            ["0,5–1 mA", "Wahrnehmungsschwelle"],
            ["1–15 mA", "Muskelkrämpfe, Loslassschwelle"],
            ["15–50 mA", "Starke Krämpfe, Atemstillstand möglich"],
            ["50–80 mA", "Kammerflimmern"],
            [">300 mA", "Verbrennungen und Herzstillstand"]
          ]
        },
        danger: "⚠️ Schon 50 mA können lebensgefährlich sein.",
        highlight: "💡 Nach dem Ohmschen Gesetz können bei 230 V und 1000 Ω ungefähr 230 mA fließen.",
        diagram: null
      },
      {
        id: "spar-switch",
        topic: "switching",
        icon: "💡",
        title: "Sparwechselschaltung",
        lead: "Eine Lampe von zwei Stellen schalten und dabei einen Leiter einsparen.",
        intro: [
          "Die Sparwechselschaltung spart einen Leiter ein, wenn der Neutralleiter gemeinsam genutzt wird.",
          "In der Kontrolle sollte man nicht nur den Begriff kennen, sondern sauber erklären können, wo Phase und Neutralleiter verlaufen."
        ],
        highlight: "💡 Vorteil: weniger Material. Nachteil: nicht universell einsetzbar und nur sauber mit korrekter Verdrahtung sinnvoll.",
        diagram: {
          type: "spar",
          hotspots: [
            { label: "Phase L", text: "Die Phase geht auf den ersten Schalter und entscheidet über die Versorgung der Lampe." },
            { label: "Schalterverbindung", text: "Zwischen den Schaltern bleibt nur die nötige Mindestverdrahtung erhalten." },
            { label: "Neutralleiter N", text: "Der Neutralleiter wird gemeinsam genutzt und direkt zur Lampe geführt." }
          ]
        }
      },
      {
        id: "cross-switch",
        topic: "switching",
        icon: "🔀",
        title: "Kreuzschaltung",
        lead: "Eine Lampe von drei oder mehr Stellen bedienen.",
        intro: [
          "Der Grundaufbau lautet: Wechselschalter – Kreuzschalter – Wechselschalter. Für jede weitere Stelle kommt ein zusätzlicher Kreuzschalter hinzu.",
          "Typische Prüfungsfrage: Welches Gerät sitzt in der Mitte und wie viele davon braucht man für N Schaltstellen?"
        ],
        table: {
          headers: ["Bauteil", "Rolle"],
          rows: [
            ["Wechselschalter", "Anfang und Ende der Schaltung"],
            ["Kreuzschalter", "Kreuzt die Brückenleiter"],
            ["Lampe", "Verbraucher"]
          ]
        },
        highlight: "💡 Für 4 Schaltstellen braucht man 2 Wechselschalter und 2 Kreuzschalter.",
        diagram: {
          type: "cross",
          hotspots: [
            { label: "WS1", text: "Der erste Wechselschalter legt einen von zwei möglichen Wegen der Phase fest." },
            { label: "KS", text: "Der Kreuzschalter vertauscht die Brückenleiter und ändert so den Schaltzustand." },
            { label: "WS2", text: "Der letzte Wechselschalter entscheidet, ob die Phase zur Lampe durchgeschaltet wird." }
          ]
        }
      },
      {
        id: "protection",
        topic: "safety",
        icon: "🛡️",
        title: "Schutzmaßnahmen",
        lead: "Eine Anlage muss nicht nur funktionieren, sondern Personen auch im Fehlerfall schützen.",
        intro: [
          "Schutz entsteht durch das Zusammenspiel von Isolierung, Erdungssystemen, RCD, Kleinspannung und Schutztrennung.",
          "In der Theorie werden PE, TN-S, RCD, SELV und Schutztrennung häufig miteinander verglichen."
        ],
        table: {
          headers: ["Maßnahme", "Bedeutung"],
          rows: [
            ["PE", "Leitet Fehlerstrom sicher ab"],
            ["TN-S", "PE und N im ganzen Netz getrennt"],
            ["RCD / FI", "Schaltet bei Fehlerstrom ab"],
            ["SELV", "Sichere Kleinspannung"],
            ["Schutztrennung", "Galvanische Trennung vom Netz"]
          ]
        },
        highlight: "💡 Ein RCD ersetzt weder Erdung noch eine saubere Netzstruktur. Er ergänzt diese Maßnahmen."
      },
      {
        id: "impulse-relay",
        topic: "switching",
        icon: "🔌",
        title: "Stromstoßschaltung",
        lead: "Viele Schaltstellen ohne komplizierte Kreuzverdrahtung.",
        intro: [
          "Alle Taster werden parallel geschaltet und geben einen kurzen Impuls an ein bistabiles Relais.",
          "Gerade bei größeren Anlagen ist diese Lösung oft übersichtlicher als die klassische Kreuzschaltung."
        ],
        table: {
          headers: ["Bauteil", "Aufgabe"],
          rows: [
            ["Taster", "Geben den Impuls"],
            ["Bistabiles Relais", "Speichert den Zustand EIN/AUS"],
            ["Verbraucher", "Lampe oder andere Last"]
          ]
        },
        highlight: "💡 Der große Vorteil ist die einfache Erweiterung um weitere Taster."
      },
      {
        id: "measurements",
        topic: "measurement",
        icon: "📏",
        title: "Grundgrößen und Ohmsches Gesetz",
        lead: "Viele Prüfungsaufgaben basieren direkt auf U, I, R und P.",
        intro: [
          "Spannung beschreibt die Potenzialdifferenz, Strom den Ladungsfluss und Widerstand die Behinderung des Stromes.",
          "Für schnelle Überschlagsrechnungen reichen meist I = U / R, U = I · R und P = U · I."
        ],
        table: {
          headers: ["Größe", "Einheit", "Symbol"],
          rows: [
            ["Spannung", "Volt", "U"],
            ["Strom", "Ampere", "I"],
            ["Widerstand", "Ohm", "R"],
            ["Leistung", "Watt", "P"]
          ]
        },
        highlight: "💡 Wenn eine Aufgabe unklar wirkt, zuerst alle gegebenen Werte sauber notieren und in Standardgrößen umrechnen."
      }
    ],
    flashcards: [
      { id: "fc-1", topic: "safety", term: "Ab welcher Stromstärke ist Kammerflimmern möglich?", def: "Etwa ab 50 bis 80 mA. Dieser Bereich ist bereits lebensgefährlich." },
      { id: "fc-2", topic: "switching", term: "Was ist der Unterschied zwischen normaler und Sparwechselschaltung?", def: "Die Sparwechselschaltung arbeitet mit drei statt vier Leitern." },
      { id: "fc-3", topic: "switching", term: "Woraus besteht eine Kreuzschaltung?", def: "Aus zwei Wechselschaltern an den Enden und einem oder mehreren Kreuzschaltern dazwischen." },
      { id: "fc-4", topic: "safety", term: "Was macht ein RCD / FI?", def: "Er vergleicht die Ströme in L und N und schaltet bei einer gefährlichen Differenz ab." },
      { id: "fc-5", topic: "switching", term: "Was ist eine Stromstoßschaltung?", def: "Eine Schaltung mit bistabilem Relais, bei der jeder Impuls den Zustand umschaltet." },
      { id: "fc-6", topic: "measurement", term: "Welcher Körperwiderstand wird oft überschlägig verwendet?", def: "Etwa 1000 bis 2000 Ω bei trockener Haut." },
      { id: "fc-7", topic: "safety", term: "Wozu dient der Schutzleiter PE?", def: "Damit der Fehlerstrom sicher abfließen kann und nicht durch den Menschen geht." },
      { id: "fc-8", topic: "switching", term: "Warum ist die Stromstoßschaltung für viele Stellen praktisch?", def: "Weil alle Taster einfach parallel geschaltet werden." },
      { id: "fc-9", topic: "measurement", term: "Was sagt das Ohmsche Gesetz?", def: "Es beschreibt den Zusammenhang von Spannung, Strom und Widerstand: I = U / R." },
      { id: "fc-10", topic: "safety", term: "Wofür steht SELV?", def: "Für sichere Kleinspannung mit deutlich reduziertem Berührungsrisiko." },
      { id: "fc-11", topic: "measurement", term: "Was bedeutet die Formel P = I^2 * R?", def: "Dass die Verlustleistung am Widerstand mit dem Quadrat des Stroms steigt." },
      { id: "fc-12", topic: "safety", term: "Warum erhöht feuchte Haut das Stromrisiko?", def: "Weil der Körperwiderstand sinkt und dadurch mehr Strom fließen kann." }
    ],
    practiceProblems: [
      { id: "pp-1", topic: "measurement", prompt: "Berechne den Strom bei U = 230 V und R = 1000 Ω. Gib das Ergebnis in Ampere an.", answer: 0.23, tolerance: 0.005, explanation: "I = U / R = 230 / 1000 = 0,23 A." },
      { id: "pp-2", topic: "measurement", prompt: "Durch einen Widerstand fließen 2 A bei 12 Ω. Wie hoch ist die Spannung?", answer: 24, tolerance: 0.2, explanation: "U = I · R = 2 · 12 = 24 V." },
      { id: "pp-3", topic: "measurement", prompt: "Bei U = 24 V und I = 3 A: Wie groß ist die Leistung in Watt?", answer: 72, tolerance: 0.2, explanation: "P = U · I = 24 · 3 = 72 W." },
      { id: "pp-4", topic: "switching", prompt: "Wie viele Kreuzschalter braucht man für 5 Schaltstellen einer Lampe?", answer: 3, tolerance: 0, explanation: "An den Enden sitzen 2 Wechselschalter, dazwischen 3 Kreuzschalter." },
      { id: "pp-5", topic: "safety", prompt: "Ein RCD löst bei 30 mA aus. Gib diesen Wert in Ampere an.", answer: 0.03, tolerance: 0.001, explanation: "30 mA entsprechen 0,03 A." },
      { id: "pp-6", topic: "switching", prompt: "Wie viele Leiter werden in einer Sparwechselschaltung zwischen den Stellen benötigt?", answer: 3, tolerance: 0, explanation: "Genau darin liegt die Materialeinsparung der Sparwechselschaltung." },
      { id: "pp-7", topic: "measurement", prompt: "Bestimme den Widerstand bei U = 230 V und I = 5 A. Gib das Ergebnis in Ohm an.", answer: 46, tolerance: 0.3, explanation: "R = U / I = 230 / 5 = 46 Ω." },
      { id: "pp-8", topic: "safety", prompt: "Leckstrom 18 mA, RCD-Schwelle 30 mA. Gib 1 ein, wenn der RCD auslösen muss, sonst 0.", answer: 0, tolerance: 0, explanation: "18 mA liegt unter 30 mA, daher sollte ein 30-mA-RCD nicht auslösen." }
    ],
    quizData: [
      { id: "qq-1", topic: "safety", q: "Ab welcher Stromstärke ist Kammerflimmern bereits möglich?", opts: ["10 mA", "50 mA", "150 mA", "300 mA"], correct: 1, explanation: "Schon etwa 50 bis 80 mA können Kammerflimmern auslösen." },
      { id: "qq-2", topic: "switching", q: "Wie viele Leiter benötigt eine Sparwechselschaltung?", opts: ["2", "3", "4", "5"], correct: 1, explanation: "Die Sparwechselschaltung spart genau einen Leiter ein." },
      { id: "qq-3", topic: "switching", q: "Welches Gerät sitzt zwischen zwei Wechselschaltern?", opts: ["Taster", "Kreuzschalter", "Automat", "Schütz"], correct: 1, explanation: "Der Kreuzschalter sitzt in der Mitte der Schaltung." },
      { id: "qq-4", topic: "safety", q: "Wann löst ein RCD / FI zum Personenschutz typischerweise aus?", opts: ["Bei Überspannung", "Bei einer Stromdifferenz ab etwa 30 mA", "Bei Erwärmung", "Bei genau 1 A"], correct: 1, explanation: "Der übliche Personenschutz-RCD löst bei 30 mA aus." },
      { id: "qq-5", topic: "switching", q: "Was ist das Kernbauteil der Stromstoßschaltung?", opts: ["Transformator", "Bistabiles Relais", "Dimmer", "Thermorelais"], correct: 1, explanation: "Das bistabile Relais speichert den Schaltzustand." },
      { id: "qq-6", topic: "safety", q: "Welche Schutzmaßnahme steht für sichere Kleinspannung?", opts: ["TN-S", "RCD", "SELV", "PE"], correct: 2, explanation: "SELV bedeutet Safe Extra Low Voltage." },
      { id: "qq-7", topic: "measurement", q: "Welche Formel beschreibt das Ohmsche Gesetz für den Strom?", opts: ["I = U / R", "I = U · R", "R = U · I", "P = U / I"], correct: 0, explanation: "Der Strom ergibt sich aus Spannung geteilt durch Widerstand." },
      { id: "qq-8", topic: "switching", q: "Wie werden Taster in einer Stromstoßschaltung angeschlossen?", opts: ["In Reihe", "Parallel", "Über Kreuzschalter", "Über Dimmer"], correct: 1, explanation: "Alle Taster senden denselben Impuls und werden deshalb parallel geschaltet." },
      { id: "qq-9", topic: "safety", q: "Wozu dient der Schutzleiter PE?", opts: ["Zum Erhöhen der Spannung", "Zum Ableiten des Fehlerstromes", "Zum Messen des Stromes", "Zum Schalten des Lichtes"], correct: 1, explanation: "PE schafft einen sicheren Weg für den Fehlerstrom." },
      { id: "qq-10", topic: "measurement", q: "Welche Leistung ergibt sich bei U = 12 V und I = 2 A?", opts: ["6 W", "12 W", "24 W", "48 W"], correct: 2, explanation: "P = U · I = 12 · 2 = 24 W." },
      { id: "qq-11", topic: "switching", q: "Wie viele Kreuzschalter braucht man für 4 Schaltstellen?", opts: ["1", "2", "3", "4"], correct: 1, explanation: "Für vier Stellen braucht man zwei Wechselschalter und zwei Kreuzschalter." },
      { id: "qq-12", topic: "safety", q: "Was ist für die Gefährdung einer Person entscheidender?", opts: ["Nur die Spannung", "Vor allem der Strom durch den Körper", "Nur der Widerstand", "Nur die Leistung"], correct: 1, explanation: "Die eigentliche Gefährdung hängt primär vom Strom durch den Körper ab." },
      { id: "qq-13", topic: "measurement", q: "Welcher Widerstand ergibt sich bei U = 230 V und I = 5 A?", opts: ["23 Ω", "46 Ω", "115 Ω", "230 Ω"], correct: 1, explanation: "R = U / I = 230 / 5 = 46 Ω." },
      { id: "qq-14", topic: "switching", q: "Welche Schalter stehen an den Enden einer Kreuzschaltung?", opts: ["Zwei Wechselschalter", "Zwei Kreuzschalter", "Zwei Automaten", "Zwei Dimmer"], correct: 0, explanation: "An den Enden sitzen zwei Wechselschalter, die Kreuzschalter liegen dazwischen." },
      { id: "qq-15", topic: "safety", q: "Was ist vor Arbeiten am Verteiler zwingend?", opts: ["Freischalten und Spannungsfreiheit prüfen", "Nur Handschuhe tragen", "Nur die Raumbeleuchtung ausschalten", "Leiter kurz mit der Hand testen"], correct: 0, explanation: "Erst freischalten, dann Spannungsfreiheit prüfen und gegen Wiedereinschalten sichern." },
      { id: "qq-16", topic: "measurement", q: "Wie ändert sich der Strom bei konstantem Widerstand, wenn die Spannung verdoppelt wird?", opts: ["Er verdoppelt sich", "Er halbiert sich", "Er bleibt gleich", "Er vervierfacht sich"], correct: 0, explanation: "Nach I = U / R führt doppelte Spannung bei gleichem R zu doppeltem Strom." }
    ],
    checklistItems: [
      "Ich kenne die Strombereiche und ihre Wirkung auf den Körper.",
      "Ich kann erklären, warum 50 mA bereits lebensgefährlich sein können.",
      "Ich verstehe den Unterschied zwischen normaler und Sparwechselschaltung.",
      "Ich kenne den Aufbau der Kreuzschaltung.",
      "Ich kann das Prinzip der Stromstoßschaltung erklären.",
      "Ich weiß, wie ein RCD / FI arbeitet.",
      "Ich kann PE, TN-S, SELV und Schutztrennung unterscheiden.",
      "Ich beherrsche das Ohmsche Gesetz sicher.",
      "Ich kann die Leistung über U und I berechnen.",
      "Ich weiß, wie viele Kreuzschalter man für N Schaltstellen braucht.",
      "Ich erkenne typische Kontrollfragen zum Personenschutz.",
      "Ich bin bereit für den Prüfungsmodus ohne Hilfen."
    ]
  }
};

import { escapeHtml, format, formatDate } from "./utils.js";

export function renderWelcomeSteps(steps) {
  return steps.map((step) => `
    <div class="welcome-step">${escapeHtml(step)}</div>
  `).join("");
}

export function renderTopicFilters(filters, activeTopic) {
  return filters.map((filter) => `
    <button
      class="topic-filter-btn ${activeTopic === filter.id ? "active" : ""}"
      type="button"
      data-topic-filter="${filter.id}"
      aria-pressed="${String(activeTopic === filter.id)}"
    >
      ${escapeHtml(filter.label)}
    </button>
  `).join("");
}

export function renderNextStepCard(nextStep, content) {
  return `
    <div class="next-step-card">
      <span class="result-badge">${content.common.recommended}</span>
      <strong class="next-step-title">${escapeHtml(nextStep.title)}</strong>
      <p class="next-step-copy">${escapeHtml(nextStep.copy)}</p>
      <div class="spotlight-actions">
        <button class="action-btn" type="button" data-jump-section="${nextStep.section}">${content.common.open}</button>
      </div>
    </div>
  `;
}

export function renderSearchResults(searchResults, content, hasQuery) {
  if (!hasQuery) {
    return `<div class="empty-state">${content.overview.emptySearch}</div>`;
  }

  if (!searchResults.length) {
    return `<div class="empty-state">${content.overview.noResults}</div>`;
  }

  return `
    <div class="search-results">
      ${searchResults.map((item) => `
        <article class="search-item">
          <div class="history-head">
            <div>
              <span class="result-badge">${content.typeLabels[item.type]}</span>
              <strong>${escapeHtml(item.title)}</strong>
            </div>
            <span class="topic-chip">${item.topic ? (content.topicLabels[item.topic] || item.topic) : content.common.allTopics}</span>
          </div>
          <p class="search-meta">${escapeHtml(item.preview)}</p>
          <div class="spotlight-actions">
            <button class="action-btn ghost" type="button" data-jump-section="${item.section}">${content.common.open}</button>
          </div>
        </article>
      `).join("")}
    </div>
  `;
}

export function renderReviewItem(item, content) {
  return `
    <article class="review-item">
      <div class="history-head">
        <div>
          <span class="result-badge">${content.typeLabels.quiz}</span>
          <strong>${escapeHtml(item.q)}</strong>
        </div>
        <span class="topic-chip">${content.topicLabels[item.topic] || item.topic}</span>
      </div>
      <p class="review-meta">${escapeHtml(item.explanation)}</p>
      <div class="spotlight-actions">
        <button class="action-btn ghost" type="button" data-action="review-now">${content.common.repeat}</button>
      </div>
    </article>
  `;
}

export function renderTheoryCard(card, content, selectedHotspot, activeHotspot) {
  return `
    <article class="theory-card">
      <h3><span class="icon-box">${card.icon}</span>${card.title}</h3>
      <p class="theory-lead">${card.lead}</p>
      ${card.intro.map((paragraph) => `<p>${paragraph}</p>`).join("")}
      ${card.table ? renderTable(card.table) : ""}
      ${card.diagram ? renderDiagram(card, content, selectedHotspot, activeHotspot) : ""}
      ${card.danger ? `<div class="callout-danger">${card.danger}</div>` : ""}
      ${card.highlight ? `<div class="callout">${card.highlight}</div>` : ""}
    </article>
  `;
}

function renderTable(table) {
  return `
    <table class="data-table">
      <thead>
        <tr>${table.headers.map((header) => `<th>${header}</th>`).join("")}</tr>
      </thead>
      <tbody>
        ${table.rows.map((row) => `<tr>${row.map((cell) => `<td>${cell}</td>`).join("")}</tr>`).join("")}
      </tbody>
    </table>
  `;
}

function renderDiagram(card, content, selectedHotspot, activeHotspot) {
  return `
    <div class="diagram-shell">
      ${renderDiagramSvg(card.diagram.type, content)}
      <div class="diagram-hotspots">
        ${card.diagram.hotspots.map((hotspot, index) => `
          <button
            class="diagram-chip ${index === selectedHotspot ? "active" : ""}"
            type="button"
            data-card-id="${card.id}"
            data-hotspot-index="${index}"
          >
            ${escapeHtml(hotspot.label)}
          </button>
        `).join("")}
      </div>
      <div class="diagram-panel">
        <div class="diagram-explain">${escapeHtml(activeHotspot?.text || "")}</div>
      </div>
    </div>
  `;
}

function renderDiagramSvg(type, content) {
  if (type === "spar") {
    return `
      <svg class="diagram-canvas" viewBox="0 0 420 140" aria-hidden="true">
        <text x="18" y="32" fill="#f4b400" font-family="Space Mono" font-size="11">${content.diagrams.phase}</text>
        <line x1="40" y1="28" x2="110" y2="28" stroke="#f4b400" stroke-width="2"></line>
        <rect x="110" y="15" width="68" height="28" rx="6" fill="#18232e" stroke="#2f4359"></rect>
        <text x="144" y="33" fill="#edf2f7" font-family="Sora" font-size="10" text-anchor="middle">S1</text>
        <line x1="178" y1="28" x2="250" y2="28" stroke="#75a8ff" stroke-width="2"></line>
        <line x1="178" y1="64" x2="250" y2="64" stroke="#75a8ff" stroke-width="1.5" stroke-dasharray="4,4"></line>
        <rect x="250" y="15" width="68" height="28" rx="6" fill="#18232e" stroke="#2f4359"></rect>
        <text x="284" y="33" fill="#edf2f7" font-family="Sora" font-size="10" text-anchor="middle">S2</text>
        <line x1="318" y1="28" x2="352" y2="28" stroke="#f4b400" stroke-width="2"></line>
        <circle cx="374" cy="28" r="18" fill="none" stroke="#f4b400" stroke-width="2"></circle>
        <line x1="366" y1="20" x2="382" y2="36" stroke="#f4b400" stroke-width="2"></line>
        <line x1="382" y1="20" x2="366" y2="36" stroke="#f4b400" stroke-width="2"></line>
        <text x="364" y="58" fill="#f4b400" font-family="Space Mono" font-size="9">${content.diagrams.lamp}</text>
        <text x="22" y="112" fill="#91a0b3" font-family="Space Mono" font-size="11">${content.diagrams.neutral}</text>
        <line x1="40" y1="106" x2="396" y2="106" stroke="#91a0b3" stroke-width="2" stroke-dasharray="6,4"></line>
        <text x="210" y="54" fill="#75a8ff" font-family="Space Mono" font-size="9" text-anchor="middle">${content.diagrams.sparLabel}</text>
      </svg>
    `;
  }

  return `
    <svg class="diagram-canvas" viewBox="0 0 420 110" aria-hidden="true">
      <text x="18" y="28" fill="#f4b400" font-family="Space Mono" font-size="11">${content.diagrams.phase}</text>
      <line x1="40" y1="24" x2="92" y2="24" stroke="#f4b400" stroke-width="2"></line>
      <rect x="92" y="11" width="64" height="26" rx="6" fill="#18232e" stroke="#2f4359"></rect>
      <text x="124" y="29" fill="#edf2f7" font-family="Sora" font-size="10" text-anchor="middle">WS1</text>
      <line x1="156" y1="24" x2="196" y2="24" stroke="#75a8ff" stroke-width="2"></line>
      <line x1="156" y1="54" x2="196" y2="54" stroke="#75a8ff" stroke-width="2"></line>
      <rect x="196" y="10" width="70" height="44" rx="6" fill="#18232e" stroke="#ef6c24"></rect>
      <text x="231" y="36" fill="#ef6c24" font-family="Sora" font-size="10" text-anchor="middle">${content.diagrams.crossLabel}</text>
      <line x1="266" y1="24" x2="306" y2="24" stroke="#75a8ff" stroke-width="2"></line>
      <line x1="266" y1="54" x2="306" y2="54" stroke="#75a8ff" stroke-width="2"></line>
      <rect x="306" y="11" width="64" height="26" rx="6" fill="#18232e" stroke="#2f4359"></rect>
      <text x="338" y="29" fill="#edf2f7" font-family="Sora" font-size="10" text-anchor="middle">WS2</text>
      <line x1="370" y1="24" x2="392" y2="24" stroke="#f4b400" stroke-width="2"></line>
      <circle cx="404" cy="24" r="12" fill="none" stroke="#f4b400" stroke-width="2"></circle>
    </svg>
  `;
}

export function renderPracticeProblem(problem, content, value, solved, result) {
  return `
    <article class="practice-card" data-problem-id="${problem.id}">
      <div class="practice-head">
        <div>
          <span class="result-badge">${content.topicLabels[problem.topic] || problem.topic}</span>
          <h3>${escapeHtml(problem.prompt)}</h3>
        </div>
        <span class="topic-chip ${solved ? "active" : ""}">${solved ? content.practice.checked : content.practice.check}</span>
      </div>
      <p class="practice-copy">${content.practice.toleranceNote}</p>
      <div class="practice-controls">
        <input class="practice-input" type="text" value="${escapeHtml(value)}" placeholder="${content.practice.placeholder}" data-problem-input="${problem.id}">
        <button class="action-btn" type="button" data-check-problem="${problem.id}">${content.practice.check}</button>
      </div>
      <div class="feedback ${result ? `show ${result.correct ? "correct" : "wrong"}` : ""}">
        ${result ? escapeHtml(result.message) : ""}
      </div>
    </article>
  `;
}

export function renderQuizModeBanner(modeMessage) {
  return `
    <div class="banner-card">
      <p class="surface-copy">${modeMessage}</p>
    </div>
  `;
}

export function renderQuizCard(question, index, total, content, answer, examMode) {
  const isAnswered = answer !== undefined;
  const isCorrect = Number(answer) === question.correct;
  const feedbackMessage = isAnswered
    ? format(isCorrect ? content.quiz.correct : content.quiz.wrong, { text: question.explanation })
    : "";

  return `
    <article class="${examMode ? "quiz-card exam-question" : "quiz-card"}">
      <div class="quiz-head">
        <div>
          <div class="quiz-question-meta">${format(content.quiz.questionLabel, { current: index + 1, total })}</div>
          <div class="quiz-question">${question.q}</div>
        </div>
        <span class="topic-chip">${content.topicLabels[question.topic] || question.topic}</span>
      </div>
      <div class="quiz-options">
        ${question.opts.map((option, optionIndex) => {
          const classes = ["quiz-option"];

          if (examMode) {
            if (Number(answer) === optionIndex) {
              classes.push("selected");
            }
          } else if (isAnswered) {
            classes.push("answered");

            if (optionIndex === Number(answer) && optionIndex === question.correct) {
              classes.push("correct");
            } else if (optionIndex === Number(answer) && optionIndex !== question.correct) {
              classes.push("wrong");
            } else if (optionIndex === question.correct && optionIndex !== Number(answer)) {
              classes.push("reveal");
            }
          }

          const dataAttribute = examMode ? "data-exam-answer" : "data-answer-question";

          return `
            <button class="${classes.join(" ")}" type="button" ${dataAttribute}="${question.id}" data-option-index="${optionIndex}">
              <span class="option-letter">${["A", "B", "C", "D"][optionIndex]}</span>
              <span>${option}</span>
            </button>
          `;
        }).join("")}
      </div>
      ${examMode ? "" : `<div class="feedback ${isAnswered ? `show ${isCorrect ? "correct" : "wrong"}` : ""}">${escapeHtml(feedbackMessage)}</div>`}
    </article>
  `;
}

export function renderQuizSummary(content, score, total, percentage, wrongQuestions, emptyMessage, message) {
  return `
    <div class="summary-card">
      <div class="panel-row">
        <div>
          <p class="surface-kicker">${content.quiz.summaryTitle}</p>
          <p class="surface-copy">${message}</p>
        </div>
        <strong class="summary-score">${score}/${total}</strong>
      </div>
      <p class="surface-note">${content.quiz.summaryLabel}: ${percentage}%</p>
      ${
        wrongQuestions.length
          ? `<div class="review-list-inline">
              ${wrongQuestions.map((question) => `
                <div class="review-inline-item">
                  <strong>${escapeHtml(question.q)}</strong><br>
                  ${escapeHtml(question.opts[question.correct])}
                </div>
              `).join("")}
            </div>`
          : `<div class="empty-state" style="margin-top: 1rem;">${emptyMessage}</div>`
      }
    </div>
  `;
}

export function renderExamIntro(content) {
  return `
    <div class="exam-head">
      <div>
        <p class="surface-kicker">${content.exam.introTitle}</p>
        <p class="surface-copy">${content.exam.introCopy}</p>
      </div>
    </div>
    <div class="exam-form-grid">
      <label class="exam-setting">
        <span>${content.exam.durationLabel}</span>
        <select id="examDurationSelect">
          <option value="6">6 min</option>
          <option value="10" selected>10 min</option>
          <option value="15">15 min</option>
        </select>
      </label>
      <label class="exam-setting">
        <span>${content.exam.questionCountLabel}</span>
        <select id="examCountSelect">
          <option value="6">6</option>
          <option value="8" selected>8</option>
          <option value="10">10</option>
        </select>
      </label>
    </div>
    <div class="spotlight-actions" style="margin-top: 1rem;">
      <button class="action-btn" type="button" data-start-exam="true">${content.exam.start}</button>
    </div>
  `;
}

export function renderExamRuntime(content, questionsMarkup, remainingTime) {
  return `
    <div class="exam-timer">
      <span>${content.exam.runningLabel}</span>
      <strong>${remainingTime}</strong>
    </div>
    <div class="stack">
      ${questionsMarkup}
    </div>
    <div class="spotlight-actions" style="margin-top: 1rem;">
      <button class="action-btn" type="button" data-submit-exam="true">${content.exam.submit}</button>
    </div>
  `;
}

export function renderExamResult(content, result) {
  if (!result) {
    return `<div class="empty-state">${content.exam.empty}</div>`;
  }

  return `
    <div class="exam-result-card">
      <div class="panel-row">
        <div>
          <p class="surface-kicker">${content.exam.finishedTitle}</p>
          <p class="surface-copy">${result.timeout ? content.exam.timeoutMessage : content.exam.resultLabel}</p>
        </div>
        <strong class="exam-score">${result.score}/${result.total}</strong>
      </div>
      <p class="surface-note">${content.quiz.reviewTitle}</p>
      ${
        result.wrongQuestions.length
          ? `<div class="review-list-inline">
              ${result.wrongQuestions.map((question) => `
                <div class="review-inline-item">
                  <strong>${escapeHtml(question.q)}</strong><br>
                  ${escapeHtml(question.opts[question.correct])}
                </div>
              `).join("")}
            </div>`
          : `<div class="empty-state" style="margin-top: 1rem;">${content.quiz.reviewEmpty}</div>`
      }
      <div class="spotlight-actions" style="margin-top: 1rem;">
        <button class="action-btn" type="button" data-reset-exam="true">${content.exam.retry}</button>
      </div>
    </div>
  `;
}

export function renderChecklistItems(items, checkedSet) {
  return items.map(({ text, index }) => {
    const checked = checkedSet.has(index);
    return `
      <article class="checklist-item ${checked ? "checked" : ""}" data-check-index="${index}">
        <span class="check-box">${checked ? "✓" : ""}</span>
        <span class="check-text">${escapeHtml(text)}</span>
      </article>
    `;
  }).join("");
}

export function renderStatCard(label, value) {
  return `
    <article class="stat-pill">
      <span class="metric-label">${label}</span>
      <strong>${value}</strong>
    </article>
  `;
}

export function renderHistoryItem(item, badgeLabel, language, historyLabel) {
  return `
    <article class="history-item">
      <div class="history-head">
        <div>
          <span class="result-badge">${badgeLabel}</span>
          <strong>${item.score}/${item.total}</strong>
        </div>
        <span class="topic-chip">${formatDate(item.at, language)}</span>
      </div>
      <p class="history-meta">${Math.round(item.percent)}% • ${escapeHtml(historyLabel)}</p>
    </article>
  `;
}

export function renderTopicMastery(mastery, content) {
  return `
    <div class="mastery-list">
      ${mastery.map((item) => `
        <article class="mastery-item">
          <div class="mastery-head">
            <strong>${content.topicLabels[item.topic]}</strong>
            <span>${item.done}/${item.total} • ${item.percent}%</span>
          </div>
          <div class="mastery-track">
            <div class="mastery-fill" style="width: ${item.percent}%"></div>
          </div>
        </article>
      `).join("")}
    </div>
  `;
}

export function renderAchievementItem(achievementId, content, unlocked, progress) {
  return `
    <article class="achievement-item ${unlocked ? "" : "locked"}">
      <div class="history-head">
        <div>
          <span class="${unlocked ? "result-badge" : "topic-chip"}">${unlocked ? "✓" : `${progress.done}/${progress.total}`}</span>
          <strong>${escapeHtml(content.achievements[achievementId])}</strong>
        </div>
        <span class="topic-chip">${progress.done}/${progress.total}</span>
      </div>
    </article>
  `;
}

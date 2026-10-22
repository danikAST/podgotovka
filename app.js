/* Умный тренажёр — логика */
"use strict";

const $ = (sel) => document.querySelector(sel);
const content = $("#content");
let currentView = "home";
let quizState = {}; // id -> выбранный индекс (одиночный) или Set (множественный)
let timerHandle = null;

/* ---------------- Навигация ---------------- */
document.querySelectorAll(".nav-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".nav-btn").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    currentView = btn.dataset.view;
    render();
  });
});

function stopTimer() {
  if (timerHandle) { clearInterval(timerHandle); timerHandle = null; }
}

const FILE_MAP = { turkce: "turkce", math: "ent_math", inf: "ent_inf", burslari: "burslari" };

function render() {
  stopTimer();
  if (currentView === "home") return renderHome();
  content.innerHTML = '<div class="loading">Загрузка…</div>';
  const f = FILE_MAP[currentView] || currentView;
  fetch(`data/${f}.json`)
    .then((r) => {
      if (!r.ok) throw new Error("нет данных");
      return r.json();
    })
    .then((data) => {
      if (currentView === "turkce") renderTurkce(data);
      else if (currentView === "math") renderEnt(data, "math");
      else if (currentView === "inf") renderEnt(data, "inf");
      else if (currentView === "burslari") renderBurslari(data);
      afterRender();
    })
    .catch(() => {
      content.innerHTML = '<div class="card">⚠️ Раздел ещё наполняется. Загляни позже!</div>';
    });
}

/* ---------------- Главная / План ---------------- */
function renderHome() {
  content.innerHTML = `
    <h1>🎓 План подготовки</h1>
    <div class="subtitle">Цель: ЕНТ (математика + основы алгоритмизации и программирования · В057) + Türkiye Bursları + турецкий язык</div>

    <div class="card">
      <h3>📊 Твоя траектория</h3>
      <table>
        <tr><th>Направление</th><th>Цель</th><th>Статус</th></tr>
        <tr><td>🇹🇷 Турецкий</td><td>Уровень A1 → B1</td><td><span class="badge blue">начинаем</span></td></tr>
        <tr><td>📐 Математика</td><td>Общепрофессиональная: 20 заданий · 20 баллов</td><td><span class="badge yellow">план готов</span></td></tr>
        <tr><td>💻 Основы алгоритмизации и программирования</td><td>Специальная: 40 заданий · 50 баллов (20+10+10)</td><td><span class="badge yellow">план готов</span></td></tr>
        <tr><td>📊 Итого ЕНТ</td><td>60 заданий · 70 баллов · 120 минут</td><td><span class="badge blue">цель</span></td></tr>
        <tr><td>🌍 Bursları</td><td>30 задач за 60 минут</td><td><span class="badge blue">разбор идёт</span></td></tr>
      </table>
      <p style="margin-top:10px">⏳ До ЕНТ: <b id="daysLeft"></b> дней. Тренируйся каждый день по <b>40–60 минут</b>.</p>
    </div>

    <h2>🗓 График на недели</h2>
    <div class="week" id="weeks"></div>

    <div class="card">
      <h3>💡 Как устроен тренажёр</h3>
      <p>Слева — разделы. В каждом разделе: теория (карточки), фразы/слова, тесты с проверкой и <b>разбором решения</b>. Ошибаться — нормально: главное смотреть решение и повторять.</p>
      <p>В разделах ЕНТ и Bursları есть таймер — как на настоящем экзамене. По истечении времени тест проверяется автоматически.</p>
    </div>
  `;

  const now = new Date();
  const target = new Date(2027, 5, 1); // июнь 2027 (основная сессия)
  const days = Math.max(1, Math.round((target - now) / 86400000));
  $("#daysLeft").textContent = days;

  const weeks = [
    ["1", "1–7 ноя", "Турецкий: алфавит + приветствия · Математика: дроби и проценты · Инф. технологии: системы счисления"],
    ["2", "8–14 ноя", "Турецкий: семья, цифры · Математика: уравнения · Инф. технологии: перевод чисел 2/8/10/16"],
    ["3", "15–21 ноя", "Турецкий: еда, время · Математика: степени и корни · Инф. технологии: логика (И/ИЛИ/НЕ)"],
    ["4", "22–28 ноя", "Турецкий: глаголы (быть) · Математика: прогрессии · Инф. технологии: алгоритмы и блок-схемы"],
    ["5", "29 ноя–5 дек", "Турецкий: тест №1 · Математика: функции и графики · Инф. технологии: языки программирования (Python)"],
    ["6", "6–12 дек", "Турецкий: падежи (основы) · Математика: геометрия: треугольники · Инф. технологии: типы данных и переменные"],
    ["7", "13–19 дек", "Турецкий: прошедшее время · Математика: геометрия: четырёхугольники · Инф. технологии: условия и циклы"],
    ["8", "20–26 дек", "Повторение месяца: тесты по всем трём направлениям"],
    ["9", "27 дек–2 янв", "Каникулы · лёгкие 15 минут в день (слова, 3 задачи)"],
    ["10", "3–9 янв", "Турецкий: будущее время · Математика: вероятность и комбинаторика · Инф. технологии: строки и списки"],
    ["11", "10–16 янв", "Турецкий: 500 слов · Математика: текстовые задачи · Инф. технологии: массивы и поиск"],
    ["12", "17–23 янв", "Bursları: тренировка на время (30 задач / 60 минут) — 1 раз в неделю"],
    ["13", "24–30 янв", "Математика: полный пробный тест · Инф. технологии: полный пробный тест"],
    ["14", "31 янв–6 фев", "Разбор ошибок пробников · Турецкий: разговорная практика (ситуации)"],
    ["15", "7–13 фев", "Математика: сложные темы повторно · Инф. технологии: ситуационные задачи"],
    ["16", "14–20 фев", "Bursları: второй прогон · Турецкий: тест №2"],
    ["17", "21–27 фев", "Повторение: все формулы и конспекты"],
    ["18", "28 фев–6 мар", "Пробники еженедельно · разбор ошибок"],
    ["19", "7–13 мар", "Математика: последний прогон слабых тем"],
    ["20", "14–20 мар", "Инф. технологии: последний прогон слабых тем"],
    ["21", "21–27 мар", "Турецкий: итоговый тест B1"],
    ["22", "28 мар–3 апр", "Настоящее ЕНТ: регистрация, расписание"],
    ["23", "4–10 апр", "Спокойное повторение, режим, здоровье"],
    ["24", "11–17 апр", "ЕЩЁ РАЗ: пробник полный + разбор"],
    ["25", "18–24 апр", "Береги силы, лёгкие повторы"],
    ["26", "25 апр–1 мая", "ФИНАЛ: математика + информатика + турецкий на максимум"],
  ];
  $("#weeks").innerHTML = weeks
    .map(
      ([n, dates, txt]) => `
      <div class="week-item">
        <div class="week-num">${n}</div>
        <div class="week-body">
          <div class="week-title">${dates}</div>
          <div class="week-sub">${txt}</div>
        </div>
      </div>`
    )
    .join("");
}

/* ---------------- Турецкий ---------------- */
function renderTurkce(data) {
  let html = `<h1>🇹🇷 Турецкий язык</h1>
    <div class="subtitle">С нуля до уверенного уровня. Уроки → фразы → тесты.</div>`;

  if (data.level_test) html += renderLevelTest(data.level_test);

  data.lessons.forEach((lesson) => {
    html += `<div class="card">
      <h2>${lesson.title}</h2>
      <div>${lesson.content_html || ""}</div>`;
    if (lesson.phrases && lesson.phrases.length) {
      html += `<div class="phrase-grid">`;
      lesson.phrases.forEach((p) => {
        html += `<div class="phrase">
          <div class="tr">${p.tr}</div>
          <div class="pron">${p.pron || ""}</div>
          <div class="ru">${p.ru}</div>
        </div>`;
      });
      html += `</div>`;
    }
    if (lesson.quiz && lesson.quiz.length) {
      html += `<h3>Тест по уроку</h3>` + renderQuiz(lesson.quiz, "turkce-" + lesson.id);
    }
    html += `</div>`;
  });

  content.innerHTML = html;
  bindQuiz();
}

function renderLevelTest(lt) {
  let html = `<div class="card level-card">
    <h2>🎯 ${lt.title}</h2>
    <p class="muted">${lt.description}</p>
    <div class="quiz" data-group="level">`;
  lt.questions.forEach((q, i) => {
    const id = "level-" + i;
    html += `<div class="question" data-qid="${id}">
      <div class="q-text"><span class="type-badge level">${q.level}</span> ${q.section ? `<span class="sec-badge">${q.section}</span>` : ""} ${q.q}</div>
      <div class="options">`;
    q.options.forEach((opt, j) => {
      html += `<div class="opt" data-idx="${j}" onclick="pick('${id}', ${j})"><span class="opt-letter">${LETTERS[j] || "?"}</span> ${opt}</div>`;
    });
    html += `</div><div class="flag"></div><div class="solution hidden"><b>✅ Решение:</b> ${q.solution || "—"}</div></div>`;
  });
  html += `<button class="btn" onclick="checkLevel()">Узнать уровень</button></div></div>`;
  return html;
}

const LEVEL_ORDER = ["A1", "A2", "B1", "B2", "C1"];

const LEVEL_REC = {
  A1: "Отличный старт! Выучи алфавит, приветствия, цифры и базовые фразы (уроки 1–2), затем переходи к простым предложениям.",
  A2: "Ты уверенно держишься в базе. Учи глаголы в настоящем времени, падежи и новые слова — дальше уровни B1.",
  B1: "Хорошая работа! Ты можешь объясниться в бытовых ситуациях. Освой прошедшее время и условные конструкции — и ты на B2.",
  B2: "Впечатляет! Ты понимаешь сложные тексты и можешь дискутировать. Отрабатывай оттенки смысла и кондовые конструкции — до C1 рукой подать.",
  C1: "Превосходно! Твой уровень — свободное владение. Полируй стиль, читай статьи и смотри фильмы без субтитров."
};

function checkLevel() {
  const lt = window._data["turkce"].level_test;
  const counts = {}, totals = {};
  LEVEL_ORDER.forEach((L) => { counts[L] = 0; totals[L] = 0; });

  lt.questions.forEach((q, i) => {
    const id = "level-" + i;
    const sel = quizState[id] ?? -1;
    const qEl = document.querySelector(`[data-qid="${id}"]`);
    if (!qEl) return;
    const flag = qEl.querySelector(".flag");
    const solution = qEl.querySelector(".solution");
    qEl.querySelectorAll(".opt").forEach((el, j) => {
      el.classList.remove("selected", "correct", "wrong");
      if (j === q.correct) el.classList.add("correct");
      if (j === sel && j !== q.correct) el.classList.add("wrong");
    });
    totals[q.level]++;
    if (sel === q.correct) {
      counts[q.level]++;
      flag.className = "flag green";
      flag.textContent = "✔ Верно!";
    } else {
      flag.className = "flag red";
      flag.textContent = sel >= 0 ? "✘ Неверно" : "✘ Не выбран";
    }
    solution.classList.remove("hidden");
  });

  // Уровень = самая высокая ступень, где ≥60% правильных (и минимум 3 ответа на этой ступени)
  let level = "A1";
  for (const L of LEVEL_ORDER) {
    if (totals[L] >= 3 && counts[L] / totals[L] >= 0.6) level = L;
  }

  document.querySelectorAll(".result-banner").forEach((b) => b.remove());
  const div = document.createElement("div");
  div.className = "result-banner";

  const bars = LEVEL_ORDER.map((L) => {
    const pct = totals[L] ? Math.round((100 * counts[L]) / totals[L]) : 0;
    return `<div class="level-row">
      <span class="level-name">${L}</span>
      <span class="level-track"><span class="level-fill" style="width:${pct}%"></span></span>
      <span class="level-pct">${counts[L]}/${totals[L]} · ${pct}%</span>
    </div>`;
  }).join("");

  div.innerHTML = `<div class="level-result-title">Твой уровень: <b>${level}</b> <span class="muted">(CEFR)</span></div>
    <div class="level-bars">${bars}</div>
    <div class="level-rec">💡 ${LEVEL_REC[level]}</div>`;
  document.querySelector('.quiz[data-group="level"]').prepend(div);
  div.scrollIntoView({ behavior: "smooth", block: "start" });
}

/* ---------------- ЕНТ: математика / информатика ---------------- */
function renderEnt(data, kind) {
  let html = `<h1>${kind === "math" ? "📐 Математика · ЕНТ" : "💻 Основы алгоритмизации и программирования · В057"}</h1>
    <div class="subtitle">${data.subtitle || ""}</div>
    <div class="card"><b>Формат:</b> ${data.format || ""}</div>`;
  if (data.instruction) html += `<div class="card exam-instruction">📋 ${data.instruction}</div>`;
  if (data.timeLimit) html += renderTimer(data.timeLimit);

  let num = 0;
  (data.topics || []).forEach((topic) => {
    html += `<h2>${topic.title}</h2>`;
    if (topic.theory) html += `<div class="card"><div class="theory">${topic.theory}</div></div>`;
    if (topic.tasks && topic.tasks.length) {
      html += renderQuiz(topic.tasks, kind + "-" + topic.id, num + 1);
      num += topic.tasks.length;
    }
  });
  content.innerHTML = html;
  if (data.timeLimit) startTimer(data.timeLimit);
  bindQuiz();
}

/* ---------------- Bursları ---------------- */
function renderBurslari(data) {
  let html = `<h1>🌍 Türkiye Bursları</h1>
    <div class="subtitle">${data.subtitle || ""}</div>
    <div class="card"><b>Реальный формат:</b> ${data.format || "30 заданий за 60 минут, выбор ответа из 5 (A–E)."}</div>`;
  if (data.instruction) html += `<div class="card exam-instruction">📋 ${data.instruction}</div>`;
  if (data.timeLimit) html += renderTimer(data.timeLimit);

  // Один общий экзамен: все задачи в одном блоке, одна кнопка проверки
  const tasks = (data.tasks || []).map((t) => Object.assign({}, t, { id: t.num }));
  html += renderQuiz(tasks, "burs", 1);

  content.innerHTML = html;
  if (data.timeLimit) startTimer(data.timeLimit);
  bindQuiz();
}

/* ---------------- Таймер ---------------- */
function renderTimer(minutes) {
  return `<div class="timer">⏱ Время: <span class="timer-val">${fmtT(minutes * 60)}</span> <span class="muted">(по окончании — автопроверка)</span></div>`;
}

function startTimer(minutes) {
  const el = document.querySelector(".timer .timer-val");
  if (!el) return;
  let remaining = minutes * 60;
  stopTimer();
  timerHandle = setInterval(() => {
    remaining--;
    el.textContent = fmtT(Math.max(0, remaining));
    if (remaining <= 0) {
      stopTimer();
      document.querySelectorAll(".quiz").forEach((q) => {
        try { checkGroup(q.dataset.group); } catch (e) {}
      });
    }
  }, 1000);
}

function fmtT(s) {
  const m = String(Math.floor(s / 60)).padStart(2, "0");
  const ss = String(s % 60).padStart(2, "0");
  return `${m}:${ss}`;
}

/* ---------------- Тест-рендер ---------------- */
const POINTS = { single: 1, multiple: 2, situational: 1 };
const LETTERS = ["A", "B", "C", "D", "E"];

function typeBadge(type) {
  if (type === "multiple") return '<span class="type-badge multiple">🧩 Выбор нескольких</span>';
  if (type === "situational") return '<span class="type-badge situational">🗣 Ситуационная задача</span>';
  return '<span class="type-badge single">◯ Один ответ</span>';
}

function renderQuiz(items, groupId, startNum) {
  let html = `<div class="quiz" data-group="${groupId}">`;
  items.forEach((item, idx) => {
    const id = groupId + "-" + item.id;
    const type = item.type || "single";
    const num = startNum ? startNum + idx : null;
    html += `
      <div class="question" data-qid="${id}">
        <div class="q-text">${num ? `<span class="task-num">Задание ${num}</span>` : ""} ${typeBadge(type)} ${item.q}</div>
        ${item.figure ? `<div class="figure">${item.figure}</div>` : ""}
        <div class="options">`;
    item.options.forEach((opt, i) => {
      html += `<div class="opt" data-idx="${i}" onclick="pick('${id}', ${i})"><span class="opt-letter">${LETTERS[i] || "?"}</span> ${opt}</div>`;
    });
    html += `</div>
        <div class="flag"></div>
        <div class="solution hidden"><b>✅ Решение:</b> ${item.solution || "—"}</div>
      </div>`;
  });
  html += `<button class="btn" onclick="checkGroup('${groupId}')">Проверить тест</button>`;
  html += `</div>`;
  return html;
}

function pick(id, idx) {
  const item = findItem(id);
  const type = item.type || "single";
  if (type === "multiple") {
    const set = quizState[id] || (quizState[id] = new Set());
    if (set.has(idx)) set.delete(idx); else set.add(idx);
    document.querySelectorAll(`[data-qid="${id}"] .opt`).forEach((el, i) => {
      el.classList.toggle("selected", set.has(i));
    });
  } else {
    quizState[id] = idx;
    document.querySelectorAll(`[data-qid="${id}"] .opt`).forEach((el, i) => {
      el.classList.toggle("selected", i === idx);
    });
  }
}

function isCorrect(item, chosen) {
  if (item.type === "multiple") {
    if (!chosen || chosen.size === 0) return false;
    const want = [...item.correct].sort().join(",");
    const got = [...chosen].sort().join(",");
    return want === got;
  }
  return (chosen ?? -1) === item.correct;
}

function checkGroup(groupId) {
  const groupEl = document.querySelector(`.quiz[data-group="${groupId}"]`);
  if (!groupEl) return;
  const questions = groupEl.querySelectorAll(".question");
  let score = 0, total = 0, correctCount = 0;

  questions.forEach((qEl) => {
    const id = qEl.dataset.qid;
    const item = findItem(id);
    const type = item.type || "single";
    const pts = POINTS[type] || 1;
    total += pts;
    const chosen = quizState[id] ?? (type === "multiple" ? new Set() : -1);
    const ok = isCorrect(item, chosen);
    if (ok) { score += pts; correctCount++; }
    const flag = qEl.querySelector(".flag");
    const solution = qEl.querySelector(".solution");
    qEl.querySelectorAll(".opt").forEach((el, i) => {
      el.classList.remove("selected", "correct", "wrong");
      if (type === "multiple") {
        if (item.correct.includes(i)) el.classList.add("correct");
        if (chosen instanceof Set && chosen.has(i) && !item.correct.includes(i)) el.classList.add("wrong");
      } else {
        if (i === item.correct) el.classList.add("correct");
        if (i === chosen && i !== item.correct) el.classList.add("wrong");
      }
    });
    if (ok) {
      flag.className = "flag green";
      flag.textContent = "✔ Верно!";
    } else {
      flag.className = "flag red";
      if (type === "multiple") {
        flag.textContent = !(chosen instanceof Set) || chosen.size === 0 ? "✘ Не выбраны варианты" : "✘ Неверный набор";
      } else {
        flag.textContent = `✘ Неверно (твой ответ: ${chosen >= 0 ? item.options[chosen] : "не выбран"})`;
      }
    }
    solution.classList.remove("hidden");
  });

  const banner = groupEl.querySelector(".result-banner");
  if (banner) banner.remove();
  const div = document.createElement("div");
  div.className = "result-banner";
  div.innerHTML = `Результат: <b>${score} из ${total} баллов</b> (заданий верно: ${correctCount} из ${questions.length}) ${score === total ? "🎉 Отлично!" : "— посмотри решения и повтори."}`;
  groupEl.prepend(div);
}

function findItem(id) {
  const parts = id.split("-");
  const file = parts[0];
  if (file === "level") {
    const lt = window._data["turkce"].level_test;
    return lt.questions[Number(parts[1])] || { correct: -1, options: [] };
  }
  const key = parts[1];
  const num = parts.slice(2).join("-");
  if (file === "turkce") {
    const data = window._data["turkce"];
    const lesson = data.lessons.find((l) => String(l.id) === key);
    return lesson.quiz.find((q) => String(q.id) === num);
  }
  if (file === "math" || file === "inf") {
    const data = window._data[file];
    const topic = data.topics.find((t) => String(t.id) === key);
    return topic.tasks.find((q) => String(q.id) === num);
  }
  if (file === "burs") {
    const data = window._data["burslari"];
    return data.tasks.find((t) => String(t.num) === key);
  }
  return { correct: -1, options: [] };
}

function afterRender() {
  if (window.renderMathInElement) {
    try { renderMathInElement(content, { delimiters: [{ left: "$$", right: "$$", display: true }, { left: "$", right: "$", display: false }] }); } catch (e) {}
  }
}

function bindQuiz() {
  // уже привязано через onclick-атрибуты
}

/* считаем, что данные уже загружены в window._data */
window._data = {};
const loadAll = () => {
  Object.entries(FILE_MAP).forEach(([view, f]) => {
    fetch(`data/${f}.json`).then((r) => r.json()).then((d) => (window._data[view] = d)).catch(() => {});
  });
};
loadAll();
render();

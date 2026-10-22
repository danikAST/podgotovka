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

const FILE_MAP = { turkce: "turkce", math: "ent_math", inf: "ent_inf", burslari: "burslari", training: "training" };

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
      else if (currentView === "training") renderTraining(data);
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

/* ---- Озвучка турецких слов (Web Speech API) ---- */
function speakTr(el) {
  const text = (el && el.dataset && el.dataset.word) || el || "";
  if (!("speechSynthesis" in window)) {
    if (el) flashBtn(el, "⚠️ Браузер не поддерживает озвучку");
    return;
  }
  try {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(String(text));
    u.lang = "tr-TR";
    u.rate = 0.85;
    const voices = window.speechSynthesis.getVoices();
    const trVoice = voices.find((v) => v.lang && v.lang.toLowerCase().startsWith("tr"));
    if (trVoice) u.voice = trVoice;
    window.speechSynthesis.speak(u);
  } catch (e) {
    if (el) flashBtn(el, "⚠️ Ошибка озвучки");
  }
}

function flashBtn(btn, msg) {
  const old = btn.textContent;
  btn.textContent = msg;
  setTimeout(() => { btn.textContent = old; }, 2500);
}

if ("speechSynthesis" in window) {
  window.speechSynthesis.onvoiceschanged = function () {};
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
          <div class="phrase-top"><span class="tr">${p.tr}</span>
            <button class="snd-btn" data-word="${p.tr}" onclick="speakTr(this)" title="Послушать">🔊</button>
          </div>
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

  html += `<div class="card" id="fc-box"><h2>📚 Карточки слов</h2><div id="fc-inner"></div></div>`;

  content.innerHTML = html;
  initFlashcards(data);
  bindQuiz();
}

/* ---- Карточки слов (как в языковых курсах, с запоминанием) ---- */
let _fc = null;
let _fcIdx = 0;
let _fcRevealed = false;

function flashcardsFromData(data) {
  const map = {};
  (data.lessons || []).forEach((l) => {
    (l.phrases || []).forEach((p) => {
      if (p.tr && !map[p.tr]) map[p.tr] = { tr: p.tr, pron: p.pron || "", ru: p.ru };
    });
  });
  return Object.values(map);
}

function initFlashcards(data) {
  _fc = flashcardsFromData(data);
  _fcIdx = 0;
  _fcRevealed = false;
  renderFcCard();
}

function renderFcCard() {
  const inner = $("#fc-inner");
  if (!inner || !_fc || !_fc.length) return;
  const c = _fc[_fcIdx];
  const st = JSON.parse(localStorage.getItem("turkce_fc") || "{}");
  const stats = st[c.tr] || { ok: 0, fail: 0 };
  let html = `<div class="fc-word">${c.tr} <button class="snd-btn" data-word="${c.tr}" onclick="speakTr(this)" title="Послушать">🔊</button></div>`;
  if (c.pron) html += `<div class="fc-pron muted">${c.pron}</div>`;
  if (_fcRevealed) {
    html += `<div class="fc-ru">${c.ru}</div>
      <div style="margin-top:12px">
        <button class="btn" onclick="fcAnswer(1)">🟢 Знаю</button>
        <button class="btn" style="margin-left:8px" onclick="fcAnswer(0)">🔴 Ещё учу</button>
      </div>`;
  } else {
    html += `<div style="margin-top:12px"><button class="btn" onclick="revealFc()">👁 Показать перевод</button></div>`;
  }
  html += `<div class="fc-count muted">Карточка ${_fcIdx + 1} / ${_fc.length} · угадано: ${stats.ok}, ошибок: ${stats.fail}</div>`;
  inner.innerHTML = html;
}

function revealFc() { _fcRevealed = true; renderFcCard(); }

function fcAnswer(ok) {
  const c = _fc[_fcIdx];
  const st = JSON.parse(localStorage.getItem("turkce_fc") || "{}");
  if (!st[c.tr]) st[c.tr] = { ok: 0, fail: 0 };
  if (ok) st[c.tr].ok++; else st[c.tr].fail++;
  localStorage.setItem("turkce_fc", JSON.stringify(st));
  _fcIdx = (_fcIdx + 1) % _fc.length;
  _fcRevealed = false;
  renderFcCard();
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
    if (topic.theory) html += `<details class="card theory-card"><summary>📖 Что это и как решать</summary><div class="theory">${topic.theory}</div></details>`;
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
  if (data.strategy) html += `<details class="card theory-card"><summary>🎯 Стратегия: как решать эти задачи</summary><div class="theory">${data.strategy}</div></details>`;
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
  if (file === "train") {
    const pool = _trainPools[id];
    if (!pool) return { correct: -1, options: [] };
    return pool.find((q) => String(q.id) === num) || { correct: -1, options: [] };
  }
  return { correct: -1, options: [] };
}

/* ---------------- Тренировка: генератор случайных вариантов ---------------- */
const _trainPools = {};   // "train-math" -> [{num,id,q,options,correct,solution}]
const _trainTypes = {};   // "math" -> [типы из training.json]

function ri(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function shuffleArr(a) {
  const arr = a.slice();
  for (let i = arr.length - 1; i > 0; i--) {
    const j = ri(0, i);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
function mkOptions(correctVal, decoys) {
  const opts = shuffleArr([String(correctVal)].concat(decoys.map(String)));
  return { options: opts, correct: opts.indexOf(String(correctVal)) };
}
function makeItem(num, q, solution, options, correct) {
  return { num: num, id: num, q: q, options: options, correct: correct, solution: solution };
}

const GEN_TASKS = {
  line_eq() {
    const a = ri(2, 9), k = ri(2, 12), b = ri(-9, 9);
    const c = a * k + b;
    const x = k;
    const { options, correct } = mkOptions("x = " + x, ["x = " + (x + 1), "x = " + (x - 1), "x = " + (x + 2)]);
    return { vars: { a, b, c }, options, correct, solution: `Перенесём ${b < 0 ? "− " + -b : "+ " + b} вправо: ${a}x = ${c} ${b < 0 ? "+ " + -b : "− " + b} = ${a * x}. x = ${a * x} / ${a} = ${x}.` };
  },
  percent() {
    const n = ri(20, 500), p = [5, 10, 15, 20, 25, 30, 50][ri(0, 6)];
    const v = (n * p) / 100;
    const { options, correct } = mkOptions(v, [v + n * 0.05, Math.round(v * 1.1), n - v]);
    return { vars: { p, n }, options, correct, solution: `${p}% от ${n} = ${n} × ${p} / 100 = ${v}.` };
  },
  power() {
    const a = ri(2, 5), m = ri(2, 4), n = ri(2, 4);
    const res = Math.pow(a, m + n);
    const { options, correct } = mkOptions(res, [Math.pow(a, m * n), Math.pow(a, m + n - 1), Math.pow(a + 1, m + n)]);
    return { vars: { a, m, n }, options, correct, solution: `При умножении степеней показатели складываются: ${a}^${m} × ${a}^${n} = ${a}^(${m}+${n}) = ${a}^${m + n} = ${res}.` };
  },
  fraction() {
    let p = ri(1, 4), q = ri(2, 7), r = ri(1, 4), s = ri(2, 7);
    if (p >= q) p = q - 1; if (r >= s) r = s - 1;
    const num = p * s + r * q, den = q * s;
    const { options, correct } = mkOptions(num + "/" + den, [(num + 1) + "/" + den, num + "/" + (den + 1), (num - 1) + "/" + den]);
    return { vars: { p, q, r, s }, options, correct, solution: `К общему знаменателю ${q}×${s}=${den}: (${p}×${s} + ${r}×${q}) / ${den} = ${num}/${den}.` };
  },
  quad() {
    const a = ri(1, 7), b = ri(1, 7);
    const s = a + b, p = a * b;
    const bigger = Math.max(a, b);
    const { options, correct } = mkOptions(bigger, [a, Math.min(a, b) + 1, a + b]);
    return { vars: { s, p }, options, correct, solution: `По теореме Виета x₁+x₂=${s}, x₁·x₂=${p}. Корни: ${a} и ${b}. Больший = ${bigger}.` };
  },
  bin_add() {
    const v1 = ri(5, 15), v2 = ri(3, 11);
    const sum = v1 + v2;
    const b1 = v1.toString(2), b2 = v2.toString(2), bs = sum.toString(2);
    const decoys = [sum.toString(2).replace(/0$/, "1"), (sum + 1).toString(2), v1.toString(2) + v2.toString(2)];
    const { options, correct } = mkOptions(bs, decoys);
    return { vars: { b1, b2 }, options, correct, solution: `${b1}₂ = ${v1}, ${b2}₂ = ${v2}. ${v1}+${v2}=${sum} = ${bs}₂.` };
  },
  hex() {
    const dec = ri(32, 4095);
    const hex = dec.toString(16).toUpperCase();
    const { options, correct } = mkOptions(hex, [(dec + 1).toString(16).toUpperCase(), dec.toString(16).toUpperCase().slice(1), (dec * 2).toString(16).toUpperCase()]);
    return { vars: { dec }, options, correct, solution: `Делим на 16: ${hex}₁₆ = ${dec}₁₀.` };
  },
  logic() {
    const x = ri(0, 1), y = ri(0, 1);
    const res = (x & (1 - y)) | ((1 - x) & y); // XOR
    const { options, correct } = mkOptions(res, [1 - res, 0, 1]);
    return { vars: { x, y }, options, correct, solution: `Ответ: (x ∧ ¬y) ∨ (¬x ∧ y) = x ⊕ y; при x=${x}, y=${y} → ${res}.` };
  },
  ones() {
    const dec = ri(3, 255);
    const bin = dec.toString(2);
    const ones = bin.split("").filter((c) => c === "1").length;
    const { options, correct } = mkOptions(ones, [Math.max(0, ones - 1), ones + 1, bin.length]);
    return { vars: { dec, bin }, options, correct, solution: `${dec}₁₀ = ${bin}₂. Единиц: ${ones}.` };
  },
  sum() {
    const n = ri(4, 20);
    const s = (n * (n + 1)) / 2;
    const { options, correct } = mkOptions(s, [s - n, s + n, n * n]);
    return { vars: { n }, options, correct, solution: `Сумма арифметической прогрессии: (1+${n})×${n}/2 = ${s}.` };
  }
};

function genPool(catId, types) {
  return types.map((t, i) => {
    const g = GEN_TASKS[t.gen]();
    const q = t.template.replace(/\{(\w+)\}/g, (_, k) => g.vars[k] ?? "?");
    return makeItem(i + 1, q, g.solution, g.options, g.correct);
  });
}

function renderTraining(data) {
  let html = `<h1>🔥 Тренировка: случайные варианты</h1>
    <p class="subtitle">${data.description}</p>`;
  data.categories.forEach((cat) => {
    _trainTypes[cat.id] = cat.types;
    const pool = genPool(cat.id, cat.types);
    _trainPools["train-" + cat.id] = pool;
    html += `<h2>${cat.title}</h2>
      ${cat.theory ? `<details class="card theory-card"><summary>📖 Что это и как решать</summary><div class="theory">${cat.theory}</div></details>` : ""}
      <div class="card" style="display:flex;gap:10px;align-items:center">
        <button class="btn" onclick="regenTrain('${cat.id}')">🔄 Новый вариант</button>
        <span class="muted">числа меняются каждый раз</span>
      </div>
      <div id="tr-${cat.id}">${renderQuiz(pool, "train-" + cat.id)}</div>`;
  });
  content.innerHTML = html;
}

function regenTrain(catId) {
  const types = _trainTypes[catId];
  if (!types) return;
  const pool = genPool(catId, types);
  _trainPools["train-" + catId] = pool;
  Object.keys(quizState).forEach((k) => { if (k.startsWith("train-" + catId + "-")) delete quizState[k]; });
  const box = document.getElementById("tr-" + catId);
  if (box) { box.innerHTML = renderQuiz(pool, "train-" + catId); afterRender(); }
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

/* Умный тренажёр — логика */
"use strict";

const $ = (sel) => document.querySelector(sel);
const content = $("#content");
let currentView = "home";
let quizState = {}; // id -> выбранный индекс (одиночный) или Set (множественный)
let timerHandle = null;
let voiceMap = null; // текст (tr) -> имя файла mp3 (из data/voice_map.json)

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
  if (currentView === "exam") return renderExam();
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

    <div class="card profile-card">
      <div class="avatar-wrap">
        <img id="profileAvatar" src="photo.jpg" alt="Фото" onerror="this.style.display='none';document.getElementById('avatarPlaceholder').style.display='flex'">
        <div id="avatarPlaceholder" class="avatar-placeholder">ДК</div>
      </div>
      <div class="profile-info">
        <h3>Данияр Кишкенов</h3>
        <p class="muted">Студент 4 курса · ВТЭК, Астана<br>Готовится: ЕНТ + Türkiye Bursları + турецкий язык</p>
      </div>
    </div>

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
  content.insertAdjacentHTML("beforeend", renderHomeStats());
  touchStreak();
}

/* ---- Озвучка турецких слов: готовые MP3 (нейро-голос) → fallback Web Speech API ---- */
function speakTr(el) {
  const text = (el && el.dataset && el.dataset.word) || el || "";
  // 1) Готовый MP3 от носителя (нейро-голос Microsoft)
  if (voiceMap && voiceMap[text]) {
    try {
      const a = new Audio("audio/" + voiceMap[text] + ".mp3");
      a.play().catch(() => {});
      return;
    } catch (e) { /* fallback ниже */ }
  }
  // 2) Fallback: Web Speech API
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
      <h2>${lesson.title}${lesson.id ? markDoneHtml("turkce-lesson", lesson.id) : ""}</h2>
      <div>${lesson.content_html || ""}</div>`;
    if (lesson.phrases && lesson.phrases.length) {
      html += `<div style="margin:10px 0">
        <button class="btn small play-btn" onclick="playLesson('${lesson.id}')">▶ Озвучить все фразы</button>
        <span class="muted">послушай, как говорит носитель</span></div>`;
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
    if (lesson.dialog && lesson.dialog.lines && lesson.dialog.lines.length) {
      html += `<h3>💬 Диалог: ${lesson.dialog.title || "слушай и повторяй"}</h3>
        <div class="dialog">`;
      lesson.dialog.lines.forEach((line) => {
        html += `<div class="dialog-line">
          <span class="dialog-speaker">${line.speaker || ""}</span>
          <div class="dialog-bubble">
            <div class="tr">${line.tr} <button class="snd-btn" data-word="${line.tr}" onclick="speakTr(this)" title="Послушать">🔊</button></div>
            <div class="ru">${line.ru || ""}</div>
          </div>
        </div>`;
      });
      html += `<button class="btn small dialog-btn" onclick="playQueue([${lesson.dialog.lines.map((l) => JSON.stringify(l.tr)).join(",")}])">▶ Озвучить весь диалог</button></div>`;
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
let _fcCur = null;
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

const LEVEL_ORDER = ["A1", "A2", "B1", "B2", "C1", "C2"];

const LEVEL_REC = {
  A1: "Отличный старт! Выучи алфавит, приветствия, цифры и базовые фразы (уроки 1–2), затем переходи к простым предложениям.",
  A2: "Ты уверенно держишься в базе. Учи глаголы в настоящем времени, падежи и новые слова — дальше уровни B1.",
  B1: "Хорошая работа! Ты можешь объясниться в бытовых ситуациях. Освой прошедшее время и условные конструкции — и ты на B2.",
  B2: "Впечатляет! Ты понимаешь сложные тексты и можешь дискутировать. Отрабатывай оттенки смысла и кондовые конструкции — до C1 рукой подать.",
  C1: "Превосходно! Твой уровень — свободное владение. Полируй стиль, читай статьи и смотри фильмы без субтитров.",
  C2: "Виртуозно! Это уровень носителя языка — ты можешь обсуждать любые темы, включая официальные и литературные. Держи уровень практикой!"
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
  // минимальный порог для сертификата — есть смысл только если хоть на одной ступени ≥60%
  let anyOk = false;
  LEVEL_ORDER.forEach((L) => { if (totals[L] >= 3 && counts[L] / totals[L] >= 0.6) anyOk = true; });
  if (anyOk) saveCertLevel(level);
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
    html += `<h2>${topic.title}${markDoneHtml(kind, topic.id)}</h2>`;
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
  html += `<div style="margin:4px 0 10px">${markDoneHtml("burs", "all")}</div>`;
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
  recordTest(groupId, score, total);
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
  if (file === "exam") {
    if (!_examPool) return { correct: -1, options: [] };
    return _examPool.find((q) => String(q.id) === key) || { correct: -1, options: [] };
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
    html += `<h2>${cat.title}${markDoneHtml("train", cat.id)}</h2>
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

/* ================= НОВЫЕ ВОЗМОЖНОСТИ =================
   Прогресс, статистика, streak, поиск, тема, сертификат,
   пробный ЕНТ, плейлист озвучки, SRS-карточки. */

function lsGet(key, def) {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : def; }
  catch (e) { return def; }
}
function lsSet(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) {}
}

function todayStr(offsetDays = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

/* ---------- Streak (серия дней занятий) ---------- */
const LS_STREAK = "turkce_streak";
function touchStreak() {
  const arr = lsGet(LS_STREAK, []);
  const t = todayStr();
  if (!arr.includes(t)) {
    arr.push(t);
    lsSet(LS_STREAK, arr.slice(-60));
  }
}
function streakInfo() {
  const arr = lsGet(LS_STREAK, []).sort();
  const set = new Set(arr);
  let cur = 0, last = todayStr();
  while (set.has(last)) { cur++; const d = new Date(); d.setDate(d.getDate() - cur); last = d.toISOString().slice(0, 10); }
  return { days: arr.length, current: cur, set };
}

/* ---------- Результаты тестов ---------- */
const LS_RESULTS = "turkce_results";
function recordTest(group, score, total) {
  const all = lsGet(LS_RESULTS, {});
  all[group] = { score, total, date: todayStr() };
  lsSet(LS_RESULTS, all);
  touchStreak();
}
function weakAreas() {
  const all = lsGet(LS_RESULTS, {});
  return Object.entries(all).filter(([, r]) => r.total > 0 && r.score / r.total < 0.7);
}

/* ---------- Прогресс тем ---------- */
const LS_TOPICS = "turkce_topics_done";
function topicDone(view, id) {
  const all = lsGet(LS_TOPICS, {});
  return !!(all[view] && all[view].includes(String(id)));
}
function toggleTopicDone(view, id) {
  const all = lsGet(LS_TOPICS, {});
  if (!all[view]) all[view] = [];
  const i = all[view].indexOf(String(id));
  if (i >= 0) all[view].splice(i, 1); else all[view].push(String(id));
  lsSet(LS_TOPICS, all);
}
function topicProgress(view, total) {
  const all = lsGet(LS_TOPICS, {});
  const arr = all[view] || [];
  return { done: arr.filter((i) => total.includes(String(i))).length, total };
}

/* ---------- Блоки статистики на главной ---------- */
function renderHomeStats() {
  const res = lsGet(LS_RESULTS, {});
  const st = streakInfo();
  let resultsHtml = Object.keys(res).length
    ? Object.entries(res).map(([g, r]) => {
        const pct = Math.round((100 * r.score) / r.total);
        const cls = pct < 70 ? "weak" : "";
        return `<div class="progress-card"><div class="progress-title">${groupTitle(g)}</div>
          <div class="progress-bar"><div class="progress-fill" style="width:${pct}%"></div></div>
          <div class="progress-num ${cls}">${r.score} / ${r.total} баллов · ${pct}%</div></div>`;
      }).join("")
    : '<div class="progress-card"><div class="progress-num">Пока нет результатов. Пройди первый тест!</div></div>';

  let html = `<h2>📊 Твоя статистика</h2>
    <div class="progress-grid">${resultsHtml}</div>
    <div class="card" style="margin-top:14px">
      <h3>🔥 Серия занятий</h3>
      <div class="progress-num">Подряд дней: <b style="color:var(--green)">${st.current}</b> · всего отмечено дней: ${st.days}</div>
      <div class="streak">${streakCalendar(st.set)}</div>
    </div>`;
  return html;
}

function groupTitle(g) {
  const map = {
    "level": "🎯 Тест уровня (турецкий)",
    "math": "📐 Математика · ЕНТ",
    "inf": "💻 Информатика · ЕНТ",
    "burs": "🌍 Türkiye Bursları",
    "exam": "🧪 Пробный ЕНТ",
    "turkce-1": "🇹🇷 Урок 1", "turkce-2": "🇹🇷 Урок 2", "turkce-3": "🇹🇷 Урок 3",
    "turkce-4": "🇹🇷 Урок 4", "turkce-5": "🇹🇷 Урок 5", "turkce-6": "🇹🇷 Урок 6",
    "turkce-7": "🇹🇷 Урок 7", "turkce-8": "🇹🇷 Урок 8", "turkce-9": "🇹🇷 Урок 9",
    "turkce-10": "🇹🇷 Урок 10", "turkce-11": "🇹🇷 Урок 11", "turkce-12": "🇹🇷 Урок 12",
    "turkce-13": "🇹🇷 Урок 13"
  };
  if (map[g]) return map[g];
  if (g.startsWith("train-")) return "🔥 Тренировка: " + g.slice(6);
  return g;
}

function streakCalendar(set) {
  const out = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const cls = set.has(key) ? "on" : "";
    const today = i === 0 ? " today" : "";
    out.push(`<div class="streak-day ${cls}${today}"><span class="d">${d.getDate()}</span><span>${["вс","пн","вт","ср","чт","пт","сб"][d.getDay()]}</span></div>`);
  }
  return out.join("");
}

/* ---------- Отметка «тема пройдена» ---------- */
function markDoneHtml(view, id) {
  const checked = topicDone(view, id) ? " checked" : "";
  return `<label class="mark-done"><input type="checkbox"${checked} onchange="toggleTopicDone('${view}','${id}'); updateDoneLabel('${view}','${id}')"> Прошёл(ла) эту тему</label>`;
}
function updateDoneLabel(view, id) {
  const dd = document.getElementById("done-" + view + "-" + id);
  if (dd) dd.textContent = topicDone(view, id) ? "✅ Пройдено" : "Прошёл(ла) эту тему";
}

/* ---------- Плейлист озвучки урока ---------- */
function playLesson(lessonId) {
  const data = window._data["turkce"];
  const lesson = data.lessons.find((l) => String(l.id) === String(lessonId));
  if (!lesson || !lesson.phrases || !lesson.phrases.length) return;
  playQueue(lesson.phrases.map((p) => p.tr));
}
let _playStop = false;
function playQueue(texts) {
  _playStop = false;
  let i = 0;
  const step = () => {
    if (_playStop || i >= texts.length) return;
    const t = texts[i];
    i++;
    let played = false;
    if (voiceMap && voiceMap[t]) {
      try {
        const a = new Audio("audio/" + voiceMap[t] + ".mp3");
        a.play().catch(() => {});
        a.onended = () => setTimeout(step, 350);
        played = true;
      } catch (e) {}
    }
    if (!played) {
      if ("speechSynthesis" in window) {
        const u = new SpeechSynthesisUtterance(t);
        u.lang = "tr-TR"; u.rate = 0.85;
        const v = window.speechSynthesis.getVoices().find((x) => x.lang && x.lang.toLowerCase().startsWith("tr"));
        if (v) u.voice = v;
        u.onend = () => setTimeout(step, 350);
        window.speechSynthesis.speak(u);
      } else { setTimeout(step, 600); }
    }
  };
  step();
}

/* ---------- SRS-карточки (интервальное повторение) ---------- */
const LS_FC = "turkce_fc_srs";
function fcLoad() { return lsGet(LS_FC, {}); }
function fcEase(s) { return s.ease || 2.5; }
function fcDue(s) { return s.due || "1970-01-01"; }
function fcDueToday(s) { return fcDue(s) <= todayStr(); }
function fcFlip(s, ok) {
  const now = todayStr();
  const s2 = { ease: fcEase(s), interval: s.interval || 0, reps: s.reps || 0, ok: (s.ok || 0) + (ok ? 1 : 0), fail: (s.fail || 0) + (ok ? 0 : 1), due: now };
  if (ok) {
    s2.reps++;
    if (s2.reps === 1) s2.interval = 1;
    else if (s2.reps === 2) s2.interval = 6;
    else s2.interval = Math.round((s2.interval || 0) * s2.ease);
    s2.ease = Math.min(3, s2.ease + 0.1);
  } else {
    s2.reps = 0;
    s2.interval = 0;
    s2.ease = Math.max(1.3, s2.ease - 0.2);
  }
  s2.due = todayStr(s2.interval);
  return s2;
}
function fcLeft() {
  const st = fcLoad();
  return _fc.filter((c) => fcDueToday(st[c.tr] || {})).length;
}
function renderFcCard() {
  const inner = $("#fc-inner");
  if (!inner || !_fc || !_fc.length) return;
  const st = fcLoad();
  const dueList = _fc.filter((c) => fcDueToday(st[c.tr] || {}));
  const c = dueList.length ? dueList[0] : _fc[_fcIdx];
  _fcCur = c;
  const s = st[c.tr] || { ok: 0, fail: 0 };
  let html = `<div class="fc-word">${c.tr} <button class="snd-btn" data-word="${c.tr}" onclick="speakTr(this)" title="Послушать">🔊</button></div>`;
  if (c.pron) html += `<div class="fc-pron muted">${c.pron}</div>`;
  if (!dueList.length) {
    html += `<div class="fc-ru">🎉 На сегодня все слова повторены!</div>
      <div class="fc-count muted">Загляни завтра — карточки всплывут снова (интервальное повторение).</div>`;
    inner.innerHTML = html;
    return;
  }
  if (_fcRevealed) {
    html += `<div class="fc-ru">${c.ru}</div>
      <div style="margin-top:12px">
        <button class="btn" onclick="fcAnswer(1)">🟢 Знаю</button>
        <button class="btn" style="margin-left:8px" onclick="fcAnswer(0)">🔴 Ещё учу</button>
      </div>`;
  } else {
    html += `<div style="margin-top:12px"><button class="btn" onclick="revealFc()">👁 Показать перевод</button></div>`;
  }
  html += `<div class="fc-count muted">Сегодня: ${dueList.length} карточек · эта: знаю ${s.ok}, ошибок ${s.fail}</div>`;
  inner.innerHTML = html;
}
function revealFc() {
  _fcRevealed = true;
  renderFcCard();
}

function fcAnswer(ok) {
  const st = fcLoad();
  const c = _fcCur || _fc[_fcIdx];
  st[c.tr] = fcFlip(st[c.tr] || {}, ok);
  lsSet(LS_FC, st);
  _fcIdx = (_fcIdx + 1) % _fc.length;
  _fcRevealed = false;
  renderFcCard();
}

/* ---------- Поиск по всем данным ---------- */
function buildSearchIndex() {
  const out = [];
  const push = (tag, title, ctx, view) => out.push({ tag, title, ctx, view });
  const tur = window._data["turkce"] || { lessons: [], level_test: { questions: [] } };
  (tur.lessons || []).forEach((l) => {
    push("Урок", l.title, "Турецкий", "turkce");
    (l.phrases || []).forEach((p) => push("Фраза", p.tr, p.ru, "turkce"));
  });
  (tur.level_test.questions || []).forEach((q) => push("Вопрос уровня", q.q, q.level + " · " + (q.section || ""), "turkce"));
  ["math", "inf"].forEach((v) => {
    const d = window._data[v];
    if (!d) return;
    (d.topics || []).forEach((t) => {
      push("Тема", t.title, v === "math" ? "Математика" : "Информатика", v);
      (t.tasks || []).forEach((q) => push("Задание", q.q, t.title, v));
    });
  });
  const burs = window._data["burslari"] || { tasks: [] };
  (burs.tasks || []).forEach((t) => push("Bursları", t.q, "Задача " + t.num, "burslari"));
  return out;
}
function doSearch(query) {
  const q = query.trim().toLowerCase();
  const box = document.getElementById("searchResults");
  if (!box) return;
  if (!q) { box.classList.remove("open"); box.innerHTML = ""; return; }
  const idx = buildSearchIndex();
  const hits = idx.filter((h) => (h.title + " " + h.ctx).toLowerCase().includes(q)).slice(0, 8);
  box.innerHTML = hits.length
    ? hits.map((h) => `<div class="search-item" onclick="goSearch('${h.view}')">
        <span class="s-tag">${h.tag}</span>${h.title}<span class="s-ctx">${h.ctx}</span></div>`).join("")
    : '<div class="search-empty">Ничего не нашлось 🤔 Попробуй иначе.</div>';
  box.classList.add("open");
}
function goSearch(view) {
  document.getElementById("searchResults").classList.remove("open");
  document.querySelectorAll(".nav-btn").forEach((b) => b.classList.toggle("active", b.dataset.view === view));
  currentView = view;
  render();
  if (view !== "home") window.scrollTo({ top: 0 });
}

/* ---------- Тема (светлая/тёмная) ---------- */
function initTheme() {
  const saved = lsGet("turkce_theme", "dark");
  document.documentElement.dataset.theme = saved;
  const btn = document.getElementById("themeToggle");
  if (btn) btn.textContent = saved === "light" ? "☀️" : "🌙";
}
function toggleTheme() {
  const cur = document.documentElement.dataset.theme === "light" ? "dark" : "light";
  document.documentElement.dataset.theme = cur;
  lsSet("turkce_theme", cur);
  const btn = document.getElementById("themeToggle");
  if (btn) btn.textContent = cur === "light" ? "☀️" : "🌙";
}

/* ---------- Сертификат ---------- */
let _certLevel = lsGet("turkce_cert_level", null);
function saveCertLevel(level) {
  const order = ["A1", "A2", "B1", "B2", "C1", "C2"];
  if (!_certLevel || order.indexOf(level) > order.indexOf(_certLevel)) {
    _certLevel = level;
    lsSet("turkce_cert_level", level);
  }
}
function drawCert() {
  const canvas = document.getElementById("certCanvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const W = 1100, H = 780;
  canvas.width = W; canvas.height = H;
  ctx.fillStyle = "#0f0f1a";
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = "#89b4fa";
  ctx.lineWidth = 8;
  ctx.strokeRect(28, 28, W - 56, H - 56);
  ctx.strokeStyle = "#45475a";
  ctx.lineWidth = 2;
  ctx.strokeRect(42, 42, W - 84, H - 84);
  ctx.fillStyle = "#cdd6f4";
  ctx.textAlign = "center";
  ctx.font = "bold 56px Segoe UI, sans-serif";
  ctx.fillText("СЕРТИФИКАТ", W / 2, 150);
  ctx.font = "22px Segoe UI, sans-serif";
  ctx.fillStyle = "#a6adc8";
  ctx.fillText("подтверждает, что", W / 2, 205);
  ctx.fillStyle = "#89b4fa";
  ctx.font = "bold 44px Segoe UI, sans-serif";
  ctx.fillText("Данияр Кишкенов", W / 2, 290);
  ctx.fillStyle = "#cdd6f4";
  ctx.font = "24px Segoe UI, sans-serif";
  ctx.fillText(`успешно прошёл(ла) курс турецкого языка и достиг(ла) уровня ${_certLevel || "A1"} (CEFR)`, W / 2, 360);
  ctx.fillStyle = "#a6adc8";
  ctx.font = "20px Segoe UI, sans-serif";
  ctx.fillText("в рамках проекта «Умный тренажёр подготовки»", W / 2, 405);
  ctx.fillStyle = "#cdd6f4";
  ctx.font = "22px Segoe UI, sans-serif";
  ctx.fillText(new Date().toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" }), W / 2, 560);
  ctx.font = "18px Segoe UI, sans-serif";
  ctx.fillStyle = "#a6adc8";
  ctx.fillText("Астана, Казахстан", W / 2, 600);
}
function openCert() {
  document.getElementById("certModal").classList.add("open");
  drawCert();
}
function closeCert() { document.getElementById("certModal").classList.remove("open"); }
function downloadCert() {
  const canvas = document.getElementById("certCanvas");
  if (!canvas) return;
  const a = document.createElement("a");
  a.href = canvas.toDataURL("image/png");
  a.download = "certifikat_turkce.png";
  a.click();
}

/* ---------- Пробный ЕНТ (60 заданий, 120 минут) ---------- */
let _examPool = null;
function renderExam() {
  const math = window._data["math"] || { topics: [] };
  const inf = window._data["inf"] || { topics: [] };
  const mathTasks = [];
  (math.topics || []).forEach((t) => {
    (t.tasks || []).forEach((q) => {
      mathTasks.push(Object.assign({}, q, { topic: t.title }));
    });
  });
  const infTasks = [];
  (inf.topics || []).forEach((t) => {
    (t.tasks || []).forEach((q) => {
      infTasks.push(Object.assign({}, q, { topic: t.title }));
    });
  });
  if (!mathTasks.length || !infTasks.length) {
    content.innerHTML = '<div class="card">⚠️ Данные ещё загружаются. Подожди пару секунд и открой раздел снова.</div>';
    return;
  }
  const pick = (arr, n) => shuffleArr(arr).slice(0, n);
  const m = pick(mathTasks, Math.min(20, mathTasks.length)).map((q, i) => Object.assign({}, q, { id: "m" + (i + 1) }));
  const infn = Math.min(40, infTasks.length);
  const infPicked = pick(infTasks, infn).map((q, i) => Object.assign({}, q, { id: "i" + (i + 1) }));
  _examPool = m.concat(infPicked);
  _examPool.forEach((q, i) => { q.examNum = i + 1; });

  const totalPoints = _examPool.reduce((s, q) => s + (POINTS[q.type] || 1), 0);
  const html = `<h1>🧪 Пробный ЕНТ</h1>
    <div class="subtitle">Собран из случайных заданий: ${m.length} по математике + ${infn} по информатике. Как на настоящем экзамене.</div>
    <div class="card exam-intro">📋 Сокращённая форма ТиПО: 60 заданий · 70 баллов · 120 минут (математика 20×1 балл, информатика 20×1 + 10×2 + 10×1). Вопросы перемешаны и меняются при каждом новом открытии.</div>
    ${renderTimer(120)}
    ${renderQuiz(_examPool, "exam", 1)}
    <div class="muted" style="margin-top:10px">Сумма баллов за этот вариант: ${totalPoints} (задания из вопросников тренажёра).</div>`;
  content.innerHTML = html;
  startTimer(120);
  bindQuiz();
}
function checkExam() {
  checkGroup("exam");
}

/* ---------- Привязка шапки ---------- */
function initTopbar() {
  const input = document.getElementById("topSearch");
  if (input) {
    input.addEventListener("input", () => doSearch(input.value));
    input.addEventListener("focus", () => doSearch(input.value));
    document.addEventListener("click", (e) => {
      if (!e.target.closest(".top-search")) document.getElementById("searchResults")?.classList.remove("open");
    });
  }
  const t = document.getElementById("themeToggle");
  if (t) t.addEventListener("click", toggleTheme);
  const c = document.getElementById("certBtn");
  if (c) c.addEventListener("click", openCert);
  const modalClose = document.getElementById("certClose");
  if (modalClose) modalClose.addEventListener("click", closeCert);
  const dl = document.getElementById("certDownload");
  if (dl) dl.addEventListener("click", downloadCert);
  initTheme();
}

/* считаем, что данные уже загружены в window._data */
window._data = {};
const loadAll = () => {
  Object.entries(FILE_MAP).forEach(([view, f]) => {
    fetch(`data/${f}.json`).then((r) => r.json()).then((d) => (window._data[view] = d)).catch(() => {});
  });
  // карта: фраза -> mp3 (озвучка носителем)
  fetch("data/voice_map.json").then((r) => r.json()).then((m) => (voiceMap = m)).catch(() => {});
};
loadAll();
initTopbar();
render();

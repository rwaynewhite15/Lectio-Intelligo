/* ============================================================
   Lectio-Intelligo — Game Logic
   ============================================================ */

(function () {
  "use strict";

  /* ---------- state ---------- */
  let quizQuestions = [];   // [{...question, shuffledChoices, answer}]
  let currentIndex = 0;
  let score = 0;
  let missed = [];          // questions answered incorrectly
  let answered = false;

  /* ---------- element handles ---------- */
  const $ = (sel) => document.querySelector(sel);
  const screens = {
    setup: $("#screen-setup"),
    quiz: $("#screen-quiz"),
    results: $("#screen-results"),
  };

  function showScreen(name) {
    Object.values(screens).forEach((s) => s.classList.remove("active"));
    screens[name].classList.add("active");
    window.scrollTo(0, 0);
  }

  /* ---------- helpers ---------- */
  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function questionCount(srcId) {
    return QUESTION_BANK.filter((q) => q.src === srcId).length;
  }

  const SRC_KIND = {};
  SOURCE_GROUPS.forEach((g) => g.items.forEach((item) => (SRC_KIND[item] = g.kind)));

  function displayName(srcId) {
    return srcId.replace(/^CCC /, "").replace(/^Saints — /, "");
  }

  /* ---------- persistent progress (localStorage) ---------- */
  const STORAGE_KEY = "lectio-intelligo-progress-v1";

  // Stable id per question, derived from its source and text, so saved
  // progress survives reordering or adding questions to the bank.
  function questionId(q) {
    const s = q.src + "|" + q.q;
    let h = 5381;
    for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0;
    return h.toString(36);
  }

  function loadProgress() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
    } catch (e) {
      return {};
    }
  }

  let progress = loadProgress(); // { [questionId]: 1 } once answered correctly

  function saveProgress() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    } catch (e) {
      /* storage unavailable (e.g. private browsing) — play without saving */
    }
  }

  function masteredCount(srcId) {
    return QUESTION_BANK.filter((q) => q.src === srcId && progress[questionId(q)]).length;
  }

  function refreshMastery() {
    document.querySelectorAll(".mastery").forEach((span) => {
      let total, done;
      if (span.dataset.group) {
        const group = SOURCE_GROUPS.find((g) => g.name === span.dataset.group);
        const items = group ? group.items : [];
        total = items.reduce((n, item) => n + questionCount(item), 0);
        done = items.reduce((n, item) => n + masteredCount(item), 0);
      } else {
        total = questionCount(span.dataset.src);
        done = masteredCount(span.dataset.src);
      }
      const pct = total ? Math.round((done / total) * 100) : 0;
      span.textContent = pct + "%";
      span.classList.toggle("done", total > 0 && done === total);
    });
    const total = QUESTION_BANK.length;
    const done = QUESTION_BANK.filter((q) => progress[questionId(q)]).length;
    const pct = total ? Math.round((done / total) * 100) : 0;
    const fill = $("#overall-fill");
    if (fill) fill.style.width = pct + "%";
    const text = $("#overall-text");
    if (text) text.textContent =
      `${done} of ${total} questions answered correctly — ${pct}% complete.`;
  }

  /* ---------- setup screen ---------- */
  function buildSetup() {
    const container = $("#source-groups");
    container.innerHTML = "";

    SOURCE_GROUPS.forEach((group, gi) => {
      const fieldset = document.createElement("fieldset");
      fieldset.className = "source-group " + group.kind;

      const legend = document.createElement("legend");
      legend.textContent = group.name;
      const groupMastery = document.createElement("span");
      groupMastery.className = "mastery";
      groupMastery.dataset.group = group.name;
      legend.appendChild(groupMastery);
      fieldset.appendChild(legend);

      const toggleRow = document.createElement("div");
      toggleRow.className = "group-toggle-row";
      const selectAll = document.createElement("button");
      selectAll.type = "button";
      selectAll.className = "link-btn";
      selectAll.textContent = "Select all";
      const selectNone = document.createElement("button");
      selectNone.type = "button";
      selectNone.className = "link-btn";
      selectNone.textContent = "Clear";
      toggleRow.append(selectAll, " · ", selectNone);
      fieldset.appendChild(toggleRow);

      const grid = document.createElement("div");
      grid.className = "source-grid";

      group.items.forEach((item) => {
        const n = questionCount(item);
        if (n === 0) return;
        const label = document.createElement("label");
        label.className = "source-item";
        const cb = document.createElement("input");
        cb.type = "checkbox";
        cb.value = item;
        cb.className = "source-cb";
        cb.addEventListener("change", updateStartState);
        label.append(cb, ` ${displayName(item)} `);
        const count = document.createElement("span");
        count.className = "count";
        count.textContent = `(${n})`;
        label.appendChild(count);
        const mastery = document.createElement("span");
        mastery.className = "mastery";
        mastery.dataset.src = item;
        label.appendChild(mastery);
        grid.appendChild(label);
      });

      selectAll.addEventListener("click", () => {
        grid.querySelectorAll("input").forEach((cb) => (cb.checked = true));
        updateStartState();
      });
      selectNone.addEventListener("click", () => {
        grid.querySelectorAll("input").forEach((cb) => (cb.checked = false));
        updateStartState();
      });

      fieldset.appendChild(grid);
      container.appendChild(fieldset);
    });
  }

  function selectedSources() {
    return Array.from(document.querySelectorAll(".source-cb:checked")).map(
      (cb) => cb.value
    );
  }

  function selectedType() {
    return $("input[name='qtype']:checked").value; // both | conceptual | fill
  }

  function availablePool() {
    const sources = new Set(selectedSources());
    const type = selectedType();
    return QUESTION_BANK.filter(
      (q) => sources.has(q.src) && (type === "both" || q.type === type)
    );
  }

  function updateStartState() {
    const pool = availablePool();
    const btn = $("#btn-start");
    const note = $("#pool-note");
    btn.disabled = pool.length === 0;
    if (selectedSources().length === 0) {
      note.textContent = "Select at least one book or Catechism section.";
    } else if (pool.length === 0) {
      note.textContent = "No questions of that type in your selection — try a different question style.";
    } else {
      note.textContent = `${pool.length} question${pool.length === 1 ? "" : "s"} available from your selection.`;
    }
  }

  /* ---------- quiz flow ---------- */
  function startQuiz() {
    const pool = shuffle(availablePool());
    const wanted = $("#num-questions").value;
    const n = wanted === "all" ? pool.length : Math.min(parseInt(wanted, 10), pool.length);

    quizQuestions = pool.slice(0, n).map((q) => ({
      ...q,
      shuffledChoices: shuffle(q.choices),
      answer: q.choices[0],
    }));
    currentIndex = 0;
    score = 0;
    missed = [];
    showScreen("quiz");
    renderQuestion();
  }

  function renderQuestion() {
    answered = false;
    const q = quizQuestions[currentIndex];

    $("#quiz-progress").textContent = `Question ${currentIndex + 1} of ${quizQuestions.length}`;
    $("#quiz-score").textContent = `Score: ${score}`;
    const pct = (currentIndex / quizQuestions.length) * 100;
    $("#progress-fill").style.width = pct + "%";

    const srcBadge = $("#badge-source");
    srcBadge.textContent = displayName(q.src);
    srcBadge.className = "badge badge-" + (SRC_KIND[q.src] || "bible");

    const typeBadge = $("#badge-type");
    typeBadge.textContent = q.type === "fill" ? "Fill in the blank" : "Conceptual";
    typeBadge.className = "badge badge-type";

    $("#question-text").textContent = q.q;

    const list = $("#choices");
    list.innerHTML = "";
    q.shuffledChoices.forEach((choice, i) => {
      const li = document.createElement("li");
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "choice";
      btn.innerHTML = `<span class="key">${i + 1}</span><span class="choice-text"></span>`;
      btn.querySelector(".choice-text").textContent = choice;
      btn.addEventListener("click", () => selectAnswer(btn, choice));
      li.appendChild(btn);
      list.appendChild(li);
    });

    $("#feedback").hidden = true;
    $("#btn-next").hidden = true;
  }

  function selectAnswer(btn, choice) {
    if (answered) return;
    answered = true;

    const q = quizQuestions[currentIndex];
    const correct = choice === q.answer;
    if (correct) {
      score++;
      progress[questionId(q)] = 1;
      saveProgress();
    } else {
      missed.push(q);
    }

    document.querySelectorAll(".choice").forEach((b) => {
      b.disabled = true;
      const text = b.querySelector(".choice-text").textContent;
      if (text === q.answer) b.classList.add("correct");
    });
    if (!correct) btn.classList.add("incorrect");

    const fb = $("#feedback");
    fb.hidden = false;
    fb.className = "feedback " + (correct ? "good" : "bad");
    $("#feedback-verdict").textContent = correct
      ? "Recte! Correct."
      : "Not quite — the answer is: " + q.answer;
    $("#feedback-ref").textContent = "📖 " + q.ref;

    $("#quiz-score").textContent = `Score: ${score}`;
    const next = $("#btn-next");
    next.hidden = false;
    next.textContent =
      currentIndex + 1 === quizQuestions.length ? "See results" : "Next question";
    next.focus();
  }

  function nextQuestion() {
    currentIndex++;
    if (currentIndex >= quizQuestions.length) showResults();
    else renderQuestion();
  }

  /* ---------- results ---------- */
  function showResults() {
    showScreen("results");
    const total = quizQuestions.length;
    const pct = Math.round((score / total) * 100);

    $("#results-score").textContent = `${score} / ${total}`;
    $("#results-pct").textContent = pct + "%";

    let msg;
    if (pct === 100) msg = "Optime! A perfect score — well studied indeed.";
    else if (pct >= 80) msg = "Bene factum! An excellent grasp of the faith.";
    else if (pct >= 60) msg = "Good work — keep reading and praying.";
    else if (pct >= 40) msg = "A worthy start. Lectio divina awaits!";
    else msg = "Every saint was once a beginner. Try again!";
    $("#results-message").textContent = msg;

    const reviewWrap = $("#review-wrap");
    const review = $("#review-list");
    review.innerHTML = "";
    if (missed.length === 0) {
      reviewWrap.hidden = true;
    } else {
      reviewWrap.hidden = false;
      missed.forEach((q) => {
        const li = document.createElement("li");
        const qEl = document.createElement("p");
        qEl.className = "review-q";
        qEl.textContent = q.q;
        const aEl = document.createElement("p");
        aEl.className = "review-a";
        aEl.textContent = `Answer: ${q.answer} — ${q.ref}`;
        li.append(qEl, aEl);
        review.appendChild(li);
      });
    }
  }

  /* ---------- keyboard shortcuts ---------- */
  document.addEventListener("keydown", (e) => {
    if (!screens.quiz.classList.contains("active")) return;
    if (!answered && e.key >= "1" && e.key <= "4") {
      const btns = document.querySelectorAll(".choice");
      const i = parseInt(e.key, 10) - 1;
      if (btns[i]) btns[i].click();
    } else if (answered && e.key === "Enter") {
      nextQuestion();
    }
  });

  /* ---------- wire up ---------- */
  // Null-safe listener attachment: if one element is missing (e.g. a stale
  // cached page), the rest of the game still gets wired up.
  function on(selector, handler) {
    const el = $(selector);
    if (el) el.addEventListener("click", handler);
  }

  function setAllSources(checked) {
    document.querySelectorAll(".source-cb").forEach((cb) => (cb.checked = checked));
    updateStartState();
  }

  document.addEventListener("DOMContentLoaded", () => {
    buildSetup();
    updateStartState();
    refreshMastery();
    on("#btn-reset-progress", () => {
      if (!confirm("Reset all saved progress? This cannot be undone.")) return;
      progress = {};
      try { localStorage.removeItem(STORAGE_KEY); } catch (e) { /* ignore */ }
      refreshMastery();
    });
    document.querySelectorAll("input[name='qtype']").forEach((r) =>
      r.addEventListener("change", updateStartState)
    );
    on("#btn-select-all", () => setAllSources(true));
    on("#btn-clear-all", () => setAllSources(false));
    on("#btn-start", startQuiz);
    on("#btn-next", nextQuestion);
    on("#btn-quit", () => {
      showScreen("setup");
      refreshMastery();
    });
    on("#btn-again", startQuiz);
    on("#btn-new-selection", () => {
      showScreen("setup");
      updateStartState();
      refreshMastery();
    });
  });
})();

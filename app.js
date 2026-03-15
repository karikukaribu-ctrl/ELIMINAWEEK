const STORAGE_KEY = "illuminator_v1_minimal";

const state = loadState();
let editingTaskId = null;

const seasons = ["hiver", "printemps", "ete", "automne"];
const kiffBank = {
  1: [
    "Regarder la lumière sur le mur.",
    "Fermer les yeux et respirer dix fois.",
    "Taper un rythme très court.",
    "Noter une idée brute.",
    "Boire un verre d’eau lentement."
  ],
  5: [
    "Improviser cinq minutes sur un rythme.",
    "Écouter un extrait musical précis.",
    "Écrire trois idées pour un projet.",
    "Faire une micro-marche.",
    "Lire un seul paragraphe stimulant."
  ],
  30: [
    "Session libre de batterie.",
    "Lecture ciblée d’un passage utile.",
    "Explorer une idée pour l’application.",
    "Bloc sport court.",
    "Réorganiser un sous-projet."
  ],
  60: [
    "Bloc créatif sans objectif strict.",
    "Étude musicale complète.",
    "Marche prolongée ou sport calme.",
    "Travail profond sur un projet secondaire.",
    "Réflexion écrite sur un sujet choisi."
  ]
};

bootstrap();
bindUI();
renderAll();

function bootstrap() {
  if (!state.projects || !state.projects.length) {
    state.projects = [
      makeProject("Article", "#8dbcf0"),
      makeProject("Stage", "#89c9a1"),
      makeProject("Livre", "#d5a26f"),
      makeProject("Musique", "#b79ae7"),
      makeProject("Sport", "#c98a8a"),
      makeProject("App", "#7db7d9")
    ];
  }

  if (!state.tasks || !state.tasks.length) {
    state.tasks = [
      makeTask("Clarifier l’introduction", 30, state.projects[0].id, "medium"),
      makeTask("Plan partie 2", 20, state.projects[0].id, "easy"),
      makeTask("Relire structure", 25, state.projects[1].id, "medium"),
      makeTask("Rythme batterie", 10, state.projects[3].id, "easy"),
      makeTask("Bloc sport court", 20, state.projects[4].id, "medium"),
      makeTask("Ajuster interface", 25, state.projects[5].id, "hard"),
      makeTask("Lire quelques pages", 15, state.projects[2].id, "easy")
    ];
    state.currentTaskId = state.tasks[0].id;
  }

  if (!state.notes) state.notes = "";
  if (!state.settings) {
    state.settings = {
      mode: "sombre",
      season: "hiver",
      font: "inter",
      scale: 16,
      focus: false
    };
  }

  if (!state.day) {
    state.day = {
      totalSlots: 12,
      doneSlots: 0,
      currentSlot: 0,
      kiffSlots: [3, 8]
    };
  }

  saveState();
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function makeProject(name, color) {
  return {
    id: uid(),
    name,
    color,
    progress: Math.floor(Math.random() * 55)
  };
}

function makeTask(title, minutes, projectId, difficulty = "medium") {
  return {
    id: uid(),
    title,
    minutes,
    projectId,
    difficulty,
    status: "todo"
  };
}

function bindUI() {
  $("#btnLeft").onclick = () => openPanel("left");
  $("#btnRight").onclick = () => openPanel("right");
  $("#leftClose").onclick = closePanels;
  $("#rightClose").onclick = closePanels;
  $("#panelBack").onclick = closePanels;

  document.querySelectorAll("[data-lefttab]").forEach(btn => {
    btn.onclick = () => switchTab("left", btn.dataset.lefttab);
  });

  document.querySelectorAll("[data-righttab]").forEach(btn => {
    btn.onclick = () => switchTab("right", btn.dataset.righttab);
  });

  $("#modeToggle").onclick = toggleMode;
  $("#seasonCycle").onclick = cycleSeason;
  $("#focusBtn").onclick = toggleFocus;

  $("#fontSel").onchange = (e) => {
    state.settings.font = e.target.value;
    saveState();
    renderAll();
  };

  $("#uiScale").oninput = (e) => {
    state.settings.scale = Number(e.target.value);
    saveState();
    renderAll();
  };

  $("#inboxAdd").onclick = addInboxTasks;
  $("#inboxClear").onclick = () => $("#inboxText").value = "";
  $("#addProjectBtn").onclick = addProject;
  $("#resetAppBtn").onclick = resetApp;

  $("#rouletteBtn").onclick = chooseTask;
  $("#nextTaskBtn").onclick = chooseTask;
  $("#startBtn").onclick = startTask;
  $("#doneTaskBtn").onclick = completeCurrentTask;
  $("#shrinkBtn").onclick = shrinkCurrentTask;
  $("#editTaskBtn").onclick = openEditModal;

  document.querySelectorAll(".kiff-btn").forEach(btn => {
    btn.onclick = () => suggestKiff(Number(btn.dataset.kiff));
  });

  $("#notesArea").oninput = (e) => {
    state.notes = e.target.value;
    saveState();
  };

  $("#modalClose").onclick = closeEditModal;
  $("#modalBack").onclick = closeEditModal;
  $("#saveEditBtn").onclick = saveTaskEdit;
  $("#deleteTaskBtn").onclick = deleteTask;
}

function renderAll() {
  applySettings();
  renderCenter();
  renderProjects();
  renderTasks();
  renderDay();
  renderWeek();
  renderMonth();
  renderNotes();
}

function applySettings() {
  document.body.classList.toggle("mode--sombre", state.settings.mode === "sombre");
  document.body.classList.remove("theme--hiver", "theme--printemps", "theme--ete", "theme--automne");
  document.body.classList.add(`theme--${state.settings.season}`);
  document.body.classList.toggle("is-focus", !!state.settings.focus);
  document.body.setAttribute("data-font", state.settings.font);
  document.documentElement.style.setProperty("--baseSize", `${state.settings.scale}px`);

  $("#modeToggle").textContent = state.settings.mode === "sombre" ? "Clair" : "Sombre";
  $("#seasonCycle").textContent = labelSeason(state.settings.season);
  $("#focusBtn").textContent = state.settings.focus ? "Normal" : "Focus";
  $("#fontSel").value = state.settings.font;
  $("#uiScale").value = state.settings.scale;
}

function renderCenter() {
  const current = getCurrentTask();
  const progress = computeDayProgress();

  $("#dayProgressFill").style.width = `${progress}%`;
  $("#dayProgressText").textContent = `${progress}%`;

  $("#statusSpot").textContent = current ? "En cours potentiel." : "Aucune tâche active.";
  $("#taskTitle").textContent = current ? current.title : "Aucune tâche";
  $("#taskMeta").textContent = current
    ? `${projectName(current.projectId)} · ${current.minutes} min`
    : "—";

  $("#pillTasks").textContent = `${state.tasks.filter(t => t.status !== "done").length} tâches`;
  $("#pillDone").textContent = `${state.tasks.filter(t => t.status === "done").length} faites`;
  $("#pillFocus").textContent = state.settings.focus ? "focus réduit" : "focus normal";
}

function renderProjects() {
  const list = $("#projectList");
  const towers = $("#projectTowers");

  list.innerHTML = "";
  towers.innerHTML = "";

  state.projects.forEach(project => {
    const tasks = state.tasks.filter(t => t.projectId === project.id);
    const done = tasks.filter(t => t.status === "done").length;
    const pct = tasks.length ? Math.round((done / tasks.length) * 100) : project.progress;
    project.progress = pct;

    const card = el("div", "card");
    card.innerHTML = `
      <div class="card__left">
        <div class="card__title">${escapeHTML(project.name)}</div>
        <div class="card__sub">${pct}%</div>
      </div>
      <div class="card__actions">
        <button class="action-btn project-pick-btn" data-id="${project.id}">Choisir</button>
      </div>
    `;
    list.appendChild(card);

    const isActive = getCurrentTask()?.projectId === project.id;
    const tower = el("div", `tower ${isActive ? "is-active" : ""}`);
    tower.innerHTML = `
      <div class="tower__name">${escapeHTML(project.name)}</div>
      <div class="tower__bar">
        <div class="tower__fill" style="height:${pct}%; background:
          linear-gradient(180deg, rgba(255,255,255,.18), transparent 30%),
          linear-gradient(180deg, ${lighten(project.color)}, ${project.color});"></div>
      </div>
      <div class="tower__pct">${pct}%</div>
    `;
    tower.onclick = () => chooseProjectTask(project.id);
    towers.appendChild(tower);
  });

  document.querySelectorAll(".project-pick-btn").forEach(btn => {
    btn.onclick = () => chooseProjectTask(btn.dataset.id);
  });
}

function renderTasks() {
  const taskList = $("#taskList");
  taskList.innerHTML = "";

  state.tasks.forEach(task => {
    const card = el("div", "card");
    card.innerHTML = `
      <div class="card__left">
        <div class="card__title">${escapeHTML(task.title)}</div>
        <div class="card__sub">${projectName(task.projectId)} · ${task.minutes} min · ${labelDifficulty(task.difficulty)} · ${task.status}</div>
      </div>
      <div class="card__actions">
        <button class="action-btn tiny-pick" data-id="${task.id}">Choisir</button>
        <button class="action-btn tiny-edit" data-id="${task.id}">Éditer</button>
      </div>
    `;
    taskList.appendChild(card);
  });

  document.querySelectorAll(".tiny-pick").forEach(btn => {
    btn.onclick = () => {
      state.currentTaskId = btn.dataset.id;
      saveState();
      renderAll();
    };
  });

  document.querySelectorAll(".tiny-edit").forEach(btn => {
    btn.onclick = () => openEditModal(btn.dataset.id);
  });
}

function renderDay() {
  const timeline = $("#dayTimeline");
  timeline.innerHTML = "";

  const { totalSlots, doneSlots, currentSlot, kiffSlots } = state.day;

  for (let i = 0; i < totalSlots; i++) {
    const seg = el("div", "timeline-seg");

    if (kiffSlots.includes(i)) {
      seg.classList.add("is-kiff");
    } else if (i < doneSlots) {
      seg.classList.add("is-done");
    } else if (i === currentSlot) {
      seg.classList.add("is-current");
    } else {
      seg.classList.add("is-future");
    }

    timeline.appendChild(seg);
  }

  const summary = $("#daySummary");
  summary.innerHTML = `
    <div class="surprise-card">Fait : ${doneSlots}/${totalSlots}</div>
    <div class="surprise-card">Actuel : ${currentSlot + 1}/${totalSlots}</div>
    <div class="surprise-card">Reste : ${Math.max(0, totalSlots - doneSlots)}</div>
  `;
}

function renderWeek() {
  const week = $("#weekBars");
  week.innerHTML = "";
  const base = [32, 56, 41, 68, 29, 51, 18];

  base.forEach((v, i) => {
    const row = el("div", "week-row");
    row.innerHTML = `
      <div class="week-row__day">${["L","M","M","J","V","S","D"][i]}</div>
      <div class="week-row__bar"><div class="week-row__fill" style="width:${v}%"></div></div>
      <div class="week-row__value">${v}%</div>
    `;
    week.appendChild(row);
  });
}

function renderMonth() {
  const grid = $("#monthGrid");
  grid.innerHTML = "";

  for (let i = 1; i <= 30; i++) {
    const level = Math.floor(Math.random() * 100);
    const cell = el("div", "calendar-cell");
    cell.innerHTML = `
      <div class="calendar-cell__fill" style="height:${level}%"></div>
      <div class="calendar-cell__label">${i}</div>
    `;
    grid.appendChild(cell);
  }
}

function renderNotes() {
  $("#notesArea").value = state.notes || "";
}

function addInboxTasks() {
  const raw = $("#inboxText").value.trim();
  if (!raw) return;

  const lines = raw.split("\n").map(s => s.trim()).filter(Boolean);
  const defaultProject = state.projects[0]?.id;

  lines.forEach(line => {
    const match = line.match(/^(.*?)(?:\s*-\s*(\d+))?$/);
    const title = match?.[1]?.trim() || line;
    const minutes = Number(match?.[2] || 20);
    state.tasks.push(makeTask(title, minutes, defaultProject, "medium"));
  });

  $("#inboxText").value = "";
  saveState();
  renderAll();
}

function addProject() {
  const name = $("#newProjectName").value.trim();
  const color = $("#newProjectColor").value;
  if (!name) return;

  state.projects.push(makeProject(name, color));
  $("#newProjectName").value = "";
  saveState();
  renderAll();
}

function chooseTask() {
  const wheel = $("#rouletteWheel");
  wheel.classList.add("is-spinning");
  setTimeout(() => wheel.classList.remove("is-spinning"), 900);

  const pool = state.tasks.filter(t => t.status !== "done");
  if (!pool.length) return;

  const chosen = pool[Math.floor(Math.random() * pool.length)];
  state.currentTaskId = chosen.id;
  saveState();
  renderAll();
}

function chooseProjectTask(projectId) {
  const pool = state.tasks.filter(t => t.projectId === projectId && t.status !== "done");
  if (!pool.length) return;
  state.currentTaskId = pool[0].id;
  saveState();
  renderAll();
}

function startTask() {
  const current = getCurrentTask();
  if (!current) return;
  current.status = "doing";
  state.day.currentSlot = Math.min(state.day.currentSlot + 1, state.day.totalSlots - 1);
  saveState();
  renderAll();
}

function completeCurrentTask() {
  const current = getCurrentTask();
  if (!current) return;
  current.status = "done";
  state.day.doneSlots = Math.min(state.day.doneSlots + 1, state.day.totalSlots);
  state.day.currentSlot = Math.min(state.day.doneSlots, state.day.totalSlots - 1);

  const next = state.tasks.find(t => t.status !== "done");
  state.currentTaskId = next ? next.id : null;

  saveState();
  renderAll();
}

function shrinkCurrentTask() {
  const current = getCurrentTask();
  if (!current) return;
  current.minutes = Math.max(5, Math.ceil(current.minutes / 2));
  if (current.title.length < 42) {
    current.title = `${current.title} — version réduite`;
  }
  saveState();
  renderAll();
}

function openEditModal(taskId = null) {
  const current = taskId ? state.tasks.find(t => t.id === taskId) : getCurrentTask();
  if (!current) return;

  editingTaskId = current.id;
  $("#editTaskName").value = current.title;
  $("#editTaskMinutes").value = current.minutes;
  $("#editTaskDifficulty").value = current.difficulty;

  const projectSelect = $("#editTaskProject");
  projectSelect.innerHTML = state.projects
    .map(p => `<option value="${p.id}" ${p.id === current.projectId ? "selected" : ""}>${escapeHTML(p.name)}</option>`)
    .join("");

  $("#modalBack").hidden = false;
  $("#editModal").hidden = false;
}

function closeEditModal() {
  editingTaskId = null;
  $("#modalBack").hidden = true;
  $("#editModal").hidden = true;
}

function saveTaskEdit() {
  const task = state.tasks.find(t => t.id === editingTaskId);
  if (!task) return;

  task.title = $("#editTaskName").value.trim() || task.title;
  task.minutes = Math.max(1, Number($("#editTaskMinutes").value) || task.minutes);
  task.difficulty = $("#editTaskDifficulty").value;
  task.projectId = $("#editTaskProject").value;

  saveState();
  closeEditModal();
  renderAll();
}

function deleteTask() {
  if (!editingTaskId) return;
  state.tasks = state.tasks.filter(t => t.id !== editingTaskId);
  if (state.currentTaskId === editingTaskId) {
    state.currentTaskId = state.tasks[0]?.id || null;
  }
  saveState();
  closeEditModal();
  renderAll();
}

function suggestKiff(minutes) {
  const pool = kiffBank[minutes] || [];
  const pick = pool[Math.floor(Math.random() * pool.length)] || "Rien pour l’instant.";
  $("#kiffSuggestion").textContent = pick;
}

function toggleMode() {
  state.settings.mode = state.settings.mode === "sombre" ? "clair" : "sombre";
  saveState();
  renderAll();
}

function cycleSeason() {
  const idx = seasons.indexOf(state.settings.season);
  state.settings.season = seasons[(idx + 1) % seasons.length];
  saveState();
  renderAll();
}

function toggleFocus() {
  state.settings.focus = !state.settings.focus;
  saveState();
  renderAll();
}

function switchTab(side, tab) {
  document.querySelectorAll(`[data-${side}tab]`).forEach(btn => {
    btn.classList.toggle("is-active", btn.dataset[`${side}tab`] === tab);
  });
  document.querySelectorAll(side === "left" ? "#leftPanel .tab-page" : "#rightPanel .tab-page").forEach(page => {
    page.classList.remove("is-show");
  });
  const page = document.getElementById(`${side}-${tab}`);
  if (page) page.classList.add("is-show");
}

function openPanel(side) {
  $("#panelBack").hidden = false;
  if (side === "left") $("#leftPanel").hidden = false;
  if (side === "right") $("#rightPanel").hidden = false;
}

function closePanels() {
  $("#panelBack").hidden = true;
  $("#leftPanel").hidden = true;
  $("#rightPanel").hidden = true;
}

function resetApp() {
  localStorage.removeItem(STORAGE_KEY);
  location.reload();
}

function getCurrentTask() {
  return state.tasks.find(t => t.id === state.currentTaskId) || null;
}

function computeDayProgress() {
  return Math.round((state.day.doneSlots / state.day.totalSlots) * 100);
}

function projectName(id) {
  return state.projects.find(p => p.id === id)?.name || "—";
}

function labelDifficulty(v) {
  if (v === "easy") return "facile";
  if (v === "hard") return "lourd";
  return "moyen";
}

function labelSeason(v) {
  if (v === "hiver") return "Hiver";
  if (v === "printemps") return "Printemps";
  if (v === "ete") return "Été";
  if (v === "automne") return "Automne";
  return v;
}

function lighten(hex) {
  const c = hex.replace("#", "");
  const n = parseInt(c, 16);
  let r = (n >> 16) + 30;
  let g = ((n >> 8) & 255) + 30;
  let b = (n & 255) + 30;
  r = Math.min(255, r);
  g = Math.min(255, g);
  b = Math.min(255, b);
  return `rgb(${r}, ${g}, ${b})`;
}

function escapeHTML(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function $(sel) {
  return document.querySelector(sel);
}

function el(tag, cls = "") {
  const node = document.createElement(tag);
  if (cls) node.className = cls;
  return node;
}

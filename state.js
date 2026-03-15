const STORAGE_KEY = "illuminator-v1-bullet-cockpit";

const defaultState = {
  settings: {
    mode: "dark",
    season: "winter",
    selectedDate: todayISO(),
    monthCursor: monthCursorFromDate(todayISO()),
    miniMonthCursor: monthCursorFromDate(todayISO()),
    activeView: "day",
    energy: 76,
    weeklyObjective: "Faire avancer les projets centraux avec une charge soutenable.",
    dailyObjective: "Transformer la journée en blocs concrets et visibles."
  },
  dayCapacity: {
    120: 2,
    60: 2,
    30: 2,
    15: 2
  },
  projects: [
    {
      id: uid(),
      name: "Article — groupes thérapeutiques et addiction aux écrans",
      objective: "Structurer, documenter et rédiger l’article de 15 pages avec sources, plan et discussion clinique.",
      color: "#64c8ff"
    },
    {
      id: uid(),
      name: "Carnet de stage",
      objective: "Faire progresser la rédaction, l’analyse réflexive, les liens théoriques et la mise en forme finale.",
      color: "#93d977"
    },
    {
      id: uid(),
      name: "Organisation hebdo",
      objective: "Répartir les blocs, garder une vision d’ensemble et éviter l’éparpillement héroïque.",
      color: "#ffc46b"
    }
  ],
  tasks: [],
  externalEvents: [],
  dailyNotes: {},
  ui: {
    pickedTaskId: null
  }
};

let state = loadState();

bootstrapDemoIfNeeded();
init();

/* =========================
   INIT
========================= */

function init() {
  bindGlobalUI();
  renderAll();
}

function bindGlobalUI() {
  document.querySelectorAll(".topnav-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.settings.activeView = btn.dataset.view;
      saveState();
      renderAll();
    });
  });

  document.getElementById("modeSelect").addEventListener("change", (e) => {
    state.settings.mode = e.target.value;
    saveState();
    renderAll();
  });

  document.getElementById("seasonSelect").addEventListener("change", (e) => {
    state.settings.season = e.target.value;
    saveState();
    renderAll();
  });

  document.getElementById("datePicker").addEventListener("change", (e) => {
    state.settings.selectedDate = e.target.value;
    saveState();
    renderAll();
  });

  document.getElementById("saveCapacityBtn").addEventListener("click", saveCapacityFromInputs);
  document.getElementById("taskForm").addEventListener("submit", handleCreateTask);
  document.getElementById("externalForm").addEventListener("submit", handleCreateExternalEvent);
  document.getElementById("projectForm").addEventListener("submit", handleCreateProject);

  document.getElementById("randomPickBtn").addEventListener("click", pickRandomTask);
  document.getElementById("launchPickedTaskBtn").addEventListener("click", launchPickedTask);
  document.getElementById("migratePickedTaskBtn").addEventListener("click", migratePickedTask);

  document.getElementById("saveDailyNotesBtn").addEventListener("click", saveDailyNotes);
  document.getElementById("resetDemoBtn").addEventListener("click", resetDemo);

  document.getElementById("monthPrevBtn").addEventListener("click", () => {
    state.settings.monthCursor = shiftMonthCursor(state.settings.monthCursor, -1);
    saveState();
    renderAll();
  });

  document.getElementById("monthNextBtn").addEventListener("click", () => {
    state.settings.monthCursor = shiftMonthCursor(state.settings.monthCursor, 1);
    saveState();
    renderAll();
  });

  document.getElementById("miniPrevMonth").addEventListener("click", () => {
    state.settings.miniMonthCursor = shiftMonthCursor(state.settings.miniMonthCursor, -1);
    saveState();
    renderAll();
  });

  document.getElementById("miniNextMonth").addEventListener("click", () => {
    state.settings.miniMonthCursor = shiftMonthCursor(state.settings.miniMonthCursor, 1);
    saveState();
    renderAll();
  });
}

/* =========================
   STATE / STORAGE
========================= */

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return structuredClone(defaultState);
    return JSON.parse(raw);
  } catch (error) {
    console.error("Impossible de lire localStorage", error);
    return structuredClone(defaultState);
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function resetDemo() {
  if (!confirm("Réinitialiser la démo Illuminator ?")) return;
  state = structuredClone(defaultState);
  bootstrapDemoIfNeeded();
  saveState();
  renderAll();
}

/* =========================
   DEMO DATA
========================= */

function bootstrapDemoIfNeeded() {
  if (state.tasks.length > 0 || state.externalEvents.length > 0) return;

  const [article, stage, orga] = state.projects;

  const today = todayISO();
  const tomorrow = addDays(today, 1);
  const afterTomorrow = addDays(today, 2);

  const demoTasks = [
    makeTask({
      title: "Clarifier la problématique générale",
      projectId: article.id,
      category: "deep",
      scheduledDate: today,
      startMinutes: 8 * 60,
      duration: 120,
      priority: 3,
      notes: "Définir l’angle : groupes thérapeutiques pour jeunes exposés à l’addiction aux écrans."
    }),
    makeTask({
      title: "Récupérer 5 sources principales",
      projectId: article.id,
      category: "resource",
      scheduledDate: today,
      startMinutes: 10 * 60 + 30,
      duration: 60,
      priority: 3,
      notes: "Articles récents + revue narrative + DBT si pertinent."
    }),
    makeTask({
      title: "Esquisser le plan du carnet de stage",
      projectId: stage.id,
      category: "deep",
      scheduledDate: today,
      startMinutes: 14 * 60,
      duration: 90,
      priority: 2,
      notes: "Parties principales, objectifs, réflexivité, conclusion."
    }),
    makeTask({
      title: "Répartir les blocs de la semaine",
      projectId: orga.id,
      category: "admin",
      scheduledDate: today,
      startMinutes: 17 * 60,
      duration: 30,
      priority: 2,
      notes: "Vérifier la charge et les grands objectifs."
    }),
    makeTask({
      title: "Rédiger l’introduction de l’article",
      projectId: article.id,
      category: "deep",
      scheduledDate: tomorrow,
      startMinutes: 9 * 60,
      duration: 120,
      priority: 3,
      notes: "Poser la problématique, la population et l’intérêt du groupe."
    }),
    makeTask({
      title: "Relecture réflexive d’un passage du carnet",
      projectId: stage.id,
      category: "resource",
      scheduledDate: tomorrow,
      startMinutes: 15 * 60,
      duration: 60,
      priority: 2,
      notes: "Fluidité, cohérence, ton professionnel."
    }),
    makeTask({
      title: "Brain dump des tâches libres",
      projectId: orga.id,
      category: "admin",
      scheduledDate: null,
      startMinutes: null,
      duration: 30,
      priority: 1,
      status: "inbox",
      notes: "Capturer les idées non rangées."
    }),
    makeTask({
      title: "Section : perspectives belges",
      projectId: article.id,
      category: "deep",
      scheduledDate: afterTomorrow,
      startMinutes: 13 * 60,
      duration: 90,
      priority: 2,
      notes: "Implémentation locale, limites, pistes."
    })
  ];

  const demoEvents = [
    makeExternalEvent({
      title: "Cours / engagement externe",
      date: tomorrow,
      startMinutes: 11 * 60 + 30,
      duration: 90
    }),
    makeExternalEvent({
      title: "Rendez-vous",
      date: afterTomorrow,
      startMinutes: 16 * 60,
      duration: 60
    })
  ];

  state.tasks.push(...demoTasks);
  state.externalEvents.push(...demoEvents);
  state.dailyNotes[today] = "Pense à garder des blocs respirables et à migrer sans culpabiliser.";
}

/* =========================
   FACTORIES
========================= */

function makeTask({
  title,
  projectId,
  category,
  scheduledDate = null,
  startMinutes = null,
  duration = 30,
  priority = 2,
  notes = "",
  status = "planned"
}) {
  return {
    id: uid(),
    title,
    projectId,
    category,
    scheduledDate,
    startMinutes,
    duration,
    priority,
    notes,
    status,
    createdAt: new Date().toISOString(),
    completedAt: null
  };
}

function makeExternalEvent({
  title,
  date,
  startMinutes,
  duration
}) {
  return {
    id: uid(),
    title,
    date,
    startMinutes,
    duration,
    source: "local-external"
  };
}

/* =========================
   RENDER ALL
========================= */

function renderAll() {
  applyTheme();
  syncInputs();
  renderHeader();
  renderNavigation();
  renderMission();
  renderRandomCard();
  renderProjectsLeft();
  renderMiniCalendar();
  renderBulletIndex();
  renderCapacityVisual();
  renderDayHero();
  renderDayTimeline();
  renderProjectOptions();
  renderWeek();
  renderMonth();
  renderProjectsWorkbench();
  renderJournal();
  renderReports();
  renderRightbar();
}

/* =========================
   RENDER — GLOBAL
========================= */

function applyTheme() {
  document.body.dataset.mode = state.settings.mode;
  document.body.dataset.season = state.settings.season;
}

function syncInputs() {
  document.getElementById("modeSelect").value = state.settings.mode;
  document.getElementById("seasonSelect").value = state.settings.season;
  document.getElementById("datePicker").value = state.settings.selectedDate;

  document.getElementById("cap120").value = state.dayCapacity[120];
  document.getElementById("cap60").value = state.dayCapacity[60];
  document.getElementById("cap30").value = state.dayCapacity[30];
  document.getElementById("cap15").value = state.dayCapacity[15];

  document.getElementById("taskDate").value = state.settings.selectedDate;
  document.getElementById("externalDate").value = state.settings.selectedDate;
  document.getElementById("dailyNotesInput").value = state.dailyNotes[state.settings.selectedDate] || "";
}

function renderHeader() {
  const selected = state.settings.selectedDate;
  document.getElementById("selectedDateLabel").textContent = formatLongDate(selected);
  document.getElementById("headerWeekLabel").textContent = getWeekLabel(selected);
  document.getElementById("headerChargeLabel").textContent = `${computeDayLoadPercent(selected)}%`;
}

function renderNavigation() {
  document.querySelectorAll(".topnav-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.view === state.settings.activeView);
  });

  document.querySelectorAll(".view").forEach((view) => {
    view.classList.remove("active");
  });

  const activeView = document.getElementById(`view-${state.settings.activeView}`);
  if (activeView) activeView.classList.add("active");
}

function renderMission() {
  document.getElementById("weeklyObjective").textContent = state.settings.weeklyObjective;
  document.getElementById("dailyObjective").textContent = state.settings.dailyObjective;
  document.getElementById("energyMetric").textContent = `${state.settings.energy}%`;
  document.getElementById("blocksMetric").textContent = String(getTasksForDate(state.settings.selectedDate).length);
}

function renderRandomCard() {
  const container = document.getElementById("randomTaskCard");
  const task = getPickedTask();

  if (!task) {
    container.innerHTML = `<div class="random-empty">Aucune tâche tirée. Clique sur <strong>tirer</strong>.</div>`;
    return;
  }

  const project = getProject(task.projectId);
  container.innerHTML = `
    <div class="stack-card-title">${escapeHTML(task.title)}</div>
    <div class="stack-card-meta">${project ? escapeHTML(project.name) : "Sans projet"}</div>
    <div class="task-chip-row" style="margin-top:10px;">
      <span class="task-chip">${task.duration} min</span>
      <span class="task-chip">priorité ${task.priority}</span>
      <span class="task-chip">${labelCategory(task.category)}</span>
      <span class="task-chip">${task.scheduledDate ? formatShortDate(task.scheduledDate) : "inbox"}</span>
    </div>
    <div class="stack-card-meta" style="margin-top:10px;">
      ${task.notes ? escapeHTML(task.notes) : "Pas de note pour cette cible."}
    </div>
  `;
}

function renderProjectsLeft() {
  const container = document.getElementById("leftProjectsList");
  const items = state.projects.map((project) => {
    const tasks = state.tasks.filter((t) => t.projectId === project.id);
    const done = tasks.filter((t) => t.status === "done").length;
    const progress = tasks.length ? Math.round((done / tasks.length) * 100) : 0;
    const next = tasks.find((t) => t.status !== "done");

    return `
      <div class="stack-card">
        <div class="stack-card-title">${escapeHTML(project.name)}</div>
        <div class="stack-card-meta">${escapeHTML(project.objective || "Sans objectif.")}</div>
        <div class="progress-bar" style="margin-top:10px;">
          <div class="progress-fill" style="width:${progress}%; background: linear-gradient(90deg, ${project.color}, var(--accent-2));"></div>
        </div>
        <div class="stack-card-meta" style="margin-top:8px;">
          Avancement : ${progress}% · ${done}/${tasks.length || 0}
        </div>
        <div class="stack-card-meta">
          Prochaine étape : ${next ? escapeHTML(next.title) : "Projet à jour"}
        </div>
      </div>
    `;
  });

  container.innerHTML = items.length
    ? items.join("")
    : `<div class="empty-state">Aucun projet actif.</div>`;
}

function renderBulletIndex() {
  document.getElementById("inboxCount").textContent = countTasksByStatus("inbox");
  document.getElementById("plannedCount").textContent = countTasksByStatus("planned");
  document.getElementById("migratedCount").textContent = countTasksByStatus("migrated");
  document.getElementById("doneCount").textContent = countTasksByStatus("done");
}

function renderCapacityVisual() {
  const target = document.getElementById("capacityVisual");
  const pieces = [];

  Object.entries(state.dayCapacity).forEach(([minutes, count]) => {
    for (let i = 0; i < count; i++) {
      pieces.push(`<span class="capacity-token">${minutesLabel(Number(minutes))}</span>`);
    }
  });

  target.innerHTML = pieces.length ? pieces.join("") : `<div class="empty-state">Aucun bloc armé.</div>`;
}

/* =========================
   RENDER — DAY
========================= */

function renderDayHero() {
  const selectedDate = state.settings.selectedDate;
  const tasks = getTasksForDate(selectedDate);
  const external = getExternalEventsForDate(selectedDate);
  const planned = computeCapacityMinutes();
  const scheduled = tasks.reduce((sum, t) => sum + t.duration, 0) + external.reduce((sum, e) => sum + e.duration, 0);
  const dominant = getDominantProjectForDate(selectedDate);

  document.getElementById("dayTitle").textContent = `JOUR — ${formatLongDate(selectedDate)}`;
  document.getElementById("plannedMinutesLabel").textContent = minutesLabel(planned);
  document.getElementById("scheduledMinutesLabel").textContent = minutesLabel(scheduled);
  document.getElementById("dayChargeLabel").textContent = `${computeDayLoadPercent(selectedDate)}%`;
  document.getElementById("dominantProjectLabel").textContent = dominant ? dominant.name : "—";
  document.getElementById("densityFill").style.width = `${computeDayLoadPercent(selectedDate)}%`;
}

function renderDayTimeline() {
  const container = document.getElementById("dayTimeline");
  const selectedDate = state.settings.selectedDate;
  const tasks = getTasksForDate(selectedDate)
    .filter((t) => typeof t.startMinutes === "number")
    .sort((a, b) => a.startMinutes - b.startMinutes);

  const externalEvents = getExternalEventsForDate(selectedDate)
    .sort((a, b) => a.startMinutes - b.startMinutes);

  const merged = [
    ...tasks.map((t) => ({ ...t, kind: "task" })),
    ...externalEvents.map((e) => ({ ...e, kind: "external", category: "external" }))
  ].sort((a, b) => a.startMinutes - b.startMinutes);

  const start = 6 * 60;
  const end = 22 * 60;
  let cursor = start;
  let html = "";

  if (!merged.length) {
    container.innerHTML = `<div class="empty-state">Aucun bloc placé sur cette journée.</div>`;
    return;
  }

  for (const item of merged) {
    if (item.startMinutes > cursor) {
      html += createEmptyRows(cursor, item.startMinutes);
    }
    html += createFilledRows(item);
    cursor = Math.max(cursor, item.startMinutes + item.duration);
  }

  if (cursor < end) {
    html += createEmptyRows(cursor, end);
  }

  container.innerHTML = html;

  wireTimelineButtons();
}

function createEmptyRows(from, to) {
  let html = "";
  for (let t = from; t < to; t += 15) {
    html += `
      <div class="timeline-row">
        <div class="timeline-time">${formatHM(t)}</div>
        <div class="timeline-track"></div>
      </div>
    `;
  }
  return html;
}

function createFilledRows(item) {
  const rows = Math.max(1, Math.ceil(item.duration / 15));
  let html = "";

  for (let i = 0; i < rows; i++) {
    const currentMinute = item.startMinutes + i * 15;
    const showBlock = i === 0;
    const title = item.kind === "external"
      ? item.title
      : `${item.title}`;

    html += `
      <div class="timeline-row">
        <div class="timeline-time">${formatHM(currentMinute)}</div>
        <div class="timeline-track">
          ${
            showBlock
              ? `
            <div class="timeline-block ${item.category}">
              <span>${escapeHTML(title)}</span>
              ${
                item.kind === "task"
                  ? `
                  <span class="task-actions-inline">
                    <button class="small-btn timeline-shift-btn" data-task-id="${item.id}" data-shift="-15">−15</button>
                    <button class="small-btn timeline-shift-btn" data-task-id="${item.id}" data-shift="15">+15</button>
                  </span>
                `
                  : `<span>${minutesLabel(item.duration)}</span>`
              }
            </div>
          `
              : ""
          }
        </div>
      </div>
    `;
  }

  return html;
}

function wireTimelineButtons() {
  document.querySelectorAll(".timeline-shift-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const taskId = btn.dataset.taskId;
      const shift = Number(btn.dataset.shift);
      shiftTask(taskId, shift);
    });
  });
}

/* =========================
   RENDER — WEEK
========================= */

function renderWeek() {
  const selected = state.settings.selectedDate;
  const start = getMonday(selected);
  const container = document.getElementById("weekStrip");
  const engagements = document.getElementById("weekEngagements");

  let html = "";
  let engagementHTML = "";

  for (let i = 0; i < 7; i++) {
    const day = addDays(start, i);
    const tasks = getTasksForDate(day);
    const external = getExternalEventsForDate(day);
    const total = tasks.reduce((s, t) => s + t.duration, 0) + external.reduce((s, e) => s + e.duration, 0);
    const percent = computeDayLoadPercent(day);
    const dominant = getDominantProjectForDate(day);

    html += `
      <div class="week-day">
        <div class="week-day-top">
          <div>
            <div class="week-day-name">${weekdayLabel(day)}</div>
            <div class="week-day-date">${formatShortDate(day)}</div>
          </div>
          <div class="task-chip">${tasks.length + external.length} bloc(s)</div>
        </div>
        <div class="week-bar">
          <div class="week-bar-fill" style="width:${percent}%"></div>
        </div>
        <div class="stack-card-meta">
          ${minutesLabel(total)} engagées
        </div>
        <div class="stack-card-meta">
          Projet dominant : ${dominant ? escapeHTML(dominant.name) : "—"}
        </div>
      </div>
    `;

    if (tasks.length || external.length) {
      engagementHTML += `
        <div class="engagement-row">
          <strong>${weekdayLabel(day)} — ${formatShortDate(day)}</strong>
          <div class="stack-card-meta">
            ${tasks.map(t => `• ${escapeHTML(t.title)}`).join("<br>")}
            ${external.map(e => `• [Agenda] ${escapeHTML(e.title)}`).join("<br>")}
          </div>
        </div>
      `;
    }
  }

  container.innerHTML = html;
  engagements.innerHTML = engagementHTML || `<div class="empty-state">Semaine encore vide.</div>`;
}

/* =========================
   RENDER — MONTH
========================= */

function renderMonth() {
  const monthCursor = state.settings.monthCursor;
  const { year, month } = parseMonthCursor(monthCursor);
  document.getElementById("monthLabel").textContent = monthYearLabel(year, month);

  const firstOfMonth = new Date(year, month - 1, 1);
  const startDay = firstOfMonth.getDay() === 0 ? 6 : firstOfMonth.getDay() - 1;
  const daysInMonth = new Date(year, month, 0).getDate();
  const grid = document.getElementById("monthGrid");

  let html = "";

  for (let i = 0; i < startDay; i++) {
    html += `<div class="month-cell muted"></div>`;
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const iso = isoFromYMD(year, month, day);
    const tasks = getTasksForDate(iso);
    const external = getExternalEventsForDate(iso);
    const count = tasks.length + external.length;
    const load = computeDayLoadPercent(iso);
    const selected = iso === state.settings.selectedDate ? "selected" : "";
    const hasItems = count > 0 ? "has-items" : "";

    html += `
      <div class="month-cell ${selected} ${hasItems}" data-date="${iso}">
        <div class="month-cell-top">
          <div class="month-day-number">${day}</div>
          <div class="task-chip">${count}</div>
        </div>
        <div class="month-cell-body">
          <div class="month-mini-line" style="width:${Math.max(load, 8)}%;"></div>
          <div class="month-mini-stats">${load}% · ${minutesLabel(getTotalMinutesForDate(iso))}</div>
        </div>
      </div>
    `;
  }

  grid.innerHTML = html;

  grid.querySelectorAll(".month-cell[data-date]").forEach((cell) => {
    cell.addEventListener("click", () => {
      state.settings.selectedDate = cell.dataset.date;
      saveState();
      renderAll();
    });
  });
}

/* =========================
   RENDER — MINI CALENDAR
========================= */

function renderMiniCalendar() {
  const cursor = state.settings.miniMonthCursor;
  const { year, month } = parseMonthCursor(cursor);
  document.getElementById("miniCalendarTitle").textContent = monthYearLabel(year, month);

  const firstOfMonth = new Date(year, month - 1, 1);
  const startDay = firstOfMonth.getDay() === 0 ? 6 : firstOfMonth.getDay() - 1;
  const daysInMonth = new Date(year, month, 0).getDate();

  const grid = document.getElementById("miniCalendarGrid");
  let html = "";

  for (let i = 0; i < startDay; i++) {
    html += `<div class="mini-day muted"></div>`;
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const iso = isoFromYMD(year, month, day);
    const count = getTasksForDate(iso).length + getExternalEventsForDate(iso).length;
    const selected = iso === state.settings.selectedDate ? "selected" : "";
    const hasItems = count > 0 ? "has-items" : "";

    html += `<div class="mini-day ${selected} ${hasItems}" data-date="${iso}">${day}</div>`;
  }

  grid.innerHTML = html;

  grid.querySelectorAll(".mini-day[data-date]").forEach((cell) => {
    cell.addEventListener("click", () => {
      state.settings.selectedDate = cell.dataset.date;
      saveState();
      renderAll();
    });
  });
}

/* =========================
   RENDER — PROJECTS
========================= */

function renderProjectOptions() {
  const select = document.getElementById("taskProject");
  select.innerHTML = state.projects
    .map((project) => `<option value="${project.id}">${escapeHTML(project.name)}</option>`)
    .join("");
}

function renderProjectsWorkbench() {
  const target = document.getElementById("projectWorkbench");
  const html = state.projects.map((project) => {
    const tasks = state.tasks.filter((t) => t.projectId === project.id);
    const done = tasks.filter((t) => t.status === "done").length;
    const progress = tasks.length ? Math.round((done / tasks.length) * 100) : 0;

    const taskList = tasks.length
      ? tasks.slice(0, 8).map((task) => `
          <div class="project-task-item">
            <div class="project-task-title">${escapeHTML(task.title)}</div>
            <div class="project-task-meta">
              ${task.scheduledDate ? formatShortDate(task.scheduledDate) : "inbox"} ·
              ${minutesLabel(task.duration)} ·
              ${labelStatus(task.status)}
            </div>
            <div class="task-actions">
              <button class="small-btn task-status-btn" data-task-id="${task.id}" data-action="done">Terminer</button>
              <button class="small-btn task-status-btn" data-task-id="${task.id}" data-action="migrate">Migrer</button>
              <button class="small-btn task-shift-day-btn" data-task-id="${task.id}" data-shift="-1">J-1</button>
              <button class="small-btn task-shift-day-btn" data-task-id="${task.id}" data-shift="1">J+1</button>
            </div>
          </div>
        `).join("")
      : `<div class="empty-state">Aucune tâche liée à ce projet.</div>`;

    return `
      <div class="project-card">
        <div class="project-top">
          <div class="project-name">${escapeHTML(project.name)}</div>
          <div class="task-chip">${progress}%</div>
        </div>
        <div class="project-objective">${escapeHTML(project.objective || "Sans objectif.")}</div>
        <div class="project-progress-wrap">
          <div class="progress-bar">
            <div class="progress-fill" style="width:${progress}%; background: linear-gradient(90deg, ${project.color}, var(--accent-2));"></div>
          </div>
          <div class="project-task-meta">${done}/${tasks.length || 0} tâches terminées</div>
        </div>
        <div class="project-task-list">${taskList}</div>
      </div>
    `;
  }).join("");

  target.innerHTML = html || `<div class="empty-state">Pas encore de projet.</div>`;

  bindProjectActionButtons();
}

function bindProjectActionButtons() {
  document.querySelectorAll(".task-status-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const taskId = btn.dataset.taskId;
      const action = btn.dataset.action;
      if (action === "done") markTaskDone(taskId);
      if (action === "migrate") migrateTask(taskId);
    });
  });

  document.querySelectorAll(".task-shift-day-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const taskId = btn.dataset.taskId;
      const shift = Number(btn.dataset.shift);
      shiftTaskDay(taskId, shift);
    });
  });
}

/* =========================
   RENDER — JOURNAL
========================= */

function renderJournal() {
  renderJournalColumn("journalInbox", state.tasks.filter(t => t.status === "inbox"));
  renderJournalColumn("journalPlanned", state.tasks.filter(t => t.status === "planned"));
  renderJournalColumn("journalMigrated", state.tasks.filter(t => t.status === "migrated"));
  renderJournalColumn("journalDone", state.tasks.filter(t => t.status === "done"));
}

function renderJournalColumn(id, tasks) {
  const target = document.getElementById(id);
  if (!tasks.length) {
    target.innerHTML = `<div class="empty-state">Rien ici pour le moment.</div>`;
    return;
  }

  target.innerHTML = tasks.map((task) => {
    const project = getProject(task.projectId);
    return `
      <div class="journal-item">
        <div class="journal-item-title">${escapeHTML(task.title)}</div>
        <div class="journal-item-meta">
          ${project ? escapeHTML(project.name) : "Sans projet"} ·
          ${task.scheduledDate ? formatShortDate(task.scheduledDate) : "non daté"} ·
          ${minutesLabel(task.duration)}
        </div>
        <div class="task-actions">
          <button class="small-btn journal-done-btn" data-task-id="${task.id}">Terminer</button>
          <button class="small-btn journal-migrate-btn" data-task-id="${task.id}">Migrer</button>
        </div>
      </div>
    `;
  }).join("");

  target.querySelectorAll(".journal-done-btn").forEach((btn) => {
    btn.addEventListener("click", () => markTaskDone(btn.dataset.taskId));
  });

  target.querySelectorAll(".journal-migrate-btn").forEach((btn) => {
    btn.addEventListener("click", () => migrateTask(btn.dataset.taskId));
  });
}

/* =========================
   RENDER — REPORTS
========================= */

function renderReports() {
  renderDayReport();
  renderWeekReport();
}

function renderDayReport() {
  const date = state.settings.selectedDate;
  const tasks = getTasksForDate(date);
  const done = tasks.filter((t) => t.status === "done");
  const external = getExternalEventsForDate(date);
  const report = document.getElementById("dayReport");

  const grouped = groupMinutesByProject(tasks);

  report.innerHTML = `
    <div class="report-item">
      <strong>${tasks.length}</strong>
      <div class="report-item-meta">tâches planifiées ce jour</div>
    </div>
    <div class="report-item">
      <strong>${done.length}</strong>
      <div class="report-item-meta">tâches terminées</div>
    </div>
    <div class="report-item">
      <strong>${minutesLabel(getTotalMinutesForDate(date))}</strong>
      <div class="report-item-meta">temps engagé total</div>
    </div>
    <div class="report-item">
      <strong>${external.length}</strong>
      <div class="report-item-meta">engagement(s) externe(s)</div>
    </div>
    ${Object.entries(grouped).map(([projectName, mins]) => `
      <div class="report-item">
        <strong>${escapeHTML(projectName)}</strong>
        <div class="report-item-meta">${minutesLabel(mins)}</div>
      </div>
    `).join("")}
  `;
}

function renderWeekReport() {
  const start = getMonday(state.settings.selectedDate);
  const dates = Array.from({ length: 7 }, (_, i) => addDays(start, i));

  let totalTasks = 0;
  let totalDone = 0;
  let totalMinutes = 0;

  const weekTasks = dates.flatMap((date) => getTasksForDate(date));
  const grouped = groupMinutesByProject(weekTasks);

  dates.forEach((date) => {
    const tasks = getTasksForDate(date);
    const external = getExternalEventsForDate(date);
    totalTasks += tasks.length;
    totalDone += tasks.filter((t) => t.status === "done").length;
    totalMinutes += tasks.reduce((s, t) => s + t.duration, 0) + external.reduce((s, e) => s + e.duration, 0);
  });

  const report = document.getElementById("weekReport");
  report.innerHTML = `
    <div class="report-item">
      <strong>${totalTasks}</strong>
      <div class="report-item-meta">tâches sur la semaine</div>
    </div>
    <div class="report-item">
      <strong>${totalDone}</strong>
      <div class="report-item-meta">tâches terminées</div>
    </div>
    <div class="report-item">
      <strong>${minutesLabel(totalMinutes)}</strong>
      <div class="report-item-meta">temps engagé semaine</div>
    </div>
    ${Object.entries(grouped).map(([projectName, mins]) => `
      <div class="report-item">
        <strong>${escapeHTML(projectName)}</strong>
        <div class="report-item-meta">${minutesLabel(mins)}</div>
      </div>
    `).join("")}
  `;
}

/* =========================
   RENDER — RIGHTBAR
========================= */

function renderRightbar() {
  renderNextAction();
  renderDayBlocks();
  renderQuickSummary();
}

function renderNextAction() {
  const target = document.getElementById("nextActionCard");
  const date = state.settings.selectedDate;
  const task = getTasksForDate(date)
    .filter((t) => t.status !== "done")
    .sort((a, b) => {
      if (a.startMinutes == null && b.startMinutes == null) return b.priority - a.priority;
      if (a.startMinutes == null) return 1;
      if (b.startMinutes == null) return -1;
      return a.startMinutes - b.startMinutes;
    })[0];

  if (!task) {
    target.innerHTML = `<div class="empty-state">Aucune action suivante claire. Soit tu es à jour, soit le chaos s’amuse.</div>`;
    return;
  }

  const project = getProject(task.projectId);
  target.innerHTML = `
    <div class="stack-card-title">${escapeHTML(task.title)}</div>
    <div class="stack-card-meta">${project ? escapeHTML(project.name) : "Sans projet"}</div>
    <div class="stack-card-meta">${task.startMinutes != null ? formatHM(task.startMinutes) : "horaire libre"} · ${minutesLabel(task.duration)}</div>
    <div class="task-actions">
      <button class="small-btn" data-next-done="${task.id}">Terminer</button>
      <button class="small-btn" data-next-migrate="${task.id}">Migrer</button>
    </div>
  `;

  const doneBtn = target.querySelector("[data-next-done]");
  const migBtn = target.querySelector("[data-next-migrate]");

  if (doneBtn) doneBtn.addEventListener("click", () => markTaskDone(doneBtn.dataset.nextDone));
  if (migBtn) migBtn.addEventListener("click", () => migrateTask(migBtn.dataset.nextMigrate));
}

function renderDayBlocks() {
  const target = document.getElementById("dayBlocksList");
  const date = state.settings.selectedDate;
  const tasks = getTasksForDate(date).sort((a, b) => {
    if (a.startMinutes == null && b.startMinutes == null) return 0;
    if (a.startMinutes == null) return 1;
    if (b.startMinutes == null) return -1;
    return a.startMinutes - b.startMinutes;
  });

  if (!tasks.length) {
    target.innerHTML = `<div class="empty-state">Aucun bloc pour cette journée.</div>`;
    return;
  }

  target.innerHTML = tasks.map((task) => {
    const project = getProject(task.projectId);
    return `
      <div class="stack-card">
        <div class="stack-card-title">${escapeHTML(task.title)}</div>
        <div class="stack-card-meta">
          ${project ? escapeHTML(project.name) : "Sans projet"} ·
          ${task.startMinutes != null ? formatHM(task.startMinutes) : "horaire libre"} ·
          ${minutesLabel(task.duration)}
        </div>
        <div class="task-chip-row" style="margin-top:8px;">
          <span class="task-chip">${labelCategory(task.category)}</span>
          <span class="task-chip">${labelStatus(task.status)}</span>
        </div>
      </div>
    `;
  }).join("");
}

function renderQuickSummary() {
  const target = document.getElementById("quickSummary");
  const date = state.settings.selectedDate;
  const tasks = getTasksForDate(date);
  const total = getTotalMinutesForDate(date);
  const done = tasks.filter((t) => t.status === "done").length;

  target.innerHTML = `
    <div class="quick-item">
      <strong>${minutesLabel(total)}</strong>
      <div class="quick-item-meta">temps engagé</div>
    </div>
    <div class="quick-item">
      <strong>${tasks.length}</strong>
      <div class="quick-item-meta">bloc(s) du jour</div>
    </div>
    <div class="quick-item">
      <strong>${done}</strong>
      <div class="quick-item-meta">terminé(s)</div>
    </div>
    <div class="quick-item">
      <strong>${computeDayLoadPercent(date)}%</strong>
      <div class="quick-item-meta">charge absorbée</div>
    </div>
  `;
}

/* =========================
   ACTIONS
========================= */

function saveCapacityFromInputs() {
  state.dayCapacity[120] = num("cap120");
  state.dayCapacity[60] = num("cap60");
  state.dayCapacity[30] = num("cap30");
  state.dayCapacity[15] = num("cap15");
  saveState();
  renderAll();
}

function handleCreateTask(event) {
  event.preventDefault();

  const title = value("taskTitle").trim();
  const projectId = value("taskProject");
  const category = value("taskCategory");
  const scheduledDate = value("taskDate") || null;
  const priority = Number(value("taskPriority"));
  const startMinutes = parseTimeInput(value("taskStart"));
  const duration = Number(value("taskDuration"));
  const notes = value("taskNotes").trim();

  if (!title || !projectId) {
    alert("Titre et projet requis.");
    return;
  }

  const task = makeTask({
    title,
    projectId,
    category,
    scheduledDate,
    startMinutes,
    duration,
    priority,
    notes,
    status: scheduledDate ? "planned" : "inbox"
  });

  state.tasks.push(task);
  saveState();
  event.target.reset();
  document.getElementById("taskDate").value = state.settings.selectedDate;
  document.getElementById("taskStart").value = "08:00";
  renderAll();
}

function handleCreateExternalEvent(event) {
  event.preventDefault();

  const title = value("externalTitle").trim();
  const date = value("externalDate");
  const startMinutes = parseTimeInput(value("externalStart"));
  const duration = Number(value("externalDuration"));

  if (!title || !date) {
    alert("Titre et date requis pour l’engagement.");
    return;
  }

  state.externalEvents.push(
    makeExternalEvent({
      title,
      date,
      startMinutes,
      duration
    })
  );

  saveState();
  event.target.reset();
  document.getElementById("externalDate").value = state.settings.selectedDate;
  document.getElementById("externalStart").value = "13:00";
  renderAll();
}

function handleCreateProject(event) {
  event.preventDefault();

  const name = value("projectName").trim();
  const objective = value("projectObjective").trim();
  const color = value("projectColor");

  if (!name) {
    alert("Nom du projet requis.");
    return;
  }

  state.projects.push({
    id: uid(),
    name,
    objective,
    color
  });

  saveState();
  event.target.reset();
  document.getElementById("projectColor").value = "#64c8ff";
  renderAll();
}

function pickRandomTask() {
  const date = state.settings.selectedDate;
  const pool = state.tasks.filter((task) => {
    if (task.status === "done") return false;
    if (task.scheduledDate === date) return true;
    if (task.status === "inbox") return true;
    if (task.scheduledDate && task.scheduledDate < date) return true;
    return false;
  });

  if (!pool.length) {
    state.ui.pickedTaskId = null;
    saveState();
    renderAll();
    return;
  }

  const weighted = [];
  pool.forEach((task) => {
    let weight = 1;
    weight += task.priority;
    if (task.scheduledDate === date) weight += 3;
    if (task.scheduledDate && task.scheduledDate < date) weight += 2;
    if (task.duration <= 30) weight += 1;
    for (let i = 0; i < weight; i++) weighted.push(task.id);
  });

  const pickedId = weighted[Math.floor(Math.random() * weighted.length)];
  state.ui.pickedTaskId = pickedId;
  saveState();
  renderAll();
}

function launchPickedTask() {
  const task = getPickedTask();
  if (!task) return;

  task.scheduledDate = state.settings.selectedDate;
  task.status = "planned";

  if (typeof task.startMinutes !== "number") {
    task.startMinutes = suggestNextStartMinute(state.settings.selectedDate);
  }

  saveState();
  renderAll();
}

function migratePickedTask() {
  const task = getPickedTask();
  if (!task) return;
  migrateTask(task.id);
}

function migrateTask(taskId) {
  const task = state.tasks.find((t) => t.id === taskId);
  if (!task) return;

  task.status = "migrated";
  if (task.scheduledDate) {
    task.scheduledDate = addDays(task.scheduledDate, 1);
  } else {
    task.scheduledDate = addDays(state.settings.selectedDate, 1);
  }

  if (typeof task.startMinutes !== "number") {
    task.startMinutes = suggestNextStartMinute(task.scheduledDate);
  }

  saveState();
  renderAll();
}

function markTaskDone(taskId) {
  const task = state.tasks.find((t) => t.id === taskId);
  if (!task) return;
  task.status = "done";
  task.completedAt = new Date().toISOString();
  saveState();
  renderAll();
}

function shiftTask(taskId, minutes) {
  const task = state.tasks.find((t) => t.id === taskId);
  if (!task || typeof task.startMinutes !== "number") return;
  const moved = task.startMinutes + minutes;
  task.startMinutes = clamp(moved, 6 * 60, 22 * 60 - 15);
  saveState();
  renderAll();
}

function shiftTaskDay(taskId, dayDelta) {
  const task = state.tasks.find((t) => t.id === taskId);
  if (!task) return;
  task.scheduledDate = task.scheduledDate ? addDays(task.scheduledDate, dayDelta) : addDays(state.settings.selectedDate, dayDelta);
  task.status = "planned";
  saveState();
  renderAll();
}

function saveDailyNotes() {
  state.dailyNotes[state.settings.selectedDate] = document.getElementById("dailyNotesInput").value;
  saveState();
  renderAll();
}

/* =========================
   COMPUTATIONS
========================= */

function getPickedTask() {
  return state.tasks.find((t) => t.id === state.ui.pickedTaskId) || null;
}

function getProject(projectId) {
  return state.projects.find((p) => p.id === projectId) || null;
}

function getTasksForDate(date) {
  return state.tasks.filter((task) => task.scheduledDate === date);
}

function getExternalEventsForDate(date) {
  return state.externalEvents.filter((event) => event.date === date);
}

function countTasksByStatus(status) {
  return state.tasks.filter((t) => t.status === status).length;
}

function computeCapacityMinutes() {
  return (
    state.dayCapacity[120] * 120 +
    state.dayCapacity[60] * 60 +
    state.dayCapacity[30] * 30 +
    state.dayCapacity[15] * 15
  );
}

function getTotalMinutesForDate(date) {
  const tasks = getTasksForDate(date);
  const external = getExternalEventsForDate(date);
  return tasks.reduce((s, t) => s + t.duration, 0) + external.reduce((s, e) => s + e.duration, 0);
}

function computeDayLoadPercent(date) {
  const cap = computeCapacityMinutes();
  if (!cap) return 0;
  return Math.min(100, Math.round((getTotalMinutesForDate(date) / cap) * 100));
}

function getDominantProjectForDate(date) {
  const tasks = getTasksForDate(date);
  const grouped = new Map();

  tasks.forEach((task) => {
    const previous = grouped.get(task.projectId) || 0;
    grouped.set(task.projectId, previous + task.duration);
  });

  let winnerId = null;
  let winnerMins = 0;

  grouped.forEach((mins, projectId) => {
    if (mins > winnerMins) {
      winnerMins = mins;
      winnerId = projectId;
    }
  });

  return winnerId ? getProject(winnerId) : null;
}

function groupMinutesByProject(tasks) {
  const result = {};
  tasks.forEach((task) => {
    const project = getProject(task.projectId);
    const key = project ? project.name : "Sans projet";
    result[key] = (result[key] || 0) + task.duration;
  });
  return result;
}

function suggestNextStartMinute(date) {
  const tasks = getTasksForDate(date).filter((t) => typeof t.startMinutes === "number");
  if (!tasks.length) return 8 * 60;
  const latest = tasks.reduce((max, task) => Math.max(max, task.startMinutes + task.duration), 8 * 60);
  return clamp(roundToQuarter(latest), 6 * 60, 21 * 60 + 45);
}

/* =========================
   HELPERS
========================= */

function value(id) {
  return document.getElementById(id).value;
}

function num(id) {
  return Number(document.getElementById(id).value) || 0;
}

function uid() {
  return Math.random().toString(36).slice(2, 11);
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function addDays(iso, days) {
  const d = new Date(`${iso}T12:00:00`);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function getMonday(iso) {
  const d = new Date(`${iso}T12:00:00`);
  const day = d.getDay() === 0 ? 7 : d.getDay();
  d.setDate(d.getDate() - day + 1);
  return d.toISOString().slice(0, 10);
}

function isoFromYMD(year, month, day) {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function parseMonthCursor(cursor) {
  const [year, month] = cursor.split("-").map(Number);
  return { year, month };
}

function monthCursorFromDate(iso) {
  const [year, month] = iso.split("-").map(Number);
  return `${year}-${String(month).padStart(2, "0")}`;
}

function shiftMonthCursor(cursor, delta) {
  const { year, month } = parseMonthCursor(cursor);
  const d = new Date(year, month - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function monthYearLabel(year, month) {
  return new Intl.DateTimeFormat("fr-BE", {
    month: "long",
    year: "numeric"
  }).format(new Date(year, month - 1, 1));
}

function weekdayLabel(iso) {
  return new Intl.DateTimeFormat("fr-BE", {
    weekday: "short"
  }).format(new Date(`${iso}T12:00:00`));
}

function formatLongDate(iso) {
  return new Intl.DateTimeFormat("fr-BE", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric"
  }).format(new Date(`${iso}T12:00:00`));
}

function formatShortDate(iso) {
  return new Intl.DateTimeFormat("fr-BE", {
    day: "2-digit",
    month: "2-digit"
  }).format(new Date(`${iso}T12:00:00`));
}

function getWeekLabel(iso) {
  const monday = getMonday(iso);
  const sunday = addDays(monday, 6);
  return `${formatShortDate(monday)} → ${formatShortDate(sunday)}`;
}

function minutesLabel(minutes) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h && m) return `${h}h${String(m).padStart(2, "0")}`;
  if (h) return `${h}h`;
  return `${m} min`;
}

function formatHM(minutes) {
  const hh = Math.floor(minutes / 60);
  const mm = minutes % 60;
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

function parseTimeInput(time) {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function roundToQuarter(mins) {
  return Math.ceil(mins / 15) * 15;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function labelCategory(category) {
  const map = {
    deep: "Travail profond",
    admin: "Administratif",
    resource: "Ressource",
    sport: "Sport",
    pause: "Pause",
    external: "Agenda"
  };
  return map[category] || category;
}

function labelStatus(status) {
  const map = {
    inbox: "Inbox",
    planned: "Planifié",
    migrated: "Migré",
    done: "Terminé"
  };
  return map[status] || status;
}

function escapeHTML(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

const STORAGE_KEY = "illuminator-planner-v1";

const defaultState = {
  energy: 76,
  capacity: {
    h120: 2,
    h60: 2,
    h30: 2,
    h15: 2
  },
  projects: [
    { id: "p1", name: "Article", progress: 42, minutes: 210, targetMinutes: 600 },
    { id: "p2", name: "Carnet de stage", progress: 58, minutes: 320, targetMinutes: 540 },
    { id: "p3", name: "Sport", progress: 35, minutes: 90, targetMinutes: 240 },
    { id: "p4", name: "Administratif", progress: 27, minutes: 75, targetMinutes: 180 }
  ],
  sessions: [
    { id: "s1", date: todayISO(), projectId: "p1", title: "Plan général", category: "deep", start: "08:00", duration: 120 },
    { id: "s2", date: todayISO(), projectId: "p2", title: "Relecture notes", category: "resource", start: "10:30", duration: 60 },
    { id: "s3", date: todayISO(), projectId: "p4", title: "Mails rapides", category: "admin", start: "14:00", duration: 30 },
    { id: "s4", date: todayISO(), projectId: "p3", title: "Marche active", category: "sport", start: "17:00", duration: 60 }
  ]
};

let state = loadState();

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return structuredClone(defaultState);

  try {
    return JSON.parse(raw);
  } catch (error) {
    console.error("Erreur de lecture localStorage:", error);
    return structuredClone(defaultState);
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function formatFrenchDate() {
  return new Intl.DateTimeFormat("fr-BE", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric"
  }).format(new Date());
}

function minutesToHoursLabel(minutes) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h && m) return `${h}h${String(m).padStart(2, "0")}`;
  if (h) return `${h}h`;
  return `${m} min`;
}

function parseTimeToMinutes(time) {
  const [hh, mm] = time.split(":").map(Number);
  return hh * 60 + mm;
}

function getTodaySessions() {
  return state.sessions
    .filter((s) => s.date === todayISO())
    .sort((a, b) => parseTimeToMinutes(a.start) - parseTimeToMinutes(b.start));
}

function getProjectById(projectId) {
  return state.projects.find((p) => p.id === projectId);
}

function computeTodayWorkedMinutes() {
  return getTodaySessions().reduce((sum, s) => sum + s.duration, 0);
}

function computeCapacityMinutes() {
  return (
    state.capacity.h120 * 120 +
    state.capacity.h60 * 60 +
    state.capacity.h30 * 30 +
    state.capacity.h15 * 15
  );
}

function computeChargePercent() {
  const cap = computeCapacityMinutes();
  if (!cap) return 0;
  return Math.min(100, Math.round((computeTodayWorkedMinutes() / cap) * 100));
}

function getCompletedBlocksCount() {
  return getTodaySessions().length;
}

function renderHeader() {
  document.getElementById("todayLabel").textContent = formatFrenchDate();
}

function renderCapacityTokens() {
  const wrap = document.getElementById("capacityTokens");
  wrap.innerHTML = "";

  const tokens = [
    { label: `2h × ${state.capacity.h120}` },
    { label: `1h × ${state.capacity.h60}` },
    { label: `30m × ${state.capacity.h30}` },
    { label: `15m × ${state.capacity.h15}` }
  ];

  tokens.forEach((token) => {
    const el = document.createElement("div");
    el.className = "token";
    el.textContent = token.label;
    wrap.appendChild(el);
  });
}

function renderFocusProject() {
  const target = document.getElementById("focusProject");
  const sorted = [...state.projects].sort((a, b) => b.minutes - a.minutes);
  const project = sorted[0];

  if (!project) {
    target.innerHTML = `<div class="small-muted">Aucun projet actif</div>`;
    return;
  }

  target.innerHTML = `
    <div class="project-name">${project.name}</div>
    <div class="small-muted">Temps investi : ${minutesToHoursLabel(project.minutes)}</div>
    <div class="progress-bar">
      <div class="progress-fill" style="width:${project.progress}%"></div>
    </div>
    <div class="small-muted">Avancement : ${project.progress}%</div>
  `;
}

function renderDashboardStats() {
  document.getElementById("energyValue").textContent = `${state.energy}%`;
  document.getElementById("workedTodayValue").textContent = minutesToHoursLabel(computeTodayWorkedMinutes());
  document.getElementById("completedBlocksValue").textContent = String(getCompletedBlocksCount());
  document.getElementById("densityFill").style.width = `${computeChargePercent()}%`;
}

function generateTimelineSegments() {
  const startHour = 6;
  const endHour = 23;
  const totalSlots = (endHour - startHour) * 2; // pas de 30 min
  const slots = Array.from({ length: totalSlots }, (_, i) => ({
    index: i,
    label: "",
    category: "empty",
    title: ""
  }));

  const sessions = getTodaySessions();

  sessions.forEach((session) => {
    const sessionStartMinutes = parseTimeToMinutes(session.start);
    const relativeMinutes = sessionStartMinutes - startHour * 60;
    const startIndex = Math.max(0, Math.floor(relativeMinutes / 30));
    const slotCount = Math.max(1, Math.ceil(session.duration / 30));

    for (let i = 0; i < slotCount; i++) {
      const slotIndex = startIndex + i;
      if (slotIndex >= 0 && slotIndex < slots.length) {
        slots[slotIndex].category = session.category;
        slots[slotIndex].title = session.title;
        slots[slotIndex].label = i === 0 ? session.start : "";
      }
    }
  });

  return slots;
}

function renderTimeline(targetId) {
  const container = document.getElementById(targetId);
  container.innerHTML = "";

  const slots = generateTimelineSegments();

  slots.forEach((slot, idx) => {
    const seg = document.createElement("div");
    seg.className = `timeline-segment ${slot.category}`;
    seg.title = slot.title || `${6 + Math.floor(idx / 2)}h${idx % 2 ? "30" : "00"}`;

    if (slot.category === "empty") {
      seg.classList.add("empty");
    }

    seg.textContent = slot.label;
    container.appendChild(seg);
  });
}

function renderProjectCards() {
  const container = document.getElementById("projectCards");
  container.innerHTML = "";

  state.projects.forEach((project) => {
    const card = document.createElement("div");
    card.className = "project-card";
    card.innerHTML = `
      <div class="project-card-top">
        <div class="project-name">${project.name}</div>
        <div class="mini-badge">${project.progress}%</div>
      </div>
      <div class="project-meta">Temps injecté : ${minutesToHoursLabel(project.minutes)}</div>
      <div class="progress-bar">
        <div class="progress-fill" style="width:${project.progress}%"></div>
      </div>
    `;
    container.appendChild(card);
  });
}

function renderDailyLog() {
  const container = document.getElementById("dailyLog");
  container.innerHTML = "";

  const sessions = getTodaySessions();

  if (!sessions.length) {
    container.innerHTML = `<div class="log-item">Aucune session aujourd’hui.</div>`;
    return;
  }

  sessions.forEach((session) => {
    const project = getProjectById(session.projectId);
    const item = document.createElement("div");
    item.className = "log-item";
    item.innerHTML = `
      <strong>${session.start} — ${session.title}</strong>
      <div class="small-muted">${project?.name || "Projet inconnu"} • ${minutesToHoursLabel(session.duration)}</div>
    `;
    container.appendChild(item);
  });
}

function renderCompletedList() {
  const container = document.getElementById("completedList");
  container.innerHTML = "";

  const sessions = getTodaySessions();
  if (!sessions.length) {
    container.innerHTML = `<div class="completed-item">Rien de terminé pour l’instant.</div>`;
    return;
  }

  sessions.forEach((session) => {
    const row = document.createElement("div");
    row.className = "completed-item";
    row.textContent = `${session.start} • ${session.title}`;
    container.appendChild(row);
  });
}

function renderQuickSummary() {
  const container = document.getElementById("quickSummary");
  const worked = computeTodayWorkedMinutes();
  const blocks = getCompletedBlocksCount();
  const charge = computeChargePercent();

  container.innerHTML = `
    <div class="quick-item"><strong>${minutesToHoursLabel(worked)}</strong><br><span class="small-muted">temps du jour</span></div>
    <div class="quick-item"><strong>${blocks}</strong><br><span class="small-muted">blocs actifs</span></div>
    <div class="quick-item"><strong>${charge}%</strong><br><span class="small-muted">charge absorbée</span></div>
  `;
}

function renderChargeRing() {
  const value = computeChargePercent();
  const ring = document.querySelector(".charge-ring");
  const label = document.getElementById("chargeRingValue");
  ring.style.background = `
    radial-gradient(circle at center, #091321 54%, transparent 55%),
    conic-gradient(var(--accent) ${value * 3.6}deg, rgba(255,255,255,0.06) 0deg)
  `;
  label.textContent = `${value}%`;
}

function renderProjectSelect() {
  const select = document.getElementById("sessionProject");
  select.innerHTML = "";

  state.projects.forEach((project) => {
    const option = document.createElement("option");
    option.value = project.id;
    option.textContent = project.name;
    select.appendChild(option);
  });
}

function renderWeekStrip() {
  const container = document.getElementById("weekStrip");
  container.innerHTML = "";

  const base = new Date();
  const mondayOffset = (base.getDay() + 6) % 7;
  const monday = new Date(base);
  monday.setDate(base.getDate() - mondayOffset);

  const labels = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

  for (let i = 0; i < 7; i++) {
    const current = new Date(monday);
    current.setDate(monday.getDate() + i);
    const iso = current.toISOString().slice(0, 10);

    const sessions = state.sessions.filter((s) => s.date === iso);
    const mins = sessions.reduce((sum, s) => sum + s.duration, 0);
    const percent = Math.min(100, Math.round((mins / Math.max(computeCapacityMinutes(), 1)) * 100));

    const day = document.createElement("div");
    day.className = "week-day";
    day.innerHTML = `
      <div class="week-day-name">${labels[i]}</div>
      <div class="week-day-hours">${minutesToHoursLabel(mins)}</div>
      <div class="week-day-bar">
        <div class="week-day-fill" style="width:${percent}%"></div>
      </div>
      <div class="small-muted" style="margin-top:8px;">${sessions.length} bloc(s)</div>
    `;
    container.appendChild(day);
  }
}

function renderMonthGrid() {
  const container = document.getElementById("monthGrid");
  container.innerHTML = "";

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const lastDay = new Date(year, month + 1, 0).getDate();

  for (let day = 1; day <= lastDay; day++) {
    const current = new Date(year, month, day);
    const iso = current.toISOString().slice(0, 10);

    const sessions = state.sessions.filter((s) => s.date === iso);
    const mins = sessions.reduce((sum, s) => sum + s.duration, 0);
    const percent = Math.min(100, Math.round((mins / Math.max(computeCapacityMinutes(), 1)) * 100));

    const cell = document.createElement("div");
    cell.className = "month-cell";
    cell.innerHTML = `
      <div class="day-num">${day}</div>
      <div class="small-muted">${sessions.length} bloc(s)</div>
      <div class="heat"><span style="width:${percent}%"></span></div>
    `;
    container.appendChild(cell);
  }
}

function renderProjectsTable() {
  const container = document.getElementById("projectsTable");
  container.innerHTML = "";

  state.projects.forEach((project) => {
    const row = document.createElement("div");
    row.className = "project-row";
    row.innerHTML = `
      <div class="project-row-top">
        <strong>${project.name}</strong>
        <span>${project.progress}%</span>
      </div>
      <div class="small-muted">Temps investi : ${minutesToHoursLabel(project.minutes)}</div>
      <div class="small-muted">Temps cible : ${minutesToHoursLabel(project.targetMinutes)}</div>
      <div class="progress-bar">
        <div class="progress-fill" style="width:${project.progress}%"></div>
      </div>
    `;
    container.appendChild(row);
  });
}

function renderReports() {
  const dayReport = document.getElementById("dayReport");
  const weekReport = document.getElementById("weekReport");

  const todaySessions = getTodaySessions();
  const todayMinutes = computeTodayWorkedMinutes();

  const byProjectToday = {};
  todaySessions.forEach((session) => {
    const project = getProjectById(session.projectId)?.name || "Inconnu";
    byProjectToday[project] = (byProjectToday[project] || 0) + session.duration;
  });

  dayReport.innerHTML = `
    <div class="report-item"><strong>${todaySessions.length}</strong><br><span class="small-muted">blocs réalisés aujourd’hui</span></div>
    <div class="report-item"><strong>${minutesToHoursLabel(todayMinutes)}</strong><br><span class="small-muted">temps total du jour</span></div>
    ${Object.entries(byProjectToday)
      .map(([name, mins]) => `<div class="report-item"><strong>${name}</strong><br><span class="small-muted">${minutesToHoursLabel(mins)}</span></div>`)
      .join("")}
  `;

  const base = new Date();
  const mondayOffset = (base.getDay() + 6) % 7;
  const monday = new Date(base);
  monday.setDate(base.getDate() - mondayOffset);

  const weekSessions = state.sessions.filter((session) => {
    const d = new Date(session.date);
    const diff = (d - monday) / (1000 * 60 * 60 * 24);
    return diff >= 0 && diff < 7;
  });

  const totalWeekMinutes = weekSessions.reduce((sum, s) => sum + s.duration, 0);

  const weekByProject = {};
  weekSessions.forEach((session) => {
    const project = getProjectById(session.projectId)?.name || "Inconnu";
    weekByProject[project] = (weekByProject[project] || 0) + session.duration;
  });

  weekReport.innerHTML = `
    <div class="report-item"><strong>${weekSessions.length}</strong><br><span class="small-muted">blocs cette semaine</span></div>
    <div class="report-item"><strong>${minutesToHoursLabel(totalWeekMinutes)}</strong><br><span class="small-muted">temps semaine</span></div>
    ${Object.entries(weekByProject)
      .map(([name, mins]) => `<div class="report-item"><strong>${name}</strong><br><span class="small-muted">${minutesToHoursLabel(mins)}</span></div>`)
      .join("")}
  `;
}

function updateProjectFromSession(projectId, duration) {
  const project = getProjectById(projectId);
  if (!project) return;

  project.minutes += duration;
  project.progress = Math.min(
    100,
    Math.round((project.minutes / Math.max(project.targetMinutes, 1)) * 100)
  );
}

function bindNav() {
  const buttons = document.querySelectorAll(".nav-btn");
  const views = document.querySelectorAll(".view");
  const title = document.getElementById("headerTitle");

  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      buttons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");

      const viewName = btn.dataset.view;
      views.forEach((view) => view.classList.remove("active"));
      document.getElementById(`view-${viewName}`).classList.add("active");

      title.textContent = btn.textContent.trim();
    });
  });
}

function bindCapacityForm() {
  document.getElementById("saveCapacityBtn").addEventListener("click", () => {
    state.capacity.h120 = Number(document.getElementById("input2h").value) || 0;
    state.capacity.h60 = Number(document.getElementById("input1h").value) || 0;
    state.capacity.h30 = Number(document.getElementById("input30m").value) || 0;
    state.capacity.h15 = Number(document.getElementById("input15m").value) || 0;

    saveState();
    renderAll();
  });
}

function bindSessionForm() {
  document.getElementById("addSessionBtn").addEventListener("click", () => {
    const projectId = document.getElementById("sessionProject").value;
    const title = document.getElementById("sessionTitle").value.trim();
    const category = document.getElementById("sessionCategory").value;
    const start = document.getElementById("sessionStart").value;
    const duration = Number(document.getElementById("sessionDuration").value);

    if (!projectId || !title || !start || !duration) {
      alert("Il manque des éléments pour créer le bloc.");
      return;
    }

    const session = {
      id: crypto.randomUUID(),
      date: todayISO(),
      projectId,
      title,
      category,
      start,
      duration
    };

    state.sessions.push(session);
    updateProjectFromSession(projectId, duration);
    saveState();
    renderAll();

    document.getElementById("sessionTitle").value = "";
  });
}

function bindReset() {
  document.getElementById("resetDemoBtn").addEventListener("click", () => {
    state = structuredClone(defaultState);
    saveState();
    renderAll();
  });
}

function populateCapacityInputs() {
  document.getElementById("input2h").value = state.capacity.h120;
  document.getElementById("input1h").value = state.capacity.h60;
  document.getElementById("input30m").value = state.capacity.h30;
  document.getElementById("input15m").value = state.capacity.h15;
}

function renderAll() {
  renderHeader();
  renderCapacityTokens();
  renderFocusProject();
  renderDashboardStats();
  renderTimeline("dayTimeline");
  renderTimeline("dayTimelineDetailed");
  renderProjectCards();
  renderDailyLog();
  renderCompletedList();
  renderQuickSummary();
  renderChargeRing();
  renderProjectSelect();
  renderWeekStrip();
  renderMonthGrid();
  renderProjectsTable();
  renderReports();
  populateCapacityInputs();
}

function init() {
  bindNav();
  bindCapacityForm();
  bindSessionForm();
  bindReset();
  renderAll();
}

document.addEventListener("DOMContentLoaded", init);

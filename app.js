// Simple Halo: Flashpoint companion logic

const STORAGE_KEY = "hf-companion-state";

const defaultState = {
  meta: { p1: "Player 1", p2: "Player 2", mission: "" },
  scores: { p1: 0, p2: 0, round: 1 },
  states: [], // { id, label, active }
  scenarios: {
    list: ["King of the Hill", "Domination"],
    notes: {
      "King of the Hill": "Central objective; score at end of round for controlling hill.",
      "Domination": "3 objectives; score for each objective controlled.",
    },
    selected: "King of the Hill",
  },
};

let appState = loadState();

// ---- helpers ----
function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return structuredClone(defaultState);
    return { ...structuredClone(defaultState), ...JSON.parse(raw) };
  } catch {
    return structuredClone(defaultState);
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(appState));
}

// ---- tabs ----
document.querySelectorAll(".tab").forEach((btn) => {
  btn.addEventListener("click", () => {
    const target = btn.dataset.tab;
    document
      .querySelectorAll(".tab")
      .forEach((b) => b.classList.toggle("active", b === btn));
    document.querySelectorAll(".tab-content").forEach((section) => {
      section.classList.toggle(
        "active",
        section.id === `tab-${target}`
      );
    });
  });
});

// ---- meta form ----
const p1Input = document.getElementById("p1-name");
const p2Input = document.getElementById("p2-name");
const missionInput = document.getElementById("mission");
const p1Label = document.getElementById("p1-label");
const p2Label = document.getElementById("p2-label");

function renderMeta() {
  p1Input.value = appState.meta.p1;
  p2Input.value = appState.meta.p2;
  missionInput.value = appState.meta.mission;
  p1Label.textContent = appState.meta.p1 || "Player 1";
  p2Label.textContent = appState.meta.p2 || "Player 2";
}

document.getElementById("save-meta").addEventListener("click", () => {
  appState.meta.p1 = p1Input.value || "Player 1";
  appState.meta.p2 = p2Input.value || "Player 2";
  appState.meta.mission = missionInput.value || "";
  renderMeta();
  saveState();
});

// ---- scores & round ----
const p1ScoreEl = document.getElementById("p1-score");
const p2ScoreEl = document.getElementById("p2-score");
const roundEl = document.getElementById("round-value");

function renderScores() {
  p1ScoreEl.textContent = appState.scores.p1;
  p2ScoreEl.textContent = appState.scores.p2;
  roundEl.textContent = appState.scores.round;
}

function adjustScore(key, delta) {
  appState.scores[key] = Math.max(
    0,
    appState.scores[key] + delta
  );
  renderScores();
  saveState();
}

document
  .querySelector("[data-action='p1-inc']")
  .addEventListener("click", () => adjustScore("p1", 1));
document
  .querySelector("[data-action='p1-dec']")
  .addEventListener("click", () => adjustScore("p1", -1));
document
  .querySelector("[data-action='p2-inc']")
  .addEventListener("click", () => adjustScore("p2", 1));
document
  .querySelector("[data-action='p2-dec']")
  .addEventListener("click", () => adjustScore("p2", -1));

document
  .querySelector("[data-action='round-inc']")
  .addEventListener("click", () => {
    appState.scores.round += 1;
    renderScores();
    saveState();
  });

document
  .querySelector("[data-action='round-dec']")
  .addEventListener("click", () => {
    appState.scores.round = Math.max(1, appState.scores.round - 1);
    renderScores();
    saveState();
  });

document.getElementById("reset-game").addEventListener("click", () => {
  appState.scores = structuredClone(defaultState.scores);
  appState.states = [];
  renderScores();
  renderStates();
  saveState();
});

// ---- states ----
const stateList = document.getElementById("state-list");
const newStateInput = document.getElementById("new-state-name");

function renderStates() {
  stateList.innerHTML = "";
  appState.states.forEach((item) => {
    const pill = document.createElement("div");
    pill.className = "state-pill";
    if (item.active) pill.classList.add("active");

    const span = document.createElement("span");
    span.textContent = item.label;
    pill.appendChild(span);

    const toggleBtn = document.createElement("button");
    toggleBtn.type = "button";
    toggleBtn.textContent = item.active ? "On" : "Off";
    toggleBtn.addEventListener("click", () => {
      item.active = !item.active;
      saveState();
      renderStates();
    });
    pill.appendChild(toggleBtn);

    const removeBtn = document.createElement("button");
    removeBtn.type = "button";
    removeBtn.textContent = "×";
    removeBtn.addEventListener("click", () => {
      appState.states = appState.states.filter((s) => s.id !== item.id);
      saveState();
      renderStates();
    });
    pill.appendChild(removeBtn);

    stateList.appendChild(pill);
  });
}

document.getElementById("add-state").addEventListener("click", () => {
  const label = newStateInput.value.trim();
  if (!label) return;
  appState.states.push({
    id: Date.now().toString(36),
    label,
    active: false,
  });
  newStateInput.value = "";
  saveState();
  renderStates();
});

document
  .getElementById("clear-states")
  .addEventListener("click", () => {
    appState.states = [];
    saveState();
    renderStates();
  });

// ---- scenarios ----
const scenarioListEl = document.getElementById("scenario-list");
const scenarioSelect = document.getElementById("scenario-select");
const scenarioNotes = document.getElementById("scenario-notes");
const newScenarioInput = document.getElementById("new-scenario-name");

function renderScenarios() {
  scenarioListEl.innerHTML = "";
  scenarioSelect.innerHTML = "";

  appState.scenarios.list.forEach((name) => {
    const li = document.createElement("li");
    li.textContent = name;
    scenarioListEl.appendChild(li);

    const opt = document.createElement("option");
    opt.value = name;
    opt.textContent = name;
    scenarioSelect.appendChild(opt);
  });

  if (!appState.scenarios.selected && appState.scenarios.list.length) {
    appState.scenarios.selected = appState.scenarios.list[0];
  }

  scenarioSelect.value = appState.scenarios.selected;
  scenarioNotes.value =
    appState.scenarios.notes[appState.scenarios.selected] || "";
}

scenarioSelect.addEventListener("change", () => {
  appState.scenarios.selected = scenarioSelect.value;
  scenarioNotes.value =
    appState.scenarios.notes[appState.scenarios.selected] || "";
  saveState();
});

document
  .getElementById("save-scenario-notes")
  .addEventListener("click", () => {
    const key = appState.scenarios.selected;
    if (!key) return;
    appState.scenarios.notes[key] = scenarioNotes.value;
    saveState();
  });

document
  .getElementById("add-scenario")
  .addEventListener("click", () => {
    const name = newScenarioInput.value.trim();
    if (!name || appState.scenarios.list.includes(name)) return;
    appState.scenarios.list.push(name);
    appState.scenarios.notes[name] = "";
    appState.scenarios.selected = name;
    newScenarioInput.value = "";
    renderScenarios();
    saveState();
  });

// ---- initial render ----
renderMeta();
renderScores();
renderStates();
renderScenarios();
import "./style.css";
import { groupLogEntries } from "./logSections";
import { buildTurnSummary } from "./turnSummary";

type Phase = "SETUP" | "ORDERS" | "GAME_OVER";
type OrderType = "MOVE" | "ATTACK";

type Territory = {
  name: string;
  owner: string;
  units: number;
  x: number;
  y: number;
  neighbors: string[];
  hidden: boolean;
};

type Player = {
  id: string;
  displayName: string;
  territories: number;
  totalUnits: number;
  defeated: boolean;
  localPlayer: boolean;
  reserveUnits: number;
};

type GameView = {
  phase: Phase;
  currentPlayer: string;
  winner: string | null;
  mapNote: string;
  territories: Territory[];
  players: Player[];
  lastLog: string[];
  turnNumber: number;
  readyForOrders: boolean;
  roomId: string | null;
  waitingOnPlayers: string[];
};

type PlannedOrder = {
  type: OrderType;
  source: string;
  target: string;
  units: number;
};

const appRoot = document.querySelector<HTMLDivElement>("#app");

if (!appRoot) {
  throw new Error("Missing app root");
}

const app = appRoot;

let game: GameView | null = null;
let setupAllocations: Record<string, number> = {};
let plannedOrders: PlannedOrder[] = [];
let selectedSource: string | null = null;
let selectedTarget: string | null = null;
let selectedMode: OrderType = "MOVE";
let selectedUnits = 1;
let message = "";
let cursorIndex = 0;
let roomId: string | null = localStorage.getItem("risc_room_id");
let roomToken: string | null = localStorage.getItem("risc_room_token");
let joinRoomInput = "";
let pollHandle: number | null = null;
let pollInFlight = false;

const state = {
  mode: "loading",
  boardWidth: 920,
  boardHeight: 620
};

const ownerPalette: Record<string, string> = {
  GREEN: "#63885f",
  BLUE: "#7ea0be",
  RED: "#bb6553"
};

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json"
  };
  if (roomToken) {
    headers["X-Player-Token"] = roomToken;
  }
  const response = await fetch(`http://127.0.0.1:8080${path}`, {
    headers: {
      ...headers
    },
    ...init
  });
  const payload = await response.json();
  if (!response.ok || (payload && typeof payload.error === "string")) {
    throw new Error(payload.error ?? "Request failed");
  }
  return payload as T;
}

function localPlayer(): Player | undefined {
  return game?.players.find((player) => player.localPlayer);
}

function localPlayerId(): string {
  return localPlayer()?.id ?? "GREEN";
}

function territoryByName(name: string | null): Territory | undefined {
  return game?.territories.find((territory) => territory.name === name);
}

function cursorTerritory(): Territory | undefined {
  if (!game || game.territories.length === 0) {
    return undefined;
  }
  return game.territories[((cursorIndex % game.territories.length) + game.territories.length) % game.territories.length];
}

function ownTerritories(): Territory[] {
  const id = localPlayerId();
  return game?.territories.filter((territory) => territory.owner === id) ?? [];
}

function isAdjacent(source: Territory, target: Territory): boolean {
  return source.neighbors.includes(target.name);
}

function availableFromSource(name: string): number {
  const territory = territoryByName(name);
  if (!territory) {
    return 1;
  }
  const committed = plannedOrders
    .filter((order) => order.source === name)
    .reduce((sum, order) => sum + order.units, 0);
  return Math.max(1, territory.units - committed - 1);
}

function setupLeft(): number {
  const player = localPlayer();
  if (!player) {
    return 0;
  }
  return player.reserveUnits - Object.values(setupAllocations).reduce((sum, value) => sum + value, 0);
}

function setMessage(next: string): void {
  message = next;
  render();
}

async function loadGame(): Promise<void> {
  if (roomId && roomToken) {
    game = await api<GameView>(`/api/rooms/${roomId}`);
  } else {
    game = await api<GameView>("/api/game");
  }
  initializeSetupAllocations();
  state.mode = "ready";
  render();
}

function initializeSetupAllocations(): void {
  if (!game || game.phase !== "SETUP") {
    setupAllocations = {};
    return;
  }
  const next: Record<string, number> = {};
  for (const territory of ownTerritories()) {
    next[territory.name] = setupAllocations[territory.name] ?? 0;
  }
  setupAllocations = next;
}

async function resetGame(): Promise<void> {
  if (roomId && roomToken) {
    game = await api<GameView>(`/api/rooms/${roomId}/reset`, { method: "POST" });
  } else {
    game = await api<GameView>("/api/game/reset", { method: "POST" });
  }
  plannedOrders = [];
  selectedSource = null;
  selectedTarget = null;
  selectedUnits = 1;
  setMessage("");
  initializeSetupAllocations();
  render();
}

async function commitSetup(): Promise<void> {
  try {
    if (setupLeft() > 0) {
      const owned = ownTerritories();
      const next = { ...setupAllocations };
      let remaining = setupLeft();
      let index = 0;
      while (remaining > 0 && owned.length > 0) {
        const territory = owned[index % owned.length];
        next[territory.name] = (next[territory.name] ?? 0) + 1;
        remaining -= 1;
        index += 1;
      }
      setupAllocations = next;
    }
    const payload = JSON.stringify({ allocations: setupAllocations });
    if (roomId && roomToken) {
      game = await api<GameView>(`/api/rooms/${roomId}/setup`, { method: "POST", body: payload });
    } else {
      game = await api<GameView>("/api/game/setup", { method: "POST", body: payload });
    }
    plannedOrders = [];
    selectedSource = null;
    selectedTarget = null;
    selectedUnits = 1;
    if (roomId && roomToken && game.phase === "SETUP" && game.waitingOnPlayers.length > 0) {
      setMessage(`Setup submitted. Waiting on: ${game.waitingOnPlayers.join(", ")}.`);
    } else {
      setMessage("Setup locked in. Opponents have revealed their placements.");
    }
  } catch (error) {
    setMessage((error as Error).message);
  }
}

function queueOrder(): void {
  if (!selectedSource || !selectedTarget) {
    setMessage("Choose a source and a target territory first.");
    return;
  }
  const source = territoryByName(selectedSource);
  const target = territoryByName(selectedTarget);
  if (!source || !target) {
    return;
  }
  if (selectedMode === "MOVE" && target.owner !== localPlayerId()) {
    setMessage("Move orders can only target your own territories.");
    return;
  }
  if (selectedMode === "ATTACK" && target.owner === localPlayerId()) {
    setMessage("Attack orders must target enemy territories.");
    return;
  }
  if (selectedMode === "ATTACK" && !isAdjacent(source, target)) {
    setMessage("Attack orders must target adjacent territories.");
    return;
  }
  const maxUnits = availableFromSource(selectedSource);
  if (selectedUnits < 1 || selectedUnits > maxUnits) {
    setMessage("That territory does not have enough spare units.");
    return;
  }
  const queuedSource = selectedSource;
  const queuedTarget = selectedTarget;
  plannedOrders = [...plannedOrders, { type: selectedMode, source: queuedSource, target: queuedTarget, units: selectedUnits }];
  selectedSource = null;
  selectedTarget = null;
  selectedUnits = 1;
  setMessage(`Queued ${selectedMode.toLowerCase()} from ${queuedSource} to ${queuedTarget}.`);
  render();
}

async function commitTurn(): Promise<void> {
  try {
    const payload = JSON.stringify({
      orders: plannedOrders.map((order) => ({
        type: order.type,
        source: order.source,
        target: order.target,
        units: order.units
      }))
    });
    if (roomId && roomToken) {
      game = await api<GameView>(`/api/rooms/${roomId}/turn`, { method: "POST", body: payload });
    } else {
      game = await api<GameView>("/api/game/turn", { method: "POST", body: payload });
    }
    plannedOrders = [];
    selectedUnits = 1;
    selectedSource = null;
    selectedTarget = null;
    if (game.phase === "GAME_OVER") {
      setMessage("The war is over.");
    } else if (roomId && roomToken && game.waitingOnPlayers.length > 0) {
      setMessage(`Orders submitted. Waiting on: ${game.waitingOnPlayers.join(", ")}.`);
    } else {
      setMessage("Turn resolved. Plan your next move.");
    }
  } catch (error) {
    setMessage((error as Error).message);
  }
}

function adjustSetup(name: string, delta: number): void {
  const current = setupAllocations[name] ?? 0;
  const next = Math.max(0, current + delta);
  const leftWithoutCurrent = setupLeft() + current;
  if (next > leftWithoutCurrent) {
    return;
  }
  setupAllocations = { ...setupAllocations, [name]: next };
  render();
}

function onCanvasClick(event: MouseEvent, canvas: HTMLCanvasElement): void {
  if (!game || game.phase === "GAME_OVER") {
    return;
  }
  const rect = canvas.getBoundingClientRect();
  const scaleX = state.boardWidth / rect.width;
  const scaleY = state.boardHeight / rect.height;
  const x = (event.clientX - rect.left) * scaleX;
  const y = (event.clientY - rect.top) * scaleY;
  const clicked = game.territories.find((territory) => {
    const dx = territory.x - x;
    const dy = territory.y - y;
    return Math.sqrt(dx * dx + dy * dy) < 48;
  });
  if (!clicked) {
    return;
  }
  cursorIndex = game.territories.findIndex((territory) => territory.name === clicked.name);
  if (!selectedSource) {
    if (clicked.owner !== localPlayerId()) {
      setMessage("Choose one of your territories as the source.");
      return;
    }
    selectedSource = clicked.name;
    selectedTarget = null;
    selectedUnits = 1;
    setMessage(`Source selected: ${clicked.name}. Now choose a target.`);
    render();
    return;
  }
  if (clicked.name === selectedSource) {
    selectedSource = null;
    selectedTarget = null;
    setMessage("Source cleared.");
    render();
    return;
  }
  selectedTarget = clicked.name;
  setMessage(`Target selected: ${clicked.name}.`);
  render();
}

function drawBoard(canvas: HTMLCanvasElement): void {
  const context = canvas.getContext("2d");
  if (!context || !game) {
    return;
  }

  canvas.width = state.boardWidth;
  canvas.height = state.boardHeight;

  context.clearRect(0, 0, canvas.width, canvas.height);
  const background = context.createLinearGradient(0, 0, 0, canvas.height);
  background.addColorStop(0, "#a7cde0");
  background.addColorStop(0.24, "#dbead8");
  background.addColorStop(1, "#cfaf76");
  context.fillStyle = background;
  context.fillRect(0, 0, canvas.width, canvas.height);

  context.fillStyle = "rgba(255,255,255,0.18)";
  for (let i = 0; i < 14; i += 1) {
    context.beginPath();
    context.arc(80 + i * 60, 60 + (i % 3) * 26, 24 + (i % 4) * 8, 0, Math.PI * 2);
    context.fill();
  }

  context.lineWidth = 5;
  context.strokeStyle = "rgba(73, 58, 38, 0.28)";
  const seen = new Set<string>();
  for (const territory of game.territories) {
    for (const neighbor of territory.neighbors) {
      const key = [territory.name, neighbor].sort().join(":");
      if (seen.has(key)) {
        continue;
      }
      seen.add(key);
      const other = territoryByName(neighbor);
      if (!other) {
        continue;
      }
      context.beginPath();
      context.moveTo(territory.x, territory.y);
      context.lineTo(other.x, other.y);
      context.stroke();
    }
  }

  for (const territory of game.territories) {
    const color = ownerPalette[territory.owner] ?? "#666";
    const selected = territory.name === selectedSource || territory.name === selectedTarget;
    const hovered = territory.name === cursorTerritory()?.name;
    context.beginPath();
    context.fillStyle = color;
    context.strokeStyle = selected ? "#fff3d1" : hovered ? "#1d2b2a" : "rgba(33, 20, 8, 0.3)";
    context.lineWidth = selected ? 8 : hovered ? 6 : 4;
    context.arc(territory.x, territory.y, 43, 0, Math.PI * 2);
    context.fill();
    context.stroke();

    context.fillStyle = "#fff8ec";
    context.textAlign = "center";
    context.font = "bold 19px Georgia";
    context.fillText(territory.name, territory.x, territory.y - 8);
    context.font = "bold 24px Georgia";
    context.fillText(territory.hidden ? "?" : String(territory.units), territory.x, territory.y + 24);
  }

  context.fillStyle = "rgba(33, 24, 16, 0.68)";
  context.fillRect(18, 18, 320, 44);
  context.fillStyle = "#fff8ec";
  context.textAlign = "left";
  context.font = "bold 22px Georgia";
  context.fillText(`Turn ${game.turnNumber} • ${game.phase}`, 34, 47);
}

function renderTextState(): string {
  if (!game) {
    return JSON.stringify({ mode: "loading" });
  }
  const payload = {
    mode: game.phase,
    turn: game.turnNumber,
    note: game.mapNote,
    pendingOrders: plannedOrders,
    selection: {
      source: selectedSource,
      target: selectedTarget,
      type: selectedMode,
      units: selectedUnits,
      cursor: cursorTerritory()?.name ?? null
    },
    territories: game.territories.map((territory) => ({
      name: territory.name,
      owner: territory.owner,
      units: territory.hidden ? "hidden" : territory.units,
      x: territory.x,
      y: territory.y,
      neighbors: territory.neighbors
    })),
    players: game.players,
    log: game.lastLog
  };
  return JSON.stringify(payload);
}

function renderLogSections(entries: string[]): string {
  const sections = groupLogEntries(entries);
  return sections.map((section) => `
    <section class="battle-section battle-${section.kind}">
      <h3>${section.title}</h3>
      <div class="battle-lines">
        ${section.entries.map((entry) => `<div class="battle-line">${entry}</div>`).join("")}
      </div>
    </section>
  `).join("");
}

function renderTurnSummary(entries: string[]): string {
  const summaries = buildTurnSummary(entries);
  if (summaries.length === 0) {
    return `<div class="log-entry">No territory changes resolved yet.</div>`;
  }
  return summaries.map((summary) => {
    const movementText = summary.movementDelta === 0
      ? "move 0"
      : `move ${summary.movementDelta > 0 ? "+" : ""}${summary.movementDelta}`;
    const reinforcementText = summary.reinforcementDelta === 0
      ? "reinforce 0"
      : `reinforce +${summary.reinforcementDelta}`;
    const finalUnitsText = summary.finalUnits == null ? "?" : String(summary.finalUnits);
    return `
      <div class="turn-summary-card">
        <strong>${summary.territory}</strong>
        <div>${movementText}</div>
        <div>${reinforcementText}</div>
        <div>final ${finalUnitsText}${summary.owner ? ` • ${summary.owner}` : ""}</div>
      </div>
    `;
  }).join("");
}

function bindAutomationHooks(): void {
  (window as Window & { render_game_to_text?: () => string; advanceTime?: (ms: number) => void }).render_game_to_text = renderTextState;
  (window as Window & { render_game_to_text?: () => string; advanceTime?: (ms: number) => void }).advanceTime = () => {
    render();
  };
}

async function toggleFullscreen(): Promise<void> {
  if (!document.fullscreenElement) {
    await document.documentElement.requestFullscreen();
  } else {
    await document.exitFullscreen();
  }
}

function render(): void {
  if (!game) {
    app.innerHTML = `<section class="panel"><h1 class="title">RISC</h1><p>Loading battlefield...</p></section>`;
    return;
  }

  const setupHtml = game.phase === "SETUP"
    ? `
      <section class="panel setup">
        <h2>Initial Placement</h2>
        <p class="hint">Distribute your ${localPlayer()?.reserveUnits ?? 0} reserve units. Other players stay hidden until setup is locked in.</p>
        <div class="setup-grid">
          ${ownTerritories().map((territory) => `
            <div class="territory-stepper">
              <strong>${territory.name}</strong>
              <button class="secondary" data-setup-minus="${territory.name}">-</button>
              <span>${setupAllocations[territory.name] ?? 0}</span>
              <button class="secondary" data-setup-plus="${territory.name}">+</button>
            </div>`).join("")}
        </div>
        <div class="row">
          <span>Units left: <strong>${setupLeft()}</strong></span>
          <button id="start-btn">Lock Placement</button>
        </div>
      </section>`
    : "";

  const orderOptions = ownTerritories().map((territory) => `<option value="${territory.name}" ${selectedSource === territory.name ? "selected" : ""}>${territory.name}</option>`).join("");
  const targetOptions = (game.territories ?? []).map((territory) => `<option value="${territory.name}" ${selectedTarget === territory.name ? "selected" : ""}>${territory.name}</option>`).join("");

  app.innerHTML = `
    <section class="panel">
      <h1 class="title">RISC</h1>
      <p class="subtitle">Simultaneous turns, hidden commitments, and a very determined map of fantasy realms.</p>
      <section class="controls">
        <h2>Multiplayer</h2>
        ${roomId && roomToken
          ? `
            <div class="row">
              <span>Room: <strong>${roomId}</strong></span>
              <span>You: <strong>${localPlayerId()}</strong></span>
              <button class="secondary" id="leave-room">Leave</button>
            </div>
          `
          : `
            <div class="row">
              <button id="create-room">Create room</button>
              <input id="join-room-id" placeholder="Room ID (e.g. ABC123)" value="${joinRoomInput}" />
              <button class="secondary" id="join-room">Join</button>
            </div>
            <div class="hint">Open a second window to join the same room and play as another color.</div>
          `}
        ${game.waitingOnPlayers.length > 0 ? `<div class="hint">Waiting on: ${game.waitingOnPlayers.join(", ")}</div>` : ""}
      </section>
      ${setupHtml}
      <section class="controls">
        <h2>Orders</h2>
        <p class="hint">Click territories on the map or use the selectors below. Keep one unit behind in every source territory.</p>
        <div class="buttons">
          <button class="${selectedMode === "MOVE" ? "" : "secondary"}" data-mode="MOVE">Move</button>
          <button class="${selectedMode === "ATTACK" ? "" : "secondary"}" data-mode="ATTACK">Attack</button>
          <button class="secondary" id="fullscreen-btn">Fullscreen (F)</button>
        </div>
        <div class="row">
          <label>Source<select id="source-select"><option value="">Select</option>${orderOptions}</select></label>
          <label>Target<select id="target-select"><option value="">Select</option>${targetOptions}</select></label>
        </div>
        <div class="row">
          <label>Units<input id="units-input" type="number" min="1" value="${selectedUnits}" /></label>
          <button id="queue-order" ${game.phase !== "ORDERS" ? "disabled" : ""}>Queue Order</button>
        </div>
        <div class="buttons">
          <button class="secondary" id="clear-orders">Clear Planned Orders</button>
          <button id="commit-turn" ${game.phase !== "ORDERS" ? "disabled" : ""}>Commit Turn</button>
          <button class="secondary" id="reset-game">New Game</button>
        </div>
        <div class="hint">${message || "&nbsp;"}</div>
      </section>
      <section class="players">
        <h2>Factions</h2>
        ${game.players.map((player) => `
          <article>
            <strong>${player.displayName}</strong>
            <div>Territories: ${player.territories}</div>
            <div>Total units: ${player.totalUnits}</div>
            <div>${player.defeated ? "Defeated" : player.localPlayer ? "You" : roomId ? "Opponent" : "AI opponent"}</div>
          </article>`).join("")}
      </section>
      <section>
        <h2>Planned Orders</h2>
        <div class="log">
          ${plannedOrders.length === 0 ? `<div class="log-entry">No queued orders yet.</div>` : plannedOrders.map((order) => `<div class="log-entry">${order.type} ${order.units} from ${order.source} to ${order.target}</div>`).join("")}
        </div>
      </section>
      <section>
        <h2>Turn Changes</h2>
        <div class="log turn-summary-log">
          ${renderTurnSummary(game.lastLog)}
        </div>
      </section>
      <section>
        <h2>Resolution Log</h2>
        <div class="log battle-log">
          ${renderLogSections(game.lastLog)}
        </div>
      </section>
    </section>
    <section class="panel board-shell">
      <div class="board-meta">
        <div>
          <strong>${game.phase === "GAME_OVER" ? `${game.winner} wins` : "Battle Map"}</strong>
          <div class="hint">${game.mapNote}</div>
        </div>
        <div class="hint">Pending orders: ${plannedOrders.length}</div>
      </div>
      <canvas id="game-canvas" aria-label="RISC game board"></canvas>
    </section>
  `;

  const canvas = document.querySelector<HTMLCanvasElement>("#game-canvas");
  if (canvas) {
    drawBoard(canvas);
    canvas.onclick = (event) => onCanvasClick(event, canvas);
  }

  document.querySelectorAll<HTMLButtonElement>("[data-mode]").forEach((button) => {
    button.onclick = () => {
      selectedMode = button.dataset.mode as OrderType;
      render();
    };
  });

  document.querySelectorAll<HTMLButtonElement>("[data-setup-plus]").forEach((button) => {
    button.onclick = () => adjustSetup(button.dataset.setupPlus ?? "", 1);
  });
  document.querySelectorAll<HTMLButtonElement>("[data-setup-minus]").forEach((button) => {
    button.onclick = () => adjustSetup(button.dataset.setupMinus ?? "", -1);
  });

  const startButton = document.querySelector<HTMLButtonElement>("#start-btn");
  if (startButton) {
    startButton.onclick = () => {
      void commitSetup();
    };
  }

  const sourceSelect = document.querySelector<HTMLSelectElement>("#source-select");
  if (sourceSelect) {
    sourceSelect.onchange = () => {
      selectedSource = sourceSelect.value || null;
      render();
    };
  }

  const targetSelect = document.querySelector<HTMLSelectElement>("#target-select");
  if (targetSelect) {
    targetSelect.onchange = () => {
      selectedTarget = targetSelect.value || null;
      render();
    };
  }

  const unitsInput = document.querySelector<HTMLInputElement>("#units-input");
  if (unitsInput) {
    unitsInput.oninput = () => {
      selectedUnits = Math.max(1, Number(unitsInput.value) || 1);
    };
  }

  const queueButton = document.querySelector<HTMLButtonElement>("#queue-order");
  if (queueButton) {
    queueButton.onclick = queueOrder;
  }

  const commitButton = document.querySelector<HTMLButtonElement>("#commit-turn");
  if (commitButton) {
    commitButton.onclick = () => {
      void commitTurn();
    };
  }

  const clearButton = document.querySelector<HTMLButtonElement>("#clear-orders");
  if (clearButton) {
    clearButton.onclick = () => {
      plannedOrders = [];
      selectedUnits = 1;
      setMessage("Cleared planned orders.");
    };
  }

  const resetButton = document.querySelector<HTMLButtonElement>("#reset-game");
  if (resetButton) {
    resetButton.onclick = () => {
      void resetGame();
    };
  }

  const fullscreenButton = document.querySelector<HTMLButtonElement>("#fullscreen-btn");
  if (fullscreenButton) {
    fullscreenButton.onclick = () => {
      void toggleFullscreen();
    };
  }

  const createRoomButton = document.querySelector<HTMLButtonElement>("#create-room");
  if (createRoomButton) {
    createRoomButton.onclick = () => {
      void createRoom();
    };
  }

  const joinRoomIdInputEl = document.querySelector<HTMLInputElement>("#join-room-id");
  if (joinRoomIdInputEl) {
    joinRoomIdInputEl.oninput = () => {
      joinRoomInput = joinRoomIdInputEl.value;
    };
  }

  const joinRoomButton = document.querySelector<HTMLButtonElement>("#join-room");
  if (joinRoomButton) {
    joinRoomButton.onclick = () => {
      void joinRoom(joinRoomInput);
    };
  }

  const leaveRoomButton = document.querySelector<HTMLButtonElement>("#leave-room");
  if (leaveRoomButton) {
    leaveRoomButton.onclick = () => {
      leaveRoom();
    };
  }
}

window.addEventListener("keydown", (event) => {
  if (!game) {
    return;
  }
  if (event.key === "ArrowRight") {
    cursorIndex += 1;
    render();
    return;
  }
  if (event.key === "ArrowLeft") {
    cursorIndex -= 1;
    render();
    return;
  }
  if (event.key === "ArrowDown") {
    cursorIndex += 3;
    render();
    return;
  }
  if (event.key === "ArrowUp") {
    cursorIndex -= 3;
    render();
    return;
  }
  if (event.key.toLowerCase() === "f") {
    void toggleFullscreen();
  }
  if (event.key.toLowerCase() === "a" && game.phase === "ORDERS") {
    selectedMode = "ATTACK";
    render();
  }
  if (event.key.toLowerCase() === "b" && game.phase === "ORDERS") {
    selectedMode = "MOVE";
    render();
  }
  if (event.key === "Enter") {
    if (game.phase === "SETUP") {
      void commitSetup();
      return;
    }
    if (game.phase === "ORDERS" && selectedSource && selectedTarget) {
      queueOrder();
      return;
    }
    if (game.phase === "ORDERS" && plannedOrders.length > 0) {
      void commitTurn();
    }
  }
  if (event.key === " " || event.code === "Space") {
    if (game.phase !== "ORDERS") {
      return;
    }
    event.preventDefault();
    const territory = cursorTerritory();
    if (!territory) {
      return;
    }
    if (!selectedSource) {
      if (territory.owner !== localPlayerId()) {
        setMessage("Choose one of your territories as the source.");
        return;
      }
      selectedSource = territory.name;
      selectedTarget = null;
      setMessage(`Source selected: ${territory.name}. Move the cursor and press Space again for the target.`);
      render();
      return;
    }
    if (territory.name === selectedSource) {
      selectedSource = null;
      selectedTarget = null;
      setMessage("Selection cleared.");
      render();
      return;
    }
    selectedTarget = territory.name;
    setMessage(`Target selected: ${territory.name}. Press Enter to queue the order.`);
    render();
    return;
  }
  if (event.key === "Escape" && document.fullscreenElement) {
    void document.exitFullscreen();
  }
});

bindAutomationHooks();
void loadGame();

async function createRoom(): Promise<void> {
  try {
    const response = await api<{ roomId: string; playerId: string; token: string; game: GameView }>("/api/rooms", { method: "POST" });
    roomId = response.roomId;
    roomToken = response.token;
    localStorage.setItem("risc_room_id", roomId);
    localStorage.setItem("risc_room_token", roomToken);
    game = response.game;
    initializeSetupAllocations();
    startPolling();
    setMessage(`Created room ${roomId}.`);
  } catch (error) {
    setMessage((error as Error).message);
  }
}

async function joinRoom(input: string): Promise<void> {
  try {
    const trimmed = (input ?? "").trim().toUpperCase();
    if (!trimmed) {
      setMessage("Enter a room ID to join.");
      return;
    }
    const response = await api<{ roomId: string; playerId: string; token: string; game: GameView }>(`/api/rooms/${trimmed}/join`, { method: "POST" });
    roomId = response.roomId;
    roomToken = response.token;
    localStorage.setItem("risc_room_id", roomId);
    localStorage.setItem("risc_room_token", roomToken);
    game = response.game;
    initializeSetupAllocations();
    startPolling();
    setMessage(`Joined room ${roomId} as ${response.playerId}.`);
  } catch (error) {
    setMessage((error as Error).message);
  }
}

function leaveRoom(): void {
  roomId = null;
  roomToken = null;
  localStorage.removeItem("risc_room_id");
  localStorage.removeItem("risc_room_token");
  stopPolling();
  plannedOrders = [];
  setupAllocations = {};
  setMessage("Left room. Back to single-player.");
  void loadGame();
}

function startPolling(): void {
  if (pollHandle != null) {
    return;
  }
  pollHandle = window.setInterval(() => {
    void pollOnce();
  }, 1200);
}

function stopPolling(): void {
  if (pollHandle == null) {
    return;
  }
  window.clearInterval(pollHandle);
  pollHandle = null;
  pollInFlight = false;
}

async function pollOnce(): Promise<void> {
  if (!roomId || !roomToken || pollInFlight) {
    return;
  }
  pollInFlight = true;
  try {
    game = await api<GameView>(`/api/rooms/${roomId}`);
    initializeSetupAllocations();
    render();
  } catch {
    // Ignore transient polling errors.
  } finally {
    pollInFlight = false;
  }
}

if (roomId && roomToken) {
  startPolling();
}

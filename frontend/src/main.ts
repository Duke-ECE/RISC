import "./style.css";
import { groupLogEntries } from "./logSections";
import { buildTurnSummary } from "./turnSummary";

type Phase = "LOBBY" | "SETUP" | "ORDERS" | "GAME_OVER";
type OrderType = "MOVE" | "ATTACK";

type Territory = {
  name: string;
  owner: string | null;
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
let plannedMoves: PlannedOrder[] = [];
let plannedAttacks: PlannedOrder[] = [];
let boardTerritories: Territory[] = [];
let planningTurnNumber: number | null = null;
let selectedSource: string | null = null;
let selectedTarget: string | null = null;
let selectedMode: OrderType = "MOVE";
let selectedUnits = 1;
let message = "";
let cursorIndex = 0;
let roomId: string | null = localStorage.getItem("risc_room_id");
let roomToken: string | null = sessionStorage.getItem("risc_room_token");
const legacyToken = localStorage.getItem("risc_room_token");
if (!roomToken && legacyToken) {
  // Migrate old storage: token should be per-tab (sessionStorage), not shared across windows (localStorage).
  roomToken = legacyToken;
  sessionStorage.setItem("risc_room_token", legacyToken);
  localStorage.removeItem("risc_room_token");
}
let joinRoomInput = "";
if (roomId) {
  joinRoomInput = roomId;
}
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
  RED: "#bb6553",
  YELLOW: "#c7b15a",
  PURPLE: "#8b6fb8",
  UNOWNED: "#ffffff"
};

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json"
  };
  if (roomToken) {
    headers["X-Player-Token"] = roomToken;
  }
  const response = await fetch(`http://127.0.0.1:8080${path}`, { headers: { ...headers }, ...init });
  const raw = await response.text();
  let payload: unknown = null;
  try {
    payload = raw ? JSON.parse(raw) : null;
  } catch {
    payload = { error: raw || "Request failed" };
  }
  const payloadError = typeof payload === "object" && payload != null && "error" in payload && typeof (payload as { error: unknown }).error === "string"
    ? String((payload as { error: unknown }).error)
    : null;
  if (!response.ok || payloadError) {
    throw new Error(payloadError ?? "Request failed");
  }
  return payload as T;
}

function localPlayer(): Player | undefined {
  return game?.players.find((player) => player.localPlayer);
}

function localPlayerId(): string {
  return localPlayer()?.id ?? "GREEN";
}

function activeTerritories(): Territory[] {
  if (!game) {
    return [];
  }
  if (game.phase === "ORDERS" && boardTerritories.length > 0) {
    return boardTerritories;
  }
  return game.territories ?? [];
}

function territoryByName(name: string | null): Territory | undefined {
  return activeTerritories().find((territory) => territory.name === name);
}

function cursorTerritory(): Territory | undefined {
  const territories = activeTerritories();
  if (!game || territories.length === 0) {
    return undefined;
  }
  return territories[((cursorIndex % territories.length) + territories.length) % territories.length];
}

function ownTerritories(): Territory[] {
  const id = localPlayerId();
  return activeTerritories().filter((territory) => territory.owner === id);
}

function isAdjacent(source: Territory, target: Territory): boolean {
  return source.neighbors.includes(target.name);
}

function hasFriendlyPath(sourceName: string, targetName: string): boolean {
  if (sourceName === targetName) {
    return true;
  }
  const territories = activeTerritories();
  const byName = new Map(territories.map((territory) => [territory.name, territory]));
  const player = localPlayerId();
  const queue: string[] = [sourceName];
  const visited = new Set<string>([sourceName]);
  while (queue.length > 0) {
    const current = queue.shift()!;
    const territory = byName.get(current);
    if (!territory) {
      continue;
    }
    for (const neighborName of territory.neighbors) {
      const neighbor = byName.get(neighborName);
      if (!neighbor || neighbor.owner !== player) {
        continue;
      }
      if (visited.has(neighborName)) {
        continue;
      }
      if (neighborName === targetName) {
        return true;
      }
      visited.add(neighborName);
      queue.push(neighborName);
    }
  }
  return false;
}

function availableFromSource(name: string): number {
  const territory = territoryByName(name);
  if (!territory) {
    return 0;
  }
  const reservedForAttacks = plannedAttacks
    .filter((order) => order.source === name)
    .reduce((sum, order) => sum + order.units, 0);
  return Math.max(0, territory.units - reservedForAttacks);
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
    game = null;
    render();
    return;
  }
  initializeSetupAllocations();
  syncPlanningState();
  state.mode = "ready";
  render();
}

async function safeLoadGame(): Promise<void> {
  try {
    await loadGame();
  } catch (error) {
    // Stale room/token is common after backend restart; clear and try again once.
    if (roomId && roomToken) {
      roomId = null;
      roomToken = null;
      localStorage.removeItem("risc_room_id");
      sessionStorage.removeItem("risc_room_token");
      try {
        await loadGame();
        return;
      } catch {
        // fall through
      }
    }
    setMessage(`Failed to load: ${(error as Error).message}`);
  }
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

function syncPlanningState(): void {
  if (!game || game.phase !== "ORDERS") {
    boardTerritories = [];
    plannedMoves = [];
    plannedAttacks = [];
    planningTurnNumber = null;
    return;
  }

  if (planningTurnNumber !== game.turnNumber) {
    plannedMoves = [];
    plannedAttacks = [];
    planningTurnNumber = game.turnNumber;
    selectedSource = null;
    selectedTarget = null;
    selectedUnits = 1;
  }

  boardTerritories = game.territories.map((territory) => ({
    ...territory,
    neighbors: [...territory.neighbors]
  }));

  for (const move of plannedMoves) {
    applyMoveLocally(move);
  }
}

function applyMoveLocally(move: PlannedOrder): void {
  const source = boardTerritories.find((territory) => territory.name === move.source);
  const target = boardTerritories.find((territory) => territory.name === move.target);
  if (!source || !target) {
    return;
  }
  source.units = Math.max(0, source.units - move.units);
  if (source.units === 0) {
    source.owner = null;
  }
  if (target.owner == null && move.units > 0) {
    target.owner = localPlayerId();
  }
  target.units += move.units;
}

async function resetGame(): Promise<void> {
  if (roomId && roomToken) {
    game = await api<GameView>(`/api/rooms/${roomId}/reset`, { method: "POST" });
  } else {
    game = await api<GameView>("/api/game/reset", { method: "POST" });
  }
  plannedMoves = [];
  plannedAttacks = [];
  boardTerritories = [];
  planningTurnNumber = null;
  selectedSource = null;
  selectedTarget = null;
  selectedUnits = 1;
  setMessage("");
  initializeSetupAllocations();
  syncPlanningState();
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
    plannedMoves = [];
    plannedAttacks = [];
    boardTerritories = [];
    planningTurnNumber = null;
    selectedSource = null;
    selectedTarget = null;
    selectedUnits = 1;
    syncPlanningState();
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
  const maxUnits = availableFromSource(selectedSource);
  if (selectedUnits < 1 || selectedUnits > maxUnits) {
    setMessage("That territory does not have enough spare units.");
    return;
  }
  const queuedSource = selectedSource;
  const queuedTarget = selectedTarget;
  if (selectedMode === "MOVE") {
    if (target.owner !== localPlayerId() && target.owner !== null) {
      setMessage("Move can only target your own territories or an unoccupied territory.");
      return;
    }
    if (target.owner === null && !isAdjacent(source, target)) {
      setMessage("Moves into unoccupied territories must be adjacent.");
      return;
    }
    if (target.owner === localPlayerId() && !hasFriendlyPath(source.name, target.name)) {
      setMessage("Moves into owned territories need a friendly path.");
      return;
    }
    const move: PlannedOrder = { type: "MOVE", source: queuedSource, target: queuedTarget, units: selectedUnits };
    plannedMoves = [...plannedMoves, move];
    applyMoveLocally(move);
    setMessage(`Moved ${selectedUnits} from ${queuedSource} to ${queuedTarget}.`);
  } else {
    if (target.owner === localPlayerId()) {
      setMessage("Attack orders must target enemy or unoccupied territories.");
      return;
    }
    if (!isAdjacent(source, target)) {
      setMessage("Attack orders must target adjacent territories.");
      return;
    }
    plannedAttacks = [...plannedAttacks, { type: "ATTACK", source: queuedSource, target: queuedTarget, units: selectedUnits }];
    setMessage(`Queued attack ${selectedUnits} from ${queuedSource} to ${queuedTarget}.`);
  }
  selectedSource = null;
  selectedTarget = null;
  selectedUnits = 1;
  render();
}

async function commitTurn(): Promise<void> {
  try {
    const payload = JSON.stringify({
      orders: [...plannedMoves, ...plannedAttacks].map((order) => ({
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
    plannedMoves = [];
    plannedAttacks = [];
    boardTerritories = [];
    planningTurnNumber = null;
    selectedUnits = 1;
    selectedSource = null;
    selectedTarget = null;
    syncPlanningState();
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
  const clicked = activeTerritories().find((territory) => {
    const dx = territory.x - x;
    const dy = territory.y - y;
    return Math.sqrt(dx * dx + dy * dy) < 48;
  });
  if (!clicked) {
    return;
  }
  cursorIndex = activeTerritories().findIndex((territory) => territory.name === clicked.name);
  if (!selectedSource) {
    if (clicked.owner !== localPlayerId()) {
      setMessage("Choose one of your territories as the source.");
      return;
    }
    if (availableFromSource(clicked.name) <= 0) {
      setMessage("That territory has no units available to move or attack.");
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
  const territories = activeTerritories();

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
  for (const territory of territories) {
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

  for (const territory of territories) {
    const ownerKey = territory.owner ?? "UNOWNED";
    const color = ownerPalette[ownerKey] ?? "#666";
    const selected = territory.name === selectedSource || territory.name === selectedTarget;
    const hovered = territory.name === cursorTerritory()?.name;
    context.beginPath();
    context.fillStyle = color;
    context.strokeStyle = selected
      ? "#fff3d1"
      : hovered
        ? "#1d2b2a"
        : ownerKey === "UNOWNED"
          ? "rgba(33, 20, 8, 0.55)"
          : "rgba(33, 20, 8, 0.3)";
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
    pendingMoves: plannedMoves,
    pendingAttacks: plannedAttacks,
    selection: {
      source: selectedSource,
      target: selectedTarget,
      type: selectedMode,
      units: selectedUnits,
      cursor: cursorTerritory()?.name ?? null
    },
    territories: activeTerritories().map((territory) => ({
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
    app.innerHTML = `
      <section class="panel">
        <h1 class="title">RISC</h1>
        <div class="row">
          <button id="create-room">Create room</button>
          <input id="join-room-id" placeholder="Room ID (e.g. ABC123)" value="${joinRoomInput}" />
          <button class="secondary" id="join-room">Join</button>
        </div>
        <div class="hint">${message || "Tip: open another window and Join the same Room ID to get a different player seat."}</div>
      </section>
    `;
    const createBtn = document.querySelector<HTMLButtonElement>("#create-room");
    if (createBtn) {
      createBtn.onclick = () => {
        void createRoom().catch(() => {});
      };
    }
    const joinRoomIdInputEl = document.querySelector<HTMLInputElement>("#join-room-id");
    if (joinRoomIdInputEl) {
      joinRoomIdInputEl.oninput = () => {
        joinRoomInput = joinRoomIdInputEl.value;
      };
    }
    const joinBtn = document.querySelector<HTMLButtonElement>("#join-room");
    if (joinBtn) {
      joinBtn.onclick = () => {
        void joinRoom(joinRoomInput).catch(() => {});
      };
    }
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

  const orderOptions = ownTerritories()
    .filter((territory) => availableFromSource(territory.name) > 0)
    .map((territory) => `<option value="${territory.name}" ${selectedSource === territory.name ? "selected" : ""}>${territory.name}</option>`)
    .join("");
  const targetOptions = activeTerritories().map((territory) => `<option value="${territory.name}" ${selectedTarget === territory.name ? "selected" : ""}>${territory.name}</option>`).join("");

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
              <button class="secondary" id="new-seat">New seat</button>
            </div>
            ${game.phase === "LOBBY" && localPlayerId() === "GREEN"
              ? `
                <div class="row">
                  <button id="start-game" ${game.players.length < 2 ? "disabled" : ""}>Start game</button>
                  <span class="hint">Need at least 2 players (currently ${game.players.length}).</span>
                </div>
              `
              : ""}
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
        <p class="hint">Click territories on the map or use the selectors below. You may move/attack with all units (territories can become unoccupied).</p>
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
          <button class="secondary" id="clear-orders">Clear Planned Actions</button>
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
        <h2>Queued Attacks</h2>
        <div class="log">
          ${plannedAttacks.length === 0
            ? `<div class="log-entry">No queued attacks yet.</div>`
            : plannedAttacks.map((order, index) => `
              <div class="log-entry">
                ATTACK ${order.units} from ${order.source} to ${order.target}
                <button class="secondary" data-attack-remove="${index}">Remove</button>
              </div>`).join("")}
        </div>
        <div class="hint">Moves apply immediately in your browser. Attacks resolve together when you commit.</div>
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
        <div class="hint">Pending actions: ${plannedMoves.length + plannedAttacks.length}</div>
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
      plannedMoves = [];
      plannedAttacks = [];
      syncPlanningState();
      selectedUnits = 1;
      setMessage("Cleared planned actions.");
    };
  }

  document.querySelectorAll<HTMLButtonElement>("[data-attack-remove]").forEach((button) => {
    button.onclick = () => {
      const index = Number(button.dataset.attackRemove ?? "-1");
      if (Number.isNaN(index) || index < 0) {
        return;
      }
      plannedAttacks = plannedAttacks.filter((_, i) => i !== index);
      setMessage("Removed queued attack.");
      render();
    };
  });

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
      void createRoom().catch(() => {});
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
      void joinRoom(joinRoomInput).catch(() => {});
    };
  }

  const leaveRoomButton = document.querySelector<HTMLButtonElement>("#leave-room");
  if (leaveRoomButton) {
    leaveRoomButton.onclick = () => {
      leaveRoom();
    };
  }

  const newSeatButton = document.querySelector<HTMLButtonElement>("#new-seat");
  if (newSeatButton) {
    newSeatButton.onclick = () => {
      void joinAsNewSeat().catch(() => {});
    };
  }

  const startGameButton = document.querySelector<HTMLButtonElement>("#start-game");
  if (startGameButton) {
    startGameButton.onclick = () => {
      void startGame().catch(() => {});
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
    if (game.phase === "ORDERS" && (plannedMoves.length + plannedAttacks.length) > 0) {
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
      if (availableFromSource(territory.name) <= 0) {
        setMessage("That territory has no units available to move or attack.");
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
void safeLoadGame();

async function createRoom(): Promise<void> {
  try {
    const response = await api<{ roomId: string; playerId: string; token: string; game: GameView }>("/api/rooms", { method: "POST" });
    roomId = response.roomId;
    roomToken = response.token;
    localStorage.setItem("risc_room_id", roomId);
    sessionStorage.setItem("risc_room_token", roomToken);
    game = response.game;
    initializeSetupAllocations();
    syncPlanningState();
    startPolling();
    setMessage(`Created room ${roomId}.`);
  } catch (error) {
    setMessage((error as Error).message);
    throw error;
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
    sessionStorage.setItem("risc_room_token", roomToken);
    game = response.game;
    initializeSetupAllocations();
    syncPlanningState();
    startPolling();
    setMessage(`Joined room ${roomId} as ${response.playerId}.`);
  } catch (error) {
    setMessage((error as Error).message);
    throw error;
  }
}

function leaveRoom(): void {
  roomId = null;
  roomToken = null;
  localStorage.removeItem("risc_room_id");
  sessionStorage.removeItem("risc_room_token");
  stopPolling();
  plannedMoves = [];
  plannedAttacks = [];
  boardTerritories = [];
  planningTurnNumber = null;
  setupAllocations = {};
  setMessage("Left room.");
  game = null;
  render();
}

async function joinAsNewSeat(): Promise<void> {
  if (!roomId) {
    setMessage("No room to join.");
    return;
  }
  roomToken = null;
  sessionStorage.removeItem("risc_room_token");
  stopPolling();
  plannedMoves = [];
  plannedAttacks = [];
  boardTerritories = [];
  planningTurnNumber = null;
  setupAllocations = {};
  await joinRoom(roomId);
}

async function startGame(): Promise<void> {
  if (!roomId || !roomToken) {
    setMessage("Create or join a room first.");
    return;
  }
  try {
    game = await api<GameView>(`/api/rooms/${roomId}/start`, { method: "POST" });
    plannedMoves = [];
    plannedAttacks = [];
    boardTerritories = [];
    planningTurnNumber = null;
    selectedSource = null;
    selectedTarget = null;
    selectedUnits = 1;
    initializeSetupAllocations();
    syncPlanningState();
    setMessage(game.phase === "SETUP" ? "Game started. Submit your setup." : "Game started.");
  } catch (error) {
    setMessage((error as Error).message);
    throw error;
  }
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
    syncPlanningState();
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

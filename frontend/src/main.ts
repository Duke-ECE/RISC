import "./style.css";
import { groupLogEntries } from "./logSections";
import { canUpgradeUnit, techUpgradeCost, type UnitLevelName, unitLevels, unitUpgradeCost } from "./pj2Orders";
import { summarizeTerritoryIntel } from "./territoryIntel";
import { buildTurnSummary } from "./turnSummary";

type Phase = "LOBBY" | "SETUP" | "ORDERS" | "GAME_OVER";
type OrderType = "MOVE" | "ATTACK" | "UPGRADE_TECH" | "UPGRADE_UNIT";

type Territory = {
  name: string;
  owner: string | null;
  units: number;
  x: number;
  y: number;
  size: number;
  resourceProduction: Record<string, number>;
  unitCounts: Record<string, number>;
  neighbors: string[];
  hidden: boolean;
  polygon?: { x: number; y: number }[] | null;
};

type Player = {
  id: string;
  displayName: string;
  territories: number;
  totalUnits: number;
  defeated: boolean;
  localPlayer: boolean;
  reserveUnits: number;
  maxTechnologyLevel: number;
  resources: Record<string, number>;
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
  seatCount: number;
  roomId: string | null;
  waitingOnPlayers: string[];
};

type PlannedOrder = {
  type: OrderType;
  source?: string | null;
  target?: string | null;
  units: number;
  fromLevel?: UnitLevelName | null;
  toLevel?: UnitLevelName | null;
};

type Lang = "zh" | "en";

const appRoot = document.querySelector<HTMLDivElement>("#app");

if (!appRoot) {
  throw new Error("Missing app root");
}

const app = appRoot;

let lang: Lang = localStorage.getItem("risc_lang") === "en" ? "en" : "zh";

const uiText: Record<Lang, Record<string, string>> = {
  zh: {
    language: "语言",
    chinese: "中文",
    english: "English",
    subtitle: "同时回合、隐藏提交，以及一张非常倔强的幻想大陆地图。",
    createRoom: "创建房间",
    join: "加入",
    roomIdPlaceholder: "房间号 (例如 ABC123)",
    tipJoin: "提示：开新窗口输入同一个房间号即可加入。",
    multiplayer: "多人房间",
    room: "房间",
    you: "你",
    leave: "离开",
    newSeat: "新增空位",
    startGame: "开始游戏",
    startHint: "开始条件：无空位且至少 2 人。座位 {seats}/5 • 玩家 {players}。",
    waitingOn: "等待：{waiting}",
    orders: "指令",
    ordersHint: "点击地图上的领地来选择来源和目标。你可以用全部单位移动/进攻（领地可清空变无人占领）。",
    move: "移动",
    attack: "进攻",
    upgradeTech: "升科技",
    upgradeUnit: "升兵种",
    fullscreen: "全屏 (F)",
    source: "来源",
    target: "目标",
    currentSelection: "当前选择",
    none: "未选择",
    units: "单位数",
    queueOrder: "添加指令",
    clearOrders: "清空计划",
    commitTurn: "提交回合",
    newGame: "新对局",
    factions: "阵营",
    youLabel: "你",
    opponent: "对手",
    defeated: "已淘汰",
    territoriesLabel: "领地",
    totalUnitsLabel: "总兵力",
    resourcesLabel: "资源",
    techLevelLabel: "科技等级",
    territoryIntel: "领地情报",
    territorySize: "规模",
    territoryOwner: "占领者",
    territoryOutput: "产出",
    territoryUnits: "驻军",
    noTerritoryFocus: "选择或悬停一块领地以查看详细信息。",
    queuedAttacks: "已排队的进攻",
    noQueuedAttacks: "还没有排队的进攻。",
    noQueuedOrders: "还没有排队的 PJ2 指令。",
    remove: "删除",
    movesApplyHint: "移动会在本地立即生效；进攻会在提交时一起结算。",
    turnChanges: "本回合变化",
    resolutionLog: "结算日志",
    battleMap: "战场地图",
    pendingActions: "待提交操作：{count}",
    winnerWins: "{winner} 获胜",
    logOrders: "指令",
    logCombat: "战斗",
    logReinforcements: "增援",
    logEndOfTurn: "回合结束",
    logNotes: "备注",
    deltaMove: "移动",
    deltaReinforce: "增援",
    final: "最终",
    noTurnChanges: "暂无领地变化。",
    lobby: "大厅",
    setup: "布置",
    ordersPhase: "指令",
    gameOver: "结束",
    initialPlacement: "初始布置",
    placementHint: "分配你的 {reserve} 预备兵。你可以勾选某块为“空白”（无人占领）。",
    empty: "空白",
    unitsLeft: "剩余可放",
    lockPlacement: "锁定布置",
    needPlaceAll: "请先放完所有预备兵。剩余：{left}。",
    setupWaiting: "已提交布置，等待：{waiting}。",
    setupLocked: "布置已锁定。对手布置已揭示。",
    addedSeat: "已新增一个空位。",
    removedSeat: "已删除最后一个空位。",
    createdRoom: "已创建房间 {roomId}。",
    joinedRoom: "已加入房间 {roomId}，座位 {playerId}。",
    leftRoom: "已离开房间。",
    enterRoomId: "请输入房间号再加入。",
    noRoomToJoin: "当前没有房间可加空位。",
    popupBlocked: "浏览器阻止了弹窗，请允许后再试。",
    startNeedRoom: "请先创建或加入房间。",
    chooseSourceAndTarget: "请先选择来源和目标领地。",
    notEnoughUnits: "该领地可用单位不足。",
    moveTargetsOnlyFriendly: "移动只能到己方领地或无人占领领地。",
    moveUnownedMustAdjacent: "移动到无人占领领地必须相邻。",
    moveNeedsPath: "移动到己方领地需要一条己方连通路径。",
    attackMustNotFriendly: "进攻目标必须是敌方或无人占领领地。",
    attackMustAdjacent: "进攻必须选择相邻领地。",
    upgradeNeedSource: "升级单位前请先选择你的领地。",
    upgradeNeedLevels: "请选择升级前后的单位等级。",
    upgradeTechMaxed: "当前科技已到上限。",
    upgradeTechQueued: "本回合已经排过一次科技升级。",
    upgradeIllegal: "当前升级选择不合法，请检查科技等级、单位数量和升级方向。",
    upgradeTechQueuedDone: "已排队科技升级。",
    upgradedUnitQueued: "已排队单位升级 {units}：{source} {fromLevel} -> {toLevel}。",
    fromLevel: "起始等级",
    toLevel: "目标等级",
    estimatedCost: "预计消耗",
    techOnlyOnce: "每回合最多 1 次科技升级，下一回合生效。",
    sourceForUpgrade: "升级领地",
    territorySizeMap: "规模 S{size}",
    warOver: "战争结束。",
    turnResolved: "回合已结算，继续规划下一回合。",
    chooseOwnSource: "来源必须选择你自己的领地。",
    sourceNoUnits: "该领地没有可用于移动/进攻的单位。",
    sourceCleared: "已取消来源选择。",
    targetSelected: "目标已选择：{name}。",
    sourceSelected: "来源已选择：{name}。请继续选择目标。",
    moved: "已移动 {units}：{source} → {target}。",
    queuedAttack: "已排队进攻 {units}：{source} → {target}。",
    clearedPlanned: "已清空计划操作。",
    removedAttack: "已删除该条进攻。",
    queuedOrderHint: "按 Enter 可快速添加/提交；A=进攻，B=移动。",
    selectionCleared: "已清空选择。",
    sourceSelectedCursor: "来源已选择：{name}。移动光标并再次按空格选择目标。",
    targetSelectedEnter: "目标已选择：{name}。按回车添加指令。",
    failedToLoad: "加载失败：{error}",
    gameStartedSetup: "已开始游戏，请提交初始布置。",
    gameStarted: "游戏已开始。",
  },
  en: {
    language: "Language",
    chinese: "中文",
    english: "English",
    subtitle: "Simultaneous turns, hidden commitments, and a very determined map of fantasy realms.",
    createRoom: "Create room",
    join: "Join",
    roomIdPlaceholder: "Room ID (e.g. ABC123)",
    tipJoin: "Tip: open another window and join the same Room ID.",
    multiplayer: "Multiplayer",
    room: "Room",
    you: "You",
    leave: "Leave",
    newSeat: "New seat",
    startGame: "Start game",
    startHint: "Start requires no empty seats and at least 2 players. Seats {seats}/5 • Players {players}.",
    waitingOn: "Waiting on: {waiting}",
    orders: "Orders",
    ordersHint: "Click territories on the map to choose source and target. You may move/attack with all units (territories can become unoccupied).",
    move: "Move",
    attack: "Attack",
    upgradeTech: "Tech Upgrade",
    upgradeUnit: "Unit Upgrade",
    fullscreen: "Fullscreen (F)",
    source: "Source",
    target: "Target",
    currentSelection: "Current Selection",
    none: "None",
    units: "Units",
    queueOrder: "Queue Order",
    clearOrders: "Clear Planned Actions",
    commitTurn: "Commit Turn",
    newGame: "New Game",
    factions: "Factions",
    youLabel: "You",
    opponent: "Opponent",
    defeated: "Defeated",
    territoriesLabel: "Territories",
    totalUnitsLabel: "Total units",
    resourcesLabel: "Resources",
    techLevelLabel: "Tech level",
    territoryIntel: "Territory Intel",
    territorySize: "Size",
    territoryOwner: "Owner",
    territoryOutput: "Production",
    territoryUnits: "Units",
    noTerritoryFocus: "Select or hover a territory to inspect its details.",
    queuedAttacks: "Queued Attacks",
    noQueuedAttacks: "No queued attacks yet.",
    noQueuedOrders: "No queued PJ2 orders yet.",
    remove: "Remove",
    movesApplyHint: "Moves apply immediately in your browser. Attacks resolve together when you commit.",
    turnChanges: "Turn Changes",
    resolutionLog: "Resolution Log",
    battleMap: "Battle Map",
    pendingActions: "Pending actions: {count}",
    winnerWins: "{winner} wins",
    logOrders: "Orders",
    logCombat: "Combat",
    logReinforcements: "Reinforcements",
    logEndOfTurn: "End Of Turn",
    logNotes: "Notes",
    deltaMove: "move",
    deltaReinforce: "reinforce",
    final: "final",
    noTurnChanges: "No territory changes resolved yet.",
    lobby: "LOBBY",
    setup: "SETUP",
    ordersPhase: "ORDERS",
    gameOver: "GAME OVER",
    initialPlacement: "Initial Placement",
    placementHint: "Distribute your {reserve} reserve units. You may mark a starting territory as empty (unoccupied).",
    empty: "Empty",
    unitsLeft: "Units left",
    lockPlacement: "Lock Placement",
    needPlaceAll: "Place all reserve units first. Units left: {left}.",
    setupWaiting: "Setup submitted. Waiting on: {waiting}.",
    setupLocked: "Setup locked in. Opponents have revealed their placements.",
    addedSeat: "Added an empty seat.",
    removedSeat: "Removed the last empty seat.",
    createdRoom: "Created room {roomId}.",
    joinedRoom: "Joined room {roomId} as {playerId}.",
    leftRoom: "Left room.",
    enterRoomId: "Enter a room ID to join.",
    noRoomToJoin: "No room to add a seat.",
    popupBlocked: "Popup blocked. Allow popups for this site, then try again.",
    startNeedRoom: "Create or join a room first.",
    chooseSourceAndTarget: "Choose a source and a target territory first.",
    notEnoughUnits: "That territory does not have enough spare units.",
    moveTargetsOnlyFriendly: "Move can only target your own territories or an unoccupied territory.",
    moveUnownedMustAdjacent: "Moves into unoccupied territories must be adjacent.",
    moveNeedsPath: "Moves into owned territories need a friendly path.",
    attackMustNotFriendly: "Attack orders must target enemy or unoccupied territories.",
    attackMustAdjacent: "Attack orders must target adjacent territories.",
    upgradeNeedSource: "Choose one of your territories before upgrading units.",
    upgradeNeedLevels: "Choose both the current and target unit levels.",
    upgradeTechMaxed: "Technology is already maxed out.",
    upgradeTechQueued: "A tech upgrade is already queued this turn.",
    upgradeIllegal: "That upgrade is not legal with the current tech level, unit counts, or direction.",
    upgradeTechQueuedDone: "Queued a technology upgrade.",
    upgradedUnitQueued: "Queued unit upgrade {units}: {source} {fromLevel} -> {toLevel}.",
    fromLevel: "From level",
    toLevel: "To level",
    estimatedCost: "Estimated cost",
    techOnlyOnce: "At most one tech upgrade per turn. It completes next turn.",
    sourceForUpgrade: "Upgrade territory",
    territorySizeMap: "Size S{size}",
    warOver: "The war is over.",
    turnResolved: "Turn resolved. Plan your next move.",
    chooseOwnSource: "Choose one of your territories as the source.",
    sourceNoUnits: "That territory has no units available to move or attack.",
    sourceCleared: "Source cleared.",
    targetSelected: "Target selected: {name}.",
    sourceSelected: "Source selected: {name}. Now choose a target.",
    moved: "Moved {units}: {source} -> {target}.",
    queuedAttack: "Queued attack {units}: {source} -> {target}.",
    clearedPlanned: "Cleared planned actions.",
    removedAttack: "Removed queued attack.",
    queuedOrderHint: "Enter queues/commits. A=Attack, B=Move.",
    selectionCleared: "Selection cleared.",
    sourceSelectedCursor: "Source selected: {name}. Move the cursor and press Space again for the target.",
    targetSelectedEnter: "Target selected: {name}. Press Enter to queue the order.",
    failedToLoad: "Failed to load: {error}",
    gameStartedSetup: "Game started. Submit your setup.",
    gameStarted: "Game started.",
  }
};

function t(key: string, vars?: Record<string, string | number>): string {
  const template = uiText[lang][key] ?? uiText.en[key] ?? key;
  return template.replace(/\{(\w+)\}/g, (_, name) => String(vars?.[name] ?? ""));
}

function phaseLabel(phase: Phase): string {
  if (lang === "en") {
    return phase;
  }
  if (phase === "LOBBY") return t("lobby");
  if (phase === "SETUP") return t("setup");
  if (phase === "ORDERS") return t("ordersPhase");
  return t("gameOver");
}

let game: GameView | null = null;
let setupAllocations: Record<string, number> = {};
let setupAbandoned: Record<string, boolean> = {};
let setupSubmitted = false;
let plannedMoves: PlannedOrder[] = [];
let plannedAttacks: PlannedOrder[] = [];
let plannedUpgrades: PlannedOrder[] = [];
let boardTerritories: Territory[] = [];
let planningTurnNumber: number | null = null;
let selectedSource: string | null = null;
let selectedTarget: string | null = null;
let selectedMode: OrderType = "MOVE";
let selectedUnits = 1;
let selectedFromLevel: UnitLevelName = "BASIC";
let selectedToLevel: UnitLevelName = "LEVEL_1";
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
let savedScrollPositions: Record<string, number> = {};

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

const seatOrder = ["GREEN", "BLUE", "RED", "YELLOW", "PURPLE"] as const;

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

function isHost(): boolean {
  return localPlayerId() === "GREEN";
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

function shortestFriendlyPathSize(sourceName: string, targetName: string): number | null {
  if (sourceName === targetName) {
    return 0;
  }
  const territories = activeTerritories();
  const byName = new Map(territories.map((territory) => [territory.name, territory]));
  const player = localPlayerId();
  const queue: Array<{ territory: string; cost: number }> = [{ territory: sourceName, cost: 0 }];
  const best = new Map<string, number>([[sourceName, 0]]);
  while (queue.length > 0) {
    queue.sort((left, right) => left.cost - right.cost);
    const current = queue.shift()!;
    if (current.cost > (best.get(current.territory) ?? Number.MAX_SAFE_INTEGER)) {
      continue;
    }
    const territory = byName.get(current.territory);
    if (!territory) {
      continue;
    }
    for (const neighborName of territory.neighbors) {
      const neighbor = byName.get(neighborName);
      if (!neighbor || neighbor.owner !== player) {
        continue;
      }
      const nextCost = current.cost + neighbor.size;
      if (nextCost >= (best.get(neighborName) ?? Number.MAX_SAFE_INTEGER)) {
        continue;
      }
      if (neighborName === targetName) {
        return nextCost;
      }
      best.set(neighborName, nextCost);
      queue.push({ territory: neighborName, cost: nextCost });
    }
  }
  return null;
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

function availableUnitsForUpgrade(name: string, level: UnitLevelName): number {
  const territory = territoryByName(name);
  if (!territory) {
    return 0;
  }
  const reserved = plannedUpgrades
    .filter((order) => order.type === "UPGRADE_UNIT" && order.source === name && order.fromLevel === level)
    .reduce((sum, order) => sum + order.units, 0);
  return Math.max(0, (territory.unitCounts[level] ?? 0) - reserved);
}

function plannedOrderCount(): number {
  return plannedMoves.length + plannedAttacks.length + plannedUpgrades.length;
}

function plannedCostTotals(): { food: number; technology: number } {
  let food = 0;
  let technology = 0;
  for (const order of plannedMoves) {
    if (!order.source || !order.target) {
      continue;
    }
    const source = territoryByName(order.source);
    const target = territoryByName(order.target);
    if (!source || !target) {
      continue;
    }
    if (target.owner === null) {
      food += target.size * order.units;
    } else {
      food += (shortestFriendlyPathSize(order.source, order.target) ?? 0) * order.units;
    }
  }
  for (const order of plannedAttacks) {
    food += order.units;
  }
  const player = localPlayer();
  let previewTechLevel = player?.maxTechnologyLevel ?? 1;
  for (const order of plannedUpgrades) {
    if (order.type === "UPGRADE_TECH") {
      technology += techUpgradeCost(previewTechLevel) ?? 0;
    } else if (order.type === "UPGRADE_UNIT" && order.fromLevel && order.toLevel) {
      technology += unitUpgradeCost(order.fromLevel, order.toLevel, order.units);
    }
  }
  return { food, technology };
}

function currentSelectionCost(): { food: number; technology: number } {
  if (selectedMode === "ATTACK") {
    return { food: selectedUnits, technology: 0 };
  }
  if (selectedMode === "MOVE" && selectedSource && selectedTarget) {
    const source = territoryByName(selectedSource);
    const target = territoryByName(selectedTarget);
    if (!source || !target) {
      return { food: 0, technology: 0 };
    }
    if (target.owner === null) {
      return { food: target.size * selectedUnits, technology: 0 };
    }
    const size = shortestFriendlyPathSize(selectedSource, selectedTarget) ?? 0;
    return { food: size * selectedUnits, technology: 0 };
  }
  if (selectedMode === "UPGRADE_TECH") {
    return { food: 0, technology: techUpgradeCost(localPlayer()?.maxTechnologyLevel ?? 1) ?? 0 };
  }
  if (selectedMode === "UPGRADE_UNIT") {
    return { food: 0, technology: unitUpgradeCost(selectedFromLevel, selectedToLevel, selectedUnits) };
  }
  return { food: 0, technology: 0 };
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
    setMessage(t("failedToLoad", { error: (error as Error).message }));
  }
}

function initializeSetupAllocations(): void {
  if (!game || game.phase !== "SETUP") {
    setupAllocations = {};
    setupAbandoned = {};
    setupSubmitted = false;
    return;
  }
  const next: Record<string, number> = {};
  const nextAbandoned: Record<string, boolean> = {};
  for (const territory of ownTerritories()) {
    next[territory.name] = setupAllocations[territory.name] ?? 0;
    nextAbandoned[territory.name] = setupAbandoned[territory.name] ?? false;
  }
  setupAllocations = next;
  setupAbandoned = nextAbandoned;
}

function syncPlanningState(): void {
  if (!game || game.phase !== "ORDERS") {
    boardTerritories = [];
    plannedMoves = [];
    plannedAttacks = [];
    plannedUpgrades = [];
    planningTurnNumber = null;
    return;
  }

  if (planningTurnNumber !== game.turnNumber) {
    plannedMoves = [];
    plannedAttacks = [];
    plannedUpgrades = [];
    planningTurnNumber = game.turnNumber;
    selectedSource = null;
    selectedTarget = null;
    selectedUnits = 1;
    selectedFromLevel = "BASIC";
    selectedToLevel = "LEVEL_1";
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
  plannedUpgrades = [];
  boardTerritories = [];
  planningTurnNumber = null;
  setupAbandoned = {};
  selectedSource = null;
  selectedTarget = null;
  selectedUnits = 1;
  selectedFromLevel = "BASIC";
  selectedToLevel = "LEVEL_1";
  setMessage("");
  initializeSetupAllocations();
  syncPlanningState();
  render();
}

async function commitSetup(): Promise<void> {
  try {
    for (const [name, abandoned] of Object.entries(setupAbandoned)) {
      if (abandoned && (setupAllocations[name] ?? 0) !== 0) {
        setupAllocations = { ...setupAllocations, [name]: 0 };
      }
    }
    if (setupLeft() !== 0) {
      setMessage(t("needPlaceAll", { left: setupLeft() }));
      return;
    }
    const abandon = Object.entries(setupAbandoned)
      .filter(([, abandoned]) => abandoned)
      .map(([name]) => name);
    const payload = JSON.stringify({ allocations: setupAllocations, abandon });
    if (roomId && roomToken) {
      game = await api<GameView>(`/api/rooms/${roomId}/setup`, { method: "POST", body: payload });
    } else {
      game = await api<GameView>("/api/game/setup", { method: "POST", body: payload });
    }
    setupSubmitted = true;
    plannedMoves = [];
    plannedAttacks = [];
    plannedUpgrades = [];
    boardTerritories = [];
    planningTurnNumber = null;
    selectedSource = null;
    selectedTarget = null;
    selectedUnits = 1;
    selectedFromLevel = "BASIC";
    selectedToLevel = "LEVEL_1";
    syncPlanningState();
    if (roomId && roomToken && game.phase === "SETUP" && game.waitingOnPlayers.length > 0) {
      setMessage(t("setupWaiting", { waiting: game.waitingOnPlayers.join(", ") }));
    } else {
      setMessage(t("setupLocked"));
    }
  } catch (error) {
    setMessage((error as Error).message);
  }
}

function queueOrder(): void {
  if (selectedMode === "UPGRADE_TECH") {
    const player = localPlayer();
    if (!player) {
      return;
    }
    if (plannedUpgrades.some((order) => order.type === "UPGRADE_TECH")) {
      setMessage(t("upgradeTechQueued"));
      return;
    }
    if (techUpgradeCost(player.maxTechnologyLevel) == null) {
      setMessage(t("upgradeTechMaxed"));
      return;
    }
    plannedUpgrades = [...plannedUpgrades, { type: "UPGRADE_TECH", units: 1 }];
    setMessage(t("upgradeTechQueuedDone"));
    render();
    return;
  }

  if (selectedMode === "UPGRADE_UNIT") {
    if (!selectedSource) {
      setMessage(t("upgradeNeedSource"));
      return;
    }
    if (!selectedFromLevel || !selectedToLevel) {
      setMessage(t("upgradeNeedLevels"));
      return;
    }
    const player = localPlayer();
    if (!player) {
      return;
    }
    const available = availableUnitsForUpgrade(selectedSource, selectedFromLevel);
    if (!canUpgradeUnit(player.maxTechnologyLevel, selectedFromLevel, selectedToLevel, available, selectedUnits)) {
      setMessage(t("upgradeIllegal"));
      return;
    }
    plannedUpgrades = [...plannedUpgrades, {
      type: "UPGRADE_UNIT",
      source: selectedSource,
      units: selectedUnits,
      fromLevel: selectedFromLevel,
      toLevel: selectedToLevel
    }];
    setMessage(t("upgradedUnitQueued", {
      units: selectedUnits,
      source: selectedSource,
      fromLevel: selectedFromLevel,
      toLevel: selectedToLevel
    }));
    selectedSource = null;
    selectedUnits = 1;
    render();
    return;
  }

  if (!selectedSource || !selectedTarget) {
    setMessage(t("chooseSourceAndTarget"));
    return;
  }
  const source = territoryByName(selectedSource);
  const target = territoryByName(selectedTarget);
  if (!source || !target) {
    return;
  }
  const maxUnits = availableFromSource(selectedSource);
  if (selectedUnits < 1 || selectedUnits > maxUnits) {
    setMessage(t("notEnoughUnits"));
    return;
  }
  const queuedSource = selectedSource;
  const queuedTarget = selectedTarget;
  if (selectedMode === "MOVE") {
    if (target.owner !== localPlayerId() && target.owner !== null) {
      setMessage(t("moveTargetsOnlyFriendly"));
      return;
    }
    if (target.owner === null && !isAdjacent(source, target)) {
      setMessage(t("moveUnownedMustAdjacent"));
      return;
    }
    if (target.owner === localPlayerId() && !hasFriendlyPath(source.name, target.name)) {
      setMessage(t("moveNeedsPath"));
      return;
    }
    const move: PlannedOrder = { type: "MOVE", source: queuedSource, target: queuedTarget, units: selectedUnits };
    plannedMoves = [...plannedMoves, move];
    applyMoveLocally(move);
    setMessage(t("moved", { units: selectedUnits, source: queuedSource, target: queuedTarget }));
  } else {
    if (target.owner === localPlayerId()) {
      setMessage(t("attackMustNotFriendly"));
      return;
    }
    if (!isAdjacent(source, target)) {
      setMessage(t("attackMustAdjacent"));
      return;
    }
    plannedAttacks = [...plannedAttacks, { type: "ATTACK", source: queuedSource, target: queuedTarget, units: selectedUnits }];
    setMessage(t("queuedAttack", { units: selectedUnits, source: queuedSource, target: queuedTarget }));
  }
  selectedSource = null;
  selectedTarget = null;
  selectedUnits = 1;
  render();
}

async function commitTurn(): Promise<void> {
  try {
    const payload = JSON.stringify({
      orders: [...plannedMoves, ...plannedAttacks, ...plannedUpgrades].map((order) => ({
        type: order.type,
        source: order.source ?? null,
        target: order.target ?? null,
        units: order.units,
        fromLevel: order.fromLevel ?? null,
        toLevel: order.toLevel ?? null
      }))
    });
    if (roomId && roomToken) {
      game = await api<GameView>(`/api/rooms/${roomId}/turn`, { method: "POST", body: payload });
    } else {
      game = await api<GameView>("/api/game/turn", { method: "POST", body: payload });
    }
    plannedMoves = [];
    plannedAttacks = [];
    plannedUpgrades = [];
    boardTerritories = [];
    planningTurnNumber = null;
    selectedUnits = 1;
    selectedSource = null;
    selectedTarget = null;
    selectedFromLevel = "BASIC";
    selectedToLevel = "LEVEL_1";
    syncPlanningState();
    if (game.phase === "GAME_OVER") {
      setMessage(t("warOver"));
    } else if (roomId && roomToken && game.waitingOnPlayers.length > 0) {
      setMessage(t("waitingOn", { waiting: game.waitingOnPlayers.join(", ") }));
    } else {
      setMessage(t("turnResolved"));
    }
  } catch (error) {
    setMessage((error as Error).message);
  }
}

function adjustSetup(name: string, delta: number): void {
  if (setupAbandoned[name]) {
    return;
  }
  const current = setupAllocations[name] ?? 0;
  const next = Math.max(0, current + delta);
  const leftWithoutCurrent = setupLeft() + current;
  if (next > leftWithoutCurrent) {
    return;
  }
  setupAllocations = { ...setupAllocations, [name]: next };
  render();
}

function centroidOfPolygon(vertices: { x: number; y: number }[]): { x: number; y: number } {
  if (vertices.length === 0) {
    return { x: 0, y: 0 };
  }
  let sumX = 0;
  let sumY = 0;
  for (const vertex of vertices) {
    sumX += vertex.x;
    sumY += vertex.y;
  }
  return { x: sumX / vertices.length, y: sumY / vertices.length };
}

function pointInPolygon(pointX: number, pointY: number, vertices: { x: number; y: number }[]): boolean {
  // Ray casting
  let inside = false;
  for (let i = 0, j = vertices.length - 1; i < vertices.length; j = i++) {
    const xi = vertices[i].x;
    const yi = vertices[i].y;
    const xj = vertices[j].x;
    const yj = vertices[j].y;
    const intersects = ((yi > pointY) !== (yj > pointY)) &&
      (pointX < (xj - xi) * (pointY - yi) / ((yj - yi) || 1e-9) + xi);
    if (intersects) {
      inside = !inside;
    }
  }
  return inside;
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
    const polygon = territory.polygon ?? null;
    if (polygon && polygon.length >= 3) {
      return pointInPolygon(x, y, polygon);
    }
    const dx = territory.x - x;
    const dy = territory.y - y;
    return Math.sqrt(dx * dx + dy * dy) < 48;
  });
  if (!clicked) {
    return;
  }
  cursorIndex = activeTerritories().findIndex((territory) => territory.name === clicked.name);
  if (selectedMode === "UPGRADE_TECH") {
    return;
  }
  if (selectedMode === "UPGRADE_UNIT") {
    if (clicked.owner !== localPlayerId()) {
      setMessage(t("upgradeNeedSource"));
      return;
    }
    if (clicked.name === selectedSource) {
      selectedSource = null;
      setMessage(t("sourceCleared"));
      render();
      return;
    }
    selectedSource = clicked.name;
    selectedTarget = null;
    selectedUnits = 1;
    setMessage(t("sourceSelected", { name: clicked.name }));
    render();
    return;
  }
  if (!selectedSource) {
    if (clicked.owner !== localPlayerId()) {
      setMessage(t("chooseOwnSource"));
      return;
    }
    if (availableFromSource(clicked.name) <= 0) {
      setMessage(t("sourceNoUnits"));
      return;
    }
    selectedSource = clicked.name;
    selectedTarget = null;
    selectedUnits = 1;
    setMessage(t("sourceSelected", { name: clicked.name }));
    render();
    return;
  }
  if (clicked.name === selectedSource) {
    selectedSource = null;
    selectedTarget = null;
    setMessage(t("sourceCleared"));
    render();
    return;
  }
  selectedTarget = clicked.name;
  setMessage(t("targetSelected", { name: clicked.name }));
  render();
}

function drawBoard(canvas: HTMLCanvasElement): void {
  const context = canvas.getContext("2d");
  if (!context || !game) {
    return;
  }
  const territories = activeTerritories();
  const usePolygons = territories.some((territory) => (territory.polygon?.length ?? 0) >= 3);

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

  if (!usePolygons) {
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
  }

  for (const territory of territories) {
    const ownerKey = territory.owner ?? "UNOWNED";
    const color = ownerPalette[ownerKey] ?? "#666";
    const selected = territory.name === selectedSource || territory.name === selectedTarget;
    const hovered = territory.name === cursorTerritory()?.name;
    const polygon = territory.polygon ?? null;
    const stroke = selected
      ? "#fff3d1"
      : hovered
        ? "#1d2b2a"
        : ownerKey === "UNOWNED"
          ? "rgba(33, 20, 8, 0.6)"
          : "rgba(33, 20, 8, 0.35)";
    context.fillStyle = color;
    context.strokeStyle = stroke;
    context.lineWidth = selected ? 7 : hovered ? 5 : 3.5;
    if (usePolygons && polygon && polygon.length >= 3) {
      context.beginPath();
      context.moveTo(polygon[0].x, polygon[0].y);
      for (let i = 1; i < polygon.length; i++) {
        context.lineTo(polygon[i].x, polygon[i].y);
      }
      context.closePath();
      context.fill();
      context.stroke();
      const center = centroidOfPolygon(polygon);
      context.fillStyle = ownerKey === "UNOWNED" ? "#1d2b2a" : "#1d2b2a";
      context.textAlign = "center";
      context.font = "bold 20px Georgia";
      context.fillText(territory.name, center.x, center.y - 8);
      context.font = "12px Georgia";
      context.fillText(t("territorySizeMap", { size: territory.size }), center.x, center.y + 8);
      context.font = "bold 24px Georgia";
      context.fillText(territory.hidden ? "?" : String(territory.units), center.x, center.y + 30);
    } else {
      context.beginPath();
      context.arc(territory.x, territory.y, 43, 0, Math.PI * 2);
      context.fill();
      context.stroke();
      context.fillStyle = ownerKey === "UNOWNED" ? "#1d2b2a" : "#fff8ec";
      context.textAlign = "center";
      context.font = "bold 19px Georgia";
      context.fillText(territory.name, territory.x, territory.y - 8);
      context.font = "12px Georgia";
      context.fillText(t("territorySizeMap", { size: territory.size }), territory.x, territory.y + 8);
      context.font = "bold 24px Georgia";
      context.fillText(territory.hidden ? "?" : String(territory.units), territory.x, territory.y + 30);
    }
  }

  context.fillStyle = "rgba(33, 24, 16, 0.68)";
  context.fillRect(18, 18, 320, 44);
  context.fillStyle = "#fff8ec";
  context.textAlign = "left";
  context.font = "bold 22px Georgia";
  const phaseText = phaseLabel(game.phase);
  const turnLabel = lang === "zh" ? `回合 ${game.turnNumber} • ${phaseText}` : `Turn ${game.turnNumber} • ${phaseText}`;
  context.fillText(turnLabel, 34, 47);
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
    pendingUpgrades: plannedUpgrades,
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
  const titleFor = (kind: string): string => {
    switch (kind) {
      case "orders":
        return t("logOrders");
      case "combat":
        return t("logCombat");
      case "reinforcement":
        return t("logReinforcements");
      case "summary":
        return t("logEndOfTurn");
      default:
        return t("logNotes");
    }
  };
  return sections.map((section) => `
    <section class="battle-section battle-${section.kind}">
      <h3>${titleFor(section.kind)}</h3>
      <div class="battle-lines">
        ${section.entries.map((entry) => `<div class="battle-line">${entry}</div>`).join("")}
      </div>
    </section>
  `).join("");
}

function captureScrollPositions(): void {
  savedScrollPositions = {};
  document.querySelectorAll<HTMLElement>("[data-scroll-key]").forEach((element) => {
    const key = element.dataset.scrollKey;
    if (!key) {
      return;
    }
    savedScrollPositions[key] = element.scrollTop;
  });
}

function restoreScrollPositions(): void {
  document.querySelectorAll<HTMLElement>("[data-scroll-key]").forEach((element) => {
    const key = element.dataset.scrollKey;
    if (!key) {
      return;
    }
    const top = savedScrollPositions[key];
    if (typeof top === "number") {
      element.scrollTop = top;
    }
  });
}

function renderTurnSummary(entries: string[]): string {
  const summaries = buildTurnSummary(entries);
  if (summaries.length === 0) {
    return `<div class="log-entry">${t("noTurnChanges")}</div>`;
  }
  return summaries.map((summary) => {
    const movementText = summary.movementDelta === 0
      ? `${t("deltaMove")} 0`
      : `${t("deltaMove")} ${summary.movementDelta > 0 ? "+" : ""}${summary.movementDelta}`;
    const reinforcementText = summary.reinforcementDelta === 0
      ? `${t("deltaReinforce")} 0`
      : `${t("deltaReinforce")} +${summary.reinforcementDelta}`;
    const finalUnitsText = summary.finalUnits == null ? "?" : String(summary.finalUnits);
    return `
      <div class="turn-summary-card">
        <strong>${summary.territory}</strong>
        <div>${movementText}</div>
        <div>${reinforcementText}</div>
        <div>${t("final")} ${finalUnitsText}${summary.owner ? ` • ${summary.owner}` : ""}</div>
      </div>
    `;
  }).join("");
}

function describeQueuedOrder(order: PlannedOrder): string {
  if (order.type === "UPGRADE_TECH") {
    return "UPGRADE_TECH";
  }
  if (order.type === "UPGRADE_UNIT") {
    return `UPGRADE_UNIT ${order.units} in ${order.source} ${order.fromLevel} -> ${order.toLevel}`;
  }
  return `${order.type} ${order.units} from ${order.source} to ${order.target}`;
}

function formatResourceMap(resources: Record<string, number>): string {
  return Object.entries(resources)
    .filter(([, amount]) => amount > 0)
    .map(([name, amount]) => `${name} ${amount}`)
    .join(" • ") || "0";
}

function focusTerritory(): Territory | undefined {
  return territoryByName(selectedTarget) ?? territoryByName(selectedSource) ?? cursorTerritory();
}

function renderTerritoryIntel(territory: Territory | undefined): string {
  if (!territory) {
    return `<div class="log-entry">${t("noTerritoryFocus")}</div>`;
  }
  const summary = summarizeTerritoryIntel(territory);
  const owner = territory.owner ?? "UNOWNED";
  const resources = summary.resourceEntries.map(([name, amount]) => `${name} ${amount}`).join(" • ") || "0";
  const units = summary.unitEntries.map(([name, amount]) => `${name} ${amount}`).join(" • ") || "0";
  return `
    <div class="intel-card">
      <strong>${territory.name}</strong>
      <div>${t("territoryOwner")}: ${owner}</div>
      <div>${t("territorySize")}: ${territory.size}</div>
      <div>${t("territoryOutput")}: ${resources}</div>
      <div>${t("territoryUnits")}: ${units}</div>
    </div>
  `;
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
  captureScrollPositions();
  if (!game) {
    app.innerHTML = `
      <section class="panel">
        <h1 class="title">RISC</h1>
        <div class="row">
          <span>${t("language")}</span>
          <select id="lang-select">
            <option value="zh" ${lang === "zh" ? "selected" : ""}>${t("chinese")}</option>
            <option value="en" ${lang === "en" ? "selected" : ""}>${t("english")}</option>
          </select>
        </div>
        <div class="row">
          <button id="create-room">${t("createRoom")}</button>
          <input id="join-room-id" placeholder="${t("roomIdPlaceholder")}" value="${joinRoomInput}" />
          <button class="secondary" id="join-room">${t("join")}</button>
        </div>
        <div class="hint">${message || t("tipJoin")}</div>
      </section>
    `;
    const langSelect = document.querySelector<HTMLSelectElement>("#lang-select");
    if (langSelect) {
      langSelect.onchange = () => {
        lang = langSelect.value === "en" ? "en" : "zh";
        localStorage.setItem("risc_lang", lang);
        render();
      };
    }
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

  const currentGame = game;
  const playersById = new Map(currentGame.players.map((player) => [player.id, player] as const));
  const visibleSeatCount = Math.max(2, Math.min(5, Number.isFinite(currentGame.seatCount) ? currentGame.seatCount : currentGame.players.length));
  const visibleSeats = seatOrder.slice(0, visibleSeatCount);
  const hasEmptySeats = currentGame.players.length < visibleSeatCount;
  const lastVisibleSeat = visibleSeats[visibleSeats.length - 1] ?? "GREEN";
  const shouldShowSetup = currentGame.phase === "SETUP" && !setupSubmitted;
  const seatsHtml = `
    <div class="seat-grid" aria-label="Room seats">
      ${visibleSeats.map((seatId) => {
        const occupant = playersById.get(seatId) ?? null;
        const showRemove = currentGame.phase === "LOBBY" && isHost() && occupant == null && hasEmptySeats && seatId === lastVisibleSeat && visibleSeatCount > 2;
        return `
          <div class="seat ${occupant ? "occupied" : "empty"}">
            <div class="seat-swatch" style="background:${ownerPalette[seatId]};"></div>
            <div class="seat-meta">
              <div class="seat-id">${seatId}</div>
              <div class="seat-name">${occupant ? occupant.displayName : ""}</div>
            </div>
            ${showRemove ? `<button class="secondary seat-remove" data-seat-remove="${seatId}">${t("remove")}</button>` : ""}
          </div>
        `;
      }).join("")}
    </div>
  `;

  const setupHtml = shouldShowSetup
    ? `
      <section class="panel setup compact-panel">
        <h2>${t("initialPlacement")}</h2>
        <p class="hint">${t("placementHint", { reserve: localPlayer()?.reserveUnits ?? 0 })}</p>
        <div class="setup-grid">
          ${ownTerritories().map((territory) => `
            <div class="territory-stepper">
              <strong>${territory.name}</strong>
              <label class="setup-empty">
                <input type="checkbox" data-setup-abandon="${territory.name}" ${setupAbandoned[territory.name] ? "checked" : ""} />
                ${t("empty")}
              </label>
              <button class="secondary" data-setup-minus="${territory.name}">-</button>
              <span>${setupAllocations[territory.name] ?? 0}</span>
              <button class="secondary" data-setup-plus="${territory.name}">+</button>
            </div>`).join("")}
        </div>
        <div class="row">
          <span>${t("unitsLeft")}: <strong>${setupLeft()}</strong></span>
          <button id="start-btn">${t("lockPlacement")}</button>
        </div>
      </section>`
    : "";

  const previewCost = currentSelectionCost();
  const plannedCosts = plannedCostTotals();
  const queuedOrders = [...plannedMoves, ...plannedAttacks, ...plannedUpgrades];

  app.innerHTML = `
    <div class="game-layout">
      <section class="panel topbar-panel">
        <div class="topbar">
          <div>
            <h1 class="title">RISC</h1>
            <p class="subtitle">${t("subtitle")}</p>
          </div>
          <div class="topbar-side">
            <div class="status-pill">${game.phase === "GAME_OVER" ? t("winnerWins", { winner: game.winner ?? "" }) : phaseLabel(game.phase)}</div>
            <label class="inline-field">
              <span>${t("language")}</span>
              <select id="lang-select">
                <option value="zh" ${lang === "zh" ? "selected" : ""}>${t("chinese")}</option>
                <option value="en" ${lang === "en" ? "selected" : ""}>${t("english")}</option>
              </select>
            </label>
          </div>
        </div>
      </section>

      <aside class="layout-column left-column" data-scroll-key="left-column">
        <section class="panel controls compact-panel">
          <h2>${t("multiplayer")}</h2>
          ${roomId && roomToken
            ? `
              <div class="compact-meta">
                <div>${t("room")}: <strong>${roomId}</strong></div>
                <div>${t("you")}: <strong>${localPlayerId()}</strong></div>
              </div>
              <div class="buttons">
                <button class="secondary" id="leave-room">${t("leave")}</button>
                ${game.phase === "LOBBY" && isHost()
                  ? `<button class="secondary" id="new-seat" ${visibleSeatCount >= 5 ? "disabled" : ""}>${t("newSeat")}</button>`
                  : ""}
                ${game.phase === "LOBBY" && localPlayerId() === "GREEN"
                  ? `<button id="start-game" ${game.players.length < 2 || game.players.length !== visibleSeatCount ? "disabled" : ""}>${t("startGame")}</button>`
                  : ""}
              </div>
              ${game.phase === "LOBBY" && localPlayerId() === "GREEN"
                ? `<div class="hint">${t("startHint", { seats: visibleSeatCount, players: game.players.length })}</div>`
                : ""}
              ${seatsHtml}
            `
            : `
              <div class="row">
                <button id="create-room">${t("createRoom")}</button>
                <input id="join-room-id" placeholder="${t("roomIdPlaceholder")}" value="${joinRoomInput}" />
                <button class="secondary" id="join-room">${t("join")}</button>
              </div>
              <div class="hint">${t("tipJoin")}</div>
            `}
          ${game.waitingOnPlayers.length > 0 ? `<div class="hint">${t("waitingOn", { waiting: game.waitingOnPlayers.join(", ") })}</div>` : ""}
        </section>

        ${setupHtml}

        <section class="panel controls compact-panel">
          <div class="section-head">
            <h2>${t("orders")}</h2>
            <button class="secondary" id="fullscreen-btn">${t("fullscreen")}</button>
          </div>
          <p class="hint">${t("ordersHint")}</p>
          <div class="buttons">
            <button class="${selectedMode === "MOVE" ? "" : "secondary"}" data-mode="MOVE">${t("move")}</button>
            <button class="${selectedMode === "ATTACK" ? "" : "secondary"}" data-mode="ATTACK">${t("attack")}</button>
            <button class="${selectedMode === "UPGRADE_UNIT" ? "" : "secondary"}" data-mode="UPGRADE_UNIT">${t("upgradeUnit")}</button>
            <button class="${selectedMode === "UPGRADE_TECH" ? "" : "secondary"}" data-mode="UPGRADE_TECH">${t("upgradeTech")}</button>
          </div>
          <div class="field-grid">
            <div class="selection-card">
              <strong>${t("currentSelection")}</strong>
              <span>${t("source")}: ${selectedSource ?? t("none")}</span>
              <span>${t("target")}: ${selectedTarget ?? t("none")}</span>
              <span>${t("estimatedCost")}: FOOD ${plannedCosts.food + previewCost.food} • TECHNOLOGY ${plannedCosts.technology + previewCost.technology}</span>
            </div>
            <label class="units-field">${t("units")}<input id="units-input" type="number" min="1" value="${selectedUnits}" /></label>
          </div>
          <div class="upgrade-grid">
            <label>${t("fromLevel")}
              <select id="from-level">
                ${unitLevels.map((level) => `<option value="${level}" ${selectedFromLevel === level ? "selected" : ""}>${level}</option>`).join("")}
              </select>
            </label>
            <label>${t("toLevel")}
              <select id="to-level">
                ${unitLevels.map((level) => `<option value="${level}" ${selectedToLevel === level ? "selected" : ""}>${level}</option>`).join("")}
              </select>
            </label>
          </div>
          <div class="hint">${t("techOnlyOnce")}</div>
          <div class="buttons">
            <button id="queue-order" ${game.phase !== "ORDERS" ? "disabled" : ""}>${t("queueOrder")}</button>
            <button class="secondary" id="clear-orders">${t("clearOrders")}</button>
            <button id="commit-turn" ${game.phase !== "ORDERS" ? "disabled" : ""}>${t("commitTurn")}</button>
            <button class="secondary" id="reset-game">${t("newGame")}</button>
          </div>
          <div class="hint status-message">${message || "&nbsp;"}</div>
        </section>
      </aside>

      <main class="layout-column center-column" data-scroll-key="center-column">
        <section class="panel board-shell">
          <div class="board-meta">
            <div>
              <strong>${game.phase === "GAME_OVER" ? t("winnerWins", { winner: game.winner ?? "" }) : t("battleMap")}</strong>
              <div class="hint">${game.mapNote}</div>
            </div>
            <div class="hint">${t("pendingActions", { count: plannedOrderCount() })}</div>
          </div>
          <canvas id="game-canvas" aria-label="RISC game board"></canvas>
        </section>

        <section class="panel compact-panel">
          <div class="section-head">
            <h2>${t("queuedAttacks")}</h2>
            <div class="hint">${t("movesApplyHint")}</div>
          </div>
          <div class="log queued-log" data-scroll-key="queued-log">
            ${queuedOrders.length === 0
              ? `<div class="log-entry">${t("noQueuedOrders")}</div>`
              : queuedOrders.map((order, index) => `
                <div class="log-entry log-entry-inline">
                  <span>${describeQueuedOrder(order)}</span>
                  <button class="secondary" data-order-remove="${index}">${t("remove")}</button>
                </div>`).join("")}
          </div>
        </section>
      </main>

      <aside class="layout-column right-column" data-scroll-key="right-column">
        <section class="panel players compact-panel">
          <h2>${t("factions")}</h2>
          ${game.players.map((player) => `
            <article>
              <strong>${player.displayName}</strong>
              <div>${t("territoriesLabel")}: ${player.territories}</div>
              <div>${t("totalUnitsLabel")}: ${player.totalUnits}</div>
              <div>${t("techLevelLabel")}: ${player.maxTechnologyLevel}</div>
              <div>${t("resourcesLabel")}: ${formatResourceMap(player.resources)}</div>
              <div>${player.defeated ? t("defeated") : player.localPlayer ? t("youLabel") : t("opponent")}</div>
            </article>`).join("")}
        </section>
        <section class="panel compact-panel">
          <h2>${t("territoryIntel")}</h2>
          <div class="log side-log">
            ${renderTerritoryIntel(focusTerritory())}
          </div>
        </section>
        <section class="panel compact-panel">
          <h2>${t("turnChanges")}</h2>
          <div class="log turn-summary-log side-log" data-scroll-key="turn-summary-log">
            ${renderTurnSummary(game.lastLog)}
          </div>
        </section>
        <section class="panel compact-panel">
          <h2>${t("resolutionLog")}</h2>
          <div class="log battle-log side-log" data-scroll-key="battle-log">
            ${renderLogSections(game.lastLog)}
          </div>
        </section>
      </aside>
    </div>
  `;
  restoreScrollPositions();

  const langSelect = document.querySelector<HTMLSelectElement>("#lang-select");
  if (langSelect) {
    langSelect.onchange = () => {
      lang = langSelect.value === "en" ? "en" : "zh";
      localStorage.setItem("risc_lang", lang);
      render();
    };
  }

  const canvas = document.querySelector<HTMLCanvasElement>("#game-canvas");
  if (canvas) {
    drawBoard(canvas);
    canvas.onclick = (event) => onCanvasClick(event, canvas);
  }

  document.querySelectorAll<HTMLButtonElement>("[data-mode]").forEach((button) => {
    button.onclick = () => {
      selectedMode = button.dataset.mode as OrderType;
      if (selectedMode === "UPGRADE_TECH") {
        selectedSource = null;
        selectedTarget = null;
      } else if (selectedMode === "UPGRADE_UNIT") {
        selectedTarget = null;
      }
      render();
    };
  });

  document.querySelectorAll<HTMLButtonElement>("[data-setup-plus]").forEach((button) => {
    button.onclick = () => adjustSetup(button.dataset.setupPlus ?? "", 1);
  });
  document.querySelectorAll<HTMLButtonElement>("[data-setup-minus]").forEach((button) => {
    button.onclick = () => adjustSetup(button.dataset.setupMinus ?? "", -1);
  });
  document.querySelectorAll<HTMLInputElement>("[data-setup-abandon]").forEach((input) => {
    input.onchange = () => {
      const name = input.dataset.setupAbandon ?? "";
      if (!name) {
        return;
      }
      const checked = Boolean(input.checked);
      setupAbandoned = { ...setupAbandoned, [name]: checked };
      if (checked) {
        setupAllocations = { ...setupAllocations, [name]: 0 };
      }
      render();
    };
  });

  const startButton = document.querySelector<HTMLButtonElement>("#start-btn");
  if (startButton) {
    startButton.onclick = () => {
      void commitSetup();
    };
  }

  const unitsInput = document.querySelector<HTMLInputElement>("#units-input");
  if (unitsInput) {
    unitsInput.oninput = () => {
      selectedUnits = Math.max(1, Number(unitsInput.value) || 1);
      render();
    };
  }

  const fromLevelInput = document.querySelector<HTMLSelectElement>("#from-level");
  if (fromLevelInput) {
    fromLevelInput.onchange = () => {
      selectedFromLevel = fromLevelInput.value as UnitLevelName;
      render();
    };
  }

  const toLevelInput = document.querySelector<HTMLSelectElement>("#to-level");
  if (toLevelInput) {
    toLevelInput.onchange = () => {
      selectedToLevel = toLevelInput.value as UnitLevelName;
      render();
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
      plannedUpgrades = [];
      syncPlanningState();
      selectedUnits = 1;
      setMessage(t("clearedPlanned"));
    };
  }

  document.querySelectorAll<HTMLButtonElement>("[data-order-remove]").forEach((button) => {
    button.onclick = () => {
      const index = Number(button.dataset.orderRemove ?? "-1");
      if (Number.isNaN(index) || index < 0) {
        return;
      }
      const queuedOrders = [...plannedMoves, ...plannedAttacks, ...plannedUpgrades];
      const next = queuedOrders.filter((_, i) => i !== index);
      plannedMoves = next.filter((order) => order.type === "MOVE");
      plannedAttacks = next.filter((order) => order.type === "ATTACK");
      plannedUpgrades = next.filter((order) => order.type === "UPGRADE_TECH" || order.type === "UPGRADE_UNIT");
      setMessage(t("removedAttack"));
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

  document.querySelectorAll<HTMLButtonElement>("[data-seat-remove]").forEach((button) => {
    button.onclick = () => {
      void removeSeat().catch(() => {});
    };
  });

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
    if (game.phase === "ORDERS" && plannedOrderCount() > 0) {
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
    if (selectedMode === "UPGRADE_TECH") {
      return;
    }
    if (selectedMode === "UPGRADE_UNIT") {
      if (territory.owner !== localPlayerId()) {
        setMessage(t("upgradeNeedSource"));
        return;
      }
      if (territory.name === selectedSource) {
        selectedSource = null;
        setMessage(t("selectionCleared"));
      } else {
        selectedSource = territory.name;
        setMessage(t("sourceSelectedCursor", { name: territory.name }));
      }
      render();
      return;
    }
    if (!selectedSource) {
      if (territory.owner !== localPlayerId()) {
        setMessage(t("chooseOwnSource"));
        return;
      }
      if (availableFromSource(territory.name) <= 0) {
        setMessage(t("sourceNoUnits"));
        return;
      }
      selectedSource = territory.name;
      selectedTarget = null;
      setMessage(t("sourceSelectedCursor", { name: territory.name }));
      render();
      return;
    }
    if (territory.name === selectedSource) {
      selectedSource = null;
      selectedTarget = null;
      setMessage(t("selectionCleared"));
      render();
      return;
    }
    selectedTarget = territory.name;
    setMessage(t("targetSelectedEnter", { name: territory.name }));
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
    setMessage(t("createdRoom", { roomId }));
  } catch (error) {
    setMessage((error as Error).message);
    throw error;
  }
}

async function joinRoom(input: string): Promise<void> {
  try {
    const trimmed = (input ?? "").trim().toUpperCase();
    if (!trimmed) {
      setMessage(t("enterRoomId"));
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
    setMessage(t("joinedRoom", { roomId, playerId: response.playerId }));
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
  plannedUpgrades = [];
  boardTerritories = [];
  planningTurnNumber = null;
  setupAllocations = {};
  setupAbandoned = {};
  setMessage(t("leftRoom"));
  game = null;
  render();
}

async function joinAsNewSeat(): Promise<void> {
  if (!roomId) {
    setMessage(t("noRoomToJoin"));
    return;
  }
  try {
    game = await api<GameView>(`/api/rooms/${roomId}/seats/add`, { method: "POST" });
    setMessage(t("addedSeat"));
    render();
  } catch (error) {
    setMessage((error as Error).message);
    throw error;
  }
}

async function startGame(): Promise<void> {
  if (!roomId || !roomToken) {
    setMessage(t("startNeedRoom"));
    return;
  }
  try {
    game = await api<GameView>(`/api/rooms/${roomId}/start`, { method: "POST" });
    plannedMoves = [];
    plannedAttacks = [];
    plannedUpgrades = [];
    boardTerritories = [];
    planningTurnNumber = null;
    selectedSource = null;
    selectedTarget = null;
    selectedUnits = 1;
    initializeSetupAllocations();
    syncPlanningState();
    setMessage(game.phase === "SETUP" ? t("gameStartedSetup") : t("gameStarted"));
  } catch (error) {
    setMessage((error as Error).message);
    throw error;
  }
}

async function removeSeat(): Promise<void> {
  if (!roomId || !roomToken) {
    setMessage(t("startNeedRoom"));
    return;
  }
  try {
    game = await api<GameView>(`/api/rooms/${roomId}/seats/remove`, { method: "POST" });
    setMessage(t("removedSeat"));
    render();
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

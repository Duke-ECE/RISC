import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

const BASE_URL = process.env.RISC_BACKEND_URL ?? "http://127.0.0.1:8080";

const rl = readline.createInterface({ input, output });

/** @typedef {{type: "MOVE"|"ATTACK", source: string, target: string, units: number}} Order */

/** @type {string | null} */
let roomId = null;
/** @type {string | null} */
let token = null;
/** @type {string} */
let playerId = "UNKNOWN";

async function api(path, { method = "GET", body = null, includeToken = true } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (includeToken && token) {
    headers["X-Player-Token"] = token;
  }
  const response = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body == null ? undefined : JSON.stringify(body)
  });
  const text = await response.text();
  const payload = text ? JSON.parse(text) : null;
  if (!response.ok) {
    const message = payload?.error ?? `HTTP ${response.status}`;
    throw new Error(message);
  }
  if (payload?.error) {
    throw new Error(payload.error);
  }
  return payload;
}

function localPlayer(game) {
  return game.players.find((p) => p.localPlayer) ?? null;
}

function ownTerritories(game) {
  const me = localPlayer(game)?.id;
  if (!me) {
    return [];
  }
  return game.territories.filter((t) => t.owner === me);
}

function printHeader(game) {
  console.log("\n========================================");
  console.log(`Room ${roomId} | You ${playerId} | Phase ${game.phase} | Turn ${game.turnNumber}`);
  console.log("========================================");
}

function printOrdersScreen(game, pendingOrders) {
  printHeader(game);
  console.log("Map:");
  for (const territory of game.territories) {
    const owner = territory.owner ?? "UNOWNED";
    const units = territory.hidden ? "?" : territory.units;
    const neighbors = Array.isArray(territory.neighbors) ? territory.neighbors.join(", ") : "";
    console.log(`- ${territory.name} | owner=${owner} | units=${units} | neighbors=[${neighbors}]`);
  }
  console.log("");
  console.log(`${playerId} player:`);
  const own = ownTerritories(game);
  if (own.length === 0) {
    console.log("No controlled territories.");
  }
  for (const territory of own) {
    const units = territory.hidden ? "?" : territory.units;
    console.log(`${units} units in ${territory.name}`);
  }
  console.log("...");
  if (pendingOrders.length > 0) {
    console.log("Queued:");
    pendingOrders.forEach((order, i) => {
      console.log(`${i + 1}. ${order.type} ${order.units}: ${order.source} -> ${order.target}`);
    });
  }
  console.log("(M)ove");
  console.log("(A)ttack");
  console.log("(D)one");
  console.log("(U)ndo last");
  console.log("(C)lear queued");
}

function territoryLabel(territory) {
  const owner = territory.owner ?? "UNOWNED";
  const units = territory.hidden ? "?" : territory.units;
  return `${territory.name} [${owner}] units=${units}`;
}

function printIndexedTerritories(title, territories) {
  console.log(title);
  territories.forEach((territory, index) => {
    console.log(`  ${index + 1}. ${territoryLabel(territory)}`);
  });
}

function selectableTargets(game, action) {
  const me = localPlayer(game)?.id;
  if (!me) {
    return [];
  }
  if (action === "M") {
    return game.territories.filter((territory) => territory.owner === me || territory.owner == null);
  }
  return game.territories.filter((territory) => territory.owner !== me);
}

function territoryByName(game, name) {
  return game.territories.find((territory) => territory.name === name) ?? null;
}

function reservedFromSource(pending, source) {
  return pending
    .filter((order) => order.source === source)
    .reduce((sum, order) => sum + order.units, 0);
}

async function chooseTerritoryByIndex(question, territories) {
  if (territories.length === 0) {
    return null;
  }
  while (true) {
    const raw = (await promptAction(question)).trim();
    if (!raw) {
      return null;
    }
    const idx = Number(raw);
    if (Number.isInteger(idx) && idx >= 1 && idx <= territories.length) {
      return territories[idx - 1].name;
    }
    const byName = territories.find((territory) => territory.name.toUpperCase() === raw.toUpperCase());
    if (byName) {
      return byName.name;
    }
    console.log("Invalid selection. Enter list number or territory name.");
  }
}

async function promptAction(question) {
  const value = (await rl.question(question)).trim();
  return value;
}

function normalizeCommand(raw) {
  if (!raw) {
    return "";
  }
  const normalized = raw.normalize("NFKC").trim().toUpperCase();
  return normalized.slice(0, 1);
}

function parseOrderAction(raw, pendingCount) {
  const normalized = (raw ?? "").normalize("NFKC").trim();
  if (normalized === "" && pendingCount > 0) {
    return "D";
  }
  const upper = normalized.toUpperCase();
  if (upper === "D" || upper === "DONE" || upper === "SUBMIT" || upper === "END" || normalized === "提交" || normalized === "结束") {
    return "D";
  }
  if (upper === "M" || upper === "MOVE" || normalized === "移动") {
    return "M";
  }
  if (upper === "A" || upper === "ATTACK" || normalized === "攻击") {
    return "A";
  }
  if (upper === "U" || upper === "UNDO" || normalized === "撤销") {
    return "U";
  }
  if (upper === "C" || upper === "CLEAR" || normalized === "清空") {
    return "C";
  }
  return normalizeCommand(normalized);
}

async function setupSession() {
  const action = normalizeCommand(await promptAction("Create room or join room? (C/J) "));
  if (action === "J") {
    const joinId = (await promptAction("Room ID: ")).trim().toUpperCase();
    const joined = await api(`/api/rooms/${joinId}/join`, { method: "POST", includeToken: false });
    roomId = joined.roomId;
    token = joined.token;
    playerId = joined.playerId;
    return joined.game;
  }

  const created = await api("/api/rooms", { method: "POST", includeToken: false });
  roomId = created.roomId;
  token = created.token;
  playerId = created.playerId;
  console.log(`Created room ${roomId}. Share this ID to other players.`);
  return created.game;
}

async function waitForEnter(prompt = "Press Enter to refresh...") {
  await promptAction(`${prompt}\n`);
}

function buildDefaultSetup(game) {
  const me = localPlayer(game);
  const reserve = me?.reserveUnits ?? 0;
  const owned = ownTerritories(game);
  const allocations = {};
  if (owned.length === 0 || reserve <= 0) {
    return allocations;
  }
  const base = Math.floor(reserve / owned.length);
  let extra = reserve % owned.length;
  for (const territory of owned) {
    const add = base + (extra > 0 ? 1 : 0);
    allocations[territory.name] = add;
    if (extra > 0) {
      extra -= 1;
    }
  }
  return allocations;
}

async function handleSetup(game) {
  const allocations = buildDefaultSetup(game);
  const me = localPlayer(game);
  const reserve = me?.reserveUnits ?? 0;
  printHeader(game);
  console.log(`Setup phase. Reserve units: ${reserve}`);
  console.log("Default allocation:");
  Object.entries(allocations).forEach(([name, units]) => {
    console.log(`- ${name}: +${units}`);
  });
  const confirm = normalizeCommand(await promptAction("Submit this setup? (Y/n) "));
  if (confirm === "N") {
    console.log("Setup canceled for now.");
    return game;
  }
  try {
    return await api(`/api/rooms/${roomId}/setup`, {
      method: "POST",
      body: { allocations, abandon: [] }
    });
  } catch (error) {
    console.log(`Setup submit failed: ${error.message}`);
    return await api(`/api/rooms/${roomId}`);
  }
}

async function handleLobby(game) {
  printHeader(game);
  console.log(`Seats: ${game.seatCount}/5 | Joined players: ${game.players.length}`);
  console.log("Players:");
  game.players.forEach((p) => {
    console.log(`- ${p.id} ${p.displayName}${p.localPlayer ? " (you)" : ""}`);
  });

  if (playerId === "GREEN") {
    const cmd = normalizeCommand(await promptAction("(S)tart, (A)dd seat, (X)remove seat, (R)efresh, (Q)uit: "));
    if (cmd === "Q") {
      return null;
    }
    if (cmd === "A") {
      try {
        const next = await api(`/api/rooms/${roomId}/seats/add`, { method: "POST" });
        console.log(`Seat added. Seats now: ${next.seatCount}/5.`);
        return next;
      } catch (error) {
        console.log(`Add seat failed: ${error.message}`);
        return await api(`/api/rooms/${roomId}`);
      }
    }
    if (cmd === "X") {
      try {
        const next = await api(`/api/rooms/${roomId}/seats/remove`, { method: "POST" });
        console.log(`Seat removed. Seats now: ${next.seatCount}/5.`);
        return next;
      } catch (error) {
        console.log(`Remove seat failed: ${error.message}`);
        return await api(`/api/rooms/${roomId}`);
      }
    }
    if (cmd === "S") {
      try {
        return await api(`/api/rooms/${roomId}/start`, { method: "POST" });
      } catch (error) {
        console.log(`Start failed: ${error.message}`);
      }
    }
    return await api(`/api/rooms/${roomId}`);
  }

  await waitForEnter();
  return await api(`/api/rooms/${roomId}`);
}

async function handleOrders(game) {
  /** @type {Order[]} */
  const pending = [];

  while (true) {
    printOrdersScreen(game, pending);
    const rawAction = await promptAction("> ");
    const action = parseOrderAction(rawAction, pending.length);

    if (action === "D") {
      try {
        console.log("Submitting turn...");
        const next = await api(`/api/rooms/${roomId}/turn`, {
          method: "POST",
          body: { orders: pending }
        });
        return next;
      } catch (error) {
        console.log(`Submit failed: ${error.message}`);
        continue;
      }
    }

    if (action === "U") {
      if (pending.length === 0) {
        console.log("No queued orders to undo.");
      } else {
        const removed = pending.pop();
        console.log(`Removed: ${removed.type} ${removed.units} ${removed.source} -> ${removed.target}`);
      }
      continue;
    }

    if (action === "C") {
      pending.length = 0;
      console.log("Cleared queued orders.");
      continue;
    }

    if (action !== "M" && action !== "A") {
      console.log("Use M, A, D, U, or C.");
      continue;
    }

    const myTerritories = ownTerritories(game)
      .filter((territory) => territory.units - reservedFromSource(pending, territory.name) > 0);
    if (myTerritories.length === 0) {
      console.log("No available source territories (all units already committed).");
      continue;
    }
    const targetTerritories = selectableTargets(game, action);
    printIndexedTerritories("Choose source territory:", myTerritories);
    const source = await chooseTerritoryByIndex("Source (# or name): ", myTerritories);
    if (!source) {
      console.log("Canceled.");
      continue;
    }

    printIndexedTerritories("Choose target territory:", targetTerritories);
    const target = await chooseTerritoryByIndex("Target (# or name): ", targetTerritories);
    if (!target) {
      console.log("Canceled.");
      continue;
    }

    const unitsRaw = (await promptAction("Units: ")).trim();
    const units = Number(unitsRaw);

    if (!source || !target || !Number.isInteger(units) || units < 1) {
      console.log("Invalid order. Please try again.");
      continue;
    }

    const sourceTerritory = territoryByName(game, source);
    const targetTerritory = territoryByName(game, target);
    if (!sourceTerritory || !targetTerritory) {
      console.log("Unknown territory selected.");
      continue;
    }
    const available = sourceTerritory.units - reservedFromSource(pending, source);
    if (units > available) {
      console.log(`Not enough units in ${source}. Available: ${available}.`);
      continue;
    }
    if (action === "A" && !sourceTerritory.neighbors.includes(target)) {
      console.log(`Attack must target an adjacent territory. ${source} is not adjacent to ${target}.`);
      continue;
    }

    pending.push({
      type: action === "M" ? "MOVE" : "ATTACK",
      source,
      target,
      units
    });
  }
}

async function waitForSetupCompletion() {
  while (true) {
    const game = await api(`/api/rooms/${roomId}`);
    if (game.phase !== "SETUP") {
      return game;
    }
    const waiting = Array.isArray(game.waitingOnPlayers) ? game.waitingOnPlayers : [];
    console.log(`Setup waiting on: ${waiting.join(", ")}`);
    await new Promise((resolve) => setTimeout(resolve, 1200));
  }
}

async function waitForTurnResolution(submittedTurn) {
  while (true) {
    const game = await api(`/api/rooms/${roomId}`);
    if (game.phase !== "ORDERS" || game.turnNumber > submittedTurn) {
      return game;
    }
    const waiting = Array.isArray(game.waitingOnPlayers) ? game.waitingOnPlayers : [];
    console.log(`Turn ${submittedTurn} waiting on: ${waiting.join(", ")}`);
    await new Promise((resolve) => setTimeout(resolve, 1200));
  }
}

async function main() {
  try {
    let game = await setupSession();

    while (true) {
      if (game.phase === "GAME_OVER") {
        printHeader(game);
        console.log(`Winner: ${game.winner ?? "Unknown"}`);
        break;
      }

      if (game.phase === "LOBBY") {
        const next = await handleLobby(game);
        if (next == null) {
          break;
        }
        game = next;
        continue;
      }

      if (game.phase === "SETUP") {
        game = await handleSetup(game);
        if (game.phase === "SETUP") {
          game = await waitForSetupCompletion();
        }
        continue;
      }

      if (game.phase === "ORDERS") {
        const submittedTurn = game.turnNumber;
        game = await handleOrders(game);
        if (game.phase === "ORDERS" && game.turnNumber === submittedTurn) {
          game = await waitForTurnResolution(submittedTurn);
        }
        continue;
      }

      game = await api(`/api/rooms/${roomId}`);
    }
  } finally {
    rl.close();
  }
}

main().catch((error) => {
  console.error(`Fatal: ${error.message}`);
  rl.close();
  process.exit(1);
});

package com.risc.backend.game;

import com.risc.backend.game.dto.GameView;
import com.risc.backend.game.dto.PlayerView;
import com.risc.backend.game.dto.TerritoryView;
import com.risc.backend.game.dto.VertexView;
import java.security.SecureRandom;
import java.util.ArrayList;
import java.util.ArrayDeque;
import java.util.Collections;
import java.util.EnumMap;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Random;
import java.util.Set;
import java.util.stream.Collectors;

public final class GameEngine {
  private static final int BOARD_WIDTH = 920;
  private static final int BOARD_HEIGHT = 620;
  private static final int STARTING_UNITS_PER_TERRITORY = 1;
  private static final int RESERVE_UNITS = 9;

  private final Random random;
  private final List<PlayerId> players;
  private final List<TerritoryDefinition> map;

  private final Map<String, TerritoryState> territories = new LinkedHashMap<>();
  private final EnumMap<PlayerId, Integer> reserveUnits = new EnumMap<>(PlayerId.class);

  private List<String> lastLog = new ArrayList<>();
  private GamePhase phase = GamePhase.SETUP;
  private int turnNumber = 1;
  private PlayerId winner;

  public GameEngine(List<PlayerId> players) {
    this(players, new SecureRandom());
  }

  public GameEngine(List<PlayerId> players, Random random) {
    this(players, MapGenerator.generate(players, BOARD_WIDTH, BOARD_HEIGHT, random), random);
  }

  public GameEngine(List<PlayerId> players, List<TerritoryDefinition> map, Random random) {
    if (players == null || players.size() < 2 || players.size() > 5) {
      throw new IllegalArgumentException("Player count must be between 2 and 5.");
    }
    this.players = List.copyOf(players);
    this.map = List.copyOf(map);
    this.random = Objects.requireNonNull(random, "random");
    reset();
  }

  public synchronized GamePhase phase() {
    return phase;
  }

  public synchronized int turnNumber() {
    return turnNumber;
  }

  public synchronized PlayerId winner() {
    return winner;
  }

  public synchronized boolean isDefeated(PlayerId playerId) {
    return territories.values().stream().noneMatch(territory -> territory.owner() == playerId);
  }

  public synchronized void reset() {
    territories.clear();
    reserveUnits.clear();
    for (TerritoryDefinition definition : map) {
      territories.put(definition.name(), new TerritoryState(definition, definition.initialOwner(), STARTING_UNITS_PER_TERRITORY));
    }
    for (PlayerId playerId : players) {
      reserveUnits.put(playerId, RESERVE_UNITS);
    }
    phase = GamePhase.SETUP;
    winner = null;
    turnNumber = 1;
    lastLog = new ArrayList<>(List.of(
        "New game started.",
        "Place your reserve units across your three starting territories.",
        "All other players remain hidden until everyone locks in setup."));
  }

  public synchronized void commitPlacement(PlayerId playerId, Map<String, Integer> requestedAllocations, List<String> abandon) {
    ensurePhase(GamePhase.SETUP, "Setup is already finished.");
    requirePlayer(playerId);
    Map<String, Integer> allocations = sanitizeAllocations(requestedAllocations, playerId);
    List<String> abandonList = abandon == null ? List.of() : abandon;
    if (!abandonList.isEmpty()) {
      Set<String> owned = ownedTerritories(playerId).stream().map(t -> t.definition().name()).collect(Collectors.toSet());
      Set<String> unique = new HashSet<>();
      for (String territoryName : abandonList) {
        if (territoryName == null || territoryName.isBlank()) {
          throw new IllegalArgumentException("Abandoned territory name cannot be blank.");
        }
        if (!owned.contains(territoryName)) {
          throw new IllegalArgumentException("You can only abandon your own starting territories.");
        }
        if (!unique.add(territoryName)) {
          throw new IllegalArgumentException("Duplicate abandoned territory: " + territoryName);
        }
        if (allocations.getOrDefault(territoryName, 0) != 0) {
          throw new IllegalArgumentException("Abandoned territories must have 0 allocated reserve units.");
        }
      }
      if (unique.size() >= owned.size()) {
        throw new IllegalArgumentException("You must keep at least one starting territory.");
      }
    }
    int total = allocations.values().stream().mapToInt(Integer::intValue).sum();
    if (total != reserveUnits.getOrDefault(playerId, 0)) {
      throw new IllegalArgumentException("You must place exactly " + reserveUnits.getOrDefault(playerId, 0) + " reserve units.");
    }
    applyReserve(playerId, allocations);
    for (String territoryName : abandonList) {
      TerritoryState territory = territories.get(territoryName);
      if (territory == null) {
        continue;
      }
      territory.units(0);
      applyOccupancy(territory);
    }
  }

  public synchronized void startOrdersPhase(List<String> logLines) {
    ensurePhase(GamePhase.SETUP, "Setup is already finished.");
    phase = GamePhase.ORDERS;
    lastLog = new ArrayList<>(logLines);
  }

  public synchronized void validateOrders(PlayerId playerId, List<OrderCommand> orders) {
    ensurePhase(GamePhase.ORDERS, "Game is not accepting turn orders right now.");
    requirePlayer(playerId);
    validateOrders(playerId, orders, territories);
  }

  public synchronized void resolveCommittedTurn(List<OrderCommand> allOrders) {
    ensurePhase(GamePhase.ORDERS, "Game is not accepting turn orders right now.");
    if (winner != null) {
      throw new IllegalArgumentException("The game is already over.");
    }

    lastLog = resolveTurn(allOrders);
    turnNumber += 1;
    winner = findWinner();
    if (winner != null) {
      phase = GamePhase.GAME_OVER;
      lastLog.add(winner.displayName() + " is the last faction with territories and wins the game.");
    }
  }

  public synchronized GameView view(PlayerId viewer, String roomId, List<PlayerId> waitingOnPlayers) {
    List<TerritoryView> territoryViews = territories.values().stream()
        .map(territory -> new TerritoryView(
            territory.definition().name(),
            territory.owner() == null ? null : territory.owner().name(),
            phase == GamePhase.SETUP && territory.owner() != viewer ? 0 : territory.units(),
            territory.definition().x(),
            territory.definition().y(),
            territory.definition().neighbors(),
            phase == GamePhase.SETUP && territory.owner() != viewer,
            territory.definition().polygon().stream()
                .map(vertex -> new VertexView(vertex.x(), vertex.y()))
                .toList()))
        .toList();

    List<PlayerView> playerViews = players.stream()
        .map(playerId -> new PlayerView(
            playerId.name(),
            playerId.displayName(),
            (int) territories.values().stream().filter(territory -> territory.owner() == playerId).count(),
            territories.values().stream().filter(territory -> territory.owner() == playerId).mapToInt(TerritoryState::units).sum(),
            isDefeated(playerId),
            playerId == viewer,
            reserveUnits.getOrDefault(playerId, 0)))
        .toList();

    List<String> waiting = waitingOnPlayers == null
        ? List.of()
        : waitingOnPlayers.stream().map(PlayerId::name).toList();

    return new GameView(
        phase.name(),
        viewer.name(),
        winner == null ? null : winner.name(),
        "Simultaneous turns. Territories can be emptied (0 units) and become unoccupied.",
        territoryViews,
        playerViews,
        List.copyOf(lastLog),
        turnNumber,
        phase == GamePhase.ORDERS,
        players.size(),
        roomId,
        waiting);
  }

  private void requirePlayer(PlayerId playerId) {
    if (!players.contains(playerId)) {
      throw new IllegalArgumentException("Unknown player: " + playerId);
    }
  }

  private void applyReserve(PlayerId playerId, Map<String, Integer> allocations) {
    for (Map.Entry<String, Integer> entry : allocations.entrySet()) {
      TerritoryState territory = territory(entry.getKey());
      territory.units(territory.units() + entry.getValue());
    }
    reserveUnits.put(playerId, 0);
  }

  private Map<String, Integer> sanitizeAllocations(Map<String, Integer> request, PlayerId playerId) {
    Map<String, Integer> sanitized = new LinkedHashMap<>();
    for (TerritoryState territory : ownedTerritories(playerId)) {
      int value = Math.max(0, request.getOrDefault(territory.definition().name(), 0));
      sanitized.put(territory.definition().name(), value);
    }
    if (request.keySet().stream().anyMatch(name -> !sanitized.containsKey(name))) {
      throw new IllegalArgumentException("You can only place units in your own starting territories.");
    }
    return sanitized;
  }

  private List<String> resolveTurn(List<OrderCommand> allOrders) {
    Map<String, TerritoryState> battleMap = cloneTerritories();
    List<String> log = new ArrayList<>();

    List<OrderCommand> moveOrders = allOrders.stream().filter(order -> order.type() == OrderType.MOVE).toList();
    List<OrderCommand> attackOrders = allOrders.stream().filter(order -> order.type() == OrderType.ATTACK).toList();

    log.add("Turn " + turnNumber + " begins.");
    appendOrderSection(log, "Committed move orders", moveOrders);
    appendOrderSection(log, "Committed attack orders", attackOrders);

    // Move phase: apply departures first, then resolve arrivals. If multiple players arrive at the same territory,
    // resolve combat like attacks.
    Map<String, Integer> moveDepartures = new HashMap<>();
    for (OrderCommand move : moveOrders) {
      moveDepartures.merge(move.source(), move.units(), Integer::sum);
    }
    for (Map.Entry<String, Integer> entry : moveDepartures.entrySet()) {
      TerritoryState source = battleMap.get(entry.getKey());
      int before = source.units();
      source.units(source.units() - entry.getValue());
      applyOccupancy(source);
      log.add("Move departure: " + entry.getKey() + " commits " + entry.getValue() + " units, leaving " + before + " -> " + source.units() + ".");
    }

    Map<String, Map<PlayerId, AttackGroup>> groupedMoveArrivals = new LinkedHashMap<>();
    for (OrderCommand move : moveOrders) {
      groupedMoveArrivals
          .computeIfAbsent(move.target(), key -> new LinkedHashMap<>())
          .computeIfAbsent(move.playerId(), key -> new AttackGroup(move.playerId(), move.target()))
          .addSource(move.source(), move.units());
    }

    for (Map.Entry<String, Map<PlayerId, AttackGroup>> entry : groupedMoveArrivals.entrySet()) {
      TerritoryState target = battleMap.get(entry.getKey());

      // Friendly arrivals reinforce the defender before any fights.
      if (target.owner() != null) {
        AttackGroup friendly = entry.getValue().remove(target.owner());
        if (friendly != null && friendly.totalUnits > 0) {
          int before = target.units();
          target.units(target.units() + friendly.totalUnits);
          log.add("Move reinforcement: " + target.definition().name() + " receives " + friendly.totalUnits + " friendly units (" + before + " -> " + target.units() + ").");
        }
      }

      List<AttackGroup> arrivals = new ArrayList<>(entry.getValue().values());
      if (arrivals.isEmpty()) {
        continue;
      }
      Collections.shuffle(arrivals, random);

      log.add(
          "Move contest at " + entry.getKey() + ": defender is " + (target.owner() == null ? "Unoccupied" : target.owner().displayName())
              + " with " + target.units() + " units; arrival order = "
              + arrivals.stream().map(AttackGroup::summary).collect(Collectors.joining(" -> ")) + ".");

      for (AttackGroup group : arrivals) {
        if (target.owner() == null) {
          target.owner(group.playerId);
          target.units(group.totalUnits);
          log.add("Occupation: " + group.playerId.displayName() + " takes " + target.definition().name() + " with " + group.totalUnits + " units.");
          continue;
        }
        if (target.owner() == group.playerId) {
          int before = target.units();
          target.units(target.units() + group.totalUnits);
          log.add("Move merge: " + group.playerId.displayName() + " adds " + group.totalUnits + " units into " + target.definition().name() + " (" + before + " -> " + target.units() + ").");
          continue;
        }
        CombatResult result = fight(
            group.playerId,
            group.totalUnits,
            target.owner(),
            target.units(),
            target.definition().name(),
            group.sources);
        log.addAll(result.details);
        if (result.attackerWon) {
          target.owner(group.playerId);
          target.units(result.attackerUnitsRemaining);
        } else {
          target.units(result.defenderUnitsRemaining);
        }
        applyOccupancy(target);
      }
    }

    // Attack departures happen before battle resolution.
    Map<String, Integer> attackDepartures = new HashMap<>();
    for (OrderCommand attack : attackOrders) {
      attackDepartures.merge(attack.source(), attack.units(), Integer::sum);
    }
    for (Map.Entry<String, Integer> entry : attackDepartures.entrySet()) {
      TerritoryState source = battleMap.get(entry.getKey());
      int before = source.units();
      source.units(source.units() - entry.getValue());
      applyOccupancy(source);
      log.add("Attack departure: " + entry.getKey() + " commits " + entry.getValue() + " units, leaving " + before + " -> " + source.units() + ".");
    }

    Map<String, Map<PlayerId, AttackGroup>> groupedByTarget = new LinkedHashMap<>();
    for (OrderCommand attack : attackOrders) {
      groupedByTarget
          .computeIfAbsent(attack.target(), key -> new LinkedHashMap<>())
          .computeIfAbsent(attack.playerId(), key -> new AttackGroup(attack.playerId(), attack.target()))
          .addSource(attack.source(), attack.units());
    }

    for (Map.Entry<String, Map<PlayerId, AttackGroup>> entry : groupedByTarget.entrySet()) {
      TerritoryState defendingTerritory = battleMap.get(entry.getKey());
      List<AttackGroup> attackers = new ArrayList<>(entry.getValue().values());
      Collections.shuffle(attackers, random);
      log.add(
          "Battle queue at " + entry.getKey() + ": defender is " + (defendingTerritory.owner() == null ? "Unoccupied" : defendingTerritory.owner().displayName())
              + " with " + defendingTerritory.units() + " units; attack order = "
              + attackers.stream().map(AttackGroup::summary).collect(Collectors.joining(" -> ")) + ".");
      for (AttackGroup attackGroup : attackers) {
        if (defendingTerritory.owner() == attackGroup.playerId) {
          continue;
        }
        if (defendingTerritory.owner() == null) {
          defendingTerritory.owner(attackGroup.playerId);
          defendingTerritory.units(attackGroup.totalUnits);
          log.add(
              "Occupation: " + attackGroup.playerId.displayName() + " takes " + defendingTerritory.definition().name()
                  + " unopposed with " + attackGroup.totalUnits + " units.");
          continue;
        }
        CombatResult result = fight(
            attackGroup.playerId,
            attackGroup.totalUnits,
            defendingTerritory.owner(),
            defendingTerritory.units(),
            defendingTerritory.definition().name(),
            attackGroup.sources);
        log.addAll(result.details);
        if (result.attackerWon) {
          defendingTerritory.owner(attackGroup.playerId);
          defendingTerritory.units(result.attackerUnitsRemaining);
        } else {
          defendingTerritory.units(result.defenderUnitsRemaining);
        }
        applyOccupancy(defendingTerritory);
      }
    }

    for (TerritoryState territory : battleMap.values()) {
      if (territory.owner() == null) {
        continue;
      }
      int before = territory.units();
      territory.units(territory.units() + 1);
      log.add("Reinforcement: " + territory.definition().name() + " owned by " + territory.owner().displayName() + " gains 1 unit (" + before + " -> " + territory.units() + ").");
    }

    log.add("Turn " + turnNumber + " final map state:");
    for (TerritoryState territory : battleMap.values()) {
      String owner = territory.owner() == null ? "Unoccupied" : territory.owner().displayName();
      log.add(" - " + territory.definition().name() + ": " + owner + " holds " + territory.units() + " units.");
    }

    territories.clear();
    territories.putAll(battleMap);
    appendEliminationLog(log);
    return log;
  }

  private void applyOccupancy(TerritoryState territory) {
    if (territory.units() <= 0) {
      territory.units(0);
      territory.owner(null);
    }
  }

  private CombatResult fight(
      PlayerId attacker,
      int attackers,
      PlayerId defender,
      int defenders,
      String territoryName,
      List<String> sources) {
    int attackerUnits = attackers;
    int defenderUnits = defenders;
    int rounds = 0;
    List<String> details = new ArrayList<>();
    details.add(
        "Combat starts at " + territoryName + ": " + attacker.displayName() + " attacks from "
            + String.join(", ", sources) + " with " + attackers + " units against "
            + defender.displayName() + " defending with " + defenders + " units.");
    while (attackerUnits > 0 && defenderUnits > 0) {
      rounds += 1;
      int attackRoll = random.nextInt(20) + 1;
      int defendRoll = random.nextInt(20) + 1;
      if (attackRoll > defendRoll) {
        defenderUnits -= 1;
        details.add(
            "  Round " + rounds + ": attacker rolls " + attackRoll + ", defender rolls " + defendRoll
                + " -> defender loses 1 (" + attackerUnits + " attackers left, " + defenderUnits + " defenders left).");
      } else {
        attackerUnits -= 1;
        details.add(
            "  Round " + rounds + ": attacker rolls " + attackRoll + ", defender rolls " + defendRoll
                + " -> attacker loses 1 (" + attackerUnits + " attackers left, " + defenderUnits + " defenders left).");
      }
    }
    if (attackerUnits > 0) {
      details.add(
          "Combat result: " + attacker.displayName() + " conquers " + territoryName + " from "
              + defender.displayName() + " after " + rounds + " rounds and keeps " + attackerUnits + " units there.");
      return new CombatResult(true, attackerUnits, 0, details);
    }
    details.add(
        "Combat result: " + defender.displayName() + " holds " + territoryName + " against "
            + attacker.displayName() + " after " + rounds + " rounds and keeps " + defenderUnits + " units there.");
    return new CombatResult(false, 0, defenderUnits, details);
  }

  private void appendOrderSection(List<String> log, String title, List<OrderCommand> orders) {
    log.add(title + ":");
    if (orders.isEmpty()) {
      log.add(" - none");
      return;
    }
    for (OrderCommand order : orders) {
      log.add(
          " - " + order.playerId().displayName() + " " + order.type().name() + " " + order.units()
              + " from " + order.source() + " to " + order.target());
    }
  }

  private void appendEliminationLog(List<String> log) {
    for (PlayerId playerId : players) {
      if (isDefeated(playerId)) {
        log.add(playerId.displayName() + " has no territories left and is defeated.");
      }
    }
  }

  private void validateOrders(PlayerId playerId, List<OrderCommand> orders, Map<String, TerritoryState> state) {
    // New rule: moves are applied immediately (sequentially) during planning; attacks are queued and resolved together.
    // To validate "final total change", we simulate the submitted move sequence first, then validate attack reservations.
    Map<String, TerritoryState> scratch = cloneTerritories(state);

    List<OrderCommand> moveOrders = orders.stream().filter(order -> order.type() == OrderType.MOVE).toList();
    List<OrderCommand> attackOrders = orders.stream().filter(order -> order.type() == OrderType.ATTACK).toList();

    for (OrderCommand order : moveOrders) {
      if (order.playerId() != playerId) {
        throw new IllegalArgumentException("Mixed-player orders are not allowed.");
      }
      TerritoryState source = territory(scratch, order.source());
      TerritoryState target = territory(scratch, order.target());
      if (source.owner() != playerId) {
        throw new IllegalArgumentException("You can only issue orders from territories you control.");
      }
      if (source.units() <= 0) {
        throw new IllegalArgumentException("You cannot issue orders from an empty territory.");
      }
      if (order.units() <= 0) {
        throw new IllegalArgumentException("Order units must be positive.");
      }
      if (order.units() > source.units()) {
        throw new IllegalArgumentException("That territory does not have enough units available.");
      }

      if (target.owner() != null && target.owner() != playerId) {
        throw new IllegalArgumentException("Move targets must belong to the issuing player or be unoccupied.");
      }
      if (target.owner() == null) {
        if (!source.definition().neighbors().contains(target.definition().name())) {
          throw new IllegalArgumentException("Moves into unoccupied territories must be adjacent.");
        }
      } else {
        if (!hasFriendlyPath(playerId, order.source(), order.target(), scratch)) {
          throw new IllegalArgumentException("Moves need a friendly path between " + order.source() + " and " + order.target() + ".");
        }
      }

      source.units(source.units() - order.units());
      applyOccupancy(source);
      if (target.owner() == null) {
        target.owner(playerId);
      }
      target.units(target.units() + order.units());
    }

    Map<String, Integer> committedFromSource = new HashMap<>();
    for (OrderCommand order : attackOrders) {
      if (order.playerId() != playerId) {
        throw new IllegalArgumentException("Mixed-player orders are not allowed.");
      }
      TerritoryState source = territory(scratch, order.source());
      TerritoryState target = territory(scratch, order.target());
      if (source.owner() != playerId) {
        throw new IllegalArgumentException("You can only issue orders from territories you control.");
      }
      if (source.units() <= 0) {
        throw new IllegalArgumentException("You cannot issue orders from an empty territory.");
      }
      if (order.units() <= 0) {
        throw new IllegalArgumentException("Order units must be positive.");
      }

      int remaining = source.units() - committedFromSource.getOrDefault(order.source(), 0);
      if (remaining - order.units() < 0) {
        throw new IllegalArgumentException("That territory does not have enough units available.");
      }

      if (target.owner() == playerId) {
        throw new IllegalArgumentException("Attack targets must belong to another player or be unoccupied.");
      }
      if (!source.definition().neighbors().contains(target.definition().name())) {
        throw new IllegalArgumentException("Attacks must target adjacent territories.");
      }
      committedFromSource.merge(order.source(), order.units(), Integer::sum);
    }
  }

  private boolean hasFriendlyPath(PlayerId playerId, String source, String target, Map<String, TerritoryState> state) {
    if (Objects.equals(source, target)) {
      return true;
    }
    Set<String> visited = new HashSet<>();
    ArrayDeque<String> queue = new ArrayDeque<>();
    queue.add(source);
    visited.add(source);
    while (!queue.isEmpty()) {
      String current = queue.removeFirst();
      for (String neighbor : territory(state, current).definition().neighbors()) {
        TerritoryState neighborState = territory(state, neighbor);
        if (neighborState.owner() != playerId || !visited.add(neighbor)) {
          continue;
        }
        if (neighbor.equals(target)) {
          return true;
        }
        queue.addLast(neighbor);
      }
    }
    return false;
  }

  private PlayerId findWinner() {
    List<PlayerId> alive = players.stream().filter(playerId -> !isDefeated(playerId)).toList();
    if (alive.size() == 1) {
      return alive.getFirst();
    }
    return null;
  }

  private void ensurePhase(GamePhase expected, String message) {
    if (phase != expected) {
      throw new IllegalArgumentException(message);
    }
  }

  private List<TerritoryState> ownedTerritories(PlayerId playerId) {
    return territories.values().stream().filter(territory -> territory.owner() == playerId).toList();
  }

  private Map<String, TerritoryState> cloneTerritories() {
    Map<String, TerritoryState> clone = new LinkedHashMap<>();
    for (TerritoryState territory : territories.values()) {
      clone.put(territory.definition().name(), new TerritoryState(territory.definition(), territory.owner(), territory.units()));
    }
    return clone;
  }

  private Map<String, TerritoryState> cloneTerritories(Map<String, TerritoryState> source) {
    Map<String, TerritoryState> clone = new LinkedHashMap<>();
    for (TerritoryState territory : source.values()) {
      clone.put(territory.definition().name(), new TerritoryState(territory.definition(), territory.owner(), territory.units()));
    }
    return clone;
  }

  private TerritoryState territory(String name) {
    return territory(territories, name);
  }

  private TerritoryState territory(Map<String, TerritoryState> state, String name) {
    TerritoryState territory = state.get(name);
    if (territory == null) {
      throw new IllegalArgumentException("Unknown territory: " + name);
    }
    return territory;
  }

  private static final class AttackGroup {
    private final PlayerId playerId;
    private final String target;
    private int totalUnits;
    private final List<String> sources = new ArrayList<>();

    private AttackGroup(PlayerId playerId, String target) {
      this.playerId = playerId;
      this.target = target;
    }

    private void addSource(String source, int units) {
      totalUnits += units;
      sources.add(source + " (" + units + ")");
    }

    private String summary() {
      return playerId.displayName() + " from " + String.join(", ", sources) + " with " + totalUnits + " units";
    }
  }

  private record CombatResult(
      boolean attackerWon,
      int attackerUnitsRemaining,
      int defenderUnitsRemaining,
      List<String> details) {}
}

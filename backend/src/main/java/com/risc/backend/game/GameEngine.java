package com.risc.backend.game;

import com.risc.backend.game.dto.GameView;
import com.risc.backend.game.dto.PlayerView;
import com.risc.backend.game.dto.TerritoryView;
import java.security.SecureRandom;
import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
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
  private static final int STARTING_UNITS_PER_TERRITORY = 1;
  private static final int RESERVE_UNITS = 9;
  private static final List<PlayerId> TURN_PLAYERS = List.of(PlayerId.GREEN, PlayerId.BLUE, PlayerId.RED);
  private static final List<TerritoryDefinition> MAP = List.of(
      new TerritoryDefinition("Narnia", 150, 130, PlayerId.GREEN, List.of("Midkemia", "Elantris")),
      new TerritoryDefinition("Midkemia", 300, 155, PlayerId.GREEN, List.of("Narnia", "Elantris", "Scadrial", "Oz")),
      new TerritoryDefinition("Oz", 470, 155, PlayerId.GREEN, List.of("Midkemia", "Scadrial", "Mordor", "Gondor")),
      new TerritoryDefinition("Elantris", 170, 330, PlayerId.BLUE, List.of("Narnia", "Midkemia", "Scadrial", "Roshar")),
      new TerritoryDefinition("Scadrial", 360, 300, PlayerId.BLUE, List.of("Elantris", "Roshar", "Hogwarts", "Mordor", "Oz", "Midkemia")),
      new TerritoryDefinition("Roshar", 355, 430, PlayerId.BLUE, List.of("Elantris", "Scadrial", "Hogwarts")),
      new TerritoryDefinition("Gondor", 610, 175, PlayerId.RED, List.of("Oz", "Mordor")),
      new TerritoryDefinition("Mordor", 565, 320, PlayerId.RED, List.of("Oz", "Scadrial", "Hogwarts", "Gondor")),
      new TerritoryDefinition("Hogwarts", 610, 430, PlayerId.RED, List.of("Roshar", "Scadrial", "Mordor")));

  private final Random random;
  private final Map<String, TerritoryState> territories = new LinkedHashMap<>();
  private final EnumMap<PlayerId, Integer> reserveUnits = new EnumMap<>(PlayerId.class);
  private List<String> lastLog = new ArrayList<>();
  private GamePhase phase = GamePhase.SETUP;
  private int turnNumber = 1;
  private PlayerId winner;

  public GameEngine() {
    this(new SecureRandom());
  }

  public GameEngine(Random random) {
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
    for (TerritoryDefinition definition : MAP) {
      territories.put(definition.name(), new TerritoryState(definition, definition.initialOwner(), STARTING_UNITS_PER_TERRITORY));
    }
    for (PlayerId playerId : TURN_PLAYERS) {
      reserveUnits.put(playerId, RESERVE_UNITS);
    }
    phase = GamePhase.SETUP;
    winner = null;
    turnNumber = 1;
    lastLog = new ArrayList<>(List.of(
        "New game started.",
        "Place your 9 reserve units across your three starting territories.",
        "Other players will place theirs secretly until setup is locked in."));
  }

  public synchronized void commitPlacement(PlayerId playerId, Map<String, Integer> requestedAllocations) {
    ensurePhase(GamePhase.SETUP, "Setup is already finished.");
    Map<String, Integer> allocations = sanitizeAllocations(requestedAllocations, playerId);
    int total = allocations.values().stream().mapToInt(Integer::intValue).sum();
    if (total != reserveUnits.get(playerId)) {
      throw new IllegalArgumentException("You must place exactly " + reserveUnits.get(playerId) + " reserve units.");
    }
    applyReserve(playerId, allocations);
  }

  public synchronized Map<String, Integer> buildAiPlacement(PlayerId playerId) {
    List<String> owned = ownedTerritories(playerId).stream().map(TerritoryState::definition).map(TerritoryDefinition::name).toList();
    Map<String, Integer> allocations = new LinkedHashMap<>();
    int remaining = reserveUnits.get(playerId);
    for (int i = 0; i < owned.size(); i++) {
      String territory = owned.get(i);
      int placed = i == owned.size() - 1 ? remaining : random.nextInt(remaining + 1);
      allocations.put(territory, placed);
      remaining -= placed;
    }
    return allocations;
  }

  public synchronized void startOrdersPhase(List<String> logLines) {
    ensurePhase(GamePhase.SETUP, "Setup is already finished.");
    phase = GamePhase.ORDERS;
    lastLog = new ArrayList<>(logLines);
  }

  public synchronized void validateOrders(PlayerId playerId, List<OrderCommand> orders) {
    validateOrders(playerId, orders, territories);
  }

  public synchronized List<OrderCommand> buildAiOrders(PlayerId playerId) {
    if (phase != GamePhase.ORDERS || winner != null || isDefeated(playerId)) {
      return List.of();
    }

    List<OrderCommand> orders = new ArrayList<>();
    Map<String, Integer> available = availableByTerritory(playerId, List.of(), List.of(), territories);

    List<TerritoryState> borders = ownedTerritories(playerId).stream()
        .filter(this::isBorderTerritory)
        .sorted(Comparator.comparingInt(TerritoryState::units))
        .toList();

    for (TerritoryState border : borders) {
      String helper = findFriendlyReinforcementSource(playerId, border.definition().name(), available);
      if (helper != null) {
        int movable = Math.max(0, available.get(helper) - 1);
        if (movable > 1) {
          int amount = Math.min(3, movable);
          orders.add(new OrderCommand(OrderType.MOVE, helper, border.definition().name(), amount, playerId));
          available.put(helper, available.get(helper) - amount);
          available.put(border.definition().name(), available.get(border.definition().name()) + amount);
          break;
        }
      }
    }

    for (TerritoryState source : ownedTerritories(playerId)) {
      int movable = Math.max(0, available.getOrDefault(source.definition().name(), source.units()) - 1);
      if (movable < 2) {
        continue;
      }
      TerritoryState target = weakestEnemyNeighbor(source);
      if (target == null) {
        continue;
      }
      if (movable >= target.units() + 2) {
        int amount = Math.min(movable, target.units() + 3);
        orders.add(new OrderCommand(OrderType.ATTACK, source.definition().name(), target.definition().name(), amount, playerId));
        available.put(source.definition().name(), available.get(source.definition().name()) - amount);
      }
    }

    try {
      validateOrders(playerId, orders, territories);
      return orders;
    } catch (IllegalArgumentException ignored) {
      return List.of();
    }
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
      lastLog.add(winner.displayName() + " controls every territory and wins the game.");
    }
  }

  public synchronized GameView view(PlayerId viewer, String roomId, List<PlayerId> waitingOnPlayers) {
    List<TerritoryView> territoryViews = territories.values().stream()
        .map(territory -> new TerritoryView(
            territory.definition().name(),
            territory.owner().name(),
            phase == GamePhase.SETUP && territory.owner() != viewer ? 0 : territory.units(),
            territory.definition().x(),
            territory.definition().y(),
            territory.definition().neighbors(),
            phase == GamePhase.SETUP && territory.owner() != viewer))
        .toList();

    List<PlayerView> players = TURN_PLAYERS.stream()
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
        "Canvas coordinates use origin at top-left, +x rightward, +y downward.",
        territoryViews,
        players,
        List.copyOf(lastLog),
        turnNumber,
        phase == GamePhase.ORDERS,
        roomId,
        waiting);
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

  private String findFriendlyReinforcementSource(PlayerId playerId, String destination, Map<String, Integer> available) {
    return ownedTerritories(playerId).stream()
        .filter(territory -> !territory.definition().name().equals(destination))
        .filter(territory -> available.getOrDefault(territory.definition().name(), territory.units()) > 1)
        .filter(territory -> hasFriendlyPath(playerId, territory.definition().name(), destination))
        .max(Comparator.comparingInt(territory -> available.getOrDefault(territory.definition().name(), territory.units())))
        .map(territory -> territory.definition().name())
        .orElse(null);
  }

  private TerritoryState weakestEnemyNeighbor(TerritoryState source) {
    return source.definition().neighbors().stream()
        .map(this::territory)
        .filter(neighbor -> neighbor.owner() != source.owner())
        .min(Comparator.comparingInt(TerritoryState::units))
        .orElse(null);
  }

  private List<String> resolveTurn(List<OrderCommand> allOrders) {
    Map<String, TerritoryState> battleMap = cloneTerritories();
    List<String> log = new ArrayList<>();

    List<OrderCommand> moveOrders = allOrders.stream().filter(order -> order.type() == OrderType.MOVE).toList();
    List<OrderCommand> attackOrders = allOrders.stream().filter(order -> order.type() == OrderType.ATTACK).toList();

    log.add("Turn " + turnNumber + " begins.");
    appendOrderSection(log, "Committed move orders", moveOrders);
    appendOrderSection(log, "Committed attack orders", attackOrders);

    for (OrderCommand move : moveOrders) {
      TerritoryState source = battleMap.get(move.source());
      TerritoryState target = battleMap.get(move.target());
      int sourceBefore = source.units();
      int targetBefore = target.units();
      source.units(source.units() - move.units());
      target.units(target.units() + move.units());
      log.add(
          move.playerId().displayName() + " MOVE " + move.units() + " from " + move.source() + " to " + move.target()
              + " | " + move.source() + ": " + sourceBefore + " -> " + source.units()
              + ", " + move.target() + ": " + targetBefore + " -> " + target.units() + ".");
    }

    Map<String, Integer> attackDepartures = new HashMap<>();
    for (OrderCommand attack : attackOrders) {
      attackDepartures.merge(attack.source(), attack.units(), Integer::sum);
    }
    for (Map.Entry<String, Integer> entry : attackDepartures.entrySet()) {
      TerritoryState source = battleMap.get(entry.getKey());
      int before = source.units();
      source.units(source.units() - entry.getValue());
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
          "Battle queue at " + entry.getKey() + ": defender is " + defendingTerritory.owner().displayName()
              + " with " + defendingTerritory.units() + " units; attack order = "
              + attackers.stream().map(AttackGroup::summary).collect(Collectors.joining(" -> ")) + ".");
      for (AttackGroup attackGroup : attackers) {
        if (attackGroup.playerId == defendingTerritory.owner()) {
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
      }
    }

    for (TerritoryState territory : battleMap.values()) {
      int before = territory.units();
      territory.units(territory.units() + 1);
      log.add("Reinforcement: " + territory.definition().name() + " owned by " + territory.owner().displayName() + " gains 1 unit (" + before + " -> " + territory.units() + ").");
    }
    log.add("Turn " + turnNumber + " final map state:");
    for (TerritoryState territory : battleMap.values()) {
      log.add(" - " + territory.definition().name() + ": " + territory.owner().displayName() + " holds " + territory.units() + " units.");
    }

    territories.clear();
    territories.putAll(battleMap);
    appendEliminationLog(log);
    return log;
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
    for (PlayerId playerId : TURN_PLAYERS) {
      if (isDefeated(playerId)) {
        log.add(playerId.displayName() + " has no territories left and is defeated.");
      }
    }
  }

  private void validateOrders(PlayerId playerId, List<OrderCommand> orders, Map<String, TerritoryState> state) {
    Map<String, Integer> committedFromSource = new HashMap<>();
    for (OrderCommand order : orders) {
      if (order.playerId() != playerId) {
        throw new IllegalArgumentException("Mixed-player orders are not allowed.");
      }
      TerritoryState source = territory(state, order.source());
      TerritoryState target = territory(state, order.target());
      if (source.owner() != playerId) {
        throw new IllegalArgumentException("You can only issue orders from territories you control.");
      }
      if (order.units() <= 0) {
        throw new IllegalArgumentException("Order units must be positive.");
      }

      int remaining = source.units() - committedFromSource.getOrDefault(order.source(), 0);
      if (remaining - order.units() < 1) {
        throw new IllegalArgumentException("Territories must keep at least one unit behind.");
      }

      if (order.type() == OrderType.MOVE) {
        if (target.owner() != playerId) {
          throw new IllegalArgumentException("Move targets must belong to the issuing player.");
        }
        if (!hasFriendlyPath(playerId, order.source(), order.target())) {
          throw new IllegalArgumentException("Moves need a friendly path between " + order.source() + " and " + order.target() + ".");
        }
      } else {
        if (target.owner() == playerId) {
          throw new IllegalArgumentException("Attack targets must belong to another player.");
        }
        if (!source.definition().neighbors().contains(target.definition().name())) {
          throw new IllegalArgumentException("Attacks must target adjacent territories.");
        }
      }
      committedFromSource.merge(order.source(), order.units(), Integer::sum);
    }
  }

  private boolean hasFriendlyPath(PlayerId playerId, String source, String target) {
    if (Objects.equals(source, target)) {
      return true;
    }
    Set<String> visited = new HashSet<>();
    ArrayDeque<String> queue = new ArrayDeque<>();
    queue.add(source);
    visited.add(source);
    while (!queue.isEmpty()) {
      String current = queue.removeFirst();
      for (String neighbor : territory(current).definition().neighbors()) {
        TerritoryState neighborState = territory(neighbor);
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

  private boolean isBorderTerritory(TerritoryState territory) {
    return territory.definition().neighbors().stream().map(this::territory).anyMatch(other -> other.owner() != territory.owner());
  }

  private Map<String, Integer> availableByTerritory(
      PlayerId playerId,
      List<OrderCommand> moveOrders,
      List<OrderCommand> attackOrders,
      Map<String, TerritoryState> state) {
    Map<String, Integer> available = state.values().stream()
        .filter(territory -> territory.owner() == playerId)
        .collect(Collectors.toMap(territory -> territory.definition().name(), TerritoryState::units, (a, b) -> a, LinkedHashMap::new));
    for (OrderCommand move : moveOrders) {
      if (move.playerId() == playerId) {
        available.merge(move.source(), -move.units(), Integer::sum);
        available.merge(move.target(), move.units(), Integer::sum);
      }
    }
    for (OrderCommand attack : attackOrders) {
      if (attack.playerId() == playerId) {
        available.merge(attack.source(), -attack.units(), Integer::sum);
      }
    }
    return available;
  }

  private PlayerId findWinner() {
    for (PlayerId playerId : TURN_PLAYERS) {
      if (territories.values().stream().allMatch(territory -> territory.owner() == playerId)) {
        return playerId;
      }
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


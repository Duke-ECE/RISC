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
import java.util.PriorityQueue;
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
  private final EnumMap<PlayerId, EnumMap<ResourceType, Integer>> resourceTotals = new EnumMap<>(PlayerId.class);
  private final EnumMap<PlayerId, Integer> maxTechnologyLevel = new EnumMap<>(PlayerId.class);

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
    resourceTotals.clear();
    maxTechnologyLevel.clear();
    for (TerritoryDefinition definition : map) {
      territories.put(definition.name(), new TerritoryState(definition, definition.initialOwner(), STARTING_UNITS_PER_TERRITORY));
    }
    for (PlayerId playerId : players) {
      reserveUnits.put(playerId, RESERVE_UNITS);
      EnumMap<ResourceType, Integer> resources = new EnumMap<>(ResourceType.class);
      resources.put(ResourceType.FOOD, 0);
      resources.put(ResourceType.TECHNOLOGY, 0);
      resourceTotals.put(playerId, resources);
      maxTechnologyLevel.put(playerId, 1);
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
            territory.definition().size(),
            stringifyResourceMap(territory.definition().resourceProduction()),
            stringifyUnitMap(territory.unitCounts(), phase == GamePhase.SETUP && territory.owner() != viewer),
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
            reserveUnits.getOrDefault(playerId, 0),
            maxTechnologyLevel.getOrDefault(playerId, 1),
            stringifyResourceMap(resourceTotals.get(playerId))))
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

    List<OrderCommand> techUpgradeOrders = allOrders.stream().filter(order -> order.type() == OrderType.UPGRADE_TECH).toList();
    List<OrderCommand> unitUpgradeOrders = allOrders.stream().filter(order -> order.type() == OrderType.UPGRADE_UNIT).toList();
    List<OrderCommand> moveOrders = allOrders.stream().filter(order -> order.type() == OrderType.MOVE).toList();
    List<OrderCommand> attackOrders = allOrders.stream().filter(order -> order.type() == OrderType.ATTACK).toList();

    log.add("Turn " + turnNumber + " begins.");
    appendOrderSection(log, "Committed tech upgrades", techUpgradeOrders);
    appendOrderSection(log, "Committed unit upgrades", unitUpgradeOrders);
    appendOrderSection(log, "Committed move orders", moveOrders);
    appendOrderSection(log, "Committed attack orders", attackOrders);
    log.addAll(applyOrderCosts(allOrders));

    applyUnitUpgrades(unitUpgradeOrders, battleMap, log);

    Map<String, Map<PlayerId, AttackGroup>> groupedMoveArrivals = new LinkedHashMap<>();
    for (OrderCommand move : moveOrders) {
      TerritoryState source = territory(battleMap, move.source());
      UnitSelection departing = takeUnits(source, move.units());
      log.add("Move departure: " + move.source() + " commits " + departing.totalUnits() + " units "
          + formatUnitBreakdown(departing.unitCounts()) + ", leaving " + source.units() + ".");
      groupedMoveArrivals
          .computeIfAbsent(move.target(), key -> new LinkedHashMap<>())
          .computeIfAbsent(move.playerId(), key -> new AttackGroup(move.playerId(), move.target()))
          .addSource(move.source(), departing.unitCounts());
      applyOccupancy(source);
    }

    for (Map.Entry<String, Map<PlayerId, AttackGroup>> entry : groupedMoveArrivals.entrySet()) {
      TerritoryState target = territory(battleMap, entry.getKey());

      if (target.owner() != null) {
        AttackGroup friendly = entry.getValue().remove(target.owner());
        if (friendly != null && friendly.totalUnits() > 0) {
          target.addUnits(friendly.unitCounts());
          log.add("Move reinforcement: " + target.definition().name() + " receives "
              + friendly.totalUnits() + " friendly units " + formatUnitBreakdown(friendly.unitCounts())
              + ", now " + formatUnitBreakdown(target.unitCounts()) + ".");
        }
      }

      List<AttackGroup> arrivals = new ArrayList<>(entry.getValue().values());
      if (arrivals.isEmpty()) {
        continue;
      }
      Collections.shuffle(arrivals, random);
      log.add("Move contest at " + entry.getKey() + ": defender is "
          + (target.owner() == null ? "Unoccupied" : target.owner().displayName())
          + " with " + target.units() + " units " + formatUnitBreakdown(target.unitCounts())
          + "; arrival order = " + arrivals.stream().map(AttackGroup::summary).collect(Collectors.joining(" -> ")) + ".");

      for (AttackGroup group : arrivals) {
        if (target.owner() == null) {
          target.owner(group.playerId());
          target.setUnitCounts(group.unitCounts());
          log.add("Occupation: " + group.playerId().displayName() + " takes " + target.definition().name()
              + " with " + group.totalUnits() + " units " + formatUnitBreakdown(group.unitCounts()) + ".");
          continue;
        }
        if (target.owner() == group.playerId()) {
          target.addUnits(group.unitCounts());
          log.add("Move merge: " + group.playerId().displayName() + " adds "
              + group.totalUnits() + " units into " + target.definition().name()
              + ", now " + formatUnitBreakdown(target.unitCounts()) + ".");
          continue;
        }
        CombatResult result = fight(
            group.playerId(),
            group.unitCounts(),
            target.owner(),
            target.unitCounts(),
            target.definition().name(),
            group.sources());
        log.addAll(result.details());
        if (result.attackerWon()) {
          target.owner(group.playerId());
          target.setUnitCounts(result.attackerRemaining());
        } else {
          target.setUnitCounts(result.defenderRemaining());
        }
        applyOccupancy(target);
      }
    }

    Map<String, Map<PlayerId, AttackGroup>> groupedByTarget = new LinkedHashMap<>();
    for (OrderCommand attack : attackOrders) {
      TerritoryState source = territory(battleMap, attack.source());
      UnitSelection departing = takeUnits(source, attack.units());
      log.add("Attack departure: " + attack.source() + " commits " + departing.totalUnits() + " units "
          + formatUnitBreakdown(departing.unitCounts()) + ", leaving " + source.units() + ".");
      groupedByTarget
          .computeIfAbsent(attack.target(), key -> new LinkedHashMap<>())
          .computeIfAbsent(attack.playerId(), key -> new AttackGroup(attack.playerId(), attack.target()))
          .addSource(attack.source(), departing.unitCounts());
      applyOccupancy(source);
    }

    for (Map.Entry<String, Map<PlayerId, AttackGroup>> entry : groupedByTarget.entrySet()) {
      TerritoryState defendingTerritory = territory(battleMap, entry.getKey());
      List<AttackGroup> attackers = new ArrayList<>(entry.getValue().values());
      Collections.shuffle(attackers, random);
      log.add("Battle queue at " + entry.getKey() + ": defender is "
          + (defendingTerritory.owner() == null ? "Unoccupied" : defendingTerritory.owner().displayName())
          + " with " + defendingTerritory.units() + " units " + formatUnitBreakdown(defendingTerritory.unitCounts())
          + "; attack order = " + attackers.stream().map(AttackGroup::summary).collect(Collectors.joining(" -> ")) + ".");
      for (AttackGroup attackGroup : attackers) {
        if (defendingTerritory.owner() == attackGroup.playerId()) {
          continue;
        }
        if (defendingTerritory.owner() == null) {
          defendingTerritory.owner(attackGroup.playerId());
          defendingTerritory.setUnitCounts(attackGroup.unitCounts());
          log.add("Occupation: " + attackGroup.playerId().displayName() + " takes "
              + defendingTerritory.definition().name() + " unopposed with "
              + attackGroup.totalUnits() + " units " + formatUnitBreakdown(attackGroup.unitCounts()) + ".");
          continue;
        }
        CombatResult result = fight(
            attackGroup.playerId(),
            attackGroup.unitCounts(),
            defendingTerritory.owner(),
            defendingTerritory.unitCounts(),
            defendingTerritory.definition().name(),
            attackGroup.sources());
        log.addAll(result.details());
        if (result.attackerWon()) {
          defendingTerritory.owner(attackGroup.playerId());
          defendingTerritory.setUnitCounts(result.attackerRemaining());
        } else {
          defendingTerritory.setUnitCounts(result.defenderRemaining());
        }
        applyOccupancy(defendingTerritory);
      }
    }

    for (TerritoryState territory : battleMap.values()) {
      if (territory.owner() == null) {
        continue;
      }
      territory.addUnits(UnitLevel.BASIC, 1);
      log.add("Reinforcement: " + territory.definition().name() + " owned by "
          + territory.owner().displayName() + " gains 1 BASIC unit, now "
          + formatUnitBreakdown(territory.unitCounts()) + ".");
    }

    applyResourceIncome(battleMap, log);
    applyTechUpgrades(techUpgradeOrders, log);

    log.add("Turn " + turnNumber + " final map state:");
    for (TerritoryState territory : battleMap.values()) {
      String owner = territory.owner() == null ? "Unoccupied" : territory.owner().displayName();
      log.add(" - " + territory.definition().name() + ": " + owner + " holds "
          + territory.units() + " units " + formatUnitBreakdown(territory.unitCounts()) + ".");
    }

    territories.clear();
    territories.putAll(battleMap);
    appendEliminationLog(log);
    return log;
  }

  private void applyResourceIncome(Map<String, TerritoryState> battleMap, List<String> log) {
    for (PlayerId playerId : players) {
      EnumMap<ResourceType, Integer> gains = new EnumMap<>(ResourceType.class);
      gains.put(ResourceType.FOOD, 0);
      gains.put(ResourceType.TECHNOLOGY, 0);

      for (TerritoryState territory : battleMap.values()) {
        if (territory.owner() != playerId) {
          continue;
        }
        for (ResourceType type : ResourceType.values()) {
          gains.merge(type, territory.definition().resourceProduction().getOrDefault(type, 0), Integer::sum);
        }
      }

      EnumMap<ResourceType, Integer> totals = resourceTotals.get(playerId);
      for (ResourceType type : ResourceType.values()) {
        int gain = gains.getOrDefault(type, 0);
        int before = totals.getOrDefault(type, 0);
        int after = before + gain;
        totals.put(type, after);
        log.add("Resource income: " + playerId.displayName() + " gains " + gain + " " + type.name()
            + " (" + before + " -> " + after + ").");
      }
    }
  }

  private void applyOccupancy(TerritoryState territory) {
    if (territory.units() <= 0) {
      territory.setUnitCounts(Map.of());
      territory.owner(null);
    }
  }

  private CombatResult fight(
      PlayerId attacker,
      Map<UnitLevel, Integer> attackers,
      PlayerId defender,
      Map<UnitLevel, Integer> defenders,
      String territoryName,
      List<String> sources) {
    EnumMap<UnitLevel, Integer> attackerUnits = copyUnitCounts(attackers);
    EnumMap<UnitLevel, Integer> defenderUnits = copyUnitCounts(defenders);
    int rounds = 0;
    List<String> details = new ArrayList<>();
    details.add("Combat starts at " + territoryName + ": " + attacker.displayName() + " attacks from "
        + String.join(", ", sources) + " with " + totalUnits(attackers) + " units " + formatUnitBreakdown(attackers)
        + " against " + defender.displayName() + " defending with " + totalUnits(defenders) + " units "
        + formatUnitBreakdown(defenders) + ".");
    boolean highAttackerLowDefender = true;
    while (totalUnits(attackerUnits) > 0 && totalUnits(defenderUnits) > 0) {
      rounds += 1;
      UnitLevel attackerLevel = pickUnit(attackerUnits, highAttackerLowDefender);
      UnitLevel defenderLevel = pickUnit(defenderUnits, !highAttackerLowDefender);
      int attackerRollBase = random.nextInt(20) + 1;
      int defenderRollBase = random.nextInt(20) + 1;
      int attackRoll = attackerRollBase + attackerLevel.combatBonus();
      int defendRoll = defenderRollBase + defenderLevel.combatBonus();
      if (attackRoll > defendRoll) {
        defenderUnits.put(defenderLevel, defenderUnits.get(defenderLevel) - 1);
        details.add("  Round " + rounds + ": A " + attackerLevel.name() + " (" + attackerRollBase + "+"
            + attackerLevel.combatBonus() + "=" + attackRoll + ") vs D " + defenderLevel.name() + " ("
            + defenderRollBase + "+" + defenderLevel.combatBonus() + "=" + defendRoll + ") -> defender loses 1 "
            + defenderLevel.name() + ".");
      } else {
        attackerUnits.put(attackerLevel, attackerUnits.get(attackerLevel) - 1);
        details.add("  Round " + rounds + ": A " + attackerLevel.name() + " (" + attackerRollBase + "+"
            + attackerLevel.combatBonus() + "=" + attackRoll + ") vs D " + defenderLevel.name() + " ("
            + defenderRollBase + "+" + defenderLevel.combatBonus() + "=" + defendRoll + ") -> attacker loses 1 "
            + attackerLevel.name() + ".");
      }
      highAttackerLowDefender = !highAttackerLowDefender;
    }
    if (totalUnits(attackerUnits) > 0) {
      details.add("Combat result: " + attacker.displayName() + " conquers " + territoryName + " from "
          + defender.displayName() + " after " + rounds + " rounds and keeps "
          + totalUnits(attackerUnits) + " units " + formatUnitBreakdown(attackerUnits) + " there.");
      return new CombatResult(true, attackerUnits, zeroUnitCounts(), details);
    }
    details.add("Combat result: " + defender.displayName() + " holds " + territoryName + " against "
        + attacker.displayName() + " after " + rounds + " rounds and keeps "
        + totalUnits(defenderUnits) + " units " + formatUnitBreakdown(defenderUnits) + " there.");
    return new CombatResult(false, zeroUnitCounts(), defenderUnits, details);
  }

  private void appendOrderSection(List<String> log, String title, List<OrderCommand> orders) {
    log.add(title + ":");
    if (orders.isEmpty()) {
      log.add(" - none");
      return;
    }
    for (OrderCommand order : orders) {
      if (order.type() == OrderType.UPGRADE_TECH) {
        log.add(" - " + order.playerId().displayName() + " UPGRADE_TECH");
      } else if (order.type() == OrderType.UPGRADE_UNIT) {
        log.add(" - " + order.playerId().displayName() + " UPGRADE_UNIT " + order.units() + " in "
            + order.source() + " from " + order.fromLevel() + " to " + order.toLevel());
      } else {
        log.add(" - " + order.playerId().displayName() + " " + order.type().name() + " " + order.units()
            + " from " + order.source() + " to " + order.target());
      }
    }
  }

  private void appendEliminationLog(List<String> log) {
    for (PlayerId playerId : players) {
      if (isDefeated(playerId)) {
        log.add(playerId.displayName() + " has no territories left and is defeated.");
      }
    }
  }

  private Map<String, Integer> stringifyResourceMap(Map<ResourceType, Integer> resources) {
    Map<String, Integer> result = new LinkedHashMap<>();
    if (resources == null) {
      return result;
    }
    for (ResourceType type : ResourceType.values()) {
      result.put(type.name(), resources.getOrDefault(type, 0));
    }
    return result;
  }

  private Map<String, Integer> stringifyUnitMap(Map<UnitLevel, Integer> units, boolean hidden) {
    Map<String, Integer> result = new LinkedHashMap<>();
    for (UnitLevel level : UnitLevel.values()) {
      result.put(level.name(), hidden ? 0 : units.getOrDefault(level, 0));
    }
    return result;
  }

  private void validateOrders(PlayerId playerId, List<OrderCommand> orders, Map<String, TerritoryState> state) {
    priceOrders(playerId, orders, state);
  }

  private List<String> applyOrderCosts(List<OrderCommand> allOrders) {
    List<String> log = new ArrayList<>();
    Map<PlayerId, List<OrderCommand>> byPlayer = allOrders.stream().collect(Collectors.groupingBy(
        OrderCommand::playerId,
        LinkedHashMap::new,
        Collectors.toList()));
    for (PlayerId playerId : players) {
      List<OrderCommand> playerOrders = byPlayer.getOrDefault(playerId, List.of());
      if (playerOrders.isEmpty()) {
        continue;
      }
      OrderCostSummary summary = priceOrders(playerId, playerOrders, territories);
      EnumMap<ResourceType, Integer> totals = resourceTotals.get(playerId);
      int beforeFood = totals.getOrDefault(ResourceType.FOOD, 0);
      int afterFood = beforeFood - summary.foodSpent();
      totals.put(ResourceType.FOOD, afterFood);
      int beforeTech = totals.getOrDefault(ResourceType.TECHNOLOGY, 0);
      int afterTech = beforeTech - summary.technologySpent();
      totals.put(ResourceType.TECHNOLOGY, afterTech);
      log.add("Resource spend: " + playerId.displayName() + " spends " + summary.foodSpent()
          + " FOOD on orders (" + beforeFood + " -> " + afterFood + ").");
      log.add("Resource spend: " + playerId.displayName() + " spends " + summary.technologySpent()
          + " TECHNOLOGY on orders (" + beforeTech + " -> " + afterTech + ").");
      log.addAll(summary.details());
    }
    return log;
  }

  private OrderCostSummary priceOrders(PlayerId playerId, List<OrderCommand> orders, Map<String, TerritoryState> state) {
    Map<String, TerritoryState> scratch = cloneTerritories(state);
    List<OrderCommand> techUpgradeOrders = orders.stream().filter(order -> order.type() == OrderType.UPGRADE_TECH).toList();
    List<OrderCommand> unitUpgradeOrders = orders.stream().filter(order -> order.type() == OrderType.UPGRADE_UNIT).toList();
    List<OrderCommand> moveOrders = orders.stream().filter(order -> order.type() == OrderType.MOVE).toList();
    List<OrderCommand> attackOrders = orders.stream().filter(order -> order.type() == OrderType.ATTACK).toList();
    List<String> details = new ArrayList<>();
    int availableFood = resourceTotals.getOrDefault(playerId, new EnumMap<>(ResourceType.class)).getOrDefault(ResourceType.FOOD, 0);
    int availableTechnology = resourceTotals.getOrDefault(playerId, new EnumMap<>(ResourceType.class)).getOrDefault(ResourceType.TECHNOLOGY, 0);
    int spentFood = 0;
    int spentTechnology = 0;
    int currentTechLevel = maxTechnologyLevel.getOrDefault(playerId, 1);

    if (techUpgradeOrders.size() > 1) {
      throw new IllegalArgumentException("Only one tech upgrade may be queued per turn.");
    }
    if (!techUpgradeOrders.isEmpty()) {
      if (currentTechLevel >= 6) {
        throw new IllegalArgumentException("Technology is already at the maximum level.");
      }
      int cost = techUpgradeCost(currentTechLevel);
      if (cost > availableTechnology) {
        throw new IllegalArgumentException("Not enough TECHNOLOGY for tech upgrade. Need " + cost + ", have " + availableTechnology + ".");
      }
      spentTechnology += cost;
      details.add(" - " + playerId.displayName() + " UPGRADE_TECH from " + currentTechLevel + " to "
          + (currentTechLevel + 1) + " costs " + cost + " TECHNOLOGY and completes next turn.");
    }

    for (OrderCommand order : unitUpgradeOrders) {
      if (order.playerId() != playerId) {
        throw new IllegalArgumentException("Mixed-player orders are not allowed.");
      }
      if (order.source() == null || order.source().isBlank()) {
        throw new IllegalArgumentException("Unit upgrades need a source territory.");
      }
      if (order.fromLevel() == null || order.toLevel() == null) {
        throw new IllegalArgumentException("Unit upgrades must specify both fromLevel and toLevel.");
      }
      if (order.units() <= 0) {
        throw new IllegalArgumentException("Order units must be positive.");
      }
      TerritoryState source = territory(scratch, order.source());
      if (source.owner() != playerId) {
        throw new IllegalArgumentException("You can only upgrade units in territories you control.");
      }
      if (order.toLevel().requiredTechLevel() > currentTechLevel) {
        throw new IllegalArgumentException("Cannot upgrade to " + order.toLevel().name()
            + " while max technology level is " + currentTechLevel + ".");
      }
      if (order.toLevel().ordinal() <= order.fromLevel().ordinal()) {
        throw new IllegalArgumentException("Unit upgrades must move to a higher level.");
      }
      if (source.unitCount(order.fromLevel()) < order.units()) {
        throw new IllegalArgumentException("Not enough " + order.fromLevel().name() + " units in " + order.source() + ".");
      }
      int cost = (order.toLevel().totalCost() - order.fromLevel().totalCost()) * order.units();
      if (spentTechnology + cost > availableTechnology) {
        throw new IllegalArgumentException("Not enough TECHNOLOGY for unit upgrade in " + order.source()
            + ". Need " + cost + ", have " + (availableTechnology - spentTechnology) + ".");
      }
      spentTechnology += cost;
      source.removeUnits(order.fromLevel(), order.units());
      source.addUnits(order.toLevel(), order.units());
      details.add(" - " + playerId.displayName() + " UPGRADE_UNIT " + order.units() + " in "
          + order.source() + " from " + order.fromLevel().name() + " to " + order.toLevel().name()
          + " costs " + cost + " TECHNOLOGY.");
    }

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

      int pathSize = resolveMovePathSize(playerId, source, target, scratch);
      int orderFoodCost = pathSize * order.units();
      if (spentFood + orderFoodCost > availableFood) {
        throw new IllegalArgumentException("Not enough FOOD for move order from " + order.source() + " to "
            + order.target() + ". Need " + orderFoodCost + ", have " + (availableFood - spentFood) + ".");
      }
      spentFood += orderFoodCost;
      details.add(" - " + playerId.displayName() + " MOVE " + order.units() + " from " + order.source() + " to "
          + order.target() + " costs " + orderFoodCost + " FOOD (path size " + pathSize + ").");

      takeUnits(source, order.units());
      applyOccupancy(source);
      if (target.owner() == null) {
        target.owner(playerId);
      }
      target.addUnits(zeroUnitCounts());
    }
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
      if (order.units() > source.units()) {
        throw new IllegalArgumentException("That territory does not have enough units available.");
      }

      if (target.owner() == playerId) {
        throw new IllegalArgumentException("Attack targets must belong to another player or be unoccupied.");
      }
      if (!source.definition().neighbors().contains(target.definition().name())) {
        throw new IllegalArgumentException("Attacks must target adjacent territories.");
      }

      int orderFoodCost = order.units();
      if (spentFood + orderFoodCost > availableFood) {
        throw new IllegalArgumentException("Not enough FOOD for attack order from " + order.source() + " to "
            + order.target() + ". Need " + orderFoodCost + ", have " + (availableFood - spentFood) + ".");
      }
      spentFood += orderFoodCost;
      details.add(" - " + playerId.displayName() + " ATTACK " + order.units() + " from " + order.source() + " to "
          + order.target() + " costs " + orderFoodCost + " FOOD.");
      takeUnits(source, order.units());
      applyOccupancy(source);
    }

    return new OrderCostSummary(spentFood, spentTechnology, details);
  }

  private int resolveMovePathSize(PlayerId playerId, TerritoryState source, TerritoryState target, Map<String, TerritoryState> state) {
    if (target.owner() != null && target.owner() != playerId) {
      throw new IllegalArgumentException("Move targets must belong to the issuing player or be unoccupied.");
    }
    if (target.owner() == null) {
      if (!source.definition().neighbors().contains(target.definition().name())) {
        throw new IllegalArgumentException("Moves into unoccupied territories must be adjacent.");
      }
      return target.definition().size();
    }
    Integer shortest = shortestFriendlyPathSize(playerId, source.definition().name(), target.definition().name(), state);
    if (shortest == null) {
      throw new IllegalArgumentException("Moves need a friendly path between " + source.definition().name() + " and "
          + target.definition().name() + ".");
    }
    return shortest;
  }

  private Integer shortestFriendlyPathSize(PlayerId playerId, String source, String target, Map<String, TerritoryState> state) {
    if (Objects.equals(source, target)) {
      return 0;
    }
    record Node(String territory, int cost) {}
    PriorityQueue<Node> queue = new PriorityQueue<>(java.util.Comparator.comparingInt(Node::cost));
    Map<String, Integer> best = new HashMap<>();
    queue.add(new Node(source, 0));
    best.put(source, 0);

    while (!queue.isEmpty()) {
      Node current = queue.poll();
      if (current.cost() > best.getOrDefault(current.territory(), Integer.MAX_VALUE)) {
        continue;
      }
      TerritoryState currentTerritory = territory(state, current.territory());
      for (String neighbor : currentTerritory.definition().neighbors()) {
        TerritoryState neighborState = territory(state, neighbor);
        if (neighborState.owner() != playerId) {
          continue;
        }
        int nextCost = current.cost() + neighborState.definition().size();
        if (nextCost >= best.getOrDefault(neighbor, Integer.MAX_VALUE)) {
          continue;
        }
        if (neighbor.equals(target)) {
          return nextCost;
        }
        best.put(neighbor, nextCost);
        queue.add(new Node(neighbor, nextCost));
      }
    }
    return null;
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
      clone.put(territory.definition().name(), territory.copy());
    }
    return clone;
  }

  private Map<String, TerritoryState> cloneTerritories(Map<String, TerritoryState> source) {
    Map<String, TerritoryState> clone = new LinkedHashMap<>();
    for (TerritoryState territory : source.values()) {
      clone.put(territory.definition().name(), territory.copy());
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

  private void applyUnitUpgrades(List<OrderCommand> unitUpgradeOrders, Map<String, TerritoryState> state, List<String> log) {
    for (OrderCommand order : unitUpgradeOrders) {
      TerritoryState territory = territory(state, order.source());
      territory.removeUnits(order.fromLevel(), order.units());
      territory.addUnits(order.toLevel(), order.units());
      log.add("Unit upgrade applied: " + order.playerId().displayName() + " upgrades " + order.units() + " units in "
          + order.source() + " from " + order.fromLevel().name() + " to " + order.toLevel().name()
          + ", now " + formatUnitBreakdown(territory.unitCounts()) + ".");
    }
  }

  private void applyTechUpgrades(List<OrderCommand> techUpgradeOrders, List<String> log) {
    for (OrderCommand order : techUpgradeOrders) {
      int before = maxTechnologyLevel.getOrDefault(order.playerId(), 1);
      int after = Math.min(6, before + 1);
      maxTechnologyLevel.put(order.playerId(), after);
      log.add("Tech upgrade complete: " + order.playerId().displayName() + " advances from tech level "
          + before + " to " + after + " for next turn.");
    }
  }

  private UnitSelection takeUnits(TerritoryState source, int units) {
    if (units <= 0 || units > source.units()) {
      throw new IllegalArgumentException("That territory does not have enough units available.");
    }
    EnumMap<UnitLevel, Integer> selection = zeroUnitCounts();
    int remaining = units;
    for (int i = UnitLevel.values().length - 1; i >= 0 && remaining > 0; i--) {
      UnitLevel level = UnitLevel.values()[i];
      int available = source.unitCount(level);
      if (available <= 0) {
        continue;
      }
      int take = Math.min(available, remaining);
      source.removeUnits(level, take);
      selection.put(level, take);
      remaining -= take;
    }
    return new UnitSelection(selection);
  }

  private EnumMap<UnitLevel, Integer> zeroUnitCounts() {
    EnumMap<UnitLevel, Integer> result = new EnumMap<>(UnitLevel.class);
    for (UnitLevel level : UnitLevel.values()) {
      result.put(level, 0);
    }
    return result;
  }

  private EnumMap<UnitLevel, Integer> copyUnitCounts(Map<UnitLevel, Integer> counts) {
    EnumMap<UnitLevel, Integer> copy = zeroUnitCounts();
    if (counts != null) {
      for (Map.Entry<UnitLevel, Integer> entry : counts.entrySet()) {
        copy.put(entry.getKey(), Math.max(0, entry.getValue()));
      }
    }
    return copy;
  }

  private int totalUnits(Map<UnitLevel, Integer> counts) {
    return counts.values().stream().mapToInt(Integer::intValue).sum();
  }

  private UnitLevel pickUnit(Map<UnitLevel, Integer> counts, boolean highest) {
    if (highest) {
      for (int i = UnitLevel.values().length - 1; i >= 0; i--) {
        UnitLevel level = UnitLevel.values()[i];
        if (counts.getOrDefault(level, 0) > 0) {
          return level;
        }
      }
    } else {
      for (UnitLevel level : UnitLevel.values()) {
        if (counts.getOrDefault(level, 0) > 0) {
          return level;
        }
      }
    }
    throw new IllegalArgumentException("No units available for combat.");
  }

  private String formatUnitBreakdown(Map<UnitLevel, Integer> counts) {
    String text = java.util.Arrays.stream(UnitLevel.values())
        .filter(level -> counts.getOrDefault(level, 0) > 0)
        .map(level -> level.name() + " " + counts.getOrDefault(level, 0))
        .collect(Collectors.joining(" | "));
    return text.isBlank() ? "[none]" : "[" + text + "]";
  }

  private int techUpgradeCost(int currentLevel) {
    return switch (currentLevel) {
      case 1 -> 50;
      case 2 -> 75;
      case 3 -> 125;
      case 4 -> 200;
      case 5 -> 300;
      default -> throw new IllegalArgumentException("Technology is already maxed out.");
    };
  }

  private final class AttackGroup {
    private final PlayerId playerId;
    private final String target;
    private final EnumMap<UnitLevel, Integer> unitCounts = zeroUnitCounts();
    private final List<String> sources = new ArrayList<>();

    private AttackGroup(PlayerId playerId, String target) {
      this.playerId = playerId;
      this.target = target;
    }

    private void addSource(String source, Map<UnitLevel, Integer> units) {
      for (Map.Entry<UnitLevel, Integer> entry : units.entrySet()) {
        unitCounts.merge(entry.getKey(), entry.getValue(), Integer::sum);
      }
      sources.add(source + " " + formatUnitBreakdown(units));
    }

    private PlayerId playerId() {
      return playerId;
    }

    private Map<UnitLevel, Integer> unitCounts() {
      return Map.copyOf(unitCounts);
    }

    private List<String> sources() {
      return List.copyOf(sources);
    }

    private int totalUnits() {
      return GameEngine.this.totalUnits(unitCounts);
    }

    private String summary() {
      return playerId.displayName() + " from " + String.join(", ", sources) + " with "
          + totalUnits() + " units " + formatUnitBreakdown(unitCounts);
    }
  }

  private record UnitSelection(Map<UnitLevel, Integer> unitCounts) {
    private int totalUnits() {
      return unitCounts.values().stream().mapToInt(Integer::intValue).sum();
    }
  }

  private record OrderCostSummary(int foodSpent, int technologySpent, List<String> details) {}

  private record CombatResult(
      boolean attackerWon,
      Map<UnitLevel, Integer> attackerRemaining,
      Map<UnitLevel, Integer> defenderRemaining,
      List<String> details) {}
}

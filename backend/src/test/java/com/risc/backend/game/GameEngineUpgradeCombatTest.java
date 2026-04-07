package com.risc.backend.game;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.risc.backend.game.dto.GameView;
import com.risc.backend.game.dto.PlayerView;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;
import java.util.Random;
import org.junit.jupiter.api.Test;

class GameEngineUpgradeCombatTest {

  @Test
  void techUpgradeCompletesForNextTurnAndSpendsTechnology() {
    GameEngine engine = preparedEngine(technologyMap(), new Random(0));

    engine.resolveCommittedTurn(List.of());
    engine.resolveCommittedTurn(List.of(OrderCommand.upgradeTech(PlayerId.GREEN)));

    GameView view = engine.view(PlayerId.GREEN, "ROOM1", List.of());
    PlayerView green = findPlayer(view, PlayerId.GREEN);

    assertEquals(2, green.maxTechnologyLevel());
    assertEquals(70, green.resources().get(ResourceType.TECHNOLOGY.name()));
    assertTrue(view.lastLog().stream().anyMatch(line -> line.contains("UPGRADE_TECH from 1 to 2 costs 50 TECHNOLOGY")));
    assertTrue(view.lastLog().stream().anyMatch(line -> line.contains("advances from tech level 1 to 2")));
  }

  @Test
  void sameTurnTechUpgradeDoesNotUnlockHigherUnitLevels() {
    GameEngine engine = preparedEngine(technologyMap(), new Random(1));

    engine.resolveCommittedTurn(List.of());

    IllegalArgumentException error = assertThrows(
        IllegalArgumentException.class,
        () -> engine.validateOrders(PlayerId.GREEN, List.of(
            OrderCommand.upgradeTech(PlayerId.GREEN),
            OrderCommand.upgradeUnit("G1", 1, PlayerId.GREEN, UnitLevel.BASIC, UnitLevel.LEVEL_2))));

    assertTrue(error.getMessage().contains("Cannot upgrade to LEVEL_2"));
  }

  @Test
  void unitUpgradeChargesCrossLevelDifference() {
    GameEngine engine = preparedEngine(richTechnologyMap(), new Random(2));

    engine.resolveCommittedTurn(List.of());
    engine.resolveCommittedTurn(List.of(OrderCommand.upgradeTech(PlayerId.GREEN)));
    engine.resolveCommittedTurn(List.of(OrderCommand.upgradeUnit("G1", 1, PlayerId.GREEN, UnitLevel.BASIC, UnitLevel.LEVEL_2)));

    GameView view = engine.view(PlayerId.GREEN, "ROOM1", List.of());
    PlayerView green = findPlayer(view, PlayerId.GREEN);
    Map<String, Integer> unitCounts = view.territories().stream()
        .filter(territory -> territory.name().equals("G1"))
        .findFirst()
        .orElseThrow()
        .unitCounts();

    assertEquals(2, green.maxTechnologyLevel());
    assertEquals(539, green.resources().get(ResourceType.TECHNOLOGY.name()));
    assertEquals(1, unitCounts.get(UnitLevel.LEVEL_2.name()));
    assertTrue(view.lastLog().stream().anyMatch(line -> line.contains("costs 11 TECHNOLOGY")));
  }

  @Test
  void cannotQueueMoreThanOneTechUpgradePerTurn() {
    GameEngine engine = preparedEngine(richTechnologyMap(), new Random(3));

    engine.resolveCommittedTurn(List.of());

    IllegalArgumentException error = assertThrows(
        IllegalArgumentException.class,
        () -> engine.validateOrders(PlayerId.GREEN, List.of(
            OrderCommand.upgradeTech(PlayerId.GREEN),
            OrderCommand.upgradeTech(PlayerId.GREEN))));

    assertTrue(error.getMessage().contains("Only one tech upgrade"));
  }

  @Test
  void combatAlternatesHighestAndLowestUnitsWithBonuses() {
    GameEngine engine = preparedEngine(combatMap(), new FixedRandom(19, 1, 1, 1, 1, 1));

    engine.resolveCommittedTurn(List.of());
    engine.resolveCommittedTurn(List.of(
        OrderCommand.upgradeUnit("G1", 1, PlayerId.GREEN, UnitLevel.BASIC, UnitLevel.LEVEL_1),
        OrderCommand.upgradeUnit("B1", 1, PlayerId.BLUE, UnitLevel.BASIC, UnitLevel.LEVEL_1),
        new OrderCommand(OrderType.ATTACK, "G1", "B1", 2, PlayerId.GREEN)));

    GameView view = engine.view(PlayerId.GREEN, "ROOM1", List.of());

    assertTrue(view.lastLog().stream().anyMatch(line -> line.contains("A LEVEL_1 (20+1=21) vs D BASIC (2+0=2)")));
    assertTrue(view.lastLog().stream().anyMatch(line -> line.contains("A BASIC (2+0=2) vs D LEVEL_1 (2+1=3)")));
  }

  private GameEngine preparedEngine(List<TerritoryDefinition> map, Random random) {
    GameEngine engine = new GameEngine(List.of(PlayerId.GREEN, PlayerId.BLUE), map, random);
    engine.commitPlacement(PlayerId.GREEN, Map.of("G1", 9), List.of());
    engine.commitPlacement(PlayerId.BLUE, Map.of("B1", 9), List.of());
    engine.startOrdersPhase(List.of("Orders phase"));
    return engine;
  }

  private PlayerView findPlayer(GameView view, PlayerId playerId) {
    return view.players().stream().filter(player -> player.id().equals(playerId.name())).findFirst().orElseThrow();
  }

  private List<TerritoryDefinition> technologyMap() {
    return List.of(
        territory("G1", PlayerId.GREEN, 1, 5, 60, List.of("B1")),
        territory("B1", PlayerId.BLUE, 1, 5, 60, List.of("G1")));
  }

  private List<TerritoryDefinition> richTechnologyMap() {
    return List.of(
        territory("G1", PlayerId.GREEN, 1, 5, 200, List.of("B1")),
        territory("B1", PlayerId.BLUE, 1, 5, 200, List.of("G1")));
  }

  private List<TerritoryDefinition> combatMap() {
    return List.of(
        territory("G1", PlayerId.GREEN, 1, 10, 10, List.of("B1")),
        territory("B1", PlayerId.BLUE, 1, 10, 10, List.of("G1")));
  }

  private TerritoryDefinition territory(
      String name,
      PlayerId owner,
      int size,
      int food,
      int technology,
      List<String> neighbors) {
    EnumMap<ResourceType, Integer> production = new EnumMap<>(ResourceType.class);
    production.put(ResourceType.FOOD, food);
    production.put(ResourceType.TECHNOLOGY, technology);
    return new TerritoryDefinition(name, 0, 0, owner, size, Map.copyOf(production), neighbors, List.of());
  }

  private static final class FixedRandom extends Random {
    private final int[] values;
    private int index;

    private FixedRandom(int... values) {
      this.values = values;
    }

    @Override
    public int nextInt(int bound) {
      if (index >= values.length) {
        return 0;
      }
      int value = values[index++];
      return Math.floorMod(value, bound);
    }
  }
}

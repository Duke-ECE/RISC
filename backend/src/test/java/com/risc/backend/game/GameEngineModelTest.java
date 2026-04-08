package com.risc.backend.game;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.risc.backend.game.dto.GameView;
import com.risc.backend.game.dto.PlayerView;
import com.risc.backend.game.dto.TerritoryView;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;
import java.util.Random;
import java.util.stream.Collectors;
import org.junit.jupiter.api.Test;

class GameEngineModelTest {

  @Test
  void initialViewExposesPj2TerritoryFields() {
    GameEngine engine = new GameEngine(List.of(PlayerId.GREEN, PlayerId.BLUE), new Random(1));

    GameView view = engine.view(PlayerId.GREEN, "ROOM1", List.of());
    TerritoryView territory = view.territories().getFirst();

    assertTrue(territory.size() > 0);
    assertEquals(SetOfResources.EXPECTED_KEYS, territory.resourceProduction().keySet());
    assertEquals(SetOfUnits.EXPECTED_KEYS, territory.unitCounts().keySet());
    assertEquals(territory.units(), territory.unitCounts().get(UnitLevel.BASIC.name()));
  }

  @Test
  void playersStartAtTechLevelOneWithZeroResources() {
    GameEngine engine = new GameEngine(List.of(PlayerId.GREEN, PlayerId.BLUE), new Random(2));

    GameView view = engine.view(PlayerId.GREEN, "ROOM1", List.of());

    for (PlayerView player : view.players()) {
      assertEquals(1, player.maxTechnologyLevel());
      assertEquals(0, player.resources().get(ResourceType.FOOD.name()));
      assertEquals(0, player.resources().get(ResourceType.TECHNOLOGY.name()));
    }
  }

  @Test
  void generatedStartingGroupsStayBalancedForSizeAndResources() {
    List<TerritoryDefinition> map = MapGenerator.generate(List.of(PlayerId.GREEN, PlayerId.BLUE, PlayerId.RED), 920, 620, new Random(3));

    Map<PlayerId, Integer> sizeTotals = map.stream().collect(Collectors.groupingBy(
        TerritoryDefinition::initialOwner,
        Collectors.summingInt(TerritoryDefinition::size)));
    Map<PlayerId, Integer> foodTotals = map.stream().collect(Collectors.groupingBy(
        TerritoryDefinition::initialOwner,
        Collectors.summingInt(definition -> definition.resourceProduction().getOrDefault(ResourceType.FOOD, 0))));
    Map<PlayerId, Integer> techTotals = map.stream().collect(Collectors.groupingBy(
        TerritoryDefinition::initialOwner,
        Collectors.summingInt(definition -> definition.resourceProduction().getOrDefault(ResourceType.TECHNOLOGY, 0))));

    assertEquals(1, sizeTotals.values().stream().distinct().count());
    assertEquals(1, foodTotals.values().stream().distinct().count());
    assertEquals(1, techTotals.values().stream().distinct().count());
  }

  @Test
  void endOfTurnAddsResourceIncomeFromOwnedTerritories() {
    GameEngine engine = new GameEngine(List.of(PlayerId.GREEN, PlayerId.BLUE), smallMap(), new Random(0));
    engine.startOrdersPhase(List.of("Orders phase"));

    engine.resolveCommittedTurn(List.of());

    GameView view = engine.view(PlayerId.GREEN, "ROOM1", List.of());
    PlayerView green = findPlayer(view, PlayerId.GREEN);
    PlayerView blue = findPlayer(view, PlayerId.BLUE);

    assertEquals(5, green.resources().get(ResourceType.FOOD.name()));
    assertEquals(1, green.resources().get(ResourceType.TECHNOLOGY.name()));
    assertEquals(1, blue.resources().get(ResourceType.FOOD.name()));
    assertEquals(3, blue.resources().get(ResourceType.TECHNOLOGY.name()));
  }

  @Test
  void newlyGainedTerritoryCountsTowardSameTurnResourceIncome() {
    GameEngine engine = new GameEngine(List.of(PlayerId.GREEN, PlayerId.BLUE), newlyGainedMap(), new Random(1));
    engine.startOrdersPhase(List.of("Orders phase"));
    engine.resolveCommittedTurn(List.of());

    engine.resolveCommittedTurn(List.of(new OrderCommand(OrderType.MOVE, "G1", "U1", 1, PlayerId.GREEN)));

    GameView view = engine.view(PlayerId.GREEN, "ROOM1", List.of());
    PlayerView green = findPlayer(view, PlayerId.GREEN);
    TerritoryView gained = view.territories().stream().filter(t -> t.name().equals("U1")).findFirst().orElseThrow();

    assertEquals(PlayerId.GREEN.name(), gained.owner());
    assertEquals(10, green.resources().get(ResourceType.FOOD.name()));
    assertEquals(1, green.resources().get(ResourceType.TECHNOLOGY.name()));
  }

  private PlayerView findPlayer(GameView view, PlayerId playerId) {
    return view.players().stream().filter(player -> player.id().equals(playerId.name())).findFirst().orElseThrow();
  }

  private List<TerritoryDefinition> smallMap() {
    return List.of(
        territory("G1", PlayerId.GREEN, 1, 3, 0, List.of("G2")),
        territory("G2", PlayerId.GREEN, 2, 2, 1, List.of("G1", "B1")),
        territory("B1", PlayerId.BLUE, 3, 1, 2, List.of("G2", "B2")),
        territory("B2", PlayerId.BLUE, 1, 0, 1, List.of("B1")));
  }

  private List<TerritoryDefinition> newlyGainedMap() {
    return List.of(
        territory("G1", PlayerId.GREEN, 1, 4, 0, List.of("U1")),
        territory("G2", PlayerId.GREEN, 2, 1, 0, List.of()),
        territory("U1", null, 2, 2, 1, List.of("G1")),
        territory("B1", PlayerId.BLUE, 1, 0, 0, List.of("B2")),
        territory("B2", PlayerId.BLUE, 1, 0, 2, List.of("B1")));
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

  private static final class SetOfResources {
    private static final java.util.Set<String> EXPECTED_KEYS = java.util.Set.of(
        ResourceType.FOOD.name(),
        ResourceType.TECHNOLOGY.name());
  }

  private static final class SetOfUnits {
    private static final java.util.Set<String> EXPECTED_KEYS = java.util.Arrays.stream(UnitLevel.values())
        .map(UnitLevel::name)
        .collect(Collectors.toUnmodifiableSet());
  }
}

package com.risc.backend.game;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.risc.backend.game.dto.GameView;
import com.risc.backend.game.dto.PlayerView;
import com.risc.backend.game.dto.TerritoryView;
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

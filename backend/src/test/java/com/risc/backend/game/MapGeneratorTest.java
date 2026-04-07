package com.risc.backend.game;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.List;
import java.util.Map;
import java.util.Random;
import org.junit.jupiter.api.Test;

class MapGeneratorTest {
  @Test
  void generatedTerritoriesIncludeBalancedSizeAndResourceProduction() {
    List<PlayerId> players = List.of(PlayerId.GREEN, PlayerId.RED, PlayerId.BLUE);

    List<TerritoryDefinition> map = MapGenerator.generate(players, 920, 620, new Random(7));

    assertEquals(9, map.size());
    for (TerritoryDefinition territory : map) {
      assertTrue(territory.size() > 0);
      assertFalse(territory.resourceProduction().isEmpty());
      assertTrue(territory.resourceProduction().containsKey("food"));
      assertTrue(territory.resourceProduction().containsKey("technology"));
    }

    int expectedSize = -1;
    Map<String, Integer> expectedResources = null;
    for (PlayerId playerId : players) {
      List<TerritoryDefinition> owned = map.stream()
          .filter(territory -> territory.initialOwner() == playerId)
          .toList();
      int totalSize = owned.stream().mapToInt(TerritoryDefinition::size).sum();
      Map<String, Integer> totalResources = Map.of(
          "food", owned.stream().mapToInt(territory -> territory.resourceProduction().getOrDefault("food", 0)).sum(),
          "technology", owned.stream().mapToInt(territory -> territory.resourceProduction().getOrDefault("technology", 0)).sum());

      if (expectedSize < 0) {
        expectedSize = totalSize;
        expectedResources = totalResources;
      }
      assertEquals(expectedSize, totalSize);
      assertEquals(expectedResources, totalResources);
    }
  }
}

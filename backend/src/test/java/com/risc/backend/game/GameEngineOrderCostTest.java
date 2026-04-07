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

class GameEngineOrderCostTest {

  @Test
  void moveUsesMinimumFriendlyPathCost() {
    GameEngine engine = new GameEngine(List.of(PlayerId.GREEN, PlayerId.BLUE), pathCostMap(), new Random(0));
    engine.startOrdersPhase(List.of("Orders phase"));
    engine.resolveCommittedTurn(List.of());

    engine.validateOrders(PlayerId.GREEN, List.of(new OrderCommand(OrderType.MOVE, "G1", "G4", 1, PlayerId.GREEN)));
    engine.resolveCommittedTurn(List.of(new OrderCommand(OrderType.MOVE, "G1", "G4", 1, PlayerId.GREEN)));

    GameView view = engine.view(PlayerId.GREEN, "ROOM1", List.of());
    PlayerView green = player(view, PlayerId.GREEN);

    assertEquals(18, green.resources().get(ResourceType.FOOD.name()));
    assertTrue(view.lastLog().stream().anyMatch(line -> line.contains("MOVE 1 from G1 to G4 costs 2 FOOD")));
  }

  @Test
  void moveIsRejectedWhenFoodIsInsufficient() {
    GameEngine engine = new GameEngine(List.of(PlayerId.GREEN, PlayerId.BLUE), lowFoodMoveMap(), new Random(0));
    engine.startOrdersPhase(List.of("Orders phase"));
    engine.resolveCommittedTurn(List.of());

    IllegalArgumentException error = assertThrows(
        IllegalArgumentException.class,
        () -> engine.validateOrders(PlayerId.GREEN, List.of(new OrderCommand(OrderType.MOVE, "G1", "G2", 1, PlayerId.GREEN))));

    assertTrue(error.getMessage().contains("Not enough FOOD"));
  }

  @Test
  void attackIsRejectedWhenFoodIsInsufficient() {
    GameEngine engine = new GameEngine(List.of(PlayerId.GREEN, PlayerId.BLUE), lowFoodAttackMap(), new Random(0));
    engine.startOrdersPhase(List.of("Orders phase"));
    engine.resolveCommittedTurn(List.of());

    IllegalArgumentException error = assertThrows(
        IllegalArgumentException.class,
        () -> engine.validateOrders(PlayerId.GREEN, List.of(new OrderCommand(OrderType.ATTACK, "G1", "B1", 2, PlayerId.GREEN))));

    assertTrue(error.getMessage().contains("Not enough FOOD"));
  }

  @Test
  void cumulativeMoveAndAttackCostsCannotOverspendFood() {
    GameEngine engine = new GameEngine(List.of(PlayerId.GREEN, PlayerId.BLUE), combinedCostMap(), new Random(0));
    engine.startOrdersPhase(List.of("Orders phase"));
    engine.resolveCommittedTurn(List.of());

    IllegalArgumentException error = assertThrows(
        IllegalArgumentException.class,
        () -> engine.validateOrders(PlayerId.GREEN, List.of(
            new OrderCommand(OrderType.MOVE, "G1", "G2", 1, PlayerId.GREEN),
            new OrderCommand(OrderType.ATTACK, "G2", "B1", 1, PlayerId.GREEN))));

    assertTrue(error.getMessage().contains("Not enough FOOD"));
  }

  private PlayerView player(GameView view, PlayerId playerId) {
    return view.players().stream().filter(player -> player.id().equals(playerId.name())).findFirst().orElseThrow();
  }

  private List<TerritoryDefinition> pathCostMap() {
    return List.of(
        territory("G1", PlayerId.GREEN, 1, 5, 0, List.of("G2", "G3")),
        territory("G2", PlayerId.GREEN, 1, 4, 0, List.of("G1", "G4")),
        territory("G3", PlayerId.GREEN, 4, 0, 0, List.of("G1", "G4")),
        territory("G4", PlayerId.GREEN, 1, 1, 0, List.of("G2", "G3", "B1")),
        territory("B1", PlayerId.BLUE, 1, 0, 0, List.of("G4")),
        territory("B2", PlayerId.BLUE, 1, 0, 0, List.of()));
  }

  private List<TerritoryDefinition> lowFoodMoveMap() {
    return List.of(
        territory("G1", PlayerId.GREEN, 3, 1, 0, List.of("G2")),
        territory("G2", PlayerId.GREEN, 3, 0, 0, List.of("G1")),
        territory("B1", PlayerId.BLUE, 1, 0, 0, List.of("B2")),
        territory("B2", PlayerId.BLUE, 1, 0, 0, List.of("B1")));
  }

  private List<TerritoryDefinition> lowFoodAttackMap() {
    return List.of(
        territory("G1", PlayerId.GREEN, 1, 1, 0, List.of("B1")),
        territory("G2", PlayerId.GREEN, 1, 0, 0, List.of()),
        territory("B1", PlayerId.BLUE, 1, 0, 0, List.of("G1")),
        territory("B2", PlayerId.BLUE, 1, 0, 0, List.of()));
  }

  private List<TerritoryDefinition> combinedCostMap() {
    return List.of(
        territory("G1", PlayerId.GREEN, 1, 2, 0, List.of("G2")),
        territory("G2", PlayerId.GREEN, 2, 0, 0, List.of("G1", "B1")),
        territory("B1", PlayerId.BLUE, 1, 0, 0, List.of("G2")),
        territory("B2", PlayerId.BLUE, 1, 0, 0, List.of()));
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
}

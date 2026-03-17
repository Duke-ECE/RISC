package com.risc.backend.game;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.risc.backend.game.dto.GameView;
import com.risc.backend.game.dto.OrderRequest;
import com.risc.backend.game.dto.PlacementRequest;
import com.risc.backend.game.dto.TurnRequest;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;

class GameServiceTest {

  @Test
  void moveTurnProducesDetailedRoundLog() {
    GameService service = new GameService();

    service.applyPlacement(new PlacementRequest(Map.of(
        "Narnia", 3,
        "Midkemia", 3,
        "Oz", 3)));

    GameView view = service.playTurn(new TurnRequest(List.of(
        new OrderRequest("MOVE", "Narnia", "Oz", 1))));

    List<String> log = view.lastLog();
    assertTrue(log.stream().anyMatch(line -> line.startsWith("Turn 1 begins.")));
    assertTrue(log.stream().anyMatch(line -> line.startsWith("Committed move orders:")));
    assertTrue(log.stream().anyMatch(line -> line.startsWith("Committed attack orders:")));
    assertTrue(log.stream().anyMatch(line -> line.contains("MOVE 1 from Narnia to Oz")));
    assertTrue(log.stream().anyMatch(line -> line.startsWith("Reinforcement: ")));
    assertTrue(log.stream().anyMatch(line -> line.startsWith("Turn 1 final map state:")));
  }

  @Test
  void movingOneUnitCanLookUnchangedAfterReinforcement() {
    GameService service = new GameService();

    service.applyPlacement(new PlacementRequest(Map.of(
        "Narnia", 3,
        "Midkemia", 3,
        "Oz", 3)));

    GameView before = service.currentView();
    int narniaBefore = unitsFor(before, "Narnia");
    int ozBefore = unitsFor(before, "Oz");

    GameView after = service.playTurn(new TurnRequest(List.of(
        new OrderRequest("MOVE", "Narnia", "Oz", 1))));

    assertEquals(narniaBefore, unitsFor(after, "Narnia"));
    assertEquals(ozBefore + 2, unitsFor(after, "Oz"));
    assertTrue(after.lastLog().stream().anyMatch(line -> line.contains("Narnia: 4 -> 3")));
    assertTrue(after.lastLog().stream().anyMatch(line -> line.contains("Reinforcement: Narnia owned by Green gains 1 unit (3 -> 4).")));
  }

  @Test
  void attackTurnProducesCombatDetails() {
    GameService service = new GameService();

    service.applyPlacement(new PlacementRequest(Map.of(
        "Narnia", 0,
        "Midkemia", 0,
        "Oz", 9)));

    GameView view = service.playTurn(new TurnRequest(List.of(
        new OrderRequest("ATTACK", "Oz", "Gondor", 3))));

    List<String> log = view.lastLog();
    assertTrue(log.stream().anyMatch(line -> line.startsWith("Battle queue at ")));
    assertTrue(log.stream().anyMatch(line -> line.startsWith("Combat starts at ")));
    assertTrue(log.stream().anyMatch(line -> line.trim().startsWith("Round ")));
    assertTrue(log.stream().anyMatch(line -> line.startsWith("Combat result: ")));
    assertFalse(log.isEmpty());
  }

  private int unitsFor(GameView view, String territoryName) {
    return view.territories().stream()
        .filter(territory -> territory.name().equals(territoryName))
        .findFirst()
        .orElseThrow()
        .units();
  }
}

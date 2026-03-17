package com.risc.backend.game;

import com.risc.backend.game.dto.GameView;
import com.risc.backend.game.dto.OrderRequest;
import com.risc.backend.game.dto.PlacementRequest;
import com.risc.backend.game.dto.TurnRequest;
import java.util.ArrayList;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class GameService {
  private final GameEngine engine = new GameEngine();

  public GameService() {
    resetGame();
  }

  public synchronized GameView currentView() {
    return engine.view(PlayerId.GREEN, null, List.of());
  }

  public synchronized GameView resetGame() {
    engine.reset();
    return engine.view(PlayerId.GREEN, null, List.of());
  }

  public synchronized GameView applyPlacement(PlacementRequest request) {
    engine.commitPlacement(PlayerId.GREEN, request.allocations());
    engine.commitPlacement(PlayerId.BLUE, engine.buildAiPlacement(PlayerId.BLUE));
    engine.commitPlacement(PlayerId.RED, engine.buildAiPlacement(PlayerId.RED));
    engine.startOrdersPhase(List.of(
        "Initial placement complete.",
        "All players revealed their armies.",
        "Issue move and attack orders, then commit the turn."));
    return engine.view(PlayerId.GREEN, null, List.of());
  }

  public synchronized GameView playTurn(TurnRequest request) {
    if (engine.phase() != GamePhase.ORDERS) {
      throw new IllegalArgumentException("Game is not accepting turn orders right now.");
    }
    if (engine.winner() != null) {
      throw new IllegalArgumentException("The game is already over.");
    }

    List<OrderCommand> playerOrders = toPlayerOrders(PlayerId.GREEN, request.orders());
    engine.validateOrders(PlayerId.GREEN, playerOrders);

    List<OrderCommand> aiOrders = new ArrayList<>();
    for (PlayerId ai : List.of(PlayerId.BLUE, PlayerId.RED)) {
      aiOrders.addAll(engine.buildAiOrders(ai));
    }

    List<OrderCommand> allOrders = new ArrayList<>();
    allOrders.addAll(playerOrders);
    allOrders.addAll(aiOrders);
    engine.resolveCommittedTurn(allOrders);
    return engine.view(PlayerId.GREEN, null, List.of());
  }

  private List<OrderCommand> toPlayerOrders(PlayerId playerId, List<OrderRequest> orders) {
    return orders.stream()
        .map(order -> new OrderCommand(
            OrderType.valueOf(order.type().trim().toUpperCase()),
            order.source(),
            order.target(),
            order.units(),
            playerId))
        .toList();
  }
}


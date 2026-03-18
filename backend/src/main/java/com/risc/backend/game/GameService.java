package com.risc.backend.game;

import com.risc.backend.game.dto.GameView;
import com.risc.backend.game.dto.PlacementRequest;
import com.risc.backend.game.dto.TurnRequest;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class GameService {
  public GameView currentView() {
    return lobbyView();
  }

  public GameView resetGame() {
    throw new IllegalArgumentException("Single-player endpoint is disabled. Use /api/rooms for 2-5 player games.");
  }

  public GameView applyPlacement(PlacementRequest request) {
    throw new IllegalArgumentException("Single-player endpoint is disabled. Use /api/rooms for 2-5 player games.");
  }

  public GameView playTurn(TurnRequest request) {
    throw new IllegalArgumentException("Single-player endpoint is disabled. Use /api/rooms for 2-5 player games.");
  }

  private GameView lobbyView() {
    return new GameView(
        GamePhase.LOBBY.name(),
        PlayerId.GREEN.name(),
        null,
        "Use /api/rooms to create or join a 2-5 player match.",
        List.of(),
        List.of(),
        List.of("Single-player mode is disabled. Create a room to play multiplayer."),
        0,
        false,
        0,
        null,
        List.of());
  }
}

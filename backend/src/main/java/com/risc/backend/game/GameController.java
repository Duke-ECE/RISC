package com.risc.backend.game;

import com.risc.backend.game.dto.GameView;
import com.risc.backend.game.dto.PlacementRequest;
import com.risc.backend.game.dto.TurnRequest;
import jakarta.validation.Valid;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.ResponseStatus;

@RestController
@RequestMapping("/api/game")
public class GameController {
  private final GameService gameService;

  public GameController(GameService gameService) {
    this.gameService = gameService;
  }

  @GetMapping
  public GameView view() {
    return gameService.currentView();
  }

  @PostMapping("/reset")
  public GameView reset() {
    return gameService.resetGame();
  }

  @PostMapping("/setup")
  public GameView setup(@Valid @RequestBody PlacementRequest request) {
    return gameService.applyPlacement(request);
  }

  @PostMapping("/turn")
  public GameView turn(@Valid @RequestBody TurnRequest request) {
    return gameService.playTurn(request);
  }

  @ExceptionHandler(IllegalArgumentException.class)
  @ResponseStatus(HttpStatus.BAD_REQUEST)
  public Map<String, String> handleIllegalArgument(IllegalArgumentException ex) {
    return Map.of("error", ex.getMessage());
  }
}

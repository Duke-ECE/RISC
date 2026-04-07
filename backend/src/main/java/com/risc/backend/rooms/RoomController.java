package com.risc.backend.rooms;

import com.risc.backend.auth.AuthService;
import com.risc.backend.auth.ActiveGameView;
import com.risc.backend.game.dto.GameView;
import com.risc.backend.game.dto.PlacementRequest;
import com.risc.backend.game.dto.TurnRequest;
import jakarta.validation.Valid;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/rooms")
public class RoomController {
  private static final String TOKEN_HEADER = "X-Auth-Token";

  private final RoomService roomService;
  private final AuthService authService;

  public RoomController(RoomService roomService, AuthService authService) {
    this.roomService = roomService;
    this.authService = authService;
  }

  @PostMapping
  public RoomJoinResponse createRoom(
      @RequestHeader(value = TOKEN_HEADER, required = false) String tokenHeader,
      @RequestParam(value = "token", required = false) String tokenQuery) {
    return roomService.createRoom(resolveAccount(tokenHeader, tokenQuery));
  }

  @PostMapping("/{roomId}/join")
  public RoomJoinResponse joinRoom(
      @PathVariable String roomId,
      @RequestHeader(value = TOKEN_HEADER, required = false) String tokenHeader,
      @RequestParam(value = "token", required = false) String tokenQuery) {
    return roomService.joinRoom(roomId, resolveAccount(tokenHeader, tokenQuery));
  }

  @GetMapping
  public List<ActiveGameView> listGames(
      @RequestHeader(value = TOKEN_HEADER, required = false) String tokenHeader,
      @RequestParam(value = "token", required = false) String tokenQuery) {
    return roomService.listGamesFor(resolveAccount(tokenHeader, tokenQuery));
  }

  @GetMapping("/{roomId}")
  public GameView viewRoom(
      @PathVariable String roomId,
      @RequestHeader(value = TOKEN_HEADER, required = false) String tokenHeader,
      @RequestParam(value = "token", required = false) String tokenQuery) {
    return roomService.viewRoom(roomId, resolveToken(tokenHeader, tokenQuery));
  }

  @PostMapping("/{roomId}/reset")
  public GameView resetRoom(
      @PathVariable String roomId,
      @RequestHeader(value = TOKEN_HEADER, required = false) String tokenHeader,
      @RequestParam(value = "token", required = false) String tokenQuery) {
    return roomService.resetRoom(roomId, resolveToken(tokenHeader, tokenQuery));
  }

  @PostMapping("/{roomId}/start")
  public GameView startRoom(
      @PathVariable String roomId,
      @RequestHeader(value = TOKEN_HEADER, required = false) String tokenHeader,
      @RequestParam(value = "token", required = false) String tokenQuery) {
    return roomService.startRoom(roomId, resolveToken(tokenHeader, tokenQuery));
  }

  @PostMapping("/{roomId}/seats/add")
  public GameView addSeat(
      @PathVariable String roomId,
      @RequestHeader(value = TOKEN_HEADER, required = false) String tokenHeader,
      @RequestParam(value = "token", required = false) String tokenQuery) {
    return roomService.addSeat(roomId, resolveToken(tokenHeader, tokenQuery));
  }

  @PostMapping("/{roomId}/seats/remove")
  public GameView removeSeat(
      @PathVariable String roomId,
      @RequestHeader(value = TOKEN_HEADER, required = false) String tokenHeader,
      @RequestParam(value = "token", required = false) String tokenQuery) {
    return roomService.removeSeat(roomId, resolveToken(tokenHeader, tokenQuery));
  }

  @PostMapping("/{roomId}/setup")
  public GameView setup(
      @PathVariable String roomId,
      @RequestHeader(value = TOKEN_HEADER, required = false) String tokenHeader,
      @RequestParam(value = "token", required = false) String tokenQuery,
      @Valid @RequestBody PlacementRequest request) {
    return roomService.commitSetup(roomId, resolveToken(tokenHeader, tokenQuery), request);
  }

  @PostMapping("/{roomId}/turn")
  public GameView turn(
      @PathVariable String roomId,
      @RequestHeader(value = TOKEN_HEADER, required = false) String tokenHeader,
      @RequestParam(value = "token", required = false) String tokenQuery,
      @Valid @RequestBody TurnRequest request) {
    return roomService.commitTurn(roomId, resolveToken(tokenHeader, tokenQuery), request);
  }

  @ExceptionHandler(ResponseStatusException.class)
  public ResponseEntity<Map<String, String>> handleRoomErrors(ResponseStatusException ex) {
    String message = ex.getReason() == null ? "Request failed" : ex.getReason();
    return ResponseEntity.status(ex.getStatusCode()).body(Map.of("error", message));
  }

  @ExceptionHandler(IllegalArgumentException.class)
  public ResponseEntity<Map<String, String>> handleIllegalArgument(IllegalArgumentException ex) {
    return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", ex.getMessage()));
  }

  private String resolveToken(String tokenHeader, String tokenQuery) {
    return resolveAccount(tokenHeader, tokenQuery);
  }

  private String resolveAccount(String tokenHeader, String tokenQuery) {
    if (tokenHeader != null && !tokenHeader.isBlank()) {
      return authService.requireUsername(tokenHeader);
    }
    if (tokenQuery != null && !tokenQuery.isBlank()) {
      return authService.requireUsername(tokenQuery);
    }
    throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Missing auth token.");
  }
}

package com.risc.backend.auth;

import com.risc.backend.rooms.RoomService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
  private static final String TOKEN_HEADER = "X-Auth-Token";

  private final AuthService authService;
  private final RoomService roomService;

  public AuthController(AuthService authService, RoomService roomService) {
    this.authService = authService;
    this.roomService = roomService;
  }

  @PostMapping("/register")
  public AuthResponse register(@Valid @RequestBody AuthRequest request) {
    String token = authService.register(request.username(), request.password());
    return new AuthResponse(request.username().trim(), token, List.of());
  }

  @PostMapping("/login")
  public AuthResponse login(@Valid @RequestBody AuthRequest request) {
    String username = request.username().trim();
    String token = authService.login(username, request.password());
    return new AuthResponse(username, token, roomService.listGamesFor(username));
  }

  @GetMapping("/me")
  public AuthResponse me(@RequestHeader(value = TOKEN_HEADER, required = false) String token) {
    String username = authService.requireUsername(token);
    return new AuthResponse(username, token, roomService.listGamesFor(username));
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
}

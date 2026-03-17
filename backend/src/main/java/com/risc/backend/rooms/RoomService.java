package com.risc.backend.rooms;

import com.risc.backend.game.GameEngine;
import com.risc.backend.game.GamePhase;
import com.risc.backend.game.OrderCommand;
import com.risc.backend.game.OrderType;
import com.risc.backend.game.PlayerId;
import com.risc.backend.game.dto.GameView;
import com.risc.backend.game.dto.OrderRequest;
import com.risc.backend.game.dto.PlacementRequest;
import com.risc.backend.game.dto.TurnRequest;
import java.security.SecureRandom;
import java.util.ArrayList;
import java.util.EnumMap;
import java.util.EnumSet;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class RoomService {
  private static final List<PlayerId> JOIN_ORDER = List.of(PlayerId.BLUE, PlayerId.RED);

  private final SecureRandom random = new SecureRandom();
  private final Map<String, GameRoom> rooms = new HashMap<>();

  public synchronized RoomJoinResponse createRoom() {
    String roomId = generateRoomId();
    while (rooms.containsKey(roomId)) {
      roomId = generateRoomId();
    }

    GameRoom room = new GameRoom(roomId);
    rooms.put(roomId, room);

    String token = room.joinAs(PlayerId.GREEN);
    GameView view = room.view(PlayerId.GREEN, token);
    return new RoomJoinResponse(roomId, PlayerId.GREEN.name(), token, view);
  }

  public synchronized RoomJoinResponse joinRoom(String roomId) {
    GameRoom room = requireRoom(roomId);
    for (PlayerId candidate : JOIN_ORDER) {
      if (!room.humanPlayers.contains(candidate)) {
        String token = room.joinAs(candidate);
        GameView view = room.view(candidate, token);
        return new RoomJoinResponse(roomId, candidate.name(), token, view);
      }
    }
    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Room is full (already has 3 human players).");
  }

  public synchronized GameView viewRoom(String roomId, String token) {
    GameRoom room = requireRoom(roomId);
    PlayerId playerId = room.playerForToken(token);
    return room.view(playerId, token);
  }

  public synchronized GameView resetRoom(String roomId, String token) {
    GameRoom room = requireRoom(roomId);
    PlayerId playerId = room.playerForToken(token);
    room.reset();
    return room.view(playerId, token);
  }

  public synchronized GameView commitSetup(String roomId, String token, PlacementRequest request) {
    GameRoom room = requireRoom(roomId);
    PlayerId playerId = room.playerForToken(token);
    room.commitSetup(playerId, request);
    return room.view(playerId, token);
  }

  public synchronized GameView commitTurn(String roomId, String token, TurnRequest request) {
    GameRoom room = requireRoom(roomId);
    PlayerId playerId = room.playerForToken(token);
    room.commitTurn(playerId, request);
    return room.view(playerId, token);
  }

  private GameRoom requireRoom(String roomId) {
    GameRoom room = rooms.get(roomId);
    if (room == null) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Unknown room: " + roomId);
    }
    return room;
  }

  private String generateRoomId() {
    // Human-friendly: 6 chars base32-ish, uppercase.
    final String alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    StringBuilder builder = new StringBuilder(6);
    for (int i = 0; i < 6; i++) {
      builder.append(alphabet.charAt(random.nextInt(alphabet.length())));
    }
    return builder.toString().toUpperCase(Locale.ROOT);
  }

  private static final class GameRoom {
    private final String roomId;
    private final GameEngine engine = new GameEngine();
    private final Map<String, PlayerId> tokenToPlayer = new HashMap<>();
    private final EnumMap<PlayerId, String> playerToToken = new EnumMap<>(PlayerId.class);
    private final Set<PlayerId> humanPlayers = EnumSet.noneOf(PlayerId.class);
    private final Set<PlayerId> setupCommitted = EnumSet.noneOf(PlayerId.class);
    private final EnumMap<PlayerId, List<OrderCommand>> committedOrders = new EnumMap<>(PlayerId.class);
    private int committedOrdersTurnNumber = 1;

    private GameRoom(String roomId) {
      this.roomId = Objects.requireNonNull(roomId, "roomId");
      reset();
    }

    private void reset() {
      engine.reset();
      setupCommitted.clear();
      committedOrders.clear();
      committedOrdersTurnNumber = engine.turnNumber();
    }

    private String joinAs(PlayerId playerId) {
      if (humanPlayers.contains(playerId)) {
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Player already joined: " + playerId.name());
      }
      String token = UUID.randomUUID().toString();
      tokenToPlayer.put(token, playerId);
      playerToToken.put(playerId, token);
      humanPlayers.add(playerId);
      return token;
    }

    private PlayerId playerForToken(String token) {
      if (token == null || token.isBlank()) {
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Missing player token.");
      }
      PlayerId playerId = tokenToPlayer.get(token);
      if (playerId == null) {
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid player token.");
      }
      return playerId;
    }

    private void commitSetup(PlayerId playerId, PlacementRequest request) {
      if (!humanPlayers.contains(playerId)) {
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Player is not a human in this room.");
      }
      if (engine.phase() != GamePhase.SETUP) {
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Setup is already finished.");
      }
      engine.commitPlacement(playerId, request.allocations());
      setupCommitted.add(playerId);

      if (setupCommitted.containsAll(humanPlayers)) {
        // Fill AI placements for any non-human players.
        for (PlayerId candidate : PlayerId.values()) {
          if (humanPlayers.contains(candidate)) {
            continue;
          }
          engine.commitPlacement(candidate, engine.buildAiPlacement(candidate));
        }
        engine.startOrdersPhase(List.of(
            "Initial placement complete.",
            "All players revealed their armies.",
            "Issue move and attack orders, then commit the turn."));
        committedOrders.clear();
        committedOrdersTurnNumber = engine.turnNumber();
      }
    }

    private void commitTurn(PlayerId playerId, TurnRequest request) {
      if (engine.phase() != GamePhase.ORDERS) {
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Game is not accepting turn orders right now.");
      }
      if (engine.winner() != null) {
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "The game is already over.");
      }
      if (!humanPlayers.contains(playerId)) {
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Player is not a human in this room.");
      }
      if (engine.isDefeated(playerId)) {
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Defeated players cannot submit orders.");
      }

      if (committedOrdersTurnNumber != engine.turnNumber()) {
        committedOrders.clear();
        committedOrdersTurnNumber = engine.turnNumber();
      }

      List<OrderCommand> orders = toPlayerOrders(playerId, request.orders());
      engine.validateOrders(playerId, orders);
      committedOrders.put(playerId, orders);

      Set<PlayerId> required = EnumSet.noneOf(PlayerId.class);
      for (PlayerId candidate : humanPlayers) {
        if (!engine.isDefeated(candidate)) {
          required.add(candidate);
        }
      }
      if (committedOrders.keySet().containsAll(required)) {
        List<OrderCommand> allOrders = new ArrayList<>();
        for (List<OrderCommand> human : committedOrders.values()) {
          allOrders.addAll(human);
        }
        for (PlayerId candidate : PlayerId.values()) {
          if (humanPlayers.contains(candidate)) {
            continue;
          }
          allOrders.addAll(engine.buildAiOrders(candidate));
        }
        engine.resolveCommittedTurn(allOrders);
        committedOrders.clear();
        committedOrdersTurnNumber = engine.turnNumber();
      }
    }

    private GameView view(PlayerId viewer, String token) {
      List<PlayerId> waiting = waitingOnPlayers(viewer);
      return engine.view(viewer, roomId, waiting);
    }

    private List<PlayerId> waitingOnPlayers(PlayerId viewer) {
      if (engine.winner() != null) {
        return List.of();
      }
      if (engine.phase() == GamePhase.SETUP) {
        List<PlayerId> waiting = new ArrayList<>();
        for (PlayerId candidate : humanPlayers) {
          if (!setupCommitted.contains(candidate)) {
            waiting.add(candidate);
          }
        }
        return waiting;
      }
      if (engine.phase() == GamePhase.ORDERS) {
        if (committedOrdersTurnNumber != engine.turnNumber()) {
          return List.of();
        }
        List<PlayerId> waiting = new ArrayList<>();
        for (PlayerId candidate : humanPlayers) {
          if (engine.isDefeated(candidate)) {
            continue;
          }
          if (!committedOrders.containsKey(candidate)) {
            waiting.add(candidate);
          }
        }
        return waiting;
      }
      return List.of();
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
}


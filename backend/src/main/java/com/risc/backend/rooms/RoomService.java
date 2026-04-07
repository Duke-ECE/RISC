package com.risc.backend.rooms;

import com.risc.backend.game.GameEngine;
import com.risc.backend.game.GamePhase;
import com.risc.backend.game.OrderCommand;
import com.risc.backend.game.OrderType;
import com.risc.backend.game.PlayerId;
import com.risc.backend.game.ResourceType;
import com.risc.backend.game.UnitLevel;
import com.risc.backend.game.dto.GameView;
import com.risc.backend.game.dto.OrderRequest;
import com.risc.backend.game.dto.PlacementRequest;
import com.risc.backend.game.dto.PlayerView;
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
  private static final List<PlayerId> PLAYER_ORDER = List.of(
      PlayerId.GREEN,
      PlayerId.BLUE,
      PlayerId.RED,
      PlayerId.YELLOW,
      PlayerId.PURPLE);

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
    GameView view = room.view(PlayerId.GREEN);
    return new RoomJoinResponse(roomId, PlayerId.GREEN.name(), token, view);
  }

  public synchronized RoomJoinResponse joinRoom(String roomId) {
    GameRoom room = requireRoom(roomId);
    PlayerId playerId = room.nextJoinSeat();
    String token = room.joinAs(playerId);
    GameView view = room.view(playerId);
    return new RoomJoinResponse(roomId, playerId.name(), token, view);
  }

  public synchronized GameView viewRoom(String roomId, String token) {
    GameRoom room = requireRoom(roomId);
    PlayerId playerId = room.playerForToken(token);
    return room.view(playerId);
  }

  public synchronized GameView resetRoom(String roomId, String token) {
    GameRoom room = requireRoom(roomId);
    PlayerId playerId = room.playerForToken(token);
    room.resetGameToLobby();
    return room.view(playerId);
  }

  public synchronized GameView startRoom(String roomId, String token) {
    GameRoom room = requireRoom(roomId);
    PlayerId playerId = room.playerForToken(token);
    room.start(playerId);
    return room.view(playerId);
  }

  public synchronized GameView addSeat(String roomId, String token) {
    GameRoom room = requireRoom(roomId);
    PlayerId playerId = room.playerForToken(token);
    room.addSeat(playerId);
    return room.view(playerId);
  }

  public synchronized GameView removeSeat(String roomId, String token) {
    GameRoom room = requireRoom(roomId);
    PlayerId playerId = room.playerForToken(token);
    room.removeLastEmptySeat(playerId);
    return room.view(playerId);
  }

  public synchronized GameView commitSetup(String roomId, String token, PlacementRequest request) {
    GameRoom room = requireRoom(roomId);
    PlayerId playerId = room.playerForToken(token);
    room.commitSetup(playerId, request);
    return room.view(playerId);
  }

  public synchronized GameView commitTurn(String roomId, String token, TurnRequest request) {
    GameRoom room = requireRoom(roomId);
    PlayerId playerId = room.playerForToken(token);
    room.commitTurn(playerId, request);
    return room.view(playerId);
  }

  private GameRoom requireRoom(String roomId) {
    GameRoom room = rooms.get(roomId);
    if (room == null) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Unknown room: " + roomId);
    }
    return room;
  }

  private String generateRoomId() {
    final String alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    StringBuilder builder = new StringBuilder(6);
    for (int i = 0; i < 6; i++) {
      builder.append(alphabet.charAt(random.nextInt(alphabet.length())));
    }
    return builder.toString().toUpperCase(Locale.ROOT);
  }

  private static final class GameRoom {
    private final String roomId;
    private final Map<String, PlayerId> tokenToPlayer = new HashMap<>();
    private final EnumMap<PlayerId, String> playerToToken = new EnumMap<>(PlayerId.class);
    private final List<PlayerId> joinedPlayers = new ArrayList<>();
    private int seatCount = 2;

    private GameEngine engine;
    private final Set<PlayerId> setupCommitted = EnumSet.noneOf(PlayerId.class);
    private final EnumMap<PlayerId, List<OrderCommand>> committedOrders = new EnumMap<>(PlayerId.class);
    private int committedOrdersTurnNumber = 1;

    private GameRoom(String roomId) {
      this.roomId = Objects.requireNonNull(roomId, "roomId");
    }

    private GameView view(PlayerId viewer) {
      if (engine == null) {
        return lobbyView(viewer);
      }
      return engine.view(viewer, roomId, waitingOnPlayers(viewer));
    }

    private GameView lobbyView(PlayerId viewer) {
      List<PlayerView> players = joinedPlayers.stream()
          .map(playerId -> new PlayerView(
              playerId.name(),
              playerId.displayName(),
              0,
              0,
              false,
              playerId == viewer,
              0,
              1,
              Map.of(
                  ResourceType.FOOD.name(), 0,
                  ResourceType.TECHNOLOGY.name(), 0)))
          .toList();
      List<String> log = new ArrayList<>();
      log.add("Lobby: room created. Host (Green) starts the game when ready.");
      log.add("Seats: " + seatCount + "/5. Players joined: " + joinedPlayers.size() + ".");
      log.add("Host can start when there are no empty seats (and at least 2 players).");
      return new GameView(
          GamePhase.LOBBY.name(),
          viewer.name(),
          null,
          "Waiting for host to start. Share the room ID with other players.",
          List.of(),
          players,
          log,
          0,
          false,
          seatCount,
          roomId,
          waitingOnPlayers(viewer).stream().map(PlayerId::name).toList());
    }

    private PlayerId nextJoinSeat() {
      if (engine != null) {
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Game already started; no more joins allowed.");
      }
      if (joinedPlayers.size() >= seatCount) {
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No open seats. Ask the host to add a new seat first.");
      }
      for (PlayerId playerId : PLAYER_ORDER.subList(0, seatCount)) {
        if (!joinedPlayers.contains(playerId)) {
          return playerId;
        }
      }
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No open seats.");
    }

    private String joinAs(PlayerId playerId) {
      if (engine != null) {
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Game already started; no more joins allowed.");
      }
      if (joinedPlayers.contains(playerId)) {
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Player already joined: " + playerId.name());
      }
      String token = UUID.randomUUID().toString();
      tokenToPlayer.put(token, playerId);
      playerToToken.put(playerId, token);
      joinedPlayers.add(playerId);
      return token;
    }

    private void addSeat(PlayerId requester) {
      if (engine != null) {
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Game already started; cannot add seats.");
      }
      if (requester != PlayerId.GREEN) {
        throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only the host (Green) can add seats.");
      }
      if (seatCount >= 5) {
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Already at the maximum (5 seats).");
      }
      seatCount += 1;
    }

    private void removeLastEmptySeat(PlayerId requester) {
      if (engine != null) {
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cannot remove seats after game start.");
      }
      if (requester != PlayerId.GREEN) {
        throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only the host (Green) can remove seats.");
      }
      if (seatCount <= 2) {
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cannot have fewer than 2 seats.");
      }
      if (joinedPlayers.size() >= seatCount) {
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No empty seats to remove.");
      }
      seatCount -= 1;
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

    private void start(PlayerId requester) {
      if (engine != null) {
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Game already started.");
      }
      if (requester != PlayerId.GREEN) {
        throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only the host (Green) can start the game.");
      }
      if (joinedPlayers.size() < 2) {
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Need at least 2 players to start.");
      }
      if (joinedPlayers.size() != seatCount) {
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cannot start while there are empty seats. Remove extra seats or wait for players to join.");
      }

      engine = new GameEngine(joinedPlayers);
      setupCommitted.clear();
      committedOrders.clear();
      committedOrdersTurnNumber = engine.turnNumber();
    }

    private void resetGameToLobby() {
      engine = null;
      setupCommitted.clear();
      committedOrders.clear();
      committedOrdersTurnNumber = 1;
    }

    private void commitSetup(PlayerId playerId, PlacementRequest request) {
      if (engine == null) {
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Game has not started yet.");
      }
      if (engine.phase() != GamePhase.SETUP) {
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Setup is already finished.");
      }
      engine.commitPlacement(playerId, request.allocations(), request.abandonSafe());
      setupCommitted.add(playerId);

      if (setupCommitted.containsAll(joinedPlayers)) {
        engine.startOrdersPhase(List.of(
            "Initial placement complete.",
            "All players revealed their armies.",
            "Issue move and attack orders, then commit the turn."));
        committedOrders.clear();
        committedOrdersTurnNumber = engine.turnNumber();
      }
    }

    private void commitTurn(PlayerId playerId, TurnRequest request) {
      if (engine == null) {
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Game has not started yet.");
      }
      if (engine.phase() != GamePhase.ORDERS) {
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Game is not accepting turn orders right now.");
      }
      if (engine.winner() != null) {
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "The game is already over.");
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
      for (PlayerId candidate : joinedPlayers) {
        if (!engine.isDefeated(candidate)) {
          required.add(candidate);
        }
      }
      if (committedOrders.keySet().containsAll(required)) {
        List<OrderCommand> allOrders = new ArrayList<>();
        for (List<OrderCommand> human : committedOrders.values()) {
          allOrders.addAll(human);
        }
        engine.resolveCommittedTurn(allOrders);
        committedOrders.clear();
        committedOrdersTurnNumber = engine.turnNumber();
      }
    }

    private List<PlayerId> waitingOnPlayers(PlayerId viewer) {
      if (engine == null) {
        return List.of();
      }
      if (engine.winner() != null) {
        return List.of();
      }
      if (engine.phase() == GamePhase.SETUP) {
        List<PlayerId> waiting = new ArrayList<>();
        for (PlayerId candidate : joinedPlayers) {
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
        for (PlayerId candidate : joinedPlayers) {
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
          .map(order -> {
            OrderType type = OrderType.valueOf(order.type().trim().toUpperCase(Locale.ROOT));
            UnitLevel fromLevel = parseLevel(order.fromLevel());
            UnitLevel toLevel = parseLevel(order.toLevel());
            if (type == OrderType.UPGRADE_TECH) {
              return OrderCommand.upgradeTech(playerId);
            }
            if (type == OrderType.UPGRADE_UNIT) {
              return OrderCommand.upgradeUnit(order.source(), order.units(), playerId, fromLevel, toLevel);
            }
            return new OrderCommand(type, order.source(), order.target(), order.units(), playerId);
          })
          .toList();
    }

    private UnitLevel parseLevel(String raw) {
      if (raw == null || raw.isBlank()) {
        return null;
      }
      return UnitLevel.valueOf(raw.trim().toUpperCase(Locale.ROOT));
    }
  }
}

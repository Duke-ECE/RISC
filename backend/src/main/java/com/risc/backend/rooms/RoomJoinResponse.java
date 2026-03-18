package com.risc.backend.rooms;

import com.risc.backend.game.dto.GameView;

public record RoomJoinResponse(
    String roomId,
    String playerId,
    String token,
    GameView game) {}


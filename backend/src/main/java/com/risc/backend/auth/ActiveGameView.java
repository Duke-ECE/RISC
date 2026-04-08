package com.risc.backend.auth;

public record ActiveGameView(
    String roomId,
    String playerId,
    String phase,
    int turnNumber,
    int seatCount,
    String winner) {}

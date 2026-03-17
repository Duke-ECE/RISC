package com.risc.backend.game.dto;

import java.util.List;

public record GameView(
    String phase,
    String currentPlayer,
    String winner,
    String mapNote,
    List<TerritoryView> territories,
    List<PlayerView> players,
    List<String> lastLog,
    int turnNumber,
    boolean readyForOrders) {}


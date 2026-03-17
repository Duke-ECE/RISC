package com.risc.backend.game.dto;

public record PlayerView(
    String id,
    String displayName,
    int territories,
    int totalUnits,
    boolean defeated,
    boolean localPlayer,
    int reserveUnits) {}

